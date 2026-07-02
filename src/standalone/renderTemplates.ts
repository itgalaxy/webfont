import deepmerge from "deepmerge";
import nunjucks from "nunjucks";
import path from "path";
import { getBuiltInTemplates, getTemplateFilePath } from "../../templates";
import { normalizeTemplateOption } from "../lib/parseTemplateOption";
import type { Format } from "../types/Format";
import type { GlyphData } from "../types/GlyphData";
import type { RenderedTemplate } from "../types/RenderedTemplate";
import type { Result } from "../types/Result";
import type { WebfontOptions } from "../types/WebfontOptions";
import { getTemplateFontBase64 } from "./templateFonts";

type RenderTemplatesResult = {
  templates: RenderedTemplate[];
  usedBuildInTemplate: boolean;
};

export const renderTemplates = (
  options: WebfontOptions,
  result: Pick<Result, "glyphsData" | "hash"> & Partial<Result>,
  formats: readonly Format[],
): RenderTemplatesResult => {
  const templateNames = normalizeTemplateOption(options.template);

  if (templateNames.length === 0) {
    return { templates: [], usedBuildInTemplate: false };
  }

  const builtInTemplates = getBuiltInTemplates();
  const renderedTemplates: RenderedTemplate[] = [];
  let usedBuildInTemplate = false;

  let hashOption = {};

  if (options.addHashInFontUrl) {
    hashOption = { hash: result.hash };
  }

  const nunjucksBaseOptions = deepmerge.all([
    {
      glyphs: result.glyphsData?.map((glyph: GlyphData) => glyph.metadata) ?? [],
    },
    options,
    {
      cacheString: options.templateCacheString || Date.now(),
      className: options.templateClassName || options.fontName,
      fontName: options.templateFontName || options.fontName,
      fontPath: options.templateFontPath.replace(/\/?$/u, "/"),
    },
    hashOption,
    {
      fonts: Object.fromEntries(
        new Map(formats.map((format: Format) => [format, () => getTemplateFontBase64(format, result)])),
      ),
    },
  ]);

  for (const templateName of templateNames) {
    let templateFilePath: string;
    let builtIn: string | undefined;

    if (Object.keys(builtInTemplates).includes(templateName)) {
      usedBuildInTemplate = true;
      builtIn = templateName;

      const builtInPath = path.resolve(__dirname, "../..");
      nunjucks.configure(builtInPath);
      templateFilePath = getTemplateFilePath(templateName);
    } else {
      const resolvedTemplateFilePath = path.resolve(templateName);

      nunjucks.configure(path.dirname(resolvedTemplateFilePath));
      templateFilePath = path.resolve(resolvedTemplateFilePath);
    }

    renderedTemplates.push({
      template: templateName,
      content: nunjucks.render(templateFilePath, nunjucksBaseOptions),
      builtIn,
    });
  }

  return { templates: renderedTemplates, usedBuildInTemplate };
};
