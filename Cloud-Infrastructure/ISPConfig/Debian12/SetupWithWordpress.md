# ISPConfig 3 Installation Guide for Hetzner Cloud

## Overview

This guide covers the complete setup of ISPConfig 3 on a fresh Hetzner Cloud server running Debian 12 (Bookworm). ISPConfig is a comprehensive web hosting control panel that provides multi-client website management, email services, DNS management, and database administration.

**Use Case:** Production-ready hosting environment for multiple domains with different technology stacks (PHP/WordPress, Node.js applications, PostgreSQL databases).

**License:** BSD-3-Clause (free for commercial use, including hosting/reseller business)

## Prerequisites

### Server Requirements

- Fresh Hetzner Cloud server (Ubuntu 24.04 or Debian 12)
- Root SSH access
- Minimum 2GB RAM recommended
- Static IP address assigned by Hetzner

### DNS Prerequisites
Before installation, ensure you have:

- A fully qualified domain name (FQDN) for the server hostname
- DNS A-record pointing to your server IP
- Example: `server.yourdomain.com` → `your.server.ip`

**Critical:** ISPConfig requires a proper FQDN as hostname. Simple domain names (without subdomain) may cause installation errors.

## Initial Server Setup

### 1. SSH Access Configuration

Create SSH config for convenient access:

```bash
# Local machine: ~/.ssh/config
Host yourserver
    HostName your.server.ip
    User root
    IdentityFile ~/.ssh/your_keyname
```

**Important:** SSH uses `~/.ssh/id_rsa` by default. If your key has a different name, you must specify it explicitly with `-i` flag or in SSH config.

### 2. System Updates

```bash
apt update && apt upgrade -y
```

### 3. Hostname Configuration

Set proper FQDN hostname before ISPConfig installation:

```bash
# Set hostname
hostnamectl set-hostname server.yourdomain.com

# Add to /etc/hosts
echo "127.0.0.1 server.yourdomain.com server" >> /etc/hosts

# Verify
hostnamectl
```

**Common Error:** Installation fails with "Host name is no FQDN" if hostname is not properly configured.

## ISPConfig Installation

### Download and Run Automated Installer

```bash
wget -O ispconfig3-install.sh https://get.ispconfig.org
bash ispconfig3-install.sh
```

### Installation Process

The installer is interactive and will:

1. **Reconfigure entire server** - Only run on fresh installations
2. Install complete LEMP/LAMP stack (Nginx/Apache, MySQL/MariaDB, PHP)
3. Install mail server (Postfix, Dovecot)
4. Configure firewall and services
5. Install ISPConfig control panel

**Duration:** 15-30 minutes depending on server performance

### Installation Prompts

During installation, you'll be asked:

- **MySQL root password:** Choose strong password (save securely)
- **Web server:** Choose Nginx for modern deployments
- **Mail server:** Postfix + Dovecot (standard choice)
- **SSL certificate:** Let's Encrypt for panel (recommended)
- **ISPConfig admin password:** Generated automatically (save this!)

**Critical:** Save both MySQL root password and ISPConfig admin password immediately.

## Firewall Configuration

### Hetzner Cloud Firewall

ISPConfig installation doesn't configure Hetzner's cloud firewall. Required ports:

**Essential Ports:**

- `22` - SSH (already enabled if you can connect)
- `8080` - ISPConfig admin panel
- `80` - HTTP
- `443` - HTTPS

**Optional Ports (if using email services):**

- `25` - SMTP
- `587` - SMTP submission
- `993` - IMAP SSL
- `995` - POP3 SSL

**Configuration via Hetzner Console:**

1. Navigate to your server in Hetzner Cloud Console
2. Go to "Firewalls" tab
3. Edit firewall rules
4. Add inbound rules for each required port
5. Protocol: TCP, Source: 0.0.0.0/0 (or restrict to specific IPs for security)

### UFW (Ubuntu Firewall)

**Important:** Be careful when enabling UFW via SSH - incorrect configuration can lock you out.

```bash
# Safe UFW activation sequence
ufw allow 22/tcp        # SSH first!
ufw allow 8080/tcp      # ISPConfig panel
ufw allow 80/tcp        # HTTP
ufw allow 443/tcp       # HTTPS
ufw --force enable      # Activate without confirmation

# Verify
ufw status
```

**Best Practice:** Use either Hetzner Cloud Firewall OR UFW, not both simultaneously (to avoid confusion).

## First Login

### Access ISPConfig Panel

```
https://your.server.ip:8080
```

**SSL Certificate Warning:** On first access, browser will show security warning because ISPConfig uses self-signed certificate for IP address. This is normal - proceed anyway.

**Login Credentials:**

- Username: `admin`
- Password: (generated during installation, check terminal output)

### Post-Login SSL Configuration

For production use, configure proper SSL:

1. Navigate to **System** → **Server Config** → **Web**
2. Generate SSL certificate for `server.yourdomain.com`
3. Access panel via: `https://server.yourdomain.com:8080`

## Multi-Domain Website Setup

### Client Management Structure

ISPConfig uses hierarchical client structure:

- **System Administrator:** Full server access (admin account)
- **Clients:** Individual customers/projects with limited permissions
- **Websites:** Belong to specific clients

**Best Practice:** Create separate client for each customer/project to enable future delegation of management rights.

### Creating First Client

1. Navigate to **Client** → **Add Client**
2. Fill in:
   - Company Name
   - Contact Name
   - Email
   - Limits (disk space, databases, etc.)

### Adding Website

1. Navigate to **Sites** → **Website** → **Add Website**
2. Configuration:
   - **Client:** Select previously created client
   - **Domain:** `yourdomain.com`
   - **Auto-Subdomain:** `www` (creates www.yourdomain.com automatically)
   - **IPv4-Address:** `*` (uses all available IPs)
   - **IPv6-Address:** Leave empty unless using IPv6
   - **Web Server Config:** `-` (uses default Nginx configuration)
   - **PHP:** Select version (e.g., `PHP 8.3`)
   - **SSL:** `y` (enable SSL support)

### DNS Configuration

Before website becomes accessible, configure DNS records:

**Required A-Records:**

```
yourdomain.com         A    your.server.ip
www.yourdomain.com     A    your.server.ip
```

**Propagation:** DNS changes can take minutes to hours. Test with:

```bash
dig yourdomain.com
nslookup yourdomain.com
```

### SSL Certificate (Let's Encrypt)

After DNS is configured:

1. Edit website in ISPConfig
2. Navigate to **SSL** tab
3. Enable:
   - **Let's Encrypt SSL:** `y`
   - **Let's Encrypt:** `y`
4. Save

**Certificate Generation:** Automatic, renews every 90 days automatically.

## WordPress Installation

### Database Creation

1. Navigate to **Sites** → **Database** → **Add Database**
2. Configuration:
   - **Client:** Select website owner
   - **Database Name:** `wp_database` (use descriptive names)
   - **Database User:** `wp_user`
   - **Database Password:** Generate strong password
   - **Database Charset:** **UTF-8** (required for WordPress)

**Important:** Always use UTF-8 charset for WordPress databases to support international characters and emojis.

### File Structure

ISPConfig creates directory structure automatically:

```
/var/www/yourdomain.com/
├── web/              # Document root (public files go here)
├── private/          # Private files (not web-accessible)
├── log/              # Access/error logs
├── ssl/              # SSL certificates
└── tmp/              # Temporary files
```

**Document Root:** `/var/www/yourdomain.com/web/`

### User/Group Ownership

ISPConfig creates unique system users for each website:

```bash
# Check ownership
ls -la /var/www/yourdomain.com/

# Common pattern
web1:client1    # First website, first client
web2:client1    # Second website, same client
```

**Usage:** Required for file permission operations.

### WordPress Download and Installation

```bash
# Navigate to document root
cd /var/www/yourdomain.com/web

# Download latest WordPress
wget https://wordpress.org/latest.tar.gz

# Extract (--strip-components=1 extracts directly without wordpress/ folder)
tar -xzf latest.tar.gz --strip-components=1

# Remove archive
rm latest.tar.gz

# Set correct ownership (replace web1:client1 with actual values)
chown -R web1:client1 /var/www/yourdomain.com/web/

# Set permissions
chmod -R 755 /var/www/yourdomain.com/web/
```

### WordPress Setup Wizard

1. Navigate to: `https://yourdomain.com/wp-admin`
2. WordPress installation wizard starts
3. Enter database credentials:
   - **Database Name:** Created in ISPConfig
   - **Username:** Database user from ISPConfig
   - **Password:** Database password
   - **Database Host:** `localhost`
   - **Table Prefix:** `wp_` (default, can customize)
4. Configure site:
   - **Site Title:** Your website name
   - **Admin Username:** Choose secure username
   - **Admin Password:** Generate strong password
   - **Admin Email:** Your email address

**Installation Complete:** WordPress is ready to use.

### WordPress Reset/Cleanup

If you need to reset WordPress after testing themes/plugins:

**Method 1: WP Reset Plugin**

- Install "WP Reset" plugin
- Tools → WP Reset → Reset Site
- Keeps admin user, removes all content/settings

**Method 2: Database Reset via phpMyAdmin**

1. Access phpMyAdmin through ISPConfig
2. Select WordPress database
3. Drop all tables
4. WordPress will prompt for fresh installation on next access

**Method 3: Complete Fresh Install**

```bash
cd /var/www/yourdomain.com/web
rm -rf *
# Then repeat WordPress installation steps above
```

## Node.js Application Setup

### Use Case: Modern JavaScript Applications

ISPConfig doesn't natively manage Node.js applications, but provides foundation:

- Nginx reverse proxy configuration
- SSL certificate management
- User/permission management
- PostgreSQL database access

### Website Configuration for Node.js

1. Create website in ISPConfig
2. **Important differences from PHP:**
   - Don't select PHP version
   - Enable SSL for HTTPS
   - Node.js app runs independently, Nginx proxies requests

### PostgreSQL Database

1. Navigate to **Sites** → **Database** → **Add Database**
2. **Database Type:** Select **PostgreSQL** (not MySQL)
3. Configure credentials as needed

### Manual Nginx Configuration

ISPConfig generates basic Nginx config. For Node.js reverse proxy:

```bash
# Custom config location
/etc/nginx/sites-available/yourdomain.com.vhost

# Add reverse proxy configuration
location / {
    proxy_pass http://localhost:3000;  # Your Node.js app port
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}

# Reload Nginx
systemctl reload nginx
```

### Process Management

**PM2 for Node.js applications:**

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start app.js --name "yourapp"

# Enable auto-restart on server reboot
pm2 startup
pm2 save
```

## Email Configuration

### Email Forwarding (Domain → External Email)

Common scenario: Forward emails from your domain to Gmail/external provider.

1. Navigate to **Email** → **Email Mailbox** → **Add Mailbox**
2. Or **Email** → **Email Forwarding**
3. Configure forwarding rules

**Alternative (Easier):** Use external services:

- **Cloudflare Email Routing** (free, recommended)
- **SendGrid**
- **Mailgun**

These avoid running full mail server for simple forwarding needs.

## Security Best Practices

### ISPConfig Panel Access

**Restrict Access:**

- Change default port 8080 to custom port
- Use Hetzner firewall to allow only specific IPs
- Enable two-factor authentication if available

### System Updates

```bash
# Regular update schedule
apt update && apt upgrade -y

# Check ISPConfig updates
# ISPConfig → System → Update
```

### Backup Strategy

**Essential backups:**

- ISPConfig configuration
- Website files (`/var/www/`)
- Databases (MySQL/PostgreSQL)
- SSL certificates

**Tools:**

- ISPConfig built-in backup (Sites → Backup)
- Manual: `rsync`, `mysqldump`, `pg_dump`
- Hetzner Snapshots for full server backup

## Troubleshooting

### Connection Timeout to Panel

**Problem:** Cannot access `https://server-ip:8080`

**Solutions:**

1. Check Hetzner Cloud Firewall (port 8080 allowed)
2. Check UFW status: `ufw status`
3. Verify ISPConfig is running: `systemctl status apache2` or `nginx`

### Website Shows Apache Default Page

**Problem:** Domain shows default Apache page instead of website content

**Cause:** Normal behavior before content is added.

**Solution:** Upload website files to `/var/www/yourdomain.com/web/`

### Let's Encrypt SSL Fails

**Common causes:**

- DNS not propagated yet (wait 15-60 minutes)
- Domain not pointing to correct IP
- Port 80/443 blocked by firewall

**Verify DNS:**

```bash
dig yourdomain.com +short
# Should return your server IP
```

### Permission Errors

**Problem:** Cannot write files, upload errors

**Solution:** Fix ownership/permissions

```bash
chown -R webX:clientY /var/www/yourdomain.com/web/
chmod -R 755 /var/www/yourdomain.com/web/
```

Replace `webX:clientY` with actual values from `ls -la` output.

## Common ISPConfig Tasks

### Adding Additional Domains

Same process as first domain:

1. Create client (or use existing)
2. Add website
3. Configure DNS
4. Enable SSL

Each domain is completely isolated - separate files, databases, permissions.

### Client Delegation

To allow clients to manage their own domains:

1. Create client account with appropriate limits
2. Provide client login credentials
3. Client accesses same ISPConfig panel with limited permissions
4. Can only see/manage their own websites/databases

**Security:** Clients cannot access other clients' data or system settings.

### Database Management

**phpMyAdmin:** Available through ISPConfig for MySQL databases
**Access:** Tools → Database Management

For PostgreSQL, configure `pgAdmin` or command-line access.

## Performance Optimization

### PHP-FPM Configuration

ISPConfig creates separate PHP-FPM pool per website by default - good for isolation and performance.

**Tuning:** System → PHP-FPM Settings

- Adjust `pm.max_children` based on RAM
- Monitor with: `systemctl status php8.3-fpm`

### Nginx Caching

Add caching rules in Nginx configuration for static assets.

### Database Optimization

**MySQL:**

```bash
mysqltuner  # Install and run for recommendations
```

**PostgreSQL:**
Adjust `/etc/postgresql/*/main/postgresql.conf` based on RAM.

## Conclusion

ISPConfig provides professional-grade hosting management with:

- Multi-client isolation
- Automatic SSL certificate management
- Support for multiple technology stacks
- Comprehensive email server capabilities

**Key Advantages:**

- Free and open-source (BSD license)
- Commercial use allowed
- Active development and community
- Suitable for hosting business

**Best For:**

- Web hosting providers
- Agencies managing multiple client websites
- Developers running multiple projects
- Anyone needing professional web hosting control

## Additional Resources

- **Official Documentation:** https://www.ispconfig.org/documentation/
- **Community Forum:** https://www.howtoforge.com/community/forums/ispconfig-3.47/
- **ISPConfig Manual:** https://www.ispconfig.org/ispconfig/manual/
