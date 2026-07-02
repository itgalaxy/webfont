import { pathToFileURL } from "node:url";
import meow from "meow";
import pkg from "../../../package.json";
import { webfontCliHelpText, webfontMeowFlags } from "./cliOptions";

const meowImportMeta = { url: pathToFileURL(__filename).href } as ImportMeta;

export const createMeowCli = (argv: readonly string[] = process.argv.slice(2)) =>
  meow(webfontCliHelpText, {
    argv: [...argv],
    autoHelp: false,
    autoVersion: false,
    flags: webfontMeowFlags,
    importMeta: meowImportMeta,
    pkg,
  });
