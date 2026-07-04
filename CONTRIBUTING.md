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
2. Fix PR: tests where needed, code change, and for **issue fixes that change behavior across releases** a new file `docs/migration/issue-NNNN-<slug>.md` ([workflow and entry structure](./docs/migration/README.md#entry-structure)).
3. **Keep reporters informed on the issue thread (English):**
   - When investigation starts: what you are checking; link the PR when it exists.
   - **Explain what was discovered** (root cause, not only “we’ll fix it”).
   - **Explain how it will be resolved** (PR link, expected behavior after merge).
   - **State release status** clearly: fix on `master` / in review / **planned for the next npm release** — not on npm until published.
   - Include a **workaround** on the current npm version when one exists.
4. After merge: comment that the fix is on `master` and planned for the next release; **leave the issue open** until npm publish.
5. On release: comment with the **version number** and the exact steps from MIGRATION.md, then **close** the issue.

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
- Bug fixes should include a regression test that fails without the fix;
- Please, don’t include unrelated changes;

### User-facing changes and documentation

Before opening or updating a pull request, check whether your change affects **how people use webfont** — via the CLI (`webfont` / `dist/cli.mjs`), the programmatic API (`webfont({ ... })`), or config files (`.webfontrc`, `package.json` `webfont` key, etc.).

When it does, update documentation in the same PR:

| What changed | Update |
|--------------|--------|
| CLI flags, aliases, or accepted flag values | [README.md](./README.md) CLI section, `src/cli/meow/cliOptions.ts` help text, and [FEATURES.md](./FEATURES.md) when capability changes |
| `webfont()` options, defaults, return shape, or supported inputs/outputs | [README.md](./README.md) Options / Result / Input modes, [FEATURES.md](./FEATURES.md) |
| New or removed public options or pipelines | README + [FEATURES.md](./FEATURES.md) + TypeScript types under `src/types/` |
| Bug fixes or recurring user-facing errors (especially from issues) | New `docs/migration/issue-NNNN-<slug>.md` ([workflow](./docs/migration/README.md)); [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) when the fix applies the same on all releases |
| Legal notices, font licensing copy, attribution, or dependency license table | [NOTICE.md](./NOTICE.md); link from README as needed |
| Internal-only refactors with no usage change | No README or FEATURES change; say so in the PR **Testing** section |

Agents and automation should follow the same rule — see [AGENTS.md](./AGENTS.md) (“Documentation”).

### Pull request title and description

- **Use [Conventional Commits](https://www.conventionalcommits.org/) for the PR title** — the same format as commit messages (`feat:`, `fix:`, `chore(deps):`, `docs:`, `test:`, `ci:`, etc.). The title should describe the **overall** change in the PR, not bot prefixes like `[Snyk]` or `[Dependabot]`.
- **Dependency updates drive the PR type.** If the PR changes **`package.json` or `package-lock.json` dependencies**, use **`chore(deps):`** in the title (or **`ci(deps):`** for GitHub Actions) — not `test:` or `docs:` even when the diff is mostly new tests or migration notes. Example: `chore(deps): bump wawoff2 to 2.0.1; add ttfEncode tests`. This matches the prefixes Dependabot generates via [`.github/dependabot.yml`](./.github/dependabot.yml). Release Please reads the squash-merge title on `master`.
- **Merge pull requests with squash.** The PR title becomes the commit message on `master` (Release Please reads it). Do not merge with merge commits or rebase-merge for routine work.
- **Write pull request titles, descriptions, and review comments in English** (commits and code comments in English as well).
- **Keep the PR title and body in sync with the actual diff.** When new commits change what the PR does (extra fixes, tests, docs, refactors), update the title and description before asking for review — do not leave a narrow title like “enable strictNullChecks” on a PR that also ships CLI bug fixes and README changes.
- **Rename non-conforming PR titles** before review when the title uses vendor labels (`[Snyk]`, `[Dependabot]`), plain prose, the wrong type, or **`test:` / `docs:` on a dependency bump**. Example: `chore(deps): bump svg2ttf from 6.0.3 to 6.1.0` instead of `[Snyk] Security upgrade svg2ttf from 6.0.3 to 6.1.0` or `test: add coverage after svg2ttf bump`.
- **Prefer focused PRs.** If the scope keeps growing (unrelated fixes, large test refactors, docs, and feature work in one branch), stop stacking and **split follow-up work into separate PRs** instead. Land the original change first, then open new branches for the rest.

See [AGENTS.md](./AGENTS.md) (“Pull requests”) for agents and automation.

### Closing pull requests

When you close a pull request (as author or maintainer), **leave a comment explaining why** — do not close silently. Helpful reasons include: superseded by another PR (link it), obsolete after dependency or codebase changes, out of scope, duplicate, or rejected after review.

Write the comment in English so future contributors and bots (for example Dependabot) understand what happened.

### Testing and coverage

**Tests are required.** Every pull request that changes runtime behavior must add or update automated tests in the **same PR** — not in a follow-up. Docs-only changes are the exception; say so explicitly in the PR **Testing** section.

New behavior and bug fixes should include tests. Follow [AGENTS.md](./AGENTS.md) (“Testing”) for Vitest patterns in this repo.

| Expectation | Guidance |
|-------------|----------|
| **Same PR** | Land tests with the code they protect. Reviewers should block merges that add features or fixes without coverage. |
| **Unit + integration** | Error paths and guards should have **unit tests** in the module under test. Add integration tests when the full pipeline matters, but do not use them as the only coverage for a guard. |
| **Explicit, not implicit** | Name tests after the invariant they protect (for example, why a guard exists). If a dependency quirk motivated the code, add a small test that documents the quirk. |
| **Pipeline ordering** | When step B must not run if step A fails, assert B was not called (spy/mock), not only that the final promise rejected. |
| **Fixtures** | Reuse fixtures under `src/fixtures/` for file-based cases; add a fixture when the scenario is stable and reusable. |
| **Test titles** | Every `it(...)` description must include **`should`** or **`should not`** (for example, `should return default options`, `should not call metadataProvider when parse fails`). Avoid bare verbs (`returns`, `throws`, `accepts`) or prefixes like `documents that` without `should`. |

Run `npm test` before pushing. Integration-only coverage for a localized guard is incomplete.

#### Published package validation (`npm run test:package`)

`npm run test:package` runs three orthogonal layers of validation against the packed tarball (see [ADR 0012](docs/adr/0012-published-package-validation.md)):

1. **`npm run test:publint`** — [publint](https://publint.dev/) lints `package.json` for publish-surface issues (`exports`, `files`, `main`, `module`, `types`, condition ordering). Prints warnings and suggestions in every CI log; fails only on errors.
2. **`npm run test:attw`** — [`@arethetypeswrong/cli`](https://arethetypeswrong.github.io/) probes types resolution across **node10**, **node16 (from CJS)**, **node16 (from ESM)**, and **bundler** to catch types that would fail to resolve for TypeScript consumers under any module system.
3. **`npm run test:pack`** — `scripts/pack-smoke-test.mjs` packs with `npm pack`, installs the tarball into throwaway ESM and CJS consumer projects, and asserts each import shape works end-to-end:
   - `import webfont from "webfont"` (ESM default) → `typeof === "function"` and generates a real `woff2` from fixtures.
   - `import { webfont } from "webfont"` (ESM named) → same.
   - `const { webfont } = require("webfont")` (CJS named) and `require("webfont").default` (CJS default) → same.
   - Also asserts the tarball ships `dist/index.js`, `dist/index.mjs`, `dist/browser.js`, and `dist/cli.mjs`.

Together these guard `package.json#exports`, `#files`, `#types`, and the built `dist/*.mjs` / `dist/*.js` / `dist/**/*.d.{ts,mts}` against regressions the in-source Vitest suite cannot see (for example [#618](https://github.com/itgalaxy/webfont/issues/618), where the ESM default import returned the module namespace object and threw `TypeError: webfont is not a function`).

The meta script runs on every pull request in [`.github/workflows/pr.yml`](.github/workflows/pr.yml), gates the publish job in [`.github/workflows/npm-publish.yml`](.github/workflows/npm-publish.yml), and is wired into `prepublishOnly` so `npm publish` fails locally if the tarball would ship a broken import shape.

When adding or removing files from `dist/`, updating `package.json#exports` / `#files` / `#types`, or touching the Vite build modes, run `npm run test:package` locally before pushing.

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
- **Commit message:** use the `ci:` type in [Conventional Commits](https://www.conventionalcommits.org/) format (e.g. `ci: upgrade GitHub Actions to Node 26`).

Do not use `chore:` or `chore(ci):` for CI-only changes.

- **Pin tool versions.** Do not install CLIs with `@latest` (or other floating tags) on deploy or release paths — pin a semver in the workflow and optionally allow override via a repository **variable** with a safe default (for example `VERCEL_CLI_VERSION` defaulting to `54.20.1` in [`.github/workflows/vercel-deploy.yml`](.github/workflows/vercel-deploy.yml)). Bump pins in focused `ci(deps):` pull requests.
- **Bind secrets once.** Map repository secrets to `env` at the job or step level and let the tool read them from the environment. Do not repeat GitHub Actions `secrets.*` expressions inline across multiple `run` commands — it is error-prone and harder to audit. See [`npm-publish.yml`](.github/workflows/npm-publish.yml) (`NODE_AUTH_TOKEN`) and [`vercel-deploy.yml`](.github/workflows/vercel-deploy.yml) (`VERCEL_TOKEN`) for the pattern.
- **Validate the docs site.** Changes that touch markdown published by VitePress (see `.vitepress/config.mts` rewrites) must pass `npm run docs:site`. Pre-push and [`.github/workflows/pr.yml`](.github/workflows/pr.yml) run it after `npm test`; Vercel production deploy runs the full `npm run docs:build`.
- **VitePress markdown.** VitePress compiles published pages as Vue templates. Do not put mustache-style double braces (Vue interpolation syntax) in those markdown files outside fenced code blocks — `vitepress build` fails when Vue tries to parse them. Rephrase (for example “Nunjucks `fontName` placeholder”) or wrap literals in a `{% raw %}...{% endraw %}` block.

**AppVeyor:** a legacy project may still receive GitHub webhooks. Root `appveyor.yml` disables builds via a non-matching branch filter (`appveyor-disabled`) because maintainers may lack AppVeyor dashboard access. Do not delete it until the AppVeyor project is removed upstream.

### Releases

Versioning is automated with [Release Please](https://github.com/googleapis/release-please) (see [ADR 0004](docs/adr/0004-release-please-instead-of-standard-version.md)).

1. Merge changes to `master` using [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `ci:`, etc.).
2. Release Please opens or updates a **Release PR** with the next version, `CHANGELOG.md`, and `package.json` updates.
3. Review and merge the Release PR to create the git tag and GitHub Release on GitHub.
4. Merging the Release PR is enough to publish (see **npm publishing** below): the [Release Please](.github/workflows/release-please.yml) workflow cuts the GitHub Release and then **dispatches** [`npm-publish`](.github/workflows/npm-publish.yml) for the new tag. A `release: published` event created with the default `GITHUB_TOKEN` does not start downstream workflows, so the publish is triggered explicitly via `workflow_dispatch` (the documented exception to that rule).

**Git tags** created by Release Please follow **`v{semver}`** (for example `v12.0.0`). The config sets `include-component-in-tag: false` so tags are not prefixed with the package name (`webfont-v12.0.0`). See [ADR 0004](docs/adr/0004-release-please-instead-of-standard-version.md).

Do not run local `npm version` or push version tags manually unless coordinating an emergency release with maintainers.

#### npm publishing

Publishing from GitHub Actions deploys the same validated build to **two environments** — `npm` (public registry, `webfont`) and `github-packages` (GitHub Packages, `@itgalaxy/webfont`). CI is **non-interactive** — there is no `npm login`. Each deploy job writes `~/.npmrc` with `//<registry>/:_authToken=${NODE_AUTH_TOKEN}` and sets `NODE_AUTH_TOKEN` from a secret at the `npm publish` step, so npm expands the token at runtime and it never lands on disk or in the logs:

- **`npm`** → `NODE_AUTH_TOKEN` = **`NODE_AUTH_TOKEN`** repository secret (an npm access token from npmjs.com; a GitHub PAT does **not** authenticate to npmjs.org).
- **`github-packages`** → `NODE_AUTH_TOKEN` = built-in **`GITHUB_TOKEN`** (`packages: write`); no extra secret. Swap for a PAT secret with `write:packages` if you prefer a personal token.

> `actions/setup-node` has **no** `node-auth-token` input — `registry-url` only wires auth to read from `env.NODE_AUTH_TOKEN`. Passing a token to a non-existent input silently publishes unauthenticated (the `E404` in [#742](https://github.com/itgalaxy/webfont/issues/742)); writing `~/.npmrc` + setting `NODE_AUTH_TOKEN` is the fix.

**One-time setup** (package maintainer):

1. Create an npm **Automation** or **Granular** access token for the `webfont` package (npmjs.com → **Access Tokens**) with publish permission (OTP/2FA-for-writes disabled for automation, or use a token type that bypasses it).
2. Add it as a GitHub repository secret named **`NODE_AUTH_TOKEN`** ([Settings → Secrets and variables → Actions](https://github.com/itgalaxy/webfont/settings/secrets/actions)). GitHub Packages needs no secret — it uses `GITHUB_TOKEN`.

**After merging a Release PR:** the [Release Please](.github/workflows/release-please.yml) workflow cuts the GitHub Release and then dispatches [`npm-publish`](.github/workflows/npm-publish.yml) with the new tag automatically. (A `release: published` event from the default `GITHUB_TOKEN` does not start downstream workflows, so the dispatch is done explicitly — `workflow_dispatch` and `repository_dispatch` are the exceptions to that rule.) If publish does not start, run it manually: **Actions → npm publish → Run workflow** with the release tag (e.g. `v12.1.0`).

**Future:** [npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers) (OIDC) can replace the `NODE_AUTH_TOKEN` secret when a maintainer configures it on npmjs.com for workflow `npm-publish.yml`.

##### Deployment environments and GitHub Packages

The workflow runs two deploy jobs after `build`, each mapped to a GitHub **Environment** so every release appears under the repo's **Deployments** with a link to the published package:

| Environment | Registry | Package | Auth | Deploy URL |
|-------------|----------|---------|------|------------|
| `npm` | `registry.npmjs.org` | `webfont` | `NODE_AUTH_TOKEN` secret | `npmjs.com/package/webfont/v/<version>` |
| `github-packages` | `npm.pkg.github.com` | `@itgalaxy/webfont` | `GITHUB_TOKEN` (`packages: write`) | repo **Packages** page |

GitHub Packages requires a scope matching the repo owner, so the `publish-github-packages` job renames the package to `@itgalaxy/webfont` in the checkout only (via `npm pkg set name=…`, never committed) — the unscoped `webfont` on npmjs.org is unaffected.

Add protection rules (required reviewers, wait timers) per environment in **Settings → Environments** if you want manual approval to gate a deploy.

**Install from GitHub Packages** (needs a GitHub token with `read:packages`):

```shell
echo "@itgalaxy:registry=https://npm.pkg.github.com" >> .npmrc
echo "//npm.pkg.github.com/:_authToken=\${GITHUB_TOKEN}" >> .npmrc
npm install @itgalaxy/webfont
```

##### Release assets

The `release-assets` job attaches two archives to each GitHub Release: the npm tarball **`webfont-<version>.tgz`** (the exact published package) and **`webfont-dist-<version>.zip`** (the built `dist/` only). It needs `contents: write` and uploads with `gh release upload "$RELEASE_TAG" --clobber`.

**Manual publish** from a maintainer machine (browser/web auth or local npm login) is still supported:

```shell
git fetch origin --tags
git checkout v12.0.1   # tag from Release Please
npm ci
npm login              # or ensure a valid token
npm publish --access public
```

`prepublishOnly` starts with `npm whoami`, so a local `npm publish` fails fast if you are not logged in — before the build and package validation run, instead of failing on authentication at the very end. In CI the workflow builds and validates `dist/` **once** in the `build` job, uploads it as an artifact, and the `publish-npm` job runs `npm publish --ignore-scripts` against that artifact — so `prepublishOnly` (and its `whoami`) does not run on the publish runner and the build is not repeated (see [#742](https://github.com/itgalaxy/webfont/issues/742)). The `publish-npm` job depends on `build`, so `test:package` still gates every publish.

Automated publishing does **not** retroactively upload versions that already exist as git tags only (for example `11.5.x` never published to npm).

## Resources

- [How to Contribute to Open Source](https://opensource.guide/how-to-contribute/)
- [Using Pull Requests](https://help.github.com/articles/about-pull-requests/)
- [GitHub Help](https://docs.github.com)

Thanks for contributing to `webfont`! 👏✨
