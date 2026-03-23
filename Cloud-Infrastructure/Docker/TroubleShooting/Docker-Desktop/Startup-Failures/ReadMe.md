# Docker Desktop on macOS — Startup Failure FAQ

> Diagnosed on macOS Tahoe 26.3.1 with Docker Desktop 4.22.1 → 4.65.0

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=5 orderedList=false} -->

<!-- code_chunk_output -->

- [Q: Docker Desktop does not start after login. Nothing happens when I click the icon. What is going on?](#q-docker-desktop-does-not-start-after-login-nothing-happens-when-i-click-the-icon-what-is-going-on)
- [Q: Why does it work after a full reboot but not after a simple re-launch?](#q-why-does-it-work-after-a-full-reboot-but-not-after-a-simple-re-launch)
- [Q: How do I confirm this is the actual problem?](#q-how-do-i-confirm-this-is-the-actual-problem)
- [Q: How do I check if my Privileged Helper Tools are outdated?](#q-how-do-i-check-if-my-privileged-helper-tools-are-outdated)
- [Q: What is the fix?](#q-what-is-the-fix)
- [Q: After updating, Docker shows an "Integrity issue detected" warning about broken symlinks. Is this a problem?](#q-after-updating-docker-shows-an-integrity-issue-detected-warning-about-broken-symlinks-is-this-a-problem)
- [Q: How do I make Docker Desktop quit completely when I close it, with no background processes?](#q-how-do-i-make-docker-desktop-quit-completely-when-i-close-it-with-no-background-processes)
- [Q: Where are the relevant log files for future debugging?](#q-where-are-the-relevant-log-files-for-future-debugging)
- [Q: Can I fix it without updating, just by reinstalling the helpers manually?](#q-can-i-fix-it-without-updating-just-by-reinstalling-the-helpers-manually)
- [Summary of root cause](#summary-of-root-cause)

<!-- /code_chunk_output -->


## Q: Docker Desktop does not start after login. Nothing happens when I click the icon. What is going on?

The most likely cause is a mismatch between the Docker Desktop app and its **Privileged Helper Tools** (`com.docker.vmnetd`, `com.docker.socket`). These helpers are installed system-wide and do not update automatically when you manually install a newer version of Docker Desktop.

When the helpers are outdated or incompatible with your macOS version, the following chain of failures occurs:

1. `com.docker.backend` starts and immediately pings `vmnetd`.
2. `vmnetd` does not respond (incompatible binary or stale XPC session).
3. The backend watchdog detects that its parent process has disappeared and shuts itself down.
4. Without a running backend, `ethernet-fd.sock` is never created.
5. The VM (`com.docker.virtualization`) starts anyway, tries to connect to `ethernet-fd.sock`, fails, and spins indefinitely with timeout errors.
6. The Electron UI tries to reach `backend.sock`, gets "connection refused", and silently quits after ~6 seconds.
7. Result: nothing visible happens.

## Q: Why does it work after a full reboot but not after a simple re-launch?

A full reboot resets macOS's XPC and launchd state, giving `vmnetd` a clean session to attach to. A simple re-launch of Docker Desktop inherits a broken session where the helper is unresponsive. The socket files (`backend.sock`, `ethernet-fd.sock`) may also be stale leftover files from the previous run with no process behind them.

## Q: How do I confirm this is the actual problem?

Run these commands after a failed start attempt (before rebooting):

```bash
# Check if the VM is running without a working backend
ps aux | grep -i docker | grep -v grep

# Check if the socket is a dead file (no process holds it)
lsof ~/Library/Containers/com.docker.docker/Data/backend.sock

# Check the VM console log for the key error
tail -n 50 ~/Library/Containers/com.docker.docker/Data/log/vm/console.log

# Check the backend log for the watchdog failure
grep -E "watchdog|vmnetd|ethernet-fd" \
  ~/Library/Containers/com.docker.docker/Data/log/host/com.docker.backend.log | tail -n 20
```

**Smoking gun indicators:**

- `console.log` full of: `vpnkit-bridge.socketforward: cannot set up multiplexer... connection timed out`
- `com.docker.backend.log` contains: `watchdog detected parent process disappeared` within milliseconds of startup
- `com.docker.backend.log` contains: `pinging vmnetd` with no successful response following it
- `com.docker.virtualization.log` contains: `sending fd: dialing ethernet-fd.sock: connect: no such file or directory`
- `lsof backend.sock` returns nothing (socket exists as a file but no process owns it)

## Q: How do I check if my Privileged Helper Tools are outdated?

```bash
ls -la /Library/PrivilegedHelperTools/ | grep -i docker
```

Compare the timestamps against your Docker Desktop app version:

```bash
defaults read /Applications/Docker.app/Contents/Info.plist CFBundleShortVersionString
```

If the helper binaries are significantly older than the app (years apart), they are the problem.

## Q: What is the fix?

**Update Docker Desktop.** This is the correct solution. The update process reinstalls the Privileged Helper Tools with binaries that match the new app version and are compatible with your macOS version.

1. Download the latest version from [docs.docker.com](https://docs.docker.com/desktop/release-notes/) or use the URL from your own log:

   ```
   https://desktop.docker.com/mac/main/arm64/221669/Docker.dmg
   ```

2. Install the DMG over the existing installation.
3. Launch Docker Desktop. It will prompt for your password to install updated helpers.
4. Accept the integrity/symlink repair dialog if it appears (see below).

## Q: After updating, Docker shows an "Integrity issue detected" warning about broken symlinks. Is this a problem?

No. This is expected after a major version update. Old symlinks in `/usr/local/bin` point to paths that were renamed or removed in the new version. The affected binaries in this case were:

- `docker-compose` → pointed to old path `bin/docker-compose` (renamed in newer versions)
- `vpnkit` → pointed to old path `bin/com.docker.vpnkit`
- `cagent` → removed entirely in newer Docker Desktop versions

Click **Fix/Repair** in the dialog. Docker Desktop will correct all symlinks automatically.

## Q: How do I make Docker Desktop quit completely when I close it, with no background processes?

In **Settings > General**, disable:

- **Start Docker Desktop when you log in**
- **Allow Docker Desktop to run in the background while Docker CLI is in use**
- **Open Docker Dashboard at startup**

Always quit via the tray icon → **Quit Docker Desktop**, not just by closing the window.

To verify nothing is left running:

```bash
ps aux | grep -i docker | grep -v grep
```

## Q: Where are the relevant log files for future debugging?

| What | Path |
|---|---|
| Backend (Go process) | `~/Library/Containers/com.docker.docker/Data/log/host/com.docker.backend.log` |
| VM console | `~/Library/Containers/com.docker.docker/Data/log/vm/console.log` |
| Virtualization process | `~/Library/Containers/com.docker.docker/Data/log/host/com.docker.virtualization.log` |
| Electron UI | `~/Library/Containers/com.docker.docker/Data/log/host/electron-YYYY-MM-DD-HH.log` |
| All host-side logs | `~/Library/Containers/com.docker.docker/Data/log/host/` |
| All VM-side logs | `~/Library/Containers/com.docker.docker/Data/log/vm/` |

## Q: Can I fix it without updating, just by reinstalling the helpers manually?

Yes, as a last resort if updating is not immediately possible:

```bash
sudo rm /Library/PrivilegedHelperTools/com.docker.vmnetd
sudo rm /Library/PrivilegedHelperTools/com.docker.socket
sudo launchctl bootout system /Library/LaunchDaemons/com.docker.vmnetd.plist 2>/dev/null
sudo rm -f /Library/LaunchDaemons/com.docker.vmnetd.plist
```

Then launch Docker Desktop normally. It will detect the missing helpers and prompt you to reinstall them (requires your password). This reinstalls the helpers from the current app bundle, which may still be outdated if the app itself is old. **Updating the app is the correct long-term fix.**

## Summary of root cause

| Layer | What went wrong |
|---|---|
| Privileged Helpers | `com.docker.vmnetd` from 2023, incompatible with current macOS |
| Backend startup | Watchdog killed backend because native Swift parent never came up |
| VM networking | `ethernet-fd.sock` never created, VM boot stalled at network init |
| UI | Silently exited after failing to reach `backend.native.sock` |
| Symptom | "Nothing happens" when clicking Docker icon |
| Fix | Update Docker Desktop to 4.65.0+ |
