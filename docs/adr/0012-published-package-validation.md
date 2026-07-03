# ADR 0012: Layered validation of the published package surface

- **Status:** Accepted
- **Date:** 2026-07-03
- **Related:** PR [#735](https://github.com/itgalaxy/webfont/pull/735) (ESM default import fix), PR [#737](https://github.com/itgalaxy/webfont/pull/737) (pack-smoke + publint + attw), issue [#618](https://github.com/itgalaxy/webfont/issues/618)

## Context

Issue [#618](https://github.com/itgalaxy/webfont/issues/618) shipped to npm because `import webfont from "webfont"` returned the CJS `module.exports` object (not the function) under `"type": "module"`. The unit tests in `src/` all passed — they exercise TypeScript source through Vitest, never the built `dist/` files, and never the `package.json#exports` resolution that Node applies at `import` time. The regression went undetected until users installed webfont from npm and hit `TypeError: webfont is not a function`.

The root cause was structural: `package.json#exports["."].node.import` pointed at `./dist/index.js` (CJS), so ESM consumers received the interop object. Fixing it (PR [#735](https://github.com/itgalaxy/webfont/pull/735)) required a real ESM build (`dist/index.mjs`) and split routing in `exports`. Preventing recurrence required something else: a check that mirrors what an npm consumer sees.

## Decision drivers

- **Catch what Vitest cannot:** in-source unit tests do not exercise `package.json#exports`, `files`, `dist/*.mjs` / `dist/*.js`, or Node's CJS↔ESM interop.
- **Fail before publish:** a broken tarball must never reach npm. Guard runs in every PR and gates `npm publish` via `prepublishOnly`.
- **Layered, not monolithic:** each tool catches a different class of issue. Running all three together is fast (~10s combined) and gives orthogonal signals.
- **Zero flake:** every guard runs against the actual build artifacts (`npm pack` output), not source or a mock.
- **Progressive tightening:** where a check reveals a known gap that requires a bigger build change, ignore that specific rule and document the follow-up in this ADR — do not silence the whole tool.

## Decision

Adopt a **three-layer package validation** wired into `npm run test:package`, CI, and `prepublishOnly`.

### Layer 1: `publint` — `package.json` publish lint

- `test:publint` runs [`publint`](https://publint.dev/) against the packed tarball.
- Checks `main`, `module`, `browser`, `types`, `exports`, `files`, engine consistency, condition ordering, and other publish-surface invariants.
- Exit status: **exits 0 on warnings/suggestions, non-zero only on errors**. We accept the two remaining suggestions on the current package (see §Known gaps) and let CI print them for information.

### Layer 2: `@arethetypeswrong/cli` (attw) — types resolution across module systems

- `test:attw` runs [`attw --pack .`](https://arethetypeswrong.github.io/) which packs, extracts, and probes types resolution under **node10**, **node16 (from CJS)**, **node16 (from ESM)**, and **bundler**.
- Green when every module-system column resolves a type declaration.
- We currently ignore **only** `internal-resolution-error` because our `.d.mts` files use extension-less internal imports (see §Known gaps). All other rules — including `no-resolution`, `untyped-resolution`, `false-cjs`, `false-esm`, `cjs-resolves-to-esm`, `cjs-only-exports-default`, `named-exports`, `false-export-default`, `missing-export-equals` — are enforced.

### Layer 3: `scripts/pack-smoke-test.mjs` — consumer smoke test

- `test:pack` packs the current build, installs the tarball into throwaway ESM and CJS consumer projects in a temp directory, and asserts every documented import shape works end-to-end by **generating a real `woff2`** from the repo fixtures:
  - `import webfont from "webfont"` (ESM default) — regressed in [#618](https://github.com/itgalaxy/webfont/issues/618)
  - `import { webfont } from "webfont"` (ESM named)
  - `const { webfont } = require("webfont")` (CJS named)
  - `require("webfont").default` (CJS default)
- Also asserts the tarball actually ships `dist/index.js`, `dist/index.mjs`, `dist/browser.js`, and `dist/cli.mjs` — catches broken `package.json#files` or missing chunks.
- Uses only Node built-ins (`node:child_process`, `node:fs`, `node:os`, `node:path`, `node:url`).

### Meta script and wiring

```json
{
  "scripts": {
    "test:attw": "attw --pack . --ignore-rules internal-resolution-error",
    "test:pack": "node scripts/pack-smoke-test.mjs",
    "test:package": "npm run test:publint && npm run test:attw && npm run test:pack",
    "test:publint": "publint",
    "prepublishOnly": "npm run build && npm run test:package"
  }
}
```

Wired into `.github/workflows/pr.yml` (matrix Node 24.x + 26.x) and the `build` job of `.github/workflows/npm-publish.yml` before `publish-npm` runs.

### Supporting build changes

- New `"type": "commonjs"` in `package.json` — tells Node the default module system without extension-based sniffing.
- New `"exports"` routing with `types` per condition:
  - `import` → `dist/src/index.d.mts` (types) + `dist/index.mjs` (runtime)
  - `require` → `dist/src/index.d.ts` (types) + `dist/index.js` (runtime)
  - `default` (browser) → `dist/src/index.d.ts` (types) + `dist/browser.js` (runtime)
- New `scripts/emit-mts-types.mjs` runs after the Vite builds and duplicates every `dist/**/*.d.ts` to `.d.mts` so ESM consumers can resolve types with matching extensions.

## Consequences

### Positive

- **#618-class regressions cannot ship.** Every PR runs the same tarball an npm consumer would install.
- **Types resolve on every module system** used by TypeScript today (`node10`, `node16 CJS`, `node16 ESM`, `bundler`) — was ❌ for three of four before.
- **Orthogonal signals.** publint catches `package.json` invariants; attw catches types-resolution mismatches; pack-smoke catches runtime interop bugs.
- **Fast.** All three run in under ~10 seconds against a fresh build.
- **Progressive quality bar.** New warnings or suggestions from publint are visible in every CI log without failing the build; new errors block the merge.

### Negative / trade-offs

- **Adds two devDependencies** (`publint`, `@arethetypeswrong/cli`) — mitigated by the alternative being another #618-scale outage.
- **`emit-mts-types.mjs` duplicates every `.d.ts` as `.d.mts`.** The tarball roughly doubled in file count (81 → 141), though total size grew marginally because declaration files are small.
- **One attw ignore rule** (`internal-resolution-error`) accepts a known limitation of our current type layout (see §Known gaps).

### Known gaps (follow-up work)

Documented here rather than silenced across the whole tool, so upgrades or scope changes surface them again:

1. **`attw`: `internal-resolution-error` under node16-from-ESM.**
   Our `dist/**/*.d.mts` files were duplicated from `.d.ts` and keep extension-less internal imports (`from "./standalone"`). TypeScript's `nodenext`/`node16` resolution on `.d.mts` files requires explicit `.mjs` extensions.
   Fix: either bundle types into a single file (vite-plugin-dts `rollupTypes: true` did not collapse cross-file references in this repo), or post-process `.d.mts` files to rewrite internal specifiers to `.mjs`.
2. **`publint` suggestion: `"sideEffects"` field missing.**
   Bundlers cannot tree-shake unless the package declares side-effect purity. The Node CLI wrapper has intentional top-level side effects (banner); the library surface is pure. A follow-up should either mark files individually (`sideEffects: ["dist/cli.mjs"]`) after auditing, or add `"sideEffects": false` at the root only after verifying no import triggers module-load work.
3. **`publint` suggestion: legacy `pkg.browser` string.**
   The top-level `browser` field could migrate under `exports["."].browser`. Marked as *may be a breaking change* by publint; requires a coordinated release note.

## Alternatives considered

| Option | Why not |
|--------|---------|
| **Trust unit tests + reviewer diligence** | Failed for #618 despite full green CI. Structural issue in `exports` was invisible to Vitest. |
| **Only add pack-smoke** (proposed initially) | Catches runtime interop, but does not catch types-resolution regressions or `package.json` invariants. Two additional tools give orthogonal signals for negligible cost. |
| **Only add publint** | Static analysis of `package.json`; misses the runtime interop that caused #618. |
| **Only add attw** | Types-focused; misses runtime interop and general `package.json` hygiene. |
| **Publish preview package to npm alpha channel** | Slow feedback loop, requires an npm write on every PR, and still needs the same three checks locally. |
| **Skip validators entirely and file a bug report loop** | The failure mode is user-facing (`TypeError: webfont is not a function`); the cost of a bad release is higher than any tool overhead. |

## References

- Issue [#618: `TypeError: webfont is not a function`](https://github.com/itgalaxy/webfont/issues/618)
- PR [#735: `fix(build): expose callable default export from ESM build`](https://github.com/itgalaxy/webfont/pull/735)
- PR [#737: `ci: guard published tarball import shapes with a pack-smoke test`](https://github.com/itgalaxy/webfont/pull/737)
- [publint](https://publint.dev/)
- [Are the Types Wrong?](https://arethetypeswrong.github.io/)
- [Node.js `package.json` exports](https://nodejs.org/api/packages.html#exports)
