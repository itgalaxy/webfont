const EVENODD_PATTERN = /fill-rule\s*:\s*evenodd|fill-rule\s*=\s*["']evenodd["']/iu;

export const hasEvenoddFillRule = (svgContents: string): boolean => EVENODD_PATTERN.test(svgContents);

export const evenoddFillRuleWarning = (srcPath: string): string =>
  `[webfont] ${srcPath} uses fill-rule: evenodd. Icon fonts render glyphs with the nonzero fill rule, so holes and counter-shapes (for example the dot on a letter) can disappear. Fix the source SVG (compound path / path direction) or preprocess with glyphContentTransformFn. See TROUBLESHOOTING.md ("Icon details missing after export").`;
