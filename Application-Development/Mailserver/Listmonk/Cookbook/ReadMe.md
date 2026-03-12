# Listmonk Cookbook

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=5 orderedList=false} -->

## DKIM Setup Guide for ListMonk with docker-mailserver

### Overview

This guide covers the complete setup of DKIM (DomainKeys Identified Mail) authentication for a ListMonk newsletter system using docker-mailserver. DKIM is critical for email deliverability - without it, emails will fail DMARC checks and land in spam folders even with valid SPF records.

### Context: Why DKIM Matters

Email authentication uses three key protocols:

- **SPF**: Verifies sending server IP is authorized
- **DKIM**: Cryptographically signs emails to prove they weren't tampered with
- **DMARC**: Policy that combines SPF + DKIM checks

**Critical insight**: SPF alone is NOT enough. Modern email providers (Gmail, Outlook, etc.) require DKIM for:

- DMARC compliance (even with `p=none` policy)
- Inbox placement (vs. Promotions vs. Spam)
- Domain reputation building

Without DKIM, your emails show:

```
Authentication-Results: dmarc=fail (p=none dis=none)
DKIM Domain: (empty)
```

This results in immediate spam folder placement regardless of content quality.

### Architecture Understanding

#### docker-mailserver DKIM Flow

```
ListMonk Container (172.18.0.x)
    ↓ SMTP (port 25, no auth)
Postfix (mailserver container)
    ↓ milter protocol (port 8891)
OpenDKIM Service
    ↓ checks TrustedHosts
    ↓ signs with private key
    ↓ adds DKIM-Signature header
External Mail Server
```

**Key concept**: OpenDKIM acts as a "milter" (mail filter) that Postfix queries before sending. If the source IP isn't in TrustedHosts, OpenDKIM treats it as external and refuses to sign.

### Prerequisites

- docker-mailserver running with environment variables:

  ```yaml
  ENABLE_OPENDKIM=1
  ENABLE_OPENDMARC=1
  ENABLE_POLICYD_SPF=1
  ```

- ListMonk container on same Docker network as mailserver
- Domain DNS access for adding TXT records
- Mailserver container with persistent volumes for config

### Step 1: Generate DKIM Keys

#### Command

```bash
docker exec mailserver setup config dkim domain yourdomain.com
```

**What this does**:

- Generates RSA-2048 key pair for your domain
- Creates selector named `mail` (standard convention)
- Stores keys in `/tmp/docker-mailserver/opendkim/keys/yourdomain.com/`

#### Verify Key Generation

```bash
# View public key for DNS
docker exec mailserver cat /tmp/docker-mailserver/opendkim/keys/yourdomain.com/mail.txt
```

**Output format**:

```
mail._domainkey IN TXT ( "v=DKIM1; h=sha256; k=rsa; "
          "p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA..." )
```

**Important**: The parentheses and quotes are DNS zone file formatting. The actual TXT record value is just the content inside quotes.

### Step 2: Configure DNS

#### DNS TXT Record

**Record details**:

- **Type**: TXT
- **Name**: `mail._domainkey` (or `mail._domainkey.yourdomain.com` depending on DNS provider)
- **Value**: Concatenate all quoted strings without quotes or parentheses

**Example**:

```
mail._domainkey.yourdomain.com  IN  TXT  "v=DKIM1; h=sha256; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA..."
```

**Common mistakes**:

- Including parentheses in DNS value
- Missing the selector (`mail._domainkey` not just `_domainkey`)
- Wrong domain (subdomain vs. root domain)

#### Verify DNS Propagation

```bash
dig TXT mail._domainkey.yourdomain.com +short
```

**Should return**:

```
"v=DKIM1; h=sha256; k=rsa; p=..."
```

**DNS propagation time**: Typically 5-30 minutes, can take up to 24 hours for global propagation.

### Step 3: Configure OpenDKIM TrustedHosts

#### The Problem

By default, OpenDKIM only trusts localhost. When ListMonk sends from a Docker container IP (e.g., 172.18.0.4), OpenDKIM logs:

```
listmonk_app.mailserver_default [172.18.0.4] not internal
not authenticated
no signature data
```

**Result**: Emails leave without DKIM signatures.

#### Solution: Add Docker Network to TrustedHosts

**Critical files**:

- **Config file OpenDKIM reads**: `/etc/opendkim/TrustedHosts`
- **Persistent storage**: `/tmp/docker-mailserver/opendkim/TrustedHosts`

**Why two locations?**
docker-mailserver copies from `/tmp/docker-mailserver/` to `/etc/opendkim/` on startup. Only changes to the persistent location survive container restarts.

#### Edit Persistent TrustedHosts

```bash
# Add Docker network CIDR to persistent config
docker exec mailserver bash -c 'echo "172.18.0.0/16" >> /tmp/docker-mailserver/opendkim/TrustedHosts'

# Verify
docker exec mailserver cat /tmp/docker-mailserver/opendkim/TrustedHosts
```

**Should contain**:

```
127.0.0.1
localhost
172.18.0.0/16
```

**Network CIDR selection**:

- Find your Docker network: `docker network inspect mailserver_default | grep Subnet`
- Use `/16` for flexibility (covers 172.18.0.0 - 172.18.255.255)
- Adjust if using custom network ranges

#### Restart OpenDKIM

```bash
docker exec mailserver supervisorctl restart opendkim
```

**Verification**:

```bash
docker logs mailserver --tail 50 | grep -i dkim
```

**Before fix**:

```
listmonk_app.mailserver_default [172.18.0.4] not internal
no signature data
```

**After fix**:

```
DKIM-Signature field added (s=mail, d=yourdomain.com)
```

### Step 4: Verify Persistence

#### Check Volume Mapping

```bash
# View docker-compose.yml volumes section
cat /path/to/mailserver/docker-compose.yml | grep -A 5 volumes
```

**Should include**:

```yaml
volumes:
  - ./docker-data/dms/config/:/tmp/docker-mailserver/
```

#### Verify Host-Side Config

```bash
# Check TrustedHosts on host filesystem
cat /path/to/mailserver/docker-data/dms/config/opendkim/TrustedHosts
```

**Must contain**: `172.18.0.0/16`

**Why this matters**: Container restarts will preserve this config. Without volume mapping, changes are lost.

### Step 5: Test Email Authentication

#### Send Test Email

Use mail-tester.com or send to your own email account:

```bash
# From ListMonk UI: Send test campaign
# Or use mail command in container
docker exec mailserver bash -c 'echo "Test" | mail -s "DKIM Test" test@yourdomain.com'
```

#### Check Headers

**Gmail**: Open email → ⋮ menu → "Show original"

**Look for these headers**:

✅ **Success**:

```
Authentication-Results: mx.google.com;
       dkim=pass header.i=@yourdomain.com header.s=mail header.b=E3EMRx3+;
       spf=pass;
       dmarc=pass (p=NONE sp=NONE dis=NONE)
```

```
DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/simple; d=yourdomain.com;
    s=mail; t=1234567890;
    bh=...;
    h=To:Subject:From;
    b=E3EMRx3+...
```

❌ **Failure**:

```
Authentication-Results: dmarc=fail (p=none dis=none)
DKIM Domain: (empty)
```

#### mail-tester.com Score

**Expected after fix**: 8-9/10

- ✅ SPF: pass
- ✅ DKIM: pass
- ✅ DMARC: pass
- ⚠️ Minor deductions for:
  - HTML-only emails (add plain text version)
  - New domain reputation (requires time)

### Common Issues and Solutions

#### Issue 1: DKIM Still Missing After Config

**Symptoms**:

```
docker logs mailserver | grep dkim
# Shows: "not internal", "no signature data"
```

**Causes**:

1. Wrong file edited (`/etc/opendkim/TrustedHosts` instead of `/tmp/docker-mailserver/opendkim/TrustedHosts`)
2. OpenDKIM not restarted after config change
3. Wrong IP range in TrustedHosts

**Solution**:

```bash
# Verify correct file
docker exec mailserver cat /tmp/docker-mailserver/opendkim/TrustedHosts

# Check container logs during send
docker logs mailserver --follow

# Send test email and watch for "DKIM-Signature field added"
```

#### Issue 2: DNS Record Not Found

**Symptoms**:

```bash
dig TXT mail._domainkey.yourdomain.com
# Returns NXDOMAIN or empty
```

**Causes**:

1. Wrong subdomain structure (missing selector)
2. Quotes/parentheses in DNS value
3. Propagation delay

**Solution**:

```bash
# Correct format check
dig TXT mail._domainkey.yourdomain.com +short

# Should return single line with quotes:
# "v=DKIM1; h=sha256; k=rsa; p=..."

# Multiple DNS servers to test propagation
dig @8.8.8.8 TXT mail._domainkey.yourdomain.com
dig @1.1.1.1 TXT mail._domainkey.yourdomain.com
```

#### Issue 3: Emails Still Go to Spam

**Despite DKIM/SPF/DMARC passing**, emails may still land in spam due to:

1. **New domain reputation** (primary cause)
   - Gmail/Outlook don't trust new senders
   - Solution: Warm-up period (see below)

2. **Content issues**
   - HTML-only (no plain text alternative)
   - Missing List-Unsubscribe header
   - Low text-to-image ratio

3. **User engagement**
   - No opens/clicks history
   - No "Not Spam" markings

**Important distinction**:

- Gmail Web → Promotions tab = ✅ Success (not spam!)
- macOS Mail → Junk folder = Local client filter (not Gmail's decision)

### Reputation Building Strategy

#### Week-by-Week Plan

**Week 1**: 50-100 emails/day

- Target: Highly engaged subscribers only
- Monitor: Bounce rate (<2%), spam complaints (<0.1%)

**Week 2**: 200-300 emails/day

- Expand to moderately engaged users
- Check: Open rates should be >15%

**Week 3**: 500-700 emails/day

- Include recent sign-ups
- Verify: DMARC reports show passing authentication

**Week 4+**: Scale to full volume

- Maintain monitoring
- Adjust rates based on bounce/complaint metrics

#### Content Best Practices

1. **Always include plain text version**

   ```html
   <!-- ListMonk supports multipart/alternative -->
   HTML version: <h1>Hello</h1>
   Plain text: Hello
   ```

2. **List-Unsubscribe header**
   - ListMonk: Enable in Settings → "List-Unsubscribe header"
   - Required for bulk email senders

3. **Proper text-to-HTML ratio**
   - Minimum 200 words of actual text
   - Avoid image-only emails

4. **Engagement signals**
   - Encourage replies
   - Add to contacts instructions
   - Clear, valuable content

#### ListMonk-Specific Configuration

#### Public URL Configuration

**Why needed**: ListMonk generates unsubscribe/view links. Default uses `localhost:9000` which breaks in emails.

**Fix in config.toml**:

```toml
[app]
address = "0.0.0.0:9000"
root_url = "https://yourdomain.com/news"
```

**Or via UI**: Settings → General → Root URL

**After change**: Restart container

```bash
docker compose restart
```

#### Upload Size Limits

**Problem**: CSV imports >2MB fail with HTTP 413.

**Solution requires two changes**:

**1. nginx reverse proxy**:

```nginx
location /admin {
    client_max_body_size 50M;
    proxy_pass http://127.0.0.1:9000;
    # ... other directives
}

location /api {
    client_max_body_size 50M;
    proxy_pass http://127.0.0.1:9000;
    # ... other directives
}
```

**2. ListMonk config.toml**:

```toml
[app]
max_upload_size = 52428800  # 50MB in bytes
```

**Apply changes**:

```bash
# nginx
sudo nginx -t
sudo systemctl reload nginx

# ListMonk
docker compose restart
```

### Monitoring and Maintenance

#### Regular Checks

**Weekly**:

```bash
# Check DKIM logs for any "not internal" messages
docker logs mailserver --since 7d | grep -i dkim | grep "not internal"

# Should return empty if working correctly
```

**Monthly**:

```bash
# Verify DNS records still exist
dig TXT mail._domainkey.yourdomain.com +short

# Check DKIM key hash hasn't changed
docker exec mailserver md5sum /tmp/docker-mailserver/opendkim/keys/yourdomain.com/mail.private
```

#### DMARC Reports

Set up DMARC reporting in DNS:

```
_dmarc.yourdomain.com  IN  TXT  "v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com"
```

**Reports show**:

- Authentication pass/fail rates
- Sources sending as your domain
- Issues with SPF/DKIM alignment

**Analysis tools**:

- dmarcian.com (free tier)
- postmarkapp.com/dmarc
- EasyDMARC

### Key Takeaways

1. **DKIM is non-negotiable** for modern email deliverability
2. **TrustedHosts must include Docker network** or signatures won't be added
3. **Persistence requires volume mapping** - check docker-compose.yml
4. **DNS propagation takes time** - wait 30 minutes before troubleshooting
5. **Passing authentication ≠ inbox placement** - reputation building is separate
6. **Promotions tab is success** - don't confuse with spam folder
7. **Test with real emails** - mail-tester.com has daily limits

### Verification Checklist

Before considering setup complete:

- [ ] DKIM keys generated and stored in persistent volume
- [ ] DNS TXT record for `mail._domainkey.domain.com` returns correct public key
- [ ] TrustedHosts includes Docker network CIDR in persistent location
- [ ] OpenDKIM service running (`docker exec mailserver supervisorctl status opendkim`)
- [ ] Test email shows `DKIM-Signature:` header
- [ ] Authentication-Results shows `dkim=pass`
- [ ] DMARC check shows `dmarc=pass`
- [ ] mail-tester.com score ≥8/10
- [ ] Container restart preserves configuration

### Additional Resources

- **docker-mailserver docs**: https://docker-mailserver.github.io/docker-mailserver/latest/
- **DKIM specification**: RFC 6376
- **DMARC guide**: RFC 7489
- **ListMonk documentation**: https://listmonk.app/docs/
- **Email authentication tester**: https://www.mail-tester.com/
- **DKIM validator**: https://dmarcian.com/dkim-inspector/

### Troubleshooting Commands Reference

```bash
# Check OpenDKIM config
docker exec mailserver cat /etc/opendkim.conf

# View current TrustedHosts (runtime)
docker exec mailserver cat /etc/opendkim/TrustedHosts

# View current TrustedHosts (persistent)
docker exec mailserver cat /tmp/docker-mailserver/opendkim/TrustedHosts

# Check Postfix milter configuration
docker exec mailserver postconf | grep milter

# Test DKIM from command line
docker exec mailserver opendkim-testkey -d yourdomain.com -s mail -vvv

# Monitor mail logs in real-time
docker logs mailserver --follow | grep -i dkim

# Check supervisor status
docker exec mailserver supervisorctl status

# View full mail.log
docker exec mailserver tail -100 /var/log/mail/mail.log
```
