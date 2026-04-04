# Inhaltsverzeichnis – Datenbanksysteme (Masterstudium Informatik)

---

## Lektion 1: Architektur eines Datenbanksystems & Externspeicherverwaltung

| Dokument | Inhalt |
|---|---|
| `Lektion1_Datenbankarchitektur.md` | DBS vs. Dateisysteme, 3-Ebenen-Modell, DBMS-Architektur, Datensatz- und Seitenformate, Clusterung, Dateiorganisationen, Systemkatalog |
| `Lektion1_Abschnitt1_ueberarbeitet.md` | Vertiefung: Wie DBMS Konsistenz, Mehrbenutzerbetrieb, Persistenz und deklarative Anfragen konkret realisiert |

---

## Lektion 2: Externspeicher- und Systemverwaltung

| Dokument | Inhalt |
|---|---|
| `Lektion2_Externspeicher_Indexstrukturen.md` | Segmentkonzept, Schattenspeicher, Steal/No-Force, Systempufferverwaltung, Seitenersetzungsstrategien (LRU/MRU/Clock/LRU-K), Indexstrukturen: ISAM, B/B+/B*-Baum, statisches/erweiterbares/lineares Hashing |
| `Lektion2_BPlusTree_Split.md` | Vertiefung: B+-Baum-Einfügung und Split Schritt für Schritt – Blatt-Split, innerer Knoten-Split, neues Wurzelwachstum |

---

## Lektion 3: Indexstrukturen, Externes Sortieren, Auswertung relationaler Pläne

| Dokument | Inhalt |
|---|---|
| `Lektion3_Indexstrukturen_Sort_Plaene.md` | Geometrische Indexstrukturen (Grid-File, k-d-b-Baum, R-Baum, R+-Baum), externes Sortieren (k-Wege-Mergesort, Replacement Selection, Double Buffering), Iterator-Modell, Join-Algorithmen |
| `Lektion3_Join_IO_Kosten.md` | Vertiefung: I/O-Kostenherleitung für NLJ, Block-NLJ, Sort-Merge-Join, Hash-Join – mit vollständigen Beispielrechnungen |
| `Lektion3_Externes_Sortieren_IO_Kosten.md` | Vertiefung: I/O-Kostenherleitung für externes Sortieren – initiale Runs, k-Wege-Merge, 2-Phasen-Sort-Bedingung, Replacement Selection, Double Buffering |

---

## Lektion 4: Anfrageoptimierung – Berechnung eines effizienten Plans

| Dokument | Inhalt |
|---|---|
| `Lektion4_Anfrageoptimierung.md` | Operatorbaum, Übersetzerbau-Techniken, Prädikats-Standardisierung (CNF), Entschachtelung von Subqueries, algebraische Optimierung (Selection/Projection Pushdown, Join-Umordnung), Selektivität und Kostenschätzung, Selinger-Algorithmus (DP über Left-Deep Trees), interessante Sortierungen, teure Prädikate |

---

## Lektion 5: Transaktionen und Concurrency Control

| Dokument | Inhalt |
|---|---|
| `Lektion5_Transaktionen_Concurrency.md` | ACID, Anomalien im Mehrbenutzerbetrieb (Lost Update, Dirty Read, Non-Repeatable Read, Phantom), Serialisierbarkeit, Serialisierbarkeits-Graph, Strict 2PL, pessimistische/optimistische/Timestamp-Verfahren, Intention Locks, MVCC, Snapshot Isolation, Isolation Level |
| `Lektion5_Deadlock_Wait_for_Graph.md` | Vertiefung: Deadlock-Erkennung via Wait-for-Graph, DFS-Algorithmus, Opferwahl, Wait-Die/Wound-Wait |
| `Lektion5_SSI.md` | Vertiefung: Serializable Snapshot Isolation – Write Skew, rw-Abhängigkeiten, Dangerous Structures, SIREAD-Locks, Vergleich mit 2PL |

---

## Lektion 6: Recovery

| Dokument | Inhalt |
|---|---|
| `Lektion6_Recovery.md` | Fehlerklassen (Transaktion, System, Medium, Katastrophe), DBMS-Komponenten (Log-Manager, Buffer Pool, Recovery Manager, Checkpoint-Manager), Protokollierungsarten (physisch, logisch, physiologisch), WAL-Prinzip, ARIES (Analysis, Redo, Undo), CLRs, Fuzzy Checkpoints |

---

## Lektion 7: Verteilte Datenbankarchitekturen

| Dokument | Inhalt |
|---|---|
| `Lektion7a_Architektur_Partitionierung_Schema.md` | Architekturmodelle (Shared-Memory, Shared-Disk, Shared-Nothing), horizontale/vertikale/hybride Partitionierung, Partitionierungsstrategien (Range, Hash, List, Consistent Hashing), Allokation, globales konzeptuelles Schema, Verteilungstransparenz |
| `Lektion7b_Anfragebearbeitung_Transaktionen.md` | Verteilte Anfrageoptimierung, Datenübertragungsstrategien (Ship Whole, Repartitionieren, Broadcast), Semijoin, verteilte Transaktionen, Two-Phase Commit (2PC) inkl. Blocking-Problem, Three-Phase Commit (3PC) |
| `Lektion7c_Replikation_Konsistenzmodelle.md` | Synchrone/asynchrone Replikation, Primary-Copy, Quorum-Replikation, CAP-Theorem, PACELC, Eventual Consistency, Monotonic Read, Read-your-Writes, Causal Consistency, Linearisierbarkeit, Konfliktauflösung, CRDTs (Überblick) |
| `Lektion7_Paxos_Raft.md` | Vertiefung: Konsensproblem, FLP-Unmöglichkeit, Paxos (Prepare/Promise, Accept/Accepted, Multi-Paxos), Raft (Leader-Wahl, Log-Replikation, Recovery), Verbindung zu 2PC und DBMS |
| `Lektion7_CRDTs.md` | Vertiefung: CRDT-Grundlagen (Kommutativität, Assoziativität, Idempotenz, Join-Semilattice), G-Counter, PN-Counter, LWW-Register, G-Set, 2P-Set, OR-Set, RGA, Grenzen von CRDTs |

---

## Übersicht: Hauptdokumente vs. Vertiefungen

| Typ | Dokumente |
|---|---|
| **Hauptdokumente** (Lernziele vollständig) | Lektion1, Lektion2, Lektion3, Lektion4, Lektion5, Lektion6, Lektion7a/b/c |
| **Vertiefungen** (separate Dokumente für komplexe Einzelthemen) | Lektion1_Abschnitt1, BPlusTree_Split, Join_IO_Kosten, Externes_Sortieren_IO_Kosten, Deadlock_Wait_for_Graph, SSI, Paxos_Raft, CRDTs |
