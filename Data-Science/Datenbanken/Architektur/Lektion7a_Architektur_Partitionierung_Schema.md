# Lektion 7a: Verteilte Datenbankarchitekturen – Architektur, Partitionierung, Schema

---

## 1. Warum verteilte Datenbanken?

Ein einzelner Server hat physische Grenzen: maximaler RAM, maximale Festplattenkapazität, maximaler Durchsatz. Ab einer bestimmten Datenmenge oder Last reicht ein einzelner Knoten nicht mehr aus.

Verteilte Datenbanken verteilen Daten und Last auf mehrere Knoten. Das bringt:

- **Skalierbarkeit:** Mehr Knoten = mehr Kapazität und Durchsatz.
- **Verfügbarkeit:** Fällt ein Knoten aus, können andere übernehmen.
- **Lokalität:** Daten können geografisch nah bei ihren Nutzern liegen.

Der Preis: Netzwerkkommunikation ist teuer und unzuverlässig, Konsistenz über mehrere Knoten ist schwierig, und verteilte Fehler sind schwerer zu behandeln als lokale.

---

## 2. Architekturmodelle

### Shared-Memory

Alle Prozessoren teilen sich einen gemeinsamen Hauptspeicher und ein gemeinsames Plattensystem.

```
CPU1  CPU2  CPU3  CPU4
  \    \    /    /
   [Gemeinsamer RAM]
         |
   [Gemeinsame Platte]
```

**Vorteil:** Kein Koordinationsaufwand für Datenzugriffe – alle CPUs sehen dieselben Daten direkt im RAM.  
**Nachteil:** Schlecht skalierbar. Der gemeinsame Speicherbus wird zum Flaschenhals. Ab ~32 CPUs kaum noch sinnvoll. Teuer in der Hardware (NUMA-Architekturen).

Typisch: Einzelner High-End-Server mit vielen Cores. Kein echtes verteiltes System.

### Shared-Disk

Jeder Knoten hat seinen eigenen Prozessor und RAM, aber alle Knoten greifen auf dasselbe **gemeinsame Plattensystem** (Storage Area Network, SAN) zu.

```
[Node1: CPU+RAM]  [Node2: CPU+RAM]  [Node3: CPU+RAM]
        \               |               /
         [Gemeinsames Plattensystem (SAN)]
```

**Vorteil:** Buffer Pools sind unabhängig – kein gemeinsamer Speicher-Flaschenhals. Ausfall eines Knotens: andere können seine Arbeit übernehmen, weil sie auf dieselben Daten zugreifen können.  
**Nachteil:** Koordination der Buffer Pools nötig (Cache-Kohärenz). Wenn Node1 eine Page cached und Node2 sie ändert, muss Node1 seinen Cache invalidieren. Plattensystem ist noch ein Single Point of Failure (abgemildert durch RAID/redundantes SAN).

Typisch: Oracle RAC, klassische Enterprise-DBMS-Cluster.

### Shared-Nothing

Jeder Knoten hat seinen eigenen Prozessor, RAM **und** sein eigenes Plattensystem. Kommunikation ausschließlich über **Netzwerk**.

```
[Node1: CPU+RAM+Platte]  [Node2: CPU+RAM+Platte]  [Node3: CPU+RAM+Platte]
           \                       |                       /
                        [Netzwerk]
```

**Vorteil:** Lineare Skalierbarkeit – mehr Knoten hinzufügen ist unkompliziert. Kein gemeinsamer Flaschenhals.  
**Nachteil:** Alle Datenzugriffe auf fremden Knoten gehen über das Netzwerk. Verteilte Transaktionen und Anfragen erfordern aufwändige Koordination. Datenverlust bei Knotenausfall (ohne Replikation).

**Shared-Nothing ist der Standard für moderne skalierbare DBMS** (PostgreSQL Citus, Google Spanner, CockroachDB, Amazon Aurora, klassisches MPP wie Teradata).

### Vergleich

| Eigenschaft | Shared-Memory | Shared-Disk | Shared-Nothing |
|---|---|---|---|
| Skalierbarkeit | gering | mittel | hoch |
| Koordinationsaufwand | gering | mittel | hoch |
| Fehlertoleranz | gering | mittel | hoch (mit Replikation) |
| Hardwarekosten | sehr hoch | hoch | moderat (Commodity Hardware) |
| Typischer Einsatz | SMP-Server | Enterprise-Cluster | Cloud-native DBMS |

---

## 3. Partitionierung

Partitionierung entscheidet, **welche Daten auf welchem Knoten liegen**. Das ist die zentrale Entwurfsentscheidung für Shared-Nothing-Systeme.

### Horizontale Partitionierung (Sharding)

Die Relation wird zeilenweise aufgeteilt. Jeder Knoten hält eine Teilmenge der Tupel, aber das vollständige Schema.

```
Relation Kunden (gesamt):
| id | name   | stadt  |
|----|--------|--------|
|  1 | Huber  | Wien   |
|  2 | Maier  | Graz   |
|  3 | Bauer  | Wien   |
|  4 | Wolf   | Linz   |

Node1: id=1,3  (Wien)
Node2: id=2    (Graz)
Node3: id=4    (Linz)
```

**Partitionierungsstrategien:**

**Range-Partitionierung:** Tupel werden nach Wertebereich eines Schlüssels aufgeteilt. `id 1–1000 → Node1`, `id 1001–2000 → Node2`, usw.
- Vorteil: Bereichsanfragen effizient (nur relevante Knoten anfragen).
- Nachteil: Skew-Gefahr (wenn ein Wertebereich viel mehr Daten hat als andere → Hot Spot).

**Hash-Partitionierung:** `h(schlüssel) mod n` bestimmt den Knoten.
- Vorteil: Gleichmäßige Verteilung bei zufälligen Schlüsseln, keine Hot Spots.
- Nachteil: Bereichsanfragen müssen alle Knoten anfragen. Hinzufügen eines Knotens erfordert Rehashing (oder Consistent Hashing).

**List-Partitionierung:** Explizite Zuweisung von Werten zu Knoten. `{Wien, Salzburg} → Node1`, `{Graz, Linz} → Node2`.
- Vorteil: Volle Kontrolle, gut für Lokalität (z. B. geografische Partitionierung).
- Nachteil: Manuell, schlecht bei neuen Werten.

**Consistent Hashing:** Knoten und Datensätze werden auf einen Ring gehasht. Jeder Datensatz gehört zum nächsten Knoten im Uhrzeigersinn. Wird ein Knoten hinzugefügt oder entfernt, müssen nur die Daten des betroffenen Bereichs umverteilt werden.
- Vorteil: Minimale Datenverschiebung bei Knotenänderungen.
- Nachteil: Ungleichmäßige Verteilung ohne virtuelle Knoten.

### Vertikale Partitionierung

Die Relation wird spaltenweise aufgeteilt. Jeder Knoten hält alle Tupel, aber nur eine Teilmenge der Attribute. Primärschlüssel wird auf allen Knoten gehalten.

```
Node1: | id | name |
Node2: | id | stadt | plz |
Node3: | id | umsatz | bonität |
```

**Vorteil:** Anfragen, die nur wenige Spalten brauchen, lesen nur den relevanten Knoten. Basis des **Column Store**-Konzepts.  
**Nachteil:** Anfragen über mehrere Attributgruppen erfordern Joins über Knoten (teuer).

### Hybride Partitionierung

Kombination: Erst horizontal (Tupel auf Knoten), dann vertikal (Spalten innerhalb des Knotens). Basis moderner Column-Store-MPP-Systeme (Redshift, Snowflake).

---

## 4. Allokation

Partitionierung entscheidet *wie* Daten aufgeteilt werden. **Allokation** entscheidet, *welche Partition auf welchem physischen Knoten liegt* – und ob Replikate existieren.

### Nicht-replizierte Allokation

Jede Partition liegt genau auf einem Knoten. Maximaler Speichereffizienz, aber: Knotenausfall = Datenverlust und Ausfall.

### Replizierte Allokation

Jede Partition liegt auf mehreren Knoten. Liest kann von jedem Replikat beantwortet werden (hohe Leseverfügbarkeit). Schreiboperationen müssen alle Replikate aktualisieren (Koordinationsaufwand).

**Vollständige Replikation:** Jeder Knoten hält alle Daten. Lesen ist immer lokal – maximale Leseperformance. Schreiben muss alle Knoten aktualisieren – skaliert schlecht für schreibintensive Workloads.

**Partielle Replikation:** Nur bestimmte (häufig gelesene) Partitionen werden repliziert. Kompromiss zwischen Verfügbarkeit und Schreibaufwand.

### Allokationsoptimierung

Die optimale Allokation minimiert die erwarteten Kommunikationskosten für einen gegebenen Workload. Das ist ein NP-schweres Optimierungsproblem, in der Praxis durch Heuristiken gelöst:
- Häufig zusammen abgefragte Partitionen auf denselben Knoten.
- Häufig geschriebene Partitionen weniger replizieren.
- Geografische Lokalität: Partition nah bei den Nutzern, die sie am häufigsten lesen.

---

## 5. Auswirkungen auf die Schema-Architektur

Ein verteiltes DBMS muss den Nutzern eine **einheitliche Sicht** auf die Daten bieten, obwohl die Daten physisch über mehrere Knoten verteilt sind. Dafür wird das 3-Ebenen-Modell aus Lektion 1 erweitert.

### Erweitertes Schema-Modell

```
┌──────────────────────────────────────────┐
│  Externe Schemata (Views pro Nutzer)     │
├──────────────────────────────────────────┤
│  Globales Konzeptuelles Schema (GCS)     │  ← logische Gesamtsicht aller Daten
├──────────────────────────────────────────┤
│  Fragmentierungsschema                   │  ← wie wird das GCS partitioniert?
├──────────────────────────────────────────┤
│  Allokationsschema                       │  ← wo liegt welches Fragment?
├──────────────────────────────────────────┤
│  Lokale Interne Schemata (pro Knoten)    │  ← physische Speicherung lokal
└──────────────────────────────────────────┘
```

### Globales Konzeptuelles Schema (GCS)

Das GCS beschreibt die logische Gesamtrelation so, als wäre die Datenbank nicht verteilt. Nutzer und Anwendungen sehen nur das GCS – die Verteilung ist transparent.

**Verteilungstransparenz:** Das System verbirgt, dass Daten verteilt sind. Ideal, aber teuer zu implementieren.

**Fragmentierungstransparenz:** Der Nutzer weiß, dass Fragmente existieren, kennt aber die Allokation nicht.

**Allokationstransparenz:** Der Nutzer kennt Fragmente und ihren Standort, muss aber keine expliziten Netzwerkoperationen formulieren.

**Keine Transparenz:** Der Nutzer muss explizit angeben, auf welchem Knoten er sucht. Maximale Kontrolle, aber keine Abstraktion – heute selten.

### Homogene vs. heterogene verteilte Datenbanken

**Homogen:** Alle Knoten laufen dieselbe DBMS-Software, verwenden dasselbe GCS. Einfacher zu verwalten, aber weniger flexibel.

**Heterogen:** Verschiedene Knoten können verschiedene DBMS-Software verwenden (z. B. PostgreSQL + MySQL + Oracle). Das GCS muss über ein **Middleware-Layer** (Federated DBMS) hergestellt werden. Aufwändiger, aber notwendig wenn historisch gewachsene Systeme integriert werden.

---

## Zusammenfassung

| Konzept | Kernaussage |
|---|---|
| Shared-Memory | Gemeinsamer RAM; kaum skalierbar; kein echtes verteiltes System |
| Shared-Disk | Gemeinsames Plattensystem; Cache-Kohärenz nötig; Enterprise-Clustering |
| Shared-Nothing | Kein gemeinsames Subsystem; lineare Skalierbarkeit; Standard für Cloud-DBMS |
| Horizontale Partitionierung | Tupel aufteilen; Range/Hash/List/Consistent Hashing |
| Vertikale Partitionierung | Spalten aufteilen; Basis von Column Stores |
| Allokation | Wo liegt welches Fragment; repliziert oder nicht |
| GCS | Einheitliche logische Sicht trotz physischer Verteilung |
| Verteilungstransparenz | Nutzer sieht keine Verteilung; teuer zu implementieren |
