# Agent guidelines

Instructions for AI agents and contributors automating work in this repository.

## Testing (Jest)

### Do not mix sync-throwing `fs` calls inside async callbacks

In `beforeAll`, `beforeEach`, `afterAll`, `afterEach`, or any `new Promise((resolve, reject) => { ... })` callback, avoid synchronous APIs that throw (`fs.mkdirSync`, `fs.symlinkSync`, `fs.unlinkSync`, bare `throw`, etc.).

If they throw, the Promise is not rejected cleanly. Jest may report an uncaught exception instead of a failed hook, which is harder to diagnose.

**Prefer** `async` hooks with `fs/promises`:

```ts
beforeAll(async () => {
  await fsPromise.mkdir("temp/fixture", { recursive: true });
  await fsPromise.symlink(source, link, "dir");
});
```

**If you must use a callback-style API** (for example `rimraf`), keep follow-up work outside the callback or wrap sync code in `try/catch` and call `reject(error)`.

### Sync `fs` in test bodies is fine

Calling `fs.mkdirSync` / `fs.rmSync` directly in an `async` `it(...)` block is acceptable. Jest attributes synchronous failures to the test. Use `try/finally` for cleanup.

### Promisify callback-only helpers once

When a dependency only exposes callbacks (`rimraf`, legacy `fs.mkdir`), extract a small `promisify` helper and use it from `async` hooks instead of nesting callbacks.

## General

- Follow [CONTRIBUTING.md](./CONTRIBUTING.md) and existing ADRs under `docs/adr/`.
- Use conventional commits (`feat`, `fix`, `test`, `docs`, `chore`, `refactor`, `ci`).
- Releases are handled by Release Please on `master`; do not bump `package.json` version in feature PRs (see [ADR 0004](docs/adr/0004-release-please-instead-of-standard-version.md)).
- Keep changes focused; match surrounding code style and tooling (Biome, Jest, Lefthook).
- Do not commit unless explicitly asked.

## Pull requests

When a task produces branch changes intended for review (features, fixes, CI, docs, refactors):

1. **Read** [`.github/pull_request_template.md`](./.github/pull_request_template.md) and **fill every section** of the template (do not substitute a shorter custom format).
2. **Push** the branch to `origin` (`git push -u origin HEAD`) without asking first.
3. **Open a PR** with `gh pr create` (title + body in English, base `master`) without asking first. Pass the body via HEREDOC so checklists and headings match the template exactly.
4. **Return the PR URL** in the final response.

Required sections from the template: **Proposed changes**, **Related issue**, **Dependencies added/removed** (or “None”), **Testing** checklists, **How to test**, **Test configuration**, and the **Checklist** at the bottom. Mark completed items with `[x]`.

Only skip push/PR when the user explicitly says to keep work local, or when the task is question-only / no code changes.
