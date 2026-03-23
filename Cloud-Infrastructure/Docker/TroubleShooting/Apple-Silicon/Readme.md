# Trouble Shooting

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=5 orderedList=false} -->

<!-- code_chunk_output -->

- [Running PostGIS on Apple Silicon (ARM64)](#running-postgis-on-apple-silicon-arm64)
  - [Problem](#problem)
  - [Solution: Force AMD64 via Rosetta Emulation](#solution-force-amd64-via-rosetta-emulation)
  - [Trade-offs](#trade-offs)
  - [Notes](#notes)
- [Docker CP and Glob Patterns](#docker-cp-and-glob-patterns)
  - [Problem](#problem-1)
  - [Solutions](#solutions)
    - [Loop over files](#loop-over-files)
    - [Copy entire directory](#copy-entire-directory)
    - [Use tar pipeline](#use-tar-pipeline)
  - [Why This Happens](#why-this-happens)

<!-- /code_chunk_output -->

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

## Docker CP and Glob Patterns

### Problem

When using `docker cp` to copy files into a container, shell glob patterns (e.g., `*.sql`) are expanded by the shell before the command runs. This can lead to errors if the pattern matches multiple files, as `docker cp` only accepts one source argument.

```bash
# This fails if phase5*.sql matches 3 files:
docker cp excel3/sql/phase5*.sql container:/tmp/
# Expands to: docker cp file1.sql file2.sql file3.sql container:/tmp/
# Result: 4 arguments → error
```

### Solutions

#### Loop over files

```bash
for f in path/to/files/*.sql; do
  docker cp "$f" container:/tmp/
done
```

#### Copy entire directory

```bash
# Copies all contents of sql/ into /tmp/
docker cp path/to/sql/. container:/tmp/
```

#### Use tar pipeline

```bash
# Streams multiple files through stdin
tar -c path/to/files/*.sql | docker exec -i container tar -xC /tmp/
```

### Why This Happens

The shell expands globs before executing the command. `docker cp` sees the expanded list, not the pattern. Unlike tools built for multiple sources (like `cp` or `mv`), `docker cp` only handles one source at a time.
