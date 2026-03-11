# Fail2ban with Docker Containers

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=5 orderedList=false} -->

<!-- code_chunk_output -->

- [Problem](#problem)
- [Solution Overview](#solution-overview)
- [Step 1: Find Docker Container Log Path](#step-1-find-docker-container-log-path)
- [Step 2: Create Custom Docker Action](#step-2-create-custom-docker-action)
- [Step 3: Configure Jails](#step-3-configure-jails)
- [Step 4: Restart and Verify](#step-4-restart-and-verify)
- [Verification Commands](#verification-commands)
- [Common Mistakes](#common-mistakes)
- [Why This Works](#why-this-works)
- [Additional Notes](#additional-notes)

<!-- /code_chunk_output -->

## Problem

fail2ban's default actions don't work with Docker containers because Docker traffic bypasses the `INPUT` chain and uses the `FORWARD` chain instead. Bans placed in `INPUT` won't affect traffic to Docker containers.

## Solution Overview

1. Create custom fail2ban action that targets the `DOCKER-USER` chain
2. Configure jails to use this custom action
3. Point fail2ban to Docker container log files

## Step 1: Find Docker Container Log Path

```bash
docker inspect <container_name> | grep -A 5 "LogPath"
```

This returns something like:

```
"LogPath": "/var/lib/docker/containers/<container_id>/<container_id>-json.log"
```

## Step 2: Create Custom Docker Action

Create `/etc/fail2ban/action.d/iptables-docker-user.conf`:

```ini
[Definition]
actionstart = iptables -N f2b-<n>
              iptables -A f2b-<n> -j RETURN
              iptables -I DOCKER-USER -j f2b-<n>

actionstop = iptables -D DOCKER-USER -j f2b-<n>
             iptables -F f2b-<n>
             iptables -X f2b-<n>

actioncheck = iptables -n -L DOCKER-USER | grep -q 'f2b-<n>[ \t]'

actionban = iptables -I f2b-<n> 1 -s <ip> -j DROP

actionunban = iptables -D f2b-<n> -s <ip> -j DROP

[Init]
```

This action:

- Creates a separate chain for each jail (f2b-<jailname>)
- Inserts it into the DOCKER-USER chain
- Adds/removes ban rules to this chain

## Step 3: Configure Jails

In `/etc/fail2ban/jail.local`:

```ini
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[example-jail]
enabled = true
banaction = iptables-docker-user
filter = your-filter-name
logpath = /var/lib/docker/containers/<container_id>/<container_id>-json.log
maxretry = 3
bantime = 24h
findtime = 10m
```

**Critical**: Set `banaction = iptables-docker-user` for each jail monitoring Docker containers.

## Step 4: Restart and Verify

```bash
# Restart fail2ban
sudo systemctl restart fail2ban

# Verify DOCKER-USER chain has f2b chains
sudo iptables -L DOCKER-USER -n -v

# Check jail is using correct action
sudo fail2ban-client get <jail_name> actions

# Test ban
sudo fail2ban-client set <jail_name> banip <test_ip>

# Verify ban appears in iptables
sudo iptables -L f2b-<jail_name> -n -v
```

## Verification Commands

```bash
# List active jails
sudo fail2ban-client status

# Show jail details
sudo fail2ban-client status <jail_name>

# Show complete jail configuration (not individual settings)
sudo fail2ban-client -d

# View jail definitions in config files
cat /etc/fail2ban/jail.d/*.conf
cat /etc/fail2ban/jail.local

# View filter files
ls -la /etc/fail2ban/filter.d/
```

## Common Mistakes

**Wrong command**: `fail2ban-client get <jail> filter` does NOT exist. This was an error in initial guidance.

**Correct approach**: Read configuration files directly or use `fail2ban-client status <jail>` to see applied settings.

**Wrong action**: Using `iptables-multiport` or `iptables-allports` won't work for Docker containers - they target the wrong iptables chain.

## Why This Works

Docker creates a `DOCKER-USER` chain specifically for user-defined rules. The custom action:

1. Creates per-jail chains (f2b-jailname)
2. Links them to DOCKER-USER (which processes all Docker traffic)
3. Adds DROP rules to these chains for banned IPs

This ensures banned IPs are blocked before traffic reaches Docker containers.

## Additional Notes

- Docker container log paths are persistent across restarts (same container ID)
- If you recreate a container, the container ID and log path change
- Filters work the same as non-Docker fail2ban configurations
- You can mix Docker and non-Docker jails in the same fail2ban instance
