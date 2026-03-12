# From Mega.nz to Storage Box

## Overview

This document describes a production-tested approach for migrating large collections of files from Mega.nz cloud storage to a dedicated storage server. The solution handles inconsistent data formats, manages disk space constraints, and provides comprehensive error logging.

## Context: The Problem

**What**: Migrate hundreds to thousands of ZIP files from Mega.nz download links to a dedicated storage infrastructure.

**Why**:

- Centralize file storage for better access control
- Reduce dependency on third-party cloud services
- Enable integration with database-driven applications
- Prepare for user-tiered access (guest, authenticated, admin)

**Challenges**:

- Files stored across multiple years with inconsistent metadata
- Limited server disk space (can't download all files at once)
- Dead/expired download links (files deleted from Mega.nz)
- Need for reliable error tracking and retry capability

## Architecture

### Components

1. **Source**: Mega.nz download links stored in Excel spreadsheet
2. **Processing Server**: Linux server with Python environment
3. **Destination**: Remote storage box accessed via SFTP
4. **Strategy**: Single-file workflow (download → upload → delete)

### Data Flow

```
Excel Spreadsheet → Python Script → Temporary Storage → SFTP Upload → Storage Box
                         ↓
                   Error/Success Logs
```

## Prerequisites

### Server Environment

**Python Environment** (conda recommended):

```bash
conda create -n file-migration python=3.11
conda activate file-migration
conda install pandas openpyxl requests
```

**Download Tool** (megatools):

```bash
sudo apt update
sudo apt install megatools
```

### SFTP Configuration

**SSH Key-Based Authentication** (required for automation):

```bash
# Generate key if needed
ssh-keygen -t ed25519 -f ~/.ssh/storage_key

# Configure SSH config (~/.ssh/config)
Host storage-server
    HostName storage.example.com
    User username
    Port 23
    IdentityFile ~/.ssh/storage_key
```

**Test connection**:

```bash
sftp storage-server
# Should connect without password prompt
```

### Storage Box Directory Structure

**Critical**: Create target directories BEFORE running migration script.

SFTP does NOT support `mkdir -p` (recursive directory creation). Attempting to use it will fail silently.

```bash
sftp storage-server
mkdir /target
cd /target
mkdir 2024
mkdir 2023
mkdir 2022
# ... create all needed year directories
quit
```

## Data Preparation

### Excel File Format

**Expected structure**: Multi-sheet workbook with one sheet per year.

**Required columns** (column names may vary):

- Invoice/Record ID (e.g., "Invoice No", "Record ID", "Fatura No")
- Download Link (e.g., "ZIP Download", "File Link", "Download URL")

**Common data quality issues**:

- Extra text in ID columns: `"202410622 SEO: 202410623"` → need regex extraction
- Multiple records with same ID → require deduplication
- Empty download URLs → filter out before processing
- Inconsistent column naming across sheets

### Column Name Mapping

Handle inconsistent column names dynamically:

```python
# Find invoice column
invoice_col = 'Invoice No' if 'Invoice No' in df.columns else 'Invoice'

# Find download column
download_cols = [col for col in df.columns if 'ZIP' in col or 'Download' in col]
download_col = download_cols[0] if download_cols else None
```

## Implementation

### Core Script Structure

```python
#!/usr/bin/env python3
import pandas as pd
import subprocess
import shutil
from pathlib import Path
import re

def check_disk_space():
    """Monitor available disk space in GB"""
    total, used, free = shutil.disk_usage("/")
    return free // (1024**3)

def clean_record_id(record_id):
    """Extract clean ID from messy data"""
    # Example: Extract 9-digit number starting with 202X
    match = re.search(r'(202[0-9]\d{5})', str(record_id))
    return match.group(1) if match else str(record_id).strip()

def process_year(year, excel_file):
    """Process all files for a given year"""

    # Read specific sheet
    df = pd.read_excel(excel_file, sheet_name=str(year))

    # Map columns dynamically
    invoice_col = identify_invoice_column(df)
    download_col = identify_download_column(df)

    if not download_col:
        print(f"No download column found for {year}")
        return

    # Clean and deduplicate
    df['clean_id'] = df[invoice_col].apply(clean_record_id)
    df = df.drop_duplicates(subset=['clean_id'])
    df = df.dropna(subset=[download_col])

    # Process files one at a time
    temp_dir = Path("/tmp/file_migration")
    temp_dir.mkdir(exist_ok=True)

    for index, row in df.iterrows():
        # Check disk space before each download
        free_space = check_disk_space()
        if free_space < 10:
            print("Insufficient disk space, stopping")
            break

        process_single_file(row, year, temp_dir)
```

### Single File Processing

**Critical pattern**: Download → Upload → Immediate Delete

```python
def process_single_file(row, year, temp_dir):
    """Download, upload, and cleanup single file"""

    record_id = row['clean_id']
    download_url = row['download_url']

    try:
        # Download to temporary location
        result = subprocess.run(
            ['megadl', '--path', str(temp_dir), download_url],
            capture_output=True, text=True, timeout=300
        )

        if result.returncode != 0:
            log_error(record_id, download_url, result.stderr)
            return

        # Find downloaded file
        zip_files = list(temp_dir.glob("*.zip"))
        if not zip_files:
            log_error(record_id, download_url, "No file after download")
            return

        downloaded_file = zip_files[0]
        target_name = f"{record_id}.zip"

        # Upload via SFTP
        upload_success = sftp_upload(
            downloaded_file,
            f"/target/{year}/{target_name}"
        )

        if upload_success:
            log_success(record_id, f"/target/{year}/{target_name}")
        else:
            log_error(record_id, download_url, "Upload failed")

        # Immediate cleanup regardless of success
        downloaded_file.unlink()

    except subprocess.TimeoutExpired:
        log_error(record_id, download_url, "Download timeout")
    except Exception as e:
        log_error(record_id, download_url, str(e))
```

### SFTP Upload Implementation

**Key lesson**: Use `cd` then `put`, not absolute paths in `put`.

```python
def sftp_upload(local_file, remote_path):
    """Upload file via SFTP with correct command structure"""

    # Split path into directory and filename
    remote_dir = str(Path(remote_path).parent)
    remote_name = Path(remote_path).name

    # SFTP commands: cd to directory, then put file
    sftp_commands = f"""cd {remote_dir}
put {local_file} {remote_name}
quit"""

    result = subprocess.run(
        ['sftp', 'storage-server'],
        input=sftp_commands,
        text=True,
        capture_output=True,
        timeout=60
    )

    return result.returncode == 0
```

**Why this pattern?**

- SFTP doesn't support recursive path creation in `put` command
- Changing directory first ensures correct upload location
- Separate directory and filename prevents path resolution issues

## Error Handling

### Comprehensive Logging

Create separate log files for each processing year:

```python
def setup_logging(year):
    """Initialize error and success logs"""
    error_log = Path(f"errors_{year}.txt")
    success_log = Path(f"success_{year}.txt")

    # Create with headers
    with open(error_log, 'w') as f:
        f.write("record_id\tdownload_url\terror_message\n")

    with open(success_log, 'w') as f:
        f.write("record_id\tstorage_path\n")

    return error_log, success_log
```

### Common Failure Scenarios

**Dead links** (ENOENT error):

- Files deleted or moved on Mega.nz
- Expected failure rate: 5-15% of links
- Action: Log for manual review, continue processing

**Download timeouts**:

- Large files or slow connections
- Set reasonable timeout (300 seconds)
- Log and continue to next file

**SFTP failures**:

- Network interruptions
- Permission issues
- Log with full error message for debugging

## Critical Pitfalls & Solutions

### Pitfall 1: Silent SFTP Failures

**Problem**: SFTP commands return exit code 0 even when files don't exist or uploads fail.

```bash
# This returns exit code 0 even though file doesn't exist
echo "ls /path/to/nonexistent.zip" | sftp server
echo $?  # Output: 0
```

**Solution**: Don't rely on SFTP exit codes for file verification. Use explicit checks or accept that some uploads may need retry logic.

### Pitfall 2: Directory Creation Assumptions

**Problem**: Attempting `mkdir -p /remote/path/to/dir` via SFTP fails silently.

**Solution**: Create all target directories manually before running migration script.

### Pitfall 3: Disk Space Exhaustion

**Problem**: Downloading multiple large files before upload can fill disk.

**Solution**: Single-file workflow with immediate cleanup:

1. Download one file
2. Upload immediately
3. Delete before processing next file
4. Monitor disk space before each download

### Pitfall 4: Inconsistent Data Format

**Problem**: Column names change between datasets, extra text in ID fields.

**Solution**:

- Dynamic column detection
- Regex-based ID extraction
- Data validation before processing

## Verification & Monitoring

### During Processing

Monitor the process in real-time:

```bash
# Watch disk space
watch -n 30 'df -h | grep sda1'

# Monitor process
ps aux | grep python

# Tail error log
tail -f errors_2024.txt
```

### Post-Processing

**Count processed files**:

```bash
wc -l success_2024.txt  # Total successful uploads
wc -l errors_2024.txt   # Total failures
```

**Verify storage box**:

```bash
sftp storage-server
cd /target/2024
ls | wc -l  # Count uploaded files
```

**Analyze error patterns**:

```bash
# Most common errors
cut -f3 errors_2024.txt | sort | uniq -c | sort -rn
```

## Performance Considerations

**Expected throughput**: 20-40 files per hour

- Depends on file size and network speed
- Mega.nz rate limiting may affect download speed

**Resource usage**:

- Minimal RAM (processing one file at a time)
- CPU: Low (mostly I/O bound)
- Disk: Single file size + overhead (usually <5GB)
- Network: Download and upload happen sequentially

## Retry Failed Downloads

After initial run, process failed downloads separately:

```python
def retry_failed(error_log_file, year):
    """Retry failed downloads from error log"""

    failed_records = []
    with open(error_log_file) as f:
        next(f)  # Skip header
        for line in f:
            record_id, url, error = line.strip().split('\t')
            # Skip permanent failures (ENOENT)
            if 'ENOENT' not in error:
                failed_records.append((record_id, url))

    # Process failed records
    for record_id, url in failed_records:
        process_single_file({'clean_id': record_id, 'download_url': url}, year, temp_dir)
```

## Security Considerations

**SSH Keys**:

- Use dedicated keys for automation
- Set restrictive permissions: `chmod 600 ~/.ssh/storage_key`
- Never commit keys to version control

**Log Files**:

- Contain download URLs (may include access tokens)
- Store in secure location
- Clean up after processing complete

**Temporary Files**:

- Use `/tmp` for automatic cleanup on reboot
- Explicit deletion after processing
- Ensure no sensitive data persists

## Cleanup

After successful migration:

```bash
# Remove download tool if no longer needed
sudo apt remove megatools

# Clean up temporary directories
rm -rf /tmp/file_migration

# Archive logs
tar -czf migration_logs_$(date +%Y%m%d).tar.gz *.txt
```

## Lessons Learned

1. **Test SFTP commands thoroughly** - Exit codes don't indicate success
2. **Create directories upfront** - SFTP lacks recursive mkdir
3. **Process one file at a time** - Prevents disk space issues
4. **Expect link failures** - Cloud storage links expire
5. **Dynamic column mapping** - Datasets evolve over time
6. **Comprehensive logging** - Essential for debugging and retry logic
7. **Regex for data cleaning** - Handle messy real-world data

## Conclusion

This approach successfully migrated 2000+ files across multiple years with minimal manual intervention. The single-file workflow ensures stability even with limited resources, while comprehensive logging enables easy retry of failed transfers.

Key success factors:

- Defensive error handling
- Disk space awareness
- Proper SFTP command structure
- Flexible data parsing
- Clear separation of concerns (download/upload/cleanup)

The solution is production-ready and can be adapted for similar bulk file migration scenarios.
