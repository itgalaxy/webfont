# ADR 0014: Do not keep a grunt-webfont-recipe workspace

- **Status:** Accepted
- **Date:** 2026-07-26
- **Related:** [#771](https://github.com/itgalaxy/webfont/issues/771), [ADR 0013](./0013-npm-workspaces-monorepo.md), Dependabot / `npm audit` (`brace-expansion` via `grunt`)

## Context

[`grunt-webfont`](https://github.com/sapegin/grunt-webfont) (sapegin) is archived. This monorepo previously added a private workspace `packages/grunt-webfont-recipe` as a **documented custom Grunt task** that calls `webfont()` + `writeResultFiles()` — not a published npm plugin.

That workspace declared `grunt` and `grunt-cli` as dependencies so a CI smoke test could run `npx grunt webfont`. npm workspaces then install those packages into the **root** tree.

`grunt@1.6.2` pulls `minimatch@3` → `brace-expansion@1.x`, which npm audit reports as high severity. There is no clean patch without breaking Grunt’s dependency graph. Pre-push Lefthook runs `npm audit --audit-level=info`, so the recipe blocked unrelated security and feature PRs.

webfont’s product surface is the published library + CLI. Grunt is a legacy host; consumers already install Grunt in **their** projects.

## Decision drivers

- **Audit hygiene:** The monorepo must not carry vulnerable transitive deps solely to demo a third-party task runner.
- **Honest scope:** The recipe was never published; shipping a workspace that installs Grunt overstated our commitment.
- **Docs over executables:** A copy-paste `Gruntfile` snippet is enough for the few remaining Grunt users.
- **No official plugin:** Still deferred unless demand appears (#771).

## Decision

**Do not maintain a `grunt-webfont-recipe` (or any) npm workspace that depends on `grunt`.**

1. **Remove** `packages/grunt-webfont-recipe/` and any CI/smoke test that installs or runs Grunt in this repository.
2. **Document** Grunt integration only under the published docs surface (for example `packages/webfont/docs/grunt.md`): custom task using `webfont()` + `writeResultFiles()`, optional CLI spawn, parity gaps vs archived `grunt-webfont`.
3. **Do not** add `grunt` / `grunt-cli` to root or `packages/webfont` `package.json` (including `devDependencies`) for examples.
4. **Do not** publish an official `grunt-webfont` plugin unless a future ADR revisits #771 with clear demand.

## Consequences

### Positive

- Root `npm audit` no longer fails on Grunt’s `brace-expansion` chain from this workspace.
- Smaller install and clearer monorepo boundary (library + docs + optional private tools that do not pull task runners).
- Documentation remains the supported migration path from sapegin/grunt-webfont.

### Negative

- No in-repo executable Grunt example or smoke test that proves `npx grunt webfont` against fixtures.
- Contributors cannot `cd packages/grunt-webfont-recipe && npm test` — they copy the docs snippet into a consumer project.

### Neutral

- Issue #771 stays open as “no official plugin unless demand”; docs cite it explicitly.

## Compliance

- `packages/*` workspaces must not list `grunt` or `grunt-cli` as dependencies for demo recipes.
- User-facing install/configuration/migration pages must link to the docs-only Grunt guide, not a deleted package path.
- Pre-push `npm audit` must not be waived to keep a Grunt demo.

## References

- [Grunt integration (docs)](../../packages/webfont/docs/grunt.md)
- [Install — Grunt](../../packages/webfont/install.md#grunt-legacy-projects)
- [MIGRATION — Comparison with grunt-webfont](../../MIGRATION.md#comparison-with-grunt-webfont)
- [sapegin/grunt-webfont](https://github.com/sapegin/grunt-webfont)
- Issue [#771](https://github.com/itgalaxy/webfont/issues/771)
