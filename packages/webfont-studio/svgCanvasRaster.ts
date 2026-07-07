import { parseSvgLayout } from "./outlineStrokeWasmLayout";
import {
  parsePolylinePoints,
  parseSvgLength,
  parseViewBoxRect,
  resolveSvgPaintColor,
} from "./svgCanvasRasterHelpers";
import { getSvgChildElements, parseSvgXmlDocument } from "./svgXmlDocument";

interface SvgPaintStyle {
  fill: string | null;
  lineCap: CanvasLineCap;
  lineJoin: CanvasLineJoin;
  stroke: string | null;
  strokeWidth: number;
}

const parseLineCap = (value: string | null, fallback: CanvasLineCap): CanvasLineCap => {
  if (value === "butt" || value === "round" || value === "square") {
    return value;
  }

  return fallback;
};

const parseLineJoin = (value: string | null, fallback: CanvasLineJoin): CanvasLineJoin => {
  if (value === "bevel" || value === "round" || value === "miter") {
    return value;
  }

  return fallback;
};

const readPaintStyle = (element: Element, inherited: SvgPaintStyle): SvgPaintStyle => {
  const fillAttr = element.getAttribute("fill");
  const strokeAttr = element.getAttribute("stroke");
  const strokeWidthAttr = element.getAttribute("stroke-width");
  const lineCapAttr = element.getAttribute("stroke-linecap");
  const lineJoinAttr = element.getAttribute("stroke-linejoin");

  let fill = inherited.fill;
  let stroke = inherited.stroke;

  if (fillAttr !== null) {
    fill = resolveSvgPaintColor(fillAttr);
  }

  if (strokeAttr !== null) {
    stroke = resolveSvgPaintColor(strokeAttr);
  }

  let strokeWidth = inherited.strokeWidth;
  let lineCap = inherited.lineCap;
  let lineJoin = inherited.lineJoin;

  if (strokeWidthAttr !== null) {
    strokeWidth = parseSvgLength(strokeWidthAttr, inherited.strokeWidth);
  }

  if (lineCapAttr !== null) {
    lineCap = parseLineCap(lineCapAttr, inherited.lineCap);
  }

  if (lineJoinAttr !== null) {
    lineJoin = parseLineJoin(lineJoinAttr, inherited.lineJoin);
  }

  return {
    fill,
    stroke,
    strokeWidth,
    lineCap,
    lineJoin,
  };
};

const applyPaintStyle = (context: OffscreenCanvasRenderingContext2D, style: SvgPaintStyle): void => {
  context.lineCap = style.lineCap;
  context.lineJoin = style.lineJoin;
  context.lineWidth = style.strokeWidth;
};

const strokePath = (context: OffscreenCanvasRenderingContext2D, style: SvgPaintStyle): void => {
  if (!style.stroke) {
    return;
  }

  context.strokeStyle = style.stroke;
  context.stroke();
};

const fillPath = (context: OffscreenCanvasRenderingContext2D, style: SvgPaintStyle): void => {
  if (!style.fill) {
    return;
  }

  context.fillStyle = style.fill;
  context.fill();
};

const drawShape = (context: OffscreenCanvasRenderingContext2D, element: Element, style: SvgPaintStyle): void => {
  applyPaintStyle(context, style);
  const tag = element.tagName.toLowerCase();

  if (tag === "path") {
    const pathData = element.getAttribute("d");

    if (!pathData) {
      return;
    }

    const path = new Path2D(pathData);
    applyPaintStyle(context, style);

    if (style.fill) {
      context.fillStyle = style.fill;
      context.fill(path);
    }

    if (style.stroke) {
      context.strokeStyle = style.stroke;
      context.stroke(path);
    }

    return;
  }

  if (tag === "line") {
    const x1 = parseSvgLength(element.getAttribute("x1"), 0);
    const y1 = parseSvgLength(element.getAttribute("y1"), 0);
    const x2 = parseSvgLength(element.getAttribute("x2"), 0);
    const y2 = parseSvgLength(element.getAttribute("y2"), 0);

    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    strokePath(context, style);
    return;
  }

  if (tag === "polyline" || tag === "polygon") {
    const points = parsePolylinePoints(element.getAttribute("points") ?? "");

    if (points.length === 0) {
      return;
    }

    context.beginPath();
    context.moveTo(points[0][0], points[0][1]);

    for (let index = 1; index < points.length; index += 1) {
      context.lineTo(points[index][0], points[index][1]);
    }

    if (tag === "polygon") {
      context.closePath();
      fillPath(context, style);
    }

    strokePath(context, style);
    return;
  }

  if (tag === "circle") {
    const cx = parseSvgLength(element.getAttribute("cx"), 0);
    const cy = parseSvgLength(element.getAttribute("cy"), 0);
    const radius = parseSvgLength(element.getAttribute("r"), 0);

    context.beginPath();
    context.arc(cx, cy, radius, 0, Math.PI * 2);
    fillPath(context, style);
    strokePath(context, style);
    return;
  }

  if (tag === "ellipse") {
    const cx = parseSvgLength(element.getAttribute("cx"), 0);
    const cy = parseSvgLength(element.getAttribute("cy"), 0);
    const rx = parseSvgLength(element.getAttribute("rx"), 0);
    const ry = parseSvgLength(element.getAttribute("ry"), 0);

    context.beginPath();
    context.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    fillPath(context, style);
    strokePath(context, style);
    return;
  }

  if (tag === "rect") {
    const x = parseSvgLength(element.getAttribute("x"), 0);
    const y = parseSvgLength(element.getAttribute("y"), 0);
    const width = parseSvgLength(element.getAttribute("width"), 0);
    const height = parseSvgLength(element.getAttribute("height"), 0);

    context.beginPath();
    context.rect(x, y, width, height);
    fillPath(context, style);
    strokePath(context, style);
  }
};

const walkSvgTree = (
  context: OffscreenCanvasRenderingContext2D,
  element: Element,
  inherited: SvgPaintStyle,
): void => {
  const style = readPaintStyle(element, inherited);
  const tag = element.tagName.toLowerCase();

  if (tag === "g" || tag === "svg") {
    for (const child of getSvgChildElements(element)) {
      walkSvgTree(context, child, style);
    }

    return;
  }

  if (
    tag === "path" ||
    tag === "line" ||
    tag === "polyline" ||
    tag === "polygon" ||
    tag === "circle" ||
    tag === "ellipse" ||
    tag === "rect"
  ) {
    drawShape(context, element, style);
  }
};

/**
 * Rasterize SVG onto a white background for Potrace WASM.
 * Uses Canvas 2D + @xmldom/xmldom — native DOMParser and createImageBitmap(SVG) are unavailable in workers.
 * Returns ImageData (not ImageBitmap) because esm-potrace-wasm uses document.createElement for ImageBitmap input.
 */
export const rasterizeSvgToImageData = (
  svgContents: string,
  rasterWidth: number,
  rasterHeight: number,
): ImageData => {
  const layout = parseSvgLayout(svgContents);
  const viewBox = parseViewBoxRect(layout.viewBox);
  const svgDocument = parseSvgXmlDocument(svgContents);
  const root = svgDocument.documentElement;

  const canvas = new OffscreenCanvas(rasterWidth, rasterHeight);
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("OffscreenCanvas 2D context is not available");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, rasterWidth, rasterHeight);

  const scaleX = rasterWidth / viewBox.width;
  const scaleY = rasterHeight / viewBox.height;
  context.setTransform(scaleX, 0, 0, scaleY, -viewBox.minX * scaleX, -viewBox.minY * scaleY);

  const rootStyle: SvgPaintStyle = {
    fill: resolveSvgPaintColor(root.getAttribute("fill")),
    stroke: resolveSvgPaintColor(root.getAttribute("stroke")),
    strokeWidth: parseSvgLength(root.getAttribute("stroke-width"), 1),
    lineCap: parseLineCap(root.getAttribute("stroke-linecap"), "butt"),
    lineJoin: parseLineJoin(root.getAttribute("stroke-linejoin"), "miter"),
  };

  walkSvgTree(context, root, rootStyle);

  return context.getImageData(0, 0, rasterWidth, rasterHeight);
};
