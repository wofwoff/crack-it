import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const iconPath = path.join(root, "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png");
const splashDir = path.join(root, "ios/App/App/Assets.xcassets/Splash.imageset");

const iconSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="#FAF8F4"/>
  <rect x="1.5" y="1.5" width="1021" height="1021" rx="224" fill="none" stroke="#E8DFD0" stroke-width="14"/>
  <g transform="translate(182 182) scale(12.7)">
    <rect x="10" y="16" width="34" height="26" rx="4" fill="#D8D0C4" transform="rotate(-6 27 29)"/>
    <rect x="10" y="14" width="34" height="26" rx="4" fill="#B0A89E" transform="rotate(-2 27 27)"/>
    <rect x="9" y="12" width="34" height="26" rx="4" fill="#1A1714"/>
    <rect x="15" y="20" width="14" height="2.5" rx="1.2" fill="#C87A28"/>
    <rect x="15" y="25" width="22" height="2" rx="1" fill="#6C655E"/>
  </g>
</svg>`;

const splashSvg = `
<svg width="2732" height="2732" viewBox="0 0 2732 2732" xmlns="http://www.w3.org/2000/svg">
  <rect width="2732" height="2732" fill="#FAF8F4"/>
  <rect x="1106" y="930" width="520" height="520" rx="132" fill="#1A1714"/>
  <text x="1366" y="1266" text-anchor="middle" font-family="Outfit, Arial, sans-serif" font-size="168" font-weight="700" fill="#FAF8F4" letter-spacing="10">PP</text>
  <text x="1366" y="1602" text-anchor="middle" font-family="Georgia, serif" font-size="118" font-style="italic" fill="#1A1714">PlacementPrep</text>
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
