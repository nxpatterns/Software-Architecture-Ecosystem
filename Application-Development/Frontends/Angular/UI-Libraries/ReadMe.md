# Angular UI Libraries & Design Systems – Reference Notes

Compiled: 30 September 2026
Context: Looking for mature alternatives to Angular Material (which feels visually noisy and whose form fields take up too much space). Requirement: **Angular 22+**.

> Versions and Angular peer dependencies were checked against the npm registry on 30 Sep 2026. "Angular" = `peerDependencies['@angular/core']` of the package. Density assessments are qualitative.

---

## 1. Summary & Recommendations

- **Dense, calm forms out of the box:** **ng-zorro-antd** (compact theme + `nzSize="small"`).
- **Full control, minimal look:** **spartan/ui** (shadcn-style, Tailwind) or **Angular Aria** + your own CSS (most future-proof, official Angular team package).
- **Largest component catalogue:** **PrimeNG** (use `size="small"` + custom design tokens or unstyled mode).
- **Oblique, ng-aquila & corporate systems:** use them **as role models** for completeness (layouts, navigation, form patterns), not as a dependency.
- **Best role models for compact forms:** SAP Fiori (Compact), Elastic EUI ("compressed"), Siemens Element, GitHub Primer, IBM Carbon (sm).
- **Principles of calm, dense forms:** labels above the field (no floating labels), 28–32 px field height, few borders, almost no shadows.

---

## 2. General-Purpose Angular UI Libraries (Angular 22 ready)

| Library | npm package | Version | Angular | License | Density / Forms | Own Opinion |
|---|---|---|---|---|---|---|
| [ng-zorro-antd](https://ng.ant.design) (Ant Design) | `ng-zorro-antd` | 22.1.1 | `^22.0.0` (major version tracks Angular) | MIT | `nzSize="small"`, compact theme; compact forms by default, no floating labels | + |
| [PrimeNG](https://primeng.dev) | `primeng` | 22.1.2 | `^22.1.0` | See LICENSE.md | `size="small"`, design tokens, unstyled mode; very broad catalogue (Table, TreeTable, Charts …). 22.1 improved Signal Forms compatibility ([changelog](https://primeng.dev/changelog)) | - |
| [Taiga UI](https://github.com/taiga-family/taiga-ui) | `@taiga-ui/core` | 5.26.0 | `>=19.0.0` | Apache-2.0 | Textfield sizes s/m/l, polished and clean | + |
| [spartan/ui](https://spartan.ng) | `@spartan-ng/brain` (+ copied `helm` styles) | 1.5.0 | `>=21.0.0 <23.0.0` | MIT | shadcn approach – behaviour from npm, styles copied into your code ([installation](https://www.spartan.ng/documentation/installation)); density fully yours | - |
| [Angular Aria](https://angular.dev/guide/aria/overview) | `@angular/aria` | 22.2.1 | `^22.0.0 \|\| ^23.0.0` | MIT | Headless: keyboard, ARIA, focus management; you write the markup and CSS | ++ |
| [ng-bootstrap](https://github.com/ng-bootstrap/ng-bootstrap) | `@ng-bootstrap/ng-bootstrap` | 21.0.0 | `^22.0.0` | MIT | `form-control-sm`, compact and unobtrusive | -- |
| [Angular Material](https://github.com/angular/components) (baseline) | `@angular/material` | 22.2.1 | `^22.0.0 \|\| ^23.0.0` | MIT | Can be tightened via theme density (e.g. `density: -4`), but the Material look remains | -- |

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
| [Clarity](https://clarity.design) | VMware / Broadcom | `@clr/angular` | 18.3.0 | `>= 21.1.0` | MIT | Compact enterprise style, but development appears to have slowed |
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
