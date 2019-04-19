# webfont

[![NPM version](https://img.shields.io/npm/v/webfont.svg)](https://www.npmjs.org/package/webfont)
[![Travis Build Status](https://img.shields.io/travis/itgalaxy/webfont/master.svg?label=build)](https://travis-ci.org/itgalaxy/webfont)
[![Build status](https://ci.appveyor.com/api/projects/status/a8absovr2r44w1oc?svg=true)](https://ci.appveyor.com/project/evilebottnawi/webfont)
[![dependencies Status](https://david-dm.org/itgalaxy/webfont/status.svg)](https://david-dm.org/itgalaxy/webfont)
[![devDependencies Status](https://david-dm.org/itgalaxy/webfont/dev-status.svg)](https://david-dm.org/itgalaxy/webfont?type=dev)

Generator of fonts from SVG icons.

Features:

- Supported font formats: `WOFF2`, `WOFF`, `EOT`, `TTF` and `SVG`.
- Support configuration Files - use a `JavaScript`, `JSON` or `YAML` file to specify configuration information for an entire directory and all of its subdirectories.
- Supported browsers: IE8+.
- Allows to use custom templates (example `css`, `scss` and etc).
- No extra dependencies as `gulp`, `grunt` or other big tools.
- Tested on all platforms (`linux`, `windows` and `osx`).
- CLI.
- [Webpack plugin](https://github.com/itgalaxy/webfont-webpack-plugin).

## Install

```shell
npm install --save-dev webfont
```

## Usage

```js
const webfont = require("webfont").default;

webfont({
  files: "src/svg-icons/**/*.svg",
  fontName: "my-font-name"
})
  .then(result => {
    console.log(result);

    return result;
  })
  .catch(error => {
    throw error;
  });
```

Or

```js
import webfont from "webfont";

webfont({
  files: "src/svg-icons/**/*.svg",
  fontName: "my-font-name"
})
  .then(result => {
    console.log(result);

    return result;
  })
  .catch(error => {
    throw error;
  });
```

## Options

### `files`

A file glob, or array of file globs.
Ultimately passed to [fast-glob](https://github.com/mrmlnc/fast-glob) to figure out what files you want to get.

`node_modules` and `bower_components` are always ignored.

### `configFile`

A `webfont` configuration object.

### `fontName`

Type: `String`
Default: `webfont`

The font family name you want.

### `formats`

Type: `Array`
Default value: `['svg', 'ttf', 'eot', 'woff', 'woff2']`
Possible values: `svg, ttf, eot, woff, woff2`.

Font file types to generate.

### `template`

Type: `string`
Default: `null`

Possible values: `css`, `scss` (feel free to contribute). If you want to use custom template use this option.
Example: `template: path.resolve(__dirname, './my-template.css')`.

### `templateClassName`

Type: `string`
Default: `null`

Default font class name.

### `templateFontPath`

Type: `string`
Default: `./`

Path to generated fonts in the `CSS` file.

### `templateFontName`

Type: `string`

Default value getting from `fontName` options, but you can specify any value.

### `glyphTransformFn`

Type: `function`
Default: `null`

If you need transform glyph metadata (e.g. titles of CSS classes) before transferred in style template for your icons, you can use this option with glyphs metadata object.

Example:

```js
import webfont from "webfont";

webfont({
  files: "src/svg-icons/**/*.svg",
  glyphTransformFn: obj => {
    obj.name += "_transform";

    return obj;
  }
})
  .then(result => {
    console.log(result);

    return result;
  })
  .catch(error => {
    throw error;
  });
```

### `sort`

Type: `bool`
Default: `true`

Default the icons are sorted by name, do not sort by setting this to `false`

### `fontId`

### `fontStyle`

### `fontWeight`

### `fixedWidth`

### `centerHorizontally`

### `normalize`

### `fontHeight`

### `round`

### `descent`

### `ascent`

### `startUnicode`

### `prependUnicode`

Options that are passed directly to [svgicons2svgfont](https://github.com/nfroidure/svgicons2svgfont).
Option `fontName` for `svgicons2svgfont` taken from above `fontName` argument.

## Command Line Interface

The interface for command-line usage is fairly simplistic at this stage, as seen in the following usage section.

### Usage

`webfont --help` prints the CLI documentation.

### Exit codes

The CLI can exit the process with the following exit codes:

- 0: All ok.
- 1: Something unknown went wrong.
- Other: related to using packages.

## Related

- [Webpack plugin](https://github.com/itgalaxy/webfont-webpack-plugin) - `webpack` plugin.
- [svgicons2svgfont](https://github.com/nfroidure/svgicons2svgfont) - Simple tool to merge multiple icons to an SVG font.
- [svg2ttf](https://github.com/fontello/svg2ttf) - Converts SVG fonts to TTF format.
- [ttf2eot](https://github.com/fontello/ttf2eot) - Converts TTF fonts to EOT format.
- [ttf2woff](https://github.com/fontello/ttf2woff) - Converts TTF fonts to WOFF format.
- [wawoff2](https://github.com/fontello/wawoff2) - Converts TTF fonts to WOFF2 and versa vice.

## Roadmap

- The ability to generate from any type to any type.
- More tests, include CLI test.
- Improved docs.
- Reduce package size (maybe implement `ttf2woff2` with native js library).
- Improve performance (maybe use cache for this).

## Contribution

Feel free to push your code if you agree with publishing under the MIT license.

## [Changelog](CHANGELOG.md)

## [License](LICENSE)
