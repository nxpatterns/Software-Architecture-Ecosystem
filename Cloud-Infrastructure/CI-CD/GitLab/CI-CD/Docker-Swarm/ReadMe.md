# Docker Swarm CI/CD Pipeline Optimization Guide

## Context

When deploying applications with Docker Swarm in CI/CD pipelines, the default output from `docker service update` and `docker service create` produces excessive repetitive logging. This creates noise in build logs and makes it difficult to identify actual deployment issues.

This guide documents solutions for clean, informative CI/CD output while maintaining visibility into deployment status.

## The Problem

Docker Swarm service operations produce repetitive progress messages:

```plaintext
overall progress: 0 out of 1 tasks
overall progress: 0 out of 1 tasks
overall progress: 0 out of 1 tasks
verify: Waiting 5 seconds to verify that tasks are stable...
verify: Waiting 5 seconds to verify that tasks are stable...
verify: Waiting 4 seconds to verify that tasks are stable...
[... repeated 15+ times ...]
```

This output:

- Clutters CI/CD logs
- Makes debugging harder
- Obscures actual deployment failures
- Wastes log storage

## The Solution

### 1. Use `--quiet` Flag for Service Updates

Docker's `--quiet` flag suppresses progress output while still returning error codes on failure.

```bash
# Before
docker service update --image myapp:v2 myservice

# After
docker service update --quiet --image myapp:v2 myservice
```

**Why this works:** The `--quiet` flag suppresses the continuous progress updates but preserves:

- Exit codes (non-zero on failure)
- Error messages
- Final convergence status

### 2. Filter Output with grep

If you need some progress visibility but not every line:

```bash
docker service update --image myapp:v2 myservice 2>&1 | \
  grep -E "(overall progress: [01] out of|Service.*converged|Error)"
```

This shows only:

- Initial progress (0 out of N)
- Final progress (N out of N)
- Convergence messages
- Error messages

### 3. Script Organization

Separate concerns into focused scripts:

**build.sh** - Build and tag images

```bash
#!/bin/bash
set -e

IMAGE_NAME=$1
ENV_TYPE=$2

docker build -t $IMAGE_NAME \
  --target $ENV_TYPE \
  --build-arg NODE_ENV=$ENV_TYPE . --quiet

echo "✅ Build completed: $IMAGE_NAME"
```

**deploy.sh** - Update or create services

```bash
#!/bin/bash
set -e

SERVICE_NAME=$1
IMAGE_NAME=$2
PORT=$3
ENV_TYPE=$4

ENV_VARS="--env NODE_ENV=$ENV_TYPE"

if docker service ls | grep -q $SERVICE_NAME; then
  echo "Updating service $SERVICE_NAME..."
  docker service update --quiet --image $IMAGE_NAME $SERVICE_NAME
  echo "Service update initiated"
else
  echo "Creating service $SERVICE_NAME..."
  docker service create --name $SERVICE_NAME \
    --publish $PORT:3000 \
    $ENV_VARS \
    $IMAGE_NAME
fi
```

**health-check.sh** - Verify deployment success

```bash
#!/bin/bash
set -e

SERVICE_NAME=$1
PORT=$2
URL=$3

# Wait for service to stabilize
sleep 60

# Single health check attempt
if curl -f -s --max-time 15 "$URL" > /dev/null; then
  echo "✅ Successfully deployed and reachable at: $URL"
else
  echo "❌ Health check failed"
  ./scripts/diagnostics.sh $SERVICE_NAME $PORT
  exit 1
fi
```

**cleanup.sh** - Remove old images

```bash
#!/bin/bash
set -e

docker image prune -f --filter "until=24h"
docker system prune -f --filter "until=24h"
```

## GitLab CI Integration

```yaml
stages:
  - build_and_deploy

.base_job:
  image: docker:latest
  stage: build_and_deploy
  before_script:
    - docker info
  script:
    - ./scripts/build.sh $DOCKER_IMAGE $ENV_TYPE
    - ./scripts/deploy.sh $SERVICE_NAME $DOCKER_IMAGE $PORT $ENV_TYPE
    - ./scripts/health-check.sh $SERVICE_NAME $PORT $URL
    - ./scripts/cleanup.sh

production:
  extends: .base_job
  variables:
    DOCKER_IMAGE: app-prod:${CI_COMMIT_SHORT_SHA}
    SERVICE_NAME: app-prod
    PORT: "3000"
    ENV_TYPE: production
    URL: https://app.example.com
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

## Key Principles

### 1. Fail Fast, Fail Clearly

Use `set -e` in all scripts. Exit immediately on errors rather than continuing with broken state.

```bash
#!/bin/bash
set -e  # Exit on any error
```

### 2. Separate Concerns

Each script should have one clear responsibility:

- Build scripts build
- Deploy scripts deploy
- Health checks verify
- Cleanup scripts clean

Don't mix concerns. This makes debugging easier and scripts reusable.

### 3. Minimal Output by Default

Only show:

- State changes (starting, completed)
- Errors
- Final status

Verbose output should be opt-in via flags or separate diagnostic scripts.

### 4. Progressive Enhancement

Start with basic functionality, then add:

- Health checks
- Rollback logic
- Advanced diagnostics
- Performance monitoring

Don't build everything upfront.

## Common Pitfalls and Solutions

### Pitfall 1: Premature Health Checks

**Problem:** Checking service health immediately after `docker service update` returns success even though containers aren't running yet.

**Solution:** Add delay before health checks:

```bash
# Wait for service to stabilize
sleep 60

# Then check
curl -f "$URL"
```

**Better solution:** Poll with timeout:

```bash
for i in {1..30}; do
  if curl -f -s "$URL" > /dev/null; then
    echo "Service healthy"
    exit 0
  fi
  sleep 2
done
echo "Timeout waiting for service"
exit 1
```

### Pitfall 2: Verbose Diagnostics in Success Path

**Problem:** Running `docker service inspect --pretty` and `docker service logs` on every successful deployment clutters logs.

**Solution:** Only show diagnostics on failure:

```bash
if ! curl -f "$URL"; then
  echo "Health check failed. Running diagnostics..."
  ./scripts/diagnostics.sh $SERVICE_NAME
  exit 1
fi
```

### Pitfall 3: Ignoring Exit Codes

**Problem:** Scripts continue after failures, leading to confusing error messages.

**Solution:** Use `set -e` and explicit error handling:

```bash
#!/bin/bash
set -e

if ! docker service update --quiet --image $IMAGE $SERVICE; then
  echo "Service update failed"
  exit 1
fi
```

### Pitfall 4: No Rollback Strategy

**Problem:** Failed deployments leave service in broken state.

**Solution:** Capture previous image before update:

```bash
OLD_IMAGE=$(docker service inspect $SERVICE --format '{{.Spec.TaskTemplate.ContainerSpec.Image}}')

if ! docker service update --quiet --image $NEW_IMAGE $SERVICE; then
  echo "Update failed. Rolling back to $OLD_IMAGE"
  docker service update --quiet --image $OLD_IMAGE $SERVICE
  exit 1
fi
```

### Pitfall 5: Docker-in-Docker Complexity

**Problem:** DinD (Docker-in-Docker) adds complexity and performance overhead.

**Solution:** Mount host Docker socket instead:

```yaml
# In GitLab CI configuration
variables:
  DOCKER_HOST: unix:///var/run/docker.sock

# No need for Docker-in-Docker service
```

**Security note:** Only use socket mounting in trusted environments. Never on shared runners.

## Best Practices

### 1. Idempotent Deployments

Scripts should produce same result when run multiple times:

```bash
# Check if service exists before creating
if docker service ls | grep -q $SERVICE_NAME; then
  docker service update --quiet --image $IMAGE $SERVICE_NAME
else
  docker service create --name $SERVICE_NAME $IMAGE
fi
```

### 2. Explicit Variable Validation

Validate required variables at script start:

```bash
SERVICE_NAME=${1:?SERVICE_NAME required}
IMAGE_NAME=${2:?IMAGE_NAME required}
PORT=${3:?PORT required}
```

This fails fast with clear error messages.

### 3. Consistent Exit Codes

- 0: Success
- 1: Deployment/build failure
- 2: Validation failure
- 3: Timeout

Document these in script headers.

### 4. Logging Standards

Use consistent prefixes:

```bash
echo "✅ Success: ..."
echo "❌ Error: ..."
echo "⚠️  Warning: ..."
echo "ℹ️  Info: ..."
```

This makes grep/filtering easier.

### 5. Environment-Specific Configuration

Never hardcode environment values:

```bash
# Bad
API_URL="https://api.prod.example.com"

# Good
API_URL=${API_URL:?API_URL environment variable required}
```

Pass via CI variables or environment files.

## Debugging Failed Deployments

When deployment fails, check in this order:

1. **Service Status**

   ```bash
   docker service ps $SERVICE_NAME --no-trunc
   ```

2. **Service Logs**

   ```bash
   docker service logs --tail 50 $SERVICE_NAME
   ```

3. **Container State**

   ```bash
   docker ps -a | grep $SERVICE_NAME
   ```

4. **Network Connectivity**

   ```bash
   docker network inspect $(docker service inspect $SERVICE_NAME --format '{{range .Spec.TaskTemplate.Networks}}{{.Target}}{{end}}')
   ```

5. **Port Bindings**

   ```bash
   docker service inspect $SERVICE_NAME --format '{{json .Endpoint.Ports}}'
   ```

Create a diagnostics script that runs these checks automatically on failure.

## Performance Considerations

### Image Build Optimization

Use BuildKit and multi-stage builds:

```dockerfile
# syntax=docker/dockerfile:1
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS production
COPY --from=builder /app/node_modules ./node_modules
COPY . .
CMD ["node", "server.js"]
```

Enable BuildKit in CI:

```yaml
variables:
  DOCKER_BUILDKIT: 1
```

### Parallel Service Updates

Update independent services in parallel:

```bash
docker service update --quiet --image app:v2 app-frontend &
docker service update --quiet --image api:v2 app-backend &
wait
```

### Registry Caching

Use registry mirrors or pull-through cache to reduce build times:

```yaml
variables:
  DOCKER_REGISTRY_MIRROR: https://mirror.example.com
```

## Monitoring and Observability

### Health Checks in Dockerfile

Define health checks in application Dockerfile:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD curl -f http://localhost:3000/health || exit 1
```

Docker Swarm uses these for automatic restart decisions.

### Service-Level Monitoring

Export service metrics:

```bash
docker service inspect $SERVICE_NAME --format '{{json .UpdateStatus}}'
```

Track:

- Update success rate
- Rollback frequency
- Average deployment time
- Container restart count

## Security Considerations

### 1. Image Scanning

Scan images before deployment:

```bash
# Using Trivy
trivy image --severity HIGH,CRITICAL $IMAGE_NAME

# Fail on vulnerabilities
if trivy image --exit-code 1 --severity CRITICAL $IMAGE_NAME; then
  echo "Critical vulnerabilities found"
  exit 1
fi
```

### 2. Secret Management

Never pass secrets as build arguments or environment variables in Dockerfile:

```bash
# Bad
docker build --build-arg API_KEY=secret123

# Good - use Docker secrets
docker secret create api_key ./api_key.txt
docker service update --secret-add api_key $SERVICE_NAME
```

### 3. Image Provenance

Tag images with git commit SHA and timestamp:

```bash
IMAGE_TAG="${ENV}-${CI_COMMIT_SHORT_SHA}-$(date +%s)"
docker build -t app:$IMAGE_TAG .
```

This enables tracing deployments back to source code.

### 4. Registry Authentication

Store registry credentials securely:

```bash
# In CI variables, not in code
echo "$REGISTRY_PASSWORD" | docker login -u "$REGISTRY_USER" --password-stdin registry.example.com
```

## Summary

Clean CI/CD output requires:

1. Using `--quiet` flag on Docker commands
2. Separating concerns into focused scripts
3. Showing only relevant status messages
4. Moving verbose diagnostics to failure paths
5. Implementing proper health checks with delays

The goal: One clear message on success, detailed diagnostics on failure.

**Final output should be:**

```
✅ Successfully deployed and reachable at: https://app.example.com
```

Not 50 lines of progress bars and "waiting" messages.

## Further Reading

- Docker Swarm deployment strategies: https://docs.docker.com/engine/swarm/services/
- GitLab CI Docker best practices: https://docs.gitlab.com/ee/ci/docker/
- Container health checks: https://docs.docker.com/engine/reference/builder/#healthcheck
- BuildKit optimization: https://docs.docker.com/build/buildkit/
