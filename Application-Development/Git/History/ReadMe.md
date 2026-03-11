# Git History Search Functions

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=5 orderedList=false} -->

<!-- code_chunk_output -->

- [Overview](#overview)
- [The Problem with Native Git Commands](#the-problem-with-native-git-commands)
- [Functions](#functions)
  - [Core Content Search](#core-content-search)
  - [File Path Search](#file-path-search)
  - [Change-Based Search (Fast Alternative)](#change-based-search-fast-alternative)
- [Performance Characteristics](#performance-characteristics)
- [Common Pitfalls](#common-pitfalls)
  - [1. Quoting Issues](#1-quoting-issues)
  - [2. Error Suppression](#2-error-suppression)
  - [3. Glob Patterns](#3-glob-patterns)
  - [4. Choosing the Right Tool](#4-choosing-the-right-tool)
- [Format String Reference](#format-string-reference)
- [Installation](#installation)
- [Examples](#examples)
- [Limitations](#limitations)
- [When to Use Native Commands Instead](#when-to-use-native-commands-instead)

<!-- /code_chunk_output -->

## Overview

Efficient shell functions for searching Git history. These solve the common problem of finding when content appeared, changed, or disappeared across your repository's entire history.

## The Problem with Native Git Commands

- `git log -S"text"` - Only shows commits where line count of "text" changed (misses unchanged content)
- `git log -G"regex"` - Only shows commits where pattern was added/removed/modified
- `git log -- file` - Only tracks file path changes, not content

**Use case gap**: Finding all commits where specific text *exists* in any file, regardless of whether it changed in that commit.

## Functions

### Core Content Search

```bash
# Find all commits containing specific text
git-find-all-sentences() {
    [[ -z "$1" ]] && { echo "Usage: git-find-all-sentences <text>"; return 1; }
    git log --all --format='%H' | while read rev; do
        if git grep -q "$1" "$rev" 2>/dev/null; then
            git log -1 --format='%ad %s %h %an' --date=short "$rev"
        fi
    done
}

# Find first commit containing text
git-find-first-sentence() {
    [[ -z "$1" ]] && { echo "Usage: git-find-first-sentence <text>"; return 1; }
    git log --all --reverse --format='%H' | while read rev; do
        if git grep -q "$1" "$rev" 2>/dev/null; then
            echo "$rev"
            break
        fi
    done
}

# Find most recent commit containing text
git-find-last-sentence() {
    [[ -z "$1" ]] && { echo "Usage: git-find-last-sentence <text>"; return 1; }
    git log --all --format='%H' | while read rev; do
        if git grep -q "$1" "$rev" 2>/dev/null; then
            echo "$rev"
            break
        fi
    done
}
```

### File Path Search

```bash
# Find first commit that introduced a file
git-find-file() {
    [[ -z "$1" ]] && { echo "Usage: git-find-file <filename>"; return 1; }
    git log --all --diff-filter=A --format='%H' -- "*$1*" | tail -1
}

# Find all commits touching a file or directory
git-find-changed() {
    [[ -z "$1" ]] && { echo "Usage: git-find-changed <path>"; return 1; }
    git log --all --oneline --date=short --format='%ad %s %h %an' -- "*$1*"
}
```

### Change-Based Search (Fast Alternative)

```bash
# Find commits that modified specific text (regex)
git-find-pattern() {
    [[ -z "$1" ]] && { echo "Usage: git-find-pattern <regex>"; return 1; }
    git log --all -G"$1" --format='%ad %s %h %an' --date=short
}

# Find commits that changed line count of text
git-find-sentence-changes() {
    [[ -z "$1" ]] && { echo "Usage: git-find-sentence-changes <text>"; return 1; }
    git log --all -S"$1" --format='%ad %s %h %an' --date=short
}
```

## Performance Characteristics

**Content search functions** (`git-find-*-sentence`):

- Iterate through every commit
- Run `git grep` on each
- Slow on large repos (10k+ commits)
- Accurate for "text exists in this commit" queries

**Change-based functions** (`-S`, `-G`):

- Native Git operations
- 100-1000x faster
- Only show commits where content changed
- Miss commits where text exists but wasn't modified

## Common Pitfalls

### 1. Quoting Issues

```bash
# Wrong - breaks on spaces/special chars
git grep -q $1

# Correct
git grep -q "$1"
```

### 2. Error Suppression

```bash
# Without 2>/dev/null, errors on empty trees flood output
git grep -q "$1" "$rev" 2>/dev/null
```

### 3. Glob Patterns

```bash
# Finds exact path only
git log -- file.txt

# Finds file anywhere in tree
git log -- "*file.txt*"
```

### 4. Choosing the Right Tool

**Use content search when:**

- Tracking documentation across history
- Finding all instances of deprecated code
- Auditing configuration values

**Use change-based search when:**

- Finding when code was added/removed
- Performance matters (large repos)
- You only care about modifications

## Format String Reference

```bash
%H  # Full commit hash
%h  # Short commit hash
%ad # Author date (respects --date flag)
%s  # Commit subject
%an # Author name
```

## Installation

Add to `~/.bashrc`, `~/.zshrc`, or a dedicated `~/.gitfunctions` file:

```bash
# In .bashrc/.zshrc
source ~/.gitfunctions
```

## Examples

```bash
# Find all commits with "TODO" in any file
git-find-all-sentences "TODO"

# Find when authentication.py was first added
git-find-file "authentication.py"

# Find commits that changed regex pattern
git-find-pattern "def.*connect"

# Find all commits touching src/api/ directory
git-find-changed "src/api"
```

## Limitations

- Content search scales poorly (O(commits × files))
- No support for binary file content
- Shallow clones will have incomplete results
- Detached HEAD states may cause issues (mitigated by `2>/dev/null`)

## When to Use Native Commands Instead

For simple cases, skip these functions:

```bash
# Recent file history
git log -p -- path/to/file

# Find string additions
git log -S"search term" --source --all

# Regex in recent commits
git log -G"pattern" --since="1 month ago"
```
