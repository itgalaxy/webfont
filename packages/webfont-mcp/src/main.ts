#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createWebfontMcpServer } from "./createServer.js";

const server = createWebfontMcpServer();
const transport = new StdioServerTransport();

await server.connect(transport);
