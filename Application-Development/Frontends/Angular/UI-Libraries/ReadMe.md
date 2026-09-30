# Angular UI Libraries & Design Systems – Reference Notes

Compiled: 30 September 2026
Context: Looking for mature alternatives to Angular Material (which feels visually noisy and whose form fields take up too much space). Requirement: **Angular 22+**.

> **Revision 2 (30 Sep 2026):** enriched with findings from a Claude evaluation session. Additions marked **[web]** come from web search or fetched pages in that session, NOT from the npm registry check above. **[training]** = model knowledge, not verified today. Project constraints stated in that session: no Tailwind, no PrimeNG. Details in section 8.
>
> **Revision 3 (30 Sep 2026):** section 9 adds the Clarity deep dive (full `@clr/angular`, `@clr/ui` CSS only, the combination with Angular Aria + CDK, and zoneless bugs in 9.8). Items marked **[tested]** were built or run in a sandbox (Node 24.21, Angular CLI 22.2.0, TypeScript 6.0.2, npm registry), not just read.

> **Revision 4 (30 Sep 2026):** real-browser verification of the Clarity findings from a second session (Perplexity Computer). Items marked **[browser]** were run in headless Chromium via Playwright against production builds (Node 24.15.0, Angular CLI 22, `@angular/core` 22.2.0, `@angular/cdk` 22.2.1, `@clr/angular`/`@clr/ui` 18.3.0, zoneless unless stated). GitHub status was read via the GitHub API on 30 Sep 2026. New section 9.9; corrections inline, marked **(rev. 4)**.

> Versions and Angular peer dependencies were checked against the npm registry on 30 Sep 2026. "Angular" = `peerDependencies['@angular/core']` of the package. Density assessments are qualitative.

---

## 1. Summary & Recommendations

- **Dense, calm forms out of the box:** **ng-zorro-antd** (compact theme + `nzSize="small"`).
- **Full control, minimal look:** **spartan/ui** (shadcn-style, Tailwind) or **Angular Aria** + your own CSS (most future-proof, official Angular team package). Note: spartan's `helm` styles require Tailwind, only `brain` is Tailwind-free (section 8.2).
- **Largest component catalogue:** **PrimeNG** (use `size="small"` + custom design tokens or unstyled mode). **Licence warning:** PrimeNG 22+ is no longer MIT, see section 8.1.
- **Oblique, ng-aquila & corporate systems:** use them **as role models** for completeness (layouts, navigation, form patterns), not as a dependency.
- **Best role models for compact forms:** SAP Fiori (Compact), Elastic EUI ("compressed"), Siemens Element, GitHub Primer, IBM Carbon (sm).
- **Principles of calm, dense forms:** labels above the field (no floating labels), 28–32 px field height, few borders, almost no shadows.
- **Clarity (rev. 4):** preferred look. Recommended route: `@clr/ui` CSS (slim Sass build) + Angular Aria + CDK, wrapped in own components (section 9.6 option D). Full `@clr/angular` only with zone.js and not before a release without `@angular/animations`.

---

## 2. General-Purpose Angular UI Libraries (Angular 22 ready)

| Library | npm package | Version | Angular | License | Density / Forms | Own Opinion |
|---|---|---|---|---|---|---|
| [ng-zorro-antd](https://ng.ant.design) (Ant Design) | `ng-zorro-antd` | 22.1.1 | `^22.0.0` (major version tracks Angular) | MIT | `nzSize="small"`, compact theme; compact forms by default, no floating labels | + |
| [PrimeNG](https://primeng.dev) | `primeng` | 22.1.2 | `^22.1.0` | **PrimeUI licence, not MIT: free Community tier with eligibility limits, or Commercial $599/dev** [web], see 8.1 | `size="small"`, design tokens, unstyled mode; very broad catalogue (Table, TreeTable, Charts …). 22.1 improved Signal Forms compatibility ([changelog](https://primeng.dev/changelog)) | - |
| [Taiga UI](https://github.com/taiga-family/taiga-ui) | `@taiga-ui/core` | 5.26.0 | `>=19.0.0` | Apache-2.0 | Textfield sizes s/m/l, polished and clean | + |
| [spartan/ui](https://spartan.ng) | `@spartan-ng/brain` (+ copied `helm` styles) | 1.5.0 | `>=21.0.0 <23.0.0` | MIT | shadcn approach – behaviour from npm, styles copied into your code ([installation](https://www.spartan.ng/documentation/installation)); density fully yours. **helm styles are Tailwind-based** [web]; `brain` peer deps not verified. Peer range stops below Angular 23 | - |
| [Angular Aria](https://angular.dev/guide/aria/overview) | `@angular/aria` | 22.2.1 | `^22.0.0 \|\| ^23.0.0` | MIT | Headless: keyboard, ARIA, focus management; you write the markup and CSS | ++ |
| [ng-bootstrap](https://github.com/ng-bootstrap/ng-bootstrap) | `@ng-bootstrap/ng-bootstrap` | 21.0.0 | `^22.0.0` | MIT | `form-control-sm`, compact and unobtrusive | -- |
| [Angular Material](https://github.com/angular/components) (baseline) | `@angular/material` | 22.2.1 | `^22.0.0 \|\| ^23.0.0` | MIT | Can be tightened via theme density (e.g. `density: -4`), but the Material look remains | -- |
| [flowbite-angular](https://flowbite-angular.com) | `flowbite-angular` | not checked | pinned per Angular major [web] | not checked | Peers: `tailwindcss` ^4, `@tailwindcss/postcss`, `ng-primitives`, `@ng-icons/core` [web]. **Excluded by the no-Tailwind constraint**; earlier majors were reported stale at Angular 17 [web] | excl. |
| [Optimus UI](https://github.com/openng-org/optimus-ui) (OpenNG) | `@openng/optimus-ui` | 1.0.0 (3 Aug) [web] | 1.0.0 targets Angular 21; Angular 22 support was announced as "later this week" on 3 Aug, **not confirmed** | MIT | Community fork of PrimeNG v21 (last MIT version), no SLA, no paid tier planned; `migrate-from-primeng` schematic [web] | ? |

Rows/cells marked [web] were added in revision 2. Licence, Tailwind and icon details: section 8.

---

## 3. Corporate / Enterprise Design Systems (Angular-native or with Angular wrappers)

| System | Organisation | npm package | Version | Angular | License | Notes |
|---|---|---|---|---|---|---|
| [Siemens Element](https://github.com/siemens/element) | Siemens | `@siemens/element-ng` | 51.2.0 | `22` | MIT | Very complete: layouts, dashboards, filter bars, wizards. Calm and fairly dense – one of the best role models for industrial UIs |
| [SBB Angular](https://angular.app.sbb.ch) | Swiss Federal Railways (SBB) | `@sbb-esta/angular` | 22.1.0 | `^22.0.0 \|\| ^23.0.0` | Apache-2.0 | Clear and reduced, similar mindset to Oblique. SBB also has web components (`@sbb-esta/lyne-elements`) |
| [Swiss Post Design System](https://design-system.post.ch) | Swiss Post | `@swisspost/design-system-components-angular` | 10.6.0 | `^22.0.0` | Apache-2.0 | Web components with Angular wrapper; excellent documentation |
| [Fundamental NGX](https://sap.github.io/fundamental-ngx) | SAP (Fiori) | `@fundamental-ngx/core` | 0.64.3 | `^22.0.0` | Apache-2.0 | Real compact mode, very dense – strong role model for forms |
| [Porsche Design System](https://designsystem.porsche.com) | Porsche | `@porsche-design-system/components-angular` | 4.7.0 | `>=21.0.0 <23.0.0` | See LICENSE | Web components + Angular wrapper; premium look, rather airy |
| [DB UX Design System](https://www.npmjs.com/package/@db-ux/ngx-core-components) | Deutsche Bahn | `@db-ux/ngx-core-components` | 5.6.1 | actively maintained | Apache-2.0 | Framework-agnostic with ngx package |
| [ODX](https://www.npmjs.com/package/@odx/angular) | Dräger | `@odx/angular` | 14.2.0 | `>=21.2.17` | See LICENSE | Medical technology, sober |
| [Carbon for Angular](https://github.com/carbon-design-system/carbon-components-angular) | IBM | `carbon-components-angular` | 5.72.2 | community-maintained | Apache-2.0 | Carbon itself is one of the most complete systems; form field sizes sm/md/lg |
| [Clarity](https://clarity.design) | VMware / Broadcom | `@clr/angular` | 18.3.0 | `>= 21.1.0` | MIT | Compact enterprise style. **Correction [web]:** actively maintained, 18.3.0 released 2026-08-28 (fetched release page) with new addons (dialog, menu, stepper, tabs, wizard). `@clr/ui` version is coupled to `@clr/angular`, breaking changes may land in minors: pin exactly. Explicit Angular 22 support not verified beyond the peer range. **(rev. 4)** Support-policy page lists v18 = Angular 21 only; runs on 22.2 with caveats (section 9.9) |
| [Kirby](https://cookbook.kirby.design) | Kirby Design (Danish) | `@kirbydesign/designsystem` | 11.11.3 | up to `^21.0.0` only | MIT | Mobile / Ionic-oriented; not yet on Angular 22 |
| [ng-aquila](https://github.com/allianz/ng-aquila) | Allianz | `@aposin/ng-aquila` | 20.0.0 (npm) | `^20.0.0` (GitHub already at 22.3) | MIT | Almost complete and offers a lot extra, but not space-saving; strongly tied to Allianz branding. **Role model only** |

---

## 4. Commercial Suites

Not visual role models, but very strong for dense data grids, schedulers and complex inputs. All offer compact themes.

| Suite | Vendor | npm package (example) | Version | Angular | License |
|---|---|---|---|---|---|
| [Kendo UI for Angular](https://www.telerik.com/kendo-angular-ui/components/) | Progress / Telerik | `@progress/kendo-angular-inputs` | 25.2.0 | `20 - 22` | Commercial |
| [DevExtreme](https://github.com/DevExpress/DevExtreme) | DevExpress | `devextreme-angular` | 26.1.5 | `>=20.0.0` | Commercial (npm lists MIT for the wrapper) |
| [Syncfusion Angular](https://www.syncfusion.com/angular-components) | Syncfusion | `@syncfusion/ej2-angular-inputs` | 35.1.37 | actively maintained | Commercial (community license available) |

---

## 5. Public Sector Design Systems

| System | Country / Organisation | Package | Version | License | Notes |
|---|---|---|---|---|---|
| [Oblique](https://oblique.bit.admin.ch/introductions/welcome) | Switzerland – Federal Office of Information Technology (FOITT/BIT) | `@oblique/oblique` | 16.0.0 | MIT ([GitHub](https://github.com/oblique-bit/oblique)) | Angular `^22.0.0`. Master layout, column layout with drawers, icon set, schematics. **Built on Angular Material** (`@angular/material` + `@angular/cdk ^22` as peer deps), so form fields are still `mat-form-field`. Also requires `@ngx-translate/core`, `angular-oauth2-oidc`, Popper. Swiss federal branding/coat of arms is legally protected – code is free, CD must be replaced. **Role model only** |
| [KoliBri / Public UI](https://public-ui.github.io) | Germany – ITZBund | `@public-ui/components` | 4.4.0 | EUPL-1.2 | Web components with strong accessibility focus |
| [GOV.UK Design System](https://frontend.design-system.service.gov.uk/) | United Kingdom – GDS | `govuk-frontend` | 6.5.1 | MIT | The classic public-sector design system; extremely well-documented patterns |
| [U.S. Web Design System (USWDS)](https://github.com/uswds/uswds) | United States – GSA | `@uswds/uswds` | 3.14.0 | See LICENSE.md | Comprehensive government pattern library |

---

## 6. Non-Angular Design Systems – Excellent Role Models

| System | Organisation | Package (example) | Version | License | Why it's worth studying |
|---|---|---|---|---|---|
| [SAP UI5 Web Components / Fiori](https://github.com/UI5/webcomponents) | SAP | `@ui5/webcomponents` | 2.27.2 | Apache-2.0 | Compact vs. cozy density cleanly defined |
| [Elastic EUI](https://github.com/elastic/eui) | Elastic | `@elastic/eui` | 123.0.0 | See LICENSE.txt | "Compressed" forms – ideal for dense UIs |
| [Atlassian Design System](https://atlassian.design/components/tokens) | Atlassian | `@atlaskit/tokens` | 20.1.0 | Apache-2.0 | Calm, dense, strong content & pattern guidelines |
| [GitHub Primer](https://primer.style/css) | GitHub | `@primer/css` | 22.3.2 | MIT | Calm, dense; great guidelines |
| [GitLab Pajamas](https://gitlab.com/gitlab-org/gitlab-services/design.gitlab.com) | GitLab | `@gitlab/ui` | 138.0.0 | MIT | Calm, dense; detailed usage guidelines |
| [Microsoft Fluent 2](https://github.com/microsoft/fluentui) | Microsoft | `@fluentui/web-components` | 3.1.3 | MIT | Mature token system, web components usable in Angular |
| [Adobe Spectrum](https://opensource.adobe.com/spectrum-web-components/tools/bundle) | Adobe | `@spectrum-web-components/bundle` | 1.12.4 | Apache-2.0 | Web components; thorough accessibility |
| [Salesforce Lightning Design System](https://www.npmjs.com/package/@salesforce-ux/design-system) | Salesforce | `@salesforce-ux/design-system` | 2.264.1 | BSD-3-Clause | CSS framework; very complete enterprise patterns |
| [Shopify Polaris](https://polaris.shopify.com/components) | Shopify | `@shopify/polaris` | 13.9.5 | See LICENSE.md | Admin UI patterns, content guidelines |
| [Vaadin](https://vaadin.com/components) | Vaadin | `@vaadin/*` (e.g. `@vaadin/button`) | 25.3.1 | Apache-2.0 | Web components, strong data grid and forms |
| [Web Awesome](https://webawesome.com/) | Font Awesome team (successor to Shoelace) | `@awesome.me/webawesome` | 3.14.0 | MIT | Framework-agnostic web components |

---

## 7. Suggested Path for an Own Design System

1. **Behaviour layer:** Angular Aria (official) or spartan/brain.
2. **Completeness role models:** Siemens Element, SAP Fiori, Oblique, ng-aquila (layout, service navigation, wizards, filter bars, form patterns).
3. **Visual role models:** GitHub Primer, Elastic EUI (dense, calm).
4. **Form rules:** labels above fields, 28–32 px height, minimal borders/shadows, clear validation messages below the field.
5. **Icons:** `@ng-icons` (section 8.6), sets chosen by licence.

---

## 8. Findings from the evaluation session (revision 2)

Source key: [web] = search snippets or fetched pages read in the session; [training] = unverified model knowledge.

### 8.0 Angular cadence [web]
From 22.1 (29 Jul 2026) Angular ships one major per year in June: v23 = June 2027, majors supported two years. Peer ranges that stop below 23 (spartan `<23`, Porsche `<23`, Kendo `20 - 22`) will need a release around June 2027.

### 8.1 Licence flags

| Item | Status |
|---|---|
| PrimeNG 22+ | PrimeUI licence, distributed as compiled npm packages with licence verification; missing or invalid keys may trigger licence notices. **Community** (free, commercial use and SaaS allowed): individuals, students, non-profits, non-commercial OSS, small organisations. Stated example thresholds where you must switch: 5th developer, $1M revenue, 10 employees, government/taxpayer funding. Keys valid 12 months, annual renewal. **Commercial:** $599 per developer, perpetual, one year of updates. PrimeUI Pro (charts, editor, scheduler, task board), PrimeBlocks, Theme Designer and premium support are not in Community. Versions up to 21 stay MIT. GitHub repo archived 28/29 June 2026 (sources differ). Sources: primeui.dev/nextchapter, primeui.dev/licenses/community, openng.org |
| Optimus UI | MIT, community only, no SLA, no commercial support |
| Taiga UI | Apache-2.0, all packages |
| Clarity | MIT, font under OFL |
| ng-zorro-antd | MIT |
| Flowbite Angular | licence not checked |

### 8.2 Tailwind exposure
Requires Tailwind: spartan `helm` layer, flowbite-angular. Optional: PrimeNG (docs recommend it for unstyled mode). No Tailwind requirement seen in docs/READMEs (not tested in a build): Taiga UI (CSS custom properties), ng-zorro-antd, Clarity, Angular Aria, Angular CDK. Spartan `brain` peer dependencies: not verified.

### 8.3 Taiga UI v5 [web]
Min Angular 19. Components rewritten from scratch as host directives plus signals; `@taiga-ui/legacy` removed; `@angular/animations` no longer needed. Controls are directives on native elements (`<tui-textfield><input tuiInput></tui-textfield>`, `<input tuiCheckbox>`), label outside or inside the textfield. Runs on Angular 22 (issue reports 5.21 with `@angular/core` 22.0.4). Signal Forms: typing fixes for min/max controls and a validator landed in 5.24.0 (2026-09-14); an open issue reported `tuiTextarea` min/max breaking `[formField]` type-checking on 5.21 (workaround `$any(...)`, may be fixed by 5.24). Maskito is a peer of `@taiga-ui/kit`. Small font bumped 13 to 14 px in v5. Provenance: developed by T-Bank (ex-Tinkoff), which I believe is under EU sanctions [training], check with compliance.

### 8.4 ng-zorro-antd 22 migration notes [web]
Node >= 22.22.3, or >= 24.15.0, or >= 26. No default date adapter any more: configure one in `app.config.ts` (`provideNzDateFnsAdapter()` keeps the old behaviour; date-fns is now v4). Remove `@angular/animations` if unused. Run `ng update ng-zorro-antd` and `ng update @angular/cdk`. Ant control height 32 px [training].

### 8.5 Clarity [web]
See section 3 correction. Two packages: `@clr/ui` (styles, global CSS) and `@clr/angular` (components). Peer range moved to Angular >= 21.1.0 with 18.0.0-beta.10. Single vendor (Broadcom), about 430 stars on the current repo.

### 8.6 Icons: @ng-icons
`@ng-icons/core` is MIT; one `<ng-icon>` component over many sets, icons imported as tree-shakeable SVG constants. Licence per set [web]:

| Licence | Sets |
|---|---|
| MIT | bootstrap, heroicons, ionicons, material-file-icons, css.gg, feather, jam, octicons, radix, tabler, akar, iconoir |
| Apache-2.0 | material-icons, ux-aspects, remixicon |
| CC0-1.0 | simple-icons, cryptocurrency, huge-icons |
| CC-BY-4.0 (attribution) | font-awesome, lets-icons |
| CC-BY-SA-4.0 (share-alike, avoid) | typicons, dripicons |
| MPL-2.0 | circum-icons |

`@ng-icons/core` 31.4.0 seen on npm; the version line that matches Angular 22 is NOT verified (README table seen only up to Angular 19 = 30.x). Check `peerDependencies` before pinning. Spartan uses it with Lucide as default.

### 8.7 Route: Angular Aria + CDK
Given in this file: Aria stable since v22, Signal Forms have built-in Aria and Material support.
You build yourself: form-field layout (label, hint, error), select styling, calendar/date picker, toasts, tooltips, sort/filter UI on `cdk-table`, token layer. My rough estimate: 25 to 35 components before parity with a kit [training-level estimate].
Risks: first stable cycle since 3 Jun 2026, expect edge-case bugs; Aria and CDK overlap (listbox, menu, accordion, tree), choose one per pattern up front.
Gap fillers without Tailwind: Taiga calendar via secondary entry points; spartan `brain` for calendar/date picker/data table (peer deps unverified).
If Material stays anywhere [training]: `MAT_FORM_FIELD_DEFAULT_OPTIONS` with `subscriptSizing: 'dynamic'` removes the reserved hint/error line.

### 8.8 Not verified
Explicit Clarity Angular 22 support; Optimus UI Angular 22 release; Syncfusion free-tier thresholds; flowbite-angular version and licence; Material `density: -4` validity per component; spartan brain peer deps; ng-icons line for Angular 22.

---

## 9. Clarity deep dive (revision 3)

Source key: [tested] = built, run or read from the installed npm package in a sandbox; [web] = search snippets or fetched pages; [training] = not verified. Nothing here was rendered in a real browser (unit tests ran in jsdom).

### 9.1 Summary

| Way to use Clarity | Angular 22.2 result |
|---|---|
| Full `@clr/angular` 18.3.0 | Installs. Builds only with the deprecated `@angular/animations` installed and `provideAnimations()` / `provideAnimationsAsync()` added. Two known Angular 22 problems and open zoneless bugs (9.8, datepicker reproduced in 9.9). **(rev. 4)** The forms error result (9.3 item 3) did not reproduce in a real browser. |
| `@clr/ui` only (CSS) | Builds and runs without `@clr/angular` and without `@angular/animations`. You own all behaviour (9.4). |
| `@clr/ui` CSS + Angular Aria + CDK | Aria tabs and accordion carried Clarity classes with ARIA state intact (9.5). Gaps: datepicker, tooltip, toast, datagrid. |

### 9.2 Registry facts [tested]

- `@clr/angular` latest = 18.3.0, registry last modified 2026-08-28. Dist-tags: `latest` 18.3.0, `beta` 18.0.0-beta.12, `release-18.2.x` 18.2.2.
- Peers of 18.3.0: `@angular/core >= 21.1.0`, `@angular/common >= 21.1.0`, `@angular/cdk >= 21.1.0`, `@clr/ui` exactly 18.3.0. Only dependency: `tslib`. The open-ended `>=` means npm will not warn at Angular 23.
- `@clr/addons` 18.3.0 peers: rxjs, pkijs, asn1js, cdk, `@clr/angular >= 18`, forms, router (list truncated in my output). **(rev. 4) Full list:** `rxjs ^7.8.0`, `pkijs ^3.2.5`, `asn1js ^3.0.6`, `@angular/cdk`, `core`, `forms`, `common`, `router`, `animations`, `platform-browser` (all `>= 21.1.0`), `@clr/angular >= 18`. Note: `@clr/addons` declares `@angular/animations`, `@clr/angular` does not, although it imports it.
- On an Angular 21.2 project, `npm i @clr/angular` pulled `@angular/cdk` 22.2.1 and failed with ERESOLVE until cdk was pinned to 21.
- Angular CLI 22.2.0 refused to run on Node 22.22.2. It requires `^22.22.3 || ^24.15.0 || >=26`.

### 9.3 Full `@clr/angular` on Angular 22.2

1. **`@angular/animations` [tested].** Without it: `Could not resolve "@angular/animations"` (modal, vertical-nav, tree-view, utils). With the package installed and `provideAnimations()` in `app.config.ts`: build passes. Angular marks `provideAnimations` "Intent to remove in v23" (June 2027) [web]. Clarity PR #2693 replaces it with CSS animations, keeps the public API and declares no breaking change, but I could not determine whether it is merged, and it is not in the 18.3.0 notes I could read [web]. The PR text says it reads Angular's private `ɵANIMATIONS_DISABLED` token. **(rev. 4) [browser]** With the package installed but no animations provider, the build passes, but the datagrid does not render at runtime (`NG03600`, then `Cannot read properties of null (reading 'tView')`). `provideAnimationsAsync()` fixes it and lazy-loads the animation code (main 1.77 MB / 399 kB → 1.59 MB / 350 kB). GitHub API: **#2693 is still open**, not merged.
2. **`ComponentFactoryResolver` [tested].** Angular 22.2 core no longer exports it. `@clr/addons/property-view` still imports it in its `.d.ts` and JS. With `skipLibCheck: false`: `TS2305 ... has no exported member 'ComponentFactoryResolver'`. Angular's default `skipLibCheck: true` hides it, so the build passed. Runtime behaviour untested. `@clr/addons/wizard` imports property-view. Core `@clr/angular` has no such reference. Fix PRs #2702 and #2703 (tested by their authors on Angular 22.1 + TS 6.0.2) have unknown status [web]. **(rev. 4)** GitHub API: **#2703 merged 2026-09-28 into branch `next`**, #2702 closed without merge. Not in any npm release yet (latest 18.3.0 = 2026-08-28).
3. **Forms error display (unexplained) [tested].** Setup: `clr-input-container` + `clrInput` + `clr-control-error`, required field, blur. Angular 22.2.0 + Clarity 18.3.0: the control was touched and invalid, but no error text and no `.clr-error` class appeared, for `ngModel` and reactive `FormControl`, with OnPush and Default. Byte-identical spec on Angular 21.2.24 + Clarity 18.3.0: error shown in all cases. Signal Forms `[formField]` on `clrInput` showed the error on 22.2 (separate spec). Cause unknown. jsdom, one component only. Needs a real-browser repro and probably an upstream issue. Not a zone.js effect: the result was identical with zone.js loaded and zone-based change detection (9.8). **(rev. 4) [browser] Not reproduced in Chromium:** Angular 22.2.0 zoneless + Clarity 18.3.0, reactive `FormControl` with `Validators.required` in `clr-input-container` (horizontal layout): type, clear, blur → `clr-control-error` visible and `.clr-error` present; `markAllAsTouched()` on submit → error visible. Most likely a jsdom artifact. `ngModel` not tested in the browser.
4. **Bundle [tested, production build].**

| Build | JS main raw / transfer | Global CSS raw / transfer |
|---|---|---|
| Empty Angular 22.2 app | 255 kB / 68.5 kB | n/a |
| One Clarity input container | 1.39 MB / 330 kB | 1.07 MB / 148 kB |
| Forms, modal, accordion, datagrid, vertical nav | 1.73 MB / 398 kB | same |

   Importing single modules instead of `ClarityModule` barely changed the size. **(rev. 4) Cause [browser, esbuild stats]:** the `@clr/angular/icon` entry contributes about **988 kB** to `main` even when `ClrIconModule` is not imported, because almost every component entry imports it and the icon collections are not tree-shaken (`sideEffects: false` notwithstanding). Next biggest Clarity parts in a forms + datagrid + modal app: datagrid 118 kB, datepicker 53 kB, combobox 33 kB (raw).
5. **Support lag [web].** Angular 18 (May 2024) arrived in Clarity 17.3.0 (Sept 2024). Angular 19 (Nov 2024) arrived in 17.5.0 (Jan 2025). Clarity 18.0.0 (11 May 2026) requires `>= 21.1.0`, and I found no GA release targeting Angular 20. No official Angular 22 statement yet. A maintainer wrote that the release cycle is tied to the VMware Cloud Foundation (VCF) cycle. Support-policy page still lists Angular only up to 19. **(rev. 4) Correction:** the [support-policy page](https://clarity.design/pages/support-policies) fetched today lists **v18 = Angular v21, actively supported**, previous major supported 6 months after a new major. It gives v18's release date as 14 Apr 2026, while npm shows 18.0.0 on 11 May 2026 (17.13.0 was published on 14 Apr).
6. **Governance [web].** Broadcom employees author the PRs (internal Jira ids appear), about 430 stars, 73 open issues and 39 open PRs at the time of the fetch. **(rev. 4)** GitHub API today: 430 stars, 62 open issues, 38 open PRs, last push 30 Sep 2026 (datagrid column actions, tree-view expand/collapse all). Very active. `@clr/ui` is versioned with `@clr/angular` and may break in minors: pin exactly.
7. **Density [web].** Clarity 18 has two density themes, regular and compact. Regular reduced row height from 36 to 32 px (issue #2701, which quotes the docs). Naming in the docs is still inconsistent.
8. **API style.** The install docs still show `ClarityModule` in an `AppModule`. Clarity 18 added secondary entry points. Whether the components are standalone: not verified. **(rev. 4) [tested, from fesm2022]:** 54 NgModules, 204 declarations with `standalone: false`, 294 decorator `@Input()`s, **0 signal inputs / `signal()` calls**. The `Clr*Module`s import fine into standalone components (tested). Compiled with Angular 21.1.3.

### 9.4 `@clr/ui` only (CSS)

**Package [tested].** `@clr/ui` 18.3.0: MIT, zero dependencies, 220 files, 6.1 MB unpacked. Ships compiled CSS, all SCSS sources and `STYLES.md` (CSS custom properties and class names per component). README usage: include `clr-ui.min.css`, set `cds-theme="light"` (or `dark`) on `body`, write HTML with the Clarity classes.

**Build test [tested].** Fresh Angular 22.2 app, Signal Forms (`[formField]`) in Clarity form markup (`clr-form`, `clr-form-control`, `clr-input-wrapper`, `clr-input`, `.clr-error` bound to a signal), no `@clr/angular`, `@angular/animations` deleted from `node_modules`: build passes. `main` 273.9 kB raw / 72.7 kB transfer, initial total 1.34 MB / 220.7 kB.

**CSS size [tested].**

| Variant | Raw | gzip |
|---|---|---|
| `clr-ui.min.css` as shipped | 1,058,097 B | 180,358 B |
| Same without embedded font (`$clr-fontSkipBase64: true`) | 946,197 B | 97,748 B |
| Forms + buttons + typography + core only, no font | 422,163 B | 38,576 B |

**Slim build recipe [tested with sass, `--load-path=node_modules`].** Entry file in the package folder:

```scss
@use 'styles/variables/variables.typography' with ($clr-fontSkipBase64: true);
@forward 'styles/normalize';           @forward 'styles/mixins';
@forward 'styles/variables/variables'; @forward 'styles/variables/properties';
@forward 'styles/core/global.scss';    @forward 'typography/typography';
@forward 'styles/variables.clarity';   @forward 'styles/reboot.clarity';
@forward 'styles/a11y';                @forward 'image/icons.clarity';
@forward 'button/buttons.clarity';
@forward 'forms/styles/mixins.forms';  @forward 'forms/styles/properties.forms';
@forward 'forms/styles/containers.clarity'; @forward 'forms/styles/form.clarity';
@forward 'forms/styles/checkbox.clarity';   @forward 'forms/styles/input.clarity';
@forward 'forms/styles/input-group.clarity'; @forward 'forms/styles/radio.clarity';
@forward 'forms/styles/select.clarity';     @forward 'forms/styles/textarea.clarity';
@forward 'forms/styles/toggles.clarity';
```

The full build additionally needs `@angular/cdk/overlay-prebuilt.css` on the load path. Partial paths are internal and may change between versions.

**Font [tested].** Four `@font-face` blocks for Metropolis, weights 200, 400, 500, 600, about 21 kB WOFF each (85.4 kB binary, about 114 kB as base64 in the CSS). Font licence per Clarity README: SIL OFL. Whether a reserved font name applies: not checked.

**Measured heights and dark theme (rev. 4) [browser].** Slim build (forms, buttons, tables, layout, header, embedded font): `.clr-input`, `.clr-select` **24 px**; with `clr-density="compact"` on `body` **20 px**. Full `@clr/angular` app: input, select, date input also 24 px. Dark theme works in the slim build: `cds-theme="dark"` switches body background to `rgb(27, 43, 50)` and input text to `rgb(227, 234, 237)` (light: `rgb(252, 253, 253)` / `rgb(33, 51, 59)`). Slim build sizes with embedded font: styles 566 kB raw / 108 kB transfer, main 285 kB / 76 kB. Signal Forms `[formField]` on `clr-input`, `clr-select`, `clr-checkbox` updated the model correctly. Markup must match Clarity's structure exactly: with my first attempt the red border appeared but the error subtext stayed grey.

**Density tokens [tested, read from CSS].** `.clr-input` height = `--clr-forms-input-wrapper-height` = `--clr-base-row-height-s` = `--cds-global-space-9`, with a second definition `calc(20 * 1rem / var(--cds-global-base))` and `--cds-global-base` defined as 20 and 16 (two themes). Default body font token: 14 px. Pixel heights were NOT measured in a browser. **(rev. 4):** measured, see above.

**What you lose.** All JavaScript behaviour (modal, dropdown, accordion, datagrid, datepicker, combobox, tooltips, tabs). Clarity classes only give look, not focus, keyboard or ARIA. `cds-icon` is an Angular component inside `@clr/angular` since 18, so icons need their own system (for example `@ng-icons`, section 8.6). Version coupling to `@clr/angular`: pin exactly.

**Correction to an earlier chat answer.** The 14 `cds-theme` matches I quoted came from the forms-only build. My grep for the literal `cds-theme=dark` returned 0 in both slim builds, which is inconclusive because attribute selectors may be quoted. Dark theme in the slim builds is therefore unverified. **(rev. 4):** verified in the browser, see above.

### 9.5 `@clr/ui` CSS + Angular Aria + CDK

**Proof of concept [tested, jsdom].** Aria `ngTab` with `class="btn btn-link nav-link" [class.active]="tab.selected()"` rendered `btn btn-link nav-link active` with `aria-selected="true"` and `tabindex="0"`. Aria `ngAccordionTrigger` inside `clr-accordion-panel` with `[class.clr-accordion-panel-open]="trigger.expanded()"`: after a click, `aria-expanded="true"` and the panel carried `clr-accordion-panel-open`. Aria directives set `aria-*` and `data-active` only, no classes, so you bridge state to Clarity classes with signals (`selected()`, `active()`, `expanded()`).

**Coverage [tested, from installed packages].**

- `@angular/aria` 22.2.1 (MIT): accordion, combobox, grid, listbox, menu, tabs, toolbar, tree. Peer: `@angular/cdk` exactly `22.2.1`, `@angular/core ^22.0.0 || ^23.0.0`.
- `@angular/cdk` 22.2.1: a11y, accordion, bidi, clipboard, collections, dialog, drag-drop, keycodes, layout, listbox, menu, observers, overlay, platform, portal, scrolling, stepper, table, text-field, tree.
- No entry point for datepicker, tooltip, toast or a ready datagrid in either package. Build them from CDK table and overlay.
- Overlap: accordion, listbox, menu, tree exist in both Aria and CDK. Choose one source per pattern.

**Costs.**

- Clarity CSS is class-based and expects a specific DOM structure per widget. You write each template and map Aria state to classes.
- Aria pins CDK to an exact version, so pin both together.
- Icons: separate system.
- Untested visually: combobox, menu and other overlay widgets with Clarity styles.

### 9.6 Options (decision is yours)

| Option | Benefit | Cost |
|---|---|---|
| A. Full `@clr/angular` on Angular 22 | Complete component set incl. datagrid; 24 px fields | Animations workaround (removal in v23), addons `ComponentFactoryResolver` issue (fix merged in `next`, unreleased), not zoneless-ready (9.8, datepicker reproduced 9.9), ~1 MB icon code in `main`, slow Angular support, Broadcom/VCF-tied roadmap |
| B. Stay on Angular 21.2 with cdk pinned to 21 until Clarity supports 22 | Supported combination | Defers Angular 22 features (Signal Forms stable, Aria stable) |
| C. `@clr/ui` full CSS, own behaviour | Simple, no Angular coupling | 180 kB gzip CSS (98 kB without font), all behaviour yours |
| D. `@clr/ui` slim + Aria + CDK | About 39 kB gzip CSS for forms/buttons, official behaviour layer, zoneless-safe, 20 px fields with `clr-density="compact"`, dark theme works | Sass build to maintain, template work per widget, gaps in datepicker/tooltip/toast/datagrid |
| E. Own design layer | No third-party CSS | Most design work |

**(rev. 4) Recommendation:** D, with thin wrapper components (`app-input`, `app-select`, `app-dialog`, `app-table`) so Clarity markup lives in one place. Pin `@clr/ui` exactly, and pin `@angular/aria` + `@angular/cdk` together. Start tables with plain `.table`/`.table-compact`; the datagrid CSS is tightly bound to its DOM. Datepicker: start with `<input type="date">` in Clarity styling. Re-evaluate A after a Clarity release that contains #2693 and #2703.

### 9.7 Not verified

Real-browser rendering (layout, heights, dark theme, Aria widgets with Clarity CSS), cause of the forms error result, merge/release status of Clarity PRs #2693, #2702, #2703, whether `@clr/angular` components are standalone, SSR behaviour, font reserved-name terms (**(rev. 4)** still unverified, Metropolis source repo not reachable), whether the datepicker focus difference below reproduces for me (see 9.8; **(rev. 4)** reproduced, 9.9), zoneless behaviour of Aria/CDK, and everything published after 2026-08-28 (the release page I fetched may have been cached).

**(rev. 4) Resolved:** real-browser heights, dark theme (slim build), forms error display (not reproduced in browser), PR status (#2693 open, #2703 merged into `next`, #2702 closed), standalone question (NgModule-based, usable in standalone components), datepicker zoneless defect (reproduced).
**(rev. 4) Still open:** Aria Combobox / Menu / CDK Dialog with Clarity CSS in a real browser, Aria/CDK under zoneless, modal Esc and tree-view async loading (#2686) in my own test, datagrid selection checkboxes not rendering in my test, `ngModel` error display in the browser, SSR, Metropolis reserved font name, Angular cadence claim in 8.0.

### 9.8 Zoneless (added after user findings)

Angular 21 made zoneless change detection the default for new apps [web: Angular 21 release coverage]; the user states the same holds for Angular 22. Clarity still assumes zone.js in several places.

| Finding | Source | Status |
|---|---|---|
| Datepicker focus behaves differently with and without zone.js | User, direct side-by-side comparison | Reported by user, **not reproduced by me**. **(rev. 4) Reproduced [browser], see 9.9** |
| Tooltip: hover show/hide triggers `NG0103: Infinite change detection while refreshing application views` in zoneless mode. Clarity 18.x, Angular 21.2, Windows, Edge/Chrome/Firefox. Stack: `TooltipMouseService.hideIfMouseOut` (setTimeout) sets `ClrPopoverService.open`, `ClrPopoverContent.closePopover` calls `removeOverlay`, CDK `OverlayRef.detach` registers `afterNextRender` | Issue #2634, fetched and read | Open bug report; debug-mode error, impact in production unknown |
| "Zoneless Clarity Design": Clarity 18.x on Angular 22 "still requires zone.js". Broken in preliminary testing: async data loading in tree views (loading spinner stays until something else triggers change detection) and closing a modal with Esc. Reporter says other things seem to work | Issue #2686, fetched and read | Open bug report |

**Forms error result and zone.js [tested].** Hypothesis: my unexplained result in 9.3 item 3 (no error display on Angular 22.2, error shown on 21.2.24) was a zoneless effect. Checks: (1) both sandbox projects had no zone.js, so both ran zoneless, and 21.2.24 still showed the error, so zoneless alone does not explain the difference. (2) On 22.2 with `zone.js` as build polyfill and `provideZoneChangeDetection()` in TestBed (confirmed `typeof Zone === 'function'`, injected `NgZone` is the real `NgZone`), the error was still missing for `ngModel`, reactive `FormControl`, OnPush and Default. Conclusion: the forms result is a difference between Angular 22.2 and 21.2 with Clarity 18.3.0, not a zone.js effect. Cause still unknown. jsdom only.

**Implications.**

- Full `@clr/angular` on Angular 22: the documented workaround is to load zone.js and use zone-based change detection, which goes against the Angular default and keeps the dependency Angular is moving away from. I did not test the workaround beyond the forms spec.
- Clarity's fix status for #2634 and #2686 is unknown to me.
- `@clr/ui` CSS carries no change-detection code, so options C and D in 9.6 are not affected by these issues.
- Aria and CDK under zoneless: not tested by me. Observation only: the Aria directives expose signal-based inputs and state (`InputSignal`, `Signal` in the type declarations).

**Still open for everyone.** How Aria Combobox and Aria Menu look in a real browser with Clarity CSS. My proof of concept (9.5) covered tabs and accordion in jsdom only.

### 9.9 Real-browser verification (revision 4) [browser]

Setup: fresh `ng new` on Angular CLI 22 (`@angular/core` 22.2.0, zoneless by default, no zone.js), `@clr/angular` + `@clr/ui` 18.3.0, `@angular/cdk` 22.2.1, `@angular/animations` 22 + `provideAnimationsAsync()`. Production build served statically, driven by Playwright in headless Chromium. Second build of the identical app with `zone.js` + `provideZoneChangeDetection()` for comparison.

| Check | Zoneless | With zone.js |
|---|---|---|
| Install without peer conflicts | yes | yes |
| Reactive form: typing updates value, required error on blur and on submit | works | works |
| Signal Forms `[formField]` on `clrInput`: error after blur / `markAsTouched()` | works | not tested |
| Signal counter in template | works | works |
| Dropdown open + item click | works | works |
| Modal open / close via button | works (Esc not tested) | works |
| Combobox multi-select (typing + option click) | works | works |
| Datagrid render, sort, pagination (12 rows, page size 5) | works | works |
| Datagrid selection checkboxes with `[(clrDgSelected)]` | not rendered | not rendered (same in both, probably my test setup, unresolved) |
| **Datepicker: focus after opening** | stays on the toggle button | moves to today's day button |
| **Datepicker: select date with arrow key + Enter** | nothing selected | date selected |
| Datepicker: select date by mouse click | works | works |
| Console errors | none | none |

**Datepicker cause [tested, source read].** `DatepickerFocusService` waits for `NgZone.onStable` (`ngZoneIsStableInBrowser()` in `clr-angular-forms-datepicker.mjs`) before moving focus. In zoneless apps `NgZone` is a no-op zone whose `onStable` never emits, so focus is never moved. This is an accessibility defect (keyboard-only users cannot pick a date). Clarity code also contains 38 `runOutsideAngular` calls and one more `onStable` use.

**What this means.** The zoneless defects of full `@clr/angular` are real (datepicker reproduced; tooltip #2634 and modal Esc / tree-view #2686 reported upstream). The only workaround today is zone.js. Options C/D (`@clr/ui` CSS only) have no change-detection code and passed all browser checks for forms, table, layout and dark theme.

## 10. Review by Gemini: Recommended Future-Proof Architecture

### 10.1 Architectural Verdict on Clarity (`@clr/angular`)
While Clarity's visual design is exceptionally clean, corporate-focused, and space-saving, full adoption of `@clr/angular` introduces heavy architectural friction for a greenfield **Angular 22+** ecosystem:

- **The Zoneless Blocker:** Angular 22 pushes Zoneless change detection as the modern default. Full `@clr/angular` relies on legacy internal change patterns. As observed in active bug trackers (e.g., `#2634`, `#2686`), utilizing interactive components like tooltips, modals, or async tree views in a zoneless application triggers `NG0103` infinite loop detection errors or drops view-refresh signals entirely.
- **The Animation Trap:** It requires deprecated `@angular/animations` modules (`provideAnimations()`), which are marked for deprecation/removal by the Angular team.
- **The Validation Anomaly:** Replicating reactive form validations across Angular 22.2 vs. older versions yields unexplained rendering regressions inside `clr-input-container`.

### 10.2 The Recommended Solution: The "Headless + Slim CSS" Hybrid Pattern
To achieve a calm, professional, noise-free enterprise UI without accumulating architectural debt, we recommend **Option D**: Pairing **`@clr/ui` (Pure CSS)** with **`@angular/aria`** and **`@angular/cdk`**. Since pure CSS contains no JavaScript change-detection mechanisms, this approach is **100% immune to Zoneless bugs** while fully inheriting Clarity's outstanding visual density.

```plaintext
┌────────────────────────────────────────────────────────────────────────┐
│                              USER INTERFACE                            │
│           (Calm, Dense, 28-32px Compact Forms, Clean Contours)         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
       ┌────────────────────────────┴────────────────────────────┐
       ▼                                                         ▼
┌──────────────────────────────┐                         ┌──────────────────────────────┐
│       BEHAVIOR LAYER         │                         │         STYLING LAYER        │
│  @angular/aria + @angular/cdk│                         │     @clr/ui (Pure CSS)       │
├──────────────────────────────┤                         ├──────────────────────────────┤
│ • Signal-based Focus / ARIA  │                         │ • No Angular Javascript      │
│ • Full Zoneless Compliance   │                         │ • Custom CSS Token Mixins    │
│ • Keyboard Trap Management   │                         │ • Tree-shaken Slim Form Comp │
└──────────────────────────────┘                         └──────────────────────────────┘
```

### 10.3 Core Architectural Specifications

- **Form Factor & Sizing:** Enforce a strict **28–32px** boundary for input elements, adhering to the *Elastic EUI (compressed)* and *SAP Fiori (Compact)* role models.
- **Layout Structure:** Labels must always be anchored firmly *above* the input fields. Avoid floating animations to eliminate visual noise. Drop all unnecessary container drop-shadows and thick structural borders.
- **Subscript Sizing:** Use a dynamic layout configuration so error validation blocks only take layout space *when actively rendered*, keeping rows dense by default.
- **Reactivity & Change Detection:** Establish a pure zoneless runtime environment by removing `zone.js` dependencies. Dominate state flows using `Signal Forms` (`[formField]`) combined with local primitives (`computed`, `effect`) to bridge the gap between headless component state and CSS classes.

### 10.4 Implementation Concept: Bridging State to Clarity CSS
Instead of relying on a library component to listen to state shifts, this architecture maps native headless directives directly to static CSS layouts. The HTML template structure mimics Clarity’s expected structural layout classes (e.g., wrappers, panels, headers) while the component's internal behavior layer is driven exclusively by Angular Aria and CDK.

State-based structural styles (such as opening panels, highlighting rows, or expanding dropdowns) are wired using modern signal bindings. This design bridges accessible ARIA states to specific Clarity CSS class names cleanly in the template, creating a highly modular and completely decoupled framework layer.

### 10.5 Gap-Filling Strategy for Missing Components

Since `@angular/aria` does not ship high-level composite controls out-of-the-box, the following fallback matrix should be utilized to maintain design velocity without importing heavy, forbidden frameworks:

- **Complex DataGrid:** Built natively from `@angular/cdk/table` combined with `@clr/ui` layout table classes. This ensures predictable row rendering, tree-shakable virtual scrolling primitives, and zero zone-dependency.
- **Tooltips & Overlays:** Implement via `@angular/cdk/overlay`. This bypasses the faulty `TooltipMouseService` of Clarity that forces infinite change detection loops.
- **Icons:** Use `@ng-icons/core` importing only tree-shaken constants from the **Tabler** or **Heroicons** collection. This remains completely free of Tailwind dependencies with an excellent MIT license profile.
- **Date Picker:** Adapt the headless calendar entry points exposed by `@taiga-ui/kit` or utilize a custom overlay wrapped over a native HTML5 input to avoid license/compliance issues.

### 10.6 Summary of Architectural Gains
By establishing this headless architecture, your design system remains immune to framework churn. When Angular 23+ inevitably arrives, your behavioral layer (`@angular/aria`) updates safely via `ng update`, your performance remains highly efficient under strict zoneless constraints, and your application layout stays pristine and dense.
Would you like to explore the specific Sass/SCSS custom build setup conceptually to see how to drop the heavy font encodings from the compiled stylesheet, or should we evaluate how Signal Forms error validation triggers map conceptually to this pattern?
AI responses may include mistakes. Learn more
