# fail2ban for docker-mailserver:

Complete Protection Guide

## Overview

This guide documents how to protect a docker-mailserver installation with fail2ban by creating custom filters for attack patterns that aren't covered by default configurations. The approach uses fail2ban installed on the host system to monitor Docker container logs.

**Key Challenge:** Docker logs are JSON-wrapped, requiring special regex patterns that differ from standard syslog-based fail2ban filters.

## Architecture

### Log Flow

```plaintext
Docker Container → JSON Log File → fail2ban (host) → iptables-docker-user
```

**Critical Path:**

- Docker logs: `/var/lib/docker/containers/<container-id>/<container-id>-json.log`
- JSON format: `{"log":"timestamp hostname service[pid]: message\n","stream":"stdout","time":"..."}`
- fail2ban reads JSON, extracts IPs, bans via iptables

### Why iptables-docker-user?

Standard `iptables` banaction doesn't work with Docker networks. Docker creates its own iptables chains that bypass INPUT chain.

**Solution:** Use `banaction = iptables-docker-user` which inserts rules into Docker's DOCKER-USER chain, executed before Docker's routing rules.

## Common Attack Patterns

### 1. Client Host Rejected
**Pattern:** Attackers try to relay mail through your server without authentication.

**Log Example:**

```plaintext
postfix/submission/smtpd[123]: NOQUEUE: reject: RCPT from unknown[78.153.140.207]: 554 5.7.1 <unknown[78.153.140.207]>: Client host rejected: Access denied
```

**Behavior:** Persistent IPs retry every 2-4 hours. High volume from specific subnets (78.153.140.x, 178.16.54.x).

### 2. HTTP on SMTP Ports
**Pattern:** Port scanners/bots send HTTP requests to SMTP ports (25, 587, 465).

**Log Example:**

```plaintext
postfix/submission/smtpd[456]: warning: non-SMTP command from scanner.example.com[1.2.3.4]: GET / HTTP/1.1
```

**Behavior:** Usually single attempts per IP, but aggressive scanners retry. Includes path traversal attempts (`GET /../../`).

### 3. TLS/SSL Attacks
**Pattern:** Bots probe TLS configurations with invalid ciphers, protocols, or malformed handshakes.

**Log Example:**

```plaintext
postfix/submissions/smtpd[789]: SSL_accept error from scanner.io[5.6.7.8]: -1
postfix/submissions/smtpd[789]: SSL_accept error from unknown[9.10.11.12]: lost connection
```

**Behavior:** High volume but distributed across many IPs. Often legitimate security scanners (don't set threshold too low).

## Filter Implementation

### Filter 1: postfix-client-rejected

**Purpose:** Block IPs that attempt unauthorized mail relay.

**File:** `/etc/fail2ban/filter.d/postfix-client-rejected.conf`

```ini
[Definition]
failregex = ^.*postfix/(submission|submissions)/smtpd\[\d+\]: NOQUEUE: reject: RCPT from \S+\[<HOST>\]: 554 .*Client host rejected: Access denied
ignoreregex =
```

**Jail Config:** Add to `/etc/fail2ban/jail.local`

```ini
[postfix-client-rejected]
enabled = true
banaction = iptables-docker-user
filter = postfix-client-rejected
logpath = /var/lib/docker/containers/<container-id>/<container-id>-json.log
maxretry = 5
bantime = 24h
findtime = 1h
```

**Rationale:**

- `maxretry = 5`: Persistent attackers, not one-off mistakes
- `bantime = 24h`: Long enough to stop retry loops
- `findtime = 1h`: Catches burst patterns

### Filter 2: postfix-http-attack

**Purpose:** Block HTTP requests on SMTP ports.

**File:** `/etc/fail2ban/filter.d/postfix-http-attack.conf`

```ini
[Definition]
failregex = ^.*postfix/(submission|submissions|smtpd|postscreen)\[.*\]: (?:warning: )?[Nn][Oo][Nn]-SMTP [Cc][Oo][Mm][Mm][Aa][Nn][Dd] from .*\[<HOST>\].*: GET
ignoreregex =
```

**Jail Config:**

```ini
[postfix-http-attack]
enabled = true
banaction = iptables-docker-user
filter = postfix-http-attack
logpath = /var/lib/docker/containers/<container-id>/<container-id>-json.log
maxretry = 2
bantime = 7d
findtime = 1h
```

**Rationale:**

- `maxretry = 2`: Low threshold - HTTP on SMTP is never legitimate
- `bantime = 7d`: Scanners rarely change behavior quickly
- Case-insensitive pattern: Catches "non-SMTP" and "NON-SMTP" variants
- Covers multiple services: submission, submissions, smtpd, postscreen

### Filter 3: postfix-tls-attack

**Purpose:** Block TLS handshake attacks and cipher probing.

**File:** `/etc/fail2ban/filter.d/postfix-tls-attack.conf`

```ini
[Definition]
failregex = ^.*postfix/(submission|submissions|smtpd)\[.*\]: SSL_accept error from .*\[<HOST>\]
ignoreregex =
```

**Jail Config:**

```ini
[postfix-tls-attack]
enabled = true
banaction = iptables-docker-user
filter = postfix-tls-attack
logpath = /var/lib/docker/containers/<container-id>/<container-id>-json.log
maxretry = 10
bantime = 24h
findtime = 1h
```

**Rationale:**

- `maxretry = 10`: Higher threshold - includes legitimate research scanners
- Many TLS errors are from academic/security research, not attacks
- Catches distributed attacks where single IP retries aggressively

## Critical Lessons Learned

### 1. Docker JSON Log Format

**Initial Mistake:** Filters written for standard syslog format don't match Docker logs.

**Wrong Pattern:**

```ini
failregex = ^postfix/submission/smtpd\[.*\]: NOQUEUE: reject
```

**Why It Fails:** Docker wraps logs in JSON:

```json
{"log":"2026-02-05T16:09:58+01:00 hostname postfix/submission/smtpd[123]: NOQUEUE: reject..."}
```

**Correct Pattern:**

```ini
failregex = ^.*postfix/submission/smtpd\[.*\]: NOQUEUE: reject
```

**Key Insight:** fail2ban automatically strips JSON wrapper. Use `^.*` prefix to skip timestamp/hostname, then match the actual postfix message.

### 2. IP Extraction from Logs

**Challenge:** Postfix logs contain IPs in different formats:

```
from unknown[1.2.3.4]: 554...
from scanner.com[1.2.3.4]: GET...
from [1.2.3.4]:12345 to [172.18.0.2]:25
```

**Solution:** Use flexible patterns:

- `\S+\[<HOST>\]` - Matches hostname[IP] or unknown[IP]
- `.*\[<HOST>\]` - Matches any text before [IP]
- `\[<HOST>\]` - Matches bare [IP]

**Testing Command:**

```bash
sudo fail2ban-regex /path/to/log /etc/fail2ban/filter.d/your-filter.conf
```

### 3. Threshold Tuning

**Anti-Pattern:** Setting `maxretry = 1` for everything.

**Problem:**

- Legitimate connection errors exist (network hiccups, misconfigured clients)
- Research scanners (censys, shodan) are not malicious
- False positives lock out real users

**Best Practices:**

- **Clear attacks** (HTTP on SMTP): `maxretry = 2`
- **Ambiguous patterns** (TLS errors): `maxretry = 10`
- **Persistent attackers** (relay attempts): `maxretry = 5`

**Monitor for first 24h:**

```bash
sudo fail2ban-client status <jail-name>
```

Adjust if:

- `Total banned` is too high (> 50 IPs/day) → Increase maxretry
- Known attackers not banned → Decrease maxretry or check filter

### 4. Don't Ban Security Researchers

**Observed Scanners:**

- `monitoring.internet-measurement.com` - Academic TLS research
- `censys-scanner.com` - Security asset discovery
- `shodan.io` - Internet-wide port scanning

**Why Not Ban:**

- They help find vulnerabilities before attackers do
- Distributed IPs make banning ineffective
- Generates noise in ban logs

**Approach:**

- Use `ignoreregex` or higher `maxretry` for research patterns
- Focus filters on clearly malicious behavior (relay attempts, brute force)

## Installation Steps

### 1. Find Docker Container ID

```bash
docker ps
# Note the container ID for your mailserver
```

Or get full container ID:

```bash
docker inspect <short-id> | grep Id
```

### 2. Locate Log File

```bash
ls -la /var/lib/docker/containers/<container-id>/<container-id>-json.log
```

### 3. Create Filter Files

```bash
sudo nano /etc/fail2ban/filter.d/postfix-client-rejected.conf
sudo nano /etc/fail2ban/filter.d/postfix-http-attack.conf
sudo nano /etc/fail2ban/filter.d/postfix-tls-attack.conf
```

Copy configurations from "Filter Implementation" section above.

### 4. Test Filters

**Test against historical logs:**

```bash
sudo fail2ban-regex /var/lib/docker/containers/<container-id>/<container-id>-json.log \
  /etc/fail2ban/filter.d/postfix-client-rejected.conf
```

**Expected Output:**

```
Failregex: 62 total
Lines: 18316 lines, 0 ignored, 62 matched, 18254 missed
```

If "0 matched", your regex is wrong. Check log format.

### 5. Add Jails to jail.local

```bash
sudo nano /etc/fail2ban/jail.local
```

Add all three jail configurations from "Filter Implementation" section. **Replace `<container-id>` with your actual container ID.**

### 6. Reload fail2ban

```bash
sudo fail2ban-client reload
```

### 7. Verify Jails Active

```bash
sudo fail2ban-client status
```

Should show your new jails in the list.

### 8. Monitor for First Bans

```bash
# Live monitoring
sudo journalctl -u fail2ban -f

# Or tail fail2ban log
sudo tail -f /var/log/fail2ban.log | grep -E "Ban|postfix-client|postfix-http|postfix-tls"
```

## Verification & Monitoring

### Initial Health Check

**After 1 hour:**

```bash
sudo fail2ban-client status postfix-client-rejected
sudo fail2ban-client status postfix-http-attack
sudo fail2ban-client status postfix-tls-attack
```

**Look for:**

- `Total failed: > 0` - Filter is matching attacks
- `Currently failed: X` - IPs being tracked
- `Total banned: > 0` - Threshold reached, bans active

**If Total failed = 0:**

1. Check filter regex with `fail2ban-regex`
2. Verify log path is correct
3. Check if attacks are actually occurring (grep the log file)

### 24-Hour Review

**Check ban statistics:**

```bash
sudo fail2ban-client status postfix-http-attack | grep "Total banned"
```

**Expected Results (typical mail server):**

- postfix-client-rejected: 1-3 banned IPs
- postfix-http-attack: 5-10 banned IPs
- postfix-tls-attack: 0-2 banned IPs

**View currently banned IPs:**

```bash
sudo fail2ban-client status postfix-http-attack
# Look at "Banned IP list"
```

### Analyze Attack Patterns

**Generate mail log summary:**

```bash
# Install pflogsumm if not available
apt-get install pflogsumm

# Analyze container logs
docker logs mailserver 2>&1 | pflogsumm
```

**Look for:**

- Reduction in "Client host rejected" after implementing filters
- Top attacking IPs (compare with banned IP list)
- New attack patterns not covered by filters

### Ongoing Monitoring

**Weekly check:**

```bash
# Total bans across all jails
for jail in postfix-client-rejected postfix-http-attack postfix-tls-attack; do
  echo "=== $jail ==="
  sudo fail2ban-client status $jail | grep "Total banned"
done
```

**Check for false positives:**

```bash
# Review recently banned IPs
sudo fail2ban-client status postfix-http-attack

# Unban if legitimate (replace IP)
sudo fail2ban-client unban 1.2.3.4
```

## Troubleshooting

### Problem: Jail Not in Status List

**Check syntax:**

```bash
sudo fail2ban-client -t
```

If errors, fix `/etc/fail2ban/jail.local` syntax.

**Reload:**

```bash
sudo fail2ban-client reload
```

### Problem: Total Failed = 0

**Verify log is being read:**

```bash
sudo fail2ban-client get postfix-client-rejected logpath
```

**Test filter manually:**

```bash
sudo fail2ban-regex /var/lib/docker/containers/<id>/<id>-json.log \
  /etc/fail2ban/filter.d/postfix-client-rejected.conf
```

**Check if attacks exist in log:**

```bash
sudo grep "Client host rejected" /var/lib/docker/containers/<id>/<id>-json.log | tail -5
```

### Problem: Filter Matches in Test, But Not in Jail

**Restart fail2ban:**

```bash
sudo systemctl restart fail2ban
```

**Check for errors:**

```bash
sudo journalctl -u fail2ban -n 50
```

**Verify file permissions:**

```bash
ls -la /etc/fail2ban/filter.d/postfix-*.conf
# Should be readable by root
```

### Problem: Too Many False Positives

**Increase maxretry:**

```bash
sudo nano /etc/fail2ban/jail.local
# Change maxretry = 5 to maxretry = 10
```

**Add ignoreregex for known scanners:**

```ini
[Definition]
failregex = ...
ignoreregex = monitoring\.internet-measurement\.com
              censys-scanner\.com
```

**Reload:**

```bash
sudo fail2ban-client reload <jail-name>
```

## Performance Expectations

### Typical Attack Volume (per 24h)

Based on real-world mail server observations:

| Attack Type | Attempts | Unique IPs | Banned (default config) |
|-------------|----------|------------|-------------------------|
| Client Rejected | 10-30 | 3-8 | 1-3 |
| HTTP on SMTP | 20-50 | 10-25 | 5-10 |
| TLS Errors | 50-150 | 30-80 | 0-2 |
| Postscreen (PREGREET) | 100-300 | 20-50 | 15-30 |

**Key Insight:** Most attacks are distributed. Single IP rarely exceeds threshold unless it's a persistent bot.

### Resource Usage

fail2ban with 9 jails monitoring Docker logs:

- **CPU:** < 1% on idle, ~5% during log processing bursts
- **Memory:** ~50-100 MB RSS
- **Disk I/O:** Minimal (only reads logs, doesn't write frequently)

**Not a performance concern** even on small VPS instances.

## Advanced: Custom Patterns

### Example: Blocking Specific User Agents

If attackers identify themselves with specific User-Agent strings in HTTP requests:

**Filter:**

```ini
[Definition]
failregex = ^.*postfix/.*: .*non-SMTP command.*User-Agent: SomeScanner.*\[<HOST>\]
ignoreregex =
```

### Example: SASL Brute Force (Usually Covered by Default)

**Filter:**

```ini
[Definition]
failregex = ^.*postfix/(submission|submissions)/smtpd\[.*\]: warning: .*\[<HOST>\]: SASL .* authentication failed
ignoreregex =
```

**Jail:**

```ini
[postfix-sasl-custom]
maxretry = 3
bantime = 1h
```

### Testing New Patterns

1. Find example log lines of the attack
2. Write regex pattern
3. Test with `fail2ban-regex`
4. Deploy to production with high `maxretry` initially
5. Monitor for 24h
6. Adjust threshold based on false positive rate

## Integration with Monitoring

### Prometheus Exporter

Install fail2ban exporter:

```bash
# Example with textfile collector
echo "fail2ban_banned_ips $(sudo fail2ban-client status | grep -oP '\d+' | head -1)" \
  > /var/lib/prometheus/node_exporter/fail2ban.prom
```

### Alerting (Example with Slack)

Create script `/usr/local/bin/fail2ban-notify.sh`:

```bash
#!/bin/bash
JAIL=$1
IP=$2
curl -X POST -H 'Content-type: application/json' \
  --data "{\"text\":\"fail2ban: Banned $IP in jail $JAIL\"}" \
  YOUR_SLACK_WEBHOOK_URL
```

Add to jail action:

```ini
action = iptables-docker-user
         /usr/local/bin/fail2ban-notify.sh <name> <ip>
```

## Summary

**Core Principles:**

1. Docker logs require `^.*` prefix in regex patterns
2. Use `iptables-docker-user` for Docker network compatibility
3. Test filters with `fail2ban-regex` before deployment
4. Tune thresholds based on attack patterns, not assumptions
5. Don't ban legitimate security researchers
6. Monitor for 24h after deployment

**Success Metrics:**

- Reduction in attack patterns visible in pflogsumm
- No false positives (legitimate users not banned)
- Banned IP list contains known attackers
- Total failed > 0 for all active jails

**Maintenance:**

- Review banned IP lists weekly
- Update filters if new attack patterns emerge
- Monitor fail2ban logs for errors
- Keep fail2ban updated (`apt-get update && apt-get upgrade fail2ban`)

This configuration provides robust protection while maintaining operational flexibility. The filters are battle-tested against real-world attack patterns and designed to minimize false positives.
