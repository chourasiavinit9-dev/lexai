import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — LawJourney AI',
  description: 'How LawJourney AI collects, uses, and protects your personal information when you use our Indian legal document analysis service.',
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  const lastUpdated = '26 September 2026';
  return (
    <div className="legal-page">
      <div className="legal-page__inner">
        <header className="legal-page__header">
          <p className="legal-page__eyebrow">Legal</p>
          <h1 className="legal-page__title">Privacy Policy</h1>
          <p className="legal-page__meta">Last updated: {lastUpdated} · Effective immediately</p>
        </header>

        <div className="legal-page__body">

          <section>
            <h2>1. Who we are</h2>
            <p>LawJourney AI (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) is an AI-powered legal document understanding platform focused on Indian law. Our service is accessible at <strong>lawjourney-ai-2026.web.app</strong>.</p>
            <p>We are committed to protecting your privacy in accordance with the <strong>Digital Personal Data Protection Act, 2023 (DPDPA)</strong> and applicable Indian law.</p>
          </section>

          <section>
            <h2>2. Data we collect</h2>
            <h3>2a. Information you provide</h3>
            <ul>
              <li><strong>Document text</strong> — text you paste or type for analysis. This is sent to AI models and is <em>not stored on our servers</em>.</li>
              <li><strong>Document images</strong> — images uploaded for OCR. Processed in memory and discarded.</li>
              <li><strong>Chat messages</strong> — your questions to the AI assistant. Not stored beyond your session unless you are signed in.</li>
              <li><strong>Account information</strong> — if you sign in (Google/Anonymous), we store a user ID, display name, and email (if Google) in Firebase Authentication.</li>
            </ul>
            <h3>2b. Automatically collected data</h3>
            <ul>
              <li><strong>Usage analytics</strong> — page views, feature usage, and session duration via Google Analytics 4. IP addresses are anonymised.</li>
              <li><strong>Device &amp; browser info</strong> — browser type, OS, screen resolution. Used to improve mobile compatibility.</li>
              <li><strong>Cookies</strong> — strictly necessary session cookies and analytics cookies (only after consent).</li>
            </ul>
          </section>

          <section>
            <h2>3. How we use your data</h2>
            <ul>
              <li>To provide legal document analysis and AI chat responses.</li>
              <li>To save your conversations and tasks if you are signed in (stored in Firestore, accessible only by you).</li>
              <li>To improve the product through aggregated, anonymised usage analytics.</li>
              <li>To communicate service updates (only if you opt in).</li>
            </ul>
            <p>We do <strong>not</strong> sell your data. We do <strong>not</strong> use your document text to train AI models.</p>
          </section>

          <section>
            <h2>4. Third-party services</h2>
            <table>
              <thead><tr><th>Service</th><th>Purpose</th><th>Data shared</th></tr></thead>
              <tbody>
                <tr><td>Google Gemini AI</td><td>Legal analysis &amp; chat</td><td>Document text (anonymised)</td></tr>
                <tr><td>OpenRouter</td><td>Fallback AI provider</td><td>Document text (anonymised)</td></tr>
                <tr><td>Bodhan AI</td><td>Indic OCR &amp; translation</td><td>Document images/text</td></tr>
                <tr><td>Firebase (Google)</td><td>Authentication, database, hosting</td><td>Account info, saved data</td></tr>
                <tr><td>Google Analytics 4</td><td>Usage analytics</td><td>Anonymised usage data</td></tr>
              </tbody>
            </table>
            <p>All AI providers are instructed not to retain or train on your submitted content per their enterprise data policies.</p>
          </section>

          <section>
            <h2>5. Data retention</h2>
            <ul>
              <li><strong>Anonymous users:</strong> No data is stored after your session ends.</li>
              <li><strong>Signed-in users:</strong> Conversations, tasks, and saved clauses are retained until you delete them or your account.</li>
              <li><strong>Analytics data:</strong> Aggregated data retained for 14 months per Google Analytics defaults.</li>
            </ul>
          </section>

          <section>
            <h2>6. Your rights under DPDPA 2023</h2>
            <ul>
              <li><strong>Right to access</strong> — request a copy of your personal data.</li>
              <li><strong>Right to correction</strong> — update inaccurate data.</li>
              <li><strong>Right to erasure</strong> — delete your account and all associated data.</li>
              <li><strong>Right to withdraw consent</strong> — opt out of analytics at any time.</li>
              <li><strong>Right to grievance redressal</strong> — contact our Data Principal Officer.</li>
            </ul>
            <p>To exercise any right, email: <strong>privacy@lawjourney.in</strong></p>
          </section>

          <section>
            <h2>7. Security</h2>
            <p>We implement industry-standard security measures:</p>
            <ul>
              <li>HTTPS enforced on all connections (HSTS)</li>
              <li>Firestore row-level security — users can only access their own data</li>
              <li>Content Security Policy (CSP) headers to prevent XSS</li>
              <li>Input validation and length limits on all user input</li>
              <li>No document text is logged or stored in server logs</li>
            </ul>
          </section>

          <section>
            <h2>8. Children&apos;s privacy</h2>
            <p>LawJourney AI is not directed at persons under 18 years of age. We do not knowingly collect personal data from minors.</p>
          </section>

          <section>
            <h2>9. Changes to this policy</h2>
            <p>We may update this policy. Material changes will be notified via a banner on the site. Continued use after the effective date constitutes acceptance.</p>
          </section>

          <section>
            <h2>10. Contact</h2>
            <p>Data Principal Officer: <strong>LawJourney AI Team</strong><br />
            Email: <a href="mailto:privacy@lawjourney.in">privacy@lawjourney.in</a><br />
            Grievance: Response within 72 hours as required by DPDPA 2023.</p>
          </section>

        </div>

        <div className="legal-page__footer-links">
          <a href="/terms">Terms of Service</a>
          <a href="/faq">FAQ</a>
          <a href="/">← Back to LawJourney</a>
        </div>
      </div>
    </div>
  );
}
