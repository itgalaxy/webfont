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

### Lint and type hygiene

- **No `eslint-disable*` comments.** ESLint is not used; Biome is the linter ([ADR 0001](docs/adr/0001-eslint-vs-biome-linting.md)). Delete stale ESLint suppressions; use `biome-ignore` only when a rule cannot be satisfied by a small code change.
- **No `@ts-expect-error` or `@ts-ignore`.** Resolve types properly:
  - Config fixtures with extra keys: `ResultConfig & { key: Type }` + cast in tests.
  - Mocks: import the `__mocks__` module for assertions, or a small helper type when a cast is unavoidable (`as unknown as MockType`).
  - Expected rejections: `await expect(fn()).rejects.toThrow(...)` (not `try/catch` + conditional expects).
  - Unused parameters: `_name` prefix on the parameter or property.
- After edits, run `npm test` and confirm `rg 'eslint-disable|@ts-expect-error|@ts-ignore'` returns no matches.

## Pull requests

When a task produces branch changes intended for review (features, fixes, CI, docs, refactors):

1. **Read** [`.github/pull_request_template.md`](./.github/pull_request_template.md) and use it as the PR body structure (do not substitute a shorter custom format).
2. **Push** the branch to `origin` (`git push -u origin HEAD`) without asking first.
3. **Open a PR** with `gh pr create` (title + body in English, base `master`) without asking first. Pass the body via HEREDOC so headings and checklists match the template.
4. **Return the PR URL** in the final response.

### Template sections (be selective)

Keep the template **headings and order**, but write each section critically — only include content that applies to the PR:

| Section | Guidance |
|---------|----------|
| **Proposed changes** | Bullet the real changes; remove placeholder text. |
| **Related issue** | Link the issue, or write `N/A` / `None` when there is none. |
| **Dependencies** | List adds/updates/removes, or `N/A` when `package.json` is untouched. |
| **Testing** | Do **not** copy every sub-checkbox from the template. Mark only test types you actually ran or added (e.g. unit test for code changes). Omit sub-items that do not apply instead of leaving them unchecked. For docs-only or config-only PRs, say so explicitly (e.g. “No runtime tests; verified by review / `npm test` still passes”). |
| **How to test** | Steps a reviewer can follow. For non-user-facing changes, describe what you ran (`npm test`, `npm run lint`, file review). |
| **Test configuration** | Include Node/npm versions only when the change is version-sensitive or CI-related; otherwise `N/A` or omit the bullet values. |
| **Checklist** | Mark `[x]` only for items you completed. Leave maintainer-only items (labels) unchecked. |

Only skip push/PR when the user explicitly says to keep work local, or when the task is question-only / no code changes.
