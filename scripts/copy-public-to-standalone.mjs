/**
 * After `next build` with output: 'standalone', Next does not always place `public/`
 * under `.next/standalone/`. Copy it so `node .next/standalone/server.js` serves /img, etc.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const standalone = path.join(root, ".next", "standalone");
const serverJs = path.join(standalone, "server.js");
const pubSrc = path.join(root, "public");
const pubDst = path.join(standalone, "public");

if (!fs.existsSync(serverJs)) {
  console.log("copy-public-to-standalone: no standalone server.js; skip.");
  process.exit(0);
}
if (!fs.existsSync(pubSrc)) {
  console.warn("copy-public-to-standalone: public/ missing; skip.");
  process.exit(0);
}

fs.mkdirSync(standalone, { recursive: true });
fs.cpSync(pubSrc, pubDst, { recursive: true });
console.log("copy-public-to-standalone: copied public/ -> .next/standalone/public/");
