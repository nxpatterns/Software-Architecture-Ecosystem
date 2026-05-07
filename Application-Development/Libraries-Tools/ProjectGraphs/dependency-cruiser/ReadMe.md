# dependency-cruiser (OK)

## Install

```shell
npm i -g dependency-cruiser

# BESSER
npm install dependency-cruiser -D

# Install graphviz to visualize the output of dependency-cruiser
# For MacOS:
brew install graphviz

# Install VSCode Extension
# https://marketplace.visualstudio.com/items?itemName=tintinweb.graphviz-interactive-preview

code --install-extension tintinweb.graphviz-interactive-preview
```

If you install the local version, add it to the `package.json` scripts:

```json
{
  "scripts": {
    "depcruise": "depcruise"
  }
}
```

And then run e.g. `npm run depcruise -- --info`. The `--info` flag is important to check if the configuration is correct and all extensions are recognized.

## Configuration

Use the pre-configured `dependency-cruiser.config.js` file in the root of the workspace. Rename it before to `.dependency-cruiser.config.js` (notice the dot at the beginning) to make it work. This file is optimized for NxMonorepos.

### Explanation

Der kritische Fix ist die `extensions`\-Liste in `enhancedResolveOptions`. Ohne sie sieht enhanced-resolve `../../../services/photo-tours.service`, versucht exakt diese Datei auf Disk zu finden, scheitert -- und depcruise markiert es als `not-to-unresolvable`. Mit der expliziten Liste hängt enhanced-resolve nacheinander `.ts`, `.js` etc. an und findet die Datei.

Dasselbe gilt für `./hotspot-editor-dialog.component` -- kein `.ts` im Import, also dieselbe Symptomatik.

Die anderen Änderungen gegenüber deiner Original-Config:

- `not-to-dev-dep` from-path von dem kaputten `'^(\\.)'` auf `'^(?:apps|libs)/'` korrigiert
- `no-deprecated-core` rausgeworfen (die v8/tools-Pfade sind node-intern und relevant nur für sehr spezifische Fälle -- wenn du das brauchst, kannst du es wieder rein)
- `archi` collapsePattern auf Nx-Struktur (`apps/libs`) angepasst
- `module` zu `mainFields` hinzugefügt für ESM-Libraries

Falls das Problem trotzdem bestehen bleibt, wäre der nächste Schritt `depcruise --info` auszuführen und zu prüfen welche Extensions depcruise in deiner Umgebung erkannt hat -- manchmal liegt das Problem tiefer in der TypeScript-Installation.

## Examples (Local Versions -> npm i -D dependency-cruiser)

```bash

# Single file Output Dot (you need to install graphviz  and VSCode Extension to visualize the output.)
npx depcruise apps/cloudlib-fe/src/app/admin/services/photo-tours.service.ts --output-type dot > docs/__dependecy-graphs/photo-tours.service.dot

# Single file Output SVG
npx depcruise apps/cloudlib-fe/src/app/admin/services/photo-tours.service.ts --output-type dot | dot -T svg > docs/__dependecy-graphs/photo-tours.service.svg

# Single file Output JSON
npx depcruise apps/cloudlib-fe/src/app/admin/services/photo-tours.service.ts --output-type json > docs/__dependecy-graphs/photo-tours.service.json

# archi -> kollabieret auf Ordner-Ebene und zeigt die Architektur statt einzelner Dateien.
npx depcruise apps/cloudlib-be/src \
  --output-type archi \
  | dot -T svg > docs/__dependecy-graphs/be-architecture.svg

npx depcruise apps/cloudlib-be/src/routed/companies \
  --output-type dot --exclude 'node_modules|\.spec\.' \
  | dot -T svg > docs/__dependecy-graphs/be-companies.svg


# Show dependencies of all files in the admin panel and the services they depend on
# Format: ".dot". You need to install graphviz  and VSCode Extension to visualize the output.
npx depcruise \
  $(find apps/cloudlib-fe/src/app/admin/panel -name "*.ts" | tr '\n' ' ') \
  apps/cloudlib-fe/src/app/admin/services/auth.service.ts \
  apps/cloudlib-fe/src/app/admin/services/photo-tours.service.ts \
  --output-type dot \
  --exclude "node_modules|\.spec\." \
  > docs/__dependecy-graphs/admin-panel.dot


# Show dependencies of all files in the photo-tours panel and the services they depend on
npx depcruise \
  $(find apps/cloudlib-fe/src/app/admin/panel/photo-tours -name "*.ts" | tr '\n' ' ') \
  apps/cloudlib-fe/src/app/admin/services/auth.service.ts \
  apps/cloudlib-fe/src/app/admin/services/photo-tours.service.ts \
  --output-type dot \
  --exclude "node_modules|\.spec\." \
  > docs/__dependecy-graphs/photo-tours.dot


# Show dependencies of all files in the photo-tours panel and the services they depend on as svg
npx depcruise \
  $(find apps/cloudlib-fe/src/app/admin/panel/photo-tours -name "*.ts" | tr '\n' ' ') \
  apps/cloudlib-fe/src/app/admin/services/auth.service.ts \
  apps/cloudlib-fe/src/app/admin/services/photo-tours.service.ts \
  --output-type dot \
  --exclude "node_modules|\.spec\." \
  | dot -T svg > ./docs/__dependecy-graphs/photo-tours.svg


# Must be ./photo-tours.html on the root in the current workspace,
# because the paths in the dot file are relative to the current working directory
npx depcruise \
  $(find apps/cloudlib-fe/src/app/admin/panel/photo-tours -name "*.ts" | tr '\n' ' ') \
  apps/cloudlib-fe/src/app/admin/services/auth.service.ts \
  apps/cloudlib-fe/src/app/admin/services/photo-tours.service.ts \
  --output-type dot \
  --exclude "node_modules|\.spec\." \
  | dot -T svg | npx depcruise-wrap-stream-in-html > photo-tours.html

```
