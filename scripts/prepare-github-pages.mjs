import { access, rename, rm } from "node:fs/promises";
import { resolve } from "node:path";

const clientDirectory = resolve("dist/client");
const emittedAssets = resolve(clientDirectory, "qr-vui", "_next");
const pagesAssets = resolve(clientDirectory, "_next");

try {
  await access(emittedAssets);
} catch {
  throw new Error("GitHub Pages build is missing its static asset directory.");
}

await rm(pagesAssets, { recursive: true, force: true });
await rename(emittedAssets, pagesAssets);
await rm(resolve(clientDirectory, "qr-vui"), { recursive: true, force: true });
