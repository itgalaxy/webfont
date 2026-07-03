type BrowserLikeGlobal = typeof globalThis & {
  importScripts?: (...urls: string[]) => void;
  window?: { document?: unknown };
};

/** True in browser tabs and Web Workers (including Vite `process` polyfills). */
export const isBrowserOrWorkerRuntime = (): boolean => {
  const globalRef = globalThis as BrowserLikeGlobal;

  if (typeof globalRef.importScripts === "function") {
    return true;
  }

  return typeof globalRef.window !== "undefined" && typeof globalRef.window.document !== "undefined";
};

/** True only in real Node.js — not in browser tabs or Web Workers. */
export const isNodeRuntime = (): boolean => {
  if (isBrowserOrWorkerRuntime()) {
    return false;
  }

  return typeof process !== "undefined" && typeof process.versions?.node === "string";
};
