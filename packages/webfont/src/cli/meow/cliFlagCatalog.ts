export type CliFlagType = "string" | "boolean";

export type CliFlagCatalogEntry = {
  /** meow / program camelCase key */
  key: string;
  type: CliFlagType;
  short?: string;
  default?: boolean | string;
  /** Long option as shown in `--help` (include leading `--`). */
  long: string;
  /** When true and default is true, `long` documents the negated flag (e.g. `--no-sort`). */
  negatable?: boolean;
  description: string | readonly string[];
};

export type CliFlagSection = {
  title?: string;
  entries: readonly CliFlagCatalogEntry[];
};

export const CLI_USAGE_LINE = "Usage: webfont [input] [options]" as const;

export const CLI_INPUT_SECTION = {
  title: "Input: File(s) or glob(s).",
  lines: [
    "SVG icons: one or more `.svg` files (default pipeline).",
    "Webfont decompression: one or more `.woff` / `.woff2` paths, globs, or http(s) URLs.",
    "    You must have rights to any font file you process (see NOTICE.md).",
    "",
    'If an input argument is wrapped in quotation marks, it will be passed to "fast-glob"',
    "for cross-platform glob support.",
  ],
} as const;

export const CLI_FLAG_SECTIONS: readonly CliFlagSection[] = [
  {
    title: "Options:",
    entries: [
      {
        key: "assistant",
        long: "--assistant",
        type: "boolean",
        description: [
          "Interactive wizard (webfont-assistant style): prompts for font name, icon prefix,",
          "glyph/output paths, formats, and built-in or custom templates; writes a `.was` config.",
        ],
      },
      {
        key: "assistantConfig",
        long: "--assistant-config",
        type: "string",
        description: [
          "Path to a `.was` config (webfont-assistant format) or JSON array of configs to regenerate fonts.",
          "Distinct from `--config` (cosmiconfig).",
        ],
      },
      {
        key: "config",
        long: "--config",
        type: "string",
        description: [
          "Path to a specific configuration file (JSON, YAML, or CommonJS)",
          "or the name of a module in `node_modules` that points to one.",
          "If no `--config` argument is provided, webfont will search for",
          "configuration  files in the following places, in this order:",
          "   - a `webfont` property in `package.json`",
          "   - a `.webfontrc` file (with or without filename extension:",
          "       `.json`, `.yaml`, and `.js` are available)",
          "   - a `webfont.config.js` file exporting a JS object",
          "The search will begin in the working directory and move up the",
          "directory tree until a configuration file is found.",
        ],
      },
      {
        key: "fontName",
        long: "--fontName",
        short: "u",
        type: "string",
        description: 'The font family name you want, default: "webfont".',
      },
      {
        key: "help",
        long: "--help",
        short: "h",
        type: "boolean",
        description: "Output usage information.",
      },
      {
        key: "version",
        long: "--version",
        short: "v",
        type: "boolean",
        description: "Output the version number.",
      },
      {
        key: "formats",
        long: "--formats",
        short: "f",
        type: "string",
        description: [
          "Font formats to generate. Pass a JSON array (e.g. '[\"woff2\"]') or a",
          "comma-separated list (e.g. woff2 or svg, ttf, woff2).",
          "SVG input: svg, ttf, eot, woff, woff2 (not otf).",
          "WOFF/WOFF2 input: ttf and/or otf matching the embedded SFNT flavor.",
        ],
      },
      {
        key: "dest",
        long: "--dest",
        short: "d",
        type: "string",
        description: "Destination for generated fonts.",
      },
      {
        key: "destCreate",
        long: "--dest-create",
        short: "m",
        type: "boolean",
        default: false,
        description: "Create destination directory if it does not exist.",
      },
      {
        key: "template",
        long: "--template",
        short: "t",
        type: "string",
        description: [
          "Built-in template name(s) ('css', 'scss', 'styl', 'html', 'json') or path to a custom template.",
          'Pass a JSON array (e.g. \'["html","scss"]\') or comma-separated list for multiple outputs.',
        ],
      },
      {
        key: "destTemplate",
        long: "--destTemplate",
        short: "s",
        type: "string",
        description: "Destination for generated template. If not passed used `dest` argument value.",
      },
      {
        key: "templateClassName",
        long: "--templateClassName",
        short: "c",
        type: "string",
        description: "Class name in css template.",
      },
      {
        key: "templateFontPath",
        long: "--templateFontPath",
        short: "p",
        type: "string",
        description: "Font path in css template.",
      },
      {
        key: "templateFontName",
        long: "--templateFontName",
        short: "n",
        type: "string",
        description: "Font name in css template.",
      },
      {
        key: "templateCacheString",
        long: "--templateCacheString",
        type: "string",
        default: "",
        description: "Specify cache string in scss/css template.",
      },
      {
        key: "sort",
        long: "--no-sort",
        type: "boolean",
        default: true,
        negatable: true,
        description: "Keeps the files in the same order of entry",
      },
      {
        key: "ligatures",
        long: "--ligatures",
        type: "boolean",
        default: false,
        description: [
          "Add OpenType ligature glyphs (icon names as text). Off by default — large",
          "icon sets can hang Firefox on Windows (#558). Prefer class + codepoint CSS.",
        ],
      },
      {
        key: "unicodeRange",
        long: "--unicode-range",
        type: "boolean",
        default: false,
        description: [
          "Emit unicode-range in built-in @font-face rules (computed from glyph code points).",
          "Off by default — enabling may prevent ligature names from rendering; see README.",
        ],
      },
      {
        key: "templateFontLigatures",
        long: "--no-template-font-ligatures",
        type: "boolean",
        default: true,
        negatable: true,
        description: 'Omit font-feature-settings: "liga" from the built-in HTML preview template',
      },
      {
        key: "optimizeSvg",
        long: "--optimize-svg",
        type: "boolean",
        default: false,
        description: [
          "Run a conservative SVGO pass on each SVG before font generation",
          "(does not convert strokes to fills; use glyphContentTransformFn for that)",
        ],
      },
      {
        key: "verbose",
        long: "--verbose",
        type: "boolean",
        default: false,
        description: "Tell me everything!.",
      },
      {
        key: "svgDiagnose",
        long: "--svg-diagnose",
        type: "boolean",
        default: false,
        description: [
          "(Alpha) Scan SVG icons for icon-font incompatibilities (stroke-only paths,",
          "fill-rule: evenodd, unsupported elements) and log warnings.",
        ],
      },
    ],
  },
  {
    title: 'For "svgicons2svgfont":',
    entries: [
      {
        key: "fontId",
        long: "--fontId",
        type: "string",
        description: 'The font id you want, default as "--fontName".',
      },
      {
        key: "fontStyle",
        long: "--fontStyle",
        type: "string",
        description: "The font style you want.",
      },
      {
        key: "fontWeight",
        long: "--fontWeight",
        type: "string",
        description: "The font weight you want.",
      },
      {
        key: "fixedWidth",
        long: "--fixedWidth",
        type: "boolean",
        description: "Creates a monospace font of the width of the largest input icon.",
      },
      {
        key: "centerHorizontally",
        long: "--centerHorizontally",
        type: "boolean",
        description: "Calculate the bounds of a glyph and center it horizontally.",
      },
      {
        key: "centerVertically",
        long: "--centerVertically",
        type: "boolean",
        description: "Center the glyphs vertically in the generated font.",
      },
      {
        key: "normalize",
        long: "--normalize",
        type: "boolean",
        description: "Normalize icons by scaling them to the height of the highest icon.",
      },
      {
        key: "fontHeight",
        long: "--fontHeight",
        type: "string",
        description: "The outputted font height [MAX(icons.height)].",
      },
      {
        key: "round",
        long: "--round",
        type: "string",
        description: "Setup the SVG path rounding [10e12].",
      },
      {
        key: "descent",
        long: "--descent",
        type: "string",
        description: "The font descent [0].",
      },
      {
        key: "ascent",
        long: "--ascent",
        type: "string",
        description: "The font ascent [height - descent].",
      },
      {
        key: "startUnicode",
        long: "--startUnicode",
        type: "string",
        description: "The start unicode codepoint for files without prefix [0xEA01].",
      },
      {
        key: "prependUnicode",
        long: "--prependUnicode",
        type: "boolean",
        description: "Prefix files with their automatically allocated unicode codepoint.",
      },
      {
        key: "metadata",
        long: "--metadata",
        type: "string",
        description: "Content of the metadata tag.",
      },
      {
        key: "addHashInFontUrl",
        long: "--addHashInFontUrl",
        type: "boolean",
        default: false,
        description: [
          "Append an MD5 content hash to font URLs in built-in templates",
          "(?v=[hash]) while keeping output filenames stable (fontName.woff2, etc.).",
          "Use with a fixed fontName — do not randomize fontName for cache busting.",
        ],
      },
    ],
  },
] as const;
