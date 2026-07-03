# Agent guidelines

Instructions for AI agents and contributors automating work in this repository.

**GitHub Copilot:** repository custom instructions live at [`.github/instructions/webfont.instructions.md`](./.github/instructions/webfont.instructions.md) (symlink to this file). Edit **AGENTS.md** only — not the symlink target path in `.github/instructions/`.

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

### Tests are required for code changes

Every PR that changes **runtime behavior** (features, fixes, refactors with observable effects, CLI/API/demo wiring) must include **automated tests in the same change**. Do not land production code and defer tests to a follow-up.

| Change type | Minimum expectation |
|-------------|---------------------|
| New option, flag, or pipeline step | Unit test(s) for the module + integration test when the public entry (CLI, `webfont()`, worker) is affected |
| Bug fix | A test that **fails without the fix** and names the regression |
| Guard or workaround | Focused unit test documenting **why** the guard exists (see table below) |
| Packaging / build (`vite.config.ts`, `package.json#exports`, `files`, `main`, `module`, `browser`, `bin`, `types`, or `dist/` layout) | Run `npm run test:package` locally (publint + attw + pack-smoke) and rely on the CI step; extend `scripts/pack-smoke-test.mjs` when a new consumer entry point ships. See [ADR 0012](docs/adr/0012-published-package-validation.md). |
| Docs-only | No new tests; say so in the PR **Testing** section |

Run `npm test` before pushing. For packaging or build changes, also run **`npm run test:package`** — a meta script that runs `publint` (package.json lint), `@arethetypeswrong/cli` (types resolution across node10 / node16 CJS / node16 ESM / bundler), and `scripts/pack-smoke-test.mjs` (pack + install + ESM & CJS consumer smoke tests that generate a real woff2). This is the layered guardrail that catches regressions of `package.json#exports` / `files` / `types` / `dist/*.{js,mjs,d.ts,d.mts}` that Vitest-in-source cannot see (for example [#618](https://github.com/itgalaxy/webfont/issues/618)). See [ADR 0012](docs/adr/0012-published-package-validation.md).

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

### CLI unit tests (`createCli` vs `createMeowCli`)

`program.test.ts` uses **`createCli`** to stub `CliLike` without running meow. **`program.meow.integration.test.ts`** uses **`createMeowCli`** with real argv parsing.

| Rule | Detail |
|------|--------|
| **Match `CliLike` in stubs** | Every `createCli({ flags: { … } })` value must satisfy `CliLike["flags"]`. If production types a flag as `string`, the fixture uses a **string** (not a number) — even when the runtime option later accepts `string \| number`. |
| **Assert what the layer under test returns** | `buildOptionsBase` forwards meow string flags unchanged (e.g. `round: "1"` → `options.round === "1"`). Coercion for downstream libraries belongs in later pipeline steps — do not “fix” tests by expecting a number unless `buildOptionsBase` actually converts it. |
| **Prefer meow integration for argv** | When verifying how `--round 4` is parsed, extend `program.meow.integration.test.ts` (or `execCLI`), not `createCli` with numeric literals that `CliLike` does not allow. |
| **Change types and fixtures together** | If `CliLike` or `cliOptions.ts` changes a flag type, update **both** production types and all `createCli` / meow tests in the same PR. |

Example (`round`, [#569](https://github.com/itgalaxy/webfont/issues/569)): `CliLike.flags.round` is `string`; meow `type: "string"`; `OptionsBase.round` is `string \| number`; `normalizeRoundOption` coerces at the SVG font stream boundary. Tests for `buildOptionsBase` keep `round: "1"` and `expect(options.round).toBe("1")`.

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
5. **Update [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** for operational errors (symptoms and fixes on the **current** release, not version-to-version deltas).
6. **Update migration docs** when a fix or change alters behavior across releases: add **`docs/migration/issue-NNNN-<slug>.md`** (one new file per issue — do **not** append to `MIGRATION.md`; see [entry structure](./MIGRATION.md#entry-structure) and [docs/migration/README.md](./docs/migration/README.md)). Include *What changed* → *Before* → *After* → **Workaround on older versions** (when users on older npm releases have a practical alternative) → *After upgrading*. Link the GitHub issue; set **minimum fixed version** in that file when the release ships.
7. **Do not rely on CHANGELOG alone** for unreleased work; Release Please updates `CHANGELOG.md` at release time.

See also [CONTRIBUTING.md](./CONTRIBUTING.md) — “User-facing changes and documentation”.

## General

- Follow [CONTRIBUTING.md](./CONTRIBUTING.md) and existing ADRs under `docs/adr/`.
- Run `npm run depcheck` (Knip) when changing imports or `package.json` dependencies; see [ADR 0008](docs/adr/0008-knip-instead-of-depcheck.md). The **pre-push** Lefthook runs `depcheck` before `npm test`.
- Use conventional commits (`feat`, `fix`, `test`, `docs`, `chore`, `refactor`, `ci`, `build`). Prefer **`build(deps):`** or **`chore(deps):`** when the PR changes `package.json` / lockfile dependencies — even if the diff is mostly tests or docs (see [Pull requests](#pull-requests)).
- Releases are handled by Release Please on `master`; do not bump `package.json` version in feature PRs (see [ADR 0004](docs/adr/0004-release-please-instead-of-standard-version.md)). Release git tags use **`v{semver}`** (`v12.0.0`); `release-please-config.json` sets `include-component-in-tag: false` — do not use `webfont-v*` tags.
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

## GitHub issues workflow

Process open issues **oldest to newest** (`gh issue list --state open`, sort by number). For each issue:

### Triage (every issue)

1. Read the report and comments.
2. Assign **`jimmyandrade`** (`gh issue edit <n> --add-assignee jimmyandrade`).
3. Set milestone **`next`** (`--milestone next`).
4. Add one type label: `bug`, `enhancement`, `security`, `ci`, or `question` (match the report; do not duplicate `enhancement` + `bug`).

### Fix PR (when a code or docs change is needed)

1. Comment on the issue **in English** as soon as you understand the report:
   - What you are investigating.
   - **What was discovered** (root cause, reproduction, or why it is not a bug).
   - **How it will be fixed** (approach) and link the PR when it exists.
   - **Release expectation:** fix is in review / will ship in the **next npm release** after merge — it is **not** on npm until published.
   - A **workaround** for users on the current npm version when practical.
   Do not leave reporters waiting with only a PR link and no explanation.
2. **Tests first:** check coverage for the affected area. Add or extend tests that name the failure **before** changing production code when coverage is missing.
3. Implement the fix; run `npm test`.
4. **Bugs and behavior changes across releases:** add **`docs/migration/issue-NNNN-<slug>.md`** using the [entry structure](./MIGRATION.md#entry-structure) (*Before* → *After* → **Workaround on older versions** → *After upgrading*). Do not edit `MIGRATION.md` body for new entries — only add a file under `docs/migration/` ([workflow](./docs/migration/README.md)). Link the GitHub issue. Use [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) only when the entry is not version-specific.
5. Open a PR (English title/body, Conventional Commits). Link the issue in **Related issue**; do **not** use `Closes #n` if the issue should stay open until npm publish.
6. Wait for CI; wait for maintainer merge.

### After merge (before release)

1. Comment on the issue **in English** with a short **post-merge update**: fix is on `master`, planned for the **next** npm release, link to the merged PR, and repeat the workaround until upgrade.
2. **Keep the issue open** until the fix is published on npm.
3. Point reporters to the migration file for their issue under [`docs/migration/`](./docs/migration/) (workarounds on their version) when the fix is not on npm yet.

### On release (when the version containing the fix ships)

1. Comment on the issue **in English** with the **released version** (e.g. `12.1.0`), `npm install` command, and **concrete steps** from that issue’s `docs/migration/issue-*.md` file — not only “upgrade”.
2. **Close the issue** with a short note referencing the release tag / CHANGELOG entry.
3. Update that issue’s migration file: set **Minimum version** and trim obsolete workarounds.

Skip PRs for duplicates, `wontfix`, or issues that only need a comment (already fixed in a recent release — verify with tests or changelog before closing).

## Pull requests

**Never push commits directly to `master`.** All changes — including docs, tests, and chores — go through a feature branch and a pull request. Only merge to `master` after review (or explicit maintainer approval on the PR). Do not use `git push origin master` for routine work.

When a task produces branch changes intended for review (features, fixes, CI, docs, refactors):

1. **Check whether the current branch is already merged** (see [Merged branches](#merged-branches) below). If it is, create a **new branch from `master`** — do not push follow-up commits to a merged PR branch.
2. **Create a branch** from `master` using a **lowercase** name (for example `docs/pr-workflow`, `test/xml2js-guards`, `fix/cli-formats`). The entire branch name must stay lowercase — no camelCase or uppercase segments (avoid names like `test/toTtf-unit-tests`).
3. **Read** [`.github/pull_request_template.md`](./.github/pull_request_template.md) and use it as the PR body structure (do not substitute a shorter custom format).
4. **Push** the branch to `origin` (`git push -u origin HEAD`) without asking first.
5. **Open a PR** with `gh pr create` (title + body in English, base `master`) without asking first. Pass the body via HEREDOC so headings and checklists match the template. **PR title must follow [Conventional Commits](https://www.conventionalcommits.org/)** (`type: description`, optional scope). Strip bot prefixes (`[Snyk]`, `[Dependabot]`) and rewrite to the correct type — use **`build(deps):`** or **`chore(deps):`** when dependencies change (see **Dependency bumps** under Scope, title, and description).
6. **Return the PR URL** in the final response.

**Squash merge only.** Routine merges to `master` use **Squash and merge** so the PR title is the single commit on `master` (Release Please depends on this). Do not use merge commits or rebase-merge unless a maintainer explicitly requests it.

**Fix PR titles proactively.** When working on an open PR, check the title with `gh pr view --json title`. If it does not match Conventional Commits (wrong type, vendor prefix, or scope drift after new commits), run `gh pr edit --title "type(scope): description"` **without asking** — same as push. Re-read the title after every push that changes PR scope.

### Copilot and review comments

Before finishing work on an open PR, **check for unresolved review threads** (Copilot, humans, bots). Do not leave Copilot feedback unanswered.

| Step | Action |
|------|--------|
| **List threads** | `gh api graphql` → `pullRequest(number: N) { reviewThreads { nodes { id isResolved comments { nodes { body author { login } } } } } } }` or the PR **Files changed** tab |
| **Evaluate** | If the suggestion is valid for the **current** branch state, apply it (code, tests, or docs) in the same PR. If it is wrong or obsolete (e.g. based on a reverted approach), explain why in a **reply in English** — cite code, tests, or AGENTS.md |
| **Reply** | `gh api repos/{owner}/{repo}/pulls/{number}/comments` with `in_reply_to` set to the review comment `databaseId` |
| **Resolve** | When addressed (fix merged in the branch **or** reply documents why not), resolve the thread: GraphQL `resolveReviewThread(input: { threadId: "PRRT_…" })` |

Resolve only after the thread is truly handled — not when ignoring feedback. If a follow-up commit applies Copilot’s fix, reply briefly (“Fixed in \<sha\>”) then resolve.

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

- **PR title = Conventional Commits.** Match commit style (`feat:`, `fix:`, `build(deps):`, `chore(deps):`, `docs:`, `test:`, `ci:`, …). When the PR is open and the title is wrong, fix it with `gh pr edit` before ending the task. Squash merge puts the title on `master`; Release Please reads it.
- **Dependency bumps set the type.** If the PR updates **`package.json` / `package-lock.json` dependencies**, the title must be **`build(deps):`** or **`chore(deps):`** — not `test:`, `docs:`, or `refactor:` even when most of the diff is new tests. Example: `build(deps): bump wawoff2 to 2.0.1; add ttfEncode tests`. Strip `[Dependabot]` / `[Snyk]` prefixes and rewrite.
- **Re-read the PR title and body whenever the branch scope changes.** After adding commits, update the title and **Proposed changes** section so reviewers see the full picture — not just the first commit message.
- **Split when it grows too much.** If a branch picks up unrelated fixes, large test extractions, or docs on top of the original goal, prefer **separate PRs** for follow-up work rather than one ever-growing branch. This PR accumulated extra scope before that rule was written; use smaller PRs from here on.
- **Explain why when closing a PR.** Leave an English comment (superseded, obsolete, duplicate, out of scope, etc.) — do not close without context. See [CONTRIBUTING.md](./CONTRIBUTING.md) (“Closing pull requests”).
