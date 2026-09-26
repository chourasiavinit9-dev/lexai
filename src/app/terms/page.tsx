import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — LawJourney AI',
  description: 'Terms governing your use of LawJourney AI, an AI-powered Indian legal document analysis platform.',
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  const lastUpdated = '26 September 2026';
  return (
    <div className="legal-page">
      <div className="legal-page__inner">
        <header className="legal-page__header">
          <p className="legal-page__eyebrow">Legal</p>
          <h1 className="legal-page__title">Terms of Service</h1>
          <p className="legal-page__meta">Last updated: {lastUpdated} · Effective immediately</p>
        </header>

        <div className="legal-page__body">

          <div className="legal-page__alert">
            <strong>Important:</strong> LawJourney AI provides legal <em>information</em>, not legal <em>advice</em>.
            Nothing on this platform creates an advocate–client relationship.
            Always consult a licensed advocate for important legal decisions.
          </div>

          <section>
            <h2>1. Acceptance of terms</h2>
            <p>By accessing or using LawJourney AI (&ldquo;the Service&rdquo;), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.</p>
          </section>

          <section>
            <h2>2. Description of service</h2>
            <p>LawJourney AI is an AI-powered platform that helps users understand Indian legal documents. The Service includes:</p>
            <ul>
              <li>AI analysis of legal documents grounded in Indian statutes</li>
              <li>Plain-English explanations of legal clauses</li>
              <li>Document comparison, navigation, and risk assessment</li>
              <li>OCR (text extraction) from document images</li>
              <li>Hindi and regional language translation of legal summaries</li>
              <li>An AI legal assistant (RuiBo / LAWJOURNEY AI chatbot)</li>
            </ul>
          </section>

          <section>
            <h2>3. Legal disclaimer — not legal advice</h2>
            <p>The Service provides <strong>legal information only</strong>. This means:</p>
            <ul>
              <li>AI-generated analyses are informational and educational, not professional legal advice.</li>
              <li>The Service does not create an advocate–client relationship.</li>
              <li>AI may make errors, hallucinate, or misinterpret documents.</li>
              <li>You must independently verify all legal references with primary sources.</li>
              <li>For any significant legal matter, consult a licensed advocate enrolled with the Bar Council of India.</li>
            </ul>
            <p>You expressly agree that use of the Service is at your sole risk.</p>
          </section>

          <section>
            <h2>4. User obligations</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Upload documents containing third-party confidential information without authorisation</li>
              <li>Attempt to extract, reverse-engineer, or abuse the AI models</li>
              <li>Use the Service for any unlawful purpose under Indian law</li>
              <li>Submit harmful, defamatory, or offensive content</li>
              <li>Attempt to circumvent security measures or rate limits</li>
              <li>Resell or commercially exploit the Service without written permission</li>
            </ul>
          </section>

          <section>
            <h2>5. Intellectual property</h2>
            <p>All content, branding, design, and code of LawJourney AI is owned by or licensed to us. Indian statutes and constitutional text referenced are public domain. AI-generated analyses are owned by LawJourney AI but licensed to you for personal, non-commercial use.</p>
          </section>

          <section>
            <h2>6. Privacy &amp; data</h2>
            <p>Your use of the Service is governed by our <a href="/privacy">Privacy Policy</a>, which is incorporated into these Terms by reference.</p>
          </section>

          <section>
            <h2>7. Limitation of liability</h2>
            <p>To the maximum extent permitted by Indian law, LawJourney AI shall not be liable for:</p>
            <ul>
              <li>Any decision made based on AI-generated legal analysis</li>
              <li>Loss of data, profits, or business resulting from use of the Service</li>
              <li>Errors or inaccuracies in AI outputs</li>
              <li>Service interruptions or downtime</li>
            </ul>
            <p>Our total liability shall not exceed ₹500 in any case.</p>
          </section>

          <section>
            <h2>8. Indemnification</h2>
            <p>You agree to indemnify LawJourney AI from any claims, damages, or expenses arising from your violation of these Terms or misuse of the Service.</p>
          </section>

          <section>
            <h2>9. Governing law &amp; dispute resolution</h2>
            <p>These Terms are governed by the laws of <strong>India</strong>. Any disputes shall be resolved through arbitration in accordance with the Arbitration and Conciliation Act, 1996, with proceedings in <strong>New Delhi</strong>. The courts of New Delhi shall have exclusive jurisdiction for non-arbitrable matters.</p>
          </section>

          <section>
            <h2>10. Changes to terms</h2>
            <p>We may modify these Terms at any time. Material changes will be notified 30 days in advance. Continued use after the effective date constitutes acceptance.</p>
          </section>

          <section>
            <h2>11. Contact</h2>
            <p>Email: <a href="mailto:legal@lawjourney.in">legal@lawjourney.in</a></p>
          </section>

        </div>

        <div className="legal-page__footer-links">
          <a href="/privacy">Privacy Policy</a>
          <a href="/faq">FAQ</a>
          <a href="/">← Back to LawJourney</a>
        </div>
      </div>
    </div>
  );
}
