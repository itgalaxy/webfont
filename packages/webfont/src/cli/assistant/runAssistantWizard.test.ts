import { describe, expect, it } from "vitest";
import { defaultCustomTemplatePath } from "./runAssistantWizard";

describe("defaultCustomTemplatePath", () => {
  it("should suggest a .njk path that reflects the selected style type", () => {
    expect(defaultCustomTemplatePath("css")).toBe("../templates/template.css.njk");
    expect(defaultCustomTemplatePath("scss")).toBe("../templates/template.scss.njk");
    expect(defaultCustomTemplatePath("less")).toBe("../templates/template.less.njk");
  });
});
