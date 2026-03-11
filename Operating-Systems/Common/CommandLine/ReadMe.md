# CommandLine

See also in [CommandLineOneLiner](../MacOS/CommandLineOneLiner/ReadMe.md) for MacOS-specific one-liners.

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=5 orderedList=false} -->

<!-- code_chunk_output -->

- [SSH](#ssh)
  - [Onetime Remote Queries](#onetime-remote-queries)
  - [Repeated Queries](#repeated-queries)
- [Server Info](#server-info)
- [Disk Space](#disk-space)
- [Environment Variables](#environment-variables)
- [Finding .env Files](#finding-env-files)

<!-- /code_chunk_output -->


## SSH

### Onetime Remote Queries

```bash
ssh user@host 'ls -la /path/to/directory'

# Multiple commands
ssh user@host 'cd /path && ls -la && du -sh *'

# Piping output locally
ssh user@host 'ls -la /path' | grep pattern
```

### Repeated Queries

Consider:

- SSH config with `ControlMaster` for connection reuse
- `rsync --list-only` for directory listings

## Server Info

Get a one-line summary of the server's specs:

```bash
echo "OS: $(lsb_release -d | cut -f2), CPU: $(nproc) vCPU, RAM: $(free -h | awk '/^Mem:/{print $2}'), Disk: $(df -h / | awk 'NR==2{print $2}')"
```

Or piece by piece:

```bash
hostnamectl | grep "Operating System"   # OS
nproc                                   # CPU cores
free -h                                 # RAM
df -h /                                 # Disk (root partition)
```

## Disk Space

Check disk usage across all mounted filesystems:

```bash
df -h
```

Check how much space a specific directory uses:

```bash
du -sh /path/to/directory
```

## Environment Variables

List all currently active environment variables:

```bash
env
```

Filter by prefix or keyword:

```bash
env | grep SOME_PREFIX
```

Print a specific variable:

```bash
echo $MY_VAR
```

## Finding .env Files

If you stored `.env` files somewhere on the server and need to locate them:

```bash
find / -name ".env" 2>/dev/null
```

Narrow the search to likely locations:

```bash
find /home -name ".env" 2>/dev/null
find /var/www -name ".env" 2>/dev/null
```

> `2>/dev/null` suppresses permission-denied errors that would otherwise clutter the output.
