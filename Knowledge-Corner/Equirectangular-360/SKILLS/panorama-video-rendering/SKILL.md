---
name: panorama-video-rendering
description: >
  Technical reference for rendering equirectangular panorama images into flat
  perspective MP4 videos using FFmpeg's v360 filter with animated yaw rotation.
  Use this skill whenever the user is working on panorama-to-video conversion,
  virtual tour video export, v360 filter configuration, sendcmd animation,
  equirectangular projection, or ffmpeg jitter/smoothness issues with rotating
  panoramas. Also trigger when the user asks about xfade scene transitions,
  CRF settings for panorama content, or input clock timing with -loop 1 and
  still images. Especially trigger when motion looks correct frame-by-frame
  but viewers still report perceived stuttering or jitter — this is often
  H.264 compression behaving badly on smooth pans, not a motion problem.
  Even if the user only mentions "panorama video", "360 video render", or
  "v360 smooth" — use this skill.
---

# Panorama Video Rendering with FFmpeg v360

This skill covers everything needed to render equirectangular panorama images
into smooth, correctly-projected MP4 videos with animated camera rotation and
scene transitions.

**When in doubt, read `references/rendering-notes.md` — it contains the full
detail including all hard-won lessons, diagnostic procedures, and working code.**

---

## Quick Reference

### Correct v360 Filter String

```
v360=e:flat:ih_fov=360:iv_fov=180:h_fov=120:v_fov=88.51:yaw=<START>:pitch=0:w=1920:h=1080:interp=cubic
```

`ih_fov=360:iv_fov=180` is **mandatory** — without it v360 distorts the image.

### v_fov Formula (16:9)
```
v_fov = 2 · atan(tan(h_fov/2) · H/W) · (180/π)
h_fov=120 → v_fov≈88.51   h_fov=90 → v_fov≈58.72
```

### FFmpeg Invocation (with timing fix)

```bash
ffmpeg -y \
  -loop 1 -framerate 30 -t <duration> \
  -i panorama.jpg \
  -vf "fps=30,setpts=N/30/TB,sendcmd=f=/tmp/scene.sendcmd,v360=e:flat:ih_fov=360:iv_fov=180:h_fov=120:v_fov=88.51:yaw=<START>:pitch=0:w=1920:h=1080:interp=cubic" \
  -c:v libx264 -preset medium -crf 19 -pix_fmt yuv420p -an \
  output.mp4
```

Key points:
- `-framerate 30` before `-i` (input option, not output)
- `-r 30` removed (replaced by `fps=30` in filter)
- `fps=30,setpts=N/30/TB,` prepended to filter chain (fixes PTS jitter)
- `-crf 19` for panning panorama content (see "Encoding" below)

### sendcmd File Generation (additive/delta mode)

In FFmpeg 7.x static builds, sendcmd yaw is **additive** (+=), not absolute (=).
Send constant per-frame deltas. Use half-frame timestamp offset.

```
# Each line: (frame + 0.5) / fps seconds, constant delta value
0.0167 [enter] v360 yaw 0.333333;
0.0500 [enter] v360 yaw 0.333333;
0.0833 [enter] v360 yaw 0.333333;
...
```

Delta = total_degrees / total_frames  (e.g. 360 / (36×30) = 0.333333°/frame)

### Recommended Encoding Settings

| Parameter | Value | Notes |
|-----------|-------|-------|
| crf | **19** | Field-verified on YouTube delivery. CRF 23 looks smooth pixel-wise but viewers perceive H.264 compression artifacts on smooth pans as motion jitter. |
| preset | medium | `slow` gives ~10% smaller files for the same quality if size matters. |
| interp | cubic | lanczos is marginally sharper but slower; not worth it for downsampled output. |
| pix_fmt | yuv420p | yuv444p was tested and provides no perceived smoothness benefit once CRF is lowered. Stay on 420 for platform compatibility. |

**Cost of CRF 19:** Files are roughly 3× larger than CRF 23. Typical 4-scene
1920×1080/30fps/30s-per-scene tour: 250–350 MB instead of 80–100 MB. Accept
this trade-off; perceived smoothness is the deliverable.

---

## Known Issues and Diagnostics

### sendcmd Additive vs. Absolute

**Always verify** the behavior in your specific FFmpeg build before writing animation code.

Run the diagnostic in `references/rendering-notes.md` → section "Diagnostic: Additive vs. Absolute".

### Jitter / Uneven Motion (timing)

**Cause:** PTS misalignment between `-loop 1` still image input and output frame
clock. Input JPEGs have varying embedded frame rates (25 or 30 fps observed);
sendcmd fires on input PTS, so commands land between output frames.

**Fix:** `-framerate 30` + `fps=30,setpts=N/30/TB,` (see invocation above).

### Perceived Jitter Despite Verified-Correct Motion

**Symptom:** Pixel-level diagnostics confirm uniform per-frame motion (math is
right), but viewers still report the output "feels jerky" during playback.

**Cause:** H.264 compression artifacts during smooth pans on detail-rich
content (textured walls, cobblestones, foliage). Artifacts shift position
each frame and the eye reads them as motion stutter.

**Fix:** Lower CRF to 19 (or 18). Do not chase this with interpolation methods,
easing functions, frame rate changes, or motion blur — those are masks for the
wrong problem.

**Diagnostic:** Test the output on the actual delivery channel (YouTube upload,
target social platform). Local players like QuickTime have their own judder
behavior that can mislead. If it looks fine on YouTube, ship it.

### xfade Offset Formula

```
offset[i] = i × (segment_duration − fade_duration)
```

---

## Full Reference

For complete details, working code examples, Python projection implementation,
and all diagnostic procedures:

→ Read `references/rendering-notes.md`
