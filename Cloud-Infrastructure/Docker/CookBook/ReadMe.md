# Docker

## Basics

```bash
docker --version

# Laufende Container
docker ps

# Alle Container (inkl. gestoppte)
docker ps -a

# Alle Images
docker images -a

# Dangling Images (untagged)
docker images -f "dangling=true"

# Volumes
docker volume ls

# Networks
docker network ls

# Disk Usage Overview
docker system df

# Detaillierte Disk Usage
docker system df -v

# Welche Container nutzen welche Images
docker ps -a --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"

# Im Container eine Datei löschen
docker exec <container-name> sh -c 'rm /tmp/*.sql' # <- Wichtig, vergesse ich immer
```
