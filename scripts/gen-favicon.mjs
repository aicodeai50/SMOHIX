import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
/** Official mark — must match `app/icon.svg` (single source of truth). */
const svgPath = join(root, "app", "icon.svg");
const pngPath = join(root, "public", "icon.png");
const icoPath = join(root, "public", "favicon.ico");

const pngToIco = (await import("png-to-ico")).default;

const svg = readFileSync(svgPath);
await sharp(svg).resize(512, 512).png().toFile(pngPath);

const base = sharp(readFileSync(pngPath));
const sizes = [16, 32, 48];
const buffers = await Promise.all(
  sizes.map((s) => base.clone().resize(s, s, { fit: "cover", position: "center" }).png().toBuffer()),
);

const buf = await pngToIco(buffers);
writeFileSync(icoPath, buf);
