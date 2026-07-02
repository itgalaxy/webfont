# ADR 0008: Adopt Knip instead of depcheck for dependency and dead-code analysis

- **Status:** Accepted
- **Date:** 2026-07-02
- **Related:** [ADR 0003](./0003-lefthook-instead-of-husky-lint-staged.md) (removed `lint-staged.config.js` leftover)

## Context

The repository had **no** automated unused-dependency checker in CI. [depcheck](https://github.com/depcheck/depcheck) is a common choice but only reports **unused or missing dependencies** in `package.json`.

[Knip](https://knip.dev/) analyzes the module graph from entry files and tooling plugins (Vite, Vitest) and additionally reports:

- unused **exports** and **types**
- unused **files**
- **unlisted** dependencies (imported but not declared)
- duplicate export patterns

The project is a small Node library + CLI with Vitest tests, Vite builds, cosmiconfig fixtures, and a Vitest `globby` stub — a graph depcheck cannot see completely.

### First Knip run (2026-07-02, before cleanup)

| Finding | Action |
|---------|--------|
| `parse-json` unused direct dependency | Removed — not imported; cosmiconfig does not require it at top level |
| `ts-node`, `tslib` unused devDependencies | Removed — legacy; Vite + Vitest handle transpilation |
| `lint-staged.config.js` unused file | Deleted — obsolete after [ADR 0003](./0003-lefthook-instead-of-husky-lint-staged.md) |
| `fast-glob` unlisted in `vitest/globby-stub.ts` | Added as pinned devDependency (matches `overrides`) |
| Intentional barrel / test exports | Documented in `knip.json` `ignoreIssues` |

## Decision drivers

- **Broader coverage:** One tool for dependencies, exports, and orphan files instead of depcheck alone.
- **Plugin ecosystem:** Knip reads `vite.config.ts` and `vitest.config.ts` automatically when `vite` and `vitest` are devDependencies.
- **CI signal:** Fail PRs on drift in `package.json` vs actual imports.
- **Familiar script name:** Keep `npm run depcheck` as an alias for `knip` so contributors searching for “depcheck” find the right command.

## Decision

**Adopt Knip 6.x** as the dependency and dead-code analyzer.

1. Add `knip` (pinned) to `devDependencies`.
2. Add root `knip.json` with:
   - explicit `entry` for CLI, public types, templates, Vitest stub, and cosmiconfig fixtures;
   - `project` globs for `src/`, `templates/`, and `vitest/`;
   - `exclude: ["duplicates"]` for intentional `export default` + named re-export patterns;
   - targeted `ignoreIssues` for test-only and barrel exports.
3. Add `"depcheck": "knip"` script in `package.json`.
4. Run `npm run depcheck` in [`.github/workflows/pr.yml`](../../.github/workflows/pr.yml) before `npm test`.
5. Document in [CONTRIBUTING.md](../../CONTRIBUTING.md) Dependencies section.

### Configuration sketch

```json
{
  "$schema": "https://unpkg.com/knip@6/schema.json",
  "entry": ["src/cli/index.ts", "src/types/index.ts", "templates/index.ts", "..."],
  "project": ["src/**/*.{ts,js}", "templates/**/*.{ts,js}", "vitest/**/*.ts"],
  "exclude": ["duplicates"]
}
```

## Consequences

### Positive

- CI catches unused dependencies and unlisted imports early.
- Removes dead `lint-staged.config.js` and three stale packages.
- `knip.json` documents intentional public-export barrels and fixture entry points.

### Negative / trade-offs

- **Configuration maintenance:** New fixture directories or entry points may need `knip.json` updates.
- **`ignoreIssues` scope:** Some exports are suppressed where tests import subpaths directly; prefer adding entry files over growing ignores.
- **Not a license auditor:** Knip does not replace `license-checker` in [NOTICE.md](../../NOTICE.md).

### Follow-up

- Revisit `ignoreIssues` when CLI modules stop re-exporting test-only symbols.
- Consider `knip --production` in a separate job if we want stricter publish-surface analysis.

## References

- [Knip documentation](https://knip.dev/)
- [depcheck](https://github.com/depcheck/depcheck) — prior art, narrower scope
- [ADR 0003: Lefthook instead of Husky / lint-staged](./0003-lefthook-instead-of-husky-lint-staged.md)
