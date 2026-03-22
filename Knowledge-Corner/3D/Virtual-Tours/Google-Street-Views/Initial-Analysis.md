# 360° Camera Research: Virtual Tours & Street View Workflow

## 1. Use Case Definition

The goal is to:

- Capture 360° photos for **virtual tours** (indoor) and **Google Street View** (outdoor)
- Upload photos to CloudLib.EU for editing (blur faces, license plates, remove objects)
- Create virtual tours from the processed images
- Upload to Google Street View (automated workflow via API)
- Export videos for YouTube, X (Twitter), Instagram, TikTok, etc.

## 2. Camera Recommendation: Insta360 X4 Air

### Why the X4 Air

After evaluating multiple options (Ricoh Theta Z1, Insta360 X3, X4, Theta X, Matterport Pro3), the **Insta360 X4 Air** emerged as the best fit for this use case.

**Key specs:**

- Sensor: 1/1.8" (significant upgrade over X4's 1/2" sensors)
- Photo resolution: 29MP (7680 x 3840), JPEG + RAW
- Video: 8K @ 30fps, 6K @ 50fps, 4K @ 50fps
- Active HDR: yes (improves dynamic range in mixed lighting)
- Replaceable lenses: yes (same as X5)
- Weight: 165g
- Waterproof: 15m
- MicroSD slot: yes (up to 1TB, min. V30 class recommended)
- Replaceable battery: yes (2010mAh, ~88 min at 8K)
- Built-in GPS: **no** (requires external solution — see Section 5)
- Price: ~€300–€500 depending on bundle

### Why NOT the alternatives

| Camera | Reason to skip |
|---|---|
| Ricoh Theta Z1 | ~$900, overkill for development/testing |
| Insta360 X3 | Older, smaller sensor, no replaceable lenses |
| Insta360 X4 | Same price as X4 Air but worse sensor (1/2"), no replaceable lenses |
| Ricoh Theta X | Built-in GPS ✓, but worse image quality than X4 Air |
| Matterport Pro3 | ~$6,000 + subscription, enterprise only |
| "Ball cameras" (Insta360 Pro 2) | $3,000–5,000, professional grade, not needed |

### X4 vs X4 Air — Key Differences

| Feature | X4 | X4 Air |
|---|---|---|
| Sensor size | 1/2" | **1/1.8"** |
| Pixel area per frame | baseline | +134% |
| Active HDR | yes | yes |
| Replaceable lenses | no | **yes** |
| Weight | 203g | **165g** |
| Battery | 2290mAh | 2010mAh |
| Price | ~same | ~same |

**Conclusion:** X4 Air is strictly better than X4 at the same price. There is no rational reason to buy the X4 anymore.

## 3. Accessories

### MicroSD Card
Use a **V30 or A2 rated** card, minimum **128GB**. At 8K RAW, storage fills quickly.

### GPS Solution (Critical — see Section 5)

- **Insta360 GPS Action Remote** (~$79 / ~€75) — the correct solution for accurate GPS at camera position

## 4. How 360° Cameras Work (for non-photographers)

### One shot = full 360°

The X4 Air has **two back-to-back fisheye lenses** that simultaneously capture everything around the camera. No rotating needed. One button press = one complete equirectangular image.

### Stitching

The camera stitches the two lens images together automatically in-camera. The output is a standard equirectangular JPEG (or RAW .insp file).

### The .insp format

Insta360's proprietary raw format. Contains GPS metadata (when available), gyroscope data, and unprocessed image data. Must be exported to JPG for use in third-party software.

**Important:** When exporting from Insta360 Studio to JPG, GPS data is stripped by default. Use ExifTool to copy GPS tags from .insp to .jpg:

```bash
exiftool -tagsfromfile %d%f.insp -gps:all -ext jpg <directory>
```

## 5. GPS — The Core Problem & Solution

### The Problem
The X4 Air has no built-in GPS. It relies on a connected smartphone (via Bluetooth + WiFi) to record GPS coordinates into each photo. This works fine when walking with the camera, but for **static tripod shots**, if the photographer walks away to avoid appearing in the photo, the phone's GPS reflects the photographer's position, not the camera's position.

### Why This Matters
For Google Street View, each photo must be tagged with the GPS coordinates of **where the camera was**, not where the photographer was. Inaccurate coordinates break the automatic sequencing and routing logic.

### The Solution: Insta360 GPS Action Remote

**Product:** [Insta360 GPS Action Remote](https://store.insta360.com/product/gps-action-remote) — ~€80

**How it works:**

- The GPS Action Remote connects to the camera via Bluetooth
- It has its own built-in GPS module
- It supplies GPS coordinates **from its own position** to the camera
- Coordinates are written directly into the .insp file

**Workflow:**

1. Set up camera on tripod at shooting position
2. Place GPS Action Remote next to the tripod/camera
3. Walk away (you are no longer the GPS source)
4. Trigger the shot remotely via the Insta360 app on your phone
5. GPS coordinates = camera position ✓

The remote does not need to be used as a remote control. It can simply sit next to the camera and act purely as the GPS data source.

### Alternative Approaches (less ideal)

| Approach | Problem |
|---|---|
| Leave phone at camera | Phone can be stolen; you have no remote trigger |
| Use timer, stand next to camera | You appear in the shot |
| Post-process GPS with ExifTool | Requires manual coordinate input per shot |
| Cheap second Android device at camera | Requires SDK development work |
| GPX file + timestamp sync | Works but adds workflow complexity |

### How Most Professional Street View Photographers Handle This
Most pros do **not** use static tripod shots for Street View. They walk or drive with the camera in continuous/interval mode, camera mounted on a selfie stick held overhead or on a vehicle. In this workflow, GPS accuracy is not a problem because the photographer and camera move together.

For **static indoor virtual tours**, GPS is irrelevant (GPS doesn't work indoors anyway). Positions are placed manually in the tour software.

## 6. Shooting Technique

### For Street View (Outdoor, Moving)

- Camera on 114cm selfie stick, held overhead
- Photographer walks directly under camera
- Body is in the camera's dead zone (directly below)
- Insta360 app running on phone, GPS enabled, screen must stay ON
- Use interval shooting mode (one photo every 3–5 meters of movement)
- Phone stays with photographer → GPS is accurate because both move together

### For Virtual Tours (Indoor, Static)

- Camera on tripod at ~1.2–1.5m height (eye level)
- GPS Action Remote placed next to tripod
- Photographer leaves the room or stands outside the frame
- Trigger via Insta360 app (remote shutter) or use self-timer
- Plan shooting positions: one spot every 2–3 meters, ensuring each spot has line-of-sight to the next

### General Rules

- **HDR mode**: always use for indoor and mixed lighting (window + interior)
- **Lighting**: turn on all interior lights; cloudy days are better than direct sun for outdoor facade shots
- **Clutter**: clean the space before shooting; the camera sees everything
- **Tripod legs & cables**: will appear in the nadir (bottom of image); must be retouched in post
- **Ceiling height limitation**: Selfie stick (114cm) is only usable outdoors or in rooms with ceilings above ~3m. For typical rooms (2.4–2.8m ceilings), use a tripod only.

### How the Selfie Stick Invisibility Works
The "Invisible Selfie Stick" effect works because:

1. The stick is directly below the camera in the dead zone of both lenses
2. The stick is symmetric — both lenses see it identically, which allows the stitching software to remove it
3. **Must use original Insta360 stick** — third-party sticks don't reliably disappear

You stand directly under the camera. Your body is in the dead zone. Only works reliably outdoors with sufficient ceiling clearance.

## 7. GPS & Metadata Technical Notes

### How GPS Gets Into Photos

1. Insta360 app connects to camera via Bluetooth
2. App reads phone GPS and sends coordinates to camera in real time
3. Camera writes GPS data into .insp file during capture
4. **Screen must stay ON** for GPS to keep transmitting
5. On export to JPG via Insta360 Studio: GPS is **stripped** by default
6. Solution: use ExifTool post-export (see Section 4)

### Google Street View GPS Requirements

- Minimum accuracy: ~5 meters is acceptable
- Photos must have GPS embedded in EXIF metadata
- For Blue Line creation: photos must be sequential with consistent spacing

### The GPX Alternative Workflow
Instead of embedded GPS per photo, you can:

1. Record a GPX track (separate GPS logger app running on phone)
2. Export GPX file after session
3. Match GPS timestamps to photo timestamps
4. Inject coordinates into EXIF using ExifTool

This works but adds workflow complexity. The GPS Action Remote is cleaner.

## 8. Insta360 SDK — Developer Notes

The Insta360 SDK is publicly available (requires application/approval).

**Platforms supported:** Android, iOS, Windows, Linux

**Camera SDK capabilities:**

- Connect and authenticate with camera
- Read/set all camera parameters
- Trigger photo and video capture
- Live preview streaming
- File management and download
- Firmware updates
- **GPS data injection** (`uploadGpsDatas()`) — can push GPS coordinates directly to camera from any connected device

**Media SDK capabilities:**

- Stitching (equirectangular export)
- Chromatic calibration
- Noise reduction
- Stabilization processing
- Photo/video export

**Key API notes:**

- Requires `appId` and `secretKey` from Insta360 developer portal
- Android supports USB, WiFi, and Bluetooth connections
- iOS supports WiFi and Bluetooth
- Desktop (Windows/Linux) supports USB only
- The SDK does NOT support exporting DNG to JPG
- GPS data can be injected as an array of `GpsInfo` objects with coordinates, altitude, accuracy, course, speed, timestamp

**GitHub:** https://github.com/Insta360Develop

**Potential custom app architecture:**

- Small Android device (old phone, ~€30–50) stays at camera on tripod
- Custom app connects to camera via SDK
- App reads its own GPS (device is at camera location → coordinates are accurate)
- Main phone triggers capture via separate channel (WiFi, web request, etc.)
- Eliminates the GPS accuracy problem entirely without needing the GPS Action Remote

## 9. Social Media & Platform Notes

### Google Street View

- Preferred upload format: **video** (not photo sequence) with embedded GPS
- Export GPX file from Insta360 Studio alongside video
- Google processes video into individual photos automatically
- Processing time: 3–7 days before appearing on maps
- Blue Line appears when multiple sequential photos are connected

### YouTube / Facebook

- Support 360° video natively
- Must have correct XMP metadata (`ProjectionType = equirectangular`)
- Insta360 Studio exports with correct metadata by default

### Instagram / TikTok / X (Twitter)

- **Do not support 360° natively**
- 360° content appears as a regular flat crop
- For these platforms, reframe the footage to a standard flat video before uploading
- Use Insta360 Studio or app "reframing" feature to select the best angle

## 10. Recommended Purchase List

| Item | Notes | Approx. Price |
|---|---|---|
| Insta360 X4 Air (Virtual Tours Bundle) | Camera + selfie stick + tripod | €398 |
| OR: X4 Air Standard + stick + tripod separately | If bundle unavailable | €331 + €40 + €25 |
| Insta360 GPS Action Remote | Critical for accurate GPS on static shots | ~€75 |
| MicroSD V30/A2, 128GB+ | Samsung Pro Endurance or Sandisk Extreme recommended | ~€20–30 |

**Total: ~€470–530**

## 11. Open Questions / Next Steps

- [ ] Test the GPS Action Remote with X4 Air — confirm GPS coordinates are written to .insp file correctly
- [ ] Verify ExifTool GPS copy command works in automated pipeline
- [ ] Test Google Street View upload workflow end-to-end
- [ ] Evaluate Insta360 SDK for custom trigger app (eliminates need for main phone at camera)
- [ ] Determine minimum photo spacing for Google Blue Line acceptance
- [ ] Test automatic face/license plate blur in custom web software on equirectangular images
