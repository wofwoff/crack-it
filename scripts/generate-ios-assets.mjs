import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const iconPath = path.join(root, "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png");
const splashDir = path.join(root, "ios/App/App/Assets.xcassets/Splash.imageset");

const flamePath =
  "M9 0C9 0 11.5 6 8 9.5C8 9.5 5.5 7 3.5 8.5C3.5 8.5 0 14.5 7.5 18.5C7.5 18.5 5.5 16 8 14.5C8 14.5 9.5 21 14 21C14 21 19 18.5 19 12C19 6 14.5 9.5 14.5 9.5C14.5 9.5 17 4.5 13 2.5C13 2.5 13 7 11 7C11 7 13.5 1 9 0Z";

const iconSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="#FAF8F4"/>
  <rect x="1.5" y="1.5" width="1021" height="1021" rx="224" fill="none" stroke="#E8DFD0" stroke-width="14"/>
  <g transform="translate(186.73 197) scale(30)">
    <path d="${flamePath}" fill="#C87A28"/>
  </g>
</svg>`;

const splashSvg = `
<svg width="2732" height="2732" viewBox="0 0 2732 2732" xmlns="http://www.w3.org/2000/svg">
  <rect width="2732" height="2732" fill="#FAF8F4"/>
  <rect x="1106" y="930" width="520" height="520" rx="132" fill="#1A1714"/>
  <g transform="translate(1203.37 1032.5) scale(15)">
    <path d="${flamePath}" fill="#C87A28"/>
  </g>
  <text x="1366" y="1602" text-anchor="middle" font-family="Georgia, serif" font-size="118" font-style="italic" fill="#1A1714">CrackIt</text>
  <text x="1366" y="1692" text-anchor="middle" font-family="Outfit, Arial, sans-serif" font-size="42" font-weight="600" letter-spacing="13" fill="#B0A89E">DAILY RETRIEVAL PRACTICE</text>
</svg>`;

async function renderPng(svg, outputPath, size) {
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .flatten({ background: "#FAF8F4" })
    .png()
    .toFile(outputPath);
}

await fs.mkdir(path.dirname(iconPath), { recursive: true });
await fs.mkdir(splashDir, { recursive: true });

await renderPng(iconSvg, iconPath, 1024);
await Promise.all([
  renderPng(splashSvg, path.join(splashDir, "splash-2732x2732-2.png"), 2732),
  renderPng(splashSvg, path.join(splashDir, "splash-2732x2732-1.png"), 2732),
  renderPng(splashSvg, path.join(splashDir, "splash-2732x2732.png"), 2732),
]);

console.log("Generated iOS icon and splash assets.");
