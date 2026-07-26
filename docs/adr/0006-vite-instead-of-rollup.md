# ADR 0006: Replace Rollup with Vite library mode

- **Status:** Accepted
- **Date:** 2026-07-02
- **Supersedes:** `rollup.config.js`, Rollup 2.x, `@rollup/plugin-typescript`, and `@rollup/plugin-commonjs` in `package.json`

## Context

Production bundles are built with **Rollup 2.56.3** and plugins pinned to `"latest"` in `package.json`:

| Output | Entry | Format |
|--------|-------|--------|
| CLI (`dist/cli.mjs`, `bin`) | `src/cli/index.ts` | ESM + `#!/usr/bin/env node` banner (`meow` 14 is ESM-only) |
| Library (`dist/index.js`, `main`) | `src/index.ts` | CJS, named exports |

`postbuild` runs `tsc --declaration --emitDeclarationOnly` for `dist/src/index.d.ts` (unchanged).

### Problems with Rollup in this repo

| Issue | Detail |
|-------|--------|
| **Fragile glob filtering** | `@rollup/plugin-typescript` defaults to include `**/*.ts+(|x)` via `@rollup/pluginutils` → `picomatch`. A transitive bump to `picomatch@2.3.2` (e.g. Dependabot `micromatch` PR #680) made the pattern match **no** `.ts` files; Rollup then parsed TypeScript as JavaScript and failed on `type` keywords. |
| **`"latest"` plugins** | `@rollup/plugin-commonjs` and `@rollup/plugin-typescript` resolve to whatever npm serves; peer ranges span Rollup 1–2 while the project pins Rollup 2.56.3. |
| **Rollup 2 is legacy** | No path to Rollup 4 / modern defaults without a larger migration; Vite already targets library builds and Node-oriented bundling. |
| **Two-tool overlap** | Rollup bundles; `tsc` emits declarations. Vite library mode keeps that split but replaces the bundler with maintained defaults and esbuild-powered transforms. |

[Vite library mode](https://vite.dev/config/build-options#build-lib) supports multiple `entry` points, CJS output, and `rolldownOptions.external` — matching our CLI + programmatic API layout.

## Decision drivers

- **Stable include/exclude:** Vite/esbuild transpile TypeScript entry graphs without `picomatch` extglob on the default plugin include list.
- **Explicit bundler:** Pin `vite` to an exact version (`save-exact=true`); remove Rollup and `"latest"` Rollup plugins.
- **Same publish surface:** Keep `dist/cli.mjs`, `dist/index.js`, `package.json` `bin` / `main` / `types`, and declaration emit under `dist/src/index.d.ts` (via `vite-plugin-dts` after follow-up).
- **Tests unchanged:** Vitest is the test runner ([ADR 0002](./0002-jest-vs-vitest-testing.md)); only the `npm run build` implementation changes.

## Decision

**Replace Rollup with Vite 8 library mode.**

1. Add `vite.config.ts` with `build.lib.entry` for `cli` and `index`, `formats: ['cjs']`, dependency + Node builtin `external`, and a CLI shebang `banner`.
2. Change `package.json` `build` script to **two passes** — `vite build --mode library` then `vite build --mode cli` — so each artifact is self-contained (no shared hashed chunks between `dist/index.js` and `dist/cli.mjs`, matching the old dual Rollup outputs).
3. Remove `rollup.config.js`, `rollup`, `@rollup/plugin-commonjs`, and `@rollup/plugin-typescript`.
4. Keep `prebuild` (clean + lint). A follow-up adds `vite-plugin-dts` and `vite-plugin-checker` on the library pass and removes `postbuild` `tsc`.

### Configuration sketch

```ts
// vite.config.ts — mode selects library vs CLI entry
// package.json: "build": "vite build --mode library && vite build --mode cli"
build: {
  lib: {
    entry: resolve(__dirname, mode === 'cli' ? 'src/cli/index.ts' : 'src/index.ts'),
    formats: [mode === 'cli' ? 'es' : 'cjs'],
    fileName: () => (mode === 'cli' ? 'cli.mjs' : 'index.js'),
  },
  rolldownOptions: {
    external: [...dependencies, ...nodeBuiltins],
    output: {
      banner: mode === 'cli' ? '#!/usr/bin/env node\n' : undefined,
      exports: 'named',
    },
  },
}
```

## Consequences

### Positive

- Removes dependence on `picomatch` extglob behaviour inside `@rollup/plugin-typescript`.
- One pinned devDependency (`vite`) instead of Rollup + two `"latest"` plugins.
- Library mode documents both artifacts in one config file.
- Aligns with Vite’s maintained [build.lib](https://vite.dev/config/build-options#build-lib) path for dual-entry packages.

### Negative / trade-offs

- **New devDependency:** `vite` adds install size; acceptable for a build-only tool.
- **Rolldown under the hood:** Vite 8 uses Rolldown; `build.rollupOptions` is an alias — prefer `rolldownOptions` in config.
- **Declarations via `tsc`:** Vite bundles JS; TypeScript 7 emits `.d.ts` (`tsc --emitDeclarationOnly`). See [ADR 0016](./0016-tsc-declarations-typescript7.md). `vite-plugin-checker` still runs diagnostics on the library pass.

### Follow-up

- ~~If declaration emit moves under Vite, evaluate `vite-plugin-dts` and simplify `postbuild`.~~ Superseded by [ADR 0016](./0016-tsc-declarations-typescript7.md): declarations emit with TypeScript 7 `tsc --emitDeclarationOnly`; `vite-plugin-dts` / `@typescript/typescript6` removed ([#824](https://github.com/itgalaxy/webfont/issues/824)).
- Re-run Dependabot `micromatch` / `picomatch` upgrades after merge to confirm CI stays green.

## References

- [Vite — Build options: `build.lib`](https://vite.dev/config/build-options#build-lib)
- [Vite — Library mode](https://vite.dev/guide/build#library-mode)
- PR #680 — `picomatch@2.3.2` breaking Rollup TypeScript include globs
