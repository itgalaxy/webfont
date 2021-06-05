# webfont

[![NPM version](https://img.shields.io/npm/v/webfont.svg)](https://www.npmjs.org/package/webfont)
[![Travis Build Status](https://img.shields.io/travis/itgalaxy/webfont/master.svg?label=build)](https://travis-ci.org/itgalaxy/webfont)
[![Build status](https://ci.appveyor.com/api/projects/status/a8absovr2r44w1oc?svg=true)](https://ci.appveyor.com/project/evilebottnawi/webfont)

Generator of fonts from SVG icons.

## Features

- Supported font formats: `WOFF2`, `WOFF`, `EOT`, `TTF` and `SVG`;
- Support config files: use a `JavaScript`, `JSON` or `YAML` file to specify configuration information for an entire directory and all of its subdirectories;
- Support all popular browsers, including IE8+;
- Allows using custom templates (example `css`, `scss`, [`styl`](https://github.com/itgalaxy/webfont/pull/164/) etc);
- No extra dependencies as `gulp`, `grunt` or other big tools;
- Tested on all platforms (`linux`, `windows` and `osx`);
- CLI;
- [Webpack plugin](https://github.com/itgalaxy/webfont-webpack-plugin).

## Table Of Contents

- [Webfont](#webfont)
  - [Installation](#installation)
  - [Usage](#usage)
  - [Options](#options)
  - [svgicons2svgfont](#svgicons2svgfont)
- [Command Line Interface (CLI)](#command-line-interface)
  - [Installation](#cli-installation)
  - [Usage](#cli-usage)
  - [Exit Codes](#cli-exit-codes)
- [Related](#related)
- [Roadmap](#roadmap)
- [Contribution](#contribution)
- [Changelog](#changelog)
- [License](#license)

---

## Installation

```shell
npm install --save-dev webfont
```

## Usage

```js
import webfont from "webfont";

webfont({
  files: "src/svg-icons/**/*.svg",
  fontName: "my-font-name",
})
  .then((result) => {
    // Do something with result
    Function.prototype(result);
    // Or return it
    return result;
  })
  .catch((error) => {
    throw error;
  });
```

or

```js
const webfont = require("webfont").default;

webfont({
  files: "src/svg-icons/**/*.svg",
  fontName: "my-font-name",
})
  .then((result) => {
    // Do something with result
    Function.prototype(result);
    // Or return it
    return result;
  })
  .catch((error) => {
    throw error;
  });
```

### Options

#### `files`

- Type: `string` | `array`
- Description: A file glob, or array of file globs. Ultimately passed to [fast-glob](https://github.com/mrmlnc/fast-glob) to figure out what files you want to get.
- Note: `node_modules` and `bower_components` are always ignored.

#### `configFile`

- Type: `string`
- Description: Path to a specific configuration file `(JSON, YAML, or CommonJS)` or the name of a module in `node_modules` that points to one.
- Note: If you do not provide `configFile`, webfont will search up the directory tree for configuration file in the following places, in this order:
  1. a `webfont` property in `package.json`
  2. a `.webfontrc` file (with or without filename extension: `.json`, `.yaml`, and `.js` are available)
  3. a `webfont.config.js` file exporting a JS `object`.
     The search will begin in the working directory and move up the directory tree until it finds a configuration file.

#### `fontName`

- Type: `string`
- Default: `webfont`
- Description: The font family name you want.

#### `formats`

- Type: `array`,
- Default: `['svg', 'ttf', 'eot', 'woff', 'woff2']`,
- Possible values: `svg, ttf, eot, woff, woff2`,
- Description: Font file types to generate.

#### `template`

- Type: `string`
- Default: `null`
- Possible values: `css`, `scss`, [`styl`](https://github.com/itgalaxy/webfont/pull/164/) (feel free to contribute more).
- Note: If you want to use a custom template use this option pass in a path `string` like this:

  ```js
  webfont({
    template: "./path/to/my-template.css",
  });
  ```

  Or

  ```js
  webfont({
    template: path.resolve(__dirname, "./my-template.css"),
  });
  ```

  Or

  ```js
  webfont({
    template: path.resolve(__dirname, "./my-template.styl"),
  });
  ```

#### `templateClassName`

- Type: `string`
- Default: `null`
- Description: Default font class name.

#### `templateFontPath`

- Type: `string`
- Default: `./`
- Description: Path to generated fonts in the `CSS` file.

#### `templateFontName`

- Type: `string`
- Default: Gets is from `fontName` if not set, but you can specify any value.
- Description: Template font family name you want.

#### `glyphTransformFn`

- Type: `function`
- Default: `null`
- Description: If you want to transform glyph metadata (e.g. titles of CSS classes or unicode) before transferring it in your style template for your icons, you can use this option with glyphs metadata object.
- Example:

  ```js
  import webfont from "webfont";

  webfont({
    files: "src/svg-icons/**/*.svg",
    glyphTransformFn: (obj) => {
      obj.name += "_transform";
      something();

      return obj;
    },
  })
    .then((result) => {
      // Do something with result
      Function.prototype(result);
      // Or return it
      return result;
    })
    .catch((error) => {
      throw error;
    });
  ```

#### `sort`

- Type: `bool`
- Default: `true`
- Description: Whether you want to sort the icons sorted by name.

---

## svgicons2svgfont

### svgicons2svgfont options

These can be appended to [webfont options](#options). These are passed directly to [svgicons2svgfont](https://github.com/nfroidure/svgicons2svgfont).

#### `svgicons2svgfont.fontName`

- Type: `string`
- Default: Taken from the [webfont fontName option](#fontname)
- Description: The font family name you want.

#### `svgicons2svgfont.fontId`

- Type: `string`
- Default: The `fontName` value
- Description: The font id you want.

#### `svgicons2svgfont.fontStyle`

- Type: `string`
- Default: `''`
- Description: The font style you want.

#### `svgicons2svgfont.fontWeight`

- Type: `string`
- Default: `''`
- Description: The font weight you want.

#### `svgicons2svgfont.fixedWidth`

- Type: `boolean`
- Default: `false`
- Description: Creates a monospace font of the width of the largest input icon.

#### `svgicons2svgfont.centerHorizontally`

- Type: `boolean`
- Default: `false`
- Description: Calculate the bounds of a glyph and center it horizontally.

#### `svgicons2svgfont.normalize`

- Type: `boolean`
- Default: `false`
- Description: Normalize icons by scaling them to the height of the highest icon.

#### `svgicons2svgfont.fontHeight`

- Type: `number`
- Default: `MAX(icons.height)`
- Description: The outputted font height (defaults to the height of the highest input icon).

#### `svgicons2svgfont.round`

- Type: `number`
- Default: `10e12` Setup SVG path rounding.

#### `svgicons2svgfont.descent`

- Type: `number`
- Default: `0`
- Description: The font descent. It is useful to fix the font baseline yourself.
- Warning: The descent is a positive value!.

#### `svgicons2svgfont.ascent`

- Type: `number`
- Default: `fontHeight - descent`
- Description: The font ascent. Use this options only if you know what you're doing. A suitable value for this is computed for you.

#### `svgicons2svgfont.metadata`

- Type: `string`
- Default: `undefined`
- Description: The font [metadata](http://www.w3.org/TR/SVG/metadata.html).
  You can set any character data in, but this is the recommended place for a copyright mention.

#### `svgicons2svgfont.log`

- Type: `function`
- Default: `console.log`
- Description: Allows you to provide your own logging function. Set to `function(){}` to disable logging.

---

## Command Line Interface

The interface for command-line usage is fairly simplistic at this stage, as seen in the following usage section.

### CLI Installation

Add the `cli` script to your `package.json` file's `scripts` object:

```json
{
  "scripts": {
    "webfont": "node node_modules/webfont/dist/cli.js"
  }
}
```

If you're using cross-env:

```json
{
  "scripts": {
    "webfont": "cross-env node_modules/webfont/dist/cli.js"
  }
}
```

### CLI Usage

```shell
    Usage: webfont [input] [options]

    Input: File(s) or glob(s).

        If an input argument is wrapped in quotation marks, it will be passed to "fast-glob"
        for cross-platform glob support.

    Options:

        --config

            Path to a specific configuration file (JSON, YAML, or CommonJS)
            or the name of a module in \`node_modules\` that points to one.
            If no \`--config\` argument is provided, webfont will search for
            configuration  files in the following places, in this order:
               - a \`webfont\` property in \`package.json\`
               - a \`.webfontrc\` file (with or without filename extension:
                   \`.json\`, \`.yaml\`, and \`.js\` are available)
               - a \`webfont.config.js\` file exporting a JS object
            The search will begin in the working directory and move up the
            directory tree until a configuration file is found.

        -f, --font-name

            The font family name you want, default: "webfont".

        -h, --help

            Output usage information.

        -v, --version

            Output the version number.

        -r, --formats

            Only this formats generate.

        -d, --dest

            Destination for generated fonts.

        -m, --dest-create
            Create destination directory if it does not exist.

        -t, --template

            Type of template (\`css\`, \`scss\`, \`styl\`) or path to custom template.
'
        -s, --dest-template

            Destination for generated template. If not passed used \`dest\` argument value.

        -c, --template-class-name

            Class name in css template.

        -p, --template-font-path

            Font path in css template.

        -n, --template-font-name

            Font name in css template.

        --no-sort

            Keeps the files in the same order of entry

        --verbose

            Tell me everything!.

    For "svgicons2svgfont":

        --font-id

            The font id you want, default as "--font-name".

        --font-style

            The font style you want.

        --font-weight

            The font weight you want.

        --fixed-width

            Creates a monospace font of the width of the largest input icon.

        --center-horizontally

            Calculate the bounds of a glyph and center it horizontally.

        --normalize

            Normalize icons by scaling them to the height of the highest icon.

        --font-height

            The outputted font height [MAX(icons.height)].

        --round

            Setup the SVG path rounding [10e12].

        --descent

            The font descent [0].

        --ascent

            The font ascent [height - descent].

        --start-unicode

            The start unicode codepoint for files without prefix [0xEA01].

        --prepend-unicode

            Prefix files with their automatically allocated unicode codepoint.

        --metadata

            Content of the metadata tag.

        --add-hash-in-font-url

            Generated font url will be : [webfont].[ext]?v=[hash]

```

### CLI Exit Codes

The CLI can exit the process with the following exit codes:

- 0: All ok.
- 1: Something unknown went wrong.
- Other: related to using packages.

---

## Related

- [Webpack plugin](https://github.com/itgalaxy/webfont-webpack-plugin) - `webpack` plugin.
- [svgicons2svgfont](https://github.com/nfroidure/svgicons2svgfont) - Simple tool to merge multiple icons to an SVG font.
- [svg2ttf](https://github.com/fontello/svg2ttf) - Converts SVG fonts to TTF format.
- [ttf2eot](https://github.com/fontello/ttf2eot) - Converts TTF fonts to EOT format.
- [ttf2woff](https://github.com/fontello/ttf2woff) - Converts TTF fonts to WOFF format.
- [wawoff2](https://github.com/fontello/wawoff2) - Converts TTF fonts to WOFF2 and versa vice.

## Roadmap

- The ability to generate from any type to any type;
- More tests, include CLI test;
- Improved docs;
- Reduce package size (maybe implement `ttf2woff2` with native js library);
- Improve performance (maybe use cache for this).

## Contribution

Feel free to push your code if you agree with publishing under the MIT license.

## Changelog

Check our [Changelog](CHANGELOG.md)

## License

Check our [License](LICENSE)
