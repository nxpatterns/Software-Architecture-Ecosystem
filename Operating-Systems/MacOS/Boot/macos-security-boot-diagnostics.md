# macOS Security & Boot Diagnostics

**Platform:** macOS Tahoe 26.x  
**Purpose:** Personal reference — commands used during security hardening and slow-boot investigation. Generic enough to reuse on any Mac.

---

## Part 1: Boot Diagnostics

### Background

After a system update or configuration change, boot time can increase noticeably. macOS logs everything that happens during startup via the Unified Logging system (`log show`). The goal is to identify which daemon, service, or mount operation is blocking the boot sequence.

### Step 1 — Check When the System Last Booted

```bash
last reboot | head -3
```

**What it does:** Queries the login database (`/var/log/wtmp`) for reboot events. The first line is the most recent boot, including timestamp. Use this to confirm you're looking at the right boot window before pulling logs.

---

### Step 2 — Check for Update Activity During Boot

```bash
log show \
  --predicate 'process == "softwareupdated" OR process == "mobileassetd"' \
  --style compact \
  --last boot 2>/dev/null \
  | grep -i "install\|download\|begin\|finish\|error\|fail" \
  | head -40
```

**What it does:** Filters the unified log for the two processes responsible for OS and asset updates:

- `softwareupdated` — the macOS Software Update daemon; handles OS patches, security updates
- `mobileassetd` — downloads background assets (Siri voices, dictation models, font packages, etc.)

If either of these was active during boot, they can significantly delay startup by competing for disk I/O. The `grep` narrows output to lines that indicate actual work being done rather than idle status messages.

**What to look for:** Any `install` or `download` activity timestamped close to boot time indicates the system was doing update work in the background. An `error` or `fail` line can point to a stuck or retrying update process.

---

### Step 3 — Scan for Timeout Events

```bash
log show \
  --predicate 'eventMessage contains "timeout"' \
  --style compact \
  --last boot 2>/dev/null \
  | grep -v "kernel\|ACM\|msr\|aes-service\|wlan\|deferredStart" \
  | head -80
```

**What it does:** Pulls every log line containing the word "timeout" from the last boot, then filters out known-noisy sources that produce timeout messages routinely and are not indicative of a problem:

| Excluded term | Why it's noise |
|---|---|
| `kernel` | Low-level hardware timing events, normal |
| `ACM` | Apple Chip Management, power state transitions |
| `msr` | Machine-specific register access, hardware-level |
| `aes-service` | Crypto acceleration timeouts during key operations |
| `wlan` | Wi-Fi probe timeouts during interface bring-up |
| `deferredStart` | Services intentionally deferred, expected |

What remains after filtering are genuine, unexpected timeouts in user-space daemons and services — the ones worth investigating.

---

### Step 4 — Full Boot Log Capture

Use this to get the complete picture. Three equivalent variants depending on what you need:

**Quick scan in terminal (first 200 lines):**

```bash
log show \
  --predicate 'subsystem == "com.apple.launchd"
    OR subsystem == "com.apple.diskarbitration"
    OR subsystem == "com.apple.fskit"
    OR eventMessage contains "timeout"
    OR eventMessage contains "stall"
    OR eventMessage contains "slow"' \
  --style compact \
  --last boot 2>/dev/null \
  | head -200
```

**Save full log to file for analysis:**

```bash
log show \
  --predicate 'subsystem == "com.apple.launchd"
    OR subsystem == "com.apple.diskarbitration"
    OR subsystem == "com.apple.fskit"
    OR eventMessage contains "timeout"
    OR eventMessage contains "stall"
    OR eventMessage contains "slow"' \
  --style compact \
  --last boot 2>/dev/null \
  > ~/Downloads/bootlog_full.txt
```

**Save and immediately check line count:**

```bash
log show \
  --predicate 'subsystem == "com.apple.launchd"
    OR subsystem == "com.apple.diskarbitration"
    OR subsystem == "com.apple.fskit"
    OR eventMessage contains "timeout"
    OR eventMessage contains "stall"
    OR eventMessage contains "slow"' \
  --style compact \
  --last boot 2>/dev/null \
  > ~/Downloads/bootlog_full.txt && wc -l ~/Downloads/bootlog_full.txt
```

**What the subsystem filters cover:**

| Subsystem / keyword | What it captures |
|---|---|
| `com.apple.launchd` | Service launch sequencing — which daemons started, stalled, or failed |
| `com.apple.diskarbitration` | Disk mount/unmount events; external volumes, SD cards, Time Machine |
| `com.apple.fskit` | Filesystem-level operations; format checks, mount failures |
| `timeout` | Any service that exceeded its allowed startup window |
| `stall` | I/O or IPC stalls blocking a process from continuing |
| `slow` | Explicit slow-path logging from Apple frameworks |

**Tip:** A log with thousands of lines usually points to a disk or mount issue. A log with hundreds of lines and clear `timeout` entries in `launchd` usually points to a specific daemon. Open the saved file in any text editor with "find" capability and search for the process name that appears most frequently before the first `timeout`.

---

### Reading the Output

The `--style compact` format produces lines like:

```
2026-05-20 08:14:03.412 Df  diskarbitration: (DADisk.c:...) timeout waiting for /dev/disk4s1
```

Fields in order: timestamp, log level (`Df` = Default, `Er` = Error, `Fa` = Fault), subsystem/process, message.

**Log levels that matter:**

| Code | Level | Meaning |
|---|---|---|
| `Df` | Default | Normal operational message |
| `In` | Info | Informational, verbose |
| `Db` | Debug | Very verbose, usually ignorable |
| `Er` | Error | Something failed |
| `Fa` | Fault | Hard failure, always investigate |

Focus on `Er` and `Fa` entries first, then look at the timestamps around them to understand what was happening immediately before the failure.

---

## Part 2: Security Hardening

### Open Port Audit

#### Find All Externally Listening TCP Ports

```bash
sudo lsof -iTCP -sTCP:LISTEN \
  | grep -v "127.0.0.1" \
  | grep -v "localhost" \
  | grep -v "::1"
```

Excludes loopback addresses. What remains is everything listening on `0.0.0.0` or `*` — reachable from the network.

#### Check a Specific Port

```bash
sudo lsof -i :PORT
```

Replace `PORT` with the number. Shows the process name, PID, and user owning the socket.

---

### ARDAgent / Apple Remote Desktop (Port 3283)

**Problem:** `ARDAgent` holds port 3283 open even when Remote Desktop is disabled in System Settings. "No options selected" from `kickstart -show` means no access is granted — but the agent still runs and the port is still open.

Additionally, since recent macOS versions, `com.apple.remotemanagementd` is a separate daemon from ARDAgent with its own network activity. Both must be stopped independently.

#### Diagnose

```bash
# Confirm Remote Desktop and Remote Apple Events are off at the system level
sudo systemsetup -getremoteappleevents
sudo systemsetup -getremotelogin

# Check ARD access configuration (expect "No options selected")
sudo /System/Library/CoreServices/RemoteManagement/ARDAgent.app/Contents/Resources/kickstart -show
```

#### Disable

```bash
# Stop ARDAgent and remove its boot preference
sudo /System/Library/CoreServices/RemoteManagement/ARDAgent.app/Contents/Resources/kickstart \
  -deactivate -stop

# Disable the agent's LaunchDaemon permanently
sudo launchctl disable system/com.apple.ARDAgent
sudo launchctl bootout system /System/Library/LaunchDaemons/com.apple.RemoteDesktop.PrivilegeProxy.plist
sudo launchctl bootout system /System/Library/LaunchAgents/com.apple.ARDAgent.plist

# Also disable remotemanagementd (separate from ARDAgent since recent macOS versions)
sudo launchctl bootout system /System/Library/LaunchDaemons/com.apple.remotemanagementd.plist
sudo launchctl disable system/com.apple.remotemanagementd
```

#### Verify After Reboot

```bash
sudo lsof -i :3283
ps aux | grep -i ARDAgent | grep -v grep
```

Both should return empty.

---

### Remote Services Audit

```bash
# Remote Apple Events — should be Off
sudo systemsetup -getremoteappleevents
# To disable: sudo systemsetup -setremoteappleevents off

# Remote Login (SSH) — should be Off unless needed
sudo systemsetup -getremotelogin
# To disable: sudo systemsetup -setremotelogin off
```

---

### Port Reference and Remediation

| Port | Process | Origin | Action |
|---|---|---|---|
| 3283 | `ARDAgent` / `remotemanagementd` | Apple Remote Desktop | Disable via `kickstart` + `launchctl` (see above) |
| 445 | `launchd` (smbd) | SMB File Sharing | System Settings → Sharing → File Sharing → Off |
| 5000, 7000 | `ControlCenter` | AirPlay Receiver | System Settings → AirDrop & Handoff → AirPlay Receiver → Off |
| 49185 | `rapportd` | Handoff / Continuity | System Settings → AirDrop & Handoff → Handoff → Off |
| 88 | `kdc` | Kerberos | Leave alone — local auth, minimal attack surface |
| 55546 | `symptomsd` | Network Diagnostics | SIP-protected, not configurable |
| ~random | `Code Helper (Plugin)` | VS Code network inspection | Set `"debug.javascript.usePreview": false` in `settings.json` |
| ~random | `logioptionsplus_agent` | Logitech Options+ | Remove from Login Items, or replace with LinearMouse |

#### Port 445 — SMB via Terminal

```bash
sudo launchctl unload -w /System/Library/LaunchDaemons/com.apple.smbd.plist
```

#### VS Code Random Port Fix

VS Code's Node.js service host (introduced around version 1.87) can bind externally on a random port when `--experimental-network-inspection` is active. Add to `settings.json`:

```json
{
  "debug.javascript.usePreview": false
}
```

Restart VS Code and verify:

```bash
sudo lsof -iTCP -sTCP:LISTEN | grep "Code"
```

---

### Custom pf Firewall Rules

When a process cannot be disabled but should not be reachable from the network, block it at the packet filter level.

```bash
# 1. Create the anchor file with the blocking rule
echo "block in proto tcp from any to any port 59869" \
  | sudo tee /etc/pf.anchors/local-block

# 2. Register the anchor in pf.conf
echo 'anchor "local-block"' | sudo tee -a /etc/pf.conf
echo 'load anchor "local-block" from "/etc/pf.anchors/local-block"' \
  | sudo tee -a /etc/pf.conf

# 3. Enable pf and load the updated config
sudo pfctl -e
sudo pfctl -f /etc/pf.conf

# 4. Verify the rule is active
sudo pfctl -a "local-block" -s rules
```

**To survive reboots**, add a LaunchDaemon:

```bash
sudo tee /Library/LaunchDaemons/com.local.pf-local-block.plist > /dev/null << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.local.pf-local-block</string>
    <key>ProgramArguments</key>
    <array>
        <string>/sbin/pfctl</string>
        <string>-f</string>
        <string>/etc/pf.conf</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
EOF

sudo launchctl load /Library/LaunchDaemons/com.local.pf-local-block.plist
```

Note: `sudo pfctl -s rules | grep PORT` often returns nothing useful for anchor rules. Use `pfctl -a "local-block" -s rules` to inspect anchor-specific rules.

---

### LaunchAgent / LaunchDaemon Audit

```bash
# System-wide (third-party daemons run as root)
ls /Library/LaunchDaemons/

# System-wide agents (run as the logged-in user)
ls /Library/LaunchAgents/

# Per-user agents
ls ~/Library/LaunchAgents/

# Check status of a specific label
sudo launchctl list | grep -i KEYWORD
```

Anything not from Apple or a known installed application warrants investigation. Apple-owned entries follow the `com.apple.*` naming convention.

---

### Login Items

```bash
# List via AppleScript (shows what System Events sees)
osascript -e 'tell application "System Events" to get the name of every login item'
```

Also check: System Settings → General → Login Items & Extensions

Unknown entries here can be anything from legitimate app helpers to persistence mechanisms.

---

### Active Outbound Connections

```bash
sudo lsof -i -n -P | grep ESTABLISHED | grep -v "127.0.0.1\|::1"
```

Shows everything currently connected to a remote address. `-n` skips DNS resolution (faster), `-P` shows port numbers instead of service names.

---

### Screen Recording Permissions

Two TCC databases exist — system-level and per-user. Check both:

```bash
# System-level (requires sudo)
sudo sqlite3 /Library/Application\ Support/com.apple.TCC/TCC.db \
  "SELECT client, auth_value, last_modified FROM access \
   WHERE service='kTCCServiceScreenCapture';"

# User-level
sqlite3 ~/Library/Application\ Support/com.apple.TCC/TCC.db \
  "SELECT client, auth_value, last_modified FROM access \
   WHERE service='kTCCServiceScreenCapture';"
```

`auth_value = 2` means access is granted. Any unfamiliar client with auth_value 2 should be revoked immediately via System Settings → Privacy & Security → Screen Recording.

---

### Screen Time

```bash
# Check if Screen Time is taking automatic screenshots
defaults read com.apple.ScreenTimeAgent STAutomaticImageGenerationSetKey 2>/dev/null
```

If the result is `1`, Screen Time is capturing periodic screenshots. Disable via System Settings → Screen Time, or turn off Screen Time entirely if it was not intentionally enabled.

---

### System Extensions

```bash
systemextensionsctl list
```

System extensions run with elevated privileges and deep OS integration (network filters, endpoint security, kernel extensions). Only extensions from applications you deliberately installed should appear here.

---

### FileVault

```bash
sudo fdesetup status
```

Expected output: `FileVault is On.` If it shows Off, the disk is unencrypted at rest.

---

### System Integrity Protection (SIP)

```bash
csrutil status
```

Expected: `System Integrity Protection status: enabled.`

SIP being disabled is a significant red flag unless you explicitly turned it off for a specific purpose and have a documented reason.

---

### Gatekeeper

```bash
spctl --status
```

Expected: `assessments enabled`

---

### Application Firewall

```bash
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate
```

Expected: `Firewall is enabled. (State = 1)`

---

### User Accounts

```bash
dscl . -list /Users
```

Filter out system accounts (those starting with `_` are service accounts). Only your own username and `root` should appear as human-usable accounts.

---

### Recent Logins

```bash
last | grep -v "^wtmp" | head -20
```

Only your own username and `console` should appear. An unfamiliar username in this list means another account has been used to log in.

---

### Certificates in System Keychain

```bash
# Full output with all metadata
security find-certificate -a -Z /Library/Keychains/System.keychain 2>/dev/null

# Filtered to relevant fields only
security find-certificate -a -Z /Library/Keychains/System.keychain 2>/dev/null \
  | grep "SHA-1 hash\|labl\|issr\|subj"
```

Field reference:
- `labl` — certificate label (display name)
- `issr` — issuer (who signed it)
- `subj` — subject (who it was issued to)
- `SHA-1 hash` — fingerprint for verification against known-good sources

---

### Spotlight Index Control

#### What is currently excluded from indexing?

```bash
sudo defaults read /.Spotlight-V100/VolumeConfiguration.plist Exclusions 2>/dev/null
```

#### Which volumes are being indexed?

```bash
sudo mdutil -s -a
```

#### Permanently exclude a volume from Spotlight

The most reliable method — survives macOS updates:

```bash
# List mounted volumes
ls /Volumes/

# Place the sentinel file on the volume
sudo touch /Volumes/<volume-name>/.metadata_never_index

# Delete any existing index on that volume
sudo mdutil -E /Volumes/<volume-name>
```

If the volume name contains spaces, quote it:

```bash
sudo mdutil -E "/Volumes/My Volume"
```

If that fails (can happen with certain volume names), get the device identifier first:

```bash
diskutil list | grep -i "<part-of-name>"
# Example output: 2: APFS Volume My Volume  2.9 TB  disk9s3
sudo mdutil -E /dev/disk9s3
```

---

### Pending Software Updates

```bash
softwareupdate -l
```

Uninstalled updates can sometimes cause boot delays — particularly when `softwareupdated` is trying to stage or verify a pending update on every boot. Install or defer them explicitly rather than leaving them in a pending state indefinitely.

---

## Part 3: SD Card Mount Issues

### Diagnosis

```bash
diskutil list
```

If the card appears here, macOS sees the hardware — the issue is software-level. If it does not appear at all, suspect hardware (dirty slot, damaged card) or a driver regression.

### Manual Mount

```bash
diskutil mount /dev/diskXsY
```

Replace `diskXsY` with the identifier from `diskutil list`. This is a one-time workaround, not a permanent fix.

### Reformatting

Erases all data. Back up first.

```bash
# exFAT — cross-platform (Mac, Windows, cameras)
diskutil eraseDisk ExFAT CARDNAME /dev/diskX

# APFS — Mac-only, best for non-Latin filenames
diskutil eraseDisk APFS CARDNAME /dev/diskX
```

Use the disk identifier (e.g. `disk4`), not the partition identifier (e.g. `disk4s1`).

**Format trade-offs:**

| Format | Mac | Windows | Cameras | Non-Latin filenames |
|---|---|---|---|---|
| exFAT | Full | Full | Most modern | Partial — write errors possible |
| APFS | Full | No | No | Full |
| HFS+ | Full | No (without software) | No | Full |
| NTFS | Read-only (unreliable) | Full | Rare | Full |

If your workflow involves folder names with non-Latin characters (Turkish, Arabic, Cyrillic, etc.) and the card needs to be writable from macOS, use APFS and accept the loss of cross-platform compatibility. There is no clean solution that gives you both.

---

## Quick Reference

```bash
# All externally listening TCP ports
sudo lsof -iTCP -sTCP:LISTEN | grep -v "127.0.0.1\|localhost\|::1"

# What's connected outbound right now
sudo lsof -i -n -P | grep ESTABLISHED | grep -v "127.0.0.1\|::1"

# Boot log — timeout/stall/slow events
log show --predicate 'eventMessage contains "timeout" OR eventMessage contains "stall" OR eventMessage contains "slow"' \
  --style compact --last boot 2>/dev/null | head -100

# FileVault, SIP, Gatekeeper, Firewall — all at once
sudo fdesetup status && csrutil status && spctl --status && \
  sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# Who has Screen Recording permission
sudo sqlite3 /Library/Application\ Support/com.apple.TCC/TCC.db \
  "SELECT client, auth_value FROM access WHERE service='kTCCServiceScreenCapture';"

# LaunchDaemon status check
sudo launchctl list | grep -i KEYWORD

# Disk / SD card
diskutil list
```
