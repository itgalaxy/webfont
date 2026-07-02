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

### Document guards and error paths with explicit unit tests

When production code works around a library quirk or adds a defensive guard, add **unit tests that name the reason** — not only integration tests through the full pipeline.

| Goal | How |
|------|-----|
| Explain why a guard exists | Add a focused test (or `describe` block) that reproduces the library behavior the guard works around |
| Cover error paths | Unit-test the module that throws/rejects; do not rely on a distant integration test alone |
| Prove ordering | Assert downstream callbacks (for example `metadataProvider`) are **not** called when an earlier step fails |
| Avoid implicit coverage | If behavior matters, test it directly — happy path passing elsewhere is not enough |

Example: `glyphsData.test.ts` — `describe("svg xml validation via xml2js")` documents that `xml2js` accepts empty input without error, then unit-tests the empty-file guard and malformed-xml rejection before metadata lookup.

Example: `isSvgOutput.test.ts` — documents the `is-svg` dev-dependency contract (via `fast-xml-parser`), negative fixtures, and when `result.svg` is absent (`toBeUndefined`) vs validated (`isSvg(result.svg)`).

Example: `svg2ttfOutput.test.ts` — documents the `svg2ttf` production contract (via `@xmldom/xmldom`), invalid version options, early pipeline rejection before conversion, and when `result.ttf` is absent vs validated (`isTtf(result.ttf)`).

Prefer `await expect(fn()).rejects.toThrow(...)` for async failures. Use spies on the next pipeline step to prove early exit.

### CLI integration tests (`execCLI`)

Integration tests in `src/cli/index.test.ts` run the built CLI via `child_process.exec` and capture **stdout**, **stderr**, and the exit code.

| Stream | Contract under test |
|--------|---------------------|
| **stderr** | Must be empty on every test — success, failure, and `--verbose`. Assert `expect(output.stderr).toBe("")` so regressions from dependencies writing warnings or errors to stderr are caught. |
| **stdout** | Normal output and CLI errors. `startCli` logs error stacks with `console.log` (stdout), not `console.error` (stderr). On failure, assert the message on `output.stdout`, not `stderr`. |
| **exit code** | Assert `output.code` explicitly for success (`0`) and failure (`1`, `2`, etc.). |

When adding a new `execCLI` test, include `expect(output.stderr).toBe("")` alongside exit-code and stdout/file assertions so the suite stays consistent.

### CLI and async I/O

- **Parse CLI flags into real runtime types.** Do not cast meow string flags (for example `--formats`) directly to array types. Parse JSON arrays or comma-separated values into typed structures before passing them to `webfont` (see `parseFormatsFlag`).
- **Await filesystem writes in async CLI flows.** Use `fs.promises.writeFile` (or promisified equivalents) inside `async` functions and `await Promise.all(...)`. Do not wrap callback-based `fs.writeFile` in `Promise.all` — the callback form returns `void`, so the CLI can exit before writes finish and write errors are lost.
- **Model optional runtime hooks accurately.** If code supports an optional callback such as `metadataProvider`, type it as `metadataProvider?: MetadataProvider` — not `null` — so callers and `strictNullChecks` stay aligned.

## Documentation

When a task changes **how users interact with webfont** (CLI flags, programmatic `webfont()` options, defaults, exit behavior, or config file semantics), update user-facing docs in the same change:

1. **Check for user impact** before finishing — compare CLI help (`src/cli/meow/index.ts`), [README.md](./README.md) (Options + CLI sections), and any examples or fixtures that show usage.
2. **Update README.md** when behavior, accepted input formats, or public options change. Keep CLI flag names and short aliases aligned with `meow` (`-f` / `--formats`, `-u` / `--fontName`, etc.).
3. **Do not rely on CHANGELOG alone** for unreleased work; Release Please updates `CHANGELOG.md` at release time.

See also [CONTRIBUTING.md](./CONTRIBUTING.md) — “User-facing changes and documentation”.

## General

- Follow [CONTRIBUTING.md](./CONTRIBUTING.md) and existing ADRs under `docs/adr/`.
- Use conventional commits (`feat`, `fix`, `test`, `docs`, `chore`, `refactor`, `ci`).
- Releases are handled by Release Please on `master`; do not bump `package.json` version in feature PRs (see [ADR 0004](docs/adr/0004-release-please-instead-of-standard-version.md)).
- Keep changes focused; match surrounding code style and tooling (Biome, Jest, Lefthook).
- Do not commit unless explicitly asked.
- **Never push to `master`.** Use a branch and open a PR (see [Pull requests](#pull-requests) below).

### Lint and type hygiene

- **No `eslint-disable*` comments.** ESLint is not used; Biome is the linter ([ADR 0001](docs/adr/0001-eslint-vs-biome-linting.md)). Delete stale ESLint suppressions; use `biome-ignore` only when a rule cannot be satisfied by a small code change.
- **No `@ts-expect-error` or `@ts-ignore`.** Resolve types properly:
  - Config fixtures with extra keys: `ResultConfig & { key: Type }` + cast in tests.
  - Mocks: import the `__mocks__` module for assertions, or a small helper type when a cast is unavoidable (`as unknown as MockType`).
  - Expected rejections: `await expect(fn()).rejects.toThrow(...)` (not `try/catch` + conditional expects).
  - Unused parameters: `_name` prefix on the parameter or property.
- **No `ignoreDeprecations` in `tsconfig.json` (or any tsconfig).** On TypeScript upgrades, migrate deprecated compiler options and fix type errors instead of silencing warnings (see [CONTRIBUTING.md](./CONTRIBUTING.md)).
- After edits, run `npm test` and confirm `rg 'eslint-disable|@ts-expect-error|@ts-ignore|ignoreDeprecations'` returns no matches.

## Pull requests

**Never push commits directly to `master`.** All changes — including docs, tests, and chores — go through a feature branch and a pull request. Only merge to `master` after review (or explicit maintainer approval on the PR). Do not use `git push origin master` for routine work.

When a task produces branch changes intended for review (features, fixes, CI, docs, refactors):

1. **Create a branch** from `master` (for example `docs/pr-workflow`, `test/xml2js-guards`, `fix/cli-formats`).
2. **Read** [`.github/pull_request_template.md`](./.github/pull_request_template.md) and use it as the PR body structure (do not substitute a shorter custom format).
3. **Push** the branch to `origin` (`git push -u origin HEAD`) without asking first.
4. **Open a PR** with `gh pr create` (title + body in English, base `master`) without asking first. Pass the body via HEREDOC so headings and checklists match the template.
5. **Return the PR URL** in the final response.

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

### Scope, title, and description

- **Re-read the PR title and body whenever the branch scope changes.** After adding commits, update the title and **Proposed changes** section so reviewers see the full picture — not just the first commit message.
- **Split when it grows too much.** If a branch picks up unrelated fixes, large test extractions, or docs on top of the original goal, prefer **separate PRs** for follow-up work rather than one ever-growing branch. This PR accumulated extra scope before that rule was written; use smaller PRs from here on.
- **Explain why when closing a PR.** Leave an English comment (superseded, obsolete, duplicate, out of scope, etc.) — do not close without context. See [CONTRIBUTING.md](./CONTRIBUTING.md) (“Closing pull requests”).

Only skip push/PR when the user explicitly says to keep work local, or when the task is question-only / no code changes.
