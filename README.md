# webfont

[![NPM version](https://img.shields.io/npm/v/webfont.svg)](https://www.npmjs.org/package/webfont) 
[![Travis Build Status](https://img.shields.io/travis/itgalaxy/webfont/master.svg?label=build)](https://travis-ci.org/itgalaxy/webfont) 
[![Build status](https://ci.appveyor.com/api/projects/status/a8absovr2r44w1oc?svg=true)](https://ci.appveyor.com/project/evilebottnawi/webfont)
[![Greenkeeper badge](https://badges.greenkeeper.io/itgalaxy/webfont.svg)](https://greenkeeper.io/)
[![dependencies Status](https://david-dm.org/itgalaxy/webfont/status.svg)](https://david-dm.org/itgalaxy/webfont) 
[![devDependencies Status](https://david-dm.org/itgalaxy/webfont/dev-status.svg)](https://david-dm.org/itgalaxy/webfont?type=dev)

Generator of font from SVG icons.

Features:

-   Supported font formats: WOFF2, WOFF, EOT, TTF and SVG.

-   Support configuration Files - use a JavaScript, JSON or YAML file to specify configuration information 
    for an entire directory and all of its subdirectories.

-   Supported browsers: IE8+.

-   Generates CSS files allows to use custom templates.

-   CLI.

## Install

```shell
npm install --save-dev webfont
```

## Usage

```js
const webfont = require('webfont').default

webfont({
  files: 'src/svg-icons/**/*.svg',
  fontName: 'my-font-name'
})
    .then((result) => {
        console.log(result);
    });
```

Or

```js
import webfont from 'webfont';

webfont({
  files: 'src/svg-icons/**/*.svg',
  fontName: 'my-font-name'
})
    .then((result) => {
        console.log(result);
    });
```

## Options

### `files`

A file glob, or array of file globs. 
Ultimately passed to [node-glob](https://github.com/isaacs/node-glob) to figure out what files you want to lint.

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

### `cssTemplateClassName`

Type: `string`
Default: `null`

Default font class name.

### `cssTemplateFontPath`

Type: `string`
Default: `./`

Path to generated fonts in the `CSS` file.

### `cssTemplateFontName`

Type: `string`

Default value getting from `fontName` options, but you can specify any value.

### `glyphTransformFn`

Type: `function`
Default: `null`

If you need transform glyph metadata (e.g. titles of CSS classes) before transferred in style template 
for your icons, you can use this option with glyphs metadata object.

Example:

```js
glyphTransformFn: (obj) => {
    obj.name += '_transform';
}
```

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

### Options

```bash
  Generator of fonts from svg icons, svg icons to svg font, svg font to ttf, ttf to eot, ttf to woff, ttf to woff2

  Usage
      $ webfont [input] [options]

  Input
      Files(s) or glob(s).
      If an input argument is wrapped in quotation marks, it will be passed to node-glob
      for cross-platform glob support.

  Options
      --config                       Path to a specific configuration file (JSON, YAML, or CommonJS)
                                     or the name of a module in `node_modules` that points to one.
                                     If no `--config` argument is provided, webfont will search for
                                     configuration  files in the following places, in this order:
                                         - a `webfont` property in `package.json`
                                         - a `.webfontrc` file (with or without filename extension:
                                             `.json`, `.yaml`, and `.js` are available)
                                         - a `webfont.config.js` file exporting a JS object
                                     The search will begin in the working directory and move up the
                                     directory tree until a configuration file is found.
      -f, --font-name                The font family name you want, default: "webfont".
      -h, --help                     Output usage information.
      -v, --version                  Output the version number.
      -r, --formats                  Only this formats generate.
      -d, --dest                     Destination for generated fonts (directory).
      -t, --template                 Type of styles ('css', 'scss') or path to custom template.
      -s, --dest-styles              Destination for generated styles (directory). If not passed used `dest` argument.
      -c, --css-template-class-name  Class name in css template.
      -p, --css-template-font-path   Font path in css template.
      -n, --css-template-font-name   Font name in css template.
      --verbose                      Tell me everything!.

  For "svgicons2svgfont":
      --font-id                      The font id you want, default as "--font-name".
      --font-style                   The font style you want.
      --font-weight                  The font weight you want.
      --fixed-width                  Creates a monospace font of the width of the largest input icon.
      --center-horizontally          Calculate the bounds of a glyph and center it horizontally.
      --normalize                    Normalize icons by scaling them to the height of the highest icon.
      --font-height                  The outputted font height [MAX(icons.height)].
      --round                        Setup the SVG path rounding [10e12].
      --descent                      The font descent [0].
      --ascent                       The font ascent [height - descent].
      --start-unicode                The start unicode codepoint for unprefixed files [0xEA01].
      --prepend-unicode              Prefix files with their automatically allocated unicode codepoint.
      --metadata                     Content of the metadata tag.
```

### Exit codes

The CLI can exit the process with the following exit codes:

-   0: All ok.
-   1: Something unknown went wrong.
-   Other: related to using packages.

## Related

-   [svgicons2svgfont](https://github.com/nfroidure/svgicons2svgfont) - Simple tool to merge multiple 
    icons to an SVG font.

-   [svg2ttf](https://github.com/fontello/svg2ttf) - Converts SVG fonts to TTF format.

-   [ttf2eot](https://github.com/fontello/ttf2eot) - Converts TTF fonts to EOT format.

-   [ttf2woff](https://github.com/fontello/ttf2woff) - Converts TTF fonts to WOFF format.

-   [ttf2woff2](https://github.com/nfroidure/ttf2woff2) - Converts TTF fonts to WOFF2.

## Roadmap

-   The ability to generate from any type to any type.
-   Rewrite on ecma6, without `babel` compilation.
-   More tests, include CLI test.
-   Option `glyphTransformFn` should return object, not change passed.
-   Improved docs.
-   Reduce package size (maybe implement `ttf2woff2` with native js library).
-   Improve performance (maybe use cache for this).
-   Implement `webpack` loader.
-   Close all issues.

## Contribution

Feel free to push your code if you agree with publishing under the MIT license.

## [Changelog](CHANGELOG.md)

## [License](LICENSE)
