# ISPConfig Setup Guide - Debian 12

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=5 orderedList=false} -->

<!-- code_chunk_output -->

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [Basic ISPConfig Installation](#basic-ispconfig-installation)
  - [Installation Error: "Could not read ISPConfig settings file"](#installation-error-could-not-read-ispconfig-settings-file)
- [SSL Certificates](#ssl-certificates)
  - [Two Approaches: Manual certbot vs ISPConfig Integration](#two-approaches-manual-certbot-vs-ispconfig-integration)
- [DNS Configuration](#dns-configuration)
  - [A Records vs CNAME Records](#a-records-vs-cname-records)
  - [Common DNS Configuration Mistakes](#common-dns-configuration-mistakes)
  - [DNS Propagation and Caching](#dns-propagation-and-caching)
- [Website Configuration in ISPConfig](#website-configuration-in-ispconfig)
  - [Creating a Website](#creating-a-website)
  - [Understanding Apache VirtualHost Structure](#understanding-apache-virtualhost-structure)
  - [Document Root and Index Files](#document-root-and-index-files)
  - [Troubleshooting: Wrong Page Displayed](#troubleshooting-wrong-page-displayed)
- [SSL Certificate Troubleshooting](#ssl-certificate-troubleshooting)
  - [Certificate Shows as Self-Signed or Wrong Domain](#certificate-shows-as-self-signed-or-wrong-domain)
- [Best Practices](#best-practices)
- [Common Error Patterns](#common-error-patterns)
  - [Pattern 1: "Everything worked yesterday"](#pattern-1-everything-worked-yesterday)
  - [Pattern 2: "Configuration looks correct but doesn't work"](#pattern-2-configuration-looks-correct-but-doesnt-work)
  - [Pattern 3: "Manual configuration conflicts with ISPConfig"](#pattern-3-manual-configuration-conflicts-with-ispconfig)
- [Quick Reference Commands](#quick-reference-commands)
- [Lessons Learned](#lessons-learned)

<!-- /code_chunk_output -->


## Overview

This guide covers the installation and initial configuration of ISPConfig on Debian 12, including SSL certificate setup, DNS configuration, and common troubleshooting scenarios.

## Prerequisites

- Fresh Debian 12 server with root access
- Domain name with DNS control
- Server publicly accessible on ports 80, 443, 8080

## Installation

### Basic ISPConfig Installation

```bash
wget -O ispconfig3-install.sh https://get.ispconfig.org
bash ispconfig3-install.sh
```

**Critical: Firewall Configuration**

Before accessing ISPConfig, ensure these ports are open in your firewall:

- **Port 80** (HTTP) - Required for Let's Encrypt validation
- **Port 443** (HTTPS) - Secure web traffic
- **Port 8080** (ISPConfig Panel) - Management interface
- **Port 21, 22, 25, 110, 143, 465, 587, 993, 995** (if using mail/FTP services)

**Common mistake:** Attempting SSL certificate creation before opening firewall ports will fail with authentication errors.

### Installation Error: "Could not read ISPConfig settings file"

If you encounter this error during installation:

**Possible causes:**

1. Remnants from previous installation
2. Incomplete cleanup from failed installation

**Solution:**

```bash
# Clean up previous installation artifacts
rm -rf /usr/local/ispconfig
rm -f /etc/ispconfig.conf

# Remove downloaded installer and retry
rm -f /tmp/ispconfig3-install.sh
wget -O - https://get.ispconfig.org | bash
```

## SSL Certificates

### Two Approaches: Manual certbot vs ISPConfig Integration

**Approach 1: Manual certbot (Not Recommended)**

```bash
certbot --apache -d example.com
```

**Issues:**

- Creates separate configuration files (000-default-le-ssl.conf)
- May conflict with ISPConfig-managed sites
- Can be overwritten by ISPConfig updates
- Requires manual Apache configuration cleanup

**Approach 2: ISPConfig Integration (Recommended)**

1. Create website in ISPConfig (Sites → Add New Site)
2. Enable SSL in ISPConfig interface (SSL Tab → Let's Encrypt)
3. Specify all domains: `example.com,www.example.com`

**Best Practice:** Let ISPConfig manage SSL certificates entirely. If you used manual certbot first, disable those configurations:

```bash
a2dissite 000-default-le-ssl
a2dissite 000-default
systemctl reload apache2
```

## DNS Configuration

### A Records vs CNAME Records

**For root domain and www subdomain:**

**Option 1: A Records (Recommended for ISPConfig)**

```
example.com.     A     128.140.119.149
www.example.com. A     128.140.119.149
```

**Option 2: CNAME (Can cause issues)**

```
www.example.com. CNAME example.com.
```

### Common DNS Configuration Mistakes

**Problem: CNAME shows as `example.com.example.com.`**

**Cause:** DNS provider interface may interpret relative names within the zone context.

**Symptoms:**

```bash
dig www.example.com A
# Shows: www.example.com. CNAME example.com.example.com.
```

**Solution:**

1. Delete the CNAME record
2. Create an A record instead: `www.example.com. A [server-ip]`
3. Or use fully qualified CNAME: `www.example.com. CNAME example.com.`

**Why A records are safer:** No ambiguity about relative vs absolute domain names.

### DNS Propagation and Caching

**Understanding TTL (Time To Live):**

- DNS records are cached by resolvers based on TTL value
- Typical TTL: 86400 seconds (24 hours)
- Changes may take up to TTL duration to propagate globally

**Testing DNS directly from authoritative server:**

```bash
# Query the authoritative nameserver directly
dig @ns1.your-provider.com www.example.com A

# Test with public DNS (bypasses local cache)
dig @8.8.8.8 www.example.com A
dig @1.1.1.1 www.example.com A
```

**DNS Cache Issues:**

When DNS changes don't appear immediately:

1. **Authoritative server delivers correct data:**

   ```bash
   dig @authoritative-ns.com www.example.com A
   # Shows correct IP
   ```

2. **Local resolver shows old data:**

   ```bash
   dig www.example.com A
   # Shows old/wrong IP
   ```

**This indicates caching at:**

- ISP DNS resolver
- Local router DNS cache
- Operating system DNS cache
- Browser DNS cache

**Solutions:**

**System-level (macOS):**

```bash
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

**System-level (Linux):**

```bash
sudo systemd-resolve --flush-caches
```

**Router-level:**

- Restart router (clears DNS cache)
- Router DNS caches can be persistent (especially consumer routers)

**Browser-level:**

- Chrome: `chrome://net-internals/#dns` → Clear host cache
- Firefox: Restart browser

**Bypass local DNS entirely (temporary fix):**

- Change system DNS to public resolvers: `8.8.8.8`, `1.1.1.1`
- Add entry to `/etc/hosts` (immediate, local-only)

**Consumer routers (Huawei, TP-Link, etc.) often have aggressive DNS caching that persists even after restart. Using public DNS resolvers (Google, Cloudflare) is more reliable.**

## Website Configuration in ISPConfig

### Creating a Website

1. **Sites → Website → Add New Site**
2. **Domain:** `example.com`
3. **Auto-Subdomain:** Check `www` (creates www.example.com alias)
4. **SSL Tab:** Enable Let's Encrypt SSL
5. **SSL Domain:** `example.com,www.example.com`

### Understanding Apache VirtualHost Structure

**Check active VirtualHost configuration:**

```bash
apache2ctl -S
```

**Example output:**

```
*:443  example.com (/etc/apache2/sites-enabled/100-example.com.vhost:94)
*:80   example.com (/etc/apache2/sites-enabled/100-example.com.vhost:7)
```

**ISPConfig creates:**

- HTTP (port 80) VirtualHost with redirect to HTTPS
- HTTPS (port 443) VirtualHost with SSL certificates
- Separate configurations for management ports (8080, 8081)

### Document Root and Index Files

**Default ISPConfig document structure:**

```
/var/www/example.com/web/
├── error/
├── favicon.ico
├── robots.txt
├── standard_index.html
└── stats/
```

**Apache DirectoryIndex priority:**

1. `index.html`
2. `index.php`
3. `standard_index.html` (ISPConfig default welcome page)

**Important:** Apache searches for index files in order. If none exist, it may fall back to Apache's default page from `/var/www/html`.

### Troubleshooting: Wrong Page Displayed

**Symptom:** Browser shows Apache default page instead of ISPConfig welcome page

**Common causes:**

1. **Browser cache** (most common)
2. **DNS cache** (domain resolving to wrong IP)
3. **VirtualHost misconfiguration**
4. **Missing index files**

**Diagnosis steps:**

1. **Test in incognito/private window** (bypasses browser cache)
2. **Check VirtualHost configuration:**

   ```bash
   apache2ctl -S | grep example.com
   ```

3. **Verify DocumentRoot content:**

   ```bash
   ls -la /var/www/example.com/web/
   ```

4. **Check DirectoryIndex setting:**

   ```bash
   grep DirectoryIndex /etc/apache2/sites-enabled/100-example.com.vhost
   ```

**Solution:** Usually browser cache. Clear cache or test in incognito mode.

## SSL Certificate Troubleshooting

### Certificate Shows as Self-Signed or Wrong Domain

**Symptoms:**

- Browser shows "Not Secure"
- Certificate valid until 2035 (impossibly long for Let's Encrypt)
- Certificate for wrong domain (e.g., `www.example.com` when accessing `example.com`)

**Diagnosis:**

```bash
# Check which certificate is actually being served
openssl s_client -connect example.com:443 -servername example.com | openssl x509 -noout -text | grep "Subject:\|DNS:"

# Check ISPConfig certificate files
openssl x509 -in /var/www/clients/client1/web1/ssl/example.com-le.crt -text -noout | grep "Subject:\|DNS:"
```

**Common issues:**

1. **Domain not included in certificate:** Let's Encrypt certificate only covers domains explicitly requested
   - Fix: Add all domains/subdomains in ISPConfig SSL configuration

2. **Wrong VirtualHost matched:** Apache serves first matching VirtualHost if ServerName doesn't match
   - Fix: Ensure both `example.com` and `www.example.com` are in ServerName/ServerAlias

3. **Self-signed certificate from previous installation**
   - Fix: Remove old certificates, regenerate via ISPConfig

## Best Practices

1. **Always configure firewall before attempting SSL certificate installation**
2. **Use ISPConfig for all website and SSL management** (avoid mixing manual certbot)
3. **Prefer A records over CNAME for www subdomains** (less ambiguity)
4. **Test DNS changes with authoritative nameservers** (bypass caching)
5. **Change system DNS to public resolvers** (8.8.8.8, 1.1.1.1) for better reliability
6. **Always test in incognito/private window** when troubleshooting website display issues
7. **Document your setup immediately** (6-hour-you is smarter than 6-month-later-you)

## Common Error Patterns

### Pattern 1: "Everything worked yesterday"
**Likely cause:** DNS cache, browser cache, or SSL certificate expiration
**First step:** Test in incognito mode with public DNS

### Pattern 2: "Configuration looks correct but doesn't work"
**Likely cause:** Cached state somewhere in the stack
**Solution:** Systematically clear caches (browser → system → router → DNS)

### Pattern 3: "Manual configuration conflicts with ISPConfig"
**Likely cause:** Mixing manual Apache/certbot configs with ISPConfig management
**Solution:** Choose one management method and stick with it (prefer ISPConfig)

## Quick Reference Commands

```bash
# Check Apache VirtualHost configuration
apache2ctl -S

# Test DNS with different resolvers
dig @8.8.8.8 example.com A
dig @1.1.1.1 example.com A

# Check SSL certificate details
openssl x509 -in /path/to/cert.crt -text -noout | grep "Subject:\|DNS:"

# Reload Apache after configuration changes
systemctl reload apache2

# View ISPConfig log
tail -f /var/log/ispconfig/ispconfig.log

# Clear DNS cache (macOS)
sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder

# Clear DNS cache (Linux)
sudo systemd-resolve --flush-caches
```

## Lessons Learned

1. **Read your own documentation** - If you documented firewall requirements, read them before starting
2. **DNS caching is pervasive** - From router to browser, multiple layers cache DNS
3. **Consumer routers have aggressive caching** - Public DNS resolvers are more reliable
4. **Browser cache causes most "it doesn't work" issues** - Test in incognito first
5. **Automation tools have conventions** - ISPConfig expects `standard_index.html`, certbot creates `000-default-le-ssl.conf`
6. **Mixing management tools creates conflicts** - Pick ISPConfig or manual configuration, not both
