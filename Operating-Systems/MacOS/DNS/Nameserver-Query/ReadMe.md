# DNS Nameserver Query Guide (macOS)

## What Are DNS Nameservers?

DNS nameservers are authoritative servers that store DNS records for a domain. When you query a domain's nameservers, you're finding out which servers are responsible for managing that domain's DNS records (A records, MX records, TXT records, etc.).

Think of nameservers as the "address book keepers" for a domain. If you want to know where to find information about `example.com`, you first need to know which nameservers hold that information.

## Why Query Nameservers?

Common scenarios where you need to identify nameservers:

- **Domain migration verification**: Confirming that DNS has been properly delegated to new hosting
- **Troubleshooting DNS issues**: Identifying where DNS records are actually being served from
- **Domain registration verification**: Checking which provider controls a domain's DNS
- **DNS propagation checking**: Verifying that nameserver changes have propagated globally
- **Security audits**: Identifying potential DNS hijacking or misconfigurations

## Primary Tool: `dig`

`dig` (Domain Information Groper) is pre-installed on macOS and provides the most flexible DNS querying.

### Basic Nameserver Query

```bash
dig NS example.com +short
```

**What this does**: Queries for NS (nameserver) records and shows only the results (no extra output).

**Example output**:

```
ns1.example.com.
ns2.example.com.
```

### Detailed Nameserver Query

```bash
dig NS example.com
```

**What this does**: Shows full DNS query details including query time, server used, and response codes.

**Example output**:

```
; <<>> DiG 9.10.6 <<>> NS example.com
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 12345
;; flags: qr rd ra; QUERY: 1, ANSWER: 2, AUTHORITY: 0, ADDITIONAL: 1

;; QUESTION SECTION:
;example.com.                   IN      NS

;; ANSWER SECTION:
example.com.            172800  IN      NS      ns1.example.com.
example.com.            172800  IN      NS      ns2.example.com.

;; Query time: 45 msec
;; SERVER: 192.168.1.1#53(192.168.1.1)
;; WHEN: Thu Mar 12 14:30:00 CET 2026
;; MSG SIZE  rcvd: 123
```

### Query Specific DNS Server

```bash
dig @8.8.8.8 NS example.com +short
```

**What this does**: Queries Google's public DNS server (8.8.8.8) directly instead of your system's default resolver.

**Why this matters**: Different DNS servers may have different cached information. Querying authoritative or public DNS servers helps verify what the "real" state of DNS is, not just what your local network sees.

### Trace DNS Resolution Path

```bash
dig NS example.com +trace
```

**What this does**: Shows the complete DNS resolution path from root servers down to authoritative nameservers.

**Why use this**: Helps diagnose where in the DNS hierarchy a problem exists. Shows exactly how your query travels through the DNS system.

## Alternative Tools

### `nslookup`

Older tool, still functional but less detailed than `dig`.

```bash
nslookup -type=NS example.com
```

**When to use**: Quick checks, or if you're more comfortable with older Unix tools.

### `host`

Simpler output than `dig`, middle ground between `dig` and `nslookup`.

```bash
host -t NS example.com
```

**When to use**: When you want cleaner output than `dig` detailed mode but more context than `+short`.

## Understanding Nameserver Output

### The Trailing Dot

Nameservers appear as `ns1.example.com.` (with a trailing dot). This dot represents the DNS root and indicates a Fully Qualified Domain Name (FQDN). It's normal and expected.

### TTL Values

In detailed output, you'll see numbers like `172800` before `IN NS`. This is the Time To Live (TTL) in seconds—how long DNS resolvers should cache this record before checking again.

- `172800` = 48 hours
- `86400` = 24 hours
- `3600` = 1 hour

**Why this matters**: Low TTL means changes propagate faster but generates more DNS traffic. High TTL improves performance but delays propagation of changes.

### Multiple Nameservers

Domains typically have 2-4 nameservers for redundancy. If one fails, DNS continues working via the others.

## Common Use Cases

### Verify Domain Transfer Completed

After transferring a domain to new hosting:

```bash
dig NS yourdomain.com +short
```

Compare output against the nameservers your new host told you to expect.

### Check DNS Propagation

Query multiple public DNS servers to see if changes have propagated:

```bash
dig @8.8.8.8 NS example.com +short
dig @1.1.1.1 NS example.com +short
dig @208.67.222.222 NS example.com +short
```

If all return the same nameservers, propagation is complete.

### Identify DNS Provider

The nameserver hostnames reveal the DNS provider:

- `ns-*.awsdns.com` = Amazon Route 53
- `*.cloudflare.com` = Cloudflare
- `*.googledomains.com` = Google Domains
- `*.registrar-servers.com` = Namecheap

### Troubleshoot "Domain Not Resolving"

If a domain isn't resolving:

1. Check if nameservers are set: `dig NS example.com +short`
2. If empty or wrong, the domain's registrar configuration is incorrect
3. If correct, check the nameservers themselves are responding: `dig @ns1.example.com A example.com`

## Troubleshooting

### "connection timed out; no servers could be reached"

**Cause**: Network connectivity issue or firewall blocking DNS (port 53).

**Fix**: Check internet connection, try a different network, or verify firewall isn't blocking DNS.

### SERVFAIL status

**Cause**: The nameserver exists but can't answer your query. Often indicates misconfiguration.

**Fix**: Contact the domain's DNS provider. The nameservers themselves may be misconfigured.

### NXDOMAIN status

**Cause**: The domain doesn't exist in DNS.

**Fix**: Verify you spelled the domain correctly. If correct, the domain may not be registered or DNS hasn't been configured yet.

### No nameservers returned

**Cause**: The domain has no NS records set at the registrar level.

**Fix**: Log into your domain registrar and configure nameservers.

## Best Practices

1. **Always use +short for scripting**: Produces consistent, parseable output
2. **Query multiple servers when troubleshooting**: Your local DNS may be cached/stale
3. **Wait 24-48 hours after changes**: DNS propagation takes time
4. **Document nameservers before changes**: Know what you're changing from
5. **Use +trace sparingly**: It generates many queries; use only when debugging resolution path

## Quick Reference

| Task | Command |
|------|---------|
| Basic query | `dig NS example.com +short` |
| Detailed query | `dig NS example.com` |
| Query specific server | `dig @8.8.8.8 NS example.com` |
| Trace resolution | `dig NS example.com +trace` |
| Alternative tool | `host -t NS example.com` |

## Related Commands

- `dig A example.com` - Query A records (IPv4 addresses)
- `dig AAAA example.com` - Query AAAA records (IPv6 addresses)
- `dig MX example.com` - Query mail server records
- `dig TXT example.com` - Query text records (often used for verification)
- `dig ANY example.com` - Query all record types (note: many servers now limit this)

**Remember**: DNS changes aren't instant. Always allow time for propagation and verify changes from multiple perspectives before assuming something is broken.
