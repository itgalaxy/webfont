# Migration entries

One file per behavior change. **Do not append long entries to [MIGRATION.md](../../MIGRATION.md)** — add a new file here (or edit only the file for your issue).

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

## Find an entry

- GitHub: search `issue-0569` in `docs/migration/`
- Local: `ls docs/migration/issue-*.md`

Link the file from the GitHub issue and PR (**Related issue** / comments).
