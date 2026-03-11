# Trouble Shooting

## Running PostGIS on Apple Silicon (ARM64)

### Problem

`postgis/postgis` images do not publish ARM64 builds. On an Apple Silicon Mac, `docker run` fails with:

```
docker: no matching manifest for linux/arm64/v8 in the manifest list entries.
```

### Solution: Force AMD64 via Rosetta Emulation

Add `--platform linux/amd64` to the `docker run` command. Docker Desktop on macOS uses Rosetta 2 to transparently emulate x86_64.

```bash
docker run -d --name some-postgres-local-experimental --network some-local-network \
  --platform linux/amd64 \
  -e POSTGRES_DB=some \
  -e POSTGRES_USER=some-db-admin \
  -e POSTGRES_PASSWORD=${DB_PASSWORD_LOCAL} \
  -v postgres_local_data:/var/lib/postgresql/data \
  -p 5433:5432 \
  postgis/postgis:17-3.5
```

### Trade-offs

| Approach | Performance | Effort | Notes |
|---|---|---|---|
| `--platform linux/amd64` | Slower (emulated) | None | Fine for local dev |
| Native ARM64 image (e.g. `imresdev/postgis`) | Native speed | Low | Third-party, less maintained |
| Custom image (`postgres:17-alpine` + PostGIS) | Native speed | Medium | Full control, most reliable long-term |

### Notes

- The performance hit from Rosetta emulation is usually acceptable for local development workloads.
- The `--platform` flag must be specified every time, or set as a default in your `docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgis/postgis:17-3.5
    platform: linux/amd64
    ...
```

- This issue affects any image that only publishes `linux/amd64` manifests, not just PostGIS.
