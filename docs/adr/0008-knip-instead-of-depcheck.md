# ADR 0008: Adopt Knip instead of depcheck for dependency and dead-code analysis

- **Status:** Accepted (amended 2026-07-26 — [#822](https://github.com/itgalaxy/webfont/issues/822))
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

- Prefer fixing **entry** globs and removing dead `export`s over adding `ignoreIssues`.
- Consider `knip --production` in a separate job only after entry mapping makes it truthful (today it false-positives most runtime dependencies).
- Optionally extend Knip to `webfont-mcp` / root workspaces when that package stabilizes.

## Amendment (2026-07-26) — keep Knip and **tighten** configuration ([#822](https://github.com/itgalaxy/webfont/issues/822))

### Context

A large `ignoreIssues` map was papering over incomplete `entry` coverage and dead re-exports. Narrowing Knip by excluding `exports` / `types` would weaken the gate; that approach was rejected.

### Decision

**Keep Knip.** Do **not** drop it, replace it with classic depcheck-only, or exclude export/type issue classes from CI.

Tighten instead:

1. List real public and tooling entry files in `packages/webfont/knip.json` (`src/index.ts`, `src/standalone/index.ts`, `scripts/**`, fixtures, CLI, templates, browser).
2. Expand `project` to include `scripts/**` so orphan script files are detectable.
3. Remove the `ignoreIssues` map (public barrels are covered by complete `entry` globs; dead re-exports removed in source).
4. Do **not** enable `includeEntryExports` — this is a published library; entry exports are the public API.
5. Document the change here and in CONTRIBUTING / AGENTS / TROUBLESHOOTING.

### Policy for future changes

1. When Knip reports unused exports: **un-export** or **wire** them (entry / real import). Do not add `ignoreIssues` for public barrels.
2. When Knip misses a file: add an **entry** or **project** glob.
3. Use `ignoreDependencies` only for packages required dynamically by tools Knip cannot see; document why in TROUBLESHOOTING. (The former `@typescript/typescript6` exception was removed with [ADR 0016](./0016-tsc-declarations-typescript7.md) / [#824](https://github.com/itgalaxy/webfont/issues/824).)
4. Reject PRs that exclude `exports` / `types` from the default Knip gate without a superseding ADR.

## References

- [Knip documentation](https://knip.dev/)
- [depcheck](https://github.com/depcheck/depcheck) — prior art, narrower scope
- [ADR 0003: Lefthook instead of Husky / lint-staged](./0003-lefthook-instead-of-husky-lint-staged.md)
- [#822](https://github.com/itgalaxy/webfont/issues/822) — investigate keep / narrow / replace / remove
- [ADR 0016](./0016-tsc-declarations-typescript7.md) — TypeScript 7 `tsc` declarations; no `@typescript/typescript6`