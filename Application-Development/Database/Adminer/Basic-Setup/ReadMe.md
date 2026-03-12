# Local Database Admin Interface with HTTPS

## Purpose

This setup provides a local database administration interface that mirrors production security practices by using HTTPS encryption. Running database tools over HTTPS locally prevents mixed-content warnings when developing applications that enforce secure connections, and trains your development environment to match production constraints.

The architecture uses three Docker containers connected through a shared network: a PostgreSQL database with PostGIS extensions, an Adminer web interface for database management, and an nginx reverse proxy for SSL termination.

## Architecture Overview

The browser connects to `https://localhost:8443` where an nginx container terminates SSL. Nginx forwards requests to `host.docker.internal:8081`, which bridges to the Adminer container running on the host's port 8081 (internally port 8080). Adminer connects to the PostgreSQL container via the Docker network using the container hostname on port 5432.

All three containers share the same Docker network, enabling container-to-container communication via hostnames. The nginx proxy uses `host.docker.internal` to reach Adminer's host port, effectively bridging the gap between the Docker network and the host machine's port mapping.

## Directory Structure

Create a dedicated directory for this setup (e.g., `infrastructure/database/local-admin` or similar). The directory contains shell scripts to launch each container, SSL certificates for HTTPS, and the nginx configuration.

```
local-admin/
├── cert.pem
├── key.pem
├── nginx.conf
├── start-adminer-local.sh
├── start-adminer-proxy-local.sh
└── start-postgres-local.sh
```

## SSL Certificates

Generate self-signed certificates valid for one year. These are sufficient for local development and avoid the complexity of certificate authorities or trust store management.

```bash
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=localhost"
```

Place both `cert.pem` and `key.pem` in the setup directory. Your browser will warn about self-signed certificates on first access, which you can safely accept for localhost development.

## nginx Configuration

The nginx configuration performs SSL termination and proxies requests to Adminer. Create `nginx.conf` with the following structure:

```nginx
events {
    worker_connections 1024;
}

http {
    server {
        listen 443 ssl;
        server_name localhost;

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

The configuration listens on port 443 inside the container (mapped to 8443 on the host) and forwards all requests to Adminer with proper headers for connection tracking.

## Container Launch Scripts

### PostgreSQL with PostGIS

Create `start-postgres-local.sh`:

```bash
docker run -d --name postgres-local \
  --network local-db-network \
  -e POSTGRES_DB=your_database \
  -e POSTGRES_USER=your_admin_user \
  -e POSTGRES_PASSWORD=${DB_PASSWORD_LOCAL} \
  -v postgres_local_data:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgis/postgis:17-3.5
```

This uses the PostGIS image which extends PostgreSQL with geographic object support. If you don't need spatial features, substitute `postgres:17` as the image. The database name, username, and password should match your application's requirements. The password reads from an environment variable to avoid hardcoding credentials in scripts.

The volume `postgres_local_data` persists database data between container restarts. Port 5432 is exposed to the host for direct database connections if needed.

### Adminer Web Interface

Create `start-adminer-local.sh`:

```bash
docker run -d --name adminer-local \
  --network local-db-network \
  -p 8081:8080 \
  adminer
```

Adminer runs on its default internal port 8080, mapped to 8081 on the host to avoid conflicts with other services. It connects to the shared Docker network to reach PostgreSQL by container name.

### nginx SSL Proxy

Create `start-adminer-proxy-local.sh`:

```bash
docker run -d --name adminer-proxy \
  --network local-db-network \
  -p 8443:443 \
  -v "$(pwd)/cert.pem":/etc/nginx/cert.pem:ro \
  -v "$(pwd)/key.pem":/etc/nginx/key.pem:ro \
  -v "$(pwd)/nginx.conf":/etc/nginx/nginx.conf:ro \
  nginx:alpine
```

The proxy mounts SSL certificates and nginx configuration as read-only volumes. Port 443 in the container maps to 8443 on the host (avoiding privileged port 443 which requires root).

## Setup Process

Before starting containers, create the shared Docker network:

```bash
docker network create local-db-network
```

Make all shell scripts executable:

```bash
chmod +x start-*.sh
```

Set the database password as an environment variable:

```bash
export DB_PASSWORD_LOCAL="your_secure_password"
```

Start containers in order:

1. `./start-postgres-local.sh`
2. `./start-adminer-local.sh`
3. `./start-adminer-proxy-local.sh`

Access Adminer at `https://localhost:8443`. Accept the self-signed certificate warning in your browser.

## Database Connection Parameters

Adminer does not store credentials for security reasons. You must enter connection details on each login:

- **System**: PostgreSQL
- **Server**: `postgres-local:5432` (or whatever you named the PostgreSQL container)
- **Username**: Your configured admin user
- **Password**: The value from `${DB_PASSWORD_LOCAL}`
- **Database**: Your configured database name

The server hostname must match the container name used in the PostgreSQL launch script. Docker's internal DNS resolves this hostname within the `local-db-network` network.

## Troubleshooting

**Cannot connect to database**: Verify all three containers are running with `docker ps`. Ensure they all share the same network with `docker inspect <container_name> | grep NetworkMode`.

**Certificate errors**: Modern browsers require explicit acceptance of self-signed certificates. Click through the warning or add localhost to your browser's certificate exceptions.

**Port conflicts**: If ports 8081, 8443, or 5432 are already in use, modify the port mappings in the launch scripts. Change the left side of the mapping (e.g., `8081:8080` to `8082:8080`) while keeping the right side unchanged.

**Password not found**: The `${DB_PASSWORD_LOCAL}` variable must be set before launching the PostgreSQL container. Export it in your shell or add it to your shell profile for persistence.

## Stopping and Cleanup

Stop containers:

```bash
docker stop adminer-proxy adminer-local postgres-local
docker rm adminer-proxy adminer-local postgres-local
```

Remove the network if no longer needed:

```bash
docker network rm local-db-network
```

The `postgres_local_data` volume persists after container removal. To delete all data:

```bash
docker volume rm postgres_local_data
```

## Security Considerations

This setup prioritizes convenience for local development. The self-signed certificates provide encryption but not identity verification. Credentials passed via environment variables remain visible in process listings and Docker inspect output.

For team environments, consider using docker-compose to manage multi-container setups with environment files that are gitignored. Never commit certificates or credentials to version control.

The manual credential entry on each Adminer login adds friction but prevents credential leakage through browser storage or container environment variables that might be inadvertently exposed.

## Why This Approach

**HTTPS locally**: Many modern web APIs and frameworks enforce secure contexts (HTTPS) for features like service workers, geolocation, and secure cookies. Developing over HTTP then deploying to HTTPS can expose subtle bugs.

**Adminer over pgAdmin**: Adminer is a single-file PHP application with no installation complexity. It supports multiple database systems and has a minimal resource footprint compared to pgAdmin's Electron-based interface.

**nginx proxy layer**: Separating SSL termination from the application allows swapping Adminer for other tools without reconfiguring SSL. The proxy also demonstrates production-like architecture where reverse proxies handle TLS.

**Container-based setup**: Containers isolate database versions and configurations from the host system. You can run multiple PostgreSQL versions simultaneously for different projects by changing container names and ports.

**PostGIS inclusion**: The PostGIS image adds minimal overhead and includes extensions many applications eventually need. If you know you won't use spatial features, the standard PostgreSQL image works identically.
