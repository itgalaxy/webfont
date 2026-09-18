# webfont

[![NPM version](https://img.shields.io/npm/v/webfont.svg)](https://www.npmjs.org/package/webfont)
[![Node.js CI](https://github.com/itgalaxy/webfont/actions/workflows/pr.yml/badge.svg)](https://github.com/itgalaxy/webfont/actions/workflows/pr.yml)

Generator of fonts from SVG icons, with separate modes to **encode** TTF to web formats and **decompress** WOFF/WOFF2 containers to the TTF or OTF inside.

**Documentation site:** [webfont.js.org](https://webfont.js.org) — install, configuration, CLI, demos, and guides.

| Topic | Where |
|-------|--------|
| **Features** (stable / in-progress / planned) | [FEATURES.md](./FEATURES.md) |
| **Install & first run** | [packages/webfont/install.md](./packages/webfont/install.md) · [webfont.js.org/introduction/install](https://webfont.js.org/introduction/install) |
| **API & options** | [packages/webfont/docs/configuration.md](./packages/webfont/docs/configuration.md) · [webfont.js.org/introduction/configuration](https://webfont.js.org/introduction/configuration) |
| **CLI reference** | [packages/webfont/docs/cli.md](./packages/webfont/docs/cli.md) · [webfont.js.org/introduction/cli](https://webfont.js.org/introduction/cli) |
| **Troubleshooting** | [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) |
| **Migration** | [MIGRATION.md](./MIGRATION.md) |
| **Legal / licensing** | [packages/webfont/NOTICE.md](./packages/webfont/NOTICE.md) |

## Capabilities at a glance

Quick summary of the three pipelines webfont supports. Each run picks **one** mode from matched inputs — SVG icons, TTF encoding, or WOFF/WOFF2 decompression (they cannot be mixed).

| Mode | Input | Outputs | Notes |
|------|--------|---------|--------|
| **SVG icons** | One or more `.svg` files | `svg`, `ttf`, `eot`, `woff`, `woff2` | Default. Builds TrueType via `svg2ttf`. **`otf` is rejected** — use `ttf`. |
| **TTF encoding** | One or more `.ttf` files | `ttf`, `svg` (SVG font), `eot`, `woff`, and/or `woff2` per input | Auto-detected. Default when SVG-pipeline `formats` are still configured: `woff` + `woff2` (`svg` is opt-in). No templates. |
| **Webfont decompress** | One or more `.woff` / `.woff2` paths, globs, or `http(s)` URLs | `ttf` and/or `otf` per input | One output file per source (basename from filename; collisions get `-woff`/`-woff2`). Not a single merged font. |

**Not supported today**

- Renaming or re-wrapping without matching the real outline format (e.g. requesting `otf` when the WOFF2 holds TrueType).
- Converting TTF to OTF (or OTF to TTF) — use [FontForge](https://fontforge.org/) or similar.
- `.otf` as input for webfont encoding (TrueType `.ttf` only today).
- Templates, `glyphTransformFn`, `glyphContentTransformFn`, or merged multi-weight SFNT output in TTF encoding or webfont decompress mode.
- Globs that match extension-less or unsupported files together with fonts (the run fails instead of silently ignoring extras).

Every matched path must end in `.svg`, `.ttf`, `.woff`, or `.woff2`.

**Full capability list** — stability, behavior details, and test-backed criteria: **[FEATURES.md](./FEATURES.md)**.

### Font licensing

webfont is a technical tool. **Decompressing or generating fonts does not grant you any rights to those fonts.** You must have permission to use, convert, and redistribute every input file and every output file under the applicable license. The MIT license applies to **this software only**, not to fonts you pass through it. See **[NOTICE.md](./packages/webfont/NOTICE.md)**.

**Migrating from another tool?** See [MIGRATION.md](./MIGRATION.md#migrating-from-other-tools).

## Quick start

Requires **Node.js** >= 24.14.0. Install as a dev dependency and run at **build time** (not from browser or React client bundles):

```shell
npm install --save-dev webfont
```

On macOS or Linux you can also install the CLI with [Homebrew](https://brew.sh): `brew install webfont` ([homebrew-core](https://github.com/Homebrew/homebrew-core/pull/291610)). See [install guide](./packages/webfont/install.md#homebrew-macos--linux-cli).

```js
import { webfont } from "webfont";

const result = await webfont({
  files: "src/svg-icons/**/*.svg",
  fontName: "my-font-name",
});
```

**Next steps:** [Install guide](./packages/webfont/install.md) (CLI script, cosmiconfig, verification) · [Configuration reference](./packages/webfont/docs/configuration.md) · [npm package README](./packages/webfont/README.md) (what ships on npm).

Node.js only — do not import from client-side app code ([#198](https://github.com/itgalaxy/webfont/issues/198)).

## Repository layout

This is an **npm workspaces** monorepo. The published package lives in **`packages/webfont`** (`name: "webfont"` on npm). User-facing markdown for the docs site stays at the repo root; package-specific guides ship inside the tarball (`install.md`, `docs/configuration.md`, `docs/cli.md`, `NOTICE.md`, `LICENSE`).

**Homebrew:** `brew install webfont` from [homebrew-core](https://github.com/Homebrew/homebrew-core/pull/291610). The monorepo tap (`HomebrewFormula/webfont.rb`, `Aliases/webfonts`) is bumped automatically on release; a PR to homebrew-core is opened by CI when `HOMEBREW_COMMITTER_TOKEN` is configured (see [CONTRIBUTING.md](./CONTRIBUTING.md#homebrew-monorepo-tap--homebrew-core)).

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md), [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md), and [open issues](https://github.com/itgalaxy/webfont/issues). Pull requests use the [PR template](https://github.com/itgalaxy/webfont/blob/master/.github/pull_request_template.md).

## Related

- [Webpack plugin](https://github.com/itgalaxy/webfont-webpack-plugin)
- [svgicons2svgfont](https://github.com/nfroidure/svgicons2svgfont) · [svg2ttf](https://github.com/fontello/svg2ttf) · [ttf2eot](https://github.com/fontello/ttf2eot) · [ttf2woff](https://github.com/fontello/ttf2woff) · [wawoff2](https://github.com/fontello/wawoff2)
- [fontTools](https://github.com/fonttools/fonttools) — complementary Python toolkit for subsetting, variable fonts, and table editing after webfont generates the font.

## Changelog

[packages/webfont/CHANGELOG.md](./packages/webfont/CHANGELOG.md)

## License

The **webfont software** is licensed under the [MIT License](./LICENSE). That license does **not** apply to fonts or icons you process with the tool — see [NOTICE.md](./packages/webfont/NOTICE.md). A copy also ships at [packages/webfont/LICENSE](./packages/webfont/LICENSE) inside the npm package.


## 🌐 Web Resources & Aesthetic Symbols Index
- [SYM 2673](https://coquette-aesthetic-symbols-96.pages.dev/symbol/sym-2673/)
- [SYM 1D446](https://cyberpunk-clan-tags-49.pages.dev/symbol/sym-1d446/)
- [SYM 1D42D](https://alchemist-symbol-hub-29.pages.dev/symbol/sym-1d42d/)
- [SYM 2657](https://chibi-flower-emoticons-63.pages.dev/symbol/sym-2657/)
- [INSTAGRAM BIO](https://minimal-star-symbols-31.pages.dev/ja/instagram-bio/)
- [SYM 1F971](https://soft-angel-symbols-33.pages.dev/symbol/sym-1f971/)
- [SYM 26A5](https://anime-sparkle-text-24.pages.dev/symbol/sym-26a5/)
- [AESTHETIC STARDUST COMBO](https://balletcore-bio-symbols-63.pages.dev/symbol/aesthetic-stardust-combo/)
- [RIGHT POINTING DOUBLE ANGLE QUOTATION](https://aesthetic-bullet-points-76.pages.dev/symbol/right-pointing-double-angle-quotation/)
- [NATURE FLOWERS](https://geometric-bio-symbols-76.pages.dev/vi/nature-flowers/)
- [SYM 26C1](https://coquette-aesthetic-symbols-88.pages.dev/symbol/sym-26c1/)
- [SYM 1D420](https://neon-futuristic-symbols-20.pages.dev/symbol/sym-1d420/)
- [STARS](https://vintage-lace-text-53.pages.dev/es/stars/)
- [SYM 1F62D](https://soft-angel-symbols-21.pages.dev/symbol/sym-1f62d/)
- [SYM 26AE](https://angelic-bio-symbols-90.pages.dev/symbol/sym-26ae/)
- [SYM 265F](https://mystic-occult-fonts-26.pages.dev/symbol/sym-265f/)
- [KAOMOJI](https://coquette-aesthetic-symbols-71.pages.dev/ru/kaomoji/)
- [ROTATED HEART BULLET](https://kawaii-kaomoji-hub-12.pages.dev/symbol/rotated-heart-bullet/)
- [SYM 2734](https://coquette-aesthetic-symbols-29.pages.dev/symbol/sym-2734/)
- [HEARTS](https://clean-spacing-fonts-98.pages.dev/pt/hearts/)
- [RIGHTWARDS PAIRED HARPOON](https://pastel-princess-fonts-68.pages.dev/symbol/rightwards-paired-harpoon/)
- [SYM 26D8](https://pure-dot-symbols-31.pages.dev/symbol/sym-26d8/)
- [SYM 2610](https://cyber-clan-tags-85.pages.dev/symbol/sym-2610/)
- [SYM 26BE](https://angelic-coquette-text-10.pages.dev/symbol/sym-26be/)
- [ROYAL GOLD CROWN](https://cyber-clan-tags-15.pages.dev/symbol/royal-gold-crown/)
- [SYM 2731](https://cyber-clan-tags-68.pages.dev/symbol/sym-2731/)
- [STARS](https://vintage-bow-kaomoji-63.pages.dev/stars/)
- [SYM 1D46B](https://kawaii-kaomoji-hub-12.pages.dev/symbol/sym-1d46b/)
- [SYM 26A3](https://cyber-clan-tags-68.pages.dev/symbol/sym-26a3/)
- [SYM 1F92B](https://anime-sparkle-text-92.pages.dev/symbol/sym-1f92b/)
- [SYM 1F49D](https://vintage-lace-symbols-54.pages.dev/symbol/sym-1f49d/)
- [SYM 265D](https://pastel-princess-fonts-68.pages.dev/symbol/sym-265d/)
- [SYM 1F631](https://anime-sparkle-text-92.pages.dev/symbol/sym-1f631/)
- [SYM 1D494](https://moe-star-emoticons-13.pages.dev/symbol/sym-1d494/)
- [SYM 2626](https://moe-star-kaomoji-60.pages.dev/symbol/sym-2626/)
- [LIBRA ZODIAC SCALES](https://vintage-library-text-15.pages.dev/symbol/libra-zodiac-scales/)
- [SYM 1F62A](https://moe-star-emoticons-13.pages.dev/symbol/sym-1f62a/)
- [LEFT HEAVY BRACKET BOX](https://soft-angel-symbols-21.pages.dev/symbol/left-heavy-bracket-box/)
- [SYM 260E](https://lace-and-ribbon-text-61.pages.dev/symbol/sym-260e/)
- [TRENDING](https://kawaii-kaomoji-hub-12.pages.dev/trending/)
- [AQUARIUS ZODIAC WATER BEARER](https://mech-gaming-tags-18.pages.dev/symbol/aquarius-zodiac-water-bearer/)
- [SYM 1D41A](https://coquette-aesthetic-symbols-71.pages.dev/symbol/sym-1d41a/)
- [SYM 1D42C](https://alchemy-occult-symbols-55.pages.dev/symbol/sym-1d42c/)
- [SYM 1F641](https://minimal-star-symbols-89.pages.dev/symbol/sym-1f641/)
- [WHITE FLORETTE BLOSSOM](https://cyber-clan-tags-80.pages.dev/symbol/white-florette-blossom/)
- [SYM 2674](https://cyber-clan-tags-15.pages.dev/symbol/sym-2674/)
- [SYM 1D49F](https://moe-star-kaomoji-60.pages.dev/symbol/sym-1d49f/)
- [SYM 2749](https://vintage-lace-fonts-79.pages.dev/symbol/sym-2749/)
- [KAWAII KAOMOJI HUB 12.PAGES.DEV](https://kawaii-kaomoji-hub-12.pages.dev/)
- [SYM 26A3](https://pastel-kaomoji-vault-54.pages.dev/symbol/sym-26a3/)
- [SYM 26B4](https://pastel-chibi-emojis-45.pages.dev/symbol/sym-26b4/)
- [SYM 1D409](https://pastel-princess-fonts-68.pages.dev/symbol/sym-1d409/)
- [SYM 1D403](https://anime-sparkle-text-92.pages.dev/symbol/sym-1d403/)
- [SYM 1D42A](https://neon-futuristic-symbols-20.pages.dev/symbol/sym-1d42a/)
- [SYM 2666](https://clean-spacing-fonts-98.pages.dev/symbol/sym-2666/)
- [SYM 26E9](https://pastel-princess-fonts-68.pages.dev/symbol/sym-26e9/)
- [SKULL AND CROSSBONES](https://cyber-clan-tags-68.pages.dev/symbol/skull-and-crossbones/)
- [SYM 2620 FE0F](https://raven-gothic-text-44.pages.dev/symbol/sym-2620-fe0f/)
- [SYM 1D498](https://coquette-aesthetic-symbols-88.pages.dev/symbol/sym-1d498/)
- [SYM 1D40D](https://balletcore-bio-symbols-63.pages.dev/symbol/sym-1d40d/)
- [ZODIAC CELESTIAL](https://chibi-emotion-faces-74.pages.dev/pt/zodiac-celestial/)
- [SYM 2662](https://cyber-clan-tags-80.pages.dev/symbol/sym-2662/)
- [SYM 2625](https://kawaii-kaomoji-hub-12.pages.dev/symbol/sym-2625/)
- [SYM 1D400](https://neon-futuristic-symbols-20.pages.dev/symbol/sym-1d400/)
- [SYM 2629](https://angelic-coquette-text-10.pages.dev/symbol/sym-2629/)
- [SYM 2743](https://cyber-clan-tags-15.pages.dev/symbol/sym-2743/)
- [SYM 2743](https://vintage-runes-text-35.pages.dev/symbol/sym-2743/)
- [SYM 1F92F](https://kawaii-kaomoji-hub-12.pages.dev/symbol/sym-1f92f/)
- [SYM 1D49F](https://poetic-scroll-fonts-91.pages.dev/symbol/sym-1d49f/)
- [LATIN CROSS FAITH](https://soft-angel-symbols-61.pages.dev/symbol/latin-cross-faith/)
- [SYM 2612](https://simple-line-fonts-11.pages.dev/symbol/sym-2612/)
- [SYM 2764 FE0F 200D 1FA79](https://anime-sparkle-text-92.pages.dev/symbol/sym-2764-fe0f-200d-1fa79/)
- [SYM 1D48A](https://coquette-aesthetic-symbols-88.pages.dev/symbol/sym-1d48a/)
- [FIRST QUARTER WAXING MOON](https://vintage-angel-text-38.pages.dev/symbol/first-quarter-waxing-moon/)
- [SYM 26B1](https://occult-aesthetic-symbols-26.pages.dev/symbol/sym-26b1/)
- [TELUGU RIBBON BOWLET](https://coquette-aesthetic-symbols-71.pages.dev/symbol/telugu-ribbon-bowlet/)
- [SYM 26F0](https://vintage-bow-kaomoji-63.pages.dev/symbol/sym-26f0/)
- [ARROWS LINES](https://lace-bow-symbols-18.pages.dev/pt/arrows-lines/)
- [SYM 26C3](https://vintage-bow-kaomoji-63.pages.dev/symbol/sym-26c3/)
- [ES](https://kawaii-kaomoji-hub-12.pages.dev/es/)
- [QUARTER MUSICAL NOTE](https://baroque-aesthetic-symbols-59.pages.dev/symbol/quarter-musical-note/)
- [SYM 1D48D](https://chibi-kaomoji-vault-58.pages.dev/symbol/sym-1d48d/)
- [SYM 1FAE2](https://coquette-aesthetic-symbols-88.pages.dev/symbol/sym-1fae2/)
- [GOTHIC OBSIDIAN SKULL CREST](https://mech-gaming-tags-18.pages.dev/symbol/gothic-obsidian-skull-crest/)
- [SYM 1F979](https://glitch-font-studio-46.pages.dev/symbol/sym-1f979/)
- [LITTLE CAT PAWS KAOMOJI](https://coquette-aesthetic-symbols-62.pages.dev/symbol/little-cat-paws-kaomoji/)
- [DISCORD STATUS](https://mech-gaming-tags-18.pages.dev/vi/discord-status/)
- [BORDERS DIVIDERS](https://pastel-princess-fonts-68.pages.dev/vi/borders-dividers/)
- [SYM 2724](https://baroque-crown-unicode-60.pages.dev/symbol/sym-2724/)
- [SPRING TULIP BLOSSOM](https://chibi-emotion-faces-74.pages.dev/symbol/spring-tulip-blossom/)
- [STAR OPERATOR](https://kawaii-kaomoji-hub-51.pages.dev/symbol/star-operator/)
- [OUTLINED STAR](https://cyber-clan-tags-90.pages.dev/symbol/outlined-star/)
- [WHITE HEART](https://raven-gothic-text-44.pages.dev/symbol/white-heart/)
- [SYM 1D424](https://cyber-clan-tags-85.pages.dev/symbol/sym-1d424/)
- [LATIN CROSS HEAVY](https://cyber-clan-tags-90.pages.dev/symbol/latin-cross-heavy/)
- [SYM 2621](https://theeduplaycampen.pages.dev/symbol/sym-2621/)
- [SYM 1F92A](https://angelic-bio-symbols-59.pages.dev/symbol/sym-1f92a/)
- [SYM 1F609](https://mecha-hacker-kaomoji-26.pages.dev/symbol/sym-1f609/)
- [SYM 1D4A3](https://daintystar-font-studio-48.pages.dev/symbol/sym-1d4a3/)
- [ARROWS LINES](https://vintage-script-symbols-65.pages.dev/arrows-lines/)
- [SYM 26C0](https://kawaii-kaomoji-hub-12.pages.dev/symbol/sym-26c0/)
- [SYM 1F62E 200D 1F4A8](https://vintage-bow-kaomoji-63.pages.dev/symbol/sym-1f62e-200d-1f4a8/)
- [SYM 1F63F](https://occult-rune-symbols-64.pages.dev/symbol/sym-1f63f/)
- [NATURE FLOWERS](https://chibi-emoticon-lab-65.pages.dev/es/nature-flowers/)
- [BLACK STAR](https://clean-spacing-fonts-98.pages.dev/symbol/black-star/)
- [SYM 1F929](https://angelic-coquette-text-10.pages.dev/symbol/sym-1f929/)
- [TIKTOK CAPTIONS](https://clean-spacing-fonts-98.pages.dev/pt/tiktok-captions/)
- [LEFT MATHEMATICAL WHITE SQUARE BRACKET](https://anime-sparkle-text-14.pages.dev/symbol/left-mathematical-white-square-bracket/)
- [SYM 2685](https://vintage-runes-text-35.pages.dev/symbol/sym-2685/)
- [ROBLOX NAMES](https://classic-typewriter-symbols-19.pages.dev/vi/roblox-names/)
- [SYM 1F636](https://anime-sparkle-text-92.pages.dev/symbol/sym-1f636/)
- [SYM 26F3](https://baroque-crown-unicode-60.pages.dev/symbol/sym-26f3/)
- [SYM 1D484](https://alchemical-symbol-hub-52.pages.dev/symbol/sym-1d484/)
- [SYM 1F620](https://vintage-lace-text-53.pages.dev/symbol/sym-1f620/)
- [SYM 262D](https://vintage-runes-text-35.pages.dev/symbol/sym-262d/)
- [SYM 1D43E](https://vintage-bow-kaomoji-63.pages.dev/symbol/sym-1d43e/)
- [SYM 1F603](https://minimal-star-symbols-91.pages.dev/symbol/sym-1f603/)
- [SYM 2667](https://mecha-gamer-fonts-53.pages.dev/symbol/sym-2667/)
- [SYM 2617](https://coquette-aesthetic-symbols-88.pages.dev/symbol/sym-2617/)
- [BRACKETS](https://baroque-curse-text-56.pages.dev/pt/brackets/)
- [SYM 1D471](https://mecha-gamer-fonts-53.pages.dev/symbol/sym-1d471/)
- [SYM 26A5](https://pastel-princess-fonts-68.pages.dev/symbol/sym-26a5/)
- [SYM 1D49D](https://glitch-font-studio-46.pages.dev/symbol/sym-1d49d/)
- [SYM 1D467](https://cyber-clan-tags-75.pages.dev/symbol/sym-1d467/)
- [PINWHEEL STAR](https://moe-star-emoticons-13.pages.dev/symbol/pinwheel-star/)
- [SYM 26FF](https://anime-sparkle-text-73.pages.dev/symbol/sym-26ff/)
- [SYM 26EF](https://kawaii-kaomoji-hub-77.pages.dev/symbol/sym-26ef/)
- [SYM 1D44B](https://daintystar-font-studio-48.pages.dev/symbol/sym-1d44b/)
- [RADIOACTIVE SYMBOL](https://soft-bow-fonts-22.pages.dev/symbol/radioactive-symbol/)
- [SYM 26CD](https://mecha-gamer-fonts-53.pages.dev/symbol/sym-26cd/)
