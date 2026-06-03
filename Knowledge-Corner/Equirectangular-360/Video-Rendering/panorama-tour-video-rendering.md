# Rendering Equirectangular Panorama Tours as Video

A technical reference for converting virtual tour panoramas (equirectangular JPEGs of typical resolution 8192×4096) into video files for distribution. This document covers two distinct output modes:

1. **Guided 2D video** — A simulated camera performing a horizontal pan through each panorama, producing a flat MP4 suitable for any distribution channel.
2. **Interactive 360° video** — An equirectangular video with spatial-media metadata, enabling viewers on YouTube and Facebook to pan the camera themselves.

The two modes serve different purposes and have fundamentally different production pipelines. Choose the right one for the target channel, or produce both from the same source.

---

## Table of Contents

1. [Context: Why Two Different Outputs Exist](#context)
2. [Mode A: Guided 2D Video](#mode-a-guided-2d-video)
3. [Mode B: Interactive 360° Video](#mode-b-interactive-360-video)
4. [Choosing Between Modes](#choosing-between-modes)
5. [Lessons Learned](#lessons-learned)
6. [Quick Reference Card](#quick-reference-card)

---

## Context

### What is the source material?

A virtual tour consists of several **equirectangular panoramas** — single still images where a full spherical view (360° horizontal × 180° vertical) is projected onto a flat rectangle with a 2:1 aspect ratio. Resolution is typically 8192×4096 pixels. Each panorama represents one "scene" or "room" of the tour. Viewers normally consume these through an interactive web viewer (e.g. Pannellum) that lets them look around inside each panorama and jump between them.

### Why turn them into video?

A web viewer requires the viewer to actively visit a hosted page. Videos can be:

- Distributed on social media platforms (YouTube, Facebook, Instagram, LinkedIn, TikTok)
- Embedded in emails and newsletters
- Played passively in waiting rooms, lobbies, or trade show displays
- Indexed and discovered through platform algorithms

Different distribution channels have different requirements, which is the reason for two output modes.

### Why two modes and not one?

**Mode A** is a 2D video. Anyone can watch it on any platform without special player support. The downside is that the viewer has no control over what they see — the camera moves on a fixed path, decided at render time.

**Mode B** is an interactive 360° video. The viewer can rotate the camera with mouse, finger, or arrow keys. The downside is that this only works on platforms that support 360° playback (notably YouTube and Facebook). On other platforms, a 360° video plays as a distorted equirectangular image that looks broken.

Producing both gives reach (Mode A works everywhere) plus engagement on the platforms that support it (Mode B on YouTube/Facebook).

---

## Mode A: Guided 2D Video

### What it does

Renders a flat 16:9 video (typically 1920×1080) in which a virtual camera performs one complete 360° horizontal pan through each panorama, then crossfades to the next scene. The viewer is a passive spectator. The output looks like a video shot with a real camera mounted on a slow turntable.

### Why this is harder than it sounds

The naive approach — using ffmpeg's `scroll` filter or simple pixel translation — produces visibly stepped motion. The actual challenge has three layers:

1. **Projection math.** An equirectangular image is not the same as a flat image; sampling a perspective view from it requires the inverse projection. ffmpeg's `v360` filter handles this if configured correctly.
2. **Smooth camera motion over time.** Animating the camera direction frame by frame requires either ffmpeg's `sendcmd` mechanism or a custom frame-by-frame renderer.
3. **Compression at the encoding stage.** Even when the math is perfect, modern video codecs (H.264) can produce compression artifacts during smooth horizontal pans that look — to the viewer — like motion stutter. This is the trap that consumed most of the debugging time in this project.

### The Three Critical Discoveries

These are the non-obvious facts that determine whether the pipeline works or doesn't. Each was discovered by running into a wall and debugging out of it.

#### Discovery 1: Projection parameters

The `v360` filter requires explicit input field-of-view parameters when the input is equirectangular. The minimal correct invocation is:

```
v360=e:flat:ih_fov=360:iv_fov=180:h_fov=<output-fov>:v_fov=<derived>:yaw=<start>:pitch=0:w=<W>:h=<H>:interp=cubic
```

The `ih_fov=360:iv_fov=180` part is mandatory and not the default. Omitting it produces visibly distorted output (the top and bottom of the image stretch unnaturally). The documentation does not make this requirement obvious; it has to be specified to get correct results.

For a 16:9 output viewport with a horizontal FOV of 120°, the correct vertical FOV is:

```
v_fov = 2 · atan(tan(h_fov/2) · 9/16) ≈ 88.51°
```

Use a horizontal FOV in the 90°-120° range. Wider than 120° starts introducing visible barrel-like distortion at the edges, even with correct math. Narrower than 90° feels claustrophobic.

#### Discovery 2: sendcmd is additive, not absolute (build-dependent)

The `sendcmd` filter is the mechanism for animating filter parameters over time. The official documentation describes it as a SET operation: each command replaces the current value with the specified one. In practice, with at least some static ffmpeg builds, the v360 filter treats sendcmd `yaw` updates as ADDITIVE — each command adds its value to the previous yaw, rather than replacing it.

The implications are significant: if you write `yaw 90` at every frame expecting the camera to stay pointed at 90°, the camera will actually accelerate by 90° every frame and complete dozens of rotations within a few seconds.

**Sanity check to determine which behavior your build has:**

Generate a sendcmd file where every entry sets `yaw` to the same constant non-zero value. Render a short clip and inspect.

- If output is **static** → sendcmd is absolute (per documentation). Use absolute angle values for animation.
- If output **rotates** → sendcmd is additive. Use per-frame delta values for animation.

If your build is additive, the animation logic looks like this:

```typescript
const totalFrames = duration * fps;
const deltaPerFrame = totalDegreesOfRotation / totalFrames;
const lines: string[] = [];

for (let frame = 0; frame < totalFrames; frame++) {
  const t = ((frame + 0.5) / fps).toFixed(4);  // half-frame offset, see Discovery 3
  lines.push(`${t} [enter] v360 yaw ${deltaPerFrame.toFixed(6)};`);
}
```

The v360 filter is initialized with the starting yaw via the filter string itself (`yaw=<start>`). The sendcmd entries then accumulate deltas from that starting point. Do not include the start yaw in the first delta — that would double-count and produce a hard jump at the beginning of the scene.

**Why this discrepancy with the docs exists** is unclear. It may be a quirk of specific static builds, or a v360-specific behavior. The point is: do not trust documentation alone for filter-runtime-command behavior. Always run the sanity check on the actual binary you will deploy with.

#### Discovery 3: sendcmd timestamps must align with output frame PTS

Even when sendcmd values are mathematically correct, the rotation can appear jittery. The cause is a timing misalignment between when sendcmd commands fire (driven by input PTS) and when output frames are generated (driven by output PTS). The two clocks are not automatically synchronized when the input is a still image.

When you feed ffmpeg a JPEG with `-loop 1`, the input's embedded frame rate metadata drives the filter graph's internal clock. Different JPEGs have different embedded frame rates (commonly 25 or 30 fps depending on the camera or stitching software that produced them). If output frame rate is set via `-r 30`, that only affects output muxing — the internal filter clock still follows the input's embedded rate. Result: sendcmd commands at timestamps 0.0000, 0.0333, 0.0667... do not align with frame boundaries. Some frames receive two commands (double delta, visible jump), others receive none (no motion).

**The fix has three parts, all required:**

1. Set input rate explicitly with `-framerate` (not `-r`):
   ```
   -loop 1 -framerate 30 -t <duration> -i image.jpg
   ```
   `-framerate` is an input option that sets the input clock. `-r` is an output option that sets the output muxing rate. With still images, `-framerate` is what you need.

2. Prepend timing normalization filters before sendcmd in the filter chain:
   ```
   fps=30,setpts=N/30/TB,sendcmd=f=script.txt,v360=...
   ```
   The `fps=30` filter normalizes the frame rate; `setpts=N/30/TB` rewrites timestamps so each frame N has PTS = N/30 seconds exactly. After this normalization, sendcmd timestamps align with frame boundaries.

3. Offset sendcmd timestamps by half a frame to avoid edge cases:
   ```
   t = (frame + 0.5) / fps
   ```
   Commands fire at frame centers (0.0167s, 0.0500s, 0.0833s...) rather than edges (0.0000s, 0.0333s, 0.0667s...). This prevents floating-point boundary cases from pushing a command into the wrong frame interval.

**Diagnostic for verifying timing alignment:**

Generate a sendcmd file with N identical constant-delta commands at perfectly spaced timestamps. Render a clip slightly longer than N/fps seconds. Extract individual frames. If per-frame motion is visually equal in magnitude across all frames, timing is aligned. If some pairs show no motion while others show double motion, timing is broken — re-check the three fixes above.

### Discovery 4: Perceived "jitter" can be a compression problem, not a motion problem

After all motion-math problems are solved and verified correct (typically via pixel-level frame comparison), viewers may still report that the output looks jerky during the pan. The trap is to assume this is still a motion-math problem and to keep tuning interpolation methods, easing functions, or frame rates.

The real cause: H.264 compresses panning scenes aggressively via inter-frame prediction. At moderate quality settings (CRF 22-25), smooth horizontal pans over detail-rich content (textured walls, ornamental details, cobblestones, foliage) produce subtle blocking artifacts. The artifacts shift position with each frame, which the eye reads as motion stutter rather than as compression noise.

**The fix is encoder settings, not motion logic:**

- Lower CRF to 17-19. The default CRF 23 is too aggressive for panning content with this much detail.
- Keep `yuv420p` pixel format (YouTube-compatible). `yuv444p` does not provide additional perceived smoothness once CRF is lowered.
- Use `preset medium` or `slow` for better compression efficiency at the same quality.

**Cost:** File sizes roughly triple when going from CRF 23 to CRF 19. For typical 4-scene tours at 1920×1080/30fps/30s-per-scene, expect 250-350 MB instead of 80-100 MB. Accept this as the cost of perceived smoothness.

**The deeper lesson:** When motion looks wrong, test on the actual delivery channel (YouTube, the destination social platform) before debugging the renderer. A 5-minute upload test can rule out an entire category of false leads.

### Verifying End-to-End Correctness

Three diagnostics, in order of how often you'll need them:

**Diagnostic 1: Short-range timing test**

Generate a sendcmd file with 5 identical constant-delta entries at spaced timestamps. Render 0.2 seconds of video. Extract 6 frames. Visually confirm per-frame motion magnitude is uniform.

**Diagnostic 2: Sendcmd absolute vs. additive test**

Generate a sendcmd file with the same non-zero yaw value repeated for every frame. Render a short clip. Inspect: if static, sendcmd is absolute; if rotating, sendcmd is additive. Run this once per ffmpeg build and after any version upgrade.

**Diagnostic 3: Long-range accumulation drift test**

Render a full-length production clip (e.g. 30 seconds). Extract frames at the beginning, middle, and end (via time-based seek, e.g. `ffmpeg -ss <time> -i file.mp4 -frames:v 1 out.png`). Compare per-frame motion magnitude in each region. If late frames show different motion magnitude than early frames, floating-point error has accumulated in the delta-additive case — recalculate deltas from absolute target positions instead of pure accumulation. In practice, this drift was negligible at 30fps over 900 frames, but the test is cheap and worth running once.

### Final Mode A Pipeline Summary

```
INPUT:  one equirectangular JPEG per scene (8192×4096)
        starting yaw angle per scene (where the camera points initially)
        rotation parameters (duration, total degrees, fps)

PER SCENE:
  1. Generate sendcmd file with per-frame yaw deltas
     (half-frame timestamps, constant delta value)
  2. Run ffmpeg with:
     - Input args: -loop 1 -framerate <fps> -t <duration> -i <jpeg>
     - Filter:     fps=<fps>,setpts=N/<fps>/TB,sendcmd=f=<file>,v360=e:flat:ih_fov=360:iv_fov=180:h_fov=<fov>:v_fov=<derived>:yaw=<start>:pitch=0:w=<W>:h=<H>:interp=cubic
     - Output:     -c:v libx264 -preset medium -crf 19 -pix_fmt yuv420p

CONCATENATION:
  Use ffmpeg's xfade filter to crossfade scenes
  Add audio track via amix or similar

OUTPUT: single MP4, 16:9 aspect ratio, suitable for any platform
```

### Why some seemingly-obvious alternatives don't work

A reference list of approaches that were tried or considered, and why they were rejected:

- **`scroll` filter for horizontal pan.** Uses integer pixel truncation internally; produces stepped motion at typical speeds. Not suitable for sub-5-pixel-per-frame motion.
- **Interpolation method tuning (lanczos vs. cubic vs. spline16).** These are spatial sampling filters. They affect how each frame is rendered, not how frames are timed. They cannot fix jitter caused by timing or by compression.
- **Motion interpolation filters (`minterp`, `tmix`).** Add blended intermediate frames. They mask the symptom but don't fix the underlying cause. Experimental in current ffmpeg builds.
- **Easing functions on per-frame deltas.** The deltas were already mathematically uniform; non-uniformity in motion came from external causes (timing or compression). Applying easing on top of misaligned timing would have made things worse.
- **Rendering at 60+ fps and downsampling.** A bandage for the wrong problem. Doubles compute cost. Not needed once the actual issue (compression) is identified.
- **Custom Python frame-by-frame renderer.** Works correctly when prototyped (e.g. using `cv2.remap` with appropriate projection math). Rejected because it adds heavy dependencies (opencv, numpy, image libraries) and loses ffmpeg's optimized pipeline. Worth keeping in mind as a fallback if ffmpeg+sendcmd ever breaks irreparably.
- **Expression-based yaw animation in v360.** The v360 filter's `yaw` parameter is declared as a plain float, not a string expression. It is evaluated once at filter initialization. Per-frame expressions are not supported through this parameter. sendcmd remains the only mechanism for animating it within ffmpeg.

---

## Mode B: Interactive 360° Video

### What it does

Produces an equirectangular video file with **spatial-media metadata** that signals to compatible players (YouTube, Facebook, VR headsets, VLC) that this is a 360° video. The player then renders the video on the inside of a virtual sphere and lets the viewer pan the camera with mouse, touch, or arrow keys.

### Why this is much simpler than Mode A

Mode B has no camera animation. Each frame is the full equirectangular panorama, unchanged. The viewer controls the camera, not the renderer. This eliminates the entire class of problems that Mode A had to solve:

- No projection math (the panorama is already in its native projection)
- No sendcmd, no yaw delta calculation, no timing alignment
- No motion-related compression artifacts

The actual challenge is different: producing a video with the correct file format characteristics and the correct metadata.

### File format requirements

YouTube's documented requirements for 360° upload:

- **Equirectangular projection**, 2:1 aspect ratio
- **Resolution**: 4K minimum recommended, with 7168×3584 or 8192×4096 being the sweet spot
- **Codec**: H.264 video, AAC audio
- **Frame rate**: 24, 25, 30, 48, 50, or 60 fps
- **Spatial-media metadata**: required for YouTube to recognize the video as 360°

Other platforms (Facebook, VLC) accept similar formats with the same metadata requirement.

### How the metadata works

The spatial-media metadata is a small block embedded in the MP4 container that signals "this is a 360° equirectangular video." Without it, the file plays as a normal flat (and visibly distorted) video.

Three ways to inject this metadata:

1. **Google's Spatial Media Metadata Injector** — the reference implementation. A Python tool from the `google/spatial-media` GitHub repository. CLI usage:
   ```
   python spatialmedia --inject input.mp4 output.mp4
   ```
   Reliable, well-tested, but adds a Python dependency.

2. **ffmpeg's built-in spatial metadata flags** — ffmpeg can write spherical metadata via `-metadata:s:v` flags. Whether YouTube reliably detects metadata written this way varies by ffmpeg version. Worth testing first because it eliminates the Python dependency. If YouTube doesn't recognize the video as 360°, fall back to option 1 or 3.

3. **Custom MP4 box manipulation** — re-implement the relevant subset of the spatial-media spec directly. The spec is straightforward (the project is open source under Apache 2.0). About 200 lines of code in any language with MP4 box manipulation libraries. Only worth doing if you have strong reasons to avoid both Python and the uncertainty of ffmpeg's metadata support.

### Scene composition for 360° video

Unlike Mode A, where each scene has a duration determined by the camera pan speed, Mode B scenes have a duration determined by **how long the viewer should be expected to explore each panorama** before the video advances to the next.

Typical choices:

- **8-15 seconds per scene** — viewer has time to look around but doesn't get bored. Standard for promotional tour videos.
- **Single longer scene** — concatenate all panoramas into one continuous experience, possibly with chapter markers for navigation. Useful when the viewer is expected to invest more time.
- **One scene per file** — produce separate videos for each panorama, link them as a playlist on YouTube. Allows the viewer to choose what to watch.

### Transitions between scenes

A separate design decision from Mode A. The natural options:

- **Hard cut** — instant change from one panorama to the next. Common in 360° tour videos because crossfades can be disorienting when the viewer is actively panning. The downside: jarring without preparation.

- **Crossfade** — same as Mode A. Simple to implement (reuse the xfade pipeline). Can be disorienting if the viewer is mid-pan during the transition.

- **Fade to black, then fade in** — industry-standard for 360° scene changes. Gives the viewer a moment to reset their head position to neutral. Slightly slower-paced but the safest choice for viewer comfort.

The third option is usually the right default unless there's a specific reason otherwise.

### Initial view direction

YouTube's 360° spec supports specifying an **initial yaw angle** in the metadata — the direction the viewer is facing when the video starts. This is critical for tour content: if the original virtual tour was designed so that viewers see a particular feature first (the main entrance, a focal point, a logo placement), that direction should be preserved as the initial yaw for each scene.

In a tour viewer like Pannellum, this is typically stored as `sceneForwardYaw` or equivalent. Pass that value through to the 360° video metadata so the viewer's initial orientation matches the tour designer's intent.

### Audio

Two reasonable choices:

- **Same audio track as Mode A** — mono or stereo, doesn't react to head rotation. Simple, works everywhere.
- **Ambisonic spatial audio** — 4-channel (B-format: W, X, Y, Z) audio that rotates with the viewer's head movement. Sounds positioned in space stay where they are as the viewer turns. Significantly more complex to produce (requires ambisonic source material or spatial mixing). Worth it for truly immersive content; overkill for typical tour videos.

Use the simple version unless there's a clear reason for ambisonic.

### Final Mode B Pipeline Summary

```
INPUT:  one equirectangular JPEG per scene (8192×4096, 2:1)
        duration per scene (typically 8-15 seconds)
        starting yaw per scene (preserved from tour design)
        optional: audio track

PER SCENE:
  1. Convert JPEG to short video clip:
     ffmpeg -loop 1 -framerate 30 -t <duration> -i <jpeg>
            -c:v libx264 -preset medium -crf 19 -pix_fmt yuv420p
            -vf scale=8192:4096  (if not already at this resolution)
            scene_<n>.mp4

CONCATENATION:
  2. Concatenate scenes with chosen transition style
     (fade-to-black recommended for viewer comfort)
  3. Mux audio track if present

METADATA INJECTION:
  4. Inject spatial-media metadata using one of:
     - Google's spatialmedia Python tool (reliable, requires Python)
     - ffmpeg's built-in spherical metadata flags (test first)
     - Custom implementation (only if avoiding both above)
  5. Include initial-yaw values per scene if the spec allows
     (current spatial-media spec scopes initial yaw at the file level,
      not per chapter — so per-scene initial yaw requires separate
      files or workarounds)

OUTPUT: single MP4, 2:1 equirectangular, with 360° metadata
        Verify by uploading as unlisted to YouTube and confirming
        the pan controls appear on the player
```

### Validation

After producing a Mode B output, always verify on the actual destination platform. Local players (QuickTime, VLC) do not always treat spatial-media metadata consistently. The authoritative test is:

1. Upload the file to YouTube as unlisted
2. Open the YouTube watch page
3. Confirm the pan-control button appears (typically a compass icon in the top-left of the player)
4. Confirm mouse/touch drag rotates the view

If the controls don't appear, the metadata was not written correctly. Re-inject with a different tool and re-test.

---

## Choosing Between Modes

| Aspect | Mode A (Guided 2D) | Mode B (Interactive 360°) |
|---|---|---|
| Distribution channels | Any platform | YouTube, Facebook, VR-capable players |
| Viewer experience | Passive | Active exploration |
| Producer control | Full control over what is shown | Viewer decides where to look |
| Production complexity | High (motion math, timing, compression) | Moderate (metadata, format requirements) |
| File size | Moderate (250-350 MB for typical tour) | Large (often 500 MB-1 GB; depends heavily on duration) |
| Renders required | One render per tour | One render per tour |
| Embed in email/website | Yes | No (most email clients and embedded players don't support 360°) |
| Demonstrates engagement metric value | Linear watch time | Watch time + interaction signals |

**When in doubt, produce both.** The source material is the same. The 8192×4096 panoramas needed for Mode B are also the natural input for Mode A. The two pipelines share the same input directory, the same scene metadata, and (where applicable) the same audio track. Building both as outputs of a single render system gives the most reach with the least redundant work.

---

## Lessons Learned

These are meta-observations distilled from the debugging process. They generalize beyond this specific project.

**1. When math is verifiably right but output looks wrong, look outside the math.** The instinct to keep debugging the obvious target (in this case, motion logic) can consume days. Compression, playback, display refresh, and codec behavior are all candidates for the actual cause. Verifying motion correctness via pixel-level frame comparison and then *still* having a quality problem is the cue to switch domains.

**2. "Feels jerky" is not a precise enough symptom.** Differentiate: motion that skips (timing), motion that's uneven (math), motion that has trailing artifacts (compression), motion that stutters at playback (player or refresh). Each has a different diagnostic and a different fix.

**3. Test on the actual delivery channel early.** What looks bad in a local player can look fine on the target platform, and vice versa. For video work specifically, a YouTube upload test takes 5 minutes and can rule out entire categories of false leads. Do this *before* committing to a major refactor.

**4. Don't trust documentation alone for runtime filter behavior.** sendcmd's documented behavior (absolute SET) did not match observed behavior (additive ADD) in the static build used here. The sanity check that revealed this took 30 seconds to run. Time spent before running it: hours. Run cheap sanity checks first.

**5. Don't anthropomorphize codec settings.** Reports that "X is better because it's prime" or similar non-mechanistic explanations are warning signs. The actual difference between adjacent CRF values is roughly 12% bitrate. If something performs better, look for a real reason (GOP structure, keyframe placement, content-specific compression efficiency) — and verify with a blind test before believing it.

**6. Document what didn't work, not just what did.** Every rejected approach has a cost. Future-you (or a colleague picking up the project) will be tempted to try them again. A short list of "this was tried; here's why it failed" saves more time than another success guide.

**7. Half-an-architecture is usually better than a full one written too early.** When a new requirement appears mid-project (e.g. "we also need 360° video"), the temptation is to redesign everything. Usually the right answer is to extend the existing pipeline with a parallel output, share the inputs, and only refactor common code once the new path is proven to work.

---

## Quick Reference Card

**For Mode A (guided 2D pan video):**

```
Filter chain (after timing fix):
fps=<fps>,setpts=N/<fps>/TB,sendcmd=f=<script>,v360=e:flat:ih_fov=360:iv_fov=180:h_fov=<H_FOV>:v_fov=<V_FOV>:yaw=<START>:pitch=0:w=<W>:h=<H>:interp=cubic

Input args:
-loop 1 -framerate <fps> -t <duration> -i <jpeg>

Encoder args:
-c:v libx264 -preset medium -crf 19 -pix_fmt yuv420p

V_FOV calculation for 16:9 output:
v_fov = 2 · atan(tan(h_fov/2) · 9/16)

sendcmd entry per frame (if additive):
<time> [enter] v360 yaw <delta>;
where time = (frame + 0.5) / fps
and delta = total_rotation_degrees / total_frames
```

**For Mode B (interactive 360° video):**

```
Per-scene render (no animation):
ffmpeg -loop 1 -framerate <fps> -t <duration> -i <jpeg>
       -c:v libx264 -preset medium -crf 19 -pix_fmt yuv420p
       scene_<n>.mp4

Metadata injection:
python spatialmedia --inject in.mp4 out.mp4

Validation:
Upload as unlisted to YouTube, confirm pan control appears in player.
```

**Sanity checks to run when something is wrong:**

1. Is sendcmd absolute or additive in this build? (Send constant yaw, check for rotation.)
2. Are sendcmd timestamps aligned with output frame PTS? (Send constant deltas, check for uniform motion.)
3. Has floating-point drift accumulated over a long render? (Compare frame deltas at start, middle, end.)
4. Does the issue persist on the actual delivery platform, or only locally? (Upload and re-watch.)
