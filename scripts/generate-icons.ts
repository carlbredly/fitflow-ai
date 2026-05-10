import sharp from "sharp";
import { writeFileSync } from "fs";

const SIZE = 180;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#00E5A0"/>
      <stop offset="100%" stop-color="#FF6B35"/>
    </linearGradient>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" rx="${Math.round(SIZE * 0.22)}" fill="#0D0D0D"/>
  <rect x="${Math.round(SIZE * 0.04)}" y="${Math.round(SIZE * 0.04)}" width="${Math.round(SIZE * 0.92)}" height="${Math.round(SIZE * 0.92)}" rx="${Math.round(SIZE * 0.19)}" fill="url(#g)"/>
  <text x="${SIZE / 2}" y="${Math.round(SIZE * 0.72)}" text-anchor="middle" font-size="${Math.round(SIZE * 0.54)}" fill="#0D0D0D" font-family="sans-serif">⚡</text>
</svg>`;

const png = await sharp(Buffer.from(svg)).resize(SIZE, SIZE).png().toBuffer();
writeFileSync("public/icon-180.png", png);
writeFileSync("dist/client/icon-180.png", png);
console.log("✓ iOS icon generated: icon-180.png");
