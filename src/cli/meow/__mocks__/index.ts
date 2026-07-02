import { version } from "../../../../package.json";
import { createMeowCli } from "../createMeowCli";

const formatCliStdout = (value: string): string => value.replace(/\n$/u, "");
const cli = createMeowCli([]);

const meowMock = {
  ...cli,
  error: () => "Error: Files glob patterns specified did not match any files",
  showHelp: () => formatCliStdout(`${cli.help}\n`),
  showVersion: () => version,
  verbose: () => "Generating SVG font...",
};

export default meowMock;
