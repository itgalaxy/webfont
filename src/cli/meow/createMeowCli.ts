import meow from "meow";
import { webfontCliHelpText, webfontMeowFlags } from "./cliOptions";

export const createMeowCli = (argv: readonly string[] = process.argv.slice(2)) =>
  meow(webfontCliHelpText, {
    argv: [...argv],
    autoHelp: false,
    autoVersion: false,
    flags: webfontMeowFlags,
  });
