# FFMPEG LinkedIn Upload Guide

Dieses Dokument sammelt alle verwendeten Befehle aus der Analyse und erklärt:

- was der jeweilige Befehl macht,
- warum er hilfreich ist,
- wann du ihn einsetzen solltest.

## 1) Dateien finden

```bash
rg --files | rg -i "ai-1984\.(mp4|mov)$"
```

### Was macht das?

Sucht im aktuellen Ordner rekursiv nach den Dateien `ai-1984.mp4` oder `ai-1984.mov`.

### Warum?

Schneller Check, ob du mit den richtigen Dateien arbeitest und keine Verwechslung vorliegt.

## 2) Technische Metadaten auslesen (MP4)

```bash
ffprobe -v error \
  -show_entries format=filename,format_name,duration,size,bit_rate:stream=index,codec_type,codec_name,profile,level,pix_fmt,width,height,r_frame_rate,avg_frame_rate,field_order,codec_tag_string,sample_rate,channels,channel_layout \
  -of json ai-1984.mp4
```

### Was macht das?
Liest Container- und Stream-Infos als JSON aus (Codec, Pixel-Format, FPS, Audio-Layout usw.).

### Warum?
Plattformen wie LinkedIn sind bei Uploads sensibel bei:

- Video-Codec (typisch H.264),
- Audio-Codec (typisch AAC),
- Pixel-Format (typisch yuv420p),
- Framerate/Timing.

Mit `ffprobe` siehst du sofort, ob etwas auffaellig ist.

## 3) Technische Metadaten auslesen (MOV)

```bash
ffprobe -v error \
  -show_entries format=filename,format_name,duration,size,bit_rate:stream=index,codec_type,codec_name,profile,level,pix_fmt,width,height,r_frame_rate,avg_frame_rate,field_order,codec_tag_string,sample_rate,channels,channel_layout \
  -of json ai-1984.mov
```

### Was macht das?
Gleiches wie oben, nur fuer die MOV-Datei.

### Warum?
So vergleichst du direkt, ob MP4 und MOV wirklich gleichartig kodiert sind oder ob Unterschiede im Timing/Container vorliegen.

## 4) Decoding-Integritaet pruefen (MP4)

```bash
ffmpeg -v error -i ai-1984.mp4 -f null -
```

## 5) Decoding-Integritaet pruefen (MOV)

```bash
ffmpeg -v error -i ai-1984.mov -f null -
```

### Was macht das?
FFmpeg dekodiert die Datei komplett und verwirft die Ausgabe (`-f null -`).

### Warum?
Wenn hierbei Fehler kommen, hat die Datei oft defekte Frames, Timestamps oder Container-Probleme.
Wenn kein Fehler kommt, ist die Datei technisch grundsaetzlich sauber lesbar.

## 6) Optional: 10-Minuten-Testexport (nur fuer Grenzfall-Tests)

```bash
ffmpeg -i ai-1984.mp4 \
  -t 00:10:00 \
  -c:v libx264 -pix_fmt yuv420p -profile:v high -level 4.0 -r 30 -g 60 \
  -c:a aac -b:a 128k -ar 48000 \
  -movflags +faststart \
  ai-1984-linkedin.mp4
```

### Was macht das?
Erstellt eine kuerzere, neu kodierte Upload-Version.

### Warum?
Nur als Test sinnvoll, um Laengenlimits auszuschliessen oder Upload-Verhalten schneller zu pruefen.

### Hinweis
Der Wunsch klar: **nicht kuerzen**. Dieser Befehl bleibt nur als Troubleshooting-Option dokumentiert.

## 7) Vollversion neu kodieren (ohne Kuerzung)

```bash
ffmpeg -y -i ai-1984.mp4 \
  -c:v libx264 -pix_fmt yuv420p -profile:v high -level 4.0 -r 30000/1001 \
  -g 60 -keyint_min 60 -sc_threshold 0 \
  -c:a aac -b:a 128k -ar 48000 -ac 2 \
  -movflags +faststart \
  ai-1984-linkedin-full.mp4
```

### Was macht das?
Erzeugt eine volle, ungeschnittene MP4 mit konservativen Parametern.

### Warum diese Parameter?

- `-c:v libx264`: weit verbreiteter, robuster Codec fuer Plattform-Uploads.
- `-pix_fmt yuv420p`: hohe Kompatibilitaet bei Social-Plattformen.
- `-profile:v high -level 4.0`: konservativer H.264-Rahmen.
- `-r 30000/1001`: 29.97 fps sauber gesetzt.
- `-g 60 -keyint_min 60 -sc_threshold 0`: regelmaessige Keyframes (ca. alle 2s).
- `-c:a aac -b:a 128k -ar 48000 -ac 2`: Standard-Audio fuer Uploads.
- `-movflags +faststart`: MP4-Metadaten nach vorne (besser fuer Web-Processing).

## 8) Vollversion neu kodieren + Metadaten/Chapters entfernen (empfohlen)

```bash
ffmpeg -y -i ai-1984.mp4 \
  -map 0:v:0 -map 0:a:0 \
  -map_metadata -1 -map_chapters -1 \
  -c:v libx264 -pix_fmt yuv420p -profile:v high -level 4.0 -r 30000/1001 \
  -g 60 -keyint_min 60 -sc_threshold 0 \
  -c:a aac -b:a 128k -ar 48000 -ac 2 \
  -movflags +faststart \
  ai-1984-linkedin-full-clean.mp4
```

### Was macht das?
Wie Schritt 7, aber zusaetzlich:

- entfernt alle Metadaten (`-map_metadata -1`),
- entfernt Kapitel (`-map_chapters -1`),
- mappt explizit nur einen Video- und einen Audio-Stream.

### Warum oft die beste Upload-Datei?
Einige Plattform-Parser reagieren empfindlich auf:

- ungewoehnliche Metadaten,
- Kapitel,
- zusaetzliche/unerwartete Streams.

Diese Variante minimiert solche Stolpersteine.

## 9) Ergebnisdatei final pruefen

```bash
ffprobe -v error \
  -show_entries format=filename,duration,size,bit_rate:stream=index,codec_type,codec_name,profile,level,pix_fmt,width,height,r_frame_rate,avg_frame_rate,sample_rate,channels \
  -of json ai-1984-linkedin-full-clean.mp4
```

### Was macht das?
Bestaetigt, dass die finale Datei wirklich die erwarteten, kompatiblen Eigenschaften hat.

## Kurzfazit

Wenn LinkedIn bei der Originaldatei meckert, ist die robusteste Reihenfolge:

1. Integritaet testen (Schritt 4/5).
2. Vollversion konservativ neu kodieren (Schritt 7).
3. Wenn noetig: Clean-Version ohne Metadaten/Chapters verwenden (Schritt 8).
4. Final mit `ffprobe` bestaetigen (Schritt 9).

Aktuell beste Kandidatin fuer den Upload:

- `ai-1984-linkedin-full-clean.mp4`

## Zusatz: Ist YouTube-Download "infiziert"?

Kurz: praktisch nein.
Ein Re-Download von YouTube aendert oft Kodierung/Metadaten, aber das ist normalerweise kein Malware-Problem, sondern ein Transcoding-/Container-Thema.
