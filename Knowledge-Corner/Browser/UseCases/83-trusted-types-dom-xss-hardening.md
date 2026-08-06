# Use Case 83: Trusted Types for DOM-Based XSS Hardening

`element.innerHTML = userInput` is still, after two decades of security advice telling everyone not to do it, one of the most common ways an application gets XSS'd. Trusted Types doesn't ask developers to be more careful. It makes the browser itself refuse to execute a raw string at the exact point it would become dangerous.

## Why CSP Alone Was Never Enough

A Content-Security-Policy script-src directive controls which scripts can run. It says nothing about a raw string quietly being interpreted as HTML through `innerHTML`, or as a script URL through `<script src>`, deep inside application code that CSP has no visibility into. Trusted Types closes that specific gap — it enforces safe DOM manipulation directly at the injection sink, not just at the script-loading boundary.

## The User Story, Stripped of Domain

A team can:

- eliminate an entire class of DOM-based XSS vulnerabilities by construction, not by code review discipline,
- force every dangerous DOM write through an explicit, auditable sanitization policy,
- get a browser-enforced guarantee instead of hoping every contributor remembers to sanitize.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| Trusted Types API (`window.trustedTypes`) | Defines policies that transform strings before they reach a dangerous sink | [MDN – Trusted Types API](https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API) |
| `Content-Security-Policy: trusted-types` | Allowlists which named policies are permitted | [MDN – trusted-types directive](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/trusted-types) |
| `Content-Security-Policy: require-trusted-types-for` | Enforces that sinks reject raw strings entirely | [content-security-policy.com](https://content-security-policy.com/trusted-types/) |
| DOMPurify (or an equivalent sanitizer) | The actual sanitization logic a policy typically wraps | [DOMPurify (GitHub)](https://github.com/cure53/DOMPurify), [OWASP - Cross Site Scripting Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html) |

## The Browser Reality Check

This just crossed a real milestone worth knowing precisely: Trusted Types reached Baseline status — meaning it now works across all major browser engines — in February 2026.<sup>[1]</sup> Chrome and Edge have supported it since version 83 back in May 2020. Safari joined in version 26, released September 2025. Firefox was the last to complete the picture, landing support in February 2026.<sup>[1]</sup> That means production teams that shelved Trusted Types a year or two ago as "Chromium-only, not worth the enforcement yet" now have a genuinely different calculus — this is finally practical to adopt without a browser-support caveat attached.

## What Breaks First

- Enabling `require-trusted-types-for: 'script'` against a large existing codebase with no migration plan, and watching every unaudited `innerHTML` assignment throw immediately.
- Writing a "default" policy that just passes strings through unchanged to stop the errors, which technically satisfies the CSP but defeats the entire security purpose.
- Forgetting that Trusted Types also governs `<script>` and `<iframe>` URL sinks, not just HTML — a codebase that only audited `innerHTML` usage still has gaps.
- Assuming a third-party library is Trusted-Types-compatible without checking; a library that calls `innerHTML` internally with no Trusted Types awareness will break the moment enforcement is turned on.

## Minimal Technical Blueprint

```javascript
if (window.trustedTypes && trustedTypes.createPolicy) {
  const policy = trustedTypes.createPolicy('app-sanitizer', {
    createHTML: (input) => DOMPurify.sanitize(input), // real sanitization, not a passthrough
    createScriptURL: (input) => {
      if (!ALLOWED_SCRIPT_ORIGINS.includes(new URL(input).origin)) {
        throw new Error('Untrusted script origin');
      }
      return input;
    },
  });
  element.innerHTML = policy.createHTML(userInput); // the sink now only accepts TrustedHTML
}
```
```
Content-Security-Policy: trusted-types app-sanitizer; require-trusted-types-for 'script'
```

1. Start in report-only mode (`Content-Security-Policy-Report-Only`) to discover every violation across the real codebase before enforcing anything.
2. Define named policies scoped to specific purposes — a sanitizing policy for user content, a stricter allowlist policy for script URLs — rather than one catch-all policy that quietly becomes a bypass.
3. Route the sanitization logic through an established library like DOMPurify rather than hand-rolling sanitization inside the policy.
4. Audit third-party dependencies for Trusted Types compatibility before enabling enforcement; a library with an internal `innerHTML` call will fail loudly the moment enforcement is on.
5. Move from report-only to full enforcement in stages, by route or feature area, rather than flipping the switch globally on day one.

## Compatibility Strategy

**Baseline:** as of February 2026, genuinely available across Chrome, Edge, Safari, and Firefox — Trusted Types is now a real cross-browser baseline, not an enhancement layer.<sup>[1]</sup>

**Legacy consideration:** older browser versions predating each engine's rollout simply ignore the CSP directives entirely and fall back to normal DOM behavior — the feature degrades safely to "no additional protection," never to a broken page.

## Security and Compliance

This is explicitly a security-hardening feature, and its value is proportional to how strictly it's enforced — a policy that exists but doesn't actually sanitize is worse than no policy, since it creates a false sense of protection during a security review. Document every named policy's purpose and the sanitization logic behind it, since an auditor reviewing XSS defenses will specifically want to see that the policies do real work.

## Test Matrix You Actually Need

- Report-only mode against the full production codebase, collecting every violation before enforcing anything.
- Every third-party dependency exercised under enforcement, not just first-party code.
- Chrome, Edge, Safari 26+, and Firefox with the February 2026 baseline support, confirming consistent enforcement behavior across all four.
- An older browser predating full support, confirming graceful degradation rather than breakage.

## Decision Summary

Use this for any application handling user-generated content, dynamic script loading, or third-party embeds — which is to say, most production web applications.

The cross-browser support gap that made this a partial solution is now closed as of February 2026 — reconsider Trusted Types if it was previously shelved specifically for that reason.

---

[1]: Trusted Types reaching Baseline status and cross-browser version history, [uriports.com – Beyond script-src](https://www.uriports.com/blog/csp-trusted-types/), [MDN – Trusted Types API](https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API).
