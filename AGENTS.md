# Agent guidelines

Instructions for AI agents and contributors automating work in this repository.

**GitHub Copilot:** repository custom instructions live at [`.github/instructions/webfont.instructions.md`](./.github/instructions/webfont.instructions.md) (symlink to this file). Edit **AGENTS.md** only — not the symlink target path in `.github/instructions/`. [CLAUDE.md](./CLAUDE.md) symlinks here for Claude Code.

## Monorepo layout

npm workspaces monorepo ([ADR 0013](./docs/adr/0013-npm-workspaces-monorepo.md)): published library in **`packages/webfont`** (`name: "webfont"` on npm); VitePress docs and user-facing markdown at the **repo root**. Run `npm ci` at root; `npm test` / `npm run build` / `npm run test:package` delegate to the `webfont` workspace.

## Testing (Vitest)

### Vitest globals (all workspaces)

Workspace Vitest configs use **`test.globals: true`** ([ADR 0015](./docs/adr/0015-vitest-globals-in-workspaces.md)). Typecheck configs include `"vitest/globals"` so `describe` / `it` / `expect` / `expectTypeOf` / `vi` / hooks need **not** be imported. Explicit `import { … } from "vitest"` is optional. Emit/build tsconfigs must exclude `*.test.ts` and must not require Vitest types on production sources.

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

### Clean up `mkdtempSync` directories in hooks

When tests create temp trees with `mkdtempSync`, remove them in an **`async` `afterEach`** via `fs/promises` — do not only reset a tracking array. Clearing the array without `rm` leaks directories under the OS temp folder and skips cleanup when a test fails mid-run.

```ts
import { rm } from "node:fs/promises";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});
```

Use sync `mkdtempSync` / `mkdirSync` in the test body if convenient; keep **deletion async** in the hook (same rule as other async hooks — no sync-throwing `fs.rmSync` in `afterEach` callbacks).

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
| Packaging / build (`packages/webfont/vite.config.ts`, `packages/webfont/package.json#exports`, `files`, `main`, `module`, `browser`, `bin`, `types`, or `dist/` layout) | Run `npm run test:package` locally (publint + attw + pack-smoke) and rely on the CI step; extend `packages/webfont/scripts/pack-smoke-test.mjs` when a new consumer entry point ships. See [ADR 0012](docs/adr/0012-published-package-validation.md). |
| Docs-only | No new tests; say so in the PR **Testing** section |

Run `npm test` before pushing. For packaging or build changes, also run **`npm run test:package`** — a meta script that runs `publint` (package.json lint), `@arethetypeswrong/cli` (types resolution across node10 / node16 CJS / node16 ESM / bundler), and `packages/webfont/scripts/pack-smoke-test.mjs` (pack + install + ESM & CJS consumer smoke tests that generate a real woff2). This is the layered guardrail that catches regressions of `package.json#exports` / `files` / `types` / `dist/*.{js,mjs,d.ts,d.mts}` that Vitest-in-source cannot see (for example [#618](https://github.com/itgalaxy/webfont/issues/618)). See [ADR 0012](docs/adr/0012-published-package-validation.md).

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

Integration tests in `packages/webfont/src/cli/index.test.ts` run the built CLI via `child_process.exec` and capture **stdout**, **stderr**, and the exit code.

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

### Config mapping, CLI bundles, and user input

Patterns below come from assistant/CLI review on [#797](https://github.com/itgalaxy/webfont/pull/797) and MCP tool review on [#796](https://github.com/itgalaxy/webfont/pull/796). They apply to **any** code that loads external config (`.was`, cosmiconfig, MCP tool args, wizard answers).

- **Do not override `webfont()` defaults when mapping external configs** unless the source file **explicitly** sets the field. Omit optional keys so `defaultWebfontOptions()` and runtime validation apply — forcing values like `fixedWidth: true` or `fontHeight: 1000` on minimal legacy configs changes font output unexpectedly.
- **Normalize untrusted JSON before property access.** Loaded configs are parsed with `JSON.parse` — validate or defensively coerce fields (for example `formats` must be a non-empty array) before reading `.length` or spreading; prefer falling back or `webfont` validation over `TypeError` at map time. Optional `.was` basename fields (`prefix`, legacy `fontName`, `fontId`, `templateFontName`) must be validated as strings before calling string methods — throw `Invalid .was config: "{field}" must be a string` rather than opaque errors like `trim is not a function`.
- **Distinguish presence from truthiness for mutually exclusive string inputs.** When callers must supply exactly one of two optional string fields (for example MCP `wasConfigPath` vs `wasConfigJson`), use `field !== undefined` for the exclusivity check — not `if (field)`. An empty string is “provided” for exclusivity; after that check, reject empty/whitespace with a clear `{field} must be a non-empty string` error instead of falling through to the other branch (`JSON.parse(undefined)`, cryptic parse errors). See `loadWasConfigsFromInput`.
- **Guard loaded config JSON in a dedicated module** (for example `guardWasConfigLoad.ts`) so parse/validation logic is reusable: wrap `JSON.parse`, require object shape, validate required string fields (`dest`, `files`, `name`, `template`, …), and include `configPath` (and array index when relevant) in every error.
- **Use `clean`, not `sanitize`, in our identifiers and docs.** Helpers like `cleanWasConfigBasename` express intent; reserve “sanitize” for quoting third-party APIs only.
- **Clean user-derived path segments** before building output filenames. Use `path.basename()` (or equivalent) on names that become `{name}.was`, font basenames, or other disk paths; reject empty, `.`, and `..` basenames. Wizard answers and loaded JSON configs are untrusted input.
- **Clean names before font output paths.** When mapping external configs to `InitialOptions`, clean every field that becomes `fontName`, `fontId`, `templateClassName`, or `templateFontName` before `writeResultFiles` — path traversal in `.was` `name` must not escape `dest` via font filenames.
- **Reuse the same cleaned value for disk paths and persisted fields.** When saving config files, build `{name}.was` from the cleaned basename already written into the payload — do not re-derive the path from the raw input.
- **Polish interactive CLI copy.** Wizard and `--help` strings shown to humans must use correct grammar and clear wording (review prompt `message` fields in enquirer/meow catalog entries). Custom-template wizard defaults should follow `../templates/template.{styleType}.njk` so they match bundled templates and `writeResultFiles` output naming (only `.njk` is stripped from custom template basenames).
- **Sequential batch work without `biome-ignore`.** When order matters (for example multiple `.was` configs), prefer promise chaining (`reduce` + `.then()`) over `await` inside `for` loops — satisfies Biome `lint/performance/noAwaitInLoops` without suppressions.
- **CJS dependencies in the ESM CLI bundle.** The CLI ships as `dist/cli.mjs` with dependencies **external** (not bundled). Dynamic `import("enquirer")` and similar must tolerate both default and namespace export shapes: `const lib = module.default ?? module` before destructuring constructors.
- **No `biome-ignore` unless unavoidable.** Prefer a small refactor (see sequential batch note above) over silencing Biome rules; `lint:suppressions` blocks banned suppressions on pre-commit/CI.

### MCP tools (`packages/webfont-mcp`)

Patterns from [#796](https://github.com/itgalaxy/webfont/pull/796). Apply whenever exposing `webfont()` (or `.was` configs) through MCP or other agent-facing wrappers.

- **Align tool schemas and TypeScript unions with the runtime pipeline.** The SVG-icons path rejects `otf` (`assertSvgPipelineFormats`). Do not advertise `otf` on `convert_svgs_to_font` Zod schemas or `WebfontFormat` — agents will construct calls that always fail. Split schemas per tool when another tool later supports WOFF→OTF decompression.
- **Resolve and sandbox every glob match before `webfont()`.** Lexical sandbox of the glob string alone is not enough (symlinks under `workspaceRoot` can point outside). Reuse `resolveSvgInputPaths` (globby + `assertPathWithinRoot` per match) for **all** conversion tools — including `convert_from_was` — then pass the resolved absolute file list to `webfont({ files })`. Do not rely on webfont’s internal globber for MCP security boundaries.
- **Sandbox custom template paths; leave built-in template names alone.** Built-in ids (`css`, `scss`, `styl`, `html`, `json`) are not filesystem paths — pass them through. Any other `template` value (MCP `convert_svgs_to_font` or `.was` `template`) must go through `resolveTemplateWithinRoot` / `resolvePathWithinRoot` so agents cannot read templates outside `workspaceRoot`. Apply this in `sandboxWasConfigPaths` as well as direct conversion tools.
- **Portable Cursor MCP config.** Commit `.cursor/mcp.json` with `${workspaceFolder}`, never machine-specific absolute paths under `/Users/...`.

### Codify review feedback in AGENTS.md

When Copilot, humans, or bots surface a **reusable** pattern (defensive guards, naming, CLI copy, test style), **update AGENTS.md in the same PR** once the fix lands — do not rely on resolved review threads alone.

| Situation | Action |
|-----------|--------|
| Valid suggestion that could recur on similar code | Add or extend a bullet under the closest heading (Config mapping, Testing, CLI, …) |
| One-off bug with no general rule | Test + review reply only; no AGENTS.md change |
| Deliberately rejected suggestion | Reply citing AGENTS.md, tests, or code; no AGENTS.md change |

Before resolving a review thread, ask: *if another agent shipped similar code next month, would AGENTS.md tell them the right pattern?* If not, document it here first (or in the same commit that applies the fix).

## Documentation

When a task changes **how users interact with webfont** (CLI flags, programmatic `webfont()` options, defaults, exit behavior, or config file semantics), update user-facing docs in the same change:

1. **Check for user impact** before finishing — compare CLI help (`packages/webfont/src/cli/meow/cliFlagCatalog.ts` + `npm run docs:cli` → [packages/webfont/docs/cli.md](./packages/webfont/docs/cli.md)), [packages/webfont/docs/configuration.md](./packages/webfont/docs/configuration.md), [README.md](./README.md) and [packages/webfont/README.md](./packages/webfont/README.md), [FEATURES.md](./FEATURES.md), and any examples or fixtures that show usage.
2. **Update README.md** when behavior, accepted input formats, or public options change. Keep CLI flag names and short aliases aligned with `meow` (`-f` / `--formats`, `-u` / `--fontName`, etc.).
3. **Update [FEATURES.md](./FEATURES.md)** when capabilities, stability, properties, or test criteria change. Mark features `stable`, `in-progress`, or `planned`; tick test criteria when coverage exists.
4. **Update [packages/webfont/NOTICE.md](./packages/webfont/NOTICE.md)** when legal notices, font licensing guidance, attribution rules, or runtime dependency licenses change.
5. **Update [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** for operational errors (symptoms and fixes on the **current** release, not version-to-version deltas).
6. **Update migration docs** when a fix or change alters behavior across releases: add **`docs/migration/issue-NNNN-<slug>.md`** (one new file per issue — do **not** append to `MIGRATION.md`; see [docs/migration/README.md](./docs/migration/README.md#entry-structure) for naming, workflow, and entry structure). Include *What changed* → *Before* → *After* → **Workaround on older versions** (when users on older npm releases have a practical alternative) → *After upgrading*. Link the GitHub issue; set **minimum fixed version** in that file when the release ships.
7. **Do not rely on CHANGELOG alone** for unreleased work; Release Please updates `CHANGELOG.md` at release time.

See also [CONTRIBUTING.md](./CONTRIBUTING.md) — “User-facing changes and documentation”.

## General

- Follow [CONTRIBUTING.md](./CONTRIBUTING.md) and existing ADRs under `docs/adr/`.
- Run `npm run depcheck` (Knip) when changing imports or `package.json` dependencies; see [ADR 0008](docs/adr/0008-knip-instead-of-depcheck.md). The **pre-push** Lefthook runs `depcheck` before `npm test`.
- Use conventional commits (`feat`, `fix`, `test`, `docs`, `chore`, `refactor`, `ci`, `build`). Prefer **`chore(deps):`** when the PR changes `package.json` / lockfile dependencies (and **`ci(deps):`** for GitHub Actions bumps) — even if the diff is mostly tests or docs (see [Pull requests](#pull-requests)). This matches the prefixes Dependabot generates via [`.github/dependabot.yml`](./.github/dependabot.yml).
- Releases are handled by Release Please on `master`; do not bump `package.json` version in feature PRs (see [ADR 0004](docs/adr/0004-release-please-instead-of-standard-version.md)). Release git tags use **`v{semver}`** (`v12.0.0`); `release-please-config.json` sets `include-component-in-tag: false` — do not use `webfont-v*` tags.
- Keep changes focused; match surrounding code style and tooling (Biome, Vitest, Lefthook).
- Do not commit unless explicitly asked.
- **Never push to `master`.** Use a branch and open a PR (see [Pull requests](#pull-requests) below).
- **Push without asking.** After commits on a feature or PR branch, run `git push` as part of finishing the work. Do not end responses with “want me to push?” or similar — push, then report what was pushed and the PR URL if applicable.

### CI workflows

When adding or editing `.github/workflows/*.yml`, follow [CONTRIBUTING.md](./CONTRIBUTING.md#ci-changes) — especially:

- **Pin third-party CLI versions** on deploy/release paths; do not use `@latest`. Prefer a repository **variable** with a safe default in the workflow expression (e.g. `vars.VERCEL_CLI_VERSION || '54.20.1'`).
- **Bind secrets once** at the job or step `env` block; reference the env var in `run` commands instead of repeating GitHub Actions `secrets.*` expressions inline across steps. Match existing patterns in `npm-publish.yml` (`NODE_AUTH_TOKEN`) and `vercel-deploy.yml` (`VERCEL_TOKEN`).
- **Never use `secrets` in `jobs.<id>.if`.** That context is unavailable there; GitHub rejects the workflow (`Unrecognized named-value: 'secrets'`) and `workflow_dispatch` fails with HTTP 422 (blocks Release Please → `npm-publish`). Gate optional secret-dependent work via job `env` + step/`outputs` checks instead (see `bump-homebrew-core` in `npm-publish.yml`).
- **Map deploy jobs to GitHub Environments** (`npm`, `github-packages`, `vercel`) so production runs appear under **Deployments** with a URL. See [CONTRIBUTING.md](./CONTRIBUTING.md#vercel-docs-deployment).
- **Validate the docs site** when editing VitePress-published markdown (`.vitepress/config.mts` rewrites): run `npm run docs:site` locally (`predocs:site` builds `packages/webfont/dist/cli.mjs` when missing); pre-push and PR CI enforce it after `npm test`.
- **VitePress markdown:** published pages compile as Vue templates — no mustache-style double braces outside fenced code blocks (rephrase, or use HTML entities `&#123;&#123;` / `&#125;&#125;` when literals are required).

### Lint and type hygiene

- **No `eslint-disable*` comments.** ESLint is not used; Biome is the linter ([ADR 0001](docs/adr/0001-eslint-vs-biome-linting.md)). Delete stale ESLint suppressions; use `biome-ignore` only when a rule cannot be satisfied by a small code change.
- **No `@ts-expect-error` or `@ts-ignore`.** Resolve types properly:
  - Config fixtures with extra keys: `ResultConfig & { key: Type }` + cast in tests.
  - Mocks: import the `__mocks__` module for assertions, or a small helper type when a cast is unavoidable (`as unknown as MockType`).
  - Expected rejections: `await expect(fn()).rejects.toThrow(...)` (not `try/catch` + conditional expects).
  - Unused parameters: `_name` prefix on the parameter or property.
- **No non-null assertions (`!`).** The `style/noNonNullAssertion` Biome rule is `error` with **no per-file override** (including tests). Narrow the value instead:
  - `assert(value)` from `node:assert` before use — turns `T | undefined` into `T` and fails the test with a clear message if the assumption ever breaks.
  - Optional chaining (`value?.prop`) when the branch tolerates `undefined`.
  - Typed fixtures/factories (e.g. `makeResultConfig`) so the value is never `undefined` in the first place.
- **No `ignoreDeprecations` in `packages/webfont/tsconfig.json` (or any tsconfig).** On TypeScript upgrades, migrate deprecated compiler options and fix type errors instead of silencing warnings (see [CONTRIBUTING.md](./CONTRIBUTING.md)).
- **Enforced automatically.** `npm run lint:suppressions` (`scripts/check-no-suppressions.mjs`) scans tracked source files for banned suppressions and fails the build. It runs on **Lefthook pre-commit** and in **CI** (`.github/workflows/pr.yml`), so reintroducing an `eslint-disable`, `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`, or `ignoreDeprecations` blocks the commit/PR. After edits you can run it directly; `biome-ignore` remains allowed only when a rule cannot be satisfied by a small code change.

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
4. **Bugs and behavior changes across releases:** add **`docs/migration/issue-NNNN-<slug>.md`** using the [entry structure](./docs/migration/README.md#entry-structure) (*Before* → *After* → **Workaround on older versions** → *After upgrading*). Do not edit `MIGRATION.md` body for new entries — only add a file under `docs/migration/` ([workflow](./docs/migration/README.md)). Link the GitHub issue. Use [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) only when the entry is not version-specific.
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

## Downstream: webfont-assistant

[webfont-assistant](https://github.com/kmorope/webfont-assistant) is a third-party interactive CLI wrapper around `webfont`. When a change in **this** repository can affect that package (CLI/API/options defaults, `.was` config shape, `writeResultFiles` behavior, Node engine, breaking migrations), **open a PR to [kmorope/webfont-assistant](https://github.com/kmorope/webfont-assistant) in the same work session** — do not defer to a follow-up.

| Trigger | Action |
|---------|--------|
| Breaking or additive CLI/API change | PR updating `webfont` dependency + mapping code; note minimum webfont version in README |
| New built-in assistant flags (`--assistant`, `--assistant-config`) | Ensure parity docs mention migration from `webfont-assistant` |
| `.was` format change | Update both our assistant module (`packages/webfont/src/cli/assistant/`) and webfont-assistant |
| Deprecated `.was` `fontName` (icon prefix) → `prefix` | Downstream PR: read legacy `fontName`, write `prefix` only; link [issue-0797-was-prefix-field.md](./docs/migration/issue-0797-was-prefix-field.md) |

Fork via `gh repo fork kmorope/webfont-assistant`, branch from `master`, PR upstream with English title/body. Link the itgalaxy/webfont PR in the downstream PR description.

## Pull requests

See **[MAINTAINERS.md](./MAINTAINERS.md)** for branch naming, opening PRs, squash merge, Copilot review threads (including **codifying reusable feedback in this file**), merged-branch rules, and template guidance. Agents must push and open PRs without asking when work is review-ready.
