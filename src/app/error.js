'use client';

import Link from 'next/link';

export default function Error({ reset }) {
  return (
    <main id="main" style={{ minHeight: '70vh', display: 'grid', placeItems: 'center', padding: 'var(--tm-space-16) var(--tm-gutter)' }}>
      <div style={{ display: 'grid', gap: 'var(--tm-space-5)', maxWidth: '56ch' }}>
        <h1>That page didn't load</h1>
        <p className="tm-lede">Try again, or go back to the articles.</p>
        <p style={{ display: 'flex', gap: 'var(--tm-space-4)', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => reset()}
            style={{ minHeight: 44, padding: '0 1.15rem', border: 0, borderRadius: 'var(--tm-radius-sm)', background: 'var(--tm-accent)', color: 'var(--tm-accent-contrast)', fontWeight: 600 }}
          >
            Try again
          </button>
          <Link href="/en/articles">Articles</Link>
        </p>
      </div>
    </main>
  );
}
