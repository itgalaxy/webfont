export type Woff2WarmupState = "loading" | "ready" | "failed";

type WarmupListener = (state: Woff2WarmupState, detail?: string) => void;

let warmupState: Woff2WarmupState = "loading";
let warmupDetail: string | undefined;
let warmupWorker: Worker | undefined;
const listeners = new Set<WarmupListener>();

const notify = (): void => {
  for (const listener of listeners) {
    listener(warmupState, warmupDetail);
  }
};

export const getWoff2WarmupState = (): Woff2WarmupState => warmupState;

export const subscribeWoff2Warmup = (listener: WarmupListener): (() => void) => {
  listeners.add(listener);
  listener(warmupState, warmupDetail);

  return () => {
    listeners.delete(listener);
  };
};

export const startWoff2Warmup = (): void => {
  if (warmupState === "ready" || warmupWorker) {
    return;
  }

  warmupState = "loading";
  warmupDetail = undefined;
  notify();

  warmupWorker = new Worker(new URL("./warmup.worker.ts", import.meta.url), {
    type: "module",
  });

  warmupWorker.onmessage = (event: MessageEvent<{ type: string; elapsedMs?: number; message?: string }>) => {
    const message = event.data;

    if (message.type === "ready") {
      warmupState = "ready";
      warmupDetail = `WOFF2 WASM ready in ${Math.round(message.elapsedMs ?? 0)} ms`;
      warmupWorker?.terminate();
      warmupWorker = undefined;
      notify();
      return;
    }

    if (message.type === "failed") {
      warmupState = "failed";
      warmupDetail = message.message;
      warmupWorker?.terminate();
      warmupWorker = undefined;
      notify();
    }
  };

  warmupWorker.onerror = (error) => {
    warmupState = "failed";
    warmupDetail = error.message;
    warmupWorker?.terminate();
    warmupWorker = undefined;
    notify();
  };

  warmupWorker.postMessage({});
};
