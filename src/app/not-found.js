import Link from 'next/link';

// Outside any locale (e.g. a stray /api-like path). Locale pages use
// src/app/[locale]/not-found.js instead.
export default function NotFound() {
  return (
    <main className="tm-container tm-error" id="main">
      <h1>Page not found</h1>
      <p>The page you are looking for does not exist or has moved.</p>
      <p>
        <Link href="/en">Go to the TenthMatrix home page</Link>
      </p>
    </main>
  );
}
