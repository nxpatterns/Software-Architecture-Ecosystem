# Use Case 53: Vibration API for Haptic Feedback Resilience

A short vibration can genuinely improve perceived responsiveness. Relying on vibration for correctness is a design bug wearing a UX feature's clothes.

This covers haptic feedback as an optional UX signal, never a load-bearing one.

## Why Support Is Shrinking, Not Growing

Support here is inconsistent and, on at least one major engine, actively going backward. Silent failure is common — a call to a vibrate function on an unsupported browser just does nothing, no error, nothing to catch. Teams routinely overestimate how much haptics can reliably communicate on their own.

## The User Story, Stripped of Domain

A user gets:

- subtle tactile confirmation for actions, where it's available,
- zero functional dependency on haptics existing at all,
- an accessible visual or audio equivalent whenever vibration isn't there.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| `navigator.vibrate()` | Trigger short vibration patterns | [caniuse](https://caniuse.com/vibration) |
| Input/state-based feedback mapping | Decides which events are worth a haptic pulse | [MDN - UI Events](https://developer.mozilla.org/en-US/docs/Web/API/UI_Events), [MDN - KeyboardEvent](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent) |
| Accessible visual/audio equivalents | The actual reliable confirmation channel | [WCAG 2.2 - Non-text Content](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content), [MDN - ARIA live regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions) |

## The Browser Reality Check

Support here isn't just inconsistent, it's shrinking. Safari has never supported the Vibration API on macOS or iOS, and Firefox removed it entirely starting with Firefox 129 — a rare case of a browser actively dropping a previously supported API rather than simply lagging behind.<sup>[1]</sup> Any design leaning on vibration for anything beyond decoration is designing for an ever-narrowing slice of the actual browser landscape.

## What Breaks First

- Using vibration as the *only* confirmation signal for an action, leaving a real share of users with no feedback at all.
- Firing long or frequent vibration patterns that read as annoying rather than helpful — haptics are a spice, not a meal.
- No user-level setting to disable haptics, when some users find vibration actively unpleasant or disorienting.
- Assuming desktop hardware behaves anything like a phone here — most desktop browsers simply have nothing to vibrate.

## Minimal Technical Blueprint

```javascript
function confirmAction(eventType) {
  showVisualConfirmation(eventType); // always happens, this is the real feedback channel
  if (userSettings.hapticsEnabled && 'vibrate' in navigator) {
    navigator.vibrate(15); // short, sparse, and entirely optional
  }
}
```

1. Map only genuinely high-value events to short vibration patterns — not every tap needs a pulse.
2. Provide a user-level haptics toggle, respected consistently across the app.
3. Always pair vibration with visual feedback — never let it stand alone as the sole signal.
4. Keep patterns brief and sparse; a long buzzing pattern reads as an error even when it was meant as a confirmation.
5. Treat the API being a silent no-op as the normal path, not an exception to catch — because on Safari and current Firefox, it is the normal path.

## Test Matrix You Actually Need

- Supported Android devices, confirming the intended pattern actually feels right, not just fires.
- Unsupported browsers, confirming the silent-fail behavior doesn't break anything downstream.
- Accessibility modes and reduced-motion preferences, since haptic sensitivity intersects with broader sensory preferences.
- Rapid action bursts, checking both battery impact and whether the feedback becomes annoying under repetition.

## Decision Summary

Haptics can genuinely polish a UX. They cannot carry business-critical semantics — on two of three major engines, they may not fire at all, and a feature that silently doesn't work for a meaningful chunk of users was never a reliable design choice to begin with.

---

[1]: Vibration API browser support, including Safari's lack of support and Firefox's removal from v129, [caniuse](https://caniuse.com/vibration).
