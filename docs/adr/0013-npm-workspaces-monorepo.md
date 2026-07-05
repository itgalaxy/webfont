# ADR 0013: npm workspaces monorepo

- **Status:** Accepted
- **Date:** 2026-07-04
- **Related:** [#721](https://github.com/itgalaxy/webfont/issues/721), [ADR 0004](./0004-release-please-instead-of-standard-version.md)

## Context

The repository ships a Node library and CLI (`webfont` on npm) and a VitePress documentation site at the repo root. Planned follow-ups include a browser **studio** app, optional **CLI** package split, and a **Homebrew** formula — each with different dependencies and release cadence.

A single flat package layout couples build tooling, publish surface, and future apps. The browser studio in particular should not reach into `src/` via relative imports or pull GPL WASM dependencies into the published library.

## Decision drivers

- **One public npm package:** Consumers keep installing `webfont`; version and changelog stay with the library.
- **Room to grow:** `packages/*` can host `webfont-studio`, a future `webfont-cli`, and other private workspaces without another repository split.
- **Minimal docs churn:** VitePress and user-facing markdown (`README.md`, `FEATURES.md`, …) remain at the **repo root**; only library source moves under `packages/webfont`.
- **Existing tooling:** npm workspaces (no Turborepo/Nx initially), Release Please, Knip, Vitest, and Lefthook continue with path updates.

## Decision

**Adopt an npm workspaces monorepo.**

| Location | Role |
|----------|------|
| **Root** (`private: true`) | Workspaces orchestration, VitePress site, shared Biome/Lefthook, `docs/adr`, migration guides |
| **`packages/webfont`** | Published `webfont` package — `src/`, `templates/`, build (`vite.config.ts`), tests, `CHANGELOG.md`, `NOTICE.md` |
| **`packages/*` (future)** | `webfont-studio` (private), optional CLI split, Homebrew-related assets |

### Release & publish

- Release Please manifest targets **`packages/webfont`** only.
- `npm publish -w webfont` (or equivalent `working-directory`) publishes the library; root stays private.
- GitHub Packages scope rename (`@itgalaxy/webfont`) applies to the workspace package at publish time.

### Root scripts

Aggregate scripts (`npm test`, `npm run build`, `npm run test:package`, `npm run docs:site`) delegate to `webfont` where appropriate. Docs scripts build `packages/webfont/dist/cli.mjs` for the font demo.

## Consequences

### Positive

- Clear boundary between published library and future browser/tooling packages.
- GPL or browser-only dependencies can live in `webfont-studio` without polluting `webfont` `package.json`.
- Homebrew formula can reference a stable `packages/webfont` path for the CLI binary.

### Negative / trade-offs

- Contributors learn workspace paths (`packages/webfont/src/`, …).
- `npm ci` must run at the **repo root**; publishing and pack-smoke tests target `packages/webfont`.
- VitePress rewrites point at `packages/webfont/CHANGELOG.md` and `packages/webfont/NOTICE.md` while other markdown stays at root.

## Out of scope (follow-ups)

- Moving VitePress into `packages/docs`
- Publishing `webfont-studio` to npm
- Extracting `webfont-cli` as a separate workspace
- Homebrew tap repository or formula (#769)

## Acceptance

- `npm ci` at root installs workspaces.
- `npm test` and `npm run test:package` pass from root.
- Release Please and `npm-publish.yml` version/publish **only** `packages/webfont` as `webfont` on npm.
