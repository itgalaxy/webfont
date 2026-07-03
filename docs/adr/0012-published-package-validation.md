# ADR 0012: Layered validation of the published package surface

- **Status:** Accepted
- **Date:** 2026-07-03
- **Related:** PR [#735](https://github.com/itgalaxy/webfont/pull/735) (ESM default import fix), PR [#737](https://github.com/itgalaxy/webfont/pull/737) (publint + attw + pack-smoke + build changes), issue [#618](https://github.com/itgalaxy/webfont/issues/618)

## Context

Issue [#618](https://github.com/itgalaxy/webfont/issues/618) shipped to npm because `import webfont from "webfont"` returned the CJS `module.exports` object (not the function) under `"type": "module"`. The unit tests in `src/` all passed — they exercise TypeScript source through Vitest, never the built `dist/` files, and never the `package.json#exports` resolution that Node applies at `import` time. The regression went undetected until users installed webfont from npm and hit `TypeError: webfont is not a function`.

The root cause was structural: `package.json#exports["."].node.import` pointed at `./dist/index.js` (CJS), so ESM consumers received the interop object. Fixing it (PR [#735](https://github.com/itgalaxy/webfont/pull/735)) required a real ESM build (`dist/index.mjs`) and split routing in `exports`. Preventing recurrence required something else: a check that mirrors what an npm consumer sees.

## Decision drivers

- **Catch what Vitest cannot:** in-source unit tests do not exercise `package.json#exports`, `files`, `dist/*.mjs` / `dist/*.js`, or Node's CJS↔ESM interop.
- **Fail before publish:** a broken tarball must never reach npm. Guard runs in every PR and gates `npm publish` via `prepublishOnly`.
- **Layered, not monolithic:** each tool catches a different class of issue. Running all three together is fast (~10s combined) and gives orthogonal signals.
- **Zero flake:** every guard runs against the actual build artifacts (`npm pack` output), not source or a mock.
- **Zero ignore rules.** Each layer runs with its default rule set. Where a check surfaced a real defect (types not resolving under node16-from-ESM, missing `sideEffects`), we fixed the underlying issue instead of adding an allowlist.

## Decision

Adopt a **three-layer package validation** wired into `npm run test:package`, CI, and `prepublishOnly`.

### Why three layers, not one

The layers detect **different classes** of failure. They do not overlap in a way that would let us drop any of them:

| Failure class | Detected by | Why the others miss it |
|---------------|-------------|------------------------|
| `package.json#exports` routes `import` to a CJS file (`false-esm`, `cjs-resolves-to-esm`) | **attw** (static) — flags the module-system mismatch | pack-smoke sees the runtime symptom but not the structural cause; publint does not model TS module resolution. |
| `import webfont from "webfont"` returns an object instead of a function (`#618`) | **pack-smoke** (runtime) — actually calls `typeof webfont === "function"` and generates a woff2 | attw checks *types*, not runtime interop; a package with correct types can still have broken runtime default exports because of CJS ↔ ESM interop. |
| `dist/index.mjs` missing from the tarball because `files` shrank | **pack-smoke** (tarball manifest check + runtime import) | publint validates static shape but does not open the tarball; attw errors would surface but as an obscure `no-resolution`. |
| Types resolve under `bundler` but not `node16 (from ESM)` | **attw** — separate columns per module system | pack-smoke doesn't run TypeScript against types; publint doesn't simulate `moduleResolution`. |
| `exports` condition ordering wrong (`default` before `node`) | **publint** | attw's happy-path resolution might still succeed for the tested module systems; pack-smoke doesn't audit `exports` structure. |
| `types` extension mismatches runtime extension (`.d.ts` for `.mjs`) | **publint** (warning) and **attw** (error under `node16 from ESM`) | pack-smoke doesn't touch types. |
| `main`, `module`, `bin`, `files` pointing at paths that were never built | **publint** and **pack-smoke** (tarball manifest check) | attw only inspects entry points that `exports` mentions. |
| `sideEffects` missing so bundlers can't tree-shake | **publint** (suggestion) | Nothing else surfaces packaging metadata quality. |

The rule of thumb: **publint = static package-metadata invariants**; **attw = static types resolution across module systems**; **pack-smoke = runtime interop from an actual consumer install**. Each is fast enough (<10s each) that running all three every PR is trivial.

### Layer 1: `publint` — `package.json` publish lint

- `test:publint` runs [`publint`](https://publint.dev/) against the packed tarball.
- Checks `main`, `module`, `browser`, `types`, `exports`, `files`, engine consistency, condition ordering, and other publish-surface invariants.
- Ran at `--level=warning` so CI output stays actionable — informational suggestions are still visible on-demand via `npx publint` locally.

### Layer 2: `@arethetypeswrong/cli` (attw) — types resolution across module systems

- `test:attw` runs [`attw --pack .`](https://arethetypeswrong.github.io/) which packs, extracts, and probes types resolution under **node10**, **node16 (from CJS)**, **node16 (from ESM)**, and **bundler**.
- **Zero ignore rules.** Every default rule is enforced — including `no-resolution`, `untyped-resolution`, `false-cjs`, `false-esm`, `cjs-resolves-to-esm`, `cjs-only-exports-default`, `named-exports`, `false-export-default`, `missing-export-equals`, `internal-resolution-error`.

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
    "test:attw": "attw --pack .",
    "test:pack": "node scripts/pack-smoke-test.mjs",
    "test:package": "npm run test:publint && npm run test:attw && npm run test:pack",
    "test:publint": "publint --level=warning",
    "prepublishOnly": "npm run build && npm run test:package"
  }
}
```

Wired into `.github/workflows/pr.yml` (matrix Node 24.x + 26.x) and the `build` job of `.github/workflows/npm-publish.yml` before `publish-npm` runs.

### Supporting build changes

- New `"type": "commonjs"` in `package.json` — tells Node the default module system without extension-based sniffing.
- New `"sideEffects": false` — the library entry (`dist/index.js` / `dist/index.mjs`) has no top-level side effects that survive tree-shaking; declaring purity lets downstream bundlers drop unused imports.
- New `"exports"` routing with `types` per condition:
  - `browser` → `dist/src/index.d.ts` + `dist/browser.js`
  - `node.import` → `dist/src/index.d.mts` (types) + `dist/index.mjs` (runtime)
  - `node.require` → `dist/src/index.d.ts` (types) + `dist/index.js` (runtime)
  - `default` → `dist/src/index.d.ts` (types) + `dist/browser.js` (runtime)
- Legacy top-level `pkg.browser: "dist/browser.js"` is **kept intentionally** for webpack 4 / older bundlers that do not resolve `exports["."].browser`. publint prints a suggestion to migrate; we accept the suggestion (filtered out by `--level=warning`) because removing the top-level field is a real breaking change for those consumers and the modern `exports["."].browser` already covers new bundlers.
- New `scripts/emit-mts-types.mjs` runs after the Vite builds:
  1. Duplicates every `dist/**/*.d.ts` to a matching `.d.mts` so `package.json#exports["."].node.import.types` can point at `.d.mts` types with matching extension.
  2. Rewrites every relative import specifier inside the emitted `.d.mts` files to end in `.mjs` (`from "./standalone"` → `from "./standalone/index.mjs"`), so TypeScript's `nodenext` / `node16` module resolution accepts them. Fails with a non-zero exit if any relative import cannot be resolved to a matching `.d.mts` — the same signal attw would produce.
- The rewrite step in `emit-mts-types.mjs` is the reason attw runs with **zero ignore rules**. Before it existed, `internal-resolution-error` had to be silenced under node16-from-ESM.

## Consequences

### Positive

- **#618-class regressions cannot ship.** Every PR runs the same tarball an npm consumer would install.
- **Types resolve on every module system** used by TypeScript today (`node10`, `node16 CJS`, `node16 ESM`, `bundler`) — was ❌ for three of four before.
- **Orthogonal signals.** publint catches `package.json` invariants; attw catches types-resolution mismatches; pack-smoke catches runtime interop bugs. Each covers a distinct failure class the others cannot see (see the table above).
- **Zero ignore rules and zero silenced warnings.** attw runs with defaults; publint runs at `--level=warning` (which is filtering, not silencing — the `pkg.browser` legacy-shim suggestion is still visible via `npx publint`).
- **Fast.** All three run in under ~10 seconds against a fresh build.
- **Progressive quality bar.** New warnings from publint or new failures from attw block the merge; new suggestions surface on request.

### Negative / trade-offs

- **Adds two devDependencies** (`publint`, `@arethetypeswrong/cli`) — mitigated by the alternative being another #618-scale outage.
- **`emit-mts-types.mjs` duplicates every `.d.ts` as `.d.mts` and rewrites specifiers.** The tarball roughly doubled in file count (81 → 141), though total size grew marginally because declaration files are small. The rewrite step is regex-based on relative specifiers only — it fails loud if any specifier cannot be resolved.
- **Kept `pkg.browser` string as a legacy shim.** publint suggests migrating fully to `exports["."].browser`; we filter suggestions (`--level=warning`) and document the decision so webpack 4 users are not broken. The modern `exports["."].browser` condition is already in place for new bundlers.

## Alternatives considered

| Option | Why not |
|--------|---------|
| **Trust unit tests + reviewer diligence** | Failed for #618 despite full green CI. Structural issue in `exports` was invisible to Vitest. |
| **Only add pack-smoke** (proposed initially) | Catches runtime interop, but does not catch types-resolution regressions or `package.json` invariants. Two additional tools give orthogonal signals for negligible cost. |
| **Only add publint** | Static analysis of `package.json`; misses the runtime interop that caused #618. |
| **Only add attw** | Types-focused; misses runtime interop and general `package.json` hygiene. |
| **Ship a single shared `.d.ts` for both `import` and `require` (delete `emit-mts-types.mjs`)** | Rejected — **verified empirically 2026-07-03**. Pointing `exports["."].node.import.types` at the same `dist/src/index.d.ts` as the `require` condition makes attw report `🎭 FalseCJS` ("Import resolved to a CommonJS type declaration file, but an ESM JavaScript file") under **node16 (from ESM)**. With `"type": "commonjs"`, a `.d.ts` is a **CJS** declaration file; the `import` condition resolves to the ESM runtime (`dist/index.mjs`), so the types masquerade as the wrong format. A format-tagged `.d.mts` (or a nested `package.json` with `"type": "module"`) is required. Emitting both `.d.ts` and `.d.mts` is standard for dual packages (tsup, tshy, unbuild all do it). |
| **Use `@microsoft/api-extractor` (`rollupTypes: true`) to bundle all types into one file** | Would remove the need for the specifier-rewrite step (a single bundled declaration has no relative imports), but drags in a ~10 MB peer dependency, requires an `api-extractor.json` config, and re-tests failed to collapse cross-file references on this codebase's `vite-plugin-dts@5.0.3`. The regex-based rewrite in `emit-mts-types.mjs` is self-contained with **zero dependencies** and fails loud on any unresolvable specifier. |
| **Publish ESM-only (drop the CJS build and dual declarations entirely)** | The cleanest long-term simplification — one `.d.ts` interpreted as ESM, no `emit-mts-types.mjs`, and Node 24.14+ (our floor) supports `require(esm)`. Deferred to a separate ADR/issue: it is a breaking change for consumers on older bundlers relying on the CJS `main`, and is out of scope for a PR focused on validation guardrails. |
| **Silence attw `internal-resolution-error` with `--ignore-rules`** | Was the initial approach in draft #737 for ~15 minutes. Rejected — silencing hides real type-resolution bugs from future changes. |
| **Publish preview package to npm alpha channel per PR** | Slow feedback loop, requires an npm write on every PR, and still needs the same three checks locally. |

## References

- Issue [#618: `TypeError: webfont is not a function`](https://github.com/itgalaxy/webfont/issues/618)
- PR [#735: `fix(build): expose callable default export from ESM build`](https://github.com/itgalaxy/webfont/pull/735)
- PR [#737: `build(deps): guard published package with publint + attw + pack-smoke`](https://github.com/itgalaxy/webfont/pull/737)
- [publint](https://publint.dev/)
- [Are the Types Wrong?](https://arethetypeswrong.github.io/)
- [Node.js `package.json` exports](https://nodejs.org/api/packages.html#exports)
- [TypeScript module resolution: `node16` / `nodenext`](https://www.typescriptlang.org/docs/handbook/modules/reference.html#node16-nodenext)
