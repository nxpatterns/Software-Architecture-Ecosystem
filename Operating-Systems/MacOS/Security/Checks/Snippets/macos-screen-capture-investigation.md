# macOS: Investigating Unexpected Screen Capture / Display Flicker

## Context

Sometimes macOS shows a brief display flicker — one monitor goes dark for a fraction of a second — that looks identical to the visual effect produced when a screenshot is taken manually (`Cmd+Shift+3/4`). This can also occur when an application acquires a screen recording session in the background.

This document captures the investigative process, what worked, what did not, and what the likely causes are. Written for a reader returning after six months.

---

## Symptom

- One display (typically a secondary external monitor) briefly flickers or goes black for ~0.3 seconds
- The effect is visually identical to taking a screenshot or starting a screen recording
- Occurs sporadically, not on a fixed schedule
- Persists regardless of which application is in the foreground

---

## Why This Happens

Three distinct root causes produce identical symptoms:

**1. Screen Capture API call**
When any process calls `CGWindowListCreateImage` or the modern `ScreenCaptureKit` API, macOS's WindowServer compositor must render a frame for capture. This momentarily interrupts the display pipeline, producing the flicker.

**2. Display link reinitialization**
A monitor connected via an adapter (e.g. HDMI-to-USB-C) can briefly drop and re-establish the signal, especially under GPU load. macOS treats this as a disconnect/reconnect and WindowServer recomposes all displays.

**3. WindowServer overload**
Under high GPU/compositor load (e.g. two 4K displays + active browser rendering), WindowServer can miss a frame deadline. One display gets no frame for one cycle, which appears as a flicker.

All three look the same to the user. Distinguishing them requires process monitoring at the moment of the event.

---

## Investigation Toolkit

### Who has Screen Recording permission?

```bash
sudo sqlite3 "/Library/Application Support/com.apple.TCC/TCC.db" \
  "SELECT client, auth_value FROM access WHERE service='kTCCServiceScreenCapture';"
```

`auth_value=2` means allowed, `auth_value=0` means denied.

Note: `tccutil list ScreenCapture` does NOT work — the correct `tccutil` syntax is only for `reset`, not listing. The SQLite query above is the reliable method.

### Revoke Screen Recording permission for a specific app

```bash
tccutil reset ScreenCapture com.example.bundleid
```

If the app is no longer installed, this returns an error (`OSStatus -10814`). The ghost entry in the TCC database is harmless but can be cleaned up:

```bash
sudo sqlite3 "/Library/Application Support/com.apple.TCC/TCC.db" \
  "DELETE FROM access WHERE client='com.example.bundleid';"
```

Note: On macOS Ventura and later, the TCC database is SIP-protected and may be read-only even with `sudo`. In that case, use System Settings > Privacy & Security > Screen Recording to manage permissions via the UI.

### Monitor active network connections by process

```bash
sudo lsof -i -n -P | grep ESTABLISHED
```

Useful for identifying whether a suspicious process is actively transmitting data.

### Catch which process spikes at the moment of flicker

```bash
while true; do
  date
  ps aux | sort -rk3 | head -8
  echo "---"
  sleep 2
done
```

Run this in a terminal and watch which process appears at the top of the list immediately after a flicker occurs. The `-rk3` sorts by CPU descending (macOS `ps` syntax — not Linux's `--sort`).

### Check what Screen Recording flags a process was started with

```bash
ps aux | grep "YourApp" | grep -o "ScreenCaptureKit[^ ]*"
```

Modern Electron-based applications (VSCode, Chrome, etc.) may include `ScreenCaptureKitPickerScreen` and `ScreenCaptureKitStreamPickerSonoma` in their startup flags. These enable the modern macOS screen capture picker UI and are set by Electron itself, not by extensions. Their presence does not necessarily mean screen capture is actively occurring.

### Check display connection details

```bash
system_profiler SPDisplaysDataType
```

Look for `Connection Type` in the output. If it shows `DisplayLink` or `USB`, a software-based display driver is involved, which is a known source of instability. If the field is absent, the display is likely connected via native Thunderbolt/HDMI.

### Monitor filesystem activity for screen-related operations

```bash
sudo fs_usage -w | grep -i "display\|screen\|frame"
```

Noisy output, but useful for catching processes accessing display-related system paths.

---

## What Was Ruled Out

**Chrome Extensions with Screen Capture permissions**

Chrome Extensions must declare `desktopCapture`, `screenCapture`, or `tabCapture` in their `manifest.json` to access screen content. This is enforced by the browser sandbox. To check all installed extensions:

```bash
find ~/Library/Application\ Support/Google/Chrome/Default/Extensions/ \
  -name "manifest.json" -maxdepth 3 -print0 | \
  xargs -0 grep -l '"desktopCapture"\|"screenCapture"\|"tabCapture"'
```

If this returns nothing, no installed extension has the technical capability to capture the screen.

Note: Chrome also installs "Component Extensions" (Web Store, Network Speech, Hangouts, Web Store Payments) that are invisible in `chrome://extensions` but visible in `chrome://system`. These are legitimate Google-managed extensions, not malware.

**VSCode ScreenCaptureKit flags**

VSCode's `argv.json` (`~/Library/Application Support/Code/argv.json`) accepts Chromium flags but does not reliably suppress `--enable-features` flags set internally by Electron. Attempting to add `"disable-features": "ScreenCaptureKitPickerScreen,ScreenCaptureKitStreamPickerSonoma"` to `argv.json` had no effect. These flags are baked into Electron's defaults for Live Share screen sharing support.

**DisplayLink adapters**

If using a HDMI-to-USB-C or similar adapter, sporadic flicker under GPU load is a known issue with the adapter's controller chip reinitializing the signal. However, this cause produces *constant* instability, not a sudden onset after a specific event. If the flicker started suddenly after a specific action (granting a permission, installing software), adapter hardware is unlikely to be the root cause.

---

## What Worked / Actual Findings

### Primary finding: browser-granted Screen Recording permission

The flicker began after granting Screen Recording permission to a browser or a browser-based communication app (e.g. a web conferencing tool running as a web app or browser extension). The browser, once granted this permission at the OS level, can retain it and pass it to web apps via the `getDisplayMedia()` API without requiring additional prompts.

**Fix:** Revoke Screen Recording permission for the browser entirely via:

```
System Settings > Privacy & Security > Screen Recording
```

Toggle off the browser entry. This immediately stops any web app from accessing screen content through that browser.

**Observation:** Revoking the permission stopped the flicker. It briefly reappeared, suggesting a Service Worker or background page in the browser retained a capture session. Closing the browser completely resolved it.

### Secondary finding: AI/telemetry VSCode extensions

Several VSCode extensions were identified as running background processes with potential screen context access or high background CPU usage:

- AI coding assistants with "context awareness" features (e.g. Cline/Claude Dev) — documented capability to take screenshots for context
- Microsoft AI Toolkit / Azure Copilot extensions — background telemetry and agent processes
- Speech extensions — microphone/audio context access

None of these were confirmed as the direct cause of the flicker, but they were removed as unnecessary background load. General principle: extensions that describe "screen context", "workspace awareness", or "AI agent" behavior should be audited carefully.

**Removal approach:** Uninstall via VSCode UI (`Cmd+Shift+P` > Extensions). If extension directories persist after uninstall:

```bash
rm -rf ~/.vscode/extensions/extension-name-version
```

### WindowServer as the indicator, not the cause

In all captured snapshots, `WindowServer` appeared with elevated CPU at the moment of flicker. This is expected — WindowServer is the macOS compositor and reacts to whatever triggered the display event. High WindowServer CPU is a symptom, not a cause. The cause is whatever process triggered it.

---

## Mental Model for Future Investigation

When this symptom reappears, work through this order:

1. **Did you recently grant Screen Recording permission to anything?** Check TCC database. Revoke and test.
2. **Is a browser open with a conferencing/screen-sharing web app?** Close the browser completely and test.
3. **Is a new background agent or AI extension running in an IDE?** Check `ps aux` at the moment of flicker. Disable and test.
4. **Is the flicker completely independent of software state?** (Happens with all apps closed, no new permissions granted.) Then suspect the display cable/adapter or a macOS update that changed compositor behavior.

The key diagnostic is always: **capture `ps aux` sorted by CPU at the exact moment of flicker**. The process at the top is the lead.

---

## Tools Referenced

- `sqlite3` — query TCC permissions database directly
- `tccutil` — reset (not list) TCC permissions by bundle ID
- `lsof` — list open files and network connections by process
- `ps aux` — process list with CPU/memory, sorted with `sort -rk3` on macOS
- `fs_usage` — live filesystem/syscall monitor
- `system_profiler SPDisplaysDataType` — display hardware and connection info
- Little Snitch — network monitor that shows outgoing connections per process in real time, with block/allow control; most practical tool for confirming whether a suspicious process is actually transmitting data
