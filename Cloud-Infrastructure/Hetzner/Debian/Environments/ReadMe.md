# New Environment Setup

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=5 orderedList=false} -->

<!-- code_chunk_output -->

- [Overview](#overview)
  - [Purpose and Context](#purpose-and-context)
  - [Architecture Context](#architecture-context)
- [Architecture Components](#architecture-components)
  - [1. Network Architecture](#1-network-architecture)
  - [2. Database Strategy](#2-database-strategy)
  - [3. Container Lifecycle](#3-container-lifecycle)
- [Implementation Steps](#implementation-steps)
  - [Step 1: Infrastructure Planning](#step-1-infrastructure-planning)
  - [Step 2: Traefik Configuration](#step-2-traefik-configuration)
  - [Step 3: Apache SSL Configuration](#step-3-apache-ssl-configuration)
  - [Step 4: SSL Certificate Update](#step-4-ssl-certificate-update)
  - [Step 5: Database Container Setup](#step-5-database-container-setup)
  - [Step 6: Environment Configuration](#step-6-environment-configuration)
  - [Step 7: Git Hook Modification](#step-7-git-hook-modification)
  - [Step 8: Maintenance Container Support](#step-8-maintenance-container-support)
  - [Step 9: Git Branch Creation](#step-9-git-branch-creation)
  - [Step 10: Manual Maintenance Container Start](#step-10-manual-maintenance-container-start)
- [Deployment Workflow](#deployment-workflow)
  - [Automated Deployment Process](#automated-deployment-process)
  - [Manual Operations](#manual-operations)
- [Key Architectural Decisions and Lessons Learned](#key-architectural-decisions-and-lessons-learned)
  - [1. Persistent vs. Ephemeral Databases](#1-persistent-vs-ephemeral-databases)
  - [2. Priority-Based Routing for Maintenance Pages](#2-priority-based-routing-for-maintenance-pages)
  - [3. Network Isolation](#3-network-isolation)
  - [4. Application Binding Configuration](#4-application-binding-configuration)
  - [5. Health Check Strategy](#5-health-check-strategy)
  - [6. Container Cleanup Strategy](#6-container-cleanup-strategy)
- [Data Validation and Review Workflow](#data-validation-and-review-workflow)
  - [Validation Architecture](#validation-architecture)
  - [Review Process](#review-process)
  - [Future Enhancement: Granular Undo](#future-enhancement-granular-undo)
- [Operational Checklist](#operational-checklist)
  - [Setting Up a New Review Environment](#setting-up-a-new-review-environment)
  - [Regular Maintenance](#regular-maintenance)
- [Troubleshooting Guide](#troubleshooting-guide)
  - [Issue: 502 Bad Gateway from Traefik](#issue-502-bad-gateway-from-traefik)
  - [Issue: SSL Certificate Not Covering Review Subdomain](#issue-ssl-certificate-not-covering-review-subdomain)
  - [Issue: Database Connection Failures](#issue-database-connection-failures)
  - [Issue: Maintenance Page Stuck After Deployment](#issue-maintenance-page-stuck-after-deployment)
- [Security Considerations](#security-considerations)
  - [Database Isolation](#database-isolation)
  - [Container Security](#container-security)
  - [Network Security](#network-security)
- [Summary](#summary)

<!-- /code_chunk_output -->


## Overview

This document describes the architecture and setup process for a dedicated **review environment** in a multi-environment deployment pipeline. The review environment serves as an isolated staging area where untrusted or new team members can work with a copy of production data. All changes are validated before being merged into production.

### Purpose and Context

**Why a Review Environment?**

In scenarios where you need to onboard new team members or work with contractors whose reliability is not yet established, allowing direct access to production data poses risks. The review environment solves this by:

1. **Providing isolation**: New team members work on a complete copy of production data without affecting live systems
2. **Enabling validation**: Content changes can be reviewed and validated before being merged into production
3. **Maintaining audit trails**: All changes are logged and can be inspected before approval
4. **Reducing risk**: Mistakes or malicious changes are contained within the review environment

**Use Case:**

The primary use case is content management rather than code or schema changes. Team members use the application's user interface to modify data (customer records, content, etc.). Automated validation filters check for completeness and correctness, but human review is still required before production integration.

### Architecture Context

The existing infrastructure uses:

- **Traefik** as a reverse proxy with label-based routing
- **Apache** as the frontend SSL termination point
- **Docker** for containerization
- **Git hooks** for automated deployment
- **PostgreSQL** with PostGIS for database storage

The system already has three environments:

- **Production** (`main` branch): Live production code and database
- **Development** (`development` branch): Development code using production database
- **Experimental** (`experimental` branch): Experimental code with its own database (periodically synced from production)

The review environment follows the experimental pattern: isolated code and database, but focused on content validation rather than feature development.

---

## Architecture Components

### 1. Network Architecture

**Traefik Reverse Proxy:**

- Listens on multiple ports, each representing an environment entry point
- Uses Docker labels for automatic service discovery
- Routes traffic based on hostname rules
- Runs in the `traefik-proxy_default` Docker network

**Apache Frontend:**

- Handles SSL/TLS termination with Let's Encrypt certificates
- Forwards HTTPS requests to Traefik's appropriate port
- Manages domain-based routing

**Flow:**

```
Internet → Apache:443 (SSL) → Traefik:PORT → App Container:3000
```

### 2. Database Strategy

**Persistent vs. Ephemeral Databases:**

For the review environment, we use a **persistent database strategy**:

- Single long-running PostgreSQL container (`postgres-review`)
- Named Docker volume for data persistence
- Manual synchronization from production on-demand
- Independent from application container lifecycle

**Alternative (Not Used):**
Ephemeral databases that are created/destroyed with each deployment work for short-lived testing but not for review workflows spanning days or weeks.

### 3. Container Lifecycle

**Application Containers:**

- Named with timestamp: `app-env-YYYYMMDD-HHMMSS`
- Rebuilt and deployed on each git push
- Old containers kept for rollback (last 3 deployments)
- Zero-downtime deployment: stop old, start new, verify health

**Database Containers:**

- Long-lived, persistent
- Created once, runs continuously
- Updated independently from app containers
- Backed by named Docker volumes

**Maintenance Containers:**

- Low-priority Traefik routes (priority=5 vs app priority=10)
- Display maintenance page during deployments
- Same container image reused across all environments
- Started before stopping the old app container

---

## Implementation Steps

### Step 1: Infrastructure Planning

**Decisions Required:**

1. Choose subdomain (e.g., `review.yourdomain.com`)
2. Select Traefik port (must be unique across environments)
3. Define database synchronization strategy
4. Determine restart/rollback policies

**Port Allocation Example:**

- Production: 3000
- Development: 3100
- Experimental: 3200
- Review: 3300 (next available)

### Step 2: Traefik Configuration

**Update Traefik Stack in Portainer:**

Add new port binding:

```yaml
ports:
  - "3300:3300"  # Review environment
```

Add new entrypoint:

```yaml
command:
  - --entrypoints.review.address=:3300
```

**Key Concepts:**

- **Entrypoint**: Named entry point into Traefik (maps to a port)
- **Router**: Rules that match incoming requests to services
- **Service**: Backend container(s) that handle requests
- **Priority**: Higher priority routes match first (app=10, maintenance=5)

### Step 3: Apache SSL Configuration

**Add VirtualHost for Review Subdomain:**

```apache
<VirtualHost *:443>
  ServerName review.yourdomain.com
  ServerAdmin admin@yourdomain.com
  ProxyPreserveHost On
  ProxyPass / http://localhost:3300/
  ProxyPassReverse / http://localhost:3300/

  ErrorLog ${APACHE_LOG_DIR}/error.log
  CustomLog ${APACHE_LOG_DIR}/access.log combined

  Include /etc/letsencrypt/options-ssl-apache.conf
  SSLCertificateFile /etc/letsencrypt/live/yourdomain.com/fullchain.pem
  SSLCertificateKeyFile /etc/letsencrypt/live/yourdomain.com/privkey.pem
</VirtualHost>
```

**Validate and Reload:**

```bash
sudo apache2ctl configtest
sudo systemctl reload apache2
```

### Step 4: SSL Certificate Update

**Extend Let's Encrypt Certificate:**

If using explicit domain listing (not wildcard):

```bash
sudo certbot --apache \
  -d yourdomain.com \
  -d www.yourdomain.com \
  -d dev.yourdomain.com \
  -d exp.yourdomain.com \
  -d review.yourdomain.com \
  --expand
```

**Troubleshooting:**

- If certain subdomains fail DNS validation, remove them temporarily
- Wildcard certificates (`*.yourdomain.com`) avoid this issue but require DNS-01 challenge
- Check DNS propagation if validation fails

### Step 5: Database Container Setup

**Create Persistent Database Container:**

```bash
docker run -d \
  --name app-postgres-review \
  --network traefik-proxy_default \
  --restart unless-stopped \
  -e POSTGRES_DB=yourdb \
  -e POSTGRES_USER=dbuser \
  -e POSTGRES_PASSWORD='secure_password' \
  -v postgres_review_data:/var/lib/postgresql/data \
  postgis/postgis:17-3.5
```

**Key Decisions:**

- **Network**: Must be same network as Traefik for app containers to reach it
- **Restart Policy**: `unless-stopped` ensures it survives reboots
- **Volume**: Named volume for data persistence across container restarts
- **Image**: Use same version as production for compatibility

**Initial Data Sync:**

```bash
# Export from production
docker exec postgres-prod pg_dump -U dbuser -d yourdb -Fc -f /tmp/prod_dump.custom

# Copy dump file
docker cp postgres-prod:/tmp/prod_dump.custom /tmp/
docker cp /tmp/prod_dump.custom postgres-review:/tmp/

# Restore to review
docker exec postgres-review pg_restore -U dbuser -d yourdb -v --clean --if-exists /tmp/prod_dump.custom

# Cleanup
rm /tmp/prod_dump.custom
docker exec postgres-prod rm /tmp/prod_dump.custom
docker exec postgres-review rm /tmp/prod_dump.custom
```

### Step 6: Environment Configuration

**Create Environment File:**

Location: `/etc/yourapp/app-review.env`

```bash
DATABASE_URL=postgresql://dbuser:password@postgres-review:5432/yourdb
API_KEY=your_api_key
ENCRYPTION_KEY=your_encryption_key
# ... other environment variables
```

**Critical Detail:**
The `DATABASE_URL` hostname must match the Docker container name (`postgres-review`). Docker's internal DNS resolves container names to IP addresses within the same network.

### Step 7: Git Hook Modification

**Extend post-receive Hook:**

Add branch detection (in the branch matching section):

```bash
elif [[ "$branch" == "review" ]]; then
    deploy_environment "review" "review"
```

Add container deployment logic (in the `deploy_environment` function):

```bash
elif [[ "$env" == "review" ]]; then
    docker run -d --name "$container_name" --restart always \
        --network traefik-proxy_default \
        --env-file /etc/yourapp/app-review.env \
        --mount type=bind,source=/path/to/shared/volume,target=/app/data \
        --label "traefik.enable=true" \
        --label "traefik.http.routers.app-review.rule=Host(\`review.yourdomain.com\`)" \
        --label "traefik.http.routers.app-review.priority=10" \
        --label "traefik.http.routers.app-review.entrypoints=review" \
        --label "traefik.http.routers.app-review.service=${container_name}" \
        --label "traefik.http.services.${container_name}.loadbalancer.server.port=3000" \
        "$image_tag"
fi
```

**Label Breakdown:**

- `traefik.enable=true`: Tells Traefik to discover this container
- `traefik.http.routers.X.rule`: Hostname matching rule
- `traefik.http.routers.X.priority=10`: Higher than maintenance (5)
- `traefik.http.routers.X.entrypoints=review`: Uses the `review` entrypoint (port 3300)
- `traefik.http.routers.X.service`: Links router to service
- `traefik.http.services.X.loadbalancer.server.port=3000`: Container's internal port

### Step 8: Maintenance Container Support

**Update Maintenance Deployment Script:**

Add review to the environment validation:

```bash
if [[ "$ENV" != "production" && "$ENV" != "development" && "$ENV" != "experimental" && "$ENV" != "review" ]]; then
    echo "Usage: $0 [production|development|experimental|review]"
    exit 1
fi
```

Add review container block:

```bash
elif [[ "$ENV" == "review" ]]; then
    docker run -d --name "$CONTAINER_NAME" --restart always \
        --network traefik-proxy_default \
        --label "traefik.enable=true" \
        --label "traefik.http.routers.app-review-maintenance.rule=Host(\`review.yourdomain.com\`)" \
        --label "traefik.http.routers.app-review-maintenance.entrypoints=review" \
        --label "traefik.http.routers.app-review-maintenance.priority=5" \
        --label "traefik.http.routers.app-review-maintenance.service=${CONTAINER_NAME}" \
        --label "traefik.http.services.${CONTAINER_NAME}.loadbalancer.server.port=3000" \
        "$IMAGE_NAME"
fi
```

**Priority System:**

- App container: priority=10 (takes precedence when running)
- Maintenance container: priority=5 (fallback when app is down)
- During deployment: old app stops → Traefik routes to maintenance → new app starts → Traefik switches back

### Step 9: Git Branch Creation

**Create Review Branch:**

```bash
cd /path/to/git/repo.git
git branch review main
git branch -a  # Verify
```

The branch tracks the same code as production (main) but deploys to the review environment with a separate database.

### Step 10: Manual Maintenance Container Start

**Start Initial Maintenance Container:**

```bash
docker run -d --name app-review-maintenance --restart always \
    --network traefik-proxy_default \
    --label "traefik.enable=true" \
    --label "traefik.http.routers.app-review-maintenance.rule=Host(\`review.yourdomain.com\`)" \
    --label "traefik.http.routers.app-review-maintenance.entrypoints=review" \
    --label "traefik.http.routers.app-review-maintenance.priority=5" \
    --label "traefik.http.routers.app-review-maintenance.service=app-review-maintenance" \
    --label "traefik.http.services.app-review-maintenance.loadbalancer.server.port=3000" \
    maintenance-image
```

This ensures the maintenance page is available before the first app deployment.

---

## Deployment Workflow

### Automated Deployment Process

1. **Developer pushes to review branch:**

   ```bash
   git push origin review
   ```

2. **Git hook triggers:**
   - Checks out review branch to working directory
   - Starts maintenance container (if not running)
   - Stops current review app container
   - Waits for Traefik to switch to maintenance page
   - Builds new Docker image with timestamp tag
   - Starts new container with Traefik labels
   - Waits for health check to pass
   - Removes old app container
   - Cleans up old images (keeps last 3)

3. **Health Check Validation:**
   - Inspects container to get internal IP
   - Curls health endpoint directly (bypasses Traefik)
   - Retries up to 5 times with 3-second delays
   - On failure: stops new container, restarts old container (rollback)

4. **Result:**
   - Successful: New version live at `https://review.yourdomain.com`
   - Failed: Automatic rollback to previous version

### Manual Operations

**Database Sync (Production → Review):**

When production data needs to be refreshed in review:

```bash
# 1. Communicate with team members (review environment will be unavailable)
# 2. Stop review app container
docker stop $(docker ps --filter name=app-review- --format "{{.Names}}" | grep -v maintenance)

# 3. Perform database sync (see Step 5)
# 4. Restart review app or trigger new deployment
git commit --allow-empty -m "Trigger redeploy after DB sync"
git push origin review
```

**Rollback to Previous Deployment:**

```bash
# List recent containers
docker ps -a --filter name=app-review- --format "table {{.Names}}\t{{.Status}}\t{{.CreatedAt}}"

# Stop current
docker stop $(docker ps --filter name=app-review- --format "{{.Names}}" | grep -v maintenance | head -1)

# Start previous
docker start app-review-TIMESTAMP
```

---

## Key Architectural Decisions and Lessons Learned

### 1. Persistent vs. Ephemeral Databases

**Decision: Persistent**

For review workflows spanning days or weeks, ephemeral databases would lose work between deployments. Persistent databases with manual sync provide:

- Work continuity across deployments
- Control over when production data is refreshed
- Audit trail preservation

**Trade-off:**
Manual sync responsibility rests with the administrator.

### 2. Priority-Based Routing for Maintenance Pages

**Problem:**
Zero-downtime deployments are impossible with label-based routing. When a new container starts with identical labels, Traefik load-balances between old and new versions, causing user experience inconsistencies.

**Solution:**
Accept planned downtime (~15 seconds) with a maintenance page:

- Maintenance container runs continuously with priority=5
- App container has priority=10 (takes precedence when healthy)
- During deployment: app stops → maintenance shows → new app starts → traffic switches

**Why This Works:**
Users see a consistent "under maintenance" message rather than randomly switching between versions.

### 3. Network Isolation

**Lesson Learned:**
Containers must be in the same Docker network as Traefik for routing to work.

**Initial Problem:**
Containers started in the default bridge network couldn't be reached by Traefik (gateway timeouts).

**Solution:**
Always specify `--network traefik-proxy_default` when starting containers.

### 4. Application Binding Configuration

**Subtle Issue:**
Applications binding to `localhost:3000` are only accessible via the container's loopback interface.

**Manifestation:**

- Health checks passed (they used container IP directly)
- Traefik routing failed (tried to connect via network interface)

**Solution:**
Applications must bind to `0.0.0.0:3000` to accept connections from other containers.

### 5. Health Check Strategy

**Challenge:**
Published ports are no longer used (Traefik handles routing internally).

**Solution:**

- Use `docker inspect` to get container's internal IP
- Health check directly against IP:PORT
- Validate before making container publicly available via Traefik

### 6. Container Cleanup Strategy

**Initial Problem:**
Sorting containers alphabetically by name removed newer deployments when timestamps caused unexpected ordering.

**Solution:**
Sort by creation time instead of name. Keep last N containers for rollback capability.

```bash
docker ps -a --filter name=app-env- --format "{{.CreatedAt}}\t{{.Names}}" | sort -k1 | head -n -3
```

---

## Data Validation and Review Workflow

### Validation Architecture

The review environment focuses on **content validation**, not code or schema changes. Team members modify data through the application UI, and automated systems validate completeness.

**Automated Validation Filters:**

- Check for required fields (e.g., company contact person must exist)
- Validate data format and types
- External API verification (e.g., check if company exists via third-party API)
- Audit log generation for all changes

**What Isn't Validated Automatically:**

- Subjective correctness (e.g., "Markus" vs "Marcus")
- Content quality
- Business logic appropriateness

### Review Process

1. **Data Entry**: Team member modifies records via UI
2. **Automated Checks**: Validation filters run in real-time or on-save
3. **Review Dashboard**: Administrator sees filtered view of:
   - Records with validation errors (red flags)
   - Recently modified records (from audit logs)
   - Records pending approval
4. **Manual Review**: Administrator inspects changes, comparing review vs. production data
5. **Approval**: Validated changes are merged to production database

### Future Enhancement: Granular Undo

**Challenge:**
A single entity (e.g., customer record) may have multiple fields updated, with some correct and some incorrect.

**Requirement:**
Field-level rollback rather than entity-level rollback.

**Design Considerations:**

- UI: Show diff view (review vs. production) with per-field checkboxes
- Backend: Track changes at field level in audit logs
- Database: Selective restoration of specific columns
- Scope: Time-bound undo window (e.g., changes within last 7 days)

**Implementation Status:**
Not yet implemented; noted for future development.

---

## Operational Checklist

### Setting Up a New Review Environment

- [ ] Choose unique subdomain
- [ ] Allocate unique Traefik port
- [ ] Update Traefik stack (port binding + entrypoint)
- [ ] Add Apache VirtualHost configuration
- [ ] Validate and reload Apache
- [ ] Extend SSL certificate with certbot
- [ ] Create persistent database container
- [ ] Create environment configuration file
- [ ] Extend post-receive git hook (branch detection + deployment block)
- [ ] Update maintenance deployment script
- [ ] Create git branch
- [ ] Start initial maintenance container
- [ ] Test deployment with `git push origin review`
- [ ] Verify HTTPS access
- [ ] Perform initial database sync
- [ ] Document database sync schedule

### Regular Maintenance

- [ ] Monitor certificate expiration (Let's Encrypt auto-renewal)
- [ ] Sync production data to review (on-demand or scheduled)
- [ ] Review and approve pending changes
- [ ] Clean up old container images periodically
- [ ] Backup review database before major changes
- [ ] Update team on review environment availability during syncs

---

## Troubleshooting Guide

### Issue: 502 Bad Gateway from Traefik

**Symptoms:**
Traefik returns 502 when accessing review subdomain.

**Possible Causes:**

1. App container not in correct Docker network
2. App binding to localhost instead of 0.0.0.0
3. App container not started or unhealthy
4. Traefik labels incorrect

**Diagnosis:**

```bash
# Check container network
docker inspect app-review-TIMESTAMP | grep -A 10 Networks

# Check if app is listening
docker exec app-review-TIMESTAMP netstat -tlnp

# Check Traefik routing
curl http://traefik.yourdomain.com/api/http/routers | jq '.[] | select(.name | contains("review"))'
```

### Issue: SSL Certificate Not Covering Review Subdomain

**Symptoms:**
Browser shows SSL error when accessing review subdomain.

**Solution:**

```bash
# Expand certificate
sudo certbot --apache -d yourdomain.com -d review.yourdomain.com --expand

# Verify
sudo certbot certificates
```

### Issue: Database Connection Failures

**Symptoms:**
App logs show "could not connect to database" errors.

**Possible Causes:**

1. Database container not running
2. Wrong hostname in DATABASE_URL
3. App and database in different networks
4. Database credentials incorrect

**Diagnosis:**

```bash
# Check database is running
docker ps --filter name=postgres-review

# Test connection from app container
docker exec app-review-TIMESTAMP pg_isready -h postgres-review -U dbuser

# Check network connectivity
docker exec app-review-TIMESTAMP ping postgres-review
```

### Issue: Maintenance Page Stuck After Deployment

**Symptoms:**
Maintenance page visible even though app container is healthy.

**Possible Causes:**

1. App container priority not higher than maintenance (should be 10 vs 5)
2. App container not exposing correct port
3. Health check passing but app not actually serving traffic

**Solution:**

```bash
# Check priorities
docker inspect app-review-TIMESTAMP | grep -i priority
docker inspect app-review-maintenance | grep -i priority

# Verify app is serving
curl -I http://$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' app-review-TIMESTAMP):3000
```

---

## Security Considerations

### Database Isolation

**Current State:**
Review database contains exact copy of production data.

**Risks:**

- Untrusted team members have access to real customer data
- No data anonymization or sanitization

**Mitigations:**

- Access restricted to review environment only
- All changes logged in audit trail
- Manual approval required before production merge
- Network isolation (review containers cannot access production database)

**Future Enhancement:**
Implement data anonymization script that:

- Replaces real names with generated names
- Masks email addresses and phone numbers
- Preserves referential integrity and data relationships
- Runs as part of production → review sync process

### Container Security

**Best Practices Implemented:**

- Containers run with restart policies to survive crashes
- No privileged containers
- Limited bind mounts (only necessary volumes)
- Environment variables stored in files (not in git)
- Secrets management via encrypted files (GPG in docker-compose example)

**Recommendations:**

- Regularly update base images (PostgreSQL, Nginx, app dependencies)
- Scan images for vulnerabilities
- Implement container resource limits (CPU, memory)
- Use Docker secrets for sensitive data in production

### Network Security

**Current Architecture:**

- SSL/TLS termination at Apache
- Internal container communication unencrypted (within Docker network)
- Traefik dashboard protected by BasicAuth

**Considerations:**

- Docker network provides isolation from host network
- Container-to-container traffic trusted within private network
- Public internet → Apache → Traefik → App chain encrypted end-to-end

---

## Summary

The review environment provides a sandboxed area for untrusted or new team members to work with production data without risk. Key principles:

1. **Isolation**: Separate database and containers
2. **Persistence**: Database survives deployments
3. **Validation**: Automated checks + manual review
4. **Auditability**: All changes logged
5. **Control**: Manual approval before production merge

The architecture balances simplicity (reuses existing Traefik/Apache infrastructure) with safety (complete data isolation). The ~15 second planned downtime during deployments is acceptable for a review environment that isn't customer-facing.

Future enhancements include data anonymization, granular undo mechanisms, and automated production sync workflows.
