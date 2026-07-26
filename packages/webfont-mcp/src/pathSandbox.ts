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
  const target = isAbsolute(inputPath) ? resolve(inputPath) : resolve(root, inputPath);

  // Prevent sandbox escape via symlinks by resolving the nearest existing parent.
  let probe = target;
  while (true) {
    try {
      const realProbe = resolve(realpathSync.native(probe));
      const relReal = relative(root, realProbe);
      if (relReal.startsWith("..") || isAbsolute(relReal)) {
        throw new PathSandboxError(`Path "${inputPath}" is outside workspace root "${root}"`);
      }
      break;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "ENOENT") {
        throw error;
      }

      const parent = resolve(probe, "..");
      if (parent === probe) {
        break;
      }
      probe = parent;
    }
  }

  const relTarget = relative(root, target);
  if (relTarget.startsWith("..") || isAbsolute(relTarget)) {
    throw new PathSandboxError(`Path "${inputPath}" is outside workspace root "${root}"`);
  }

  return target;
};

export const assertPathWithinRoot = (absolutePath: string, workspaceRoot: string): void => {
  resolvePathWithinRoot(absolutePath, workspaceRoot);
};
