# ADR 0001: Keep ESLint instead of migrating to Biome

- **Status:** Accepted
- **Date:** 2026-07-02
- **Context:** [Dependabot PR #551](https://github.com/itgalaxy/webfont/pull/551) proposes bumping `@typescript-eslint/eslint-plugin` from 4.28.5 to 5.14.0. Before investing in ESLint maintenance, we benchmarked whether replacing ESLint with [Biome](https://biomejs.dev/) would improve developer and CI performance.

## Decision drivers

- Local and CI lint time (`npm run lint` runs before every `npm test` build).
- Migration cost versus measurable speedup on this repository.
- Parity with the current, strict ESLint rule set (7 plugins, project-specific overrides).
- Stability of the existing lint + `lint-staged` + Husky workflow.

## Considered options

1. **Keep ESLint** (current stack: ESLint 7, `@typescript-eslint` 5.x, import/jest/node/promise/unicorn plugins).
2. **Replace ESLint with Biome** (`biome check` / `biome lint` as the primary linter).
3. **Hybrid:** Biome for formatting only, ESLint for lint rules (not benchmarked in depth here).

## Benchmark methodology

Measurements were taken on `master` at version **11.5.11** (2026-07-02), on macOS, Node.js 26.x.

| Metric | Value |
|--------|-------|
| TypeScript/JavaScript source files (excl. `node_modules`, `dist`) | ~28 files |
| Lines of code (approx.) | ~2,600 |
| ESLint scope | `eslint .` (respects `.eslintignore`) |
| Biome scope | `biome check .` and `biome lint src` (default config, no `biome.json`) |

Each tool was warmed up, then timed over **15 runs** using installed binaries (`node_modules/.bin/eslint`, `@biomejs/biome@2.5.2`). Median wall-clock time is reported.

Issue counts were taken with default tool configuration (not tuned for parity):

| Tool | Files checked | Errors | Warnings |
|------|---------------|--------|----------|
| ESLint 7.32.0 | 31 | 0 | 0 |
| Biome 2.5.2 (`check .`) | 75 | 273 | 682 |

Biome reports additional diagnostics on config files (e.g. `tsconfig.json`, `rollup.config.js`) and applies its default rule set, which is **not** equivalent to this project's ESLint configuration.

## Benchmark results

| Command | Median time | vs ESLint |
|---------|-------------|-----------|
| `eslint .` (cache enabled) | **910 ms** | baseline |
| `biome check .` | **140 ms** | **6.5× faster** |
| `biome lint src` | **110 ms** | **8.3× faster** |

Biome's own summary for `check .` reported **~117 ms** internal analysis time, consistent with the wall-clock measurement once Node startup overhead is excluded.

With `npx` cold invocation (no local binary warmup), Biome was only **~1.3–1.4× faster** than ESLint because process startup dominated. Installed binaries are what matter for CI and repeated local runs.

### Absolute savings

Replacing ESLint with Biome would save roughly **0.75–0.8 seconds per full lint run** on the current codebase.

In context:

- `npm test` (build + 48 tests) takes **~8–18 seconds** locally.
- Lint runs once per test invocation via `prebuild`.
- The lint step is a **small fraction** of total CI time compared to install, build, and Jest.

## Non-performance factors

### Migration cost

- `.eslintrc.js` defines **~200+ rules** across core, TypeScript, import, Jest, Node, Promise, and Unicorn plugins, plus file-specific overrides (tests, CLI, markdown).
- Biome is **not a drop-in replacement**: a default `biome check` emits hundreds of diagnostics where ESLint currently reports zero errors.
- Reaching parity would require authoring `biome.json`, mapping or dropping rules, updating `lint-staged`, Husky hooks, and contributor documentation.
- [PR #551](https://github.com/itgalaxy/webfont/pull/551) is **stale**: `master` already resolves `@typescript-eslint/eslint-plugin@5.38.0` via pinned/latest devDependencies, newer than the PR's 5.14.0 target.

### Ecosystem fit

- `lint-staged` runs `eslint` on staged `*.ts` files today.
- Team familiarity and existing plugin-specific rules (e.g. `import/extensions`, Jest limits in test files) would all need renegotiation.
- Biome's linter and formatter are opinionated; adopting it fully is a **policy change**, not a dependency bump.

## Decision

**Keep ESLint.** Do not migrate to Biome at this time.

Biome is materially faster on this repository (**6–8×** with installed binaries), but the **absolute time saved (~0.8 s)** does not justify the **high migration and rule-parity cost** for a small codebase where lint is not the CI bottleneck.

## Consequences

### Positive (staying on ESLint)

- No churn for contributors or open Dependabot ESLint PRs beyond normal maintenance.
- Existing strict rules and overrides remain authoritative.
- `lint-staged` / Husky integration unchanged.

### Negative (staying on ESLint)

- Lint remains slower than Biome would be; savings are left on the table.
- ESLint 7 and the current plugin stack will continue to need periodic upgrades.

### Revisit when

- Source files or LOC grow substantially (e.g. 10×) and lint time becomes a measurable CI pain point.
- ESLint upgrade path becomes blocked or unmaintainable.
- The project is willing to adopt Biome's opinionated defaults (or invest in a curated `biome.json`) as a deliberate style migration—not only for speed.

## References

- [Biome documentation](https://biomejs.dev/)
- [Dependabot PR #551 — @typescript-eslint/eslint-plugin 4.28.5 → 5.14.0](https://github.com/itgalaxy/webfont/pull/551)
- Benchmark date: 2026-07-02, branch `master`, package version 11.5.11
