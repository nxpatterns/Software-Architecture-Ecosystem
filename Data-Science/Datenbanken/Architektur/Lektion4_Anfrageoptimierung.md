# Lektion 4: Anfrageoptimierung – Berechnung eines effizienten Plans

---

## 1. Interndarstellung als Operatorbaum

Wenn das DBMS eine SQL-Anfrage bekommt, übersetzt der Parser sie zunächst in einen **Operatorbaum** (auch: Anfragebaum, Query Tree). Das ist eine Baumstruktur, in der:

- **Blätter** die Basisrelationen (Tabellen) sind
- **Innere Knoten** relationale Operatoren sind (σ, π, ⋈, ...)
- Der **Wurzelknoten** das Endergebnis liefert
- Datenfluss **von unten nach oben** geht

### Beispiel

```sql
SELECT k.name, b.datum
FROM kunden k, bestellungen b
WHERE k.id = b.kid AND k.stadt = 'Wien'
```

Naiver Operatorbaum (unoptimiert):

```
        π (name, datum)
            │
        σ (stadt = 'Wien')
            │
        σ (k.id = b.kid)
            │
          ⋈ (Kreuzprodukt)
          / \
    kunden  bestellungen
```

Das Kreuzprodukt aller Kunden × aller Bestellungen, dann gefiltert – sehr teuer. Der Optimierer wird das umformen.

---

## 2. Techniken des Übersetzerbaus

Die Anfrageoptimierung borgt sich mehrere Konzepte aus dem klassischen Compilerbau:

**Parsing und Syntaxanalyse:** SQL wird in einen Syntaxbaum (Parse Tree) überführt – analog zum Parsen von Programmiersprachen. Grammatikregeln definieren, was gültiges SQL ist.

**Semantische Analyse:** Sind alle referenzierten Tabellen und Attribute vorhanden? (Systemkatalog als Symboltabelle.) Typüberprüfung der Ausdrücke.

**Zwischencode-Darstellung:** Der Operatorbaum in relationaler Algebra ist die Zwischenrepräsentation – analog zum IR (Intermediate Representation) in einem Compiler. Optimierungen passieren auf dieser Ebene, nicht auf dem SQL-Text.

**Regelbasierte Transformationen:** Algebraische Umformungen werden als Rewrite-Regeln formuliert – dasselbe Prinzip wie Peephole-Optimierungen im Compilerbau.

**Code-Generierung:** Aus dem physischen Plan wird ausführbarer "Code" – konkrete Operatorinstanzen mit gebundenen Algorithmen und Parametern.

Der wesentliche Unterschied zum klassischen Compiler: Ein Compiler optimiert für Laufzeit, ein DBMS-Optimierer optimiert für **I/O-Kosten** – und das zur Anfragezeit, nicht zur Compilezeit des Programms.

---

## 3. Standardisierung und Vereinfachung von Prädikaten

Bevor algebraische Optimierung greift, werden Prädikate in eine Normalform gebracht. Das ist keine Performance-Optimierung an sich, sondern eine Voraussetzung dafür, dass Optimierungsregeln überhaupt zuverlässig angewendet werden können.

### Konjunktive Normalform (CNF)

Prädikate werden in **konjunktive Normalform** überführt: eine AND-Verknüpfung von Klauseln, wobei jede Klausel eine OR-Verknüpfung von Literalen ist.

```
(A OR B) AND (C OR D) AND E
```

**Warum CNF?** Selektionen können dann als einzelne Konjunkte behandelt werden. Jedes Konjunkt kann unabhängig auf Indexnutzung geprüft werden.

### Vereinfachungen

- **Konstante Prädikate eliminieren:** `WHERE 1=1` → immer wahr, entfernen. `WHERE 0=1` → Ergebnis leer, Query sofort beantworten.
- **Redundante Prädikate entfernen:** `WHERE x > 5 AND x > 3` → nur `x > 5` behalten.
- **Transitivitätsschlüsse ziehen:** `WHERE a.id = b.id AND b.id = c.id` → impliziert `a.id = c.id`. Das ermöglicht zusätzliche Selektionen.
- **Typkoerzionen auflösen:** `WHERE int_col = '42'` → Typumwandlung explizit machen, damit der Optimierer korrekte Selektivitätsschätzungen berechnen kann.

---

## 4. Entschachtelung von Anfragen (Unnesting)

SQL erlaubt **verschachtelte Unteranfragen** (Subqueries). Das Problem: Ein naiver Ausführungsplan würde die Unteranfrage für jedes Tupel der äußeren Anfrage neu auswerten – ähnlich wie ein Nested-Loop-Join.

```sql
SELECT name FROM kunden k
WHERE k.id IN (
    SELECT kid FROM bestellungen WHERE betrag > 100
)
```

Naiv: Für jeden Kunden wird die Unteranfrage einmal ausgeführt. Bei 100.000 Kunden und 1.000.000 Bestellungen → katastrophal.

### Entschachtelungsstrategien

**Korrelierte vs. unkorrelierte Unteranfragen:**
- *Unkorrelliert*: Die Unteranfrage hängt nicht von der äußeren Anfrage ab. Sie wird einmal ausgewertet, das Ergebnis zwischengespeichert. Einfach.
- *Korreliert*: Die Unteranfrage referenziert Attribute der äußeren Anfrage (`WHERE b.kid = k.id`). Muss potenziell für jedes äußere Tupel neu ausgewertet werden.

**Umformung in Join:** Viele korrelierte Unteranfragen lassen sich in einen äquivalenten Join umschreiben:

```sql
-- Vorher (Unteranfrage):
SELECT name FROM kunden k
WHERE k.id IN (SELECT kid FROM bestellungen WHERE betrag > 100)

-- Nachher (Join, äquivalent):
SELECT DISTINCT k.name
FROM kunden k JOIN bestellungen b ON k.id = b.kid
WHERE b.betrag > 100
```

Der Optimierer kann jetzt alle Join-Algorithmen anwenden, statt die Unteranfrage als Black Box zu behandeln.

**EXISTS und NOT EXISTS:** Ähnliche Umformung. `NOT EXISTS` ist besonders heikel – nicht jede Umformung in einen Outer Join ist korrekt, wenn NULLs im Spiel sind.

---

## 5. Algebraische Optimierung

### Motivation

Derselbe SQL-Query kann durch viele verschiedene algebraische Ausdrücke korrekt dargestellt werden. Die Ausdrücke sind semantisch äquivalent, aber ihre Auswertungskosten können sich um Größenordnungen unterscheiden.

Das Ziel der algebraischen Optimierung: Den äquivalenten Ausdruck mit niedrigsten erwarteten Kosten finden – **ohne den Suchraum vollständig zu durchsuchen** (der ist exponentiell groß).

### Wichtige Äquivalenzregeln

**Selektionen sind kommutativ:**
```
σ_p1(σ_p2(R)) ≡ σ_p2(σ_p1(R))
```

**Selektion kann durch Joins hindurchgezogen werden** (Selection Pushdown):
```
σ_p(R ⋈ S) ≡ σ_p(R) ⋈ S    (wenn p nur Attribute von R betrifft)
```
Das ist die wichtigste Regel: Selektionen so früh wie möglich anwenden, um die Zwischenergebnisse klein zu halten.

**Joins sind kommutativ und assoziativ:**
```
R ⋈ S ≡ S ⋈ R
(R ⋈ S) ⋈ T ≡ R ⋈ (S ⋈ T)
```
Das erlaubt die Umsortierung der Join-Reihenfolge – der größte Hebel bei Multi-Table-Queries.

**Projektion kann vorgezogen werden** (Projection Pushdown):
```
π_A(R ⋈ S) ≡ π_A(π_{A∪B}(R) ⋈ π_{A∪C}(S))
```
Unwichtige Spalten so früh wie möglich entfernen, um Tupelgröße zu reduzieren.

**Selektion vor Kreuzprodukt = Join:**
```
σ_{R.id=S.id}(R × S) ≡ R ⋈_{R.id=S.id} S
```
Ein Kreuzprodukt mit anschließender Selektion wird zum Join – und kann mit effizienten Join-Algorithmen ausgeführt werden.

### Algorithmus für algebraische Optimierung

1. **Parse** SQL → Syntaxbaum → initialer Operatorbaum (mit Kreuzprodukten statt Joins).
2. **Dekomponiere** Selektionen in einzelne Konjunkte (ein σ pro Konjunkt).
3. **Selektion pushdown**: Schiebe jede Selektion so weit wie möglich nach unten (zur Quelle der referenzierten Attribute).
4. **Joins erkennen**: Kombiniere Kreuzprodukte mit zugehörigen Selektionen zu Join-Operatoren.
5. **Projektion pushdown**: Entferne Attribute, die weiter oben nicht mehr gebraucht werden, so früh wie möglich.
6. **Join-Reihenfolge**: Wähle eine sinnvolle Reihenfolge (einfache Heuristik: kleine Relationen zuerst, oder hochselektive Joins zuerst).

Das Ergebnis ist ein **logisch optimierter Plan** – noch ohne konkrete Algorithmen.

---

## 6. Kostenschätzung

### Warum schätzen statt exakt berechnen?

Die exakten Kosten eines Plans hängen von den tatsächlichen Daten ab – die kennen wir erst zur Laufzeit. Der Optimierer arbeitet zur Anfragezeit mit **Statistiken aus dem Systemkatalog**.

### Was wird geschätzt?

- **Kardinalität** (Anzahl Tupel im Ergebnis): Bestimmt, wie groß Zwischenergebnisse sind.
- **I/O-Kosten**: Basierend auf Kardinalität und gewähltem Algorithmus.
- **CPU-Kosten**: Vergleiche, Hashing – meist vernachlässigt oder als kleiner Faktor behandelt.

### Selektivität

Die **Selektivität** eines Prädikats p gibt an, welcher Anteil der Tupel das Prädikat erfüllt:

```
sel(p) = |σ_p(R)| / |R|    ∈ [0, 1]
```

Selektivität 0 = kein Tupel überlebt. Selektivität 1 = alle Tupel überleben.

**Schätzung der Selektivität:**

| Prädikatstyp | Standardschätzung (ohne Histogramm) |
|---|---|
| `attr = wert` | 1 / NDV(attr)   (NDV = Number of Distinct Values) |
| `attr < wert` | (wert - min) / (max - min) |
| `attr BETWEEN a AND b` | (b - a) / (max - min) |
| Konjunktion (AND) | sel(p1) × sel(p2)   (Unabhängigkeitsannahme) |
| Disjunktion (OR) | sel(p1) + sel(p2) - sel(p1) × sel(p2) |

**Kardinalitätsschätzung nach Selektion:**
```
|σ_p(R)| ≈ sel(p) × |R|
```

**Kardinalitätsschätzung nach Join:**
```
|R ⋈ S| ≈ |R| × |S| / max(NDV(R.key), NDV(S.key))
```

### Histogramme

Gleichverteilungsannahmen sind oft falsch. Reale Daten sind schief verteilt (Pareto, Zipf). Der Katalog speichert daher **Histogramme**: Die Werteverteilung eines Attributs wird in Buckets eingeteilt, jeder Bucket enthält Häufigkeitsinformation.

Mit Histogramm kann die Selektivität von `stadt = 'Wien'` viel genauer geschätzt werden als mit 1/NDV – Wien ist in Österreich überrepräsentiert im Vergleich zu einem gleichverteilten Erwartungswert.

---

## 7. Algorithmus von Selinger et al. (System R, 1979)

Der Selinger-Algorithmus ist der klassische Algorithmus zur **kostenbasierten Plangenerierung** und bildet die Grundlage praktisch aller modernen SQL-Optimierer.

### Grundidee: Dynamische Programmierung über Joins

Das Problem: Bei n Tabellen gibt es n! mögliche Join-Reihenfolgen (plus verschiedene Algorithmen pro Join). Das ist nicht exhaustiv durchsuchbar.

Selingers Ansatz: **Bottom-up Dynamic Programming.**

1. Berechne den optimalen Plan für jede einzelne Tabelle (Zugriffspfade: Full Scan oder Index).
2. Berechne den optimalen Plan für jedes Tabellenpaar, basierend auf den Einzel-Plänen.
3. Berechne den optimalen Plan für jedes Tripel, basierend auf Paaren.
4. ... bis zum optimalen Plan für alle n Tabellen.

**Subplan-Wiederverwendung:** Wenn der optimale Plan für {R, S} bekannt ist, wird er beim Aufbau von {R, S, T} wiederverwendet – statt nochmal neu berechnet. Das ist das Prinzip der Dynamischen Programmierung: optimale Teilprobleme kombinieren.

**Suchraum:** Statt n! Reihenfolgen werden nur **Left-Deep Trees** betrachtet (der linke Operand eines Joins ist immer ein Basisrelation oder bereits berechnetes Ergebnis, nicht ein weiterer Join). Das reduziert den Suchraum auf n! / 2^(n-1) ≈ O(n · 2^n) – immer noch exponentiell, aber in der Praxis für n ≤ 10–15 Tabellen handhabbar.

```
Left-Deep Tree (erlaubt):     Bushy Tree (nicht betrachtet):
      ⋈                              ⋈
     / \                            / \
    ⋈   T                          ⋈   ⋈
   / \                            / \ / \
  ⋈   S                          R  S T  U
 / \
R   ...
```

### Zugriffspfade (Access Paths)

Für jede Basistabelle werden alle möglichen **Zugriffspfade** bewertet:
- Sequential Scan (immer möglich)
- Index-Scan für jeden vorhandenen Index

Pro Zugriffspfad werden Kosten und die erzeugte **Sortierreihenfolge** (falls vorhanden) notiert.

---

## 8. Interessante Sortierungen (Interesting Orders)

### Das Problem

Normalerweise würde man für jeden Teilplan nur den **günstigsten** behalten und alle anderen verwerfen. Aber manchmal ist ein teurerer Plan trotzdem vorzuziehen – weil seine Ausgabe eine nützliche Eigenschaft hat.

### Definition

Eine **interessante Sortierung** ist eine Sortierreihenfolge der Ausgabe eines Teilplans, die von einem späteren Operator ausgenutzt werden kann:

- Ein `ORDER BY`-Attribut weiter oben im Plan
- Ein Join-Attribut, das einen Sort-Merge-Join ermöglicht (ohne explizites Sortieren)
- Ein `GROUP BY`-Attribut

### Beispiel

Zwei Pläne für den Teilplan {Kunden}:

| Plan | Kosten | Ausgabe |
|---|---|---|
| Sequential Scan | 100 I/Os | unsortiert |
| Index-Scan auf `stadt` | 150 I/Os | sortiert nach `stadt` |

Naiv würde man Sequential Scan wählen. Aber wenn weiter oben ein `ORDER BY stadt` kommt, spart der Index-Scan die Sortierkosten (z. B. 200 I/Os). Gesamtkosten: 150 vs. 100 + 200 = 300. Der "teurere" Plan gewinnt.

### Konsequenz für den Algorithmus

Selinger behält pro Teilplan nicht nur den günstigsten Plan, sondern **einen Plan pro interessanter Sortierung** plus den günstigsten unsortierten Plan. Das erhöht den Suchraum moderat, verhindert aber, dass global optimale Pläne verworfen werden.

Das Konzept verallgemeinert sich zu **interessanten Eigenschaften** (Interesting Properties): jede Eigenschaft eines Zwischenergebnisses, die von einem späteren Operator ausgenutzt werden kann.

---

## 9. Teure Prädikate

### Das Problem

Nicht alle Prädikate sind gleich teuer auszuwerten. Klassische Fälle:

- **User-Defined Functions (UDFs):** `WHERE meine_funktion(x) > 0` – die Funktion ist eine Black Box, kann beliebig teuer sein.
- **LIKE mit führendem Wildcard:** `WHERE name LIKE '%müller%'` – kein Index nutzbar, volle String-Evaluation pro Tupel.
- **Räumliche Prädikate:** `WHERE ST_Contains(polygon, punkt)` – geometrische Berechnung.
- **Reguläre Ausdrücke:** `WHERE text REGEXP '...'`

### Behandlung

**Zwei-Stufen-Auswertung (Filter + Refine):**

1. **Filter-Stufe:** Günstiges, approximatives Prädikat anwenden, das zu viele Kandidaten liefert (falsche Positive erlaubt, keine falschen Negativen). Zum Beispiel: Window Query mit MBR statt exakter geometrischer Containment-Test.
2. **Refine-Stufe:** Teures, exaktes Prädikat nur auf die Kandidaten der Filter-Stufe anwenden.

**Reihenfolge der Prädikate:** Wenn mehrere Prädikate vorhanden sind, sollten die selektivsten und günstigsten zuerst ausgewertet werden. Das minimiert die Anzahl der Tupel, auf die teure Prädikate angewendet werden müssen.

Formal: Reihe Prädikate nach **(1 - Selektivität) / Kosten** ab – das ist das Nutzen-Kosten-Verhältnis der Filterung.

---

## Zusammenfassung

| Konzept | Kernaussage |
|---|---|
| Operatorbaum | SQL wird in Baum aus relationalen Operatoren übersetzt; Optimierung auf diesem Baum |
| Übersetzerbau-Techniken | Parsing, semantische Analyse, IR-Transformation, Code-Generierung |
| Prädikats-Standardisierung | CNF, Transitivitätsschlüsse, Redundanzen entfernen – Voraussetzung für Regelanwendung |
| Entschachtelung | Korrelierte Subqueries in Joins umschreiben, damit Optimierer freie Hand hat |
| Selection/Projection Pushdown | Daten so früh wie möglich reduzieren – die wirkungsvollste algebraische Regel |
| Selektivität | Anteil der Tupel, die ein Prädikat überleben; Basis aller Kardinalitätsschätzungen |
| Selinger-Algorithmus | DP über Left-Deep Join-Bäume; für n Tabellen O(n·2^n) Teilpläne |
| Interessante Sortierungen | Teurere Teilpläne behalten wenn ihre Ausgabe-Eigenschaft spätere Kosten spart |
| Teure Prädikate | Filter + Refine: günstiger approximativer Filter zuerst, teures exaktes Prädikat danach |
