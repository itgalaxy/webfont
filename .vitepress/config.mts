import { readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitepress";
import { applyMarkdownLinkRewrites } from "./rewriteMarkdownLinks.mts";

const repo = "https://github.com/itgalaxy/webfont";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const migrationDir = resolve(root, "docs/migration");

// Read each migration doc in place (no copy) and expose it at /migrating/<name>.
// They are not listed in the sidebar; the single "Migrating" page (MIGRATION.md)
// links to them, so keeping the routes built keeps those links working.
const migrationRewrites = Object.fromEntries(
  readdirSync(migrationDir)
    .filter((name) => name.endsWith(".md") && name !== "README.md")
    .map((name) => [`docs/migration/${name}`, `migrating/${name}`]),
);

const pageRewrites = {
  "README.md": "introduction/getting-started.md",
  "FEATURES.md": "introduction/features.md",
  "TROUBLESHOOTING.md": "introduction/troubleshooting.md",
  "NOTICE.md": "introduction/licenses.md",
  "packages/webfont/CHANGELOG.md": "introduction/whats-new.md",
  "CONTRIBUTING.md": "contributing/guidelines.md",
  "CODE_OF_CONDUCT.md": "contributing/code-of-conduct.md",
  "docs/migration/README.md": "contributing/migration-guide.md",
  "MIGRATION.md": "migrating/index.md",
  "packages/webfont/docs/cli.md": "introduction/cli.md",
  "packages/webfont/install.md": "introduction/install.md",
  "packages/webfont/docs/configuration.md": "introduction/configuration.md",
  "packages/webfont/docs/grunt.md": "introduction/grunt.md",
  "packages/webfont/NOTICE.md": "introduction/licenses.md",
  ...migrationRewrites,
} as const;

const staticRepoLinks = {
  LICENSE: `${repo}/blob/master/LICENSE`,
  "packages/webfont/LICENSE": `${repo}/blob/master/packages/webfont/LICENSE`,
} as const;

export default defineConfig({
  lang: "en-US",
  title: "webfont",
  description: "Generate fonts from SVG icons — with TTF encoding and WOFF/WOFF2 decoding.",
  cleanUrls: true,
  lastUpdated: true,
  ignoreDeadLinks: true,
  // packages/webfont/vite.config.ts is for the library build; VitePress must not
  // load it as its own Vite config (it is ESM-only under "type":"commonjs").
  vite: { configFile: false },
  srcExclude: [
    "AGENTS.md",
    "CLAUDE.md",
    "MAINTAINERS.md",
    "docs/adr/**",
    "coverage/**",
    "packages/webfont/temp/**",
    "packages/webfont/demo/**",
    "packages/webfont/src/**",
    "packages/webfont/templates/**",
    "public/**",
  ],
  rewrites: pageRewrites,
  markdown: {
    config(md) {
      applyMarkdownLinkRewrites(md, pageRewrites, root, staticRepoLinks);
    },
  },
  head: [
    ["meta", { name: "theme-color", content: "#0b0b0c" }],
    ["meta", { property: "og:title", content: "webfont" }],
    ["meta", { property: "og:description", content: "Generate fonts from SVG icons." }],
  ],
  themeConfig: {
    nav: [
      { text: "Guide", link: "/introduction/getting-started" },
      { text: "Install", link: "/introduction/install" },
      { text: "Configuration", link: "/introduction/configuration" },
      { text: "CLI", link: "/introduction/cli" },
      { text: "What's New", link: "/introduction/whats-new" },
      { text: "npm", link: "https://www.npmjs.com/package/webfont" },
    ],
    sidebar: [
      {
        text: "Introduction",
        items: [
          { text: "Getting Started", link: "/introduction/getting-started" },
          { text: "Install", link: "/introduction/install" },
          { text: "Configuration", link: "/introduction/configuration" },
          { text: "Grunt", link: "/introduction/grunt" },
          { text: "CLI Reference", link: "/introduction/cli" },
          { text: "Demo", link: "/demo" },
          { text: "Features", link: "/introduction/features" },
          { text: "Troubleshooting", link: "/introduction/troubleshooting" },
          { text: "What's New", link: "/introduction/whats-new" },
          { text: "Migrating", link: "/migrating/" },
          { text: "Legal Notices", link: "/introduction/licenses" },
        ],
      },
      {
        text: "Contributing",
        items: [
          { text: "Guidelines", link: "/contributing/guidelines" },
          { text: "Code of Conduct", link: "/contributing/code-of-conduct" },
          { text: "Migration Docs", link: "/contributing/migration-guide" },
          { text: "Reporting a Bug", link: `${repo}/blob/master/.github/ISSUE_TEMPLATE/bug_report.md` },
          { text: "Pull Request Template", link: `${repo}/blob/master/.github/pull_request_template.md` },
        ],
      },
    ],
    socialLinks: [{ icon: "github", link: repo }],
    search: { provider: "local" },
    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © itgalaxy",
    },
  },
});
