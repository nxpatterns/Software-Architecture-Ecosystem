# Lektion 3: Geometrische Indexstrukturen, Externes Sortieren, Auswertung relationaler Pläne

---

## 1. Alphanumerische vs. geometrische Daten

Alphanumerische Daten (Zahlen, Strings) haben eine **totale Ordnung**: Für zwei Werte a, b gilt immer entweder a < b, a = b oder a > b. Das ist die Grundvoraussetzung für B+-Bäume und Hashing.

Geometrische Daten (Punkte, Linien, Rechtecke, Polygone im 2D- oder höherdimensionalen Raum) haben **keine totale Ordnung**. Es gibt keine sinnvolle Antwort auf die Frage "liegt Punkt (3,7) vor oder nach Punkt (5,2)?". Damit fallen alle auf totaler Ordnung basierenden Indexstrukturen weg.

Zusätzlich unterscheiden sich die relevanten **Anfragetypen**:

| Anfragetyp | Alphanumerisch | Geometrisch |
|---|---|---|
| Punktanfrage | `WHERE id = 42` | Liegt ein Punkt an Position (x,y)? |
| Bereichsanfrage | `WHERE x BETWEEN 10 AND 20` | Welche Objekte liegen im Rechteck R? |
| Nächster Nachbar | Nächster Wert im Index | Welches Objekt liegt am nächsten zu Punkt p? |
| Spatial Join | – | Welche Objekte aus A überlappen mit Objekten aus B? |
| Enthaltensein | – | Liegt Punkt p innerhalb Polygon Q? |

Geometrische Indexstrukturen müssen **mehrdimensionale Nähe** und **Überlappung** effizient verwalten – Konzepte, die es in 1D nicht gibt.

---

## 2. Geometrische Anfragetypen im Detail

**Window Query (Fensteranfrage):** Finde alle Objekte, die ein gegebenes Rechteck (das "Fenster") schneiden oder darin enthalten sind. Klassische GIS-Anfrage.

**Nearest-Neighbor-Anfrage:** Finde das Objekt, das einem Anfragepunkt am nächsten liegt. Relevant für Routing, Ähnlichkeitssuche, maschinelles Lernen (k-NN).

**Spatial Join:** Verknüpfe zwei Mengen geometrischer Objekte nach einem räumlichen Kriterium (überlappen, enthalten, berühren). Analog zum relationalen Join, aber das Join-Prädikat ist räumlich.

---

## 3. Geometrische Indexstrukturen

### 3.1 Eindimensionale Einbettungen

Idee: Geometrische Objekte auf eine Zahl abbilden, dann normalen 1D-Index verwenden.

**Z-Kurve (Morton-Code):** Koordinaten bitweise verschränken. Punkt (x=5, y=3) in binär: x=101, y=011 → Z-Code = 100111 (bits verschränkt: x0 y0 x1 y1 x2 y2). Die Z-Kurve erhält **räumliche Lokalität** näherungsweise: Benachbarte Punkte im 2D-Raum haben oft ähnliche Z-Codes.

**Hilbert-Kurve:** Raumfüllende Kurve mit besserer Lokalitätserhaltung als Z-Kurve. Hilbert-benachbarte Punkte sind häufiger auch räumlich benachbart.

**Problem beider Ansätze:** Die Lokalitätserhaltung ist unvollständig. Punkte, die räumlich nahe sind, können sehr unterschiedliche 1D-Codes haben (besonders an Kurvenumbrüchen). Bereichsanfragen können viele falsche Kandidaten liefern, die nachträglich gefiltert werden müssen. Das macht eindimensionale Einbettungen zu einer Näherungslösung, nicht zu einer exakten Indexstruktur.

### 3.2 Indexstrukturen für Punktmengen

#### Grid-File

Der 2D-Raum wird durch ein **Gitter** aus horizontalen und vertikalen Linien in Zellen aufgeteilt. Jede Zelle zeigt auf eine Bucket-Seite. Mehrere Zellen können auf denselben Bucket zeigen (ähnlich wie beim erweiterbaren Hashing).

```
     x₁  x₂
  ┌───┬───┬───┐
y₁│ A │ B │ B │
  ├───┼───┼───┤
y₂│ C │ C │ D │
  └───┴───┴───┘
```

Bucket B enthält Punkte aus zwei Zellen. Bei Overflow wird eine neue Gitternlinie eingezogen – das splittet genau eine Zeile oder Spalte, was alle Buckets dieser Zeile/Spalte betrifft.

**Vorteil:** Direkte Zelladressierung, effizient für gleichmäßige Datenverteilung.  
**Nachteil:** Bei ungleichmäßiger Verteilung (Cluster) entstehen viele leere Zellen und wenige überfüllte. Das Gitter passt sich nicht adaptiv an Dichteschwankungen an.

#### k-d-b-Baum

Kombination aus k-d-Baum (adaptiver Raumaufteilung) und B-Baum (plattenoptimierte Seitenstruktur).

Die Idee des k-d-Baums: Abwechselnd entlang verschiedener Dimensionen splitten. Auf Ebene 0 wird entlang x gesplittet, auf Ebene 1 entlang y, auf Ebene 2 wieder entlang x, usw. Der Splitpunkt wird adaptiv gewählt (z. B. Median der Punkte), wodurch der Baum die Datendichte berücksichtigt.

Der k-d-b-Baum verpackt das in eine B-Baum-artige Seitenstruktur: Mehrere Splitentscheidungen pro Knoten, balancierte Tiefe, optimale Seitenauslastung.

**Vorteil gegenüber Grid-File:** Adaptiv an Datenverteilung. Dichte Cluster führen zu feinerer Aufteilung genau dort wo nötig.  
**Nachteil:** Split-Operationen können sich über mehrere Knoten fortpflanzen (ähnlich wie beim B+-Baum).

### 3.3 Indexstrukturen für Rechteckmengen

Punkte sind der Sonderfall. In der Praxis haben geometrische Objekte **Ausdehnung**: Straßenabschnitte, Gebäudeumrisse, Regionen. Diese lassen sich schlecht in ein Gitter einsortieren, weil ein Objekt mehrere Zellen überspannen kann.

#### R-Baum (Guttman 1984)

Der R-Baum ist die wichtigste Indexstruktur für ausgedehnte Objekte. Grundidee: Jeder Knoten entspricht einem **Minimum Bounding Rectangle (MBR)** – dem kleinsten achsenparallelen Rechteck, das alle Objekte des Teilbaums umschließt.

```
Wurzel:   [MBR_links | MBR_rechts]
           /                \
Intern:  [MBR_A | MBR_B]   [MBR_C]
          /     \               \
Blätter: [obj1,obj2] [obj3]   [obj4,obj5]
```

**Einfügung:** Das neue Objekt wird in den Knoten eingefügt, dessen MBR am wenigsten vergrößert werden muss (**least enlargement**). MBRs werden nach oben aktualisiert.

**Split bei Overflow:** Welche Objekte gehen in welchen neuen Knoten? Das ist das Kernproblem des R-Baums, weil es keine eindeutige Antwort gibt. Guttman schlägt mehrere Heuristiken vor:
- **Linear Split:** Schnell, aber schlechte MBR-Qualität.
- **Quadratic Split:** Wählt das Paar mit größtem "Verschwendungsrechteck" als Startsaaten, weist restliche Objekte greedy zu.
- **Exhaustive Split:** Optimal, aber exponentiell teuer.

**Problem:** MBRs können sich **überlappen**. Bei einer Fensteranfrage können mehrere Kindknoten in Frage kommen, alle müssen traversiert werden. Im schlimmsten Fall degeneriert die Suche auf O(n).

#### R+-Baum

Lösung für das Überlappungsproblem: **Keine Überlappung zwischen Knoten-MBRs auf derselben Ebene erlaubt**.

Konsequenz: Ein Objekt, das mehrere MBRs überspannen würde, wird **in mehrere Teile aufgeteilt** und in allen betroffenen Teilbäumen gespeichert (Redundanz).

**Vorteil:** Punktanfragen besuchen exakt einen Pfad – keine überlappenden Kandidaten.  
**Nachteil:** Objekte können mehrfach gespeichert sein. Updates sind aufwändiger. Der Baum kann größer werden als der R-Baum.

| Eigenschaft | R-Baum | R+-Baum |
|---|---|---|
| MBR-Überlappung | erlaubt | verboten |
| Objektredundanz | keine | möglich |
| Punktanfrage | mehrere Pfade möglich | exakt ein Pfad |
| Fensterfrage | effizient | effizient |
| Update | einfacher | aufwändiger |

---

## 4. Externes Sortieren

### Warum intern sortieren nicht reicht

Internes Sortieren (Quicksort, Heapsort, ...) setzt voraus, dass alle Daten im RAM liegen. Bei Datenbanken ist das nicht der Fall: Eine Tabelle mit 100 GB passt nicht in 16 GB RAM.

**Externes Sortieren** arbeitet mit einem begrenzten Puffer (B Seiten im RAM) und sortiert Daten, die auf dem Speicher liegen. Das Ziel ist die Minimierung der I/O-Operationen.

Interner vs. externer Sort im Vergleich:

| Kriterium | Intern | Extern |
|---|---|---|
| Daten im RAM | vollständig | nur Puffer (B Seiten) |
| Komplexität | O(n log n) Vergleiche | O(n/B · log_{B}(n/B)) I/Os |
| Algorithmus | Quicksort, Heapsort | External Mergesort |

### External Mergesort: Grundvariante (2-Wege)

**Phase 1 – Runs erzeugen:**  
Lade B Seiten in den RAM, sortiere intern, schreibe als **Run** zurück auf die Platte. Wiederhole für alle Seiten. Ergebnis: ⌈n/B⌉ sortierte Runs, jeder B Seiten groß.

**Phase 2 – Merging:**  
Merje immer 2 Runs zu einem größeren. Nach k Merge-Runden hat man 1 sortierten Run.

Anzahl Merge-Runden: ⌈log₂(⌈n/B⌉)⌉

Gesamtkosten: O(n · log(n/B)) I/Os – jede Seite wird pro Runde einmal gelesen und einmal geschrieben.

### k-Wege-Mergesort (allgemeine Variante)

Statt immer 2 Runs zu mergen, mergt man **k Runs gleichzeitig**. Mit B Seiten Puffer: 1 Seite als Ausgabepuffer, also k = B-1 Eingabe-Runs gleichzeitig.

**Phase 1:** Erzeuge Runs der Größe B (wie oben).  
**Phase 2:** Merje jeweils B-1 Runs gleichzeitig.

Anzahl Merge-Runden: ⌈log_{B-1}(⌈n/B⌉)⌉

Für B=100 und n=1.000.000 Seiten: ⌈log₉₉(10.000)⌉ = 2 Runden. Mit 2-Wege-Merge wären es 14 Runden. Der Vorteil ist enorm.

### Replacement Selection (größere initiale Runs)

Statt B Seiten im RAM zu sortieren und als Run zu schreiben, kann man mit einem **Priority Queue (Heap)** größere Runs erzeugen:

1. Fülle Heap mit B Seiten.
2. Schreibe immer das kleinste Element raus.
3. Lese neues Element ein. Ist es ≥ letztem Output? In denselben Run. Ist es kleiner? Markiere es für den nächsten Run.
4. Wenn alle aktiven Elemente für nächsten Run markiert sind, schließe Run ab.

Im Durchschnitt (zufällige Eingabe) erzeugt Replacement Selection Runs der Größe **2B** statt B. Das reduziert die initiale Runzahl und damit die Merge-Runden.

### Double Buffering

Während der CPU einen Eingabepuffer verarbeitet (mergt), wird der nächste Eingabepuffer asynchron von der Platte geladen. I/O und Berechnung überlappen sich – die Wartezeit auf I/O fällt weg. Kosten: Doppelt so viele Puffer nötig, also effektiv k = ⌊B/2⌋ - 1 statt B-1 gleichzeitige Runs.

---

## 5. Anfrageoptimierer und Ausführungssystem

### Trennung von Optimierung und Ausführung

Der **Optimierer** arbeitet zur Compilezeit der Anfrage: Er nimmt einen logischen Plan (was soll berechnet werden) und erzeugt einen physischen Plan (wie soll es berechnet werden). Der physische Plan ist die Eingabe für das **Ausführungssystem**.

```
SQL-Text
    ↓
Parser → Syntaxbaum
    ↓
Logischer Plan (relationale Algebra, unoptimiert)
    ↓
Optimierer (algebraische Umformung + Kostenschätzung)
    ↓
Physischer Plan (konkrete Algorithmen, Indexnutzung)
    ↓
Ausführungssystem (Iterator-Modell)
    ↓
Ergebnis
```

### Logischer vs. physischer Plan

**Logischer Plan:** Ausgedrückt in relationaler Algebra. Operatoren sind abstrakt: σ (Selektion), π (Projektion), ⋈ (Join). Kein Bezug auf Indexe oder Algorithmen.

**Physischer Plan:** Jeder logische Operator ist durch einen konkreten Algorithmus ersetzt:
- σ → Index-Scan oder Full-Table-Scan
- ⋈ → Nested-Loop-Join, Sort-Merge-Join oder Hash-Join
- ORDER BY → External Sort oder Index-Scan auf sortiertem Index

Derselbe logische Plan kann viele verschiedene physische Pläne haben – der Optimierer wählt den mit den niedrigsten geschätzten Kosten.

### Das Iterator-Modell (Volcano/Pipeline-Modell)

Jeder physische Operator implementiert drei Methoden:
- `open()`: Initialisierung.
- `next()`: Liefere den nächsten Ergebnistupel.
- `close()`: Aufräumen.

Operatoren werden zu einem **Baum** zusammengesetzt. Der Wurzeloperator ruft `next()` am Kindoperator auf, der seinerseits seinen Kindern `next()` schickt – bis die Blätter (Scans) Tupel von der Platte liefern.

```
       π (Projektion)
       │  next()
       ↓
       σ (Selektion)
       │  next()
       ↓
    Seq-Scan (Tabelle)
```

**Vorteil:** Pipelined Execution – Tupel fließen von unten nach oben, ohne dass Zwischenergebnisse vollständig materialisiert werden müssen. Ein Tupel kann den ganzen Plan durchlaufen, bevor das nächste gelesen wird. Niedriger Speicherbedarf.

**Ausnahme:** Manche Operatoren sind **blockierend** – sie können `next()` erst beantworten, wenn sie alle Eingabetupel gesehen haben. Beispiele: Sort, Hash-Join (Aufbauphase), Aggregation. Diese Operatoren unterbrechen die Pipeline und materialisieren ihr Ergebnis.

### Algorithmen für relationale Operatoren

#### Selektion (σ)

- **Full Table Scan:** Lese alle Seiten, filtere. O(n) I/Os. Immer möglich.
- **Index-Scan (geclustert):** Navigiere im B+-Baum zum ersten Treffer, lese Blattseiten sequenziell. O(log n + k/B) I/Os für k Treffer.
- **Index-Scan (ungeclustert):** Wie oben, aber jeder Treffer kann auf einer anderen Datenseite liegen. Im schlimmsten Fall O(k) I/Os – teurer als Full Scan bei hoher Selektivität.

#### Projektion (π)

Ohne Duplikateliminierung: trivial, einfach Spalten weglassen.  
Mit Duplikateliminierung (DISTINCT): Sortiere das Ergebnis, dann entferne aufeinanderfolgende Duplikate. Alternativ: Hash-basierte Duplikateliminierung.

#### Join (⋈)

**Nested-Loop-Join (NLJ):**  
```
for each tuple r in R:
    for each tuple s in S:
        if r.key == s.key: output(r,s)
```
Kosten: O(|R| · |S|) I/Os. Nur bei sehr kleinen Relationen oder vorhandenem Index auf S akzeptabel.

**Block-Nested-Loop-Join:**  
Statt Tupel-für-Tupel wird seitenweise geladen. Für jeden Block von R werden alle Seiten von S einmal gelesen. Kosten: O(|R| + ⌈|R|/B⌉ · |S|) I/Os.

**Sort-Merge-Join:**  
Sortiere R und S nach dem Join-Attribut, dann merge beide sortierten Folgen. Kosten: Sortierkosten + O(|R| + |S|). Effizient wenn Daten bereits sortiert oder ein sortierter Index vorhanden ist.

**Hash-Join:**  
Phase 1 (Build): Hashe alle Tupel von R in einen Hash-Table im RAM (oder partitioniere auf Platte wenn R > RAM).  
Phase 2 (Probe): Lese S, hashe jedes Tupel, suche Treffer im Hash-Table.  
Kosten: O(|R| + |S|) I/Os wenn R in den Puffer passt. Optimal für große Equi-Joins.

| Algorithmus | Kosten (grob) | Gut wenn |
|---|---|---|
| NLJ | O(\|R\|·\|S\|) | Index auf S vorhanden |
| Block-NLJ | O(\|R\| + \|R\|/B·\|S\|) | Kein Index, kleine Relationen |
| Sort-Merge | O(sort + \|R\|+\|S\|) | Daten schon sortiert, Range-Joins |
| Hash-Join | O(\|R\|+\|S\|) | Equi-Join, große Relationen |

---

## Zusammenfassung

| Konzept | Kernaussage |
|---|---|
| Geometrische Daten | Keine totale Ordnung; Überlappung und Nähe sind die relevanten Eigenschaften |
| Grid-File | Reguläres Gitter; effizient bei gleichmäßiger Verteilung, schlecht bei Clustern |
| k-d-b-Baum | Adaptiver Raumsplit; berücksichtigt Datendichte |
| R-Baum | MBRs hierarchisch; Überlappung möglich, Suche kann mehrere Pfade besuchen |
| R+-Baum | Keine MBR-Überlappung; Objekte ggf. redundant gespeichert |
| Externes Sortieren | k-Wege-Mergesort; Kosten O(n · log_{B}(n/B)) I/Os |
| Replacement Selection | Erzeugt im Durchschnitt doppelt so große initiale Runs |
| Iterator-Modell | Pipeline von `next()`-Aufrufen; blockierende Operatoren unterbrechen die Pipeline |
| Hash-Join | Optimal für Equi-Joins; O(\|R\|+\|S\|) wenn Build-Relation in den Puffer passt |
