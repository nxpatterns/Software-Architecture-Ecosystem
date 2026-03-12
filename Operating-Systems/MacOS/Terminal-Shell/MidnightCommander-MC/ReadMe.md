# Midnight Commander (MC)

## Context: What Problem Are We Solving?

**The Need:** Efficiently transfer files between a local macOS machine and remote Linux servers with visual feedback, dual-pane navigation, and secure authentication.

**Historical Context:** Norton Commander was the standard dual-pane file manager in DOS/early Windows era. It provided intuitive visual file management between local and remote systems.

**Modern Solution:** Midnight Commander (mc) is the direct spiritual successor - a terminal-based, dual-pane file manager that integrates seamlessly with SSH for secure remote file operations.

## Why Midnight Commander?

**Security:**

- Open source since 1994, well-audited codebase
- Uses existing SSH connections (no new network protocols)
- Runs with user permissions only
- No credential caching or additional attack surface
- Actively maintained with regular security updates

**Advantages over alternatives:**

- **vs GUI clients (FileZilla, Cyberduck):** Terminal-based, no GUI overhead, works over SSH sessions
- **vs scp/sftp:** Visual feedback, easier navigation, bulk operations
- **vs rsync:** Interactive browsing, selective file operations

**Ideal for:**

- System administrators managing multiple servers
- Developers deploying code to remote environments
- Anyone needing visual file management with SSH security

## Installation on macOS

**Recommended method (Homebrew):**

```bash
brew install midnight-commander
```

**Verification:**

```bash
mc --version
# Should output: GNU Midnight Commander 4.x.x
```

**Alternative methods:**

- MacPorts: `sudo port install mc`
- From source: Download from midnight-commander.org

## SSH Configuration Integration

**How MC uses SSH:** MC automatically reads your `~/.ssh/config` file and respects all SSH configuration including host aliases, custom ports, identity files, and user mappings.

**Example SSH config structure:**

```ssh-config
# ~/.ssh/config
Host myserver
    HostName 192.168.1.100
    User admin
    IdentityFile ~/.ssh/my_key_ed25519
    Port 22
```

**Why this matters:**

- No duplicate configuration needed
- Centralized SSH settings
- Same authentication for ssh, scp, and mc
- Host aliases work everywhere

**Prerequisite:** Ensure SSH key is loaded in your agent:

```bash
# Add key to agent
ssh-add ~/.ssh/my_key_ed25519

# Verify connection works
ssh myserver
```

## Connecting to Remote Servers

**Three methods to connect:**

### Method 1: Command Line (fastest)

```bash
# Using SSH config alias
mc sh://myserver

# Using full connection string
mc sh://username@hostname.com
```

### Method 2: Within MC (interactive)

1. Launch mc: `mc`
2. Press `F9` (opens menu)
3. Navigate to `Right` or `Left` panel menu
4. Select `Shell link`
5. Enter: `myserver` (your SSH config alias)

### Method 3: From MC Panel

- Press `F9` → `Right` → `Shell link`
- Type the host alias from your SSH config
- Press Enter

**Panel layout after connection:**

- **Left panel:** Local filesystem (macOS)
- **Right panel:** Remote filesystem (Linux server)
- **Tab key:** Switch between panels

## File Selection on macOS

**Challenge:** Mac keyboards lack a dedicated Insert key, which is the traditional MC file selection key.

**Working solutions on macOS:**

| Action | Key Binding | Description |
|--------|-------------|-------------|
| Toggle single file | `Ctrl+T` | Select/deselect current file |
| Toggle single file | `Space` | Alternative method (test your build) |
| Select by pattern | `+` | Opens dialog for wildcard selection |
| Deselect by pattern | `-` | Opens dialog for wildcard deselection |
| Invert selection | `*` | Flip all selections |
| Select all | `Ctrl+A` | Select all files in current directory |
| Deselect all | `Ctrl+U` | Clear all selections |

**Pattern selection examples:**

```
# Select all text files
+ then enter: *.txt

# Select files starting with 'log'
+ then enter: log*

# Select files from a date range
+ then enter: 2024-01-*

# Deselect temporary files
- then enter: *.tmp
```

**Best practice:** Use pattern selection (`+` key) for bulk operations rather than individual file marking.

## Essential MC Navigation

**Key bindings reference:**

| Key | Action |
|-----|--------|
| `F1` | Help (built-in key reference) |
| `F3` | View file |
| `F4` | Edit file |
| `F5` | Copy (local to remote or vice versa) |
| `F6` | Move/rename |
| `F7` | Create directory |
| `F8` | Delete |
| `F9` | Top menu |
| `F10` | Quit |
| `Tab` | Switch between panels |
| `Ctrl+O` | Toggle panel visibility (see shell) |

**Navigation:**

- Arrow keys: Move cursor
- Enter: Enter directory or execute file
- `..` entry: Go up one directory
- `Ctrl+\` : Show directory hotlist

## Common Workflows

### Workflow 1: Copy files from local to remote

1. Launch: `mc sh://myserver`
2. Navigate left panel (local) to source directory
3. Navigate right panel (remote) to destination
4. Select files in left panel: `Ctrl+T` or `+` for patterns
5. Press `F5` (copy)
6. Confirm destination path
7. Press Enter

### Workflow 2: Download files from remote

1. Connect to remote server
2. Navigate right panel (remote) to source
3. Navigate left panel (local) to destination
4. Select files in right panel
5. Press `F5` (copy)
6. Verify destination
7. Press Enter

### Workflow 3: Synchronize directories

1. Set up both panels to mirror directories
2. Use `Ctrl+X d` (compare directories)
3. MC highlights differences
4. Select and copy updated files

### Workflow 4: Quick file editing on remote

1. Connect to server
2. Navigate to file in remote panel
3. Press `F4` (edit)
4. Make changes
5. Save and exit (saves directly to remote)

## Troubleshooting

**Problem: Cannot connect to server**

- Verify SSH connection works: `ssh myserver`
- Check SSH key is loaded: `ssh-add -l`
- Ensure SSH config syntax is correct
- Try full connection string: `mc sh://user@host`

**Problem: File selection not working**

- Press `F1` in MC to see actual key bindings
- Try alternative keys: `Ctrl+T`, `Space`, or `Shift+F4`
- Use pattern selection (`+`) as workaround

**Problem: Terminal display issues**

- Check TERM variable: `echo $TERM`
- Set in SSH config: `SetEnv TERM=xterm-256color`
- Or set locally: `export TERM=xterm-256color`

**Problem: Permission denied on remote**

- Verify user has write permissions
- Check remote directory ownership: `ls -la`
- Ensure SSH user matches intended account

**Problem: MC freezes or hangs**

- Press `Ctrl+O` to toggle to shell
- Check background processes: `jobs`
- Kill MC safely: `Ctrl+C` or from another terminal

## Security Best Practices

**Key management:**

```bash
# Use SSH agent to avoid repeated password prompts
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/your_key

# Verify keys loaded
ssh-add -l

# Remove keys when done
ssh-add -D
```

**SSH config security:**

```ssh-config
# Recommended settings
Host *
    ServerAliveInterval 60
    ServerAliveCountMax 3
    StrictHostKeyChecking ask
    IdentitiesOnly yes
```

**File transfer verification:**

- Use `F3` (view) to verify file contents before/after transfer
- Check file sizes in panels
- Verify timestamps after copy operations

## Advanced Tips

**Working with multiple servers:**

- Open multiple MC instances in different terminal tabs
- Use screen/tmux for persistent sessions
- Create host groups in SSH config for related servers

**Performance optimization:**

```bash
# For large file operations, consider rsync
rsync -avz --progress source/ user@host:/destination/

# MC best for: interactive browsing, selective operations
# rsync best for: bulk syncs, automated backups
```

**Custom MC configuration:**

```bash
# Configuration location
~/.config/mc/

# Main config file
~/.config/mc/ini

# Panels config
~/.config/mc/panels.ini
```

## Quick Reference Card

```
Connection:     mc sh://hostname
Help:           F1
View:           F3
Edit:           F4
Copy:           F5
Move:           F6
Delete:         F8
Toggle select:  Ctrl+T
Pattern select: + (then enter pattern)
Switch panels:  Tab
Toggle shell:   Ctrl+O
Quit:           F10 or Ctrl+X
```

## Alternative Tools Comparison

**When to use MC:**

- Interactive file management
- Visual feedback needed
- Selective file operations
- Learning remote filesystem structure

**When to use alternatives:**

- **rsync:** Automated syncs, large directory trees
- **scp:** Single file quick transfers
- **sftp batch:** Scripted file operations
- **rclone:** Cloud storage integration
- **Git:** Version-controlled code deployment

## Resources

- Official site: https://midnight-commander.org
- Documentation: https://midnight-commander.org/wiki/doc
- SSH config guide: `man ssh_config`
- Key bindings: Press `F1` within MC

## Summary

Midnight Commander provides a secure, efficient, visual method for managing files between macOS and remote Linux servers. It leverages existing SSH infrastructure, requires no additional authentication setup, and offers an intuitive dual-pane interface for file operations. The learning curve is minimal, and the tool remains useful for both quick file transfers and complex multi-server management scenarios.

**Core principle:** MC is a visual layer over SSH - it doesn't replace your security practices, it enhances your workflow while maintaining the same security model you already trust.
