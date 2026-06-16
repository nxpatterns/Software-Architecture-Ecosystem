# DNS Troubleshooting: macOS + Chrome

## Summary

This document captures a short but recurring debugging session: a domain resolves correctly on public DNS (e.g. Google's `8.8.8.8`) but Chrome on macOS still shows `DNS_PROBE_FINISHED_NXDOMAIN`. The root cause is that Chrome maintains its own DNS cache and, when DNS-over-HTTPS is enabled, uses a completely separate resolver that neither OS-level cache flushes nor Chrome's own `net-internals` panel can clear directly.

This pattern appears frequently after DNS changes (new domain, changed records, server migration) and is worth documenting because the fix is non-obvious and the standard advice ("flush your DNS") does not work.

---

## The Problem

After a DNS change, the domain is reachable via external resolvers but not in Chrome:

- `dig @8.8.8.8 yourdomain.com` returns a valid answer
- Chrome shows `DNS_PROBE_FINISHED_NXDOMAIN`
- Flushing the macOS DNS cache has no effect
- Clearing Chrome's host cache via `chrome://net-internals/#dns` has no effect

---

## Why This Happens

DNS resolution in Chrome on macOS goes through up to three independent layers:

1. **OS DNS cache** -- managed by macOS's `mDNSResponder`
2. **Chrome's internal DNS cache** -- visible and clearable via `chrome://net-internals/#dns`
3. **Chrome's DNS-over-HTTPS (DoH) resolver** -- a completely separate encrypted resolver (Cloudflare, Google, etc.) with its own cache that Chrome manages independently

When DNS-over-HTTPS is active, Chrome bypasses layers 1 and 2 entirely. The DoH resolver's cache cannot be flushed manually; disabling DoH is the only way to force Chrome to fall back to the OS resolver.

---

## Step-by-Step Fix

### Step 1 -- Flush macOS DNS cache

Open Terminal and run:

```bash
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
```

Note: `ipconfig /flushdns` is the Windows equivalent and does not work on macOS.

### Step 2 -- Verify the domain resolves externally

```bash
dig @8.8.8.8 yourdomain.com
```

If this returns `NXDOMAIN`, the problem is DNS propagation -- wait and retry. If it returns a valid IP, continue.

### Step 3 -- Clear Chrome's internal DNS cache

Navigate to:

```
chrome://net-internals/#dns
```

Click "Clear host cache".

Then navigate to:

```
chrome://net-internals/#sockets
```

Click "Flush socket pools".

### Step 4 -- Disable DNS-over-HTTPS in Chrome (the actual fix)

Navigate to:

```
chrome://settings/security
```

Scroll to "Use secure DNS" and toggle it off. Chrome will now use the OS resolver instead of its own DoH provider.

Restart Chrome fully: **Cmd+Q**, then reopen.

### Step 5 -- Re-enable DNS-over-HTTPS (optional)

Once the domain resolves correctly, you can re-enable "Use secure DNS" in the same settings panel. The DoH resolver will pick up the correct record going forward.

---

## Quick Reference

| Symptom | Likely cause |
|---|---|
| `NXDOMAIN` everywhere including `dig @8.8.8.8` | DNS not propagated yet -- wait |
| `dig @8.8.8.8` works, OS + other browsers work, Chrome does not | Chrome DoH cache |
| `dig @8.8.8.8` works, Chrome net-internals flush did not help | Chrome DoH bypassing OS resolver |

---

## Context

This session is part of a broader CloudLib infrastructure context (ai.cloudlib.eu / cloudlib.eu) where DNS changes are made during server migrations, new subdomain setups, or service reconfigurations. The Chrome DoH issue has caused repeated confusion because the standard "flush DNS" advice targets the OS layer and leaves Chrome's independent resolver untouched.
