# macOS Boot Slowdown & Privacy Lockdown

## Problem

Boot/Login time degraded from 30-45 seconds to 5-10 minutes.
After login: Finder file dialogs took 1+ minute to appear.

## Root Cause

**External 5TB WD HDD (disk7) connected at boot.**

macOS mounts the APFS container automatically via kernel-level Disk Arbitration -- before any userspace policies (fstab, DAVolumes) can intervene. The slow spinning disk blocks Finder and all file dialogs until fully initialized.

Secondary factor: Pending macOS update (15.4.1) was stuck at 98.61% -- `mobileassetd` and `softwareupdated` were doing verification work at every boot during the early login phase.

### Disk layout (external)

| Volume | Identifier | Size | Use |
|---|---|---|---|
| 5TB-Slow | disk8s1 | 450.7 GB | Files |
| Time Maschine | disk8s3 | 3.2 TB | Time Machine backup |

## Fixes Applied

### 1. macOS Update
Updated to macOS Tahoe 26.4.1 (25E253) via full installer to bypass broken `softwareupdated`:

```bash
sudo softwareupdate --fetch-full-installer --full-installer-version 26.4.1
# Then open /Applications/Install macOS Tahoe.app
```

### 2. fstab (ineffective for APFS -- documented for reference)

`noauto` in `/etc/fstab` does NOT work for APFS volumes on external drives.
macOS 15+ APFS kernel driver mounts before fstab is evaluated.

### 3. DAVolumes (ineffective for APFS -- documented for reference)

```bash
sudo defaults write /Library/Preferences/SystemConfiguration/autodiskmount DAVolumes \
  -dict-add "53FEE50E-5611-4C4C-988B-96116318E84C" "-noauto"
```

Also ignored by the APFS kernel driver.

### 4. Permanent Solution (pending)
**Buy a fast external SSD** and migrate Time Machine to it.
The old HDD can remain disconnected by default and connected manually when needed.

## Disk UUIDs (for reference)

| Item | UUID |
|---|---|
| Physical partition (disk7s1) | 53FEE50E-5611-4C4C-988B-96116318E84C |
| APFS Volume: 5TB-Slow | 52F68A62-A753-4C1B-A953-4A4DC21F22D6 |
| APFS Volume: Time Maschine | 706B4B05-9883-4F48-BE7E-90C9C958C8C1 |

## Boot Time Results

| Condition | Boot Time |
|---|---|
| Before (with HDD, old macOS) | 5-10 minutes |
| After update (with HDD) | ~4 minutes |
| Without HDD | ~1 minute |
| Target (with new fast SSD) | 30-45 seconds |

## Telemetry Daemons Disabled

### Via launchctl disable

```bash
sudo launchctl disable system/com.apple.ap.promotedcontentd
sudo launchctl disable system/com.apple.biomesyncd
sudo launchctl disable system/com.apple.geoanalyticsd
sudo launchctl disable system/com.apple.analyticsagent
sudo launchctl disable system/com.apple.inputanalyticsd
launchctl disable gui/$(id -u)/com.apple.ap.promotedcontentd
launchctl disable gui/$(id -u)/com.apple.biomesyncd
launchctl disable gui/$(id -u)/com.apple.analyticsagent
```

**Note:** `launchctl disable` alone is insufficient -- Apple restarts these daemons regardless.

### Via Little Snitch (effective)

Deny rules created for all four daemons using full executable paths:

| Daemon | Path |
|---|---|
| promotedcontentd | `/usr/libexec/promotedcontentd` |
| biomesyncd | `/usr/libexec/biomesyncd` |
| inputanalyticsd | `/usr/libexec/inputanalyticsd` |
| geoanalyticsd | `/System/Library/PrivateFrameworks/GeoAnalytics.framework/geoanalyticsd` |

Rule settings: **Deny / Any Direction / Any Server / Forever**

## Privacy Settings (System Settings)

**Privacy & Security > Analytics & Improvements:** All toggles OFF
*(Note: daemons run anyway -- Little Snitch rules are the only reliable block)*

**Internet Accounts > Google:**

- Notes: disabled and local copies deleted
- Mail, Contacts, Calendars: active (intentional)

**iCloud Drive:** kept active (used for bookmark sync)

## Little Snitch

**Vendor:** Objective Development (Vienna, Austria)
**URL:** https://www.obdev.at/products/littlesnitch/index.html
**Cost:** ~$60 one-time

Key finding: "Any macOS Process -- allow any connection" default rule is too permissive.
To be reviewed and restricted progressively.

## Tools Used for Diagnosis

```bash
# Boot log
log show --predicate 'subsystem == "com.apple.launchd" OR subsystem == "com.apple.diskarbitration" OR eventMessage contains "timeout" OR eventMessage contains "stall"' --style compact --last boot 2>/dev/null > bootlog.txt

# Find timestamp gaps > 10 seconds
grep -E "^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}" bootlog.txt | awk '{print $1, $2}' | awk -F'[: ]' '{t=$2*3600+$3*60+$4; if(NR>1 && t-prev>10) print prev_line, "-> GAP:", t-prev, "seconds"; prev=t; prev_line=$0}'

# Check external disks
diskutil list external

# Check pending updates
softwareupdate -l
ls -lah /Library/Updates/

# Check active daemons
launchctl list | grep -E "analyticsd|biomesyncd|promotedcontent|geoanalytic|inputanalytic"
```
