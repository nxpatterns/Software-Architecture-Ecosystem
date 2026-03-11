# SSL Certificate Management and Server Setup

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=5 orderedList=false} -->

<!-- code_chunk_output -->

- [Certbot Automatic Renewal](#certbot-automatic-renewal)
  - [How Certbot Renewal Works](#how-certbot-renewal-works)
  - [Check Renewal Schedule](#check-renewal-schedule)
  - [View Timer Configuration](#view-timer-configuration)
  - [Verify Renewal Works](#verify-renewal-works)
- [SSL Certificates for Multiple Domains](#ssl-certificates-for-multiple-domains)
  - [Adding www Subdomain to Existing Certificate](#adding-www-subdomain-to-existing-certificate)
  - [Verify Certificate Covers Both Domains](#verify-certificate-covers-both-domains)
- [Apache SSL Configuration](#apache-ssl-configuration)
  - [Understanding Virtual Hosts](#understanding-virtual-hosts)
  - [SSL Virtual Host Configuration](#ssl-virtual-host-configuration)
  - [Changing DocumentRoot](#changing-documentroot)
  - [Testing Configuration](#testing-configuration)
- [Node.js Version Management with `n`](#nodejs-version-management-with-n)
  - [Why Use `n`?](#why-use-n)
  - [Installation](#installation)
  - [Using `n`](#using-n)
  - [Verify Installation](#verify-installation)
- [Creating Quick HTML Pages with npx](#creating-quick-html-pages-with-npx)
  - [Using create-html-boilerplate](#using-create-html-boilerplate)
  - [Alternative: HTML5 Boilerplate](#alternative-html5-boilerplate)
  - [Alternative: Simple create-html](#alternative-simple-create-html)
- [Common Issues and Solutions](#common-issues-and-solutions)
  - [Issue: "Not Secure" on HTTPS Site](#issue-not-secure-on-https-site)
  - [Issue: Apache Shows Default Page](#issue-apache-shows-default-page)
  - [Issue: Permission Denied on Website Files](#issue-permission-denied-on-website-files)
- [Quick Reference](#quick-reference)
  - [Essential Commands](#essential-commands)
  - [Important Paths](#important-paths)

<!-- /code_chunk_output -->

## Certbot Automatic Renewal

### How Certbot Renewal Works

Certbot uses **systemd timers** (not traditional cron) to automatically renew SSL certificates. Let's Encrypt certificates expire after **90 days**, but Certbot checks twice daily and only renews when ≤30 days remain.

### Check Renewal Schedule

```bash
# View active timers
systemctl list-timers | grep certbot

# Example output:
# Fri 2025-09-12 15:40:10 UTC  6h left  -  -  certbot.timer  certbot.service
```

**Output columns:**

- Next execution time
- Time remaining until next run
- Last trigger time (empty if not run since boot)
- Time since last trigger
- Timer unit name
- Service that gets triggered

### View Timer Configuration

```bash
# Show timer configuration
systemctl cat certbot.timer

# Typical configuration:
# OnCalendar=*-*-* 00,12:00:00    # Runs at midnight and noon
# RandomizedDelaySec=43200         # Adds 0-12 hour random delay
# Persistent=true                  # Catches up if system was down
```

**Why twice daily with randomization?**

- Load distribution across Let's Encrypt servers
- Reliability if one attempt fails
- Most runs do nothing (just check expiration)

### Verify Renewal Works

```bash
# Test renewal without actually renewing
sudo certbot renew --dry-run

# Check current certificates
sudo certbot certificates
```

## SSL Certificates for Multiple Domains

### Adding www Subdomain to Existing Certificate

If you have a certificate for `example.com` and need to add `www.example.com`:

```bash
sudo certbot --apache -d example.com -d www.example.com
```

**What happens:**

1. Certbot asks which virtual host to update
2. Choose the SSL virtual host (HTTPS/443)
3. New certificate covers both domains
4. Apache config automatically updated with `ServerAlias`

### Verify Certificate Covers Both Domains

```bash
sudo certbot certificates

# Output shows:
# Domains: example.com www.example.com
```

Test both:

```bash
curl -I https://example.com
curl -I https://www.example.com
```

**Common issue:** If www fails with SSL error, the certificate doesn't include www - rerun certbot with both domains.

## Apache SSL Configuration

### Understanding Virtual Hosts

Check Apache virtual host configuration:

```bash
sudo apache2ctl -S

# Example output:
# *:443  example.com (/etc/apache2/sites-enabled/000-default-le-ssl.conf:2)
# *:80   www.example.com (/etc/apache2/sites-enabled/000-default.conf:1)
```

**Key points:**

- Port 443 handles HTTPS
- Port 80 handles HTTP (should redirect to HTTPS)
- ServerName must match in both configs

### SSL Virtual Host Configuration

```bash
# View SSL site config
sudo cat /etc/apache2/sites-available/000-default-le-ssl.conf
```

**Critical settings:**

```apache
<VirtualHost *:443>
    ServerName example.com
    ServerAlias www.example.com          # Add this for www support
    DocumentRoot /var/www/example.com    # Your site directory

    SSLCertificateFile /etc/letsencrypt/live/example.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/example.com/privkey.pem
    Include /etc/letsencrypt/options-ssl-apache.conf
</VirtualHost>
```

### Changing DocumentRoot

**Default:** Apache serves `/var/www/html` (Apache default page)

**To serve your site:**

1. Create site directory:

```bash
sudo mkdir -p /var/www/example.com
```

2. Update SSL config:

```bash
sudo nano /etc/apache2/sites-available/000-default-le-ssl.conf

# Change:
DocumentRoot /var/www/example.com
```

3. Set permissions:

```bash
sudo chown -R www-data:www-data /var/www/example.com
```

4. Reload Apache:

```bash
sudo systemctl reload apache2
```

### Testing Configuration

```bash
# Test config syntax
sudo apache2ctl configtest

# Reload if OK
sudo systemctl reload apache2

# Verify site serves correctly
curl -I https://example.com
```

## Node.js Version Management with `n`

### Why Use `n`?

`n` is a simple Node.js version manager. Unlike `nvm`, it:

- Doesn't require shell configuration
- Works system-wide
- Simple commands to switch versions

### Installation

**Bootstrap problem:** `n` needs Node.js to run, but you're installing Node.js.

**Solution - direct install via curl:**

```bash
curl -fsSL https://raw.githubusercontent.com/tj/n/master/bin/n | sudo bash -s lts
```

This installs Node.js LTS **but doesn't install `n` itself**.

**Install `n` for version management:**

```bash
sudo npm install -g n
```

### Using `n`

```bash
# Install latest version
sudo n latest

# Install LTS version
sudo n lts

# Install specific version
sudo n 18.17.0

# List installed versions
n ls

# Remove old versions
sudo n prune
```

**Why sudo?** `n` installs to system directories (`/usr/local`). This is normal for system-wide installation.

### Verify Installation

```bash
node --version
npm --version
n --version
```

## Creating Quick HTML Pages with npx

### Using create-html-boilerplate

Generates basic HTML/CSS/JS structure without installing anything globally:

```bash
cd /var/www
sudo npx create-html-boilerplate example.com
sudo chown -R www-data:www-data example.com
```

**Generated structure:**

```
example.com/
├── index.html
├── styles/
│   └── main.css
└── scripts/
    └── main.js
```

### Alternative: HTML5 Boilerplate

More comprehensive, production-ready template:

```bash
npx create-html5-boilerplate example.com
```

### Alternative: Simple create-html

For single HTML file:

```bash
npx create-html \
  --title "Coming Soon" \
  --body "<h1>Coming Soon</h1><p>Site launching soon</p>" \
  --output index.html
```

## Common Issues and Solutions

### Issue: "Not Secure" on HTTPS Site

**Cause:** Certificate doesn't cover the domain you're accessing.

**Solution:**

```bash
# Check which domains are covered
sudo certbot certificates

# Add missing domain
sudo certbot --apache -d example.com -d www.example.com
```

### Issue: Apache Shows Default Page

**Cause:** DocumentRoot points to `/var/www/html` instead of your site.

**Solution:**

```bash
# Update DocumentRoot in SSL config
sudo nano /etc/apache2/sites-available/000-default-le-ssl.conf

# Change to your site directory
DocumentRoot /var/www/example.com

# Reload
sudo systemctl reload apache2
```

### Issue: Permission Denied on Website Files

**Cause:** Wrong ownership on site files.

**Solution:**

```bash
sudo chown -R www-data:www-data /var/www/example.com
sudo chmod -R 755 /var/www/example.com
```

## Quick Reference

### Essential Commands

```bash
# SSL certificates
sudo certbot certificates                    # List certificates
sudo certbot renew --dry-run                # Test renewal
sudo certbot --apache -d domain.com         # Get/update certificate

# Apache
sudo apache2ctl -S                          # Show virtual hosts
sudo apache2ctl configtest                  # Test config
sudo systemctl reload apache2               # Reload config

# Node.js version management
sudo n lts                                  # Install LTS
sudo n latest                               # Install latest
n ls                                        # List versions

# File permissions
sudo chown -R www-data:www-data /var/www/site
sudo chmod -R 755 /var/www/site
```

### Important Paths

```plaintext
/etc/letsencrypt/live/domain.com/           # SSL certificates
/etc/apache2/sites-available/               # Apache site configs
/etc/apache2/sites-enabled/                 # Enabled site configs
/var/www/                                   # Website root directory
/var/log/apache2/                           # Apache logs
/var/log/letsencrypt/                       # Certbot logs
```
