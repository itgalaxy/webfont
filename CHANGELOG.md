# Head

- Chore: improved `description` and `keywords` in `package.json`.

# 2.0.2

- Fixed: `svg2ttf` now correctly generates `ttf` font.
- Fixed: `ttf2eot` now correctly generates `eot` font.
- Fixed: `ttf2woff` now correctly generates `woff` font.
- Fixed: `svg2ttf` now correctly accepts option.
- Chore: more readable name tests.
- Chore: rename extension `templates`.

# 2.0.1

- Chore: update `globby` to `6.0.0`.
- Chore: update minimal version `babel-cli` to `6.11.0`.
- Chore: update minimal version `babel-core` to `6.11.0`.
- Chore: update `eslint-plugin-itgalaxy` to `6.0.0`.

# 2.0.0

- Added: `--src-css-template` agument.
- Added: `--css-template-class-name` argument.
- Added: `--css-template-font-path` argument.
- Added: `--css-template-font-name` argument.
- Changed: remove `--css-template-format` argument, now format is taken from `--dest-css-template`.
- Changed: remove `--css` argument, css now generated if you use `--dest-css-template` argument.
- Changed: rename `--css-template-dest` argument to `--dest-css-template`.
- Remove: `--css-template` argument.

# 1.0.1

- Fixed: get `fontId` from `fontName`, if `fontId` is `null` or `undefined`.

# 1.0.0

- Initial release.
