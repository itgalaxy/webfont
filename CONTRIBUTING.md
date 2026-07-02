# Contributing

This project has a [code of conduct](https://github.com/itgalaxy/webfont/blob/master/CODE_OF_CONDUCT.md). By interacting with this repository, organization, or community you agree to abide by its terms.

---

We’re excited that you’re interested in contributing! Take a moment to read the following guidelines.

There are several ways to contribute, not just by writing code:

## Improving documentation

As a user of this project you’re perfect for helping us improve our docs: typo corrections, error fixes, better explanations, and new examples.

## Improving issues

Some [issues lack information](https://github.com/itgalaxy/webfont/issues?q=is%3Aopen+is%3Aissue+label%3A%22need+more+info%22), aren’t reproducible, or are just [invalid](https://github.com/itgalaxy/webfont/issues?q=is%3Aopen+is%3Aissue+label%3Ainvalid). Help make them easier to resolve.

**Common errors:** see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for symptoms and fixes on the current release. **Upgrading?** see [MIGRATION.md](./MIGRATION.md) for what changed between versions.

### Maintainer backlog (open issues)

When working through the issue tracker (see also [AGENTS.md](./AGENTS.md) — “GitHub issues workflow”):

1. Triage: assignee, milestone `next`, type label (`bug`, `enhancement`, etc.).
2. Fix PR: tests where needed, code change, and for **issue fixes that change behavior across releases** an entry in [MIGRATION.md](./MIGRATION.md) (before → after → workaround → steps after upgrade).
3. After merge: comment on the issue in English that the fix is on `master` and planned for the next release; **leave the issue open** until npm publish.
4. On release: comment with the **version number** and the exact steps from MIGRATION.md, then **close** the issue.

## Giving feedback on issues

We’re always looking for more opinions on discussions in the issue tracker.

## Writing code

Code contributions are very welcome. It’s often good to first create an issue to report a bug or suggest a new feature before creating a pull request to prevent you from doing unnecessary work.

And, if you’re raising an issue, please understand that people involved with this project often do so for fun, next to their day job; you are not entitled to free customer service.

## Submitting an issue

- Search the issue tracker (including closed issues) before opening a new issue;
- Ensure you’re using the latest version of projects;
- Use a clear and descriptive title;
- Include as [much information as possible](https://github.com/itgalaxy/webfont/blob/master/.github/ISSUE_TEMPLATE/bug_report.md): steps to reproduce the issue, error message, version, operating system, etcetera;
- The more time you put into an issue, the more we will.

## Submitting a pull request

- **Never commit or push directly to `master`.** Create a branch, open a pull request, and merge through GitHub — even for documentation-only or test-only changes. Maintainers merge; contributors and automation do not bypass review with `git push origin master`.
- **Use lowercase branch names only.** The full branch name must be lowercase letters, numbers, and slashes (for example `fix/cli-formats`, `test/to-ttf-unit-tests`, `ci/update-node-version`). Do not use camelCase, PascalCase, or uppercase acronyms in branch names.
- Non-trivial changes are often best discussed in an issue first, to prevent you from doing unnecessary work;
- For ambitious tasks, you should try to get your work in front of the community for feedback as soon as possible;
- New features should be accompanied with tests and documentation;
- Please, don’t include unrelated changes;

### User-facing changes and documentation

Before opening or updating a pull request, check whether your change affects **how people use webfont** — via the CLI (`webfont` / `dist/cli.mjs`), the programmatic API (`webfont({ ... })`), or config files (`.webfontrc`, `package.json` `webfont` key, etc.).

When it does, update documentation in the same PR:

| What changed | Update |
|--------------|--------|
| CLI flags, aliases, or accepted flag values | [README.md](./README.md) CLI section, `src/cli/meow/cliOptions.ts` help text, and [FEATURES.md](./FEATURES.md) when capability changes |
| `webfont()` options, defaults, return shape, or supported inputs/outputs | [README.md](./README.md) Options / Result / Input modes, [FEATURES.md](./FEATURES.md) |
| New or removed public options or pipelines | README + [FEATURES.md](./FEATURES.md) + TypeScript types under `src/types/` |
| Bug fixes or recurring user-facing errors (especially from issues) | [MIGRATION.md](./MIGRATION.md) when behavior changes across versions; [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) when the fix applies the same on all releases |
| Legal notices, font licensing copy, attribution, or dependency license table | [NOTICE.md](./NOTICE.md); link from README as needed |
| Internal-only refactors with no usage change | No README or FEATURES change; say so in the PR **Testing** section |

Agents and automation should follow the same rule — see [AGENTS.md](./AGENTS.md) (“Documentation”).

### Pull request title and description

- **Use [Conventional Commits](https://www.conventionalcommits.org/) for the PR title** — the same format as commit messages (`feat:`, `fix:`, `chore(deps):`, `docs:`, `test:`, `ci:`, etc.). The title should describe the **overall** change in the PR, not bot prefixes like `[Snyk]` or `[Dependabot]`.
- **Merge pull requests with squash.** The PR title becomes the commit message on `master` (Release Please reads it). Do not merge with merge commits or rebase-merge for routine work.
- **Write pull request titles, descriptions, and review comments in English** (commits and code comments in English as well).
- **Keep the PR title and body in sync with the actual diff.** When new commits change what the PR does (extra fixes, tests, docs, refactors), update the title and description before asking for review — do not leave a narrow title like “enable strictNullChecks” on a PR that also ships CLI bug fixes and README changes.
- **Rename non-conforming PR titles** before review when the title uses vendor labels (`[Snyk]`, `[Dependabot]`), plain prose, or the wrong type. Example: `chore(deps): bump svg2ttf from 6.0.3 to 6.1.0` instead of `[Snyk] Security upgrade svg2ttf from 6.0.3 to 6.1.0`.
- **Prefer focused PRs.** If the scope keeps growing (unrelated fixes, large test refactors, docs, and feature work in one branch), stop stacking and **split follow-up work into separate PRs** instead. Land the original change first, then open new branches for the rest.

See [AGENTS.md](./AGENTS.md) (“Pull requests”) for agents and automation.

### Closing pull requests

When you close a pull request (as author or maintainer), **leave a comment explaining why** — do not close silently. Helpful reasons include: superseded by another PR (link it), obsolete after dependency or codebase changes, out of scope, duplicate, or rejected after review.

Write the comment in English so future contributors and bots (for example Dependabot) understand what happened.

### Testing and coverage

New behavior and bug fixes should include tests. Follow [AGENTS.md](./AGENTS.md) (“Testing”) for Vitest patterns in this repo.

| Expectation | Guidance |
|-------------|----------|
| **Unit + integration** | Error paths and guards should have **unit tests** in the module under test. Add integration tests when the full pipeline matters, but do not use them as the only coverage for a guard. |
| **Explicit, not implicit** | Name tests after the invariant they protect (for example, why a guard exists). If a dependency quirk motivated the code, add a small test that documents the quirk. |
| **Pipeline ordering** | When step B must not run if step A fails, assert B was not called (spy/mock), not only that the final promise rejected. |
| **Fixtures** | Reuse fixtures under `src/fixtures/` for file-based cases; add a fixture when the scenario is stable and reusable. |
| **Test titles** | Every `it(...)` description must include **`should`** or **`should not`** (for example, `should return default options`, `should not call metadataProvider when parse fails`). Avoid bare verbs (`returns`, `throws`, `accepts`) or prefixes like `documents that` without `should`. |

Run `npm test` before pushing. Integration-only coverage for a localized guard is incomplete.

- Lint and test before submitting code by running `$ npm test`;
- Run `$ npm run prettify` to apply Biome formatting and safe fixes before pushing;
- Write a [convincing description](https://github.com/itgalaxy/webfont/blob/master/.github/pull_request_template.md) of why we should land your pull request: it’s your job to convince us.

### Linting and formatting

This project uses [Biome](https://biomejs.dev/) for linting and formatting (`biome.json`). Use `npm run lint` to check and `npm run prettify` to auto-fix.

**Do not add legacy ESLint suppressions.** This repository no longer uses ESLint (see [ADR 0001](docs/adr/0001-eslint-vs-biome-linting.md)). Remove `eslint-disable` / `eslint-enable` comments instead of carrying them forward. When a rule must be suppressed, use a targeted `biome-ignore` comment with a short reason.

**Do not suppress TypeScript with `@ts-expect-error` or `@ts-ignore`.** Fix the underlying type issue instead:

| Situation | Prefer |
|-----------|--------|
| Extra keys from a loaded config file in tests | `type LoadedConfig = ResultConfig & { foo: string }` and cast `result.config as LoadedConfig` |
| Untyped or partial mocks (e.g. CLI `meow`) | Import from `__mocks__/` for assertions; if a cast is needed, use `as unknown as MockType` |
| Async code that should reject | `await expect(promise).rejects.toThrow(...)` or `.rejects.toMatchObject(...)` instead of `try/catch` + conditional `expect` |
| Intentionally unused parameters | Prefix with `_` (e.g. `_options`) so Biome and TypeScript accept them |
| Regex style rules | Rewrite the pattern (e.g. `/\s/gu` instead of a capture group only used for whitespace) |

Only use `biome-ignore` when there is no reasonable code change; never use it to paper over type errors—adjust types or test helpers instead.

**Do not use `ignoreDeprecations` in TypeScript config.** When upgrading TypeScript or hitting deprecated compiler options, migrate `tsconfig.json` (for example, replace deprecated `moduleResolution` values) and fix resulting type errors. Do not silence deprecations with `ignoreDeprecations`.

### Git hooks

Git hooks are managed by [Lefthook](https://github.com/evilmartians/lefthook) (`lefthook.yml`). They install automatically when you run `npm install` (`prepare` → `lefthook install`).

| Hook | What runs |
|------|-----------|
| `pre-commit` | Biome check (with safe fixes) on staged `*.{ts,js,json}` files |
| `pre-push` | `npm test` (full build + lint + Vitest) |

To simulate hooks without committing or pushing:

```shell
npx lefthook run pre-commit
npx lefthook run pre-push
```

See [ADR 0003](docs/adr/0003-lefthook-instead-of-husky-lint-staged.md) for rationale.

### Dependencies

- Pin exact versions in `package.json` (no `^`, `~`, or `latest` ranges), including `@types/*` packages.
- The repository sets `save-exact=true` in `.npmrc`, so `npm install <package>` records exact versions automatically.
- When upgrading a dependency, pin its `@types/<package>` counterpart in the same pull request when one exists.
- Update both `package.json` and `package-lock.json` in the same pull request.
- [Dependabot](.github/dependabot.yml) opens upgrade PRs for pinned dependencies; do not use open ranges to get updates.
- Run `npm run depcheck` before pushing when you add, remove, or move imports — it runs [Knip](https://knip.dev/) to find unused dependencies, unlisted imports, and dead exports (see [ADR 0008](docs/adr/0008-knip-instead-of-depcheck.md)). CI runs the same check on every pull request.

### CI changes

Pull requests that change CI configuration (for example, GitHub Actions workflows) must follow these conventions:

- **Branch name:** use the `ci/` prefix (e.g. `ci/update-node-version`).
- **Commit message:** use the `ci:` type in [Conventional Commits](https://www.conventionalcommits.org/) format (e.g. `ci: upgrade GitHub Actions to Node 22/24`).

Do not use `chore:` or `chore(ci):` for CI-only changes.

**AppVeyor:** a legacy project may still receive GitHub webhooks. Root `appveyor.yml` disables builds via a non-matching branch filter (`appveyor-disabled`) because maintainers may lack AppVeyor dashboard access. Do not delete it until the AppVeyor project is removed upstream.

### Releases

Versioning is automated with [Release Please](https://github.com/googleapis/release-please) (see [ADR 0004](docs/adr/0004-release-please-instead-of-standard-version.md)).

1. Merge changes to `master` using [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `ci:`, etc.).
2. Release Please opens or updates a **Release PR** with the next version, `CHANGELOG.md`, and `package.json` updates.
3. Review and merge the Release PR to create the git tag and GitHub Release on GitHub.
4. Publish to npm (see **npm publishing** below). The [`npm-publish`](.github/workflows/npm-publish.yml) workflow listens for `release: published`, but releases created with the default `GITHUB_TOKEN` usually **do not** trigger downstream workflows — use manual publish or re-run the workflow from the Actions tab if needed.

**Git tags** created by Release Please follow **`v{semver}`** (for example `v12.0.0`). The config sets `include-component-in-tag: false` so tags are not prefixed with the package name (`webfont-v12.0.0`). See [ADR 0004](docs/adr/0004-release-please-instead-of-standard-version.md).

Do not run local `npm version` or push version tags manually unless coordinating an emergency release with maintainers.

#### npm publishing

> **Blocked on maintainer:** npm package settings access is required to enable Trusted Publishing. Track progress in [#703](https://github.com/itgalaxy/webfont/issues/703).

Publishing from GitHub Actions uses **[npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers)** (OIDC) — not long-lived publish tokens with bypass 2FA.

**One-time setup on npmjs.com** (package maintainer):

1. Open [webfont package settings](https://www.npmjs.com/package/webfont) → **Trusted publishing** → **GitHub Actions**.
2. Set **Repository** to `itgalaxy/webfont`.
3. Set **Workflow filename** to `npm-publish.yml` (filename only, including `.yml`).
4. Save. Allow action **npm publish** if prompted.

**Workflow:** [`.github/workflows/npm-publish.yml`](.github/workflows/npm-publish.yml) requests `id-token: write` and runs `npm publish` without `NPM_TOKEN`. Releases created by `github-actions[bot]` usually do not trigger downstream workflows — use **Actions → npm publish → Run workflow** with the release tag (e.g. `v12.0.1`) after merging a Release PR.

**Manual publish** from a maintainer machine (browser/web auth or local npm login) is still supported:

```shell
git fetch origin --tags
git checkout v12.0.1   # tag from Release Please
npm ci
npm test
npm publish --access public
```

Do not create npm tokens with **bypass 2FA** for CI — npm flags that as insecure; use Trusted Publishing instead.

Automated publishing does **not** retroactively upload versions that already exist as git tags only (for example `11.5.x` never published to npm).

## Resources

- [How to Contribute to Open Source](https://opensource.guide/how-to-contribute/)
- [Using Pull Requests](https://help.github.com/articles/about-pull-requests/)
- [GitHub Help](https://docs.github.com)

Thanks for contributing to `webfont`! 👏✨
