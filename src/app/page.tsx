'use client';

import { useState, useEffect } from 'react';
import { APP_TABS, SAMPLE_QUESTIONS } from '@/lib/constants';
import type { FeatureMode } from '@/lib/types';
import type { UnderstandOutput, ClarifyOutput, CompareOutput, NavigateOutput, OCROutput } from '@/lib/validators';
import { UnderstandPanel } from '@/components/UnderstandPanel';
import { ClarifyPanel } from '@/components/ClarifyPanel';
import { ComparePanel } from '@/components/ComparePanel';
import { NavigatePanel } from '@/components/NavigatePanel';
import { PremiumChatPanel } from '@/components/PremiumChatPanel';
import { FloatingChatButton } from '@/components/FloatingChatButton';
import { TaskManager } from '@/components/TaskManager';
import { Dashboard } from '@/components/Dashboard';
import { OCRUploader } from '@/components/OCRUploader';

type AnyResult = UnderstandOutput | ClarifyOutput | CompareOutput | NavigateOutput | OCROutput | null;

const DEMO_TERMINATION_CLAUSE = `Either party may terminate this agreement with seven (7) days written notice, however all payment obligations of the second party shall continue through the end of the current billing cycle, notwithstanding any termination.`;

const FEATURES = [
  {
    id: 'understand' as FeatureMode,
    icon: '📄',
    title: 'Understand',
    tagline: 'Plain-English breakdown',
    desc: 'Paste or upload any contract, NDA, or lease. Get risk levels, favorability, and legal flags — cited to specific Indian statutes.',
    badge: 'Most used',
    badgeColor: 'gold',
  },
  {
    id: 'ocr' as FeatureMode,
    icon: '📷',
    title: 'Scan & OCR',
    tagline: 'Document & Photo Scanner',
    desc: 'Upload a photo, scan, or PDF of any contract or notice. Bodhan AI extracts the legal text and verifies statutory citations.',
    badge: 'Bodhan AI',
    badgeColor: 'gold',
  },
  {
    id: 'clarify' as FeatureMode,
    icon: '💡',
    title: 'Clarify',
    tagline: 'One clause at a time',
    desc: "Confused by a single clause? Get a focused explanation, who it favors, and whether it holds up under Indian law.",
    badge: null,
    badgeColor: '',
  },
  {
    id: 'compare' as FeatureMode,
    icon: '⚖️',
    title: 'Compare',
    tagline: 'Side-by-side analysis',
    desc: 'Got two versions of a contract? See exactly what changed, which version is better for you, and why.',
    badge: null,
    badgeColor: '',
  },
  {
    id: 'navigate' as FeatureMode,
    icon: '🧭',
    title: 'Navigate',
    tagline: 'Goal-driven walkthrough',
    desc: 'Tell us what you want to achieve. We\'ll walk you step-by-step through your rights, obligations, and key dates.',
    badge: null,
    badgeColor: '',
  },
  {
    id: 'chat' as FeatureMode,
    icon: '✦',
    title: 'Ask AI',
    tagline: 'Legal Q&A chat',
    desc: 'Ask any Indian law question — about a document you\'ve pasted or any legal concept — with follow-up questions.',
    badge: 'Powered by Gemini',
    badgeColor: 'navy',
  },
];

export default function HomePage() {
  const [tab, setTab] = useState<FeatureMode>('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnyResult>(null);
  const [clauseForChat, setClauseForChat] = useState<string | undefined>(undefined);
  const [docTextForUnderstand, setDocTextForUnderstand] = useState<string>('');

  function switchTab(id: FeatureMode | string) {
    setTab(id as FeatureMode);
    setResult(null);
    setError(null);
  }

  function handleAskClause(text: string) {
    setClauseForChat(text);
    setTab('chat');
    // Scroll to tool area
    setTimeout(() => document.getElementById('tool')?.scrollIntoView({ behavior: 'smooth' }), 50);
  }

  useEffect(() => {
    const handleSwitch = (e: Event) => {
      const targetTab = (e as CustomEvent).detail;
      if (targetTab) {
        setTab(targetTab as FeatureMode);
        setTimeout(() => document.getElementById('tool')?.scrollIntoView({ behavior: 'smooth' }), 50);
      }
    };
    window.addEventListener('switch-tab', handleSwitch);

    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      const validTabs = ['dashboard', 'understand', 'ocr', 'clarify', 'compare', 'navigate', 'chat', 'tasks'];
      if (validTabs.includes(hash)) {
        setTab(hash as FeatureMode);
        setTimeout(() => document.getElementById('tool')?.scrollIntoView({ behavior: 'smooth' }), 50);
      }
    };
    window.addEventListener('hashchange', handleHash);
    handleHash();

    return () => {
      window.removeEventListener('switch-tab', handleSwitch);
      window.removeEventListener('hashchange', handleHash);
    };
  }, []);

  const activeTab = APP_TABS.find(t => t.id === tab)!;

  return (
    <>
      {/* ══ HERO ══════════════════════════════════════════════ */}
      <section className="hero-section" aria-labelledby="hero-h">
        {/* Left: text */}
        <div className="hero-left">
          <div className="hero-eyebrow" aria-label="Powered by Gemini AI">
            <span className="eyebrow-pip" aria-hidden="true" />
            Gemini AI · Indian Law Grounded
          </div>

          <h1 id="hero-h" className="hero-h1">
            Understand Indian<br />
            legal documents<br />
            <span className="hero-h1-accent">before you sign.</span>
          </h1>

          <p className="hero-subhead">
            LawJourney uses Gemini AI to explain contracts, flag one-sided clauses,
            and ground every finding in real Indian statutes — the Constitution,
            Indian Contract Act 1872, Consumer Protection Act 2019 and more.
          </p>

          <p className="hero-trust-line">
            <span>🇮🇳 Indian Law</span>
            <span aria-hidden="true">·</span>
            <span>AI-generated information</span>
            <span aria-hidden="true">·</span>
            <span>Advocate verification recommended</span>
          </p>

          <div className="hero-ctas">
            <a href="#tool" className="btn-hero-primary" onClick={() => switchTab('understand')}>Analyze a Document</a>
            <a href="#tool" className="btn-hero-secondary" onClick={() => switchTab('chat')}>Ask LawJourney AI</a>
          </div>

          {/* Micro-stats */}
          <div className="hero-stats">
            {[
              { n: '5', l: 'AI Tools' },
              { n: '10+', l: 'Indian Statutes' },
              { n: '100%', l: 'Free' },
              { n: '0', l: 'Data Stored' },
            ].map(s => (
              <div key={s.l} className="hero-stat">
                <span className="hero-stat-n">{s.n}</span>
                <span className="hero-stat-l">{s.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: AI workspace preview */}
        <div className="hero-right" aria-hidden="true">
          <div className="ai-preview">
            <div className="ai-preview-header">
              <span className="ai-preview-dot red" />
              <span className="ai-preview-dot yellow" />
              <span className="ai-preview-dot green" />
              <span className="ai-preview-title">LawJourney AI — Analysis</span>
            </div>
            <div className="ai-preview-body">
              <div className="ai-preview-left">
                <p className="ai-preview-sec-label">CLAUSES</p>
                {['§1 Services', '§2 Payment', '§3 Termination', '§4 Liability', '§5 Dispute'].map((c, i) => (
                  <div key={c} className={`ai-preview-clause ${i === 2 ? 'active' : ''}`}>{c}</div>
                ))}
              </div>
              <div className="ai-preview-center">
                <p className="ai-preview-sec-label">DOCUMENT</p>
                <div className="ai-preview-doc">
                  <p className="ai-preview-clause-text">
                    <span className="ai-preview-highlight">§3. Termination.</span> Either party
                    may terminate this agreement with <span className="ai-preview-highlight">seven
                    days written notice</span>, however all payment obligations of the second
                    party shall continue through the end of the current billing cycle...
                  </p>
                </div>
              </div>
              <div className="ai-preview-right">
                <p className="ai-preview-sec-label">AI INSIGHTS</p>
                <div className="ai-insight-block">
                  <div className="ai-insight-row">
                    <span className="ai-insight-label">Risk</span>
                    <span className="ai-badge-caution">MEDIUM</span>
                  </div>
                  <div className="ai-insight-row">
                    <span className="ai-insight-label">Favors</span>
                    <span className="ai-badge-risky">Other Party</span>
                  </div>
                  <div className="ai-insight-row">
                    <span className="ai-insight-label">Issues</span>
                    <span className="ai-badge-warn">⚠ 3 flags</span>
                  </div>
                  <div className="ai-insight-law">
                    <span className="ai-law-label">Legal Basis</span>
                    <span className="ai-law-ref">§74 Contract Act</span>
                    <span className="ai-law-ref">§27 Restraint</span>
                  </div>
                </div>
                <div className="ai-const-check">
                  <p className="ai-preview-sec-label" style={{ marginBottom: '0.4rem' }}>CONST. CHECK</p>
                  <div className="ai-const-row green">Art 14 ✓</div>
                  <div className="ai-const-row yellow">Art 19 ⚠</div>
                  <div className="ai-const-row green">Art 21 ✓</div>
                </div>
              </div>
            </div>
            <div className="ai-preview-footer">
              <span>🤖 Gemini 3.5 Flash</span>
              <span>Grounded in Indian Law</span>
              <span>Not legal advice</span>
            </div>
          </div>

          {/* Floating cards */}
          <div className="float-card float-card-1">
            <span className="float-card-icon">⚖️</span>
            <div>
              <p className="float-card-title">Clause Intelligence</p>
              <p className="float-card-sub">Favorability · Risk · Legal Basis</p>
            </div>
          </div>
          <div className="float-card float-card-2">
            <span className="float-card-icon">🇮🇳</span>
            <div>
              <p className="float-card-title">Indian Law Grounded</p>
              <p className="float-card-sub">ICA 1872 · Constitution · CPA 2019</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FEATURE CARDS ═══════════════════════════════════════ */}
      <section className="features-section" aria-labelledby="features-h" id="features">
        <div className="features-inner">
          <div className="section-label-row">
            <span className="section-label">WHAT LAWJOURNEY CAN DO</span>
          </div>
          <h2 id="features-h" className="section-h2">Five tools. One purpose.</h2>
          <p className="section-sub">Everything you need to understand any Indian legal document.</p>

          <div className="feature-cards">
            {FEATURES.map(f => (
              <button
                key={f.id}
                className="feature-card"
                onClick={() => {
                  switchTab(f.id);
                  document.getElementById('tool')?.scrollIntoView({ behavior: 'smooth' });
                }}
                type="button"
                aria-label={`${f.title}: ${f.desc}`}
              >
                {f.badge && (
                  <span className={`feature-badge feature-badge--${f.badgeColor}`}>{f.badge}</span>
                )}
                <span className="feature-card-icon" aria-hidden="true">{f.icon}</span>
                <h3 className="feature-card-title">{f.title}</h3>
                <p className="feature-card-tagline">{f.tagline}</p>
                <p className="feature-card-desc">{f.desc}</p>
                <span className="feature-card-cta">Try {f.title} →</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TOOL AREA ════════════════════════════════════════════ */}
      <section className="tool-section" id="tool" aria-labelledby="tool-h">
        <div className="tool-inner">
          <div className="section-label-row">
            <span className="section-label">LAWJOURNEY AI WORKSPACE</span>
          </div>
          <h2 id="tool-h" className="section-h2">Start with your document</h2>
          <p className="section-sub">Pick a tool, paste your text, and let Gemini AI analyze it under Indian law.</p>

          {/* Tab nav */}
          <nav role="tablist" aria-label="LawJourney tools" className="tab-nav">
            {APP_TABS.map(t => (
              <button
                key={t.id}
                role="tab"
                id={`tab-${t.id}`}
                aria-selected={tab === t.id}
                aria-controls={`panel-${t.id}`}
                className={`tab-btn${tab === t.id ? ' active' : ''}`}
                onClick={() => switchTab(t.id)}
                type="button"
              >
                <span className="tab-icon" aria-hidden="true">{t.icon}</span>
                <span className="tab-label">{t.shortLabel}</span>
              </button>
            ))}
          </nav>

          {/* Feature desc */}
          <div className="feature-desc-bar" role="note">
            <span className="feature-desc">{activeTab.description}</span>
          </div>

          {/* Panels */}
          {APP_TABS.map(t => (
            <section
              key={t.id}
              id={`panel-${t.id}`}
              role="tabpanel"
              aria-labelledby={`tab-${t.id}`}
              hidden={tab !== t.id}
            >
              {t.id === 'dashboard'  && <Dashboard onSwitchTab={switchTab} />}
              {t.id === 'understand' && <UnderstandPanel onResult={d => setResult(d)} onLoading={setIsLoading} onError={setError} onAskClause={handleAskClause} result={result as UnderstandOutput | null} isLoading={isLoading} error={error} initialText={docTextForUnderstand} />}
              {t.id === 'ocr'        && (
                <div style={{ maxWidth: '840px', margin: '0 auto' }}>
                  <OCRUploader
                    onResult={d => setResult(d as AnyResult)}
                    onAskAbout={handleAskClause}
                    isLoading={isLoading}
                    onLoadingChange={setIsLoading}
                    onTransferToUnderstand={(text) => {
                      setDocTextForUnderstand(text);
                      switchTab('understand');
                      document.getElementById('tool')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  />
                </div>
              )}
              {t.id === 'clarify'    && <ClarifyPanel    onResult={d => setResult(d)} onLoading={setIsLoading} onError={setError} result={result as ClarifyOutput   | null} isLoading={isLoading} error={error} />}
              {t.id === 'compare'   && <ComparePanel    onResult={d => setResult(d)} onLoading={setIsLoading} onError={setError} result={result as CompareOutput   | null} isLoading={isLoading} error={error} />}
              {t.id === 'navigate'  && <NavigatePanel   onResult={d => setResult(d)} onLoading={setIsLoading} onError={setError} result={result as NavigateOutput  | null} isLoading={isLoading} error={error} />}
              {t.id === 'chat'      && <PremiumChatPanel initialMessage={clauseForChat} onInitialMessageConsumed={() => setClauseForChat(undefined)} />}
              {t.id === 'tasks'     && <TaskManager />}
            </section>
          ))}
        </div>
      </section>

      {/* ══ CLAUSE INTELLIGENCE ═════════════════════════════════ */}
      <section className="clause-intel-section" aria-labelledby="ci-h">
        <div className="clause-intel-inner">
          <div className="ci-text">
            <div className="section-label-row">
              <span className="section-label light">CLAUSE INTELLIGENCE</span>
            </div>
            <h2 id="ci-h" className="section-h2 light">Know exactly who a clause favors.</h2>
            <p className="section-sub light">
              Most AI tools just summarize. LawJourney goes further — every clause is checked for
              favorability, legal validity under Indian law, and constitutional compliance.
            </p>
            <ul className="ci-list">
              {[
                { icon: '⚖️', text: 'Favorability: Favors you / Other party / Balanced' },
                { icon: '📜', text: 'Legal basis: Specific Act and Section cited' },
                { icon: '🏛️', text: 'Constitutional check: Articles 14, 19, 21' },
                { icon: '🚩', text: 'Red flags: Clauses claiming authority they don\'t have' },
                { icon: '✅', text: 'Before-you-sign checklist for every document' },
              ].map(item => (
                <li key={item.text} className="ci-item">
                  <span className="ci-icon" aria-hidden="true">{item.icon}</span>
                  {item.text}
                </li>
              ))}
            </ul>
            <a href="#tool" className="btn-ci-cta" onClick={() => switchTab('understand')}>Try Clause Intelligence →</a>
          </div>
          <div className="ci-visual" aria-hidden="true">
            <div className="ci-card">
              <div className="ci-card-header">
                <span className="ci-clause-label">TERMINATION CLAUSE <span style={{ color: 'var(--gold)' }}>§3</span></span>
              </div>
              <div className="ci-clause-text">
                Either party may terminate this agreement with seven days written notice, however
                all payment obligations of the second party shall continue...
              </div>
              <div className="ci-metrics">
                <div className="ci-metric">
                  <span className="ci-metric-label">FAVORABILITY</span>
                  <span className="ci-metric-val risky">● Favors other party</span>
                </div>
                <div className="ci-metric">
                  <span className="ci-metric-label">WHY?</span>
                  <span className="ci-metric-why">Short notice benefits them; your payment continues regardless.</span>
                </div>
                <div className="ci-metric">
                  <span className="ci-metric-label">LEGAL BASIS</span>
                  <span className="ci-law-tags">
                    <span className="ci-law-tag">Indian Contract Act, 1872 §74</span>
                  </span>
                </div>
                <div className="ci-metric">
                  <span className="ci-metric-label">RISK</span>
                  <span className="ci-badge caution">MEDIUM</span>
                </div>
              </div>
              <div className="ci-actions">
                <button
                  type="button"
                  className="ci-action-btn"
                  onClick={() => {
                    switchTab('clarify');
                    setTimeout(() => document.getElementById('tool')?.scrollIntoView({ behavior: 'smooth' }), 50);
                  }}
                >
                  Explain
                </button>
                <button
                  type="button"
                  className="ci-action-btn"
                  onClick={() => {
                    switchTab('compare');
                    setTimeout(() => document.getElementById('tool')?.scrollIntoView({ behavior: 'smooth' }), 50);
                  }}
                >
                  Compare
                </button>
                <button
                  type="button"
                  className="ci-action-btn gold"
                  onClick={() => handleAskClause("Can you explain this termination clause and whether it is legally enforceable under Indian law? " + DEMO_TERMINATION_CLAUSE)}
                >
                  Ask AI ✦
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ════════════════════════════════════════ */}
      <section className="how-section" aria-labelledby="how-h">
        <div className="how-inner">
          <div className="section-label-row centered">
            <span className="section-label">HOW IT WORKS</span>
          </div>
          <h2 id="how-h" className="section-h2 centered">From document to understanding in seconds.</h2>
          <div className="how-steps">
            {[
              { n: '01', icon: '📋', title: 'Paste your document', body: 'Copy and paste any contract, NDA, lease, employment agreement, or single clause. No account, no upload — just text.' },
              { n: '02', icon: '🤖', title: 'Gemini AI analyzes it', body: 'Our AI reads every clause against real Indian statutes, flags one-sided terms, and checks constitutional compliance.' },
              { n: '03', icon: '💡', title: 'You get clear answers', body: 'Plain-English breakdown with risk levels, favorability, specific law references, and a before-you-sign checklist.' },
              { n: '04', icon: '💬', title: 'Ask follow-up questions', body: 'Not satisfied? Use Chat to ask anything — about the document you pasted or any Indian legal concept.' },
            ].map((s, i, arr) => (
              <div key={s.n} className="how-step-wrap">
                <div className="how-card">
                  <div className="how-step-num">{s.n}</div>
                  <span className="how-icon" aria-hidden="true">{s.icon}</span>
                  <h3 className="how-title">{s.title}</h3>
                  <p className="how-body">{s.body}</p>
                </div>
                {i < arr.length - 1 && <div className="how-arrow" aria-hidden="true">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ INDIAN LAW COVERAGE ══════════════════════════════════ */}
      <section className="laws-section" aria-labelledby="laws-h" id="laws">
        <div className="laws-inner">
          <div className="laws-text">
            <div className="section-label-row">
              <span className="section-label light">INDIAN LAW COVERAGE</span>
            </div>
            <h2 id="laws-h" className="section-h2 light">Grounded in real Indian statutes.</h2>
            <p className="section-sub light">
              Not generic AI answers. Every flag traces back to a specific Act, Section, or Constitutional Article.
            </p>
          </div>
          <ul className="laws-grid" role="list" aria-label="Indian laws covered">
            {[
              { short: 'Constitution of India', detail: 'Part III — Fundamental Rights: Articles 14, 19(1)(g), 21' },
              { short: 'Indian Contract Act, 1872', detail: 'Sections 10, 23, 27, 28, 73, 74 — Formation, restraint, penalty' },
              { short: 'Consumer Protection Act, 2019', detail: 'Unfair contract terms & unfair trade practices' },
              { short: 'Transfer of Property Act, 1882', detail: 'Leases, tenancy rights, property transfer clauses' },
              { short: 'Arbitration & Conciliation Act, 1996', detail: 'Dispute resolution & arbitration clause validity' },
              { short: 'Specific Relief Act, 1963', detail: 'Remedies, injunctions & specific performance' },
              { short: 'Information Technology Act, 2000', detail: 'E-contracts, digital signatures, data terms' },
              { short: 'Labour & Employment Laws', detail: 'Code on Wages 2019, Industrial Disputes Act 1947, Shops & Estab. Acts' },
            ].map(l => (
              <li key={l.short} className="law-chip" role="listitem" title={l.detail}>
                <span className="law-chip-icon" aria-hidden="true">⚖️</span>
                <span className="law-chip-text">{l.short}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ══ EXAMPLE QUESTIONS ═══════════════════════════════════ */}
      <section className="questions-section" aria-labelledby="q-h">
        <div className="questions-inner">
          <div className="section-label-row centered">
            <span className="section-label">EXAMPLE QUESTIONS</span>
          </div>
          <h2 id="q-h" className="section-h2 centered">Try asking LawJourney AI</h2>
          <div className="question-pills">
            {SAMPLE_QUESTIONS.map(q => (
              <button
                key={q}
                className="question-pill"
                type="button"
                onClick={() => handleAskClause(q)}
              >
                <span aria-hidden="true">✦</span> {q}
              </button>
            ))}
          </div>
          <div className="questions-cta">
            <a href="#tool" className="btn-hero-primary" onClick={() => switchTab('chat')}>Ask LawJourney AI →</a>
          </div>
        </div>
      </section>

      {/* ══ DISCLAIMER ══════════════════════════════════════════ */}
      <section className="disclaimer-section" aria-labelledby="disclaimer-h" id="disclaimer">
        <div className="disclaimer-inner">
          <h2 id="disclaimer-h" className="disclaimer-title">⚖️ Important Legal Disclaimer</h2>
          <p className="disclaimer-body">
            LawJourney provides <strong>legal information</strong> grounded in Indian law, not legal advice.
            Nothing on this platform creates an advocate–client relationship. AI analysis may contain errors —
            always verify important clauses with a licensed advocate before signing any legal document.
            Constitutional and statutory interpretations shown here are informational only and are not
            a substitute for a qualified legal opinion from a licensed Indian advocate.
          </p>
        </div>
      </section>

      {/* ══ FLOATING CHAT BUTTON ══════════════════════════════ */}
      <FloatingChatButton
        initialMessage={clauseForChat}
        onInitialMessageConsumed={() => setClauseForChat(undefined)}
      />
    </>
  );
}
