# Lektion 5: Transaktionen und Concurrency Control

---

## 1. Das Transaktionskonzept

Eine **Transaktion** ist eine Folge von Datenbankoperationen, die als eine logische Einheit behandelt wird. Die vier ACID-Eigenschaften definieren, was das bedeutet:

| Eigenschaft | Bedeutung | Mechanismus |
|---|---|---|
| **Atomicity** | Alles oder nichts – entweder alle Operationen werden ausgeführt oder keine | Undo-Recovery |
| **Consistency** | Eine Transaktion überführt die DB von einem konsistenten Zustand in einen anderen | Integritätsbedingungen, Anwendungslogik |
| **Isolation** | Gleichzeitige Transaktionen sehen sich nicht gegenseitig in Zwischenzuständen | Concurrency Control |
| **Durability** | Committete Änderungen überleben jeden Systemabsturz | Redo-Recovery, WAL |

Wichtig: Consistency ist die einzige ACID-Eigenschaft, für die primär die **Anwendung** verantwortlich ist – das DBMS prüft Constraints, aber ob die Geschäftslogik korrekt ist, muss der Entwickler sicherstellen.

---

## 2. Probleme im Mehrbenutzerbetrieb

Ohne Synchronisation können gleichzeitige Transaktionen sich gegenseitig auf vier klassische Weisen stören:

### Lost Update

T1 und T2 lesen denselben Wert, modifizieren ihn, schreiben zurück. T2 überschreibt T1s Änderung:

```
T1: read(x)=100          write(x=110)
T2:          read(x)=100             write(x=150)
Ergebnis: x=150  (T1s +10 ist verloren)
```

### Dirty Read

T2 liest einen Wert, den T1 geschrieben hat, aber noch nicht committed hat. T1 macht dann Rollback:

```
T1: write(x=999)                  rollback
T2:              read(x=999)
T2 hat einen Wert gelesen, der nie existiert hat
```

### Non-Repeatable Read

T1 liest denselben Wert zweimal. Zwischen den Lesevorgängen ändert T2 den Wert und committed:

```
T1: read(x)=100        read(x)=200
T2:          write(x=200), commit
T1 bekommt zwei verschiedene Werte für dieselbe Anfrage
```

### Phantom Read

T1 führt eine Bereichsanfrage zweimal aus. T2 fügt zwischen den Anfragen einen neuen Datensatz ein, der in den Bereich fällt:

```
T1: SELECT * WHERE x>10  → {20,30}
T2:                           INSERT x=25, commit
T1: SELECT * WHERE x>10  → {20,25,30}
T1 sieht einen "Phantom"-Datensatz
```

Phantom Reads sind subtiler als Non-Repeatable Reads: Es geht nicht um einen geänderten Datensatz, sondern um einen neu hinzugekommenen.

---

## 3. Serialisierbarkeit

### Definition

Ein Schedule (Ausführungsplan mehrerer paralleler Transaktionen) heißt **serialisierbar**, wenn sein Ergebnis identisch mit dem Ergebnis irgendeiner seriellen Ausführung derselben Transaktionen ist.

Serielle Ausführung = T1 komplett, dann T2 komplett (oder umgekehrt). Kein Überlappen.

Serialisierbarkeit ist die stärkste Korrektheitsbedingung für Concurrency Control. Sie garantiert, dass Parallelität nach außen hin unsichtbar ist.

### Konfliktserialisierbarkeit

Zwei Operationen **konfliktieren**, wenn:
- Sie von verschiedenen Transaktionen stammen
- Sie auf dasselbe Datenelement zugreifen
- Mindestens eine ist ein Schreibvorgang

Konflikte: read-write, write-read, write-write. Read-read ist kein Konflikt.

Ein Schedule ist **konfliktserialisierbar**, wenn er durch Vertauschen von nicht-konfliktierenden Operationen in einen seriellen Schedule überführt werden kann.

### Serialisierbarkeits-Graph (Precedence Graph)

Für jeden Konflikt zwischen Ti und Tj (Ti's Operation kommt zuerst) füge eine Kante Ti → Tj ein.

**Ein Schedule ist genau dann konfliktserialisierbar, wenn der Serialisierbarkeits-Graph azyklisch ist.**

Ein Zyklus bedeutet: T1 muss vor T2 kommen (wegen Konflikt A), und T2 muss vor T1 kommen (wegen Konflikt B) – Widerspruch.

---

## 4. Synchronisation mittels Sperren

### Grundprinzip

Vor dem Zugriff auf ein Datenelement fordert eine Transaktion eine **Sperre (Lock)** an. Kompatible Sperren können gleichzeitig gehalten werden, inkompatible blockieren.

**Grundlegende Sperrtypen:**

| Sperre | Symbol | Erlaubt | Blockiert |
|---|---|---|---|
| Shared (Lesesperre) | S | parallele Lesevorgänge | Schreibvorgänge |
| Exclusive (Schreibsperre) | X | nichts parallel | alles |

**Kompatibilitätsmatrix:**

|  | S | X |
|---|---|---|
| **S** | ✓ kompatibel | ✗ blockiert |
| **X** | ✗ blockiert | ✗ blockiert |

### Two-Phase Locking (2PL)

Das wichtigste Sperrprotokoll. Zwei Phasen:

1. **Wachstumsphase:** Neue Sperren werden erworben, keine wird freigegeben.
2. **Schrumpfungsphase:** Sperren werden freigegeben, keine neuen werden erworben.

**Theorem:** Jeder Schedule, der von 2PL produziert wird, ist konfliktserialisierbar.

Der Beweis läuft darüber, dass 2PL verhindert, dass eine Transaktion nach dem Freigeben einer Sperre nochmal auf dasselbe Objekt zugreift – dadurch können keine Zyklen im Serialisierbarkeits-Graph entstehen.

**Problem:** 2PL verhindert nicht Deadlocks (T1 wartet auf T2s Sperre, T2 wartet auf T1s Sperre). Deadlock-Erkennung über Wait-for-Graphen oder Timeouts.

### Striktes 2PL (Strict 2PL)

Variante: Alle **X-Sperren** werden bis zum Ende der Transaktion (Commit oder Abort) gehalten.

**Vorteil:** Verhindert Cascading Rollbacks. Wenn T1 eine Änderung liest, die T2 noch nicht committed hat, und T2 später zurückgerollt wird, muss auch T1 zurückgerollt werden – und alle Transaktionen, die T1s Änderungen gelesen haben, usw. Strict 2PL verhindert, dass überhaupt Dirty Reads entstehen.

**Striktes 2PL ist der Standard in der Praxis.**

---

## 5. Klassen von Sperrverfahren

### Pessimistische Sperrverfahren

Sperren werden **vor** dem Datenzugriff erworben. Konflikte werden durch Warten aufgelöst. Überwiegende Praxis in traditionellen RDBMS.

**Vorteil:** Korrektheit garantiert, kein Risiko von Abbrüchen durch Konflikte zur Commit-Zeit.  
**Nachteil:** Overhead durch Lock-Management, mögliche Deadlocks, geringe Parallelität bei vielen Konflikten.

### Optimistische Sperrverfahren (OCC)

Drei Phasen:
1. **Read Phase:** Transaktion liest und schreibt in einen privaten Workspace, keine echten Sperren.
2. **Validation Phase:** Beim Commit prüft das DBMS, ob Konflikte mit anderen gleichzeitigen Transaktionen aufgetreten sind.
3. **Write Phase:** Wenn keine Konflikte → Änderungen werden übernommen. Bei Konflikt → Rollback und Neustart.

**Vorteil:** Keine Deadlocks, hohe Parallelität bei wenigen Konflikten (read-heavy Workloads).  
**Nachteil:** Bei hoher Konfliktrate viele vergebliche Rollbacks (Starvation möglich). Validation-Phase muss atomar sein.

### Timestamp-basierte Verfahren

Jede Transaktion bekommt beim Start einen eindeutigen Timestamp. Konflikte werden aufgelöst, indem die jüngere Transaktion zurückgerollt wird ("Thomas Write Rule").

**Vorteil:** Deadlock-frei (keine Zyklen im Wait-Graph möglich, da immer die jüngere Transaktion weicht).  
**Nachteil:** Hohe Abort-Rate bei Konflikten, Timestamps müssen monoton und konsistent vergeben werden.

---

## 6. Hierarchisches Sperren (Intention Locks)

### Das Problem

Ein DBMS verwaltet Daten auf mehreren Granularitätsebenen: Datenbank → Tabelle → Seite → Tupel. Soll eine Transaktion eine ganze Tabelle sperren, müsste sie ohne hierarchisches Sperren jedes einzelne Tupel sperren – viel zu teuer.

Gleichzeitig: Wenn T1 ein einzelnes Tupel X-sperrt und T2 versucht, die gesamte Tabelle X-zusperren, müsste T2 alle Tupel der Tabelle prüfen.

### Intention Locks

**Intention-Sperren** signalisieren der übergeordneten Ebene, was auf untergeordneten Ebenen geplant ist:

| Sperrtyp | Symbol | Bedeutung |
|---|---|---|
| Intention Shared | IS | Irgendwo tiefer wird ein S-Lock gesetzt |
| Intention Exclusive | IX | Irgendwo tiefer wird ein X-Lock gesetzt |
| Shared + Intention Exclusive | SIX | Gesamter Knoten wird gelesen (S), und irgendwo tiefer wird geschrieben (IX) |

**Protokoll:** Um einen Knoten zu sperren, müssen zuerst alle **Vorfahren** mit dem passenden Intention Lock gesperrt werden (top-down). Freigabe erfolgt bottom-up.

**Kompatibilitätsmatrix für hierarchisches Sperren:**

|  | IS | IX | S | SIX | X |
|---|---|---|---|---|---|
| **IS** | ✓ | ✓ | ✓ | ✓ | ✗ |
| **IX** | ✓ | ✓ | ✗ | ✗ | ✗ |
| **S** | ✓ | ✗ | ✓ | ✗ | ✗ |
| **SIX** | ✓ | ✗ | ✗ | ✗ | ✗ |
| **X** | ✗ | ✗ | ✗ | ✗ | ✗ |

**Vorteil:** Eine Transaktion, die eine ganze Tabelle X-sperren will, sperrt nur den Tabellenknoten mit X – und sieht sofort (am IX-Lock der Tabelle), ob eine andere Transaktion tiefer bereits Sperren hält. Kein Durchsuchen aller Tupel nötig.

---

## 7. Mehrversionen-Synchronisation (MVCC)

### Grundidee

Statt Leser und Schreiber zu blockieren, hält das DBMS **mehrere Versionen** jedes Datensatzes vor. Jede Version ist mit dem Timestamp (oder der Transaktions-ID) der schreibenden Transaktion markiert.

Ein Leser bekommt die **passende Version** für seinen Lesezeitpunkt – nie blockiert von einem Schreiber, der eine neuere Version erstellt.

```
x: [Version 1: wert=100, erstellt von T1]
   [Version 2: wert=150, erstellt von T3]

T2 (Timestamp vor T3): liest Version 1 → 100
T4 (Timestamp nach T3): liest Version 2 → 150
```

### Snapshot Isolation

Die in der Praxis dominante MVCC-Variante. Jede Transaktion bekommt beim Start einen **Snapshot** der Datenbank – sie sieht nur Versionen, die vor ihrem Start committed wurden. Änderungen anderer, gleichzeitiger Transaktionen bleiben unsichtbar.

**Konsequenzen:**
- Lesevorgänge blockieren nie Schreibvorgänge (und umgekehrt).
- Dirty Reads und Non-Repeatable Reads sind unmöglich.
- **Write-Write-Konflikte** werden separat behandelt: Wenn zwei Transaktionen dasselbe Objekt schreiben, wird eine abgebrochen (First Committer Wins).

**Achtung – Write Skew:** Snapshot Isolation ist **nicht** serialisierbar. Klassisches Gegenbeispiel:

```
Constraint: mindestens ein Arzt muss Bereitschaft haben (x=1 oder y=1)
Anfangszustand: x=1, y=1

T1: liest y=1 (Bedingung ok), setzt x=0, commit
T2: liest x=1 (Bedingung ok), setzt y=0, commit

Ergebnis: x=0, y=0  → Constraint verletzt
Kein serielle Reihenfolge hätte das zugelassen
```

Write Skew tritt auf, weil T1 und T2 verschiedene Objekte schreiben – kein Write-Write-Konflikt – aber zusammen eine Invariante verletzen.

### Versionsbereinigung (Garbage Collection)

Alte Versionen, die keine aktive Transaktion mehr sehen kann, werden periodisch bereinigt. Ohne Garbage Collection wächst die Datenbank unbegrenzt.

---

## 8. Isolation Level

SQL definiert vier Isolation Level als Kompromiss zwischen Korrektheit und Parallelität:

| Isolation Level | Dirty Read | Non-Repeatable Read | Phantom Read | Typische Impl. |
|---|---|---|---|---|
| **Read Uncommitted** | möglich | möglich | möglich | Keine S-Locks beim Lesen |
| **Read Committed** | verhindert | möglich | möglich | S-Lock sofort nach Lesen freigeben |
| **Repeatable Read** | verhindert | verhindert | möglich | S-Locks bis Commit halten |
| **Serializable** | verhindert | verhindert | verhindert | Strict 2PL oder Predicate Locks |

### Read Uncommitted

Keine Lesesperren. Transaktionen lesen, was auch immer auf der Seite steht – inklusive uncommitteter Änderungen anderer Transaktionen. Maximale Parallelität, minimale Korrektheit. Nützlich für approximative Analysen (z. B. "ungefähre Zeilenanzahl").

### Read Committed

S-Locks werden sofort nach dem Lesen freigegeben (kein 2PL für Reads). Dirty Reads sind ausgeschlossen, aber Non-Repeatable Reads möglich. **Standard in vielen DBMS** (PostgreSQL, Oracle, SQL Server Default).

### Repeatable Read

S-Locks werden bis zum Commit gehalten (Strict 2PL für Reads). Kein Dirty Read, kein Non-Repeatable Read. Phantom Reads noch möglich, weil Tupelsperren keine neuen Einfügungen verhindern (dafür bräuchte man Predicate Locks oder Index-Range Locks).

### Serializable

Vollständige Isolation. Implementierungen:
- **Strict 2PL + Predicate Locks:** Sperren auf Prädikaten (z. B. "alle Tupel mit x > 10"), nicht nur auf einzelnen Tupeln. Verhindert Phantoms. Teuer, weil Prädikatsprüfung aufwändig ist.
- **Index-Range Locks (Next-Key Locks):** InnoDB-Ansatz. Sperrt nicht nur den gelesenen Datensatz, sondern auch die "Lücke" davor im Index. Verhindert Einfügungen in den Bereich.
- **Serializable Snapshot Isolation (SSI):** Erkennt Serialisierbarkeits-Anomalien (wie Write Skew) zur Laufzeit und rollt betroffene Transaktionen zurück. Modernster Ansatz (PostgreSQL ≥ 9.1).

### Praktische Empfehlung

Die meisten Anwendungen laufen auf Read Committed und vertrauen darauf, dass Non-Repeatable Reads keine Rolle spielen. Das ist oft falsch – gerade bei Finanztransaktionen und Inventarverwaltung sind Repeatable Read oder Serializable angebracht. Write Skew unter Snapshot Isolation ist ein reales Problem, das Entwickler oft nicht kennen.

---

## Zusammenfassung

| Konzept | Kernaussage |
|---|---|
| ACID | Atomicity und Durability über Recovery; Isolation über Concurrency Control |
| Lost Update / Dirty Read / Phantom | Die vier klassischen Anomalien ohne Synchronisation |
| Serialisierbarkeit | Korrektheitsbedingung: Ergebnis entspricht irgendeiner seriellen Ausführung |
| Serialisierbarkeits-Graph | Azyklisch ↔ konfliktserialisierbar |
| Strict 2PL | X-Sperren bis Commit halten; verhindert Cascading Rollbacks; Standard in der Praxis |
| Intention Locks | Signalisieren geplante Sperren auf tieferen Ebenen; ermöglichen effizientes Coarse-Grain-Locking |
| MVCC / Snapshot Isolation | Leser blockieren Schreiber nicht; aber nicht serialisierbar (Write Skew möglich) |
| Isolation Level | Kompromiss Korrektheit vs. Parallelität; Read Committed ist oft zu schwach |
