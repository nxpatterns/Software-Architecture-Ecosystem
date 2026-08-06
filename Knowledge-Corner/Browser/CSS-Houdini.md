## CSS Houdini

**CSS Houdini** — kein einzelne API, sondern ein Sammelbegriff für eine Gruppe von Low-Level-Browser-APIs, die Entwicklern direkten Zugriff auf interne Teile der CSS-Rendering-Engine geben ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Houdini_APIs)).

## Die Grundidee

Normalerweise ist CSS eine Blackbox: Browser-Hersteller entscheiden, wie Layout, Malen und benutzerdefinierte Eigenschaften funktionieren, und Entwickler warten Jahre auf neue Features. Houdini öffnet diese Blackbox stückweise, damit man selbst in den Rendering-Prozess eingreifen kann, statt auf native Browser-Updates zu warten ([web.dev](https://web.dev/articles/houdini-how)).

## Die wichtigsten Teil-APIs

- **CSS Paint API (Paint Worklet)** — man schreibt eigenen JavaScript-Code, der wie eine Canvas-Zeichenfunktion funktioniert, aber als CSS-Hintergrund/Border eingesetzt wird (`background: paint(meinMuster)`). Das ist aktuell die am besten unterstützte Houdini-API ([web.dev](https://web.dev/articles/houdini-how)).
- **CSS Properties and Values API** — macht CSS Custom Properties (Variablen) typsicher: man kann festlegen, dass eine Variable z. B. eine Farbe oder ein Winkel ist, statt einer bedeutungslosen Zeichenkette. Das erlaubt dann auch echte Animationen zwischen Werten, was mit normalen CSS-Variablen nicht geht ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/CSS_Properties_and_Values_API), [web.dev](https://web.dev/articles/css-props-and-vals)).
- **Typed OM (Typed Object Model)** — liefert CSS-Werte als echte JS-Objekte mit Einheiten statt als reine Strings, performanter für JS-CSS-Interaktion.
- **Layout API / Animation Worklet** — weitere, aber deutlich weniger ausgereifte Teile, mit denen man sogar eigene Layout-Algorithmen oder performante Scroll-Animationen bauen könnte.

## Der Cross-Browser-Haken

Chromium-Browser sind mit Abstand am weitesten, während Firefox und Safari nur einen Bruchteil der Houdini-APIs umgesetzt haben — die Paint API und die Properties-and-Values-API sind die einzigen mit brauchbarer Reichweite, der Rest bleibt praktisch Chrome-exklusiv ([iamvdo.me](https://iamvdo.me/en/blog/css-houdini), [testmuai.com](https://www.testmuai.com/blog/css-houdini/)). Es gibt sogar eine eigene Tracking-Seite dafür, ishoudinireadyyet.com, was allein schon zeigt, wie fragmentiert das Feld ist ([iamvdo.me](https://iamvdo.me/en/blog/css-houdini)). Für produktiven Einsatz existiert ein Polyfill, der die Paint API in allen modernen Browsern via `-webkit-canvas()`/`-moz-element()` nachbildet ([GitHub](https://github.com/GoogleChromeLabs/css-paint-polyfill)).
