# Use Case 51: Contact Picker for Consentful Address Book Input

Typing names and emails manually is slow and error-prone.
Pulling the entire address book is a privacy disaster.
Contact Picker lives in the sane middle.

## Why this is hard

Support is narrow.
User expectations are high.
And field normalization gets messy very quickly.

## User Story (Abstracted)

A user can:

- choose specific contacts,
- share only selected fields,
- complete invite/share workflows faster.

## Core Browser Technologies

- Contact Picker API.
- Structured field mapping and validation.
- Manual-entry fallback path.

## Browser Reality Check

- Primarily Android Chrome territory.
- No universal desktop/iOS baseline.
- Must keep manual form as first-class experience.

## What breaks first

- assuming picker availability on all mobile devices
- no normalization for locale-specific phone formats
- leaking full contact objects into logs
- poor fallback UX when picker is unsupported

## Minimal Blueprint

1. Capability check and explicit "Pick contact" action.
2. Request only necessary fields.
3. Normalize and validate selected data.
4. Keep manual edit before submit.
5. Never store raw contact payload longer than needed.

## Privacy Notes

- least-privilege field requests
- no background contact crawling
- clear disclosure of which fields are used and why

## Test Matrix

- supported Android devices
- unsupported browsers with fallback flow
- multi-contact and single-contact cases
- malformed/partial data returned by platform

## Decision Summary

Use Contact Picker as acceleration layer.
Not as mandatory dependency.
