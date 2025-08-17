import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outDir = path.resolve(__dirname, "../public/icons");

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#ef4444"/>
      <stop offset="100%" stop-color="#dc2626"/>
    </linearGradient>
    <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="rgba(0,0,0,0.25)" />
    </filter>
  </defs>
  <rect x="32" y="32" width="448" height="448" rx="96" fill="url(#g)"/>
  <g filter="url(#s)">
    <circle cx="256" cy="256" r="160" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.35)" stroke-width="6"/>
    <path d="M220 180 L356 256 L220 332 Z" fill="#fff"/>
    <g transform="translate(256 256)">
      <path d="M0 -108 A108 108 0 0 1 108 0" stroke="#fff" stroke-width="14" fill="none" stroke-linecap="round"/>
      <circle cx="108" cy="0" r="10" fill="#fff"/>
      <text x="-8" y="44" font-size="64" font-family="Inter, Arial, sans-serif" fill="#fff">x</text>
    </g>
  </g>
</svg>`;

async function ensureDir(p) {
    await fs.mkdir(p, { recursive: true });
}

async function generate() {
    await ensureDir(outDir);
    await fs.writeFile(path.join(outDir, "icon.svg"), svg, "utf8");

    const sizes = [16, 32, 48, 128, 256, 512];
    await Promise.all(
        sizes.map(async (size) => {
            const buffer = await sharp(Buffer.from(svg))
                .resize(size, size)
                .png()
                .toBuffer();
            await fs.writeFile(path.join(outDir, `icon-${size}.png`), buffer);
        })
    );

    console.log(`Generated icons at ${outDir}`);
}

generate().catch((err) => {
    console.error(err);
    process.exit(1);
});
