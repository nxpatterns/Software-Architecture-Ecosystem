# Gesamtübersicht – Datenbanksysteme (Masterstudium Informatik)

Diese Übersicht zeigt, wie die Themen des Kurses zusammenhängen und aufeinander aufbauen. Sie ersetzt nicht die Einzeldokumente, hilft aber beim Einordnen der Konzepte.

---

## Der rote Faden: Von der Festplatte zur verteilten Transaktion

```
┌─────────────────────────────────────────────────────────────┐
│               Anwendung / SQL-Anfrage                       │
├─────────────────────────────────────────────────────────────┤
│  L4: Anfrageoptimierung                                     │
│  Operatorbaum → algebraische Optimierung → Selinger-DP      │
├─────────────────────────────────────────────────────────────┤
│  L3: Ausführung                                             │
│  Iterator-Modell, Join-Algorithmen, externes Sortieren      │
├─────────────────────────────────────────────────────────────┤
│  L5: Concurrency Control          L6: Recovery              │
│  2PL, MVCC, Isolation Level       WAL, ARIES, Checkpoints   │
├─────────────────────────────────────────────────────────────┤
│  L2: Indexstrukturen & Pufferverwaltung                     │
│  B+-Baum, Hashing, LRU-K, Steal/No-Force                   │
├─────────────────────────────────────────────────────────────┤
│  L1: Speicher & Architektur                                 │
│  Slotted Pages, Clusterung, Dateiorganisation, Systemkatalog│
└─────────────────────────────────────────────────────────────┘
                         ↕
┌─────────────────────────────────────────────────────────────┐
│  L7: Verteilte Systeme                                      │
│  Shared-Nothing, Partitionierung, 2PC, Replikation, CAP     │
└─────────────────────────────────────────────────────────────┘
```

---

## Lektion 1: Die Basis – Warum ein DBMS und wie ist es gebaut?

Ein DBMS ist nicht einfach ein besseres Dateisystem. Es löst systematisch vier Probleme, die ein Dateisystem nicht lösen kann: **Konsistenz** (WAL + Transaktionen), **Mehrbenutzerbetrieb** (Locking / MVCC), **Persistenz** (WAL + Redo) und **deklarative Anfragen** (Optimierer).

Die Architektur ist strikt geschichtet: Jede Schicht abstrahiert die darunterliegende. Der Optimierer weiß nicht, wie Seiten auf der Platte liegen. Der Buffer Pool weiß nicht, was die Anfrage semantisch bedeutet.

Das **Slotted Page Format** mit stabilen RIDs `(PageID, SlotID)` ist die Grundlage für alle höheren Strukturen – Indexe, Recovery, Concurrency Control arbeiten alle mit RIDs.

---

## Lektion 2: Indexstrukturen und Pufferverwaltung

Der **B+-Baum** ist die wichtigste Datenstruktur in relationalen DBMS. Er ist in O(log_B n) I/Os navigierbar, unterstützt Bereichsanfragen durch die verkettete Blattliste und bleibt durch Splits und Merges immer balanciert.

**Hashing** ist für Punktanfragen schneller (O(1)), aber ohne Bereichsunterstützung. Dynamische Varianten (erweiterbares Hashing, lineares Hashing) lösen das Wachstumsproblem von statischem Hashing.

Die **Pufferverwaltung** ist der kritische Verbindungspunkt zwischen Speicher und allen höheren Schichten. Die Wahl der Ersetzungsstrategie (LRU, MRU, Clock, LRU-K) hängt vom Workload ab – LRU ist nicht universell optimal.

**Steal/No-Force** ist das Praxisstandard-Policy-Paar: Seiten können verdrängt werden (Steal), müssen aber nicht beim Commit geflusht werden (No-Force). WAL kompensiert beides.

---

## Lektion 3: Ausführung – Wie eine Anfrage tatsächlich läuft

Das **Iterator-Modell** (Volcano) verbindet Operatoren durch `next()`-Aufrufe zu einer Pipeline. Tupel fließen von unten nach oben – ohne vollständige Materialisierung von Zwischenergebnissen. Blockierende Operatoren (Sort, Hash-Join Build-Phase) unterbrechen die Pipeline.

**Externes Sortieren** ist fundamental: Sort-Merge-Join, ORDER BY und GROUP BY brauchen es alle. Mit B Puffer-Frames und k-Wege-Merge kommt man mit O(log_{B-1}(n/B)) Runden aus. Die 2-Phasen-Bedingung `n ≤ B²` ist die wichtigste Faustregel.

**Join-Algorithmen** unterscheiden sich drastisch in ihren I/O-Kosten. Hash-Join ist O(|R|+|S|) – optimal für Equi-Joins. Sort-Merge lohnt sich bei vorsortierten Daten oder Range-Joins. Block-NLJ ist der sichere Fallback.

Geometrische Indexstrukturen (R-Baum, Grid-File, k-d-b-Baum) sind nötig, weil geometrische Daten keine totale Ordnung haben und B+-Bäume dafür strukturell ungeeignet sind.

---

## Lektion 4: Anfrageoptimierung – Wie der beste Plan gefunden wird

Der Optimierer übersetzt SQL in einen Operatorbaum und transformiert ihn in zwei Stufen:

1. **Algebraische Optimierung:** Regeln wie Selection Pushdown, Projection Pushdown und Join-Umordnung reduzieren die Datenmenge so früh wie möglich. Das ist der größte Hebel.

2. **Kostenbasierte Optimierung (Selinger):** Dynamische Programmierung über Join-Reihenfolgen. Für n Tabellen werden nur Left-Deep Trees betrachtet – O(n·2^n) Teilpläne statt n!. Interessante Sortierungen verhindern, dass global optimale Pläne verworfen werden, weil sie lokal teurer erscheinen.

**Selektivität** ist die Grundlage aller Kostenschätzungen. Histogramme im Systemkatalog sind entscheidend – veraltete Statistiken sind die häufigste Ursache für schlechte Anfragepläne in der Praxis.

---

## Lektion 5: Concurrency Control – Gleichzeitigkeit ohne Chaos

Ohne Synchronisation entstehen vier Klassen von Anomalien: Lost Update, Dirty Read, Non-Repeatable Read, Phantom Read. Das Korrektheitskriterium ist **Serialisierbarkeit** – Parallelität soll nach außen wie serielle Ausführung aussehen.

**Strict 2PL** mit X-Locks bis Commit ist der Praxisstandard. Es verhindert alle Anomalien, aber nicht Deadlocks. Deadlocks werden per **Wait-for-Graph** erkannt (DFS, O(V+E)) und durch Rollback des Opfers aufgelöst.

**MVCC / Snapshot Isolation** gibt Lesern eine Snapshot-Sicht, ohne Schreiber zu blockieren. Es ist nicht serialisierbar (Write Skew ist möglich). **Serializable Snapshot Isolation (SSI)** schließt diese Lücke durch Tracking von rw-Abhängigkeiten – ohne die Leseparallelität aufzugeben.

Die **Isolation Level** (Read Uncommitted bis Serializable) sind Kompromisse. Read Committed ist oft zu schwach für Finanzdaten; Entwickler sollten das bewusst wählen.

---

## Lektion 6: Recovery – Korrektheit nach Ausfällen

Recovery beantwortet eine einfache Frage: Wie stellt das DBMS nach einem Absturz garantiert den korrekten Zustand wieder her?

Das **WAL-Prinzip** ist die Antwort: Bevor eine Änderung persistiert wird, muss ihr Log-Eintrag persistiert sein. Damit ist Redo möglich (committete, nicht persistierte Änderungen wiederholen) und Undo möglich (uncommittete, persistierte Änderungen rückgängig machen).

**ARIES** implementiert das in drei Phasen: Analysis (wer war aktiv?), Redo (alles wiederherstellen, auch uncommittetes), Undo (uncommittetes zurückrollen). **CLRs** machen das Undo selbst crash-sicher. **Fuzzy Checkpoints** begrenzen, wie weit das Log beim Neustart gelesen werden muss.

**Physiologisches Logging** (physisch auf Seitenebene, logisch innerhalb) ist der Praxisstandard – kompakter als reines physisches Logging, sicherer als rein logisches.

---

## Lektion 7: Verteilte Systeme – Wenn ein Server nicht reicht

Verteilte DBMS verteilen Daten auf mehrere Knoten. **Shared-Nothing** ist der Standard: Jeder Knoten hat eigenen Prozessor, RAM und Speicher; Kommunikation nur über Netzwerk. Das skaliert linear, erfordert aber aufwändige Koordination.

**Partitionierung** (horizontal: Tupel aufteilen; vertikal: Spalten aufteilen) und **Allokation** (wo liegen die Fragmente, repliziert oder nicht) sind die zentralen Designentscheidungen.

**Verteilte Anfragebearbeitung** minimiert Netzwerkübertragung. Der Semijoin ist die clevere Technik: Nur Schlüssel übertragen, die innere Relation vorfiltern.

**Two-Phase Commit (2PC)** garantiert atomares Commit über Knoten – hat aber ein fundamentales Blocking-Problem bei Koordinatorausfall. **Paxos** und **Raft** lösen das durch hochverfügbare Koordinatorgruppen.

**Replikation** bringt Verfügbarkeit und Leseperformance, erzeugt aber Konsistenzprobleme. Das **CAP-Theorem** zeigt: Bei Netzwerkpartitionen muss man zwischen Konsistenz und Verfügbarkeit wählen. Schwächere Konsistenzmodelle (Eventual Consistency, Causal Consistency) sind der praktische Kompromiss.

**CRDTs** lösen Konflikte bei Eventual Consistency strukturell: Datentypen, deren Merge-Operation kommutativ, assoziativ und idempotent ist, haben per Konstruktion keine Konflikte.

---

## Zentrale Querverbindungen

| Konzept | Taucht auf in |
|---|---|
| WAL / Log | L1 (Grundidee), L2 (Steal/No-Force), L6 (ARIES vollständig) |
| Buffer Pool | L1 (Einführung), L2 (Strategien), L6 (Dirty Pages, WAL-Bedingung) |
| RID (PageID, SlotID) | L1 (Slotted Pages), L2 (Indexzeiger), L5 (Lock Granularität) |
| Selektivität | L2 (Index-Entscheidung), L4 (Kostenschätzung), L3 (Join-Wahl) |
| Serialisierbarkeit | L5 (2PL, SSI), L7 (verteilte Transaktionen, 2PC) |
| Quorum | L7 (Replikation), L7 (Paxos/Raft implizit) |
| I/O-Minimierung | L1–L3 (lokales DBMS), L7 (Netzwerkübertragung als neue Dimension) |

---

## Prüfungsrelevante Kernthemen

Basierend auf den Lernzielen sind folgende Themen besonders prüfungsrelevant:

**Rechnen können:**
- I/O-Kosten für Join-Algorithmen (NLJ, BNLJ, SMJ, Hash-Join)
- I/O-Kosten für externes Sortieren (Runs, Runden, 2-Phasen-Bedingung)
- Selektivitätsschätzung und Kardinalitätsberechnung
- Quorum-Bedingung R + W > N

**Algorithmen erklären und anwenden:**
- B+-Baum Einfügung und Split
- ARIES (Analysis, Redo, Undo)
- Selinger-Algorithmus (DP-Struktur)
- 2PC Protokollablauf und Blocking-Problem
- Wait-for-Graph und Deadlock-Erkennung

**Konzepte vergleichen:**
- Dateiorganisationen (Heap vs. sequenziell vs. Hash)
- Indexstrukturen (B+-Baum vs. Hash vs. R-Baum)
- Join-Algorithmen (wann welchen)
- Isolation Level und ihre Anomalien
- CAP-Positionen (CP vs. AP) und Konsistenzmodelle
- Replikationsvarianten (synchron vs. asynchron, Primary-Copy vs. Quorum)
