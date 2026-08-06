# Use Case 21: Identity and Session Continuity in Browser Apps

Authentication looks simple in an architecture diagram. Box A sends a token to Box B. Everybody smiles and moves to the next slide.

Real browser sessions are less polite: multiple tabs, expired tokens, storage trade-offs, blocked cookies, refresh-race conditions, and logout states that are "kind of" logged out in a way that becomes a support ticket by lunchtime.

## Why This Is Both Security-Critical and UX-Critical at Once

Optimize only one side and the other side files the tickets. Users want seamless continuity. Security teams want strict boundaries. Browsers want privacy controls that don't ask either group's permission. The code has to keep all three in the same room without a fight breaking out.

## The User Story, Stripped of Domain

- sign in reliably,
- keep a stable session across reloads and short interruptions,
- recover gracefully from token expiry,
- open multiple tabs with no auth chaos between them,
- log out with predictable, immediate effect everywhere at once.

SaaS dashboard, admin console, customer portal — same architecture, different threat model details underneath.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| Cookies (`HttpOnly`, `Secure`, `SameSite`) | The strongest default for hardening a session boundary | [MDN – Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie) |
| Web Storage (`localStorage`/`sessionStorage`) | Optional state hints — never blind trust for credentials | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API) |
| IndexedDB | Structured storage for low-risk, session-adjacent metadata | [MDN – IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) |
| `BroadcastChannel` / `storage` events | Cross-tab auth state synchronization | [MDN – Broadcast Channel API](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API) |
| Service Worker (optional) | Centralized request handling, token-refresh coordination | [MDN – Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) |
| Fetch + credential modes | Explicit transport behavior for session cookies against APIs | [MDN – fetch credentials](https://developer.mozilla.org/en-US/docs/Web/API/RequestInit#credentials) |
| Page Visibility API | Foreground-resume checks, silent-refresh gating | [MDN – Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) |

## The Browser Reality Check

If auth logic only works in one active tab on desktop, it isn't done. It's a demo.

Chromium, Firefox, and Safari all support secure cookie-based auth patterns. The real divergence shows up around cookie policy defaults, partitioning, and privacy behavior — not around whether the mechanism exists at all. Safari's Intelligent Tracking Prevention is the sharpest edge here: it applies capped expiry and partitioning behavior to client-set cookies and storage in ways Chromium and Firefox simply don't by default, which turns a "seven-day session" into something considerably shorter on Safari without a single line of your code changing.<sup>[1]</sup>

Android Chromium is generally predictable for mainstream auth flows. iOS Safari stacks stricter lifecycle behavior on top of the same privacy posture: background tab suspension changes timing assumptions your refresh logic quietly depended on, and session continuity can be affected by storage and cookie behavior in ways that vary by exact setup and aren't always obvious from the outside.

## What Breaks First

- Storing long-lived bearer tokens in `localStorage` and calling that "done." It's readable by any script that runs on the page, including ones you didn't write.
- Running parallel refresh requests from multiple tabs, occasionally producing two valid refresh attempts racing the same rotation boundary.
- Missing token-rotation race handling entirely — the failure mode here is silent until it isn't.
- Partial logout: tab A logs out cleanly, tab B is still alive holding stale in-memory state that thinks it's authenticated.
- Assuming network failures and auth failures are the same problem and handling them identically. They demand completely different UX.
- Not separating identity state from presentation state, so a UI bug and an auth bug end up indistinguishable from the outside.

The app says "session expired." The user says "but I was active two seconds ago." Both can be simultaneously correct when refresh logic is naive about timing.

## Minimal Technical Blueprint

```javascript
// Single-flight refresh: one tab does the work, the rest wait on it
async function ensureFreshToken() {
  return navigator.locks.request('token-refresh', async () => {
    if (!isExpiringSoon(currentToken)) return currentToken;
    const fresh = await refreshToken();
    broadcastChannel.postMessage({ type: 'refresh-success', expiresAt: fresh.expiresAt });
    return fresh;
  });
}

broadcastChannel.onmessage = ({ data }) => {
  if (data.type === 'forced-logout') purgeLocalStateAndRedirect();
};
```

1. Choose the session boundary model deliberately: cookie-based session as the preferred baseline, or token-based with strict hardening and short lifetimes if cookies genuinely don't fit the architecture.
2. Keep sensitive credentials out of JavaScript-readable storage wherever possible — `HttpOnly` exists precisely so a compromised script can't read the session token directly.
3. Implement single-flight refresh: one tab performs it, the others await the result through a coordination channel instead of each firing their own request.
4. Version auth state with monotonic counters or timestamps so stale state is detectable, not just eventually wrong.
5. Broadcast every state transition explicitly: login success, refresh success or failure, forced logout — not just the happy path.
6. Differentiate failure classes clearly: invalid auth, transient network failure, and backend unavailability are three different user experiences, not one generic error screen.
7. Make logout authoritative: server-side invalidation, local state purge, cross-tab propagation, and a navigation reset, all four, every time.
8. Add defensive revalidation on foreground resume — a tab that's been backgrounded for twenty minutes shouldn't assume its last known auth state is still accurate.

## Compatibility Strategy

**Baseline:** secure cookie/session handling, cross-tab state sync via the `storage`-event fallback, deterministic logout and retry paths.

**Enhanced:** `BroadcastChannel` for low-latency sync, service-worker-assisted refresh orchestration, richer telemetry and anomaly detection.

Correctness must never depend on the enhanced layer. Enhanced mode buys smoother UX. It was never meant to carry core trust guarantees, and treating it that way is how a coordination bug becomes a security incident.

## Security and Compliance

Prefer `HttpOnly` plus `Secure` plus a strict `SameSite` policy by default — this remains the strongest baseline any of these APIs offer.<sup>[2]</sup> Rotate session identifiers and tokens on critical state changes, not just on a fixed schedule. Enforce server-side revocation and expiry regardless of what the client believes its own state to be — the client's opinion of its session validity is a cache, never the source of truth. Minimize how long auth data persists on-device, and audit every cross-tab propagation path for accidental leakage — a broadcast channel that's convenient for sync is just as convenient for exfiltration if nobody's checking payload contents.

## Related Browser Identity APIs

- **FedCM (Federated Credential Management):** a third-party-cookie-resilient federated login path — see the dedicated use case for the full mechanics.
- **Storage Access API:** embedded login continuity when strict cookie policies like Safari's ITP apply to an iframe's context.
- **Cookie Store API:** async cookie lifecycle handling for service-worker-driven auth orchestration.

Auth bugs are rarely "just frontend bugs." They're incident reports in slow motion, and the slow motion is the dangerous part — nobody notices until the pattern's already shipped to production for a week.

## Test Matrix You Actually Need

- Chrome, Firefox, Safari desktop with multi-tab login/logout flows exercised directly.
- iOS Safari and Android Chrome with background/foreground transitions deliberately triggered.
- Simultaneous refresh storms — five or more tabs firing at once.
- Network flapping during both refresh and logout.
- Clock-skew simulations around expiry boundaries.
- Server-side session invalidation while the client believes itself active.
- Private mode behavior, checked as its own category, not assumed to match regular browsing.
- Pen-test-oriented scenarios: token theft assumptions, CSRF boundaries, replay attempts.

An auth test plan that's "login once, reload the page" tested typography. Not identity.

## Decision Summary

Use this when session continuity is genuinely core to user productivity, when the security posture demands predictable enforcement, and when the team can actually implement and operate cross-tab auth coordination as ongoing work.

Avoid the fragile shortcuts when the threat model is high and browser storage choices are being made purely for convenience, when auth state can't be reasoned about deterministically, or when logout semantics are treated as a UI concern rather than the security boundary they actually are.

Browser identity can absolutely be robust. Only when the security logic is architecture, not decoration bolted on after the login screen looked nice.

---

[1]: Safari Intelligent Tracking Prevention cookie and storage restrictions, [WebKit Blog – Full Third-Party Cookie Blocking and More](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/).
[2]: `Set-Cookie` `SameSite`/`Secure`/`HttpOnly` semantics, [MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie).
