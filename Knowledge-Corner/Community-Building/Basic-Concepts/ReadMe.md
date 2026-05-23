# 7D Community Building — Deine Checkliste

**Für:** Dich, den Auftraggeber.
**Von:** Deinem Entwickler.
**Zeitrahmen:** Etwa ein Jahr von heute bis zum Launch.

---

## Wie du dieses Dokument benutzt

Lies das Dokument nicht in einem Rutsch durch. Es ist lang, und das ist Absicht.

Arbeite es **Phase für Phase** ab. Jede Phase baut auf der vorherigen auf. Wenn du Phase 1 überspringst und gleich bei Phase 3 anfängst, kostet uns das später Wochen.

Jeder Abschnitt hat zwei Kästen:

> **🟦 Was ich von dir brauche**
> Hier steht, was du konkret liefern sollst.

> **🟨 Warum ich das brauche**
> Hier steht, warum. Lies das immer mit, sonst verstehst du nicht, wofür du arbeitest.

Wenn ein Punkt unklar ist: **markiere ihn mit einem Fragezeichen** und arbeite weiter. Wir klären offene Punkte gesammelt, nicht stückweise per Telefon. Das spart uns beiden Nerven.

---

## Phase 0: Bevor du anfängst — die wichtigsten Begriffe

Du musst kein Entwickler werden. Aber du musst ein paar Begriffe kennen, sonst können wir nicht miteinander reden. Hier die wichtigsten.

### Die Hausbau-Analogie

Stell dir die Plattform vor wie ein Haus, das du planst.

**Frontend** ist die Fassade und die Innenräume. Alles, was deine Besucher sehen und anfassen. Die Farben, die Möbel, die Türgriffe, die Lichtschalter. Wenn jemand sagt "die Website sieht hübsch aus", redet er über das Frontend.

**Backend** ist die Statik, die Leitungen, die Heizung, der Sicherungskasten. Sieht niemand, aber ohne das fällt das Haus zusammen oder es bleibt kalt. Das Backend macht die Arbeit, wenn ein Besucher auf einen Knopf drückt: prüft Passwörter, schickt E-Mails, rechnet Rechnungen aus, speichert was wo hingehört.

**Datenbank** ist der Keller mit den Aktenschränken. Hier liegt alles dauerhaft: Mitgliederlisten, Beiträge, Termine, Bilder. Wenn das Backend etwas wissen will, holt es das aus dem Keller. Wenn ein Mitglied einen neuen Beitrag schreibt, wandert der in einen Ordner im Keller.

**Server** ist das Grundstück, auf dem das ganze Haus steht. Ein gemieteter Platz im Internet. Der kostet monatlich Miete.

**Domain** ist die Adresse, unter der man dein Haus findet. Zum Beispiel `deine-community.de`. Die kostet ein paar Euro im Jahr.

**Login** ist die Haustür mit Schlüssel. Jedes Mitglied hat einen eigenen Schlüssel (Benutzername und Passwort).

**Admin-Bereich** ist dein Büro im Haus. Nur du (und wer du sagst) kommt da rein. Hier verwaltest du Mitglieder, schaltest Beiträge frei, schaust Statistiken an.

**Mockup** ist deine Bauzeichnung. Eine Skizze, wie die Räume aussehen sollen, bevor wir den ersten Stein legen. Dazu kommen wir ausführlich.

**i18n** ist die Vorbereitung darauf, dass dein Haus später auch in anderen Sprachen sprechen kann. Wir bauen die Plattform von Anfang an so, dass man Englisch, Französisch usw. später dazuschalten kann. Du musst aber nichts übersetzen. Vorerst nur Deutsch.

Das reicht für den Anfang. Wenn ein Wort vorkommt, das du nicht kennst: notieren, weitermachen, später fragen.

---

## Phase 1: Hausaufgaben (Monat 1–2)

Diese Phase ist die wichtigste. Ich übertreibe nicht. Wenn du sie schlampig machst, leiden alle folgenden Phasen darunter. Wenn du sie gründlich machst, sparen wir später Monate.

In dieser Phase **schreibst und sammelst du nur**. Du baust noch nichts.

### 1.1 Dein Warum in drei Sätzen

> **🟦 Was ich von dir brauche**
>
> Schreibe in **maximal drei Sätzen** auf, warum es deine Plattform gibt. Nicht für mich. Für dich selbst. Du wirst diesen Text in einem Jahr noch oft lesen müssen, wenn du müde bist.

> **🟨 Warum ich das brauche**
>
> Jedes Mal, wenn wir vor einer Designentscheidung stehen, frage ich dich: "Passt das zu deinem Warum?" Wenn dein Warum unklar ist, treffen wir Entscheidungen nach Bauchgefühl. Bauchgefühl ist okay für eine Entscheidung. Bei tausend Entscheidungen wird daraus ein chaotisches Produkt.

### 1.2 Dein Anti-Warum

> **🟦 Was ich von dir brauche**
>
> Schreibe in **drei bis fünf Sätzen** auf, was deine Plattform **ausdrücklich nicht** sein soll. Beispiele: "Keine Selbstdarsteller-Bühne", "Kein anonymer Chat", "Keine kommerzielle Werbeplattform für Drittanbieter".

> **🟨 Warum ich das brauche**
>
> Was du nicht willst, ist oft klarer als was du willst. Diese Liste schützt dich vor schlechten Ideen, die später kommen werden (von dir, von Mitgliedern, von mir).

### 1.3 Deine Zielperson

> **🟦 Was ich von dir brauche**
>
> Beschreibe **eine** konkrete Person, die deine ideale Nutzerin ist. Nicht eine Zielgruppe. Eine Person.
>
> - Alter, Geschlecht, Beruf, Wohnort grob.
> - Was treibt sie an?
> - Was nervt sie an dem, was sie heute online erlebt?
> - Wie ist sie auf dich gekommen?
> - Wie viel Geld würde sie ungefähr im Monat für Inhalte/Beratung ausgeben?
> - Wie technikaffin ist sie? Smartphone-affin oder bedient eher Tablet/Laptop?
>
> Eine halbe Seite reicht. Mehr ist Verschwendung.

> **🟨 Warum ich das brauche**
>
> Wenn wir später entscheiden "großer Text oder kurze Häppchen", "App oder Website", "viel Bild oder viel Wort", brauchen wir eine Person, die wir uns vorstellen. Sonst entscheiden wir für niemanden.

### 1.4 Drei Sätze "So fühlt sich die Plattform an"

> **🟦 Was ich von dir brauche**
>
> Beschreibe in drei Sätzen, wie die Plattform sich **anfühlen** soll. Nicht wie sie aussieht. Wie sie sich anfühlt.
>
> Beispiele: "Wie ein ruhiger Garten, in dem man leise redet." Oder: "Wie ein Marktplatz, auf dem alle ihr Bestes zeigen." Oder: "Wie ein Wohnzimmer unter Freunden."

> **🟨 Warum ich das brauche**
>
> Das ist deine Designrichtschnur. Wenn ich später einen Vorschlag mache und du sagst "das fühlt sich zu kalt an", weiß ich, was zu tun ist.

### 1.5 Bestehende Mitglieder sammeln

> **🟦 Was ich von dir brauche**
>
> Liste auf, **wo deine bisherigen Kontakte und Interessenten gerade sind**:
>
> - Hast du eine WhatsApp-Gruppe? Wie viele Leute?
> - Telegram?
> - E-Mail-Verteiler? Wie viele Adressen?
> - Facebook-Gruppe oder -Seite?
> - Instagram-Follower?
> - Visitenkarten in einer Schublade?
>
> Schreib zu jedem Kanal: ungefähre Anzahl Personen, wie aktiv sie sind, ob du Erlaubnis hast, sie zu kontaktieren.

> **🟨 Warum ich das brauche**
>
> Wir müssen wissen, ob wir am Tag des Launchs 10 Leute haben oder 500. Das ändert die Strategie komplett. Außerdem: Wenn du heute schon eine aktive WhatsApp-Gruppe hast, sollten wir die nicht abschalten, sondern in die neue Plattform überführen.

### 1.6 Inspirations-Sammlung (3 bis 10 Websites)

> **🟦 Was ich von dir brauche**
>
> Sammle **3 bis 10 Websites oder Apps**, die dir gut gefallen. Für jede:
>
> 1. Den Link (URL).
> 2. **Was** dir an ihr gefällt. Konkret. Nicht "die ist hübsch", sondern "die Farben sind warm, der Text ist groß, ich finde mich sofort zurecht".
> 3. **Was** dir nicht gefällt, falls etwas. Auch konkret.
>
> Das müssen keine Community-Plattformen sein. Eine Hotel-Website darf dabei sein, wenn dir die Stimmung gefällt. Ein Online-Shop, wenn dir die Bedienung gefällt. Ein Magazin, wenn dir die Schrift gefällt.

> **🟨 Warum ich das brauche**
>
> Geschmack ist schwer in Worte zu fassen. Wenn ich drei deiner Lieblings-Websites kenne, kann ich in 10 Minuten erkennen, was du magst. Wenn ich nur deine Worte habe, brauche ich Wochen und treffe trotzdem nicht.

### 1.7 Negativ-Sammlung (3 bis 5 Websites)

> **🟦 Was ich von dir brauche**
>
> Sammle 3 bis 5 Websites, die du **abstoßend** findest. Mit derselben Begründung: warum konkret.

> **🟨 Warum ich das brauche**
>
> Ich darf nicht versehentlich etwas bauen, das dich an eine Seite erinnert, die du hasst. Das passiert schneller, als du denkst.

### 1.8 Deine Inhaltsformen

> **🟦 Was ich von dir brauche**
>
> Liste auf, in welchen Formen du Inhalte produzieren willst:
>
> - Geschriebene Artikel? Wie lang ungefähr?
> - Videos? Wie lang? Selbst gefilmt oder professionell?
> - Audio/Podcast?
> - Live-Sessions (Videoschalte mit mehreren)?
> - Termine vor Ort (Workshops, Treffen)?
> - Bildergalerien?
> - Buchempfehlungen, Linksammlungen?
> - Persönliche Beratung (Einzeltermine)?
>
> Für jede Form: Wie oft willst du das veröffentlichen? (Täglich? Wöchentlich? Monatlich? Unregelmäßig?)
>
> **Sei ehrlich.** Wenn du sagst "täglich ein Video", aber realistisch ein Video pro Monat schaffst, bauen wir die falsche Plattform.

> **🟨 Warum ich das brauche**
>
> Eine Plattform für tägliche Kurztexte sieht völlig anders aus als eine Plattform für monatliche lange Videos. Wenn ich das vorher nicht weiß, bauen wir das Falsche.

### 1.9 Hausaufgabe: Was machen andere?

> **🟦 Was ich von dir brauche**
>
> Suche **mindestens 3, höchstens 7** andere Personen, die ähnliche Themen wie du behandeln und eine eigene Plattform oder Community haben. Schau dir an, was die machen.
>
> Für jede: Was machen sie gut? Was machen sie schlecht? Was hat dich an ihrer Seite genervt? Was könntest du besser?
>
> Eine halbe bis ganze Seite pro Person. Auch hier: konkret.

> **🟨 Warum ich das brauche**
>
> Du musst wissen, was Standard ist in deinem Umfeld. Sonst erfindest du das Rad neu, oder schlimmer: du erfindest ein schlechteres Rad.

---

## Phase 2: Geschäftsmodell und Rechtliches (Monat 2–3)

Bevor wir über Buttons und Farben reden, müssen ein paar Sachen geklärt sein, die später teuer werden, wenn man sie ignoriert.

### 2.1 Geld

> **🟦 Was ich von dir brauche**
>
> Entscheide für jede der folgenden Möglichkeiten: **Ja, Nein oder Vielleicht später**.
>
> 1. Die Plattform an sich ist **kostenlos** für alle.
> 2. Es gibt einen **Mitgliedsbeitrag** (monatlich oder jährlich).
> 3. Es gibt **kostenpflichtige Einzelinhalte** (z.B. ein Video für 9 Euro).
> 4. Es gibt **kostenpflichtige Beratungstermine** mit dir (Einzelgespräche).
> 5. Es gibt **kostenpflichtige Workshops oder Kurse** (live oder aufgezeichnet).
> 6. Es gibt **Spenden** ("Unterstütze die Arbeit").
> 7. Es gibt **Werbung** für Produkte oder Dienste anderer.
>
> Für jeden "Ja" oder "Vielleicht später": Schreib in einem Satz, was es kosten soll oder wie es funktionieren soll.

> **🟨 Warum ich das brauche**
>
> Jede dieser Optionen bedeutet zusätzliche Arbeit in der Plattform: Bezahlsystem, Rechnungen, Abos verwalten, Stornos, Mehrwertsteuer, Kalender für Termine, Zugriffsrechte je nach Bezahlstatus. Wenn wir das von Anfang an wissen, bauen wir es einmal richtig. Wenn es später dazukommt, kostet es das Drei- bis Fünffache.

### 2.2 Rechtlicher Status

> **🟦 Was ich von dir brauche**
>
> Beantworte:
>
> 1. Unter welchem **Namen** trittst du auf? Privatperson? Einzelunternehmen? GmbH? Verein?
> 2. Hast du eine **Steuernummer/UID** für gewerbliche Tätigkeit?
> 3. In welchem **Land** bist du gemeldet? (Wichtig wegen DSGVO und Steuerrecht.)
> 4. Gibt es schon eine **Datenschutzerklärung** und ein **Impressum**, das du irgendwo verwendest? Wenn ja: schick es mir.
> 5. Gibt es schon **AGB** (Allgemeine Geschäftsbedingungen)? Wenn nein: planen wir ein, dass du dir welche besorgst (Anwalt oder Standardvorlage).

> **🟨 Warum ich das brauche**
>
> Ohne Impressum und Datenschutzerklärung darf die Seite nicht online gehen. In Österreich und Deutschland werden fehlende Impressen abgemahnt. Das ist kein Spaß, das kostet vier- bis fünfstellig.

### 2.3 Aussagen, die rechtlich heikel sind

> **🟦 Was ich von dir brauche**
>
> Schreibe auf, welche **konkreten Aussagen oder Versprechen** du auf der Plattform machen willst.
>
> Beispiele für Aussagen, die wir uns genau anschauen müssen:
>
> - "Hilft bei..."
> - "Lindert..."
> - "Heilt..."
> - "Verbessert deine Gesundheit..."
> - "Garantiert dir..."
> - "Mehr Erfolg/Geld/Glück durch..."
>
> Sei vollständig. Schreib alle Aussagen auf, die dir wichtig sind, auch wenn du denkst, sie seien harmlos.

> **🟨 Warum ich das brauche**
>
> In Deutschland und Österreich sind Aussagen zu Gesundheit, Heilwirkungen und Erfolgsversprechen streng reguliert. Du musst nichts ändern an deinem Angebot. Aber wir müssen prüfen, wie du es **formulierst**. Eine falsche Formulierung bedeutet Abmahnung, im schlimmsten Fall Verfahren. Wir formulieren das gemeinsam um, wo nötig. Dafür musst du mir aber sagen, was du ursprünglich sagen wolltest.

### 2.4 Wer darf Mitglied werden?

> **🟦 Was ich von dir brauche**
>
> Beantworte:
>
> 1. Kann sich **jeder** anmelden, oder gibt es eine **Schwelle** (Einladung, Bewerbung, Bezahlung)?
> 2. Mindestalter? (18+ ist einfacher als 16+ oder 14+, wegen DSGVO und Einwilligungen.)
> 3. Müssen Mitglieder ihren **echten Namen** verwenden, oder dürfen sie Pseudonyme nutzen?
> 4. Wer darf **Inhalte beitragen**? Nur du? Alle Mitglieder? Eine handverlesene Gruppe ("Autoren")?
> 5. Wer darf **Kommentare schreiben**? Alle? Nur zahlende Mitglieder? Niemand?

> **🟨 Warum ich das brauche**
>
> Das beeinflusst die ganze Anmelde- und Berechtigungslogik. Eine Plattform, auf der jeder posten darf, braucht Moderationswerkzeuge. Eine, auf der nur du postest, braucht die nicht.

---

## Phase 3: Funktionen und Features (Monat 3–4)

Jetzt wird es konkret. Wir definieren, **was die Plattform können soll**. Noch nicht, wie es aussieht. Nur was es kann.

### 3.1 Die Pflichtfunktionen

Diese Funktionen brauchen wir ziemlich sicher. Geh die Liste durch und kreuze für jede an: **brauche ich (Ja/Nein/Vielleicht)** und schreib einen Satz dazu.

> **🟦 Was ich von dir brauche**
>
> Funktionsliste zum Bewerten:
>
> 1. **Startseite**, auf der Besucher erstmal sehen, worum es geht.
> 2. **Über mich / Über uns**-Seite mit deiner Geschichte.
> 3. **Anmeldung neuer Mitglieder** mit E-Mail-Bestätigung.
> 4. **Login** mit Passwort.
> 5. **Passwort vergessen**-Funktion.
> 6. **Mitgliederbereich** (nur für eingeloggte Mitglieder).
> 7. **Profilseite** für jedes Mitglied (was steht da drauf?).
> 8. **Artikel/Beiträge schreiben** (durch dich oder Mitglieder).
> 9. **Kommentare** unter Beiträgen.
> 10. **Like/Reaktion** (Herz, Daumen hoch, mehrere Emojis?).
> 11. **Direktnachrichten** zwischen Mitgliedern.
> 12. **Kategorien oder Themen**, in die Beiträge einsortiert werden.
> 13. **Suche** (nach Beiträgen, nach Mitgliedern).
> 14. **Veranstaltungskalender** (kommende Termine).
> 15. **Anmeldung zu Veranstaltungen** (mit Bezahlung?).
> 16. **Newsletter** (E-Mail-Aussendung an alle Mitglieder oder Gruppen).
> 17. **Foto- oder Bildergalerien**.
> 18. **Video-Hosting** (Videos auf deiner Plattform abspielen).
> 19. **Audio/Podcast** anhören.
> 20. **Live-Videoschalte** (Zoom-ähnlich, mehrere Personen).
> 21. **Forum oder Gruppen-Chat**.
> 22. **Bezahlsystem** (siehe Phase 2.1).
> 23. **Mehrere Sprachen**, die der Nutzer umschalten kann (vorerst nur DE, aber technisch vorbereitet).
> 24. **Benachrichtigungen** per E-Mail (neuer Beitrag, neuer Kommentar, neue Nachricht).
> 25. **Push-Benachrichtigungen** auf dem Smartphone (das wäre dann eine App, nicht nur Website).
> 26. **App** fürs Handy (zusätzlich zur Website) oder reicht eine handytaugliche Website?
> 27. **Statistiken** für dich (wie viele Mitglieder, wie viele Beiträge gelesen).
> 28. **Mitgliederverzeichnis** (alle Mitglieder durchsuchbar).
> 29. **"Wer ist online"-Anzeige**.
> 30. **Karte / Standortfunktion** (zeigt, wo Mitglieder sind, falls relevant).

> **🟨 Warum ich das brauche**
>
> Jede dieser Funktionen ist Aufwand. Wenn wir alle bauen, dauert es drei Jahre und kostet entsprechend. Wir müssen priorisieren. Funktionen, die mit "Vielleicht" markiert sind, kommen in eine zweite Ausbauphase nach dem Launch.

### 3.2 Funktionen, die ich vergessen habe

> **🟦 Was ich von dir brauche**
>
> Schreibe alle Funktionen auf, die dir wichtig sind und die **nicht** in der Liste oben stehen. Auch wenn sie verrückt klingen. Wir bewerten sie gemeinsam.

> **🟨 Warum ich das brauche**
>
> Ich kenne dein Thema nicht so gut wie du. Vielleicht braucht deine Community etwas, an das ich nicht denke.

### 3.3 Die drei wichtigsten Funktionen

> **🟦 Was ich von dir brauche**
>
> Aus allem, was du oben mit "Ja" markiert hast: Welche **drei Funktionen** sind die wichtigsten? Welche müssen am Tag des Launchs perfekt funktionieren, sonst ist die Plattform sinnlos?

> **🟨 Warum ich das brauche**
>
> Wir bauen diese drei zuerst und am sorgfältigsten. Der Rest baut sich darum herum.

### 3.4 Inhalte zum Start

> **🟦 Was ich von dir brauche**
>
> Wenn die Plattform morgen live ginge: **welche Inhalte wären drauf?**
>
> Konkret:
>
> - Wie viele Artikel hast du schon geschrieben (oder kannst bis zum Launch schreiben)?
> - Wie viele Videos hast du fertig?
> - Welche Termine sind im Kalender?
>
> Eine leere Plattform schreckt Besucher ab. Wir brauchen am Tag 1 schon **substanziellen Inhalt**, sonst kommt niemand wieder.

> **🟨 Warum ich das brauche**
>
> Plattformen scheitern oft nicht an Technik, sondern an Leere. Wir müssen sicherstellen, dass am Tag 1 mindestens 10 bis 20 gute Inhalte da sind, sonst war der ganze Aufbau umsonst.

---

## Phase 4: Wie sieht das aus? — Mockups (Monat 4–6)

Jetzt zeichnen wir. Du wirst lernen, mit einem **Mockup-Tool** umzugehen. Das ist eine Art digitales Skizzenbuch, in dem du Bildschirme zeichnest, ohne programmieren zu müssen.

### 4.1 Mockup-Tool auswählen

> **🟦 Was ich von dir brauche**
>
> Probiere **eines** der folgenden kostenlosen Tools aus. Such dir das aus, mit dem du am besten klar kommst, und bleib dabei.
>
> 1. **Figma** (figma.com) — am verbreitetsten. Steile Lernkurve, aber dafür gibt es unzählige YouTube-Tutorials. Kostenlos für eine Person mit unbegrenzten Projekten.
> 2. **Penpot** (penpot.app) — Open Source, ähnlich wie Figma. Etwas einfacher.
> 3. **Excalidraw** (excalidraw.com) — sehr einfach, sieht aus wie handgezeichnet. Reicht für grobe Skizzen.
> 4. **Stift und Papier** — wenn alles andere nervt: zeichne von Hand und fotografiere ab. Wirklich. Das funktioniert.
>
> Plane zwei bis drei Wochen ein, in denen du nichts anderes machst, als das Tool zu lernen. YouTube-Tutorials gibt es auf Deutsch.

> **🟨 Warum ich das brauche**
>
> Wenn du mir mit Worten beschreibst, wie die Startseite aussehen soll, baue ich etwas. Du siehst es und sagst "nein, anders". Wir wiederholen das fünf Mal. Wenn du mir stattdessen eine Skizze gibst, baue ich genau das. Beim ersten Mal. Das spart uns Wochen.

### 4.2 Die Bildschirme, die du zeichnen sollst

> **🟦 Was ich von dir brauche**
>
> Zeichne (egal mit welchem Tool) Skizzen für mindestens diese Bildschirme:
>
> 1. **Startseite** (was sieht jemand, der zum ersten Mal auf die Seite kommt?).
> 2. **Anmeldeseite** (Formular für neue Mitglieder).
> 3. **Login-Seite**.
> 4. **Mitgliederbereich-Startseite** (was sieht ein eingeloggtes Mitglied als Erstes?).
> 5. **Ein einzelner Beitrag/Artikel** (wie sieht ein Artikel aus, wenn man ihn liest?).
> 6. **Profilseite** eines Mitglieds.
> 7. **Deine eigene Verwaltungsseite** (Admin-Bereich, wo du Inhalte einstellst).
>
> Pro Bildschirm zwei Versionen:
>
> - **Wie es auf einem großen Bildschirm aussieht** (Laptop, Monitor).
> - **Wie es auf dem Handy aussieht** (schmal und hoch).
>
> Sei nicht perfektionistisch. Kästchen für "hier kommt ein Bild rein", Linien für "hier kommt Text rein", Knöpfe mit Beschriftung. Mehr nicht. Es muss nicht hübsch sein, es muss klar sein.

> **🟨 Warum ich das brauche**
>
> Die Zeichnungen sind unser **gemeinsamer Vertrag**. Wenn die Plattform fertig ist, vergleichen wir sie mit deinen Zeichnungen. Wenn sie übereinstimmt, hast du genau das bekommen, was du wolltest.

### 4.3 Farben, Schriften, Logo

> **🟦 Was ich von dir brauche**
>
> 1. Hast du schon ein **Logo**? Wenn ja: schick es mir in höchster Auflösung, am besten als Vektordatei (SVG, AI oder PDF). Wenn nein: brauchst du eines? Plane Zeit und Budget für einen Grafiker ein, das ist nicht meine Stärke.
> 2. Hast du **Farben**, die zu dir gehören? Schreib sie auf, am besten mit Farbcode (z.B. "Dunkelblau, etwa #1A3E5C"). Wenn du keine hast: 3 bis 5 Farben aussuchen, die dir gefallen, irgendwo abfotografieren ("die Wandfarbe in dem Café gefällt mir"), wir machen daraus eine Palette.
> 3. Hast du eine **Lieblings-Schriftart**? Ist okay, wenn nein. Schick mir sonst 3 Schriftbeispiele, die dir gefallen (Screenshots aus Büchern, Plakaten, Websites).

> **🟨 Warum ich das brauche**
>
> Ohne diese Vorgaben muss ich raten. Was ich rate, gefällt dir mit 50% Wahrscheinlichkeit nicht. Dann gehen wir 3 Runden Korrektur. Mit deinen Vorgaben treffe ich beim ersten Versuch.

### 4.4 Beispieltexte schreiben

> **🟦 Was ich von dir brauche**
>
> Schreib mir **echte Texte** für die wichtigsten Stellen:
>
> 1. Den Titel und Untertitel deiner Startseite (max. zwei Sätze).
> 2. Den Begrüßungstext auf der Startseite (5 bis 10 Sätze).
> 3. Den Text "Über mich" (eine halbe bis ganze Seite).
> 4. Den Text, der bei der Anmeldung steht ("Werde Mitglied weil...").
> 5. Den Text auf dem Knopf "Anmelden". (Knopf-Texte sind wichtiger als du denkst. "Jetzt mitmachen" wirkt anders als "Registrieren".)
>
> Schreib das in deiner echten Sprache. Nicht das, was du denkst, dass auf einer Website stehen sollte. Sondern wie du tatsächlich redest.

> **🟨 Warum ich das brauche**
>
> Platzhaltertexte ("Lorem ipsum") sind der Tod jeder Plattform. Sobald sie drauf sind, vergisst man sie, und sie gehen live. Echte Texte zeigen außerdem oft, dass ein Bildschirm umgebaut werden muss, weil der Text länger oder kürzer ist als gedacht.

---

## Phase 5: Technisches Drumherum (Monat 5–7)

In dieser Phase erledigst du Sachen, die nichts mit dem Aussehen zu tun haben, aber ohne die nichts geht.

### 5.1 Konten und Zugänge

> **🟦 Was ich von dir brauche**
>
> Du brauchst Konten bei einigen Diensten. Ich richte dir alles ein, du musst nur **anlegen und bezahlen**:
>
> 1. **Domain** (z.B. `deine-community.de`) — entscheide dich für einen Namen. Bevor du den Namen festlegst, gib mir Bescheid, dass ich prüfe, ob er frei ist. Kosten: ca. 10 bis 30 Euro pro Jahr.
> 2. **E-Mail-Postfach** unter dieser Domain (z.B. `info@deine-community.de`). Idealerweise auch eine Adresse für rechtliches Zeug (z.B. `recht@deine-community.de`). Kosten: oft im Domain-Paket dabei oder ca. 3 bis 10 Euro pro Monat.
> 3. **Server** — den miete ich für dich, du erstattest mir die Kosten oder bezahlst direkt. Rechne mit 20 bis 100 Euro pro Monat, abhängig davon, wie viel los ist.
> 4. **Zahlungsdienstleister** (z.B. Stripe), falls du Geld einnehmen willst. Du musst dich verifizieren mit Personalausweis und Steuernummer. Plane dafür einen halben Tag ein.
> 5. **E-Mail-Versanddienst** (für Newsletter und Benachrichtigungen). Kosten variieren mit der Mitgliederzahl, am Anfang oft kostenlos.

> **🟨 Warum ich das brauche**
>
> Die Plattform läuft nicht in der Luft. Sie braucht eine Adresse, einen Platz und Werkzeuge. Diese musst du beauftragen und bezahlen, weil du der rechtliche und steuerliche Eigentümer bist.

### 5.2 Backup und Sicherheit

> **🟦 Was ich von dir brauche**
>
> Bestätige, dass du verstehst:
>
> 1. Wir machen automatische **Sicherheitskopien (Backups)** der Datenbank. Tägliche, mindestens 30 Tage zurück.
> 2. Wenn ein Mitglied sein Passwort vergisst, **können wir es ihm nicht sagen**. Passwörter werden so gespeichert, dass nicht mal ich sie lesen kann. Wir können nur ein neues setzen. Das ist Absicht, das ist gut so.
> 3. Wir speichern personenbezogene Daten so wenig wie möglich. Wenn ein Mitglied sein Konto löschen will, **müssen wir es löschen** (DSGVO).

> **🟨 Warum ich das brauche**
>
> Wenn jemand anruft "Ich brauche das Passwort von User XY", musst du wissen, dass das nicht geht, ohne dich blöd zu fühlen. Es geht wirklich nicht. Niemandem. Das ist eine Funktion, kein Fehler.

### 5.3 Was passiert, wenn ich morgen vom Bus überfahren werde?

> **🟦 Was ich von dir brauche**
>
> Wir besprechen einmal ausführlich:
>
> 1. Wo liegt der **Quellcode** der Plattform?
> 2. Wer hat **Zugang** zum Server außer mir?
> 3. Wer hat **Zugang** zur Datenbank?
> 4. Wo sind die **Zugangsdaten** dokumentiert?
>
> Wir richten ein, dass **du persönlich** an alles drankommst, falls ich nicht mehr verfügbar bin. Inklusive einer schriftlichen Anleitung, an wen du dich wenden kannst.

> **🟨 Warum ich das brauche**
>
> Das ist kein schöner Gedanke, aber es ist deine Plattform. Du musst auch ohne mich weiterleben können.

---

## Phase 6: Vor dem Launch (Monat 9–11)

Wenn wir hier sind, ist die Plattform technisch fertig. Jetzt geht es um die letzten Schliffe.

### 6.1 Testen mit echten Menschen

> **🟦 Was ich von dir brauche**
>
> Such **5 bis 10 Personen** aus deinem Umfeld, die nicht technikaffin sind. **Lass sie die Plattform benutzen, während du daneben sitzt und zuschaust**. Sag nichts. Hilf ihnen nicht.
>
> Notiere:
>
> - Wo sie hängen bleiben.
> - Was sie nicht finden.
> - Was sie falsch verstehen.
> - Was sie loben.
>
> Schick mir die Liste.

> **🟨 Warum ich das brauche**
>
> Du und ich kennen die Plattform zu gut. Wir sehen die Probleme nicht mehr, die ein neuer Nutzer in den ersten 30 Sekunden sieht. Fremde Augen finden in einer halben Stunde Fehler, die wir in drei Monaten nicht gefunden haben.

### 6.2 Inhalt aufladen

> **🟦 Was ich von dir brauche**
>
> Lade alle Inhalte, die du in Phase 3.4 vorbereitet hast, auf die Plattform. Selbst. Du wirst das später dauernd machen, also musst du es jetzt lernen.
>
> Ich zeige es dir einmal, dann machst du es allein, dann zeigst du es einer anderen Person, die du als Helfer einsetzt. (Wenn du allein bleibst, wirst du untergehen.)

> **🟨 Warum ich das brauche**
>
> Wenn ich die Inhalte einstelle, lernst du nie, wie es geht. Drei Monate nach Launch rufst du mich an, wenn du ein Komma ändern willst. Das wollen wir vermeiden.

### 6.3 Rechtliche Endprüfung

> **🟦 Was ich von dir brauche**
>
> Lass einen **Anwalt oder eine spezialisierte Stelle** kurz drüberschauen, **bevor** die Plattform live geht:
>
> 1. Impressum vollständig?
> 2. Datenschutzerklärung passt zu dem, was wir tatsächlich tun?
> 3. AGB vorhanden, wenn Geld fließt?
> 4. Werbeaussagen unbedenklich?
> 5. Cookie-Hinweis korrekt?
>
> Plane dafür Geld ein. Eine Beratung kostet je nach Aufwand 300 bis 1500 Euro. Das ist viel weniger als eine Abmahnung.

> **🟨 Warum ich das brauche**
>
> Ich bin kein Anwalt. Ich kann dir sagen, was technisch geht. Was rechtlich geht, muss jemand mit Zulassung sagen. Bitte nimm das ernst.

### 6.4 Notfallplan

> **🟦 Was ich von dir brauche**
>
> Beantworte:
>
> 1. Was machst du, wenn die Plattform am Tag des Launchs **abstürzt**? Wen rufst du an? (Mich. Aber du musst meine Nummer parat haben und einen Plan B haben, falls ich krank bin.)
> 2. Was machst du, wenn ein Mitglied **beleidigend** oder **rechtsverletzend** wird? (Wir bauen einen Lösch- und Sperr-Mechanismus, aber **du** musst entscheiden, wann er angewendet wird. Schreib dir Grundregeln.)
> 3. Was machst du, wenn ein Mitglied behauptet, du hättest seine **Daten missbraucht**? (Wir dokumentieren alles, du musst aber wissen, wo die Dokumentation liegt.)

> **🟨 Warum ich das brauche**
>
> Im Notfall denkt niemand klar. Pläne, die jetzt geschrieben werden, retten dir später den Tag.

---

## Phase 7: Launch und danach (Monat 12 und folgende)

### 7.1 Sanfter Start

Wir gehen **nicht** mit Pauken und Trompeten online. Wir öffnen erst für **20 bis 50 vertraute Personen** aus deinem bestehenden Netzwerk. Lassen sie 2 bis 4 Wochen herumstöbern. Sammeln Rückmeldungen. Bügeln Probleme aus. **Erst dann** geht die Plattform öffentlich.

> **🟦 Was ich von dir brauche**
>
> Eine Liste mit **20 bis 50 Namen und E-Mail-Adressen** aus deinem Umfeld, die du persönlich kontaktieren willst und denen du vertraust. Diese Menschen bekommen den ersten Zugang.

### 7.2 Was nach dem Launch dauerhaft anfällt

> **🟦 Was ich von dir brauche**
>
> Akzeptiere, dass die Arbeit nach dem Launch **anfängt**, nicht aufhört. Dauerhaft fallen an:
>
> 1. Inhalte erstellen (das ist deine Hauptarbeit, dafür gibt es die Plattform).
> 2. Mitglieder betreuen, Fragen beantworten, moderieren.
> 3. Monatliche Auswertung: Was funktioniert? Was nicht?
> 4. Updates und Wartung der Software (das mache ich, kostet aber laufend).
> 5. Eventuelle neue Funktionen, die sich aus dem Betrieb ergeben.

> **🟨 Warum ich das brauche**
>
> Viele Auftraggeber denken: Plattform live, fertig. Das ist falsch. Die Plattform ist wie ein Garten. Wenn du nicht weiter gießt und schneidest, wächst Unkraut. Plane Zeit und Geld dafür ein.

### 7.3 Erfolg messen

> **🟦 Was ich von dir brauche**
>
> Definiere **vor dem Launch**, woran du erkennst, dass die Plattform erfolgreich ist. Beispiele:
>
> - "Nach 6 Monaten haben wir 100 aktive Mitglieder."
> - "Nach einem Jahr trägt die Plattform sich finanziell."
> - "Nach 3 Monaten haben wir 50 Kommentare unter Beiträgen."
> - "Ich habe Spaß an der Arbeit und brenne nicht aus."
>
> Schreib 3 bis 5 solche Ziele auf. Nicht mehr.

> **🟨 Warum ich das brauche**
>
> Ohne Ziele ist alles ein Erfolg und alles ein Misserfolg. Mit Zielen kannst du nach 6 Monaten ehrlich beurteilen, ob du auf Kurs bist.

---

## Was du jetzt sofort tun sollst

1. Druck dieses Dokument aus oder lies es am Bildschirm zu Ende.
2. Geh **noch heute** Phase 1.1 (Dein Warum) und 1.2 (Anti-Warum) durch. 30 Minuten reichen.
3. Beginne ab morgen mit Phase 1.3 bis 1.9. Plane **eine Woche** ein.
4. Wenn du fertig bist mit Phase 1: ruf mich an. Aber **erst** wenn du fertig bist. Nicht zwischendurch.

---

## Was du jetzt **nicht** tun sollst

1. Anfangen, Inhalte zu schreiben, ohne dein "Warum" geklärt zu haben.
2. Eine Domain reservieren, bevor wir gesprochen haben.
3. Geld für ein Logo ausgeben, bevor wir den Stil geklärt haben.
4. Auf YouTube Tutorials über Webentwicklung schauen. Das verwirrt dich nur.
5. Mit Freunden über die Plattform reden, **bevor** dein Warum und Anti-Warum stehen. Du kriegst sonst zu viele Meinungen und verlierst dein eigenes Konzept aus den Augen.

---

## Mein Versprechen an dich

Ich werde dich nicht überfordern, solange du diese Reihenfolge einhältst. Ich werde dir Fachbegriffe erklären, **einmal**, nicht zehnmal. Ich erwarte, dass du dir Notizen machst.

Wenn ich dich anrufe und sage "lies nochmal Phase 2.3", dann ist das nicht persönlich gemeint. Es heißt nur: die Antwort steht da, und es ist effizienter, wenn du sie selbst nachliest, als wenn ich sie dir am Telefon vorlese.

Wir bauen das gemeinsam. Du machst deinen Teil, ich meinen. So funktioniert das.

---

*Ende der Checkliste. Wenn du bis hier gelesen hast, hast du die erste Hürde geschafft.*
