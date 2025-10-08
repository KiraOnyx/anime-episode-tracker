#!/usr/bin/env node
import { promises as fs } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const videoExt = new Set([".mp4", ".mov", ".mkv"]);
const imageExt = new Set([".jpg", ".jpeg", ".png"]);
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "assets", "providers");

async function main() {
  const providers = await fs.readdir(rootDir, { withFileTypes: true });
  const tasks = providers
    .filter(dirent => dirent.isDirectory())
    .map(dirent => updateProvider(dirent.name));

  await Promise.all(tasks);
}

async function updateProvider(provider) {
  const dir = path.join(rootDir, provider);
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  const videos = [];
  const images = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (entry.name === "media.json") continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (videoExt.has(ext)) {
      videos.push(entry.name);
    } else if (imageExt.has(ext)) {
      images.push(entry.name);
    }
  }

  videos.sort();
  images.sort();

  const manifest = { videos, images };
  const target = path.join(dir, "media.json");
  await fs.writeFile(target, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log(`✔ Generated media.json for ${provider} (${videos.length} videos, ${images.length} images)`);
}

main().catch(error => {
  console.error("Failed to build provider media manifests:", error);
  process.exit(1);
});
