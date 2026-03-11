# Git-Based Docker Deployment

Git-Based Docker Deployment with Dual Environments

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=5 orderedList=false} -->

<!-- code_chunk_output -->

- [Overview](#overview)
- [Architecture](#architecture)
  - [Components](#components)
  - [Environment Structure](#environment-structure)
- [Initial Server Setup](#initial-server-setup)
  - [Install Docker](#install-docker)
  - [Configure Apache Proxy Modules](#configure-apache-proxy-modules)
  - [Apache Virtual Host Configuration](#apache-virtual-host-configuration)
  - [SSL Certificate Setup](#ssl-certificate-setup)
- [Git Repository Setup](#git-repository-setup)
  - [Server-Side Configuration](#server-side-configuration)
  - [Local Repository Configuration](#local-repository-configuration)
- [Deployment Automation](#deployment-automation)
  - [Post-Receive Hook](#post-receive-hook)
- [Deployment Workflow](#deployment-workflow)
  - [Standard Deployment](#standard-deployment)
  - [Deployment Process](#deployment-process)
- [Key Design Decisions](#key-design-decisions)
  - [Static Apache Configuration](#static-apache-configuration)
  - [Health Checks Before Deployment](#health-checks-before-deployment)
  - [Fixed Port Assignment](#fixed-port-assignment)
- [Common Issues and Solutions](#common-issues-and-solutions)
  - [Git Hook Permission Errors](#git-hook-permission-errors)
  - [Docker Build Cache Invalidation](#docker-build-cache-invalidation)
  - [Container Port Conflicts](#container-port-conflicts)
  - [Failed Deployments](#failed-deployments)
- [Best Practices](#best-practices)
  - [Version Control](#version-control)
  - [Monitoring](#monitoring)
  - [Security](#security)
  - [Backup and Rollback](#backup-and-rollback)
- [Portainer Integration (Optional)](#portainer-integration-optional)
  - [Installation](#installation)
  - [Access](#access)
  - [Benefits](#benefits)
- [Nx Workspace Specifics](#nx-workspace-specifics)
  - [Build Command](#build-command)
  - [Multi-Stage Dockerfile](#multi-stage-dockerfile)
- [Troubleshooting](#troubleshooting)
  - [Check Container Status](#check-container-status)
  - [Check Apache Configuration](#check-apache-configuration)
  - [Test Deployment Manually](#test-deployment-manually)
- [Future Improvements](#future-improvements)

<!-- /code_chunk_output -->


## Overview

This documentation covers setting up an automated deployment pipeline using Git hooks to deploy containerized applications to production and development environments on a single server. The system uses Apache as a reverse proxy, Docker for containerization, and git post-receive hooks for automated deployments.

## Architecture

### Components

- **Git Bare Repository**: Receives push deployments
- **Working Directory**: Where code is checked out and built
- **Docker Containers**: Run the application instances
- **Apache Web Server**: Reverse proxy to Docker containers
- **Portainer**: Container management UI (optional)

### Environment Structure

- **Production**: Triggered by pushes to `main` branch
  - Domain: `example.com`
  - Container port: 3000
  - Apache proxy: Port 80/443 → 3000

- **Development**: Triggered by pushes to `development` branch
  - Domain: `dev.example.com`
  - Container port: 3100
  - Apache proxy: Port 80/443 → 3100

## Initial Server Setup

### Install Docker

```bash
# Install Docker on Debian/Ubuntu
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group (avoid sudo for docker commands)
sudo usermod -aG docker $USER
newgrp docker
```

### Configure Apache Proxy Modules

```bash
# Enable required Apache modules
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod proxy_balancer
sudo systemctl restart apache2
```

### Apache Virtual Host Configuration

**Production (example.com):**

```apache
<VirtualHost *:443>
    ServerName example.com
    ServerAlias www.example.com
    ServerAdmin admin@example.com

    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:3000/
    ProxyPassReverse / http://127.0.0.1:3000/

    ErrorLog ${APACHE_LOG_DIR}/error.log
    CustomLog ${APACHE_LOG_DIR}/access.log combined

    # SSL configuration
    Include /etc/letsencrypt/options-ssl-apache.conf
    SSLCertificateFile /etc/letsencrypt/live/example.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/example.com/privkey.pem
</VirtualHost>
```

**Development (dev.example.com):**

```apache
<VirtualHost *:443>
    ServerName dev.example.com
    ServerAdmin admin@example.com

    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:3100/
    ProxyPassReverse / http://127.0.0.1:3100/

    ErrorLog ${APACHE_LOG_DIR}/error.log
    CustomLog ${APACHE_LOG_DIR}/access.log combined

    # SSL configuration
    Include /etc/letsencrypt/options-ssl-apache.conf
    SSLCertificateFile /etc/letsencrypt/live/example.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/example.com/privkey.pem
</VirtualHost>
```

**HTTP to HTTPS Redirect:**

```apache
<VirtualHost *:80>
    ServerAdmin admin@example.com
    DocumentRoot /var/www/html

    RewriteEngine on
    RewriteCond %{SERVER_NAME} =example.com [OR]
    RewriteCond %{SERVER_NAME} =www.example.com [OR]
    RewriteCond %{SERVER_NAME} =dev.example.com
    RewriteRule ^ https://%{SERVER_NAME}%{REQUEST_URI} [END,NE,R=permanent]
</VirtualHost>
```

### SSL Certificate Setup

```bash
# Install Certbot
sudo apt install certbot python3-certbot-apache

# Obtain certificate for all domains
sudo certbot --apache -d example.com -d www.example.com -d dev.example.com

# Certificates auto-renew via systemd timer
```

## Git Repository Setup

### Server-Side Configuration

```bash
# Create bare repository for receiving pushes
mkdir -p ~/git/myapp.git
cd ~/git/myapp.git
git init --bare

# Set default branch
git symbolic-ref HEAD refs/heads/main

# Create working directory
mkdir -p ~/projects/myapp
```

### Local Repository Configuration

```bash
# Add remote pointing to server
git remote add production user@server.com:/home/user/git/myapp.git

# Push to deploy
git push production main          # Deploy to production
git push production development   # Deploy to development
```

## Deployment Automation

### Post-Receive Hook

Create `/home/user/git/myapp.git/hooks/post-receive`:

```bash
#!/bin/bash

WORK_TREE="/home/user/projects/myapp"
GIT_DIR="/home/user/git/myapp.git"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

wait_for_health_check() {
    local port=$1
    local max_attempts=30
    local attempt=1

    echo "🔍 Health checking localhost:${port}..."

    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "http://localhost:${port}" > /dev/null 2>&1; then
            echo "✅ Health check passed after ${attempt} attempts"
            return 0
        fi
        echo "⏳ Attempt ${attempt}/${max_attempts}..."
        sleep 2
        ((attempt++))
    done

    echo "❌ Health check failed"
    return 1
}

deploy_environment() {
    local env=$1
    local branch=$2
    local port=3000

    if [[ "$env" == "development" ]]; then
        port=3100
    fi

    local container_name="myapp-${env}"
    local image_tag="myapp:${env}-${TIMESTAMP}"

    echo "🔄 Deploying ${env} environment"

    # Checkout code
    git --git-dir="$GIT_DIR" --work-tree="$WORK_TREE" checkout -f "$branch"

    cd "$WORK_TREE"

    # Install dependencies
    echo "📦 Installing dependencies..."
    npm install --silent

    # Build application
    echo "🏗️  Building application..."
    npm run build

    # Build Docker image
    echo "🐳 Building Docker image..."
    docker build -t "$image_tag" .

    # Health check new image on temporary port
    local temp_port=$((port + 1))
    docker run -d --name "${container_name}-temp" \
        -p "${temp_port}:3000" "$image_tag"

    if ! wait_for_health_check "$temp_port"; then
        docker stop "${container_name}-temp"
        docker rm "${container_name}-temp"
        exit 1
    fi

    # Stop temp container
    docker stop "${container_name}-temp"
    docker rm "${container_name}-temp"

    # Deploy to production port
    echo "🚀 Deploying to port ${port}..."
    docker stop "$container_name" 2>/dev/null || true
    docker rm "$container_name" 2>/dev/null || true

    docker run -d --name "$container_name" --restart always \
        -p "${port}:3000" "$image_tag"

    echo "✅ Deployment completed: ${image_tag}"
}

# Branch detection
while read oldrev newrev refname; do
    branch=$(git rev-parse --symbolic --abbrev-ref $refname)

    if [[ "$branch" == "main" ]]; then
        deploy_environment "production" "main"
    elif [[ "$branch" == "development" ]]; then
        deploy_environment "development" "development"
    else
        echo "❌ Unknown branch: $branch"
        exit 1
    fi
done
```

```bash
# Make hook executable
chmod +x /home/user/git/myapp.git/hooks/post-receive
```

## Deployment Workflow

### Standard Deployment

```bash
# Development deployment
git checkout development
git add .
git commit -m "feature: new functionality"
git push production development

# Production deployment
git checkout main
git merge development
git push production main
```

### Deployment Process

1. **Push Detection**: Git receives push and triggers post-receive hook
2. **Branch Routing**: Hook detects branch and routes to correct environment
3. **Code Checkout**: Latest code checked out to working directory
4. **Dependency Installation**: npm/yarn install runs
5. **Build Process**: Application built (compile, bundle, etc.)
6. **Image Creation**: Docker image built with timestamp tag
7. **Health Check**: New container tested on temporary port
8. **Container Swap**: Old container stopped, new container started
9. **Cleanup**: Temporary containers removed

## Key Design Decisions

### Static Apache Configuration

**Decision**: Keep Apache virtual host configuration static, pointing to fixed ports.

**Rationale**:

- Avoids complexity of dynamic config modification
- No sudo requirements in git hooks
- Simpler troubleshooting
- Predictable behavior

### Health Checks Before Deployment

**Decision**: Test new containers on temporary ports before deploying.

**Rationale**:

- Prevents deploying broken builds
- Zero-downtime if health check fails
- Early failure detection

### Fixed Port Assignment

**Decision**: Use consistent ports per environment (3000 for prod, 3100 for dev).

**Rationale**:

- Simplifies Apache configuration
- Predictable firewall rules
- Easy to remember and document

## Common Issues and Solutions

### Git Hook Permission Errors

**Problem**: Git hooks cannot run sudo commands without password.

**Solutions**:

1. Avoid sudo in hooks entirely
2. Configure passwordless sudo for specific commands
3. Run deployment actions as services with proper permissions

### Docker Build Cache Invalidation

**Problem**: `COPY . .` invalidates Docker cache on any file change, including documentation.

**Solutions**:

1. Use `.dockerignore` to exclude non-essential files
2. Structure Dockerfile to copy dependency files before source code
3. Separate dependency installation from code copying

```dockerfile
# Better layer ordering
COPY package*.json ./
RUN npm ci
COPY src/ ./src/
# Don't copy docs, README, etc.
```

### Container Port Conflicts

**Problem**: Previous container still using port.

**Solution**: Always stop and remove old container before starting new one:

```bash
docker stop container-name 2>/dev/null || true
docker rm container-name 2>/dev/null || true
docker run -d --name container-name -p port:3000 image
```

### Failed Deployments

**Problem**: Deployment fails mid-process.

**Solution**: Implement health checks and atomic deployments:

- Test new container before stopping old one
- Keep old container running if health check fails
- Implement rollback mechanism

## Best Practices

### Version Control

- Use semantic versioning for Docker images
- Tag images with timestamps for traceability
- Keep git history clean with meaningful commits

### Monitoring

- Check deployment logs: `git push` output shows full deployment process
- Monitor container status: `docker ps`
- Check application logs: `docker logs container-name`

### Security

- Never commit secrets to git repository
- Use environment variables for sensitive configuration
- Implement proper firewall rules for Docker ports
- Keep Apache and Docker updated

### Backup and Rollback

- Keep previous Docker images for rollback
- Document rollback procedure
- Test rollback process periodically

```bash
# Quick rollback
docker stop current-container
docker run -d --name current-container -p port:3000 previous-image:tag
```

## Portainer Integration (Optional)

Portainer provides a web UI for Docker management.

### Installation

```bash
docker volume create portainer_data

docker run -d -p 8000:8000 -p 9443:9443 --name portainer \
    --restart=always \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v portainer_data:/data \
    portainer/portainer-ce:latest
```

### Access

- URL: `https://portainer.example.com:9443`
- Create admin user on first access
- Connect to local Docker environment

### Benefits

- Visual container management
- Stack deployment
- Container logs and statistics
- Secret management
- Multi-environment orchestration

## Nx Workspace Specifics

For Nx monorepo projects:

### Build Command

```bash
# Build multiple applications
npx nx run-many --target=build --projects=app1,app2

# Or individual apps
npx nx build app1
npx nx build app2
```

### Multi-Stage Dockerfile

```dockerfile
FROM node:22-bookworm-slim as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npx nx run-many --target=build --projects=frontend,backend

FROM node:22-bookworm-slim
WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["node", "dist/apps/backend/main.js"]
```

## Troubleshooting

### Check Container Status

```bash
docker ps                          # Running containers
docker ps -a                       # All containers
docker logs container-name         # Container logs
docker inspect container-name      # Detailed info
```

### Check Apache Configuration

```bash
apache2ctl -t                      # Test configuration
apache2ctl -S                      # Show virtual hosts
systemctl status apache2           # Service status
tail -f /var/log/apache2/error.log # Error logs
```

### Test Deployment Manually

```bash
# SSH to server
ssh user@server

# Navigate to working directory
cd ~/projects/myapp

# Manual build and deploy
npm install
npm run build
docker build -t test-image .
docker run -d --name test -p 3002:3000 test-image

# Test
curl http://localhost:3002

# Cleanup
docker stop test && docker rm test
```

## Future Improvements

- Implement proper blue-green deployment with multiple container instances
- Add automated rollback on deployment failure
- Integrate comprehensive logging and monitoring
- Implement database migration handling
- Add automated testing before deployment
- Configure backup strategies for persistent data
- Implement secrets management solution
