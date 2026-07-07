import { buildWebfontOptionsReference } from "webfont";

const MCP_TOOLS = {
  convert_svgs_to_font: "Runs webfont() on sandboxed globs and writes outputs with writeResultFiles().",
  diagnose_svgs: "Runs diagnoseSvgContents on matched SVG files without building a font.",
  list_webfont_options:
    "Returns defaults, CLI flag metadata, and API-only option summaries from the webfont core.",
} as const;

const MCP_NOTES = [
  "Stroke-only SVGs need glyphContentTransformFn preprocessing; webfont does not bundle svg-outline-stroke.",
  "Use diagnose_svgs or svgTools.diagnose before convert_svgs_to_font when icons look wrong in the font.",
  "Paths must stay inside workspaceRoot; absolute paths outside the root are rejected.",
] as const;

export const buildMcpOptionsReference = () => ({
  ...buildWebfontOptionsReference(),
  mcpTools: MCP_TOOLS,
  notes: MCP_NOTES,
});

export const formatWebfontOptionsReference = (): string => JSON.stringify(buildMcpOptionsReference(), null, 2);
