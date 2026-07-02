# ADR 0010: One migration file per issue

- **Status:** Accepted
- **Date:** 2026-07-02
- **Related:** [MIGRATION.md](../../MIGRATION.md), [docs/migration/README.md](../migration/README.md)

## Context

[MIGRATION.md](../../MIGRATION.md) accumulated **all** upgrade guides in one file. Parallel PRs (e.g. #706 TTF encoding + #707 round guards) edited the same document near the top → frequent Git merge conflicts.

## Decision

- **Template** stays in `MIGRATION.md` (entry structure, links).
- **Each behavior change** gets its own file: `docs/migration/issue-NNNN-<slug>.md` (issue number zero-padded to four digits).
- PRs **add a new file**; they do not append sections to `MIGRATION.md`.
- On release, maintainers edit **only** that issue’s file (set minimum version, trim workarounds).

## Consequences

### Positive

- Parallel migration docs merge without conflicts (unique paths).
- Issues and PRs link directly to one file.

### Negative

- No single scrollable changelog-style page; use `ls docs/migration/issue-*.md` or GitHub search.
- Discoverability relies on issue links and README conventions.
