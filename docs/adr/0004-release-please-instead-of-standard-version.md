# ADR 0004: Replace standard-version with Release Please

- **Status:** Accepted
- **Date:** 2026-07-02
- **Supersedes:** Automated release flow in `.github/workflows/version-bump.yml` and `standard-version` in `package.json`

## Context

Releases were automated with **`standard-version@9.5.0`** via the `version-bump` GitHub Actions workflow:

- On every push to `master` (except `chore(release)` commits), CI synced `package.json` from the latest git tag, ran `npm run release`, and pushed version commits and tags back to `master`.
- `CHANGELOG.md`, `package.json`, and `package-lock.json` were updated in-place on the default branch.

Problems with this approach:

| Issue | Detail |
|-------|--------|
| **Unmaintained tooling** | `standard-version` has no active releases; it pulls deprecated `conventional-changelog` v3 presets (`npm warn deprecated conventional-changelog-*`). |
| **No release PR** | Version bumps landed directly on `master`, bypassing review. |
| **Fragile sync step** | The workflow manually reconciled tags vs `package.json` before calling `standard-version`. |
| **Legacy references** | Comments mentioned “Lerna semantic release” though the repo is a single package. |

The project already uses [Conventional Commits](https://www.conventionalcommits.org/) and documents them in `CONTRIBUTING.md` and GitLab workflow rules.

## Decision drivers

- **Maintained upstream:** [Release Please](https://github.com/googleapis/release-please) is actively maintained by Google.
- **Release PR workflow:** Proposed version, changelog, and manifest updates are reviewed in a PR before merge.
- **No local release dependency:** Versioning runs in GitHub Actions; removes `standard-version` and its transitive deprecated packages from `npm ci` output.
- **Node support:** Built-in `node` release type updates `package.json`, lockfile, and `CHANGELOG.md`.
- **GitHub Releases:** Merging the Release PR creates a tag and GitHub Release, which continues to trigger `.github/workflows/npm-publish.yml`.

## Decision

**Replace `standard-version` and `version-bump.yml` with Release Please.**

1. Add `release-please-config.json` and `.release-please-manifest.json` (manifest bootstrapped at the current package version).
2. Add `.github/workflows/release-please.yml` using `googleapis/release-please-action@v4` on pushes to `master`.
3. Remove `.github/workflows/version-bump.yml`.
4. Remove from `package.json`: `standard-version`, `release`, `release-alpha`, `prerelease`, `preversion`, and `push-tags` scripts.
5. Update `CHANGELOG.md` header to reference Conventional Commits and Release Please.
6. Document the release process in `CONTRIBUTING.md`.

### Configuration

```json
// release-please-config.json
{
  "packages": {
    ".": {
      "release-type": "node",
      "package-name": "webfont"
    }
  }
}
```

```json
// .release-please-manifest.json
{
  ".": "11.5.21"
}
```

### Contributor workflow (after merge)

1. Land features/fixes on `master` with Conventional Commit messages (`feat:`, `fix:`, `docs:`, etc.).
2. Release Please opens or updates a **Release PR** (title like `chore(master): release 11.6.0`).
3. Maintainers review the Release PR (version, changelog).
4. Merge the Release PR → Release Please creates the git tag and GitHub Release.
5. `npm-publish.yml` runs on `release: created` (existing behavior).

## Consequences

### Positive

- Removes deprecated `conventional-changelog-*` warnings from `npm install`.
- Release changes are visible in a PR before they ship.
- Single maintained tool instead of custom tag-sync + `standard-version` push loop.
- Aligns with Conventional Commits already used in the repo.

### Negative / trade-offs

- **Release PR cadence:** Version bumps no longer land instantly on every `master` push; they accumulate in a Release PR until merged.
- **`GITHUB_TOKEN` limitation:** Releases and Release PRs created by the default token do not trigger other workflows that listen to `pull_request` from those events. If CI must run on Release PRs with full permissions, configure a PAT secret (see [Release Please Action docs](https://github.com/googleapis/release-please-action#github-credentials)).
- **Prereleases:** The old `npm run release-alpha` script is removed; use Conventional Commit prerelease notation or Release Please `release-as` / manifest options when needed.

### Follow-up

- If npm registry publish should run automatically, extend `npm-publish.yml` with `npm publish` and `NPM_TOKEN` (today it only runs `npm test` on `release: created`).

## References

- [Release Please](https://github.com/googleapis/release-please)
- [Release Please Action](https://github.com/googleapis/release-please-action)
- [Manifest releaser](https://github.com/googleapis/release-please/blob/main/docs/manifest-releaser.md)
- [Conventional Commits](https://www.conventionalcommits.org/)
