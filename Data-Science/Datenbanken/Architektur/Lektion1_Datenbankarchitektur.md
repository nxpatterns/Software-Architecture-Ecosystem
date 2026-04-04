# Lektion 1: Architektur eines Datenbanksystems & Externspeicherverwaltung

---

## 1. DBS vs. Dateisysteme – was ist der eigentliche Unterschied?

Ein Dateisystem gibt dir Bytes auf einem persistenten Medium. Was du daraus machst, ist dein Problem. Das führt in der Praxis zu denselben Fehlern, die jeder irgendwann neu erfindet:

- **Redundanz und Inkonsistenz**: Dieselben Daten an mehreren Stellen, die irgendwann auseinanderlaufen.
- **Keine Isolation**: Zwei Prozesse, die gleichzeitig in dieselbe Datei schreiben, korrumpieren sich gegenseitig – es sei denn, du baust eigenes Locking.
- **Keine atomaren Operationen**: Ein Absturz mitten in einer Schreibsequenz hinterlässt halbfertige Zustände.
- **Keine Abstraktion für Anfragen**: Du iterierst selbst, filterst selbst, joinst selbst.

Ein DBMS löst diese Probleme *systematisch* und *deklarativ*. Der Preis: Komplexität, Overhead, und eine starre Architektur, die für einfache Anwendungsfälle (append-only logs, große Binärdateien) suboptimal ist.

---

## 2. Das ANSI/SPARC 3-Ebenen-Modell

Das Modell aus dem Jahr 1975 ist noch heute die konzeptuelle Grundlage jedes relationalen DBMS:

```
┌────────────────────────────────────────────┐
│  Externe Ebene (Views / Schemata pro User) │
│  z. B. View "Bestellungen" ohne Preise     │
├────────────────────────────────────────────┤
│  Konzeptuelle Ebene (globales Schema)      │
│  Tabellen, Attribute, Constraints, Typen   │
├────────────────────────────────────────────┤
│  Interne Ebene (physisches Schema)         │
│  Seitenformat, Indexstrukturen, Clustering │
└────────────────────────────────────────────┘
```

**Physische Datenunabhängigkeit**: Die interne Ebene kann geändert werden (z. B. Hash-Index durch B+-Baum ersetzen), ohne das konzeptuelle Schema anzufassen. Anwendungen merken nichts.

**Logische Datenunabhängigkeit**: Das konzeptuelle Schema kann erweitert werden (neue Spalte, neue Tabelle), ohne existierende externe Schemata (Views) zu brechen – soweit die Änderung rückwärtskompatibel ist.

In der Praxis ist logische Datenunabhängigkeit schwerer zu erreichen als physische, weil Anwendungen oft implizit auf Schemadetails angewiesen sind (SELECT *, Spaltenreihenfolge, usw.).

---

## 3. DBMS-Softwarearchitektur

Ein DBMS ist eine geschichtete Systemsoftware. Die Schichten von oben nach unten:

```
SQL-Anfrage
    │
    ▼
┌──────────────────────────────┐
│ Parser & Übersetzer          │  SQL → interner Operatorbaum
├──────────────────────────────┤
│ Anfrageoptimierer            │  Logische & physische Planoptimierung
├──────────────────────────────┤
│ Ausführungssystem            │  Iterator-Modell, Operator-Pipeline
├──────────────────────────────┤
│ Transaktionsverwaltung       │  Concurrency Control, Recovery
├──────────────────────────────┤
│ Systempufferverwaltung       │  Buffer Pool, Replacement Policies
├──────────────────────────────┤
│ Externspeicherverwaltung     │  Segmente, Seiten, Dateien, Geräte
└──────────────────────────────┘
```

Jede Schicht sieht nur die Schnittstelle der darunterliegenden. Der Optimierer arbeitet mit abstrakten Operatoren, nicht mit Festplattenadressen.

---

## 4. Externspeicherverwaltung

### Grundproblem: I/O-Kosten dominieren

Festplatten und SSDs sind um mehrere Größenordnungen langsamer als RAM. Das zentrale Ziel der unteren Schichten ist: **Anzahl der I/O-Operationen minimieren**.

Alles – Indexstrukturen, Seitenformate, Clustering, Pufferstrategien – lässt sich auf dieses Ziel zurückführen.

### Das Dateikonzept im DBMS

Das DBMS verwaltet seine eigenen Dateien auf dem Betriebssystem (oder direkt auf Raw Devices, um OS-Buffering zu umgehen). Es kennt:

- **Segmente**: Logische Einheiten (z. B. eine Tabelle oder ein Index), die aus einer oder mehreren physischen Dateien bestehen.
- **Seiten (Pages)**: Die atomare Ein-/Ausgabeeinheit, typisch 4–16 KB. Das DBMS liest und schreibt immer ganze Seiten.
- **Blöcke**: Die physische Einheit des Betriebssystems/Geräts. DBMS-Seiten sind ein Vielfaches der Blockgröße.

### Dateiorganisationen

| Organisation | Suche | Einfügen | Bereich | Geeignet für |
|---|---|---|---|---|
| Heap | O(n) | O(1) | O(n) | Bulk-Load, volle Scans |
| Sequenziell (sortiert) | O(log n) | O(n) | O(log n + k) | Seltene Updates, viele Bereichsanfragen |
| Hash | O(1) avg | O(1) avg | nicht möglich | Gleichheitssuche, kein Range |

---

## 5. Datensatz- und Seitenformate

### Datensatzformate

**Feste Länge** (fixed-length records): Trivial zu adressieren. Datensatz i beginnt bei Offset `i * record_size`. Keine Metadaten nötig. Problem: Verschnitt bei NULL-Feldern, kein Platz für variable Daten.

**Variable Länge** (variable-length records): Jeder Datensatz hat einen Header mit einem Offset-Array, das auf die einzelnen Feldwerte zeigt.

```
┌─────────┬─────────┬──────┬─────────────┬──────────┐
│ Offset  │ Offset  │ ...  │   Feld 1    │  Feld 2  │
│ Feld 1  │ Feld 2  │      │  (variabel) │ (variab) │
└─────────┴─────────┴──────┴─────────────┴──────────┘
```

**Sehr große Datensätze (LOBs)**: Passen nicht in eine Seite. Lösungsansätze:
- Overflow-Seiten (der Datensatz zeigt auf eine Kette weiterer Seiten).
- Separater LOB-Speicher, im Hauptdatensatz nur ein Pointer.

### Slotted Page Format

Das Standard-Seitenformat für variable-length records:

```
┌──────────────────────────────────────────────────────┐
│ Header: #Slots, Freispeicher-Offset, Flags           │
├────┬────┬────┬────────────────────────────────────────┤
│ S1 │ S2 │ S3 │  →  freier Bereich  ←                │
│    │    │    │                   [Datensatz 3]       │
│    │    │    │               [Datensatz 2]           │
│    │    │    │           [Datensatz 1]               │
└────┴────┴────┴────────────────────────────────────────┘
     Slot-Verzeichnis wächst         Datensätze wachsen
     von vorne →                     ← von hinten
```

Slots enthalten `(Offset, Länge)` des jeweiligen Datensatzes. Wird ein Datensatz gelöscht, wird sein Slot auf `(-1, 0)` gesetzt. Verschiebt man Datensätze (Komprimierung), ändert man nur die Slot-Einträge – externe Zeiger (`PageID, SlotID`) bleiben stabil.

Das ist der entscheidende Vorteil: **Ein Record Identifier (RID) = (PageID, SlotID)** ist stabil, auch wenn der Datensatz innerhalb der Seite wandert.

---

## 6. Clusterung

Clusterung bezeichnet die physische Anordnung von Datensätzen, die semantisch zusammengehören, auf denselben oder benachbarten Seiten.

**Warum relevant**: Bei einem sequenziellen Scan über eine Tabelle oder bei Bereichsanfragen auf einem Index bestimmt die physische Lokalität, wie viele Seiten eingelesen werden müssen. Im schlimmsten Fall (keine Clusterung, B+-Baum-Index) ist jeder Blattzeiger ein anderer I/O – bei großen Ergebnismengen katastrophal.

**Geclusterter Index**: Physische Reihenfolge der Datensätze entspricht der Indexreihenfolge. Pro Tabelle nur einer möglich.

**Ungeclusterter Index**: Zeiger springen beliebig über die Datenseiten. Für kleine Selektivitäten akzeptabel, für große Ergebnismengen teurer als ein Full Table Scan.

---

## 7. Systempufferverwaltung

### Buffer Pool

Der Buffer Pool ist ein RAM-Bereich, der in Frames (Rahmen) derselben Größe wie Seiten aufgeteilt ist. Beim Zugriff auf eine Seite:

1. Ist die Seite im Pool? → direkt zugreifen (**Hit**).
2. Nicht im Pool → Pool voll? → Frame auswählen und Seite verdrängen (**Miss**).
3. Verdrängter Frame dirty (modifiziert)? → Zurückschreiben auf Platte (**Write-back**).
4. Neue Seite einlesen.

### Seitenersetzungsstrategien

| Strategie | Idee | Problem |
|---|---|---|
| LRU | Den am längsten nicht benutzten Frame verdrängen | Schlecht bei sequenziellen Scans (Thrashing bei Full Scans) |
| MRU | Den zuletzt benutzten verdrängen | Sinnvoll bei Nested-Loop Joins |
| Clock | Approximation von LRU, günstig zu implementieren | Leichte Ungenauigkeit |
| LRU-K | Ersetzt auf Basis der K-ten letzten Referenz | Besser als LRU, höherer Overhead |

**Wichtig**: Das DBMS kennt den Zugriffsplan (den Query-Plan). Es kann daher Seiten mit **Hints** versehen (`prefetch`, `pin`, `sequential`) – ein Betriebssystem-Buffer-Cache weiß das nicht und trifft schlechtere Entscheidungen. Das ist ein Hauptgrund, warum DBMS den Buffer selbst verwalten statt dem OS zu vertrauen.

---

## 8. Systemkatalog

Der Katalog (auch: Data Dictionary, System Tables) ist eine relationale Selbstbeschreibung des DBMS – Metadaten, gespeichert in normalen Tabellen:

- **Schema-Informationen**: Tabellen, Attribute, Typen, Constraints, Views.
- **Statistiken**: Kardinalitäten, Histogramme, Attributverteilungen – essentiell für den Optimierer.
- **Physische Informationen**: Welcher Index existiert auf welcher Tabelle, Clusterung.
- **Zugriffsrechte**: Welcher User darf was.

Der Optimierer konsultiert den Katalog bei jeder Anfrageoptimierung, um Selektivitätsschätzungen zu machen und Kosten von Plänen zu vergleichen. Veraltete Statistiken (fehlende `ANALYZE`-Läufe) sind eine häufige Ursache für schlechte Anfrageperformance in der Praxis.

---

## Zusammenfassung

| Konzept | Kernaussage |
|---|---|
| DBS vs. Dateisystem | DBS löst Isolation, Konsistenz, Anfragen systematisch – auf Kosten von Komplexität |
| 3-Ebenen-Modell | Trennung von Sicht, Schema, Physik ermöglicht unabhängige Evolution |
| DBMS-Architektur | Geschichtetes System; jede Schicht abstrahiert I/O-Details nach oben |
| Slotted Pages | RID = (PageID, SlotID) ist stabil; Slots erlauben interne Datenbewegung |
| Clusterung | Physische Lokalität ist entscheidend für I/O-Kosten bei Scans |
| Buffer Pool | DBMS verwaltet RAM-Caching selbst, weil es den Zugriffsplan kennt |
| Seitenersetzung | Strategie hängt vom Zugriffsmuster ab; LRU ist nicht universell optimal |
| Systemkatalog | Metadaten-Basis für Optimierer; veraltete Statistiken = schlechte Pläne |
