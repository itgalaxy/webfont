import * as fs from "fs";
import * as path from "path";
import type {Formats} from "../types/Format";
import type {OptionsBase} from "../types/OptionsBase";
import type {Result} from "../types/Result";
import cli from "./meow";
import resolveFrom from "resolve-from";
import {webfont} from "../standalone";

const optionsBase : OptionsBase = {};

if (typeof cli.flags.config === "string") {


  /*
   * Should check these possibilities:
   *   a. name of a node_module
   *   b. absolute path
   *   c. relative path relative to `process.cwd()`.
   * If none of the above work, we'll try a relative path starting
   * in `process.cwd()`.
   */
  optionsBase.configFile =
    resolveFrom(process.cwd(), cli.flags.config) ||
    path.join(process.cwd(), cli.flags.config);

}

if (cli.flags.fontName) {

  optionsBase.fontName = cli.flags.fontName;

}

if (cli.flags.formats) {

  optionsBase.formats = cli.flags.formats as Formats;

}

if (cli.flags.dest) {
  optionsBase.dest = cli.flags.dest;
}

if (cli.flags.destCreate) {
  optionsBase.destCreate = cli.flags.destCreate;
}

if (cli.flags.template) {

  optionsBase.template = cli.flags.template;

}

if (cli.flags.templateClassName) {

  optionsBase.templateClassName = cli.flags.templateClassName;

}

if (cli.flags.templateFontPath) {

  optionsBase.templateFontPath = cli.flags.templateFontPath;

}

if (cli.flags.templateFontName) {

  optionsBase.templateFontName = cli.flags.templateFontName;

}

if (cli.flags.templateCacheString) {

  optionsBase.templateCacheString = cli.flags.templateCacheString;

}

if (cli.flags.destTemplate) {

  optionsBase.destTemplate = cli.flags.destTemplate;

}

if (cli.flags.verbose) {

  optionsBase.verbose = cli.flags.verbose;

}

if (cli.flags.fontId) {

  optionsBase.fontId = cli.flags.fontId;

}

if (cli.flags.fontStyle) {

  optionsBase.fontStyle = cli.flags.fontStyle;

}

if (cli.flags.fontWeight) {

  optionsBase.fontWeight = cli.flags.fontWeight;

}

if (cli.flags.fixedWidth) {

  optionsBase.fixedWidth = cli.flags.fixedWidth;

}

if (cli.flags.centerHorizontally) {

  optionsBase.centerHorizontally = cli.flags.centerHorizontally;

}

if (cli.flags.centerVertically) {

  optionsBase.centerVertically = cli.flags.centerVertically;

}

if (cli.flags.normalize) {

  optionsBase.normalize = cli.flags.normalize;

}

if (cli.flags.fontHeight) {

  optionsBase.fontHeight = cli.flags.fontHeight;

}

if (cli.flags.round) {

  optionsBase.round = cli.flags.round;

}

if (cli.flags.descent) {

  optionsBase.descent = cli.flags.descent;

}

if (cli.flags.ascent) {

  optionsBase.ascent = cli.flags.ascent;

}

if (cli.flags.startUnicode) {

  optionsBase.startUnicode = cli.flags.startUnicode;

}

if (cli.flags.prependUnicode) {

  optionsBase.prependUnicode = cli.flags.prependUnicode;

}

if (cli.flags.metadata) {

  optionsBase.metadata = cli.flags.metadata;

}

if (cli.flags.sort === false) {

  optionsBase.sort = cli.flags.sort;

}

if (cli.flags.ligatures === false) {

  optionsBase.ligatures = cli.flags.ligatures;

}

if (cli.flags.addHashInFontUrl) {

  optionsBase.addHashInFontUrl = cli.flags.addHashInFontUrl;

}

if (cli.flags.help || cli.flags.h) {

  cli.showHelp();

}

if (cli.flags.version || cli.flags.v) {

  cli.showVersion();

}

Promise.resolve().
  then(() => {

    const options = {...optionsBase,
      files: cli.input};

    if (options.files.length === 0) {

      cli.showHelp();

    }

    return webfont(options).then((result) => {

      result.config = {

        dest: options.dest,
        destTemplate: options.destTemplate,
        ...result.config,
      };

      return result;

    });

  }).
  then((result: Result) => {

    const {fontName, dest, destCreate} = result.config;

    let destTemplate = null;

    if (result.template) {

      ({destTemplate} = result.config);

      if (!destTemplate) {

        destTemplate = dest;

      }

      if (result.usedBuildInTemplate) {

        destTemplate = path.join(destTemplate, `${result.config.fontName}.${result.config.template}`);

      } else {

        destTemplate = path.join(destTemplate, path.basename(result.config.template).replace(".njk", ""));

      }

      delete result.hash;

    }

    return Promise.resolve().
      then(() => new Promise((resolve, reject) => {
        fs.access(dest, fs.constants.F_OK, (err) => reject(err));
      })).
      catch((error) => {
        if (error && destCreate) {
          return new Promise((resolve) => {
            fs.mkdir(dest, { recursive: true }, () => resolve(destCreate));
          });
        }
        return error;
      }).
      finally(() => Promise.all(Object.keys(result).map((type) => {
        if (type === "config" || type === "usedBuildInTemplate" || type === "glyphsData") {
          return null;
        }
        const content = result[type];
        // eslint-disable-next-line init-declarations
        let file;
        if (type === "template") {
          file = path.resolve(destTemplate);
        } else {
          file = path.resolve(path.join(dest, `${fontName}.${type}`));
        }
        return fs.writeFile(file, content, () => {
          Function.prototype();
        });
      }))).
      then(() => Promise.resolve(result));

  }).
  catch((error) => {

    // eslint-disable-next-line no-console
    console.log(error.stack);

    let exitCode = 1;

    if (typeof error.code === "number") {
      exitCode = error.code;
    }

    process.exit(exitCode);

  });
