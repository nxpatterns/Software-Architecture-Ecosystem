# Multi Master Sync

## Overview

1. **PostgreSQL Logical Replication + Extensions**
    - Native: Pub/Sub (one-way only, need bidirectional setup)
    - BDR (2ndQuadrant): True multi-master, conflict resolution built-in
    - pglogical: Logical replication with more flexibility
2. **Bucardo**
    - Trigger-based multi-master replication
    - Conflict resolution strategies (last-wins, first-wins, custom)
    - Mature, but performance overhead
3. **Event-Driven (CDC)**
    - Debezium + Kafka for change streams
    - Application-level conflict resolution
    - Full control but more complexity
4. **Application-Level**
    - Vector clocks/CRDT patterns
    - Timestamp + node-ID for conflict detection
    - Write to single master, replicate reads

**Critical Questions:**

1. **Conflict frequency expected?** (same row updated in A, B, C simultaneously)
2. **Conflict resolution strategy?** (last-write-wins, merge, manual resolution)
3. **Latency tolerance?** (async vs near-real-time sync)
4. **Schema changes during runtime?**
5. **Scale beyond 3 nodes planned?**

**My recommendation depends on:**

- Low conflicts → Bucardo or pglogical
- High conflicts → Event-driven with app-level CRDT
- Enterprise budget → BDR
