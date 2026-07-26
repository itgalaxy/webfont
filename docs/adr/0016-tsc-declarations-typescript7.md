# ADR 0016: Emit declarations with TypeScript 7 `tsc`; drop `@typescript/typescript6`

- **Status:** Accepted
- **Date:** 2026-07-26
- **Related issue:** [#824](https://github.com/itgalaxy/webfont/issues/824)
- **Related:** [ADR 0006](./0006-vite-instead-of-rollup.md) (Vite library mode), [ADR 0012](./0012-published-package-validation.md) (`.d.ts` / `.d.mts` publish surface)

## Context

The library build used **`vite-plugin-dts` → `unplugin-dts`** to emit `dist/**/*.d.ts` during the Vite `--mode library` pass. After upgrading to **TypeScript 7**, that pipeline required a companion package:

- TypeScript 7 no longer ships the JavaScript Compiler API (`createProgram` is undefined on `require("typescript")`).
- `unplugin-dts` falls back to **`@typescript/typescript6`** for program creation.
- We already typecheck with `typescript@7.x` (`tsc`, `vite-plugin-checker`); the 6.x package existed only so declaration emit would not crash.
- Knip needed `ignoreDependencies: ["@typescript/typescript6"]` because nothing in source imports the shim (dynamic require inside the plugin).

This conflicts with the goal of staying on the **latest TypeScript** without pulling an older compiler into the workspace.

Historically [ADR 0006](./0006-vite-instead-of-rollup.md) already used `tsc --emitDeclarationOnly` for declarations before the Vite dts follow-up moved emit into the plugin.

## Decision drivers

- **One TypeScript for typecheck and declarations:** Prefer the pinned `typescript` major for both.
- **No TypeScript 6 shim in `devDependencies`:** Avoid `@typescript/typescript6` and the Knip exception it forces.
- **Preserve publish surface:** Keep `dist/src/index.d.ts`, `emit-mts-types.mjs` → `.d.mts`, and `package.json#exports` types conditions unchanged for consumers ([ADR 0012](./0012-published-package-validation.md)).
- **Keep Vite for JS bundles:** Only declaration emit moves off `vite-plugin-dts`; CLI / CJS / ESM / browser Vite passes stay.

## Decision

**Emit declarations with TypeScript 7 `tsc`, not `vite-plugin-dts`.**

1. Configure `packages/webfont/tsconfig.build.json` with `declaration: true` and `emitDeclarationOnly: true` (existing `outDir` / `rootDir` / includes).
2. Run `tsc -p tsconfig.build.json --emitDeclarationOnly` in the `build` script after Vite library (and sibling) passes, before `emit-mts-types.mjs`.
3. Remove `vite-plugin-dts` from `vite.config.ts` library plugins; keep `vite-plugin-checker` on TypeScript 7.
4. Remove `@typescript/typescript6` and `vite-plugin-dts` from `devDependencies`; drop the Knip `ignoreDependencies` entry for the shim.
5. Document the change here and trim the TROUBLESHOOTING recipe that told contributors to install the shim.

### Build sketch

```text
vite build --mode library
vite build --mode library-esm
vite build --mode browser
vite build --mode cli
tsc -p tsconfig.build.json --emitDeclarationOnly
node scripts/emit-mts-types.mjs
```

## Consequences

### Positive

- Workspace depends on a single TypeScript line (`typescript@7.x`) for diagnostics and `.d.ts` emit.
- Removes a dynamic-require dependency that Knip cannot see without suppressions.
- Aligns with the pre–vite-plugin-dts declaration strategy from ADR 0006.

### Negative / trade-offs

- Declarations are no longer generated inside the Vite plugin graph (two steps again: bundle then `tsc`). Acceptable — scripts already chain Vite modes + `emit-mts-types.mjs`.
- `tsc` emit layout must stay in sync with `tsconfig.build.json` excludes (CLI / tests stay out of published types).

### Follow-up

- Nested `typescript@5.6.x` under `@arethetypeswrong/cli` remains transitive; track when attw drops it ([#824](https://github.com/itgalaxy/webfont/issues/824) out of scope).
- Revisit ESM-only publish ([#738](https://github.com/itgalaxy/webfont/issues/738)) which could eventually simplify dual `.d.ts` / `.d.mts`.

## References

- [#824](https://github.com/itgalaxy/webfont/issues/824)
- [TypeScript 7 / Compiler API notes motivating `@typescript/typescript6`](https://www.npmjs.com/package/@typescript/typescript6)
- [unplugin-dts TS 7 fallback](https://github.com/qmhc/unplugin-dts/commit/d150536e11eca7039e5baee05f8b1b17778782c0)
- [ADR 0006](./0006-vite-instead-of-rollup.md), [ADR 0012](./0012-published-package-validation.md)
