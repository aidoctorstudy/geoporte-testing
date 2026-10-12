// Generates public/open-graph.png — the sitewide Open Graph / Twitter card
// image. Replaces a leftover stock asset (an unrelated marble statue photo,
// never swapped for real branding) with the actual Geoporte logo on the
// site's own dark-navy background, at the standard 1200x630 OG size.
//
// Re-run after changing `public/assets/logo/geoporte-logo.png` (the
// background-removed cutout `process-logo.mjs` produces) or the brand
// wordmark/tagline in `src/lib/company.ts`.
import sharp from "sharp";

const LOGO_SRC = "public/assets/logo/geoporte-logo.png";
const OUT = "public/open-graph.png";

const WIDTH = 1200;
const HEIGHT = 630;
// Matches siteConfig.themeColor / --raw-color-navy-950 in globals.css.
const BACKGROUND = "#01040e";
const LOGO_SIZE = 220;

const WORDMARK = "GEOPORTE"; // brand.wordmark, src/lib/company.ts
const TAGLINE = "Design Engineering Advisory"; // brand.tagline, same file

const logo = await sharp(LOGO_SRC).resize(LOGO_SIZE, LOGO_SIZE).toBuffer();

// Matches the nav wordmark's own treatment (Nav.tsx: uppercase, tracked-out
// letter-spacing) — white wordmark, muted slate tagline (--raw-color-label-slate).
const textSvg = `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <text x="50%" y="430" text-anchor="middle"
      font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="56"
      letter-spacing="10" fill="#ffffff">${WORDMARK}</text>
    <text x="50%" y="472" text-anchor="middle"
      font-family="Arial, Helvetica, sans-serif" font-weight="400" font-size="24"
      letter-spacing="2" fill="#94a3b8">${TAGLINE}</text>
  </svg>
`;

await sharp({
  create: {
    width: WIDTH,
    height: HEIGHT,
    channels: 4,
    background: BACKGROUND,
  },
})
  .composite([
    { input: logo, left: Math.round((WIDTH - LOGO_SIZE) / 2), top: 130 },
    { input: Buffer.from(textSvg), left: 0, top: 0 },
  ])
  .png()
  .toFile(OUT);

console.log("wrote", OUT);
