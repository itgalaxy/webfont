import { dirname, relative, resolve } from "node:path";
import type MarkdownIt from "markdown-it";

const toSitePath = (rewrittenMd: string): string => {
  let path = rewrittenMd.replace(/\.md$/u, "");

  if (path.endsWith("/index")) {
    path = `${path.slice(0, -"/index".length)}/`;
  }

  return `/${path}`;
};

const isExternalHref = (href: string): boolean => /^https?:/iu.test(href) || href.startsWith("mailto:");

export const buildInverseRewrites = (rewrites: Record<string, string>): Record<string, string> =>
  Object.fromEntries(Object.entries(rewrites).map(([from, to]) => [to, from]));

/** Resolve href to a repo-relative path (e.g. `packages/webfont/install.md`). */
export const resolveRepoMarkdownPath = (hrefPath: string, pageSourcePath: string, repoRoot: string): string | undefined => {
  if (hrefPath.startsWith("/")) {
    return undefined;
  }

  const absolute = resolve(repoRoot, dirname(pageSourcePath), hrefPath);
  const repoRelative = relative(repoRoot, absolute).replace(/\\/gu, "/");

  if (repoRelative.startsWith("..")) {
    return undefined;
  }

  return repoRelative;
};

const lookupRewrite = (repoRelative: string, rewrites: Record<string, string>): string | undefined => {
  const direct = rewrites[repoRelative];

  if (direct) {
    return direct;
  }

  if (!repoRelative.endsWith(".md")) {
    return rewrites[`${repoRelative}.md`];
  }

  return undefined;
};

export const resolvePageSourcePath = (
  env: { path?: string; relativePath?: string; filePath?: string } | undefined,
  inverseRewrites: Record<string, string>,
): string => {
  if (typeof env?.relativePath === "string" && env.relativePath.length > 0) {
    return inverseRewrites[env.relativePath] ?? env.relativePath;
  }

  if (typeof env?.path === "string" && env.path.length > 0) {
    const pagePath = env.path.replace(/\\/gu, "/");

    if (!pagePath.startsWith("/")) {
      return inverseRewrites[pagePath] ?? pagePath;
    }
  }

  if (typeof env?.filePath === "string" && env.filePath.length > 0) {
    return inverseRewrites[env.filePath] ?? env.filePath;
  }

  return "";
};

export const rewriteMarkdownHref = (
  href: string,
  pageSourcePath: string,
  rewrites: Record<string, string>,
  repoRoot: string,
  staticLinks: Record<string, string> = {},
): string => {
  if (!href || isExternalHref(href) || href.startsWith("#")) {
    return href;
  }

  const hashIndex = href.indexOf("#");
  const pathPart = hashIndex === -1 ? href : href.slice(0, hashIndex);
  const fragment = hashIndex === -1 ? "" : href.slice(hashIndex + 1);

  if (pathPart.startsWith("/")) {
    return href;
  }

  const repoRelative = resolveRepoMarkdownPath(pathPart, pageSourcePath, repoRoot);

  if (repoRelative) {
    const staticTarget = staticLinks[repoRelative] ?? staticLinks[`${repoRelative}.md`];

    if (staticTarget) {
      return fragment ? `${staticTarget}#${fragment}` : staticTarget;
    }

    const rewritten = lookupRewrite(repoRelative, rewrites);

    if (rewritten) {
      const sitePath = toSitePath(rewritten);

      return fragment ? `${sitePath}#${fragment}` : sitePath;
    }
  }

  return href;
};

export const applyMarkdownLinkRewrites = (
  md: MarkdownIt,
  rewrites: Record<string, string>,
  repoRoot: string,
  staticLinks: Record<string, string> = {},
): void => {
  const inverseRewrites = buildInverseRewrites(rewrites);

  const defaultLinkOpen =
    md.renderer.rules.link_open ??
    ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));

  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const hrefIndex = tokens[idx].attrIndex("href");

    if (hrefIndex >= 0) {
      const href = tokens[idx].attrs?.[hrefIndex]?.[1];

      if (typeof href === "string") {
        const pageSourcePath = resolvePageSourcePath(env, inverseRewrites);
        const next = pageSourcePath
          ? rewriteMarkdownHref(href, pageSourcePath, rewrites, repoRoot, staticLinks)
          : href;

        if (next !== href && tokens[idx].attrs?.[hrefIndex]) {
          tokens[idx].attrs[hrefIndex][1] = next;
        }
      }
    }

    return defaultLinkOpen(tokens, idx, options, env, self);
  };
};
