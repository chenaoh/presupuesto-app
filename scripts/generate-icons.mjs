import sharp from "sharp";
import { copyFile } from "fs/promises";

const SRC = "public/brand/logo.png";
const FOREST = { r: 6, g: 78, b: 59, alpha: 1 };
const LIGHT = { r: 243, g: 246, b: 244, alpha: 1 };

function isColorful(r, g, b) {
  return r > 32 || g > 32 || b > 32;
}

function convexHull(points) {
  points.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const p of points) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }
  const upper = [];
  for (let i = points.length - 1; i >= 0; i--) {
    const p = points[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

function fillPolygon(mask, width, height, hull) {
  const n = hull.length;
  for (let y = 0; y < height; y++) {
    const xs = [];
    for (let i = 0; i < n; i++) {
      const [x1, y1] = hull[i];
      const [x2, y2] = hull[(i + 1) % n];
      if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) {
        xs.push(x1 + ((y - y1) * (x2 - x1)) / (y2 - y1));
      }
    }
    xs.sort((a, b) => a - b);
    for (let i = 0; i < xs.length; i += 2) {
      const from = Math.max(0, Math.floor(xs[i]));
      const to = Math.min(width - 1, Math.ceil(xs[i + 1]));
      const row = y * width;
      for (let x = from; x <= to; x++) mask[row + x] = 1;
    }
  }
}

function dilate(mask, width, height, radius) {
  const out = new Uint8Array(mask.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let hit = 0;
      outer: for (let dy = -radius; dy <= radius; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= height) continue;
        for (let dx = -radius; dx <= radius; dx++) {
          const xx = x + dx;
          if (xx < 0 || xx >= width) continue;
          if (mask[yy * width + xx]) {
            hit = 1;
            break outer;
          }
        }
      }
      out[y * width + x] = hit;
    }
  }
  return out;
}

/** Quita el fondo negro del logo y deja el cubo (incluye líneas negras internas). */
async function punchBlackBackground(inputPath, outputPath) {
  const { data, info } = await sharp(inputPath).removeAlpha().raw().toBuffer({
    resolveWithObject: true,
  });
  const { width, height } = info;
  const points = [];
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const i = (y * width + x) * 3;
      if (isColorful(data[i], data[i + 1], data[i + 2])) points.push([x, y]);
    }
  }
  if (points.length < 10) throw new Error("No se encontró el cubo del logo.");
  const hull = convexHull(points);
  let mask = new Uint8Array(width * height);
  fillPolygon(mask, width, height, hull);
  mask = dilate(mask, width, height, 3);

  const rgba = Buffer.alloc(width * height * 4);
  for (let p = 0; p < width * height; p++) {
    const i = p * 3;
    const o = p * 4;
    rgba[o] = data[i];
    rgba[o + 1] = data[i + 1];
    rgba[o + 2] = data[i + 2];
    rgba[o + 3] = mask[p] ? 255 : 0;
  }

  const padded = await sharp(rgba, { raw: { width, height, channels: 4 } })
    .trim({ threshold: 0 })
    .png()
    .toBuffer();

  const trimmed = await sharp(padded).metadata();
  const side = Math.max(trimmed.width ?? 1, trimmed.height ?? 1) + 48;
  await sharp({
    create: { width: side, height: side, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: padded, gravity: "center" }])
    .png()
    .toFile(outputPath);
}

async function writeBackground(outPath, size, bg, scale = 0.84) {
  const logoSize = Math.round(size * scale);
  const logo = await sharp(SRC).resize(logoSize, logoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: bg },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(outPath);
}

async function writeTransparent(outPath, size) {
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
          .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toBuffer(),
        gravity: "center",
      },
    ])
    .png()
    .toFile(outPath);
}

async function main() {
  const raw = process.argv[2];
  if (raw) {
    await punchBlackBackground(raw, SRC);
    console.log("Transparent logo written to", SRC);
  }

  await writeTransparent("public/icons/icon-512.png", 512);
  await writeTransparent("public/icons/icon-192.png", 192);
  await writeTransparent("public/icons/favicon-32x32.png", 32);

  await writeBackground("public/icons/apple-touch-icon.png", 180, LIGHT, 0.82);
  await writeBackground("public/icons/icon-maskable-512.png", 512, FOREST, 0.72);
  await writeBackground("public/icons/icon-maskable-192.png", 192, FOREST, 0.72);

  await writeTransparent("src/app/icon.png", 512);
  await writeBackground("src/app/apple-icon.png", 180, LIGHT, 0.82);

  await copyFile(SRC, "public/icons/icon-source.png");

  console.log("Icons generated from public/brand/logo.png");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
