# 360° Panorama Viewers Compared: Pannellum, Photo Sphere Viewer, Marzipano, A-Frame

As of 28 September 2026. Bundle sizes measured by me (npm packages, esbuild 0.28 `--bundle --minify`, gzip -9).

## Summary

| | Pannellum | Photo Sphere Viewer (PSV) | Marzipano | A-Frame |
|---|---|---|---|---|
| Positioning | Ultra-light standalone viewer | Modern, modular tour viewer | High-performance tile viewer (under the "google" GitHub org; README: "not an official Google product") | General-purpose WebXR/3D framework |
| Key strength | Size, simplicity | Features, plugins, regular releases (but effectively one maintainer) | Gigapixel tiles | True VR with headsets and controllers |
| Key weakness | No VR, slow development, one maintainer | Size (three.js), dependence on one maintainer | **Repo archived since 2026-04-20** (last release 03/2021), Apache-2.0 | No tiling, very large |

## Feature Matrix

| Criterion | Pannellum | Photo Sphere Viewer | Marzipano | A-Frame |
|---|---|---|---|---|
| Current version (npm) | 2.5.7 (2026-02-19) | 5.15.1 (2026-08-02) | 0.10.2 (2021-03-18) | 1.8.0 (npm 2026-06-23, GitHub release 2026-06-24) |
| License | MIT | MIT | **Apache-2.0** (not MIT) | MIT |
| Dependencies | none | three.js (peer dependency) | none | three.js (bundled) |
| JS minified | 56 KB | Core + three.js: 635 KB | 210 KB | 1,319 KB (ESM build: 586 KB) |
| JS gzipped | **18 KB** (+2.6 KB CSS) | Core + three.js: **164 KB** (+2.7 KB CSS) | **56 KB** | **356 KB** (ESM: 166 KB) |
| With tour plugins (gz) | – (tours built in) | Core + Markers + Virtual Tour: **255 KB** | – (hotspots built in) | + community components |
| Formats | Equirect., cubemap, multires (tiles), limited video | Equirect., cubemap, equirect. tiles, cubemap tiles, video, little planet | Equirect., cube, multires cube, flat gigapixel, video (manual) | Equirect. (`<a-sky>`), video (`<a-videosphere>`) |
| Tiling / multiresolution | Yes, own format via `generate.py` | Yes, two tile adapters, multiple zoom levels | Yes, core strength (cube pyramids) | No (only custom/community) |
| VR / WebXR | No | Pseudo-VR: Gyroscope + Stereo (Cardboard style), no native WebXR | Gyro only (DeviceOrientation), no WebXR | **Native WebXR**, Quest, Vision Pro, PICO, controllers |
| Mobile gyroscope | Yes (orientationOnByDefault) | Yes (plugin) | Yes (demo/ControlMethod) | Yes |
| Hotspot management | Core API: `addHotSpot`/`removeHotSpot`, scene links, custom hotspots, `hotSpotDebug` | **Markers plugin**: HTML, image, video, SVG, polygon/polyline, tooltips, list, `gotoMarker()` | DOM hotspots via `createHotspot(element, {yaw, pitch})`, fully styled via CSS | Own entities + raycaster/cursor, build everything yourself |
| Tours | Yes, built in (JSON config) | Yes, Virtual Tour plugin (client or server mode, arrows, transitions) | Yes, via code; Marzipano Tool generates a tour app | Custom only |
| Plugin ecosystem | None (config-based) | 14 official plugins + 5 adapters | None | Very large (community components, but not panorama-specific) |
| Documentation | Good, compact, many examples | **Very good**: guides, API reference (TypeDoc), playground, TS types | Medium: API docs + demos, few guides | Very good, large community |
| TypeScript | No | Yes, native | No | Community types |
| Maintenance | Sporadic, essentially one maintainer (Matthew Petroff) | Active, but heavily concentrated on one maintainer (Damien Sorel) | **Archived** on 2026-04-20 (read-only, no more issues/PRs/fixes); last release 0.10.2 on 2021-03-18 | Active |
| Fallback without WebGL | Limited: CSS 3D renderer only for cubemap and multires with `fallbackPath`, only WebKit/Blink and IE 10/11, not Firefox | No | **No** (CSS and Flash renderers removed in v0.10.0) | No |

## Performance with High-Resolution Panoramas (WebGL)

Core problem: a single WebGL texture is limited by the GPU's `MAX_TEXTURE_SIZE`. Pannellum recommends limiting equirectangular images to 4096 px wide, with 8192 px acceptable for most devices ([Pannellum Overview](https://pannellum.org/documentation/overview/)). Anything larger (12K, 16K, gigapixel) should be tiled.

| Scenario | Pannellum | PSV | Marzipano | A-Frame |
|---|---|---|---|---|
| ≤ 8K equirect., single image | Very good, automatically splits oversized images into two textures | Very good | Good | Good, but high init overhead |
| 12K–16K | Only sensible with multires | Good with equirect. tiles adapter | Very good with multires cube | Critical (memory, frequent crashes on mobile) |
| Gigapixel | Possible (multires, arbitrarily large) | Possible (cubemap tiles, multiple levels) | **Technically best choice, but archived** (official gigapixel demos for cube and flat) | Not suitable |
| Startup time / TTI | Very fast (18 KB) | Medium (164–255 KB) | Fast (56 KB) | Slow (166–356 KB + scene graph) |
| Low-end mobile | Very good (+ limited CSS fallback) | Good | Very good | Weaker |

Notes:
- Pannellum multires requires conversion with `generate.py` (Python, Pillow, NumPy, Hugin/nona) and hosting many files ([Pannellum multires docs](https://github.com/mpetroff/pannellum/blob/master/utils/multires/readme.md)).
- PSV tiles can be generated with ImageMagick; multiple tile levels are loaded per zoom level ([PSV Equirectangular Tiles](https://photo-sphere-viewer.js.org/guide/adapters/equirectangular-tiles.html)).
- Marzipano loads tiles of a cube pyramid by field of view and zoom; tile paths such as `tiles/{z}/{f}/{y}/{x}.jpg` ([Marzipano Docs](https://www.marzipano.net/docs.html)). The Marzipano Tool generates tiles and a ready-made tour app.
- Marzipano "Generated Cube" demo: the ~280 terapixels mentioned there refer to procedurally generated tiles (precision issues appear beyond level 16), not a real photo ([Marzipano Demos](https://www.marzipano.net/demos.html)). Real gigapixel panoramas are what is documented.
- A-Frame renders stereo in VR mode at headset refresh rates (typically 72–120 Hz); as a rule of thumb (not benchmarked), a single 8K texture is the practical maximum there.

## Recommendations by Project Requirement

| Requirement | Recommendation | Rationale |
|---|---|---|
| Single panorama, minimal load time, iframe embed | **Pannellum** | 18 KB gz, `pannellum.htm` as standalone embed, MIT |
| Commercial virtual tours (real estate, hotels, hospitality) | **Photo Sphere Viewer** | Markers, Virtual Tour, Map/Plan, Gallery, Autorotate; actively maintained (mind the single-maintainer risk), TypeScript |
| Gigapixel / very high resolution, museums, industrial inspection | **PSV with tiles**; Marzipano only for existing projects or as a fork | Marzipano has the best tiling but has been archived since 2026-04-20 (no more security or browser fixes); Apache-2.0 (include license text + NOTICE) |
| True VR with Meta Quest / Vision Pro, controllers, interaction | **A-Frame** | Only candidate with native WebXR |
| Cardboard/smartphone VR without a headset requirement | **Photo Sphere Viewer** | Gyroscope + Stereo plugin |
| React/Vue/Svelte app, build pipeline | **Photo Sphere Viewer** | ESM, types, wrappers exist (e.g. react-photo-sphere-viewer) |
| Strictly MIT license only | Pannellum, PSV, A-Frame | Marzipano is ruled out |
| Legacy devices without WebGL | Pannellum only, with limitations | CSS 3D fallback only for cubemap/multires with fallback images and only in WebKit/Blink and IE 10/11; barely relevant for modern projects |
| Hybrid: web tour + optional VR mode | PSV for web, A-Frame as a separate VR entry point | Avoids ~350 KB overhead for every visitor |

## Overall Rating (1–5)

| Criterion | Pannellum | PSV | Marzipano | A-Frame |
|---|---|---|---|---|
| Bundle size | 5 | 3 | 4 | 1 |
| VR | 1 | 3 | 1 | 5 |
| Hotspots | 3 | 5 | 3 | 2 |
| Plugins | 1 | 5 | 1 | 4 |
| Documentation | 4 | 5 | 3 | 5 |
| High-res performance | 4 | 4 | 5 | 2 |
| Future-proofing | 3 | 4 | 1 | 4 |
| **Total** | **21** | **29** | **18** | **23** |

## Sources

- Measurement: npm packages [pannellum](https://www.npmjs.com/package/pannellum), [@photo-sphere-viewer/core](https://www.npmjs.com/package/@photo-sphere-viewer/core), [marzipano](https://www.npmjs.com/package/marzipano), [aframe](https://www.npmjs.com/package/aframe), [three](https://www.npmjs.com/package/three)
- Pannellum: [Overview](https://pannellum.org/documentation/overview/), [Changelog](https://github.com/mpetroff/pannellum/blob/master/changelog.md), [Multires](https://pannellum.org/documentation/examples/multiresolution/)
- Pannellum image sizes: [Overview](https://pannellum.org/documentation/overview/) ("preferably be limited to 4096 px wide; 8192 px is also acceptable for most devices")
- Photo Sphere Viewer: [Guide](https://photo-sphere-viewer.js.org/guide/), [Modules/Plugins](https://photo-sphere-viewer.js.org/api/modules.html), [Markers](https://photo-sphere-viewer.js.org/plugins/markers.html), [Stereo](https://photo-sphere-viewer.js.org/plugins/stereo.html), [Adapters](https://photo-sphere-viewer.js.org/guide/adapters/)
- PSV plugins (14: Autorotate, Compass, Gallery, Gyroscope, Map, Markers, Overlays, Plan, Resolution, Settings, Stereo, Video, VirtualTour, VisibleRange) and 5 adapters: [API modules](https://photo-sphere-viewer.js.org/api/modules.html)
- PSV version: [GitHub Releases](https://github.com/mistic100/Photo-Sphere-Viewer/releases) and npm registry (5.15.1 published 2026-08-02; 5.8.2 was from 2024-07-04)
- Fallback renderer verification: source code `pannellum/src/js/libpannellum.js` (2.5.7) and `marzipano/CHANGELOG` (v0.10.0: "Breaking: delete Flash and CSS renderers (#350)")
- Marzipano archive status: [GitHub google/marzipano](https://github.com/google/marzipano) ("archived by the owner on Apr 20, 2026", GitHub API `archived: true`)
- Marzipano license and status: [LICENSE](https://github.com/google/marzipano/blob/master/LICENSE) (Apache License 2.0), `package.json` `"license": "Apache-2.0"`, [README](https://github.com/google/marzipano) ("This is not an official Google product.")
- Marzipano: [Docs](https://www.marzipano.net/docs.html), [Demos](https://www.marzipano.net/demos.html), [GitHub](https://github.com/google/marzipano)
- A-Frame 1.8.0: [GitHub Release v1.8.0](https://github.com/aframevr/aframe/releases/tag/v1.8.0)
- A-Frame: [Introduction](https://aframe.io/docs/1.8.0/introduction/), [WebXR component](https://aframe.io/docs/1.8.0/components/webxr.html), [a-sky](https://aframe.io/docs/1.8.0/primitives/a-sky.html), [360° gallery guide](https://aframe.io/docs/1.8.0/guides/building-a-360-image-gallery.html)
