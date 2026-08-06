# Use Case 32: Experimentation Telemetry Architecture in Browser Apps

A/B testing is easy to start and remarkably easy to get quietly wrong. If exposure tracking is weak, the team isn't running experiments. It's generating random stories with confidence intervals attached, which is arguably worse than no data at all.

## Why Browser Lifecycle Corrupts Experiments Nobody Blames It For

Multi-tab behavior, late-loading features, and cached state can all corrupt assignment and exposure signals without a single visible error. Without strict telemetry design underneath the experiment, variant effect sizes become fiction that happens to have a p-value attached.

## The User Story, Stripped of Domain

A product team can:

- assign users deterministically to variants,
- log trustworthy exposure moments — not "the page loaded," but "the user actually saw the thing,"
- avoid cross-variant contamination,
- produce results that are actually statistically usable, not just statistically shaped.

## Core Browser Technologies

| API / Practice | Job | Reference |
|---|---|---|
| Deterministic client assignment (or server-issued) | Stable, reproducible variant bucketing | [MurmurHash3 (deterministic bucketing)](https://en.wikipedia.org/wiki/MurmurHash) |
| Exposure event hooks at render/interaction boundaries | Fire only when the variant was genuinely seen or used | [MDN – Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) |
| Local assignment cache with versioning | Consistent assignment across reloads | [MDN – IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) |
| `BroadcastChannel` for cross-tab consistency | One user, one assignment, regardless of tab count | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API) |
| Batched event delivery with idempotency keys | No phantom double-exposure from a retried request | [MDN – Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API), [HTTP Idempotency-Key (IETF draft)](https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/) |

## The Browser Reality Check

This isn't a browser-support problem in the traditional sense — every API involved here is broadly available. The reality check is behavioral: multi-tab usage, backgrounded tabs, and reload timing all interact with assignment stability in ways that differ by how aggressively each browser manages tab lifecycle. A tab suspended and resumed on iOS Safari can re-run initialization code in ways a desktop Chrome tab never would, and if bucketing inputs aren't stable across that resume, the same user silently lands in a different variant mid-session.

Cross-tab consistency is the sharper edge: a user with the experiment open in two tabs is one user in the data model and two independent assignment attempts in the code, unless something explicitly coordinates them.

## What Breaks First

- Exposure logged on page load even when the feature never actually rendered — the classic false-positive exposure that inflates the denominator and quietly kills statistical power.
- Reassignment after a refresh because the bucketing input (a random seed, a timestamp) wasn't actually stable across reloads.
- Multiple exposure events per user or session with no dedupe, double-counting a single real exposure.
- Variant contamination in multi-tab sessions, where a user experiences both variants inside what the analysis treats as one clean assignment.
- Missing holdout or control telemetry metadata, making it impossible to tell a true control-group result from a bug that silently degraded the treatment.

## Minimal Technical Blueprint

```javascript
async function getAssignment(experimentId, userId) {
  const cached = await readAssignmentCache(experimentId);
  if (cached && cached.version === CURRENT_VERSION) return cached;

  const assignment = await fetchServerAssignment(experimentId, userId); // server-issued, stable
  await persistAssignmentCache(experimentId, assignment);
  broadcastChannel.postMessage({ experimentId, assignment }); // keep other tabs in sync
  return assignment;
}

function logExposure(experimentId, variantId) {
  if (!isVariantActuallyVisible()) return; // never log on load alone
  sendEvent('exposure', { experimentId, variantId, idempotencyKey: exposureKey() });
}
```

1. Define the assignment contract explicitly: experiment ID, variant ID, assignment version — versioned from day one, because experiment logic changes mid-flight more often than anyone plans for.
2. Define the exposure contract with equal precision: when exposure counts as valid, exactly where in the code it's emitted, and the dedupe rule governing repeats.
3. Persist assignment with an expiry and clear migration rules for when the experiment definition itself changes.
4. Emit exposure only when the variant UI is genuinely visible and usable — a component that rendered off-screen or behind a loading state was never actually seen.
5. Use idempotency keys scoped to user-experiment-window, so a retried delivery can't double-count.
6. Tag every downstream outcome event with the experiment context, so results can actually be sliced by variant after the fact.
7. Add contamination detection metrics specifically — a way to catch the multi-tab, multi-variant case before it quietly pollutes the results.

## Privacy and Compliance

Avoid high-entropy identity joins where they aren't strictly needed for the experiment to function — an experimentation pipeline is not a license to build a more detailed user profile than the analysis actually requires. Treat experimentation metadata as governed data with the same rigor as any other telemetry category, and make sure consent state can actually disable non-essential experiment tracking rather than experiments quietly running regardless of what the user opted into.

## Test Matrix You Actually Need

- Reload and hard-refresh assignment stability, confirmed directly rather than assumed.
- Multi-tab simultaneous usage, deliberately provoking the contamination case.
- Offline/online transitions with delayed event delivery.
- A feature-flag rollback triggered mid-experiment, checking that exposure and outcome data stay coherent through it.
- Exposure dedupe verified under a forced retry.

## Decision Summary

Use this when experimentation genuinely drives roadmap decisions and the team is willing to invest in exposure quality as seriously as the statistical analysis on top of it.

Avoid running pseudo-experiments where exposure quality is unverified — a beautifully designed statistical test sitting on top of unreliable exposure data produces a confident-looking wrong answer, and a confident wrong answer is more dangerous to the roadmap than an honest "we don't know."
