/**
 * Ensures every local asset reference in content JSON resolves to a file under
 * public/. Run after fetchBlogs in prebuild (part of `npm run verify`).
 *
 * Scanned (same as Workstation, plus the TenthMatrix extras marked +):
 *   src/app/data/blogs/*.json              cover_image, images[].url, content HTML
 *   src/app/data/{locale}/blogs/*.json   + locale blog bodies
 *   src/app/data/{,en/}articles.json         image, content HTML
 *   src/app/data/pages/*.json              cover_image
 *   src/app/data/en/insights/**\/*.json   + hero_image, og_image, any "/img/…" string
 *
 * Checked prefixes: /img/, /images/, /insights/, /brand/.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const pub = path.join(root, "public");
const data = path.join(root, "src/app/data");
const PREFIX = "(?:img|images|insights|brand)";
const LOCALES = ["en", "es", "fr", "nl", "hi", "th", "zh", "ar", "bn", "pt", "ru", "ur", "pa"];

const refs = new Map(); // path -> first file that referenced it

const add = (p, from) => {
  if (!p || typeof p !== "string") return;
  const clean = p.split("?")[0].split("#")[0];
  if (!new RegExp(`^/${PREFIX}/`).test(clean)) return;
  if (!refs.has(clean)) refs.set(clean, from);
};

function collectFromString(s, from) {
  if (!s || typeof s !== "string") return;
  const srcRe = new RegExp(`(?:src|href|poster)=["'](/${PREFIX}/[^"'>\\s]+)["']`, "gi");
  const urlRe = new RegExp(`url\\(["']?(/${PREFIX}/[^)"'\\s]+)`, "gi");
  let m;
  while ((m = srcRe.exec(s))) add(m[1], from);
  while ((m = urlRe.exec(s))) add(m[1], from);
}

/** Walk any JSON value: bare path strings count, HTML strings are scanned. */
function collectDeep(node, from) {
  if (typeof node === "string") {
    // Bare paths count only when they name a file: insights JSON also holds route
    // links such as "/insights/jev" that share the /insights/ prefix.
    if (node.startsWith("/")) { if (/\.[a-z0-9]{2,5}$/i.test(node.split(/[?#]/)[0])) add(node, from); }
    else collectFromString(node, from);
  } else if (Array.isArray(node)) node.forEach((v) => collectDeep(v, from));
  else if (node && typeof node === "object") Object.values(node).forEach((v) => collectDeep(v, from));
}

const readJson = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    console.error(`verify-blog-assets: ${path.relative(root, file)} is not valid JSON: ${e.message}`);
    process.exit(1);
  }
};
const jsonFiles = (dir) =>
  fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => path.join(dir, f)) : [];
const walkJson = (dir, out = []) => {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkJson(p, out);
    else if (e.name.endsWith(".json")) out.push(p);
  }
  return out;
};

const blogDirs = [path.join(data, "blogs"), ...LOCALES.map((l) => path.join(data, l, "blogs"))];
for (const file of blogDirs.flatMap(jsonFiles)) {
  const j = readJson(file);
  const from = path.relative(root, file);
  add(j.cover_image, from);
  (Array.isArray(j.images) ? j.images : []).forEach((i) => add(i?.url, from));
  collectFromString(j.content, from);
}

for (const file of [path.join(data, "articles.json"), path.join(data, "en/articles.json")]) {
  if (!fs.existsSync(file)) continue;
  const from = path.relative(root, file);
  for (const a of readJson(file)?.data?.content || []) {
    add(a.image, from);
    collectFromString(a.content, from);
  }
}

for (const file of jsonFiles(path.join(data, "pages"))) {
  const arr = readJson(file);
  if (!Array.isArray(arr)) continue;
  for (const row of arr) add(row.cover_image, path.relative(root, file));
}

for (const file of walkJson(path.join(data, "en/insights"))) {
  collectDeep(readJson(file), path.relative(root, file));
}

const missing = [...refs].filter(([p]) => !fs.existsSync(path.join(pub, p)));

if (missing.length) {
  console.error("verify-blog-assets: missing files under public/:");
  missing.sort(([a], [b]) => a.localeCompare(b)).forEach(([p, from]) => console.error(`   ${p}   (from ${from})`));
  process.exit(1);
}
console.log(`verify-blog-assets: OK (${refs.size} referenced asset paths)`);
