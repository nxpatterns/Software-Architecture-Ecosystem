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
