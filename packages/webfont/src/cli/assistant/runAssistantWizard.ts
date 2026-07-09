import type { Format } from "../../types/Format";
import { buildWasConfigFromWizard } from "./buildWasConfig";
import type { AssistantWizardAnswers, WebfontAssistantWasConfig } from "./types";

const DEFAULT_FORMATS: Format[] = ["ttf"];

type EnquirerStatic = {
  Confirm: new (options: Record<string, unknown>) => { run: () => Promise<boolean> };
  Form: new <T>(options: Record<string, unknown>) => { run: () => Promise<T> };
  Input: new (options: Record<string, unknown>) => { run: () => Promise<string> };
  MultiSelect: new <T>(options: Record<string, unknown>) => { run: () => Promise<T[]> };
  Select: new <T>(options: Record<string, unknown>) => { run: () => Promise<T> };
};

const loadEnquirer = async (): Promise<EnquirerStatic> => {
  const module = await import("enquirer");
  const enquirer = module.default ?? module;
  return enquirer as unknown as EnquirerStatic;
};

const pickFormats = async (): Promise<Format[]> => {
  const { MultiSelect } = await loadEnquirer();
  const selected = await new MultiSelect<Format>({
    choices: [
      { message: "ttf", name: "ttf" },
      { message: "woff", name: "woff" },
      { message: "woff2", name: "woff2" },
    ],
    limit: 6,
    message: "Which font types do you need?",
    name: "formats",
  }).run();

  if (selected.length === 0) {
    return DEFAULT_FORMATS;
  }

  return selected;
};

const pickStyleType = async (): Promise<{ isCustomTemplate: boolean; styleType: string; template: string }> => {
  const { Confirm, Input, Select } = await loadEnquirer();
  const styleType = await new Select<string>({
    choices: ["css", "scss", "other"],
    message: "Pick a file type for style",
    name: "styleType",
  }).run();

  if (styleType === "other") {
    const customType = await new Input({
      initial: "less",
      message: "What format do you want to use?",
      name: "customType",
    }).run();
    const template = await new Input({
      initial: "../templates/template.any",
      message: "What is your template path?",
      name: "template",
    }).run();

    return {
      isCustomTemplate: true,
      styleType: customType,
      template,
    };
  }

  const useCustomTemplate = await new Confirm({
    message: "Do you have your own template?",
    name: "customTemplate",
  }).run();

  if (useCustomTemplate) {
    const template = await new Input({
      initial: "../templates/template.css.any",
      message: "What is your template path?",
      name: "template",
    }).run();

    return {
      isCustomTemplate: true,
      styleType,
      template,
    };
  }

  return {
    isCustomTemplate: false,
    styleType,
    template: styleType,
  };
};

export const runAssistantWizard = async (): Promise<WebfontAssistantWasConfig> => {
  if (!process.stdin.isTTY) {
    throw new Error("Interactive assistant requires a TTY. Use --assistant-config with a .was file in CI.");
  }

  const { Form } = await loadEnquirer();
  const answers = await new Form<AssistantWizardAnswers>({
    choices: [
      { initial: "MyAwesomeFont", message: "Font Name", name: "name" },
      { initial: "my-icon", message: "Icons prefix", name: "prefix" },
      { initial: "assets/fonts", message: "Output Path", name: "output" },
      { initial: "assets/images/svg", message: "Glyphs Path", name: "glyphs" },
    ],
    message: "Basic font configuration:",
    name: "assistant",
  }).run();

  const formats = await pickFormats();
  const style = await pickStyleType();

  return buildWasConfigFromWizard(answers, {
    formats,
    isCustomTemplate: style.isCustomTemplate,
    styleType: style.styleType,
    template: style.template,
  });
};
