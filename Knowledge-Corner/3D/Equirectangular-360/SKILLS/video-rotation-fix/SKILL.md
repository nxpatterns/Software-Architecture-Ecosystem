---
name: video-rotation-fix
description: Fix old mobile videos (MP4, MOV) that show only audio but no image on modern macOS, caused by rotation metadata not being honored by newer players. Use this skill whenever the user mentions videos that play without a picture, old smartphone videos that are broken, videos with only audio visible, portrait/landscape orientation issues in video files, or wants to batch-convert a collection of old phone videos. Also trigger when the user asks to "fix" or "convert" video files from old Android or iPhone recordings from ~2010-2016. Even if the user only uploads one file as a sample, assume they have many more and offer a batch script.
---

# Video Rotation Fix Skill

## Problem

Old smartphones (Android/iOS, ~2010–2016) stored portrait-mode video using a rotation metadata tag rather than physically rotating the pixels. Modern macOS versions stopped honoring this tag, causing the video to appear black or show no image while audio still plays.

## Diagnosis First

Before converting, always run `ffprobe` to confirm the root cause:

```bash
ffprobe -v quiet -print_format json -show_streams "$FILE" 2>/dev/null
```

Look for:
- `side_data_type: "Display Matrix"` with a `rotation` value (typically -90, 90, or 270)
- `codec_name`: should be `h264` (if it's something exotic like `mjpeg` or `wmv2`, the problem may be different)

If rotation metadata is present: apply the fix below.
If no rotation tag but video still broken: investigate codec compatibility instead.

## The Fix

Re-encode with rotation baked into pixels and strip the metadata tag:

```bash
ffmpeg -i "$INPUT" \
  -vf "transpose=1" \
  -c:v libx264 -crf 18 -preset slow \
  -c:a copy \
  -metadata:s:v rotate=0 \
  "$OUTPUT"
```

### Transpose values by rotation:
| Original rotation tag | transpose value |
|---|---|
| -90 (most common Android) | `transpose=1` |
| 90 | `transpose=2` |
| 180 | `transpose=1,transpose=1` |
| 270 | `transpose=2,transpose=2` |

### Quality settings:
- `crf 18` = high quality, visually lossless. Range 0–51; lower = better.
- `crf 23` = good quality, smaller file
- `-preset slow` = better compression (takes longer). Options: ultrafast, fast, medium, slow, veryslow

## Single File (Claude converts it directly)

When the user uploads a file:
1. Run ffprobe, identify rotation value
2. Pick correct transpose filter
3. Run ffmpeg conversion
4. Copy output to `/mnt/user-data/outputs/`
5. Present file and confirm it looks correct

## Batch Script for Mac (give this to the user)

Always provide this script so the user can process their full collection locally. They need `ffmpeg` installed via Homebrew (`brew install ffmpeg`).

```bash
#!/bin/bash
# fix_videos.sh — Fix rotation-broken phone videos for macOS
# Usage: Place in the folder with your videos and run: bash fix_videos.sh
# Requires: ffmpeg (brew install ffmpeg)

mkdir -p fixed

for f in *.mp4 *.MP4 *.mov *.MOV *.3gp; do
  [ -f "$f" ] || continue

  ROTATION=$(ffprobe -v quiet -select_streams v:0 \
    -show_entries side_data=rotation \
    -of default=noprint_wrappers=1:nokey=1 "$f" 2>/dev/null)

  case "$ROTATION" in
    "-90"|"270")
      VF="transpose=1"
      ;;
    "90")
      VF="transpose=2"
      ;;
    "180")
      VF="transpose=1,transpose=1"
      ;;
    *)
      VF=""
      ;;
  esac

  OUT="fixed/${f%.*}_fixed.mp4"

  if [ -n "$VF" ]; then
    echo "Fixing rotation ($ROTATION°): $f"
    ffmpeg -i "$f" -vf "$VF" -c:v libx264 -crf 18 \
      -c:a copy -metadata:s:v rotate=0 "$OUT" -y
  else
    echo "No rotation issue found, re-encoding for compatibility: $f"
    ffmpeg -i "$f" -c:v libx264 -crf 18 -c:a copy "$OUT" -y
  fi
done

echo "Done. Fixed files are in the 'fixed' folder."
```

## Common Issues

**Output video is upside-down or mirrored**: Wrong transpose value. Ask the user which way it needs rotating and adjust.

**File is very large**: Lower quality slightly with `-crf 23` instead of `-crf 18`, or add `-preset fast`.

**Codec other than h264**: If `codec_name` is something exotic (e.g. `mpeg4`, `mjpeg`, `wmv`), the same `-c:v libx264` approach still works — ffmpeg handles the input codec automatically.

**Audio out of sync after conversion**: Add `-async 1` to the ffmpeg command.

**Script skips files**: Check file extension case. The script handles `.mp4`, `.MP4`, `.mov`, `.MOV`, `.3gp`. Add more as needed.
