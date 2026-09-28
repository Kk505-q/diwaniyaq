// Upload type safety. SVG (and other markup) can carry scripts, so it is
// blocked; all raster image formats (PNG/JPG/HEIC/WEBP/GIF...) and PDF are
// allowed. Combined with `X-Content-Type-Options: nosniff` on serving, a file
// with a spoofed image type still cannot execute as HTML/JS.
const BLOCKED = ["image/svg+xml"];

export function isAllowedImage(type: string): boolean {
  return typeof type === "string" && type.startsWith("image/") && !BLOCKED.includes(type);
}

export function isAllowedProof(type: string): boolean {
  return isAllowedImage(type) || type === "application/pdf";
}
