# Miscellanous

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=5 orderedList=false} -->

<!-- code_chunk_output -->

- [Diagram Maker by awslabs](#diagram-maker-by-awslabs)
- [&#10003; G6 from '@antv/g6'](#10003-g6-from-antvg6)

<!-- /code_chunk_output -->

## Compodoc

### Options

```bash
❯ npx @compodoc/compodoc
1.2.1

TypeScript version used by Compodoc : 5.9.2

TypeScript version of current project : 5.9.3

Node.js version : v24.12.0

Operating system : macOS Unknown

[13:36:18] No configuration file found, switching to CLI flags.
[13:36:18] tsconfig.json file was not found, please use -p flag
Usage: compodoc <src> [options]

Options:
  -V, --version                             output the version number
  -c, --config [config]                     A configuration file : .compodocrc, .compodocrc.json, .compodocrc.yaml or compodoc property in package.json
  -p, --tsconfig [config]                   A tsconfig.json file
  -d, --output [folder]                     Where to store the generated documentation (default: "./documentation/")
  -y, --extTheme [file]                     External styling theme file
  -n, --name [name]                         Title documentation (default: "Application documentation")
  -a, --assetsFolder [folder]               External assets folder to copy in generated documentation folder
  -o, --open [value]                        Open the generated documentation
  -t, --silent                              In silent mode, log messages aren't logged in the console (default: false)
  -s, --serve                               Serve generated documentation (default http://localhost:8080/) (default: false)
  --host [host]                             Change default host address
  -r, --port [port]                         Change default serving port (default: 8080)
  -w, --watch                               Watch source files after serve and force documentation rebuild (default: false)
  -e, --exportFormat [format]               Export in specified format (json, html) (default: "html")
  --files [files]                           Files provided by external tool, used for coverage test
  --language [language]                     Language used for the generated documentation (bg-BG, de-DE, en-US, es-ES, fr-FR, hu-HU, it-IT, ja-JP, ka-GE, ko-KR,
                                            nl-NL, pl-PL, pt-BR, ru-RU, sk-SK, zh-CN, zh-TW) (default: "en-US")
  --theme [theme]                           Choose one of available themes, default is 'gitbook' (laravel, original, material, postmark, readthedocs, stripe, vagrant)
  --hideGenerator                           Do not print the Compodoc link at the bottom of the page (default: false)
  --hideDarkModeToggle                      Do not show dark mode toggle button at the top right position of the page (default: false)
  --toggleMenuItems <items>                 Close by default items in the menu values : ['all'] or one of these
                                            ['modules','components','directives','controllers','entities','classes','injectables','guards','interfaces','interceptors','pipes','miscellaneous','additionalPages']
                                            (default: ["all"])
  --navTabConfig <tab configs>              List navigation tab objects in the desired order with two string properties ("id" and "label"). Double-quotes must be
                                            escaped with '\'. Available tab IDs are "info", "readme", "source", "templateData", "styleData", "tree", and "example".
                                            Note: Certain tabs will only be shown if applicable to a given dependency (default: "[]")
  --templates [folder]                      Path to directory of Handlebars templates to override built-in templates
  --includes [path]                         Path of external markdown files to include
  --includesName [name]                     Name of item menu of externals markdown files (default: "Additional documentation")
  --coverageTest [threshold]                Test command of documentation coverage with a threshold (default 70)
  --coverageMinimumPerFile [minimum]        Test command of documentation coverage per file with a minimum (default 0)
  --coverageTestThresholdFail [true|false]  Test command of documentation coverage (global or per file) will fail with error or just warn user (true: error, false:
                                            warn) (default: true)
  --coverageTestShowOnlyFailed              Display only failed files for a coverage test
  --unitTestCoverage [json-summary]         To include unit test coverage, specify istanbul JSON coverage summary file
  --disableSourceCode                       Do not add source code tab and links to source code (default: false)
  --disableDomTree                          Do not add dom tree tab (default: false)
  --disableTemplateTab                      Do not add template tab (default: false)
  --disableStyleTab                         Do not add style tab (default: false)
  --disableGraph                            Do not add the dependency graph (default: false)
  --disableCoverage                         Do not add the documentation coverage report (default: false)
  --disablePrivate                          Do not show private in generated documentation (default: false)
  --disableProtected                        Do not show protected in generated documentation (default: false)
  --disableInternal                         Do not show @internal in generated documentation (default: false)
  --disableLifeCycleHooks                   Do not show Angular lifecycle hooks in generated documentation (default: false)
  --disableConstructors                     Do not show constructors in generated documentation (default: false)
  --disableRoutesGraph                      Do not add the routes graph (default: false)
  --disableSearch                           Do not add the search input (default: false)
  --disableDependencies                     Do not add the dependencies list (default: false)
  --disableProperties                       Do not add the properties list (default: false)
  --disableFilePath                         Do not add the file path (default: false)
  --disableOverview                         Do not add the overview page (default: false)
  --templatePlayground                      Generate template playground page for customizing templates (default: false)
  --minimal                                 Minimal mode with only documentation. No search, no graph, no coverage. (default: false)
  --customFavicon [path]                    Use a custom favicon
  --customLogo [path]                       Use a custom logo
  --gaID [id]                               Google Analytics tracking ID
  --gaSite [site]                           Google Analytics site name (default: "auto")
  --publicApiOnly [path]                    Document only symbols exported from index.d.ts files in the specified dist folder
  --maxSearchResults [maxSearchResults]     Max search results on the results page. To show all results, set to 0 (default: 15)
  -h, --help                                display help for command
  ```

### Examples

```bash
# -s -o -> serve and open the documentation in the browser
npx @compodoc/compodoc -p apps/cloudlib-fe/tsconfig.app.json -s -o
npx @compodoc/compodoc -p apps/cloudlib-fe/tsconfig.app.json -d tmp/docs -s -o
npx @compodoc/compodoc -p apps/cloudlib-fe/tsconfig.app.json -d tmp/docs -s -o --theme material --name "Cloudlib FE Documentation" --minimal
npx @compodoc/compodoc -p apps/cloudlib-fe/tsconfig.app.json -d tmp/docs -s -o --theme material --name "Cloudlib FE Documentation" --minimal --templatePlayground
```

## Diagram Maker by awslabs

<https://github.com/awslabs/diagram-maker>

## &#10003; G6 from '@antv/g6'

<https://codesandbox.io/s/g6-antv-g6-example-y4h2cp>
