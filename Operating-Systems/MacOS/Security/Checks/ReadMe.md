# Mac Studio – Monatliche Sicherheitsprüfung

## 1. Remote-Dienste prüfen und deaktivieren

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

# Nach Neustart erneut prüfen
sudo lsof -i :3283
launchctl list | grep -i ard
ps aux | grep -i ARDAgent | grep -v grep
```

## 2. Screen Recording Permissions prüfen

```bash
# Wer hat Screen Recording Zugriff?
sudo sqlite3 /Library/Application\ Support/com.apple.TCC/TCC.db \
"SELECT client, auth_value, last_modified FROM access WHERE service='kTCCServiceScreenCapture';"

sqlite3 ~/Library/Application\ Support/com.apple.TCC/TCC.db \
"SELECT client, auth_value, last_modified FROM access WHERE service='kTCCServiceScreenCapture';"
```

Unbekannte Einträge mit `auth_value = 2` sofort in System Settings > Privacy & Security > Screen Recording entfernen.

## 3. Screen Time prüfen

System Settings > Screen Time – falls nicht bewusst aktiviert, ausschalten.

Oder per Terminal:

```bash
defaults read com.apple.ScreenTimeAgent STAutomaticImageGenerationSetKey 2>/dev/null
# Wenn "1" → Screen Time macht automatisch Screenshots
```

## 4. Aktive System Extensions prüfen

```bash
systemextensionsctl list
```

- Nur bekannte Extensions sollten aktiv sein
- Unbekannte Extensions sofort untersuchen.

## 5. Unbekannte LaunchAgents / LaunchDaemons prüfen

```bash
ls /Library/LaunchDaemons/
ls /Library/LaunchAgents/
ls ~/Library/LaunchAgents/
```

Alles was nicht von Apple oder bekannten Apps stammt, untersuchen.

## 6. Aktive Netzwerkverbindungen prüfen

```bash
# Wer verbindet sich nach außen?
sudo lsof -i -n -P | grep ESTABLISHED | grep -v "127.0.0.1\|::1"
```

## 7. FileVault Status prüfen

```bash
sudo fdesetup status
# Muss "FileVault is On" zeigen
```

## 8. System- und Anwendungsupdates prüfen

```bash
softwareupdate -l
```

Empfohlene Updates zeitnah installieren – offene Updates können zu Boot-Problemen führen (wie PlistFile.bundle Mismatch).

## 9. Login Items prüfen

```bash
osascript -e 'tell application "System Events" to get the name of every login item'
```

Nur bekannte Apps sollten hier auftauchen. Unbekannte Login Items sofort entfernen.

Zusätzlich: System Settings > General > Login Items & Extensions

## 10. Letzte Logins prüfen

```bash
last | grep -v "^wtmp" | head -20
```

Nur `<your-user-name>` und `console` sollten erscheinen. Fremde User oder unbekannte Logins sind ein Warnsignal.

## 11. Gatekeeper Status prüfen

```bash
spctl --status
# Sollte "assessments enabled" zeigen
```

## 12. Firewall Status prüfen

```bash
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate
# Sollte "Firewall is enabled. (State = 1)" zeigen
```

## 13. System Integrity Protection (SIP) Status prüfen

```bash
csrutil status
# Sollte "System Integrity Protection status: enabled." zeigen
```

## 14. Gatekeeper Quarantine Attribute prüfen

```bash
# Alle Dateien mit Quarantine-Attribut auflisten
sudo find / -xdev -type f -exec xattr -p com.apple.quarantine {} \; 2>/dev/null
```

Nur bekannte Apps sollten hier auftauchen. Unbekannte Dateien mit Quarantine-Attribut sollten untersucht werden.

## 15. System- und Sicherheitslogs prüfen

```bash
# System- und Sicherheitslogs der letzten 24 Stunden prüfen
log show --predicate 'eventMessage contains "error" OR eventMessage contains "fail" OR eventMessage contains "denied"' --last 24h
```

Unbekannte Fehlermeldungen oder Zugriffsverweigerungen können auf Sicherheitsprobleme hinweisen.

## 16. Benutzerkonten prüfen

```bash
# Alle Benutzerkonten auflisten
dscl . -list /Users
```

Nur bekannte Benutzerkonten sollten hier auftauchen. Unbekannte Konten können ein Sicherheitsrisiko darstellen.

## 17. System- und Anwendungsprozesse prüfen

```bash
# Alle laufenden Prozesse auflisten
ps aux
```

Nur bekannte Prozesse sollten hier auftauchen. Unbekannte oder verdächtige Prozesse können ein Sicherheitsrisiko darstellen.

## 18. System- und Anwendungsberechtigungen prüfen

```bash
# Alle Dateien mit erweiterten Berechtigungen auflisten
sudo find / -xdev -type f -perm +6000 2>/dev/null
```

Nur bekannte Dateien sollten hier auftauchen. Unbekannte Dateien mit erweiterten Berechtigungen können ein Sicherheitsrisiko darstellen.

## 19. Zertifikate mit Metadaten auflisten

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
