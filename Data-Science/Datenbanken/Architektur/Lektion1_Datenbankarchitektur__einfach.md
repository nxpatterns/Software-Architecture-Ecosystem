# Lektion 1: Architektur eines Datenbanksystems & Externspeicherverwaltung

---

## 1. Warum überhaupt eine Datenbank?

Stell dir vor, du verwaltest Kundendaten in einfachen Textdateien. Das funktioniert – bis zwei Mitarbeiter gleichzeitig dieselbe Datei bearbeiten und einer die Änderungen des anderen überschreibt. Oder bis du nach einem Absturz merkst, dass die Datei halb geschrieben wurde.

**Datenbanksysteme (DBS)** lösen genau diese Probleme. Im Vergleich zu Dateisystemen bieten sie:

- **Konsistenz**: Daten sind nie in einem halbfertigen Zustand.
- **Mehrbenutzerbetrieb**: Hunderte Nutzer können gleichzeitig lesen und schreiben, ohne sich gegenseitig zu behindern.
- **Persistenz**: Ein Absturz zerstört keine Daten.
- **Abfragesprachen**: Statt selbst durch Dateien zu suchen, fragt man einfach: "Gib mir alle Kunden aus Wien."

**Nachteile**: Ein DBS ist komplex, braucht mehr Ressourcen, und für sehr einfache Aufgaben ist es oft Overkill.

---

## 2. Das 3-Ebenen-Modell

Ein DBS trennt strikt, *wie* Daten gespeichert sind, von *wie* sie aussehen. Dafür gibt es drei Ebenen:

```
┌──────────────────────────────────┐
│  Externe Ebene (Sicht des Users) │  ← "Ich sehe nur Kundennamen und Preise"
├──────────────────────────────────┤
│  Konzeptuelle Ebene (logisch)    │  ← Das vollständige Datenbankschema
├──────────────────────────────────┤
│  Interne Ebene (physisch)        │  ← Wie Daten wirklich auf der Festplatte liegen
└──────────────────────────────────┘
```

**Datenunabhängigkeit** bedeutet: Änderungen auf einer Ebene wirken sich nicht auf die darüber liegende aus.

- *Physische Datenunabhängigkeit*: Man kann die interne Speicherung ändern (z. B. eine neue Festplatte einbauen), ohne das Schema anzufassen.
- *Logische Datenunabhängigkeit*: Man kann das Schema ändern (z. B. eine Spalte hinzufügen), ohne alle Anwendungen umzuschreiben.

---

## 3. Softwarearchitektur eines DBMS

Ein Datenbankmanagementsystem (DBMS) ist keine monolithische Software – es besteht aus mehreren Schichten, die jeweils eine klar definierte Aufgabe haben:

```
Anwendung / SQL-Anfrage
        ↓
  Anfragebearbeitung (Parser, Optimierer)
        ↓
  Transaktionsverwaltung (Concurrency, Recovery)
        ↓
  Systempufferverwaltung (Caching im RAM)
        ↓
  Externspeicherverwaltung (Festplatte / SSD)
```

Jede Schicht abstrahiert die darunterliegende. Die Anfragebearbeitung muss nicht wissen, wie Daten physisch liegen.

---

## 4. Externspeicher- und Systempufferverwaltung

### Externspeicherverwaltung

Die Festplatte ist um Größenordnungen langsamer als RAM. Die Externspeicherverwaltung regelt:

- Wie Daten auf dem physischen Speicher organisiert sind.
- Welche Blöcke (Seiten) wo liegen.

### Systempufferverwaltung (Buffer Pool)

Anstatt jede Anfrage direkt von der Festplatte zu bedienen, hält das DBMS häufig benutzte Seiten im RAM (im sog. **Puffer**).

- Wenn eine Seite gebraucht wird und schon im Puffer ist: kein Plattenzugriff nötig.
- Wenn der Puffer voll ist: Eine Seite muss verdrängt werden (**Seitenersetzungsstrategie**, z. B. LRU – zuletzt am längsten nicht benutzt rausfliegen).

---

## 5. Datensatz- und Seitenformate

Daten werden in **Seiten** (typisch 4–16 KB) gespeichert. In diese Seiten werden **Datensätze** gepackt.

### Datensatzformate

| Typ | Beschreibung | Beispiel |
|-----|-------------|---------|
| Fixer Länge | Alle Felder gleich groß | `INT`, `CHAR(10)` |
| Variabler Länge | Felder unterschiedlich groß | `VARCHAR`, `TEXT` |
| Sehr große Länge | Passt nicht in eine Seite | BLOBs, große Texte |

Für variable Länge braucht man ein **Verzeichnis** am Anfang der Seite, das sagt, wo jedes Feld anfängt.

### Seitenformat (Slotted Pages)

Eine Seite besteht aus:
- Einem **Header** mit Metadaten (Anzahl Slots, freier Speicher).
- **Slots** (Verzeichnis), die auf die Datensätze zeigen.
- Den eigentlichen **Datensätzen** (wachsen von hinten).

Das erlaubt, Datensätze innerhalb der Seite zu verschieben (z. B. beim Komprimieren), ohne externe Zeiger zu brechen.

---

## 6. Clusterung

**Clusterung** bedeutet, dass Datensätze, die häufig zusammen abgefragt werden, auch physisch nahe beieinanderliegen.

Beispiel: Alle Bestellungen eines Kunden liegen auf denselben oder benachbarten Seiten. So muss das DBMS für eine Kundenabfrage nicht über die ganze Festplatte springen.

Ohne Clusterung: viele teure Plattenzugriffe. Mit Clusterung: deutlich weniger.

---

## 7. Dateiorganisationen

Wie werden Seiten auf dem Speicher angeordnet? Die grundlegenden Varianten:

- **Heap-Datei**: Datensätze werden einfach hintereinander eingefügt. Suche ist langsam (linear), Einfügen ist schnell.
- **Sequenzielle Datei**: Datensätze sind nach einem Schlüssel sortiert. Binäre Suche möglich, aber Einfügen ist teuer.
- **Hash-Datei**: Schlüssel wird gehasht, um die Seite direkt anzuspringen. Sehr schnell für Gleichheitssuche, ungeeignet für Bereichsanfragen.

---

## 8. Der Systemkatalog

Der Systemkatalog (auch Data Dictionary) ist die **Selbstbeschreibung** der Datenbank. Er speichert:

- Welche Tabellen existieren.
- Welche Spalten, Typen und Constraints sie haben.
- Welche Indexe vorhanden sind.
- Zugriffrechte.

Das DBMS selbst benutzt den Katalog intern – z. B. der Optimierer, um einen effizienten Anfrageplan zu erstellen. Ohne Katalog wüsste das System nicht, was es verwaltet.

---

## Zusammenfassung

| Konzept | Kernidee |
|---------|----------|
| DBS vs. Dateisystem | Konsistenz, Mehrbenutzerbetrieb, Abfragesprachen |
| 3-Ebenen-Modell | Trennung von Sicht, Schema und physischer Speicherung |
| Datenunabhängigkeit | Änderungen einer Ebene bleiben unsichtbar nach oben |
| Pufferverwaltung | Häufig benutzte Seiten im RAM halten, Festplattenbesuche minimieren |
| Datensatzformate | Fix, variabel, sehr groß – jeweils andere Speicherstruktur |
| Clusterung | Physisch zusammenlegen, was logisch zusammengehört |
| Systemkatalog | Die Datenbank, die sich selbst beschreibt |
