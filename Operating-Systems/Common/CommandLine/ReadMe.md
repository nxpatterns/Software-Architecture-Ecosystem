# CommandLine

See also in [CommandLineOneLiner](../MacOS/CommandLineOneLiner/ReadMe.md) for MacOS-specific one-liners.

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=5 orderedList=false} -->

<!-- code_chunk_output -->

- [SSH](#ssh)
  - [Onetime Remote Queries](#onetime-remote-queries)
  - [Repeated Queries](#repeated-queries)
- [Server Info](#server-info)
- [Disk Space](#disk-space)
- [Environment Variables](#environment-variables)
- [Finding .env Files](#finding-env-files)
- [Directory Listing Without Trailing Slashes](#directory-listing-without-trailing-slashes)
  - [Problem](#problem)
  - [Solution: Pure Shell Loop](#solution-pure-shell-loop)
  - [Alternative: Find Command](#alternative-find-command)
- [Listing Hidden Files and Directories](#listing-hidden-files-and-directories)
  - [Hidden Files Only](#hidden-files-only)
  - [Hidden Directories Only](#hidden-directories-only)
- [Portable Shell Functions](#portable-shell-functions)
  - [Create Reusable Functions](#create-reusable-functions)
- [Making Functions Available System-Wide (Debian/Ubuntu)](#making-functions-available-system-wide-debianubuntu)
  - [Method 1: Using /etc/profile.d/ (Recommended)](#method-1-using-etcprofiled-recommended)
  - [Method 2: Also Support Non-Login Shells](#method-2-also-support-non-login-shells)
  - [Method 3: Direct Addition to /etc/bash.bashrc](#method-3-direct-addition-to-etcbashbashrc)
- [Portability Notes](#portability-notes)
  - [Tool Availability](#tool-availability)
  - [Best Practices](#best-practices)
- [Parameter Expansion Reference](#parameter-expansion-reference)

<!-- /code_chunk_output -->

## SSH

### Onetime Remote Queries

```bash
ssh user@host 'ls -la /path/to/directory'

# Multiple commands
ssh user@host 'cd /path && ls -la && du -sh *'

# Piping output locally
ssh user@host 'ls -la /path' | grep pattern
```

### Repeated Queries

Consider:

- SSH config with `ControlMaster` for connection reuse
- `rsync --list-only` for directory listings

## Server Info

Get a one-line summary of the server's specs:

```bash
echo "OS: $(lsb_release -d | cut -f2), CPU: $(nproc) vCPU, RAM: $(free -h | awk '/^Mem:/{print $2}'), Disk: $(df -h / | awk 'NR==2{print $2}')"
```

Or piece by piece:

```bash
hostnamectl | grep "Operating System"   # OS
nproc                                   # CPU cores
free -h                                 # RAM
df -h /                                 # Disk (root partition)
```

## Disk Space

Check disk usage across all mounted filesystems:

```bash
df -h
```

Check how much space a specific directory uses:

```bash
du -sh /path/to/directory
```

## Environment Variables

List all currently active environment variables:

```bash
env
```

Filter by prefix or keyword:

```bash
env | grep SOME_PREFIX
```

Print a specific variable:

```bash
echo $MY_VAR
```

## Finding .env Files

If you stored `.env` files somewhere on the server and need to locate them:

```bash
find / -name ".env" 2>/dev/null
```

Narrow the search to likely locations:

```bash
find /home -name ".env" 2>/dev/null
find /var/www -name ".env" 2>/dev/null
```

> `2>/dev/null` suppresses permission-denied errors that would otherwise clutter the output.

## Directory Listing Without Trailing Slashes

### Problem
The glob pattern `*/` matches directories but includes a trailing slash in output. Common solutions like `ls -ald */ | awk '{print $9}' | sed 's:\/$::'` are verbose and hard to remember.

### Solution: Pure Shell Loop

```bash
for d in */; do echo "${d%/}"; done
```

**Advantages:**

- Pure POSIX shell (no external dependencies)
- Works everywhere a shell runs
- Simple to remember
- `${d%/}` removes suffix from right

### Alternative: Find Command

```bash
find . -maxdepth 1 -type d ! -name .
```

**Note:** `find -printf '%f\n'` is GNU-specific and won't work on macOS/BSD systems.

## Listing Hidden Files and Directories

### Hidden Files Only

```bash
find . -maxdepth 1 -type f -name '.*'
```

**Shell loop alternative:**

```bash
for f in .[^.]*; do [ -f "$f" ] && echo "$f"; done
```

### Hidden Directories Only

```bash
find . -maxdepth 1 -type d -name '.*' ! -name .
```

**Shell loop alternative:**

```bash
for d in .[^.]*/; do [ -d "$d" ] && echo "${d%/}"; done
```

**Pattern explanation:**

- `.[^.]*` matches files/directories starting with `.` but prevents matching `.` and `..`
- The `[^.]` negates the second character being a dot

## Portable Shell Functions

### Create Reusable Functions

```bash
# List directories only (remove trailing slash)
lsd() { for d in */; do echo "${d%/}"; done; }

# List hidden files only
lsf() { find . -maxdepth 1 -type f -name '.*'; }

# List hidden directories only
lsd_hidden() { find . -maxdepth 1 -type d -name '.*' ! -name .; }
```

## Making Functions Available System-Wide (Debian/Ubuntu)

### Method 1: Using /etc/profile.d/ (Recommended)

1. Create a new file:

```bash
sudo nano /etc/profile.d/custom-functions.sh
```

2. Add your functions to the file

3. Set appropriate permissions:

```bash
sudo chmod 644 /etc/profile.d/custom-functions.sh
```

**Limitation:** Only loaded in login shells (SSH sessions, `su -`)

### Method 2: Also Support Non-Login Shells

Edit `/etc/bash.bashrc`:

```bash
sudo nano /etc/bash.bashrc
```

Add at the end:

```bash
# Source custom functions
if [ -f /etc/profile.d/custom-functions.sh ]; then
    . /etc/profile.d/custom-functions.sh
fi
```

**Result:** Functions available in both login and non-login shells (new terminal tabs, `su` without `-`)

### Method 3: Direct Addition to /etc/bash.bashrc

Simply add functions directly to `/etc/bash.bashrc`:

```bash
sudo nano /etc/bash.bashrc
```

Add functions at the end of the file.

**Advantage:** Immediate availability in all new bash sessions

## Portability Notes

### Tool Availability

- `cut`: POSIX standard but may be missing in minimal containers (Alpine, busybox)
- `find`: Nearly universal, but `-printf` is GNU-specific
- Shell parameter expansion (`${var%pattern}`): POSIX, works everywhere
- Shell loops: Most portable solution

### Best Practices

- Prefer shell built-ins over external tools for maximum portability
- Use `find` for complex filtering, shell loops for simple cases
- Test GNU-specific options (`-printf`, `-maxdepth`) on target systems
- Shell parameter expansion is always safe

## Parameter Expansion Reference

```bash
${var%pattern}   # Remove shortest match from end
${var%%pattern}  # Remove longest match from end
${var#pattern}   # Remove shortest match from beginning
${var##pattern}  # Remove longest match from beginning
```

Examples:

```bash
file="example.tar.gz"
echo "${file%.gz}"      # example.tar
echo "${file%%.*}"      # example
echo "${file#*.}"       # tar.gz
```
