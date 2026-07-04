import { defineConfig } from "vitepress";

const repo = "https://github.com/itgalaxy/webfont";

export default defineConfig({
  lang: "en-US",
  title: "webfont",
  description: "Generate fonts from SVG icons — with TTF encoding and WOFF/WOFF2 decoding.",
  cleanUrls: true,
  lastUpdated: true,
  srcExclude: ["adr/**", "migration/**"],
  head: [
    ["meta", { name: "theme-color", content: "#0b0b0c" }],
    ["meta", { property: "og:title", content: "webfont" }],
    ["meta", { property: "og:description", content: "Generate fonts from SVG icons." }],
  ],
  themeConfig: {
    nav: [
      { text: "Guide", link: "/guide/" },
      { text: "npm", link: "https://www.npmjs.com/package/webfont" },
      { text: "Changelog", link: `${repo}/blob/master/CHANGELOG.md` },
    ],
    sidebar: {
      "/guide/": [
        {
          text: "Guide",
          items: [{ text: "Getting Started", link: "/guide/" }],
        },
      ],
    },
    socialLinks: [{ icon: "github", link: repo }],
    search: { provider: "local" },
    editLink: {
      pattern: `${repo}/edit/master/docs/:path`,
      text: "Edit this page on GitHub",
    },
    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © itgalaxy",
    },
  },
});
