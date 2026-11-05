# Shared Vitest configs

[← Back to the main README](../../README.md)

`@configs/vitest` is the single place where Vitest settings are defined for the
whole monorepo. Instead of every package copying the same `test` block, coverage
thresholds and exclude list, a package imports one factory and passes only what
is genuinely local to it: overrides for rare cases.

## Navigation

- [Package](#package)
- [Usage](#usage)
- [Which factory to use](#which-factory-to-use)
- [Coverage](#coverage)

## Package

**Path:** `configs/vitest`

A private workspace package. It exports a single module with two factories:

| Export | Environment | Plugins | Purpose |
| --- | --- | --- | --- |
| `createBackendConfig` | `node` | none | Servers, CLIs, scripts, workers |
| `createFrontendConfig` | `happy-dom` | `vite-plugin-solid` | Vite + Solid components |

Both factories share the same base: `globals: true`, `passWithNoTests: true`,
and the coverage settings described below. Their output is a regular
`ViteUserConfig`, so it can be passed to `defineConfig` or used as is.

## Usage

**`vitest.config.ts`** — backend

```ts
import { createBackendConfig } from "@configs/vitest";

export default createBackendConfig();
```

**`vitest.config.ts`** — frontend

```ts
import { createFrontendConfig } from "@configs/vitest";

export default createFrontendConfig();
```

**`vitest.config.ts`** — with a local override

```ts
import { createBackendConfig } from "@configs/vitest";

export default createBackendConfig({
  test: {
    testTimeout: 30_000,
  },
});
```

Overrides are merged with `mergeConfig`, so nested objects are extended and
not replaced. Use them for things that only make sense in one package, such as
a longer timeout for integration tests or a custom `setupFiles` entry.

**`package.json`**

```json
{
  "name": "@any-scope/any-name",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  },
  "devDependencies": {
    "@configs/vitest": "workspace:*",
    "@vitest/coverage-v8": "catalog:test",
    "vitest": "catalog:test"
  }
}
```

Use `workspace:*` for the same reason as in `@configs/typescript`: the package is
never published, and every workspace uses the local version. Versions of Vitest
and its helpers come from the `test` catalog in the root `package.json`, so
upgrades happen in one place.

Frontend packages also need `vite`, `vite-plugin-solid` and `happy-dom` only if
they import them directly. The factory already brings them in.

## Which factory to use

```text
Does the package run in Bun or Node?          (server, CLI, script, worker)
├── yes ──────────────────────────────────► createBackendConfig
└── no
    Is the package rendered in a browser?     (Vite + Solid)
    ├── yes ──────────────────────────────► createFrontendConfig
    └── no ───────────────────────────────► createBackendConfig
```

A package that is neither a UI nor a server (for example, a shared utility
library) uses `createBackendConfig`, because it runs in Node and does not need a
DOM.

Rules that keep this from degrading:

1. **Never mix environments.** A package uses one factory. If a test needs
   a DOM and a Node-only API at the same time, split it into two test files
   with `// @vitest-environment` comments, and review why it is needed.
2. **No local coverage thresholds.** `thresholds` belong to the factory. Change
   them here, once, so every package gets the change.
3. **Keep the exclude list in the factory.** Adding a pattern to a single package
   hides code from the report and makes numbers incomparable across packages.
4. **Coverage thresholds are not negotiable per package.** Lowering `100` in one
   package is a repo-wide discussion, not a local escape hatch.

## Coverage

Coverage is configured with `@vitest/coverage-v8` and is **disabled by default**
(`enabled: false`). It is turned on by the `test:coverage` script, which runs
`vitest run --coverage`.

- **Provider:** `v8`
- **Report directory:** `./coverage` (matches `outputs` in `turbo.json`)
- **Scope:** `src/**/*.{ts,tsx}`
- **Thresholds:** 100% statements, branches, functions and lines, checked **per file** (`perFile: true`)

Per-file thresholds mean that one untested file fails the run, even if the
package average is high. Files with no runtime logic are excluded: tests
themselves, `.d.ts` files, `types.ts` / `*.types.ts` / `_types.ts`, and entry
points like `index.ts`, `run.ts` and `init.ts`.
