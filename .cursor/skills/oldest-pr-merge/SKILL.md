---
name: oldest-pr-merge
description: >-
  Process the oldest open pull request end-to-end: analyze the diff, add missing
  tests on that PR branch, resolve review comments (including Copilot) in a loop,
  fix test regressions, update TROUBLESHOOTING.md / AGENTS.md / ADRs, merge when
  CI is green, then close related issues. Use when the user asks to babysit,
  triage, review, or merge the oldest PR, clear the PR backlog, or run the
  oldest-PR merge workflow.
---

# Oldest PR merge

End-to-end workflow for the **oldest open PR**. Follow project rules in `AGENTS.md` and `CONTRIBUTING.md` (atomic Conventional Commits in English, English issue/PR comments, TROUBLESHOOTING updates).

Copy and track this checklist:

```
Oldest PR progress:
- [ ] 1. Select and analyze oldest open PR
- [ ] 1a. If already on main (Dependabot/Renovate), request bot rebase — do not close
- [ ] 1b. Ensure assignee + at least one meaningful label (hard gate)
- [ ] 2. Check test coverage for the changes
- [ ] 3. Add missing tests on the same PR branch
- [ ] 4. Resolve all review comments (incl. Copilot) in a loop
- [ ] 5. Run tests and check for regressions
- [ ] 6. Fix regressions if any
- [ ] 7. Record work in TROUBLESHOOTING.md / AGENTS.md (and ADR if needed)
- [ ] 8. Merge only when comments done, tests green, CI green, assignee + label set
- [ ] 9. Close related issue(s) with a summary comment
- [ ] 10. Final uncommitted-diff sweep and commit(s)
```

## Continuous backlog drain

When the user asks to run `oldest-pr-merge`, clear the backlog, or says to keep going to the next PR:

1. After finishing one PR (merge, or Dependabot/Renovate has closed it after rebase), **immediately** select the new oldest open PR and repeat the full checklist.
2. **Do not ask** whether to continue between PRs.
3. Stop only on the [Stop / escalate conditions](#stop--escalate-conditions), when there are no open PRs left, or when the user explicitly cancels.

## 1. Pick the oldest open PR and analyze it

```bash
gh pr list --state open --limit 100 --json number,title,createdAt,author,url,headRefName,baseRefName,labels,assignees,body \
  --jq 'sort_by(.createdAt) | .[0]'
```

Then:

```bash
gh pr view <N> --json title,body,files,commits,statusCheckRollup,reviewDecision,comments,reviews,assignees,labels
gh pr diff <N>
```

Checkout the PR branch (`gh pr checkout <N>`). Summarize intent, risk, and touched areas before editing.

If there is no open PR, stop and report that.

## 1a. Already on `main` (Dependabot / Renovate) — request rebase, never self-close

If analysis shows the PR is **redundant with `main`** (examples below), **do not** `gh pr close` or abandon the PR yourself.

Treat as already-on-main when any of these hold:

- The titled dependency version is already present on `main`’s `package.json` / lockfile
- `git diff origin/main...HEAD` (or the PR merge diff) has no remaining meaningful package change
- A squash merge would be empty / no-op relative to current `main`

### Dependabot

1. Comment on the PR **mentioning Dependabot** and requesting a rebase (English):

```bash
gh pr comment <N> --body "$(cat <<'EOF'
@dependabot rebase

This looks redundant with current `main` (dependency already present or empty merge). Please rebase so Dependabot can close or refresh the PR itself.
EOF
)"
```

2. **Wait** for Dependabot to rebase and for CI to run (`gh pr checks <N>` / `gh run watch` as needed).
3. **Let Dependabot close** the PR if the bump is obsolete after rebase. Do not close it manually.
4. If after rebase the PR still has a real bump, continue the normal merge checklist (§1b onward).

### Renovate

Same policy for Renovate-authored PRs: do **not** self-close when already on `main`. Request a rebase and wait for the bot:

```bash
gh pr comment <N> --body "$(cat <<'EOF'
@renovate rebase

This looks redundant with current `main`. Please rebase so Renovate can close or refresh the PR itself.
EOF
)"
```

See [gh-recipes.md](gh-recipes.md) for the snippet. After the bot closes (or the PR becomes mergeable again), continue the backlog drain.

## 1b. Assignees and labels (mandatory before merge)

As soon as you start processing the PR (right after checkout / analysis), **and again immediately before merge**, ensure metadata is set. **Never merge** a PR that is missing either requirement.

### Assignees

Prefer **`cursoragent`**; if that user is not assignable on the repo, fall back to **`jimmyandrade`**.

```bash
# Prefer cursoragent; fall back to jimmyandrade if not assignable
if gh api "repos/$(gh repo view --json nameWithOwner -q .nameWithOwner)/assignees/cursoragent" --silent 2>/dev/null; then
  gh pr edit <N> --add-assignee cursoragent
else
  gh pr edit <N> --add-assignee jimmyandrade
fi

# Verify at least one required assignee is present
gh pr view <N> --json assignees --jq '
  [.assignees[].login] as $a
  | if (($a | index("cursoragent")) or ($a | index("jimmyandrade"))) then "ok" else error("missing required assignee") end
'
```

If neither user can be assigned, **stop and escalate** — do not merge.

### Labels

Ensure **at least one meaningful label** from the repo’s existing labels (create a new label only when none fit and the name is clearly useful). Prefer:

| PR kind | Example labels |
| --- | --- |
| Renovate / dependency bumps | `dependencies`, `renovate` |
| Docs / skills / AGENTS | `documentation` |
| Bug fix | `bug` |
| Feature / product change | `enhancement` |
| CI / workflows | add or reuse a CI-related label if present; otherwise `dependencies` only when that fits |

```bash
gh label list --limit 100
gh pr view <N> --json labels --jq '.labels | length'
# If zero labels, add one that fits, e.g.:
gh pr edit <N> --add-label "dependencies"
```

A label is **meaningful** when it describes the PR’s nature (deps, docs, bug, enhancement, CI, etc.). Do not invent placeholder labels like `todo` unless that is the real status.

## 2. Verify tests cover the changes

From the diff, list behavior that must be tested. Search for existing unit/integration/E2E tests that exercise those paths.

Gaps count as missing coverage (new logic, changed branches, bug fixes without assertions, snapshots that only assert structure when behavior changed).

## 3. If coverage is missing, implement tests on the same PR

- Add tests on the **PR branch** (do not open a separate PR unless the user asks).
- Match existing Jest/Cypress patterns in the repo.
- Commit with atomic Conventional Commits, e.g. `test: cover parking plate validation on wizard step`.
- Push to the PR head branch.

## 4. Review comments loop (including Copilot)

Repeat until **no unresolved review threads / actionable comments remain**:

1. Load comments and threads (see [gh-recipes.md](gh-recipes.md)).
2. Include Copilot / bot review comments; treat them like human review unless clearly noise.
3. For each unresolved item:
   - **Makes sense** → apply the change on the PR branch; record reusable guidance in `AGENTS.md`; reply on the thread explaining what you did; resolve the conversation.
   - **Does not make sense** → reply explaining why (English); record the rationale in `AGENTS.md`; if it is an architectural decision, add or update an ADR under `docs/adr/` (create the folder/template if missing); resolve only after the disagreement is clearly documented on the thread.
4. Push commits, then re-fetch comments (new Copilot rounds may appear). Loop.

Never resolve a thread without a reply that states the outcome.

## 5–6. Regressions

After code/test/comment fixes:

```bash
npm test
# plus any targeted suites for touched files
```

Watch PR checks: `gh pr checks <N>`.

If regressions appear, fix them on the same branch, commit atomically, push, and re-run until local tests and required CI are green. Log novel failures in `TROUBLESHOOTING.md`.

## 7. Documentation updates

Before merge:

- **`TROUBLESHOOTING.md`**: any new install/build/test/CI failure you hit and how you fixed it (same format as existing entries).
- **`AGENTS.md`**: any adopted best practice or rejected-suggestion rationale worth remembering.
- **`docs/adr/`**: only for meaningful architecture decisions (short ADR: context, decision, consequences).

Commit docs separately when possible (`docs: …`).

## 8. Merge when ready

Merge **only if all** are true:

- All review comments answered and resolved
- No known test regressions locally
- PR CI pipeline is green (or only waived checks the user explicitly approved)
- **Assignee set**: `cursoragent` (preferred) or `jimmyandrade` (fallback) is among assignees
- **At least one meaningful label** is present

Re-check metadata right before merge (see §1b and [gh-recipes.md](gh-recipes.md)). If assignee or label is missing, set them first — **do not merge without both**.

```bash
gh pr view <N> --json assignees,labels --jq '{assignees:[.assignees[].login],labels:[.labels[].name]}'
gh pr checks <N>
gh pr merge <N> --squash
```

If merge is blocked (rules, reviews, conflict), report the blocker; do not force-merge unless the user explicitly asks. Never use `--merge` or `--rebase` unless a maintainer explicitly overrides the squash-only policy.

## 9. Related issue(s)

Detect linked issues from PR body/commits (`#123`, `Fixes #123`, closing keywords).

```bash
gh pr view <N> --json closingIssuesReferences,body
```

For each associated issue:

1. Comment in **English** with what shipped and the PR URL.
2. Update checklists (`- [x]` / remaining items) per `AGENTS.md`.
3. Close when acceptance criteria are met: `gh issue close <N> --reason completed`.

## 10. Final uncommitted-diff sweep (mandatory)

At the **end of every** `oldest-pr-merge` run (after merge/close, or after stopping early), inspect the working tree:

```bash
git status -sb
git diff
git diff --cached
```

If anything is uncommitted (modified, staged, or untracked that belongs in git):

1. Classify each change:
   - **Related to the PR just processed** (tests, fixes, docs for that PR) → commit on the PR branch **before** merge if the PR is still open; if already merged, commit on a follow-up branch/PR or on `main` only if that is the repo’s normal flow and the user expects it.
   - **Not related to the PR** (skill/rules, unrelated docs, tooling, leftover stash conflict fixes, etc.) → switch to `main` (or a dedicated branch), commit **separately** with its own atomic Conventional Commit, and push. Do **not** fold unrelated work into the PR commits.
2. Use progressive atomic commits (English, Conventional Commits).
3. Re-run `git status` until the tree is clean for intentional work (ignore local-only files that should stay untracked, e.g. `.env`).

Never leave PR-related or skill-run leftovers uncommitted without an explicit user decision to discard them.

## Stop / escalate conditions

Stop and ask the user when:

- The oldest PR is draft and not meant to merge
- Changes require product/architecture choice beyond ADRs
- CI failures need secrets/network access you do not have
- Merge requires admin bypass or force push
- Neither `cursoragent` nor `jimmyandrade` can be assigned (assignee hard gate)
- Dependabot/Renovate was asked to rebase an already-on-main PR but does not respond within a long wait and the PR stays open with no clear next step (do not self-close; escalate)

## Additional resources

- [gh-recipes.md](gh-recipes.md) — GitHub CLI snippets for PRs, comments, and threads
