# Flutter

webfont runs in Node.js at build time. A Flutter app does not call `webfont()`. Copy the generated TrueType file into the app and declare it under `flutter: fonts:`.

This page describes the **current format overlap**. Loading a webfont-generated TTF inside a Flutter app is still an open check - see [#895](https://github.com/itgalaxy/webfont/issues/895).

## Formats

[Flutter’s custom-font guide](https://docs.flutter.dev/cookbook/design/fonts) loads `.ttf`, `.otf`, and `.ttc`. The [`TextStyle` docs](https://api.flutter.dev/flutter/painting/TextStyle-class.html) state that `.woff` and `.woff2` are not supported on every platform. `FontLoader` expects uncompressed SFNT (TTF or OTF). A `.woff2` listed under `flutter: fonts:` does not draw glyphs.

Green marks are files the SVG icon pipeline already writes. Amber marks are formats we do not emit yet. Each of those links to the issue that tracks adding them.

<table class="format-board">
  <thead>
    <tr>
      <th>Format</th>
      <th>webfont</th>
      <th>Flutter <code>fonts:</code></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>.ttf</code></td>
      <td><span class="fmt fmt-yes">Generated</span></td>
      <td><span class="fmt fmt-yes">Ship this file</span></td>
    </tr>
    <tr>
      <td><code>.woff2</code></td>
      <td><span class="fmt fmt-yes">Generated</span></td>
      <td><span class="fmt fmt-skip">Leave out of the app</span></td>
    </tr>
    <tr>
      <td><code>.woff</code></td>
      <td><span class="fmt fmt-yes">Generated</span></td>
      <td><span class="fmt fmt-skip">Leave out of the app</span></td>
    </tr>
    <tr>
      <td><code>.eot</code></td>
      <td><span class="fmt fmt-yes">Generated</span></td>
      <td><span class="fmt fmt-skip">Leave out of the app</span></td>
    </tr>
    <tr>
      <td><code>.svg</code></td>
      <td><span class="fmt fmt-yes">Generated</span></td>
      <td><span class="fmt fmt-skip">Leave out of the app</span></td>
    </tr>
    <tr>
      <td><code>.otf</code></td>
      <td><a class="fmt fmt-plan" href="https://github.com/itgalaxy/webfont/issues/905">Planned · #905</a></td>
      <td><span class="fmt fmt-yes">Flutter can load it</span></td>
    </tr>
    <tr>
      <td><code>.ttc</code></td>
      <td><a class="fmt fmt-plan" href="https://github.com/itgalaxy/webfont/issues/906">Planned · #906</a></td>
      <td><span class="fmt fmt-yes">Flutter can load it</span></td>
    </tr>
  </tbody>
</table>

<style>
.format-board {
  width: 100%;
  border-collapse: collapse;
  margin: 1.25rem 0 1.5rem;
}
.format-board th,
.format-board td {
  padding: 0.7rem 0.85rem;
  vertical-align: middle;
  border-bottom: 1px solid var(--vp-c-divider);
}
.format-board th {
  text-align: left;
  font-size: 0.8rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--vp-c-text-2);
}
.fmt {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.2rem 0.75rem;
  font-size: 0.82rem;
  font-weight: 650;
  line-height: 1.4;
  text-decoration: none;
}
.fmt-yes {
  background: var(--vp-c-green-soft);
  color: var(--vp-c-green-1);
}
.fmt-yes::before {
  content: "";
  width: 0.45rem;
  height: 0.45rem;
  margin-right: 0.45rem;
  border-radius: 999px;
  background: var(--vp-c-green-1);
}
.fmt-plan {
  background: var(--vp-c-warning-soft);
  color: var(--vp-c-warning-1);
}
.fmt-plan:hover {
  text-decoration: underline;
}
.fmt-plan::before {
  content: "";
  width: 0.45rem;
  height: 0.45rem;
  margin-right: 0.45rem;
  border-radius: 999px;
  background: var(--vp-c-warning-1);
}
.fmt-skip {
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-2);
}
</style>

Ask for TTF only so the build matches what the app can load. Format rules: [Configuration → formats](../packages/webfont/docs/configuration.md#formats).

If the input is already a `.woff` or `.woff2`, decompress it to the SFNT inside (TTF, or OTF when the container holds CFF) and ship that file. See [Features](../FEATURES.md#woff--woff2-container-decompression).

## Generate a TTF icon font

```shell
npx webfont "icons/*.svg" --fontName MyIcons --formats ttf --template json --dest fonts --dest-create
```

The same options through the API:

```js
import { webfont, writeResultFiles } from "webfont";

const result = await webfont({
  files: "icons/**/*.svg",
  fontName: "MyIcons",
  formats: ["ttf"],
  template: "json",
  dest: "fonts",
  destCreate: true,
});

await writeResultFiles(result);
```

That writes:

- `fonts/MyIcons.ttf` - the font file Flutter loads
- `fonts/MyIcons.json` - one entry per icon, including the Private Use Area code point

`fontName` becomes the file name and the name stored in the font. The `family` string in `pubspec.yaml` is what `IconData.fontFamily` must match. Use the same name in both places (`MyIcons` above).

The `json` template is the code-point map. Flutter does not use the CSS, SCSS, Stylus, or HTML templates. With the default `startUnicode` (`0xEA01`) and ligatures left off, the map looks like this:

```json
[
  {
    "id": "arrow-left",
    "name": "Arrow Left",
    "unicode": ["ea01"]
  }
]
```

`id` is the SVG file name without `.svg`. `unicode[0]` is the hexadecimal code point (`ea01` means `U+EA01`). Read this file after each generation. Glyph order follows the input files, so a hardcoded code point goes stale when icons are added or renamed.

## Use the font in Flutter

Place `MyIcons.ttf` in the Flutter project (the `fonts/` directory next to `pubspec.yaml` in this example) and declare the family:

```yaml
flutter:
  fonts:
    - family: MyIcons
      fonts:
        - asset: fonts/MyIcons.ttf
```

Draw an icon with `IconData`. The code point comes from `unicode[0]` in `MyIcons.json`:

```dart
import 'package:flutter/widgets.dart';

class AppIcons {
  static const fontFamily = 'MyIcons';

  static const arrowLeft = IconData(0xEA01, fontFamily: fontFamily);
}
```

```dart
Icon(AppIcons.arrowLeft)
```

`AppIcons.fontFamily` must equal the `family` value in `pubspec.yaml`.

One TTF from the SVG pipeline is a single weight. Declare `weight` or `style` in `pubspec.yaml` only when you ship a separate file for that weight or style. Flutter will synthesize bold or italic when the matching file is missing, and the result will not match a designed weight.

## Still to verify

[#895](https://github.com/itgalaxy/webfont/issues/895) tracks a real Flutter run: rendering a Private Use Area glyph, baseline and ascent, and mobile versus desktop versus Flutter Web. Until that lands, treat this page as the format recipe, not as a tested Flutter integration.
