# webfont — Legal notice

This document covers **copyright and licensing for fonts you process**, **disclaimers** about using the webfont software, **community attribution guidelines**, and **third-party open-source components** bundled with or used by this project.

It does **not** replace the [MIT License](./LICENSE) for the webfont source code. If anything here conflicts with `LICENSE`, `LICENSE` governs the software itself.

**This is not legal advice.** When in doubt about a font or icon license, consult the rights holder or qualified counsel.

---

## 1. webfont software license

The **webfont** program (source code, CLI, and npm package) is licensed under the **[MIT License](./LICENSE)**.

Copyright (c) 2016–present [itgalaxy](https://github.com/itgalaxy).

You may use, copy, modify, and distribute the **software** under the terms of `LICENSE`, provided the copyright and permission notice are preserved in copies or substantial portions.

---

## 2. Disclaimer of warranties and limitation of liability

THE WEBFONT SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.

IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

**You are solely responsible** for how you use webfont, what files you pass into it, and what you do with the output.

---

## 3. Fonts and icons you provide (user content)

webfont is a **technical tool**. It does **not**:

- grant any copyright, trademark, or distribution rights in fonts or icons;
- change the license terms of input or output files;
- verify that you have permission to use, modify, decompress, convert, or redistribute any font or SVG;
- remove or replace copyright or license metadata embedded in font files (name tables, etc.).

### 3.1 SVG icon input

If you build a font from **`.svg` icons**, you must have the right to use those artworks (your own work, licensed stock, client assets with permission, open-source icons under compatible terms, etc.).

Generated font files may be subject to the same restrictions as the source icons and to any third-party notices you embed via options such as `metadata` / `copyright`.

### 3.2 WOFF / WOFF2 decompression

If you **decompress** one or more `.woff` or `.woff2` files (from disk or from an `http(s)` URL) to `.ttf` or `.otf`, you are extracting the **SFNT payload** inside each container. That operation:

- does **not** make a restricted or commercial font free to use or share;
- does **not** bypass foundry EULAs, app terms of service, CDN hotlinking policies, or site download terms;
- may produce files that are **easier to reuse** than the original webfonts — compliance with the **original font license** remains your obligation;
- does **not** merge multiple weights into one font file — each input yields a separate output.

**Only process fonts you are authorized to use and download** under their license. For remote URLs, you must also have permission to fetch and store those bytes.

### 3.3 Redistribution of output

Publishing, shipping, or sublicensing fonts produced or extracted with webfont (in apps, websites, PDFs, design assets, npm packages, etc.) is **your responsibility**. The MIT license on webfont does **not** apply to those font files.

---

## 4. Community attribution guidelines

These guidelines help the community use and reference webfont fairly. They are **social expectations**, not additional legal terms beyond `LICENSE`.

### 4.1 Using webfont in your project

- **No attribution required** for normal use (install via npm, run in CI, internal tooling) under the MIT License.
- **Appreciated** when webfont is a visible part of a product, tutorial, or open-source repo: mention [webfont](https://github.com/itgalaxy/webfont) and link to the repository or [npm package](https://www.npmjs.com/package/webfont).

### 4.2 Tutorials, posts, and courses

When documenting a workflow that centers on webfont, please:

- name the tool (**webfont**) and link to the official repo or npm page;
- distinguish **webfont the software** (MIT) from **fonts you demonstrate** (which may be proprietary);
- avoid implying **endorsement** by itgalaxy unless you have written permission.

### 4.3 Forks, wrappers, and hosted services

If you redistribute webfont code, ship a fork, or offer a hosted “font converter” built on webfont:

- comply with the **MIT License** (retain copyright and permission notice);
- do **not** use the itgalaxy name, logo, or webfont branding to suggest official affiliation without permission;
- provide **your own** terms and privacy policy for user-uploaded fonts; make clear that **users** must have rights to their files.

### 4.4 Citing underlying libraries

webfont builds on several open-source font libraries (see [Section 5](#5-third-party-open-source-dependencies)). If you publish academic work, a detailed case study, or compliance documentation that discusses **how** conversion is implemented, consider citing those libraries alongside webfont.

---

## 5. Third-party open-source dependencies

webfont depends on the following **runtime** npm packages (direct dependencies). Versions follow `package.json` / `package-lock.json` at release time.

| Package | Typical license | Role in webfont |
|---------|-----------------|-----------------|
| [cosmiconfig](https://github.com/cosmiconfig/cosmiconfig) | MIT | Configuration file discovery |
| [deepmerge](https://github.com/TehShrike/deepmerge) | MIT | Option merging |
| [fontverter](https://github.com/papandreou/fontverter) | BSD-3-Clause | WOFF/WOFF2 → SFNT decompression |
| [globby](https://github.com/sindresorhus/globby) | MIT | Input file globbing |
| [meow](https://github.com/sindresorhus/meow) | MIT | CLI argument parsing |
| [nunjucks](https://github.com/mozilla/nunjucks) | BSD-2-Clause | CSS / SCSS / Styl templates |
| [p-limit](https://github.com/sindresorhus/p-limit) | MIT | Concurrency limiting |
| [parse-json](https://github.com/sindresorhus/parse-json) | MIT | JSON parsing |
| [resolve-from](https://github.com/sindresorhus/resolve-from) | MIT | Module resolution |
| [svg2ttf](https://github.com/fontello/svg2ttf) | MIT | SVG font → TTF |
| [svgicons2svgfont](https://github.com/nfroidure/svgicons2svgfont) | MIT | SVG icons → SVG font |
| [ttf2eot](https://github.com/fontello/ttf2eot) | MIT | TTF → EOT |
| [ttf2woff](https://github.com/fontello/ttf2woff) | MIT | TTF → WOFF |
| [wawoff2](https://github.com/fontello/wawoff2) | MIT | TTF ↔ WOFF2 compression |
| [xml2js](https://github.com/Leonidas-from-XIV/node-xml2js) | MIT | SVG XML parsing |

Transitive dependencies (and their licenses) are recorded in `package-lock.json`. For a full license report after install, you can run:

```shell
npx license-checker --production --direct
```

(Third-party tool; not maintained by this project.)

### BSD-licensed components

**fontverter** (BSD-3-Clause) and **nunjucks** (BSD-2-Clause) are subject to their own copyright notices and license terms. Redistributions of webfont that include source or substantial portions of those dependencies should preserve their respective notices as required by those licenses.

---

## 6. Test fixtures and examples

Font and SVG files under `src/fixtures/` are intended **for automated tests and documentation examples** only. They are not a grant of rights to use those assets outside this repository. Do not assume fixture fonts or icons are redistributable for your own products.

---

## 7. Keeping this document current

Update **NOTICE.md** in the same pull request when you:

- add or remove **runtime dependencies** that affect licensing or attribution;
- change **user-facing behavior** around font decompression or output formats in ways that affect legal expectations;
- publish new **community guidelines** for attribution or acceptable use.

See also [FEATURES.md](./FEATURES.md) (product capabilities) and [CONTRIBUTING.md](./CONTRIBUTING.md) (documentation expectations).

---

## 8. Questions and reports

- **Software bugs and features:** [GitHub Issues](https://github.com/itgalaxy/webfont/issues)
- **Code of conduct:** [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
- **License of the webfont source:** [LICENSE](./LICENSE)

For font licensing questions about **your** input files, contact the font foundry, vendor, or rights holder — maintainers cannot advise on third-party font EULAs.
