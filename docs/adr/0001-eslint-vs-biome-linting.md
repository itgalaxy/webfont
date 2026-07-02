# ADR 0001: Migrate from ESLint to Biome for linting and formatting

- **Status:** Accepted
- **Date:** 2026-07-02
- **Supersedes:** Initial ADR draft that recommended keeping ESLint

## Context

The project used ESLint 7 with `@typescript-eslint` and six additional plugins (`.eslintrc.js` defined 200+ rules). Lint runs on every `npm test` via `prebuild` and on staged files through `lint-staged` / Husky.

[Dependabot PR #551](https://github.com/itgalaxy/webfont/pull/551) proposed upgrading `@typescript-eslint/eslint-plugin` but was already stale (`master` had 5.38.0). We benchmarked [Biome](https://biomejs.dev/) as an alternative.

## Benchmark results (2026-07-02, v11.5.11)

Repository size: ~28 TypeScript/JavaScript files, ~2,600 LOC.

| Command | Median (installed binaries) |
|---------|----------------------------|
| `eslint .` | 910 ms |
| `biome check .` | 140 ms (**6.5× faster**) |
| `biome lint src` | 110 ms (**8.3× faster**) |

Absolute savings: **~0.8 s per lint run**. Relative speedup is significant; on this small codebase lint was not the CI bottleneck, but faster feedback in local development and pre-commit hooks is worthwhile—especially as the project grows.

## Decision drivers

- **Performance:** Biome is 6–8× faster with installed binaries.
- **Tooling consolidation:** Biome provides linting, formatting, and import organization in one tool (replacing ESLint and implicit formatting concerns).
- **Maintenance:** Fewer devDependencies (no ESLint plugin matrix); pinned `@biomejs/biome` version.
- **Rule parity:** ESLint rules were migrated with `biome migrate eslint`; unsupported plugin rules (import, node, jest, unicorn) were dropped or replaced by Biome equivalents.

## Decision

**Migrate to Biome** as the sole linter and formatter for TypeScript, JavaScript, and JSON project files.

- `npm run lint` → `biome check .`
- `npm run prettify` → `biome check --write .`
- `lint-staged` → `biome check --write` on staged `*.{ts,js,json}`
- Remove ESLint configuration and dependencies
- Configuration lives in `biome.json` (migrated from `.eslintrc.js` via `biome migrate eslint`, then adjusted)

## Consequences

### Positive

- Faster lint/format in CI, `prebuild`, and pre-commit hooks.
- Single configuration file (`biome.json`) instead of ESLint + multiple plugins.
- Import sorting and formatting applied consistently by Biome.

### Negative / trade-offs

- Not every ESLint rule has a Biome equivalent (`import/extensions`, `node/no-unpublished-require`, etc.).
- Contributors familiar with ESLint disable comments must use `biome-ignore` where needed.
- Stale Dependabot PRs for ESLint (#551 and related) should be closed.

### Follow-up

- Close obsolete ESLint Dependabot PRs.
- Revisit `biome.json` rule strictness if new false positives appear.
- Consider enabling additional Biome rules incrementally rather than restoring the full ESLint surface area.

## References

- [Biome documentation](https://biomejs.dev/)
- [Dependabot PR #551](https://github.com/itgalaxy/webfont/pull/551)
- Benchmark environment: macOS, Node.js 26.x, 2026-07-02
