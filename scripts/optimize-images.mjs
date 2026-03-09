import sharp from 'sharp';
import { readdir, stat, mkdir } from 'fs/promises';
import { join, extname, relative } from 'path';

const PUBLIC = 'public';
const DIRS = ['public/images', 'public/slideshowimages', 'public/assets/visuals'];
const EXTENSIONS = new Set(['.png', '.jpg', '.jpeg']);

async function getAllImages(dir) {
  const files = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...await getAllImages(full));
      } else if (EXTENSIONS.has(extname(entry.name).toLowerCase())) {
        files.push(full);
      }
    }
  } catch { /* dir doesn't exist */ }
  return files;
}

async function convert(filePath) {
  const info = await stat(filePath);
  const sizeKB = Math.round(info.size / 1024);
  const outPath = filePath.replace(/\.(png|jpg|jpeg)$/i, '.webp');

  // Quality based on size — big images get more aggressive compression
  const quality = sizeKB > 3000 ? 70 : sizeKB > 1000 ? 75 : 80;

  // Resize if very large (slideshow images are 10MB+)
  const metadata = await sharp(filePath).metadata();
  const opts = {};
  if (metadata.width > 1920) {
    opts.width = 1920;
    opts.withoutEnlargement = true;
  }

  await sharp(filePath)
    .resize(opts.width ? { width: opts.width, withoutEnlargement: true } : undefined)
    .webp({ quality, effort: 6 })
    .toFile(outPath);

  const outInfo = await stat(outPath);
  const outKB = Math.round(outInfo.size / 1024);
  const rel = relative('.', filePath);
  console.log(`${rel}: ${sizeKB}KB → ${outKB}KB (${Math.round((1 - outKB / sizeKB) * 100)}% smaller)`);
}

async function main() {
  let total = 0;
  for (const dir of DIRS) {
    const images = await getAllImages(dir);
    total += images.length;
    for (const img of images) {
      await convert(img);
    }
  }
  console.log(`\nDone! Converted ${total} images to WebP.`);
}

main().catch(console.error);
