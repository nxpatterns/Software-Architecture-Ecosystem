# WireGuard VPN Between Two Servers

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=5 orderedList=false} -->

<!-- code_chunk_output -->

- [What is WireGuard?](#what-is-wireguard)
- [Why Use WireGuard Between Servers?](#why-use-wireguard-between-servers)
- [Architecture: Server vs Client](#architecture-server-vs-client)
- [Prerequisites](#prerequisites)
- [Step-by-Step Setup](#step-by-step-setup)
  - [Step 1: Install WireGuard on Both Servers](#step-1-install-wireguard-on-both-servers)
  - [Step 2: Generate Keys on Both Servers](#step-2-generate-keys-on-both-servers)
  - [Step 3: Create Configuration Files](#step-3-create-configuration-files)
  - [Step 4: Configure Firewall on Listener Server](#step-4-configure-firewall-on-listener-server)
  - [Step 5: Start WireGuard on Both Servers](#step-5-start-wireguard-on-both-servers)
  - [Step 6: Verify the Tunnel](#step-6-verify-the-tunnel)
- [Common Issues and Solutions](#common-issues-and-solutions)
  - [Issue 1: No Handshake / Peer Shows No Activity](#issue-1-no-handshake--peer-shows-no-activity)
  - [Issue 2: Handshake Succeeds but Ping Fails](#issue-2-handshake-succeeds-but-ping-fails)
  - [Issue 3: Tunnel Works Initially, Then Stops](#issue-3-tunnel-works-initially-then-stops)
- [Security Considerations](#security-considerations)
- [Summary](#summary)

<!-- /code_chunk_output -->


## What is WireGuard?

WireGuard is a modern VPN protocol that creates encrypted tunnels between servers. Unlike traditional VPNs, it's:

- **Simple**: Minimal configuration, modern cryptography
- **Fast**: Lower overhead than OpenVPN or IPSec
- **Secure**: Smaller attack surface, formally verified

## Why Use WireGuard Between Servers?

**Problem**: You have two servers that need to communicate, but you don't want to expose internal APIs to the public internet. Examples:

- A web backend needs to trigger transactional emails on a separate mail server
- A database server should only accept connections from specific application servers
- Microservices need to communicate without public endpoints

**Solution**: Create a private network with WireGuard. Traffic between servers goes through an encrypted tunnel using private IPs (e.g., `10.0.0.1`, `10.0.0.2`). Even if both servers are in different datacenters, the tunnel makes them appear on the same local network.

## Architecture: Server vs Client

WireGuard uses a **peer-to-peer** model, but in practice one server acts as the **listener** (server role) and the other **initiates** the connection (client role):

```
Client Server (10.0.0.2)  ←—— WireGuard Tunnel ——→  Listener Server (10.0.0.1)
  - Initiates connection                               - Listens on UDP port (e.g., 51820)
  - Has Endpoint config (target IP:port)               - No Endpoint config needed
  - PersistentKeepalive keeps tunnel alive             - PostUp/PostDown for firewall rules
```

**Which server should be which?**

- **Listener**: The server with a stable public IP, ideally a dedicated/root server
- **Client**: The cloud/VM server that may have dynamic IPs or is behind NAT

## Prerequisites

- Two Debian/Ubuntu servers with root access
- Both servers can reach each other over the internet on a UDP port (default: 51820)
- No existing WireGuard configuration

## Step-by-Step Setup

### Step 1: Install WireGuard on Both Servers

On each server, install the WireGuard package:

```bash
apt-get update
apt-get install -y wireguard
```

Verify installation:

```bash
wg --version
# Should output: wireguard-tools vX.X.X
```

### Step 2: Generate Keys on Both Servers

On **each** server, generate a private and public key pair:

```bash
# Generate private key (keep this secret!)
wg genkey | sudo tee /etc/wireguard/privatekey > /dev/null

# Generate public key from the private key
sudo cat /etc/wireguard/privatekey | wg pubkey | sudo tee /etc/wireguard/publickey > /dev/null

# Display the public key (you'll need this for the peer config)
sudo cat /etc/wireguard/publickey
```

**Save the public keys** — you'll need to exchange them between servers in the next step.

### Step 3: Create Configuration Files

**On the Listener Server (10.0.0.1):**

Create `/etc/wireguard/wg0.conf`:

```ini
[Interface]
# Replace with your actual private key from /etc/wireguard/privatekey
PrivateKey = YOUR_LISTENER_PRIVATE_KEY_HERE
ListenPort = 51820
Address = 10.0.0.1/24

# Allow forwarding through the tunnel
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -A FORWARD -o wg0 -j ACCEPT
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -D FORWARD -o wg0 -j ACCEPT

[Peer]
# Paste the client's public key here
PublicKey = CLIENT_PUBLIC_KEY_HERE
# Only route traffic destined for the client's tunnel IP
AllowedIPs = 10.0.0.2/32
```

**On the Client Server (10.0.0.2):**

Create `/etc/wireguard/wg0.conf`:

```ini
[Interface]
# Replace with your actual private key from /etc/wireguard/privatekey
PrivateKey = YOUR_CLIENT_PRIVATE_KEY_HERE
Address = 10.0.0.2/24

[Peer]
# Paste the listener's public key here
PublicKey = LISTENER_PUBLIC_KEY_HERE
# Replace with the listener's actual public IP and WireGuard port
Endpoint = LISTENER_PUBLIC_IP:51820
# Only route tunnel traffic, not all internet traffic
AllowedIPs = 10.0.0.1/32
# Keep the tunnel alive through NAT/firewalls
PersistentKeepalive = 25
```

**Key configuration notes:**

- `PrivateKey`: Your server's private key (never share this)
- `PublicKey` in `[Peer]`: The **other** server's public key
- `Endpoint`: Only needed on the client — points to the listener's public IP
- `AllowedIPs`: Restricts traffic to only the peer's tunnel IP (not a full VPN)
- `PersistentKeepalive`: Sends keepalive packets every 25 seconds to prevent NAT timeout

### Step 4: Configure Firewall on Listener Server

The listener server needs to accept incoming UDP connections on port 51820. Add an iptables rule **before** any default DROP rules:

```bash
# Allow WireGuard handshake
sudo iptables -I INPUT -p udp --dport 51820 -j ACCEPT

# Persist the rule (Debian/Ubuntu with iptables-persistent)
sudo iptables-save > /etc/iptables/rules.v4
```

If you have a restrictive firewall with rate limiting on other ports (e.g., HTTPS on 443), you can whitelist the client's tunnel IP to bypass those limits:

```bash
# Example: Allow tunnel traffic on port 443 without rate limits
sudo iptables -I INPUT -s 10.0.0.2/32 -p tcp --dport 443 -j ACCEPT
sudo iptables-save > /etc/iptables/rules.v4
```

### Step 5: Start WireGuard on Both Servers

Enable and start the WireGuard interface:

```bash
# Enable WireGuard to start on boot
sudo systemctl enable wg-quick@wg0

# Start the tunnel now
sudo systemctl start wg-quick@wg0

# Check status
sudo systemctl status wg-quick@wg0
```

### Step 6: Verify the Tunnel

On **each** server, verify the tunnel is up:

```bash
# Check WireGuard status
sudo wg show wg0

# Expected output should show:
# - interface with your public key
# - peer with the other server's public key
# - latest handshake timestamp (should be recent)
# - transfer statistics
```

Test connectivity with ping:

```bash
# On the client (10.0.0.2), ping the listener:
ping -c 3 10.0.0.1

# On the listener (10.0.0.1), ping the client:
ping -c 3 10.0.0.2
```

If pings succeed with sub-2ms latency, the tunnel is working.

## Common Issues and Solutions

### Issue 1: No Handshake / Peer Shows No Activity

**Symptoms**: `wg show` displays the peer but `latest handshake` never appears.

**Causes**:

- Firewall blocking UDP 51820 on the listener
- Incorrect `Endpoint` IP/port on the client
- Keys mismatched (client's public key not in listener's config, or vice versa)

**Debug**:

```bash
# On listener: check if UDP 51820 is listening
sudo ss -ulnp | grep 51820

# On client: try manual ping to listener's public IP
ping -c 3 LISTENER_PUBLIC_IP

# Check iptables rules on listener
sudo iptables -L INPUT -n | grep 51820
```

### Issue 2: Handshake Succeeds but Ping Fails

**Symptoms**: `latest handshake` shows recent timestamp, but `ping 10.0.0.x` times out.

**Causes**:

- `AllowedIPs` misconfigured (doesn't include the peer's tunnel IP)
- Firewall blocking forwarding on the listener (missing `PostUp` rules)
- Routing issue on one server

**Debug**:

```bash
# Check if tunnel interface has the IP
ip addr show wg0

# Check routing table
ip route show | grep 10.0.0

# On listener, verify FORWARD rules exist
sudo iptables -L FORWARD -n | grep wg0
```

### Issue 3: Tunnel Works Initially, Then Stops

**Symptoms**: Tunnel works after setup, but stops responding after hours/days.

**Cause**: NAT timeout on the network path. The client's `PersistentKeepalive` should prevent this, but if it's missing or too high, the tunnel goes idle.

**Fix**: Ensure `PersistentKeepalive = 25` is in the client's config. Restart WireGuard:

```bash
sudo systemctl restart wg-quick@wg0
```

## Security Considerations

1. **Private keys are sacred**: Never commit private keys to version control or share them. Each server's private key should only exist on that server.

2. **Restrict AllowedIPs**: Only route the specific tunnel IPs (e.g., `10.0.0.1/32`), not `0.0.0.0/0`. This prevents the tunnel from becoming a full VPN that routes all traffic.

3. **Firewall the tunnel interface**: Just because servers can reach each other on the tunnel doesn't mean all ports should be open. Apply iptables rules to `wg0` to limit which services are accessible.

4. **Rotate keys periodically**: WireGuard keys don't expire, but rotating them annually is good practice. Generate new keys, update configs, restart WireGuard.

---

## Summary

**WireGuard VPN** gives you secure, low-latency communication between servers without exposing internal services. Key steps: install, generate keys, configure listener + client, open firewall, verify with ping.
