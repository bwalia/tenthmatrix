'use client';

export default function Error({ reset }) {
  return (
    <main className="tm-container tm-error" id="main">
      <h1>Something went wrong</h1>
      <button type="button" className="tm-button tm-tap" onClick={() => reset()}>
        Try again
      </button>
    </main>
  );
}
