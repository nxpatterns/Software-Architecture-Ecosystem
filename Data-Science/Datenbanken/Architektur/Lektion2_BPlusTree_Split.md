# Der B+-Baum: Einfügung und Split

---

## Grundregel: Der Baum bleibt immer balanciert

Ein B+-Baum der Ordnung m=2 hat folgende Invarianten:
- Jedes Blatt hat **maximal 4 Schlüssel** (2m).
- Jedes Blatt hat **mindestens 2 Schlüssel** (m) – außer die Wurzel.
- Alle Blätter haben **dieselbe Tiefe**.

Wenn eine Einfügung diese Regeln verletzen würde, repariert der Baum sich selbst – durch einen **Split**.

---

## Schritt 1: Normales Einfügen (kein Split nötig)

Ausgangszustand (m=2, max. 4 Schlüssel pro Knoten):

```
        [ 30 | 60 ]
       /      |      \
[10|20]  [30|40|50]  [60|70]
```

Wir fügen **25** ein.

- Navigation: 25 < 30 → linkes Blatt.
- `[10|20]` hat 2 Einträge – Platz vorhanden.
- Einfach einsortieren: `[10|20|25]`.

```
        [ 30 | 60 ]
       /      |      \
[10|20|25]  [30|40|50]  [60|70]
```

Fertig. Kein Split.

---

## Schritt 2: Einfügung mit Blatt-Split

Wir fügen **45** ein. Das mittlere Blatt ist bereits `[30|40|50]` (3 Einträge).

Nach Einfügen: `[30|40|45|50]` – 4 Einträge, noch okay.

Wir fügen **35** ein. Das mittlere Blatt ist jetzt `[30|40|45|50]` (voll, 4 Einträge).

Einfügen würde 5 Einträge ergeben → **Overflow → Split**.

**Was passiert beim Blatt-Split:**

1. Das übervolle (virtuelle) Blatt: `[30|35|40|45|50]`
2. Aufteilen in zwei Hälften:
   - Linkes Blatt: `[30|35|40]`
   - Rechtes Blatt: `[45|50]`
3. Der **kleinste Schlüssel des rechten Blatts** (45) wird nach oben **kopiert** – er bleibt auch im Blatt, weil die Blattebene vollständig sein muss.

Der Elternknoten `[30|60]` bekommt 45 als neuen Trennschlüssel:

```
        [ 30 | 45 | 60 ]
       /     |     |     \
[10|20|25] [30|35|40] [45|50] [60|70]
```

---

## Schritt 3: Split pflanzt sich nach oben fort

Wir fügen nacheinander **55**, **65**, **80**, **75** ein. Nach einigen problemlosen Einfügungen landet das Blatt `[60|65|70|80]` voll da, und wir fügen **75** ein.

Blatt `[60|65|70|80]` → Overflow → Split:
- Linkes Blatt: `[60|65|70]`
- Rechtes Blatt: `[75|80]`
- 75 wird nach oben kopiert.

Der Elternknoten war `[30|45|60]` – bekommt 75 dazu: `[30|45|60|75]` – das sind 4 Trennschlüssel → **Overflow im inneren Knoten**.

### Split eines inneren Knotens

Hier ist der entscheidende Unterschied zum Blatt-Split:

Innerer Knoten (virtuell nach Einfügen): `[30|45|60|75]` mit 5 Kindern.

Mittlerer Schlüssel: **60** (Position 3 von 5).

- Linker innerer Knoten behält: `[30|45]` mit seinen 3 linken Kindern.
- Rechter innerer Knoten bekommt: `[75]` mit seinen 2 rechten Kindern.
- 60 wird **nach oben verschoben** – er verlässt den Knoten (kein Kopieren, weil innere Knoten keine Datenwerte halten).

Da es keinen Elternknoten gibt (das war die Wurzel), entsteht eine **neue Wurzel**:

```
                  [ 60 ]
                 /       \
           [30|45]        [75]
           / | \           / \
[10|20|25] [30|35|40] [45|50|55] [60|65|70] [75|80]
```

Der Baum hat eine neue Ebene – und ist wieder perfekt balanciert.

---

## Kopiert vs. verschoben: der zentrale Unterschied

| Knotentyp | Schlüssel beim Split | Warum |
|---|---|---|
| **Blatt** | Kleinster Schlüssel rechts wird **kopiert** nach oben | Blätter müssen alle Schlüssel enthalten (verkettete Liste = vollständige Datenbasis) |
| **Innerer Knoten** | Mittlerer Schlüssel wird **verschoben** (verschwindet aus dem Knoten) | Innere Knoten halten keine Daten, nur Wegweiser |

---

## Auf einen Blick

| Situation | Was passiert |
|---|---|
| Blatt hat Platz | Einsortieren, fertig |
| Blatt voll | Split in zwei Hälften, kleinster Schlüssel rechts wird **kopiert** nach oben |
| Innerer Knoten voll | Split in zwei Hälften, mittlerer Schlüssel wird **verschoben** nach oben |
| Wurzel voll | Split, neue Wurzel – Baum wächst um eine Ebene nach oben |

Der Baum wächst ausschließlich an der Wurzel, nie an den Blättern. Das garantiert, dass alle Blätter immer gleich tief bleiben.
