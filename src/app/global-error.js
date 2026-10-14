'use client';

// Last-resort boundary: replaces the root layout, so no tokens or fonts are
// guaranteed. Brand constants inline (graphite, paper, viridian).
export default function GlobalError({ reset }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#f7f6f2', color: '#12161a', fontFamily: 'system-ui, sans-serif' }}>
        <main id="main" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '4rem 1rem' }}>
          <div style={{ maxWidth: '56ch', display: 'grid', gap: '1.25rem' }}>
            <h1 style={{ margin: 0, fontSize: '2.25rem', lineHeight: 1.1 }}>That page didn't load</h1>
            <p style={{ margin: 0, color: '#474d55' }}>Try again, or go back to the TenthMatrix home page.</p>
            <p style={{ margin: 0, display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => reset()}
                style={{ minHeight: 44, padding: '0 1.15rem', border: 0, borderRadius: 6, background: '#0a7a57', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
              >
                Try again
              </button>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- global-error replaces the root layout; a hard navigation resets the app */}
              <a href="/en" style={{ color: '#0a7a57' }}>
                Home
              </a>
            </p>
          </div>
        </main>
      </body>
    </html>
  );
}
