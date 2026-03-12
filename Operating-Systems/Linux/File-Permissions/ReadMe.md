# Linux File Permissions

## Context

When managing Linux systems, you frequently need to set and verify file permissions for security purposes. A common pattern is setting sensitive configuration files (like `.env` files containing secrets) to `600` permissions, which means only the owner can read and write the file.

However, the output of `ls -al` can be confusing because it displays multiple numbers in a row, leading to easy misinterpretation of which number represents what.

## The Problem: Misreading ls -al Output

Consider this common output:

```bash
$ ls -al /etc/app/config.env
-rw------- 1 root root 755 Sep 21 19:50 /etc/app/config.env
```

**Common mistake:** Seeing `755` and thinking "the permissions didn't change!"

**Reality:** The `755` is the file size in bytes, not the permissions.

## Understanding ls -al Output Structure

The `ls -al` output follows this format:

```
[permissions] [links] [owner] [group] [size] [date] [time] [filename]
```

Breaking down the example:

- `-rw-------` = **permissions** (this is `600` in octal notation)
- `1` = number of hard links
- `root` = owner
- `root` = group
- `755` = **file size in bytes**
- `Sep 21 19:50` = modification timestamp
- `/etc/app/config.env` = filename

## Reading Permissions from ls Output

The permission string `-rw-------` breaks down as:

- First character: file type (`-` = regular file, `d` = directory, `l` = symlink)
- Next 3 characters: owner permissions (`rw-` = read + write)
- Next 3 characters: group permissions (`---` = no permissions)
- Last 3 characters: other permissions (`---` = no permissions)

This translates to octal `600`:

- Owner: `rw-` = 4 + 2 + 0 = 6
- Group: `---` = 0 + 0 + 0 = 0
- Other: `---` = 0 + 0 + 0 = 0

## Setting Permissions Correctly

To set a file to `600` (owner read/write only):

```bash
sudo chmod 600 /path/to/file
```

This is the standard practice for sensitive files like:

- `.env` files with API keys or secrets
- SSH private keys
- Database credential files
- Configuration files with passwords

## Verifying Permissions: Two Approaches

### Method 1: Using ls -al (visual inspection)

```bash
ls -al /path/to/file
```

Look at the permission string (first column), not the file size.

**Pros:** Shows full context (owner, group, timestamps)
**Cons:** Requires parsing the permission string visually

### Method 2: Using stat (direct octal output)

```bash
stat -c "%a" /path/to/file
```

Output: `600`

**Pros:** Gives you the exact octal number directly
**Cons:** Only shows permissions, no other context

## Common Permission Patterns

- `600` = Owner read/write only (sensitive files)
- `644` = Owner read/write, others read only (public configs)
- `700` = Owner read/write/execute only (private scripts)
- `755` = Owner full access, others read/execute (public scripts)
- `400` = Owner read only (extra-sensitive files)

## Key Takeaway

When you see multiple numbers in `ls -al` output, remember the order:

**Permission string first, then file size.**

The confusion between these two numbers is a common mental trap, especially when the file size happens to be a valid permission number like `644`, `755`, or `600`.

Always verify which number you're looking at, or use `stat -c "%a"` for unambiguous permission checking.
