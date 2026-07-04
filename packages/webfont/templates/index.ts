import path from "path";

export const getTemplateDirectory : () => string = () => path.resolve(__dirname, "../templates");

export const getTemplateFilePath : (template: string) => string = (template: string) => {
  const templateDirectory : string = getTemplateDirectory();
  return `${templateDirectory}/template.${template}.njk`
}

export const getBuiltInTemplates = () => {

  const templateDirectory = getTemplateDirectory();

  return {
    css: { path: path.join(templateDirectory, "template.css.njk") },
    html: { path: path.join(templateDirectory, "template.html.njk") },
    json: { path: path.join(templateDirectory, "template.json.njk") },
    scss: { path: path.join(templateDirectory, "template.scss.njk") },
    styl: { path: path.join(templateDirectory, "template.styl.njk") },
  };

}
