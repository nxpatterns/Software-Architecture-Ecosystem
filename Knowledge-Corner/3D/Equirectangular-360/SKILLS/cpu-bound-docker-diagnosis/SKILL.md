---
name: cpu-bound-docker-diagnosis
description: Diagnose and fix CPU-bound Docker workloads that run slower than expected. Use when a user reports that a containerized workload underperforms — video encoding/rendering takes too long, FFmpeg/libx264 is slow, image or scientific processing pipelines crawl, or there is a large performance gap between a local development machine and a server (e.g. "rendering takes 4 minutes on my laptop and 30 minutes on the server"). Also triggers on phrases like "container uses fewer cores than expected", "workload not using full CPU", "Docker performance issue", "FFmpeg slow in container", "rendering slow", "my pipeline is slow", or any case where the symptom is wall-clock slowness of a CPU-intensive containerized job. Walks through CPU governor, Docker limits, hybrid CPU topology, application parallelism, and pipeline structure in a fixed diagnostic order. Use this skill even if the user only says "my container is slow" or "this is taking forever" — that vague phrasing is exactly the trigger.
---

# CPU-bound Docker workload diagnosis

When a containerized CPU-bound workload runs slower than expected, work through the layers below **in order**. Each layer is cheaper to check than the next and can fully explain the slowdown on its own. Do not skip ahead — application-level tuning done before fixing the environment produces parameters that are wrong once the environment is fixed.

## Layer 1 — CPU frequency governor

The Linux kernel governor decides how aggressively the CPU boosts under load. The default on many server distributions is `powersave`, which costs 20-40% on bursty CPU-heavy workloads.

```bash
cat /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor | sort -u
```

If the output is `powersave`, switch it:

```bash
echo performance | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor
```

This does not survive a reboot. To persist on Debian/Ubuntu:

```bash
sudo apt install cpufrequtils
echo 'GOVERNOR="performance"' | sudo tee /etc/default/cpufrequtils
sudo systemctl restart cpufrequtils
```

A `lscpu` or `top` snapshot of an idle system shows low frequencies as expected, so this is invisible until the workload runs. After fixing, re-run the workload and measure before moving on.

## Layer 2 — Docker CPU and memory limits

A common failure mode: an old Compose limit like `cpus: "12"` stays in place after a workload moves to a larger host. The container then uses only 12 cores, regardless of what the host offers.

```bash
docker inspect <container-name> | grep -iE 'nanocpus|cpushares|cpuquota|cpuperiod|cpuset|memory'
```

Read the fields:

- `NanoCpus`: hard CPU limit in nanocores. `12000000000` = 12 CPUs. `0` = unlimited.
- `CpusetCpus`: pins container to specific logical CPUs (e.g. `"0-19"`). Empty = kernel decides.
- `Memory`: hard RAM limit in bytes. `0` = unlimited.

**Always trust `docker inspect` over the Compose YAML.** The two diverge silently after manual edits, partial restarts, or override files. If the Compose file says one thing and `docker inspect` says another, the inspect output is what is live.

To remove limits and pin to all cores, in Compose:

```yaml
services:
  my-workload:
    cpuset: "0-19"    # adjust to host's logical CPU count
    # do NOT also set 'cpus' or 'deploy.resources.limits.cpus'
```

**Compose syntax pitfall:** `cpuset` is a **top-level service property**, not a sub-property of `deploy.resources.limits`. Putting it under `deploy.resources.limits` causes it to be silently ignored. Verify with `docker inspect` after `up -d --force-recreate`.

## Layer 3 — Hybrid CPU topology (P-cores vs E-cores)

Modern CPUs with hybrid designs (Intel 12th gen onward, ARM big.LITTLE) need kernel scheduler support to place threads on the right cores. Linux support matured around kernel 6.4. On older kernels (Debian 12 ships 6.1), the scheduler may place performance-critical threads on slow efficiency cores, where they become synchronization stragglers in tightly coupled multi-threaded code.

Check the kernel:

```bash
uname -r
```

If older than 6.4 **and** the host is a hybrid CPU, check topology:

```bash
lscpu -e
```

This shows CPU type, max frequency, and core mapping. On typical hybrid Intel CPUs, P-core logical IDs (with hyperthread siblings) come first, E-cores at the end. Example for a 6 P-core + 8 E-core CPU: CPUs 0-11 are P-cores, 12-19 are E-cores.

**P-core-only pinning is an empirical test**, not always a win. Configure:

```yaml
services:
  my-workload:
    cpuset: "0-11"    # P-cores only
```

Then benchmark the same workload with the same thread count once on `cpuset: "0-19"` (all cores) and once on `cpuset: "0-11"` (P-cores only). If P-core-only is faster or equal, the scheduler is not using E-cores well for this workload — keep the pinning. If unrestricted is faster, the kernel handles it fine — drop the restriction.

## Layer 4 — Application parallelism

Only after layers 1-3 are clean does it make sense to tune parallelism. The general pattern has two dimensions:

- **Outer parallelism** — how many work units run concurrently (e.g. scenes, files, jobs).
- **Inner parallelism** — how many threads each unit uses (e.g. FFmpeg `-threads N`).

Product `outer × inner` should approximate the available logical CPU count, but the split is workload-dependent.

### Wave mathematics for batch workloads

When processing a fixed number of work units `N` with concurrency `C`, the job runs in `ceil(N/C)` waves. The last wave is often partially filled, and that brings idle cores until the end of the job. Choose `C` such that the last wave is well-filled.

Worked example with N=17 work units:

| Concurrency C | Waves | Last wave fill | Last-wave waste |
|---|---|---|---|
| 3 | 6 | 2 of 3 slots | low |
| 4 | 5 | 1 of 4 slots | **high** |
| 5 | 4 | 2 of 5 slots | medium |
| 6 | 3 | 5 of 6 slots | low |

C=4 is especially bad: the final wave has only one active slot. For workloads where `N` varies between runs, prefer `C` values that divide `N` cleanly or leave only small remainders for the typical case.

### Thread count per work unit

Threaded libraries scale sub-linearly. For libx264, sweet spot is typically 4-8 threads per encoder; below 3 the overhead dominates, above 16 scaling flattens. When running multiple instances in parallel, prefer many small instances over few large ones — **as long as each instance has at least the library's minimum efficient thread count**.

## Layer 5 — Multi-stage pipeline structure

For pipelines with intermediate artifacts (e.g. per-scene encode → assembly encode → mux):

**Do not optimize each stage independently with cheap settings.** A common anti-pattern: per-unit stage with `preset=ultrafast crf=23` (fast, large noisy files), final stage with `crf=18` (tries to preserve the noise as detail, produces a larger and worse-looking final output than necessary).

**Better pattern:**

- Intermediate stages: near-lossless (low CRF), fast preset is fine (`-preset veryfast -crf 14`). Files are larger on disk but get deleted at job end.
- Final stage: makes the actual quality-versus-size tradeoff (`-preset fast -crf 21`).

The underlying principle: **artifact accumulation in pipelines compounds**. Each stage that introduces noise gives the next stage less clean material to work with.

## Layer 6 — Benchmark hygiene

If reading from network-mounted storage (SSHFS, NFS, S3FS), file system caching dramatically affects measured runtimes.

- **Warmup pass before measuring.** Discard its result.
- **Document the cache state.** "warm cache" vs "cold cache" have different operational meanings.
- **Multiple runs, take median.** Two runs with >5% variance → third run mandatory. Single measurements are dominated by noise.
- **Log resource use over time, not just peak.** Sample every 30 seconds:

```bash
while sleep 30; do
  docker stats --no-stream --format "{{.Name}}: {{.CPUPerc}} {{.MemUsage}}" <container> \
    >> bench-$(date +%s).log
done
```

A workload at 100% CPU throughout has different optimization paths than one at 100% for 80% of the time and 20% for the final stretch. The dip exposes uneven wave filling, sequential bottlenecks, or I/O stalls.

## Diagnostic order, condensed

When the user reports a slow CPU-bound containerized workload:

1. Check governor → set to `performance` and persist.
2. `docker inspect` → identify and remove silent CPU/memory caps.
3. If hybrid CPU + kernel < 6.4 → benchmark `cpuset: "0-Pcores"` vs all cores.
4. Tune `outer × inner` parallelism with wave math, given the typical work-unit count.
5. Audit pipeline structure if symptoms persist (output size, quality, redundant re-encodes).
6. Validate measurements with warmup + median-of-N + continuous resource logging.

## Common anti-patterns to flag

- **Optimizing in the wrong order.** Tuning application parameters before fixing the environment. Result: parameters that are locally optimal under the broken environment and globally wrong once fixed.
- **Documentation drift.** Compose file, running container, and ops docs diverge over time. After every config change, update docs in the same commit.
- **Mistaking the limit for the requirement.** "The workload uses 12 cores" when capped at 12 cores tells you nothing about what it actually wants. Lift the cap, then measure.
- **Multi-axis A/B changes.** Changing several parameters at once and observing the combined result is not a valid measurement of any individual change. Change one axis at a time.
- **Premature symptom fixes.** Downstream symptoms (output size, quality) caused by upstream choices (cheap intermediate encoding) get fixed with more parameters (bitrate targets, two-pass) layering complexity on complexity. The cleaner fix is to undo the upstream choice.

## What to ask the user if information is missing

If diagnosis stalls, the questions that unlock progress are usually:

- CPU model? (`lscpu | grep -E 'Model name|Socket|Core|Thread'`)
- Kernel version? (`uname -r`)
- Docker limits? (`docker inspect <container> | grep -iE 'cpu|memory'`)
- Governor? (`cat /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor | sort -u`)
- What does a typical run look like — N work units, expected time?
- What changed recently (host, kernel upgrade, Compose edit, app update)?
