# macOS Upgrade: SD Card Issues

## Background

After upgrading macOS, SD cards that previously mounted automatically may stop working. This is a recurring pattern across multiple macOS versions (confirmed in Sequoia and Tahoe). The symptoms and fixes depend on how the card is formatted and how macOS handles that format after the upgrade.

## Symptoms

- SD card inserted into built-in slot produces no sound and no Finder notification
- Card does not appear in Finder under Locations
- Card does not appear in Disk Utility (full hardware-level failure, rare)
- Card appears in Disk Utility but is greyed out and cannot be mounted via the UI

## Diagnosis

The first step is always to check whether macOS detects the hardware at all, even if it doesn't mount the card automatically.

Open Terminal and run:

```bash
diskutil list
```

Look for an entry that is not your main internal drive. A typical SD card entry looks like this:

```bash
/dev/disk4 (internal, physical):
   #:                       TYPE NAME                    SIZE       IDENTIFIER
   0:     FDisk_partition_scheme                        *250.4 GB   disk4
   1:               Windows_NTFS MyCard                  250.4 GB   disk4s1
```

**If the card appears here**, macOS detects the hardware but is not mounting it automatically. The fix is software-level (see below).

**If the card does not appear at all**, the issue is either hardware (dirty slot, damaged card) or a deeper driver-level regression in the new macOS version.

## Root Causes and Fixes

### Case 1: Card is NTFS-formatted

NTFS is a Windows file system. macOS has never had full native NTFS support -- it can read NTFS in some versions, but write support requires third-party tools. After certain macOS upgrades, even automatic read-only mounting of NTFS volumes broke silently.

**Temporary fix** (mount manually this one time):

```bash
diskutil mount /dev/disk4s1
```

Replace `disk4s1` with the identifier shown in `diskutil list`.

**Permanent fix**: Reformat the card (see Reformatting section below). Manual mounting is not a sustainable workflow.

### Case 2: Card is exFAT or HFS-formatted but still won't mount

macOS Tahoe 26.3 introduced a confirmed bug where external media -- including SD cards -- fails to mount automatically even when formatted correctly. Apple acknowledged this in the 26.4 developer beta release notes, describing it as HFS external media failing to mount automatically, though in practice it affects other formats too.

**Workaround A** -- mount via Terminal:

```bash
diskutil mount /dev/disk4s1
```

**Workaround B** -- reboot with the card already inserted in the slot. Some users report this triggers automatic mounting when hot-insertion does not.

**Workaround C** -- check Finder settings. macOS upgrades have been known to silently reset this preference:

Finder > Settings > Sidebar > enable "External disks"

**Long-term**: Wait for a macOS point release that fixes the regression. This is an Apple bug, not a user configuration issue.

## Reformatting: Choosing the Right File System

Reformatting erases all data on the card. Back up everything first.

| Format | macOS | Windows | Cameras / other devices | Unicode filenames |
|--------|-------|---------|--------------------------|-------------------|
| NTFS   | Read-only (unreliable) | Full | Rare | Full |
| exFAT  | Full | Full | Most modern devices | Mostly yes* |
| APFS   | Full | No | No | Full |
| HFS+   | Full | No (without software) | No | Full |

**Recommendation for cross-platform use (Mac + Windows + cameras):** exFAT.

**Recommendation for Mac-only use:** APFS.

### Known limitation of exFAT

exFAT has inconsistent handling of Unicode characters in folder and file names when writing from macOS. Specifically, characters outside the standard Latin set (e.g. Turkish ş, ğ, ı or similar non-Latin scripts) can cause write errors such as `Unable to create folder`. This is not a theoretical edge case -- it has been observed in practice.

If your workflow involves folder names with non-Latin characters and the card needs to be writable from macOS, use APFS instead, accepting the loss of Windows/camera compatibility.

If cross-platform compatibility is required and non-Latin characters are involved, this is a genuine trade-off with no clean solution. The least-bad option is to enforce ASCII-only folder names at the workflow level.

## How to Reformat

### To exFAT (cross-platform)

```bash
diskutil eraseDisk ExFAT CARDNAME /dev/disk4
```

Replace `CARDNAME` with whatever label you want and `disk4` with your disk identifier from `diskutil list`. Use the disk identifier (e.g. `disk4`), not the partition identifier (e.g. `disk4s1`) -- this reformats the entire disk including the partition scheme.

### To APFS (Mac-only)

```bash
diskutil eraseDisk APFS CARDNAME /dev/disk4
```

## Summary of What Works

1. Run `diskutil list` to confirm macOS sees the hardware.
2. If the card appears but won't mount, try `diskutil mount /dev/diskXsY`.
3. If the card is NTFS, manual mounting is a temporary fix only -- reformat to exFAT or APFS.
4. If the card is already exFAT/HFS and still won't auto-mount after an upgrade, this is likely a macOS regression bug. Rebooting with the card inserted and checking Finder sidebar settings are the two most reliable workarounds.
5. For Mac-only use with non-Latin filenames, APFS is the correct format.
6. For cross-platform use, exFAT is the correct format -- with the caveat that non-Latin characters in folder names may cause write errors from macOS.
