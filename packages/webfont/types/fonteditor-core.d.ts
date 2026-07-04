// fonteditor-core's bundled type declarations list the DOM `Document` global as
// an accepted parse input (FontInput = ArrayBuffer | Buffer | string | Document)
// for reading SVG fonts from a parsed document. webfont only uses the
// Buffer-based TTF -> SVG path in Node and deliberately keeps the DOM lib out of
// tsconfig (Node-only runtime plus a browser stub). This minimal ambient shim
// satisfies the reference without pulling in the full DOM lib or flipping
// skipLibCheck, and merges harmlessly if the DOM lib is ever added.
declare type Document = unknown;
