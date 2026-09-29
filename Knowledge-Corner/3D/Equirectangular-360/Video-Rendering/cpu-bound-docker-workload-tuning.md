# Tuning CPU-bound workloads in Docker on multi-core servers

A field-tested checklist for diagnosing and fixing slow CPU-bound rendering, encoding, or processing workloads running in Docker containers on Linux servers.

## What this is about

Some workloads are CPU-bound: their speed is limited by how much processing power they can get from the host CPU. Examples include video encoding (FFmpeg, libx264), image transformation pipelines, scientific simulations, large compilation jobs, and many AI inference workloads.

When such a workload runs much slower than expected, the instinct is often to rewrite code or change parameters inside the workload itself. In practice, the slowdown is usually caused by a small set of well-known **environment-level misconfigurations**: the Linux kernel, the Docker runtime, or the host hardware are not actually giving the workload the CPU resources it appears to have.

This document is a structured walkthrough of the layers to check, in order, before touching application-level parameters.

## The general principle

**Check the environment before tuning the application.** Application-level optimization assumes the environment is delivering what it promises. If the OS is throttling the CPU, or Docker is silently limiting cores, or the kernel is scheduling threads poorly across asymmetric cores, no amount of parameter tuning inside the application will compensate. Worse, application-level changes made under a constrained environment will often pessimize the workload once the environment is fixed.

The order of investigation matters because each layer is cheaper to check than the one below it, and each can fully explain the observed slowdown.

## Layer 1: CPU frequency governor

The Linux kernel exposes a CPU governor that decides how aggressively the CPU boosts its clock speed under load. On many server distributions, the default is `powersave`, which keeps clock speeds low to save energy. For bursty CPU-heavy workloads, this can cost 20-40% of real-world performance.

**Check the current governor:**

```bash
cat /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor | sort -u
```

If the result is `powersave`, set it to `performance`:

```bash
echo performance | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor
```

**Important:** this change does not survive a reboot. To make it permanent on Debian/Ubuntu:

```bash
sudo apt install cpufrequtils
echo 'GOVERNOR="performance"' | sudo tee /etc/default/cpufrequtils
sudo systemctl restart cpufrequtils
```

On other distributions, the persistent mechanism may differ (systemd unit, tuned profile, etc.), but the underlying control file is the same.

**Why this is sneaky:** the governor only matters under sustained load. A casual `lscpu` or `top` snapshot will show low frequencies in idle state and look entirely normal. The performance loss only appears during the actual workload, where it is easy to misattribute to the application.

## Layer 2: Docker CPU and memory limits

Containers can be silently capped to a fraction of the host's resources by `cpus`, `cpuset`, or `memory` settings in the Compose file or `docker run` command. These limits are easy to inherit from an older configuration or a copy-pasted template and then forget about.

**Inspect the running container:**

```bash
docker inspect <container-name> | grep -iE 'nanocpus|cpushares|cpuquota|cpuperiod|cpuset|memory'
```

Key fields and what they mean:

`NanoCpus` is the hard CPU limit expressed in nanocores. `12000000000` means 12 CPUs. `0` means unlimited.

`CpusetCpus` pins the container to specific logical CPU IDs (e.g. `"0-19"`). Empty means the kernel decides.

`Memory` is the hard RAM limit in bytes. `0` means unlimited.

A common failure mode: a Compose file written for a small test machine sets `cpus: "12"` and stays in place after the workload is moved to a larger server with 20 or more cores. The container then uses only 12 cores, and the remaining cores sit idle during the entire workload.

**Verify what is actually live, not just what is documented.** The Compose file in the repository and the running container can diverge silently after manual edits, `docker run` overrides, or partial restarts. Always trust `docker inspect`, not the YAML in the repository, when diagnosing.

## Layer 3: Asymmetric CPU architectures

Modern CPUs with hybrid core designs (Intel from 12th generation onward with P-cores and E-cores, ARM big.LITTLE, Apple Silicon) require kernel scheduler support to distribute threads efficiently. On Linux, this support matured significantly around kernel 6.4. Older kernels (including 6.1, which ships with Debian 12) handle hybrid cores less well and may schedule performance-critical threads onto slow efficiency cores.

For latency-sensitive single-job workloads on hybrid CPUs with older kernels, **pinning the workload to the performance cores can be faster than letting the scheduler use all cores**, even though fewer threads are available in absolute terms. The reason: efficiency cores running at lower clocks become synchronization stragglers in tightly coupled multi-threaded code, slowing every barrier and join point.

**Identify which logical CPUs are P-cores vs E-cores:**

```bash
lscpu -e
```

This shows core type, frequency, and topology. On a typical hybrid Intel CPU, P-cores with their hyperthreading siblings come first (e.g. CPUs 0-11 for 6 P-cores), followed by E-cores (e.g. CPUs 12-19 for 8 E-cores).

**To pin a container to P-cores only**, set `cpuset` in the Compose file:

```yaml
services:
  my-workload:
    cpuset: "0-11"
    # do not set 'cpus' limit at the same time
```

**Important Compose syntax note:** `cpuset` is a top-level service property, not a sub-property of `deploy.resources.limits`. Putting it in the wrong place causes it to be silently ignored, and the kernel will resume choosing cores on its own. Validate with `docker inspect` afterwards.

Whether P-core pinning helps is empirical. It is worth a one-shot comparison test: same workload, same thread count, once with all cores, once pinned to P-cores. If the P-core-only run is faster or equal, the scheduler is not using the E-cores well for this workload.

## Layer 4: Parallelism inside the workload

Only after layers 1-3 are clean does it make sense to tune parallelism. The relevant parameters depend on the workload, but the general pattern is:

- An **outer parallelism** dimension (how many work units run concurrently)
- An **inner parallelism** dimension (how many threads each unit uses)

For example, a rendering pipeline might process N scenes concurrently, with each scene using M encoding threads. The product N × M should be close to the available logical CPU count, but the optimal split between N and M is workload-dependent.

### Wave mathematics for batch workloads

When processing a fixed number of work units, the concurrency factor determines how many "waves" of work occur, and how full the last wave is. The last wave is often partially filled, which means cores sit idle at the end of the job.

Example with 17 work units:

| Concurrency | Number of waves | Last wave fill | Last-wave waste |
|---|---|---|---|
| 3 | 6 (5×3 + 1×2) | 2 of 3 slots | low |
| 4 | 5 (4×4 + 1×1) | 1 of 4 slots | high |
| 5 | 4 (3×5 + 1×2) | 2 of 5 slots | medium |
| 6 | 3 (2×6 + 1×5) | 5 of 6 slots | low |

For workloads where each work unit takes a similar amount of time, the runtime is roughly `waves × per-unit-time`. A concurrency of 4 with 17 units is especially bad because the final wave has only one active slot, leaving most cores idle for the entire duration of that wave.

The lesson: **choose concurrency to fit the typical work-unit count**, not just to maximize raw thread count. For workloads where the count varies significantly between runs, prefer concurrency factors that divide cleanly or leave only small remainders.

### Thread count per work unit

Within each work unit, the inner thread count interacts with the parallelism library being used. Many threaded libraries scale sub-linearly: doubling threads does not double speed, and beyond a certain point overhead dominates. For libx264 specifically, the sweet spot is typically 4-8 threads per encoder; below 3, overhead becomes significant, and above 16, scaling flattens dramatically.

When running multiple instances of such a library in parallel, prefer many small instances over few large ones, **as long as each instance has at least the library's minimum efficient thread count**.

## Layer 5: Workload-specific encoding observations

This layer is specific to video encoding pipelines but illustrates a general principle: **multi-stage encoding pipelines should not optimize each stage independently**.

In a two-stage pipeline (per-unit encode, then assembly re-encode), the temptation is to make the per-unit stage fast and cheap (`preset=ultrafast`, high CRF) and to handle quality in the final assembly. This produces worse results than expected because:

1. The fast preset produces files with compression artifacts and high-frequency noise.
2. The final encoder treats these artifacts as image detail and allocates bits to preserve them.
3. The final file ends up larger and visually worse than if both stages used moderate-quality settings.

**Better pattern:** keep intermediate stages near-lossless (low CRF, but a fast preset is fine since the files are temporary), and let the final assembly encoder make the actual quality-versus-size tradeoff. The intermediate files become larger on disk, but they are deleted at the end of the job, and the final output is smaller and better quality.

This is a specific instance of a broader principle: **artifact accumulation in pipelines compounds**. Each stage that introduces noise gives the next stage less clean material to work with. Cheap-and-fast at every stage is rarely the global optimum.

## Layer 6: Caching effects and benchmark hygiene

When the workload reads from network-mounted storage (SSHFS, NFS, S3FS), file system caching dramatically affects measured runtimes. The first run after a fresh mount can be much slower than subsequent runs, because the OS page cache is empty.

For meaningful benchmarks:

- **Run a warmup pass before measuring.** Discard its result.
- **Document the cache state of your measurements** ("warm cache" vs "cold cache"). The two scenarios have different operational meanings: cold cache reflects production conditions where each job touches new data, warm cache reflects rapid iteration during testing.
- **Run each configuration multiple times** and take the median, not the mean. Single-run measurements are dominated by system noise. Two runs with more than 5% variance indicate something else is interfering and warrants a third run.
- **Log resource utilization over time**, not just peak values. A workload that uses 100% CPU for 80% of the time and 20% CPU for the final 20% has a different optimization path than one with steady 100% throughout. A simple shell loop sampling `docker stats` every 30 seconds is enough to expose this.

```bash
while sleep 30; do
  docker stats --no-stream --format "{{.Name}}: {{.CPUPerc}} {{.MemUsage}}" <container> \
    >> bench-$(date +%s).log
done
```

## A diagnostic order of operations

When a CPU-bound containerized workload runs slower than expected, in order:

1. Check the CPU governor. Set to `performance` if not already, and make it persistent.
2. Inspect the container with `docker inspect` for CPU and memory limits. Remove or expand as appropriate for the host.
3. If the host CPU is hybrid (P-cores + E-cores) and the kernel is older than 6.4, consider pinning to P-cores with `cpuset` and benchmarking against the unrestricted case.
4. Only now: tune inner parallelism parameters of the workload. Choose values that fit both the available cores and the typical work-unit count.
5. Reconsider the structure of the workload itself (pipeline stages, intermediate file quality, etc.) only after the above are addressed.
6. Validate measurements with warmup runs, multiple repetitions, and continuous resource logging.

## Common anti-patterns

**Optimizing in the wrong order.** Tuning application parameters before fixing the environment produces parameter values that are locally optimal under the broken environment and globally wrong once the environment is fixed. Both efforts then need to be redone.

**Documentation drift.** The Compose file in the repository, the running container, and the documentation of "current settings" diverge over time. Always verify what is live, not what is documented. After every configuration change, update the docs in the same commit, or accept that the docs are aspirational.

**Mistaking the limit for the requirement.** Observing that "the workload uses 12 cores" when the container is capped at 12 cores tells you nothing about how many cores the workload actually wants. Lift the cap, then measure.

**Single-axis A/B testing made multi-axis.** Changing several parameters at once and observing the combined result is not a valid measurement of any individual change. If the combined change made things worse, the contribution of each individual change is unknown. Change one axis at a time, or design a proper factorial experiment.

**Premature application-level fixes.** When a downstream symptom (e.g. larger output file size) is caused by an upstream choice (e.g. cheap intermediate encoding), fixing the symptom with more parameters (bitrate targets, two-pass encoding) layers complexity on top of complexity. The cleaner fix is usually to undo the upstream choice.

## What to keep, even after the immediate problem is solved

These habits stay valuable beyond any one tuning session:

- A `docker inspect` snapshot taken whenever a workload is deployed to a new host, archived alongside the deployment notes.
- A periodic check that the CPU governor is still `performance` after kernel upgrades or reboots.
- A continuous resource log captured during representative production runs, even at low frequency, to make future regressions visible.
- A short note in the operational documentation listing the known-good `cpuset`, concurrency, and thread parameters for the current hardware, with the date of the last validation.
