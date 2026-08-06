# Use Case 49: Window Management API for Multi-Monitor Orchestration

Single-monitor assumptions die fast in trading desks, operations rooms, and control centers. This addresses browser apps that intentionally use multiple physical displays as part of the actual product, not as an incidental setup detail.

## Why Window Placement Sounds Easy Until It Isn't

Permissions, DPI differences, and monitor hot-plug events all enter the conversation the moment "smart layout" leaves the demo and meets a real operations room with three mismatched monitors bought two years apart.

## The User Story, Stripped of Domain

A user can:

- run a primary workflow on one screen,
- place context panels on secondary displays deliberately,
- keep the layout stable across reconnects and restarts, not rebuilt from scratch every session.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| Window Management API (`getScreenDetails()`) | Enumerates connected displays and their properties | [W3C – window-management HOWTO](https://github.com/w3c/window-management/blob/main/HOWTO.md) |
| Multi-window lifecycle handling | Tracks and reconciles windows across displays | [MDN - Window.open()](https://developer.mozilla.org/en-US/docs/Web/API/Window/open), [MDN - Window.closed](https://developer.mozilla.org/en-US/docs/Web/API/Window/closed) |
| Layout persistence with safe restore | Saved layout that degrades gracefully, never crashes on mismatch | [MDN - Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API), [MDN - IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) |

## The Browser Reality Check

This is Chromium-heavy support, available from Chrome 100 — not a cross-browser baseline.<sup>[1]</sup> Graceful degradation to manual layout on unsupported browsers isn't a nice-to-have here, it's the only way the product works at all outside Chromium. Enterprise policy can also block this capability even where the API technically exists on a managed machine, which means "the API is supported" and "the API is usable in this deployment" are two separate questions worth checking separately.

## What Breaks First

- Hard-coded pixel coordinates across displays with mismatched DPI, producing a layout that looks correct on the dev machine and wrong everywhere else.
- Orphaned windows left behind after a monitor disconnects mid-session, with no logic to reconcile what just happened.
- No fallback at all for a denied permission request, leaving the user stuck instead of gracefully dropped to single-window mode.
- Assuming display identity never changes between sessions — a monitor gets swapped, a laptop docks differently, and the saved layout no longer matches physical reality.

## Minimal Technical Blueprint

```javascript
async function restoreLayout(savedLayout) {
  const permission = await navigator.permissions.query({ name: 'window-management' });
  if (permission.state !== 'granted') return renderSingleWindowFallback();

  const { screens } = await getScreenDetails();
  const reconciled = savedLayout.roles.map(role =>
    matchRoleToCurrentScreen(role, screens) // semantic role, not a raw saved coordinate
  );
  reconciled.forEach(placement => openWindowAt(placement));
}
```

1. Detect display topology only after permission is actually granted — never assume access before asking.
2. Store layout semantically, by role ("primary workflow," "context panel"), not as raw pixel coordinates that mean nothing once the monitor arrangement changes.
3. Reconcile the saved layout against current topology every time, rather than blindly replaying old coordinates onto a possibly different set of screens.
4. Provide a manual "reset layout" action, because automatic reconciliation will eventually guess wrong and the user needs a clean way out.
5. Keep the single-window fallback fully usable on its own — it's not a degraded afterthought, for a real share of users it's the only mode that exists.

## Test Matrix You Actually Need

- Dual and triple monitor setups, tested directly rather than assumed to generalize from one configuration.
- Mixed DPI and orientation across displays.
- Unplug and replug a monitor mid-session, confirming the reconciliation logic actually handles it.
- Permission-denied and enterprise-policy-blocked modes, both tested as real, expected paths.

## Decision Summary

Use this when multi-screen productivity is genuinely core business value — a trading floor, a monitoring wall, an operations console.

If it's optional convenience rather than core value, keep the fallback first-class and simple; a multi-monitor feature that isn't the product's reason for existing shouldn't be allowed to compromise the single-window experience most users will actually have.

---

[1]: Window Management API browser support (Chromium v100+), [W3C window-management HOWTO](https://github.com/w3c/window-management/blob/main/HOWTO.md).
