# GitHub CLI recipes for oldest-pr-merge

## Oldest open PR

```bash
gh pr list --state open --limit 100 --json number,title,createdAt,url,headRefName,assignees,labels \
  --jq 'sort_by(.createdAt) | .[0]'
```

## Checkout and inspect

```bash
gh pr checkout <N>
gh pr view <N>
gh pr view <N> --json assignees,labels,title,url
gh pr diff <N>
gh pr checks <N>
```

## Assignees (required before merge)

Prefer `cursoragent`; fall back to `jimmyandrade` if `cursoragent` is not assignable.

```bash
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)

if gh api "repos/$REPO/assignees/cursoragent" --silent 2>/dev/null; then
  gh pr edit <N> --add-assignee cursoragent
else
  gh pr edit <N> --add-assignee jimmyandrade
fi

gh pr view <N> --json assignees --jq '[.assignees[].login]'
```

Never merge unless `cursoragent` or `jimmyandrade` is assigned.

## Labels (required before merge)

At least **one meaningful** label must exist. Use existing repo labels when possible.

```bash
gh label list --limit 100
gh pr view <N> --json labels --jq '[.labels[].name]'

# Examples:
gh pr edit <N> --add-label "dependencies"   # Renovate / lockfile bumps
gh pr edit <N> --add-label "documentation"  # docs / skills / AGENTS
gh pr edit <N> --add-label "bug"            # fixes
gh pr edit <N> --add-label "enhancement"    # features
```

Never merge a PR with zero labels.

## Already on `main` — Dependabot / Renovate rebase (do not self-close)

When the PR’s bump is already on `main` (or the merge would be empty), **never** `gh pr close`. Ask the bot to rebase and wait for it to close or refresh the PR.

```bash
# Dependabot
gh pr comment <N> --body "$(cat <<'EOF'
@dependabot rebase

This looks redundant with current `main` (dependency already present or empty merge). Please rebase so Dependabot can close or refresh the PR itself.
EOF
)"

# Renovate
gh pr comment <N> --body "$(cat <<'EOF'
@renovate rebase

This looks redundant with current `main`. Please rebase so Renovate can close or refresh the PR itself.
EOF
)"

# Then wait for bot activity + CI
gh pr view <N> --json state,statusCheckRollup
gh pr checks <N>
```

## Comments and reviews

```bash
# Issue-style PR comments
gh api repos/{owner}/{repo}/issues/<N>/comments

# Review comments (inline)
gh api repos/{owner}/{repo}/pulls/<N>/comments

# Reviews summary
gh pr view <N> --comments

# GraphQL: review threads (resolved state)
gh api graphql -f query='
query($owner:String!,$repo:String!,$number:Int!) {
  repository(owner:$owner,name:$repo) {
    pullRequest(number:$number) {
      reviewThreads(first:100) {
        nodes { id isResolved isOutdated path comments(first:20) { nodes { author { login } body url } } }
      }
    }
  }
}' -f owner=OWNER -f repo=REPO -F number=<N>
```

Resolve a thread (GraphQL `resolveReviewThread`) only after posting a reply.

Reply examples:

```bash
# PR conversation comment
gh pr comment <N> --body "Applied the suggestion: …"

# Reply to an inline review comment (use the comment id)
gh api repos/{owner}/{repo}/pulls/<N>/comments -f body="…" -F in_reply_to_id=<COMMENT_ID>
```

Filter bot/Copilot authors carefully (`copilot`, `github-actions`, etc.) but still evaluate their suggestions.

## Merge

```bash
gh pr merge <N> --squash
```

Do not use `--merge` or `--rebase` unless a maintainer explicitly asks.

## Linked issues

```bash
gh pr view <N> --json body,closingIssuesReferences
gh issue comment <ISSUE> --body "Shipped in #<N>: …"
gh issue close <ISSUE> --reason completed
```
