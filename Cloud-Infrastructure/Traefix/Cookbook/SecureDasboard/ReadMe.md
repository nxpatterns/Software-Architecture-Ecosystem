# Secure Traefik Dashboard

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=5 orderedList=false} -->

<!-- code_chunk_output -->

- [Problem](#problem)
- [Solution: IP Restriction at the Firewall Level](#solution-ip-restriction-at-the-firewall-level)
  - [Using iptables (no ufw)](#using-iptables-no-ufw)
    - [Using Traefik Middleware (label-based, Docker)](#using-traefik-middleware-label-based-docker)
- [Considerations](#considerations)
  - [Why Basic Auth Has No Logout](#why-basic-auth-has-no-logout)

<!-- /code_chunk_output -->

## Problem

The Traefik dashboard exposes an admin UI on a dedicated port. Basic Auth alone is a weak protection: there is no logout mechanism, and browser credential caches can persist across sessions.

## Solution: IP Restriction at the Firewall Level

Block the dashboard port for everyone except a trusted IP address. This is more robust than application-level middleware because traffic is dropped before it reaches the process.

### Using iptables (no ufw)

```bash
# Allow access from your trusted IP
iptables -A INPUT -s YOUR.IP.ADDRESS -p tcp --dport 8080 -j ACCEPT

# Block everyone else
iptables -A INPUT -p tcp --dport 8080 -j DROP
```

**Order matters:** the ACCEPT rule must come before the DROP rule.

**Verify:**

```bash
iptables -L INPUT -n --line-numbers
```

**Persist across reboots:**

```bash
apt install iptables-persistent
netfilter-persistent save
```

Alternatively, write the rules into a systemd service or startup script if you prefer not to install additional packages.

#### Using Traefik Middleware (label-based, Docker)

If firewall access is not available, IP restriction can be applied at the Traefik level using the `ipAllowList` middleware:

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.dashboard.rule=PathPrefix(`/`)"
  - "traefik.http.routers.dashboard.entrypoints=dashboard"
  - "traefik.http.routers.dashboard.middlewares=auth,ip-whitelist"
  - "traefik.http.middlewares.auth.basicauth.users=HASHED_CREDENTIALS"
  - "traefik.http.middlewares.ip-whitelist.ipallowlist.sourcerange=YOUR.IP.ADDRESS/32"
  - "traefik.http.routers.dashboard.service=api@internal"
```

Note: In Traefik v3 the middleware key is `ipallowlist` (not `ipwhitelist` as in v2).

## Considerations

**Dynamic IPs:** If your ISP does not assign a static IP, the rule will lock you out after an IP change. Options: use a VPN with a fixed egress IP, or combine IP restriction with Basic Auth as a fallback.

**IPv6:** Check whether your client connects over IPv6 (`curl -6 ifconfig.me`) and add your IPv6 prefix to the allow list if needed.

**Defense in Depth:** Firewall-level IP restriction alone is access control, not authentication. Keeping Basic Auth as a second layer costs nothing and protects against IP spoofing or accidental rule misconfiguration.

### Why Basic Auth Has No Logout

Basic Auth is stateless at the HTTP level. The browser caches credentials and sends them automatically with every request. They are stored in the browser's internal auth cache, separate from cookies and localStorage, which is why "Clear Site Data" in DevTools often does not work.

To force a logout: close the browser entirely, or navigate to `https://wrong:credentials@your-host/` to trigger a 401 and evict the cached credentials. For a proper session-based logout flow, use a forward auth solution such as Authelia or `traefik-forward-auth`.
