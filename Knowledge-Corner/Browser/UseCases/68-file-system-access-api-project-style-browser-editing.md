# Use Case 68: File System Access API for Project-Style Browser Editing

Picking one file is not the same as managing a project folder.
File System Access enables browser apps to behave like real local editors.

## Why this is hard

Permissions are persistent and stateful.
Handle validity changes over time.
And unsupported browsers require a different UX contract.

## User Story (Abstracted)

A user can:

- open files/folders directly,
- edit in place,
- and save changes without repetitive download-upload loops.

## Core Browser Technologies

- `showOpenFilePicker` / `showDirectoryPicker`.
- File and directory handles with permission lifecycle.
- Fallback storage/import-export flows.

## What breaks first

- assuming handles stay valid forever
- no strategy for denied/revoked permissions
- no fallback for non-supporting browsers

## Minimal Blueprint

1. Feature-detect and branch UX early.
2. Keep permission state and save state explicit in UI.
3. Validate handle access before each critical write.
4. Keep portable import/export fallback path.

## Decision Summary

Use this for serious local-authoring workflows.
Do not make baseline correctness depend on it.
