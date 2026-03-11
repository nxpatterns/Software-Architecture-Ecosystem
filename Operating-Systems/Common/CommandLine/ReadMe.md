# CommandLine

See also in [CommandLineOneLiner](../MacOS/CommandLineOneLiner/ReadMe.md) for MacOS-specific one-liners.

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
