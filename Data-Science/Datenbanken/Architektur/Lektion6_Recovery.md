# Lektion 6: Recovery

---

## 1. Fehlerklassen

Nicht jeder Fehler ist gleich – und die Recovery-Strategie hängt direkt davon ab, was ausgefallen ist.

### Transaktionsfehler

Eine einzelne Transaktion schlägt fehl: Anwendungsfehler, Constraint-Verletzung, Deadlock-Opfer, explizites ROLLBACK. Das System läuft weiter. Nur die Änderungen dieser einen Transaktion müssen rückgängig gemacht werden.

**Erforderlich:** Undo der abgebrochenen Transaktion.

### Systemfehler (Soft Crash)

Das DBMS-Prozess stirbt – Stromausfall, OS-Absturz, Kernel-Panic. Der **Hauptspeicher (Buffer Pool) geht verloren**, der persistente Speicher (Platte/SSD) bleibt intakt.

Konsequenz: Einige committeten Änderungen waren noch im Buffer Pool und nie auf die Platte geschrieben worden (verloren). Einige uncommitteten Änderungen waren bereits auf die Platte geschrieben worden (müssen rückgängig gemacht werden).

**Erforderlich:** Redo committeter, noch nicht persistierter Änderungen + Undo uncommitteter, bereits persistierter Änderungen.

### Medienfehler (Hard Crash)

Die Festplatte / der Speicher ist physisch beschädigt oder zerstört. Daten auf dem betroffenen Medium sind unwiederbringlich verloren.

**Erforderlich:** Wiederherstellen aus einem **Backup** + Redo aller Änderungen seit dem letzten Backup (aus einem separaten Log auf einem anderen Medium).

### Katastrophenfehler

Rechenzentrum brennt, Naturkatastrophe. Mehrere Medien gleichzeitig betroffen.

**Erforderlich:** Georedundanz, Off-site Backups, Replikation.

---

## 2. DBMS-Komponenten der Recovery

### Log-Manager

Schreibt alle Änderungen **vor** ihrer Ausführung ins Log (Write-Ahead Log, WAL). Das Log liegt auf persistentem Speicher, typisch auf einem separaten Gerät oder zumindest einem anderen Dateisystem als die Datenbankdateien.

Jeder Log-Eintrag (Log Record) enthält:
- **LSN** (Log Sequence Number): Monoton wachsende eindeutige ID des Eintrags
- **Transaktions-ID**
- **Typ** (Update, Commit, Abort, Begin, End)
- **PageID + Offset**: Welche Seite wurde geändert
- **Before Image**: Wert vor der Änderung (für Undo)
- **After Image**: Wert nach der Änderung (für Redo)

### Buffer Pool Manager

Verwaltet den RAM-Cache. Muss sicherstellen, dass das WAL-Prinzip eingehalten wird: Bevor eine dirty Page auf die Platte geschrieben wird, müssen alle Log-Einträge, die diese Page betreffen, bereits auf der Platte sein.

Jede Page im Buffer Pool hat ein **Page LSN** – die LSN des letzten Log-Eintrags, der diese Page modifiziert hat.

**WAL-Bedingung:** Vor dem Schreiben einer Page mit Page LSN p muss das Log bis mindestens LSN p geflusht sein.

### Recovery Manager

Führt nach einem Crash die Wiederherstellung durch. Implementiert typisch den **ARIES-Algorithmus** (Analysis, Redo, Undo).

### Checkpoint-Manager

Schreibt periodisch **Checkpoints** ins Log: einen Eintrag, der den aktuellen Zustand des Buffer Pools und der aktiven Transaktionen dokumentiert. Nach einem Crash muss das Recovery nur ab dem letzten Checkpoint beginnen, nicht vom Anfang des Logs.

---

## 3. Protokollierungsarten

### Physisches Logging

Der Log-Eintrag enthält die genauen **Bytes** vor und nach der Änderung (Before/After Image auf Byte-Ebene).

**Vorteil:** Redo und Undo sind trivial – einfach die entsprechenden Bytes zurückschreiben.  
**Nachteil:** Log-Einträge können groß sein (bei großen Updates). Kein Bezug zur semantischen Bedeutung der Änderung.

### Logisches Logging

Der Log-Eintrag beschreibt die **Operation** ("INSERT Tupel (42, 'Wien', 1500) in Tabelle Kunden").

**Vorteil:** Kompakte Log-Einträge. Physische Implementierungsdetails sind gekapselt.  
**Nachteil:** Logisches Undo ist komplizierter – man muss die inverse Operation kennen (`INSERT` → `DELETE`). Bei teilweise ausgeführten Operationen ist logisches Undo gefährlich: Was ist die Inverse einer halb durchgeführten B+-Baum-Einfügung?

### Physiologisches Logging (der Praxisstandard)

**Physisch auf Seitenebene, logisch innerhalb einer Seite.** Ein Log-Eintrag identifiziert eine Seite (physisch) und beschreibt die Änderung innerhalb der Seite logisch ("setze Slot 3 auf Wert X").

- Redo: Wende die beschriebene Operation auf der identifizierten Seite an.
- Undo: Wende die inverse Operation auf der Seite an.

**Vorteil:** Kompakter als reines physisches Logging, aber sicher – Operationen sind immer auf einer einzelnen Seite atomar. Kein Problem mit halb ausgeführten Operationen über mehrere Seiten (die werden als mehrere Log-Einträge behandelt).

**ARIES verwendet physiologisches Logging.**

---

## 4. Recovery-Strategien

### Das WAL-Prinzip (Wiederholung mit Konsequenzen)

Bevor irgendeine Änderung persistiert wird, muss ihr Log-Eintrag persistiert sein. Das ermöglicht:

- **Redo**: Wenn eine committete Änderung noch nicht auf der Datenseite war (weil der Buffer Pool sie noch nicht verdrängt hatte), kann sie aus dem Log neu angewendet werden.
- **Undo**: Wenn eine uncommittete Änderung bereits auf der Datenseite ist (weil der Buffer Pool sie verdrängt hat – Steal-Policy), kann sie aus dem Before Image im Log rückgängig gemacht werden.

### Der ARIES-Algorithmus

ARIES (Algorithms for Recovery and Isolation Exploiting Semantics, Mohan et al. 1992) ist der Standard-Recovery-Algorithmus. Er läuft in drei Phasen:

#### Phase 1: Analysis (Analyse)

Ziel: Herausfinden, was zum Zeitpunkt des Crashes aktiv war.

1. Starte beim letzten **Checkpoint** im Log.
2. Lies das Log vorwärts bis zum Ende.
3. Baue zwei Tabellen auf:
   - **Transaction Table (TT):** Alle Transaktionen, die beim Crash aktiv waren (begonnen, aber nicht committed oder abgebrochen). Mit ihrem letzten Log-Eintrag (LastLSN).
   - **Dirty Page Table (DPT):** Alle Pages, die im Buffer Pool modifiziert, aber noch nicht auf die Platte geschrieben waren. Mit der ältesten LSN, die die Page dirty gemacht hat (RecLSN).

Am Ende der Analysis-Phase weiß ARIES:
- Welche Transaktionen müssen per Undo zurückgerollt werden (alle in der TT).
- Ab welcher LSN muss Redo beginnen (kleinste RecLSN in der DPT).

#### Phase 2: Redo (Wiederholen)

Ziel: Den Zustand der Datenbank exakt zum Zeitpunkt des Crashes wiederherstellen.

1. Starte bei der kleinsten RecLSN aus der DPT.
2. Lies das Log vorwärts.
3. Für jeden Log-Eintrag: Prüfe, ob die betroffene Page in der DPT ist und ob ihre RecLSN ≤ LSN des Eintrags.
4. Wenn ja: Wende die Änderung an, auch wenn die Transaktion später abgebrochen wurde.

**Wichtig:** ARIES redet auch Änderungen abgebrochener Transaktionen nach – zunächst. Der Zustand vor dem Crash wird vollständig rekonstruiert, inkl. uncommitteter Änderungen. Das klingt kontraintuitiv, ist aber notwendig für Korrektheit (die Undo-Phase macht es danach rückgängig).

**Idempotenz:** Redo ist idempotent – wird ein Log-Eintrag doppelt angewendet (z. B. weil die Page bereits auf der Platte war), stört das nicht. ARIES prüft per Page LSN, ob Redo nötig ist: Wenn Page LSN ≥ LSN des Log-Eintrags, ist die Änderung bereits persistiert → überspringen.

#### Phase 3: Undo (Rückgängigmachen)

Ziel: Alle uncommitteten Transaktionen (aus der TT) zurückrollen.

1. Starte mit den LastLSN-Einträgen aller Transaktionen aus der TT.
2. Verarbeite Log-Einträge **rückwärts** (höchste LSN zuerst).
3. Für jeden Eintrag einer undo-pflichtigen Transaktion: Wende das Before Image an.
4. Schreibe einen **Compensation Log Record (CLR)**: Ein Log-Eintrag, der dokumentiert, dass das Undo bereits durchgeführt wurde. CLRs verweisen auf den nächsten noch rückgängig zu machenden Eintrag (UndoNextLSN).

**Warum CLRs?** Wenn während der Undo-Phase erneut ein Crash passiert, weiß ARIES beim nächsten Neustart, wie weit das Undo bereits fortgeschritten war. CLRs sind niemals selbst undo-pflichtig (sie werden übersprungen).

### Visueller Überblick des Recovery-Ablaufs

```
Log:   [Checkpoint] ... [T1:update] [T2:update] [T1:commit] [T2:update] [CRASH]
                              ↑
                           RecLSN (DPT)

Analysis:  liest von Checkpoint → Ende
           TT = {T2}  (T1 hat committed, T2 nicht)
           DPT = {PageA: RecLSN=X, PageB: RecLSN=Y}

Redo:      liest von min(RecLSN) → Ende
           wendet ALLE Änderungen an (auch T2s uncommittete)

Undo:      liest rückwärts für T2
           macht T2s Änderungen rückgängig
           schreibt CLRs
```

---

## 5. Fehlerklassen und korrespondierende Recovery-Strategien

| Fehlerklasse | Was geht verloren | Recovery-Strategie |
|---|---|---|
| Transaktionsfehler | Nichts persistent (Änderungen ggf. im Puffer) | Undo der Transaktion (aus Before Images im Log) |
| Systemfehler (Soft Crash) | Buffer Pool (RAM) | ARIES: Analysis → Redo → Undo |
| Medienfehler (Hard Crash) | Datenbankdateien | Restore Backup + Redo aus Archiv-Log |
| Katastrophenfehler | Mehrere Medien | Georedundanz, Replikation |

### Checkpoints im Detail

Ohne Checkpoints müsste ARIES nach einem Crash das gesamte Log von Beginn an lesen. Bei einer produktiven Datenbank mit Jahren von Log-Einträgen ist das inakzeptabel.

**Fuzzy Checkpoints (ARIES-Standard):**
1. Schreibe Checkpoint-Eintrag ins Log mit aktuellem Inhalt der TT und DPT.
2. Beginne, dirty Pages aus dem Buffer Pool auf die Platte zu schreiben (im Hintergrund, Normalbetrieb läuft weiter).
3. Schreibe End-Checkpoint-Eintrag, sobald alle Pages des Checkpoints auf der Platte sind.

"Fuzzy" bedeutet: Der Checkpoint blockiert den Betrieb nicht. Neue Transaktionen laufen weiter, während der Checkpoint im Hintergrund abläuft. Die Recovery muss daher etwas vor dem Checkpoint-Eintrag beginnen (um Änderungen zu finden, die vor dem Checkpoint begannen aber danach endeten).

---

## Zusammenfassung

| Konzept | Kernaussage |
|---|---|
| Fehlerklassen | Transaktion / System / Medium / Katastrophe – jeweils andere Strategie |
| WAL-Prinzip | Log-Eintrag muss persistiert sein, bevor die Datenseite geschrieben wird |
| Physiologisches Logging | Physisch auf Seitenebene, logisch innerhalb – Praxisstandard |
| ARIES | Analysis (wer war aktiv?) → Redo (alles wiederherstellen) → Undo (uncommittetes zurückrollen) |
| CLRs | Dokumentieren Fortschritt des Undos; crash-sicher, weil selbst nie rückgängig gemacht |
| Fuzzy Checkpoints | Nicht-blockierender Checkpoint; begrenzt wie weit Log beim Recovery gelesen werden muss |
| Idempotenz des Redo | Doppeltes Anwenden ist harmlos – ARIES prüft Page LSN gegen Log LSN |
