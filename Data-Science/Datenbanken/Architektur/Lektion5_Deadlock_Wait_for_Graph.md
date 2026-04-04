# Deadlock-Erkennung: Der Wait-for-Graph

---

## Was ist ein Deadlock?

Ein Deadlock entsteht, wenn zwei oder mehr Transaktionen zyklisch aufeinander warten:

- T1 hält eine Sperre auf Objekt A und wartet auf Objekt B
- T2 hält eine Sperre auf Objekt B und wartet auf Objekt A

Keiner kann weitermachen. Keiner gibt freiwillig nach. Das System steckt fest.

Deadlocks sind unter Strict 2PL unvermeidbar – das Protokoll verhindert sie nicht, es gibt sie einfach hin. Das DBMS muss sie erkennen und auflösen.

---

## Der Wait-for-Graph

### Aufbau

Der **Wait-for-Graph (WFG)** ist ein gerichteter Graph:

- **Knoten** = aktive Transaktionen
- **Kante Ti → Tj** = Ti wartet darauf, dass Tj eine Sperre freigibt

Das DBMS baut diesen Graph laufend auf und aktualisiert ihn bei jedem Lock-Request und jeder Lock-Freigabe.

### Deadlock-Bedingung

**Ein Deadlock existiert genau dann, wenn der Wait-for-Graph einen Zyklus enthält.**

Das ist der einzige Test, den das DBMS braucht.

---

## Schritt für Schritt: Beispiel mit drei Transaktionen

### Ausgangssituation

| Transaktion | Hält Sperre auf | Wartet auf |
|---|---|---|
| T1 | A | B |
| T2 | B | C |
| T3 | C | A |

### Wait-for-Graph aufbauen

T1 wartet auf T2 (T2 hält B): **T1 → T2**  
T2 wartet auf T3 (T3 hält C): **T2 → T3**  
T3 wartet auf T1 (T1 hält A): **T3 → T1**

```
T1 → T2 → T3 → T1
```

Zyklus vorhanden: **T1 → T2 → T3 → T1**. Deadlock erkannt.

---

## Zykluserkennung: DFS-Algorithmus

Das DBMS führt periodisch (oder bei jedem neuen Wartevorgang) eine **Tiefensuche (DFS)** auf dem Wait-for-Graph durch.

### Algorithmus

```
für jeden Knoten v im Graphen:
    wenn v noch nicht besucht:
        DFS(v, visited={}, recursion_stack={})

DFS(v, visited, recursion_stack):
    markiere v als besucht
    füge v zum recursion_stack hinzu

    für jeden Nachfolger w von v (v → w):
        wenn w im recursion_stack:
            ZYKLUS GEFUNDEN → Deadlock
        wenn w nicht besucht:
            DFS(w, visited, recursion_stack)

    entferne v aus recursion_stack
```

**Laufzeit:** O(V + E) – linear in der Anzahl der Transaktionen und Wartekanten. Schnell genug für periodische Ausführung.

### Durchlauf am Beispiel

Start bei T1:
- Besuche T1, Stack = {T1}
- T1 → T2: Besuche T2, Stack = {T1, T2}
- T2 → T3: Besuche T3, Stack = {T1, T2, T3}
- T3 → T1: T1 ist im Stack → **Zyklus: T1 → T2 → T3 → T1**

---

## Deadlock-Auflösung: Opfer wählen

Ein Zyklus ist erkannt. Jetzt muss eine Transaktion im Zyklus als **Opfer (Victim)** gewählt und zurückgerollt werden, um den Deadlock aufzulösen.

### Auswahlkriterien

Das DBMS wählt das Opfer nach Heuristiken, die die Gesamtkosten minimieren:

| Kriterium | Rationale |
|---|---|
| **Jüngste Transaktion** | Weniger Arbeit verloren, günstiger zurückzurollen |
| **Wenigste gehaltene Sperren** | Kleiner Rollback-Aufwand |
| **Wenigste abgeschlossene Arbeit** | Minimierung des verlorenen Aufwands |
| **Am häufigsten als Opfer gewählt** | Verhindert Starvation (ein Opfer nicht immer wieder wählen) |

In der Praxis: Meist wird die Transaktion mit dem kleinsten Fortschritt (jüngster Startzeitpunkt oder geringste Log-Einträge) gewählt.

### Nach dem Rollback

1. Opfer-Transaktion wird zurückgerollt (Undo).
2. Ihre Sperren werden freigegeben.
3. Wartende Transaktionen können weitermachen.
4. Der Wait-for-Graph wird aktualisiert (Opfer-Knoten und seine Kanten entfernt).
5. Das DBMS gibt der Anwendung eine Fehlermeldung zurück (z. B. `ERROR: deadlock detected`).

Die Anwendung ist dafür verantwortlich, die Transaktion neu zu starten – das DBMS tut das nicht automatisch.

---

## Wann wird der WFG überprüft?

Zwei Strategien:

**Periodisch:** Der WFG wird alle X Millisekunden auf Zyklen geprüft. Einfach zu implementieren, aber ein Deadlock kann für bis zu X ms unerkannt bleiben und Ressourcen blockieren.

**Bei jedem neuen Wartevorgang:** Sobald eine Transaktion in Wartestellung geht, wird sofort ein Zyklustest durchgeführt. Schnellere Erkennung, aber höherer CPU-Overhead.

PostgreSQL verwendet periodische Prüfung mit einem konfigurierbaren Intervall (`deadlock_timeout`, default 1 Sekunde). Erst nach diesem Timeout wird der WFG gebaut und geprüft – weil die meisten Wartezeiten kürzer sind und keine Deadlocks sind.

---

## Alternative: Deadlock-Vermeidung statt Erkennung

Statt Deadlocks zu erkennen und aufzulösen, kann man sie **von vornherein verhindern**:

**Wait-Die:** Ältere Transaktion darf warten, jüngere wird sofort abgebrochen ("stirbt").  
**Wound-Wait:** Ältere Transaktion verdrängt die jüngere ("verwundet" sie), jüngere wartet falls sie älter ist.

Beide Verfahren sind deadlock-frei, weil sie Zyklen im WFG strukturell verhindern (immer dieselbe Richtung: älter → jünger oder jünger → älter). Der Preis: Mehr unnötige Rollbacks als bei reiner Erkennung.

**Timeout:** Transaktion, die länger als T Sekunden wartet, wird pauschal abgebrochen. Einfach, aber ungenau – kann auch bei Nicht-Deadlocks abbrechen.

---

## Zusammenfassung

| Konzept | Kernaussage |
|---|---|
| Deadlock | Zyklisches Warten; unter 2PL unvermeidbar |
| Wait-for-Graph | Gerichteter Graph: Ti → Tj wenn Ti auf Tj wartet |
| Deadlock-Bedingung | Zyklus im WFG ↔ Deadlock |
| Erkennung | DFS, O(V+E), periodisch oder bei Wartevorgang |
| Opferwahl | Jüngste / am wenigsten fortgeschrittene Transaktion |
| Wait-Die / Wound-Wait | Präventive Alternativen; deadlock-frei aber mehr Rollbacks |
