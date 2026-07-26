# webfont-mcp

Local [Model Context Protocol](https://modelcontextprotocol.io/) server (stdio) that exposes the **webfont** SVG→font pipeline to agents such as Cursor.

This package is **private** and **not published** to npm or any registry. It lives in the monorepo at `packages/webfont-mcp` without an npm scope.

## Prerequisites

- Node.js ≥ 24.14 (same as the webfont workspace)
- Built `webfont` package (`npm run build -w webfont`)

## Install (monorepo)

From the repository root:

```bash
npm install
npm run build -w webfont
npm run build -w webfont-mcp
```

## Run

```bash
npm run start -w webfont-mcp
```

Or directly:

```bash
node packages/webfont-mcp/dist/main.js
```

## Cursor configuration

This repository ships a portable project config at [`.cursor/mcp.json`](../../.cursor/mcp.json) using `${workspaceFolder}` (no machine-specific absolute paths). After building `webfont-mcp`, reload Cursor MCP servers.

To wire the same server into another icons project, copy or adapt:

```json
{
  "mcpServers": {
    "webfont": {
      "command": "node",
      "args": ["/absolute/path/to/webfont/packages/webfont-mcp/dist/main.js"],
      "env": {
        "WEBFONT_MCP_WORKSPACE_ROOT": "${workspaceFolder}"
      }
    }
  }
}
```

When `WEBFONT_MCP_WORKSPACE_ROOT` is omitted, the server sandboxes paths against the process working directory (Cursor usually sets this to the opened workspace).

## Tools

| Tool | Description |
|------|-------------|
| `convert_svgs_to_font` | Run `webfont()` on sandboxed SVG globs and write outputs with `writeResultFiles()` |
| `convert_from_was` | Load a `.was` config (path or inline JSON), map with `mapWasConfigToWebfontOptions`, run `webfont()`, and write outputs |
| `validate_was_config` | Parse and guard a `.was` config without building a font; returns sandboxed configs and mapped `webfont()` options |
| `diagnose_svgs` | Run `diagnoseSvgContents` on matched SVGs without building a font |
| `list_webfont_options` | JSON reference of defaults, CLI flags, API-only options, and MCP tool summaries |

Path arguments must stay inside `workspaceRoot`. The server returns file paths and metadata — not large base64 font payloads.

## Tests

Tests run **only in this package** (not in root `npm test`):

```bash
npm test -w webfont-mcp
```

## Related

- GitHub issue: [#720](https://github.com/itgalaxy/webfont/issues/720)
- Main library: `packages/webfont`
