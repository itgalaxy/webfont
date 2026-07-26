# Grunt integration

Use [webfont](https://github.com/itgalaxy/webfont) from [Grunt](https://gruntjs.com/) as a replacement for the archived [`grunt-webfont`](https://github.com/sapegin/grunt-webfont) plugin. No separate webfont Grunt package is published — register a small custom task in **your** project that calls `webfont()` and `writeResultFiles()` (the same disk-write helper the CLI uses).

This repository does **not** ship a Grunt workspace or install `grunt` as a dependency ([ADR 0014](../../../docs/adr/0014-no-grunt-webfont-recipe-workspace.md)).

## When to use this

- You still run **Grunt** in a legacy project and want a maintained, pure-JS icon font generator.
- You do **not** need FontForge, BEM/Bootstrap CSS presets, or `data:uri` embedding from grunt-webfont (see [parity gaps](#parity-gaps-vs-grunt-webfont) below).

For new projects, prefer **npm scripts**, **Vite**, or the [webpack plugin](https://github.com/itgalaxy/webfont-webpack-plugin) instead of Grunt.

## Install

In the consumer project (not this monorepo):

```shell
npm install --save-dev webfont grunt grunt-cli
```

## Custom task (recommended)

Example `Gruntfile.cjs`:

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

Pass any [`webfont()` option](./configuration.md) in the object above — `formats`, `template`, `normalize`, `ligatures`, `metadataProvider`, `ttfPostProcess`, and so on. Set `dest` and `destCreate: true` so `writeResultFiles` can create the output directory.

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

| grunt-webfont | webfont custom task |
|---------------|---------------------|
| Native Grunt task config | Custom task + `webfont()` options |
| FontForge engine | Pure JS (`svg2ttf`) |
| BEM / Bootstrap CSS presets | Custom [Nunjucks template](./configuration.md#template) |
| `embed` (data:uri in CSS) | Not built-in — use a custom template |
| `codepointsFile` | Use `metadataProvider` or manage codepoints in your own file |
| `autoHint` | Opt-in via `ttfPostProcess` + external `ttfautohint` ([#749](https://github.com/itgalaxy/webfont/issues/749)) |

Full comparison: [MIGRATION.md — grunt-webfont](../../../MIGRATION.md#comparison-with-grunt-webfont).

## Official Grunt plugin?

Not planned unless demand shows up ([#771](https://github.com/itgalaxy/webfont/issues/771)). Copying the snippet above keeps maintenance low while covering the common SVG → webfont workflow.

## Related

- [Install guide](../install.md)
- [Configuration](./configuration.md)
- [Troubleshooting](../../../TROUBLESHOOTING.md)
- [ADR 0014](../../../docs/adr/0014-no-grunt-webfont-recipe-workspace.md)
