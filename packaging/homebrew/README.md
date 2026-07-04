# Homebrew packaging

Source of truth for the [Homebrew](https://brew.sh) distribution of `webfont`.
These files are excluded from the npm tarball (see the `files` allowlist in
`package.json`).

```
packaging/homebrew/
├── Formula/
│   └── webfont.rb      # the formula (Node CLI; installs the npm tarball)
└── Aliases/
    └── webfonts -> ../Formula/webfont.rb   # `webfonts` resolves to `webfont`
```

## Install (once the tap is published)

```bash
brew install itgalaxy/tap/webfont
# or, via the alias:
brew install itgalaxy/tap/webfonts
```

Both install the same `webfont` CLI — `webfonts` is just an alternate name.

## The `webfonts` alias

`webfonts` is a convenience alias for `webfont` (a common alternate spelling).

Aliases like this are a tap feature: Homebrew **personal taps** allow arbitrary
aliases (they are namespaced to the tap and users opt in with `brew tap`).
**homebrew-core** reserves aliases for renamed/legacy formulae, so keep this one
**tap-only**.

## Publishing / updating the tap

The tap is a separate repo (a Homebrew tap must be named `homebrew-<name>`),
e.g. `itgalaxy/homebrew-tap`, consumed as `itgalaxy/tap`.

1. Copy `Formula/webfont.rb` and `Aliases/webfonts` into the tap repo.
2. On each npm release, update the formula's `url` + `sha256`:

   ```bash
   version="$(npm view webfont version)"
   url="$(npm view webfont dist.tarball)"
   sha="$(curl -sL "$url" | shasum -a 256 | cut -d' ' -f1)"
   echo "url $url"
   echo "sha256 $sha"
   ```

3. Validate before pushing:

   ```bash
   brew style  packaging/homebrew/Formula/webfont.rb
   brew audit --strict --online itgalaxy/tap/webfont
   brew test   itgalaxy/tap/webfont
   ```

See issue [#769](https://github.com/itgalaxy/webfont/issues/769) for the
rollout plan (including automating the bump on publish).
