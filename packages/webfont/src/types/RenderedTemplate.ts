export type RenderedTemplate = {
  /** Original template option (built-in name or custom path). */
  template: string;
  content: string;
  /** Built-in template id when applicable (css, html, scss, …). */
  builtIn?: string;
};
