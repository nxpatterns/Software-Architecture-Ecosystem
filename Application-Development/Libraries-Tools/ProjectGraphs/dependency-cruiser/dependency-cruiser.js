/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'warn',
      comment: 'Circular dependency detected. Consider dependency inversion.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-orphans',
      severity: 'warn',
      comment: 'Orphan module - likely unused. Remove it or add an exception.',
      from: {
        orphan: true,
        pathNot: [
          '(^|/)[.][^/]+[.](?:js|cjs|mjs|ts|cts|mts|json)$', // dot files
          '[.]d[.]ts$',                                        // TS declaration files
          '(^|/)tsconfig[.](?:json|.*[.]json)$',              // tsconfig variants
          '(^|/)jest[.]config[.]',                            // jest configs
          '(^|/)(?:babel|webpack)[.]config[.]',               // other configs
        ],
      },
      to: {},
    },
    {
      name: 'not-to-deprecated',
      severity: 'warn',
      comment: 'Depends on a deprecated npm package. Upgrade or replace it.',
      from: {},
      to: { dependencyTypes: ['deprecated'] },
    },
    {
      name: 'no-non-package-json',
      severity: 'error',
      comment: "Depends on an npm package not listed in package.json 'dependencies'.",
      from: {},
      to: { dependencyTypes: ['npm-no-pkg', 'npm-unknown'] },
    },
    {
      name: 'not-to-unresolvable',
      severity: 'error',
      comment: "Depends on a module that cannot be resolved to disk.",
      from: {},
      to: { couldNotResolve: true },
    },
    {
      name: 'no-duplicate-dep-types',
      severity: 'warn',
      comment: 'Package appears in both dependencies and devDependencies.',
      from: {},
      to: {
        moreThanOneDependencyType: true,
        dependencyTypesNot: ['type-only'],
      },
    },
    {
      name: 'not-to-spec',
      severity: 'error',
      comment: 'Production code depends on a spec/test file. Factor out shared logic.',
      from: {},
      to: {
        path: '[.](?:spec|test)[.](?:js|mjs|cjs|jsx|ts|mts|cts|tsx)$',
      },
    },
    {
      name: 'not-to-dev-dep',
      severity: 'error',
      comment: "Production code depends on a devDependency. Move it to 'dependencies'.",
      from: {
        // Matches all source files under apps/ and libs/ (Nx monorepo layout)
        path: '^(?:apps|libs)/',
        pathNot: '[.](?:spec|test)[.](?:js|mjs|cjs|jsx|ts|mts|cts|tsx)$',
      },
      to: {
        dependencyTypes: ['npm-dev'],
        dependencyTypesNot: ['type-only'],
        pathNot: ['node_modules/@types/'],
      },
    },
    {
      name: 'optional-deps-used',
      severity: 'info',
      comment: 'Depends on an optional npm package. Intentional? Add an exception if so.',
      from: {},
      to: { dependencyTypes: ['npm-optional'] },
    },
    {
      name: 'peer-deps-used',
      severity: 'warn',
      comment: 'Depends on a peer dependency. Fine for plugins; add an exception if intentional.',
      from: {},
      to: { dependencyTypes: ['npm-peer'] },
    },
  ],

  options: {
    doNotFollow: {
      path: ['node_modules'],
    },

    // Detect process.getBuiltinModule() calls as imports
    detectProcessBuiltinModuleCalls: true,

    // Include pre-compilation (TypeScript-only) deps in the graph
    tsPreCompilationDeps: true,

    tsConfig: {
      // Nx monorepos define path aliases here; depcruise reads them for resolution
      fileName: 'tsconfig.base.json',
    },

    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],

      // KEY FIX: explicit extension list so depcruise resolves
      // extensionless imports like `./foo.service` -> `./foo.service.ts`
      // Angular components use `.ts`; adjust if you have `.tsx` in the project.
      extensions: ['.ts', '.tsx', '.mts', '.cts', '.js', '.mjs', '.cjs', '.jsx', '.d.ts'],

      // Nx libraries expose `main` + type declarations; `module` for ESM libs
      mainFields: ['module', 'main', 'types', 'typings'],
    },

    skipAnalysisNotInRules: true,

    reporterOptions: {
      dot: {
        // Collapse node_modules to top-level package (or @scope/package)
        collapsePattern: 'node_modules/(?:@[^/]+/[^/]+|[^/]+)',
        theme: {
          graph: { splines: 'true' },
        },
      },
      archi: {
        // Collapse to top-level Nx project folders
        collapsePattern:
          '^(?:apps|libs)/[^/]+|node_modules/(?:@[^/]+/[^/]+|[^/]+)',
      },
      text: {
        highlightFocused: true,
      },
    },
  },
};
