---
layout: home

hero:
  name: webfont
  text: Ship icon sets as one font
  tagline: Turn SVG icons into WOFF2, WOFF, TTF, EOT, and SVG fonts at build time. CLI, Node API, or a local MCP server. Pure JavaScript, no native toolchain.
  actions:
    - theme: brand
      text: Get Started
      link: /introduction/install
    - theme: alt
      text: Demo
      link: /demo
    - theme: alt
      text: View on GitHub
      link: https://github.com/itgalaxy/webfont

features:
  - title: One artifact, many glyphs
    details: Ship a single WOFF2 or TTF instead of a growing folder of SVG files. Fewer assets to download, cache, and keep in sync.
  - title: Built for growing sets
    details: Design systems rarely stay at a handful of icons. Icon fonts keep pace when the library expands; a pile of SVGs does not.
  - title: Runtime as a string
    details: Reference glyphs by class name or codepoint. Drive icons from the backend or config without a network request per image URL.
  - title: CLI, API, and local MCP
    details: Run webfont in CI or scripts, call webfont() from Node, or use the private monorepo MCP so agents convert SVGs without shelling out by hand.
---

## When SVG starts to hurt

A small, stable icon set can live happily as SVG. The friction shows up on the **growth curve**: every new icon is another file in the bundle, another asset to version, and another thing to fetch or embed.

An icon font packs many glyphs into **one** build-time artifact. You still author SVGs; webfont turns that folder into fonts and optional CSS templates, but apps and sites consume a font, not a herd of images.

## Monochrome by design

Icon fonts paint each glyph with **one** color (via `color` / `currentColor`). That is what makes them flexible in UI: tint nav, buttons, and states without exporting variants.

Multi-tone or richly filled illustrations do not map cleanly onto a single glyph. Keep those as SVG (or another format) where the craft needs more than one fill.

## A practical hybrid

Most product icons are single-color navigation, actions, and status. Generate those with webfont.

Reserve SVG for the few marks that need dual tone or fine multi-color detail. That keeps the common path light and the exceptions intentional, without pretending every icon belongs in a font.

Also available: encode an existing TTF into web formats, or decompress WOFF/WOFF2 back to the embedded TTF/OTF. See [Features](/introduction/features) and [Configuration](/introduction/configuration).

[Install webfont](/introduction/install) · [See the live demo](/demo)
