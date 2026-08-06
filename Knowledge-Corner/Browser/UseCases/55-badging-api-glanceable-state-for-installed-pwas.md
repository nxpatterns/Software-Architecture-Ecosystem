# Use Case 55: Badging API for Glanceable State in Installed PWAs

People don't open apps to check whether nothing happened. Badges exist specifically to prevent that pointless open — a glance at the icon should answer the question before the app even launches.

This covers lightweight status signaling through app-icon badging.

## Why Badge Semantics Are Easy to Ruin

Overdoing badges is trivially easy, cross-platform behavior genuinely differs, and a stale count destroys user trust fast — the second time a badge shows "3" for something the user already handled, they stop trusting the number entirely, and the feature is dead from that point on regardless of how it's fixed later.

## The User Story, Stripped of Domain

A user can:

- see pending items at a glance, with no app launch required,
- decide whether opening the app is actually worth it right now,
- trust that the badge state reflects current reality, not stale data from an hour ago.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| `setAppBadge()`/`clearAppBadge()` | Sets or clears the icon badge for an installed PWA | [Chrome for Developers](https://developer.chrome.com/docs/capabilities/web-apis/badging-api) |
| Service worker update hooks | Updates the badge from background events | [MDN - Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API), [MDN - Background Synchronization API](https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API) |
| Durable local state reconciliation | Keeps the badge honest against actual backend state | [MDN - IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API), [MDN - CacheStorage](https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage) |

## The Browser Reality Check

This works best specifically for installed PWA contexts — a regular browser tab doesn't have an icon to badge in the same way. Browser and OS support varies meaningfully across platforms, so the feature needs to degrade to in-app indicators and standard notifications wherever the badge itself isn't available or the app isn't installed.

## What Breaks First

- Badge count drifting from actual backend state, so the number on the icon stops matching reality the first time an update is missed.
- No clear rule for exactly when the badge clears, leaving it stuck showing a stale count long after the user has already dealt with everything it represented.
- Badge spam for low-value events, training users to ignore the badge entirely because it fires for things that never mattered.
- No offline reconciliation strategy, so a count that incremented while offline never gets corrected once connectivity returns.

## Minimal Technical Blueprint

```javascript
async function syncBadgeCount() {
  const authoritative = await fetchPendingCountFromServer(); // never trust local increments alone
  if (authoritative === 0) {
    await navigator.clearAppBadge();
  } else {
    await navigator.setAppBadge(authoritative);
  }
}

self.addEventListener('sync', () => syncBadgeCount()); // reconcile on every meaningful sync
window.addEventListener('focus', () => syncBadgeCount()); // and every time the user actually looks
```

1. Define strict badge semantics up front — exactly what counts toward the number and what explicitly doesn't.
2. Update the badge only on authoritative state changes, never on an optimistic local guess that might not match the server.
3. Reconcile the count on app open and on periodic background sync, so drift gets corrected regularly rather than accumulating.
4. Clear the badge aggressively the moment the user has actually consumed whatever it represented — a badge that lingers after being addressed is worse than no badge at all.
5. Keep fallback indicators — an in-app dot, a notification — functionally equivalent for contexts where the badge itself isn't available.

## Test Matrix You Actually Need

- Fresh install and reinstall behavior, confirming the badge starts in a correct, known state.
- Offline increments followed by later reconciliation once connectivity returns.
- Multi-device state divergence, since the same account on two devices can easily produce two different badge counts if reconciliation isn't handled carefully.
- Permission and unsupported-mode fallbacks, confirmed to degrade gracefully rather than silently do nothing.

## Decision Summary

Badges are a precision tool. If everything deserves a badge, nothing deserves a badge — and the fastest way to lose the feature's entire value is to let it drift from reality even once.
