# Join-Algorithmen: I/O-Kosten herleiten und berechnen

---

## Grundbegriffe

Bevor wir rechnen, klären wir die Notation:

- **|R|** = Anzahl der Seiten von Relation R (nicht Tupel – wir messen in Seiten, weil das die I/O-Einheit ist)
- **B** = Anzahl verfügbarer Puffer-Frames im RAM
- **1 I/O** = 1 Seite lesen oder schreiben

Alle Kosten unten sind in I/Os angegeben. Lesen und Schreiben zählen jeweils als 1 I/O.

---

## Algorithmus 1: Naive Nested-Loop-Join (NLJ)

### Idee

```
for each tuple r in R:          ← äußere Relation
    for each tuple s in S:      ← innere Relation
        if join_condition(r,s):
            output(r, s)
```

### I/O-Herleitung

Für **jeden Tupel** von R wird S **einmal komplett** gelesen.

- R lesen: **|R|** I/Os (einmal durchlaufen)
- Für jeden Tupel von R: S lesen = **|S|** I/Os
- Anzahl Tupel in R ≈ |R| × (Tupel pro Seite)

In der Praxis rechnen wir seitenbasiert und nehmen an, dass S für jede **Seite** von R einmal gelesen wird (weil wir mindestens eine Seite R und eine Seite S im Puffer brauchen):

**Kosten = |R| + |R| × |S|**

Das erste |R| ist das einmalige Lesen von R. Das |R| × |S| kommt davon, dass S für jede Seite von R einmal komplett gelesen wird.

### Beispiel

R = 1.000 Seiten, S = 500 Seiten, B = 3 (minimal: 1 für R, 1 für S, 1 für Output)

**Kosten = 1.000 + 1.000 × 500 = 501.000 I/Os**

Wenn R und S vertauscht werden (S als äußere Relation):

**Kosten = 500 + 500 × 1.000 = 500.500 I/Os**

Lektion: Die kleinere Relation sollte die innere sein (weniger Wiederholungen von S).

Warte – das ist falsch formuliert. Richtig: Die **größere** Relation sollte außen sein, weil S (innen) für jede Seite von R einmal gelesen wird. S innen bedeutet |R| Wiederholungen von S. Also: kleineres S innen → weniger Gesamtwiederholungen.

Hier: S = 500 innen → 1.000 × 500 = 500.000. R = 1.000 innen → 500 × 1.000 = 500.000. Symmetrisch in diesem Fall – aber bei stark unterschiedlichen Größen macht es einen Unterschied.

---

## Algorithmus 2: Block-Nested-Loop-Join (BNLJ)

### Idee

Statt Tupel-für-Tupel lädt man **so viele Seiten von R wie der Puffer erlaubt**, und liest S dagegen.

```
for each chunk of (B-2) pages from R:    ← B-2 Seiten für R-Block
    for each page of S:                  ← 1 Seite für S
        for each tuple r in R-chunk:
            for each tuple s in S-page:
                if join_condition(r,s): output(r,s)
```

Warum B-2? 1 Seite ist für S reserviert, 1 Seite für den Output-Puffer. Der Rest (B-2) geht an R.

### I/O-Herleitung

- Anzahl R-Chunks: **⌈|R| / (B-2)⌉**
- Für jeden Chunk: S einmal komplett lesen = **|S|** I/Os
- R selbst einmal lesen: **|R|** I/Os

**Kosten = |R| + ⌈|R| / (B-2)⌉ × |S|**

### Beispiel

R = 1.000 Seiten, S = 500 Seiten, B = 102 (also B-2 = 100 Seiten für R-Blöcke)

Anzahl Chunks: ⌈1.000 / 100⌉ = **10 Chunks**

**Kosten = 1.000 + 10 × 500 = 6.000 I/Os**

Statt 501.000 beim naiven NLJ. Der Unterschied ist der Puffer: Wir lesen S nicht mehr für jeden Tupel von R neu, sondern nur noch für jeden **Block** von R.

### Grenzfall: R passt komplett in den Puffer

Wenn |R| ≤ B-2, passt R vollständig in den Puffer. Dann:

**Kosten = |R| + |S|**

S wird genau einmal gelesen. Das ist das Optimum für einen Nested-Loop-Join.

---

## Algorithmus 3: Sort-Merge-Join (SMJ)

### Idee

Sortiere beide Relationen nach dem Join-Attribut. Dann merge die zwei sortierten Folgen in einem einzigen Durchlauf.

```
sort R by join_attr
sort S by join_attr
merge R und S (wie beim Mergesort, aber gib Paare aus die übereinstimmen)
```

### I/O-Herleitung

**Sortierkosten** für eine Relation X mit externem Mergesort (vereinfacht, 2 Phasen):
- Phase 1 (Runs erzeugen): |X| lesen + |X| schreiben = **2|X|**
- Phase 2 (mergen): |X| lesen + |X| schreiben = **2|X|**
- Gesamt pro Relation: **4|X|** (bei 2-Phasen-Sort, wenn ⌈|X|/B⌉ ≤ B gilt)

**Merge-Kosten** (nach dem Sortieren): Beide Relationen einmal lesen = **|R| + |S|**

**Gesamtkosten = 4|R| + 4|S| + |R| + |S| = 5(|R| + |S|)**

(Vereinfachung: 2-Phasen-Sort, kein Zurückschreiben des Endresultats)

### Beispiel

R = 1.000 Seiten, S = 500 Seiten

**Kosten = 5 × (1.000 + 500) = 7.500 I/Os**

### Wann lohnt sich SMJ?

- Wenn Daten **bereits sortiert** sind (z. B. durch geclusterten Index): Sortierkosten entfallen, nur noch |R| + |S| I/Os.
- Bei **Range-Joins** (`r.x < s.y`): Hash-Join funktioniert nur bei Equi-Joins, SMJ funktioniert auch für Ungleichungen.
- Wenn das Ergebnis **sortiert** gebraucht wird (ORDER BY): Sortierung fällt doppelt an – hier spart man.

---

## Algorithmus 4: Hash-Join

### Idee

**Phase 1 – Build:** Hashe alle Tupel der kleineren Relation R in einen Hash-Table.  
**Phase 2 – Probe:** Lese S Tupel für Tupel, hashe den Join-Schlüssel, suche Treffer im Hash-Table.

```
-- Build Phase
for each page of R:
    for each tuple r:
        insert r into hash_table[h(r.key)]

-- Probe Phase
for each page of S:
    for each tuple s:
        for each r in hash_table[h(s.key)]:
            if r.key == s.key: output(r, s)
```

### I/O-Herleitung (In-Memory-Fall: R passt in Puffer)

- R einmal lesen: **|R|** I/Os
- S einmal lesen: **|S|** I/Os

**Kosten = |R| + |S|**

Das ist optimal – jede Seite wird genau einmal gelesen.

Voraussetzung: Der Hash-Table für R passt in B-2 Frames (1 für S-Input, 1 für Output). Also: **|R| ≤ B-2**.

### I/O-Herleitung (Partitionierter Hash-Join: R passt nicht in Puffer)

Wenn R zu groß ist, wird in zwei Phasen partitioniert:

**Phase 1 – Partitionieren:**  
Hashe R und S mit derselben Hashfunktion h₁ in k Partitionen auf die Platte.  
Alle Tupel mit demselben h₁-Wert landen in derselben Partition – Join-Partner sind also immer in derselben Partition-Nummer.

- R lesen und schreiben (k Partitionen): **2|R|**
- S lesen und schreiben (k Partitionen): **2|S|**

**Phase 2 – Join pro Partition:**  
Für jede der k Partitionen: Lade R-Partition in den Puffer, probe mit S-Partition.

- Alle R-Partitionen lesen: **|R|**
- Alle S-Partitionen lesen: **|S|**

**Gesamtkosten = 2|R| + 2|S| + |R| + |S| = 3(|R| + |S|)**

Voraussetzung: Jede einzelne R-Partition passt in B-2 Frames. Bei k Partitionen und gleichmäßiger Verteilung: |R|/k ≤ B-2, also k ≥ |R|/(B-2). Und k ≤ B-1 (wir brauchen einen Frame pro Partition beim Schreiben). Daraus folgt: **|R| ≤ B²** als grobe Faustregel.

### Beispiel

R = 1.000 Seiten, S = 500 Seiten, B = 52

In-Memory-Fall: |R| = 1.000 > B-2 = 50 → nicht möglich.

Partitionierter Hash-Join:
- k = ⌈1.000 / 50⌉ = 20 Partitionen (jede R-Partition ~50 Seiten, passt in Puffer)
- Kosten = 3 × (1.000 + 500) = **4.500 I/Os**

---

## Vergleich aller Algorithmen

R = 1.000 Seiten, S = 500 Seiten, B = 102

| Algorithmus | Formel | I/Os |
|---|---|---|
| Naive NLJ | \|R\| + \|R\|×\|S\| | 501.000 |
| Block NLJ | \|R\| + ⌈\|R\|/(B-2)⌉×\|S\| | 6.000 |
| Sort-Merge | 5×(\|R\|+\|S\|) | 7.500 |
| Hash-Join (partitioniert) | 3×(\|R\|+\|S\|) | 4.500 |
| Hash-Join (in-memory) | \|R\|+\|S\| | 1.500 |

### Wann welchen Algorithmus?

| Situation | Empfehlung |
|---|---|
| Index auf innerer Relation vorhanden | NLJ mit Index |
| Daten bereits sortiert | Sort-Merge-Join (Sortierkosten entfallen) |
| Equi-Join, keine Vorsortierung, R passt in RAM | Hash-Join (in-memory) |
| Equi-Join, große Relationen | Partitionierter Hash-Join |
| Range-Join (`<`, `>`, `≤`) | Sort-Merge-Join (Hash-Join funktioniert nicht) |
| Sehr kleiner Puffer | Block-NLJ |
