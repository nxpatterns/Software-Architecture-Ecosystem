# Rendering Equirectangular Panoramas to Video with FFmpeg

## What and Why

Virtual tours typically consist of equirectangular panorama images (the standard 2:1 format covering the full 360°×180° sphere). When you want to export a tour as a conventional flat video — for YouTube, social media, or archival — you need to:

1. Project each equirectangular frame into a normal perspective viewport (as a viewer would see it)
2. Animate the camera (yaw rotation) across the panorama
3. Transition between multiple panoramas (scenes)
4. Encode the result as H.264 MP4

FFmpeg's `v360` filter handles the projection math. Getting the animation smooth and the output correct requires understanding several non-obvious details, all documented here.

---

## The Projection: v360 Filter

### Correct Filter Parameters

For equirectangular input → flat perspective output:

```plaintext
v360=e:flat:ih_fov=360:iv_fov=180:h_fov=120:v_fov=88.51:yaw=0:pitch=0:w=1920:h=1080:interp=cubic
```

| Parameter | Value | Explanation |
| --- | --- | --- |
| `e` | input format | equirectangular |
| `flat` | output format | rectilinear perspective (what a normal camera sees) |
| `ih_fov=360` | input horizontal FOV | **required** — full equirectangular is 360° wide |
| `iv_fov=180` | input vertical FOV | **required** — full equirectangular is 180° tall |
| `h_fov=120` | output horizontal FOV | matches Pannellum default; 90° is more natural, 120° is wider |
| `v_fov=88.51` | output vertical FOV | derived: `2·atan(tan(h_fov/2)·H/W)` for 16:9 → 88.51° |
| `yaw` | starting angle | initial camera direction in degrees |
| `pitch=0` | vertical angle | 0 = level horizon |
| `interp=cubic` | interpolation | cubic is a good balance of quality and speed; lanczos is sharper but slower and can cause larger file sizes |

### Critical: ih_fov and iv_fov are Mandatory

Without `ih_fov=360:iv_fov=180`, v360 uses wrong internal defaults and produces distorted output — the top and bottom of the image get warped. This is not obvious from the FFmpeg documentation and is a common source of confusion.

### v_fov Formula

```plaintext
v_fov = 2 · atan(tan(h_fov/2) · H/W) · (180/π)
```

For 16:9 (1920×1080) with h_fov=120: `v_fov ≈ 88.51°`  
For 16:9 with h_fov=90: `v_fov ≈ 58.72°`

---

## Animating the Camera: sendcmd

### The Problem

`v360`'s `yaw` parameter is declared as a plain float (`AV_OPT_TYPE_FLOAT`). It cannot accept per-frame expressions like `yaw='33+10*t'`. The only way to change yaw per-frame is via FFmpeg's `sendcmd` filter, which injects option updates at specific timestamps.

### How sendcmd Works (Critical Findings)

**sendcmd behavior depends on FFmpeg version.** In FFmpeg 7.x static builds, `v360 yaw` via sendcmd is **additive** — each value sent is **added** to the current yaw, not set absolutely.

This was verified empirically: sending constant `yaw=45.0` every frame produced rotation (not a static image), proving additive behavior. In contrast, some older FFmpeg versions treat it as absolute SET.

**Always verify this in your specific build** with the diagnostic below before writing animation code.

### Diagnostic: Additive vs. Absolute

```bash
# Create a sendcmd file with constant value 1.0 every frame
cat > /tmp/diag.sendcmd << EOF
0.0167 [enter] v360 yaw 1.0;
0.0500 [enter] v360 yaw 1.0;
0.0833 [enter] v360 yaw 1.0;
0.1167 [enter] v360 yaw 1.0;
0.1500 [enter] v360 yaw 1.0;
EOF

ffmpeg -y -loop 1 -framerate 30 -t 0.2 \
  -i input.jpg \
  -vf "fps=30,setpts=N/30/TB,sendcmd=f=/tmp/diag.sendcmd,v360=e:flat:ih_fov=360:iv_fov=180:h_fov=120:v_fov=88.51:yaw=0:pitch=0:w=640:h=360:interp=cubic" \
  -c:v libx264 -preset ultrafast -crf 30 /tmp/diag.mp4

ffmpeg -i /tmp/diag.mp4 -vsync 0 /tmp/diag_f%02d.png -y
```

Extract all frames and compare visually:

- **Static image across all frames** → sendcmd is absolute (SET). Use absolute yaw values.
- **Uniform rotation each frame** → sendcmd is additive. Use delta values (see below).
- **Irregular/jerky rotation** → timing misalignment (see section below).

### sendcmd File Format

```plaintext
<timestamp_seconds> [enter] v360 yaw <value>;
```

One entry per frame. Timestamps use `(frame + 0.5) / fps` — the half-frame offset ensures each command fires safely inside the frame interval, not on the boundary where rounding can push it into the wrong frame.

### Generating the sendcmd File (Additive / Delta Mode)

When sendcmd is additive, send the per-frame delta (constant for uniform rotation):

```typescript
function generateSendcmdFile(
  startYaw: number,
  totalDegrees: number,
  durationSeconds: number,
  fps: number
): string {
  const totalFrames = durationSeconds * fps;
  const delta = totalDegrees / totalFrames; // degrees per frame
  const lines: string[] = [];

  for (let frame = 0; frame < totalFrames; frame++) {
    // Half-frame offset: command fires at frame center
    const t = ((frame + 0.5) / fps).toFixed(4);
    lines.push(`${t} [enter] v360 yaw ${delta.toFixed(6)};`);
  }

  return lines.join('\n') + '\n';
}
```

The v360 filter is initialized with `yaw=startYaw` in the filter string. The first delta step then adds one frame's worth of rotation on top. No special-casing for frame 0 needed.

---

## The Timing Problem: Jitter

### Root Cause

Even with mathematically correct sendcmd timestamps, jitter (uneven frame-to-frame motion) can occur. The cause: when using `-loop 1 -r 30` with a single image, FFmpeg interprets the input according to the JPEG's embedded frame rate metadata (commonly 25fps or 30fps depending on the source) while the output runs at the rate set by `-r`. sendcmd fires on **input PTS**, not output frame index. This misalignment causes some frames to receive two commands (double delta = double jump) and others to receive none (no movement).

### The Fix: Lock the Input Timeline

Two changes to the FFmpeg invocation:

1. Use `-framerate 30` before `-i` (sets input frame rate before decoding, not after)
2. Prepend `fps=30,setpts=N/30/TB,` to the filter chain

```bash
ffmpeg -y \
  -loop 1 -framerate 30 -t <duration> \
  -i input.jpg \
  -vf "fps=30,setpts=N/30/TB,sendcmd=f=/tmp/script.sendcmd,v360=e:flat:..." \
  -c:v libx264 -preset medium -crf 19 \
  -pix_fmt yuv420p -an \
  output.mp4
```

`setpts=N/30/TB` rewrites every frame's presentation timestamp to exactly `N/30` seconds (where N is the frame index). After this, sendcmd timestamps at `0.0167, 0.0500, 0.0833, ...` align perfectly with frame PTS.

**Key point:** `-framerate` is an input option and must come **before** `-i`. The older `-r` flag placed before `-i` does not reliably set the input timebase in all FFmpeg versions.

---

## Perceived Jitter that is NOT a Motion Problem

This is the most expensive lesson in this skill. Read it carefully if motion math is verified correct but viewers still report stuttering.

### Symptom

Pixel-level diagnostics (see "Long-Range Drift Diagnostic" below) confirm uniform per-frame motion across the entire render duration. The math is provably right. But viewers still describe the output as "jerky", "stuttering", or "not smooth".

### Cause

H.264 inter-frame prediction compresses panning scenes aggressively. On detail-rich content typical of architectural panoramas — textured brick walls, cobblestone pavement, ornamental metalwork, foliage — moderate quality settings (CRF 22–25) produce subtle blocking artifacts during the pan. The artifacts shift position with each frame. The human eye reads this position-shifting artifact pattern as motion jitter, even though the underlying motion is geometrically perfect.

### The Fix

Lower CRF significantly. CRF 19 has been field-verified as the threshold below which this perception goes away on YouTube-delivered output. CRF 18 also works. CRF 23 (a common default) does not.

```bash
-c:v libx264 -preset medium -crf 19 -pix_fmt yuv420p
```

Keep `yuv420p`. Testing with `yuv444p` did not provide additional perceived smoothness once CRF was lowered. `yuv420p` is YouTube-compatible and re-encoded to 420 server-side anyway.

### What NOT to Try

When facing this symptom, the wrong-but-tempting fixes are:

- **Tuning interpolation methods** (lanczos vs. cubic vs. spline16). These are spatial sampling filters. They affect per-frame rendering, not how the codec handles motion. Cannot fix this.
- **Easing functions on deltas.** The deltas are already mathematically uniform. Adding easing on top of compression-as-jitter would just produce a different bad motion curve.
- **Motion interpolation filters (`minterp`, `tmix`).** They blend frames together. The result is blurred jitter, not solved jitter. They mask the symptom.
- **Higher internal frame rate (60 fps → 30 fps).** Doubles compute cost. Not the right tool for a compression problem.
- **Custom Python renderer.** Bypasses the codec issue entirely by rendering perfect frames, but the codec then still has to compress them and the same artifacts appear unless CRF is also lowered.

The right fix is the encoder setting. Try CRF first.

### Validation: Test on the Actual Delivery Channel

Local players (QuickTime, Preview, even VLC) handle frame rate, vsync, and codec decode differently from the target delivery platform. A video can look jerky in QuickTime but fine on YouTube, or vice versa.

**Before debugging perceived smoothness for hours, do this 5-minute test:**

1. Upload the rendered output to YouTube as an unlisted video.
2. Watch it back through the YouTube player at the same resolution viewers will see.
3. Compare against your local-player perception.

If it looks fine on YouTube, ship it. If it doesn't, the renderer needs work. Either way, you have data instead of guessing.

---

## Diagnostics

### Short-Range Timing Diagnostic

Verifies that sendcmd timestamps align with output frame PTS. Run this whenever output motion looks uneven.

```bash
cat > /tmp/diag.sendcmd << EOF
0.0167 [enter] v360 yaw 1.0;
0.0500 [enter] v360 yaw 1.0;
0.0833 [enter] v360 yaw 1.0;
0.1167 [enter] v360 yaw 1.0;
0.1500 [enter] v360 yaw 1.0;
EOF

ffmpeg -y -loop 1 -framerate 30 -t 0.2 \
  -i input.jpg \
  -vf "fps=30,setpts=N/30/TB,sendcmd=f=/tmp/diag.sendcmd,v360=e:flat:ih_fov=360:iv_fov=180:h_fov=120:v_fov=88.51:yaw=0:pitch=0:w=640:h=360:interp=cubic" \
  -c:v libx264 -preset ultrafast -crf 30 /tmp/diag.mp4

ffmpeg -i /tmp/diag.mp4 -vsync 0 /tmp/diag_f%02d.png -y
```

Extract frames and compare consecutive pairs visually. Each step should show identical motion magnitude. If some pairs show no motion and others show 2-3× the expected delta, timing is misaligned — re-check the timing fix above.

### Long-Range Drift Diagnostic

Confirms that delta-additive sendcmd math does not accumulate floating-point error over a full render. Run this once to validate the implementation; not needed routinely.

```bash
# Generate sendcmd for full production render (e.g. 30s at 30fps = 900 frames)
# 'awk' works inside slim containers without Python
awk 'BEGIN {
  fps = 30; total = 900; delta = 360.0 / total
  for (f = 0; f < total; f++) {
    t = (f + 0.5) / fps
    printf "%.4f [enter] v360 yaw %.6f;\n", t, delta
  }
}' > /tmp/real.sendcmd

# Render at production settings
ffmpeg -y -loop 1 -framerate 30 -t 30 \
  -i panorama.jpg \
  -vf "fps=30,setpts=N/30/TB,sendcmd=f=/tmp/real.sendcmd,v360=e:flat:ih_fov=360:iv_fov=180:h_fov=120:v_fov=88.51:yaw=0:pitch=0:w=1920:h=1080:interp=cubic" \
  -c:v libx264 -preset medium -crf 19 -pix_fmt yuv420p \
  /tmp/full.mp4

# Extract frames at early, middle, late timestamps via SEEK (not select filter).
# The select=eq(n,N) filter can silently fail for high frame indices on some
# codecs; time-based seek is more reliable.
ffmpeg -y -ss 1.000  -i /tmp/full.mp4 -frames:v 1 /tmp/early1.png
ffmpeg -y -ss 1.033  -i /tmp/full.mp4 -frames:v 1 /tmp/early2.png
ffmpeg -y -ss 15.000 -i /tmp/full.mp4 -frames:v 1 /tmp/mid1.png
ffmpeg -y -ss 15.033 -i /tmp/full.mp4 -frames:v 1 /tmp/mid2.png
ffmpeg -y -ss 29.000 -i /tmp/full.mp4 -frames:v 1 /tmp/late1.png
ffmpeg -y -ss 29.033 -i /tmp/full.mp4 -frames:v 1 /tmp/late2.png
```

Visually compare the motion between each pair (early1↔early2, mid1↔mid2, late1↔late2). The motion magnitude per frame should look identical across all three regions. If late pairs show visibly different magnitude than early pairs, floating-point drift has accumulated — switch from pure additive deltas to recalculating yaw from absolute target positions per frame.

In practice, at 30fps over 900 frames at delta ≈ 0.4°, no drift has been observed with this approach.

---

## Scene Transitions: xfade

For crossfading between multiple scene segments, use FFmpeg's `xfade` filter in a single filter_complex pass:

```bash
ffmpeg -y \
  -i scene_0.mp4 -i scene_1.mp4 -i scene_2.mp4 -i scene_3.mp4 \
  -filter_complex "
    [0:v][1:v]xfade=transition=fade:duration=1:offset=35[v1];
    [v1][2:v]xfade=transition=fade:duration=1:offset=70[v2];
    [v2][3:v]xfade=transition=fade:duration=1:offset=105[vout]
  " \
  -map "[vout]" \
  -c:v libx264 -preset medium -crf 19 -pix_fmt yuv420p \
  -movflags +faststart \
  output_final.mp4
```

### xfade Offset Calculation

Each `offset` is the point in the **output timeline** where the fade begins:

```
offset[i] = i * (segment_duration - fade_duration)
```

For 36s segments with 1s fades:

- Fade 1: offset = 35
- Fade 2: offset = 70
- Fade 3: offset = 105

Each segment contributes `(duration - fade_duration)` seconds to the output timeline because the fade overlaps 1 second.

---

## Encoding Parameters

### CRF (Quality)

Equirectangular panorama rotation is high-motion content. The detail-rich nature of typical architectural panoramas (textures, ornamentation, foliage) makes them sensitive to H.264 compression artifacts that the eye reads as motion stutter rather than as compression noise. CRF must be lower than for typical video content.

| CRF | Quality | Notes |
|-----|---------|-------|
| 17  | Excellent | Diminishing returns vs. 19. Use if file size is not a concern. |
| **19** | **Production target** | Field-verified on YouTube delivery. Recommended starting point. |
| 18  | Very high | Indistinguishable from 19 in field testing. |
| 23  | Looks fine pixel-wise, but viewers report jitter on smooth pans | The classic trap. Avoid for panning panorama content. |
| 26+ | Visible artifacts on smooth gradients | Avoid. |

**Start at CRF=19.** File size at this setting on 1920×1080/30fps panoramas:
roughly 60–90 MB per 30-second scene. A 4-scene tour lands around 250–350 MB.
This is significantly larger than CRF 23 (80–100 MB total) but the perceived
smoothness improvement is the entire reason the file size matters.

### Pixel Format

Stay on `yuv420p`. Testing with `yuv444p` was done in the search for perceived smoothness and produced no additional benefit once CRF was lowered. `yuv420p` is universally compatible; `yuv444p` H.264 is not supported by all players and YouTube re-encodes to 420 for delivery anyway.

### Interpolation

| Option | Quality | Speed |
|--------|---------|-------|
| `interp=nearest` | poor | fastest |
| `interp=line` | ok | fast |
| `interp=cubic` | good | medium — recommended |
| `interp=lanczos` | best | slow — larger files due to sharper edges |

For rotating panorama video, `cubic` is the right tradeoff. `lanczos` adds sharpness that is largely imperceptible in motion and increases file size.

### Preset

`medium` is the default and a good baseline. `slow` gives roughly 10% smaller files for the same quality at the cost of longer render time. Worth it if file size is critical and render time is not.

---

## Complete Working Example

Single scene, 36 seconds, 10°/s rotation, 1920×1080, production-ready settings:

```bash
# 1. Generate sendcmd file (additive delta mode, half-frame offset)
# This example uses Python; awk works equivalently inside slim containers.
python3 - << 'EOF'
fps = 30
duration = 36
start_yaw = 33.2
total_degrees = 360.0
total_frames = duration * fps
delta = total_degrees / total_frames

lines = []
for frame in range(total_frames):
    t = (frame + 0.5) / fps
    lines.append(f"{t:.4f} [enter] v360 yaw {delta:.6f};")

with open("/tmp/scene.sendcmd", "w") as f:
    f.write("\n".join(lines) + "\n")
EOF

# 2. Render
ffmpeg -y \
  -loop 1 -framerate 30 -t 36 \
  -i panorama.jpg \
  -vf "fps=30,setpts=N/30/TB,sendcmd=f=/tmp/scene.sendcmd,v360=e:flat:ih_fov=360:iv_fov=180:h_fov=120:v_fov=88.51:yaw=33.2:pitch=0:w=1920:h=1080:interp=cubic" \
  -c:v libx264 -preset medium -crf 19 \
  -pix_fmt yuv420p -an \
  scene_output.mp4
```

---

## Projection Math Reference

For anyone who needs to implement the same projection outside FFmpeg (e.g. in Python/OpenCV for frame-by-frame rendering):

```python
import math
import numpy as np
import cv2

def render_frame(pano_bgr, yaw_deg, hfov_deg=120.0, w=1920, h=1080):
    """
    Equirectangular → rectilinear perspective projection.
    Mathematically identical to Pannellum's WebGL shader.
    """
    pH, pW = pano_bgr.shape[:2]
    f = 1.0 / math.tan(math.radians(hfov_deg) / 2.0)
    yaw = math.radians(yaw_deg)

    xs = (np.arange(w, dtype=np.float32) / (w - 1) - 0.5) * 2.0
    ys = -((np.arange(h, dtype=np.float32) / (h - 1) - 0.5) * 2.0)
    nx, ny = np.meshgrid(xs, ys)

    cx = (nx / f).astype(np.float32)
    cy = (ny / f * (h / w)).astype(np.float32)
    cz = np.ones((h, w), dtype=np.float32)
    n = np.sqrt(cx*cx + cy*cy + cz*cz)
    cx /= n; cy /= n; cz /= n

    c, s = math.cos(yaw), math.sin(yaw)
    wx = (c*cx + s*cz).astype(np.float32)
    wy = cy
    wz = (-s*cx + c*cz).astype(np.float32)

    lon = np.arctan2(wx, wz).astype(np.float32)
    lat = np.arcsin(np.clip(wy, -1.0, 1.0)).astype(np.float32)
    u = ((lon / math.pi + 1.0) / 2.0 % 1.0).astype(np.float32)
    v = np.clip((lat / (math.pi / 2.0) + 1.0) / 2.0, 0.0, 1.0).astype(np.float32)

    return cv2.remap(pano_bgr, u * (pW - 1), (1.0 - v) * (pH - 1), cv2.INTER_LINEAR)
```

This approach (Python + cv2.remap) bypasses sendcmd entirely and produces perfectly smooth rotation at exactly `speed * frame / fps` degrees per frame. It is slower than the FFmpeg-native path (roughly 12fps render speed at 1920×1080 on a modern laptop) but completely deterministic across all environments. Suitable for server-side rendering where correctness matters more than latency.

**Note:** Switching to the Python renderer does NOT fix the perceived-jitter-from-compression problem described above. The H.264 encoder still has to compress the frames and will still produce the same artifacts unless CRF is also lowered. The Python path solves motion math, not compression behavior.

---

## Summary of Key Lessons Learned

| Finding | Detail |
| --------- | -------- |
| `ih_fov=360:iv_fov=180` is mandatory | Without it, v360 distorts top/bottom of equirectangular images |
| sendcmd behavior varies by FFmpeg version | Always run the additive/absolute diagnostic before writing animation code |
| FFmpeg 7.x static build: sendcmd yaw is additive | Send per-frame deltas, not absolute values |
| Half-frame timestamp offset prevents jitter | Use `(frame + 0.5) / fps` not `frame / fps` for sendcmd timestamps |
| `-framerate` before `-i` + `setpts=N/fps/TB` fixes timing misalignment | Without this, input PTS and output frame PTS drift → irregular motion |
| **CRF=19 (not 23) for perceived smoothness** | **H.264 compression artifacts on detail-rich pans are misread as motion jitter. The classic "CRF=23 default" is too aggressive for this content type.** |
| `yuv420p` is sufficient | `yuv444p` was tested and gave no additional perceived benefit once CRF was lowered |
| `interp=cubic` over `interp=lanczos` | Lanczos adds negligible visible quality in motion but increases encode time and file size |
| xfade offset = `i * (duration - fade_duration)` | Common off-by-one: offset is from stream start, not segment start |
| **Test on actual delivery platform** | **Local players (QuickTime etc.) handle codec/refresh differently from target platforms. A 5-minute YouTube upload test rules out entire classes of false leads before debugging.** |
| **When math is verifiably correct but output still looks wrong, look outside the math** | **Compression, playback, refresh rate, codec behavior — these are all candidates for the actual cause. Verifying motion correctness pixel-by-pixel and still having a quality problem is the cue to switch domains.** |
| Time-based seek beats select filter for late-frame extraction | `ffmpeg -ss <time> -i file.mp4 -frames:v 1` is more reliable than `select=eq(n,N)` for high frame indices |
