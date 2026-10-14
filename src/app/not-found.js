import Link from 'next/link';
import Document from './Document';

// Outside any locale (e.g. a stray /api-like path). Locale pages use
// src/app/[locale]/not-found.js. No provider here, so copy is English. The root
// layout renders no <html>, so this page brings its own Document.
export default function NotFound() {
  return (
    <Document lang="en">
      <main
        id="main"
        style={{
          minHeight: '70vh',
          display: 'grid',
          placeItems: 'center',
          padding: 'var(--tm-space-16) var(--tm-gutter)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gap: 'var(--tm-space-5)',
            maxWidth: '56ch',
          }}
        >
          <p className="tm-eyebrow">404</p>
          <h1>That page isn't here</h1>
          <p className="tm-lede">It may have moved when TenthMatrix split from Workstation, or the link is mistyped.</p>
          <p>
            <Link href="/en">Go to the TenthMatrix home page</Link>
          </p>
        </div>
      </main>
    </Document>
  );
}
