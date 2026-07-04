import { readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitepress";

const repo = "https://github.com/itgalaxy/webfont";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const migrationDir = resolve(root, "docs/migration");

const firstHeading = (file: string): string => {
  const match = readFileSync(file, "utf8").match(/^#\s+(.+?)\s*$/m);
  return match ? match[1].replace(/`/g, "") : file;
};

const migrationFiles = readdirSync(migrationDir)
  .filter((name) => name.endsWith(".md") && name !== "README.md")
  .sort();

// Read each migration doc in place (no copy) and expose it at /migrating/<name>.
const migrationRewrites = Object.fromEntries(
  migrationFiles.map((name) => [`docs/migration/${name}`, `migrating/${name}`]),
);

const migrationSidebar = migrationFiles.map((name) => ({
  text: firstHeading(resolve(migrationDir, name)),
  link: `/migrating/${name.replace(/\.md$/, "")}`,
}));

export default defineConfig({
  lang: "en-US",
  title: "webfont",
  description: "Generate fonts from SVG icons — with TTF encoding and WOFF/WOFF2 decoding.",
  cleanUrls: true,
  lastUpdated: true,
  ignoreDeadLinks: true,
  // The repo root holds vite.config.ts for the library build; VitePress must not
  // load it as its own Vite config (it is ESM-only under "type":"commonjs").
  vite: { configFile: false },
  srcExclude: [
    "AGENTS.md",
    "NOTICE.md",
    "docs/adr/**",
    "docs/migration/README.md",
    "coverage/**",
    "temp/**",
    "demo/**",
    "public/**",
  ],
  rewrites: {
    "README.md": "introduction/getting-started.md",
    "FEATURES.md": "introduction/features.md",
    "TROUBLESHOOTING.md": "introduction/troubleshooting.md",
    "CHANGELOG.md": "introduction/whats-new.md",
    "CONTRIBUTING.md": "contributing/guidelines.md",
    "CODE_OF_CONDUCT.md": "contributing/code-of-conduct.md",
    "MIGRATION.md": "migrating/index.md",
    ...migrationRewrites,
  },
  head: [
    ["meta", { name: "theme-color", content: "#0b0b0c" }],
    ["meta", { property: "og:title", content: "webfont" }],
    ["meta", { property: "og:description", content: "Generate fonts from SVG icons." }],
  ],
  themeConfig: {
    nav: [
      { text: "Guide", link: "/introduction/getting-started" },
      { text: "Migrating", link: "/migrating/" },
      { text: "What's New", link: "/introduction/whats-new" },
      { text: "npm", link: "https://www.npmjs.com/package/webfont" },
    ],
    sidebar: [
      {
        text: "Introduction",
        items: [
          { text: "Getting Started", link: "/introduction/getting-started" },
          { text: "Demo", link: "/demo" },
          { text: "Features", link: "/introduction/features" },
          { text: "Troubleshooting", link: "/introduction/troubleshooting" },
          { text: "What's New", link: "/introduction/whats-new" },
        ],
      },
      {
        text: "Migrating",
        items: [{ text: "Overview", link: "/migrating/" }, ...migrationSidebar],
      },
      {
        text: "Contributing",
        items: [
          { text: "Guidelines", link: "/contributing/guidelines" },
          { text: "Code of Conduct", link: "/contributing/code-of-conduct" },
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
