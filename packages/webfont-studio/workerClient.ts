import type { Format } from "@webfont/types/Format";
import type { GlyphInput } from "@webfont/types/GlyphInput";
import type { StudioSvgToolsOptions } from "./studioSvgTools";
import type {
  WorkerConversionResult,
  WorkerConvertRequest,
  WorkerFontOutputs,
  WorkerOutboundMessage,
  WorkerProgressMessage,
  WorkerResultMessage,
} from "./workerProtocol";

export type WorkerProgressHandler = (update: Omit<WorkerProgressMessage, "type" | "id">) => void;

export type WorkerDebugHandler = (message: string, elapsedMs?: number) => void;

export type WorkerLifecycleHandler = (state: "started" | "finished", elapsedMs?: number) => void;

import type { GlyphMappingMetadata } from "./workerProtocol";

export type ConvertInWorkerOptions = {
  glyphs: GlyphInput[];
  formats: Format[];
  verbose: boolean;
  svgTools?: StudioSvgToolsOptions;
  glyphMappings?: GlyphMappingMetadata[];
  normalize?: boolean;
  centerHorizontally?: boolean;
  fixedWidth?: boolean;
  onProgress: WorkerProgressHandler;
  onDebug?: WorkerDebugHandler;
  onLifecycle?: WorkerLifecycleHandler;
  signal?: AbortSignal;
};

export class ConversionCancelledError extends Error {
  constructor() {
    super("Conversion cancelled");
    this.name = "ConversionCancelledError";
  }
}

export const isConversionCancelledError = (error: unknown): error is ConversionCancelledError =>
  error instanceof ConversionCancelledError;

const toUint8Outputs = (outputs: WorkerFontOutputs): WorkerConversionResult["outputs"] => ({
  svg: outputs.svg,
  ttf: outputs.ttf ? new Uint8Array(outputs.ttf) : undefined,
  woff: outputs.woff ? new Uint8Array(outputs.woff) : undefined,
  woff2: outputs.woff2 ? new Uint8Array(outputs.woff2) : undefined,
});

const createJobId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `job-${Date.now()}`;
};

export const convertInWorker = (options: ConvertInWorkerOptions): Promise<WorkerConversionResult> => {
  const {
    glyphs,
    formats,
    verbose,
    svgTools,
    glyphMappings,
    normalize,
    centerHorizontally,
    fixedWidth,
    onProgress,
    onDebug,
    onLifecycle,
    signal,
  } = options;
  const id = createJobId();

  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./conversion.worker.ts", import.meta.url), {
      type: "module",
    });

    let settled = false;

    const settle = (callback: () => void): void => {
      if (settled) {
        return;
      }

      settled = true;
      signal?.removeEventListener("abort", onAbort);
      callback();
    };

    const cleanup = (): void => {
      worker.terminate();
    };

    const onAbort = (): void => {
      cleanup();
      settle(() => {
        reject(new ConversionCancelledError());
      });
    };

    if (signal?.aborted) {
      cleanup();
      reject(new ConversionCancelledError());
      return;
    }

    signal?.addEventListener("abort", onAbort);

    worker.onmessage = (event: MessageEvent<WorkerOutboundMessage>) => {
      const message = event.data;

      if (!message || typeof message !== "object" || !("type" in message)) {
        return;
      }

      if (message.type === "progress") {
        const { label, step, completedSteps, percent, busy } = message;
        onProgress({ label, step, completedSteps, percent, busy });
        return;
      }

      if (message.type === "debug") {
        onDebug?.(message.message, message.elapsedMs);
        return;
      }

      if (message.type === "lifecycle") {
        onLifecycle?.(message.state, message.elapsedMs);
        return;
      }

      if (message.type === "error") {
        cleanup();
        settle(() => {
          reject(new Error(message.message || "Conversion failed in Web Worker"));
        });
        return;
      }

      if (message.type === "result") {
        const resultMessage = message as WorkerResultMessage;
        cleanup();
        settle(() => {
          resolve({
            hash: resultMessage.hash,
            formats: resultMessage.formats,
            glyphsPreview: resultMessage.glyphsPreview,
            outputs: toUint8Outputs(resultMessage.outputs),
          });
        });
      }
    };

    worker.onerror = (event) => {
      cleanup();
      settle(() => {
        const detail =
          event.message?.trim() || "Worker failed to load or execute (check the browser console for details)";
        reject(new Error(`Web Worker conversion failed: ${detail}`));
      });
    };

    const request: WorkerConvertRequest = {
      id,
      glyphs,
      formats,
      verbose,
      svgTools,
      glyphMappings,
      normalize,
      centerHorizontally,
      fixedWidth,
    };
    worker.postMessage(request);
  });
};

export type { ConversionStepId } from "./workerProtocol";
