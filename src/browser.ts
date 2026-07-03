const BROWSER_MESSAGE =
  "webfont is Node.js-only (requires fs, globby, and other Node built-ins). Run it at build time via the CLI, a Node script, or the webfont-webpack-plugin — do not import it from client-side React/Vue code. See TROUBLESHOOTING.md (Can't resolve 'fs').";

export const webfont = (): Promise<never> => Promise.reject(new Error(BROWSER_MESSAGE));

export default webfont;
