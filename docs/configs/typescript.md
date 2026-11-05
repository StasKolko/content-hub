# Shared TypeScript configs

[← Back to the main README](../../README.md)

`@configs/typescript` is the single place where TypeScript compiler options are
defined for the whole monorepo. Instead of every package repeating the same
thirty flags — and slowly drifting away from its neighbours — a package extends
one preset and declares only what is genuinely local to it: entry points,
`include`, and rare deliberate overrides.

## Navigation

- [Package](#package)
- [Usage](#usage)
- [Which preset to use](#which-preset-to-use)

## Package

**Path:** `configs/typescript`

A private workspace package. It ships no runtime code — only JSON. Consumers
import a preset through a subpath export:

| Subpath | File | Purpose |
| --- | --- | --- |
| `@configs/typescript/base` | `src/base.json` | Strict bundler-oriented defaults shared by everything |
| `@configs/typescript/backend` | `src/backend.json` | `base` plus Bun and Node globals |
| `@configs/typescript/frontend` | `src/frontend.json` | `base` plus DOM libs and Solid JSX settings |

## Usage

**`tsconfig.json`** — backend

```json
{
  "extends": "@configs/typescript/backend",
  "include": ["src"]
}
```

**`tsconfig.json`** — frontend

```json
{
  "extends": "@configs/typescript/frontend",
  "include": ["src"]
}
```

**`tsconfig.json`** — base

```json
{
  "extends": "@configs/typescript/base",
  "include": ["src"]
}
```

**`package.json`**

```json
{
  "name": "@any-scope/any-name",
  "private": true,
  "type": "module",
  "scripts": {
    "check:type": "tsc --noEmit"
  },
  "devDependencies": {
    "@configs/typescript": "workspace:*"
  }
}
```

Use `workspace:*` — the package is never published, and the wildcard makes every
workspace build against the local version. `type: "module"` is required:
`verbatimModuleSyntax` and `module: preserve` assume ESM throughout.

## Which preset to use

```text
Does the package run in Bun or Node?          (server, CLI, script, worker)
├── yes ──────────────────────────────────► @configs/typescript/backend
└── no
    Is the package rendered in a browser?     (Vite + Solid)
    ├── yes ──────────────────────────────► @configs/typescript/frontend
    └── no ───────────────────────────────► @configs/typescript/base
```

`base` covers everything in between: isomorphic libraries, shared types and
utilities, and tooling packages that only exist at build time.

Rules that keep this from degrading:

1. **Never cross-extend.** `frontend` must not extend `backend` or the reverse —
   a package that sees both DOM and `Bun` globals is a package whose boundaries
   have already leaked.
2. **If a package needs both sides**, extend `base` and add `types` / `lib`
   locally. That is a signal worth reviewing, not a default.
3. **No local overrides without a reason.** `target`, `module` and `lib` belong
   to the presets. Change them here, once, so every package gets the change.
4. **Strictness is not negotiable per package.** Adding `noUncheckedIndexedAccess`
   to `base` is a repo-wide commit, not a per-package escape hatch.
