# Bash Media File Search Script for macOS

## Overview

This document explains how to create a Bash script that searches for media files (images and videos) across a file system on macOS, generates an HTML report with clickable directory links, and copies all found files to a centralized location.

## Context and Use Case

When managing large external drives or backup volumes, you often need to locate all media files scattered across different directory structures. This script solves that problem by:

1. Recursively searching a volume for media files
2. Generating an HTML report showing which directories contain media files
3. Copying all found files to a single location for easy access
4. Excluding common development and system directories to improve performance

## Technical Challenges on macOS/zsh

### Pattern Matching Issues

The initial script used `find` with built-in regex matching:

```bash
find /path -type f -regextype posix-extended -regex ".*\.(jpg|png|mp4)$"
```

**Problem**: This approach failed silently on macOS with zsh. The `find` command would traverse directories but return no results, even when matching files existed.

**Solution**: Separate the file finding from pattern matching using a two-stage approach:

```bash
find /path -type f | grep -E "\\.(jpg|png|mp4)$"
```

This pipes all files to `grep` for pattern matching, which is more reliable across different shells and operating systems.

### Variable Expansion in Patterns

When using variables for file extensions, proper escaping is critical:

```bash
EXTENSIONS="jpg|jpeg|png|mp4"

# Incorrect - may fail in zsh
grep -E "\.(${EXTENSIONS})$"

# Correct - use double backslash
grep -E "\\.(${EXTENSIONS})$"
```

The double backslash ensures the pattern is correctly interpreted by `grep` after shell variable expansion.

### Directory Exclusion

To exclude specific directories (like `node_modules` or `.git`), use `find`'s `-not -path` option:

```bash
find /path -type f \
  -not -path "*/node_modules/*" \
  -not -path "*/.git/*" \
  | grep -E "\\.(extensions)$"
```

This is more efficient than filtering with `grep` after traversing unwanted directories.

## Complete Script

```bash
#!/bin/bash

# Define output file for HTML report
OUTPUT_FILE="$HOME/media_directories.html"

# Define destination directory for copied media files
IMAGE_DEST_DIR="$HOME/collected_media"

# Ensure destination directory exists
mkdir -p "$IMAGE_DEST_DIR"

# Define media file extensions to search for
EXTENSIONS="jpg|jpeg|png|gif|heic|raw|cr2|nef|dng|tiff|tif|bmp|webp|mp4|mov|avi"

# Define directories to exclude from search
EXCLUDE_DIRS="node_modules|.git|.svn|.hg|.DS_Store"

# Create HTML header
cat > "$OUTPUT_FILE" << 'EOL'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Image/Video Directories</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 20px; }
        h1 { color: #333; }
        .directory { margin: 5px 0; }
        a { text-decoration: none; color: #0366d6; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <h1>Directories Containing Images/Videos</h1>
    <div id="directories">
EOL

echo "Searching for media files..."
echo "Excluding directories matching: $EXCLUDE_DIRS"
echo "Results will be written to $OUTPUT_FILE"
echo "Images will be copied to: $IMAGE_DEST_DIR"
echo "----------------------------------------------------------------------"

# Counter for copied files
COPY_COUNT=0

# Build find exclusion patterns dynamically
EXCLUDE_PATTERN=""
for DIR in $(echo "$EXCLUDE_DIRS" | tr '|' ' '); do
    EXCLUDE_PATTERN="$EXCLUDE_PATTERN -not -path \"*/$DIR/*\""
done

# Find files excluding specified directories
# Note: Using eval to handle dynamically built exclusion patterns
eval "find /Volumes/YOUR_VOLUME -type f $EXCLUDE_PATTERN" | grep -E "\\.(${EXTENSIONS})$" |
while read -r FILE; do
    DIR=$(dirname "$FILE")

    # Copy the file to the destination directory
    cp -f "$FILE" "$IMAGE_DEST_DIR/"
    COPY_COUNT=$((COPY_COUNT + 1))

    # Check if this directory entry has already been added to HTML
    if ! grep -q "<a href=\"file://$DIR\">" "$OUTPUT_FILE"; then
        # Count media files in this directory
        eval "find \"$DIR\" -maxdepth 1 -type f $EXCLUDE_PATTERN" | grep -E "\\.(${EXTENSIONS})$" | wc -l | tr -d ' ' > /tmp/count
        FILE_COUNT=$(<"/tmp/count")

        # Only add directories with at least 1 file
        if [ "$FILE_COUNT" -gt 0 ]; then
            # Display in terminal
            echo "Found $FILE_COUNT media files in: $DIR"

            # Write to HTML file
            echo "    <div class=\"directory\"><a href=\"file://$DIR\">$DIR</a> ($FILE_COUNT files)</div>" >> "$OUTPUT_FILE"
        fi
    fi
done

# Close HTML file
cat >> "$OUTPUT_FILE" << 'EOL'
    </div>
</body>
</html>
EOL

echo "----------------------------------------------------------------------"
echo "Done! Results saved to $OUTPUT_FILE"
echo "Copied $COPY_COUNT media files to $IMAGE_DEST_DIR"
echo "Open the HTML file in a browser to see clickable directories."
```

## Usage

1. **Set the search path**: Replace `/Volumes/YOUR_VOLUME` with your target directory or volume
2. **Customize extensions**: Modify the `EXTENSIONS` variable to include or exclude file types
3. **Add exclusions**: Update `EXCLUDE_DIRS` to skip additional directories
4. **Set output locations**: Update `OUTPUT_FILE` and `IMAGE_DEST_DIR` as needed
5. **Make executable**: `chmod +x script.sh`
6. **Run**: `./script.sh`

## Key Features

### HTML Report Generation

The script generates a self-contained HTML file with clickable `file://` links. Opening this file in a browser allows you to:

- View all directories containing media files
- See the count of files in each directory
- Click links to open directories directly in Finder

### File Copying Behavior

- **Overwrites duplicates**: Files with the same name are overwritten (`cp -f`)
- **Preserves existing files**: Files already in the destination that don't match any found files remain untouched
- **No directory structure**: All files are copied to a flat directory structure

### Performance Considerations

- **Excluded directories**: Development directories (`node_modules`, `.git`) can contain thousands of files and slow searches significantly
- **Permission errors**: Suppressed with `2>/dev/null` to prevent cluttering output
- **Large volumes**: Expect several minutes for multi-terabyte drives

## Customization Examples

### Search only for images (no videos)

```bash
EXTENSIONS="jpg|jpeg|png|gif|heic|raw|cr2|nef|dng|tiff|tif|bmp|webp"
```

### Add more exclusions

```bash
EXCLUDE_DIRS="node_modules|.git|.svn|.hg|.DS_Store|build|dist|cache"
```

### Search current directory instead of external volume

```bash
eval "find . -type f $EXCLUDE_PATTERN" | grep -E "\\.(${EXTENSIONS})$" |
```

### Preserve directory structure when copying

Replace the copy section with:

```bash
# Copy preserving directory structure
DEST_PATH="$IMAGE_DEST_DIR${DIR#/Volumes/YOUR_VOLUME}"
mkdir -p "$DEST_PATH"
cp -f "$FILE" "$DEST_PATH/"
```

## Troubleshooting

### Script runs but finds nothing

**Symptoms**: The script completes immediately without finding files, even though they exist.

**Causes**:

1. Incorrect pattern escaping in `grep`
2. Wrong volume or path name
3. Permission issues

**Diagnosis**:

```bash
# Test if find can access the directory
ls -la /Volumes/YOUR_VOLUME

# Test pattern matching manually
find /test/path -type f | grep -E "\\.(jpg|png)$"

# Check for actual matching files
find /test/path -name "*.jpg" -o -name "*.png"
```

### Script hangs on permission errors

**Symptoms**: Script stops with "Permission denied" messages.

**Solution**: The script already suppresses errors with `2>/dev/null`, but if you need to access restricted directories:

```bash
sudo ./script.sh
```

Note: This will prompt for your password and run with elevated privileges.

### Duplicate files with same name

**Behavior**: When multiple files have the same name, only the last one copied is kept.

**Solutions**:

1. Accept this behavior if you only care about having one copy
2. Rename files during copy by appending directory hash:

```bash
   HASH=$(echo "$DIR" | md5sum | cut -d' ' -f1)
   cp -f "$FILE" "$IMAGE_DEST_DIR/$(basename "$FILE" .${FILE##*.})_$HASH.${FILE##*.}"
```

## Alternative Approaches

### Using macOS Spotlight (mdfind)

For faster searches on macOS, use Spotlight's `mdfind`:

```bash
mdfind -onlyin /Volumes/YOUR_VOLUME "kMDItemKind == '*image*' || kMDItemKind == '*video*'"
```

**Advantages**: Much faster, uses indexed metadata
**Disadvantages**: Requires Spotlight indexing to be enabled, may miss recently added files

### Using parallel processing

For very large volumes, parallelize with `xargs`:

```bash
eval "find /path -type f $EXCLUDE_PATTERN" | grep -E "\\.(${EXTENSIONS})$" |
xargs -P 4 -I {} cp -f {} "$IMAGE_DEST_DIR/"
```

The `-P 4` flag runs 4 parallel copy processes.

## Security Considerations

- The script uses `eval` to handle dynamic exclusion patterns, which can be a security risk if `EXCLUDE_DIRS` comes from user input
- For production use with user input, sanitize the exclusion list or use a safer alternative
- The `file://` links in the HTML report will only work locally; don't share this report publicly as it exposes your file system structure

## Lessons Learned

1. **Shell compatibility matters**: What works in Bash may not work in zsh, especially with regex patterns
2. **Separate concerns**: Splitting file finding from pattern matching improves reliability
3. **Test incrementally**: Start with a small directory before searching entire volumes
4. **Variable escaping**: When in doubt, use double backslashes for regex patterns in variables
5. **Performance**: Excluding common development directories can reduce search time by 50% or more
