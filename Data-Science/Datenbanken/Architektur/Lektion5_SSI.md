# Serializable Snapshot Isolation (SSI)

---

## Das Problem mit Snapshot Isolation

Snapshot Isolation (SI) verhindert Dirty Reads und Non-Repeatable Reads – aber nicht alle Anomalien. Das klassische Gegenbeispiel ist **Write Skew**:

```
Constraint: x + y > 0  (Anfangswert: x=1, y=1)

T1: liest x=1, y=1 → Constraint ok → schreibt x=-1, commit
T2: liest x=1, y=1 → Constraint ok → schreibt y=-1, commit

Ergebnis: x=-1, y=-1 → x + y = -2 → Constraint verletzt
```

T1 und T2 schreiben verschiedene Objekte – kein Write-Write-Konflikt, also beide committen problemlos unter SI. Aber kein serieller Schedule hätte dieses Ergebnis produziert.

**Serializable Snapshot Isolation (SSI)** löst das, ohne die Leseparallelität von SI aufzugeben.

---

## Grundidee: Dangerous Structures erkennen

### Warum entstehen SI-Anomalien?

Fekete et al. (2005) haben gezeigt: Jede SI-Anomalie entsteht durch ein spezifisches Muster von **Read-Write-Abhängigkeiten** zwischen Transaktionen.

Zwei Typen von Abhängigkeiten:
- **wr-Abhängigkeit (Write-then-Read):** T1 schreibt x, T2 liest T1s Version von x. (Klassische Abhängigkeit, auch in 2PL relevant.)
- **rw-Abhängigkeit (Read-then-Write, auch: Anti-Abhängigkeit):** T2 liest eine Version von x, dann schreibt T1 eine neuere Version. T2 hat "verpasst", was T1 schreibt.

Unter SI: Alle Lese-Abhängigkeiten gehen auf Snapshots – also auf committete Versionen vor dem Start der lesenden Transaktion. Das bedeutet: wr-Abhängigkeiten über Snapshot-Grenzen hinweg sind harmlos. Die gefährlichen sind ausschließlich **rw-Abhängigkeiten**.

### Die zentrale Erkenntnis

**Theorem (Fekete et al.):** Ein nicht-serialisierbarer Schedule unter SI enthält immer einen Zyklus im Abhängigkeitsgraph, der **mindestens zwei aufeinanderfolgende rw-Abhängigkeiten** enthält.

Das heißt: Wenn wir rw-Abhängigkeiten zwischen gleichzeitigen Transaktionen verfolgen und eine "Dangerous Structure" (zwei rw-Kanten in Folge) entdecken, liegt entweder eine Anomalie vor – oder sie droht.

---

## SSI: Implementierung

SSI läuft auf Standard-SI auf, fügt aber ein **Tracking-Layer** hinzu:

### Schritt 1: rw-Abhängigkeiten verfolgen

Das DBMS verfolgt für jede aktive Transaktion:

- **SIREAD-Locks:** Keine echten Sperren, nur Marker. Wenn T2 Objekt x liest, setzt sie einen SIREAD-Lock auf x. Wenn später T1 x schreibt, registriert das DBMS: "T1 hat eine rw-Abhängigkeit auf T2 erzeugt" (T2 →^rw T1).

SIREAD-Locks blockieren niemanden. Sie sind reine Tracking-Strukturen.

### Schritt 2: Dangerous Structures erkennen

Bei jeder neuen rw-Abhängigkeit prüft das DBMS:

- Hat die betroffene Transaktion auf der anderen Seite bereits eine rw-Abhängigkeit?
- Wenn ja: Ist ein Zyklus mit zwei rw-Kanten entstanden?

```
Muster: T2 →^rw T1 →^rw T3   (zwei aufeinanderfolgende rw-Kanten)
```

Wenn dieses Muster gefunden wird, ist eine der beteiligten Transaktionen ein potenzielles Problem.

### Schritt 3: Abort bei Gefahr

SSI ist **konservativ**: Wenn eine Dangerous Structure erkannt wird, wird eine der beteiligten Transaktionen abgebrochen – auch wenn die Anomalie vielleicht gar nicht eingetreten wäre (falsch-positive Abbrüche sind möglich, falsch-negative nicht).

Das Opfer wird so gewählt, dass der Zyklus aufgebrochen wird. Meist: Die Transaktion, die noch nicht committed hat und am wenigsten Arbeit geleistet hat.

---

## Durchlauf: Write Skew unter SSI

```
Constraint: x + y > 0  (x=1, y=1)
```

**Timeline:**

```
T1 startet (Snapshot: x=1, y=1)
T2 startet (Snapshot: x=1, y=1)

T1: READ(x) → setzt SIREAD-Lock auf x
T1: READ(y) → setzt SIREAD-Lock auf y
T2: READ(x) → setzt SIREAD-Lock auf x
T2: READ(y) → setzt SIREAD-Lock auf y

T1: WRITE(x = -1)
    → x hatte SIREAD-Lock von T2
    → registriere: T2 →^rw T1

T2: WRITE(y = -1)
    → y hatte SIREAD-Lock von T1
    → registriere: T1 →^rw T2
    → prüfe: T2 →^rw T1 →^rw T2 → Zyklus mit zwei rw-Kanten!
    → DANGEROUS STRUCTURE erkannt
    → T2 wird abgebrochen
```

T1 kann committen. T2 muss neu starten. Die Anomalie ist verhindert.

---

## SSI vs. 2PL: Der entscheidende Unterschied

| Eigenschaft | Strict 2PL | Snapshot Isolation | SSI |
|---|---|---|---|
| Leser blockieren Schreiber | ja | nein | nein |
| Schreiber blockieren Leser | ja | nein | nein |
| Deadlocks möglich | ja | nein | nein |
| Serialisierbar | ja | nein | ja |
| Falsch-positive Abbrüche | nein | – | ja (selten) |
| Read-heavy Workload | mittel | sehr gut | sehr gut |
| Write-heavy Workload | gut | gut (Write Skew!) | gut |

SSI gibt die Lese-Parallelität von SI nicht auf, erkauft Serialisierbarkeit aber durch gelegentliche Abbrüche, die unter SI nicht passiert wären.

---

## SIREAD-Locks: Lebenszeit und Speicheraufwand

Ein SIREAD-Lock muss so lange gehalten werden, bis **alle gleichzeitigen Transaktionen** committed oder abgebrochen haben. Erst dann kann keine rw-Abhängigkeit mehr entstehen, die den abgelaufenen Lock betrifft.

Das kann zu Speicheraufwand führen bei langen Transaktionen oder vielen gleichzeitigen Aktiven. Implementierungen (PostgreSQL) begrenzen den Overhead durch:
- Granularitätswechsel: Viele SIREAD-Locks auf Tupelebene werden zu einem Lock auf Seitenebene zusammengefasst (auf Kosten von mehr falsch-positiven Abbrüchen).
- Aggressive Bereinigung committeter Transaktionen ohne offene Abhängigkeiten.

---

## Zusammenfassung

| Konzept | Kernaussage |
|---|---|
| SI-Anomalie | Write Skew: zwei Transaktionen lesen überlappend, schreiben disjunkt, verletzen zusammen eine Invariante |
| rw-Abhängigkeit | T2 liest Version, die T1 später überschreibt; die gefährliche Abhängigkeit unter SI |
| Dangerous Structure | Zwei aufeinanderfolgende rw-Kanten im Abhängigkeitsgraph → potenzielle Anomalie |
| SIREAD-Locks | Nicht-blockierende Tracking-Marker für gelesene Objekte |
| SSI-Abbruch | Konservativ: bei Dangerous Structure wird eine Transaktion präventiv abgebrochen |
| SSI vs. 2PL | SSI: keine Lese-Schreib-Blockierung, keine Deadlocks, aber gelegentliche falsch-positive Abbrüche |
