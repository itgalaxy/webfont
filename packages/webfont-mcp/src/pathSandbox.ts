import { realpathSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";

export class PathSandboxError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PathSandboxError";
  }
}

export const getWorkspaceRoot = (input?: string): string => {
  const candidate = input ?? process.env.WEBFONT_MCP_WORKSPACE_ROOT ?? process.cwd();
  return resolve(realpathSync.native(candidate));
};

export const resolvePathWithinRoot = (inputPath: string, workspaceRoot: string): string => {
  const root = getWorkspaceRoot(workspaceRoot);
  let target: string;
  if (isAbsolute(inputPath)) {
    target = resolve(inputPath);
  } else {
    target = resolve(root, inputPath);
  }
  const rel = relative(root, target);

  if (rel.startsWith("..") || isAbsolute(rel)) {
    throw new PathSandboxError(`Path "${inputPath}" is outside workspace root "${root}"`);
  }

  return target;
};

export const assertPathWithinRoot = (absolutePath: string, workspaceRoot: string): void => {
  resolvePathWithinRoot(absolutePath, workspaceRoot);
};
