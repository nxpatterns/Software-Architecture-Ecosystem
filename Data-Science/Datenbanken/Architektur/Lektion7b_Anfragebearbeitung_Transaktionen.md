# Lektion 7b: Verteilte Datenbankarchitekturen – Anfragebearbeitung und Transaktionen

---

## 1. Verteilte Anfragebearbeitung

### Das Grundproblem: Netzwerkkosten dominieren

In einem lokalen DBMS dominieren I/O-Kosten. In einem verteilten System kommt eine weitere Kostendimension hinzu: **Netzwerkkommunikation**. Eine Netzwerkübertragung ist oft teurer als ein lokaler Plattenzugriff – und hat zudem variable Latenz.

Das Ziel der verteilten Anfrageoptimierung: **Datenübertragung minimieren**, nicht nur I/Os.

### Wie entsteht ein verteilter Anfrageplan?

Die Optimierung läuft in zwei Stufen:

1. **Globale Optimierung:** Der Koordinator-Knoten übersetzt die Anfrage in einen **globalen Anfrageplan** – welche Fragmente werden auf welchen Knoten gebraucht, in welcher Reihenfolge werden Joins ausgeführt, welche Zwischenergebnisse werden über das Netz übertragen?

2. **Lokale Optimierung:** Jeder Knoten optimiert seinen Teil des Plans lokal (wie in einer zentralen Datenbank).

### Datenübertragungsstrategien beim Join

Angenommen, Relation R liegt auf Node1 und Relation S liegt auf Node2, und wir wollen `R ⋈ S` berechnen.

**Strategie 1 – Ship Whole:**  
Übertrage R vollständig zu Node2 (oder S zu Node1), führe den Join lokal aus.

Kosten: `|R|` übertragen + lokaler Join.  
Sinnvoll wenn: Eine Relation deutlich kleiner ist als die andere.

**Strategie 2 – Fetch as Needed:**  
Für jedes Tupel von R auf Node1, hole die passenden Tupel von S von Node2.

Kosten: Für jedes Tupel in R ein Netzwerk-Request. Bei vielen Tupeln: katastrophal. Nur sinnvoll mit Index auf S und sehr wenigen Treffern.

**Strategie 3 – Repartitioniere beide Relationen:**  
Hashe beide Relationen nach dem Join-Attribut, verteile Partitionen so, dass Join-Partner immer auf demselben Knoten landen.

Kosten: `|R| + |S|` übertragen + paralleler lokaler Join auf allen Knoten.  
Sinnvoll für: Große Equi-Joins auf vielen Knoten (MPP-Standard).

**Strategie 4 – Broadcast der kleineren Relation:**  
Sende die kleinere Relation (z. B. R) an alle Knoten, die Teile von S halten. Jeder Knoten joinnt lokal.

Kosten: `|R| × Anzahl Knoten` übertragen.  
Sinnvoll wenn: R sehr klein ist (z. B. eine Lookup-Tabelle).

### Der Semijoin

Der **Semijoin** ist eine Technik, um Netzwerkübertragung bei Joins zu reduzieren.

**Ziel:** Statt R vollständig zu übertragen, schicke nur die Join-Schlüssel von R zu Node2. Node2 filtert S auf passende Tupel und schickt nur diese zurück. Dann joinnt Node1 lokal.

```
Node1 hat R, Node2 hat S. Gesucht: R ⋈_{R.key=S.key} S

Schritt 1: Node1 → Node2: Sende π_{key}(R)  (nur Schlüssel, kein Rest)
Schritt 2: Node2 berechnet S' = S ⋈_{S.key ∈ π_{key}(R)} S  (filtert S)
Schritt 3: Node2 → Node1: Sende S'
Schritt 4: Node1 berechnet R ⋈ S' lokal
```

**Wann lohnt sich Semijoin?**

Kosten Direktübertragung: `|R|` (R komplett zu Node2 schicken)  
Kosten Semijoin: `|π_{key}(R)| + |S'|`

Semijoin lohnt sich wenn: `|π_{key}(R)| + |S'| < |R|`

Das heißt: Je selektiver der Join (wenig Treffer in S), und je breiter R (viele Attribute, die nicht gebraucht werden), desto mehr spart der Semijoin.

Bei hoher Join-Selektivität (fast alle Tupel matchen) lohnt er sich nicht.

---

## 2. Verteilte Transaktionen

### Das Problem

Eine Transaktion in einem verteilten System greift typisch auf Daten auf **mehreren Knoten** zu. Sie muss trotzdem die ACID-Eigenschaften erfüllen – insbesondere:

- **Atomicity über Knoten:** Entweder committen alle beteiligten Knoten, oder keiner.
- **Isolation über Knoten:** Parallele Transaktionen auf verschiedenen Knoten sehen sich nicht in Zwischenzuständen.

Durability und Consistency sind lokale Eigenschaften (jeder Knoten hat sein eigenes WAL).

### Koordinator und Teilnehmer

Jede verteilte Transaktion hat:
- Einen **Koordinator** (der Knoten, der die Transaktion gestartet hat oder ein dedizierter Koordinationsknoten).
- Mehrere **Teilnehmer** (alle Knoten, auf die die Transaktion zugreift).

Der Koordinator orchestriert das Commit-Protokoll.

---

## 3. Two-Phase Commit (2PC)

Das klassische Protokoll für atomares Commit über mehrere Knoten.

### Phase 1: Prepare (Abstimmung)

```
Koordinator → alle Teilnehmer: "PREPARE"

Jeder Teilnehmer:
  - Schreibt alle Änderungen ins Log (WAL, bis zum Prepare-Eintrag)
  - Stellt sicher, dass er committen KANN (Sperren halten, Log persistiert)
  - Antwortet: "VOTE_COMMIT" oder "VOTE_ABORT"
```

Ein Teilnehmer, der VOTE_COMMIT sendet, hat sich **verpflichtet**: Er kann nicht mehr einseitig aborben. Er hält seine Sperren bis zur Entscheidung des Koordinators.

### Phase 2: Commit oder Abort

```
Wenn ALLE Teilnehmer VOTE_COMMIT:
  Koordinator schreibt COMMIT ins Log
  Koordinator → alle Teilnehmer: "COMMIT"
  Jeder Teilnehmer: committet lokal, gibt Sperren frei, bestätigt mit ACK

Wenn MINDESTENS EIN Teilnehmer VOTE_ABORT (oder Timeout):
  Koordinator schreibt ABORT ins Log
  Koordinator → alle Teilnehmer: "ABORT"
  Jeder Teilnehmer: rollt zurück, gibt Sperren frei
```

### Korrektheit

2PC garantiert atomares Commit: Entweder committen alle oder keiner. Beweis: Der Koordinator entscheidet erst nach Erhalt aller Votes. Wenn er COMMIT entscheidet, haben alle Teilnehmer bereits VOTE_COMMIT gesendet und können nicht mehr einseitig aborben.

### Das Blocking-Problem

2PC hat ein fundamentales Problem: **Blocking bei Koordinatorausfall.**

Szenario: Ein Teilnehmer hat VOTE_COMMIT gesendet (committed sich also). Der Koordinator fällt aus, bevor er die Phase-2-Entscheidung senden kann. Der Teilnehmer:
- Weiß nicht, ob die Entscheidung COMMIT oder ABORT ist.
- Kann nicht einseitig entscheiden (er hat sich verpflichtet).
- Hält seine Sperren weiterhin.
- **Ist blockiert, bis der Koordinator wieder verfügbar ist.**

Dieser Zustand kann Minuten oder Stunden dauern. In einer produktiven Datenbank ist das inakzeptabel – aber 2PC hat keine Lösung dafür. Das ist ein bekanntes, inhärentes Problem des Protokolls.

**In der Praxis:** 2PC ist trotzdem der Standard, weil Koordinatorausfälle selten sind und die Blocking-Zeit in der Praxis kurz bleibt. Systeme wie Google Spanner implementieren 2PC über Paxos-Gruppen, um den Koordinator selbst hochverfügbar zu machen.

### Recovery nach Absturz

**Koordinator-Absturz vor Phase 2:** Beim Neustart liest der Koordinator sein Log. Hat er noch kein COMMIT oder ABORT geschrieben → Entscheidung ist noch nicht getroffen → er kann ABORT entscheiden.

**Teilnehmer-Absturz nach VOTE_COMMIT:** Beim Neustart findet der Teilnehmer VOTE_COMMIT im Log aber kein COMMIT oder ABORT → er fragt den Koordinator nach der Entscheidung (Termination Protocol).

**Koordinator-Absturz nach COMMIT-Log-Eintrag:** Beim Neustart findet er COMMIT im Log → muss Phase 2 wiederholen (COMMIT an alle Teilnehmer erneut senden).

---

## 4. Three-Phase Commit (3PC)

3PC löst das Blocking-Problem von 2PC durch eine zusätzliche Phase, die verhindert, dass Teilnehmer sich in einer unentscheidbaren Situation befinden.

### Die drei Phasen

**Phase 1 – Prepare:** Identisch zu 2PC.

**Phase 2 – Pre-Commit:**  
```
Koordinator → alle Teilnehmer: "PRE-COMMIT"
Teilnehmer: bestätigen mit ACK
```
Diese Phase signalisiert: "Die Entscheidung wird COMMIT sein." Nach diesem Punkt kann der Koordinator nicht mehr ABORT entscheiden.

**Phase 3 – Commit:**  
```
Koordinator → alle Teilnehmer: "COMMIT"
Teilnehmer: committen lokal
```

### Warum löst das Blocking?

Nach Phase 2 wissen alle erreichbaren Teilnehmer: Die Entscheidung ist COMMIT. Wenn der Koordinator jetzt ausfällt, können die Teilnehmer **selbst COMMIT entscheiden** – ohne auf den Koordinator zu warten.

Wenn ein Teilnehmer ausfällt, bevor er PRE-COMMIT erhalten hat, und dann der Koordinator ausfällt, können die verbleibenden Teilnehmer ABORT entscheiden (sie wissen, dass der ausgefallene Teilnehmer noch nicht bereit ist).

### Warum 3PC in der Praxis selten ist

3PC ist non-blocking nur unter der Annahme, dass **keine Netzwerkpartitionierung** auftreten kann. Bei einer Netzwerkpartition können zwei Teilnehmer-Gruppen unabhängig voneinander unterschiedliche Entscheidungen treffen – ein Split-Brain.

In realen Netzwerken sind Partitionen möglich. 3PC ist daher kein generelles Mittel gegen Blocking. **Paxos und Raft** (Konsensalgorithmen) lösen das Problem robuster, sind aber komplexer. Moderne verteilte DBMS verwenden diese statt 3PC.

---

## Zusammenfassung

| Konzept | Kernaussage |
|---|---|
| Netzwerkkosten dominieren | Verteilte Optimierung minimiert Datenübertragung, nicht nur I/Os |
| Ship Whole vs. Repartitionieren | Kleine Relation übertragen oder beide hashen und verteilen |
| Semijoin | Nur Schlüssel übertragen, S vorfiltern – lohnt sich bei hoher Selektivität |
| 2PC – Phase 1 | Alle Teilnehmer voten; VOTE_COMMIT ist bindend |
| 2PC – Phase 2 | Koordinator entscheidet; alle committen oder alle aborben |
| 2PC Blocking | Koordinatorausfall nach VOTE_COMMIT blockiert Teilnehmer indefinit |
| 3PC | Zusätzliche Pre-Commit-Phase; non-blocking aber nicht partitionsresistent |
| Paxos / Raft | Robuste Alternative für hochverfügbares Commit; Standard in modernen Systemen |
