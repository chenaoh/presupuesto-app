import sharp from "sharp";
import { copyFile } from "fs/promises";

const SRC = "public/brand/logo.png";
const FOREST = { r: 6, g: 78, b: 59, alpha: 1 };
const LIGHT = { r: 243, g: 246, b: 244, alpha: 1 };

async function writeBackground(outPath, size, bg, scale = 0.84) {
  const logoSize = Math.round(size * scale);
  const logo = await sharp(SRC).resize(logoSize, logoSize).png().toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: bg },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(outPath);
}

async function main() {
  await sharp(SRC).resize(512, 512).png().toFile("public/icons/icon-512.png");
  await sharp(SRC).resize(192, 192).png().toFile("public/icons/icon-192.png");
  await sharp(SRC).resize(32, 32).png().toFile("public/icons/favicon-32x32.png");

  await writeBackground("public/icons/apple-touch-icon.png", 180, LIGHT, 0.8);
  await writeBackground("public/icons/icon-maskable-512.png", 512, FOREST);
  await writeBackground("public/icons/icon-maskable-192.png", 192, FOREST);

  await sharp(SRC).resize(512, 512).png().toFile("src/app/icon.png");
  await writeBackground("src/app/apple-icon.png", 180, LIGHT, 0.8);

  await copyFile(SRC, "public/icons/icon-source.png");

  console.log("Icons generated from public/brand/logo.png");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
