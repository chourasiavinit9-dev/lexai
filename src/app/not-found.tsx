'use client';

export default function NotFound() {
  return (
    <div className="not-found-page">
      <div className="not-found-inner">
        <div className="not-found-icon" aria-hidden="true">⚖️</div>
        <h1 className="not-found-code">404</h1>
        <h2 className="not-found-title">Page not found</h2>
        <p className="not-found-body">
          This page doesn&apos;t exist — but your legal documents still need attention.
        </p>
        <a href="/" className="btn-gold not-found-cta">
          Go to LawJourney →
        </a>
      </div>
    </div>
  );
}
