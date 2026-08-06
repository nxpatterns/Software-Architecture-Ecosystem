# Use Case 76: Permissions API as a Cross-Cutting Governance Layer

Permissions are not isolated prompts scattered across individual features. They're runtime policy boundaries that cut across camera, microphone, geolocation, notifications, clipboard, and half the other use cases in this deck — and treating each one as its own independent little prompt is how a product ends up with ten inconsistent permission UX patterns instead of one coherent one.

## Why Optimistic Permission Assumptions Fail Quietly

Permission states change over time — granted today doesn't mean granted tomorrow, and a user can revoke access from browser settings entirely outside the app's awareness. Support and exact behavior differ by API and browser. And most teams build on optimistic assumptions, checking permission once at feature launch and never again.

## The User Story, Stripped of Domain

A system can:

- track permission states coherently across every permission-gated feature,
- adapt feature behavior before a failure, not react to one after the fact,
- keep the UX honest about what the app can and can't currently do.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| `navigator.permissions.query()` | Checks current permission state where supported | [MDN – Permissions API](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API) |
| Feature-specific request flows | Camera, mic, geolocation, notifications — each with its own request semantics | [MDN - MediaDevices.getUserMedia()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia), [MDN - Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API), [MDN - Notification.requestPermission()](https://developer.mozilla.org/en-US/docs/Web/API/Notification/requestPermission_static) |
| Central capability/permission state registry | One place tracking what's actually available right now | [MDN - Permissions API](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API), [MDN - Navigator.permissions](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/permissions) |

## The Browser Reality Check

`navigator.permissions.query()` support and the specific set of queryable permission names vary by browser — not every permission this app might request is queryable through this API on every engine. Treat it as a genuine convenience where available, not a universal single source of truth; the individual feature APIs (`getUserMedia`, `Notification.requestPermission`, etc.) remain the actual authority on whether an action will succeed.

## What Breaks First

- Treating a permission check as one-time startup logic, never revisited for the rest of the session.
- No re-check on a resumed session, so an app that's been backgrounded for a while acts on stale permission assumptions the moment it's foregrounded again.
- Missing UX entirely for denied or permanently-blocked states, leaving a user stuck with a silently non-functional feature and no path to understand why.

## Minimal Technical Blueprint

```javascript
const capabilityRegistry = new Map();

async function checkPermission(name) {
  if ('permissions' in navigator) {
    try {
      const status = await navigator.permissions.query({ name });
      capabilityRegistry.set(name, status.state);
      status.onchange = () => capabilityRegistry.set(name, status.state); // live updates
      return status.state;
    } catch { /* not queryable on this browser — fall through */ }
  }
  return 'unknown'; // the feature's own request flow is the real fallback authority
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') recheckAllPermissionSensitiveFeatures();
});
```

1. Build a centralized permission and capability map, so every feature reads from one place instead of independently reinventing its own check.
2. Re-check permission-sensitive features on key lifecycle events — foreground resume, route change into a permission-dependent screen — not just once at load.
3. Distinguish default, denied, and granted states explicitly in both UX and telemetry; "not granted" and "actively denied" call for genuinely different messaging.
4. Keep every permission-gated feature functional with an explicit fallback path, so a denial degrades the experience rather than breaking it outright.

## Decision Summary

The Permissions API should be a governance layer, not scattered helper calls sprinkled through individual features — the value here is coherence across the whole app's permission story, not any single query call in isolation.
