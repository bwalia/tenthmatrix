'use client';

export default function GlobalError({ reset }) {
  return (
    <html lang="en">
      <body>
        <main className="tm-error" id="main">
          <h1>Something went wrong</h1>
          <button type="button" onClick={() => reset()}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
