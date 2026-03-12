# Git Based Deployments

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=5 orderedList=false} -->

<!-- code_chunk_output -->

- [Git-Based Deployment System with Automatic Rollback](#git-based-deployment-system-with-automatic-rollback)
  - [Overview](#overview)
  - [Problem Statement](#problem-statement)
    - [What We're Solving](#what-were-solving)
    - [Why This Solution](#why-this-solution)
  - [Architecture](#architecture)
    - [Component Flow](#component-flow)
    - [Key Design Decisions](#key-design-decisions)
  - [Deployment Flow](#deployment-flow)
    - [Normal Deployment Sequence](#normal-deployment-sequence)
    - [Rollback on Failure](#rollback-on-failure)
  - [Critical Edge Case: No Previous Container](#critical-edge-case-no-previous-container)
    - [The Problem](#the-problem)
    - [Solution: Fallback to Last Stopped Container](#solution-fallback-to-last-stopped-container)
  - [Container Cleanup Strategy](#container-cleanup-strategy)
    - [Why Cleanup Matters](#why-cleanup-matters)
    - [Implementation](#implementation)
  - [Security Considerations](#security-considerations)
    - [Environment Variables Management](#environment-variables-management)
    - [File Permissions](#file-permissions)
  - [Branch-Based Environments](#branch-based-environments)
    - [Pattern](#pattern)
    - [Benefits](#benefits)
    - [Configuration Differences](#configuration-differences)
  - [Documentation-Only Push Optimization](#documentation-only-push-optimization)
    - [Problem](#problem)
    - [Solution](#solution)
  - [Complete Deployment Script Template](#complete-deployment-script-template)
  - [Lessons Learned](#lessons-learned)
    - [Key Insights](#key-insights)
    - [Common Pitfalls](#common-pitfalls)
    - [Monitoring and Maintenance](#monitoring-and-maintenance)
    - [What to Monitor](#what-to-monitor)
    - [Regular Maintenance Tasks](#regular-maintenance-tasks)
    - [Testing the Deployment System](#testing-the-deployment-system)
    - [Pre-Production Testing](#pre-production-testing)
    - [Verification Checklist](#verification-checklist)
  - [Conclusion](#conclusion)

<!-- /code_chunk_output -->


## Git-Based Deployment System with Automatic Rollback

### Overview

This document describes a production-ready deployment system using Git post-receive hooks with Docker containers and automatic rollback capabilities. The system provides zero-downtime deployments with health checks and automatic recovery from failed deployments.

### Problem Statement

#### What We're Solving

Traditional deployment approaches have several issues:

- **Manual deployments**: Error-prone, time-consuming
- **No rollback mechanism**: Failed deployments leave services down
- **Configuration drift**: Production differs from development
- **Long downtime**: Services unavailable during updates

#### Why This Solution

Git post-receive hooks provide:

- **Automatic deployments**: Push to Git triggers deployment
- **Version control**: Every deployment is tracked
- **Rollback safety**: Previous container preserved until new one passes health checks
- **Environment isolation**: Separate production/development branches

### Architecture

#### Component Flow

```
Git Push → Post-Receive Hook → Build → Docker Container → Health Check
                                           ↓ (fail)
                                       Rollback to Previous Container
```

#### Key Design Decisions

**1. Stop-Then-Start Approach**

**Why not run both containers simultaneously?**

- Reverse proxy (Traefik/nginx) sees both containers with same routing rules
- Load balancing between old and new creates inconsistent behavior
- Database migrations could cause conflicts

**Trade-off**: Brief downtime (15 seconds) vs. deployment consistency

**2. Container Naming Convention**

Format: `{app}-{environment}-{timestamp}`

**Example**: `myapp-production-20250920-143022`

**Benefits**:

- Unique identification for each deployment
- Easy chronological sorting
- Enables keeping last N deployments for emergency rollback

**3. Health Check Strategy**

**Configuration**: 5 attempts × 3 seconds = 15 seconds timeout

**Why this timing?**

- Modern application frameworks start quickly (5-10 seconds)
- Network delays and initialization
- Balance between patience and fast-fail

**Implementation**:

```bash
wait_for_health_check() {
    local target_url=$1
    local max_attempts=5
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "http://${target_url}" > /dev/null 2>&1; then
            return 0
        fi
        sleep 3
        ((attempt++))
    done

    return 1
}
```

### Deployment Flow

#### Normal Deployment Sequence

1. **Identify Current Container**

   ```bash
   current_container=$(docker ps --filter name="app-env-" --format "{{.Names}}" | head -1)
   ```

2. **Stop Current Container**

   ```bash
   docker stop $current_container
   ```

3. **Build New Application**

   ```bash
   npm install
   npm run build
   docker build -t new-image .
   ```

4. **Start New Container**

   ```bash
   docker run -d --name new-container new-image
   ```

5. **Health Check**
   - Test endpoint accessibility
   - Verify expected responses

6. **Cleanup on Success**

   ```bash
   docker rm $current_container
   ```

#### Rollback on Failure

1. **Detect Health Check Failure**

2. **Stop Failed Container**

   ```bash
   docker stop new-container
   docker rm new-container
   ```

3. **Restart Previous Container**

   ```bash
   docker start $current_container
   ```

4. **Exit with Error**
   - Prevents further deployments
   - Preserves failed state for debugging

### Critical Edge Case: No Previous Container

#### The Problem

**Scenario**:

1. First deployment fails → no running container
2. Second deployment fails → `current_container=""` → no rollback possible
3. **Result**: Service completely down

#### Solution: Fallback to Last Stopped Container

```bash
# Try to find running container
current_container=$(docker ps --filter name="app-env-" --format "{{.Names}}" | head -1)

# If no running container, find last stopped one
if [[ -z "$current_container" ]]; then
    current_container=$(docker ps -a \
        --filter name="app-env-" \
        --format "{{.CreatedAt}}\t{{.Names}}" \
        | sort -k1 -r \
        | head -1 \
        | awk '{print $2}')

    echo "No running container, using last stopped: ${current_container}"
fi
```

**Key Insight**: Even stopped containers can be restarted to restore service.

### Container Cleanup Strategy

#### Why Cleanup Matters

Each deployment creates:

- Docker image (~500MB - 2GB)
- Stopped container (~100MB metadata)
- Build artifacts

**Without cleanup**: Disk fills up, deployments fail.

#### Implementation

**Keep Last 3 Containers Per Environment**

```bash
cleanup_old_containers() {
    local env=$1

    # Get all containers for environment, sorted by creation time
    local containers_to_remove=$(docker ps -a \
        --filter name="app-${env}-" \
        --format "{{.CreatedAt}}\t{{.Names}}" \
        | sort -k1 \
        | head -n -3 \
        | awk '{print $2}')

    if [[ -n "$containers_to_remove" ]]; then
        echo "$containers_to_remove" | xargs -r docker rm -f
    fi
}
```

**Why keep 3?**

- Current running container
- Previous container (immediate rollback)
- One more for emergency (2 deployments back)

### Security Considerations

#### Environment Variables Management

**Problem**: Sensitive data (database passwords, API keys) in deployment scripts

**Bad Practice**:

```bash
docker run --env DATABASE_URL="postgresql://user:PASSWORD@host/db"
```

**Why it's bad**:

- Visible in Git history
- Exposed in process lists
- Logged in deployment outputs

**Solution Options**:

**Option A: Environment File (Recommended)**

```bash
# /etc/app/secrets.env
DATABASE_URL=postgresql://user:PASSWORD@host/db

# Deployment script
docker run --env-file /etc/app/secrets.env app-image
```

**Benefits**:

- File permissions protect secrets (chmod 600)
- Not in Git repository
- Easy to rotate credentials
- Standard practice

**Option B: Docker Secrets (For Docker Swarm/Compose)**

```yaml
secrets:
  db_password:
    file: ./secrets/db_password.txt

services:
  app:
    secrets:
      - db_password
```

**Option C: Dynamic Reading**

```bash
# Read from secure storage
DB_PASSWORD=$(vault read secret/database/password)
docker run --env "DATABASE_URL=postgresql://user:${DB_PASSWORD}@host/db"
```

#### File Permissions

**Critical paths**:

```bash
# Environment files
chmod 600 /etc/app/secrets.env
chown root:root /etc/app/secrets.env

# Deployment scripts
chmod 700 /path/to/hooks/post-receive
chown git:git /path/to/hooks/post-receive

# SSH keys
chmod 600 ~/.ssh/id_key
```

### Branch-Based Environments

#### Pattern

```bash
while read oldrev newrev refname; do
    branch=$(git rev-parse --symbolic --abbrev-ref $refname)

    if [[ "$branch" == "main" ]]; then
        deploy_environment "production" "main"
    elif [[ "$branch" == "development" ]]; then
        deploy_environment "development" "development"
    else
        echo "Unknown branch: $branch"
        exit 1
    fi
done
```

#### Benefits

- **Production**: Stable, tested code on `main` branch
- **Development**: Testing environment on `development` branch
- **Safety**: No accidental production deployments from feature branches

#### Configuration Differences

**Network Labels** (for reverse proxy routing):

```bash
# Production
--label "proxy.rule=Host(\`app.com\`)"
--label "proxy.entrypoint=production"

# Development
--label "proxy.rule=Host(\`dev.app.com\`)"
--label "proxy.entrypoint=development"
```

### Documentation-Only Push Optimization

#### Problem

Deploying on every push, including documentation updates, wastes resources.

#### Solution

```bash
# Get changed files
CHANGED_FILES=$(git diff-tree -r --name-only --no-commit-id $oldrev..$newrev)

# Define documentation patterns
DOC_PATTERNS="^(README\.md|doc/|docs/|\.md$)"

# Check if only documentation changed
if echo "$CHANGED_FILES" | grep -v -E "$DOC_PATTERNS" | grep -q .; then
    echo "Application files changed, proceeding..."
else
    echo "Only documentation changed, skipping deployment"
    exit 0
fi
```

### Complete Deployment Script Template

```bash
#!/bin/bash

WORK_TREE="/path/to/project"
GIT_DIR="/path/to/repo.git"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

wait_for_health_check() {
    local target_url=$1
    local max_attempts=5
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "http://${target_url}" > /dev/null 2>&1; then
            return 0
        fi
        sleep 3
        ((attempt++))
    done

    return 1
}

cleanup_old_containers() {
    local env=$1
    local containers_to_remove=$(docker ps -a \
        --filter name="app-${env}-" \
        --format "{{.CreatedAt}}\t{{.Names}}" \
        | sort -k1 | head -n -3 | awk '{print $2}')

    if [[ -n "$containers_to_remove" ]]; then
        echo "$containers_to_remove" | xargs -r docker rm -f
    fi
}

deploy_environment() {
    local env=$1
    local branch=$2
    local container_name="app-${env}-${TIMESTAMP}"
    local image_tag="app:${env}-${TIMESTAMP}"

    # Get current running container
    local current_container=$(docker ps \
        --filter name="app-${env}-" \
        --format "{{.Names}}" | head -1)

    # Fallback to last stopped container
    if [[ -z "$current_container" ]]; then
        current_container=$(docker ps -a \
            --filter name="app-${env}-" \
            --format "{{.CreatedAt}}\t{{.Names}}" \
            | sort -k1 -r | head -1 | awk '{print $2}')
    fi

    echo "Rollback target: ${current_container}"

    # Stop current container
    docker ps --filter name="app-${env}-" \
        --format "{{.Names}}" | xargs -r docker stop

    # Checkout and build
    git --git-dir="$GIT_DIR" --work-tree="$WORK_TREE" checkout -f "$branch"
    cd "$WORK_TREE"

    npm install --silent
    npm run build
    docker build -t "$image_tag" .

    # Start new container
    docker run -d --name "$container_name" \
        --restart always \
        --env-file /etc/app/secrets.env \
        "$image_tag"

    # Health check
    local container_ip=$(docker inspect \
        -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' \
        "$container_name")

    if ! wait_for_health_check "${container_ip}:3000"; then
        echo "Deployment failed - Rolling back"

        docker stop "$container_name" 2>/dev/null
        docker rm "$container_name" 2>/dev/null

        if [[ -n "$current_container" ]]; then
            docker start "$current_container"
            echo "Rollback completed"
        else
            echo "CRITICAL: No container for rollback!"
        fi

        exit 1
    fi

    # Success - cleanup
    if [[ -n "$current_container" ]]; then
        docker rm "$current_container"
    fi

    cleanup_old_containers "$env"
    echo "Deployment completed: ${image_tag}"
}

# Main execution
while read oldrev newrev refname; do
    # Skip documentation-only changes
    CHANGED_FILES=$(git diff-tree -r --name-only --no-commit-id $oldrev..$newrev)
    DOC_PATTERNS="^(README\.md|doc/|docs/|\.md$)"

    if ! echo "$CHANGED_FILES" | grep -v -E "$DOC_PATTERNS" | grep -q .; then
        echo "Documentation-only change, skipping deployment"
        exit 0
    fi

    # Deploy based on branch
    branch=$(git rev-parse --symbolic --abbrev-ref $refname)

    case "$branch" in
        main)
            deploy_environment "production" "main"
            ;;
        development)
            deploy_environment "development" "development"
            ;;
        *)
            echo "Unknown branch: $branch"
            exit 1
            ;;
    esac
done
```

### Lessons Learned

#### Key Insights

1. **Always preserve previous state before changes**
   - Get container reference BEFORE stopping
   - Test new deployment BEFORE removing old

2. **Handle edge cases explicitly**
   - No running containers (first deployment failure)
   - Multiple rapid deployments
   - Network timeouts

3. **Health checks are critical**
   - Don't assume successful start means working app
   - Test actual endpoint, not just container status
   - Balance timeout duration

4. **Security over convenience**
   - Never commit secrets to Git
   - Use environment files or secure vaults
   - Audit deployment logs for leaked credentials

5. **Cleanup is not optional**
   - Disk fills up silently
   - Old containers consume resources
   - Automated cleanup prevents manual intervention

#### Common Pitfalls

**Pitfall 1**: Starting new container while old one runs

- **Result**: Load balancing chaos with reverse proxy
- **Solution**: Stop old first, then start new

**Pitfall 2**: Removing old container before health check

- **Result**: No rollback option if deployment fails
- **Solution**: Keep old container until new one verified

**Pitfall 3**: Hardcoded secrets in scripts

- **Result**: Security breach when repository shared/leaked
- **Solution**: Environment files with proper permissions

**Pitfall 4**: No fallback container logic

- **Result**: Service permanently down after multiple failures
- **Solution**: Check stopped containers if no running ones

#### Monitoring and Maintenance

#### What to Monitor

**Deployment Metrics**:

- Success/failure rate
- Deployment duration
- Rollback frequency

**System Resources**:

- Disk space (images + containers)
- Container count per environment
- Network connectivity to services

**Health Indicators**:

- Response times after deployment
- Error rates post-deployment
- Container restart counts

#### Regular Maintenance Tasks

**Weekly**:

- Review deployment logs
- Check disk space usage
- Verify backup containers exist

**Monthly**:

- Audit environment files
- Rotate credentials
- Clean up old Docker images: `docker image prune -a`

**Quarterly**:

- Review and update health check criteria
- Test rollback procedures
- Update deployment scripts

#### Testing the Deployment System

#### Pre-Production Testing

**1. Test Successful Deployment**

```bash
# Make trivial change, push, verify success
git commit --allow-empty -m "Test deployment"
git push origin development
```

**2. Test Rollback Mechanism**

```bash
# Introduce intentional error
# Verify old container restarted
# Check service accessibility
```

**3. Test Edge Cases**

```bash
# Stop all containers manually
# Push new deployment
# Verify fallback to stopped container works
```

#### Verification Checklist

- [ ] Service accessible after deployment
- [ ] Old container removed on success
- [ ] Failed deployment triggers rollback
- [ ] Service restored after rollback
- [ ] No secrets exposed in logs
- [ ] Cleanup removes old containers
- [ ] Documentation-only pushes skip deployment

### Conclusion

This deployment system provides:

- **Reliability**: Automatic rollback on failures
- **Safety**: No manual intervention during normal operation
- **Auditability**: Git history tracks all deployments
- **Maintainability**: Clear, documented procedures

**Success Criteria**: Service never goes down for more than health check timeout duration (15 seconds), even with failed deployments.

The system balances simplicity with robustness, making it suitable for small to medium applications where brief downtime is acceptable but extended outages are not.
