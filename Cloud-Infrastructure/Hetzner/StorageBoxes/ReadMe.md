# Hetzner Storage Box SSH Configuration

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=5 orderedList=false} -->

<!-- code_chunk_output -->

- [Overview](#overview)
- [Key Permissions](#key-permissions)
- [SSH Configuration](#ssh-configuration)
- [Protocol Usage](#protocol-usage)
- [SSH Key Management](#ssh-key-management)
  - [Critical Limitation](#critical-limitation)
  - [Key Registration](#key-registration)
  - [Troubleshooting Key Authentication](#troubleshooting-key-authentication)
- [Common Mistakes](#common-mistakes)
  - [Using SSH Instead of SFTP](#using-ssh-instead-of-sftp)
  - [Wrong Port](#wrong-port)
  - [Multiple Keys](#multiple-keys)
  - [Public vs Private Key Confusion](#public-vs-private-key-confusion)
- [Verification](#verification)
- [Further Reading](#further-reading)

<!-- /code_chunk_output -->

## Overview

Hetzner Storage Boxes provide backup storage accessible via SFTP/SSH. Unlike Hetzner Cloud instances, Storage Boxes have specific requirements and limitations for SSH key authentication.

## Key Permissions

SSH requires strict permissions on private keys. If you encounter permission errors, verify your private key has the correct permissions:

```bash
chmod 600 ~/.ssh/id_ed25519
```

**Important distinction:**

- Private key: `id_ed25519` (no extension) - requires 600 permissions
- Public key: `id_ed25519.pub` - can have 644 permissions

SSH will reject keys if the private key is readable by others.

## SSH Configuration

Hetzner Storage Boxes use **port 23** instead of the standard port 22. Configure your SSH client accordingly:

```bash
# ~/.ssh/config
Host storage-box
    HostName uXXXXXX.your-storagebox.de
    User uXXXXXX
    Port 23
    IdentityFile ~/.ssh/id_ed25519
```

Replace `uXXXXXX` with your actual storage box username.

## Protocol Usage

**Storage Boxes do not provide shell access.** Attempting to connect via SSH will fail with:

```
PTY allocation request failed on channel 0
shell request failed on channel 0
```

Use SFTP instead:

```bash
sftp storage-box
```

This provides file transfer capabilities without shell access.

## SSH Key Management

### Critical Limitation

Hetzner Storage Boxes only accept **one SSH key per account**: the first/default key configured in your Hetzner account settings.

This differs from Hetzner Cloud instances, which support multiple SSH keys per server.

### Key Registration

1. Navigate to Hetzner's web interface
2. Go to your Storage Box settings
3. Add your SSH public key under "SSH Keys"
4. The key must be the default/first key in your account

If you have multiple keys registered with Hetzner Cloud, the Storage Box will only recognize the first one.

### Troubleshooting Key Authentication

If SFTP requests a password despite having a key configured:

1. Verify the public key is registered in Hetzner's panel
2. Confirm it's the default/first key in your account
3. Check that the private key path in your SSH config matches the registered public key
4. Ensure private key permissions are 600

## Common Mistakes

### Using SSH Instead of SFTP

Storage Boxes reject shell connections. Always use `sftp` command, not `ssh`.

### Wrong Port

Port 22 won't work. Storage Boxes require port 23.

### Multiple Keys

Registering multiple keys with Hetzner Cloud doesn't automatically work for Storage Boxes. Only the default account key is accepted. (Possibly fixed by Hetzner, but verify in your account settings.)

### Public vs Private Key Confusion

SSH config `IdentityFile` should point to the private key (`id_ed25519`), not the public key (`id_ed25519.pub`).

## Verification

Test your configuration:

```bash
sftp storage-box
```

Successful authentication should connect without prompting for a password.

## Further Reading

- [Hetzner Storage Box Documentation](https://docs.hetzner.com/robot/storage-box/)
- [SSH Key-Based Authentication](https://www.ssh.com/academy/ssh/public-key-authentication)
