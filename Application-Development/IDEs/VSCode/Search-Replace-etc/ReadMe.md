# VSCode Search, Replace,...

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=5 orderedList=false} -->

<!-- code_chunk_output -->

- [Example: Adding Comment Prefix to Uncommented Lines](#example-adding-comment-prefix-to-uncommented-lines)
  - [Problem Context](#problem-context)
  - [Solution: Regex Find/Replace in VSCode](#solution-regex-findreplace-in-vscode)
    - [Pattern](#pattern)
    - [How It Works](#how-it-works)
    - [Generalized Pattern](#generalized-pattern)
    - [Usage Steps](#usage-steps)
    - [Critical Considerations](#critical-considerations)
    - [When This Approach Fails](#when-this-approach-fails)
- [Finding Unescaped Single Quotes in SQL String Literals](#finding-unescaped-single-quotes-in-sql-string-literals)
  - [Problem](#problem)
  - [VSCode Regex Pattern](#vscode-regex-pattern)
  - [How It Works](#how-it-works-1)
  - [Matches](#matches)
  - [Doesn't Match](#doesnt-match)
  - [Common Pitfalls](#common-pitfalls)
  - [Replacement](#replacement)

<!-- /code_chunk_output -->

## Example: Adding Comment Prefix to Uncommented Lines

### Problem Context

Auto-generated SQL files may contain malformed comment blocks where the first line is properly commented but subsequent lines are not:

```sql
-- Company: Ristorante La Ruffa St.Magdalena
ALA Gastro und Handels GmbH  -- MISSING COMMENT PREFIX
DO $$
```

The second line should be:

```sql
-- ALA Gastro und Handels GmbH
```

### Solution: Regex Find/Replace in VSCode

#### Pattern

**Find:**

```regex
(-- Company:.*\n)(?!--|DO )(.*\n)
```

**Replace:**

```
$1-- $2
```

#### How It Works

1. `(-- Company:.*\n)` - **Capture Group 1**: Matches and captures the entire comment line starting with `-- Company:` through the newline
2. `(?!--|DO )` - **Negative Lookahead**: Ensures the next line does NOT start with `--` (already commented) or `DO` (code block start)
3. `(.*\n)` - **Capture Group 2**: Captures the uncommented line that needs the prefix

The replacement `$1-- $2` keeps the original comment line `($1)` and adds `--` before the captured uncommented line `($2)`.

#### Generalized Pattern

For situations where the comment prefix varies:

**Find:**

```regex
(--.*\n)(?!--|KEYWORD )(.*\n)
```

Replace `KEYWORD` with whatever marks the start of the code block (e.g., `DO`, `BEGIN`, `CREATE`).

#### Usage Steps

1. Open Find/Replace in VSCode: `Ctrl+H` (Windows/Linux) or `Cmd+Option+F` (Mac)
2. Enable regex mode: Click the `.*` button or press `Alt+R`
3. Paste the find pattern
4. Paste the replace pattern
5. **Test on a small section first** - Use "Replace" (not "Replace All") on 2-3 instances
6. Verify the results
7. Use "Replace All" only after confirming correctness

#### Critical Considerations

**Test before mass replacement**: With 300K+ lines, a wrong regex can corrupt the entire file. Always:

- Make a backup
- Test on the first 10-20 occurrences
- Use version control (git) so you can revert

**Pattern specificity**: The pattern above assumes:

- Comment lines start with `-- Company:`
- Only one uncommented line follows
- Code blocks start with `DO`

Adjust the regex if your actual pattern differs.

**Multiple consecutive uncommented lines**: If there are multiple uncommented lines after the comment, this pattern only fixes the first one. Run it multiple times or modify the pattern to capture multiple lines.

#### When This Approach Fails

Use a script (Python, etc.) instead if:

- Logic is more complex (e.g., context-dependent fixes)
- You need to validate/transform content, not just add prefixes
- The pattern varies too much for a single regex

Regex shines for mechanical, pattern-based transformations. Complex logic requires code.

## Finding Unescaped Single Quotes in SQL String Literals

### Problem

SQL string literals use single quotes as delimiters (`'text'`). When a single quote appears inside the string, it must be escaped by doubling it (`'can''t'`).

Unescaped quotes cause syntax errors:

- ✗ `'Bäck's'` - breaks SQL
- ✓ `'Bäck''s'` - valid SQL

**Goal:** Find strings with unescaped single quotes for bulk fixing.

### VSCode Regex Pattern

```regex
'(?:[^']|'')*(?<!')'(?!')(?:[^']|'')*'
```

**Usage:**

1. Open Find & Replace (Ctrl+H / Cmd+H)
2. Enable regex mode (.*)
3. Paste pattern above

### How It Works

```plaintext
'                    Start delimiter
(?:[^']|'')*         Zero or more: (non-quote char) OR (escaped '')
(?<!')'(?!')         Single quote that's NOT part of ''
(?:[^']|'')*         Zero or more: (non-quote char) OR (escaped '')
'                    End delimiter
```

**Key insight:** `(?:[^']|'')*` allows any character except quotes, but permits escaped `''` sequences.

**Lookarounds:** `(?<!')'(?!')` ensures the middle quote isn't part of an escaped pair.

### Matches

- `'Bäck's'` - unescaped quote
- `'D'r Rechenmacher, Familie Schoch'` - unescaped quote (comma inside is fine)
- `'can't handle'` - unescaped quote

### Doesn't Match

- `'Faily''s Shisha Lounge'` - already escaped
- `'normal string'` - no embedded quotes
- `'Person', NULL, 'Office'` - separate strings (comma-delimited)

### Common Pitfalls

**Mistake 1:** Using `'[^']*'[^']*'`

- Breaks across comma boundaries
- Matches `'text', NULL, 'other'` incorrectly

**Mistake 2:** Using `'[^',]*'[^',]*'`

- Excludes commas from strings
- Misses `'D'r Text, More'` cases

**Mistake 3:** Forgetting lookarounds

- Matches already-escaped `''` sequences
- Creates false positives

### Replacement

Once found, replace `'` with `''` inside the string:

1. Manual review recommended (automated replacement is tricky)
2. Or use parameterized queries to avoid escaping altogether

The pattern assumes standard SQL escaping (`''`). Some systems use backslash escaping (`\'`) - adjust accordingly.
