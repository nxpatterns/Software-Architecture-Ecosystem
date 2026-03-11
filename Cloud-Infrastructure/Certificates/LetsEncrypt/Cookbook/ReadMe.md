# Automated Let's Encrypt Wildcard Certificates with acme-dns

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=5 orderedList=false} -->

<!-- code_chunk_output -->

- [Problem Statement](#problem-statement)
  - [The Challenge](#the-challenge)
  - [Why This Matters](#why-this-matters)
  - [The Solution](#the-solution)
- [Architecture Overview](#architecture-overview)
  - [How It Works](#how-it-works)
- [Implementation Guide](#implementation-guide)
  - [Prerequisites](#prerequisites)
  - [Step 1: acme-dns Server Setup](#step-1-acme-dns-server-setup)
    - [1.1 Understanding acme-dns Configuration](#11-understanding-acme-dns-configuration)
    - [1.2 Directory Structure](#12-directory-structure)
    - [1.3 Create config.cfg](#13-create-configcfg)
    - [1.4 Launch Docker Container](#14-launch-docker-container)
    - [1.5 Register Your Domain](#15-register-your-domain)
  - [Step 2: DNS Configuration (Primary DNS Provider)](#step-2-dns-configuration-primary-dns-provider)
    - [2.1 NS Delegation](#21-ns-delegation)
    - [2.2 ACME Challenge CNAME](#22-acme-challenge-cname)
    - [2.3 Verification](#23-verification)
  - [Step 3: Firewall Configuration](#step-3-firewall-configuration)
    - [3.1 Required Ports](#31-required-ports)
    - [3.2 Why Port 53 Must Be Public](#32-why-port-53-must-be-public)
  - [Step 4: Certbot Setup](#step-4-certbot-setup)
    - [4.1 Installation Options](#41-installation-options)
    - [4.2 Credentials Configuration](#42-credentials-configuration)
    - [4.3 Permissions](#43-permissions)
    - [4.4 Obtain Certificate](#44-obtain-certificate)
  - [Step 5: Auto-Renewal Setup](#step-5-auto-renewal-setup)
    - [5.1 Test Renewal](#51-test-renewal)
    - [5.2 Cronjob Configuration](#52-cronjob-configuration)
- [Troubleshooting Guide](#troubleshooting-guide)
  - [Common Issues and Solutions](#common-issues-and-solutions)
    - [1. DNS SERVFAIL Errors](#1-dns-servfail-errors)
    - [2. Certbot "Unable to find domain" Error](#2-certbot-unable-to-find-domain-error)
    - [3. Connection Timeout on Port 53](#3-connection-timeout-on-port-53)
    - [4. acme-dns Not Binding to 0.0.0.0](#4-acme-dns-not-binding-to-0000)
    - [5. Certificate Not Loading in Application](#5-certificate-not-loading-in-application)
- [Key Lessons Learned](#key-lessons-learned)
  - [1. INI vs JSON Format Confusion](#1-ini-vs-json-format-confusion)
  - [2. NS Record Requirement](#2-ns-record-requirement)
  - [3. API IP Binding](#3-api-ip-binding)
  - [4. CNAME Trailing Dots](#4-cname-trailing-dots)
  - [5. Glue Records Are Mandatory](#5-glue-records-are-mandatory)
- [Security Considerations](#security-considerations)
  - [1. API Access](#1-api-access)
  - [2. Credentials Storage](#2-credentials-storage)
  - [3. DNS Security](#3-dns-security)
  - [4. Certificate Management](#4-certificate-management)
- [Maintenance](#maintenance)
  - [Regular Tasks](#regular-tasks)
  - [Backup Strategy](#backup-strategy)
  - [Updates](#updates)
- [Performance Notes](#performance-notes)
- [Alternative Approaches Considered](#alternative-approaches-considered)
  - [1. DNS Provider API Direct Integration](#1-dns-provider-api-direct-integration)
  - [2. Manual DNS Updates](#2-manual-dns-updates)
  - [3. HTTP-01 Challenges](#3-http-01-challenges)
- [Conclusion](#conclusion)

<!-- /code_chunk_output -->

## Problem Statement

### The Challenge
Setting up automatic SSL certificate renewal for wildcard domains (e.g., `*.example.com`) requires DNS-01 challenges, which traditionally need:

1. **DNS Provider API access** - Security risk when API tokens have full zone access
2. **Manual DNS updates** - Not scalable, requires intervention every 90 days
3. **Complex automation** - Integration with DNS provider APIs varies by provider

### Why This Matters

- Wildcard certificates require DNS-01 validation (HTTP-01 doesn't work for wildcards)
- Most DNS providers don't offer granular API permissions (all-or-nothing access)
- Sharing API credentials in production environments creates security vulnerabilities
- Manual renewals are error-prone and don't scale

### The Solution
**acme-dns** provides a minimal, delegated DNS server that handles ACME challenges without exposing your primary DNS provider's API. It creates a security boundary between Let's Encrypt validation and your production DNS infrastructure.

## Architecture Overview

```
┌─────────────────┐
│ Let's Encrypt   │
│ Validation      │
└────────┬────────┘
         │ DNS Query: _acme-challenge.example.com
         ▼
┌─────────────────┐
│ Primary DNS     │  NS Delegation
│ (e.g., Hetzner) │ ──────────────┐
└─────────────────┘               │
                                  ▼
                          ┌─────────────────┐
                          │ acme-dns Server │ ◄── Certbot updates TXT
                          │ (Your Server)   │     records via API
                          └─────────────────┘
                                  │
                                  ▼
                          [TXT Record Storage]
```

### How It Works

1. **DNS Delegation**: Your primary DNS delegates `_acme-challenge` subdomain to acme-dns
2. **CNAME Indirection**: `_acme-challenge.example.com` → points to acme-dns subdomain
3. **API Updates**: Certbot updates TXT records on acme-dns (not your primary DNS)
4. **Validation**: Let's Encrypt queries acme-dns directly for challenge validation
5. **Security**: Your primary DNS API credentials never leave your DNS provider

## Implementation Guide

### Prerequisites

- Linux server with Docker
- Domain with configurable DNS (NS/CNAME records)
- Firewall control (UDP port 53)
- Root/sudo access

### Step 1: acme-dns Server Setup

#### 1.1 Understanding acme-dns Configuration

acme-dns requires careful configuration because it acts as an authoritative DNS server for a subdomain.

**Key Concept**: The `domain` parameter defines what acme-dns is authoritative for. This should be a dedicated subdomain (e.g., `auth.example.com`), NOT your main domain.

#### 1.2 Directory Structure

```bash
mkdir -p /opt/acme-dns/data
cd /opt/acme-dns
```

#### 1.3 Create config.cfg

```ini
[general]
# IP and protocol for DNS server
listen = "0.0.0.0:53"
protocol = "udp"

# CRITICAL: This is the subdomain acme-dns is authoritative for
# Use a dedicated subdomain like auth.yourdomain.com
domain = "auth.example.com"

# The nameserver hostname (must resolve to your server's IP)
nsname = "ns1.auth.example.com"

# Administrative contact
nsadmin = "admin.example.com"

# Static DNS records acme-dns serves
# IMPORTANT: Must include NS record for proper delegation
records = [
    "auth.example.com. A <YOUR_SERVER_IP>",
    "ns1.auth.example.com. A <YOUR_SERVER_IP>",
    "auth.example.com. NS ns1.auth.example.com."
]

[database]
engine = "sqlite3"
connection = "/var/lib/acme-dns/acme-dns.db"

[api]
# API for registration and updates
# 0.0.0.0 allows Docker port mapping to work
ip = "0.0.0.0"
port = "8053"
use_header = false
header_name = "X-Forwarded-For"

[logconfig]
loglevel = "info"
logtype = "stdout"
```

**Why these settings matter:**

- `domain`: Defines DNS zone acme-dns manages
- `nsname`: Must point to your server (DNS delegation target)
- `NS record in records[]`: **Critical** - without this, DNS queries fail with SERVFAIL
- `api.ip = 0.0.0.0`: Allows Docker port mapping (127.0.0.1 won't work with `-p` flag)

#### 1.4 Launch Docker Container

```bash
docker run -d \
  --name acme-dns \
  --restart always \
  -p 53:53/udp \
  -p 8053:8053 \
  -v /opt/acme-dns/config.cfg:/etc/acme-dns/config.cfg:ro \
  -v /opt/acme-dns/data:/var/lib/acme-dns \
  joohoi/acme-dns
```

**Port Notes:**

- `53/udp`: DNS queries from Let's Encrypt
- `8053`: API for registration and TXT record updates (localhost only, no firewall rule needed)

#### 1.5 Register Your Domain

```bash
curl -X POST http://127.0.0.1:8053/register
```

**Save this output** - you'll need it for certbot:

```json
{
  "username": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "password": "yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy",
  "fulldomain": "zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz.auth.example.com",
  "subdomain": "zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz"
}
```

### Step 2: DNS Configuration (Primary DNS Provider)

#### 2.1 NS Delegation

Delegate the auth subdomain to your server:

```bind
# NS delegation - points to the nameserver hostname
auth                IN  NS   ns1.auth.example.com.

# Glue record - required so NS can be resolved
ns1.auth            IN  A    <YOUR_SERVER_IP>
```

**Why glue records?** Without the A record, DNS resolvers can't find `ns1.auth.example.com` because it's within the delegated zone (chicken-and-egg problem).

#### 2.2 ACME Challenge CNAME

Point your ACME challenge to acme-dns:

```bind
# Use the subdomain from registration output
_acme-challenge     IN  CNAME  zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz.auth
```

**Important**: Use the `subdomain` value from Step 1.5, not a random string.

#### 2.3 Verification

Wait 2-5 minutes for DNS propagation, then test:

```bash
# Check NS delegation
dig auth.example.com NS

# Should return:
# auth.example.com. 86400 IN NS ns1.auth.example.com.

# Check if acme-dns responds
dig @<YOUR_SERVER_IP> auth.example.com NS

# Check CNAME
dig _acme-challenge.example.com CNAME
```

### Step 3: Firewall Configuration

#### 3.1 Required Ports

```
Protocol: UDP
Port:     53
Source:   Any (Let's Encrypt validators need access)
Action:   Allow
```

#### 3.2 Why Port 53 Must Be Public

Let's Encrypt validation servers need to query your acme-dns server directly. Unlike HTTP-01 challenges, DNS-01 requires inbound DNS traffic.

### Step 4: Certbot Setup

#### 4.1 Installation Options

**Option A: System Installation (Debian/Ubuntu)**

```bash
apt install certbot
pip3 install certbot-dns-acmedns --break-system-packages
```

**Option B: Isolated Environment (Recommended)**

```bash
conda create -n certbot python=3.11 -c conda-forge -y
conda activate certbot
pip install certbot certbot-dns-acmedns
```

**Why isolated environment?**

- Avoids Python dependency conflicts
- Easier to upgrade/maintain
- Doesn't pollute system Python packages

#### 4.2 Credentials Configuration

**Create INI file:** `/etc/letsencrypt/acmedns.ini`

```ini
dns_acmedns_api_url = http://127.0.0.1:8053
dns_acmedns_registration_file = /etc/letsencrypt/acmedns-registration.json
```

**Create JSON file:** `/etc/letsencrypt/acmedns-registration.json`

```json
{
  "example.com": {
    "username": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "password": "yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy",
    "fulldomain": "zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz.auth.example.com",
    "subdomain": "zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz",
    "allowfrom": []
  }
}
```

**Key structure note:** The top-level key must be your base domain (`example.com`), not the wildcard (`*.example.com`).

#### 4.3 Permissions

```bash
chmod 600 /etc/letsencrypt/acmedns.ini
chmod 600 /etc/letsencrypt/acmedns-registration.json
chown root:root /etc/letsencrypt/acmedns.*
```

**Why root ownership?** Certbot runs as root (needs to write to `/etc/letsencrypt`), so credentials should only be readable by root.

#### 4.4 Obtain Certificate

```bash
certbot certonly \
  --authenticator dns-acmedns \
  --dns-acmedns-credentials /etc/letsencrypt/acmedns.ini \
  --dns-acmedns-propagation-seconds 30 \
  -d "*.example.com" \
  -d "example.com"
```

**Parameters explained:**

- `--authenticator dns-acmedns`: Use acme-dns plugin
- `--dns-acmedns-propagation-seconds 30`: Wait time for DNS to propagate
- `-d "*.example.com"`: Wildcard domain
- `-d "example.com"`: Base domain (optional, but recommended)

**Success output:**

```
Certificate is saved at: /etc/letsencrypt/live/example.com/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/example.com/privkey.pem
This certificate expires on YYYY-MM-DD.
```

### Step 5: Auto-Renewal Setup

#### 5.1 Test Renewal

```bash
certbot renew --dry-run
```

**Expected output:** "Congratulations, all simulated renewals succeeded"

#### 5.2 Cronjob Configuration

```bash
crontab -e
```

Add (adjust certbot path if using conda):

```cron
# Daily renewal check at 3 AM, restart dependent services
0 3 * * * /path/to/certbot renew --quiet && systemctl reload nginx >> /var/log/certbot-renewal.log 2>&1
```

**For conda installation:**

```cron
0 3 * * * /home/user/miniconda3/envs/certbot/bin/certbot renew --quiet && systemctl reload nginx >> /var/log/certbot-renewal.log 2>&1
```

**Why daily checks?** Certbot only renews if certificate is <30 days from expiry, so daily checks are safe and ensure timely renewal.

## Troubleshooting Guide

### Common Issues and Solutions

#### 1. DNS SERVFAIL Errors

**Symptom:**

```bash
dig auth.example.com NS
# status: SERVFAIL
```

**Cause:** acme-dns not returning NS records

**Fix:** Ensure NS record in `config.cfg`:

```ini
records = [
    "auth.example.com. NS ns1.auth.example.com."  # This line is critical
]
```

Restart container:

```bash
docker restart acme-dns
```

#### 2. Certbot "Unable to find domain" Error

**Symptom:**

```
Unable to find a domain in /etc/letsencrypt/acmedns-registration.json matching "example.com"
```

**Cause:** JSON key doesn't match domain

**Fix:** Ensure top-level JSON key matches base domain:

```json
{
  "example.com": { ... }  // Not "*.example.com"
}
```

#### 3. Connection Timeout on Port 53

**Symptom:**

```bash
dig @your-server auth.example.com
# connection timed out
```

**Causes:**

1. Firewall blocking UDP/53
2. acme-dns container not running
3. Port already in use

**Checks:**

```bash
# Container running?
docker ps | grep acme-dns

# Port listening?
netstat -tulpn | grep :53

# Firewall rules
iptables -L -n | grep 53
```

#### 4. acme-dns Not Binding to 0.0.0.0

**Symptom:**

```
listen tcp 127.0.0.1:8053: bind: address already in use
```

**Cause:** Another service using port 8053

**Fix:** Change API port in config.cfg:

```ini
[api]
port = "9053"  # Use different port
```

Update Docker run command:

```bash
-p 9053:9053
```

#### 5. Certificate Not Loading in Application

**Symptom:** Application still uses old certificate after renewal

**Cause:** Application didn't reload certificate

**Fix:** Add reload/restart to cronjob:

```cron
0 3 * * * certbot renew --quiet && systemctl reload nginx
```

For Docker containers:

```cron
0 3 * * * certbot renew --quiet && docker restart myapp
```

## Key Lessons Learned

### 1. INI vs JSON Format Confusion

**Problem:** `certbot-dns-acmedns` expects INI format for main config, but plugin documentation is unclear.

**Solution:**

- `acmedns.ini` = INI format (certbot plugin config)
- `acmedns-registration.json` = JSON format (domain credentials)
- Don't try to put JSON in a `.json` file and reference it as credentials directly

### 2. NS Record Requirement

**Problem:** acme-dns served SOA and TXT records but NS queries returned empty, causing SERVFAIL.

**Root Cause:** Missing NS record in static records array.

**Insight:** acme-dns doesn't auto-generate NS records from `nsname` parameter. You must explicitly add them to the `records[]` array.

### 3. API IP Binding

**Problem:** Using `ip = "127.0.0.1"` in config prevented Docker port mapping from working.

**Solution:** Use `ip = "0.0.0.0"` to allow container port exposure while still restricting with Docker's `-p` flag.

### 4. CNAME Trailing Dots

**Problem:** DNS record `_acme-challenge IN CNAME subdomain.auth.example.com.example.com.` (doubled domain).

**Cause:** DNS zone file interpretation of relative vs absolute names.

**Solution:** Always use FQDN with trailing dot in CNAME targets:

```bind
_acme-challenge  IN  CNAME  subdomain.auth.example.com.
                                                       ^ trailing dot
```

### 5. Glue Records Are Mandatory

**Problem:** NS delegation worked from Hetzner's servers but failed from public resolvers.

**Cause:** Missing glue record for nameserver within delegated zone.

**Insight:** When delegating to `ns1.auth.example.com`, you must provide an A record for `ns1.auth` in the parent zone. Otherwise, resolvers can't find the nameserver.

## Security Considerations

### 1. API Access

- acme-dns API (port 8053) should only be accessible from localhost
- Don't expose port 8053 in firewall rules
- Docker `-p 8053:8053` binds to 127.0.0.1 by default (safe)

### 2. Credentials Storage

- `/etc/letsencrypt/` should be readable only by root (mode 700)
- Credential files should be mode 600
- Never commit credentials to version control

### 3. DNS Security

- Consider implementing DNSSEC for added security
- Monitor acme-dns logs for suspicious activity
- Rate limit API access if exposing publicly

### 4. Certificate Management

- Monitor certificate expiry dates
- Set up alerts for renewal failures
- Keep renewal logs for audit purposes

## Maintenance

### Regular Tasks

**Weekly:**

- Check renewal logs: `tail /var/log/certbot-renewal.log`

**Monthly:**

- Verify certificate validity: `certbot certificates`
- Check acme-dns disk usage: `du -sh /opt/acme-dns/data/`

**After DNS Changes:**

- Wait 2-5 minutes for propagation
- Test: `dig @8.8.8.8 auth.example.com NS`

### Backup Strategy

**Critical files to backup:**

```
/opt/acme-dns/config.cfg
/opt/acme-dns/data/
/etc/letsencrypt/
```

**Backup command:**

```bash
tar -czf acme-dns-backup-$(date +%F).tar.gz \
  /opt/acme-dns/config.cfg \
  /opt/acme-dns/data/ \
  /etc/letsencrypt/
```

### Updates

**Update acme-dns:**

```bash
docker pull joohoi/acme-dns:latest
docker stop acme-dns
docker rm acme-dns
# Re-run docker run command with :latest tag
```

**Update certbot:**

```bash
# Conda environment
conda activate certbot
pip install --upgrade certbot certbot-dns-acmedns

# System installation
pip3 install --upgrade certbot certbot-dns-acmedns
```

## Performance Notes

- acme-dns is lightweight (< 20MB RAM)
- DNS queries respond in <5ms
- SQLite database scales to thousands of domains
- No performance impact on primary DNS infrastructure

## Alternative Approaches Considered

### 1. DNS Provider API Direct Integration

**Pros:** Simpler, no additional infrastructure
**Cons:** Security risk (full zone access), provider lock-in

### 2. Manual DNS Updates

**Pros:** Maximum security, no automation risk
**Cons:** Not scalable, error-prone, requires intervention every 90 days

### 3. HTTP-01 Challenges

**Pros:** No DNS required
**Cons:** Doesn't support wildcards, requires web server on port 80

## Conclusion

This setup provides:

- ✅ Automated wildcard certificate renewals
- ✅ No primary DNS API exposure
- ✅ Minimal infrastructure overhead
- ✅ Provider-agnostic (works with any DNS)
- ✅ Audit trail and logging
- ✅ Easy disaster recovery

**Total setup time:** ~30 minutes
**Maintenance:** ~5 minutes per month
**Reliability:** 99.9%+ (if server is stable)
