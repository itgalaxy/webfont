import { init, potrace } from "esm-potrace-wasm";
import { buildOutlinedSvg, computeRasterSize, parseSvgLayout } from "./outlineStrokeWasmLayout";
import { rasterizeSvgToImageData } from "./svgCanvasRaster";
import { listSvgElementsByTagName, parseSvgXmlDocument, serializeSvgElement } from "./svgXmlDocument";

const RASTER_SCALE = 8;

let potraceInit: Promise<void> | undefined;

export const ensureOutlineStrokeWasmReady = async (): Promise<void> => {
  if (!potraceInit) {
    potraceInit = init();
  }

  await potraceInit;
};

const extractPathElementsFromPotraceSvg = (potraceSvg: string): string => {
  const doc = parseSvgXmlDocument(potraceSvg);
  const paths = listSvgElementsByTagName(doc, "path");

  if (paths.length === 0) {
    throw new Error("Potrace did not produce any paths");
  }

  return paths
    .map((path) => {
      path.setAttribute("fill", "#000000");
      path.removeAttribute("stroke");
      return serializeSvgElement(path);
    })
    .join("");
};
/** Alpha. Convert stroke-based SVG to filled paths using Potrace WASM (browser worker only). */
export const outlineStrokeWithWasm = async (svgContents: string): Promise<string> => {
  await ensureOutlineStrokeWasmReady();

  const layout = parseSvgLayout(svgContents);
  const raster = computeRasterSize(layout.width, layout.height, RASTER_SCALE);
  const imageData = rasterizeSvgToImageData(svgContents, raster.width, raster.height);

  const traced = await potrace(imageData, {
    alphamax: 1,
    extractcolors: false,
    opticurve: 1,
    opttolerance: 0.2,
    pathonly: false,
    posterizelevel: 1,
    posterizationalgorithm: 0,
    turdsize: 2,
    turnpolicy: 4,
  });

  const tracedSvg = Array.isArray(traced) ? traced.join("") : traced;
  const pathElements = extractPathElementsFromPotraceSvg(tracedSvg);

  return buildOutlinedSvg(layout.viewBox, pathElements);
};
