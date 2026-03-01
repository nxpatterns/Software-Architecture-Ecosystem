# Mac Studio – Monatliche Sicherheitsprüfung

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=5 orderedList=true} -->

<!-- code_chunk_output -->

1. [Offene Ports analysieren](#offene-ports-analysieren)
    1. [ARDAgent / Apple Remote Desktop (Port 3283)](#ardagent--apple-remote-desktop-port-3283)
        1. [Problem](#problem)
        2. [Diagnose](#diagnose)
        3. [Lösung](#lösung)
        4. [Erkenntnis](#erkenntnis)
        5. [Verifikation nach Neustart](#verifikation-nach-neustart)
    2. [Vollständige Liste externer TCP-Ports (Ist-Zustand)](#vollständige-liste-externer-tcp-ports-ist-zustand)
    3. [Maßnahmen pro Dienst](#maßnahmen-pro-dienst)
        1. [Port 445 -- SMB File Sharing](#port-445---smb-file-sharing)
        2. [Ports 5000 & 7000 -- AirPlay Receiver](#ports-5000--7000---airplay-receiver)
        3. [Port 49185 -- rapportd (Handoff/Continuity)](#port-49185---rapportd-handoffcontinuity)
        4. [Port 59869 -- Logitech Options+ Agent](#port-59869---logitech-options-agent)
        5. [Port 9871 -- VS Code Node Inspection](#port-9871---vs-code-node-inspection)
        6. [Port 88 -- Kerberos (kdc)](#port-88---kerberos-kdc)
        7. [Port 55546 -- symptomsd](#port-55546---symptomsd)
    4. [Nützliche Diagnosebefehle](#nützliche-diagnosebefehle)
    5. [Nach dem Neustart prüfen](#nach-dem-neustart-prüfen)
2. [Remote-Dienste prüfen und deaktivieren](#remote-dienste-prüfen-und-deaktivieren)
3. [Screen Recording Permissions prüfen](#screen-recording-permissions-prüfen)
4. [Screen Time prüfen](#screen-time-prüfen)
5. [Aktive System Extensions prüfen](#aktive-system-extensions-prüfen)
6. [Unbekannte LaunchAgents / LaunchDaemons prüfen](#unbekannte-launchagents--launchdaemons-prüfen)
7. [Aktive Netzwerkverbindungen prüfen](#aktive-netzwerkverbindungen-prüfen)
8. [FileVault Status prüfen](#filevault-status-prüfen)
9. [System- und Anwendungsupdates prüfen](#system--und-anwendungsupdates-prüfen)
10. [Login Items prüfen](#login-items-prüfen)
11. [Letzte Logins prüfen](#letzte-logins-prüfen)
12. [Gatekeeper Status prüfen](#gatekeeper-status-prüfen)
13. [Firewall Status prüfen](#firewall-status-prüfen)
14. [System Integrity Protection (SIP) Status prüfen](#system-integrity-protection-sip-status-prüfen)
15. [Gatekeeper Quarantine Attribute prüfen](#gatekeeper-quarantine-attribute-prüfen)
16. [System- und Sicherheitslogs prüfen](#system--und-sicherheitslogs-prüfen)
17. [Benutzerkonten prüfen](#benutzerkonten-prüfen)
18. [System- und Anwendungsprozesse prüfen](#system--und-anwendungsprozesse-prüfen)
19. [System- und Anwendungsberechtigungen prüfen](#system--und-anwendungsberechtigungen-prüfen)
20. [Zertifikate mit Metadaten auflisten](#zertifikate-mit-metadaten-auflisten)
21. [Spotlight Index prüfen](#spotlight-index-prüfen)
    1. [Was wird aktuell ausgeschlossen?](#was-wird-aktuell-ausgeschlossen)
    2. [Welche Volumes werden indexiert?](#welche-volumes-werden-indexiert)
    3. [Teile Spotlight mit: Never Index this Volume](#teile-spotlight-mit-never-index-this-volume)

<!-- /code_chunk_output -->

## Offene Ports analysieren

### ARDAgent / Apple Remote Desktop (Port 3283)

#### Problem

`/System/Library/CoreServices/RemoteManagement/ARDAgent.app` hielt Port 3283 offen, obwohl Remote Desktop in den Systemeinstellungen deaktiviert war. "No options selected" bei `kickstart -show` bedeutet nur, dass kein Zugriff erlaubt ist -- der Agent selbst läuft trotzdem.

#### Diagnose

```bash
sudo systemsetup -getremoteappleevents   # Off
sudo systemsetup -getremotelogin         # Off
sudo /System/Library/CoreServices/RemoteManagement/ARDAgent.app/Contents/Resources/kickstart -show
# -> No options selected
```

#### Lösung

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

#### Erkenntnis

`com.apple.remotemanagementd` ist seit neueren macOS-Versionen vom ARDAgent getrennt und hat eigene Netzwerkaktivität. Beide müssen deaktiviert werden.

#### Verifikation nach Neustart

```bash
sudo lsof -i :3283
ps aux | grep -i ARDAgent | grep -v grep
```

### Vollständige Liste externer TCP-Ports (Ist-Zustand)

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

### Maßnahmen pro Dienst

#### Port 445 -- SMB File Sharing

```bash
sudo launchctl unload -w /System/Library/LaunchDaemons/com.apple.smbd.plist
```

Alternativ: System Settings → General → Sharing → File Sharing → Off

#### Ports 5000 & 7000 -- AirPlay Receiver

System Settings → General → AirDrop & Handoff → AirPlay Receiver → Off

#### Port 49185 -- rapportd (Handoff/Continuity)

System Settings → General → AirDrop & Handoff → alle Handoff-Optionen → Off

`rapportd` lässt sich nicht direkt killen, er wird ausschließlich über diese Settings gesteuert.

#### Port 59869 -- Logitech Options+ Agent

System Settings → General → Login Items → `logioptionsplus_agent` entfernen

Alternative: Logitech Options+ deinstallieren, stattdessen Open-Source `LinearMouse` ohne Background Agent nutzen.

#### Port 9871 -- VS Code Node Inspection

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

#### Port 88 -- Kerberos (kdc)

Kein Handlungsbedarf. Kerberos läuft standardmäßig auf macOS für lokale Authentifizierung. Externes Exposure ist minimal, Angriffsfläche gering.

#### Port 55546 -- symptomsd

SIP-geschützt, nicht konfigurierbar. Kein bekannter externer Service dahinter.

---

### Nützliche Diagnosebefehle

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

### Nach dem Neustart prüfen

```bash
# ARD wirklich weg?
sudo lsof -i :3283
ps aux | grep -i ARDAgent | grep -v grep

# Gesamtbild nochmal
sudo lsof -iTCP -sTCP:LISTEN | grep -v "127.0.0.1" | grep -v "localhost" | grep -v "::1"
```

## Eigene Firewall Regeln anlegen

Manchmal braucht man bestimmte Programme auf dem System, welche aber unerwünschterweise von außen erreichbar sind (sie öffnen Ports für Telemetrie, Updates etc. und schicken und empfangen dauernd Daten). In so einem Fall, kann man das Programm zwar laufen lassen, aber den Zugriff von außen blockieren.

Damit die Regel aktiv wird, brauchst du drei Dinge:

1. Die Anchor-Datei mit den Firewall-Regeln
2. Einen Eintrag in `/etc/pf.conf` der den Anchor lädt
3. `pfctl` der die Konfiguration einliest

Und damit das nach einem Neustart überlebt, noch einen LaunchDaemon.

```bash
# 1. Anchor-Datei erstellen, e.g. um Port 59869 zu blockieren
echo "block in proto tcp from any to any port 59869" | sudo tee /etc/pf.anchors/local-block

# 2. Anchor in /etc/pf.conf einbinden (ans Ende anfügen)
echo 'anchor "local-block"' | sudo tee -a /etc/pf.conf
echo 'load anchor "local-block" from "/etc/pf.anchors/local-block"' | sudo tee -a /etc/pf.conf

# 3. pf aktivieren und Regeln laden
sudo pfctl -e
sudo pfctl -f /etc/pf.conf

# 4. LaunchDaemon für Persistenz nach Neustart
sudo tee /Library/LaunchDaemons/com.local.pf-local-block.plist > /dev/null << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
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

# Verifizieren, dass die Regel aktiv ist
sudo pfctl -s rules | grep 59869  # das zeigt leider nichts, daher verwende:
sudo pfctl -a "local-block" -s rules
```

## Remote-Dienste prüfen und deaktivieren

```bash
# Remote Apple Events – muss Off sein
sudo systemsetup -getremoteappleevents
# Falls On: sudo systemsetup -setremoteappleevents off

# Remote Login (SSH) – muss Off sein
sudo systemsetup -getremotelogin
# Falls On: sudo systemsetup -setremotelogin off

# Remote Desktop (ARD) – sollte "No options selected" zeigen
sudo /System/Library/CoreServices/RemoteManagement/ARDAgent.app/Contents/Resources/kickstart -show

# ARD komplett deaktivieren
 ❯ sudo /System/Library/CoreServices/RemoteManagement/ARDAgent.app/Contents/Resources/kickstart -deactivate -stop
Starting...
Removed preference to start ARD after reboot.
Done.

# Und den LaunchDaemon direkt disablen
 ❯ sudo launchctl disable system/com.apple.ARDAgent
 ❯

 ❯ sudo launchctl bootout system /System/Library/LaunchDaemons/com.apple.RemoteDesktop.PrivilegeProxy.plist 2>/dev/null
 ❯

 ❯ sudo launchctl bootout system /System/Library/LaunchAgents/com.apple.ARDAgent.plist 2>/dev/null
 ❯

# com.apple.remotemanagementd ist der eigentliche Verdächtige -- stopp ihn auch
sudo launchctl bootout system /System/Library/LaunchDaemons/com.apple.remotemanagementd.plist 2>/dev/null
sudo launchctl disable system/com.apple.remotemanagementd

# Erneut prüfen
ls /System/Library/LaunchDaemons/ | grep -i ard
ls /System/Library/LaunchDaemons/ | grep -i remote
ls /System/Library/LaunchAgents/ | grep -i ard

# Microsoft-ds deaktivieren
# launchd -- Port 445 (microsoft-ds)
# Das ist SMB File Sharing. Deaktivieren: System Settings → General → Sharing → File Sharing aus. Oder:
sudo launchctl unload -w /System/Library/LaunchDaemons/com.apple.smbd.plist

# Nach Neustart erneut prüfen
sudo lsof -i :3283
launchctl list | grep -i ard
ps aux | grep -i ARDAgent | grep -v grep
```

## Screen Recording Permissions prüfen

```bash
# Wer hat Screen Recording Zugriff?
sudo sqlite3 /Library/Application\ Support/com.apple.TCC/TCC.db \
"SELECT client, auth_value, last_modified FROM access WHERE service='kTCCServiceScreenCapture';"

sqlite3 ~/Library/Application\ Support/com.apple.TCC/TCC.db \
"SELECT client, auth_value, last_modified FROM access WHERE service='kTCCServiceScreenCapture';"
```

Unbekannte Einträge mit `auth_value = 2` sofort in System Settings > Privacy & Security > Screen Recording entfernen.

## Screen Time prüfen

System Settings > Screen Time – falls nicht bewusst aktiviert, ausschalten.

Oder per Terminal:

```bash
defaults read com.apple.ScreenTimeAgent STAutomaticImageGenerationSetKey 2>/dev/null
# Wenn "1" → Screen Time macht automatisch Screenshots
```

## Aktive System Extensions prüfen

```bash
systemextensionsctl list
```

- Nur bekannte Extensions sollten aktiv sein
- Unbekannte Extensions sofort untersuchen.

## Unbekannte LaunchAgents / LaunchDaemons prüfen

```bash
ls /Library/LaunchDaemons/
ls /Library/LaunchAgents/
ls ~/Library/LaunchAgents/
```

Alles was nicht von Apple oder bekannten Apps stammt, untersuchen.

## Aktive Netzwerkverbindungen prüfen

```bash
# Wer verbindet sich nach außen?
sudo lsof -i -n -P | grep ESTABLISHED | grep -v "127.0.0.1\|::1"
```

## FileVault Status prüfen

```bash
sudo fdesetup status
# Muss "FileVault is On" zeigen
```

## System- und Anwendungsupdates prüfen

```bash
softwareupdate -l
```

Empfohlene Updates zeitnah installieren – offene Updates können zu Boot-Problemen führen (wie PlistFile.bundle Mismatch).

## Login Items prüfen

```bash
osascript -e 'tell application "System Events" to get the name of every login item'
```

Nur bekannte Apps sollten hier auftauchen. Unbekannte Login Items sofort entfernen.

Zusätzlich: System Settings > General > Login Items & Extensions

## Letzte Logins prüfen

```bash
last | grep -v "^wtmp" | head -20
```

Nur `<your-user-name>` und `console` sollten erscheinen. Fremde User oder unbekannte Logins sind ein Warnsignal.

## Gatekeeper Status prüfen

```bash
spctl --status
# Sollte "assessments enabled" zeigen
```

## Firewall Status prüfen

```bash
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate
# Sollte "Firewall is enabled. (State = 1)" zeigen
```

## System Integrity Protection (SIP) Status prüfen

```bash
csrutil status
# Sollte "System Integrity Protection status: enabled." zeigen
```

## Gatekeeper Quarantine Attribute prüfen

```bash
# Alle Dateien mit Quarantine-Attribut auflisten
sudo find / -xdev -type f -exec xattr -p com.apple.quarantine {} \; 2>/dev/null
```

Nur bekannte Apps sollten hier auftauchen. Unbekannte Dateien mit Quarantine-Attribut sollten untersucht werden.

## System- und Sicherheitslogs prüfen

```bash
# System- und Sicherheitslogs der letzten 24 Stunden prüfen
log show --predicate 'eventMessage contains "error" OR eventMessage contains "fail" OR eventMessage contains "denied"' --last 24h
```

Unbekannte Fehlermeldungen oder Zugriffsverweigerungen können auf Sicherheitsprobleme hinweisen.

## Benutzerkonten prüfen

```bash
# Alle Benutzerkonten auflisten
dscl . -list /Users
```

Nur bekannte Benutzerkonten sollten hier auftauchen. Unbekannte Konten können ein Sicherheitsrisiko darstellen.

## System- und Anwendungsprozesse prüfen

```bash
# Alle laufenden Prozesse auflisten
ps aux
```

Nur bekannte Prozesse sollten hier auftauchen. Unbekannte oder verdächtige Prozesse können ein Sicherheitsrisiko darstellen.

## System- und Anwendungsberechtigungen prüfen

```bash
# Alle Dateien mit erweiterten Berechtigungen auflisten
sudo find / -xdev -type f -perm +6000 2>/dev/null
```

Nur bekannte Dateien sollten hier auftauchen. Unbekannte Dateien mit erweiterten Berechtigungen können ein Sicherheitsrisiko darstellen.

## Zertifikate mit Metadaten auflisten

`cdat` = creation date,
`mdat` = modification date,
`labl` = Label (Name),
`issr` = Issuer,
`subj` = Subject.

```bash
# Alle Zertifikate mit Metadaten auflisten
security find-certificate -a -Z /Library/Keychains/System.keychain 2>/dev/null

# oder eingeschränkt auf relevante Informationen:
security find-certificate -a -Z /Library/Keychains/System.keychain 2>/dev/null | grep "SHA-1 hash\|labl\|alist\|labl\|labl\|labl"
```

## Spotlight Index prüfen

### Was wird aktuell ausgeschlossen?

```bash
sudo defaults read /.Spotlight-V100/VolumeConfiguration.plist Exclusions 2>/dev/null
```

### Welche Volumes werden indexiert?

```bash
sudo mdutil -s -a
```

### Teile Spotlight mit: Never Index this Volume

Die zuverlässigste Methode um das nach Updates zu erhalten ist eine `.metadata_never_index` Datei direkt auf dem Volume, das respektiert macOS auch nach Updates:

```bash
# Alle Volumes auflisten
ls /Volumes/

# Deaktivieren Label setzen
sudo touch /Volumes/<volume-name>/.metadata_never_index

# Bestehende Indexes löschen
sudo mdutil -E /Volumes/<volume-name>
```

Hier wird es  wegen dem Blank im Namen Fehler passieren:

```bash
sudo mdutil -E "/Volumes/Time Maschine"

# In dem Fall diskutil verwenden um die UUID zu bekommen:
diskutil list | grep -i "time\|maschine"

# 2: APFS Volume Time Maschine           2.9 TB     disk9s3

```
