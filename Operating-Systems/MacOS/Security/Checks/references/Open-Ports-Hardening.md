# macOS Open Ports & Remote Management Hardening

**Session-Datum:** März 2026  
**macOS:** Sequoia (aktuell)

---

## Ziel

Alle unnötig nach außen exponierten TCP-Ports identifizieren und schließen.

---

## ARDAgent / Apple Remote Desktop (Port 3283)

### Problem

`/System/Library/CoreServices/RemoteManagement/ARDAgent.app` hielt Port 3283 offen, obwohl Remote Desktop in den Systemeinstellungen deaktiviert war. "No options selected" bei `kickstart -show` bedeutet nur, dass kein Zugriff erlaubt ist -- der Agent selbst läuft trotzdem.

### Diagnose

```bash
sudo systemsetup -getremoteappleevents   # Off
sudo systemsetup -getremotelogin         # Off
sudo /System/Library/CoreServices/RemoteManagement/ARDAgent.app/Contents/Resources/kickstart -show
# -> No options selected
```

### Lösung

```bash
# ARDAgent vollständig deaktivieren
sudo /System/Library/CoreServices/RemoteManagement/ARDAgent.app/Contents/Resources/kickstart -deactivate -stop

# LaunchDaemons disablen
sudo launchctl disable system/com.apple.ARDAgent
sudo launchctl bootout system /System/Library/LaunchDaemons/com.apple.RemoteDesktop.PrivilegeProxy.plist
sudo launchctl bootout system /System/Library/LaunchAgents/com.apple.ARDAgent.plist
sudo launchctl bootout system /System/Library/LaunchDaemons/com.apple.remotemanagementd.plist
sudo launchctl disable system/com.apple.remotemanagementd
```

### Erkenntnis

`com.apple.remotemanagementd` ist seit neueren macOS-Versionen vom ARDAgent getrennt und hat eigene Netzwerkaktivität. Beide müssen deaktiviert werden.

### Verifikation nach Neustart

```bash
sudo lsof -i :3283
ps aux | grep -i ARDAgent | grep -v grep
```

---

## Vollständige Liste externer TCP-Ports (Ist-Zustand)

Ermittelt via:

```bash
sudo lsof -iTCP -sTCP:LISTEN | grep -v "127.0.0.1" | grep -v "localhost" | grep -v "::1"
```

| Port | Prozess | Ursache | Maßnahme |
|------|---------|---------|----------|
| 445 | `launchd` (SMB) | File Sharing aktiv | Deaktivieren (s.u.) |
| 88 | `kdc` | Kerberos (macOS Standard) | In Ruhe lassen |
| 55546 | `symptomsd` | Network Diagnostics Daemon | SIP-geschützt, nicht konfigurierbar |
| 5000, 7000 | `ControlCenter` | AirPlay Receiver | System Settings deaktivieren |
| 49185 | `rapportd` | Handoff / Continuity | System Settings deaktivieren |
| 59869 | `logioptionsplus_agent` | Logitech Options+ Agent | Login Items entfernen |
| 9871 | `Code Helper (Plugin)` | VS Code Network Inspection | settings.json anpassen |
| 3283 | `ARDAgent` | Apple Remote Desktop | s.o. |

---

## Maßnahmen pro Dienst

### Port 445 -- SMB File Sharing

```bash
sudo launchctl unload -w /System/Library/LaunchDaemons/com.apple.smbd.plist
```

Alternativ: System Settings → General → Sharing → File Sharing → Off

### Ports 5000 & 7000 -- AirPlay Receiver

System Settings → General → AirDrop & Handoff → AirPlay Receiver → Off

### Port 49185 -- rapportd (Handoff/Continuity)

System Settings → General → AirDrop & Handoff → alle Handoff-Optionen → Off

`rapportd` lässt sich nicht direkt killen, er wird ausschließlich über diese Settings gesteuert.

### Port 59869 -- Logitech Options+ Agent

System Settings → General → Login Items → `logioptionsplus_agent` entfernen

Alternative: Logitech Options+ deinstallieren, stattdessen Open-Source `LinearMouse` ohne Background Agent nutzen.

### Port 9871 -- VS Code Node Inspection

**Ursache:** PID 7812 ist der VS Code Node.js Service Host mit `--experimental-network-inspection` Flag. Dieser bindet extern auf einem zufälligen Port (hier 9871). Das Flag wurde mit VS Code ~1.87 eingeführt und hat bekannte Binding-Probleme.

**Erkennbar durch:**

```bash
sudo lsof -i :9871
# -> Code\x20H ... IPv6 *:9871 (LISTEN)
```

**Fix in `settings.json`:**

```json
{
  "debug.javascript.usePreview": false
}
```

VS Code danach neu starten und verifizieren:

```bash
sudo lsof -iTCP -sTCP:LISTEN | grep "Code"
```

### Port 88 -- Kerberos (kdc)

Kein Handlungsbedarf. Kerberos läuft standardmäßig auf macOS für lokale Authentifizierung. Externes Exposure ist minimal, Angriffsfläche gering.

### Port 55546 -- symptomsd

SIP-geschützt, nicht konfigurierbar. Kein bekannter externer Service dahinter.

---

## Nützliche Diagnosebefehle

```bash
# Alle extern lauschenden TCP-Ports
sudo lsof -iTCP -sTCP:LISTEN | grep -v "127.0.0.1" | grep -v "localhost" | grep -v "::1"

# Spezifischen Port prüfen
sudo lsof -i :PORT

# LaunchDaemon Status
sudo launchctl list | grep -i KEYWORD

# Prozess zu PID
ps aux | grep PID
```

---

## Nach dem Neustart prüfen

```bash
# ARD wirklich weg?
sudo lsof -i :3283
ps aux | grep -i ARDAgent | grep -v grep

# Gesamtbild nochmal
sudo lsof -iTCP -sTCP:LISTEN | grep -v "127.0.0.1" | grep -v "localhost" | grep -v "::1"
```
