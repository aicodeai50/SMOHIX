import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
/** HQ micro-mark — must match `app/icon.svg` (Flow Mark S symbol, no text). */
const svgPath = join(root, "app", "icon.svg");
const pngPath = join(root, "public", "icon.png");
const icoPath = join(root, "public", "favicon.ico");

const pngToIco = (await import("png-to-ico")).default;

const svg = readFileSync(svgPath);
/** 512px master PNG for PWA / metadata; transparent background preserved. */
await sharp(svg).resize(512, 512).png().toFile(pngPath);

const base = sharp(readFileSync(pngPath));
const sizes = [16, 32, 48, 64];
const buffers = await Promise.all(
  sizes.map((s) => base.clone().resize(s, s, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()),
);

const buf = await pngToIco(buffers);
writeFileSync(icoPath, buf);
