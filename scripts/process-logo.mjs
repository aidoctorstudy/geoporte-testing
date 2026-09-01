import sharp from "sharp";

const SRC = "public/assets/logo/geoporte-logo-source.jpg";
const OUT = "public/assets/logo/geoporte-logo.png";
const SIZE = 480;

const { data, info } = await sharp(SRC)
  .resize(SIZE, SIZE)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

for (let i = 0; i < data.length; i += 4) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  let alpha;
  if (luminance > 245) alpha = 0;
  else if (luminance < 200) alpha = 255;
  else alpha = Math.round((255 * (245 - luminance)) / (245 - 200));
  data[i + 3] = alpha;
}

await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
  .png()
  .toFile(OUT);

console.log("wrote", OUT);
