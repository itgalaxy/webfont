import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { convertSvgsToFont } from "./convertSvgsToFont.js";
import { diagnoseSvgs } from "./diagnoseSvgs.js";
import { formatWebfontOptionsReference } from "./listWebfontOptionsContent.js";
import { PathSandboxError } from "./pathSandbox.js";

const formatSchema = z.enum(["eot", "otf", "woff", "woff2", "svg", "ttf"]);

const toolError = (error: unknown) => {
  let message: string;
  if (error instanceof Error) {
    message = error.message;
  } else {
    message = String(error);
  }

  return {
    content: [
      {
        type: "text" as const,
        text: message,
      },
    ],
    isError: true,
  };
};

export const createWebfontMcpServer = (): McpServer => {
  const server = new McpServer(
    {
      name: "webfont-mcp",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.registerTool(
    "convert_svgs_to_font",
    {
      description:
        "Convert SVG icon files to webfont outputs (woff2, css templates, etc.) using the webfont pipeline and write files to disk.",
      inputSchema: {
        centerHorizontally: z.boolean().optional().describe("Center glyphs horizontally in the em box"),
        centerVertically: z.boolean().optional().describe("Center glyphs vertically in the em box"),
        dest: z.string().describe("Output directory relative to workspaceRoot or absolute within it"),
        destCreate: z.boolean().optional().describe("Create dest when missing"),
        files: z.array(z.string()).min(1).describe("Glob patterns for SVG inputs, resolved within workspaceRoot"),
        fontName: z.string().optional().describe('Base font name (default "webfont")'),
        formats: z.array(formatSchema).optional().describe('Output formats (default ["woff2"])'),
        normalize: z.boolean().optional().describe("Normalize glyph height"),
        svgToolsDiagnose: z.boolean().optional().describe("Attach svgDiagnostics to the conversion result"),
        template: z.string().optional().describe('Built-in or custom template (for example "css")'),
        workspaceRoot: z
          .string()
          .optional()
          .describe("Sandbox root for path resolution (defaults to cwd or WEBFONT_MCP_WORKSPACE_ROOT)"),
      },
    },
    async (input) => {
      try {
        const result = await convertSvgsToFont(input);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "diagnose_svgs",
    {
      description:
        "Inspect SVG inputs for common icon-font issues (stroke-only paths, evenodd fill, unsupported elements, use references).",
      inputSchema: {
        files: z.array(z.string()).min(1).describe("Glob patterns for SVG inputs, resolved within workspaceRoot"),
        workspaceRoot: z.string().optional().describe("Sandbox root for path resolution"),
      },
    },
    async (input) => {
      try {
        const result = await diagnoseSvgs(input);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "list_webfont_options",
    {
      description: "List webfont() defaults, common options, and MCP tool summaries for agents.",
      inputSchema: {},
    },
    async () => ({
      content: [
        {
          type: "text",
          text: formatWebfontOptionsReference(),
        },
      ],
    }),
  );

  return server;
};

export { PathSandboxError };
