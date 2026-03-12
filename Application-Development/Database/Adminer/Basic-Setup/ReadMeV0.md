# Adminer + PostgreSQL

Adminer und PostgreSQL Docker Setup with HTTPS

## Overview

This guide covers setting up a web-based PostgreSQL management interface (Adminer) with HTTPS encryption for local development. The setup uses Docker containers, self-signed SSL certificates, and nginx as an HTTPS termination proxy.

## Why This Setup?

**Problem**: Desktop database clients (like PgAdmin4) can be slow to start, especially on macOS. For frequent database access during development, this becomes a productivity bottleneck.

**Solution**: Adminer is a lightweight, web-based database management tool that runs in a browser. Combined with nginx for HTTPS, it provides:

- Instant access (browser-based, no app startup time)
- Secure local connections (HTTPS with self-signed certificates)
- Cross-platform consistency
- Easy integration with existing Docker workflows

## Architecture

```
Browser (https://localhost:8443)
  ↓ HTTPS
nginx proxy (SSL termination)
  ↓ HTTP
Adminer (web interface)
  ↓ PostgreSQL protocol
PostgreSQL database
```

All containers run on a shared Docker network, enabling container-to-container communication by container name.

## Prerequisites

- Docker installed and running
- OpenSSL (usually pre-installed on macOS/Linux)
- PostgreSQL container already running
- Environment variables for database credentials

## Step 1: Create Docker Network

Container-to-container communication requires a shared network. Create one if it doesn't exist:

```bash
docker network create app-local
```

**Why**: Docker's default bridge network doesn't support container name resolution. A custom network enables containers to communicate using container names as hostnames.

## Step 2: Start PostgreSQL Container

If not already running, start your PostgreSQL container on the shared network:

```bash
docker run -d --name postgres-local --network app-local \
  -e POSTGRES_DB=mydb \
  -e POSTGRES_USER=dbuser \
  -e POSTGRES_PASSWORD=${DB_PASSWORD} \
  -v postgres_data:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:17
```

**Network flag**: `--network app-local` connects this container to our shared network.

**Port exposure**: `-p 5432:5432` allows external tools (like `psql` CLI) to connect from host machine.

## Step 3: Generate Self-Signed SSL Certificates

Create a directory for certificates and generate them:

```bash
mkdir -p certificates
cd certificates

openssl req -x509 -newkey rsa:4096 \
  -keyout key.pem \
  -out cert.pem \
  -days 365 \
  -nodes \
  -subj "/CN=localhost"
```

**Command breakdown**:

- `req -x509`: Generate self-signed certificate (not just a request)
- `-newkey rsa:4096`: Create 4096-bit RSA key pair
- `-keyout key.pem`: Private key filename
- `-out cert.pem`: Certificate filename
- `-days 365`: Valid for 1 year
- `-nodes`: No password protection on private key
- `-subj "/CN=localhost"`: Certificate for localhost

**Result**: Two files in current directory:

- `key.pem` - Private key (keep secure)
- `cert.pem` - Public certificate

## Step 4: Create nginx Configuration

Create `nginx.conf` in the same directory as your certificates:

```nginx
events {}
http {
  server {
    listen 443 ssl;
    ssl_certificate /etc/nginx/cert.pem;
    ssl_certificate_key /etc/nginx/key.pem;

    location / {
      proxy_pass http://host.docker.internal:8081;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
    }
  }
}
```

**Key points**:

- `listen 443 ssl`: HTTPS port with SSL enabled
- Certificate paths: Must match Docker volume mount destinations
- `proxy_pass`: Points to Adminer container (via host.docker.internal)
- Proxy headers: Required for proper request forwarding

**Why host.docker.internal**: This special DNS name resolves to host machine from within Docker container, allowing nginx to reach Adminer's exposed port.

## Step 5: Start Adminer Container

```bash
docker run -d --name adminer-local \
  --network app-local \
  -p 8081:8080 \
  adminer
```

**Port mapping**: Container runs on 8080, exposed on host as 8081.

**Network**: On `app-local` so it can reach PostgreSQL by container name.

## Step 6: Start nginx Proxy

```bash
docker run -d --name adminer-proxy \
  --network app-local \
  -p 8443:443 \
  -v "$(pwd)/cert.pem":/etc/nginx/cert.pem:ro \
  -v "$(pwd)/key.pem":/etc/nginx/key.pem:ro \
  -v "$(pwd)/nginx.conf":/etc/nginx/nginx.conf:ro \
  nginx:alpine
```

**Volume mounts**: Local files → container paths (read-only with `:ro`)

**Port mapping**: Host 8443 → container 443 (HTTPS)

**Critical**: Run from directory containing cert.pem, key.pem, and nginx.conf

## Step 7: Access Adminer

1. Open browser: `https://localhost:8443`
2. Accept self-signed certificate warning
3. Login with:
   - **System**: PostgreSQL
   - **Server**: `postgres-local` (container name, not localhost)
   - **Username**: Your database username
   - **Password**: Your database password
   - **Database**: Your database name

**Server field**: Use container name because Adminer runs inside Docker network. From container perspective, PostgreSQL is at `postgres-local:5432`.

## Convenience Scripts

Create executable shell scripts for easy container management:

**start-postgres-local.sh**:

```bash
#!/bin/bash
docker run -d --name postgres-local --network app-local \
  -e POSTGRES_DB=mydb \
  -e POSTGRES_USER=dbuser \
  -e POSTGRES_PASSWORD=${DB_PASSWORD} \
  -v postgres_data:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:17
```

**start-adminer-local.sh**:

```bash
#!/bin/bash
docker run -d --name adminer-local \
  --network app-local \
  -p 8081:8080 \
  adminer
```

**start-adminer-proxy-local.sh**:

```bash
#!/bin/bash
docker run -d --name adminer-proxy \
  --network app-local \
  -p 8443:443 \
  -v "$(pwd)/cert.pem":/etc/nginx/cert.pem:ro \
  -v "$(pwd)/key.pem":/etc/nginx/key.pem:ro \
  -v "$(pwd)/nginx.conf":/etc/nginx/nginx.conf:ro \
  nginx:alpine
```

Make scripts executable:

```bash
chmod +x start-*.sh
```

## Non-Interactive Database Commands

For automation, CI/CD, or AI-assisted workflows, execute SQL without entering interactive shell:

**List tables**:

```bash
docker exec postgres-local psql -U dbuser -d mydb -c "\dt"
```

**Execute SQL statement**:

```bash
docker exec postgres-local psql -U dbuser -d mydb -c "SELECT version();"
```

**Multi-line SQL**:

```bash
docker exec postgres-local psql -U dbuser -d mydb -c "
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100)
);
"
```

**Why this matters**: When using AI coding assistants or automation tools, interactive shells cause the tool to "hang" waiting for input. The `-c` flag executes the command and immediately exits.

## Troubleshooting

### Certificate Path Errors

**Symptom**: nginx fails with "cannot load certificate" error

**Cause**: Paths in nginx.conf don't match volume mount destinations

**Fix**: Ensure nginx.conf uses absolute paths matching the volume mounts:

```nginx
ssl_certificate /etc/nginx/cert.pem;
ssl_certificate_key /etc/nginx/key.pem;
```

Do NOT use relative paths like `../certificates/cert.pem`.

### Connection Refused

**Symptom**: Browser shows "connection refused" or "empty response"

**Debug steps**:

1. Verify all containers running: `docker ps`
2. Check nginx logs: `docker logs adminer-proxy`
3. Test nginx can reach Adminer:

   ```bash
   docker exec adminer-proxy wget -qO- http://host.docker.internal:8081
   ```

**Common cause**: Containers not on same network or wrong port numbers.

### Cannot Connect to Database

**Symptom**: Adminer shows "cannot connect to database server"

**Check**: Are you using container name or localhost?

- **Correct**: `postgres-local` (from Adminer's perspective)
- **Wrong**: `localhost` (would try to connect to Adminer's own container)

### Self-Signed Certificate in Browser

**Symptom**: Browser security warning

**Solution**: This is expected behavior. Click "Advanced" → "Proceed to localhost (unsafe)" to continue.

**For production**: Use properly signed certificates from Let's Encrypt or similar.

### curl SSL Certificate Error

**Symptom**: `curl: (60) SSL certificate problem: self-signed certificate`

**Solution**: Use `-k` flag to skip certificate verification:

```bash
curl -k https://localhost:8443
```

**Memory aid**: `-k` = "careless" about certificates (or "kill cert checks")

## PostGIS-Specific: Cleaning Up TIGER Data

If using PostGIS image, you'll see US Census TIGER geocoding tables (50+ tables in `tiger` schema). For non-US applications, these are unnecessary.

**Check what exists**:

```bash
docker exec postgres-local psql -U dbuser -d mydb -c "\dt"
```

**Remove TIGER schema**:

```bash
docker exec postgres-local psql -U dbuser -d mydb -c "DROP SCHEMA tiger CASCADE;"
```

**What remains** (essential PostGIS tables):

- `public.spatial_ref_sys` - Coordinate systems
- `public.geometry_columns` - Spatial metadata
- `topology.*` - Topological operations

These are required for PostGIS functionality and should be kept.

## Security Considerations

**Development only**: This setup uses self-signed certificates appropriate for local development. Do not expose these ports to the internet.

**Production requirements**:

- Use properly signed certificates from trusted CA
- Implement authentication/authorization
- Use secrets management (not environment variables)
- Restrict network access with firewall rules

**Password management**: Store database passwords in environment variables, not in scripts or version control.

## Container Management

**Start all containers**:

```bash
./start-postgres-local.sh
./start-adminer-local.sh
./start-adminer-proxy-local.sh
```

**Stop all containers**:

```bash
docker stop postgres-local adminer-local adminer-proxy
```

**Remove all containers**:

```bash
docker rm postgres-local adminer-local adminer-proxy
```

**Data persistence**: PostgreSQL data persists in named volume `postgres_data` even after container removal. To completely reset:

```bash
docker volume rm postgres_data
```

## Alternative: Docker Compose

For production-like setups, consider Docker Compose to manage all services together. This guide uses individual `docker run` commands for clarity and flexibility during development.

## Summary

This setup provides:

- Fast, browser-based database management
- HTTPS encryption for secure local connections
- Container isolation with shared networking
- Non-interactive command execution for automation
- Persistent data storage across container restarts

The architecture separates concerns (database, web interface, HTTPS termination) while keeping everything containerized and easy to manage.
