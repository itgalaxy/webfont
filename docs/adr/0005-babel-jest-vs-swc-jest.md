# ADR 0005: Replace babel-jest with @swc/jest for test transforms

- **Status:** Accepted
- **Date:** 2026-07-02
- **Related:** [ADR 0002](./0002-jest-vs-vitest-testing.md) (follow-up: “consider `@swc/jest` as a lower-risk performance improvement”)

## Context

The project uses **Jest 27.1.0** with **`babel-jest`** and Babel presets (`@babel/preset-env`, `@babel/preset-typescript`, `babel.config.js`) to transpile TypeScript test files. Babel is **only** used on the Jest path — production code is built with Rollup + `@rollup/plugin-typescript` and `tsc` declarations ([ADR 0002](./0002-jest-vs-vitest-testing.md)).

Test surface today (v11.5.21):

- **6** test files, **67** tests, **20** snapshots (~1,090 LOC of test code)
- Jest-specific APIs: `jest.mock` (manual `__mocks__` for CLI `meow`), `jest.spyOn` on `fs.createReadStream`, `jest.setTimeout`, `moduleNameMapper` for `globby` ([`jest/globby-stub.ts`](../../jest/globby-stub.ts))
- Coverage collection enabled by default in [`jest.config.ts`](../../jest.config.ts)

[SWC](https://swc.rs/) via [`@swc/jest`](https://swc.rs/docs/usage/jest) is a common drop-in replacement for `babel-jest` on TypeScript projects, with less tooling surface than a full Vitest migration.

## Benchmark results (2026-07-02, v11.5.21)

Environment: macOS, Node.js 26.x, warm cache, **5 runs per command, median wall time** (Jest-reported `Time:`).

| Command | Median |
|---------|--------|
| `jest src` (babel-jest, coverage on) | **3.98 s** |
| `jest src --coverage=false` (babel-jest) | **4.12 s** |
| `jest src` (@swc/jest, coverage on) | **3.93 s** (~1.3% faster) |
| `jest src --coverage=false` (@swc/jest) | **3.86 s** (~6% faster vs babel coverage-off median) |

Cold cache (single run after `jest --clearCache`, coverage off):

| Transformer | Wall time |
|-------------|-----------|
| babel-jest | **6.07 s** |
| @swc/jest | **5.44 s** (~10% faster) |

Benchmark packages (temporary install, not merged): `@swc/core@1.15.11`, `@swc/jest@0.2.39`.

**Interpretation:** SWC is faster at transpilation, but this suite is dominated by font-generation and CLI integration work. Absolute savings are **~50–260 ms per warm `jest src` run** and **~0.6 s on a cold cache**. In the full `npm test` pipeline (`pretest` → build + lint + jest), build and integration tests remain the bottleneck — same conclusion as [ADR 0002](./0002-jest-vs-vitest-testing.md) for Vitest.

## Compatibility spike

A spike `jest.config.swc.ts` (since removed) used this explicit `transform` block:

```ts
transform: {
  "^.+\\.(t|j)sx?$": [
    "@swc/jest",
    {
      jsc: {
        parser: { syntax: "typescript" },
        target: "es2020",
      },
      module: { type: "commonjs" },
    },
  ],
},
```

**Result: 67/67 tests passed, 20/20 snapshots unchanged, zero test file edits.**

Unlike the Vitest spike in ADR 0002, mock hoisting, spies, and snapshot paths behaved the same because Jest remains the runner.

## Decision drivers

- **Performance:** Modest but consistent speedup on warm and cold Jest runs; largest gain on first run after cache clear.
- **Migration cost:** Low — update `jest.config.ts`, add pinned `@swc/core` + `@swc/jest`, remove `babel-jest` and Babel presets/`babel.config.js`. No test rewrites.
- **Tooling consolidation:** Removes a second compile toolchain (Babel) used only for tests; aligns with replacing ESLint with Biome on the lint path ([ADR 0001](./0001-eslint-vs-biome-linting.md)).
- **Risk:** Lower than Vitest migration ([ADR 0002](./0002-jest-vs-vitest-testing.md)); keeps Jest 27 mocks, coverage, and Lefthook `pre-push` behaviour intact.
- **Ecosystem fit:** `@swc/jest` is widely used with Jest; pairs naturally with a future Jest 29 upgrade without switching runners.

## Decision

**Adopt `@swc/jest`** as the Jest transformer and **remove Babel from the test path** (`babel-jest`, `@babel/preset-env`, `@babel/preset-typescript`, `babel.config.js`).

Keep **Jest 27** as the test runner ([ADR 0002](./0002-jest-vs-vitest-testing.md)); do not migrate to Vitest for this performance gain alone.

## Consequences

### Positive

- Faster test transpilation, especially on cold cache (~10% in this benchmark).
- Fewer devDependencies and one less config file (`babel.config.js`).
- Documented, low-risk path toward faster tests without revisiting Vitest.

### Negative / trade-offs

- Absolute time saved per `npm test` is small while build + integration tests dominate.
- Adds `@swc/core` native binaries (platform-specific); CI must continue to use supported Node/OS images ([`engines`](../../package.json) `>= 24.14.0`).
- SWC TypeScript support can lag rare syntax edge cases; pin versions and run the full suite on upgrade.

### Implementation checklist

1. Pin `@swc/core` and `@swc/jest` (exact versions) in `package.json`.
2. Move the `transform` block from the spike config into `jest.config.ts`.
3. Remove `babel-jest`, `@babel/preset-env`, `@babel/preset-typescript`, and `babel.config.js`.
4. Run `npm test` locally and in CI.

### Follow-up

- Revisit **Jest 29.x** upgrade separately; `@swc/jest` should carry forward.
- Re-benchmark if the test suite grows substantially (e.g. 3× more integration tests) or if transform time becomes a measurable fraction of CI.

## References

- [@swc/jest documentation](https://swc.rs/docs/usage/jest)
- [ADR 0001: ESLint vs Biome](./0001-eslint-vs-biome-linting.md)
- [ADR 0002: Jest vs Vitest](./0002-jest-vs-vitest-testing.md)
- Benchmark environment: macOS, Node.js 26.x, `@swc/core@1.15.11`, `@swc/jest@0.2.39` (temporary dev install)
