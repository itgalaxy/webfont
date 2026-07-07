import { getGlyphsDataFromInputs } from "@webfont/standalone/getGlyphsDataFromInputs";
import { assertSvgPipelineFormats } from "@webfont/standalone/inputMode";
import { getOptionsFromGlyphs } from "@webfont/standalone/optionsFromGlyphs";
import { validateWebfontOptions } from "@webfont/standalone/validateWebfontOptions";
import type { GlyphData } from "@webfont/types/GlyphData";
import { formatListLabel } from "./formats";
import { createMetadataFromMapping } from "./metadataFromMapping";
import { runSvgPipelineInBrowserWorker } from "./svgPipelineInBrowserWorker";
import type {
  GlyphPreview,
  WorkerConvertRequest,
  WorkerDebugMessage,
  WorkerFontOutputs,
  WorkerLifecycleMessage,
  WorkerOutboundMessage,
  WorkerProgressMessage,
} from "./workerProtocol";

const toGlyphPreview = (glyph: GlyphData): GlyphPreview => ({
  srcPath: glyph.srcPath,
  name: glyph.metadata?.name,
  unicode: glyph.metadata?.unicode,
});

const sliceBuffer = (buffer: Buffer): ArrayBuffer =>
  buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

const toWorkerOutputs = (result: Awaited<ReturnType<typeof runSvgPipelineInBrowserWorker>>): WorkerFontOutputs => {
  const outputs: WorkerFontOutputs = {};

  if (typeof result.svg === "string") {
    outputs.svg = result.svg;
  }

  if (result.ttf) {
    outputs.ttf = sliceBuffer(result.ttf);
  }

  if (result.woff) {
    outputs.woff = sliceBuffer(result.woff);
  }

  if (result.woff2) {
    outputs.woff2 = sliceBuffer(result.woff2);
  }

  return outputs;
};

const collectTransfers = (outputs: WorkerFontOutputs): Transferable[] => {
  const transfers: Transferable[] = [];

  if (outputs.ttf) {
    transfers.push(outputs.ttf);
  }

  if (outputs.woff) {
    transfers.push(outputs.woff);
  }

  if (outputs.woff2) {
    transfers.push(outputs.woff2);
  }

  return transfers;
};

const post = (message: WorkerOutboundMessage, transfer?: Transferable[]): void => {
  self.postMessage(message, transfer ?? []);
};

const postProgress = (id: string, update: Omit<WorkerProgressMessage, "type" | "id">): void => {
  post({ type: "progress", id, ...update });
};

const postDebug = (id: string, message: string, elapsedMs?: number): void => {
  const payload: WorkerDebugMessage = { type: "debug", id, message };

  if (elapsedMs !== undefined) {
    payload.elapsedMs = elapsedMs;
  }

  post(payload);
};

const convertGlyphs = async (request: WorkerConvertRequest): Promise<void> => {
  const { id, glyphs, formats, verbose, normalize, centerHorizontally, fixedWidth, svgTools } = request;
  const jobStarted = performance.now();

  post({ type: "lifecycle", id, state: "started" } satisfies WorkerLifecycleMessage);
  postDebug(id, `Worker started with ${glyphs.length} glyph(s); formats: ${formatListLabel(formats)}`, 0);

  try {
    postProgress(id, {
      label: "Validating SVGs and extracting metadata…",
      step: "validate",
      completedSteps: ["read"],
      percent: 28,
    });

    const validateStarted = performance.now();
    const svgToolsWithReporter = svgTools
      ? {
          ...svgTools,
          onMessage: (message: string): void => {
            postDebug(id, message);
          },
        }
      : verbose
        ? {
            onMessage: (message: string): void => {
              postDebug(id, message);
            },
          }
        : undefined;

    let options = getOptionsFromGlyphs({
      glyphs,
      formats,
      verbose,
      normalize: Boolean(normalize),
      centerHorizontally: Boolean(centerHorizontally),
      fixedWidth: Boolean(fixedWidth),
      svgTools: svgToolsWithReporter,
    });

    if (request.glyphMappings?.length) {
      options.metadataProvider = createMetadataFromMapping(request.glyphMappings);
    }

    options = validateWebfontOptions(options);
    assertSvgPipelineFormats(options.formats);

    const glyphsData = await getGlyphsDataFromInputs(glyphs, options);
    postDebug(id, "Validation and metadata complete", performance.now() - validateStarted);

    postProgress(id, {
      label: "Validation complete",
      step: "validate",
      completedSteps: ["read"],
      percent: 42,
    });

    postProgress(id, {
      label: `Generating ${formatListLabel(formats)}…`,
      step: "generate",
      completedSteps: ["read", "validate"],
      busy: true,
    });

    if (verbose) {
      postDebug(id, "Generating SVG font...");
    }

    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });

    const pipelineStarted = performance.now();
    const result = await runSvgPipelineInBrowserWorker(glyphsData, options);
    postDebug(id, "Font pipeline complete", performance.now() - pipelineStarted);

    postProgress(id, {
      label: "Font outputs ready",
      step: "encode",
      completedSteps: ["read", "validate", "generate"],
      percent: 88,
    });

    const outputs = toWorkerOutputs(result);

    post(
      {
        type: "result",
        id,
        hash: result.hash,
        formats,
        glyphsPreview: glyphsData.map(toGlyphPreview),
        outputs,
      },
      collectTransfers(outputs),
    );

    post({
      type: "lifecycle",
      id,
      state: "finished",
      elapsedMs: performance.now() - jobStarted,
    } satisfies WorkerLifecycleMessage);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    post({ type: "error", id, message });
  }
};

self.onmessage = (event: MessageEvent<WorkerConvertRequest>) => {
  void convertGlyphs(event.data);
};
