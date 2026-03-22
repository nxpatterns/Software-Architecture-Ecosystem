# FAQs

> **Question:** When capturing static 360° photos on a tripod for Google Street View using an Insta360 X4 Air (which has no built-in GPS), the phone must remain connected via Bluetooth/WiFi to supply GPS coordinates to each photo. However, if the photographer walks away to avoid appearing in the shot, the phone's GPS coordinates reflect the photographer's position rather than the camera/tripod position. What are the established solutions or workflows that professional Street View photographers use to solve this GPS accuracy problem for static tripod-based 360° photo capture?

Professional Street View photographers have several well‑established workarounds to keep GPS coordinates accurate when the camera is on a tripod and the phone is carried away from it. The general goal is to avoid “dragging” the GPS position with the photographer while still getting good‑enough geo‑tags for Google Street View. [reddit](https://www.reddit.com/r/Insta360/comments/1arzsc5/gps_compass_adjustment/)

***

### 1. Use a dedicated GPS‑enabled device at the tripod

The cleanest solution is to keep the GPS source *at the camera*, not in your pocket:

- **Insta360 GPS remote / GPS module**: Insta360 sells a GPS‑enabled remote or external GPS module that can be mounted on the camera or tripod and feed GPS data directly into the camera’s timeline, even when the phone is out of range. [youtube](https://www.youtube.com/watch?v=43O9EImozrM)
- **Third‑party GPS logger**: Many pros use a small separate GPS logger (e.g., Garmin or similar) that records a track log; this track can later be matched to the camera’s timestamps and used to geo‑tag the static shots. [developers.google](https://developers.google.com/streetview/ready/specs)

In both cases the camera, phone, or stitching software syncs GPS via timestamps so the position corresponds to the tripod, not where you walked.

***

### 2. Limit walking distance and use “average” position

When you *must* walk away with the phone:

- **Stay close and return quickly**: Walk only far enough to disappear from shot (e.g., a few meters behind the camera), then immediately return and let the phone GPS re‑lock at the tripod before the next shot. This keeps positional drift small. [support.google](https://support.google.com/maps/answer/2839911?hl=en&co=GENIE.Platform%3DAndroid)
- **Use a “stationary capture” pattern**: For each tripod position, start the capture, walk behind the camera, then step back into the frame briefly so the phone’s GPS re‑associates tightly with the tripod. Many photographers report that Google’s tools often take the “bulk” of the GPS signal as the effective location, so minimizing off‑axis movement helps. [benclaremont](https://www.benclaremont.com/blog/google-street-view-workflow)

This doesn’t give perfect cm‑level accuracy, but it often suffices for Street View if you limit your radius and keep shots reasonably far apart.

***

### 3. Post‑capture GPS adjustment in software

Several workflows let you correct or refine the GPS after the fact:

- **Manual location adjustment in mapping / stitching tools**: Some Insta360‑centric workflows and third‑party tools allow you to manually nudge the GPS marker for each static 360° photo to the exact tripod position on the map before export for Street View. [reddit](https://www.reddit.com/r/Insta360/comments/1arzsc5/gps_compass_adjustment/)
- **Time‑based GPS match**: If you run a separate GPS track (e.g., a Garmin log or phone‑only GPS track), you can use software that matches each shot’s timestamp to the GPS track and re‑writes the EXIF coordinates. This is common in professional mapping and survey workflows. [insta360](https://www.insta360.com/blog/enterprise/google-maps-street-view-insta360-pro.html)

For episodic or lower‑volume shoots this is often the most practical balance of accuracy vs. kit complexity.

***

### 4. Capture intervals and rank‑order logic

Street View‑oriented workflows often rely on:

- **Short capture intervals**: Even for static tripod shots, many pros keep the tripod moves within a few meters and use consistent logging so that the overall GPS “cloud” clusters around the correct location. [youtube](https://www.youtube.com/watch?v=43O9EImozrM)
- **Submit in a controlled sequence**: Grouping nearby tripod shots into a single Street View “sequence” lets Google’s backend infer the correct path, even if each individual GPS point is slightly off; bad outliers can be filtered. [developers.google](https://developers.google.com/streetview/ready/specs)

***

### Practical takeaway for your Insta360 X4 Air setup

Given that your X4 Air has no built‑in GPS and relies on the phone, the *most professional* options are:

1. Mount a **GPS‑enabled remote/module** on the tripod so the GPS source never leaves the camera. [youtube](https://www.youtube.com/watch?v=lfTZ76ICyS0)
2. If you stick with phone‑only, **walk minimally, keep shots close together, and optionally post‑correct** GPS using a separate GPS track or manual adjustment for critical locations. [onlinemanual.insta360](https://onlinemanual.insta360.com/app/en-us/operation-tutorial/stats-dashboard/gps-sports-assistant)

This combination is very close to what Street View‑focused photographers describe as “best practice” when using Insta360‑style cameras without internal GPS. [youtube](https://www.youtube.com/watch?v=lfTZ76ICyS0)
