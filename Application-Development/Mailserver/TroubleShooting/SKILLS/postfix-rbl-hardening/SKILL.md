---
name: postfix-rbl-hardening
description: Configure RBL (Realtime Blackhole List) checks in Postfix smtpd_recipient_restrictions to reject known bad IPs before they reach Policy daemons (SPF, Greylisting). Use this skill whenever the user mentions Postfix scanner noise, unwanted connections in mail logs, adding Spamhaus or SpamCop checks, hardening smtpd_recipient_restrictions, or asks why scanners are not being blocked despite fail2ban being active. Also trigger when the user wants to reduce Policy daemon load or add pre-auth rejection in Postfix — even if they don't use the word "RBL".
---

# Postfix RBL Hardening

Add Spamhaus/SpamCop RBL checks to `smtpd_recipient_restrictions` so known bad IPs are rejected cheaply before reaching SPF, Greylisting, or other Policy daemon calls.

---

## Prerequisites

Before making changes, verify:

```bash
# 1. Current restrictions (shows what's already there):
postconf smtpd_recipient_restrictions

# 2. mynetworks (confirm internal/relay IPs won't be RBL-checked):
postconf mynetworks

# 3. IPv6 status (affects RBL lookup behavior):
postconf inet_protocols
```

If `inet_protocols = all` (dual-stack), RBL lookups still work correctly — Postfix queries RBLs via A-record lookups which are IPv4 by nature.

---

## RBL Placement Rule

RBL checks must come **after** `permit_sasl_authenticated` and `permit_mynetworks`, but **before** any `check_policy_service` calls. This ensures:

- Authenticated users and internal IPs are never RBL-checked
- Known bad IPs are rejected before the expensive Policy daemon round-trips

```
permit_sasl_authenticated
permit_mynetworks
reject_unauth_destination
reject_rbl_client zen.spamhaus.org=127.0.0.[2..11]   ← here
reject_rbl_client bl.spamcop.net                      ← here
check_policy_service unix:private/policyd-spf         ← policy daemons after
...
```

---

## Recommended RBLs

| RBL | Parameter | Notes |
| --- | --- | --- |
| Spamhaus ZEN | `zen.spamhaus.org=127.0.0.[2..11]` | Composite zone (SBL+XBL+PBL). The return code filter `=127.0.0.[2..11]` skips codes that indicate "query limit reached" or "paid tier required" — critical for free-tier use. |
| SpamCop | `bl.spamcop.net` | Strong coverage of active spam sources. No return code filter needed. |

---

## Applying the Change

### Option A: docker-mailserver (postfix-main.cf override)

Edit the persistent override file on the host:

```
/opt/mailserver/docker-data/dms/config/postfix-main.cf
```

Add or update the `smtpd_recipient_restrictions` line. Then apply to the running container:

```bash
docker exec mailserver postconf -e 'smtpd_recipient_restrictions = permit_sasl_authenticated, permit_mynetworks, reject_unauth_destination, reject_rbl_client zen.spamhaus.org=127.0.0.[2..11], reject_rbl_client bl.spamcop.net, <...rest of existing restrictions...>'
docker exec mailserver postfix reload
```

**Persistence caveat:** `docker restart` skips the setup routine and does not re-apply `postfix-main.cf`. The `postconf -e` change survives `docker restart` (it writes to `/etc/postfix/main.cf` inside the container), but a full `docker compose up --force-recreate` will re-process `postfix-main.cf` correctly via `postconf -n` deduplication (last definition wins).

### Option B: Bare-metal / standard Postfix

Edit `/etc/postfix/main.cf` directly, then:

```bash
postfix reload
```

---

## Verify

```bash
# Confirm the change is active:
postconf smtpd_recipient_restrictions
# (or: docker exec mailserver postconf smtpd_recipient_restrictions)

# Test Spamhaus lookup manually (known test IP, should return 127.0.0.2):
host 2.0.0.127.zen.spamhaus.org

# Watch live RBL rejections in the log:
tail -f /var/log/mail/mail.log | grep "blocked using\|REJECT"
```

---

## Troubleshooting

**RBL check not active after reload:** Run `postconf smtpd_recipient_restrictions` — if the RBL entries are missing, the override file has a duplicate key that lost to an earlier definition. Use `postconf -e` to write directly to `main.cf` and bypass the conflict.

**Legitimate mail rejected:** Check the sender IP against Spamhaus: `https://check.spamhaus.org`. If listed incorrectly, add to Postfix `check_client_access` whitelist or use `permit_mynetworks` for known relay IPs.

**Spamhaus returning unexpected codes:** The `=127.0.0.[2..11]` filter on `zen.spamhaus.org` is essential for free-tier use. Without it, Postfix may reject based on return code `127.255.255.254` (query limit exceeded), causing false positives.
