# CRDTs: Conflict-free Replicated Data Types

---

## Das Problem, das CRDTs lösen

In einem AP-System (Eventual Consistency) können zwei Knoten gleichzeitig denselben Wert schreiben. Irgendwann müssen die Versionen zusammengeführt werden. Die Frage ist: **Wie?**

Die naiven Optionen:
- **Last-Write-Wins:** Timestamp entscheidet. Problem: Timestamps in verteilten Systemen sind nicht zuverlässig synchronisiert, und Updates können verloren gehen.
- **Application-Level Merge:** Die Anwendung löst Konflikte auf. Korrekt, aber aufwändig und fehleranfällig.

**CRDTs** lösen das Problem auf Datentypebene: Die Datenstruktur selbst ist so entworfen, dass **parallele Updates immer konfliktfrei zusammenführbar sind** – automatisch, ohne Koordination, ohne Konflikte.

---

## Die mathematische Grundlage

Eine CRDT-Merge-Operation muss drei Eigenschaften erfüllen:

- **Kommutativ:** `merge(a, b) = merge(b, a)` – Reihenfolge des Empfangs spielt keine Rolle.
- **Assoziativ:** `merge(merge(a, b), c) = merge(a, merge(b, c))` – Gruppierung spielt keine Rolle.
- **Idempotent:** `merge(a, a) = a` – dasselbe Update zweimal anwenden ändert nichts.

Wenn diese drei Eigenschaften gelten, ist das Ergebnis der Zusammenführung **unabhängig davon**, in welcher Reihenfolge Updates ankommen, ob Updates doppelt gesendet werden, oder wie lange Knoten offline waren. Das macht CRDTs robust für genau die Probleme, die in verteilten Systemen auftreten.

Formal: Die Zustände bilden einen **Join-Semilattice** – eine teilgeordnete Menge, in der jede Teilmenge eine kleinste obere Schranke (Supremum) hat. Die Merge-Operation ist das Supremum.

---

## Zwei Familien von CRDTs

**State-based CRDTs (CvRDTs):** Knoten übertragen ihren **gesamten Zustand** periodisch. Empfänger mergen den Zustand mit dem eigenen via Merge-Funktion.

**Operation-based CRDTs (CmRDTs):** Knoten übertragen **Operationen** (z. B. "inkrementiere um 1"). Voraussetzung: Operationen werden genau einmal und in kausal korrekter Reihenfolge zugestellt (zuverlässige Übertragung, Causal Delivery).

State-based sind einfacher zu implementieren (keine Zustellungsgarantien nötig), aber versenden mehr Daten. Operation-based sind effizienter, aber erfordern mehr vom Netzwerk.

---

## Konkrete CRDTs

### G-Counter (Grow-only Counter)

**Problem:** Mehrere Knoten zählen Ereignisse (z. B. Seitenaufrufe). Kein Knoten darf den Zähler verringern.

**Struktur:** Jeder Knoten N_i hält einen eigenen Zähler `V[i]`. Der Gesamtwert ist `sum(V)`.

```
3 Knoten: V = [V[0], V[1], V[2]]

Node0 inkrementiert: V[0]++
Node1 inkrementiert: V[1]++
Node2 inkrementiert: V[2]++
```

**Merge:** `merge(V, W)[i] = max(V[i], W[i])` für alle i.

**Beispiel:**
```
Node0 hat: [3, 1, 2]
Node1 hat: [2, 4, 2]  (hat V[1] häufiger inkrementiert)

merge = [max(3,2), max(1,4), max(2,2)] = [3, 4, 2]
Gesamtwert = 3 + 4 + 2 = 9
```

**Korrektheit:** Kein Update geht verloren (max nimmt immer den höheren Wert). Keine Konflikte möglich (jeder Knoten inkrementiert nur seinen eigenen Slot).

### PN-Counter (Positive-Negative Counter)

**Problem:** Zähler, der sowohl inkrementiert als auch dekrementiert werden kann (z. B. Lagerbestand).

**Struktur:** Zwei G-Counter: P (für Inkremente) und N (für Dekremente).

```
Wert = sum(P) - sum(N)
merge(P, N) = (merge_GCounter(P_a, P_b), merge_GCounter(N_a, N_b))
```

**Einschränkung:** Der Wert kann negativ werden, aber das CRDT verhindert nicht, dass `Wert < 0`. Wenn der Lagerbestand nicht negativ sein darf, muss die Anwendung das separat prüfen – das ist eine semantische Constraint, die CRDTs nicht ausdrücken können.

### LWW-Register (Last-Write-Wins Register)

**Problem:** Einzelner Wert, der überschrieben werden kann.

**Struktur:** `(wert, timestamp)`. Merge wählt den Eintrag mit dem höheren Timestamp.

```
Node0: (x=42, t=100)
Node1: (x=99, t=150)
merge = (x=99, t=150)  ← neuerer Timestamp gewinnt
```

**Problem:** Timestamp-Synchronisation. Wenn Node1 eine leicht vorgestellte Uhr hat, gewinnt er immer – unabhängig von der tatsächlichen Reihenfolge.

**Hybride Logical Clocks (HLC)** kombinieren physische Zeit mit logischen Zählern, um dieses Problem abzumildern.

### G-Set (Grow-only Set)

**Problem:** Menge von Elementen, zu der nur hinzugefügt, nie entfernt werden kann.

**Struktur:** Einfache Menge. `merge(A, B) = A ∪ B`.

**Merge:** Mengenvereinigung ist kommutativ, assoziativ und idempotent. Perfekte CRDT-Operation.

```
Node0: {a, b, c}
Node1: {b, c, d}
merge = {a, b, c, d}
```

Einfach, aber das fehlende Remove ist oft unpraktisch.

### 2P-Set (Two-Phase Set)

**Problem:** Menge mit Add und Remove, aber jedes Element kann nur **einmal** entfernt werden.

**Struktur:** Zwei G-Sets: A (added) und R (removed). Ein Element ist in der Menge wenn es in A und nicht in R ist.

```
Menge = A \ R
```

**Merge:** `merge((A1,R1), (A2,R2)) = (A1∪A2, R1∪R2)`

**Einschränkung:** Einmal entfernte Elemente können nie wieder hinzugefügt werden (da R nur wächst). Unpraktisch für die meisten Anwendungsfälle.

### OR-Set (Observed-Remove Set)

Das eleganteste Set-CRDT. Löst das Problem von 2P-Set: Elemente können beliebig oft hinzugefügt und entfernt werden.

**Kernidee:** Jede Add-Operation bekommt eine eindeutige Tag-ID (UUID). Remove entfernt nur die **spezifischen Tags**, die der entfernende Knoten gesehen hat.

```
Node0: add("a") → ("a", tag=uuid1)
Node0: add("a") → ("a", tag=uuid2)  (zweites Hinzufügen)
Node0: remove("a") → entfernt alle bekannten Tags von "a": {uuid1, uuid2}

Wenn gleichzeitig Node1: add("a") → ("a", tag=uuid3)
→ Node1 hat uuid3, das nicht entfernt wurde
→ nach Merge: "a" ist noch in der Menge (uuid3 überlebt)
```

**Semantik:** Remove entfernt alle Adds, die der entfernende Knoten **beobachtet** hat. Gleichzeitige Adds "gewinnen" gegen ein Remove. Das ist die intuitive Semantik für kollaborative Anwendungen.

**Merge:** `merge((A1, R1), (A2, R2))`:
- Vereinige alle (element, tag)-Paare.
- Entferne Paare, deren Tag in der R-Menge beider Knoten ist.

### RGA (Replicated Growable Array) – Kollaborativer Text

**Problem:** Mehrere Nutzer editieren gleichzeitig denselben Text (wie Google Docs).

**Einfacher Ansatz (kaputt):** Positionen im Text. Nutzer A fügt nach Position 3 ein, Nutzer B löscht Position 3. Nach Merge: Position 3 existiert nicht mehr → A's Insert landet an falscher Stelle.

**RGA-Lösung:** Statt Positionen bekommt jedes Zeichen eine **eindeutige, stabile ID** (Timestamp + Knoten-ID). Die Reihenfolge der Zeichen wird über diese IDs definiert, nicht über numerische Positionen.

```
[H:id1] [e:id2] [l:id3] [l:id4] [o:id5]

Node0: fügt "X" nach id3 ein → [H:id1][e:id2][l:id3][X:id6][l:id4][o:id5]
Node1: fügt "Y" nach id3 ein → [H:id1][e:id2][l:id3][Y:id7][l:id4][o:id5]

Merge: beide Einfügungen nach id3, Reihenfolge durch ID-Vergleich:
→ [H:id1][e:id2][l:id3][X:id6][Y:id7][l:id4][o:id5]  (oder Y vor X, je nach Tiebreaker)
```

Kein Konflikt – beide Zeichen bleiben erhalten, Reihenfolge deterministisch durch ID-Vergleich.

---

## Was CRDTs nicht können

CRDTs sind kein Allheilmittel. Sie funktionieren nur für Operationen, die sich konfliktfrei zusammenführen lassen:

- **Unique Constraints:** "Jede E-Mail-Adresse darf nur einmal vorkommen." Zwei Knoten, die gleichzeitig dieselbe E-Mail hinzufügen, produzieren einen Konflikt, den kein CRDT automatisch auflösen kann.
- **Globale Invarianten:** "Gesamtlagerbestand ≥ 0." Zwei Knoten, die gleichzeitig den letzten Artikel verkaufen, verletzen die Invariante zusammen – ohne es zu wissen.
- **Transaktionen über mehrere Objekte:** CRDTs operieren auf einzelnen Datentypen. Atomare Änderungen über mehrere CRDTs sind nicht direkt möglich.

Für diese Fälle braucht man Koordination – und ist zurück im CP-Bereich des CAP-Theorems.

---

## Zusammenfassung

| CRDT | Operationen | Merge | Einschränkung |
|---|---|---|---|
| G-Counter | increment | max pro Slot | kein Decrement |
| PN-Counter | increment, decrement | max pro Slot (P und N) | Wert kann negativ werden |
| LWW-Register | write | max(timestamp) | Timestamp-Synchronisation |
| G-Set | add | Vereinigung | kein Remove |
| 2P-Set | add, remove | Vereinigung beider | kein Re-Add nach Remove |
| OR-Set | add, remove | tag-basierte Vereinigung | Add gewinnt gegen gleichzeitiges Remove |
| RGA | insert, delete | ID-basierte Ordnung | komplexe Implementierung |

| Konzept | Kernaussage |
|---|---|
| Kommutativ + Assoziativ + Idempotent | Die drei Bedingungen, die konfliktfreies Merge garantieren |
| State-based vs. Operation-based | Zustand übertragen vs. Operationen übertragen; Trade-off Netzwerklast vs. Zustellungsgarantien |
| OR-Set | Eleganteste Set-CRDT; Add gewinnt gegen gleichzeitiges Remove durch Tag-IDs |
| RGA | Basis kollaborativer Texteditoren; stabile Zeichen-IDs statt numerischer Positionen |
| Grenzen | Unique Constraints, globale Invarianten, Multi-Objekt-Transaktionen: nicht CRDT-fähig |
