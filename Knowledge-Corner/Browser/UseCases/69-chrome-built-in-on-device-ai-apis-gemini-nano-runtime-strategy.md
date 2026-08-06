# Use Case 69: Chrome Built-In On-Device AI APIs (Gemini Nano) Runtime Strategy

Bring-your-own model inference (Use Case 13) and browser-provided on-device AI are different products solving overlapping problems differently. This covers Chrome's built-in local AI API family, running on Google's Gemini Nano model shipped directly with the browser.

## Why Single-Vendor Support Changes the Calculus

This is a single-vendor capability today, with a real model-download and local-availability lifecycle to manage, and a quality envelope that's meaningfully different from a large cloud model — Gemini Nano is genuinely small, purpose-built for lightweight tasks, not a local GPT-class model.

## The User Story, Stripped of Domain

A user can:

- run supported local AI tasks quickly, with no server round-trip,
- keep sensitive short-form processing entirely on-device,
- fall back gracefully when the capability isn't available.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| Prompt API | General-purpose local prompting against Gemini Nano | [Chrome for Developers – Built-in AI](https://developer.chrome.com/docs/ai/built-in) |
| Summarizer / Translator / Language Detector APIs | Task-specific built-in AI, stable since Chrome 138 | [Chrome for Developers – Summarizer API](https://developer.chrome.com/docs/ai/summarizer-api) |
| Writer / Rewriter APIs | Content generation and revision, on-device | [Chrome for Developers – Built-in AI](https://developer.chrome.com/docs/ai/built-in) |
| Runtime capability + model-readiness checks | Confirms both API and downloaded model are actually ready | [Chrome for Developers - Built-in AI API status and availability](https://developer.chrome.com/docs/ai/built-in#check-api-availability), [Chrome for Developers - Prompt API availability states](https://developer.chrome.com/docs/ai/prompt-api#model-download) |

## The Browser Reality Check

This is Chrome-only, running on Gemini Nano, a small on-device model that automatically downloads on first use — sizing several gigabytes depending on the device, with all inference happening locally and no user input sent to the cloud.<sup>[1]</sup> The Summarizer, Language Detector, and Translator APIs reached stable release starting in Chrome 138 (June 2025); the Prompt API and Writer/Rewriter APIs have moved through origin trials and, as of early-to-mid 2026, remain on a rollout trajectory expected to reach broader stable availability in Chrome 145–150 over the following months.<sup>[2][3]</sup> No other browser vendor currently ships an equivalent — this is squarely a Chrome-specific capability, not a general web platform baseline.

The honest quality framing matters here: Gemini Nano is optimized for lightweight tasks like summarization and classification, explicitly not for large-scale reasoning or precise factual queries — think "smart autocomplete," not "a local version of a frontier model."<sup>[4]</sup>

## What Breaks First

- Assuming quality equivalent to cloud LLMs, when Gemini Nano is deliberately scoped to a much smaller, faster, more constrained model class.
- No handling for the download and readiness state at all, leaving a user's first interaction stall silently while a multi-gigabyte model downloads in the background.
- No fallback outside Chromium, when this entire capability is currently exclusive to one browser.

## Minimal Technical Blueprint

```javascript
async function summarizeLocally(text) {
  if (!('Summarizer' in self)) return callServerSideSummarizer(text); // real fallback

  const availability = await Summarizer.availability();
  if (availability === 'unavailable') return callServerSideSummarizer(text);
  if (availability === 'downloadable' || availability === 'downloading') {
    showModelDownloadState(); // transparent, not a silent stall
  }

  const summarizer = await Summarizer.create();
  return summarizer.summarize(text);
}
```

1. Define task classes genuinely suited to local model quality — summarization, translation, light classification — not tasks requiring deep reasoning or factual precision.
2. Detect both API presence and actual model availability at runtime, since the API existing doesn't mean the model has finished downloading.
3. Surface readiness and the fallback path transparently to the user, rather than a silent stall during a multi-gigabyte download.
4. Keep strict privacy and retention boundaries around prompts and results — "local" is a genuine privacy win, but it doesn't retroactively make sensitive content safe to log elsewhere in the pipeline.

## Decision Summary

Treat built-in local AI as a targeted acceleration layer with explicit quality and support boundaries — genuinely valuable for the right narrow tasks on Chrome, and not a foundation to build a cross-browser AI feature on top of today.

---

[1]: Gemini Nano on-device model behavior and download lifecycle, [Medium – Gemini Nano in Chrome](https://medium.com/@hamzamfarooqi/gemini-nano-in-chrome-on-device-ai-is-here-no-cloud-required-bba874f60697).
[2]: Summarizer/Translator/Language Detector stable release in Chrome 138, [Chrome for Developers](https://developer.chrome.com/docs/ai/summarizer-api).
[3]: Prompt API and Writer/Rewriter rollout trajectory toward Chrome 145–150, [ComputeLeap](https://www.computeleap.com/blog/chrome-gemini-nano-prompt-api-window-ai-may-2026/).
[4]: Gemini Nano quality scope and limitations, [flaming.codes – Chrome's Built-In AI](https://flaming.codes/posts/chrome-gemini-nano-built-in-ai).
