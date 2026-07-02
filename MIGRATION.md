# Migration guide

What changed between webfont releases and how to update your setup.

See also [CHANGELOG.md](./CHANGELOG.md) for the full release history.

## Where entries live

**Each change has its own file** under [`docs/migration/`](./docs/migration/) — not a growing section in this document. That keeps parallel PRs from conflicting on the same markdown file.

Read [docs/migration/README.md](./docs/migration/README.md) for naming (`issue-0569-cli-round.md`) and PR workflow.

## Entry structure

Every file in `docs/migration/` **must** use these headings in order (omit only when a section truly does not apply):

| Section | Required? | Content |
|---------|-----------|---------|
| **Minimum version** | Yes | Semver when shipped; *pending* before release |
| **What changed** | Yes | One short summary |
| **Before** | Yes | Behavior on older releases |
| **After** | Yes | Behavior on the fixed release |
| **Workaround on older versions** | **Yes when applicable** | Concrete steps users on an older npm version can take **without upgrading** (config shape, CLI flags, external tools, pinned version). **Do not skip** for bug fixes — if the bug is CLI-only, document a config/API path that still works. |
| **After upgrading** | Yes | `npm install webfont@…` and the new recommended command or config |

When no practical workaround exists (rare), keep the heading and write **None** with one sentence explaining why (for example the old release cannot perform the operation at all).

**Example workaround patterns**

- Bug on CLI flag → use cosmiconfig with a **typed** value (number in JSON/JS config instead of a string from argv).
- Missing feature → external tool or script until upgrade.
- Config vs CLI conflict → pass input only on the command line on older releases.

**On release:** edit only that issue’s file — set **Minimum version** and trim workarounds that only applied to pre-release builds.
