# Konsensalgorithmen: Paxos und Raft

---

## Das Konsensproblem

Mehrere Knoten in einem verteilten System sollen sich auf **einen einzigen Wert einigen** – obwohl Knoten ausfallen können und Nachrichten verloren gehen oder verzögert ankommen.

Das klingt einfach. Es ist es nicht. Der berühmte **FLP-Unmöglichkeitsbeweis** (Fischer, Lynch, Paterson 1985) zeigt: In einem rein asynchronen System mit auch nur einem möglichen Ausfall gibt es keinen deterministischen Konsensalgorithmus, der immer terminiert.

Die Praxis rettet sich aus diesem Dilemma durch eine realistische Annahme: Nachrichten kommen **irgendwann** an (partielle Synchronität). Damit sind Paxos und Raft möglich.

**Wozu braucht ein DBMS Konsens?**
- Wahl eines neuen Primärs bei Ausfall (Leader Election)
- Atomares Commit über hochverfügbare Koordinatorgruppen (erinnere: 2PC-Blocking-Problem)
- Replikation mit starker Konsistenz (Replicated State Machine)

---

## Paxos

Paxos (Lamport 1989, veröffentlicht 1998) ist der ursprüngliche Konsensalgorithmus. Er ist korrekt, aber notorisch schwer zu verstehen und zu implementieren.

### Rollen

- **Proposer:** Schlägt einen Wert vor.
- **Acceptor:** Stimmt über Vorschläge ab. Typisch dieselben Knoten wie Proposer.
- **Learner:** Erfährt den beschlossenen Wert (oft ebenfalls dieselben Knoten).

In der Praxis übernehmen alle Knoten alle Rollen.

### Phase 1: Prepare / Promise

**Proposer** wählt eine eindeutige, monoton wachsende **Proposal-Nummer n** und sendet:

```
Proposer → alle Acceptors: PREPARE(n)
```

Jeder Acceptor prüft: Habe ich bereits einem Prepare mit Nummer ≥ n geantwortet?
- Nein → Antworte mit **PROMISE(n)**: "Ich werde keinen Vorschlag mit Nummer < n mehr akzeptieren."
- Ja → Ignoriere oder antworte mit Ablehnung.

Die Promise enthält außerdem den **höchsten bisher akzeptierten Wert** des Acceptors (falls vorhanden).

**Quorum:** Der Proposer braucht Promises von einer **Mehrheit** (> N/2) der Acceptors.

### Phase 2: Accept / Accepted

Der Proposer hat ein Mehrheits-Quorum von Promises. Er wählt seinen Wert:
- Wenn ein Acceptor in seiner Promise einen bereits akzeptierten Wert zurückgegeben hat → **muss** der Proposer diesen Wert verwenden (höchste Proposal-Nummer gewinnt).
- Sonst → kann er seinen eigenen Wert vorschlagen.

```
Proposer → alle Acceptors: ACCEPT(n, wert)
```

Jeder Acceptor: Hat er seit seiner Promise kein neueres Prepare gesehen?
- Nein → **Akzeptiert** den Vorschlag, sendet ACCEPTED(n, wert) an Proposer und Learner.
- Ja → Lehnt ab.

**Beschluss:** Sobald eine Mehrheit ACCEPTED gesendet hat, ist der Wert **beschlossen (chosen)**.

### Warum ist Paxos korrekt?

Das zentrale Invariant: Wenn ein Wert v mit Nummer n beschlossen wurde, kann kein späterer Proposer mit Nummer n' > n einen anderen Wert w ≠ v durchsetzen.

**Beweis-Idee:** Der neue Proposer braucht ein Mehrheits-Quorum für seine Prepare-Phase. Dieses Quorum muss mindestens einen Acceptor enthalten, der den alten Wert v akzeptiert hat (weil beide Mehrheiten sich überschneiden müssen). Dieser Acceptor meldet v in seiner Promise zurück. Der neue Proposer ist dann **verpflichtet**, v zu übernehmen.

### Multi-Paxos: Von einem Wert zu einem Log

Einzel-Paxos beschließt einen Wert. Eine Datenbank braucht eine **Sequenz** von Werten (einen Log). Multi-Paxos löst das durch:

1. **Leader-Wahl:** Ein Proposer wird zum Leader gewählt (Phase 1 einmalig für eine Sequenz von Slots).
2. **Normale Betrieb:** Der Leader schlägt Werte für aufeinanderfolgende Log-Slots direkt vor (nur Phase 2 pro Eintrag – Phase 1 entfällt für den laufenden Betrieb).
3. **Leader-Ausfall:** Neuer Leader führt Phase 1 mit höherer Nummer durch, "heilt" unvollständige Einträge.

### Das Problem mit Paxos in der Praxis

Lamport selbst schrieb 2001: "Paxos ist notoriously difficult to understand." Die Lücke zwischen dem theoretischen Protokoll und einer produktionstauglichen Implementierung ist enorm:

- Multi-Paxos ist im Originalpaper nicht vollständig spezifiziert.
- Leader-Wahl, Log-Kompaktierung, Membership-Änderungen – alles muss selbst erfunden werden.
- Byzantine Failures (absichtlich falsche Knoten) deckt Paxos nicht ab.

Google Chubby und Apache Zookeeper implementieren Paxos-Varianten, aber jede Implementierung hat eigene Designentscheidungen getroffen, die das Paper offenlässt.

---

## Raft

Raft (Ongaro & Ousterhout 2014) wurde explizit mit dem Ziel entworfen, **verständlich** zu sein. Es ist äquivalent zu Multi-Paxos in Korrektheit und Performance, aber die Designentscheidungen sind explizit dokumentiert.

### Grundprinzip: Starker Leader

Raft wählt einen **Leader**, der alle Entscheidungen trifft. Alle Schreibvorgänge gehen durch den Leader. Follower replizieren passiv. Das vereinfacht das Protokoll erheblich – es gibt nur einen Koordinationspunkt.

### Terme (Terms)

Die Zeit ist in **Terme** eingeteilt. Jeder Term beginnt mit einer **Leader-Wahl**. Terme sind monoton wachsende Nummern. Jeder Knoten kennt den aktuellen Term und lehnt Nachrichten aus älteren Termen ab.

```
Term 1: [Leader-Wahl] → [Leader A operiert]
Term 2: [Leader-Wahl] → [Leader B operiert]  (A ist ausgefallen)
Term 3: [Leader-Wahl] → [kein Leader gewählt]  (Split-Vote)
Term 4: [Leader-Wahl] → [Leader A operiert]  (A ist wieder da)
```

### Leader-Wahl

Jeder Knoten startet als **Follower**. Wenn ein Follower über einen Timeout hinaus keine Nachricht vom Leader hört, wird er zum **Candidate**:

1. Inkrementiere den Term.
2. Stimme für dich selbst.
3. Sende `RequestVote(term, lastLogIndex, lastLogTerm)` an alle anderen.

Ein Knoten gibt seine Stimme wenn:
- Der Term des Candidates ≥ eigener Term.
- Das Log des Candidates mindestens so aktuell ist wie das eigene (verglichen über lastLogTerm, dann lastLogIndex).
- Er in diesem Term noch nicht für jemand anderen gestimmt hat.

Erhält ein Candidate eine Mehrheit → wird Leader. Bei Split-Vote (kein Candidate erhält Mehrheit) → Timeout, neuer Term, neue Wahl. Zufällige Timeouts machen Split-Votes in der Praxis selten.

### Log-Replikation (Normalbetrieb)

```
Client → Leader: WRITE(x=42)
Leader: füge Eintrag ins eigenes Log ein (uncommitted)
Leader → alle Follower: AppendEntries(term, entries, prevLogIndex, prevLogTerm)
Follower: fügen Eintrag ins Log ein, antworten mit SUCCESS
Leader: wenn Mehrheit geantwortet hat → Eintrag ist committed
Leader → Client: SUCCESS
Leader → Follower: nächste AppendEntries enthält commitIndex → Follower applyen den Eintrag
```

**AppendEntries** dient auch als **Heartbeat**: Der Leader sendet regelmäßig leere AppendEntries, damit Follower wissen, dass er lebt.

### Log-Konsistenz

Raft garantiert die **Log Matching Property:**
- Zwei Einträge in verschiedenen Logs mit gleichem Index und gleichem Term sind identisch.
- Alle vorherigen Einträge sind ebenfalls identisch.

Der Mechanismus: `prevLogIndex` und `prevLogTerm` in AppendEntries. Ein Follower lehnt ab, wenn sein Log an dieser Stelle nicht übereinstimmt. Der Leader sendet dann ältere Einträge nach, bis Übereinstimmung hergestellt ist.

### Leader-Ausfall und Recovery

Wenn ein neuer Leader gewählt wird, hat er möglicherweise nicht alle committed Einträge (obwohl Raft das durch die Wahlbedingung minimiert). Der neue Leader:

1. Sendet sein Log an alle Follower.
2. Follower, die neuere (uncommitted) Einträge haben, **überschreiben** diese mit denen des Leaders.
3. Der Leader committed nie Einträge aus früheren Termen direkt – er wartet, bis ein Eintrag aus dem **aktuellen Term** committed ist, was implizit alle früheren committeten Einträge sichert.

### Raft vs. Paxos

| Eigenschaft | Paxos (Multi-Paxos) | Raft |
|---|---|---|
| Verständlichkeit | schwer | explizit für Verständlichkeit entworfen |
| Korrektheit | äquivalent | äquivalent |
| Leader | implizit | explizit, zentrales Designprinzip |
| Log-Lücken | möglich (Paxos füllt sie) | nicht möglich (Leader-Log ist immer Autorität) |
| Membership-Änderungen | nicht spezifiziert | Joint Consensus oder Single-Server-Changes |
| Verbreitung | Zookeeper, Chubby | etcd, CockroachDB, TiKV, RabbitMQ |

---

## Verbindung zum DBMS

**Replicated State Machine:** Eine Gruppe von Knoten, die alle denselben Raft-Log replizieren und dieselbe Sequenz von Operationen anwenden, verhalten sich wie ein einzelner hochverfügbarer Knoten. Das ist die Grundlage für hochverfügbare DBMS-Primärknoten.

**2PC über Raft:** Statt einem einzelnen Koordinator (anfällig für Blocking bei Ausfall) verwendet ein System wie Google Spanner eine **Raft-Gruppe als Koordinator**. Fällt der Leader der Koordinatorgruppe aus, wählt die Gruppe einen neuen Leader und setzt das 2PC-Protokoll fort. Kein Blocking mehr.

---

## Zusammenfassung

| Konzept | Kernaussage |
|---|---|
| Konsensproblem | Mehrere Knoten einigen sich auf einen Wert trotz Ausfällen |
| FLP-Unmöglichkeit | Kein deterministischer Konsens in rein asynchronen Systemen |
| Paxos Phase 1 | Prepare/Promise: Mehrheit verpflichtet sich, ältere Proposals zu ignorieren |
| Paxos Phase 2 | Accept/Accepted: Mehrheit akzeptiert Wert → Wert ist beschlossen |
| Paxos Schwäche | Lücke zwischen Theorie und Implementierung; Multi-Paxos unvollständig spezifiziert |
| Raft Leader | Starker Leader trifft alle Entscheidungen; vereinfacht Protokoll erheblich |
| Raft Wahl | Candidate braucht Mehrheit; Log-Aktualität als Wahlbedingung |
| Raft Log-Replikation | AppendEntries + prevLogIndex/Term sichert Log Matching Property |
| DBMS-Anwendung | Raft-Gruppe als Koordinator löst 2PC-Blocking-Problem |
