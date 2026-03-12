# PostgreSQL + Prisma Integration Guide for NestJS in Docker

## Table of Contents

- [Overview](#overview)
- [Architecture Decisions](#architecture-decisions)
- [Secret Management Strategy](#secret-management-strategy)
- [Infrastructure Setup](#infrastructure-setup)
- [Application Integration](#application-integration)
- [Local Development Setup](#local-development-setup)
- [Deployment Workflows](#deployment-workflows)
- [Troubleshooting](#troubleshooting)
- [Key Lessons Learned](#key-lessons-learned)

## Overview

### Context
This guide documents the integration of PostgreSQL with Prisma ORM in a NestJS application running in Docker containers. The setup supports:

- **Persistent database** that survives application deployments
- **Zero-downtime deployments** for the application layer
- **Encrypted secrets** at rest (no plaintext passwords on disk)
- **Automated backups** to remote storage
- **Consistent local development** environment matching production

### Technology Stack

- **Database**: PostgreSQL 17 with PostGIS, pgcrypto, uuid-ossp extensions
- **ORM**: Prisma (TypeScript-native, excellent migrations)
- **Backend**: NestJS 11+ (Node.js framework)
- **Container Orchestration**: Docker Standalone (not Swarm)
- **Reverse Proxy**: Traefik for routing and SSL termination

## Architecture Decisions

### Why Separate Database and Application Deployments?

**Problem**: Application containers are ephemeral and redeploy frequently. Database needs to be persistent and stable.

**Solution**: Deploy database as a separate Docker Compose stack that:

- Runs independently from application containers
- Uses persistent volumes for data storage
- Only restarts when explicitly needed (updates, maintenance)
- Survives all application deployments

**Benefits**:

- No database downtime during app deployments
- Clear separation of concerns
- Simpler rollback procedures for applications
- Database can be managed independently

### Why Docker Standalone Instead of Swarm?

**Context**: Docker has two modes:

- **Standalone**: Traditional docker-compose, single-node deployments
- **Swarm**: Multi-node orchestration with built-in secrets management

**Decision**: Docker Standalone is sufficient for single-server deployments.

**Implications**:

- No native secrets management (Swarm's built-in feature)
- Must implement custom secret handling (we use GPG encryption)
- Simpler setup, fewer moving parts
- Adequate for small-to-medium deployments

**To Check Your Mode**:

```bash
docker info | grep -i swarm
# Output: "Swarm: inactive" = Standalone
# Output: "Swarm: active" = Swarm mode
```

### Why GPG-Encrypted Secrets?

**Problem**: Docker Standalone doesn't have native secrets management. Need to store database passwords and SSH keys securely.

**Alternatives Considered**:

1. **Environment variables** - Visible in process lists, insecure
2. **Volume-mounted plaintext files** - Better but still plaintext on disk
3. **External secret managers** (Vault, AWS Secrets Manager) - Overkill for single server
4. **GPG encrypted files** - Balanced security and complexity ✅

**Our Approach**:

- Secrets encrypted with GPG and committed to repository
- Master passphrase stored in systemd environment file (permissions: 600)
- Init container decrypts secrets at startup into ephemeral volume
- Secrets never touch disk unencrypted

**Trade-offs**:

- ✅ No plaintext secrets on disk
- ✅ Simple to implement and maintain
- ❌ Manual passphrase management required
- ❌ Not suitable for highly dynamic secret rotation

### Why Prisma Over Other ORMs?

**Comparison**:

- **TypeORM**: Decorator-based, tight NestJS integration, but TypeScript support is secondary
- **Sequelize**: Mature but JavaScript-first, weaker typing
- **Raw pg driver**: Maximum control, minimum abstraction, more boilerplate
- **Prisma**: TypeScript-native, excellent type safety, modern migration system ✅

**Prisma Advantages**:

- Schema-first approach with automatic type generation
- Excellent TypeScript IntelliSense support
- Built-in migration system
- Generated client is type-safe by default
- Clear separation between schema definition and runtime queries

## Secret Management Strategy

### Overview
Secrets are encrypted at rest using GPG symmetric encryption and decrypted at container startup.

### Server Setup

**1. Encrypt Secrets Locally**

```bash
# Generate strong database password
openssl rand -base64 32 > /tmp/postgres_password_plain

# Encrypt with GPG (you'll be prompted for passphrase)
gpg --symmetric --cipher-algo AES256 \
  --output infrastructure/database/secrets/postgres_password.gpg \
  /tmp/postgres_password_plain

# Secure cleanup
shred -u /tmp/postgres_password_plain

# Encrypt SSH private key (for backups)
gpg --symmetric --cipher-algo AES256 \
  --output infrastructure/database/secrets/hetzner_ssh_key.gpg \
  ~/.ssh/your_backup_key

# Use the SAME passphrase for all encrypted files
```

**2. Create Decryption Script**

`infrastructure/database/secrets/decrypt.sh`:

```bash
#!/bin/bash
set -e

if [ -z "$GPG_PASSPHRASE" ]; then
    echo "Error: GPG_PASSPHRASE environment variable not set"
    exit 1
fi

# Create secrets directory
mkdir -p /run/secrets

# Decrypt secrets
gpg --batch --yes --passphrase "$GPG_PASSPHRASE" \
  --decrypt /secrets-encrypted/postgres_password.gpg \
  > /run/secrets/postgres_password

gpg --batch --yes --passphrase "$GPG_PASSPHRASE" \
  --decrypt /secrets-encrypted/hetzner_ssh_key.gpg \
  > /run/secrets/hetzner_ssh_key

# Set restrictive permissions
chmod 600 /run/secrets/postgres_password /run/secrets/hetzner_ssh_key

echo "Secrets decrypted successfully"
```

**3. Store Master Passphrase Securely**

On server, create systemd environment file:

```bash
# Create directory
sudo mkdir -p /etc/your-app

# Store passphrase
sudo bash -c 'echo "GPG_PASSPHRASE=your-master-passphrase" > /etc/your-app/database.env'

# Set restrictive permissions
sudo chmod 600 /etc/your-app/database.env
sudo chown root:root /etc/your-app/database.env
```

### Local Development Setup

For local development, use environment variables in your shell configuration:

`~/.zshrc` or `~/.bashrc`:

```bash
export GPG_PASSPHRASE="your-local-gpg-passphrase"
export DB_PASSWORD_LOCAL="your-local-dev-password"
export DATABASE_URL="postgresql://db-user:${DB_PASSWORD_LOCAL}@localhost:5432/database"
```

**Important**: After modifying shell configuration, run `exec zsh` (or `exec bash`) to reload. Using `source` is insufficient for environment variable propagation to child processes.

## Infrastructure Setup

### Directory Structure

```
project-root/
├── infrastructure/
│   └── database/
│       ├── docker-compose.yml           # Production database stack
│       ├── docker-compose.local.yml     # Local development database
│       ├── deploy.sh                    # Deployment helper script
│       ├── secrets/
│       │   ├── decrypt.sh               # GPG decryption logic
│       │   ├── postgres_password.gpg    # Encrypted DB password
│       │   └── backup_ssh_key.gpg       # Encrypted backup SSH key
│       ├── backup-scripts/
│       │   ├── backup.sh                # Daily backup script
│       │   └── cleanup.sh               # Old backup removal
│       └── db-init/
│           └── 01-extensions.sql        # Initial DB setup
```

### Production Database Stack

`infrastructure/database/docker-compose.yml`:

```yaml
version: '3.8'

services:
  # Init container: decrypt secrets before main services start
  secret-decryptor:
    image: alpine:latest
    environment:
      GPG_PASSPHRASE: ${GPG_PASSPHRASE}
    volumes:
      - ./secrets:/secrets-encrypted:ro
      - secrets_volume:/run/secrets
    command: sh -c "apk add --no-cache gnupg && sh /secrets-encrypted/decrypt.sh"

  postgres:
    image: postgis/postgis:17-3.5
    container_name: app-postgres
    environment:
      POSTGRES_DB: your_database
      POSTGRES_USER: your_db_user
      POSTGRES_PASSWORD_FILE: /run/secrets/postgres_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./db-init:/docker-entrypoint-initdb.d:ro
      - secrets_volume:/run/secrets:ro
    networks:
      - app-network
    restart: unless-stopped
    depends_on:
      - secret-decryptor

  backup:
    image: alpine:latest
    container_name: app-backup
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/postgres_password
    volumes:
      - ./backup-scripts:/scripts:ro
      - secrets_volume:/run/secrets:ro
    networks:
      - app-network
    command: sh -c "apk add --no-cache postgresql-client openssh-client gnupg && echo '0 2 * * * /scripts/backup.sh' | crontab - && crond -f"
    restart: unless-stopped
    depends_on:
      - secret-decryptor

volumes:
  postgres_data:      # Persistent database storage
  secrets_volume:     # Ephemeral decrypted secrets (in-memory)

networks:
  app-network:
    external: true    # Shared with application containers
```

**Key Design Elements**:

1. **Init Container Pattern**: `secret-decryptor` runs first, decrypts secrets into shared volume
2. **Ephemeral Secrets Volume**: Decrypted secrets exist only in memory, never written to disk
3. **Password Files**: PostgreSQL reads password from file (more secure than env vars)
4. **Shared Network**: Both database and app containers use same Docker network for hostname resolution
5. **Dependency Management**: `depends_on` ensures proper startup order

### Database Initialization

`infrastructure/database/db-init/01-extensions.sql`:

```sql
-- PostgreSQL extensions are loaded on first database initialization
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";       -- Cryptographic functions
CREATE EXTENSION IF NOT EXISTS "postgis";        -- Geographic data types
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";  -- Query statistics
```

**Note**: Files in `/docker-entrypoint-initdb.d/` only run on first container start with empty data volume.

### Systemd Service for Auto-Start

Create `/etc/systemd/system/app-db.service`:

```ini
[Unit]
Description=Application Database Stack
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/app/infrastructure/database
EnvironmentFile=/etc/app/database.env
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=300

[Install]
WantedBy=multi-user.target
```

**Enable and start**:

```bash
sudo systemctl daemon-reload
sudo systemctl enable app-db.service
sudo systemctl start app-db.service
```

**Why Systemd?**

- Automatic database startup after server reboot
- Proper service lifecycle management
- Environment variable injection from secure file
- Integration with system logs (`journalctl -u app-db.service`)

## Application Integration

### Prisma Setup

**1. Install Dependencies**

```bash
npm install @prisma/client
npm install -D prisma
```

**2. Initialize Prisma**

```bash
cd apps/backend
npx prisma init
```

**3. Configure Schema**

`apps/backend/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../generated/prisma"  // Custom output path
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")    // Reads from environment variable
}

// Your models here
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Why Custom Output Path?**

- Keeps generated code separate from source code
- Easier to exclude from version control
- Clear distinction between authored and generated code

**4. Update .gitignore**

`apps/backend/.gitignore`:

```
/generated/prisma
```

Generated code should not be committed - it's rebuilt during deployment.

### NestJS Integration

**1. Create Prisma Service**

`apps/backend/src/prisma/prisma.service.ts`:

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
```

**Key Points**:

- Implements `OnModuleInit` to connect when NestJS module initializes
- Extends `PrismaClient` to inherit all generated methods
- Single database connection per application instance

**2. Register in App Module**

`apps/backend/src/app/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, PrismaService],  // Add PrismaService
})
export class AppModule {}
```

**3. Use in Controllers**

`apps/backend/src/app/app.controller.ts`:

```typescript
import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('db-test')
  async testDatabase() {
    try {
      await this.prisma.$connect();
      return { status: 'Database connection successful' };
    } catch (error) {
      return {
        status: 'Database connection failed',
        error: error.message
      };
    }
  }

  @Get('users')
  async getUsers() {
    return this.prisma.user.findMany();
  }
}
```

**4. Configure API Prefix**

`apps/backend/src/main.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');  // All routes prefixed with /api
  const port = process.env.PORT || 3000;
  await app.listen(port);
}

bootstrap();
```

**Why API Prefix?**

- Prevents route collision with frontend routes
- Clear separation between API and static file serving
- Standard convention for API endpoints

### Docker Build Configuration

**Update Dockerfile to Generate Prisma Client**:

```dockerfile
FROM node:22-bookworm-slim AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .

# Generate Prisma client BEFORE building application
RUN cd apps/backend && npx prisma generate

RUN npx nx build frontend --prod
RUN npx nx build backend --prod

FROM node:22-bookworm-slim AS runtime

WORKDIR /app
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --from=builder /app/dist/apps/backend ./
COPY --from=builder /app/dist/apps/frontend ./public

# Copy generated Prisma client
COPY --from=builder /app/apps/backend/generated ./generated

EXPOSE 3000
CMD ["node", "main.js"]
```

**Critical Points**:

1. Generate Prisma client during build (not at runtime)
2. Copy generated client from builder to runtime stage
3. Generated code is build artifact, not source code

### Database URL Configuration

**In Deployment Scripts** (git hooks, CI/CD):

```bash
docker run -d \
  --name app-container \
  --network app-network \
  --env "DATABASE_URL=postgresql://db-user:password@postgres:5432/database" \
  app-image:latest
```

**Connection String Format**:

```
postgresql://[user]:[password]@[host]:[port]/[database]
```

**For Docker Networks**:

- `host` is the database container name (e.g., `postgres`)
- Docker's internal DNS resolves container names to IP addresses
- Containers on same network can communicate via container names

## Local Development Setup

### Local Database Stack

`infrastructure/database/docker-compose.local.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgis/postgis:17-3.5
    platform: linux/amd64  # For ARM64 Macs (M1/M2/M3)
    container_name: app-postgres-local
    environment:
      POSTGRES_DB: your_database
      POSTGRES_USER: your_db_user
      POSTGRES_PASSWORD: ${DB_PASSWORD_LOCAL}
    volumes:
      - postgres_local_data:/var/lib/postgresql/data
      - ./db-init:/docker-entrypoint-initdb.d:ro
    ports:
      - "5432:5432"  # Expose on localhost
    restart: unless-stopped

volumes:
  postgres_local_data:
```

**Key Differences from Production**:

- No GPG encryption (simpler for development)
- Port exposed to host (5432:5432)
- Password from environment variable
- Platform specification for ARM compatibility

**ARM64 Mac Considerations**:

- PostGIS doesn't have native ARM64 image
- `platform: linux/amd64` forces x86 emulation
- Performance impact is acceptable for local development
- Alternative: Use `postgres:17` and install PostGIS manually

### Starting Local Database

```bash
cd infrastructure/database
docker compose -f docker-compose.local.yml up -d

# Verify
docker ps | grep postgres-local
docker logs app-postgres-local
```

### Development Workflow

**1. Set Environment Variables**

```bash
# Add to ~/.zshrc or ~/.bashrc
export DB_PASSWORD_LOCAL="local-dev-password"
export DATABASE_URL="postgresql://your_db_user:${DB_PASSWORD_LOCAL}@localhost:5432/your_database"

# Reload shell (important!)
exec zsh  # or exec bash
```

**2. Generate Prisma Client**

```bash
cd apps/backend
npx prisma generate
```

**3. Start Development Server**

```bash
# From project root (Nx workspace)
nx serve backend

# Test database connection
curl http://localhost:3000/api/db-test
```

**4. Database Migrations**

```bash
# Create migration from schema changes
npx prisma migrate dev --name your_migration_name

# Apply migrations to database
npx prisma migrate deploy

# Generate types after schema changes
npx prisma generate
```

## Deployment Workflows

### Initial Setup

**1. Deploy Database Stack**

```bash
# On server
cd /opt/app/infrastructure/database
sudo systemctl start app-db.service

# Verify
docker ps
docker logs app-postgres
```

**2. Verify Network Connectivity**

```bash
# Check database container network
docker inspect app-postgres | grep NetworkMode

# Check application can reach database (after app deployment)
docker exec app-container ping postgres
```

**3. Test Database Connection**

```bash
# From application container
docker exec -it app-container sh
# Inside container:
curl http://localhost:3000/api/db-test
```

### Application Deployment

**Application deployments do NOT affect the database**. The database runs continuously as a separate service.

**Typical Deployment Flow**:

1. Push code to Git
2. Git hook triggers on server
3. Docker builds new application image
4. New container starts with DATABASE_URL environment variable
5. Old container stops (zero-downtime via reverse proxy)
6. Database continues running unaffected

### Database Migrations

**Development**:

```bash
# Create and apply migration locally
npx prisma migrate dev --name add_user_table

# Commit migration files
git add prisma/migrations/
git commit -m "Add user table migration"
```

**Production**:

```bash
# On server, run migrations
docker exec app-container npx prisma migrate deploy
```

**Best Practice**: Run migrations as separate deployment step, not during application startup.

## Troubleshooting

### Environment Variable Issues

**Symptom**: "Environment variable not found: DATABASE_URL"

**Causes**:

1. **Local Development**: Environment variables not properly loaded
   - **Fix**: Run `exec zsh` (not just `source ~/.zshrc`)
   - Nx spawns child processes that don't inherit sourced variables

2. **Docker Container**: DATABASE_URL not passed to container
   - **Fix**: Add `--env` flag to docker run command
   - Verify with: `docker exec container env | grep DATABASE_URL`

### NestJS Dependency Injection Errors

**Symptom**: "Can't resolve dependencies of AppController"

**Cause**: TypeScript type-only imports

**Problem Code**:

```typescript
// Biome/ESLint auto-corrects to this
import type { PrismaService } from '../prisma/prisma.service';

// NestJS needs runtime import
import { PrismaService } from '../prisma/prisma.service';
```

**Fix**: Configure linter to avoid type-only imports for services:

`biome.json`:

```json
{
  "linter": {
    "rules": {
      "style": {
        "useImportType": "off"
      }
    }
  }
}
```

### Container Restart Loops

**Symptom**: Container continuously restarting with exit code 1

**Debugging**:

```bash
# Check recent logs
docker logs container-name --tail 50

# Common issues:
# - Database connection timeout
# - Missing environment variables
# - Prisma client not generated
# - Port already in use
```

**Solution Pattern**:

1. Identify error in logs
2. Fix locally and test
3. Redeploy

### Database Connection Failures

**Symptom**: "Can't reach database server at postgres:5432"

**Checklist**:

1. **Network**: Are containers on same Docker network?

   ```bash
   docker network ls
   docker inspect container-name | grep NetworkMode
   ```

2. **Database Running**: Is postgres container active?

   ```bash
   docker ps | grep postgres
   ```

3. **Connection String**: Is DATABASE_URL correct?

   ```bash
   docker exec app-container env | grep DATABASE_URL
   ```

4. **DNS Resolution**: Can container resolve hostname?

   ```bash
   docker exec app-container ping postgres
   ```

### Generated Prisma Client Issues

**Symptom**: Build fails with "Cannot find module '../../generated/prisma'"

**Causes**:

1. **Missing Generation Step**: Prisma client not generated during build
   - **Fix**: Add `npx prisma generate` to Dockerfile

2. **Wrong Import Path**: Path doesn't match generator output
   - **Fix**: Verify `output` in schema.prisma matches import path

3. **Gitignored Files**: Generated files excluded but not regenerated
   - **Fix**: Ensure build process generates client

## Key Lessons Learned

### Docker Standalone Secrets Management

**Challenge**: No native secrets management in Docker Standalone.

**Learning**: GPG encryption + init containers provides good security/complexity balance for single-server deployments.

**Alternative Paths**:

- For multi-server: Consider Kubernetes or Docker Swarm
- For high-security: Use dedicated secret management (Vault)
- For simplicity: Accept plaintext files with strict permissions

### Prisma Client Generation

**Challenge**: Generated Prisma client should not be committed to Git.

**Learning**: Generate during Docker build, not locally. Treat as build artifact.

**Implementation**:

1. Add `/generated` to .gitignore
2. Generate in Dockerfile before application build
3. Copy generated client to runtime image

### Environment Variable Propagation

**Challenge**: Shell environment variables not available in Nx child processes.

**Learning**: `source` updates current shell only. Child processes need `exec` to inherit variables.

**Pattern**: Always use `exec bash` or `exec zsh` when updating environment variables for development.

### NestJS Import Semantics

**Challenge**: Linters auto-convert to type-only imports, breaking NestJS dependency injection.

**Learning**: NestJS uses runtime reflection for DI. Type-only imports are erased at runtime.

**Solution**: Configure linters to avoid type-only imports for NestJS services and providers.

### Database Persistence Strategy

**Challenge**: Need database persistence across application deployments.

**Learning**: Separate database and application into different Docker Compose stacks.

**Benefits**:

- Independent lifecycle management
- Zero database downtime during app updates
- Clear separation of concerns
- Simpler disaster recovery

### ARM64 Compatibility

**Challenge**: Many Docker images don't support ARM64 architecture (Apple Silicon Macs).

**Learning**: `platform: linux/amd64` enables emulation, acceptable performance trade-off for development.

**Considerations**:

- Use native ARM64 images when available
- Emulation overhead acceptable for databases in local development
- Production should use native architecture

## Summary

This architecture provides:

✅ **Persistent Database**: Survives all application deployments
✅ **Secure Secrets**: GPG encryption, no plaintext on disk
✅ **Zero Downtime**: Application updates don't affect database
✅ **Local Parity**: Local development mirrors production
✅ **Type Safety**: Prisma provides excellent TypeScript integration
✅ **Automatic Backups**: Daily encrypted backups to remote storage
✅ **Auto-Recovery**: Systemd restarts database after server reboot

The key insight: **Separate database lifecycle from application lifecycle**. This single decision simplifies deployment, improves reliability, and enables zero-downtime updates.
