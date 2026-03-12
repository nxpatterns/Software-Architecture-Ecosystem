# Disaster Recovery & Backup

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=5 orderedList=false} -->

<!-- code_chunk_output -->

- [Overview](#overview)
  - [What We're Doing](#what-were-doing)
  - [Why We're Doing It](#why-were-doing-it)
  - [How It Works](#how-it-works)
- [Architecture](#architecture)
  - [Components](#components)
  - [What Gets Backed Up](#what-gets-backed-up)
- [Prerequisites](#prerequisites)
  - [On Production Server](#on-production-server)
  - [External Storage](#external-storage)
  - [External Services (Optional but Recommended)](#external-services-optional-but-recommended)
- [Initial Setup](#initial-setup)
  - [Step 1: Install Borg Backup](#step-1-install-borg-backup)
  - [Step 2: Configure SSH Access to Storage Box](#step-2-configure-ssh-access-to-storage-box)
  - [Step 3: Initialize Borg Repository](#step-3-initialize-borg-repository)
- [Backup Configuration](#backup-configuration)
  - [Step 1: Create Database Dump Directory](#step-1-create-database-dump-directory)
  - [Step 2: Create Backup Script](#step-2-create-backup-script)
  - [Step 3: Test Manual Backup](#step-3-test-manual-backup)
  - [Step 4: Schedule Automated Backups](#step-4-schedule-automated-backups)
- [Monitoring Setup](#monitoring-setup)
  - [Why Multi-Layer Monitoring?](#why-multi-layer-monitoring)
  - [Layer 1: Email Notifications](#layer-1-email-notifications)
  - [Layer 2: Healthchecks.io (Dead Man's Switch)](#layer-2-healthchecksio-dead-mans-switch)
  - [Layer 3: Storage Space Monitoring](#layer-3-storage-space-monitoring)
- [Restore Procedures](#restore-procedures)
  - [Critical: External Key Storage](#critical-external-key-storage)
  - [Testing Restore (Non-Destructive)](#testing-restore-non-destructive)
  - [Full Disaster Recovery (New Server)](#full-disaster-recovery-new-server)
    - [Step 1: Install Base System](#step-1-install-base-system)
    - [Step 2: Configure Storage Access](#step-2-configure-storage-access)
    - [Step 3: List and Select Backup](#step-3-list-and-select-backup)
    - [Step 4: Extract Full Backup](#step-4-extract-full-backup)
    - [Step 5: Restore Databases](#step-5-restore-databases)
    - [Step 6: Restore System Configuration](#step-6-restore-system-configuration)
    - [Step 7: Start Services](#step-7-start-services)
    - [Step 8: Verify Restore](#step-8-verify-restore)
    - [Step 9: Update DNS (If IP Changed)](#step-9-update-dns-if-ip-changed)
- [Best Practices](#best-practices)
  - [Security](#security)
  - [Operational](#operational)
  - [Performance Optimization](#performance-optimization)
- [Troubleshooting](#troubleshooting)
  - [Backup Fails: "Connection refused"](#backup-fails-connection-refused)
  - [Backup Fails: "Repository not found"](#backup-fails-repository-not-found)
  - [Backup Very Slow](#backup-very-slow)
  - [Restore Fails: "Permission denied"](#restore-fails-permission-denied)
  - [Email Notifications Not Received](#email-notifications-not-received)
  - [Healthchecks.io Not Receiving Pings](#healthchecksio-not-receiving-pings)
  - [Database Restore Fails](#database-restore-fails)
  - ["Disk quota exceeded" During Backup](#disk-quota-exceeded-during-backup)
- [Lessons Learned](#lessons-learned)
  - [What Worked Well](#what-worked-well)
  - [Common Mistakes to Avoid](#common-mistakes-to-avoid)
  - [Configuration Trade-offs](#configuration-trade-offs)
- [Quick Reference Commands](#quick-reference-commands)
  - [Daily Operations](#daily-operations)
  - [Maintenance](#maintenance)
  - [Restore Operations](#restore-operations)
- [Conclusion](#conclusion)
- [Additional Resources](#additional-resources)

<!-- /code_chunk_output -->


## Overview

### What We're Doing
Setting up an automated, encrypted backup system for a production server running Docker-based services (mail server, web applications, databases) with comprehensive monitoring and disaster recovery capabilities.

### Why We're Doing It

- **Data Protection**: Protect against hardware failure, human error, or security incidents
- **Business Continuity**: Minimize downtime in case of server failure
- **Compliance**: Meet data retention and recovery requirements
- **Peace of Mind**: Sleep well knowing critical data is safely backed up

### How It Works

- **Borg Backup**: Deduplicating, compressing backup tool that stores incremental backups efficiently
- **Remote Storage**: Backups stored on external storage (Hetzner Storage Box or similar)
- **Automated Schedule**: Daily backups with automatic retention management
- **Multi-layer Monitoring**: Email notifications, external dead man's switch, and local checks

## Architecture

### Components

```
Production Server
├── Docker Containers (Mailserver, Apps, Databases)
├── Nginx (Reverse Proxy)
├── Fail2Ban (Security)
├── IPTables (Firewall)
└── Borg Backup Client

Remote Storage Box
└── Borg Repository
    ├── Daily Backups (7 retained)
    ├── Weekly Backups (4 retained)
    └── Monthly Backups (6 retained)

Monitoring
├── Email Notifications (via own mail server)
├── Healthchecks.io (External dead man's switch)
└── Local Log Monitoring
```

### What Gets Backed Up

**Critical Configurations:**

- `/etc/nginx/` - Web server and reverse proxy configs
- `/etc/iptables/` - Firewall rules
- `/etc/fail2ban/` - Intrusion prevention configs
- `/etc/letsencrypt/` - SSL certificates
- `/etc/sysctl.conf` and `/etc/sysctl.d/` - Kernel tuning (DDoS protection, etc.)

**Application Data:**

- `/opt/` - Docker Compose files and application configs
- Application databases (PostgreSQL dumps)
- User uploads and persistent data

**System Essentials:**

- `/root/.ssh/` and `/home/user/.ssh/` - SSH keys and configs
- Shell customizations (.bashrc)
- Root crontab (automated tasks)

## Prerequisites

### On Production Server

- Debian 12 (or similar Linux distribution)
- Docker and Docker Compose installed
- Root or sudo access
- At least 1GB free disk space for temporary backups

### External Storage

- Remote storage with SSH access (Hetzner Storage Box, rsync.net, or similar)
- Minimum 100GB storage (size depends on data volume)
- SSH key authentication configured

### External Services (Optional but Recommended)

- Email capability for notifications
- Healthchecks.io account (free tier sufficient)

## Initial Setup

### Step 1: Install Borg Backup

```bash
# Update package list
apt update

# Install Borg
apt install -y borgbackup

# Verify installation
borg --version
# Should show: borg 1.2.x or higher
```

**Why Borg?**

- Deduplication: Only stores changed data, saving space
- Compression: Reduces backup size significantly
- Encryption: Optional but recommended for sensitive data
- Incremental: Fast backups after initial full backup

### Step 2: Configure SSH Access to Storage Box

**Create dedicated SSH key for backups:**

```bash
# Generate ED25519 key (modern, secure)
ssh-keygen -t ed25519 -C "server-backup" -f ~/.ssh/id_backup_storage

# Display public key
cat ~/.ssh/id_backup_storage.pub
```

**Add public key to storage box:**

Method depends on provider:

- Hetzner: Use `ssh-copy-id -p PORT -s user@storage-box.de`
- Others: Upload via web interface or SFTP

**Configure SSH alias for convenience:**

```bash
cat >> ~/.ssh/config << 'EOF'

Host storage-backup
    HostName your-storage-box.example.com
    User your-username
    Port 23
    IdentityFile ~/.ssh/id_backup_storage
    ServerAliveInterval 60
    ServerAliveCountMax 3
EOF

chmod 600 ~/.ssh/config
```

**Test connection:**

```bash
ssh storage-backup
# Should connect without password prompt
```

### Step 3: Initialize Borg Repository

**Without encryption (faster, simpler):**

```bash
export BORG_RSH="ssh -p 23"  # Adjust port if needed
borg init --encryption=none storage-backup:/path/to/repo
```

**With encryption (recommended for sensitive data):**

```bash
borg init --encryption=repokey storage-backup:/path/to/repo
# You'll be prompted for a passphrase - SAVE THIS SECURELY!
```

**Important Note on Encryption:**

- `repokey`: Encryption key stored in repo + locally, requires passphrase
- `none`: No encryption, suitable if storage provider is trusted
- Consider: Lost passphrase = lost backups forever
- Recommendation: Use encryption + store passphrase in password manager

## Backup Configuration

### Step 1: Create Database Dump Directory

```bash
mkdir -p /root/backup-dumps
```

**Why separate dumps?**

- Database files can be inconsistent if backed up while running
- Dumps ensure data consistency
- Easier to restore individual databases

### Step 2: Create Backup Script

```bash
cat > /root/borg-backup.sh << 'EOF'
#!/bin/bash
# Borg Backup Script for Production Server
# Performs full system backup with PostgreSQL dumps

set -e  # Exit on error

# Configuration
BORG_REPO="storage-backup:/path/to/repo"
BACKUP_NAME="$(hostname)-$(date +%Y%m%d-%H%M%S)"
LOGFILE="/var/log/borg-backup.log"
EMAIL="admin@example.com"

# Logging setup
exec > >(tee -a "$LOGFILE") 2>&1
echo "=========================================="
echo "Borg Backup Started: $(date)"
echo "=========================================="

# Export Borg settings
export BORG_RSH="ssh -p 23"
export BORG_RELOCATED_REPO_ACCESS_IS_OK=yes

# Prepare dumps
echo "[0/3] Preparing backup data..."
mkdir -p /root/backup-dumps

# PostgreSQL Dump (adjust container name and credentials)
docker exec postgres_container pg_dump -U dbuser dbname | \
  gzip > /root/backup-dumps/database-dump.sql.gz

# Crontab backup
crontab -l > /root/backup-dumps/root-crontab.txt

# Create backup archive
echo "[1/3] Creating backup archive: $BACKUP_NAME"
BACKUP_OUTPUT=$(borg create \
    --stats \
    --progress \
    --compression lz4 \
    --exclude-caches \
    --exclude '/root/.cache' \
    --exclude '/home/*/.cache' \
    --exclude '*.pyc' \
    --exclude '__pycache__' \
    --exclude '/var/log/*.gz' \
    --exclude '/var/log/*.1' \
    "${BORG_REPO}::${BACKUP_NAME}" \
    /etc/nginx \
    /etc/iptables \
    /etc/fail2ban \
    /etc/letsencrypt \
    /etc/sysctl.conf \
    /etc/sysctl.d \
    /opt \
    /var/lib/docker/volumes \
    /root/.ssh \
    /root/.bashrc \
    /root/backup-dumps \
    /home/user/.ssh \
    /home/user/.bashrc 2>&1)

BACKUP_STATUS=$?

# Prune old backups
echo "[2/3] Pruning old backups..."
borg prune \
    --list \
    --keep-daily 7 \
    --keep-weekly 4 \
    --keep-monthly 6 \
    "${BORG_REPO}"

# Verify backup
echo "[3/3] Verifying backup..."
borg list "${BORG_REPO}" | grep "${BACKUP_NAME}"

# Get statistics
BACKUP_SIZE=$(du -h /root/backup-dumps/database-dump.sql.gz | cut -f1)
TOTAL_BACKUPS=$(borg list "${BORG_REPO}" | wc -l)

echo "=========================================="
echo "✓ Backup completed: $(date)"
echo "Archive: $BACKUP_NAME"
echo "DB Dump: $BACKUP_SIZE"
echo "Total Backups: $TOTAL_BACKUPS"
echo "=========================================="

# Email notification
if [ $BACKUP_STATUS -eq 0 ]; then
    SUBJECT="✓ Backup Success - $(hostname)"
    BODY="Backup completed successfully

Server: $(hostname)
Date: $(date)
Archive: $BACKUP_NAME
DB Dump Size: $BACKUP_SIZE
Total Backups: $TOTAL_BACKUPS

Recent backups:
$(borg list "${BORG_REPO}" | tail -5)

Storage: ${BORG_REPO}
Retention: 7 daily, 4 weekly, 6 monthly"
else
    SUBJECT="✗ Backup FAILED - $(hostname)"
    BODY="Backup FAILED!

Server: $(hostname)
Date: $(date)
Archive: $BACKUP_NAME
Exit Code: $BACKUP_STATUS

Check logs: /var/log/borg-backup.log"
fi

# Send email (adjust method based on setup)
echo "$BODY" | mail -s "$SUBJECT" "$EMAIL"

# List all backups
echo ""
echo "Available backups:"
borg list "${BORG_REPO}"
EOF

chmod +x /root/borg-backup.sh
```

**Key Script Components Explained:**

1. **set -e**: Stops script on any error, preventing partial backups
2. **BACKUP_NAME with timestamp**: Unique identifier for each backup
3. **tee -a**: Logs to file while showing output
4. **Database dumps**: Ensures consistent database state
5. **--compression lz4**: Fast compression (alternatives: zstd, zlib)
6. **--exclude patterns**: Reduces backup size by skipping temporary files
7. **Prune retention**: Keeps 7 daily + 4 weekly + 6 monthly backups
8. **Email notification**: Alerts on success/failure

### Step 3: Test Manual Backup

```bash
# First backup (will be slow - full data transfer)
bash /root/borg-backup.sh

# Subsequent backups will be much faster (incremental)
```

**Expected first backup time:**

- 10-50GB data: 30-120 minutes (depends on bandwidth)
- Subsequent backups: 1-5 minutes

### Step 4: Schedule Automated Backups

```bash
# Add to root's crontab
(crontab -l 2>/dev/null; echo "# Daily Borg Backup at 2 AM") | crontab -
(crontab -l; echo "0 2 * * * /root/borg-backup.sh >> /var/log/borg-backup.log 2>&1") | crontab -

# Verify
crontab -l
```

**Why 2 AM?**

- Low traffic period
- After midnight log rotations
- Before business hours in most timezones

## Monitoring Setup

### Why Multi-Layer Monitoring?

**Problem:** If backup script fails AND email fails, you won't know.

**Solution:** Three independent monitoring layers:

1. Email notifications (primary)
2. External dead man's switch (catches total failures)
3. Local log monitoring (catches partial failures)

### Layer 1: Email Notifications

**Already configured in backup script above.**

**Testing email:**

```bash
echo "Test email from backup system" | mail -s "Test" admin@example.com
```

**If using Docker mailserver:**

```bash
docker exec -i mailserver sendmail admin@example.com << 'EOF'
Subject: Test from Backup System
From: backup@yourdomain.com

This is a test email.
EOF
```

### Layer 2: Healthchecks.io (Dead Man's Switch)

**What it does:** Expects a "ping" every 24 hours. If no ping arrives, sends alert.

**Setup:**

1. Create free account at https://healthchecks.io
2. Create new check: "Daily Backup"
3. Configure:
   - Period: 1 day
   - Grace Time: 2 hours
4. Copy ping URL (e.g., `https://hc-ping.com/YOUR-UUID`)

**Add to backup script (at the end, before EOF):**

```bash
# Healthchecks.io notification
if [ $BACKUP_STATUS -eq 0 ]; then
    curl -fsS -m 10 --retry 5 https://hc-ping.com/YOUR-UUID > /dev/null 2>&1
else
    curl -fsS -m 10 --retry 5 https://hc-ping.com/YOUR-UUID/fail > /dev/null 2>&1
fi
```

**Why this works:**

- Normal ping → Healthchecks knows backup ran successfully
- `/fail` ping → Backup ran but failed
- No ping → Entire server or backup system down

### Layer 3: Storage Space Monitoring

**Create monitoring script:**

```bash
cat > /root/check-storage-space.sh << 'EOF'
#!/bin/bash
# Monitor remote storage space usage

STORAGE="storage-backup"
EMAIL="admin@example.com"
THRESHOLD=80  # Alert at 80% full

# Get disk usage (adjust path)
USAGE=$(ssh $STORAGE "df -h /home" | tail -1 | awk '{print $5}' | sed 's/%//')

echo "Storage Usage: ${USAGE}%"

if [ "$USAGE" -ge "$THRESHOLD" ]; then
    SUBJECT="⚠️ Storage ${USAGE}% Full - $(hostname)"
    BODY="Storage Box Warning

Current Usage: ${USAGE}%
Threshold: ${THRESHOLD}%
Server: $(hostname)
Date: $(date)

Actions:
1. Review old backups
2. Adjust retention policy
3. Consider additional storage"

    echo "$BODY" | mail -s "$SUBJECT" "$EMAIL"
fi
EOF

chmod +x /root/check-storage-space.sh
```

**Schedule weekly check:**

```bash
(crontab -l; echo "# Storage space check (weekly Monday 9 AM)") | crontab -
(crontab -l; echo "0 9 * * 1 /root/check-storage-space.sh >> /var/log/storage-check.log 2>&1") | crontab -
```

## Restore Procedures

### Critical: External Key Storage

**BEFORE any disaster, ensure these are stored OUTSIDE the server:**

1. **SSH key to storage box** (`/root/.ssh/id_backup_storage`)
2. **Environment files with passwords** (`.env` files)
3. **Borg encryption passphrase** (if using encryption)
4. **2FA recovery codes** (for any 2FA-protected services)

**Store in:**

- Password manager (1Password, Bitwarden, KeePass)
- Encrypted USB drive in safe location
- Both (recommended)

### Testing Restore (Non-Destructive)

**Test on production server without disrupting services:**

```bash
# List available backups
export BORG_RSH="ssh -p 23"
borg list storage-backup:/path/to/repo

# Extract single file to test directory
mkdir -p /root/restore-test
cd /root/restore-test

# Get latest backup name
LATEST=$(borg list storage-backup:/path/to/repo | tail -1 | awk '{print $1}')

# Test extraction (dry-run first)
borg extract --dry-run storage-backup:/path/to/repo::$LATEST etc/nginx/nginx.conf

# Actually extract
borg extract storage-backup:/path/to/repo::$LATEST etc/nginx/nginx.conf

# Compare with current file
diff /root/restore-test/etc/nginx/nginx.conf /etc/nginx/nginx.conf

# If identical, restore works!
```

### Full Disaster Recovery (New Server)

**Scenario:** Complete server failure, rebuilding from scratch.

**Prerequisites:**

- Fresh server (same or newer OS version)
- SSH key to storage box (from external storage)
- Root access

#### Step 1: Install Base System

```bash
# Update system
apt update && apt upgrade -y

# Install essential packages
apt install -y borgbackup docker.io docker-compose-plugin \
  nginx fail2ban iptables-persistent curl

# Enable Docker
systemctl enable docker
systemctl start docker
```

#### Step 2: Configure Storage Access

```bash
# Create SSH directory
mkdir -p /root/.ssh
chmod 700 /root/.ssh

# Copy SSH key from safe storage
# (Transfer via scp, USB, or paste)
nano /root/.ssh/id_backup_storage
# Paste key, save

chmod 600 /root/.ssh/id_backup_storage

# Configure SSH
cat >> /root/.ssh/config << 'EOF'

Host storage-backup
    HostName your-storage-box.example.com
    User your-username
    Port 23
    IdentityFile /root/.ssh/id_backup_storage
    ServerAliveInterval 60
    ServerAliveCountMax 3
EOF

chmod 600 /root/.ssh/config

# Test connection
ssh storage-backup
```

#### Step 3: List and Select Backup

```bash
export BORG_RSH="ssh -p 23"

# List all backups
borg list storage-backup:/path/to/repo

# Select most recent or specific backup
# Example: server-20260123-140112
```

#### Step 4: Extract Full Backup

```bash
# Extract to root filesystem
cd /
borg extract storage-backup:/path/to/repo::server-20260123-140112

# This will recreate all backed-up directories and files
```

#### Step 5: Restore Databases

```bash
# Start database container first
cd /opt/application
docker-compose up -d database

# Wait for database to be ready
sleep 15

# Restore from dump
zcat /root/backup-dumps/database-dump.sql.gz | \
  docker exec -i database_container psql -U dbuser dbname

# Verify
docker exec database_container psql -U dbuser dbname -c "\dt"
```

#### Step 6: Restore System Configuration

**Restore firewall rules:**

```bash
# IPv4 rules
iptables-restore < /etc/iptables/rules.v4

# IPv6 rules
ip6tables-restore < /etc/iptables/rules.v6

# Make persistent
netfilter-persistent save
```

**Restore crontab:**

```bash
crontab /root/backup-dumps/root-crontab.txt

# Verify
crontab -l
```

#### Step 7: Start Services

```bash
# Start all Docker containers
cd /opt/mailserver && docker-compose up -d
cd /opt/application && docker-compose up -d

# Start system services
systemctl restart nginx
systemctl restart fail2ban

# Enable services
systemctl enable nginx
systemctl enable fail2ban
```

#### Step 8: Verify Restore

```bash
# Check Docker containers
docker ps -a
# All containers should be running

# Check web server
systemctl status nginx
curl -I https://yourdomain.com

# Check fail2ban
fail2ban-client status

# Check firewall
iptables -L -n -v | head -20

# Test application functionality
# - Login to web interfaces
# - Send test email
# - Check database connectivity
```

#### Step 9: Update DNS (If IP Changed)

If server has new IP address, update:

- A records
- MX records
- SPF records (include new IP)
- PTR record (reverse DNS)

**Wait for DNS propagation:** 1-24 hours depending on TTL.

## Best Practices

### Security

**SSH Key Management:**

- Use ED25519 keys (modern, secure)
- Never commit keys to git repositories
- Store backup key separately from server
- Use different keys for different purposes

**Backup Encryption:**

- Use encryption for sensitive data
- Store passphrase in password manager
- Test decryption ability regularly
- Consider encrypted storage even without Borg encryption

**Access Control:**

- Limit backup script to root only (`chmod 700`)
- Use dedicated storage box user (not main account)
- Implement IP whitelisting if possible

### Operational

**Regular Testing:**

- Test restore procedure quarterly
- Document any changes to restore process
- Practice on non-production environment
- Verify database dumps can be imported

**Monitoring:**

- Check email notifications weekly
- Verify Healthchecks.io status monthly
- Review storage space monthly
- Audit backup logs for errors

**Documentation:**

- Keep external copy of this guide
- Document custom configurations
- Update guide when making changes
- Include contact information for emergencies

**Retention Tuning:**

Current policy: 7 daily + 4 weekly + 6 monthly

Adjust based on:

- Available storage space
- Data change rate
- Compliance requirements
- Recovery point objective (RPO)

Example aggressive retention:

```bash
--keep-daily 3 \
--keep-weekly 2 \
--keep-monthly 3
```

Example conservative retention:

```bash
--keep-daily 14 \
--keep-weekly 8 \
--keep-monthly 12 \
--keep-yearly 3
```

### Performance Optimization

**Compression Algorithms:**

- `lz4`: Fastest, moderate compression
- `zstd`: Balanced speed/compression
- `zlib`: Slowest, best compression

**Network Optimization:**

```bash
# Add to backup script for slow connections
export BORG_RSH="ssh -p 23 -C"  # Enable SSH compression
```

**Exclude Patterns:**

Common exclusions to add:

```bash
--exclude '/var/lib/docker/overlay2' \
--exclude '/tmp' \
--exclude '/var/tmp' \
--exclude '*/node_modules' \
--exclude '*.log' \
--exclude '*/.npm'
```

## Troubleshooting

### Backup Fails: "Connection refused"

**Cause:** SSH connection to storage box failed.

**Solutions:**

```bash
# Test SSH manually
ssh storage-backup

# Check SSH config
cat ~/.ssh/config

# Verify key permissions
ls -l ~/.ssh/id_backup_storage
# Should be: -rw------- (600)

# Check SSH key is correct
ssh-keygen -y -f ~/.ssh/id_backup_storage
```

### Backup Fails: "Repository not found"

**Cause:** Borg repository path incorrect or not initialized.

**Solutions:**

```bash
# List available repositories
ssh storage-backup ls -la /path/to

# Re-initialize if needed (creates new repo)
borg init --encryption=none storage-backup:/correct/path
```

### Backup Very Slow

**Causes:** Large initial backup, slow network, or compression overhead.

**Solutions:**

```bash
# Use faster compression
--compression lz4  # Instead of zlib

# Check network speed
ssh storage-backup "dd if=/dev/zero bs=1M count=100" | pv > /dev/null

# Reduce backup size with more exclusions
--exclude '/var/lib/docker/overlay2'
```

### Restore Fails: "Permission denied"

**Cause:** Attempting to restore without root permissions.

**Solution:**

```bash
# Extract as root
sudo su
cd /
borg extract ...
```

### Email Notifications Not Received

**Causes:** Mail server misconfigured, spam filters, or network issues.

**Solutions:**

```bash
# Test mail command
echo "Test" | mail -s "Test" admin@example.com

# Check mail logs
tail -f /var/log/mail.log

# For Docker mailserver
docker logs mailserver | grep -i error

# Test alternative: Use Docker mailserver directly
docker exec -i mailserver sendmail admin@example.com << 'EOF'
Subject: Test
Test email
EOF
```

### Healthchecks.io Not Receiving Pings

**Causes:** Firewall blocking outbound HTTPS, curl not installed, or wrong URL.

**Solutions:**

```bash
# Test ping manually
curl -v https://hc-ping.com/YOUR-UUID

# Check curl installation
which curl

# Test network connectivity
curl -I https://healthchecks.io

# Check backup script has correct UUID
grep hc-ping /root/borg-backup.sh
```

### Database Restore Fails

**Causes:** Incompatible PostgreSQL versions, wrong credentials, or corrupted dump.

**Solutions:**

```bash
# Check dump integrity
zcat /root/backup-dumps/database-dump.sql.gz | head -50

# Verify database container is running
docker ps | grep database

# Check PostgreSQL version
docker exec database_container psql --version

# Try manual import with verbose output
zcat dump.sql.gz | docker exec -i container psql -U user dbname -v ON_ERROR_STOP=1
```

### "Disk quota exceeded" During Backup

**Cause:** Storage box full.

**Solutions:**

```bash
# Check storage usage
ssh storage-backup df -h

# Manual pruning (more aggressive)
borg prune \
    --keep-daily 3 \
    --keep-weekly 2 \
    --keep-monthly 2 \
    storage-backup:/path/to/repo

# Delete specific old backup
borg delete storage-backup:/path/to/repo::archive-name
```

## Lessons Learned

### What Worked Well

1. **Borg's deduplication:** Reduced backup size by 60-80% after initial backup
2. **Separate database dumps:** Ensured data consistency during restore
3. **Multi-layer monitoring:** Caught failures that single method would miss
4. **SSH key authentication:** No password prompts in automated scripts
5. **Compression (lz4):** Good balance between speed and size reduction

### Common Mistakes to Avoid

1. **Don't store backup SSH key only on server:** You need it to restore!
2. **Don't skip encryption passphrase documentation:** Lost passphrase = lost backups
3. **Don't ignore test restores:** Many discover backup issues only during disaster
4. **Don't backup everything:** Exclude temporary files, caches, logs
5. **Don't forget environment files:** `.env` files often contain critical passwords
6. **Don't use config files with hardcoded passwords in backups:** Use environment variables
7. **Don't assume email notifications work:** Test and verify delivery

### Configuration Trade-offs

**Encryption: Yes vs No**

- Yes: More secure, requires passphrase management
- No: Simpler, faster, suitable if storage provider is trusted
- Decision: Use encryption for sensitive data (medical, financial, personal)

**Compression: lz4 vs zlib**

- lz4: Fast, 50% compression ratio
- zlib: Slow, 70% compression ratio
- Decision: Use lz4 for daily backups, zlib for archival backups

**Retention: Aggressive vs Conservative**

- Aggressive (3-2-3): Saves storage, shorter history
- Conservative (14-8-12): Uses more storage, longer history
- Decision: Based on compliance requirements and storage budget

## Quick Reference Commands

### Daily Operations

```bash
# Manual backup
bash /root/borg-backup.sh

# List backups
borg list storage-backup:/path/to/repo

# Check repository info
borg info storage-backup:/path/to/repo

# View backup logs
tail -50 /var/log/borg-backup.log
```

### Maintenance

```bash
# Manual prune (if needed)
borg prune --list --keep-daily 7 --keep-weekly 4 storage-backup:/path/to/repo

# Compact repository (reclaim space)
borg compact storage-backup:/path/to/repo

# Check repository integrity
borg check storage-backup:/path/to/repo
```

### Restore Operations

```bash
# List files in backup
borg list storage-backup:/path/to/repo::archive-name

# Extract specific file
borg extract storage-backup:/path/to/repo::archive-name path/to/file

# Extract entire backup
cd / && borg extract storage-backup:/path/to/repo::archive-name
```

## Conclusion

This backup system provides:

- **Automated daily backups** with minimal manual intervention
- **Efficient storage** through deduplication and compression
- **Multi-layer monitoring** to ensure backup reliability
- **Proven restore procedures** for disaster recovery
- **Security best practices** for data protection

**Critical Success Factors:**

1. Store SSH keys and passwords externally
2. Test restore procedures regularly
3. Monitor backup health actively
4. Document any custom configurations
5. Review and update retention policies

**Remember:** A backup system is only as good as your last successful restore test.

## Additional Resources

- Borg Documentation: https://borgbackup.readthedocs.io/
- Healthchecks.io Docs: https://healthchecks.io/docs/
- Hetzner Storage Box Guide: https://docs.hetzner.com/robot/storage-box/
- Docker Backup Best Practices: https://docs.docker.com/storage/volumes/#back-up-restore-or-migrate-data-volumes
