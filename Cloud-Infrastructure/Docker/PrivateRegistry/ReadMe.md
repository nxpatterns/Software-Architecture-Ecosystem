# Private Docker Registry

E.g. for GitLab CI/CD Optimization
Link: https://claude.ai/public/artifacts/8a7f5465-b0d3-4abf-9c1f-24d3322ab3e7

## Problem Statement

GitLab CI/CD pipelines were slow and unreliable due to:

- Pulling base images from external registries on every build
- Docker Hub rate limits affecting build reliability
- Repeated installation of build dependencies (Node.js, pnpm, build tools)
- No control over base image availability

**Solution**: Private Docker registry with custom base images containing pre-installed dependencies.

## Architecture Overview

```
GitLab CI/CD Pipeline
    ↓
GitLab Runner (Docker)
    ↓ (pulls base image)
Private Docker Registry
    ↓ (proxied through)
Apache with SSL/TLS
    ↓ (stores data)
Local Filesystem Storage
```

**Key Components**:

- **Docker Registry 2.x**: Official Docker distribution registry
- **Apache Reverse Proxy**: SSL termination and request routing
- **htpasswd Authentication**: Basic auth for registry access
- **ISPConfig**: Automated SSL certificate management (Let's Encrypt)

## Implementation

### Phase 1: Docker Registry Setup

**Deploy Registry Container**:

```bash
# Create directory structure
mkdir -p /opt/registry/auth
mkdir -p /opt/registry/data

# Generate authentication credentials
docker run --rm --entrypoint htpasswd httpd:2 -Bbn <username> <password> > /opt/registry/auth/htpasswd

# Start registry (HTTP only, proxied by Apache)
docker run -d \
   --name registry \
   --restart=always \
   -p 127.0.0.1:5000:5000 \
   -v /opt/registry/auth:/auth \
   -v /opt/registry/data:/var/lib/registry \
   -e REGISTRY_AUTH=htpasswd \
   -e REGISTRY_AUTH_HTPASSWD_REALM="Registry Realm" \
   -e REGISTRY_AUTH_HTPASSWD_PATH=/auth/htpasswd \
   registry:2
```

**Important Configuration Notes**:

- Bind to `127.0.0.1:5000` only (not publicly accessible)
- Registry runs HTTP internally; Apache handles HTTPS
- `REGISTRY_AUTH_HTPASSWD_REALM` is required for htpasswd auth

### Phase 2: Apache Reverse Proxy

**Setup Domain in ISPConfig**:

1. Create website for registry subdomain (e.g., `registry.example.com`)
2. Enable SSL with Let's Encrypt
3. Add Apache directives (Options → Apache Directives):

```apache
ProxyPreserveHost On
ProxyRequests Off
ProxyPass / http://127.0.0.1:5000/
ProxyPassReverse / http://127.0.0.1:5000/
LimitRequestBody 0
```

**Enable Required Apache Modules**:

```bash
a2enmod proxy
a2enmod proxy_http
systemctl reload apache2
```

**Benefits of This Approach**:

- ISPConfig handles SSL certificate renewal automatically
- Apache performs SSL termination (registry stays simple)
- Centralized certificate management
- Standard web server security hardening

### Phase 3: Custom Base Image

**Create Dockerfile** with all required build dependencies:

```dockerfile
FROM node:22-slim

ENV DEBIAN_FRONTEND=noninteractive

# Install essential build tools
RUN apt-get update && apt-get install -y \
      git \
      curl \
      wget \
      vim \
      imagemagick \
      build-essential \
      python3 \
      procps \
      ca-certificates \
      && rm -rf /var/lib/apt/lists/*

# Install Docker CLI (for Docker-in-Docker workflows)
RUN curl -fsSL https://get.docker.com | sh

# Install package manager (pnpm example, adjust as needed)
RUN npm install -g pnpm@10.7.1

WORKDIR /app
CMD ["bash"]
```

**Build and Push Base Image**:

```bash
# Build locally
docker build -t registry.example.com/base-dev-image:1.0 .

# Authenticate to registry
docker login registry.example.com -u <username> -p <password>

# Push to private registry
docker push registry.example.com/base-dev-image:1.0

# Verify in storage
ls -la /opt/registry/data/docker/registry/v2/repositories/
```

### Phase 4: GitLab CI/CD Integration

**Add Registry Credentials to GitLab**:

- Navigate to: Project → Settings → CI/CD → Variables
- Add masked variables:
  - `REGISTRY_USER`: registry username
  - `REGISTRY_PASSWORD`: registry password (avoid characters: `^`, `*`, `$` for masked variables)

**Update `.gitlab-ci.yml`**:

```yaml
variables:
  CUSTOM_REGISTRY: registry.example.com

.base_job:
  image: ${CUSTOM_REGISTRY}/base-dev-image:1.0
  services:
    - docker:27-dind
  before_script:
    # Use stdin for password (non-interactive CI environment)
    - echo $REGISTRY_PASSWORD | docker login ${CUSTOM_REGISTRY} -u $REGISTRY_USER --password-stdin
    - docker info
  script:
    - # Your build commands here
```

**Update Project Dockerfile** to use custom base:

```dockerfile
FROM registry.example.com/base-dev-image:1.0 AS base
WORKDIR /app

FROM base AS dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# Continue with multi-stage build...
```

## Key Learnings and Gotchas

### Storage Backend Decision

**Attempted**: S3-compatible Object Storage integration
**Issue**: Docker Registry validates S3 regions against AWS region list; custom region codes (e.g., Hetzner's `fsn1`) fail validation with error: `panic: invalid region provided`

**Workaround Options**:

1. Use `eu-central-1` as region with custom endpoint (may cause compatibility issues)
2. Use local filesystem storage (implemented solution)

**Decision**: Local filesystem storage for MVP

- **Pro**: Simpler, faster, no compatibility issues
- **Con**: No automatic backups, requires manual disk management

**Recommendation**: For production, consider cloud-native registries (AWS ECR, GCR, Harbor) or ensure object storage provider uses AWS-compatible region codes.

### GitLab Runner Authentication Problem

**Issue**: GitLab CI/CD variables are only available during job execution, NOT during the initial image pull phase. Runners cannot authenticate to pull private base images.

**Root Cause**: Runner pulls `image: registry.example.com/base:1.0` BEFORE starting the job, so `$REGISTRY_USER` and `$REGISTRY_PASSWORD` don't exist yet.

**Current Status**: Unresolved for containerized GitLab runners with bind-mounted configs

**Attempted Solutions**:

1. Adding registry credentials to runner TOML config (syntax errors)
2. Mounting Docker auth config into runner containers (runners in Docker Swarm)

**Working Alternatives**:

- Use public base image with dependency installation in `before_script`
- Use GitLab's built-in Container Registry (automatically authenticated)
- Configure runner-level authentication (complex for containerized runners)

### Apache Proxy Configuration

**Critical Detail**: htpasswd authentication requires `REGISTRY_AUTH_HTPASSWD_REALM` environment variable. Missing this causes registry to fail with authentication errors.

**Testing Approach**:

```bash
# Test registry locally (should return {})
curl -u username:password http://127.0.0.1:5000/v2/

# Test through Apache proxy
curl -u username:password https://registry.example.com/v2/

# Test image push
docker push registry.example.com/test:latest
```

## Current Implementation Status

### Successfully Implemented ✅

- Private Docker registry running on server
- Apache reverse proxy with auto-renewing SSL certificates
- htpasswd authentication working for push/pull operations
- Custom base image with Node.js 22, pnpm, build tools
- Image successfully pushed to and stored in registry

### Known Limitations ⚠️

- **Runner Authentication**: GitLab runners cannot pull private base images automatically
- **Storage**: Local filesystem instead of object storage (no automatic backups)
- **Security**: Docker running as root (rootless mode not implemented)
- **Monitoring**: No health checks, alerting, or automated cleanup

### Missing Enterprise Features

- Image vulnerability scanning
- Content trust / image signing
- Multi-architecture builds
- Registry UI / web interface
- RBAC beyond basic auth
- Automated garbage collection

## Maintenance Tasks

### Regular Maintenance

**Monitor Disk Usage**:

```bash
du -sh /opt/registry/data/
```

**Manual Garbage Collection** (remove unreferenced layers):

```bash
docker exec registry bin/registry garbage-collect /etc/docker/registry/config.yml --delete-untagged
```

**Backup Registry Data**:

```bash
# Backup authentication
tar -czf registry-auth-backup.tar.gz /opt/registry/auth/

# Backup image data
tar -czf registry-data-backup.tar.gz /opt/registry/data/
```

### Updating Base Images

When Node.js or dependencies need updates:

```bash
# Update Dockerfile with new versions
# Rebuild with new tag
docker build -t registry.example.com/base-dev-image:1.1 .

# Push new version
docker push registry.example.com/base-dev-image:1.1

# Update GitLab CI/CD to use new tag
# Test thoroughly before removing old version
```

**Versioning Strategy**: Use semantic versioning for base images (1.0, 1.1, 2.0) to allow controlled rollbacks.

## Security Considerations

### Current Security Posture

- **Authentication**: Basic htpasswd (credentials transmitted over HTTPS)
- **Transport Security**: TLS 1.2+ via Apache with Let's Encrypt
- **Network Exposure**: Registry only accessible via Apache proxy
- **Authorization**: Single-user access (no RBAC)

### Recommended Improvements

1. **Docker Rootless Mode**: Run Docker daemon as non-privileged user
2. **Network Segmentation**: Restrict registry access to GitLab runner IPs
3. **Secrets Management**: Store credentials in HashiCorp Vault or similar
4. **Audit Logging**: Enable and monitor registry access logs
5. **Image Scanning**: Integrate Trivy or Clair for vulnerability detection

## Troubleshooting Guide

### Registry Not Responding

```bash
# Check container status
docker ps | grep registry
docker logs registry

# Check Apache proxy
systemctl status apache2
tail -f /var/log/apache2/error.log

# Test local connection
curl -v http://127.0.0.1:5000/v2/
```

### Authentication Failures

```bash
# Verify htpasswd file
cat /opt/registry/auth/htpasswd

# Test authentication locally
curl -u username:password http://127.0.0.1:5000/v2/

# Regenerate credentials if needed
docker run --rm --entrypoint htpasswd httpd:2 -Bbn newuser newpass > /opt/registry/auth/htpasswd
docker restart registry
```

### Push/Pull Failures

```bash
# Check disk space
df -h /opt/registry/data/

# Verify network connectivity
curl -I https://registry.example.com

# Check registry health
docker exec registry bin/registry --version
```

## Alternative Approaches

### Option 1: GitLab Container Registry

**Pros**: Built into GitLab, automatically authenticated, no additional infrastructure
**Cons**: Tied to GitLab instance, harder to share across organizations

**When to Use**: If only serving GitLab CI/CD pipelines

### Option 2: Harbor

**Pros**: Enterprise features (RBAC, scanning, replication), web UI, vulnerability scanning
**Cons**: Higher complexity, more resource intensive

**When to Use**: Multi-team environments requiring advanced features

### Option 3: Cloud-Native Registries

**Options**: AWS ECR, Google GCR, Azure ACR
**Pros**: Managed service, built-in security scanning, high availability
**Cons**: Vendor lock-in, ongoing costs, data egress charges

**When to Use**: Cloud-native infrastructure, enterprise requirements

## Conclusion

This implementation provides a functional private Docker registry for CI/CD optimization. The setup successfully eliminates external dependencies and improves build reliability, though some enterprise features and runner authentication remain unresolved.

**Key Takeaways**:

- Local storage is acceptable for small-scale deployments
- ISPConfig simplifies SSL certificate management significantly
- Runner authentication for private base images requires additional configuration
- Start simple, add complexity only when needed

**Next Steps** (in order of priority):

1. Resolve GitLab runner authentication for private base images
2. Implement automated backup strategy
3. Set up registry garbage collection cron job
4. Consider migration to object storage for durability
5. Evaluate security hardening requirements
