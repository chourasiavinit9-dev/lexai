import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { NavClient } from '@/components/NavClient';
import { CookieConsent } from '@/components/CookieConsent';

const SITE_URL = 'https://lawjourney-ai-2026.web.app';
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? '';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'LawJourney AI — Understand Indian Legal Documents Before You Sign',
    template: '%s | LawJourney AI',
  },
  description:
    'AI-powered legal document understanding grounded in Indian law. Understand, compare, and navigate contracts in plain English — Constitution of India, Indian Contract Act 1872, BNS 2023, Consumer Protection Act 2019. Free.',
  keywords: [
    'legal AI India', 'Indian Contract Act', 'Constitution of India',
    'understand legal documents India', 'contract analysis', 'legal access India',
    'NDA explained India', 'rent agreement India', 'employment contract India',
    'Hindi legal translation', 'LawJourney', 'Gemini legal AI', 'BNS 2023',
    'Bharatiya Nyaya Sanhita', 'legal document scanner India',
  ],
  authors: [{ name: 'LawJourney AI' }],
  creator: 'LawJourney AI',
  publisher: 'LawJourney AI',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1 },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png' }],
    other: [{ rel: 'mask-icon', url: '/brand-icon.png' }],
  },
  openGraph: {
    title: 'LawJourney AI — Understand Indian Legal Documents',
    description: 'Gemini AI explains legal documents in plain English, grounded in real Indian statutes. Free. Supports Hindi translation.',
    type: 'website',
    locale: 'en_IN',
    url: SITE_URL,
    siteName: 'LawJourney AI',
    images: [
      {
        url: `${SITE_URL}/primary_light.png`,
        width: 1200,
        height: 630,
        alt: 'LawJourney AI — Indian Legal Document Understanding',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LawJourney AI — Indian Legal Documents Explained',
    description: 'AI legal document analysis grounded in Indian law. Free. Hindi translation. BNS 2023 coverage.',
    images: [`${SITE_URL}/primary_light.png`],
    creator: '@lawjourneyai',
  },
  alternates: {
    canonical: SITE_URL,
  },
  category: 'Legal Technology',
};

export default function RootLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <head>
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,600;1,700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#10284A" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Canonical */}
        <link rel="canonical" href={SITE_URL} />

        {/* GA4 — consent mode defaults (denied until user accepts) */}
        {GA_ID && (
          <>
            <Script
              id="gtag-consent-init"
              strategy="beforeInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('consent', 'default', {
                    analytics_storage: 'denied',
                    ad_storage: 'denied',
                    wait_for_update: 2000
                  });
                  gtag('js', new Date());
                  gtag('config', '${GA_ID}', { anonymize_ip: true, send_page_view: false });
                `,
              }}
            />
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
          </>
        )}

        {/* JSON-LD structured data */}
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'LawJourney AI',
              url: SITE_URL,
              applicationCategory: 'LegalService',
              operatingSystem: 'Any',
              description: 'AI-powered Indian legal document understanding grounded in BNS 2023, Indian Contract Act 1872, and the Constitution of India.',
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
              inLanguage: ['en-IN', 'hi'],
              provider: {
                '@type': 'Organization',
                name: 'LawJourney AI',
                url: SITE_URL,
              },
              featureList: [
                'Legal document analysis',
                'Hindi translation of legal documents',
                'BNS 2023 reference verification',
                'Contract comparison',
                'AI legal assistant',
              ],
            }),
          }}
        />

        {/* Animation pre-state script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var d=document.documentElement;
              if(!('animate' in Element.prototype))return;
              if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
              d.classList.add('pre');
              setTimeout(function(){d.classList.remove('pre')},4000);
            })();`
          }}
        />
      </head>
      <body>
        <a href="#main-content" className="skip-link">Skip to main content</a>

        {/* ── Navigation ─────────────────────────────────────── */}
        <header role="banner" className="site-header" id="site-header">
          <div className="nav-inner">
            <a href="/" className="brand" aria-label="LawJourney AI — Home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand-icon.png"
                alt="LawJourney AI logo"
                width={32}
                height={32}
                className="brand-icon"
              />
              <span className="brand-name">LawJourney</span>
              <span className="brand-tag" aria-hidden="true">AI</span>
            </a>
            <NavClient />
          </div>
        </header>

        {/* ── Page Content ────────────────────────────────────── */}
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>

        {/* ── Footer ─────────────────────────────────────────── */}
        <footer role="contentinfo" className="site-footer">
          <div className="footer-inner">
            <div className="footer-top">
              <div className="footer-brand-col">
                <div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/brand-icon.png"
                    alt="LawJourney AI"
                    width={28}
                    height={28}
                    style={{ borderRadius: '6px', opacity: 0.8 }}
                  />
                  <span className="footer-brand-name" style={{ marginLeft: '0.5rem' }}>LawJourney AI</span>
                </div>
                <p className="footer-tagline">
                  AI-powered legal document understanding, grounded in real Indian law.
                </p>
              </div>
              <div className="footer-links-col">
                <p className="footer-links-label">Tools</p>
                <a href="/#tool" className="footer-link">Understand</a>
                <a href="/#tool" className="footer-link">Clarify</a>
                <a href="/#tool" className="footer-link">Compare</a>
                <a href="/#tool" className="footer-link">Navigate</a>
                <a href="/#tool" className="footer-link">Ask AI</a>
              </div>
              <div className="footer-links-col">
                <p className="footer-links-label">Legal</p>
                <a href="/#laws" className="footer-link">Indian Law Coverage</a>
                <a href="/#disclaimer" className="footer-link">Disclaimer</a>
                <a href="/privacy" className="footer-link">Privacy Policy</a>
                <a href="/terms" className="footer-link">Terms of Service</a>
                <a href="/faq" className="footer-link">FAQ</a>
              </div>
            </div>
            <div className="footer-bottom">
              <p className="footer-legal">
                <strong>Important:</strong> LawJourney provides legal{' '}
                <em>information</em> grounded in Indian law, not legal advice.
                This platform does not create an advocate–client relationship.
                Always consult a licensed advocate for important legal decisions.
              </p>
              <p className="footer-copy">
                © 2026 LawJourney AI · Powered by Gemini &amp; Bodhan AI ·{' '}
                <a href="/privacy" style={{ color: 'inherit', opacity: 0.7 }}>Privacy</a>
                {' · '}
                <a href="/terms" style={{ color: 'inherit', opacity: 0.7 }}>Terms</a>
              </p>
            </div>
          </div>
        </footer>

        {/* Cookie consent banner (client-only) */}
        <CookieConsent />
      </body>
    </html>
  );
}
