# SSH Terminal Setup Guide

## Problem Context

When working with remote servers via SSH, two common workflow issues arise:

1. **Clipboard Isolation**: Content copied on the remote server (e.g., `cat file | pbcopy`) doesn't reach your local clipboard
2. **Visual Confusion**: Multiple terminal windows look identical, making it hard to distinguish local vs. remote sessions

This guide solves both problems using modern terminal capabilities.

## Solution Overview

- **OSC 52 escape sequences** for remote-to-local clipboard integration
- **OSC 11 escape sequences** for automatic background color changes on SSH sessions
- **Ghostty terminal emulator** for reliable OSC support (macOS Terminal.app has limited support)

## Prerequisites

- macOS (tested on 15.6+)
- SSH access to remote Linux server (tested on Debian 12)
- Basic familiarity with shell configuration files

## Part 1: Remote Clipboard Access (OSC 52)

### Why This Works

OSC 52 is a terminal escape sequence that allows remote applications to write to your local clipboard. The remote server sends encoded data through the SSH connection, and your local terminal intercepts it and places it in the system clipboard.

### Installation

**1. Install Ghostty terminal emulator:**

```bash
brew install --cask ghostty
```

**Why Ghostty?** macOS Terminal.app has incomplete OSC 52 support. Ghostty handles OSC sequences reliably without additional configuration.

**2. Add to remote server's `~/.bashrc`:**

```bash
# OSC 52 clipboard integration
pbcopy() {
    printf "\033]52;c;%s\a" "$(base64 -w0)"
}
```

**3. Reload the configuration:**

```bash
source ~/.bashrc
```

### Usage

On the remote server:

```bash
cat some-file | pbcopy
echo "test" | pbcopy
```

The content is now available in your local macOS clipboard (⌘+V).

### Technical Details

- `\033]52;c;` initiates OSC 52 clipboard write
- `base64 -w0` encodes content (OSC 52 requires base64)
- `\a` terminates the sequence
- The terminal emulator decodes and writes to system clipboard

## Part 2: Visual SSH Session Indicators

### Why This Matters

When managing multiple terminal windows, it's easy to accidentally run commands on the wrong server. Visual differentiation reduces this risk.

### Implementation

**1. Fix TERM compatibility issue:**

Ghostty uses `xterm-ghostty` as its TERM type, which many servers don't recognize. This causes `clear` and other ncurses commands to fail.

Add to local `~/.ssh/config`:

```bash
Host *
    SetEnv TERM=xterm-256color
```

**Why?** This forces SSH to use the widely-supported `xterm-256color` instead of `xterm-ghostty`.

**2. Auto-detect SSH sessions on remote server:**

Add to remote server's `~/.bashrc`:

```bash
# Change terminal background for SSH sessions
if [ -n "$SSH_CLIENT" ] || [ -n "$SSH_TTY" ]; then
    printf '\033]11;#1a1a1a\007'  # Dark background
    # Adjust prompt colors for visibility on dark background
    PS1='${debian_chroot:+($debian_chroot)}\[\033[01;92m\]\u@\h\[\033[00m\]:\[\033[01;94m\]\w\[\033[00m\]\$ '
fi
```

**3. Reset background on logout:**

Create `~/.bash_logout` on remote server:

```bash
# Reset terminal background on logout
printf '\033]111\007'
```

### How It Works

- `SSH_CLIENT` and `SSH_TTY` environment variables are set automatically when connected via SSH
- OSC 11 (`\033]11;#rrggbb\007`) sets terminal background color
- OSC 111 (`\033]111\007`) resets to terminal default
- Brighter prompt colors (92=bright green, 94=bright blue) maintain readability on dark backgrounds

## Troubleshooting

### OSC 52 not working

- **Check terminal**: Verify you're using Ghostty, not Terminal.app
- **Test manually**: `printf "\033]52;c;$(echo test | base64 -w0)\a"` then ⌘+V
- **SSH multiplexing**: OSC 52 may not work through tmux/screen without additional configuration

### TERM errors on remote server

- **Symptom**: `'xterm-ghostty': unknown terminal type`
- **Solution**: Add `SetEnv TERM=xterm-256color` to SSH config (see Part 2, step 1)

### Background color doesn't reset on logout

- **Check file location**: `~/.bash_logout` must be on the **remote server**, not local machine
- **Test manually**: `printf '\033]111\007'` should reset immediately
- **Shell type**: Only works with bash login shells; won't trigger in non-interactive/non-login sessions

### Background color changes but prompt disappears

- **Cause**: Prompt color codes might be invisible on dark background
- **Solution**: Use brighter colors (01;92m, 01;94m) as shown in the configuration above

## Key Learnings

1. **Terminal.app limitations**: macOS Terminal.app has incomplete OSC 52 support. Use a modern terminal emulator like Ghostty or iTerm2.

2. **Avoid SSH RemoteCommand**: Setting background via `RemoteCommand` in SSH config overwrites the normal login process and breaks prompt rendering. Server-side detection is more reliable.

3. **SetEnv reliability**: While `SetEnv` in SSH config works for TERM, it's less reliable for custom variables. Detecting `SSH_CLIENT`/`SSH_TTY` is more portable.

4. **OSC 111 vs hardcoded colors**: Using OSC 111 to reset background ensures compatibility regardless of your local terminal's default color scheme.

## Reference

### OSC Escape Sequences Used

- `OSC 52`: Clipboard operations (write to system clipboard)
- `OSC 11`: Set background color
- `OSC 111`: Reset background color to default

### Files Modified
**Local machine:**

- `~/.ssh/config` - TERM override for compatibility

**Remote server:**

- `~/.bashrc` - pbcopy function, SSH detection, background color
- `~/.bash_logout` - Reset background on logout

## Further Reading

- [ANSI escape codes](https://en.wikipedia.org/wiki/ANSI_escape_code)
- [OSC 52 specification](https://invisible-island.net/xterm/ctlseqs/ctlseqs.html)
- [Ghostty terminal](https://ghostty.org/)
