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
- **Write pull request titles, descriptions, and review comments in English** (commits and code comments in English as well);
- Lint and test before submitting code by running `$ npm test`;
- Run `$ npm run prettify` to apply Biome formatting and safe fixes before pushing;
- Write a [convincing description](https://github.com/itgalaxy/webfont/blob/master/.github/pull_request_template.md) of why we should land your pull request: it’s your job to convince us.

### Linting and formatting

This project uses [Biome](https://biomejs.dev/) for linting and formatting (`biome.json`). Use `npm run lint` to check and `npm run prettify` to auto-fix.

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

To skip hooks for a single command: `LEFTHOOK=0 git commit` or `LEFTHOOK=0 git push`.

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

## Resources

- [How to Contribute to Open Source](https://opensource.guide/how-to-contribute/)
- [Using Pull Requests](https://help.github.com/articles/about-pull-requests/)
- [GitHub Help](https://docs.github.com)

Thanks for contributing to `webfont`! 👏✨
