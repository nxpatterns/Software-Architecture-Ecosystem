# Mailserver Troubleshooting

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=5 orderedList=false} -->

<!-- code_chunk_output -->

- [Viewing and Fixing Corrupted Postfix Postscreen Cache](#viewing-and-fixing-corrupted-postfix-postscreen-cache)
  - [Problem](#problem)
  - [Root Cause](#root-cause)
  - [Solution Steps](#solution-steps)
    - [Verify Correct Path](#verify-correct-path)
    - [View Corrupted Database Content](#view-corrupted-database-content)
    - [Backup and Delete](#backup-and-delete)
  - [Key Points](#key-points)

<!-- /code_chunk_output -->


## Viewing and Fixing Corrupted Postfix Postscreen Cache

### Problem
Attempting to view postscreen cache fails with database format error:

```
BDB0641 __db_meta_setup: unexpected file type or format
postmap: fatal: open database: Invalid argument
```

### Root Cause
The `.db` file is corrupted or has incompatible format.

### Solution Steps

#### Verify Correct Path
**Critical:** Check where Postfix actually stores the cache:

```bash
postconf data_directory
```

Common mistake: assuming the path instead of checking `data_directory` value.

#### View Corrupted Database Content
Since `postmap` and `postcat` won't work on corrupted files, use `strings`:

```bash
strings /path/to/postscreen_cache.db | head -50
```

This extracts readable text (IP addresses, timestamps) from the binary file.

#### Backup and Delete

```bash
# Backup first
cp /path/to/postscreen_cache.db /tmp/postscreen_cache.db.backup

# Delete corrupted file
rm /path/to/postscreen_cache.db

# Reload Postfix (recreates cache automatically)
postfix reload
```

### Key Points

- `postscreen_cache` is **not a whitelist** - it stores temporary client connection scoring data
- Default format: `btree`
- Postfix recreates the cache automatically when deleted
- Always verify `data_directory` path before troubleshooting
