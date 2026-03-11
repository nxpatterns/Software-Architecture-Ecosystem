# Security Audit

Security Audit and IP Investigation (macOS/Debian)

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=5 orderedList=false} -->

<!-- code_chunk_output -->

- [Overview](#overview)
- [How Attackers Find Your Open Ports](#how-attackers-find-your-open-ports)
- [Built-in macOS Tools for IP Investigation](#built-in-macos-tools-for-ip-investigation)
  - [Basic Network Queries](#basic-network-queries)
  - [API-Based Geolocation (No Installation)](#api-based-geolocation-no-installation)
- [Security Auditing Your Server](#security-auditing-your-server)
  - [External Port Scanning with nmap](#external-port-scanning-with-nmap)
  - [Online Scanning Services](#online-scanning-services)
- [Analyzing Attacker IPs from Logs](#analyzing-attacker-ips-from-logs)
  - [GeoIP Lookup Tools](#geoip-lookup-tools)
  - [Common Log Analysis Pattern](#common-log-analysis-pattern)
- [Security Hardening Recommendations](#security-hardening-recommendations)
  - [1. Minimize Open Ports](#1-minimize-open-ports)
  - [2. Implement Rate Limiting](#2-implement-rate-limiting)
  - [3. Install fail2ban](#3-install-fail2ban)
  - [4. Mail Server Specific](#4-mail-server-specific)
  - [5. Regular Audits](#5-regular-audits)
- [Expected vs. Suspicious Activity](#expected-vs-suspicious-activity)
  - [Normal (Expected)](#normal-expected)
  - [Suspicious (Investigate)](#suspicious-investigate)
- [Troubleshooting Note](#troubleshooting-note)
- [Additional Tools](#additional-tools)
- [Quick Reference Commands](#quick-reference-commands)
- [Resources](#resources)

<!-- /code_chunk_output -->


## Overview

This guide covers tools and techniques for auditing your own server security and investigating suspicious IP addresses from server logs, particularly for mail servers.

## How Attackers Find Your Open Ports

Attackers don't target you specifically. Automated tools scan the entire internet continuously:

- **Shodan** and **Censys** maintain databases of all internet-connected devices
- **Masscan** can scan the entire IPv4 space in under 6 minutes
- Port scanners probe random IP ranges 24/7

**Bottom line:** If you open a port, it will be discovered within minutes to hours. This is normal internet background noise.

## Built-in macOS Tools for IP Investigation

### Basic Network Queries

```bash
# WHOIS lookup - registration and ownership info
whois <ip>

# Reverse DNS lookup
nslookup <ip>
dig -x <ip>
host <ip>

# Network connectivity
ping <ip>
traceroute <ip>

# Local network info
arp -a                # MAC addresses on local network
netstat -rn          # Routing table
```

### API-Based Geolocation (No Installation)

```bash
# Simple JSON responses
curl ipinfo.io/<ip>
curl ifconfig.co/<ip>
curl ip-api.com/json/<ip>

# Formatted output
curl -s "http://ip-api.com/json/<ip>" | jq
```

## Security Auditing Your Server

### External Port Scanning with nmap

Install nmap via Homebrew:

```bash
brew install nmap
```

**Basic scans:**

```bash
# Quick scan of common ports
nmap <your-ip>

# Full port scan with service detection
nmap -sV -sC -p- <your-ip>

# Aggressive scan (OS detection, version detection, script scanning)
nmap -A <your-ip>

# Show only open ports
nmap -p- --open <your-ip>

# UDP scan (important for DNS, NTP, SNMP)
sudo nmap -sU -p 53,123,161 <your-ip>
```

**What to look for:**

- Unexpected open ports
- Outdated service versions
- Services that shouldn't be public-facing

### Online Scanning Services

Alternative to running nmap locally:

- https://hackertarget.com/nmap-online-port-scanner/
- https://pentest-tools.com/network-vulnerability-scanning/tcp-port-scanner-online-nmap
- https://www.shodan.io/ (shows what's already indexed about your server)

## Analyzing Attacker IPs from Logs

### GeoIP Lookup Tools

**Option 1: geoip2fast (Python-based, recommended)**

```bash
brew install geoip2fast
geoip2fast <ip>
```

**Option 2: Classic geoiplookup (legacy)**

```bash
brew install geoip
geoiplookup <ip>
```

**Option 3: API-based (no installation required)**

```bash
# Single IP lookup
curl -s "http://ip-api.com/json/<ip>" | jq

# Batch processing from logs
cat /var/log/mail.log | grep -oE "\b([0-9]{1,3}\.){3}[0-9]{1,3}\b" | sort -u | \
while read ip; do
  echo -n "$ip: "
  curl -s "http://ip-api.com/line/$ip?fields=country,city,isp"
  sleep 0.5  # Rate limiting
done
```

### Common Log Analysis Pattern

Extract unique IPs from logs and get geographic info:

```bash
# Extract IPs, deduplicate, and lookup
grep "failed\|rejected" /var/log/mail.log | \
  grep -oE "\b([0-9]{1,3}\.){3}[0-9]{1,3}\b" | \
  sort -u | \
  while read ip; do
    echo -n "$ip: "
    curl -s "http://ip-api.com/line/$ip?fields=country,city"
  done
```

## Security Hardening Recommendations

### 1. Minimize Open Ports

Only expose necessary services:

- Mail: 25 (SMTP), 587 (submission), 993 (IMAPS)
- Web: 80 (HTTP), 443 (HTTPS)
- SSH: 22 (or custom port)

Close everything else.

### 2. Implement Rate Limiting

**For mail servers:**

- Configure connection limits per IP
- Set rate limits for authentication attempts
- Use greylisting for spam reduction

**System-level (macOS pf firewall):**

```bash
# Example pf rule for SSH rate limiting
table <bruteforce> persist
block quick from <bruteforce>
pass inet proto tcp to port ssh flags S/SA keep state \
  (max-src-conn-rate 3/60, overload <bruteforce> flush global)
```

### 3. Install fail2ban

Automatically blocks IPs after repeated failed attempts:

```bash
# Note: fail2ban is primarily for Linux, macOS support is limited
# Alternative: Use built-in pf firewall with rate limiting
```

### 4. Mail Server Specific

- **SPF records**: Specify authorized sending servers
- **DKIM**: Sign outgoing emails
- **DMARC**: Define policy for failed authentication
- **TLS enforcement**: Require encrypted connections
- **Disable plaintext authentication**: Force STARTTLS

### 5. Regular Audits

```bash
# Check listening services
sudo lsof -i -P -n | grep LISTEN

# Check firewall rules (macOS pf)
sudo pfctl -sr

# Review recent connections
netstat -an | grep ESTABLISHED
```

## Expected vs. Suspicious Activity

### Normal (Expected)

- Connection attempts from various countries
- Failed login attempts (bots trying common passwords)
- Port scans on common ports (22, 25, 80, 443)
- Hundreds of attempts per day on public-facing services

### Suspicious (Investigate)

- Successful logins from unexpected locations
- Unusual traffic patterns (sudden spike)
- Connections to unexpected ports
- Outbound connections you didn't initiate
- Services using more bandwidth than expected

## Troubleshooting Note

**Common mistake:** The package name `geoip2-utils` does not exist in Homebrew. Use `geoip2fast`, `geoip`, or API-based solutions instead.

## Additional Tools

```bash
# Web log analyzer
brew install goaccess

# Network monitoring
brew install wireshark

# Advanced packet analysis
brew install tcpdump
```

## Quick Reference Commands

```bash
# Who owns this IP?
whois <ip>

# Where is this IP located?
curl ipinfo.io/<ip>

# What ports are open on my server?
nmap -p- --open <my-ip>

# What's trying to connect to my server?
sudo tcpdump -i any port 25

# Block an IP (macOS pf)
echo "block drop from <ip> to any" | sudo pfctl -f -
```

## Resources

- Shodan: https://www.shodan.io/
- IP API (free): https://ip-api.com/
- MaxMind GeoLite2: https://dev.maxmind.com/geoip/geolite2-free-geolocation-data
- nmap documentation: https://nmap.org/book/man.html
