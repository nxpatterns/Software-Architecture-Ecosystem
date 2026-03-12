# SSH Connection Management & SFTP Guide

## SSH Timeout Issues

### The Problem

When an SSH connection sits idle in the background (terminal minimized, switched to another window), it often appears "frozen" when you return to it. The terminal doesn't respond to input, and you're forced to close and reopen the connection.

**Why this happens:**

Network devices (routers, firewalls, NAT gateways) between you and the remote server drop idle TCP connections to conserve resources. They assume silent connections are dead. When you try to type again, your client doesn't know the connection is gone until it times out trying to send data.

This is especially common in corporate networks, public WiFi, or when connecting through VPNs.

### The Solution: SSH Keepalives

Configure SSH to send periodic "heartbeat" packets to keep the connection alive.

#### Client-Side Configuration (Recommended)

Edit `~/.ssh/config`:

```ssh-config
Host *
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

**What these do:**

- `ServerAliveInterval 60`: Send a keepalive packet every 60 seconds
- `ServerAliveCountMax 3`: Give up after 3 failed keepalive attempts

**Units:** Values are in **seconds**, not minutes.

**Total timeout:** 3 attempts × 60 seconds = ~180 seconds (3 minutes) before declaring the connection dead.

#### Per-Connection Override

If you don't want to modify your SSH config:

```bash
ssh -o ServerAliveInterval=60 -o ServerAliveCountMax=3 user@host
```

#### Adjusting for Different Networks

**Aggressive firewalls** (corporate networks):

```ssh-config
ServerAliveInterval 30    # More frequent keepalives
ServerAliveCountMax 2
```

**Stable connections** (home network, datacenter):

```ssh-config
ServerAliveInterval 300   # 5 minutes
ServerAliveCountMax 2
```

**Finding the right value:** Most corporate firewalls drop idle connections after 5-15 minutes. Start with 60 seconds. If connections still freeze, reduce to 30 seconds.

### Emergency: Force-Disconnect a Frozen Session

Instead of killing the terminal, use SSH's escape sequence:

```
~.
```

**How to use:**

1. Press Enter (to ensure you're at the start of a line)
2. Type tilde `~` then dot `.`

This forces SSH to terminate immediately, even if the connection is frozen. Works in any SSH client.

**Other useful escape sequences:**

- `~?` - Show all available escape commands
- `~^Z` - Suspend SSH to background
- `~~` - Send a literal tilde character

**Note:** The tilde only works at the beginning of a line. If it's not responding, press Enter first.

### Alternative Approaches

#### Use Terminal Multiplexers (Best for Long Sessions)

Run `tmux` or `screen` on the remote server before starting work:

```bash
ssh user@host
tmux new -s work
# Your session survives disconnections
```

When reconnecting:

```bash
ssh user@host
tmux attach -t work
```

**Why this helps:** Even if SSH disconnects, your remote session continues running. You just reattach to it.

#### AutoSSH (Automatic Reconnection)

Install `autossh` to automatically reconnect dropped connections:

```bash
autossh -M 0 -o ServerAliveInterval=60 user@host
```

### Server-Side Configuration (Optional)

If you control the remote server, edit `/etc/ssh/sshd_config`:

```ssh-config
ClientAliveInterval 60
ClientAliveCountMax 3
```

Then restart SSH: `systemctl restart sshd`

**Difference:** Server-side keepalives are sent from server to client. Client-side keepalives (ServerAlive) are sent from client to server. Both work, but client-side is easier to configure without admin access.

---

## SFTP Basics

SFTP (SSH File Transfer Protocol) provides secure file transfer over SSH. It's not FTP over SSH, it's a completely different protocol.

### Connecting

```bash
sftp user@host
# or with specific port
sftp -P 2222 user@host
```

Once connected, you're in an interactive shell with two contexts:

- **Remote:** The server's filesystem
- **Local:** Your local machine's filesystem

### Navigation

**Remote commands** (no prefix):

```
pwd                    # Show remote working directory
ls                     # List remote files
cd /path/to/dir        # Change remote directory
mkdir dirname          # Create remote directory
```

**Local commands** (prefix with `l`):

```
lpwd                   # Show local working directory
lls                    # List local files
lcd /local/path        # Change local directory
lmkdir dirname         # Create local directory
```

### Transferring Files

#### Download from Remote to Local

**Basic download:**

```
get remotefile.zip
```

Downloads to your current local directory (shown by `lpwd`).

**Download to specific location:**

```
get remotefile.zip /local/path/to/destination/
```

**Download with progress indicator:**

```
get -P remotefile.zip
```

**Download entire directory:**

```
get -r remote-directory/
```

#### Upload from Local to Remote

**Basic upload:**

```
put localfile.zip
```

Uploads to current remote directory (shown by `pwd`).

**Upload with different name:**

```
put localfile.zip newname.zip
```

**Upload from specific location:**

```
put /local/path/to/file.zip
```

**Upload entire directory:**

```
put -r local-directory/
```

### Common Workflow

```bash
# Connect
sftp user@storage.example.com

# Check where you are remotely
pwd
# Output: Remote working directory: /home/user

# Navigate to target directory
cd backups/2024

# Check where you are locally
lpwd
# Output: Local working directory: /Users/username/Downloads

# Change local directory if needed
lcd /Users/username/Documents

# Download a file
get 20241017.zip

# Upload a file
put report.pdf

# Exit
bye
```

### Useful Tips

**Resume interrupted transfers:** Use `-a` flag:

```
get -a largefile.zip    # Resume download
put -a largefile.zip    # Resume upload
```

**Check transfer speed:**

```
get -P file.zip         # Shows progress and speed
```

**Batch operations:**

```
mget *.zip              # Download all .zip files
mput *.pdf              # Upload all .pdf files
```

**Get help:**

```
help                    # Show all commands
```

### Exit Commands

```
bye                     # Exit SFTP
exit                    # Also exits
quit                    # Also exits
```

---

## Troubleshooting

### "Connection reset by peer" or "Broken pipe"

Your connection was dropped. Possible causes:

1. Idle timeout (solved by keepalives above)
2. Network instability
3. Server restart
4. Firewall interference

**Solution:** Configure keepalives as described above.

### SFTP "Permission denied"

Check:

1. Do you have read/write permissions on remote directory?
2. Is the local directory writable?
3. Does the remote path exist?

```
# Check remote permissions
ls -la
# Check local permissions
lls -la
```

### "Connection refused"

1. SSH service not running on remote host
2. Wrong port (default is 22)
3. Firewall blocking connection

**Try:**

```bash
# Test basic SSH connectivity first
ssh user@host
# If that works, SFTP should too

# Try different port
sftp -P 2222 user@host
```

### Transfer seems stuck

Large files can appear frozen. Use `-P` flag to see progress:

```
get -P largefile.zip
```

---

## Best Practices

1. **Always use ServerAliveInterval** in your SSH config to prevent freezes
2. **Use tmux/screen** for long-running sessions that need to survive disconnects
3. **Test with small files** when using SFTP to verify paths before transferring large files
4. **Remember ~.** to escape frozen SSH sessions instead of killing terminals
5. **Use `get -a` / `put -a`** for resumable transfers of large files
6. **Verify transfers** with checksums after important file transfers:

   ```bash
   # On both sides
   sha256sum file.zip
   ```

---

## Quick Reference

### SSH Keepalive Config

```ssh-config
# ~/.ssh/config
Host *
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

### SFTP Cheat Sheet

```
get remote.file          # Download
put local.file           # Upload
get -P file.zip          # Download with progress
put -r directory/        # Upload directory
pwd / lpwd               # Show remote/local directory
cd / lcd                 # Change remote/local directory
ls / lls                 # List remote/local files
```

### SSH Escape Sequences

```
~.                       # Force disconnect
~?                       # Help
```
