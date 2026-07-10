import { buildWebfontOptionsReference } from "webfont";

const MCP_TOOLS = {
  convert_from_was:
    "Loads a .was config (path or inline JSON), maps it with mapWasConfigToWebfontOptions, runs webfont(), and writes outputs.",
  convert_svgs_to_font: "Runs webfont() on sandboxed globs and writes outputs with writeResultFiles().",
  diagnose_svgs: "Runs diagnoseSvgContents on matched SVG files without building a font.",
  list_webfont_options:
    "Returns defaults, CLI flag metadata, API-only option summaries, and MCP tool summaries from the webfont core.",
  validate_was_config:
    "Parses and guards a .was config without running webfont(); returns sandboxed configs and mapped webfont() options.",
} as const;

const MCP_NOTES = [
  "Stroke-only SVGs need glyphContentTransformFn preprocessing; webfont does not bundle svg-outline-stroke.",
  "Use diagnose_svgs or svgTools.diagnose before convert_svgs_to_font when icons look wrong in the font.",
  "Paths must stay inside workspaceRoot; absolute paths outside the root are rejected.",
  "`.was` configs use dest/files/name/template; map with mapWasConfigToWebfontOptions or validate_was_config before convert_from_was.",
  "Legacy `.was` files may store the icon prefix in fontName; prefer prefix for new configs (see docs/migration/issue-0797-was-prefix-field.md).",
] as const;

export const buildMcpOptionsReference = () => ({
  ...buildWebfontOptionsReference(),
  mcpTools: MCP_TOOLS,
  notes: MCP_NOTES,
});

export const formatWebfontOptionsReference = (): string => JSON.stringify(buildMcpOptionsReference(), null, 2);
