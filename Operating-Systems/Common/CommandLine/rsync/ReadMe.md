# rsync

**`rsync`** does not mean a complete synchronisation in both directions; it primarily focuses on efficiently transferring and synchronizing files from a source to a destination. If there are files on the remote destination that are not present in the source, they will not be automatically deleted unless you use the `--delete` option.

And if you want to add remote files that are not present locally, you just run rsync a second time in the reverse direction.

## Examples

### Dry Run

The following command demonstrates how to use `rsync` to synchronize files from a local directory to a remote server while excluding certain files and performing a **dry run**. Note the `-n` flag at the end of the command, which indicates a dry run.

- a : Archive mode; equals `-rlptgoD` (no `-H`).
  - r : Recurse into directories.
  - l : Copy symlinks as symlinks.
  - p : Preserve permissions.
  - t : Preserve modification times.
  - g : Preserve group.
  - o : Preserve owner.
  - D : Preserve device and special files.
    no '-H' (not preserving hard links). If you need to preserve hard links, you should add the '-aH' option explicitly.
- v : Verbose mode; increases the amount of information you are given during the transfer.
- z : Compress file data during the transfer.
- n : Perform a dry run; shows what would have been transferred without actually doing it.

```bash
rsync -avz --exclude='.DS_Store' --exclude='._.DS_Store' /Volumes/ExtremeSSD/__AUDIOS/ nx-storage:/home/External-Harddisks/__AUDIOS -n
```

### Actual Synchronization

The following command demonstrates how to use `rsync` to synchronize files from a local directory to a remote server while excluding certain files (`.DS_Store` and `._.DS_Store`) and performing the **actual synchronization**.

```bash
rsync -avz --exclude='.DS_Store' --exclude='._.DS_Store' /Volumes/ExtremeSSD/__AUDIOS/ nx-storage:/home/External-Harddisks/__AUDIOS
```
