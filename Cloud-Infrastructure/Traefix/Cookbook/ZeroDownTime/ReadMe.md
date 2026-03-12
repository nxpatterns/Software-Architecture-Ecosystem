# Zero-Downtime Docker Deployment

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=5 orderedList=false} -->

<!-- code_chunk_output -->

- [Context & Problem Statement](#context--problem-statement)
- [Architecture Overview](#architecture-overview)
  - [Layer 1: SSL Termination (Apache)](#layer-1-ssl-termination-apache)
  - [Layer 2: Dynamic Load Balancing (Traefik)](#layer-2-dynamic-load-balancing-traefik)
  - [Layer 3: Application Containers](#layer-3-application-containers)
- [Implementation Steps](#implementation-steps)
  - [Step 1: DNS Configuration](#step-1-dns-configuration)
  - [Step 2: SSL Certificate Expansion](#step-2-ssl-certificate-expansion)
  - [Step 3: Apache VirtualHost Configuration](#step-3-apache-virtualhost-configuration)
  - [Step 4: Deploy Traefik via Portainer Stack](#step-4-deploy-traefik-via-portainer-stack)
- [Security Considerations](#security-considerations)
  - [Critical: Secure Traefik Dashboard](#critical-secure-traefik-dashboard)
  - [Additional Security Measures](#additional-security-measures)
- [Git Hook Modification (Next Steps)](#git-hook-modification-next-steps)
- [Lessons Learned](#lessons-learned)
  - [Certbot Behavior](#certbot-behavior)
  - [Apache Configuration Management](#apache-configuration-management)
  - [Traefik Service Discovery](#traefik-service-discovery)
  - [Production Readiness Checklist](#production-readiness-checklist)
- [Troubleshooting](#troubleshooting)
  - [Port Already Allocated](#port-already-allocated)
  - [Traefik Not Routing to Container](#traefik-not-routing-to-container)
  - [SSL Certificate Issues](#ssl-certificate-issues)
- [References](#references)
- [Next Implementation Steps](#next-implementation-steps)

<!-- /code_chunk_output -->

## Context & Problem Statement

When deploying containerized applications with Git hooks, traditional approaches modify reverse proxy configurations (Apache/nginx) to point to new container ports. This creates several issues:

- **Downtime during config reload** - Proxy must restart/reload
- **Race conditions** - New container might not be healthy when proxy switches
- **Manual port management** - Tracking which ports are in use
- **Rollback complexity** - Requires reverting proxy config changes

**Goal:** Implement seamless, zero-downtime deployments where:

- Multiple container versions run simultaneously
- New containers are health-checked before receiving traffic
- Old containers are cleanly removed after successful deployment
- No manual proxy configuration changes required

## Architecture Overview

### Layer 1: SSL Termination (Apache)

- Handles HTTPS/SSL certificates (Let's Encrypt)
- Static configuration - rarely changes
- Routes to Traefik on fixed ports

### Layer 2: Dynamic Load Balancing (Traefik)

- Docker-aware service discovery
- Automatic upstream registration via labels
- Health checking and traffic routing
- Runs in Docker container

### Layer 3: Application Containers

- Multiple versions can run simultaneously
- Self-register with Traefik via Docker labels
- Dynamic port allocation (3001-3003 for prod, 3101-3103 for dev)

```
Internet → Apache (SSL:443) → Traefik (3000/3100) → App Containers (3001-3003/3101-3103)
```

## Implementation Steps

### Step 1: DNS Configuration

Add subdomain A records pointing to your server IP:

```dns
traefik.yourdomain.com    A    YOUR_SERVER_IP
portainer.yourdomain.com  A    YOUR_SERVER_IP
```

**Why:** Separate subdomains for management interfaces allow independent SSL certificates and access control.

### Step 2: SSL Certificate Expansion

Expand existing Let's Encrypt certificate to include new subdomains:

```bash
certbot certificates  # Check current certificate
certbot --apache -d yourdomain.com -d www.yourdomain.com \
                 -d dev.yourdomain.com -d traefik.yourdomain.com \
                 -d portainer.yourdomain.com
```

**Critical:** Choose "Expand" when prompted - this preserves existing certificate and adds new domains.

**Verification:**

```bash
certbot certificates  # Should show all 5 domains
```

### Step 3: Apache VirtualHost Configuration

Create separate VirtualHosts for clean separation:

```apache
<IfModule mod_ssl.c>

# Production App
<VirtualHost *:443>
  ServerName yourdomain.com
  ServerAlias www.yourdomain.com
  ServerAdmin admin@yourdomain.com

  ProxyPreserveHost On
  ProxyPass / http://127.0.0.1:3000/
  ProxyPassReverse / http://127.0.0.1:3000/

  ErrorLog ${APACHE_LOG_DIR}/error.log
  CustomLog ${APACHE_LOG_DIR}/access.log combined

  Include /etc/letsencrypt/options-ssl-apache.conf
  SSLCertificateFile /etc/letsencrypt/live/yourdomain.com/fullchain.pem
  SSLCertificateKeyFile /etc/letsencrypt/live/yourdomain.com/privkey.pem
</VirtualHost>

# Development App
<VirtualHost *:443>
  ServerName dev.yourdomain.com
  ServerAdmin admin@yourdomain.com

  ProxyPreserveHost On
  ProxyPass / http://127.0.0.1:3100/
  ProxyPassReverse / http://127.0.0.1:3100/

  Include /etc/letsencrypt/options-ssl-apache.conf
  SSLCertificateFile /etc/letsencrypt/live/yourdomain.com/fullchain.pem
  SSLCertificateKeyFile /etc/letsencrypt/live/yourdomain.com/privkey.pem
</VirtualHost>

# Traefik Dashboard
<VirtualHost *:443>
  ServerName traefik.yourdomain.com
  ServerAdmin admin@yourdomain.com

  ProxyPass / http://127.0.0.1:8080/
  ProxyPassReverse / http://127.0.0.1:8080/

  Include /etc/letsencrypt/options-ssl-apache.conf
  SSLCertificateFile /etc/letsencrypt/live/yourdomain.com/fullchain.pem
  SSLCertificateKeyFile /etc/letsencrypt/live/yourdomain.com/privkey.pem
</VirtualHost>

# Portainer Dashboard
<VirtualHost *:443>
  ServerName portainer.yourdomain.com
  ServerAdmin admin@yourdomain.com

  ProxyPass / http://127.0.0.1:9443/
  ProxyPassReverse / http://127.0.0.1:9443/

  Include /etc/letsencrypt/options-ssl-apache.conf
  SSLCertificateFile /etc/letsencrypt/live/yourdomain.com/fullchain.pem
  SSLCertificateKeyFile /etc/letsencrypt/live/yourdomain.com/privkey.pem
</VirtualHost>

</IfModule>
```

**HTTP to HTTPS Redirects:**

```apache
<VirtualHost *:80>
  ServerName yourdomain.com
  ServerAdmin admin@yourdomain.com

  RewriteEngine on
  RewriteCond %{SERVER_NAME} =yourdomain.com [OR]
  RewriteCond %{SERVER_NAME} =www.yourdomain.com [OR]
  RewriteCond %{SERVER_NAME} =dev.yourdomain.com [OR]
  RewriteCond %{SERVER_NAME} =traefik.yourdomain.com [OR]
  RewriteCond %{SERVER_NAME} =portainer.yourdomain.com
  RewriteRule ^ https://%{SERVER_NAME}%{REQUEST_URI} [END,NE,R=permanent]
</VirtualHost>
```

**Test and reload:**

```bash
apache2ctl configtest
systemctl reload apache2
```

### Step 4: Deploy Traefik via Portainer Stack

**Why Traefik:**

- Native Docker service discovery
- Automatic container registration via labels
- Zero-downtime upstream updates
- MIT license (enterprise-friendly)

**Portainer Stack Configuration:**

1. Navigate to Portainer → Select Environment → Stacks → Add Stack
2. Name: `traefik-proxy`
3. Web editor:

```yaml
services:
  traefik:
    image: traefik:v3.0
    container_name: traefik-proxy
    restart: always
    ports:
      - "3000:3000"    # Production entrypoint
      - "3100:3100"    # Development entrypoint
      - "8080:8080"    # Dashboard (secure this!)
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    command:
      - --api.dashboard=true
      - --api.insecure=true  # TEMPORARY - secure in production!
      - --providers.docker=true
      - --providers.docker.exposedbydefault=false
      - --entrypoints.prod.address=:3000
      - --entrypoints.dev.address=:3100
    labels:
      - "traefik.enable=false"  # Don't route to itself
```

4. Deploy the stack
5. Verify: `https://traefik.yourdomain.com` should show Traefik dashboard

**Important:** This configuration has `--api.insecure=true` which makes the dashboard publicly accessible. This MUST be secured before production use (see Security section).

## Security Considerations

### Critical: Secure Traefik Dashboard

**Current risk:** Dashboard is publicly accessible with `--api.insecure=true`

**Production-ready solution:**

1. **Generate BasicAuth credentials:**

```bash
# Install htpasswd if needed
apt-get install apache2-utils

# Generate password hash (double-escape $ for Docker Compose)
echo $(htpasswd -nB admin) | sed -e s/\\$/\\$\\$/g
# Output: admin:$$2y$$05$$...hash...
```

2. **Update Traefik stack configuration:**

```yaml
services:
  traefik:
    image: traefik:v3.0
    container_name: traefik-proxy
    restart: always
    ports:
      - "3000:3000"
      - "3100:3100"
      - "8080:8080"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    command:
      - --api.dashboard=true
      - --api.insecure=false  # SECURED
      - --providers.docker=true
      - --providers.docker.exposedbydefault=false
      - --entrypoints.prod.address=:3000
      - --entrypoints.dev.address=:3100
      - --entrypoints.traefik.address=:8080
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.dashboard.rule=Host(`traefik.yourdomain.com`)"
      - "traefik.http.routers.dashboard.entrypoints=traefik"
      - "traefik.http.routers.dashboard.service=api@internal"
      - "traefik.http.routers.dashboard.middlewares=auth"
      - "traefik.http.middlewares.auth.basicauth.users=admin:$$2y$$05$$...your-hash..."
```

3. **Redeploy stack in Portainer**

**Verification:**

- Access `https://traefik.yourdomain.com`
- Should prompt for username/password
- Login with your credentials

### Additional Security Measures

**Docker socket permissions:**

- Traefik requires read access to `/var/run/docker.sock`
- This grants container management privileges
- Consider Docker socket proxy for additional isolation in high-security environments

**Network isolation:**

- Consider creating dedicated Docker networks for prod/dev environments
- Prevents cross-environment container communication

## Git Hook Modification (Next Steps)

**Current approach (needs replacement):**

```bash
update_apache_proxy() {
    # Modifies Apache config
    # Requires sudo and Apache reload
    # Creates downtime window
}
```

**Traefik approach:**

```bash
deploy_environment() {
    local env=$1
    local container_name="app-${env}-${TIMESTAMP}"
    local image_tag="app:${env}-${TIMESTAMP}"
    local port=$(find_free_port "$env")

    # Build and start container with Traefik labels
    docker run -d --name "$container_name" --restart always \
        --label "traefik.enable=true" \
        --label "traefik.http.routers.app-${env}.entrypoints=${env}" \
        --label "traefik.http.services.app-${env}.loadbalancer.server.port=3000" \
        "$image_tag"

    # Health check
    wait_for_health_check "$port"

    # Traefik automatically routes traffic to healthy container
    # No config changes needed!

    # Cleanup old containers (keep last 3)
    cleanup_old_containers "$env"
}
```

**Key differences:**

- No Apache config modification
- No sudo required
- Traefik discovers containers automatically
- Zero-downtime container swapping

## Lessons Learned

### Certbot Behavior

- `certbot --apache` automatically detects VirtualHosts
- When VirtualHost for a domain doesn't exist, certbot prompts for assignment
- May add `ServerAlias` entries to existing VirtualHosts (undesirable)
- **Best practice:** Create VirtualHost structure BEFORE running certbot

### Apache Configuration Management

- Separate VirtualHosts per subdomain for clarity
- Avoid `ServerAlias` for unrelated services
- Use consistent formatting and comments
- Test with `apache2ctl configtest` before reload

### Traefik Service Discovery

- Docker labels are the source of truth
- `exposedbydefault=false` prevents accidental exposure
- Explicit `traefik.enable=true` required per container
- Label syntax must be exact (case-sensitive)

### Production Readiness Checklist

- ✅ All management interfaces behind authentication
- ✅ SSL certificates for all domains
- ✅ HTTP to HTTPS redirects configured
- ✅ Separate VirtualHosts for logical separation
- ✅ Health checks before traffic routing
- ✅ Container cleanup strategy (retention policy)
- ✅ Monitoring and logging configured

## Troubleshooting

### Port Already Allocated
**Error:** `Bind for 0.0.0.0:3000 failed: port is already allocated`

**Solution:**

```bash
# Find what's using the port
docker ps | grep ":3000"
netstat -tlnp | grep :3000

# Stop conflicting container
docker stop <container_id>
```

### Traefik Not Routing to Container
**Check:**

1. Container has `traefik.enable=true` label
2. Container is on same Docker network as Traefik
3. Entrypoint name matches in labels and Traefik config
4. Service port in labels matches actual container port

**Debug:**

```bash
# Check container labels
docker inspect <container_name> | grep -A 10 Labels

# Check Traefik logs
docker logs traefik-proxy

# Access Traefik dashboard to see registered services
```

### SSL Certificate Issues
**Symptom:** Browser shows certificate warning

**Check:**

```bash
# Verify certificate includes all domains
certbot certificates

# Check Apache VirtualHost uses correct certificate path
grep -A 5 "ServerName yourdomain.com" /etc/apache2/sites-available/*ssl.conf
```

## References

- [Traefik Docker Provider Documentation](https://doc.traefik.io/traefik/providers/docker/)
- [Let's Encrypt Best Practices](https://letsencrypt.org/docs/)
- [Apache Virtual Host Documentation](https://httpd.apache.org/docs/current/vhosts/)
- [Portainer Stacks Documentation](https://docs.portainer.io/user/docker/stacks)

## Next Implementation Steps

1. **Secure Traefik Dashboard** - Implement BasicAuth as described in Security section
2. **Modify Git Hook** - Replace Apache config updates with Traefik labels
3. **Test Deployment Flow** - Deploy to dev environment first
4. **Implement Monitoring** - Health checks, logging, alerts
5. **Document Rollback Procedure** - How to revert to previous container
6. **Backup Strategy** - Container images, configurations, data volumes
