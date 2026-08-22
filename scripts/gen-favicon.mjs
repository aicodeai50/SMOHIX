import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
/** HQ micro-mark — must match `app/icon.svg` (Flow Mark S symbol, no text). */
const svgPath = join(root, "app", "icon.svg");
const png512Path = join(root, "public", "icon.png");
const png192Path = join(root, "public", "icon-192.png");
const png48Path = join(root, "public", "icon-48.png");
const icoPath = join(root, "public", "favicon.ico");

const pngToIco = (await import("png-to-ico")).default;

const svg = readFileSync(svgPath);
/** 512px master PNG for PWA / metadata / JSON-LD; square 1:1. */
await sharp(svg).resize(512, 512).png().toFile(png512Path);
await sharp(svg).resize(192, 192).png().toFile(png192Path);
await sharp(svg).resize(48, 48).png().toFile(png48Path);

const base = sharp(readFileSync(png512Path));
const sizes = [16, 32, 48, 64];
const buffers = await Promise.all(
  sizes.map((s) =>
    base
      .clone()
      .resize(s, s, { fit: "contain", background: { r: 6, g: 7, b: 11, alpha: 1 } })
      .png()
      .toBuffer(),
  ),
);

const buf = await pngToIco(buffers);
writeFileSync(icoPath, buf);
