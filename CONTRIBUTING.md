# Contributing

This project has a [code of conduct](https://github.com/itgalaxy/webfont/blob/master/CODE_OF_CONDUCT.md). By interacting with this repository, organization, or community you agree to abide by its terms.

---

We’re excited that you’re interested in contributing! Take a moment to read the following guidelines.

There are several ways to contribute, not just by writing code:

## Improving documentation

As a user of this project you’re perfect for helping us improve our docs: typo corrections, error fixes, better explanations, and new examples.

## Improving issues

Some [issues lack information](https://github.com/itgalaxy/webfont/issues?q=is%3Aopen+is%3Aissue+label%3A%22need+more+info%22), aren’t reproducible, or are just [invalid](https://github.com/itgalaxy/webfont/issues?q=is%3Aopen+is%3Aissue+label%3Ainvalid). Help make them easier to resolve.

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

- Non-trivial changes are often best discussed in an issue first, to prevent you from doing unnecessary work;
- For ambitious tasks, you should try to get your work in front of the community for feedback as soon as possible;
- New features should be accompanied with tests and documentation;
- Please, don’t include unrelated changes;

### User-facing changes and documentation

Before opening or updating a pull request, check whether your change affects **how people use webfont** — via the CLI (`webfont` / `dist/cli.js`), the programmatic API (`webfont({ ... })`), or config files (`.webfontrc`, `package.json` `webfont` key, etc.).

When it does, update documentation in the same PR:

| What changed | Update |
|--------------|--------|
| CLI flags, aliases, or accepted flag values | [README.md](./README.md) CLI section and `src/cli/meow/index.ts` help text |
| `webfont()` options, defaults, or return shape | [README.md](./README.md) Options / Result sections |
| New or removed public options | README + TypeScript types under `src/types/` |
| Internal-only refactors with no usage change | No README change; say so in the PR **Testing** section |

Agents and automation should follow the same rule — see [AGENTS.md](./AGENTS.md) (“Documentation”).

### Pull request title and description

- **Write pull request titles, descriptions, and review comments in English** (commits and code comments in English as well).
- **Keep the PR title and body in sync with the actual diff.** When new commits change what the PR does (extra fixes, tests, docs, refactors), update the title and description before asking for review — do not leave a narrow title like “enable strictNullChecks” on a PR that also ships CLI bug fixes and README changes.
- **Prefer focused PRs.** If the scope keeps growing (unrelated fixes, large test refactors, docs, and feature work in one branch), stop stacking and **split follow-up work into separate PRs** instead. Land the original change first, then open new branches for the rest.

See [AGENTS.md](./AGENTS.md) (“Pull requests”) for agents and automation.

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
| `pre-push` | `npm test` (full build + lint + Jest) |

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

### CI changes

Pull requests that change CI configuration (for example, GitHub Actions workflows) must follow these conventions:

- **Branch name:** use the `ci/` prefix (e.g. `ci/update-node-version`).
- **Commit message:** use the `ci:` type in [Conventional Commits](https://www.conventionalcommits.org/) format (e.g. `ci: upgrade GitHub Actions to Node 22/24`).

Do not use `chore:` or `chore(ci):` for CI-only changes.

### Releases

Versioning is automated with [Release Please](https://github.com/googleapis/release-please) (see [ADR 0004](docs/adr/0004-release-please-instead-of-standard-version.md)).

1. Merge changes to `master` using [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `ci:`, etc.).
2. Release Please opens or updates a **Release PR** with the next version, `CHANGELOG.md`, and `package.json` updates.
3. Review and merge the Release PR to create the git tag and GitHub Release.
4. The `npm-publish` workflow runs when a GitHub Release is created.

Do not run local `npm version` or push version tags manually unless coordinating an emergency release with maintainers.

## Resources

- [How to Contribute to Open Source](https://opensource.guide/how-to-contribute/)
- [Using Pull Requests](https://help.github.com/articles/about-pull-requests/)
- [GitHub Help](https://docs.github.com)

Thanks for contributing to `webfont`! 👏✨
