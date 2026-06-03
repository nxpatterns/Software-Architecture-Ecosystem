# Panorama-to-Video Encoding: Performance Options & GPU Acceleration

## What This Document Is About

When you render equirectangular panorama images (full 360° spherical projections) into flat MP4 videos that simulate a virtual camera tour, the heavy lifting is done by FFmpeg's `v360` filter for the reprojection, plus a video encoder (typically libx264) for the output. This pipeline is CPU-bound and slow on server-grade machines without GPUs.

This document captures what is actually true about the performance landscape: where the bottlenecks are, what hardware acceleration can and cannot do, and where to rent GPUs if you decide to go that route. It exists because the question "is there something better than FFmpeg" gets a misleading answer if you only look at the encoder. The reprojection step is often the real constraint.

---

## Why FFmpeg Stays the Tool

For equirectangular-to-rectilinear reprojection with time-varying camera parameters (yaw, pitch, roll, FOV animated over the timeline), FFmpeg's `v360` filter combined with `sendcmd` is effectively the only practical CLI option. No other widely available command-line tool does this with comparable flexibility.

Alternatives exist but they don't fit a server-side batch rendering pipeline:

- Browser-based viewers like Pannellum or Marzipano render interactively, not to a file.
- Google's spatial media tooling is geared toward VR formats, not arbitrary reprojection.
- NVIDIA's VRWorks 360 Video SDK can do GPU-accelerated reprojection, but it requires custom integration and an NVIDIA GPU. Useful only at high volume.

So FFmpeg stays. The interesting question is how to make it faster.

---

## The Bottleneck Question (Read This First)

Before optimizing anything, identify whether your pipeline is encoder-bound or filter-bound. This single check determines whether GPU acceleration will help you at all.

Run:

```bash
ffmpeg -benchmark -i input -vf v360=...your_params... -f null -
```

This applies the filter chain but discards the output instead of encoding. Compare the resulting speed against a full encode. If the full encode is dramatically slower than the filter-only run, the encoder is your bottleneck and a hardware encoder will help. If they run at similar speeds, the `v360` filter is your bottleneck, and swapping x264 for NVENC will buy you very little.

This matters because **`v360` runs on the CPU**. Always. A GPU encoder (NVENC, VideoToolbox, VAAPI) accelerates only the encoding stage. If reprojection is your limit, you need either parallelization across multiple CPU cores or a fundamentally different approach (VRWorks 360, custom CUDA reprojection, or splitting the work into tiles).

People skip this check and buy GPU servers that don't help. Don't be one of them.

---

## Software-Side Optimizations (Free, Try First)

These cost nothing and often produce most of the achievable speedup before any hardware change.

**Encoder preset.** libx264's `ultrafast` preset is 5 to 10 times faster than `medium` at the cost of larger files for the same visual quality. For tour videos compressed to a target bitrate, the visual loss is often acceptable.

**Threading.** Make sure FFmpeg actually uses all your cores. Set `-threads 0` for the encoder, but for filter graphs you may also need `-filter_threads` and `-filter_complex_threads` explicitly. Watch CPU utilization during a render. If you see only one core pinned, threading is misconfigured.

**Parallelism strategy.** When you have many independent renders to do, running fewer parallel jobs with more threads each is often faster than running many parallel jobs with one thread each. Cache locality matters more than raw thread count above a certain point. Benchmark both shapes.

**Interpolation in `v360`.** The `interp` parameter affects both speed and quality:

- `bilinear` is fastest, visibly soft on panorama reprojection.
- `cubic` is the balanced default.
- `lanczos` is slowest and sharpest.

For social-media-bound short videos, `bilinear` is often good enough.

**x264 tuning under ultrafast.** Even with `-preset ultrafast`, you can squeeze more with `-x264-params` like `aq-mode=0:no-mbtree=1:sliced-threads=1`. Test on your actual content before adopting.

---

## Hardware Encoding: What It Actually Buys You

If your bottleneck is the encoder, hardware encoders give realistic speedups in roughly these ranges:

| Encoder | Hardware Required | Typical Speedup vs libx264 | Notes |
|---|---|---|---|
| `h264_nvenc` | NVIDIA GPU | 5 to 10x | Dedicated NVENC block on most NVIDIA cards from GTX 600 onward. Quality varies by generation. |
| `hevc_nvenc` | NVIDIA GPU | 5 to 10x | HEVC variant. Turing and later have much better quality. |
| `av1_nvenc` | NVIDIA Ada (RTX 40xx) and newer | 5 to 10x | Newest, best efficiency. Limited playback support still. |
| `h264_videotoolbox` | Apple Silicon or macOS | 3 to 5x | Local development only. |
| `h264_vaapi` | Intel/AMD GPU or iGPU | 2 to 4x | Quality is the weakest of the three. |
| `h264_qsv` | Intel CPU with Quick Sync | 3 to 5x | Quality decent on recent generations. |

### The Quality Caveat

NVENC and other hardware encoders use fixed-function silicon. They cannot match libx264 with `slow` or `veryslow` presets at low bitrates. The encoded files will be visibly worse at the same bitrate, or you'll need a higher bitrate for the same quality.

However, when comparing against libx264 `ultrafast`, NVENC on recent generations (Turing and later) is comparable or better. So the relevant comparison is "NVENC vs ultrafast," not "NVENC vs x264 at its best."

For content where visual quality matters (high-detail interiors, fine textures), encode a test clip with both and compare side by side at your target bitrate. Don't trust speedup numbers alone.

### NVENC Is a Block, Not Compute

NVENC is a dedicated hardware block on NVIDIA GPUs. It runs independently of CUDA cores. This means:

- A cheap GPU with the right NVENC generation can be just as fast at encoding as an expensive one. You do not need an H100. You don't even need an RTX 4090. An RTX 4000 or even a workstation card is plenty.
- AI training GPUs (A100, H100, B200) are massively overkill and wasteful for video encoding.
- The NVENC generation matters more than the GPU tier. Turing and later are good. Ada (RTX 40xx) is best, with AV1 support and improved quality.

---

## Where to Rent GPUs

GPU rental falls into roughly three categories. Pick based on your actual constraint: cost, compliance, or convenience.

### Spot Marketplaces (Cheapest)

**Vast.ai** is an Airbnb-style marketplace where individuals rent out hardware. Consumer GPUs (RTX 3090, RTX 4090) at the lowest prices anywhere, sometimes under $0.05/hr. Trade-off: hardware is owned by random people. Inappropriate for customer data or anything sensitive. Acceptable for processing your own non-confidential test renders.

### Specialized GPU Clouds (Balanced)

**RunPod**, **Lambda Labs**, **CoreWeave**, **Spheron**, and similar specialists run their own datacenters with per-second billing and Docker-based deployment. Prices for consumer-tier GPUs (RTX 4090) typically run $0.30 to $0.60/hr. They have EU regions if compliance matters. The standard model: spin up a pod, run your batch, shut it down. Ideal for intermittent workloads.

For ad-hoc batch encoding, this is usually the sweet spot. If you only render a few hours per week, on-demand specialist clouds beat owning anything.

### EU Hosted Dedicated (Compliance-Friendly)

**Hetzner** offers GPU dedicated servers (GEX line) with NVIDIA RTX 4000 SFF Ada or RTX 6000 Ada at flat monthly pricing. Hosted in Germany and Finland. Good fit if you need consistent GPU access and EU data residency.

**Scaleway** (France) and **OVH** (France, with global presence) offer hourly GPU instances in EU regions, also compliance-friendly.

These flat-rate dedicated options become attractive when your monthly GPU hours exceed what on-demand would cost.

### AI Hyperscaler Pricing (Skip This Tier)

AWS, GCP, and Azure GPU instances are roughly 3 to 6 times the price of specialist clouds for the same hardware, plus egress charges that can dominate the bill. Only relevant if you're already locked into one of those ecosystems for other reasons. For pure batch video encoding, ignore them.

### Pricing as of Mid-2026 (Will Change)

Consumer GPUs (RTX 4090, RTX 4000): $0.30 to $0.60/hr on specialist clouds, lower on marketplaces.

A100 80GB: roughly $1 to $3/hr. Not what you want for encoding.

H100: $1.50 to $7/hr depending on provider tier. Definitely not what you want for encoding.

GPU pricing has been declining steadily as supply catches up with demand. Check current rates before committing.

---

## Decision Framework

1. **Measure first.** Use `ffmpeg -benchmark` to find out whether the encoder or the filter is your bottleneck.

2. **If filter-bound,** GPU encoding will barely help. Look at parallelization, splitting rendering across machines, or specialized SDKs (VRWorks 360, custom GPU reprojection).

3. **If encoder-bound and low volume,** stay on CPU. Optimize software side (ultrafast preset, threading, x264 params). Cheaper than introducing GPU infrastructure.

4. **If encoder-bound and intermittent volume,** rent on a specialist GPU cloud (RunPod-class). Pay per hour, no commitment.

5. **If encoder-bound and consistent volume,** rent or buy a fixed GPU server, ideally a low-end NVIDIA Ada card. The math tips in favor of fixed infrastructure once you exceed roughly 80 to 100 hours of GPU time per month, depending on prices.

6. **Always test quality**, not just speed. Encode the same clip with your current pipeline and with the hardware option at your target bitrate. Compare visually.

---

## Common Mistakes (Lessons Learned)

**Believing that NVENC is universally faster than libx264.** NVENC is faster than libx264 at slow presets, comparable to libx264 at ultrafast. If you're already on ultrafast, your speedup from NVENC will be modest.

**Renting an H100 to encode video.** AI training GPUs and video encoders are separate silicon. You're paying for compute you don't use. A \$0.30/hr RTX 4090 has the same NVENC capability as a $7/hr H100.

**Assuming the encoder is the bottleneck.** On equirectangular reprojection, the filter is often the slower stage. Benchmark before optimizing.

**Ignoring egress costs.** Cloud GPU rentals often add $0.08 to $0.12/GB egress, which can match or exceed the GPU rental cost for video output. Specialist clouds typically have free or flat egress; hyperscalers do not.

**Not comparing quality at the target bitrate.** Speed wins on benchmarks. Quality wins on the customer's screen.

---

## Reference: FFmpeg Command Skeletons

CPU baseline with optimization:

```bash
ffmpeg -framerate 30 -loop 1 -i panorama.jpg \
  -filter_complex "fps=30,v360=e:rectilinear:yaw=0:pitch=0:interp=cubic,sendcmd=f=motion.cmd" \
  -t 30 -c:v libx264 -preset ultrafast -crf 19 -pix_fmt yuv420p \
  -threads 0 -filter_threads 0 output.mp4
```

NVENC variant (when you have an NVIDIA GPU):

```bash
ffmpeg -framerate 30 -loop 1 -i panorama.jpg \
  -filter_complex "fps=30,v360=e:rectilinear:yaw=0:pitch=0:interp=cubic,sendcmd=f=motion.cmd" \
  -t 30 -c:v h264_nvenc -preset p4 -tune hq -rc vbr -cq 23 -pix_fmt yuv420p \
  output.mp4
```

NVENC preset names differ from libx264. The NVENC scale is `p1` (fastest) through `p7` (slowest/best quality). `p4` is a reasonable starting point.
