import { ImageResponse } from 'next/og';

/**
 * Shared next/og template for article / blog / insight OG images (1200×630).
 * PLACEHOLDER LAYOUT — the design phase replaces colours, type and the mark
 * with the TenthMatrix brand (public/brand/). Keep the signature stable:
 * renderOgImage({ title, eyebrow }).
 */
export const OG_SIZE = { width: 1200, height: 630 };

export function renderOgImage({ title = 'TenthMatrix', eyebrow = 'TenthMatrix' } = {}) {
  const safeTitle = String(title).slice(0, 140);
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px',
          background: '#f5f5f0',
          color: '#161616',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', fontSize: 28, letterSpacing: 4, textTransform: 'uppercase' }}>{eyebrow}</div>
        <div style={{ display: 'flex', fontSize: safeTitle.length > 70 ? 56 : 68, fontWeight: 700, lineHeight: 1.1 }}>
          {safeTitle}
        </div>
        <div style={{ display: 'flex', fontSize: 28 }}>tenthmatrix.com</div>
      </div>
    ),
    OG_SIZE
  );
}
