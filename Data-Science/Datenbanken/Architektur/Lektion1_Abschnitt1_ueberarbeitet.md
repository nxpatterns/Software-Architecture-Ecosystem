# Lektion 1 – Abschnitt 1 (überarbeitet): Was ein DBMS leistet und wie

Ein DBMS löst die Schwächen des Dateisystems systematisch. Hier die vier zentralen Garantien – und die Grundideen dahinter:

---

## Konsistenz: Daten sind nie in einem halbfertigen Zustand

Stell dir vor, eine Banküberweisung bedeutet zwei Schreibvorgänge: Konto A wird belastet, Konto B gutgeschrieben. Crasht das System nach dem ersten Schreibvorgang, fehlt Geld – ohne dass irgendjemand es hat.

Das DBMS löst das mit **Transaktionen** und dem **Write-Ahead Log (WAL)**. Bevor eine Änderung auf die Datenseite geschrieben wird, landet sie zuerst im Log (sequenziell, also schnell). Crasht das System, kann das DBMS beim Neustart das Log durchgehen und entscheiden: War die Transaktion fertig (Commit im Log)? Dann wiederholen. War sie nicht fertig? Dann rückgängig machen.

Das Prinzip: **Alles oder nichts.** Der Rest des Systems sieht immer nur abgeschlossene, konsistente Zustände.

---

## Mehrbenutzerbetrieb: Gleichzeitige Zugriffe ohne gegenseitige Korrumpierung

Zwei Threads, die gleichzeitig denselben Zähler inkrementieren (`x = x + 1`), produzieren ohne Synchronisation einen Lost Update – das kennt jeder aus Betriebssystemen. Bei Datenbanken passiert dasselbe, nur über Tabellen und Transaktionen hinweg.

Das DBMS verwaltet **Sperren (Locks)**: Bevor eine Transaktion einen Datensatz ändert, fordert sie eine exklusive Sperre an. Andere Transaktionen, die gleichzeitig dieselben Daten lesen oder schreiben wollen, müssen warten – oder bekommen eine eigene konsistente **Snapshot-Version** der Daten (Multiversion Concurrency Control, MVCC).

Das Ziel ist **Serialisierbarkeit**: Das Ergebnis gleichzeitiger Transaktionen ist identisch mit dem Ergebnis irgendeiner sequenziellen Reihenfolge derselben Transaktionen. Parallelität ist also kein Problem, solange das Ergebnis so aussieht, als wäre es seriell gewesen.

---

## Persistenz: Ein Absturz zerstört keine committeten Daten

Der Buffer Pool (RAM-Cache des DBMS) ist flüchtig. Eine Seite kann nach einem Commit noch im Puffer liegen und nicht auf der Platte sein. Crasht das System jetzt, ist die Änderung weg – obwohl der Client ein „Commit erfolgreich" bekommen hat.

Das WAL verhindert genau das: Der Commit-Eintrag wird erst ins Log (auf persistenten Speicher) **geflusht**, bevor der Client die Erfolgsmeldung bekommt. Damit ist garantiert: Was committed ist, überlebt jeden Absturz. Das DBMS kann beim Neustart alles, was im Log steht aber noch nicht in den Datenseiten ist, wiederholen (**Redo**).

Eine Analogie: Das Log ist wie ein Kassenbon, der sofort ausgedruckt wird. Auch wenn die Ware noch im Regal steht (Puffer), beweist der Bon, dass die Transaktion stattgefunden hat.

---

## Abfragesprachen: Deklarativ statt prozedural

In einem Dateisystem schreibst du den Algorithmus selbst: Datei öffnen, Zeile für Zeile lesen, filtern, joinen, sortieren. Das bindet die Anfrage an eine konkrete Implementierung.

SQL ist **deklarativ**: Du beschreibst *was* du willst, nicht *wie* du es bekommst. `SELECT name FROM kunden WHERE stadt = 'Wien'` teilt dem DBMS das Ziel mit – der **Optimierer** entscheidet dann, ob er einen Index benutzt, einen Full Scan macht oder die Anfrage umschreibt.

Das hat einen nicht-offensichtlichen Vorteil: Derselbe SQL-Query wird automatisch besser, wenn das DBMS eine neuere Version bekommt oder ein Index hinzugefügt wird. Der Anwendungscode ändert sich nicht.
