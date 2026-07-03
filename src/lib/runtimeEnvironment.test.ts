import { isBrowserOrWorkerRuntime, isNodeRuntime } from "./runtimeEnvironment";

describe("runtimeEnvironment", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should treat Web Worker globals as non-Node even when process.versions.node is polyfilled", () => {
    vi.stubGlobal("importScripts", vi.fn());
    vi.stubGlobal("process", { versions: { node: "22.0.0" } });

    expect(isBrowserOrWorkerRuntime()).toBe(true);
    expect(isNodeRuntime()).toBe(false);
  });

  it("should treat browser window as non-Node", () => {
    vi.stubGlobal("window", { document: {} });

    expect(isBrowserOrWorkerRuntime()).toBe(true);
    expect(isNodeRuntime()).toBe(false);
  });

  it("should treat real Node as Node when worker and window globals are absent", () => {
    expect(isNodeRuntime()).toBe(true);
  });
});
