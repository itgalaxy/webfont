# Install webfont

Generate icon fonts from SVG files at **build time** with the `webfont` CLI or the Node.js `webfont()` API. This guide covers install, wiring, optional config, and a first successful run.

## Requirements

- **Node.js** >= 24.14.0 (`engines` in `package.json`; CI tests Node 24.x and 26.x)
- **Build-time only** — use npm scripts, the CLI, or Node build hooks. Do not import webfont from browser or React client bundles ([troubleshooting](../../TROUBLESHOOTING.md#cant-resolve-fs-webpack--react--vite-client-bundle)).

Check your Node version:

```shell
node --version
```

## Install

### npm (recommended for projects)

From your project root:

```shell
npm install --save-dev webfont
```

### Homebrew (macOS / Linux CLI)

**Recommended** — [homebrew-core](https://github.com/Homebrew/homebrew-core) (no tap):

```shell
brew install webfont
```

If Homebrew reports that no formula named `webfont` exists, refresh the index first:

```shell
brew update
brew install webfont
```

Homebrew installs the published npm tarball and requires the `node` formula. Verify the CLI:

```shell
webfont --version
```

**Monorepo tap (optional)** — use when you want the `webfonts` alias or a formula change before it lands in core ([#769](https://github.com/itgalaxy/webfont/issues/769)):

```shell
brew tap itgalaxy/webfont https://github.com/itgalaxy/webfont
brew install webfont
```

The alias `webfonts` works only in the tap:

```shell
brew install webfonts
```

**Switching from tap to core** — if you already installed from `itgalaxy/webfont` and want the core formula:

```shell
brew uninstall webfont
brew untap itgalaxy/webfont
brew update
brew install webfont
```

For library use inside a Node project, prefer the npm dev dependency above.

## Verify

**CLI (npm project)**

```shell
npx webfont --version
```

**CLI (Homebrew)**

```shell
webfont --version
```

**Programmatic API** — prefer the named export:

```shell
node --input-type=module -e "import { webfont } from 'webfont'; console.log(typeof webfont)"
```

Expected: `function`. CommonJS also works: `const { webfont } = require("webfont")`.

On webfont **12.x+**, default ESM import is callable too; `{ webfont }` remains the recommended form for new code.

## Use the CLI

Add a script to `package.json`:

```json
{
  "scripts": {
    "webfont": "node node_modules/webfont/dist/cli.mjs"
  }
}
```

On Windows-heavy teams, [cross-env](https://www.npmjs.com/package/cross-env) avoids path issues:

```json
{
  "scripts": {
    "webfont": "cross-env node_modules/webfont/dist/cli.mjs"
  }
}
```

Run with `npm run webfont -- <flags>` (`--` forwards arguments to the CLI).

All flags: [CLI reference](https://webfont.js.org/introduction/cli) · [source](./docs/cli.md)

## Use the programmatic API

```js
import { webfont } from "webfont";

const result = await webfont({
  files: "src/icons/**/*.svg",
  fontName: "my-icons",
  formats: ["woff2"],
});

// result.woff2, result.ttf, result.template, …
```

Full options: [Configuration](./docs/configuration.md) · [docs site](https://webfont.js.org/introduction/configuration)

## Configuration files

Store defaults in cosmiconfig instead of repeating flags every run. When no explicit path is given, webfont searches **upward from the working directory**:

1. `webfont` key in `package.json`
2. `.webfontrc` (`.json`, `.yaml`, or `.js`)
3. `webfont.config.js`

**`package.json`**

```json
{
  "webfont": {
    "files": "src/icons/**/*.svg",
    "fontName": "my-icons",
    "formats": ["woff2"],
    "template": "css",
    "dest": "dist/fonts"
  }
}
```

**`webfont.config.js`**

```js
export default {
  files: "src/icons/**/*.svg",
  fontName: "my-icons",
  formats: ["woff2"],
  template: "css",
  dest: "dist/fonts",
};
```

Point to a specific file with CLI `--config` or API `configFile`. After a run, `result.config.filePath` shows which file was loaded (output metadata only — do not set this in config).

## First run

Put at least one `.svg` in `icons/` (e.g. `icons/star.svg`).

**CLI**

```shell
npm run webfont -- "./icons/*.svg" -d dist/fonts -f woff2 -t css -u my-icons --dest-create
```

**API** — write buffers yourself (the API does not write to disk unless you use the CLI flow):

```js
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { webfont } from "webfont";

const dest = "dist/fonts";
await mkdir(dest, { recursive: true });

const result = await webfont({
  files: "icons/*.svg",
  fontName: "my-icons",
  formats: ["woff2"],
  template: "css",
});

await writeFile(path.join(dest, "my-icons.woff2"), result.woff2);
if (result.template) {
  await writeFile(path.join(dest, "my-icons.css"), result.template);
}
```

Confirm output:

```shell
ls dist/fonts/
```

You should see `my-icons.woff2` and, with `-t css`, `my-icons.css`.

## Tips

- **Pipelines** are mutually exclusive per run: `.svg` (icon font), `.ttf` (encode), or `.woff`/`.woff2` (decompress). See [Capabilities at a glance](../../README.md#capabilities-at-a-glance).
- **Font rights:** you must be allowed to process every input file. See [NOTICE.md](./NOTICE.md).
- **Webpack:** prefer the [webpack plugin](https://github.com/itgalaxy/webfont-webpack-plugin) or call webfont from a Node build script, not from client bundles.

## Related

- [Configuration](./docs/configuration.md) — all `webfont()` options
- [Features](../../FEATURES.md) — what is stable, in progress, or planned
- [Troubleshooting](../../TROUBLESHOOTING.md) — common errors on the current release
- [Migration](../../MIGRATION.md) — upgrading from older webfont versions

This file lives at `packages/webfont/install.md` in the monorepo and ships on npm as `webfont/install.md` for tooling such as [install.md](https://install.md/).
