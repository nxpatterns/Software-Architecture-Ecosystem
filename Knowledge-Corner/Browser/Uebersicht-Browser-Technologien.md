# Browser-Technologien: Überblick

Hier eine Übersicht, absichtlich sortiert vom Obskursten zum Bekannteren — also das, wovon vermutlich die wenigsten Entwickler überhaupt wissen, dass es existiert, kommt zuerst.

## Sehr wenig bekannt — Hardware- & System-Zugriff direkt aus dem Browser

**Web Serial / WebUSB / WebHID** — JavaScript spricht direkt mit seriellen Geräten, USB-Peripherie oder HID-Geräten (3D-Drucker, Mikrocontroller, Kartenleser). Reines Chromium-Feature; Safari unterstützt es gar nicht, Firefox hat es erst 2026 in Nightly nachgezogen, nach 13 Jahren Ablehnung ([The Register](https://www.theregister.com/software/2026/04/14/firefox-nightly-adds-web-serial-after-years-of-saying-no/5225521)).

**Web Bluetooth** — Geräte per Bluetooth Low Energy direkt aus dem Tab verbinden (Fitness-Tracker, IoT). Nur Chromium; Firefox und Safari lehnen es komplett ab ([testmuai.com](https://www.testmuai.com/learning-hub/web-bluetooth-browser-support/)).

**Compute Pressure API** — die Seite kann erfahren, wie stark CPU/GPU des Geräts gerade ausgelastet sind, um die eigene Arbeitslast anzupassen. Erst seit Chrome 125, praktisch niemand kennt sie ([Chrome for Developers](https://developer.chrome.com/docs/web-platform/compute-pressure)).

**Idle Detection API** — erkennt, ob der Nutzer gerade am Gerät aktiv ist oder der Bildschirm gesperrt ist. Nur in älteren/aktuellen Chromium-Versionen, mit Lücken selbst dort ([caniuse](https://caniuse.com/mdn-api_idledetector_start)).

## Wenig bekannt — Multi-Window & Cross-Device

**Document Picture-in-Picture** — ein ganzes, weiterhin interaktives HTML-Fenster als Always-on-Top-PiP-Fenster (nicht nur Video). Nur Chrome ab v116 ([premieroctet.com](https://www.premieroctet.com/blog/en/document-picture-in-picture-pip-for-any-html-content)).

**Window Management API (`getScreenDetails`)** — Web-Apps, die mehrere physische Monitore erkennen und gezielt bespielen (z. B. Präsentationsmodus auf Zweitbildschirm). Nur Chromium ab v100 ([GitHub W3C](https://github.com/w3c/window-management/blob/main/HOWTO.md)).

**Storage Access API** — erlaubt eingebetteten Third-Party-iFrames, unter strengen Cookie-Regeln (Safari ITP) gezielt um Speicherzugriff zu bitten. Existiert in allen großen Browsern, aber mit spürbar unterschiedlichem Verhalten zwischen WebKit und Chromium ([WebKit Blog](https://webkit.org/blog/11545/updates-to-the-storage-access-api/), [Privacy Sandbox](https://privacysandbox.google.com/cookies/storage-access-api)).

## Wenig bekannt — Sensorik, Eingabe, Haptik

**Contact Picker API** — Nutzer wählt gezielt einzelne Kontakte aus dem Adressbuch, ohne der Seite vollen Zugriff zu geben. Nur Android Chrome, kein iOS, kein Desktop ([Chrome for Developers](https://developer.chrome.com/docs/capabilities/web-apis/contact-picker)).

**Web NFC** — NFC-Tags direkt im Browser lesen/schreiben. Nur Chrome auf Android; iOS, Desktop und Firefox komplett außen vor ([webnfc.org](https://webnfc.org/documentation/browser-support)).

**Vibration API** — haptisches Feedback per Code auslösen. Von Safari (macOS und iOS) nie unterstützt, seit Firefox 129 sogar dort entfernt ([caniuse](https://caniuse.com/vibration)).

**Local Font Access API** — liest die lokal installierten Schriftarten des Systems aus (Design-Tools). Nur Chromium, massive Privacy-Implikationen ([Chrome for Developers](https://developer.chrome.com/docs/capabilities/web-apis/local-fonts)).

## Teilweise bekannt — aber Details überraschen viele

**Badging API** — kleine Zahlen-Badges auf dem App-Icon einer installierten PWA (wie ungelesene Mails). Nur für installierte PWAs, browserabhängig ([Chrome for Developers](https://developer.chrome.com/docs/capabilities/web-apis/badging-api)).

**View Transitions API** — sanfte, native Animationen zwischen Seitenzuständen oder sogar zwischen echten Seitennavigationen. Erst seit kurzem in Safari 18+ und Firefox 144+ angekommen — lange ein reines Chrome-Feature ([testmuai.com](https://www.testmuai.com/learning-hub/view-transitions-api-browser-support/)).

**Popover API / natives `<dialog>`** — deklarative Popovers ohne eigenes JS-Positionierungs-Gefrickel. Seit Anfang 2025 browserübergreifend "Baseline" ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API)).

**Web Speech API (Spracherkennung/-synthese)** — Mikrofon zu Text und zurück, direkt im Browser. Support ist überraschend gut (auch Safari ab 14.1/14.5), aber die Umsetzung unterscheidet sich stark zwischen Cloud-basierter (Chrome) und on-device (Safari) Verarbeitung ([testmuai.com](https://www.testmuai.com/learning-hub/speech-recognition-api-browser-support/), [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)).

**WebXR** — AR/VR-Erlebnisse direkt im Browser, für Meta Quest & Co. Safari hat lange gar nicht mitgezogen ([testmuai.com](https://www.testmuai.com/learning-hub/webxr-compatible-browsers/)).

## Bekannter, aber noch nicht als eigener Use Case behandelt

- **Drag & Drop zwischen Browser und Betriebssystem** (Dateien raus- und reinziehen)
- **Payment Request API** (native Zahl-UI statt eigenes Formular)
- **Gamepad API** (Controller-Steuerung im Browser)
- **Web MIDI API** (Musikhardware ansteuern)
- **Presentation API / Remote Playback API** (Video auf Chromecast/AirPlay werfen)
- **Background Fetch / Periodic Background Sync** (große Downloads/Sync auch nach Tab-Schließen fortsetzen)
- **Trusted Types** (XSS-Härtung als Browser-Feature, kein Nice-to-have mehr)
