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

Both interops are now guarded on every PR and on release by `npm run test:package`, a three-layer validation of the built tarball (see [ADR 0012](../adr/0012-published-package-validation.md)):

1. `publint` — lints `package.json#exports`, `files`, `main`, `module`, `types`, and condition ordering.
2. `@arethetypeswrong/cli` (attw) — probes types resolution under node10, node16 (from CJS), node16 (from ESM), and bundler.
3. `scripts/pack-smoke-test.mjs` — packs, installs the tarball into throwaway ESM and CJS consumer projects, and asserts each import shape can generate a real `woff2` from fixtures.

This prevents future regressions of `package.json#exports`, `files`, `types`, or the ESM/CJS build outputs from shipping to npm.

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
