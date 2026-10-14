#!/usr/bin/env node
/**
 * Copy the canonical TenthMatrix theme tokens (design/tm-theme.css) verbatim
 * into the app:
 *
 *   src/app/styles/tm-theme.css
 *
 *   node scripts/sync-theme.mjs           write the copy     (npm run sync:theme)
 *   node scripts/sync-theme.mjs --check   fail on any drift  (npm run verify:theme)
 *
 * The copy is byte-for-byte identical to the source — never edit it; edit
 * design/tm-theme.css and re-run the sync.
 *
 * Missing source: `--check` fails with an explanation (the gate must not pass
 * on a placeholder), and the write mode exits 1 without touching the copy.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = 'design/tm-theme.css';
const TARGETS = ['src/app/styles/tm-theme.css'];
const check = process.argv.includes('--check');
const tag = check ? 'verify:theme' : 'sync-theme';

const srcPath = path.join(root, SOURCE);
if (!fs.existsSync(srcPath)) {
  console.error(
    `${tag}: ${SOURCE} does not exist yet.\n` +
      `  It is the canonical source of the --tm-* tokens (light + dark themes).\n` +
      `  Create it (design phase, §3 of TENTHMATRIX_BUILD.prompt.md), then run \`npm run sync:theme\`.`
  );
  process.exit(1);
}
const source = fs.readFileSync(srcPath);
if (!/--tm-[a-z]/.test(source.toString('utf8'))) {
  console.error(`${tag}: ${SOURCE} defines no --tm-* custom properties — is it the right file?`);
  process.exit(1);
}

let drift = 0;
for (const rel of TARGETS) {
  const dest = path.join(root, rel);
  const current = fs.existsSync(dest) ? fs.readFileSync(dest) : null;
  const same = current !== null && Buffer.compare(current, source) === 0;
  if (check) {
    if (!same) {
      drift += 1;
      console.error(`verify:theme: ${rel} ${current === null ? 'is missing' : 'differs from'} ${SOURCE}`);
    }
    continue;
  }
  if (same) {
    console.log(`sync-theme: ${rel} up to date`);
    continue;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, source);
  console.log(`sync-theme: wrote ${rel}`);
}

if (check) {
  if (drift) {
    console.error('verify:theme: run `npm run sync:theme` and commit the copy.');
    process.exit(1);
  }
  console.log(`verify:theme: ${TARGETS.length} cop${TARGETS.length === 1 ? 'y matches' : 'ies match'} ${SOURCE}`);
}
