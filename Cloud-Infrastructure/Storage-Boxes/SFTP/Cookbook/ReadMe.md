# Storage Boxes Cookbook

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=5 orderedList=false} -->

<!-- code_chunk_output -->

- [Counting Files on SFTP-Only Storage](#counting-files-on-sftp-only-storage)
  - [Context](#context)
  - [The Problem](#the-problem)
  - [Solutions](#solutions)
    - [Method 1: Echo Piping (Simplest)](#method-1-echo-piping-simplest)
    - [Method 2: Heredoc (More Control)](#method-2-heredoc-more-control)
    - [Method 3: Grep Filtering (Most Accurate)](#method-3-grep-filtering-most-accurate)
    - [Method 4: lftp Alternative (If Available)](#method-4-lftp-alternative-if-available)
  - [Practical Recommendations](#practical-recommendations)
  - [Common Pitfalls](#common-pitfalls)
  - [Why Not SSH?](#why-not-ssh)
  - [Testing Your Setup](#testing-your-setup)

<!-- /code_chunk_output -->


## Counting Files on SFTP-Only Storage

### Context

Some storage providers (like Hetzner Storage Boxes) provide SFTP access without SSH shell access. This limitation means you can't run shell commands directly on the remote server. When you need to count files in a directory, you must work around this constraint.

**Why this matters:** Without shell access, common commands like `ls | wc -l` won't work on the remote system. You need to retrieve the directory listing to your local machine and count there.

### The Problem

When connected via SFTP (`sftp>` prompt), you can list files but cannot execute shell commands on the remote server. The SFTP protocol itself has no built-in counting mechanism.

### Solutions

#### Method 1: Echo Piping (Simplest)

**What it does:** Sends a single SFTP command via stdin, captures output, and counts lines locally.

```bash
echo "ls /path/to/directory" | sftp user@host | wc -l
```

**Why this works:**

- `echo` feeds the `ls` command to SFTP
- SFTP executes it and outputs to stdout
- `wc -l` counts lines in the output

**Trade-offs:**

- Counts all output lines (including SFTP banner and prompts)
- Good enough for quick checks
- May overcount by 2-4 lines depending on SFTP client verbosity

#### Method 2: Heredoc (More Control)

**What it does:** Uses heredoc syntax to send multiple commands in sequence.

```bash
sftp user@host <<EOF
ls /path/to/directory
EOF | wc -l
```

**Why this works:**

- Allows multiple SFTP commands in one session
- Cleaner for scripts
- Same output handling as Method 1

**Trade-offs:**

- Still includes SFTP banner/prompts in count
- More typing for single commands

#### Method 3: Grep Filtering (Most Accurate)

**What it does:** Filters SFTP output to count only actual file entries.

```bash
echo "ls -la /path/to/directory" | sftp user@host | grep -E "^[d-]" | wc -l
```

**Why this works:**

- `ls -la` provides detailed listings starting with permissions
- `grep -E "^[d-]"` matches lines starting with `-` (file) or `d` (directory)
- Excludes SFTP prompts and banner text

**Trade-offs:**

- More accurate file count
- Requires understanding of `ls -la` output format
- May still include `.` and `..` entries (add `grep -v "^\.$"` to exclude)

#### Method 4: lftp Alternative (If Available)

**What it does:** Uses `lftp`, a more feature-rich FTP/SFTP client.

```bash
lftp sftp://user@host -e "cls /path; exit" | wc -l
```

**Why this works:**

- `lftp` has cleaner output formatting
- `cls` command specifically lists contents
- `-e` executes and exits

**Trade-offs:**

- Requires `lftp` installed
- Different syntax to learn
- Generally cleaner output than standard SFTP

### Practical Recommendations

**For quick checks:**

```bash
echo "ls /directory" | sftp user@host | wc -l
```

Subtract 2-4 from the result mentally.

**For accurate counts:**

```bash
echo "ls -la /directory" | sftp user@host | grep -E "^[d-]" | grep -v "^\.\." | wc -l
```

**For scripts:**
Store the count in a variable and log it:

```bash
COUNT=$(echo "ls -la /directory" | sftp user@host | grep -E "^[d-]" | wc -l)
echo "Found $COUNT files"
```

### Common Pitfalls

**Heredoc syntax errors:** If your terminal shows `heredoc>` prompt, you forgot to close with `EOF`. Type `EOF` and press Enter, then start over.

**Banner inflation:** SFTP clients add connection messages. Always test your command once to see how many extra lines you get, then adjust expectations.

**Hidden files:** Standard `ls` may not show hidden files. Use `ls -la` to see all entries including `.` and `..`.

### Why Not SSH?

Storage-only services deliberately restrict SSH shell access for security and resource management. They provide SFTP for file operations only. This is intentional design, not a limitation you can work around.

### Testing Your Setup

Run this to verify your counting method:

```bash
# Create test directory with known file count
# Then run your count command
# Compare expected vs actual count
# Adjust filtering as needed
```

The key insight: **bring the data to your shell, don't try to execute on the remote server.**
