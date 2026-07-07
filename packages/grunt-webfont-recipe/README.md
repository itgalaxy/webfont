# Grunt recipe — webfont

Use [webfont](https://github.com/itgalaxy/webfont) from [Grunt](https://gruntjs.com/) as a replacement for the archived [`grunt-webfont`](https://github.com/sapegin/grunt-webfont) plugin. No separate npm package is required — register a small custom task that calls `webfont()` and `writeResultFiles()` (the same disk-write helper the CLI uses).

## When to use this

- You still run **Grunt** in a legacy project and want a maintained, pure-JS icon font generator.
- You do **not** need FontForge, BEM/Bootstrap CSS presets, or `data:uri` embedding from grunt-webfont (see [parity gaps](#parity-gaps-vs-grunt-webfont) below).

For new projects, prefer **npm scripts**, **Vite**, or the [webpack plugin](https://github.com/itgalaxy/webfont-webpack-plugin) instead of Grunt.

## Install

```shell
npm install --save-dev webfont grunt grunt-cli
```

## Custom task (recommended)

`Gruntfile.cjs` in this folder is a minimal working example:

```js
"use strict";

const path = require("node:path");
const { webfont, writeResultFiles } = require("webfont");

module.exports = function (grunt) {
  grunt.registerTask("webfont", "Generate icon fonts from SVG sources", function () {
    const done = this.async();
    const dest = path.resolve("dist/fonts");

    void (async () => {
      try {
        const result = await webfont({
          files: path.join(__dirname, "icons/**/*.svg"),
          fontName: "icons",
          formats: ["woff2"],
          template: "css",
          dest,
          destCreate: true,
        });

        await writeResultFiles(result);
        grunt.log.ok(`Wrote fonts to ${dest}`);
        done();
      } catch (error) {
        grunt.log.error(error instanceof Error ? error.message : String(error));
        done(false);
      }
    })();
  });

  grunt.registerTask("default", ["webfont"]);
};
```

Run:

```shell
npx grunt webfont
```

Outputs `dist/fonts/icons.woff2` and `dist/fonts/icons.css` (built-in CSS template).

### Options

Pass any [`webfont()` option](https://webfont.js.org/introduction/configuration) in the object above — `formats`, `template`, `normalize`, `ligatures`, `metadataProvider`, `ttfPostProcess`, and so on. Set `dest` and `destCreate: true` so `writeResultFiles` can create the output directory.

## Alternative: shell out to the CLI

If you prefer not to import the API:

```js
grunt.registerTask("webfont", "Generate icon fonts via CLI", function () {
  const done = this.async();
  grunt.util.spawn(
    {
      cmd: "npx",
      args: [
        "webfont",
        "icons/**/*.svg",
        "-d",
        "dist/fonts",
        "-f",
        "woff2",
        "-t",
        "css",
        "-u",
        "icons",
        "--dest-create",
      ],
    },
    (error) => done(error === null),
  );
});
```

## Parity gaps vs grunt-webfont

| grunt-webfont | webfont recipe |
|---------------|----------------|
| Native Grunt task config | Custom task + `webfont()` options |
| FontForge engine | Pure JS (`svg2ttf`) |
| BEM / Bootstrap CSS presets | Custom [Nunjucks template](https://webfont.js.org/introduction/configuration#template) |
| `embed` (data:uri in CSS) | Not built-in — use a custom template |
| `codepointsFile` | Use `metadataProvider` or manage codepoints in your own file |
| `autoHint` | Opt-in via `ttfPostProcess` + external `ttfautohint` ([#749](https://github.com/itgalaxy/webfont/issues/749)) |

Full comparison: [MIGRATION.md — grunt-webfont](../../MIGRATION.md#comparison-with-grunt-webfont).

## Official Grunt plugin?

Not planned unless demand shows up ([#771](https://github.com/itgalaxy/webfont/issues/771)). This recipe keeps maintenance low while covering the common SVG → webfont workflow.

## Related

- [Install guide](../webfont/install.md)
- [Configuration](../webfont/docs/configuration.md)
- [Troubleshooting](../../TROUBLESHOOTING.md)
