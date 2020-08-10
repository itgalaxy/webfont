module.exports = {
  fontName: 'TestFont',
  version: '1.0.0',
  dest: './out/__tests__/fonts',
  formats: ['woff2'],
  template: [
    { file: 'css',                                             outDir: './out/__tests__/templates' },
    { file: './src/__tests__/fixtures/templates/template.css', outDir: './out/__tests__/templates' },
  ],
  templateClassName: 'test-font',
  templateFontPath: './out/__tests__/',
};
