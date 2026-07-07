import { encodeTtfToWoff2 } from "@webfont/lib/ttfEncode";
import { defaultWebfontOptions } from "@webfont/standalone/defaultOptions";
import { generateSvgFont } from "@webfont/standalone/generateSvgFont";
import toTtf from "@webfont/standalone/toTtf";

const WARMUP_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="currentColor"/></svg>';

self.onmessage = () => {
  void (async () => {
    const started = performance.now();

    try {
      const options = defaultWebfontOptions();
      const glyphsData = [{ contents: WARMUP_SVG, srcPath: "warmup.svg" }];
      const svg = await generateSvgFont(glyphsData, options);
      const ttf = toTtf(svg);
      await encodeTtfToWoff2(ttf);

      self.postMessage({
        type: "ready",
        elapsedMs: performance.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      self.postMessage({ type: "failed", message });
    }
  })();
};
