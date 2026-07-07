"use strict";

const path = require("node:path");
const { webfont, writeResultFiles } = require("webfont");

/** @param {import("grunt")} grunt */
module.exports = function registerWebfontGruntTask(grunt) {
  grunt.registerTask("webfont", "Generate icon fonts from SVG sources", function registerWebfontTask() {
    const done = this.async();
    const dest = path.resolve("dist/fonts");

    void (async () => {
      try {
        const result = await webfont({
          files: path.join(__dirname, "icons/**/*.svg"),
          fontName: "icons",
          formats: ["woff2"],
          template: "css",
          dest,
          destCreate: true,
        });

        await writeResultFiles(result);
        grunt.log.ok(`Wrote fonts to ${dest}`);
        done();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        grunt.log.error(message);
        done(false);
      }
    })();
  });

  grunt.registerTask("default", ["webfont"]);
};
