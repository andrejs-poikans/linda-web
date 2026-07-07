#!/usr/bin/env node
const fs = require("fs-extra");
const path = require("path");

const IMAGES_DIR = path.resolve(__dirname, "..", "astro", "public", "images");
const TARGET_MAX_DIM = 3072;
const TARGET_MAX_BYTES = 300 * 1024; // 300 KB
const JPG_QUALITY = 90; // higher = less compression
const WEBP_QUALITY = 88; // target quality for generated WebP
const CONVERT_TO_WEBP = true; // convert all raster images to .webp

let Jimp;
try {
  Jimp = require("jimp");
} catch (err) {
  Jimp = null;
  console.warn(
    "jimp is not available; skipping image compression.",
    err.message,
  );
}

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

  if (ext === ".svg") {
    return { file, before, after: before };
  }

  if (!Jimp) {
    return { file, before, after: before, skipped: true };
  }

  try {
    const image = await Jimp.read(file);
    if (
      image.getWidth() > TARGET_MAX_DIM ||
      image.getHeight() > TARGET_MAX_DIM
    ) {
      image.scaleToFit(TARGET_MAX_DIM, TARGET_MAX_DIM);
    }

    // Skip already-optimized WebP files to avoid re-processing.
    if (ext === ".webp") {
      return { file, before, after: before, skipped: true };
    }

    // Apply a higher JPEG quality (less compression) before conversion.
    image.quality(JPG_QUALITY);

    if (CONVERT_TO_WEBP) {
      // Convert everything to WebP and replace the original file.
      const outFile = file.replace(/\.[^.]+$/, ".webp");
      try {
        const buffer = await image.getBufferAsync(Jimp.MIME_WEBP);
        await fs.writeFile(outFile, buffer);
        if (outFile !== file) {
          await fs.remove(file);
        }
        const after = (await fs.stat(outFile)).size;
        return { file: outFile, before, after };
      } catch (err) {
        console.warn("Failed to write webp for", file, err.message);
        // fallback: write original format
        await image.writeAsync(file);
        const after = (await fs.stat(file)).size;
        return { file, before, after };
      }
    } else {
      await image.writeAsync(file);
      const after = (await fs.stat(file)).size;
      return { file, before, after };
    }
  } catch (err) {
    console.warn("Skipping compression for", file, err.message);
    return { file, before, after: before, skipped: true };
  }
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
  for (const r of report) {
    const status = r.skipped ? "skipped" : "ok";
    console.log(r.file + " | " + r.before + " | " + r.after + " | " + status);
  }
  console.log("\nImage compression complete. No backup folders are kept.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
