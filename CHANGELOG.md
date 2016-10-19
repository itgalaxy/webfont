# Head

- Fixed: CLI `fontName` and `formats` arguments bug.

# 4.0.0

- Changed: all style templates for font now have `nunjucks` extension.
- Chore(package): remove extra `files` from `package.json`.
- Chore(package): install all `peerDependencies` for `eslint-plugin-itgalaxy`.
- Chore(package): update a minimal version `ava` from `0.15.0` to `0.16.0`.
- Chore(package): update a minimal version `eslint-plugin-ava` from `2.5.0` to `3.0.0`.
- Chore(package): update a minimal version `npm-run-all` from `2.3.0` to `3.0.0`.
- Chore(package): update a minimal version `eslint-plugin-itgalaxy` from `8.0.0` to `11.0.0`.
- Chore(package): update a minimal version `nyc` from `7.0.0` to `8.0.0`.
- Chore(package): remove `nyc` settings, now fine works without their.
- Chore(package): use `^` instead `~` from `babel-preset-stage-0`.
- Chore(package): use `remark-preset-lint-itgalaxy` instead `remark-lint-config-itgalaxy`.
- Chore(package): use right version for `eslint-plugin-*` and `eslint`.
- Chore: improved `README.md`.
- Chore: fix glob pattern for `lint:remark` script command.

# 3.0.1

- Fixed: `--css-template-font-path` now get also from `cosmiconfig`.

# 3.0.0

- Added: support `cosmiconfig`.
- Changed: change function arguments in `standalone`.
- Chore: refactoring.
- Chore: sorting alphabetically `dependencies` and `devDependencies`.
- Chore: remove unused `eslint-*` plugins from `devDependencies`.
- Chore: update minimal version `eslint-plugin-itgalaxy` to `8.0.0`.
- Chore: check is valid fonts in tests.
- Chore: add more tests.
- Chore: sharable config for `remark-lint`.
- Chore: add `nodejs` v5 to `.travis.yml`.

# 2.0.3

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
