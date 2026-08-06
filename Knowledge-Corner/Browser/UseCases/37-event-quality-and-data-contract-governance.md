# Use Case 37: Event Quality and Data Contract Governance

Telemetry volume without event quality is expensive confusion. Bad data arrives faster than good decisions ever could, and it looks exactly as confident on a dashboard as good data does.

## Why Telemetry Breaks in Slow Motion

Frontend releases move quickly, event schemas drift silently across them, and downstream consumers keep assuming whatever field semantics were true six releases ago. Without contracts, telemetry doesn't break with an error message — it breaks quietly, one drifted field at a time, until someone finally notices the numbers stopped making sense.

## The User Story, Stripped of Domain

A team can:

- evolve events safely across releases,
- detect schema drift early, before it reaches a dashboard,
- keep analytics and observability consumers stable through ongoing change.

## Core Browser Technologies

| Practice | Job | Reference |
|---|---|---|
| Versioned event schemas | Every event carries a version, not an implicit assumption | [JSON Schema](https://json-schema.org/) |
| Lightweight runtime event validators | Catch malformed events before they're even sent | [Ajv JSON schema validator](https://ajv.js.org/) |
| Producer metadata tagging (app version, schema version) | Every event is traceable to exactly what produced it | [Semantic Versioning](https://semver.org/) |
| Server-side schema registry + rejection policy | The server enforces the contract, not just documents it | [Confluent Schema Registry fundamentals](https://docs.confluent.io/platform/current/schema-registry/fundamentals/index.html) |
| Compatibility check pipeline in CI | Schema drift caught before merge, not after production | [GitHub Actions](https://docs.github.com/en/actions) |

## The Browser Reality Check

This is an engineering-discipline problem more than a browser-compatibility one — every browser can send a well-formed event just as easily as a malformed one. The actual risk is release velocity: a frontend team ships fast, changes a field's meaning without renaming it, and every downstream consumer that assumed the old semantics keeps silently misinterpreting new data with no error anywhere in the pipeline to catch it.

## What Breaks First

- A field gets renamed with no migration path, and every historical query referencing the old name silently returns nothing or the wrong thing.
- A field's semantics change while its name stays the same — the classic, hardest-to-catch version of drift, because nothing in the pipeline objects.
- An optional field quietly becomes effectively required downstream, because some consumer started assuming it's always present and breaks the moment it isn't.
- Dashboards mix incompatible event versions together, blending two different definitions of the same metric into one misleading number.

## Minimal Technical Blueprint

```javascript
const EVENT_SCHEMAS = {
  'checkout.completed': { version: 3, required: ['orderId', 'amount', 'currency'] },
};

function validateEvent(name, fields) {
  const schema = EVENT_SCHEMAS[name];
  const missing = schema.required.filter(f => !(f in fields));
  if (missing.length) throw new Error(`Event ${name} missing: ${missing.join(', ')}`); // fail loud, client-side
  return { ...fields, schemaVersion: schema.version, appVersion: APP_VERSION };
}
```

1. Treat every event as a contract — a promise about shape and meaning that downstream consumers are relying on, whether or not that's been made explicit.
2. Define an actual schema versioning policy covering backward and forward compatibility, not just "we'll deal with it when something breaks."
3. Validate events before transport wherever practical, catching malformed data at the source instead of downstream.
4. Enforce schema checks server-side too — client-side validation is a courtesy, the server is the actual gate.
5. Monitor rejection rates by producer version, so a bad release is visible in the rejection graph before it's visible in a confused analyst's Slack message.
6. Publish migration notes for downstream consumers whenever a schema changes — a silent breaking change is a broken contract regardless of intent.

## Privacy and Compliance

Schema governance has to include privacy field classification as a first-class part of the contract, not a separate afterthought review. Prohibit ad-hoc "temporary" sensitive fields entirely — temporary fields have a well-documented habit of becoming permanent the moment nobody's assigned to remove them, and a temporary PII field is exactly as risky as a permanent one for as long as it exists.

## Test Matrix You Actually Need

- Compatibility tests running old and new producer versions side by side.
- Intentional schema drift simulation, deliberately breaking a contract to confirm the detection actually catches it.
- Downstream parser contract tests, verifying consumers handle both the current and previous schema version gracefully.
- Rollback tests after a failed schema rollout, confirming a bad deploy doesn't leave the pipeline in a half-migrated state.

## Decision Summary

Use this when telemetry is consumed by multiple teams or systems, where a silent drift in one place quietly corrupts decisions made somewhere else entirely.

Avoid ad-hoc event evolution when decision integrity actually matters — a telemetry pipeline nobody's enforcing contracts on will eventually produce numbers nobody can fully trust, and by the time that's obvious, untangling which historical data is even valid becomes its own project.
