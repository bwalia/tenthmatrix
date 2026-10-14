import fs from 'node:fs';
import path from 'node:path';
import { ImageResponse } from 'next/og';

/**
 * Shared next/og template for article / blog / insight OG images (1200x630):
 * public/brand/og-background.png (graphite + lattice on the right), the title
 * in Bricolage Grotesque in the left 680px, an IBM Plex Mono eyebrow, and the
 * on-dark lockup bottom-left (BRAND.md §9). Fonts are static TTF instances in
 * src/lib/og-fonts (Satori can't read woff2 or variable axes).
 * Signature is stable: renderOgImage({ title, eyebrow }).
 */
export const OG_SIZE = { width: 1200, height: 630 };

const root = process.cwd();
const read = (...p) => fs.readFileSync(path.join(root, ...p));
let assets = null;
function loadAssets() {
  if (assets) return assets;
  assets = {
    bg: `data:image/png;base64,${read('public/brand/og-background.png').toString('base64')}`,
    logo: `data:image/svg+xml;base64,${read('public/brand/tm-logo-on-dark.svg').toString('base64')}`,
    display: read('src/lib/og-fonts/BricolageGrotesque-SemiBold.ttf'),
    mono: read('src/lib/og-fonts/IBMPlexMono-Medium.ttf'),
  };
  return assets;
}

function titleSize(len) {
  if (len > 110) return 44;
  if (len > 80) return 50;
  if (len > 50) return 58;
  return 66;
}

// The bundled brand fonts cover Latin only; Satori can't shape scripts like
// Arabic or Devanagari through a fallback font (and errors out), so those
// cards use the English title instead. The page itself stays translated.
const LATIN = /^[\u0000-\u024F\u1E00-\u1EFF\u2000-\u206F\u20A0-\u20CF\u2100-\u214F]*$/;
export const isLatin = (s) => LATIN.test(String(s));

export function renderOgImage({ title = 'TenthMatrix', eyebrow = 'TenthMatrix', fallbackTitle = 'TenthMatrix' } = {}) {
  const a = loadAssets();
  const usable = isLatin(title) ? title : isLatin(fallbackTitle) ? fallbackTitle : 'TenthMatrix';
  const safeTitle = String(usable).replace(/\s+/g, ' ').trim().slice(0, 140);
  if (!isLatin(eyebrow)) eyebrow = 'TenthMatrix';
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', background: '#0e1113' }}>
        <img src={a.bg} width={1200} height={630} alt="" style={{ position: 'absolute', top: 0, left: 0 }} />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 760,
            height: 630,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '64px 0 56px 72px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'Plex Mono', fontSize: 22, letterSpacing: 2.5, textTransform: 'uppercase', color: '#b0b7b4' }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: '#3dd69e' }} />
            {eyebrow}
          </div>
          <div
            style={{
              display: 'flex',
              width: 680,
              fontFamily: 'Bricolage',
              fontSize: titleSize(safeTitle.length),
              lineHeight: 1.08,
              letterSpacing: -1.2,
              color: '#ffffff',
            }}
          >
            {safeTitle}
          </div>
          <img src={a.logo} height={36} width={266} alt="" />
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: 'Bricolage', data: a.display, weight: 600, style: 'normal' },
        { name: 'Plex Mono', data: a.mono, weight: 500, style: 'normal' },
      ],
    }
  );
}
