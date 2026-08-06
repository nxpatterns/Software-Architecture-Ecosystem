# Use Case 51: Contact Picker for Consentful Address Book Input

Typing names and emails manually is slow and error-prone. Pulling the entire address book is a privacy disaster waiting for a headline. The Contact Picker API lives in the sane middle: the user picks exactly which contacts to share, nothing more.

## Why Narrow Support Meets High Expectations

Support for this API is genuinely narrow, user expectations for "just let me pick a contact" are high regardless, and field normalization — phone formats, name structures — gets messy fast the moment real-world contact data shows up instead of a clean test fixture.

## The User Story, Stripped of Domain

A user can:

- choose specific contacts deliberately,
- share only the selected fields, not the whole contact record,
- complete an invite or share workflow faster than typing everything by hand.

## Core Browser Technologies

| API | Job | Reference |
|---|---|---|
| Contact Picker API | User-mediated selection of specific contacts and fields | [Chrome for Developers](https://developer.chrome.com/docs/capabilities/web-apis/contact-picker) |
| Structured field mapping and validation | Normalizes whatever the platform actually returns | [MDN - Constraint validation](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Constraint_validation), [libphonenumber-js](https://github.com/catamphetamine/libphonenumber-js) |
| Manual-entry fallback path | The universal path for everyone the picker doesn't reach | [MDN - `<form>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form), [MDN - `<input type="email">`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/email) |

## The Browser Reality Check

This is primarily Android Chrome territory. There is no universal desktop or iOS baseline for it at all.<sup>[1]</sup> The manual entry form isn't a fallback in the usual sense of "the lesser path for unsupported browsers" — for the majority of platforms, it's simply the only path that exists, and it needs to be built as a first-class experience rather than an apology screen.

## What Breaks First

- Assuming picker availability across all mobile devices, when it's realistically an Android Chrome feature.
- No normalization for locale-specific phone number formats, producing garbage data the moment a contact comes from outside the assumed region.
- Leaking full contact objects into logs — a contact picker result is personal data belonging to someone who never directly interacted with the app, and it deserves handling at least as careful as the primary user's own data.
- Poor fallback UX when the picker is unsupported, treating the majority-case path as an afterthought instead of the primary experience it actually is for most users.

## Minimal Technical Blueprint

```javascript
pickContactButton.addEventListener('click', async () => {
  if (!('contacts' in navigator && 'ContactsManager' in window)) {
    return showManualEntryForm(); // the actual primary path for most platforms
  }
  const contacts = await navigator.contacts.select(['name', 'email'], { multiple: true });
  const normalized = contacts.map(normalizeContactFields); // never trust raw platform output
  prefillInviteForm(normalized); // still editable before submit
});
```

1. Feature-detect capability and show an explicit "Pick contact" action only where it's genuinely available.
2. Request only the fields actually necessary for the workflow — name and email for an invite, not every field the API could theoretically return.
3. Normalize and validate whatever comes back from the picker; real contact data is messier than any test fixture.
4. Keep manual editing available before final submit, so a user can correct anything the picker got wrong or incomplete.
5. Never store the raw contact payload longer than the workflow actually needs it.

## Privacy

Least-privilege field requests, every time — ask for exactly what the workflow needs and nothing that seemed convenient to grab while the dialog was open. No background contact crawling under any circumstance. Give a clear disclosure of exactly which fields are used and why, since this data belongs to people who never chose to use the app themselves.

## Test Matrix You Actually Need

- Supported Android devices, tested directly rather than assumed from documentation alone.
- Unsupported browsers exercising the fallback flow as its own first-class test, not an afterthought.
- Multi-contact and single-contact selection cases.
- Malformed or partial data returned by the platform — contact data in the wild is messier than any API documentation implies.

## Decision Summary

Use the Contact Picker as an acceleration layer for the platforms where it exists.

Never as a mandatory dependency — the manual form is the actual product for most of the audience, and it needs to be built and tested with that reality in mind from the start.

---

[1]: Contact Picker API Android-only availability, [Chrome for Developers](https://developer.chrome.com/docs/capabilities/web-apis/contact-picker).
