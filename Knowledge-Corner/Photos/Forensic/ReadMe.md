# Photos Analysieren

## Struktur / Marker visualisieren

| Tool | URL | Was es zeigt | Hinweis |
|------|-----|--------------|---------|
| **JPEG Audit – Structure Analyzer** | [jpegaudit.com/jpeg-structure-analyzer](https://jpegaudit.com/jpeg-structure-analyzer) | Marker-Karte (SOI, APPn, DQT, DHT, SOF, SOS, EOI), Offsets, Längen, Hex pro Segment | Sehr nah an dem, was wir offline geparst haben. **Limit oft ~20 MB** — euer Sample war ~21 MB, ggf. knapp. |
| **Scanly JPEG Structure** | [scanly.co/jpeg-structure](https://scanly.co/jpeg-structure) | Marker-Tabelle, DQT, Encoder-Fingerprint | Läuft **im Browser** (kein Upload). |
| **Aback File Chunk Analyzer** | [abacktools.com/…/file-chunk-analyzer](https://abacktools.com/tools/file/forensics/file-chunk-analyzer) | JPEG-Marker segmentweise, Offsets/Größen | Browser-lokal. |
| **Aback File Structure Validator** | [abacktools.com/…/file-structure-validator](https://abacktools.com/tools/file/forensics/file-structure-validator) | Pass/Fail, Integritäts-Score, Marker-Checks | Gut für „ist die Datei kaputt?“ |
| **Aback File Trailer Analyzer** | [abacktools.com/…/file-trailer-analyzer](https://abacktools.com/tools/file/forensics/file-trailer-analyzer) | Footer / **EOI `FF D9`**, Truncation | Alleine reicht das **nicht** für euren Fall: EOI kann **mitten** in der Datei sitzen, Trailer nur die letzten 64 Bytes prüft. |
| **ICE Forensic** | [ice-forensic.com/en](https://www.ice-forensic.com/en) | Hex + EXIF, große Dateien | Allgemeiner Hex-Viewer, weniger „JPEG-Map“. |
| **Toolbox365 Hex Viewer** | [toolbox365.net/tools/hex-viewer](https://www.toolbox365.net/tools/hex-viewer/) | Hex + Strukturbaum | Browser-lokal. |

## Repair / Diagnose (weniger „Map“, mehr „fix“)

| Tool | URL | Relevanz |
|------|-----|----------|
| **Tembrica Photo Repair** | [tembrica.com/en/photo-repair](https://tembrica.com/en/photo-repair) | Kaputte APP/COM, Marker, Forensic Inspector |
| **PhotoRepair** | [photo-repair.magicleopard.com](https://photo-repair.magicleopard.com/) | Header/Marker lokal im Browser |

## Was online oft **nicht** so klar zeigt

Der libvips-Fehler
`Corrupt JPEG data: 128 extraneous bytes before marker 0xe2`
ist ein **Decoder-Warnungspfad**, kein Standard-Web-Label. Online-Tools zeigen eher:

- lange Kette **APP2**
- **EOI-Offset ≪ Dateigröße** (Trailing after EOI)
- ungewöhnliche Segment-Payloads

Die harte sharp-Failure sieht man weiterhin am besten mit dem CLI aus der Session-Doku (`failOn` default vs. `none`).

## Desktop (stärker als die meisten Web-UIs)

- **[JPEGsnoop](https://github.com/ImpulseAdventure/JPEGsnoop)** (Windows) — klassischer tiefer JPEG-Dump inkl. Corruption
- **Didier Stevens `jpegdump.py`** — Marker-Liste + explizit *trailing after EOI*
- Browser: **[JPEG Visual Repair Tool](https://albmac.github.io/JPEGVisualRepairTool/)** — MCU-Level, eher Pixel-Corruption als APP2-Müll

## Praktische Leitfäden

1. Wenn ≤20 MB oder verkleinert: **JPEG Audit Structure** → APP2-Flut + Hex.
2. Parallel: **Scanly** oder **Chunk Analyzer** (lokal im Browser, privacy-freundlicher).
3. Trailing nach EOI: CLI/Python aus `session-2026-09-29-photo-tour-jpeg-sanitize.md` oder `jpegdump.py` — Web-Trailer-Tools allein sind hier oft zu flach.

**Privacy:** Bei echten Kunden-/Tour-Fotos eher browser-lokale Tools (Scanly, Aback) oder offline CLI; JPEG Audit speichert laut Anbieter nicht dauerhaft, uploadet aber zur Analyse.
