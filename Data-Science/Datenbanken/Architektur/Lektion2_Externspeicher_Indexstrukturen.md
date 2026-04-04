# Lektion 2: Externspeicher- und Systemverwaltung, Indexstrukturen

---

## 1. Segmentkonzept

Ein **Segment** ist die logische Verwaltungseinheit oberhalb von Seiten. Eine Tabelle oder ein Index ist ein Segment; das Segment besteht aus einer geordneten Menge von Seiten mit sichtbaren Seitengrenzen.

"Sichtbare Seitengrenzen" bedeutet: Das DBMS weiß, dass Datensätze nicht über Seitengrenzen hinausgehen (außer bei expliziten Overflow-Seiten). Das vereinfacht Navigation und Pufferverwaltung massiv – jede Seite ist eine in sich geschlossene Einheit.

### Abbildung von Segmenten in Dateien

Segmente werden auf Betriebssystem-Dateien abgebildet, entweder 1:1 (ein Segment = eine Datei) oder n:1 (mehrere Segmente in einer Datei, durch Extent-Verwaltung). Das DBMS hält eine eigene Seitentabelle: `(SegmentID, SeitenNr) → (DateiID, Offset)`.

### Direkte vs. indirekte Einbringstrategien

Wenn eine Transaktion eine Seite ändert, stellt sich die Frage: Wann und wie kommt die Änderung auf den persistenten Speicher?

**Direkte Einbringung (Steal + Force):**
- **Steal**: Modifizierte Seiten dürfen vor dem Commit auf die Platte geschrieben werden (der Buffer Pool kann sie verdrängen). Vorteil: Geringer RAM-Bedarf. Nachteil: Bei Abbruch muss die Änderung rückgängig gemacht werden (Undo nötig).
- **Force**: Alle geänderten Seiten werden beim Commit erzwungen auf die Platte geschrieben. Vorteil: Kein Redo nötig. Nachteil: Viele kleine I/Os, schlechte Performance.

In der Praxis verwenden die meisten DBMS **Steal + No-Force** (mit WAL als Kompensation): Seiten dürfen verdrängt werden (Steal), aber Commit erfordert keinen Force der Datenseiten – nur das Log muss geflusht werden. Das Ergebnis: Undo über Log möglich, Redo über Log möglich, und der Buffer Pool kann Seiten frei verdrängen.

### Schattenspeicherkonzept

Eine alternative indirekte Einbringstrategie ohne WAL:

- Beim ersten Schreiben einer Seite innerhalb einer Transaktion wird eine **Schattenkopie** der Originaldatenseite angelegt.
- Alle Änderungen gehen auf die neue Seite; die Schattenkopie bleibt unberührt.
- Commit: Die Seitentabelle wird atomisch umgehängt (zeigt jetzt auf die neue Seite).
- Abort: Neue Seite wird verworfen; Schattenkopie ist noch intakt.

**Vorteil**: Kein Undo nötig, einfaches Rollback.  
**Nachteil**: Schlechte Clusterung (Seiten wandern bei jeder Änderung), hoher Aufwand für die Verwaltung der Seitentabelle, kein effizienter Mehrbenutzerbetrieb. Heute kaum noch verwendet; historisch relevant (z. B. IBM System R in frühen Versionen).

---

## 2. Systempufferverwaltung (vertieft)

### Speicherzuteilung

Der Buffer Pool ist in Frames aufgeteilt. Die Frage, wie viele Frames welchem Segment (oder welcher Transaktion) zugeteilt werden, ist die **Speicherzuteilungsstrategie**:

- **Globale Strategie**: Alle Frames in einem gemeinsamen Pool, Ersetzung global. Einfach, aber eine schlecht verhaltene Anfrage kann den Pool für alle anderen fluten.
- **Lokale Strategie**: Jeder Transaktion/Anfrage wird eine feste Anzahl Frames zugeteilt. Isolation zwischen Anfragen, aber schlechte Ausnutzung wenn eine Anfrage weniger braucht als zugeteilt.

### Seitenersetzungsstrategien (vertieft)

Das klassische Problem: Welcher Frame wird verdrängt wenn der Pool voll ist?

**LRU (Least Recently Used):**  
Verdrängt den Frame, der am längsten nicht mehr referenziert wurde. Funktioniert gut bei zeitlicher Lokalität. Versagt bei sequenziellen Full-Table-Scans: Jede Seite wird genau einmal gelesen, LRU verdrängt also immer die Seite, die als nächstes gebraucht wird – **sequenzielles Flooding**.

**MRU (Most Recently Used):**  
Verdrängt den zuletzt referenzierten Frame. Klingt kontraintuitiv, ist aber optimal bei Nested-Loop Joins: Die äußere Relation rotiert durch den Pool, die innere bleibt gecacht – MRU verdrängt die gerade fertig gelesene äußere Seite, nicht die innere.

**Clock (Second Chance):**  
Jeder Frame hat ein Reference-Bit. Beim Zugriff wird es gesetzt. Der Clock-Zeiger dreht sich: Ist das Bit gesetzt, wird es gelöscht (zweite Chance) und der Zeiger rückt weiter. Ist es nicht gesetzt, wird der Frame verdrängt. Günstige O(1)-Approximation von LRU.

**LRU-K:**  
Ersetzungsentscheidung basiert nicht auf dem letzten Zugriff, sondern auf dem **K-ten letzten**. Das glättet Ausreißer (eine Seite, die einmal zufällig referenziert wurde, fliegt nicht sofort raus). K=2 ist in der Praxis üblich.

**Prefetching und Pinning:**  
Das DBMS kann Seiten **pinnen** (nicht verdrängenbar markieren, z. B. während ein Operator aktiv darauf arbeitet) und **Prefetch**-Hinweise geben (nächste Seite schon laden, bevor sie angefragt wird). Beides funktioniert nur, weil das DBMS den Query-Plan kennt – ein OS-seitiger Cache hat diesen Kontext nicht.

---

## 3. Indexstrukturen: Begriff und Aufgaben

Ein **Index** ist eine redundante, auf schnellen Zugriff optimierte Datenstruktur, die auf die eigentlichen Datensätze zeigt. Redundant bedeutet: Die Daten existieren auch ohne den Index – er beschleunigt nur den Zugriff.

Ohne Index: Jede Suche ist ein Full Table Scan – O(n) Seitenzugriffe.  
Mit Index: Direkter Einstieg in die relevanten Seiten – im besten Fall O(log n) oder O(1).

Der Trade-off: Indizes kosten Speicherplatz und verlangsamen Schreiboperationen (jeder Insert/Update/Delete muss den Index mitpflegen). Ein Index ist dann sinnvoll, wenn Leseanfragen häufiger sind als Schreiboperationen und die Selektivität der Anfrage hoch genug ist.

---

## 4. Anfragetypen auf Indexstrukturen

Welche Operationen muss ein Index effizient unterstützen?

| Anfragetyp | Beschreibung | Beispiel |
|---|---|---|
| **Punktanfrage** | Exakter Schlüsselwert | `WHERE id = 42` |
| **Bereichsanfrage** | Schlüssel in Intervall | `WHERE alter BETWEEN 20 AND 30` |
| **Präfixanfrage** | Schlüssel beginnt mit | `WHERE name LIKE 'Mül%'` |
| **Nächste-Nachbar** | Nächster Wert zum Suchschlüssel | Nur bei geordneten Strukturen |
| **Phrasenanfrage** | Sequenz von Wörtern | Volltextindex |

Nicht jede Indexstruktur unterstützt alle Typen. Hash-Indizes können nur Punktanfragen; B+-Bäume unterstützen alle außer Volltext.

---

## 5. Klassifikationen von Indexstrukturen

### Primär- vs. Sekundärindex

- **Primärindex** (geclusterter Index): Die physische Reihenfolge der Datensätze entspricht der Indexreihenfolge. Pro Tabelle maximal einer.
- **Sekundärindex** (ungeclusterter Index): Zeigt auf Datensätze, die physisch in beliebiger Reihenfolge liegen. Beliebig viele möglich.

### Dicht vs. dünn (Dense vs. Sparse)

- **Dichter Index**: Ein Eintrag pro Datensatz. Kann auch für ungeclusterte Daten funktionieren.
- **Dünner Index**: Ein Eintrag pro Seite (oder Block). Nur bei geclusterten Daten sinnvoll, weil man innerhalb der Seite noch linear suchen muss. Kleinerer Index, aber ein zusätzlicher Suchschritt.

### Einstufig vs. mehrstufig

Bei großen Tabellen wird auch der Index selbst groß. Lösung: Ein Index auf den Index – mehrstufige Indexstruktur. B-Bäume verallgemeinern das elegant.

### Statisch vs. dynamisch

- **Statisch**: Struktur wird einmalig aufgebaut und nicht reorganisiert (z. B. ISAM). Schnell bei stabilen Daten, degeneriert bei Updates.
- **Dynamisch**: Struktur passt sich bei Einfügungen und Löschungen selbst an (B+-Baum, erweiterbares Hashing).

---

## 6. Indexstrukturen für alphanumerische Daten

### 6.1 Index-Sequenzielle Zugriffsmethode (ISAM)

ISAM ist die einfachste mehrstufige Indexstruktur: ein statischer, dünner Index über einer sortierten Datendatei.

```
Index-Ebene:  [10 | 40 | 70]
               ↓     ↓     ↓
Daten-Seiten: [10,15,20] [40,45,55] [70,80,90]
```

Suche: Binärsuche im Index, dann sequenziell in der Datenseite. Einfügungen: Overflow-Chains an die betroffene Seite anhängen. Problem: Overflow-Chains degenerieren über Zeit – der Index muss periodisch rebuild werden. ISAM ist historisch relevant; modern kaum noch eingesetzt.

### 6.2 B-Baum und B+-Baum

Der **B-Baum** (Balanced Tree, Bayer & McCreight 1972) ist die wichtigste Indexstruktur in relationalen DBMS. Alle Blätter haben dieselbe Tiefe – der Baum ist immer balanciert.

Eigenschaften eines B-Baums der Ordnung m:
- Jeder Knoten hat maximal 2m Schlüssel und 2m+1 Kinder.
- Jeder Knoten (außer Wurzel) hat mindestens m Schlüssel.
- Schlüssel und zugehörige Datenwerte können in **jedem** Knoten stehen.

**B+-Baum** (die in der Praxis verwendete Variante):
- Datenwerte (bzw. RIDs) stehen **nur in den Blättern**.
- Innere Knoten enthalten nur Schlüsselkopien zur Navigation.
- Blätter sind als **doppelt verkettete Liste** verbunden → Bereichsanfragen sind effizient (nach dem Einstieg einfach den Blattzeigern folgen).

```
Innere Ebene:     [30 | 60]
                  /    |    \
Blatt-Ebene: [10,20] ↔ [30,50] ↔ [60,70,90]
                ↓↓      ↓↓         ↓↓↓
              RIDs     RIDs       RIDs
```

**Einfügung**: Einfügen ins Blatt. Ist das Blatt voll, wird es gesplittet: Hälfte der Schlüssel geht in ein neues Blatt, der mittlere Schlüssel steigt in den Elternknoten auf. Split kann sich rekursiv bis zur Wurzel fortpflanzen.

**Löschung**: Unterschreitet ein Knoten die Mindestbelegung (m Schlüssel), wird er mit einem Geschwister zusammengeführt (Merge) oder Schlüssel werden umverteilt (Redistribute).

**Kosten**: Bei n Einträgen und Seitengröße B ist die Baumhöhe O(log_B n). Für eine Tabelle mit 10^9 Einträgen und B=200 sind das ~5 Ebenen – also maximal 5 I/Os für eine Punktsuche.

**B\*-Baum**: Variante mit erhöhter Mindestbelegung (2/3 statt 1/2). Bevor ein Knoten gesplittet wird, wird versucht, Schlüssel zum Geschwister umzuverteilen. Führt zu besserer Platzausnutzung.

### 6.3 Hashbasierte Indexstrukturen

Hash-Indizes sind optimal für Punktanfragen – O(1) im Durchschnitt – aber unterstützen keine Bereichsanfragen.

**Statisches Hashing:**  
`h(k) mod N` bestimmt den Bucket. Overflow-Chains wenn Bucket voll. Problem: Bei Wachstum muss der gesamte Index reorganisiert werden (alle Einträge neu hashen).

**Erweiterbares Hashing (Extendible Hashing):**  
Ein globales **Directory** (Tabelle mit 2^d Einträgen) zeigt auf Bucket-Seiten. Wird ein Bucket voll:
1. Der Bucket wird gesplittet (eine neue Seite).
2. Nur das Directory wird ggf. verdoppelt – nicht alle Buckets neu gehasht.
3. Buckets können über Directory-Einträge **geteilt** werden (mehrere Directory-Einträge → ein Bucket).

Das Directory wächst, aber die Buckets selbst werden nur bei Bedarf gesplittet. Kein vollständiges Rehashing mehr.

**Lineares Hashing:**  
Splittet Buckets in einer festen, linearen Reihenfolge, unabhängig davon, welcher Bucket voll ist. Kein Directory nötig. Der Split-Zeiger `p` wandert linear durch die Buckets:
- Aktuelle Hashfunktion: `h(k) = k mod N`.
- Ist der errechnete Bucket schon gesplittet worden? Dann stattdessen `h'(k) = k mod 2N` verwenden.
- Nach einem vollständigen Durchlauf: N verdoppelt, p zurücksetzen.

Vorteil: Kein Directory-Overhead, gleichmäßiges Wachstum. Nachteil: Temporäre Overflow-Chains möglich.

**Dynamisches Hashing:**  
Oberbegriff für Verfahren, die die Hashtabelle dynamisch anpassen. Erweiterbares und lineares Hashing sind die wichtigsten Vertreter.

---

## Zusammenfassung

| Konzept | Kernaussage |
|---|---|
| Segment | Logische Verwaltungseinheit aus Seiten; 1 Tabelle/Index = 1 Segment |
| Schattenspeicher | Indirekte Einbringung ohne WAL; heute kaum verwendet |
| Steal/No-Force | Praxisstandard; ermöglicht freie Pufferersetzung mit WAL als Sicherheitsnetz |
| LRU-K / Clock | Bessere Ersetzungsstrategien als naives LRU; Strategie hängt vom Workload ab |
| Dicht vs. dünn | Dichter Index = ein Eintrag pro Datensatz; dünner = ein Eintrag pro Seite |
| B+-Baum | Standard-Indexstruktur; balanciert, Blattliste für Bereichsanfragen, O(log_B n) |
| Erweiterbares Hashing | Dynamisches Wachstum ohne vollständiges Rehashing; Directory als Indirektion |
| Lineares Hashing | Kein Directory; gleichmäßiges Wachstum durch linearen Split-Pointer |
