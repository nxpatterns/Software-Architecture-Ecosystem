# Traefik-Based Docker Deployment with Git Hooks

## Overview

This document describes a deployment architecture using Traefik as a reverse proxy for Docker containers, managed through Git post-receive hooks. The setup aims to automate container deployments while minimizing downtime and manual configuration.

## Architecture Components

### Reverse Proxy Layer

The architecture uses a two-tier proxy approach:

**Apache/Nginx (Frontend Proxy)**: Handles SSL termination and forwards requests to Traefik ports. This layer manages certificates and provides a stable external interface.

**Traefik (Container Proxy)**: Routes requests to Docker containers based on labels. Traefik automatically discovers containers and updates routing without restarts.

This separation allows SSL and domain management to remain stable while container orchestration happens dynamically behind the scenes.

### Network Design

Traefik and application containers must share a Docker network for communication. Traefik runs in a named network (created by Docker Compose), while containers started via `docker run` default to the bridge network. Without explicit network configuration, Traefik cannot reach containers despite correct label configuration.

**Critical requirement**: All application containers must join Traefik's network using `--network <traefik-network-name>`.

### Entrypoint Strategy

Traefik uses entrypoints to listen on different ports for different environments. For example:

- Production entrypoint on port 3000
- Development entrypoint on port 3100
- Dashboard entrypoint on port 8080

The frontend proxy forwards domain-based requests to these ports, allowing multiple environments to coexist without port conflicts.

## Traefik Configuration

### Docker Compose Setup

Traefik runs as a long-lived container deployed via Docker Compose or Portainer stack:

```yaml
version: '3.8'
services:
  traefik:
    image: traefik:v3.0
    container_name: traefik-proxy
    restart: always
    ports:
      - "3000:3000"    # Production
      - "3100:3100"    # Development
      - "8080:8080"    # Dashboard
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    command:
      - --api.dashboard=true
      - --api.insecure=false
      - --providers.docker=true
      - --providers.docker.exposedbydefault=false
      - --entrypoints.prod.address=:3000
      - --entrypoints.dev.address=:3100
      - --entrypoints.dashboard.address=:8080
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.dashboard.rule=PathPrefix(`/`)"
      - "traefik.http.routers.dashboard.entrypoints=dashboard"
      - "traefik.http.routers.dashboard.middlewares=auth"
      - "traefik.http.middlewares.auth.basicauth.users=admin:$$2y$$05$$..."
      - "traefik.http.routers.dashboard.service=api@internal"
```

**Key configuration points**:

- `exposedbydefault=false` prevents accidental exposure of all containers
- Dashboard requires BasicAuth (note double `$$` in compose files)
- Docker socket mounted read-only for security

### Container Label Schema

Application containers use Traefik labels to define routing:

```bash
docker run -d --name myapp-timestamp \
  --network traefik-network \
  --label "traefik.enable=true" \
  --label "traefik.http.routers.myapp-prod.rule=Host(\`example.com\`)" \
  --label "traefik.http.routers.myapp-prod.entrypoints=prod" \
  --label "traefik.http.services.myapp-timestamp.loadbalancer.server.port=3000" \
  myimage:tag
```

**Label breakdown**:

- `traefik.enable=true`: Opt-in to Traefik routing
- Router definition: Specifies hostname and entrypoint
- Service definition: Tells Traefik which container port to forward to

## Git Hook Deployment Flow

### Post-Receive Hook Structure

The deployment hook automates: checkout, build, containerization, health checking, and cleanup.

```bash
#!/bin/bash

WORK_TREE="/path/to/project"
GIT_DIR="/path/to/repo.git"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

wait_for_health_check() {
    local target_url=$1
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "http://${target_url}" > /dev/null 2>&1; then
            echo "✅ Health check passed"
            return 0
        fi
        sleep 2
        ((attempt++))
    done

    return 1
}

cleanup_old_containers() {
    local env=$1
    local containers_to_remove=$(docker ps -a --filter name="myapp-${env}-" \
        --format "{{.Names}}" | sort -r | tail -n +4)

    if [[ -n "$containers_to_remove" ]]; then
        echo "$containers_to_remove" | xargs -r docker rm -f
    fi
}

deploy_environment() {
    local env=$1
    local container_name="myapp-${env}-${TIMESTAMP}"
    local image_tag="myapp:${env}-${TIMESTAMP}"

    # Build phase
    git --git-dir="$GIT_DIR" --work-tree="$WORK_TREE" checkout -f
    cd "$WORK_TREE"
    npm install --silent
    npm run build
    docker build -t "$image_tag" .

    # Container start with Traefik labels
    docker run -d --name "$container_name" --restart always \
        --network traefik-network \
        --label "traefik.enable=true" \
        --label "traefik.http.routers.myapp-${env}.rule=Host(\`${env}.example.com\`)" \
        --label "traefik.http.routers.myapp-${env}.entrypoints=${env}" \
        --label "traefik.http.services.${container_name}.loadbalancer.server.port=3000" \
        "$image_tag"

    # Health check using container IP
    local container_ip=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$container_name")

    if ! wait_for_health_check "${container_ip}:3000"; then
        docker rm -f "$container_name"
        exit 1
    fi

    # Cleanup keeps last 3 containers
    cleanup_old_containers "$env"
}

while read oldrev newrev refname; do
    branch=$(git rev-parse --symbolic --abbrev-ref $refname)

    case "$branch" in
        main)
            deploy_environment "prod"
            ;;
        development)
            deploy_environment "dev"
            ;;
    esac
done
```

### Health Check Strategy

Health checks validate containers before cleanup of old versions. The check uses the container's internal IP address because:

1. Containers don't publish ports (Traefik accesses them internally)
2. The application must be reachable before exposing to production traffic
3. Docker network allows direct IP access

**Container IP extraction**:

```bash
docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' container-name
```

This returns the first network's IP address, which works for containers in a single network.

## Application Configuration Requirements

### Network Binding

**Critical**: Applications must bind to `0.0.0.0` (all interfaces), not `localhost` or `127.0.0.1`.

**Why this matters**: When binding to localhost, the application only accepts connections from within the container. Traefik runs in a separate container and connects via the Docker network, which requires the application to listen on all interfaces.

**Common frameworks**:

Node.js/Express:

```javascript
app.listen(3000, '0.0.0.0');
```

NestJS:

```typescript
await app.listen(3000, '0.0.0.0');
```

Python/Flask:

```python
app.run(host='0.0.0.0', port=3000)
```

**Symptom of incorrect binding**: Health check succeeds (uses container IP directly), but Traefik shows "Gateway Timeout" (cannot connect via network).

## Zero-Downtime Deployment Limitations

### The Fundamental Challenge

Label-based Traefik routing has an inherent limitation for atomic traffic switching:

**When a new container starts with the same router labels as an existing container, Traefik automatically load-balances between both**. This creates a brief period where traffic hits both old and new versions.

**Why this happens**:

1. New container starts with router label `myapp-prod`
2. Old container still runs with router label `myapp-prod`
3. Traefik sees two valid backends for the same route
4. Traffic distributes across both containers
5. Old container cleanup happens after health check

**Duration of overlap**: Typically 5-15 seconds (health check + cleanup execution time)

### Attempted Solutions and Why They Failed

**Dynamic Label Updates**: Container labels are immutable after creation. There's no `docker label update` command.

**Traefik API Router Updates**: The Traefik API cannot override routers defined by Docker labels. Label-based configuration is read-only from the API perspective.

**Unique Router Names**: Giving each container a unique router name (e.g., `myapp-prod-timestamp`) works but doesn't solve the problem. The frontend proxy would need updating to point to the new router, which reintroduces manual configuration.

**Service-Level Switching**: Keeping router names constant while switching services seemed promising, but Traefik still load-balances when multiple containers provide the same service definition.

### Practical Mitigation

**Accept Short Overlap**: For most applications, 10-15 seconds of version overlap is acceptable. Both versions must be compatible during this window (database migrations, API changes, etc.).

**Immediate Cleanup**: Run cleanup immediately after health check succeeds to minimize overlap duration.

**Rolling Deployment Awareness**: Applications should handle concurrent versions gracefully during deployment windows.

### Alternative Approaches

**Blue-Green at Proxy Level**: Use two router configurations (blue/green) and switch the frontend proxy between them. This adds complexity but provides atomic switches.

**Weighted Services (Traefik Enterprise)**: Traefik Enterprise supports weighted load balancing and gradual traffic shifting, enabling true canary deployments.

**External Orchestration (Kubernetes)**: Container orchestrators provide sophisticated deployment strategies (rolling updates, canary releases) at the cost of operational complexity.

## Lessons Learned

### Network Isolation is Critical

The most common deployment failure was network misconfiguration. Containers must explicitly join Traefik's network. This isn't obvious because Traefik logs don't clearly indicate network isolation issues.

**Debugging tip**: If Traefik dashboard shows the router but traffic times out, check network configuration first.

### Health Checks Need Direct Access

Health checks must use container IP addresses, not localhost or published ports. This requires extracting the IP via `docker inspect` and constructing the health check URL dynamically.

### Label-Based Routing Has Limits

Label-based service discovery is excellent for automatic configuration but poor for precise traffic control. True zero-downtime deployment requires orchestration capabilities beyond what Docker labels provide.

### Container Cleanup Timing Matters

Cleaning up old containers too early risks downtime if the new container fails. Cleaning up too late creates version overlap. The optimal timing is immediately after health check success, accepting brief overlap as unavoidable.

### Dashboard Security is Essential

Traefik dashboards expose all routing configuration and container discovery. Always enable authentication, even for internal deployments. The BasicAuth middleware provides simple but effective protection.

## Production Considerations

### Container Retention

Keep multiple previous containers (configured as 3 in the example) to enable quick rollback without rebuilding. Balance retention count against disk space.

### Image Tagging Strategy

Use timestamps in image tags for traceability. This allows correlating deployed containers with specific build times and git commits.

### Monitoring and Logging

Traefik metrics and access logs provide visibility into routing behavior. Monitor for:

- 502/504 errors indicating backend unavailability
- Sudden traffic distribution changes
- Health check failures

### Restart Policy

Use `--restart always` for production containers to survive server reboots. Combined with Traefik's automatic discovery, this provides resilience without manual intervention.

## Conclusion

This architecture provides automated, near-zero-downtime deployments using standard Docker tooling. The key insight is that perfect zero-downtime requires orchestration features beyond label-based routing, but accepting brief overlaps enables a simple, maintainable solution.

The approach works well for:

- Small to medium applications
- Teams comfortable with Docker and Git hooks
- Scenarios where 10-15 second version overlap is acceptable

Consider more sophisticated orchestration (Kubernetes, Docker Swarm, Nomad) if you need:

- True atomic traffic switching
- Canary deployments with traffic percentage control
- Multi-node container scheduling
- Complex deployment strategies
