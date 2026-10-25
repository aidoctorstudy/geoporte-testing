import sharp from "sharp";
import { writeFile } from "node:fs/promises";

const SRC = "public/assets/logo/geoporte-logo.png";

const pngTargets = [
  { out: "public/favicon-16x16.png", size: 16 },
  { out: "public/favicon-32x32.png", size: 32 },
  { out: "public/favicon.png", size: 48 },
  { out: "public/apple-icon-180x180.png", size: 180 },
  { out: "public/android-icon-36x36.png", size: 36 },
  { out: "public/android-icon-48x48.png", size: 48 },
  { out: "public/android-icon-72x72.png", size: 72 },
  { out: "public/android-icon-96x96.png", size: 96 },
  { out: "public/android-icon-144x144.png", size: 144 },
  { out: "public/android-icon-192x192.png", size: 192 },
];

async function renderPng(size) {
  return sharp(SRC)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

// Build a multi-resolution .ico by embedding PNG-compressed frames directly
// (ICO "format 2" — supported by every modern browser/OS, no BMP encoding needed).
function buildIco(pngBuffers) {
  const count = pngBuffers.length;
  const header = Buffer.alloc(6); // ICONDIR is exactly 6 bytes
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(count, 4);

  let offset = 6 + 16 * count; // past ICONDIR + all ICONDIRENTRYs
  const entries = [];
  for (let i = 0; i < count; i++) {
    const { size, buffer } = pngBuffers[i];
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 = 256)
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(buffer.length, 8); // image data size
    entry.writeUInt32LE(offset, 12); // image data offset
    offset += buffer.length;
    entries.push(entry);
  }

  return Buffer.concat([header, ...entries, ...pngBuffers.map((p) => p.buffer)]);
}

for (const { out, size } of pngTargets) {
  const buffer = await renderPng(size);
  await writeFile(out, buffer);
  console.log("wrote", out);
}

const icoSizes = [16, 32, 48];
const icoFrames = [];
for (const size of icoSizes) {
  icoFrames.push({ size, buffer: await renderPng(size) });
}
const ico = buildIco(icoFrames);

// app/favicon.ico is a Next.js file-convention route — it shadows
// public/favicon.ico at the /favicon.ico URL, so it's the one that must
// carry the real icon. See ADR-0108.
await writeFile("src/app/favicon.ico", ico);
console.log("wrote src/app/favicon.ico");
