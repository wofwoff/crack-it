import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import sharp from "sharp";

const root = process.cwd();
const appName = "CrackIt";
const buildDir = path.join(root, "build", "mac");
const appDir = path.join(buildDir, `${appName}.app`);
const contentsDir = path.join(appDir, "Contents");
const macOSDir = path.join(contentsDir, "MacOS");
const resourcesDir = path.join(contentsDir, "Resources");
const distDir = path.join(root, "dist");
const swiftSource = path.join(root, "macos", appName, `${appName}.swift`);
const infoPlistSource = path.join(root, "macos", appName, "Info.plist");
const iconPngPath = path.join(root, "ios", "App", "App", "Assets.xcassets", "AppIcon.appiconset", "AppIcon-512@2x.png");

const flamePath =
  "M9 0C9 0 11.5 6 8 9.5C8 9.5 5.5 7 3.5 8.5C3.5 8.5 0 14.5 7.5 18.5C7.5 18.5 5.5 16 8 14.5C8 14.5 9.5 21 14 21C14 21 19 18.5 19 12C19 6 14.5 9.5 14.5 9.5C14.5 9.5 17 4.5 13 2.5C13 2.5 13 7 11 7C11 7 13.5 1 9 0Z";

const fallbackIconSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="#FAF8F4"/>
  <rect x="1.5" y="1.5" width="1021" height="1021" rx="224" fill="none" stroke="#E8DFD0" stroke-width="14"/>
  <g transform="translate(186.73 197) scale(30)">
    <path d="${flamePath}" fill="#C87A28"/>
  </g>
</svg>`;

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      stdio: "inherit",
      ...options,
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });
  });
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function copyDirectory(source, destination) {
  await fs.cp(source, destination, { recursive: true });
}

async function sourceIconBuffer() {
  if (await pathExists(iconPngPath)) {
    return fs.readFile(iconPngPath);
  }

  return sharp(Buffer.from(fallbackIconSvg))
    .resize(1024, 1024)
    .flatten({ background: "#FAF8F4" })
    .png()
    .toBuffer();
}

async function createIcns() {
  const iconBuffer = await sourceIconBuffer();
  const sizes = [
    ["icp4", 16],
    ["icp5", 32],
    ["icp6", 64],
    ["ic07", 128],
    ["ic08", 256],
    ["ic09", 512],
    ["ic10", 1024],
  ];

  const chunks = await Promise.all(
    sizes.map(async ([type, size]) => {
      const png = await sharp(iconBuffer)
        .resize(size, size)
        .png()
        .toBuffer();
      const header = Buffer.alloc(8);
      header.write(type, 0, 4, "ascii");
      header.writeUInt32BE(png.length + header.length, 4);
      return Buffer.concat([header, png]);
    })
  );

  const iconHeader = Buffer.alloc(8);
  const iconLength = chunks.reduce((sum, chunk) => sum + chunk.length, iconHeader.length);
  iconHeader.write("icns", 0, 4, "ascii");
  iconHeader.writeUInt32BE(iconLength, 4);
  await fs.writeFile(path.join(resourcesDir, "AppIcon.icns"), Buffer.concat([iconHeader, ...chunks]));
}

async function main() {
  if (!(await pathExists(path.join(distDir, "index.html")))) {
    throw new Error("dist/index.html was not found. Run vite build before packaging the Mac app.");
  }

  await fs.rm(appDir, { recursive: true, force: true });
  await fs.mkdir(macOSDir, { recursive: true });
  await fs.mkdir(resourcesDir, { recursive: true });

  await copyDirectory(distDir, path.join(resourcesDir, "dist"));
  await fs.copyFile(infoPlistSource, path.join(contentsDir, "Info.plist"));
  await fs.writeFile(path.join(contentsDir, "PkgInfo"), "APPL????");

  await createIcns();

  await run("swiftc", [
    "-O",
    "-module-cache-path",
    path.join(buildDir, "ModuleCache"),
    "-framework",
    "AppKit",
    "-framework",
    "WebKit",
    swiftSource,
    "-o",
    path.join(macOSDir, appName),
  ]);

  await run("chmod", ["755", path.join(macOSDir, appName)]);
  await run("codesign", ["--force", "--deep", "--sign", "-", appDir]);

  console.log(`Built ${appDir}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
