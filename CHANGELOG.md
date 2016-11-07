# 6.0.2 - 2016-11-07

- Fixed: use `reject` instead `Promise.reject` in glyphs `error` callback.
- Fixed: use callback `finish` instead `end` for `svgicons2svgfont` stream.
- Tests: improve tests on bad examples.

# 6.0.1 - 2016-11-07

- Fixed: add `error` event to `glyph` stream.
- Fixed: don't create `new Error` where this is not necessary.
- Chore: update a minimal version of `nunjucks` from `2.5.0` to `3.0.0`.
- Chore: update a minimal version of `eslint` from `3.4.0` to `3.9.1`.
- Chore: update a minimal version of `eslint-plugin-ava` from `3.0.0` to `4.0.0`.
- Chore: update a minimal version of `eslint-plugin-itgalaxy` from `23.0.0` to `25.0.0`.
- Chore: update a minimal version of `eslint-plugin-node` from `2.0.0` to `3.0.0`.
- Chore: update a minimal version of `eslint-plugin-promise` from `3.0.0` to `3.3.0`.
- Chore: update a minimal version of `eslint-plugin-react` from `6.2.0` to `6.5.0`.
- Tests: improve tests on bad examples.

# 6.0.0 - 2016-10-26

- Added: support `nodejs` `7`.
- Added: `verbose` argument for verbose output.
- Remove: `quite` argument.
- Chore: improve `README.md`.
- Chore: improve `description` in `package.json`.

# 5.0.0 - 2016-10-24

- Fixed: wrong `CSS` syntax when not all format are selected.
- Chore(SEMVER-MAJOR): rename extension for all templates from `nunjucks` to `njk`.

# 4.0.1 - 2016-10-19

- Fixed: CLI `fontName` and `formats` arguments bug.
- Chore: use `^` instead `~` for `ajv-cli`, `package-schema`, `remark-cli`, `remark-lint`, `remark-preset-lint-itgalaxy`.
- Chore: update a minimal version of `ajv-cli` from `0.9.0` to `1.1.0`.
- Chore: update a minimal version of `remark-preset-lint-itgalaxy` from `1.0.0` to `2.0.0`.
- Chore: update a minimal version of `nunjucks` from `2.0.0` to `2.5.0`.
- Chore: update a minimal version of `eslint-plugin-import` from `1.16.0` to `2.0.0`.
- Chore: update a minimal version of `eslint-plugin-promise` from `2.0.0` to `3.0.0`.
- Chore: update a minimal version of `eslint-plugin-lodash` from `1.10.0` to `2.1.0`.
- Chore: rename `eslint-plugin-xo` to `eslint-plugin-unicorn`.
- Chore: update a minimal version of `eslint-plugin-unicorn` from `0.5.0` to `1.0.0`.
- Chore: update a minimal version of `eslint-plugin-itgalaxy` from `13.0.0` to `23.0.0`.
- Chore: update a minimal version of `cosmiconfig` from `1.0.0` to `2.0.0`.

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
