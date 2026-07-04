# Maintainer guide

Workflow for maintainers, release automation, and AI agents opening pull requests in this repository.

Contributors: see [CONTRIBUTING.md](./CONTRIBUTING.md) for how to report issues, write tests, and propose changes. Agent instructions shared with GitHub Copilot live in [AGENTS.md](./AGENTS.md) (symlinked as [CLAUDE.md](./CLAUDE.md) for Claude Code).

---

## Pull requests

**Never push commits directly to `master`.** All changes — including docs, tests, and chores — go through a feature branch and a pull request. Only merge to `master` after review (or explicit maintainer approval on the PR). Do not use `git push origin master` for routine work.

When a task produces branch changes intended for review (features, fixes, CI, docs, refactors):

1. **Check whether the current branch is already merged** (see [Merged branches](#merged-branches) below). If it is, create a **new branch from `master`** — do not push follow-up commits to a merged PR branch.
2. **Create a branch** from `master` using a **lowercase** name (for example `docs/pr-workflow`, `test/xml2js-guards`, `fix/cli-formats`). The entire branch name must stay lowercase — no camelCase or uppercase segments (avoid names like `test/toTtf-unit-tests`).
3. **Read** [`.github/pull_request_template.md`](./.github/pull_request_template.md) and use it as the PR body structure (do not substitute a shorter custom format).
4. **Push** the branch to `origin` (`git push -u origin HEAD`) without asking first.
5. **Open a PR** with `gh pr create` (title + body in English, base `master`) without asking first. Pass the body via HEREDOC so headings and checklists match the template. **PR title must follow [Conventional Commits](https://www.conventionalcommits.org/)** (`type: description`, optional scope). Strip bot prefixes (`[Snyk]`, `[Dependabot]`) and rewrite to the correct type — use **`chore(deps):`** when dependencies change (or **`ci(deps):`** for GitHub Actions) (see **Dependency bumps** under [Scope, title, and description](#scope-title-and-description)).
6. **Return the PR URL** in the final response.

**Squash merge only.** Routine merges to `master` use **Squash and merge** so the PR title is the single commit on `master` (Release Please depends on this). Do not use merge commits or rebase-merge unless a maintainer explicitly requests it.

**Fix PR titles proactively.** When working on an open PR, check the title with `gh pr view --json title`. If it does not match Conventional Commits (wrong type, vendor prefix, or scope drift after new commits), run `gh pr edit --title "type(scope): description"` **without asking** — same as push. Re-read the title after every push that changes PR scope.

**Do not ask the user for permission** to push or open a PR when the task produces reviewable branch changes. Push, `gh pr create`, and returning the PR URL are part of finishing the task — not optional follow-ups to confirm.

### Pull request title and description

- **Use [Conventional Commits](https://www.conventionalcommits.org/) for the PR title** — the same format as commit messages (`feat:`, `fix:`, `chore(deps):`, `docs:`, `test:`, `ci:`, etc.). The title should describe the **overall** change in the PR, not bot prefixes like `[Snyk]` or `[Dependabot]`.
- **Dependency updates drive the PR type.** If the PR changes **`package.json` or `package-lock.json` dependencies**, use **`chore(deps):`** in the title (or **`ci(deps):`** for GitHub Actions) — not `test:` or `docs:` even when the diff is mostly new tests or migration notes. Example: `chore(deps): bump wawoff2 to 2.0.1; add ttfEncode tests`. This matches the prefixes Dependabot generates via [`.github/dependabot.yml`](./.github/dependabot.yml). Release Please reads the squash-merge title on `master`.
- **Merge pull requests with squash.** The PR title becomes the commit message on `master` (Release Please reads it). Do not merge with merge commits or rebase-merge for routine work.
- **Write pull request titles, descriptions, and review comments in English** (commits and code comments in English as well).
- **Keep the PR title and body in sync with the actual diff.** When new commits change what the PR does (extra fixes, tests, docs, refactors), update the title and description before asking for review.
- **Rename non-conforming PR titles** before review when the title uses vendor labels (`[Snyk]`, `[Dependabot]`), plain prose, the wrong type, or **`test:` / `docs:` on a dependency bump**.
- **Prefer focused PRs.** If the scope keeps growing (unrelated fixes, large test refactors, docs, and feature work in one branch), stop stacking and **split follow-up work into separate PRs** instead.

### Closing pull requests

When you close a pull request (as author or maintainer), **leave a comment explaining why** — do not close silently. Helpful reasons include: superseded by another PR (link it), obsolete after dependency or codebase changes, out of scope, duplicate, or rejected after review. Write the comment in English.

### Copilot and review comments

Before finishing work on an open PR, **check for unresolved review threads** (Copilot, humans, bots). Do not leave Copilot feedback unanswered.

| Step | Action |
|------|--------|
| **List threads** | `gh api graphql` → `pullRequest(number: N) { reviewThreads { nodes { id isResolved comments { nodes { body author { login } } } } } } }` or the PR **Files changed** tab |
| **Evaluate** | If the suggestion is valid for the **current** branch state, apply it (code, tests, or docs) in the same PR. If it is wrong or obsolete, explain why in a **reply in English** — cite code, tests, or AGENTS.md |
| **Reply** | `gh api repos/{owner}/{repo}/pulls/{number}/comments` with `in_reply_to` set to the review comment `databaseId` |
| **Resolve** | When addressed (fix merged in the branch **or** reply documents why not), resolve the thread: GraphQL `resolveReviewThread(input: { threadId: "PRRT_…" })` |

Resolve only after the thread is truly handled — not when ignoring feedback. If a follow-up commit applies Copilot’s fix, reply briefly (“Fixed in \<sha\>”) then resolve.

### Merged branches

**Before every push**, confirm the target branch is still the right vehicle for the work:

| Check | Command / action |
|-------|------------------|
| PR state | `gh pr view --head <branch> --json state,mergedAt,url` (or `gh pr list --head <branch>`) |
| Branch contained in `master` | `git fetch origin master && git log --oneline origin/master..origin/<branch>` — if empty after your last merge, or PR `state` is `MERGED`, stop using that branch |

**If the PR is merged (or the branch is obsolete):**

1. **Do not** push new commits to that branch expecting them to land via the old PR.
2. **Do** `git fetch origin master`, branch from `origin/master`, cherry-pick or re-apply only the commits not yet on `master`, then push and **`gh pr create`** a **new** PR.
3. **Prefer one focused PR per follow-up** after merge — tests, docs, and unrelated fixes on top of merged work belong on a new branch.

### Template sections (be selective)

Keep [`.github/pull_request_template.md`](./.github/pull_request_template.md) **headings and order**, but write each section critically — only include content that applies to the PR:

| Section | Guidance |
|---------|----------|
| **Proposed changes** | Bullet the real changes; remove placeholder text. |
| **Related issue** | Link the issue, or write `N/A` / `None` when there is none. |
| **Dependencies** | List adds/updates/removes, or `N/A` when `package.json` is untouched. |
| **Testing** | Mark only test types you actually ran or added. Omit sub-items that do not apply. |
| **How to test** | Steps a reviewer can follow. |
| **Test configuration** | Node/npm versions only when version-sensitive; otherwise `N/A`. |
| **Checklist** | Mark `[x]` only for items you completed. Leave maintainer-only items unchecked. |

### Scope, title, and description

- **PR title = Conventional Commits.** Squash merge puts the title on `master`; Release Please reads it.
- **Dependency bumps set the type.** `chore(deps):` or `ci(deps):` when `package.json` / lockfile dependencies change.
- **Re-read the PR title and body whenever the branch scope changes.**
- **Split when it grows too much.** Prefer separate PRs for follow-up work.
- **Explain why when closing a PR.** See [Closing pull requests](#closing-pull-requests).

---

## GitHub issues workflow

Process open issues **oldest to newest** (`gh issue list --state open`, sort by number). See [AGENTS.md](./AGENTS.md) for triage, fix PR, post-merge, and release comment expectations.

---

## Releases and publishing

See [CONTRIBUTING.md](./CONTRIBUTING.md) → **Releases**, **npm publishing**, **Vercel docs deployment**, and [ADR 0004](./docs/adr/0004-release-please-instead-of-standard-version.md).
