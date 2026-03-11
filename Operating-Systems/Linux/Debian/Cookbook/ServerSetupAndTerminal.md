# Debian Server Setup & Terminal Configuration

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=5 orderedList=false} -->

<!-- code_chunk_output -->

- [Bash Prompt Customization](#bash-prompt-customization)
  - [Color-Coding Root User in PS1](#color-coding-root-user-in-ps1)
- [Security Updates on Debian 12](#security-updates-on-debian-12)
  - [Checking for Available Updates](#checking-for-available-updates)
  - [Installing Updates](#installing-updates)
  - [Automatic Security Updates](#automatic-security-updates)
  - [Best Practices](#best-practices)
- [Realtek Network Firmware Issues](#realtek-network-firmware-issues)
  - [Understanding the Warnings](#understanding-the-warnings)
  - [When to Take Action](#when-to-take-action)
  - [Installing Realtek Firmware](#installing-realtek-firmware)
  - [Why Warnings Persist](#why-warnings-persist)
- [Terminal Background Color Management](#terminal-background-color-management)
  - [Setting Custom Background on SSH](#setting-custom-background-on-ssh)
  - [Resetting Background on Exit](#resetting-background-on-exit)
- [OSC 52 Clipboard Integration](#osc-52-clipboard-integration)
  - [Remote Clipboard Copy](#remote-clipboard-copy)
- [Notes](#notes)
  - [Terminal Escape Sequences Reference](#terminal-escape-sequences-reference)
  - [Security Considerations](#security-considerations)
  - [Troubleshooting](#troubleshooting)

<!-- /code_chunk_output -->

## Bash Prompt Customization

### Color-Coding Root User in PS1

When running as root, it's helpful to have a visual indicator. This configuration makes the username red for root and green for normal users.

**Location:** `~/.bashrc`

```bash
if [ "$color_prompt" = yes ]; then
    if [ "$EUID" -eq 0 ]; then
        # root user - red color
        PS1='${debian_chroot:+($debian_chroot)}\[\033[01;31m\]\u@\h\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$ '
    else
        # normal user - green color
        PS1='${debian_chroot:+($debian_chroot)}\[\033[01;32m\]\u@\h\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$ '
    fi
else
    PS1='${debian_chroot:+($debian_chroot)}\u@\h:\w\$ '
fi
```

**Color codes:**

- `\033[01;31m` = bright red (root)
- `\033[01;32m` = bright green (normal user)
- `\033[01;34m` = bright blue (directory path)
- `\033[00m` = reset formatting

**How it works:**

- `$EUID -eq 0` checks if effective user ID is 0 (root)
- Different color schemes apply based on user privilege level

## Security Updates on Debian 12

### Checking for Available Updates

```bash
# Update package index
apt update

# List all upgradable packages
apt list --upgradable

# Filter for security updates only
apt list --upgradable | grep -i security

# Dry-run to see what would be upgraded
apt-get upgrade --dry-run | grep -i security
```

### Installing Updates

```bash
# Simulate upgrade first (recommended)
apt upgrade -s

# Install all available updates
apt upgrade

# Install only security updates automatically
apt install unattended-upgrades
unattended-upgrades --dry-run --debug
unattended-upgrades
```

### Automatic Security Updates

```bash
# Enable automatic security updates
dpkg-reconfigure -plow unattended-upgrades
```

This configures the system to automatically install security patches.

### Best Practices

- Run `apt update` daily to refresh package index
- Run `apt upgrade` weekly for production systems
- Check `/var/log/apt/history.log` to review changes

## Realtek Network Firmware Issues

### Understanding the Warnings

During `update-initramfs`, you may see warnings like:

```
W: Possible missing firmware /lib/firmware/rtl_nic/rtl8125b-2.fw for module r8169
```

These warnings appear because the kernel module tries to load firmware for all possible hardware variants, even if your system doesn't have that specific hardware.

### When to Take Action

**Check if the warnings matter:**

```bash
# Identify your actual network hardware
lspci | grep -i ethernet

# Check kernel messages for firmware loading
dmesg | grep r8169
```

**Indicators you need to fix it:**

- Error messages like `failed to load rtl_nic/rtl8125b-2.fw (-2)`
- Your hardware model matches the missing firmware (e.g., RTL8125B needs rtl8125b-2.fw)
- Network performance issues or instability

**Indicators you can ignore it:**

- Network works fine
- Your hardware model doesn't match the warned firmware files
- No error messages in `dmesg`

### Installing Realtek Firmware

**Prerequisites:** Ensure non-free repositories are enabled in `/etc/apt/sources.list`:

```
deb http://deb.debian.org/debian bookworm main contrib non-free non-free-firmware
deb http://security.debian.org/debian-security bookworm-security main contrib non-free non-free-firmware
```

**Installation:**

```bash
# Update package index
apt update

# Install Realtek firmware package
apt install firmware-realtek

# Rebuild initramfs to include firmware
update-initramfs -u -k all

# Reboot to load firmware
reboot
```

**Verification after reboot:**

```bash
# Check if firmware loaded successfully
dmesg | grep r8169

# Should show: "firmware: direct-loading firmware rtl_nic/rtl8125b-2.fw"
# Instead of: "failed to load" or "Direct firmware load ... failed"
```

**List installed firmware files:**

```bash
dpkg -L firmware-realtek | grep rtl8125
```

### Why Warnings Persist

Even with firmware installed, you may see warnings during `update-initramfs` for firmware files your system doesn't need. The initramfs build process checks for all possible firmware variants for the r8169 module. This is normal and harmless if:

1. The firmware for your actual hardware is present
2. Network functions correctly
3. No errors appear in `dmesg` after boot

## Terminal Background Color Management

### Setting Custom Background on SSH

To set a custom terminal background color when connecting via SSH, add this to `~/.bashrc`:

```bash
if [ -n "$SSH_CLIENT" ] || [ -n "$SSH_TTY" ]; then
    # Set custom background color
    printf '\033]11;#1A0C1B\007'

    # Optional: Adjust prompt colors for dark background
    PS1='${debian_chroot:+($debian_chroot)}\[\033[01;92m\]\u@\h\[\033[00m\]:\[\033[01;94m\]\w\[\033[00m\]\$ '
fi
```

**Color format:** `#RRGGBB` in hexadecimal

- Example: `#282C33` = dark blue-gray
- Example: `#1A0C1B` = dark purple

### Resetting Background on Exit

To restore the terminal's default background when closing the SSH session:

```bash
if [ -n "$SSH_CLIENT" ] || [ -n "$SSH_TTY" ]; then
    printf '\033]11;#1A0C1B\007'
    PS1='${debian_chroot:+($debian_chroot)}\[\033[01;92m\]\u@\h\[\033[00m\]:\[\033[01;94m\]\w\[\033[00m\]\$ '

    # Reset background color on exit
    trap 'printf "\033]111\007"' EXIT
fi
```

**How it works:**

- `\033]11;#RRGGBB\007` = OSC 11 (set background color)
- `\033]111\007` = OSC 111 (reset background to default)
- `trap '...' EXIT` = execute command when shell exits

**Compatibility:** Works with terminals supporting OSC escape sequences (xterm, Ghostty, iTerm2, etc.)

## OSC 52 Clipboard Integration

### Remote Clipboard Copy

The `pbcopy` function enables copying text to your local clipboard from a remote SSH session:

```bash
pbcopy() {
    printf "\033]52;c;%s\a" "$(base64 -w0)"
}
```

**Usage:**

```bash
# Copy text from echo
echo "hello world" | pbcopy

# Copy file contents
cat file.txt | pbcopy

# Copy command output
ls -la | pbcopy
```

**How it works:**

- `\033]52` = OSC 52 (clipboard operation)
- `c` = clipboard target (system clipboard)
- Data is base64-encoded for safe transmission
- `\a` = bell character (terminates sequence)

**Requirements:**

- Terminal must support OSC 52 (Ghostty, iTerm2, tmux 3.2+, modern terminals)
- Replaces tools like `xclip` or `xsel` for remote servers
- Works over SSH without X11 forwarding or additional setup

**Why base64?**
Base64 encoding ensures binary-safe transmission through the terminal protocol, avoiding issues with special characters or control sequences in the copied data.

## Notes

### Terminal Escape Sequences Reference

- `\033` or `\e` = ESC character
- `\007` or `\a` = BEL (bell) character
- OSC (Operating System Command) sequences: `ESC ] ... BEL`
- Common OSC codes:
  - `11` = Set background color
  - `52` = Clipboard operations
  - `111` = Reset background color

### Security Considerations

**Background color changes:** Harmless, purely visual. No security implications.

**OSC 52 clipboard:**

- Allows remote server to write to local clipboard
- Some terminals disable this by default or require confirmation
- Only transmits what you explicitly pipe to `pbcopy`
- Does not grant remote server read access to your clipboard

### Troubleshooting

**Prompt colors don't appear:**

- Check if `color_prompt=yes` is set
- Verify terminal supports colors: `echo $TERM`
- Try: `export TERM=xterm-256color`

**Background color persists after disconnect:**

- Add `trap 'printf "\033]111\007"' EXIT` to reset
- Some terminals (like Ghostty with shell-integration) auto-reset

**Firmware warnings after installing firmware:**

- Normal if warnings are for hardware you don't have
- Only concerning if your actual hardware shows "failed to load" in `dmesg`

**OSC 52 not working:**

- Check terminal documentation for OSC 52 support
- May need to enable in terminal settings
- tmux requires version 3.2+ with `set -s set-clipboard on`
