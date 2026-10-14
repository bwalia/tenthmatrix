/**
 * Ensures every .svg under public/ is well-formed XML (UTF-8).
 * Browsers reject img tags pointing at .svg when the document is not valid XML
 * (e.g. bare &, control bytes, lone 0xB7). Run before build via prebuild.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { XMLValidator } from "fast-xml-parser";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicRoot = path.join(__dirname, "..", "public");

function walkSvg(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, name.name);
    if (name.isDirectory()) walkSvg(p, out);
    else if (name.name.endsWith(".svg")) out.push(p);
  }
  return out;
}

const files = walkSvg(publicRoot).sort((a, b) => a.localeCompare(b));
const errors = [];

for (const abs of files) {
  const buf = fs.readFileSync(abs);
  // Node's default utf8 decoder replaces invalid bytes; browsers do not.
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(buf);
  } catch (e) {
    errors.push({
      file: path.relative(process.cwd(), abs),
      err: `invalid UTF-8 (${e.message}) — browsers will not render this SVG in <img>`,
    });
    continue;
  }
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] === 0xb7 && (i === 0 || buf[i - 1] !== 0xc2)) {
      errors.push({
        file: path.relative(process.cwd(), abs),
        err: `lone 0xB7 at byte ${i} (use UTF-8 U+00B7 C2 B7) — browsers will not render this SVG in <img>`,
      });
      break;
    }
  }
  let xml;
  try {
    xml = buf.toString("utf8");
  } catch (e) {
    errors.push({ file: path.relative(process.cwd(), abs), err: String(e.message) });
    continue;
  }
  const control = /[\x00-\x08\x0b\x0c\x0e-\x1f]/;
  if (control.test(xml)) {
    errors.push({
      file: path.relative(process.cwd(), abs),
      err: "contains C0 control bytes (invalid in XML 1.0 text)",
    });
    continue;
  }
  const result = XMLValidator.validate(xml, { allowBooleanAttributes: true });
  if (result !== true) {
    errors.push({ file: path.relative(process.cwd(), abs), err: result });
  }
}

if (errors.length) {
  console.error("verify-svg-xml: invalid XML in SVG files:");
  for (const e of errors) {
    console.error(" ", e.file);
    console.error("   ", typeof e.err === "object" ? JSON.stringify(e.err, null, 2) : e.err);
  }
  process.exit(1);
}

console.log(`verify-svg-xml: OK (${files.length} files under public/)`);
