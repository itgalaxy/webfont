# ADR 0002: Keep Jest instead of migrating to Vitest

- **Status:** Accepted
- **Date:** 2026-07-02

## Context

The project uses **Jest 27.1.0** with `babel-jest` and Babel presets to run TypeScript tests. Tests run on every `npm test` via `pretest` → `npm run build` (clean, lint, Vite library build, declaration emit) and then `jest src`.

Test surface today:

- **5** test files, **48** tests, **13** snapshots (~870 LOC of test code)
- Jest-specific APIs in use: `jest.mock` (manual `__mocks__` for CLI `meow`), `jest.spyOn` on `fs.createReadStream`, `jest.setTimeout`
- Coverage collection is enabled by default in `jest.config.ts`

We benchmarked [Vitest](https://vitest.dev/) 3.2.4 as a potential replacement, following the same approach used in [ADR 0001](./0001-eslint-vs-biome-linting.md).

## Benchmark results (2026-07-02, v11.5.12)

Environment: macOS, Node.js 26.x, warm cache, 5 runs per command, **median wall time**.

| Command | Median |
|---------|--------|
| `jest src` (coverage on, project default) | **4.4 s** |
| `jest src --coverage=false` | **4.5 s** |
| `vitest run src` | **3.5 s** (~1.3× faster) |
| `npm test` (build + lint + jest + coverage) | **6.8 s** |

Vitest reports faster transform/collect phases (esbuild vs Babel), but absolute savings on this suite are **~0.9 s per test run**. In the full `npm test` pipeline, build and font-generation integration tests dominate; the runner itself is not the bottleneck.

## Compatibility spike

Vitest was configured with a minimal `vitest.config.ts`, ESM `deps.inline` for the same packages listed in `jest.config.ts` `transformIgnorePatterns`, and a `jest` → `vi` shim in a setup file.

**Result: 41/48 tests passed without editing test files; 7 failed.**

| Area | Failure | Root cause |
|------|---------|------------|
| CLI (5 tests) | `process.exit` thrown; `cli.error` / `cli.verbose` not functions | `jest.mock("./meow")` is not hoisted by Vitest; manual mock in `src/cli/meow/__mocks__/` was not applied |
| `glyphsData` (2 tests) | `maxObservedConcurrency` stayed 0 | `jest.spyOn(fs, "createReadStream")` does not intercept the **named** `createReadStream` import used in production code under Vitest's ESM module graph |

Additional migration friction observed:

- Vitest added Vite types that conflicted with the project's `tsconfig.json` (`moduleResolution: Node`) during `postbuild` `tsc`
- Snapshot format/path differences (13 existing snapshots would need review)
- Would allow removing `babel-jest` and Babel presets from the test path, but Rollup/build would still need the current toolchain

## Decision drivers

- **Performance:** Vitest is ~20–30% faster on test execution alone; savings are modest (~1 s) and small relative to the ~7 s full `npm test` pipeline.
- **Migration cost:** Non-trivial for this codebase despite a small number of `jest.*` call sites — mock hoisting, ESM spy semantics, snapshots, and TypeScript config boundaries all need work.
- **Risk:** CLI and concurrency tests exercise subtle module-loading behavior; a migration PR would need careful review with little user-facing benefit.
- **Ecosystem fit:** Jest 27 is dated but stable; the project already documents pinned versions and conservative upgrades ([CONTRIBUTING.md](../../CONTRIBUTING.md)).

## Decision

**Keep Jest** as the test runner. Do not migrate to Vitest at this time.

## Consequences

### Positive

- No churn in test files, snapshots, mocks, or CI scripts.
- Avoids introducing Vitest into a Node CLI library where the build pipeline uses Vite library mode ([ADR 0006](./0006-vite-instead-of-rollup.md)).
- Benchmark and compatibility findings are documented for a future revisit.

### Negative / trade-offs

- Test startup/transpile remains on Babel + Jest 27, which is slower than Vitest's esbuild pipeline.
- Jest 27 is several major versions behind; security and maintenance updates require a Jest upgrade path eventually.

### Follow-up

- Consider **upgrading Jest to 29.x** (and replacing `babel-jest` with `@swc/jest` or native TS support) as a lower-risk performance improvement before revisiting Vitest.
- Revisit this ADR if the test suite grows significantly (e.g. 3× more integration tests) or if Vitest improves Jest mock/snapshot compatibility with zero-change migrations.
- When closing stale Jest-related Dependabot PRs, prefer a focused Jest 29 upgrade PR over a Vitest rewrite.

## References

- [Vitest documentation](https://vitest.dev/)
- [Vitest migration guide (from Jest)](https://vitest.dev/guide/migration.html)
- [ADR 0001: ESLint vs Biome](./0001-eslint-vs-biome-linting.md)
- Benchmark environment: macOS, Node.js 26.x, Vitest 3.2.4 (temporary dev install, not merged)
