'use client';

import { useState, useEffect } from 'react';

type ConsentState = 'accepted' | 'declined' | null;

const CONSENT_KEY = 'lj_cookie_consent';

function loadConsent(): ConsentState {
  if (typeof window === 'undefined') return null;
  const v = localStorage.getItem(CONSENT_KEY);
  return v === 'accepted' || v === 'declined' ? v : null;
}

function saveConsent(state: ConsentState) {
  if (state) localStorage.setItem(CONSENT_KEY, state);
}

/** Enable/disable Google Analytics based on consent */
function applyConsent(state: ConsentState) {
  if (typeof window === 'undefined') return;
  const w = window as typeof window & { gtag?: (...args: unknown[]) => void };
  if (!w.gtag) return;
  if (state === 'accepted') {
    w.gtag('consent', 'update', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
    });
  } else {
    w.gtag('consent', 'update', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
    });
  }
}

export function CookieConsent() {
  const [consent, setConsent] = useState<ConsentState>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = loadConsent();
    if (!stored) {
      // Show banner after short delay
      const t = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(t);
    } else {
      setConsent(stored);
      applyConsent(stored);
    }
  }, []);

  function accept() {
    saveConsent('accepted');
    setConsent('accepted');
    applyConsent('accepted');
    setVisible(false);
  }

  function decline() {
    saveConsent('declined');
    setConsent('declined');
    applyConsent('declined');
    setVisible(false);
  }

  if (!visible || consent !== null) return null;

  return (
    <div
      className="cookie-banner"
      role="dialog"
      aria-modal="false"
      aria-label="Cookie consent"
      aria-live="polite"
    >
      <div className="cookie-banner__icon" aria-hidden="true">🍪</div>
      <div className="cookie-banner__content">
        <p className="cookie-banner__text">
          We use <strong>strictly necessary cookies</strong> to run the app, and optional{' '}
          <strong>analytics cookies</strong> (Google Analytics 4) to improve the experience.
          No tracking for ads. Your document content is never stored.{' '}
          <a href="/privacy" className="cookie-banner__link">Privacy Policy</a>
        </p>
      </div>
      <div className="cookie-banner__actions">
        <button
          type="button"
          className="cookie-banner__btn cookie-banner__btn--accept"
          onClick={accept}
          id="cookie-accept-btn"
        >
          Accept analytics
        </button>
        <button
          type="button"
          className="cookie-banner__btn cookie-banner__btn--decline"
          onClick={decline}
          id="cookie-decline-btn"
        >
          Essentials only
        </button>
      </div>
    </div>
  );
}
