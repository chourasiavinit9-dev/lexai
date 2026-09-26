import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ — LawJourney AI',
  description: 'Frequently asked questions about LawJourney AI — how it works, what Indian laws it covers, privacy, and limitations.',
  robots: { index: true, follow: true },
};

const FAQ_ITEMS = [
  {
    category: 'About LawJourney AI',
    items: [
      {
        q: 'What is LawJourney AI?',
        a: 'LawJourney AI is a free, AI-powered platform that helps you understand Indian legal documents in plain English. It analyses contracts, agreements, notices, and other legal documents using Gemini AI, grounded in real Indian statutes like the Indian Contract Act 1872, BNS 2023, BNSS 2023, Consumer Protection Act 2019, and the Constitution of India.',
      },
      {
        q: 'Is LawJourney AI a substitute for a lawyer?',
        a: 'No. LawJourney AI provides legal information, not legal advice. It does not create an advocate–client relationship. For important legal decisions — signing contracts, court matters, property disputes — always consult a licensed advocate enrolled with the Bar Council of India.',
      },
      {
        q: 'Is the service free?',
        a: 'Yes. The core features (Understand, Clarify, Compare, Navigate, Chat) are completely free. We use Gemini AI with a free-tier key that has usage limits. During high demand, the app automatically switches to a backup AI provider to keep the service running.',
      },
    ],
  },
  {
    category: 'How it works',
    items: [
      {
        q: 'How does LawJourney AI analyse documents?',
        a: 'You paste your document text (or upload an image). The AI reads it, identifies document type, extracts key clauses, flags risky terms, verifies legal references against a database of Indian statutes, and explains everything in plain English. The analysis is grounded in BNS, BNSS, BSA, ICA, CPA, and the Constitution.',
      },
      {
        q: 'What types of documents can I analyse?',
        a: 'Employment contracts, NDAs, rent/lease agreements, sale deeds, service agreements, loan agreements, shareholder agreements, notices, government orders, and more. Any document written in or translated to English.',
      },
      {
        q: 'Can I upload document images or PDFs?',
        a: 'Yes. Go to the Chat tab → 📄 Analyse → upload an image (JPG, PNG, WebP). The app uses Bodhan AI\'s indic-ocr model to extract text, then analyses the legal content. PDF support requires converting to image first.',
      },
      {
        q: 'What does the Hindi translation feature do?',
        a: 'After analysing a document, a "🇮🇳 Translate" button appears. Click it to translate the document summary and key points into Hindi, Bengali, Marathi, Tamil, Telugu, Gujarati, Kannada, Malayalam, Punjabi, Urdu, or Odia — using Bodhan AI\'s indic-translate model.',
      },
      {
        q: 'How accurate is the AI analysis?',
        a: 'The AI is grounded in real Indian statutes and is generally accurate for common legal concepts. However, AI can make mistakes, miss context, or misinterpret nuanced clauses. Always treat outputs as a starting point for understanding, not a final legal opinion. Accuracy improves when you provide complete, unedited document text.',
      },
    ],
  },
  {
    category: 'Privacy & Security',
    items: [
      {
        q: 'Is my document stored or shared?',
        a: 'No. Document text is sent to AI models for analysis but is not stored on our servers. AI providers (Gemini, OpenRouter, Bodhan AI) are instructed not to retain or train on your content per their enterprise data policies. If you are signed in, only conversations you explicitly save are stored — in Firebase, accessible only by you.',
      },
      {
        q: 'Do you need to create an account?',
        a: 'No. You can use all core features without signing in — analysis runs anonymously in your browser. Create an account (Google sign-in or anonymous) to save conversations, tasks, and clauses across sessions.',
      },
      {
        q: 'Is the service DPDPA compliant?',
        a: 'Yes. We comply with India\'s Digital Personal Data Protection Act 2023. We collect minimal data, do not sell data, provide rights to access/delete your data, and have a Data Principal Officer. See our Privacy Policy for full details.',
      },
    ],
  },
  {
    category: 'Indian Law Coverage',
    items: [
      {
        q: 'Which Indian laws does LawJourney cover?',
        a: 'Bharatiya Nyaya Sanhita 2023 (BNS), Bharatiya Nagarik Suraksha Sanhita 2023 (BNSS), Bharatiya Sakshya Adhiniyam 2023 (BSA), Indian Contract Act 1872, Consumer Protection Act 2019, Transfer of Property Act 1882, Information Technology Act 2000, and the Constitution of India. Coverage is continuously expanding.',
      },
      {
        q: 'Does LawJourney handle Hindi or regional language documents?',
        a: 'Currently, analysis works best on English documents. Use the translate feature to read results in Hindi or other Indian languages. OCR can extract text from images with Hindi/Devanagari content via Bodhan AI\'s indic-ocr.',
      },
    ],
  },
  {
    category: 'Technical',
    items: [
      {
        q: 'Why am I getting an "AI service busy" error?',
        a: 'Gemini AI occasionally experiences high demand (503 errors). LawJourney automatically retries up to 3 times, then switches to a backup AI provider (OpenRouter). If all providers are busy, wait 30 seconds and try again. Your document text is never lost.',
      },
      {
        q: 'Does LawJourney work on mobile?',
        a: 'Yes. The app is fully responsive and works on all modern mobile browsers (Chrome, Safari, Firefox on Android and iOS). The AI chat is accessible via the floating robot button at the bottom-right of the screen.',
      },
      {
        q: 'What browsers are supported?',
        a: 'Chrome 90+, Firefox 88+, Safari 14+, Edge 90+. JavaScript must be enabled. Internet Explorer is not supported.',
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="legal-page">
      <div className="legal-page__inner legal-page__inner--wide">
        <header className="legal-page__header">
          <p className="legal-page__eyebrow">Help</p>
          <h1 className="legal-page__title">Frequently Asked Questions</h1>
          <p className="legal-page__meta">
            Can&apos;t find what you need? Email us at{' '}
            <a href="mailto:support@lawjourney.in">support@lawjourney.in</a>
          </p>
        </header>

        <div className="faq-body">
          {FAQ_ITEMS.map((section) => (
            <section key={section.category} className="faq-section">
              <h2 className="faq-section__title">{section.category}</h2>
              <div className="faq-list">
                {section.items.map((item) => (
                  <details key={item.q} className="faq-item">
                    <summary className="faq-item__q">{item.q}</summary>
                    <p className="faq-item__a">{item.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="legal-page__cta-box">
          <h2>Ready to understand your documents?</h2>
          <p>Paste any Indian legal document and get a plain-English analysis in seconds — free.</p>
          <a href="/#tool" className="btn-gold">Analyse a document →</a>
        </div>

        <div className="legal-page__footer-links">
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
          <a href="/">← Back to LawJourney</a>
        </div>
      </div>
    </div>
  );
}
