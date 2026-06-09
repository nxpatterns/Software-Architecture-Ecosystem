# macOS Network Traffic Analysis

## Context

This document captures a manual network traffic investigation on macOS, triggered by unusually high traffic volumes confirmed by router statistics. The goal was to identify all active connections and determine whether any were unexpected or suspicious.

The tool used for packet-level inspection was **Lulu** (or a similar macOS network monitor that shows per-connection flow details including source/destination IP, port, protocol, service, and process name).

---

## What We Looked At and Why

### 1. mDNS / Zeroconf Traffic

**What it is:** Multicast DNS (mDNS) is Apple's Bonjour protocol. It runs on UDP port 5353 and sends queries to two multicast addresses:

- `224.0.0.251` (IPv4 mDNS multicast)
- `ff02::fb` (IPv6 mDNS multicast)

**Process responsible:** `mDNSResponder`

**Why it exists:** macOS constantly announces and discovers local services -- AirPrint printers, AirDrop peers, AirPlay devices, etc. This traffic never leaves the local network segment.

**Verdict:** Normal. Negligible traffic volume. Nothing to act on.

---

### 2. ARP (Address Resolution Protocol)

**What it is:** ARP resolves IPv4 addresses to MAC addresses on the local network. It's a Layer 2 protocol -- it doesn't leave the subnet.

**What was seen:** The Mac sent an ARP reply to the default gateway (router at `192.168.254.1`).

**Verdict:** Normal. Standard gateway resolution.

---

### 3. HTTPS to Google (Chrome)

**What it is:** An established TCP connection on port 443 from the Mac to a Google LLC IP (`lcbuda-ai-in-f14.1e100.net`).

**Process responsible:** `Google Chrome Helper` (the renderer subprocess Chrome uses for web content)

**Why it exists:** Chrome's renderer process fetches content from Google servers. This is expected whenever Chrome is open.

**Verdict:** Normal.

---

### 4. HTTPS to Akamai CDN

**What it is:** A short-lived TCP connection on port 443 to an Akamai Technologies IP (Austria-geolocated CDN node).

**Process responsible:** Unknown (the monitor showed `?` -- the connection closed before the process could be identified).

**Why it matters:** Akamai serves content for a large fraction of the internet. The destination alone is not suspicious. The missing process name is a mild gap, but since the connection was already closed it was not possible to identify it in this session.

**How to investigate if it recurs:**

```bash
# While the connection is active, find the owning process by port:
lsof -i :<source_port>

# Or list all established HTTPS connections:
lsof -i TCP:443 | grep ESTABLISHED
```

**Verdict:** Likely normal. Monitor if it recurs with high packet volume.

---

### 5. Unknown TCP on Link-Local IPv6 (Image 2)

**What it looked like:** Two bidirectional TCP flows between the Mac's link-local IPv6 address (`fe80::...`) and another `fe80::...` address. High ephemeral ports. Service shown as `?`.

**Why it was suspicious:** The service was unidentified and the peer address was unfamiliar.

**How it was resolved:** The peer's IPv6 address was mapped to a MAC address using the neighbor cache, which in turn matched a known local device (an iPhone with iOS private Wi-Fi addressing enabled). The TCP flows were Apple Continuity traffic (Handoff, Universal Clipboard, AirDrop coordination). Apple intentionally routes these over link-local IPv6 to keep them off the routable network.

**Verdict:** Normal. Apple Continuity between Mac and iPhone.

---

### 6. Stale ARP Entry for `169.254.169.254`

**What it looked like:** An incomplete ARP entry for `169.254.169.254` in the ARP cache.

**What `169.254.x.x` means:** This is the APIPA range (Automatic Private IP Addressing) -- link-local addresses assigned when DHCP fails. `169.254.169.254` specifically is also the address AWS uses for EC2 instance metadata internally, but on a home/office network that AWS context is irrelevant.

**Why it appears:** At some point something on the Mac sent a packet to that address. Nobody on the network answered (ARP shows `incomplete`), so it's a dead entry.

**How to check if anything is actively talking to it:**

```bash
sudo tcpdump -i en0 host 169.254.169.254
```

If no output appears within a few minutes, nothing is actively using that address.

**Verdict:** Stale cache entry. Not actively used. Clears on its own.

---

## Diagnostic Commands Used

### `ping6 -I <interface> ff02::1`
Sends an ICMPv6 echo request to the all-nodes multicast address on the specified interface. This causes all IPv6-capable devices on the local link to respond, populating the neighbor cache. Useful for discovering link-local peers before running `ndp -a`.

```bash
ping6 -I en0 ff02::1
```

### `ndp -a`
Displays the IPv6 Neighbor Discovery Protocol cache -- the IPv6 equivalent of the ARP table. Shows link-local addresses and their corresponding MAC addresses for all recently seen neighbors.

```bash
ndp -a
```

### `arp -a`
Displays the IPv4 ARP cache. Shows IP-to-MAC mappings for all devices the Mac has recently communicated with on the local network. Hostnames are resolved where possible.

```bash
arp -a
```

### `lsof -i :<port>`
Lists open files (including network sockets) for a specific port. Use this to identify which process owns a connection you spotted in a network monitor.

```bash
lsof -i :58020
```

### `lsof -i TCP:443 | grep ESTABLISHED`
Lists all currently established TCP connections on port 443 (HTTPS), with the owning process name and PID.

```bash
lsof -i TCP:443 | grep ESTABLISHED
```

### `sudo tcpdump -i <interface> host <ip>`
Captures live packets on the specified interface filtered to a specific host. Useful for confirming whether traffic to a suspicious address is actually occurring right now.

```bash
sudo tcpdump -i en0 host 169.254.169.254
```

---

## Overall Findings

All observed traffic was accounted for:

| Traffic | Source | Verdict |
|---|---|---|
| mDNS queries | mDNSResponder (Bonjour) | Normal |
| ARP | macOS networking stack | Normal |
| HTTPS to Google | Google Chrome | Normal |
| HTTPS to Akamai | Unknown process (closed) | Likely normal |
| Link-local TCP | Apple Continuity (Mac + iPhone) | Normal |
| ARP entry `169.254.169.254` | Stale cache, nothing active | Normal |

The high router traffic volume that triggered this investigation was not explained by any of the above (all are low-volume). The root cause of elevated router statistics was not identified in this session and warrants a separate investigation (possible candidates: a different device on the network, router-side traffic like firmware updates or telemetry, or a time window that didn't overlap with this capture).
