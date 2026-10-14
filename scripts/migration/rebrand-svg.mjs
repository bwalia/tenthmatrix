#!/usr/bin/env node
/**
 * Rebrand text nodes inside migrated SVG diagrams/covers (the JSON rebrand
 * pass in rebrand.mjs does not look inside public/**.svg).
 *
 * Only <text>/<tspan> content is touched — never ids, hrefs or attributes.
 * Kept as-is on purpose:
 *   - "Workstation AI Shop" (Workstation's real store, referenced by the
 *     Ring Promoter case study)
 *   - "Workstation GPU boxes" and "Workstation: AI workstations ..." (hardware,
 *     belongs to Workstation)
 *   - SVGs whose manifest dest is "workstation"
 *
 *   node scripts/migration/rebrand-svg.mjs          # dry run, prints changes
 *   node scripts/migration/rebrand-svg.mjs --apply
 */
import fs from 'node:fs';
import path from 'node:path';

const APPLY = process.argv.includes('--apply');
const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'migration/manifest.json'), 'utf8'));
const skip = new Set(
  manifest.assets.filter((a) => a.dest === 'workstation').map((a) => a.path.replace(/^\//, 'public/')),
);

const KEEP = [
  /Workstation AI Shop/g,
  /WORKSTATION AI SHOP/g,
  /Workstation GPU boxes/g,
  // hardware pitch line in open-weights-production-stack.svg — that offer is Workstation's
  /Workstation: AI workstations/g,
];

function rebrandText(s) {
  const held = [];
  let out = s;
  for (const re of KEEP) out = out.replace(re, (m) => `\u0000${held.push(m) - 1}\u0000`);
  out = out
    .replace(/WORKSTATION\.CO\.UK/g, 'TENTHMATRIX.COM')
    .replace(/workstation\.co\.uk/g, 'tenthmatrix.com')
    .replace(/WORKSTATION/g, 'TENTHMATRIX')
    .replace(/Workstation/g, 'TenthMatrix');
  return out.replace(/\u0000(\d+)\u0000/g, (_, i) => held[Number(i)]);
}

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (p !== path.join(root, 'public/brand')) walk(p, acc);
    } else if (e.name.endsWith('.svg')) acc.push(p);
  }
  return acc;
}

let files = 0;
let nodes = 0;
for (const file of walk(path.join(root, 'public'))) {
  const rel = path.relative(root, file);
  if (skip.has(rel)) continue;
  const src = fs.readFileSync(file, 'utf8');
  let changed = 0;
  const next = src.replace(/(<(text|tspan)\b[^>]*>)([^<]*)(<)/g, (m, open, _tag, body, close) => {
    const nb = rebrandText(body);
    if (nb === body) return m;
    changed += 1;
    if (!APPLY) console.log(`${rel}: "${body.trim()}" -> "${nb.trim()}"`);
    return open + nb + close;
  });
  if (changed) {
    files += 1;
    nodes += changed;
    if (APPLY) fs.writeFileSync(file, next);
  }
}
console.log(`${APPLY ? 'applied' : 'dry run'}: ${nodes} text node(s) in ${files} SVG file(s)`);
