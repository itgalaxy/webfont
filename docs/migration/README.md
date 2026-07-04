# Migration entries

How to **write and maintain migration docs**. One file per behavior change lives under `docs/migration/`; the reader-facing overview is [MIGRATION.md](../../MIGRATION.md). This page is the single source of truth for naming, workflow, and entry structure — **do not append long entries to `MIGRATION.md`**.

## Naming

```
docs/migration/issue-<issue-number-zero-padded>-<short-slug>.md
```

Examples: `issue-0002-config-files.md`, `issue-0569-cli-round.md`.

Zero-pad the issue number to **four digits** so filenames sort in issue order.

## PR workflow (merge-conflict safe)

| Do | Don't |
|----|--------|
| Add **one new** `issue-NNNN-*.md` per PR | Append sections to `MIGRATION.md` |
| Edit **only** your issue’s file when updating wording | Edit another issue’s migration file |
| On release, set **Minimum version** in that file | Rename files unless the issue number was wrong |

Parallel PRs touch **different paths** → Git merges cleanly.

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

## Find an entry

- GitHub: search `issue-0569` in `docs/migration/`
- Local: `ls docs/migration/issue-*.md`

Link the file from the GitHub issue and PR (**Related issue** / comments).
