import sharp from "sharp";
import { copyFile, writeFile } from "fs/promises";

const SRC = "public/brand/logo.png";

function isNearBlack(r, g, b) {
  return r <= 8 && g <= 8 && b <= 8;
}

function edgeBlackMask(data, width, height) {
  const n = width * height;
  const bg = new Uint8Array(n);
  const q = [];

  function tryPush(x, y) {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = y * width + x;
    if (bg[p]) return;
    const i = p * 3;
    if (!isNearBlack(data[i], data[i + 1], data[i + 2])) return;
    bg[p] = 1;
    q.push(p);
  }

  for (let x = 0; x < width; x++) {
    tryPush(x, 0);
    tryPush(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    tryPush(0, y);
    tryPush(width - 1, y);
  }

  for (let qi = 0; qi < q.length; qi++) {
    const p = q[qi];
    const x = p % width;
    const y = (p - x) / width;
    tryPush(x - 1, y);
    tryPush(x + 1, y);
    tryPush(x, y - 1);
    tryPush(x, y + 1);
  }

  return bg;
}

/** Conserva el logo tal cual; solo quita el fondo negro conectado al borde. */
async function importLogo(inputPath, outputPath) {
  const meta = await sharp(inputPath).metadata();

  if (meta.hasAlpha) {
    const trimmed = await sharp(inputPath).trim({ threshold: 0 }).png().toBuffer();
    const trimmedMeta = await sharp(trimmed).metadata();
    const side = Math.max(trimmedMeta.width ?? 1, trimmedMeta.height ?? 1) + 32;
    await sharp({
      create: {
        width: side,
        height: side,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([{ input: trimmed, gravity: "center" }])
      .png()
      .toFile(outputPath);
    return;
  }

  const { data, info } = await sharp(inputPath).raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const bg = edgeBlackMask(data, width, height);
  const rgba = Buffer.alloc(width * height * 4);

  for (let p = 0; p < width * height; p++) {
    const i = p * 3;
    const o = p * 4;
    rgba[o] = data[i];
    rgba[o + 1] = data[i + 1];
    rgba[o + 2] = data[i + 2];
    rgba[o + 3] = bg[p] ? 0 : 255;
  }

  const trimmed = await sharp(rgba, { raw: { width, height, channels: 4 } })
    .trim({ threshold: 0 })
    .png()
    .toBuffer();

  const trimmedMeta = await sharp(trimmed).metadata();
  const side = Math.max(trimmedMeta.width ?? 1, trimmedMeta.height ?? 1) + 32;
  await sharp({
    create: {
      width: side,
      height: side,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: trimmed, gravity: "center" }])
    .png()
    .toFile(outputPath);
}

async function writeTransparent(outPath, size, scale = 0.92) {
  const logoSize = Math.round(size * scale);
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: await sharp(SRC)
          .resize(logoSize, logoSize, {
            fit: "contain",
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .png()
          .toBuffer(),
        gravity: "center",
      },
    ])
    .png()
    .toFile(outPath);
}

/** ICO con PNG embebido (lo que piden Chrome y Safari en /favicon.ico). */
async function writePngIco(pngPath, icoPath) {
  const png = await sharp(pngPath).resize(32, 32).png().toBuffer();
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  entry.writeUInt8(32, 0);
  entry.writeUInt8(32, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(22, 12);
  await writeFile(icoPath, Buffer.concat([header, entry, png]));
}

async function main() {
  const raw = process.argv[2];
  if (raw) {
    await importLogo(raw, SRC);
    console.log("Logo PNG transparente guardado en", SRC);
  }

  await writeTransparent("public/icons/icon-512.png", 512);
  await writeTransparent("public/icons/icon-192.png", 192);
  await writeTransparent("public/icons/icon-maskable-512.png", 512);
  await writeTransparent("public/icons/icon-maskable-192.png", 192);
  await writeTransparent("public/icons/apple-touch-icon.png", 180);
  await writeTransparent("public/icons/favicon-32x32.png", 32);
  await writeTransparent("src/app/icon.png", 192);
  await writeTransparent("src/app/apple-icon.png", 180);

  await writePngIco("public/icons/favicon-32x32.png", "public/favicon.ico");
  await copyFile("public/favicon.ico", "src/app/favicon.ico");
  await copyFile("public/icons/favicon-32x32.png", "public/favicon-32x32.png");

  await copyFile(SRC, "public/icons/icon-source.png");

  console.log("Iconos generados con fondo transparente desde", SRC);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
