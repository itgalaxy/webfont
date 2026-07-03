# ESM default import `import webfont from "webfont"` (#618)

**Minimum version:** *pending* — ships with the next 12.x release that adds the ESM build.

## What changed

webfont now ships a real **ESM build** (`dist/index.mjs`) alongside the existing CommonJS build (`dist/index.js`). The `exports` field routes `import` to the ESM file and `require` to the CJS file, so `import webfont from "webfont"` returns the callable function instead of the module namespace object.

## Before

On 12.1.0 and earlier, both the `import` and `require` conditions of `package.json#exports` pointed at the same CJS file (`./dist/index.js`). Node's CJS→ESM interop handed ESM callers the whole `module.exports` object as the default import, so a default import was **not callable**:

```js
import webfont from "webfont";

await webfont({ files: "icons/*.svg" });
// TypeError: webfont is not a function
// (https://github.com/itgalaxy/webfont/issues/618)
```

## After

- `import webfont from "webfont"` → the `webfont` function (callable).
- `import { webfont } from "webfont"` → still works (named export).
- `const { webfont } = require("webfont")` → still works (CJS named export).

Both interops are now guarded on every PR and on release by the `test:pack` script (`scripts/pack-smoke-test.mjs`), which runs `npm pack`, installs the tarball into throwaway ESM and CJS consumer projects, and asserts each import shape can generate a real `woff2` from fixtures. This prevents future regressions of `package.json#exports`, `files`, or the ESM/CJS build outputs from shipping to npm.

## Workaround on older versions

Use the **named import** instead of the default import — no upgrade required:

```js
import { webfont } from "webfont";

await webfont({ files: "icons/*.svg" });
```

With `require`:

```js
const { webfont } = require("webfont");

await webfont({ files: "icons/*.svg" });
```

## After upgrading

```shell
npm install webfont@latest
```

Both default and named imports now work:

```js
import webfont from "webfont";

await webfont({ files: "icons/*.svg" });
```
