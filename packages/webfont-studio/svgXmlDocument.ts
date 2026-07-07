import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

/** Parse SVG markup in the browser worker (no native DOMParser in workers). */
export const parseSvgXmlDocument = (svgContents: string): Document => {
  const document = new DOMParser().parseFromString(svgContents, "image/svg+xml");

  if (document.getElementsByTagName("parsererror").length > 0) {
    throw new Error("SVG could not be parsed for rasterization");
  }

  return document;
};

export const getSvgChildElements = (parent: Element): Element[] => {
  const children: Element[] = [];

  for (let index = 0; index < parent.childNodes.length; index += 1) {
    const node = parent.childNodes.item(index);

    if (node?.nodeType === 1) {
      children.push(node as Element);
    }
  }

  return children;
};

export const serializeSvgElement = (element: Element): string => new XMLSerializer().serializeToString(element);

export const listSvgElementsByTagName = (document: Document, tagName: string): Element[] => {
  const nodes = document.getElementsByTagName(tagName);
  const elements: Element[] = [];

  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes.item(index);

    if (node) {
      elements.push(node);
    }
  }

  return elements;
};
