# ADR 0003: Replace Husky and lint-staged with Lefthook

- **Status:** Accepted
- **Date:** 2026-07-02
- **Supersedes:** Git hook setup described in [ADR 0001](./0001-eslint-vs-biome-linting.md) (`lint-staged` / Husky)

## Context

[ADR 0001](./0001-eslint-vs-biome-linting.md) moved lint/format to Biome and intended pre-commit checks via **Husky** + **lint-staged** on staged `*.{ts,js,json}` files.

In practice the hook stack was **not active**:

- `husky.config.js` used the **Husky v4** API (`hooks: { "pre-commit": ... }`).
- `package-lock.json` resolved **Husky 7.x**, which expects a `.husky/` directory and a `prepare` script.
- There was **no** `lint-staged` configuration in `package.json`.
- Fresh clones had only default `.sample` files under `.git/hooks/` — no `pre-commit` or `pre-push` ran locally.

The intended behavior was:

| Hook | Command |
|------|---------|
| `pre-commit` | Biome check (with safe fixes) on **staged** files only |
| `pre-push` | `npm test` (full build + lint + Jest) |

## Decision drivers

- **Single tool:** [Lefthook](https://github.com/evilmartians/lefthook) manages hooks and staged-file filtering (`{staged_files}`, `glob`, `stage_fixed`) without a separate lint-staged dependency.
- **Official Biome guidance:** Biome documents Lefthook as a first-class Git hooks option.
- **Fewer Node devDependencies:** Remove `husky` (pinned as `latest` in `package.json` but outdated config) and `lint-staged` 11.x.
- **Explicit local testing:** `lefthook run pre-commit` and `lefthook run pre-push` simulate hooks without committing or pushing.
- **Repository size:** ~28 TS/JS files — no need for lint-staged’s dynamic JS configuration.

## Decision

**Replace Husky and lint-staged with Lefthook.**

- Add `lefthook.yml` at the repository root.
- Add `prepare`: `lefthook install` in `package.json` (runs on `npm ci` / `npm install`).
- Pin `lefthook` to an exact version in `devDependencies`.
- Remove `husky`, `lint-staged`, and `husky.config.js`.

### Hook configuration

```yaml
pre-commit:
  commands:
    biome:
      glob: "*.{ts,js,json}"
      run: npx @biomejs/biome check --write --no-errors-on-unmatched --files-ignore-unknown=true {staged_files}
      stage_fixed: true

pre-push:
  commands:
    test:
      run: npm test
```

`stage_fixed: true` re-stages files after Biome applies safe fixes, matching the previous lint-staged intent.

## Consequences

### Positive

- Git hooks work on fresh clones after `npm install`.
- One configuration file (`lefthook.yml`) instead of Husky + lint-staged + dead `husky.config.js`.
- Contributors can dry-run hooks with `lefthook run pre-commit` / `lefthook run pre-push`.
- Optional personal overrides via `lefthook-local.yml` (gitignored by Lefthook defaults).

### Negative / trade-offs

- New dependency and YAML config to learn (small surface).
- `pre-push` runs full `npm test` (~8–10 s); can be skipped locally with `LEFTHOOK=0 git push` when needed.
- ADR 0001 still mentions lint-staged historically; hook behavior is defined by this ADR.

### Follow-up

- Document hook usage in `CONTRIBUTING.md`.
- Remove `.husky` from `jest.config.ts` `modulePathIgnorePatterns` if no longer present.

## References

- [Lefthook](https://github.com/evilmartians/lefthook)
- [Biome — Git hooks](https://biomejs.dev/recipes/git-hooks/)
- [ADR 0001](./0001-eslint-vs-biome-linting.md)
