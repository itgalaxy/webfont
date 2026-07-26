# ADR 0015: Enable Vitest globals in workspace test suites

- **Status:** Accepted
- **Date:** 2026-07-26
- **Related:** [ADR 0002](./0002-jest-vs-vitest-testing.md) (Vitest as runner), [ADR 0013](./0013-npm-workspaces-monorepo.md), [#796](https://github.com/itgalaxy/webfont/pull/796)

## Context

After adopting Vitest ([ADR 0002](./0002-jest-vs-vitest-testing.md) superseded), `packages/webfont` already ran with `test.globals: true` and `compilerOptions.types` including `vitest/globals`. Many tests still import `{ describe, it, expect }` from `"vitest"` out of habit; others (for example `index.test.ts`) rely on globals, including `expectTypeOf`.

Private workspaces such as `packages/webfont-mcp` initially omitted `globals`. Reviewers (and agents) then flagged missing Vitest imports as runtime failures, even when the sibling package already injects those APIs.

Inconsistent globals across workspaces create false positives in review and force noisy imports that are not required by the monorepo convention.

## Decision drivers

- **One convention:** Every Vitest workspace should behave the same for `describe` / `it` / `expect` / `expectTypeOf` / `vi` / hooks.
- **Type safety:** `vitest/globals` in TypeScript types must cover test files so editors and `tsc` agree with runtime.
- **Review signal:** “Missing Vitest import” is not a defect when globals are enabled and typed.
- **Build isolation:** Production emit must not ship test files or pull Vitest types into published declaration graphs.

## Decision

**Enable Vitest `globals` for each workspace that runs Vitest.**

1. Set `test.globals: true` in that package’s `vitest.config.ts` (or shared Vitest config).
2. Include `"vitest/globals"` in TypeScript `compilerOptions.types` for configs that typecheck tests (IDE / `typecheck`).
3. Keep a **build** tsconfig (for example `tsconfig.build.json`) that emits library/CLI code **without** test files and **without** requiring `vitest/globals` on production sources.
4. **Optional** explicit `import { … } from "vitest"` remains allowed (clarity, or importing only `vi` / matchers). New tests may omit those imports.

Applies today to:

| Workspace | Notes |
|-----------|--------|
| `packages/webfont` | Already used globals; keep as the reference |
| `packages/webfont-mcp` | Aligned in #796 (`vitest.config.ts` + `tsconfig.json` / `tsconfig.build.json`) |

Future `packages/*` Vitest suites follow the same pattern.

## Consequences

### Positive

- Copilot / human review no longer treats global `describe` / `it` / `expect` as broken in correctly configured workspaces.
- Less boilerplate in new tests; matches Vitest’s documented globals mode.
- MCP and library packages stay consistent under [ADR 0013](./0013-npm-workspaces-monorepo.md).

### Negative / trade-offs

- Globals pollute the TypeScript global scope for files included in the typecheck tsconfig — mitigate by excluding tests from emit and limiting `vitest/globals` to the typecheck config.
- Mixed style (some files import, some don’t) may persist until cleaned up; both are valid under this ADR.

### Compliance

- Do not “fix” tests solely by adding Vitest helper imports when the workspace already has `globals: true` and `vitest/globals` types.
- New Vitest workspaces must enable globals in the same PR that adds the first `*.test.ts` file.

## References

- [Vitest — Globals](https://vitest.dev/config/#globals)
- [ADR 0002: Jest vs Vitest](./0002-jest-vs-vitest-testing.md)
- [ADR 0013: npm workspaces monorepo](./0013-npm-workspaces-monorepo.md)
- PR [#796](https://github.com/itgalaxy/webfont/pull/796)
