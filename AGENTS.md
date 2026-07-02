# Agent guidelines

Instructions for AI agents and contributors automating work in this repository.

## Testing (Vitest)

### Do not mix sync-throwing `fs` calls inside async callbacks

In `beforeAll`, `beforeEach`, `afterAll`, `afterEach`, or any `new Promise((resolve, reject) => { ... })` callback, avoid synchronous APIs that throw (`fs.mkdirSync`, `fs.symlinkSync`, `fs.unlinkSync`, bare `throw`, etc.).

If they throw, the Promise is not rejected cleanly. Vitest may report an uncaught exception instead of a failed hook, which is harder to diagnose.

**Prefer** `async` hooks with `fs/promises`:

```ts
beforeAll(async () => {
  await fsPromise.mkdir("temp/fixture", { recursive: true });
  await fsPromise.symlink(source, link, "dir");
});
```

**If you must use a callback-style API** (for example `rimraf`), keep follow-up work outside the callback or wrap sync code in `try/catch` and call `reject(error)`.

### Sync `fs` in test bodies is fine

Calling `fs.mkdirSync` / `fs.rmSync` directly in an `async` `it(...)` block is acceptable. Vitest attributes synchronous failures to the test. Use `try/finally` for cleanup.

### Promisify callback-only helpers once

When a dependency only exposes callbacks (`rimraf`, legacy `fs.mkdir`), extract a small `promisify` helper and use it from `async` hooks instead of nesting callbacks.

### `it` descriptions must use `should` or `should not`

Every `it("...")` title in this repo must read as a behavior statement with **`should`** or **`should not`**. This keeps Vitest output scannable and consistent across unit, contract, and CLI integration tests.

```ts
// Good
it("should return default webfont options", () => { ... });
it("should not emit result.svg when only woff2 is requested", async () => { ... });
it("should document that is-svg throws TypeError for non-string input", () => { ... });

// Avoid
it("returns default webfont options", () => { ... });
it("documents that is-svg throws TypeError for non-string input", () => { ... });
it("throws when given binary font buffers", async () => { ... });
```

When adding or renaming tests, follow this rule even in contract-style `describe` blocks that document library behavior.

### Document guards and error paths with explicit unit tests

When production code works around a library quirk or adds a defensive guard, add **unit tests that name the reason** — not only integration tests through the full pipeline.

| Goal | How |
|------|-----|
| Explain why a guard exists | Add a focused test (or `describe` block) that reproduces the library behavior the guard works around |
| Cover error paths | Unit-test the module that throws/rejects; do not rely on a distant integration test alone |
| Prove ordering | Assert downstream callbacks (for example `metadataProvider`) are **not** called when an earlier step fails |
| Avoid implicit coverage | If behavior matters, test it directly — happy path passing elsewhere is not enough |

Example: `glyphsData.test.ts` — `describe("svg xml validation via xml2js")` documents that `xml2js` accepts empty input without error, then unit-tests the empty-file guard and malformed-xml rejection before metadata lookup.

Example: `isSvgOutput.test.ts` — documents the `is-svg` dev-dependency contract, negative fixtures, and when `result.svg` is absent (`toBeUndefined`) vs validated (`isSvg(result.svg)`).

Example: `svg2ttfOutput.test.ts` — documents the `svg2ttf` production contract (via `@xmldom/xmldom`), invalid version options, early pipeline rejection before conversion, and when `result.ttf` is absent vs validated (`isTtf(result.ttf)`).

Example: `toTtf.test.ts` — unit-tests the `toTtf` wrapper with a `svg2ttf` spy and asserts every `formatsOptions.ttf` field is forwarded.

Prefer `await expect(fn()).rejects.toThrow(...)` for async failures. Use spies on the next pipeline step to prove early exit.

### Mocking `fs.createReadStream` under ESM

Production code imports `createReadStream` as a **named** export from `fs` (`glyphsData.ts`). `vi.spyOn(fs, "createReadStream")` does not intercept that binding under Vitest's ESM module graph. Use `vi.hoisted` plus `vi.mock("fs", …)` that wraps `createReadStream` with `vi.fn(actual.createReadStream)` and assert via `vi.mocked(createReadStream)` — see `glyphsData.test.ts`.

### Dependency error assertions

When a test documents a **third-party library contract** (for example `is-svg`, `svg2ttf`, `xml2js`), assert the **error type** or a **loose regex** — not the dependency’s full error message string. Patch and minor releases often reword messages; the behavioral contract is usually the type or a stable fragment.

```ts
// Good — contract is "non-string input throws TypeError"
expect(() => isSvg(null as unknown as string)).toThrow(TypeError);

// Good — stable fragment from our pipeline or a documented library quirk
await expect(getGlyphsData([malformedXmlFile], options)).rejects.toThrow(/Unclosed root tag/u);

// Avoid for dependency-owned messages — brittle across releases
expect(() => isSvg(null as unknown as string)).toThrow("Expected a `string`, got `object`");
```

Exact message strings are fine for **errors thrown by this repository** when the message is part of the public CLI or API contract under test.

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

1. **Check for user impact** before finishing — compare CLI help (`src/cli/meow/cliOptions.ts`), [README.md](./README.md) (Input modes, Options, CLI), [FEATURES.md](./FEATURES.md), and any examples or fixtures that show usage.
2. **Update README.md** when behavior, accepted input formats, or public options change. Keep CLI flag names and short aliases aligned with `meow` (`-f` / `--formats`, `-u` / `--fontName`, etc.).
3. **Update [FEATURES.md](./FEATURES.md)** when capabilities, stability, properties, or test criteria change. Mark features `stable`, `in-progress`, or `planned`; tick test criteria when coverage exists.
4. **Update [NOTICE.md](./NOTICE.md)** when legal notices, font licensing guidance, attribution rules, or runtime dependency licenses change.
5. **Do not rely on CHANGELOG alone** for unreleased work; Release Please updates `CHANGELOG.md` at release time.

See also [CONTRIBUTING.md](./CONTRIBUTING.md) — “User-facing changes and documentation”.

## General

- Follow [CONTRIBUTING.md](./CONTRIBUTING.md) and existing ADRs under `docs/adr/`.
- Use conventional commits (`feat`, `fix`, `test`, `docs`, `chore`, `refactor`, `ci`).
- Releases are handled by Release Please on `master`; do not bump `package.json` version in feature PRs (see [ADR 0004](docs/adr/0004-release-please-instead-of-standard-version.md)).
- Keep changes focused; match surrounding code style and tooling (Biome, Vitest, Lefthook).
- Do not commit unless explicitly asked.
- **Never push to `master`.** Use a branch and open a PR (see [Pull requests](#pull-requests) below).
- **Push without asking.** After commits on a feature or PR branch, run `git push` as part of finishing the work. Do not end responses with “want me to push?” or similar — push, then report what was pushed and the PR URL if applicable.

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

1. **Check whether the current branch is already merged** (see [Merged branches](#merged-branches) below). If it is, create a **new branch from `master`** — do not push follow-up commits to a merged PR branch.
2. **Create a branch** from `master` using a **lowercase** name (for example `docs/pr-workflow`, `test/xml2js-guards`, `fix/cli-formats`). The entire branch name must stay lowercase — no camelCase or uppercase segments (avoid names like `test/toTtf-unit-tests`).
3. **Read** [`.github/pull_request_template.md`](./.github/pull_request_template.md) and use it as the PR body structure (do not substitute a shorter custom format).
4. **Push** the branch to `origin` (`git push -u origin HEAD`) without asking first.
5. **Open a PR** with `gh pr create` (title + body in English, base `master`) without asking first. Pass the body via HEREDOC so headings and checklists match the template. **PR title must follow [Conventional Commits](https://www.conventionalcommits.org/)** (`type: description`, optional scope — e.g. `chore(deps): bump svg2ttf to 6.1.0`). Strip bot prefixes (`[Snyk]`, `[Dependabot]`) and rewrite to the correct type.
6. **Return the PR URL** in the final response.

**Squash merge only.** Routine merges to `master` use **Squash and merge** so the PR title is the single commit on `master` (Release Please depends on this). Do not use merge commits or rebase-merge unless a maintainer explicitly requests it.

**Fix PR titles proactively.** When working on an open PR, check the title with `gh pr view --json title`. If it does not match Conventional Commits (wrong type, vendor prefix, or scope drift after new commits), run `gh pr edit --title "type(scope): description"` **without asking** — same as push. Re-read the title after every push that changes PR scope.

**Do not ask the user for permission** to push or open a PR when the task produces reviewable branch changes. Push, `gh pr create`, and returning the PR URL are part of finishing the task — not optional follow-ups to confirm. **Never** close a turn with prompts like “Quer que eu faça o push?” / “Should I push?” after committing on an open PR branch; push first, then summarize. Only skip push/PR when the user explicitly says to keep work local, or when the task is question-only with no code changes.

### Merged branches

**Before every push**, confirm the target branch is still the right vehicle for the work:

| Check | Command / action |
|-------|------------------|
| PR state | `gh pr view --head <branch> --json state,mergedAt,url` (or `gh pr list --head <branch>`) |
| Branch contained in `master` | `git fetch origin master && git log --oneline origin/master..origin/<branch>` — if empty after your last merge, or PR `state` is `MERGED`, stop using that branch |

**If the PR is merged (or the branch is obsolete):**

1. **Do not** push new commits to that branch expecting them to land via the old PR.
2. **Do** `git fetch origin master`, branch from `origin/master` (e.g. `test/font-output-contracts`), cherry-pick or re-apply only the commits not yet on `master`, then push and **`gh pr create`** a **new** PR.
3. **Prefer one focused PR per follow-up** after merge — tests, docs, and unrelated fixes on top of merged work belong on a new branch, not on `fix/...` or `feat/...` branches whose PRs are already closed.

Example mistake to avoid: pushing `test: add is-svg coverage` to `fix/cli-missing-dest` after PR #626 merged — those commits stay orphaned until opened on a fresh branch.

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

- **PR title = Conventional Commits.** Match commit style (`feat:`, `fix:`, `chore(deps):`, `docs:`, `test:`, `ci:`, …). When the PR is open and the title is wrong, fix it with `gh pr edit` before ending the task.
- **Re-read the PR title and body whenever the branch scope changes.** After adding commits, update the title and **Proposed changes** section so reviewers see the full picture — not just the first commit message.
- **Split when it grows too much.** If a branch picks up unrelated fixes, large test extractions, or docs on top of the original goal, prefer **separate PRs** for follow-up work rather than one ever-growing branch. This PR accumulated extra scope before that rule was written; use smaller PRs from here on.
- **Explain why when closing a PR.** Leave an English comment (superseded, obsolete, duplicate, out of scope, etc.) — do not close without context. See [CONTRIBUTING.md](./CONTRIBUTING.md) (“Closing pull requests”).
