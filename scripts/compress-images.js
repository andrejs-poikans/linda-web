#!/usr/bin/env node
const fs = require("fs-extra");
const path = require("path");
const sharp = require("sharp");

const IMAGES_DIR = path.resolve(__dirname, "..", "astro", "public", "images");
const TARGET_MAX_DIM = 2048;
const TARGET_MAX_BYTES = 200 * 1024; // 200 KB

function isImageFile(fn) {
  const ext = path.extname(fn).toLowerCase();
  return [".jpg", ".jpeg", ".png", ".webp", ".svg", ".gif"].includes(ext);
}

async function removeBackupDirectories(dir) {
  const entries = await fs.readdir(dir);
  for (const entry of entries) {
    const entryPath = path.join(dir, entry);
    const stat = await fs.stat(entryPath);
    if (stat.isDirectory() && entry.startsWith("originals-backup-")) {
      await fs.remove(entryPath);
      console.log("Removed backup directory", entry);
    }
  }
}

async function getFiles(dir) {
  const out = [];
  const entries = await fs.readdir(dir);
  for (const e of entries) {
    const p = path.join(dir, e);
    const stat = await fs.stat(p);
    if (stat.isDirectory()) {
      if (e.startsWith("originals-backup-")) continue;
      const sub = await getFiles(p);
      out.push(...sub);
    } else if (stat.isFile() && isImageFile(p)) {
      out.push(p);
    }
  }
  return out;
}

async function compressFile(file) {
  const ext = path.extname(file).toLowerCase();
  const before = (await fs.stat(file)).size;
  let buffer;

  if (ext === ".svg") {
    // keep SVG as-is (could run svgo if desired)
    return { file, before, after: before };
  }

  // use sharp to read and optionally resize
  const image = sharp(file, { limitInputPixels: false });
  const meta = await image.metadata();
  let img = image;
  if (meta.width > TARGET_MAX_DIM || meta.height > TARGET_MAX_DIM) {
    const resizeOpts = {};
    if (meta.width >= meta.height) resizeOpts.width = TARGET_MAX_DIM;
    else resizeOpts.height = TARGET_MAX_DIM;
    img = image.resize(resizeOpts);
  }

  // output to buffer in same format (or webp for png if needed)
  if (ext === ".jpg" || ext === ".jpeg") {
    let quality = 82;
    let outBuf = await img
      .jpeg({ quality, progressive: true, chromaSubsampling: "4:2:0" })
      .toBuffer();
    // iterative quality reduction if needed (allow lower floor to reach target)
    while (outBuf.length > TARGET_MAX_BYTES && quality >= 48) {
      quality -= 6;
      outBuf = await img
        .jpeg({ quality, progressive: true, chromaSubsampling: "4:2:0" })
        .toBuffer();
    }
    // final attempt: if still too big, force a low-quality write
    if (outBuf.length > TARGET_MAX_BYTES) {
      quality = 40;
      outBuf = await img
        .jpeg({ quality, progressive: true, chromaSubsampling: "4:2:0" })
        .toBuffer();
    }
    await fs.writeFile(file, outBuf);
    return { file, before, after: outBuf.length };
  }

  if (ext === ".png") {
    // produce a PNG then run pngquant
    const pngBuf = await img.png({ compressionLevel: 9 }).toBuffer();
    await fs.writeFile(file, pngBuf);
    return { file, before, after: pngBuf.length };
  }

  if (ext === ".webp") {
    let quality = 84;
    let outBuf = await img.webp({ quality }).toBuffer();
    while (outBuf.length > TARGET_MAX_BYTES && quality >= 60) {
      quality -= 6;
      outBuf = await img.webp({ quality }).toBuffer();
    }
    await fs.writeFile(file, outBuf);
    return { file, before, after: outBuf.length };
  }

  // fallback: try to write buffer as original and then optimize with mozjpeg
  const fallbackBuf = await img.toBuffer();
  await fs.writeFile(file, fallbackBuf);
  const afterStat = (await fs.stat(file)).size;
  return { file, before, after: afterStat };
}

async function main() {
  console.log("Scanning images in", IMAGES_DIR);
  await removeBackupDirectories(IMAGES_DIR);

  const files = await getFiles(IMAGES_DIR);
  if (files.length === 0) {
    console.log("No images found in", IMAGES_DIR);
    return;
  }

  const report = [];
  for (const f of files) {
    try {
      process.stdout.write("Processing " + path.basename(f) + "... ");
      const res = await compressFile(f);
      report.push(res);
      process.stdout.write("done\n");
    } catch (err) {
      console.error("ERROR processing", f, err.message);
    }
  }

  console.log("\nReport: path | before bytes | after bytes");
  for (const r of report)
    console.log(r.file + " | " + r.before + " | " + r.after);
  console.log("\nImage compression complete. No backup folders are kept.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
