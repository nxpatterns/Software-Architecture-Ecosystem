# Linux Troubleshooting

## Out of Memory (Container crashes)

When a container crashes due to an Out of Memory (OOM) error, it means that the application inside the container has exceeded the memory limits set for it. This can happen for various reasons, such as memory leaks, insufficient memory allocation, or unexpected spikes in memory usage. **Real Solution:** You have to analyse it in detail to find the root cause.

### Immediate Fixes

#### Add swap (quick but not a long-term solution)

```bash
fallocate -l 8G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

#### Stop unnecessary services

```bash
ps aux --sort=-%mem | head -20 # Identify and stop memory-hungry processes
kill -9 <PID> # Replace <PID> with the process ID of the offending process
free -h # Check memory usage after stopping processes
```

## GitLab SSL Certificate Renewal

Example GitLab instance with Let's Encrypt SSL certificate:

- Domain: git.some.trybox.eu
- Setup: GitLab in Docker (port 8090) → Apache reverse proxy (host)
- Cert Location: /etc/letsencrypt/live/git.some.trybox.eu/

### Pre-Renewal Checks

```bash
# 1. Check memory (needs >4GB free)
free -h

# 2. Check if GitLab is healthy
docker ps | grep gitlab
# Wait for "(healthy)" status, not "(health: starting)"

# 3. Kill stuck pnpm/node processes if memory is low
ps aux --sort=-%mem | head -20
pkill -9 pnpm && pkill -9 node  # if necessary

# 4. Ensure swap exists (8GB minimum)
swapon --show
# If missing: fallocate -l 8G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile && echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### Certificate Renewal

```bash
# Delete old manual cert
certbot delete --cert-name git.some.trybox.eu

# Renew with Apache plugin (auto-configures + auto-renewal)
certbot --apache -d git.some.trybox.eu
```

### Common Issues

- **"manual plugin not working"** → Old cert used --manual, must delete first
- **GitLab crash-looping** → Out of memory, kill pnpm processes + add swap
- **Memory exhausted** → Target: >4GB free before renewal

### Verification

```bash
certbot certificates
systemctl status apache2
curl -I https://git.some.trybox.eu
docker ps | grep gitlab
```
