# Use Case 71: Geolocation API for Context-Aware Location Workflows

Location is useful. Location is sensitive. Both statements have to be true in the architecture at the same time, not traded off against each other because precision was convenient.

## Why Location Gets More Scrutiny Than Most Permissions

Permission friction is genuinely high here — users hesitate over a location prompt more than almost any other browser permission. Precision and reliability vary by device and environment. And legal and privacy expectations around location data are stricter than most teams plan for at the start of a project, often becoming apparent only once legal review actually looks at the feature.

## The User Story, Stripped of Domain

A user can:

- share location intentionally, at a moment that makes sense to them,
- receive genuinely context-aware functionality in return,
- understand exactly what's collected and for how long.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| Geolocation API | Requests and returns device location, permission-gated | [MDN – Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API) |
| Permissions API | Checks current permission status before requesting | [MDN – Permissions API](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API) |
| Coarse vs. precise location policy | Deliberate choice of precision level for the actual use case | [MDN - GeolocationPosition.coords.accuracy](https://developer.mozilla.org/en-US/docs/Web/API/GeolocationCoordinates/accuracy), [MDN - PositionOptions.enableHighAccuracy](https://developer.mozilla.org/en-US/docs/Web/API/PositionOptions/enableHighAccuracy) |

## The Browser Reality Check

The Geolocation API itself is broadly supported and stable across every major browser, and has been for years — this is not a compatibility problem. It requires a secure context (HTTPS) everywhere, and permission is requested per-origin, with browsers increasingly surfacing clear, persistent indicators when a site is actively using location. The actual risk here isn't API support — it's that the feature's design decisions (when to ask, how precise a fix to request, how long to retain it) get far less scrutiny than they deserve given how sensitive the data actually is.

## What Breaks First

- Requesting location too early, with no context explaining why, producing a reflexive "Block" from a user who has no reason yet to trust the ask.
- No fallback workflow at all when access is denied, leaving the feature entirely broken instead of degraded to a manual alternative.
- Over-retaining precise coordinates well past the point the original workflow needed them, turning a momentary permission grant into a standing liability.

## Minimal Technical Blueprint

```javascript
locationButton.addEventListener('click', async () => {
  const status = await navigator.permissions.query({ name: 'geolocation' });
  if (status.state === 'denied') return renderManualLocationEntry(); // real fallback, not a dead end

  navigator.geolocation.getCurrentPosition(
    (position) => useLocation(position.coords, { retain: false }), // use, don't hoard
    () => renderManualLocationEntry(),
    { enableHighAccuracy: false } // coarse by default unless precision is truly required
  );
});
```

1. Request location only at a genuinely user-meaningful step in the flow, where the reason for asking is already obvious from context.
2. Support a coarse-location mode wherever the use case allows it — most location-aware features need "which city," not "which exact meter."
3. Provide a manual location-entry fallback, so denial doesn't dead-end the workflow entirely.
4. Minimize retention and downstream propagation of precise coordinates — use them for the immediate purpose, then let them go rather than quietly persisting them somewhere convenient for later.

## Decision Summary

Location features should be explicit, optional, and privacy-scoped by design — asked for at the right moment, requested at the right precision, and retained no longer than the feature actually needs, because the gap between "technically permitted" and "actually appropriate" is exactly where this feature tends to get a team into trouble.
