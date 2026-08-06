# WebApp Use-Case-Matrix: Browser-APIs & Cross-Browser-Fallstricke

Ein wachsendes Nachschlagewerk. Jeder Abschnitt behandelt ein Themengebiet, gruppiert nach Use-Case,
mit benötigten Web-APIs/Technologien und bekannten Cross-Browser-Problemen (mit Quellen).

---

## Thema 1: Canvas-relevante Use Cases

### 1. Bild-Upload + Analyse (z. B. Farbextraktion, Pixel-Inspektion)

**APIs/Technologien:** File API (`<input type="file">`), `FileReader` bzw. `createImageBitmap()`,
`<canvas>` 2D-Context, `ctx.drawImage()`, `ctx.getImageData()` zum Pixel-Auslesen. Für die
Markierung auf dem Bild: eigener Brush-Layer via Pointer Events oder nativ die `EyeDropper`-API.

**Fallstricke:**

- Die `EyeDropper`-API existiert nur in Chromium-Browsern (Chrome/Edge/Opera ab v95). Safari und
  Firefox unterstützen sie bis heute (2026) nicht — hier bleibt nur der Canvas-Fallback mit
  eigenem Fadenkreuz-Cursor ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/EyeDropper_API), [caniuse](https://caniuse.com/mdn-api_eyedropper)).
- `getImageData()` wirft einen `SecurityError` ("tainted canvas"), sobald ein Bild von einer
  fremden Origin ohne passende CORS-Header geladen wurde — betrifft alle Browser gleich, ist aber
  die klassische Ursache für "läuft lokal, bricht in Produktion" ([MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/How_to/CORS_enabled_image), [corsfix](https://corsfix.com/blog/tainted-canvas)).
- iOS Safari limitiert die Canvas-Fläche auf ca. 16.777.216 Pixel (z. B. 4096×4096). Fotos direkt
  von modernen Handykameras (12+ MP) müssen vor dem Zeichnen herunterskaliert werden, sonst bricht
  das Canvas lautlos ab ([lionpuro.com](https://lionpuro.com/posts/canvas-is-finally-usable-on-safari), [pqina.nl](https://pqina.nl/blog/canvas-area-exceeds-the-maximum-limit/)).
- Safari im privaten Modus (ab WebKit 17) und Browser wie Brave fügen dem Canvas-Output bewusst
  Rauschen hinzu (Anti-Fingerprinting) — bei pixelgenauer Farbanalyse können RGB-Werte dadurch
  leicht abweichen ([Brave Community](https://community.brave.app/t/improve-fingerprinting-protections-in-brave-ios-to-better-match-safari/641499)).

### 2. Freihand-Zeichnen / Signatur-Pad / Whiteboard

**APIs/Technologien:** Canvas 2D Context, Pointer Events (`pointerdown`/`move`/`up`) statt
getrennter Mouse-/Touch-Events, CSS `touch-action: none` gegen Scroll-Konflikte.

**Fallstricke:**

- `PointerEvent.pressure` liefert in Safari teils unzuverlässige oder konstante Werte, während
  Chrome/Firefox echte Druckwerte durchreichen — druckabhängige Strichstärke ist damit nicht
  garantiert identisch über Browser hinweg ([Stack Overflow](https://stackoverflow.com/questions/76644456/pointer-pressure-is-0-in-safari-in-pointer-events-despite-button-being-pressed)).
- Ohne `touch-action: none` scrollt/zoomt die Seite auf Mobile während des Zeichnens mit; das
  Zusammenspiel mit Pinch-Zoom unterscheidet sich zwischen iOS und Android spürbar.

### 3. Bildbearbeitung im Browser (Zuschneiden, Filter, Kompression, Wasserzeichen)

**APIs/Technologien:** Canvas 2D + `ctx.filter` (CSS-Filter-Syntax wie `blur()`, `grayscale()`),
`OffscreenCanvas` für Berechnung im Web Worker, `canvas.toBlob()`/`toDataURL()` für den Export.

**Fallstricke:**

- `ctx.filter` wird von Safari (Desktop und iOS) nicht unterstützt — Effekte müssen dort manuell
  per Pixel-Manipulation oder Polyfill nachgebaut werden ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/filter), [Stack Overflow](https://stackoverflow.com/questions/74334371/canvasrenderingcontext2d-filter-not-working-on-safari)).
- `toBlob()`/`toDataURL()` mit `image/webp` liefert auf iOS (alle Browser dort laufen auf WebKit)
  oft stillschweigend PNG statt WebP zurück, ohne Fehler zu werfen ([Stack Overflow](https://stackoverflow.com/questions/79186306/canvas-todataurl-with-webp-not-working-on-ipad-chrome-and-safari)).
- `OffscreenCanvas` ist erst seit Safari 16.4 verfügbar; ältere iOS-Geräte im Feld brauchen einen
  Fallback auf synchrones Canvas im Hauptthread ([caniuse](https://caniuse.com/offscreencanvas), [testmuai.com](https://www.testmuai.com/learning-hub/offscreencanvas-browser-support/)).

### 4. Canvas-Export (Speichern, Teilen, in Zwischenablage kopieren)

**APIs/Technologien:** `canvas.toBlob()`, `<a download>`, Clipboard API
(`navigator.clipboard.write()` mit `ClipboardItem`), Web Share API für mobile Share-Sheets.

**Fallstricke:**

- Bild-Support in der Clipboard API ist neuer als reiner Text-Support und in älteren
  Safari-/Firefox-Versionen bei den akzeptierten MIME-Typen eingeschränkt (Detailtiefe gehört zum
  separaten Zwischenablage-Thema, das wir noch vertiefen).
- `navigator.share()` mit Dateien ist auf Desktop-Chrome/Firefox nicht oder nur experimentell
  verfügbar, während mobile Browser es gut unterstützen — hier kehrt sich das sonst übliche Muster
  um: das Handy kann etwas, das der Desktop nicht kann.

### 5. Standbild aus Video/Webcam erfassen

**APIs/Technologien:** `<video>` + `getUserMedia()` (Live-Kamera) oder normales Video-Element,
`ctx.drawImage(videoElement, ...)` um einen Frame auf Canvas zu zeichnen.

**Fallstricke:**

- iOS Safari verlangt das `playsinline`-Attribut und eine echte Nutzerinteraktion, bevor
  Video-/Kamera-Frames zuverlässig gezeichnet werden können.
- Ohne Prüfung von `video.readyState` liefert `drawImage` auf manchen Browsern verzögerte oder
  leere Frames, bis das Video tatsächlich abspielbereit ist.

### 6. QR-/Barcode-Generierung und -Scanning

**APIs/Technologien:** Canvas-Rendering für die Generierung (meist per Library), native
`BarcodeDetector`-API fürs Scannen aus Video-/Bildstreams.

**Fallstricke:**

- `BarcodeDetector` ist praktisch nur in Chromium verfügbar; Firefox und Safari unterstützen es
  nicht, weshalb produktive Apps meist auf eine JS/WASM-Library statt der nativen API ausweichen
  müssen ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/BarcodeDetector), [caniuse](https://caniuse.com/mdn-api_barcodedetector)).

### 7. Rechenintensive Canvas-Operationen ohne UI-Blocking

**APIs/Technologien:** `OffscreenCanvas`, `canvas.transferControlToOffscreen()`, Web Workers.

**Fallstricke:**

- Volle plattformübergreifende Unterstützung (inkl. 2D-Context im Worker) existiert erst seit
  Safari 16.4/17. Auf älteren iOS-Geräten im Feld muss der Code synchron im Hauptthread laufen,
  was auf Low-End-Geräten zu spürbaren Rucklern führt ([caniuse](https://caniuse.com/offscreencanvas)).

### 8. Einfache 2D-Spiele im Canvas (Analog zum Chrome-Dino-Spiel)

**APIs/Technologien:** Canvas 2D + `requestAnimationFrame()` für die Spiel-Loop, Keyboard Events
(`keydown`/`keyup`) für Desktop-Steuerung, Touch/Pointer Events auf Mobile, Web Audio API oder
`<audio>` für Soundeffekte, optional Gamepad API für Controller.

**Fallstricke:**

- Die Web Audio API verlangt in praktisch allen Browsern eine vorherige Nutzergeste (Klick/Tap) —
  reines Autoplay von Sound scheitert besonders konsequent auf iOS Safari.
- Ein Spiel, das rein auf `keydown` baut, ist auf reinen Touch-Geräten unspielbar, sofern keine
  Touch-Fallback-Buttons existieren.
- `requestAnimationFrame` wird gedrosselt/pausiert, sobald der Tab im Hintergrund ist — die
  genauen Drosselungs-Intervalle unterscheiden sich zwischen Chrome, Firefox und Safari.

### 9. Barrierefreiheit von Canvas-Inhalten

**APIs/Technologien:** ARIA-Fallback-Inhalte innerhalb des `<canvas>`-Tags, `role="img"` +
`aria-label`, alternativ eine parallele versteckte DOM-Struktur für Screenreader.

**Fallstricke:**

- Kein Browser liest Canvas-Pixel für Screenreader aus — das ist Architektur, kein Bug.
  Unterschiede bestehen nur darin, wie zuverlässig VoiceOver (Safari) gegenüber NVDA/JAWS
  (Chrome/Firefox/Edge) den Fallback-Inhalt respektiert, wenn er nicht exakt spezifikationskonform
  eingebaut ist.

### 10. Canvas-Fingerprinting & Privacy-Rauschen (Querschnittsthema)

**APIs/Technologien:** Dieselben Lese-APIs wie oben (`toDataURL`, `getImageData`) werden von
Trackern zur Geräte-Erkennung genutzt.

**Fallstricke:**

- Safari (Private Mode, ab WebKit 17) und Brave fügen absichtlich Rauschen in Canvas-, WebGL- und
  WebAudio-Ausgaben ein, um Fingerprinting zu erschweren — das kann bei jedem der obigen
  Use Cases (Farbextraktion, Bildvergleich, Export) zu minimal unterschiedlichen Pixelwerten
  zwischen Aufrufen führen ([Brave Community](https://community.brave.app/t/improve-fingerprinting-protections-in-brave-ios-to-better-match-safari/641499)).

---

*Weitere Themen folgen (z. B. Zwischenablage, Formular-Validierung, File-APIs, Audio/Video,
Storage, Push/Notifications).*
