# Externes Sortieren: I/O-Kosten herleiten und berechnen

---

## Grundbegriffe

- **n** = Gesamtanzahl Seiten der zu sortierenden Relation
- **B** = Anzahl verfügbarer Puffer-Frames im RAM
- **Run** = eine sortierte Teilfolge von Seiten auf der Platte
- **1 I/O** = 1 Seite lesen oder schreiben

Ziel: n Seiten sortieren, mit nur B Seiten im RAM. Das geht nicht in einem Durchlauf – wir brauchen mehrere Phasen.

---

## Phase 1: Initiale Runs erzeugen

Lade B Seiten in den RAM, sortiere intern (Quicksort, spielt keine Rolle), schreibe den sortierten Block als Run zurück auf die Platte. Wiederhole bis alle n Seiten verarbeitet sind.

**Anzahl initialer Runs:** ⌈n / B⌉

**I/O-Kosten Phase 1:**
- n Seiten lesen: n I/Os
- n Seiten zurückschreiben: n I/Os
- **Gesamt: 2n I/Os**

### Beispiel

n = 1.000 Seiten, B = 10

Anzahl Runs: ⌈1.000 / 10⌉ = **100 Runs**, jeder 10 Seiten groß.

Phase-1-Kosten: 2 × 1.000 = **2.000 I/Os**

---

## Phase 2: Runs zusammenmergen

Wir haben jetzt viele kleine sortierte Runs. Wir mergen sie zu immer größeren Runs, bis nur noch einer übrig ist.

### 2-Wege-Mergesort (merge je 2 Runs)

In jeder Merge-Runde: Lies zwei Runs, schreibe einen größeren.

Nach jeder Runde halbiert sich die Anzahl der Runs (Größe verdoppelt sich).

**Anzahl Runden:** ⌈log₂(⌈n/B⌉)⌉

**Kosten pro Runde:** Alle n Seiten einmal lesen + einmal schreiben = **2n I/Os**

**Gesamtkosten (ohne Phase 1):** 2n × ⌈log₂(⌈n/B⌉)⌉

**Gesamtkosten (mit Phase 1):** 2n + 2n × ⌈log₂(⌈n/B⌉)⌉ = **2n × (1 + ⌈log₂(⌈n/B⌉)⌉)**

### Beispiel: 2-Wege-Merge

n = 1.000, B = 10 → 100 initiale Runs

Runden: ⌈log₂(100)⌉ = ⌈6,64⌉ = **7 Runden**

Gesamtkosten: 2 × 1.000 × (1 + 7) = **16.000 I/Os**

---

## k-Wege-Mergesort (merge je k Runs gleichzeitig)

Statt immer 2 Runs zu mergen, mergen wir **k Runs gleichzeitig**. Dafür brauchen wir:
- 1 Input-Frame pro Run: k Frames
- 1 Output-Frame: 1 Frame
- Also: k = **B - 1** gleichzeitige Runs möglich

### I/O-Herleitung

**Phase 1:** Wie gehabt – **2n I/Os**, erzeugt ⌈n/B⌉ Runs.

**Anzahl Merge-Runden:** ⌈log_{B-1}(⌈n/B⌉)⌉

**Kosten pro Runde:** 2n I/Os (alle Seiten einmal lesen + schreiben)

**Gesamtkosten:** **2n × (1 + ⌈log_{B-1}(⌈n/B⌉)⌉)**

### Beispiel: k-Wege-Merge

n = 1.000, B = 10 → k = B-1 = **9**

Initiale Runs: ⌈1.000/10⌉ = 100

Anzahl Runden: ⌈log₉(100)⌉ = ⌈2,09⌉ = **3 Runden**

Gesamtkosten: 2 × 1.000 × (1 + 3) = **8.000 I/Os**

Statt 16.000 beim 2-Wege-Merge. Mehr Puffer → weniger Runden → drastisch weniger I/Os.

### Der Einfluss von B auf die Rundenanzahl

| B | k = B-1 | Runden (n=1.000) | Gesamtkosten |
|---|---|---|---|
| 3 | 2 | 7 | 16.000 |
| 10 | 9 | 3 | 8.000 |
| 100 | 99 | 2 | 6.000 |
| 1.001 | 1.000 | 1 | 4.000 |

Ab B ≥ ⌈n/B⌉ + 1 (d.h. B² ≥ n) reicht **eine einzige Merge-Runde**. Das ist die wichtigste Faustregel: Mit B ≈ √n Puffer-Frames kommt man mit 2 Phasen aus (Phase 1 + 1 Merge-Runde).

---

## Sonderfall: 2-Phasen-Sort (häufige Prüfungsaufgabe)

Wenn die Bedingung **⌈n/B⌉ ≤ B-1** erfüllt ist, passen alle initialen Runs in einer einzigen Merge-Runde zusammen. Dann:

**Gesamtkosten = 2n (Phase 1) + 2n (1 Merge-Runde) = 4n I/Os**

**Bedingung für 2-Phasen-Sort:** n ≤ B × (B-1) ≈ B²

### Beispiel

Wie groß darf n maximal sein, damit B = 100 Frames für einen 2-Phasen-Sort reichen?

n ≤ 100 × 99 = **9.900 Seiten**

Bei 8 KB pro Seite: 9.900 × 8 KB ≈ **79 MB** – das ist mit B = 100 Frames sortierbar in exakt 4n = 39.600 I/Os.

---

## Replacement Selection: Größere initiale Runs

Statt einfach B Seiten zu laden und zu sortieren, kann man mit einem **Heap (Priority Queue)** größere Runs erzeugen.

**Algorithmus:**
1. Fülle Heap mit B Seiten.
2. Extrahiere Minimum → schreibe es in den aktuellen Run.
3. Lese neues Element von der Platte.
   - Ist es ≥ letztem Output-Element? → Füge es in den Heap ein (bleibt im aktuellen Run).
   - Ist es < letztem Output-Element? → Markiere es als "gesperrt" (gehört zum nächsten Run).
4. Wenn alle aktiven Heap-Elemente gesperrt sind: Run abschließen, gesperrte Elemente werden der neue Heap für den nächsten Run.

**Durchschnittliche Run-Größe (bei zufälliger Eingabe): 2B**

**Anzahl initialer Runs mit Replacement Selection:** ⌈n / (2B)⌉

Das **halbiert** die Anzahl initialer Runs. Weniger Runs → weniger Merge-Runden.

### Vergleich: Einfacher Sort vs. Replacement Selection

n = 1.000, B = 10

| Methode | Initiale Runs | Merge-Runden (k=9) | Gesamtkosten |
|---|---|---|---|
| Einfacher Sort | ⌈1000/10⌉ = 100 | ⌈log₉(100)⌉ = 3 | 8.000 |
| Replacement Selection | ⌈1000/20⌉ = 50 | ⌈log₉(50)⌉ = 2 | 6.000 |

Replacement Selection spart hier eine komplette Merge-Runde.

**Wann bringt Replacement Selection nichts?** Bei bereits sortierten oder umgekehrt sortierten Daten. Bei umgekehrt sortierten Daten erzeugt sie sogar nur Runs der Größe 1 (jedes neue Element ist kleiner als das letzte). Replacement Selection ist eine Optimierung für den Durchschnittsfall, nicht für den Worst Case.

---

## Double Buffering: I/O und CPU überlappen

Ohne Double Buffering:
```
[Lese Seite] → [Verarbeite] → [Lese Seite] → [Verarbeite] → ...
CPU wartet     CPU arbeitet  CPU wartet     CPU arbeitet
```

Mit Double Buffering: Für jeden Input-Kanal gibt es **zwei Puffer-Frames**. Während der CPU einen Puffer verarbeitet, lädt das I/O-System asynchron den nächsten.

```
[Lese Puffer A] → [Verarbeite A] → [Verarbeite B] → ...
                   [Lese Puffer B]  [Lese Puffer A]
CPU wartet nie (wenn I/O schnell genug)
```

**Kosten in Frames:** Doppelter Pufferbedarf pro Run-Kanal.

- Ohne Double Buffering: k = B-1 gleichzeitige Runs.
- Mit Double Buffering: k = ⌊B/2⌋ - 1 gleichzeitige Runs (jeder Run-Kanal braucht 2 Frames, Output-Kanal auch 2 Frames).

**I/O-Kosten bleiben dieselben** – Double Buffering reduziert die Wartezeit (Latenz), nicht die Anzahl der I/Os. Es ist eine Optimierung für die Durchlaufzeit, nicht für die I/O-Menge.

### Beispiel

B = 20, ohne Double Buffering: k = 19 gleichzeitige Runs.  
B = 20, mit Double Buffering: k = ⌊20/2⌋ - 1 = 9 gleichzeitige Runs.

Der Trade-off: Schnellere Ausführung durch Parallelität, aber weniger gleichzeitige Runs → potenziell mehr Merge-Runden.

---

## Zusammenfassung der Formeln

| Konzept | Formel |
|---|---|
| Initiale Runs (einfach) | ⌈n/B⌉ |
| Initiale Runs (Replacement Selection) | ≈ ⌈n/(2B)⌉ |
| Gleichzeitige Runs beim Mergen | k = B-1 |
| Merge-Runden (k-Wege) | ⌈log_{B-1}(⌈n/B⌉)⌉ |
| Gesamtkosten (k-Wege) | 2n × (1 + ⌈log_{B-1}(⌈n/B⌉)⌉) |
| Bedingung für 2-Phasen-Sort | n ≤ B × (B-1) ≈ B² |
| Kosten 2-Phasen-Sort | 4n I/Os |
