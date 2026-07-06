# Submit `webfont` to homebrew-core

Tracking: [#785](https://github.com/itgalaxy/webfont/issues/785) (replace if the issue number differs).

This directory holds the **homebrew-core** submission draft for `webfont`. It is generated from the monorepo tap formula (`HomebrewFormula/webfont.rb`) on each npm release by `scripts/sync-homebrew-formula.mjs`.

## Why a separate file?

- **Monorepo tap** (`HomebrewFormula/` + `Aliases/`) ships today via `brew tap itgalaxy/webfont <URL>`.
- **homebrew-core** enables plain `brew install webfont` with no tap.
- The install/test blocks are kept identical so acceptance in core does not change runtime behavior.

The `webfonts` alias stays **tap-only** — homebrew-core does not accept arbitrary aliases.

## Open the PR on Homebrew/homebrew-core

1. Fork [Homebrew/homebrew-core](https://github.com/Homebrew/homebrew-core).
2. Create branch `webfont` from `master`.
3. Add **`Formula/w/webfont.rb`** using the contents of [`webfont.rb`](./webfont.rb) in this directory (path letter is required by core).
4. Run locally (macOS or Linux with Homebrew):

   ```bash
   brew style Formula/w/webfont.rb
   brew audit --strict --online --new Formula/w/webfont.rb
   brew install --build-from-source ./Formula/w/webfont.rb
   brew test webfont
   webfont --version
   ```

5. Open the PR with the body below.

### Suggested PR title

```
webfont 12.4.1 (new formula)
```

(Update the version in the title when bumping.)

### Suggested PR body

```markdown
- [x] Have you followed the guidelines in our [Contributing guide](https://github.com/Homebrew/homebrew-core/blob/HEAD/CONTRIBUTING.md)?
- [x] Have you ensured that your commits follow the [commit style guide](https://docs.brew.sh/Formula-Cookbook#commit)?
- [x] Have you checked that there aren't other open [pull requests](https://github.com/Homebrew/homebrew-core/pulls) for the same formula update?
- [ ] Have you built your formula locally with `brew install --build-from-source <formula>`, or `brew reinstall <formula>`?
- [ ] Have you made sure the formula `brew audit --strict --online <formula>` passes after installation?
- [ ] Have you run `brew test <formula>` after installation?

## Summary

Add [webfont](https://github.com/itgalaxy/webfont) — a Node CLI to generate icon fonts from SVG and encode/decompress webfont formats (TTF, WOFF, WOFF2).

Installs the published npm tarball with `std_npm_args` (same pattern as `prettier`, `eslint`). Upstream is MIT-licensed and actively maintained.

## Test plan

```console
$ brew install webfont
$ webfont --version
12.4.1
$ brew test webfont
```
```

## After merge in homebrew-core

1. Comment on the tracking issue with the merged core PR link.
2. Update [packages/webfont/install.md](../../packages/webfont/install.md) — list `brew install webfont` as the primary macOS/Linux CLI path.
3. Document `brew untap itgalaxy/webfont` for users who installed via the monorepo tap.
4. Keep `HomebrewFormula/webfont.rb` in sync for users who still tap this repo, or deprecate the tap in a follow-up once core bottles are widely available.

## Version bumps in core

homebrew-core bumps are **separate PRs** to `Homebrew/homebrew-core`. Use this repo's `docs/homebrew-core/webfont.rb` as the source when opening bump PRs, or run:

```bash
node scripts/sync-homebrew-formula.mjs
```

Then copy the updated `url` / `sha256` into `Formula/w/webfont.rb` on homebrew-core.
