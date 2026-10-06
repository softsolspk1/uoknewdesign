import type { Sharp, Metadata } from "sharp";

// Real content-based image validation/sanitization, used by every upload
// endpoint that accepts images (including the public, unauthenticated one
// behind /info-submission). Never trust the browser-supplied Content-Type or
// filename extension — both are trivial to spoof (e.g. a script or
// executable renamed to "photo.jpg" with Content-Type: image/jpeg).
//
// Decoding the bytes through sharp/libvips and only allowing formats we
// recognize means anything that isn't a genuine raster image is rejected
// outright. Re-encoding the decoded pixels into a fresh file (rather than
// storing the uploaded bytes as-is) strips EXIF/metadata, discards any
// payload a polyglot file hid after the image data, and neutralizes
// SVG/script-based attacks since SVG is not in the allow-list.
const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp"]);

// Caps total pixel count (not just file size) so a small file that decodes
// to an enormous bitmap ("decompression bomb") can't exhaust server memory.
const MAX_PIXELS = 25_000_000; // ~25 megapixels, e.g. 5000x5000

export const IMAGE_CONTENT_TYPE: Record<string, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export const IMAGE_EXTENSION: Record<string, string> = {
  jpeg: ".jpg",
  png: ".png",
  webp: ".webp",
};

type ValidatedImage = {
  image: Sharp;
  format: "jpeg" | "png" | "webp";
  contentType: string;
  extension: string;
};

export async function loadValidatedImage(buffer: Buffer): Promise<ValidatedImage | { error: string }> {
  const sharp = (await import("sharp")).default;

  let image: Sharp;
  let metadata: Metadata;
  try {
    image = sharp(buffer, { limitInputPixels: MAX_PIXELS });
    metadata = await image.metadata();
  } catch {
    return { error: "That file isn't a valid image." };
  }

  if (!metadata.format || !ALLOWED_FORMATS.has(metadata.format)) {
    return { error: "Unsupported image format. Please upload a JPG, PNG or WEBP image." };
  }

  const format = metadata.format as "jpeg" | "png" | "webp";
  return {
    image,
    format,
    contentType: IMAGE_CONTENT_TYPE[format],
    extension: IMAGE_EXTENSION[format],
  };
}
