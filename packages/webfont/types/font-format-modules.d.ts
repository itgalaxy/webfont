// Ambient type declarations for the untyped font-format detectors used in tests.
// These packages ship no types and have no @types/* on DefinitelyTyped.
//
// Each detector guards falsy/short input at runtime and returns `false` for it
// (see the `if (!buf || buf.length < N) return false;` guard in every package),
// so accepting `undefined | null` is the accurate contract — callers can pass an
// optional `Result` font field (e.g. `result.woff2`) directly.

declare module "is-ttf" {
  const isTtf: (
    buffer: Buffer | Uint8Array | ArrayBuffer | string | undefined | null,
    opts?: { tables?: string[] },
  ) => boolean;
  export default isTtf;
}

declare module "is-woff" {
  const isWoff: (buffer: Buffer | Uint8Array | undefined | null) => boolean;
  export default isWoff;
}

declare module "is-woff2" {
  const isWoff2: (buffer: Buffer | Uint8Array | undefined | null) => boolean;
  export default isWoff2;
}

declare module "is-eot" {
  const isEot: (buffer: Buffer | Uint8Array | undefined | null) => boolean;
  export default isEot;
}
