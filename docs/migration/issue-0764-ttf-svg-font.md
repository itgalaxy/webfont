# TTF to SVG font encoding ([#764](https://github.com/itgalaxy/webfont/issues/764))

**Minimum version:** *pending*

## What changed

In **TTF encoding mode**, `svg` is now a valid **output format**: a `.ttf` file can be
converted to a legacy **SVG font** (glyph outlines + metrics as XML). It is produced in
pure JavaScript via [`fonteditor-core`](https://github.com/kekee000/fonteditor-core) — no
Java or FontForge.

`svg` is **opt-in**: the default TTF output stays `woff` + `woff2` when SVG-pipeline
`formats` are still configured.

## Before

TTF input rejected `formats: ["svg"]`:

```
formats must include at least one of "ttf", "eot", "woff", or "woff2" when converting TTF input
```

To get an SVG font from a TTF you needed an external tool (FontForge, `uipoet/webfonts`, etc.).

## After

```shell
webfont path/to/font.ttf -d dist/fonts -f svg
```

Programmatic:

```js
const result = await webfont({
  files: "fonts/MyFont.ttf",
  formats: ["svg"],
});
// result.svg → SVG font as a string
```

Batch runs expose the SVG font per input on `result.transcodedFonts`
(`{ source, svg?, ttf?, eot?, woff?, woff2? }[]`). The CLI writes `<name>.svg`.

A run whose `formats` contains **no** encoder output (for example `["otf"]`) still rejects,
now with `svg` listed:

```
formats must include at least one of "svg", "ttf", "eot", "woff", or "woff2" when converting TTF input
```

## Workaround on older versions

Use an external converter until upgrade (both require a Java/native toolchain):

```shell
# FontForge
fontforge -lang=ff -c 'Open($1); Generate($2)' font.ttf font.svg
```

## After upgrading

```shell
npm install webfont@<version>
webfont "fonts/*.ttf" -d dist/webfonts -f svg --dest-create
```
