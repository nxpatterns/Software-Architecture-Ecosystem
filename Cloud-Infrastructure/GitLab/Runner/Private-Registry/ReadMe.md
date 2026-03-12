# GitLab Runner Private Registry Authentication Guide

## Problem Overview

When using private Docker images as base images in GitLab CI/CD pipelines, runners need registry authentication **before** job execution starts. However, GitLab CI/CD variables (like `$REGISTRY_USER` and `$REGISTRY_PASSWORD`) are only available **during** job execution, creating a timing mismatch.

### Error Symptoms

```
error pulling image configuration: no basic auth credentials
```

This error occurs when the runner attempts to pull the base image specified in `.gitlab-ci.yml` but lacks authentication credentials.

## Context: When Authentication is Needed

### Two Authentication Points

1. **Runner-level (pre-job)**: Pulling the base image specified in `image:` directive
2. **Job-level (during job)**: Building/pushing images via `docker login` in scripts

This guide addresses **runner-level authentication**.

## Solution: Mount Docker Config File

The most reliable approach is mounting a Docker authentication config file into the runner container. This provides credentials before job execution.

### Why This Approach Works

- Uses Docker's native authentication mechanism
- Independent of GitLab Runner version
- Compatible with Docker socket binding
- Simple to maintain and troubleshoot

## Implementation Steps

### 1. Create Authentication Config File

Generate the base64-encoded authentication string:

```bash
echo -n "your-registry-username:your-registry-password" | base64
```

Create the Docker config file (e.g., `/srv/gitlab-runner/docker-auth.json`):

```json
{
  "auths": {
    "your-registry.example.com": {
      "auth": "BASE64_STRING_FROM_ABOVE"
    }
  }
}
```

### 2. Configure GitLab Runner

#### For Standard Docker Deployments

Edit `config.toml` to add the auth file as a volume mount:

```toml
[[runners]]
  name = "Docker Runner"
  executor = "docker"
  [runners.docker]
    image = "docker:24-cli"
    privileged = false
    volumes = [
      "/var/run/docker.sock:/var/run/docker.sock",
      "/srv/gitlab-runner/docker-auth.json:/root/.docker/config.json:ro"
    ]
```

Restart the runner:

```bash
gitlab-runner restart
```

#### For Docker Swarm Deployments

Update the Swarm service to add the mount:

```bash
docker service update \
  --mount-add type=bind,source=/srv/gitlab-runner/docker-auth.json,target=/root/.docker/config.json,readonly \
  your-gitlab-runner-service
```

### 3. Update CI/CD Configuration

**Remove** `docker login` from `before_script` if using runner-level auth:

```yaml
.base_job:
  image: your-registry.example.com/base-image:tag
  before_script:
    # Auth already available via mounted config
    - docker info
  script:
    - ./build.sh
```

**Important**: The mounted auth file is read-only. Attempting `docker login` will fail with:

```
Error saving credentials: device or resource busy
```

## Architecture Patterns

### Pattern 1: Socket Binding (Recommended for Simple Setups)

**Runner config:**

```toml
[runners.docker]
  volumes = ["/var/run/docker.sock:/var/run/docker.sock"]
```

**CI/CD config:**

```yaml
# No services needed - uses host Docker
image: your-registry.example.com/base-image:tag
```

**Advantages:**

- Fast (no Docker-in-Docker overhead)
- Simple configuration
- Direct access to host Docker daemon

**Disadvantages:**

- Jobs share host Docker daemon
- Security consideration: containers have host Docker access

### Pattern 2: Docker-in-Docker (DinD)

**Runner config:**

```toml
[runners.docker]
  privileged = true
  # No socket binding
```

**CI/CD config:**

```yaml
services:
  - docker:27-dind
```

**Advantages:**

- Isolated Docker daemon per job
- Better security isolation

**Disadvantages:**

- Slower (daemon startup overhead)
- Requires privileged mode
- More complex troubleshooting

**Note**: Cannot combine socket binding with DinD service - they conflict.

## Common Configuration Mistakes

### 1. TOML Syntax Errors

**Wrong:**

```toml
[[runners]]
  [runners.cache]
    # config
  [runners.cache]  # Duplicate key!
    # more config
```

**Correct:**

```toml
[[runners]]
  [runners.cache]
    MaxUploadedArchiveSize = 0
  [runners.docker]
    # docker config
```

### 2. Protected Variables on Non-Protected Branches

If GitLab CI/CD variables are marked "protected", they only work on protected branches. For runner-level auth, you don't need CI/CD variables at all.

### 3. Variable Expansion in Passwords

If your registry password contains `$`, GitLab may interpret it as a variable reference. Either:

- Use runner-level auth (no variables needed)
- Disable "Expand variable reference" in GitLab variable settings

### 4. Wrong Auth File Location

The auth file must be mounted to `/root/.docker/config.json` inside the **runner container**, not the job container.

## Troubleshooting

### Verify Auth File is Mounted

```bash
# Find runner container
docker ps | grep gitlab-runner

# Check mounted file
docker exec CONTAINER_ID cat /root/.docker/config.json
```

### Test Registry Access

```bash
# On the host with the same auth
docker pull your-registry.example.com/base-image:tag
```

### Check Runner Logs

```bash
# Docker
docker logs RUNNER_CONTAINER_ID

# Swarm
docker service logs your-runner-service
```

### Debug Pipeline

Add temporary debug step:

```yaml
debug:
  image: alpine
  script:
    - apk add curl
    - cat /root/.docker/config.json || echo "Auth file not found"
```

## Multiple Registries

To authenticate with multiple registries, add all to the auth file:

```json
{
  "auths": {
    "registry1.example.com": {
      "auth": "BASE64_STRING_1"
    },
    "registry2.example.com": {
      "auth": "BASE64_STRING_2"
    }
  }
}
```

## Security Considerations

1. **File Permissions**: Protect the auth file

   ```bash
   chmod 600 /srv/gitlab-runner/docker-auth.json
   ```

2. **Read-Only Mount**: Always mount as `:ro` (read-only)

3. **Backup Strategy**: Keep encrypted backup of auth credentials

4. **Rotation**: Regularly rotate registry passwords

5. **Minimize Scope**: Use registry credentials with minimal required permissions

## Migration from CI/CD Variables

If currently using `docker login` in `before_script`:

1. Create and mount auth config file (steps above)
2. Remove `docker login` from `.gitlab-ci.yml`
3. Remove `REGISTRY_USER` and `REGISTRY_PASSWORD` variables from GitLab
4. Test pipeline

**Why remove variables?**: They're unnecessary overhead and potential security exposure if runner-level auth works.

## Quick Reference

### Generate Base64 Auth

```bash
echo -n "username:password" | base64
```

### Decode Base64 Auth (for verification)

```bash
echo "BASE64_STRING" | base64 -d
```

### Runner Config Location

- Standard install: `/etc/gitlab-runner/config.toml`
- Custom install: Check volume mounts in container/service definition

### Restart Runner

```bash
# Docker
docker restart CONTAINER_ID

# Swarm
docker service update --force SERVICE_NAME

# System service
gitlab-runner restart
```

## When to Use Each Approach

| Scenario | Recommended Approach |
|----------|---------------------|
| Simple setup, single registry | Mounted auth config |
| Multiple registries | Mounted auth config with multiple entries |
| Dynamic registry selection | CI/CD variables + `docker login` in job |
| High security requirements | DinD + job-level auth |
| Fast build times | Socket binding + mounted auth |

## Summary

**Problem**: Runners can't pull private base images without pre-job authentication.

**Solution**: Mount Docker auth config into runner container at `/root/.docker/config.json`.

**Key Points**:

- Use runner-level auth for base image pulls
- Use job-level auth for dynamic registry operations
- Don't mix socket binding with DinD service
- Mount auth file as read-only
- Remove conflicting `docker login` commands

**Result**: Seamless private registry authentication with minimal configuration overhead.
