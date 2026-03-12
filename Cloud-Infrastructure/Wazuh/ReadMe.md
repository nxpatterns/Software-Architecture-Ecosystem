# Debian Server Security Hardening Guide

## ISPConfig + Wazuh SIEM + fail2ban Configuration

### Overview

This guide covers hardening a Debian 12 server running ISPConfig 3.3+ with comprehensive security monitoring, intrusion detection, and automated threat response. The setup includes:

- **Wazuh SIEM** - Real-time security monitoring and threat detection
- **fail2ban** - Automated IP blocking for brute-force attacks
- **Let's Encrypt SSL** - Trusted certificates for all services
- **Active Response** - Automatic threat mitigation

### System Requirements

- **OS:** Debian 12 (Bookworm)
- **RAM:** Minimum 8GB (Wazuh indexer requires ~4GB)
- **Disk:** 20GB+ free space
- **Existing:** ISPConfig installation with Apache/Nginx

## Part 1: Initial Security Assessment

### Check ISPConfig Version

```bash
grep -i version /usr/local/ispconfig/interface/lib/config.inc.php
```

**Note on versioning:** ISPConfig 3.3.x is actually newer than 3.2.x. The 3.2.x branch is the stable release line, while 3.3.x represents development builds that became the next stable version. Always verify which is actually newer before upgrading.

### Assess Current Security Posture

```bash
# Check open ports
netstat -tlnp | grep LISTEN

# Review Apache virtual hosts
apache2ctl -S

# Check existing fail2ban jails
fail2ban-client status
```

## Part 2: Wazuh SIEM Installation

### Prerequisites Check

Wazuh officially supports RHEL/CentOS/Ubuntu but works on Debian with the `-i` flag to skip OS validation.

### Installation Process

```bash
cd /tmp
curl -sO https://packages.wazuh.com/4.7/wazuh-install.sh
chmod +x wazuh-install.sh

# Install with ignore OS check and custom port (Port 443 likely used by ISPConfig)
bash wazuh-install.sh -a -i -p 8443
```

**Important:** Port 443 is typically occupied by web services. Use port 8443 for Wazuh dashboard.

### Save Installation Credentials

```bash
# Credentials are stored in installation archive
cd /tmp
tar -xf wazuh-install-files.tar
cat wazuh-passwords.txt

# Store these credentials securely
```

### Handle Port Conflicts

If installation fails with port conflict:

```bash
# Check what's using port 443
netstat -tlnp | grep :443
lsof -i :443

# Specify alternative port
bash wazuh-install.sh -a -i -p 8443
```

### Memory Management for Wazuh Indexer

**Critical Issue:** Wazuh indexer (OpenSearch) can consume 4GB+ RAM and trigger OOM (Out of Memory) killer on systems with limited resources.

**Symptoms:**

```bash
# Check for OOM kills
dmesg | grep -i "killed\|oom"
journalctl --since "1 hour ago" | grep -i "killed\|oom"
```

**Solution - Reduce JVM Heap Size:**

```bash
nano /etc/wazuh-indexer/jvm.options

# Change from default (1g) to:
-Xms512m
-Xmx1g
```

**Add Swap Space (Recommended for <16GB RAM):**

```bash
# Create 2GB swap file
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Verify
free -h
```

### Verify Installation

```bash
# Check all Wazuh services
/var/ossec/bin/wazuh-control status

# Expected running services:
# - wazuh-modulesd
# - wazuh-monitord
# - wazuh-logcollector
# - wazuh-remoted
# - wazuh-syscheckd
# - wazuh-analysisd
# - wazuh-execd
# - wazuh-db
# - wazuh-authd
# - wazuh-apid

# Check indexer and dashboard
systemctl status wazuh-indexer
systemctl status wazuh-dashboard
```

### Access Wazuh Dashboard

- **URL:** `https://your-server-ip:8443`
- **Username:** admin
- **Password:** From wazuh-passwords.txt

## Part 3: fail2ban Configuration

### Installation

```bash
apt-get update
apt-get install fail2ban
```

### Configure Jails

Create comprehensive jail configuration:

```bash
nano /etc/fail2ban/jail.local
```

**Basic Configuration:**

ini

```ini
[DEFAULT]
bantime = 3600       # 1 hour ban
findtime = 600       # 10 minute window
maxretry = 3         # 3 failed attempts

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
findtime = 600

[pure-ftpd]
enabled = true
port = ftp
filter = pure-ftpd
logpath = /var/log/syslog
maxretry = 3

[dovecot]
enabled = true
filter = dovecot
logpath = /var/log/mail.log
maxretry = 5

[postfix-sasl]
enabled = true
port = smtp
filter = postfix[mode=auth]
logpath = /var/log/mail.log
maxretry = 3

[apache-auth]
enabled = true
filter = apache-auth
logpath = /var/log/apache2/error.log
maxretry = 3

[apache-badbots]
enabled = true
filter = apache-badbots
logpath = /var/log/apache2/access.log
maxretry = 3
```

### WordPress Protection

```bash
# Add to jail.local
[wordpress]
enabled = true
filter = wordpress
logpath = /var/log/apache2/access.log
maxretry = 3
bantime = 3600
```

**Create WordPress filter:**

```bash
nano /etc/fail2ban/filter.d/wordpress.conf
```

ini

```ini
[Definition]
failregex = ^<HOST> .* "POST /wp-login.php
            ^<HOST> .* "POST /wp-admin/admin-ajax.php.*wp_login_error
            ^<HOST> .* "GET /wp-login.php.*wp_login_failed
```

### ISPConfig Protection

```bash
nano /etc/fail2ban/filter.d/ispconfig.conf
```

ini

```ini
[Definition]
failregex = ^<HOST> .* "POST .*:8080.*login.*
```

**Add to jail.local:**

ini

```ini
[ispconfig]
enabled = true
filter = ispconfig
logpath = /var/log/apache2/access.log
maxretry = 3
bantime = 3600
```

### Start and Verify fail2ban

```bash
systemctl enable --now fail2ban
systemctl status fail2ban

# Check active jails
fail2ban-client status

# View specific jail
fail2ban-client status sshd

# List all banned IPs
fail2ban-client banned
```

## Part 4: Wazuh Active Response

Active Response enables Wazuh to automatically block attackers in real-time, complementing fail2ban.

### Configure Active Response

```bash
nano /var/ossec/etc/ossec.conf
```

**Add before `</ossec_config>`:**

xml

```xml
<!-- SSH Brute Force Protection -->
<active-response>
  <command>firewall-drop</command>
  <location>local</location>
  <rules_id>5503,5712,5720</rules_id>
  <timeout>3600</timeout>
</active-response>

<!-- Web Attack Protection -->
<active-response>
  <command>firewall-drop</command>
  <location>local</location>
  <rules_id>31103,31108,31151</rules_id>
  <timeout>3600</timeout>
</active-response>

<!-- Multiple Login Failures -->
<active-response>
  <command>firewall-drop</command>
  <location>local</location>
  <rules_id>5551,5402</rules_id>
  <timeout>7200</timeout>
</active-response>
```

**Rule ID Reference:**

- **5503:** PAM authentication failure
- **5712:** SSHD brute force attempt
- **5720:** Multiple SSHD authentication failures
- **31103:** Web server 400 error code
- **31108:** Access to non-existent file
- **31151:** Multiple web authentication failures
- **5551:** Multiple authentication failures (generic)
- **5402:** System integrity checksum changed

### Restart Wazuh

```bash
systemctl restart wazuh-manager
```

### Monitor Active Response

```bash
# Watch active response in real-time
tail -f /var/ossec/logs/active-responses.log

# Check blocked IPs via iptables
iptables -L INPUT -n | grep DROP
```

### Verify Dual Protection

```bash
# Wazuh blocked IPs
iptables -L INPUT -n | grep DROP

# fail2ban blocked IPs
fail2ban-client banned
```

Both systems work together: fail2ban provides pattern-based blocking while Wazuh offers intelligence-driven active response.

## Part 5: SSL Certificate Management

### Understanding ISPConfig DNS vs External DNS

**Important:** ISPConfig's DNS module only manages zones that ISPConfig itself hosts as nameserver. If your domain uses external DNS (Hetzner, Cloudflare, etc.), you must configure subdomains there.

**Check your nameservers:**

```bash
dig ns yourdomain.com
```

If results show external nameservers (ns1.hetzner.com, cloudflare.com, etc.), configure DNS records at that provider, not in ISPConfig.

### Create Subdomain for Wazuh

**At your DNS provider (e.g., Hetzner):**

- Type: A
- Name: wazuh
- Value: your-server-ip
- TTL: 3600

**Verify DNS propagation:**

```bash
dig wazuh.yourdomain.com
nslookup wazuh.yourdomain.com

# Test from different DNS servers
dig @8.8.8.8 wazuh.yourdomain.com
dig @1.1.1.1 wazuh.yourdomain.com
```

### ISPConfig Subdomain Configuration

**In ISPConfig → Sites → yourdomain.com → Options tab:**

- Auto-Subdomain: `wazuh`
- SSL Subdomain: ✓ (checked)

This creates Apache virtual host configuration automatically.

### Let's Encrypt Certificate with Multiple Domains

**Important Note:** ISPConfig's SSL tab is for manual certificates only. Let's Encrypt is managed from the Main tab, but may not expose all configuration options in older versions.

**Install certbot if not present:**

```bash
apt-get update
apt-get install certbot python3-certbot-apache
```

**Expand certificate to include subdomain:**

```bash
# Use Apache plugin for automatic configuration
certbot --apache -d yourdomain.com -d www.yourdomain.com -d wazuh.yourdomain.com --expand
```

**Verify certificate includes all domains:**

bash

````bash
openssl s_client -connect wazuh.yourdomain.com:443 -servername wazuh.yourdomain.com 2>/dev/null | openssl x509 -noout -text | grep -A 3 "Subject Alternative Name"

# Should show:
# DNS:yourdomain.com, DNS:www.yourdomain.com, DNS:wazuh.yourdomain.com
```

### Common Certificate Issues

**Issue: webroot authentication fails**
```
Type: unauthorized
Detail: Invalid response from http://domain/.well-known/acme-challenge/
````

**Solution:** Use Apache plugin instead of webroot:

```bash
certbot --apache -d domain.com --expand
```

**Issue: DNS resolution works globally but not locally**

This occurs when:

1. New subdomain created
2. ISP/router DNS cache hasn't updated
3. Global DNS (8.8.8.8) works, but local resolver doesn't

**Diagnosis:**

```bash
# Works:
dig @8.8.8.8 wazuh.yourdomain.com

# Fails:
host wazuh.yourdomain.com
```

**Solutions:**

- Restart router to clear DNS cache
- Temporarily add to /etc/hosts: `server-ip wazuh.yourdomain.com`
- Wait 24-72 hours for ISP DNS cache to update

### Apply Certificate to Wazuh Dashboard

```bash
# Copy Let's Encrypt certificates to Wazuh
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /etc/wazuh-dashboard/certs/dashboard.pem
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /etc/wazuh-dashboard/certs/dashboard-key.pem

# Set correct permissions
chown wazuh-dashboard:wazuh-dashboard /etc/wazuh-dashboard/certs/dashboard*
chmod 600 /etc/wazuh-dashboard/certs/dashboard*

# Restart dashboard
systemctl restart wazuh-dashboard
```

### Certificate Auto-Renewal

Certbot automatically sets up renewal via systemd timer:

```bash
# Check renewal timer
systemctl status certbot.timer

# Test renewal (dry-run)
certbot renew --dry-run

# Manual renewal if needed
certbot renew
```

**Note:** ISPConfig may overwrite Apache configurations on updates. After major ISPConfig updates, verify certificate paths in virtual host configs.

## Part 6: Malware Scanning (Optional)

### ISPProtect (Commercial)

ISPConfig extension for malware scanning.

**Installation via ISPConfig:**

- System → Extension Installer → Available Extensions
- Install "isppscan"
- Enter license key or "TRIAL"
- Scan path: `/var/www`

**Results locations:**

```bash
/usr/local/ispprotect/found_malware_*.txt
/usr/local/ispprotect/software_wordpress_*.txt
/usr/local/ispprotect/software_phpmyadmin_*.txt
```

### Free Alternatives

**ClamAV:**

```bash
apt-get install clamav clamav-daemon
freshclam
clamscan -r /var/www
```

**Linux Malware Detect:**

```bash
cd /tmp
wget http://www.rfxn.com/downloads/maldetect-current.tar.gz
tar xzf maldetect-current.tar.gz
cd maldetect-*/
./install.sh
maldet -a /var/www
```

**rkhunter (Rootkit detection):**

```bash
apt-get install rkhunter
rkhunter --update
rkhunter --check
```

## Part 7: Monitoring and Maintenance

### Regular Security Checks

**Daily:**

```bash
# Check blocked IPs
fail2ban-client banned

# View recent Wazuh alerts
tail -100 /var/ossec/logs/alerts/alerts.log

# Monitor active connections
netstat -plant | grep ESTABLISHED
```

**Weekly:**

```bash
# Review Wazuh dashboard for attack patterns
# Check for failed login attempts
# Review file integrity changes
# Verify all services running
/var/ossec/bin/wazuh-control status
```

**Monthly:**

```bash
# Update system packages
apt-get update && apt-get upgrade

# Review and clean old logs
journalctl --vacuum-time=30d

# Verify SSL certificate expiry
certbot certificates
```

### Log Locations

**Wazuh:**

- Main log: `/var/ossec/logs/ossec.log`
- Alerts: `/var/ossec/logs/alerts/alerts.log`
- Active Response: `/var/ossec/logs/active-responses.log`

**fail2ban:**

- Main log: `/var/log/fail2ban.log`

**Apache/Web:**

- Access: `/var/log/apache2/access.log`
- Error: `/var/log/apache2/error.log`

**System:**

- Auth: `/var/log/auth.log`
- Syslog: `/var/log/syslog`

### Performance Monitoring

bash

````bash
# Check Wazuh indexer memory usage
ps aux | grep wazuh-indexer

# Monitor system resources
free -h
df -h
top
htop

# Check disk I/O
iostat -x 1
```

---

## Part 8: Troubleshooting

### Wazuh Dashboard "Not Ready"

**Symptoms:**
```
Wazuh dashboard server is not ready yet
````

**Diagnosis:**

```bash
journalctl -u wazuh-dashboard -f
# Look for: ConnectionError: connect ECONNREFUSED 127.0.0.1:9200
```

**Cause:** Wazuh indexer not running (often due to OOM kill)

**Solution:**

bash

````bash
# Check indexer status
systemctl status wazuh-indexer

# Check for OOM kills
dmesg | grep -i "killed\|oom"

# Reduce JVM heap size (see Part 2)
nano /etc/wazuh-indexer/jvm.options

# Restart services in order
systemctl restart wazuh-indexer
sleep 30
systemctl restart wazuh-dashboard
```

### Browser Shows "Not Secure" Despite Valid Certificate

**Symptoms:**
- Certificate is valid (verified via `openssl s_client`)
- Browser shows "Not secure" or certificate error
- Works in incognito/private mode

**Cause:** Browser cached old certificate or SSL exception

**Solution:**
1. Click lock icon → Site settings → Delete data
2. Clear browser cache for specific site
3. Restart browser completely
4. Test in incognito mode to verify

**Known Issue:** Chromium-based browsers (Chrome, Brave, Edge) can cache certificates across different ports of the same domain. Accessing both `domain.com:443` (Let's Encrypt) and `domain.com:8080` (self-signed) may cause certificate confusion.

### Certificate Chain Issues

**Symptoms:**
```
SSL routines:ssl3_read_bytes:sslv3 alert certificate unknown
````

**Diagnosis:**

```bash
# Check certificate chain
openssl s_client -connect domain.com:443 -servername domain.com

# Verify certificate files exist
ls -la /etc/wazuh-dashboard/certs/
```

**Solution:**

- Ensure fullchain.pem is used (not just cert.pem)
- Verify certificate ownership and permissions
- Restart service after certificate changes

### fail2ban Not Blocking

**Diagnosis:**

```bash
# Check jail status
fail2ban-client status jail-name

# View fail2ban log
tail -f /var/log/fail2ban.log

# Test filter manually
fail2ban-regex /var/log/auth.log /etc/fail2ban/filter.d/sshd.conf
```

**Common Issues:**

- Wrong log path in jail configuration
- Filter regex doesn't match log format
- Service hasn't restarted after config change

**Solution:**

```bash
# Restart fail2ban
systemctl restart fail2ban

# Verify filter matches logs
fail2ban-regex /path/to/log /etc/fail2ban/filter.d/yourfilter.conf
```

## Part 9: Security Best Practices

### Principle of Layered Defense

This setup provides multiple security layers:

1. **Network Level:** firewall-drop via iptables (Wazuh + fail2ban)
2. **Application Level:** Login attempt monitoring
3. **File System Level:** File integrity monitoring (Wazuh)
4. **Log Level:** Centralized analysis (Wazuh SIEM)

### Whitelisting Your IP

Prevent accidental self-lockout:

```bash
nano /etc/fail2ban/jail.local
```

**Add under `[DEFAULT]`:**

```ini
ignoreip = 127.0.0.1/8 ::1 your-static-ip
```

### Regular Updates

```bash
# System updates
apt-get update && apt-get upgrade

# Wazuh updates (check before running)
# Note: Major version upgrades require careful planning
```

### Backup Strategy

**Critical files to backup:**

```bash
# Wazuh configuration
/var/ossec/etc/ossec.conf

# fail2ban configuration
/etc/fail2ban/jail.local
/etc/fail2ban/filter.d/

# SSL certificates (auto-renewed, but good to backup)
/etc/letsencrypt/

# ISPConfig database
mysqldump dbispconfig > backup.sql
```

### Security Monitoring Checklist

- Review Wazuh alerts daily
- Check fail2ban banned list
- Monitor disk space (logs can fill up)
- Verify all security services running
- Review file integrity alerts
- Update attack signatures/rules monthly
- Test backups quarterly
- Review and rotate logs

## Appendix: Useful Commands Reference

### Service Management

```bash
# Wazuh
systemctl status wazuh-manager
systemctl status wazuh-indexer
systemctl status wazuh-dashboard
/var/ossec/bin/wazuh-control status

# fail2ban
systemctl status fail2ban
fail2ban-client status
fail2ban-client status jail-name
fail2ban-client banned

# Apache
systemctl status apache2
apache2ctl -S
```

### Network Diagnostics

```bash
# Check listening ports
netstat -tlnp
ss -tlnp

# Check active connections
netstat -plant

# Check firewall rules
iptables -L -n
iptables -L INPUT -n | grep DROP
```

### Certificate Management

```bash
# View certificate details
openssl x509 -in /path/to/cert.pem -text -noout

# Check certificate chain
openssl s_client -connect domain:443 -servername domain

# List certbot certificates
certbot certificates

# Renew certificates
certbot renew
```

### Log Analysis

```bash
# Real-time log monitoring
tail -f /var/log/auth.log
tail -f /var/ossec/logs/alerts/alerts.log

# Search logs
grep "failed password" /var/log/auth.log
grep -i "attack" /var/ossec/logs/alerts/alerts.log

# Count occurrences
grep "authentication failure" /var/log/auth.log | wc -l
```

### Resource Monitoring

```bash
# Memory usage
free -h
ps aux --sort=-%mem | head

# Disk usage
df -h
du -sh /var/log/*

# System load
uptime
top
htop
```

## Conclusion

This security hardening setup provides:

- **Real-time threat detection** via Wazuh SIEM
- **Automated blocking** via fail2ban and Active Response
- **Encrypted communications** via Let's Encrypt SSL
- **Comprehensive logging** for forensic analysis
- **Layered defense** against multiple attack vectors

Regular monitoring and maintenance are essential. Security is not a one-time setup but an ongoing process.

### Key Takeaways

1. **Memory management matters:** Wazuh indexer requires adequate RAM and swap
2. **DNS propagation takes time:** Be patient with new subdomains
3. **Browser caching affects SSL:** Clear site data when testing certificates
4. **Layered security works:** Multiple systems (Wazuh + fail2ban) provide redundancy
5. **Monitor actively:** Review logs and alerts regularly

### Further Reading

- Wazuh Documentation: [https://documentation.wazuh.com](https://documentation.wazuh.com/)
- fail2ban Manual: [https://www.fail2ban.org](https://www.fail2ban.org/)
- ISPConfig Documentation: [https://www.ispconfig.org/documentation/](https://www.ispconfig.org/documentation/)
- Let's Encrypt: [https://letsencrypt.org/docs/](https://letsencrypt.org/docs/)
