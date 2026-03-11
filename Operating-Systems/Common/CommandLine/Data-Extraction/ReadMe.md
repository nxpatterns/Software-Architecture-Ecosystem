# Command-Line Data Extraction Reference

This document covers practical commands for extracting specific data from structured files using standard Unix/Linux tools.

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=5 orderedList=false} -->

<!-- code_chunk_output -->

- [Extracting Keys from .env Files](#extracting-keys-from-env-files)
  - [Basic Extraction](#basic-extraction)
  - [Filtering Out Comments and Empty Lines](#filtering-out-comments-and-empty-lines)
  - [Alternative with awk](#alternative-with-awk)
- [About the `cut` Command](#about-the-cut-command)
  - [Common Usage Patterns](#common-usage-patterns)
  - [Important Limitation](#important-limitation)
  - [Line Selection with cut](#line-selection-with-cut)
- [Extracting Keys from JSON Files](#extracting-keys-from-json-files)
  - [Installation](#installation)
  - [Top-Level Keys](#top-level-keys)
  - [Second-Level Keys](#second-level-keys)
  - [Finding Keys by Name (Recursive Search)](#finding-keys-by-name-recursive-search)
  - [Nested Data Extraction](#nested-data-extraction)
- [Advanced Patterns with awk](#advanced-patterns-with-awk)
- [Choosing the Right Tool](#choosing-the-right-tool)
- [Common Pitfalls](#common-pitfalls)
- [Quick Reference](#quick-reference)

<!-- /code_chunk_output -->


## Extracting Keys from .env Files

Environment files typically contain `key=value` pairs. To extract only the keys:

### Basic Extraction

```bash
cut -d'=' -f1 file.env
```

- `-d'='` sets the delimiter to `=`
- `-f1` selects field 1 (the key)

### Filtering Out Comments and Empty Lines

```bash
grep -v '^#' file.env | grep -v '^$' | cut -d'=' -f1
```

- `grep -v '^#'` removes lines starting with `#` (comments)
- `grep -v '^$'` removes empty lines
- Result is piped to `cut` for field extraction

### Alternative with awk

```bash
awk -F'=' '{print $1}' file.env
```

- `-F'='` sets field separator
- `{print $1}` prints first field

## About the `cut` Command

`cut` is a classic Unix utility from the early 1980s (AT&T Unix System V). It's part of GNU coreutils and specializes in extracting columns/fields from text.

### Common Usage Patterns

```bash
# Extract specific fields
cut -d':' -f1,3 /etc/passwd          # Fields 1 and 3

# Extract field ranges
cut -d',' -f2-4 file.csv             # Fields 2 through 4

# Extract character positions
cut -c1-10 file.txt                  # Characters 1 through 10
```

### Important Limitation

`cut` only supports **single-character delimiters**. For multi-character delimiters or complex patterns, use `awk` instead.

### Line Selection with cut

`cut` processes all input lines and cannot select specific lines by itself. Combine with `sed`, `head`, or `tail`:

```bash
# Extract from line 4 only
sed -n '4p' file.txt | cut -c5-10

# Or with head/tail
head -n4 file.txt | tail -n1 | cut -c5-10

# Line 4, field 2
sed -n '4p' file.txt | cut -d'=' -f2
```

## Extracting Keys from JSON Files

JSON key extraction requires `jq`, a lightweight JSON processor.

### Installation

```bash
sudo apt install jq
```

### Top-Level Keys

```bash
# As JSON array
jq 'keys' file.json

# One per line
jq 'keys[]' file.json

# Raw output (no quotes)
jq -r 'keys[]' file.json
```

### Second-Level Keys

```bash
# Keys from each top-level object
jq '.[] | keys' file.json

# All second-level keys (unique, combined)
jq '[.[] | keys] | flatten | unique' file.json

# With parent key prefix
jq -r 'to_entries[] | .key as $parent | .value | keys[] | "\($parent).\(.)"' file.json
```

**Example structure:**

```json
{
  "user": {"name": "x", "age": 1},
  "config": {"theme": "dark"}
}
```

Results:

- `.[] | keys` → `["name","age"]` and `["theme"]`
- `flatten | unique` → `["age","name","theme"]`
- With prefix → `user.name`, `user.age`, `config.theme`

### Finding Keys by Name (Recursive Search)

To find all keys of objects named "dashboard" anywhere in the JSON structure:

```bash
# Keys from objects containing "dashboard"
jq '.. | objects | select(has("dashboard")) | .dashboard | keys' file.json

# Raw output, one per line
jq -r '.. | objects | select(has("dashboard")) | .dashboard | keys[]' file.json

# All unique keys from all "dashboard" objects
jq '[.. | objects | select(has("dashboard")) | .dashboard | keys] | flatten | unique' file.json
```

**Breakdown:**

- `..` = recursive descent through entire JSON structure
- `objects` = filter to only object types (excludes arrays, primitives)
- `select(has("dashboard"))` = only objects containing a "dashboard" key
- `.dashboard | keys` = extract keys from the dashboard object

### Nested Data Extraction

For deeply nested structures, combine recursive search with path extraction:

```bash
# All paths to scalar values
jq 'paths(scalars) | join(".")' file.json

# All keys at any depth
jq '.. | objects | keys[]' file.json | sort -u
```

## Advanced Patterns with awk

For complex text processing where `cut` is insufficient:

```bash
# Specific line and substring
awk 'NR==4 {print substr($0, 5, 6)}' file.txt

# Specific line and field
awk -F'=' 'NR==4 {print $2}' file.txt

# Multi-character delimiter
awk -F'::' '{print $1}' file.txt
```

**Key awk variables:**

- `NR` = current line number
- `$0` = entire line
- `$1, $2, ...` = fields after splitting by delimiter

## Choosing the Right Tool

| Task | Tool | Reason |
|------|------|--------|
| Simple field extraction | `cut` | Fast, simple syntax |
| Multi-character delimiters | `awk` | More flexible |
| Line-specific operations | `sed` + `cut` or `awk` | Combined approach |
| JSON processing | `jq` | Purpose-built for JSON |
| Complex text patterns | `awk` | Full scripting capability |

## Common Pitfalls

1. **`cut` delimiter limitation**: Only single characters. Use `awk` for `::`, `=>`, etc.
2. **Field numbering**: `cut` uses 1-based indexing (first field is `-f1`)
3. **JSON quoting**: Use `-r` flag in `jq` for raw output without quotes
4. **Recursive search performance**: `jq '..'` can be slow on large files; use specific paths when possible

## Quick Reference

```bash
# .env keys
cut -d'=' -f1 file.env

# JSON top-level keys
jq 'keys[]' file.json

# JSON recursive key search
jq -r '.. | objects | select(has("TARGET_KEY")) | .TARGET_KEY | keys[]' file.json

# Specific line extraction
sed -n 'NUMBERp' file.txt | cut -d'DELIM' -fFIELD
```
