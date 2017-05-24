# Change Log

All notable changes to this project will be documented in this file.

This project adheres to [Semantic Versioning](http://semver.org/).

# 7.1.4 - 2017-05-24

-   Fixed: use `copyright`, `ts` and `version` with null value by default, 
    it is avoid problems when your use long term caching.

-   Fixed: options for `ttf` font generation now correctly handles.

# 7.1.3 - 2017-04-13

-   Fixed: search config if not present in CLI arguments.

# 7.1.2 - 2017-04-12

-   Fixed: `template` option now respected from config.

# 7.1.1 - 2017-03-29

-   Fixed: potential crash with memory allocation when using `fs` for read files.

# 7.1.0 - 2017-01-24

-   Added: `glyphTransformFn` option for transform glyph metadata before transferred in style template.

# 7.0.2 - 2016-12-22

-   Fixed: exit code can be not number.

# 7.0.1 - 2016-12-20

-   Fixed: arguments for svgicons2svgfont (missing font prefix).
-   Chore: improved output of help in `CLI`.

# 7.0.0 - 2016-11-09

-   Added: `template` option instead `css`, `cssFormat`, `srcCssTemplate`.
-   Added: `destStyles` options instead `destCssTemplate`.
-   Added: `styles` property to result.
-   Fixed: throw error on empty `svg` files.
-   Removed: `css` option.
-   Removed: `cssFormat` option.
-   Removed: `srcCssTemplate` option.
-   Removed: `css` property from result.
-   Removed: `destCssTemplate` argument from `cli`.
-   Tests: improved tests (relative and absolute path to template).

# 6.0.4 - 2016-11-08

-   Fixed: regression bug with passed arguments to template.

# 6.0.3 - 2016-11-08

-   Fixed: validate `xml` of glyphs.
-   Chore: minimum required `eslint-plugin-ava` version is now `^2.2.0`.
-   Chore: minimum required `eslint-plugin-itgalaxy` version is now `^26.0.0`.
-   Chore: minimum required `eslint-plugin-jsx-a11y` version is now `^3.0.0`.
-   Chore: minimum required `eslint-plugin-react` version is now `^6.6.0`.
-   Chore: refactoring code.

# 6.0.2 - 2016-11-07

-   Fixed: use `reject` instead `Promise.reject` in glyphs `error` callback.
-   Fixed: use callback `finish` instead `end` for `svgicons2svgfont` stream.
-   Tests: improve tests on bad examples.

# 6.0.1 - 2016-11-07

-   Fixed: add `error` event to `glyph` stream.
-   Fixed: don't create `new Error` where this is not necessary.
-   Chore: minimum required `nunjucks` version is now `^3.0.0`.
-   Chore: minimum required `eslint` version is now `^3.9.1`.
-   Chore: minimum required `eslint-plugin-ava` version is now `^4.0.0`.
-   Chore: minimum required `eslint-plugin-itgalaxy` version is now `^25.0.0`.
-   Chore: minimum required `eslint-plugin-node` version is now `^3.0.0`.
-   Chore: minimum required `eslint-plugin-promise` version is now `^3.3.0`.
-   Chore: minimum required `eslint-plugin-react` version is now `^6.5.0`.
-   Tests: improve tests on bad examples.

# 6.0.0 - 2016-10-26

-   Added: support `nodejs` `7`.
-   Added: `verbose` argument for verbose output.
-   Remove: `quite` argument.
-   Chore: improve `README.md`.
-   Chore: improve `description` in `package.json`.

# 5.0.0 - 2016-10-24

-   Fixed: wrong `CSS` syntax when not all format are selected.
-   Chore(SEMVER-MAJOR): rename extension for all templates from `nunjucks` to `njk`.

# 4.0.1 - 2016-10-19

-   Fixed: CLI `fontName` and `formats` arguments bug.
-   Chore: minimum required `ajv-cli` version is now `^1.1.0`.
-   Chore: minimum required `remark-preset-lint-itgalaxy` version is now `^2.0.0`.
-   Chore: minimum required `nunjucks` from `2.0.0` to `2.5.0`.
-   Chore: minimum required `eslint-plugin-import` version is now `^2.0.0`.
-   Chore: minimum required `eslint-plugin-promise` version is now `^3.0.0`.
-   Chore: minimum required `eslint-plugin-lodash` version is now `^2.1.0`.
-   Chore: rename `eslint-plugin-xo` to `eslint-plugin-unicorn`.
-   Chore: minimum required `eslint-plugin-unicorn` version is now `^1.0.0`.
-   Chore: minimum required `eslint-plugin-itgalaxy` version is now `^23.0.0`.
-   Chore: minimum required `cosmiconfig` version is now `^2.0.0`.

# 4.0.0

-   Changed: all style templates for font now have `nunjucks` extension.
-   Chore(package): remove extra `files` from `package.json`.
-   Chore(package): install all `peerDependencies` for `eslint-plugin-itgalaxy`.
-   Chore(package): update a minimal version `ava` from `0.15.0` to `0.16.0`.
-   Chore(package): update a minimal version `eslint-plugin-ava` from `2.5.0` to `3.0.0`.
-   Chore(package): update a minimal version `npm-run-all` from `2.3.0` to `3.0.0`.
-   Chore(package): update a minimal version `eslint-plugin-itgalaxy` from `8.0.0` to `11.0.0`.
-   Chore(package): update a minimal version `nyc` from `7.0.0` to `8.0.0`.
-   Chore(package): remove `nyc` settings, now fine works without their.
-   Chore(package): use `^` instead `~` from `babel-preset-stage-0`.
-   Chore(package): use `remark-preset-lint-itgalaxy` instead `remark-lint-config-itgalaxy`.
-   Chore(package): use right version for `eslint-plugin-*` and `eslint`.
-   Chore: improved `README.md`.
-   Chore: fix glob pattern for `lint:remark` script command.

# 3.0.1

-   Fixed: `--css-template-font-path` now get also from `cosmiconfig`.

# 3.0.0

-   Added: support `cosmiconfig`.
-   Changed: change function arguments in `standalone`.
-   Chore: refactoring.
-   Chore: sorting alphabetically `dependencies` and `devDependencies`.
-   Chore: remove unused `eslint-*` plugins from `devDependencies`.
-   Chore: update minimal version `eslint-plugin-itgalaxy` to `8.0.0`.
-   Chore: check is valid fonts in tests.
-   Chore: add more tests.
-   Chore: sharable config for `remark-lint`.
-   Chore: add `nodejs` v5 to `.travis.yml`.

# 2.0.3

-   Chore: improved `description` and `keywords` in `package.json`.

# 2.0.2

-   Fixed: `svg2ttf` now correctly generates `ttf` font.
-   Fixed: `ttf2eot` now correctly generates `eot` font.
-   Fixed: `ttf2woff` now correctly generates `woff` font.
-   Fixed: `svg2ttf` now correctly accepts option.
-   Chore: more readable name tests.
-   Chore: rename extension `templates`.

# 2.0.1

-   Chore: update `globby` to `6.0.0`.
-   Chore: update minimal version `babel-cli` to `6.11.0`.
-   Chore: update minimal version `babel-core` to `6.11.0`.
-   Chore: update `eslint-plugin-itgalaxy` to `6.0.0`.

# 2.0.0

-   Added: `--src-css-template` agument.
-   Added: `--css-template-class-name` argument.
-   Added: `--css-template-font-path` argument.
-   Added: `--css-template-font-name` argument.
-   Changed: remove `--css-template-format` argument, now format is taken from `--dest-css-template`.
-   Changed: remove `--css` argument, css now generated if you use `--dest-css-template` argument.
-   Changed: rename `--css-template-dest` argument to `--dest-css-template`.
-   Remove: `--css-template` argument.

# 1.0.1

-   Fixed: get `fontId` from `fontName`, if `fontId` is `null` or `undefined`.

# 1.0.0

-   Initial release.
