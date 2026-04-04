# Lektion 7c: Verteilte Datenbankarchitekturen – Replikation und Konsistenzmodelle

---

## 1. Replikation: Warum und was?

**Replikation** bedeutet, dass dieselben Daten auf mehreren Knoten vorgehalten werden. Die Motivationen:

- **Verfügbarkeit:** Fällt ein Knoten aus, können andere Replikate die Anfragen beantworten.
- **Leseperformance:** Leseanfragen können auf mehrere Replikate verteilt werden (Load Balancing).
- **Geografische Lokalität:** Replikate nah bei den Nutzern reduzieren Netzwerklatenz.

Der unvermeidbare Trade-off: Jede Schreiboperation muss alle Replikate aktualisieren. Je mehr Replikate, desto höher der Schreibaufwand und desto schwieriger die Konsistenz.

---

## 2. Replikationsvarianten

### Synchrone Replikation

Eine Schreiboperation gilt als abgeschlossen, wenn **alle** Replikate die Änderung bestätigt haben.

```
Client → Primär: WRITE(x=42)
Primär → Replikat1: WRITE(x=42) → ACK
Primär → Replikat2: WRITE(x=42) → ACK
Primär → Client: SUCCESS
```

**Vorteil:** Alle Replikate sind jederzeit konsistent. Lesen von jedem Replikat liefert immer den aktuellsten Wert.  
**Nachteil:** Schreiblatenz = Latenz zum langsamsten Replikat. Ein langsames oder ausgefallenes Replikat blockiert alle Schreibvorgänge. Schlecht skalierbar über geografische Distanzen (Intercontinental-Latenz von 100–300ms macht synchrone Replikation prohibitiv teuer).

### Asynchrone Replikation

Eine Schreiboperation gilt als abgeschlossen, wenn der **Primärknoten** bestätigt hat. Replikate werden im Hintergrund aktualisiert.

```
Client → Primär: WRITE(x=42)
Primär → Client: SUCCESS  (sofort)
Primär → Replikat1: WRITE(x=42)  (asynchron, später)
Primär → Replikat2: WRITE(x=42)  (asynchron, später)
```

**Vorteil:** Niedrige Schreiblatenz. Kein Blockieren durch langsame Replikate. Gut für geographisch verteilte Systeme.  
**Nachteil:** **Replikationslag (Replication Lag):** Replikate hinken dem Primär hinterher. Lesen von einem Replikat kann einen veralteten Wert liefern (**Stale Read**). Bei Ausfall des Primärs vor Abschluss der Replikation: **Datenverlust** für bereits bestätigte Schreibvorgänge.

### Primary-Copy-Replikation (Master-Slave)

Ein Knoten ist der **Primär (Master)**, alle anderen sind **Replikate (Slaves)**. Schreiboperationen gehen ausschließlich an den Primär. Lesevorgänge können von allen beantwortet werden.

```
Writes → [Primary] → (synchron oder asynchron) → [Replica1] [Replica2]
Reads  ← [Primary] oder [Replica1] oder [Replica2]
```

**Failover:** Fällt der Primär aus, muss eines der Replikate zum neuen Primär befördert werden. Bei asynchroner Replikation kann das Replikat nicht alle Änderungen des alten Primärs kennen → potenzieller Datenverlust.

**Read Replicas:** Häufiges Muster in der Praxis (MySQL, PostgreSQL, Amazon RDS). Schreiblast auf dem Primär, Leselast verteilt auf Replikate. Funktioniert gut für read-heavy Workloads.

### Quorum-basierte Replikation

Kein einzelner Primär – stattdessen entscheiden **Quoren** (Mehrheiten), ob eine Operation erfolgreich ist.

**Schreibquorum W:** Eine Schreiboperation muss von mindestens W Knoten bestätigt werden.  
**Lesequorum R:** Eine Leseoperation muss mindestens R Knoten befragen und den aktuellsten Wert zurückgeben.

**Korrektheitsbedingung:** `R + W > N` (N = Gesamtzahl Replikate)

Das garantiert, dass jede Lesemenge und jede Schreibmenge mindestens einen Knoten gemeinsam haben – der gemeinsame Knoten hat die aktuellste Version.

**Beispiel:** N=3, W=2, R=2. `R + W = 4 > 3`. Jede Lesung befragte mindestens 2 Knoten, jede Schreibung schrieb mindestens 2 Knoten → Überschneidung immer vorhanden.

**Konfigurationen:**
- `W=1, R=N`: Schnelles Schreiben, langsames Lesen.
- `W=N, R=1`: Langsames Schreiben (alle müssen bestätigen), schnelles Lesen.
- `W=⌈N/2⌉+1, R=⌈N/2⌉+1`: Symmetrisch, toleriert `⌊N/2⌋` Ausfälle.

Quorum-Replikation wird in Systemen wie Amazon Dynamo, Cassandra und Riak eingesetzt.

---

## 3. Das CAP-Theorem

### Formulierung

**Theorem (Brewer 2000, formalisiert Gilbert & Lynch 2002):** Ein verteiltes System kann nicht gleichzeitig alle drei der folgenden Eigenschaften garantieren:

- **Consistency (C):** Jede Leseoperation gibt den aktuellsten Schreibwert zurück (oder einen Fehler). Gemeint ist hier **Linearisierbarkeit** – die stärkste Konsistenzgarantie.
- **Availability (A):** Jede Anfrage an einen nicht ausgefallenen Knoten erhält eine Antwort (kein Fehler, kein Timeout).
- **Partition Tolerance (P):** Das System funktioniert korrekt, auch wenn Netzwerkpartitionen Knoten voneinander trennen.

### Die eigentliche Aussage

In einem realen verteilten System sind **Netzwerkpartitionen unvermeidbar**. P ist also kein echtes Option – es ist eine Notwendigkeit. Damit reduziert sich CAP auf eine Wahl zwischen C und A **im Partitionsfall**:

- **CP-Systeme:** Bei Partition → Anfragen ablehnen (Fehler zurückgeben), bis Konsistenz wiederhergestellt ist. Beispiel: Zookeeper, HBase, traditionelle RDBMS mit 2PC.
- **AP-Systeme:** Bei Partition → weiterhin antworten, aber möglicherweise mit veralteten Daten. Beispiel: Cassandra, DynamoDB, CouchDB.

**Außerhalb von Partitionen** können Systeme sowohl konsistent als auch verfügbar sein. CAP beschreibt nur das Verhalten **im Fehlerfall**.

### CAP-Kritik und Einschränkungen

CAP ist ein Theorem über extreme Fälle. In der Praxis ist die Wahl nicht binär:
- "Consistency" in CAP meint Linearisierbarkeit – es gibt viele schwächere Konsistenzmodelle dazwischen.
- "Availability" in CAP meint 100% – jede Anfrage bekommt eine Antwort. Echte Systeme haben Latenz-SLAs, keine absolute Verfügbarkeitsgarantie.

**PACELC (Patterson 2012)** ist eine Erweiterung: Auch ohne Partition gibt es einen Trade-off zwischen Latenz (L) und Konsistenz (C). Ein System, das immer synchron repliziert, ist konsistent aber langsam. Eines, das asynchron repliziert, ist schnell aber eventuell inkonsistent.

---

## 4. Neue Konsistenzmodelle

Da starke Konsistenz (Linearisierbarkeit) bei hoher Verfügbarkeit und geografischer Verteilung teuer ist, haben sich viele abgestufte Konsistenzmodelle entwickelt.

### Eventual Consistency

**Definition:** Wenn keine neuen Schreibvorgänge mehr stattfinden, werden alle Replikate **irgendwann** denselben Wert haben.

Das ist das schwächste nicht-triviale Konsistenzmodell. Es gibt keine Garantie, wann die Konvergenz eintritt oder was ein Leser in der Zwischenzeit sieht.

**Geeignet für:** Systeme mit hoher Schreiblast, tolerantem Anwendungsfall (z. B. Shopping-Cart, Social-Media-Likes, DNS).  
**Ungeeignet für:** Finanztransaktionen, Inventarverwaltung mit harten Constraints.

### Monotonic Read Consistency

Wenn ein Client einmal einen Wert v gelesen hat, wird er nie wieder einen älteren Wert lesen. Lesevorgänge desselben Clients sind monoton.

**Implementierung:** Der Client merkt sich die LSN/Version des zuletzt gelesenen Werts. Anfragen an Replikate enthalten diese Version als Mindestanforderung.

### Read-your-Writes Consistency

Nachdem ein Client einen Wert geschrieben hat, sieht er bei nachfolgenden Lesevorgängen immer seinen eigenen Schreibwert – selbst wenn er von einem anderen Replikat liest.

**Implementierung:** Nach einem Schreibvorgang bekommt der Client eine Token/LSN. Lesevorgänge werden an Replikate geleitet, die mindestens diese LSN erreicht haben, oder an den Primär direkt.

### Causal Consistency

Schreibvorgänge, die kausal zusammenhängen, werden in allen Replikaten in derselben Reihenfolge gesehen. Kausal unabhängige Schreibvorgänge können in beliebiger Reihenfolge erscheinen.

```
T1: write(x=1)
T2: read(x=1), write(y=2)   ← y=2 ist kausal abhängig von x=1

Kausale Konsistenz garantiert: Jeder, der y=2 sieht, sieht auch x=1
```

Stärker als Eventual Consistency, schwächer als Linearisierbarkeit. Implementiert über **Vector Clocks** oder **Lamport Timestamps**.

### Linearisierability (Stärkste Garantie)

Jede Operation erscheint atomisch an einem einzigen Zeitpunkt zwischen ihrem Start und ihrem Ende. Entspricht dem Verhalten einer nicht-verteilten Datenbank.

**Kosten:** Erfordert Koordination bei jedem Schreibvorgang (z. B. Paxos oder Raft für Konsens). Hohe Latenz, begrenzte Verfügbarkeit bei Partitionen.

### Konsistenzmodelle im Überblick

```
Stärker  ┌─────────────────────────────┐
   ↑     │ Linearisierbarkeit          │ ← teuer, langsam, CP
   │     ├─────────────────────────────┤
   │     │ Serializability             │
   │     ├─────────────────────────────┤
   │     │ Causal Consistency          │
   │     ├─────────────────────────────┤
   │     │ Read-your-Writes            │
   │     ├─────────────────────────────┤
   │     │ Monotonic Read              │
   │     ├─────────────────────────────┤
   ↓     │ Eventual Consistency        │ ← billig, schnell, AP
Schwächer └─────────────────────────────┘
```

---

## 5. Konfliktauflösung bei Eventual Consistency

Wenn mehrere Replikate gleichzeitig Schreibvorgänge akzeptieren (AP-System), können Konflikte entstehen: Zwei Clients schreiben gleichzeitig denselben Wert auf verschiedenen Replikaten.

### Last-Write-Wins (LWW)

Der Schreibvorgang mit dem neuesten Timestamp gewinnt. Einfach, aber problematisch: Timestamps in verteilten Systemen sind schwer zu synchronisieren (NTP-Drift), und wertvolle Schreibvorgänge können verloren gehen.

### Multi-Version mit Application-Level Merge

Beide Versionen werden aufbewahrt (als Konflikt markiert). Die Anwendung muss den Konflikt auflösen. Amazon Dynamo und CouchDB verwenden diesen Ansatz. Erfordert, dass die Anwendung mit Konflikten umgehen kann – nicht für jede Domäne geeignet.

### CRDTs (Conflict-free Replicated Data Types)

Datenstrukturen, die so entworfen sind, dass **parallele Änderungen immer automatisch zusammenführbar** sind – ohne Konflikte.

Bedingung: Die Merge-Operation muss **kommutativ, assoziativ und idempotent** sein. Dann ist die Reihenfolge, in der Updates ankommen, irrelevant – das Ergebnis ist immer dasselbe.

Beispiele:
- **G-Counter (Grow-only Counter):** Jeder Knoten hält einen eigenen Zähler. Der Gesamtwert ist die Summe aller Knoten-Zähler. Inkrementieren auf einem Knoten ist immer konfliktfrei.
- **LWW-Register:** Pro Objekt wird der Timestamp mitgespeichert; Merge wählt immer den neueren Wert.
- **OR-Set (Observed-Remove Set):** Mengen, bei denen Add und Remove konfliktfrei zusammengeführt werden können.

CRDTs sind besonders geeignet für: Zähler, Mengen, Text-Collaboration (wie Google Docs intern).

---

## Zusammenfassung

| Konzept | Kernaussage |
|---|---|
| Synchrone Replikation | Alle Replikate bestätigen vor Erfolg; konsistent aber langsam bei Distanz |
| Asynchrone Replikation | Primär bestätigt sofort; Replikate hinken nach; Datenverlust bei Primärausfall möglich |
| Primary-Copy | Schreiben nur auf Primär; Lesen von Replikaten; Failover nötig |
| Quorum | R + W > N garantiert Überlappung; flexibler Trade-off zwischen Lese-/Schreiblatenz |
| CAP | Bei Partition: Wahl zwischen Konsistenz (CP) und Verfügbarkeit (AP); P ist keine echte Option |
| Eventual Consistency | Konvergenz irgendwann; schwächste sinnvolle Garantie; geeignet für tolerante Workloads |
| Causal Consistency | Kausal abhängige Writes in korrekter Reihenfolge; stärker als Eventual |
| Linearisierbarkeit | Stärkste Garantie; jede Operation atomar zu einem Zeitpunkt; teuer |
| CRDTs | Konfliktfreie Datenstrukturen durch kommutative Merge-Operationen |
