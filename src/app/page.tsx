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

type AnyResult = UnderstandOutput | ClarifyOutput | CompareOutput | NavigateOutput | OCROutput | null;

const DEMO_TERMINATION_CLAUSE = `Either party may terminate this agreement with seven (7) days written notice, however all payment obligations of the second party shall continue through the end of the current billing cycle, notwithstanding any termination.`;

// Bento feature layout — intentionally different sizes
const BENTO_FEATURES = [
  {
    id: 'understand' as FeatureMode,
    size: 'large',
    eyebrow: 'Core Feature',
    title: 'Analyze',
    tagline: 'Complete document intelligence',
    desc: 'Upload a scan, photo, or PDF — or paste text. OCR extraction, clause-level breakdown, risk scoring, favorability analysis, and statutory citations. All in one workflow.',
    cta: 'Analyze a document →',
    accent: 'gold',
  },
  {
    id: 'clarify' as FeatureMode,
    size: 'medium',
    eyebrow: 'Clause Focus',
    title: 'Clarify',
    tagline: 'One clause, fully explained',
    desc: 'Confused by a single clause? Get plain English, favorability, and Indian law basis.',
    cta: 'Clarify a clause →',
    accent: 'navy',
  },
  {
    id: 'compare' as FeatureMode,
    size: 'medium',
    eyebrow: 'Two Documents',
    title: 'Compare',
    tagline: 'Side-by-side contract analysis',
    desc: 'Two versions of a contract? Identify what changed and which is better for you.',
    cta: 'Compare contracts →',
    accent: 'navy',
  },
  {
    id: 'navigate' as FeatureMode,
    size: 'small',
    eyebrow: 'Goal-Driven',
    title: 'Navigate',
    tagline: 'Step-by-step walkthrough',
    desc: 'Tell us your goal. We walk you through the document.',
    cta: 'Navigate →',
    accent: 'subtle',
  },
  {
    id: 'chat' as FeatureMode,
    size: 'small',
    eyebrow: 'Legal Q&A',
    title: 'Ask AI',
    tagline: 'Grounded in Indian law',
    desc: 'Ask any question about a document or Indian law concept.',
    cta: 'Ask LawJourney →',
    accent: 'subtle',
  },
];

export default function HomePage() {
  const [tab, setTab] = useState<FeatureMode>('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnyResult>(null);
  const [clauseForChat, setClauseForChat] = useState<string | undefined>(undefined);
  const [docTextForUnderstand] = useState<string>('');

  function switchTab(id: FeatureMode | string) {
    setTab(id as FeatureMode);
    setResult(null);
    setError(null);
    // Sync nav active state
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('switch-tab', { detail: id }));
    }
  }

  function handleAskClause(text: string) {
    setClauseForChat(text);
    setTab('chat');
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
      const validTabs = ['dashboard', 'understand', 'clarify', 'compare', 'navigate', 'chat', 'tasks'];
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

  // ── ENTRANCE ANIMATIONS (WAAPI — ConSentinel motion language) ──
  useEffect(() => {
    const d = document.documentElement;
    if (!d.classList.contains('pre')) return;
    if (!('animate' in Element.prototype)) return;

    const EXPO  = 'cubic-bezier(.16,1,.3,1)';
    const SOFT  = 'cubic-bezier(.22,.7,.25,1)';
    const GLASS = 'cubic-bezier(.2,.75,.28,1)';
    const s = window.matchMedia('(max-width: 640px)').matches ? 0.86 : 1;
    const running: Animation[] = [];

    function anim(selector: string, keyframes: Keyframe[], dur: number, delay: number, easing: string) {
      document.querySelectorAll(selector).forEach(el => {
        running.push(el.animate(keyframes, { duration: dur * s, delay: delay * s, easing, fill: 'both' }));
      });
    }
    function rise(selector: string, delay: number, dur: number) {
      anim(selector, [
        { clipPath: 'inset(100% 0 -14% 0)', translate: '0 0.16em' },
        { clipPath: 'inset(-18% 0 -14% 0)', translate: '0 0' }
      ], dur, delay, EXPO);
    }
    function lift(selector: string, delay: number, dist = '0.7em', dur = 560) {
      anim(selector, [
        { opacity: 0, translate: `0 ${dist}` },
        { opacity: 1, translate: '0 0' }
      ], dur, delay, SOFT);
    }
    function settle(selector: string, delay: number, dur = 760, from = 0.985, dist = '1.1em') {
      anim(selector, [
        { opacity: 0, scale: String(from), translate: `0 ${dist}` },
        { opacity: 1, scale: '1', translate: '0 0' }
      ], dur, delay, GLASS);
    }

    // ── Timeline — exact ConSentinel call order ──
    lift('.brand',         60,  '0.55em', 600);
    settle('.nav-container', 150, 700, 0.99,  '0.5em');
    settle('.nav-burger',   150, 700, 0.9,   '0.4em');
    lift('.hero-eyebrow',  300, '0.8em',  520);
    rise('.hero-h1-line:nth-child(1)', 380, 980);
    rise('.hero-h1-line:nth-child(2)', 470, 980);
    rise('.hero-h1-line:nth-child(3)', 560, 980);
    lift('.hero-subhead',  670, '0.7em',  560);
    settle('.btn-hero-primary',   200, 700, 0.985, '0.5em');
    settle('.btn-hero-secondary', 260, 700, 0.985, '0.5em');
    settle('.clause-intel-card',  800, 880, 0.982, '1.4em');
    lift('.hero-trust-line',     900, '0.6em', 520);
    settle('.hero-stats-row',   1020, 820, 0.985, '1.2em');
    settle('.hero-trust-badge', 1060, 700, 0.985, '0.8em');
    settle('.hero-meet-pill',   1140, 820, 0.985, '1.2em');

    Promise.all(running.map(a => a.finished.catch(() => {}))).then(() => {
      d.classList.remove('pre');
      running.forEach(a => a.cancel());
      running.length = 0;
    });
  }, []);

  const activeTab = APP_TABS.find(t => t.id === tab)!;

  return (
    <>
      {/* ══ HERO — Editorial / ConSentinel design language ════════ */}
      <section className="hero-section" aria-labelledby="hero-h">
        <div className="hero-inner">

          {/* ── Left: Editorial copy ── */}
          <div className="hero-left">
            <p className="hero-eyebrow" aria-label="Indian legal intelligence">
              <span className="eyebrow-pip" aria-hidden="true" />
              Indian Legal Intelligence
            </p>

            <h1 id="hero-h" className="hero-h1">
              <span className="hero-h1-line">Understand Indian</span><br />
              <span className="hero-h1-line">legal documents</span><br />
              <span className="hero-h1-line hero-h1-accent">before you sign.</span>
            </h1>

            <p className="hero-subhead">
              AI-powered document intelligence grounded in Indian law.
              Clause-level analysis, risk scoring, and constitutional checks
              — all in plain English.
            </p>

            <div className="hero-ctas">
              <a
                href="#tool"
                className="btn-hero-primary"
                onClick={() => switchTab('understand')}
              >
                Analyze a document
                <span className="btn-knob" aria-hidden="true">
                  <svg viewBox="0 0 12 12" fill="none">
                    <path d="m4 2 4 4-4 4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </a>
              <a
                href="#tool"
                className="btn-hero-secondary"
                onClick={() => switchTab('chat')}
              >
                Ask LawJourney AI
              </a>
            </div>

            <p className="hero-trust-line">
              <span>🇮🇳 Indian Law</span>
              <span aria-hidden="true">·</span>
              <span>AI-generated information</span>
              <span aria-hidden="true">·</span>
              <span>Advocate verification recommended</span>
            </p>
          </div>

          {/* ── Right: Glass Clause Intelligence Panel — premium animated ── */}
          <div className="hero-right" aria-hidden="true">
            <div className="clause-intel-card">
              {/* Animated scan line */}
              <div className="cic-scan" />

              {/* Header with live status dot */}
              <div className="cic-header">
                <div className="cic-header-left">
                  <span className="cic-status-dot" />
                  <span className="cic-label">Clause Intelligence</span>
                </div>
                <span className="cic-section">§3</span>
              </div>

              {/* Clause excerpt */}
              <div className="cic-clause-text">
                Either party may terminate this agreement with seven (7) days
                written notice, however all payment obligations of the second
                party shall continue through the end of the billing cycle...
              </div>

              {/* Metrics with animated risk bar */}
              <div className="cic-metrics">
                <div className="cic-metric-row">
                  <span className="cic-metric-label">Favorability</span>
                  <span className="cic-badge cic-badge--risky">Other party</span>
                </div>

                {/* Risk — animated progress bar */}
                <div className="cic-risk-bar-wrap">
                  <div className="cic-risk-bar-row">
                    <span className="cic-metric-label">Risk Level</span>
                    <span className="cic-badge cic-badge--caution">Medium</span>
                  </div>
                  <div className="cic-risk-track">
                    <div className="cic-risk-fill" />
                  </div>
                </div>

                <div className="cic-metric-row">
                  <span className="cic-metric-label">Legal Basis</span>
                  <span className="cic-law-ref">Indian Contract Act</span>
                </div>
              </div>

              <div className="cic-divider" />

              {/* Constitutional check — staggered entrance */}
              <div className="cic-const">
                <p className="cic-const-label">Constitutional Check</p>
                <div className="cic-const-rows">
                  <div className="cic-const-row cic-const-row--pass">
                    <span className="cic-const-icon">🏛️</span>
                    <span className="cic-const-text">Article 14</span>
                    <span className="cic-const-check">✓ Pass</span>
                  </div>
                  <div className="cic-const-row cic-const-row--warn">
                    <span className="cic-const-icon">⚠️</span>
                    <span className="cic-const-text">Article 19</span>
                    <span className="cic-const-check">△ Review</span>
                  </div>
                  <div className="cic-const-row cic-const-row--pass">
                    <span className="cic-const-icon">🏛️</span>
                    <span className="cic-const-text">Article 21</span>
                    <span className="cic-const-check">✓ Pass</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="cic-footer">
                <span className="cic-flags-badge">
                  <span className="cic-flags-count">3</span>
                  issues flagged
                </span>
                <button
                  type="button"
                  className="cic-ask-btn"
                  onClick={() => handleAskClause("Can you explain this termination clause and whether it is legally enforceable under Indian law? " + DEMO_TERMINATION_CLAUSE)}
                >
                  Ask AI
                  <span className="cic-ask-sparkle">✦</span>
                </button>
              </div>
            </div>

            {/* Trust badge with floating icon */}
            <div className="hero-trust-badge">
              <span className="htb-icon">⚖️</span>
              <div>
                <p className="htb-title">Grounded in Indian Law</p>
                <p className="htb-sub">ICA 1872 · Constitution · CPA 2019</p>
              </div>
            </div>
          </div>

          {/* ── Stats row ── */}
          <div className="hero-stats-row">
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="hero-stat-n">6</span>
                <span className="hero-stat-l">AI Tools</span>
              </div>
              <div className="hero-stat-sep" aria-hidden="true" />
              <div className="hero-stat">
                <span className="hero-stat-n">10+</span>
                <span className="hero-stat-l">Indian<br />Statutes</span>
              </div>
              <div className="hero-stat-sep" aria-hidden="true" />
              <div className="hero-stat">
                <span className="hero-stat-n">100%</span>
                <span className="hero-stat-l">Free</span>
              </div>
              <div className="hero-stat-sep" aria-hidden="true" />
              <div className="hero-stat">
                <span className="hero-stat-n">BNS</span>
                <span className="hero-stat-l">2023<br />Coverage</span>
              </div>
            </div>

            <a href="#features" className="hero-meet-pill" aria-label="Explore all features">
              <span className="hero-meet-pip" aria-hidden="true">⚖️</span>
              <span className="hero-meet-text">Explore all features →</span>
            </a>
          </div>

        </div>
      </section>


      {/* ══ BENTO FEATURES ══════════════════════════════════════ */}
      <section className="bento-section" aria-labelledby="bento-h" id="features">
        <div className="bento-inner">
          <div className="bento-header">
            <span className="section-label">WHAT LAWJOURNEY UNDERSTANDS</span>
            <h2 id="bento-h" className="section-h2">
              Six tools.<br />One purpose.
            </h2>
          </div>

          <div className="bento-grid">
            {BENTO_FEATURES.map(f => (
              <button
                key={f.id}
                className={`bento-card bento-card--${f.size} bento-card--${f.accent}`}
                onClick={() => {
                  switchTab(f.id);
                  document.getElementById('tool')?.scrollIntoView({ behavior: 'smooth' });
                }}
                type="button"
                aria-label={`${f.title}: ${f.desc}`}
              >
                <div className="bento-card-eyebrow">{f.eyebrow}</div>
                <h3 className="bento-card-title">{f.title}</h3>
                <p className="bento-card-tagline">{f.tagline}</p>
                {(f.size === 'large' || f.size === 'medium') && (
                  <p className="bento-card-desc">{f.desc}</p>
                )}
                <span className="bento-card-cta">{f.cta}</span>
              </button>
            ))}

            {/* Indian Law reference card — not a tool tab */}
            <div className="bento-card bento-card--small bento-card--law">
              <div className="bento-card-eyebrow">Reference</div>
              <h3 className="bento-card-title">Indian Law</h3>
              <p className="bento-card-tagline">10+ statutes covered</p>
              <a href="#laws" className="bento-card-cta">Explore coverage →</a>
            </div>
          </div>
        </div>
      </section>

      {/* ══ TOOL WORKSPACE ══════════════════════════════════════ */}
      <section className="tool-section" id="tool" aria-labelledby="tool-h">
        <div className="tool-inner">
          {/* Workspace header */}
          <div className="workspace-header">
            <div>
              <span className="section-label">LAWJOURNEY AI WORKSPACE</span>
              <h2 id="tool-h" className="workspace-title">
                {activeTab?.label ?? 'Legal Workspace'}
              </h2>
            </div>
          </div>

          {/* Global tab nav */}
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
                <span className="tab-label">{t.shortLabel}</span>
              </button>
            ))}
          </nav>

          {/* Feature description */}
          <div className="feature-desc-bar" role="note">
            <span className="feature-desc">{activeTab?.description}</span>
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
              {t.id === 'understand' && (
                <UnderstandPanel
                  onResult={d => setResult(d)}
                  onLoading={setIsLoading}
                  onError={setError}
                  onAskClause={handleAskClause}
                  result={result as UnderstandOutput | null}
                  isLoading={isLoading}
                  error={error}
                  initialText={docTextForUnderstand}
                />
              )}
              {t.id === 'clarify'   && <ClarifyPanel   onResult={d => setResult(d)} onLoading={setIsLoading} onError={setError} result={result as ClarifyOutput  | null} isLoading={isLoading} error={error} />}
              {t.id === 'compare'   && <ComparePanel    onResult={d => setResult(d)} onLoading={setIsLoading} onError={setError} result={result as CompareOutput  | null} isLoading={isLoading} error={error} />}
              {t.id === 'navigate'  && <NavigatePanel   onResult={d => setResult(d)} onLoading={setIsLoading} onError={setError} result={result as NavigateOutput | null} isLoading={isLoading} error={error} />}
              {t.id === 'chat'      && <PremiumChatPanel initialMessage={clauseForChat} onInitialMessageConsumed={() => setClauseForChat(undefined)} />}
              {t.id === 'tasks'     && <TaskManager />}
            </section>
          ))}
        </div>
      </section>

      {/* ══ CLAUSE INTELLIGENCE SHOWCASE ════════════════════════ */}
      <section className="ci-section" aria-labelledby="ci-h">
        <div className="ci-inner">
          <div className="ci-text">
            <span className="section-label light">CLAUSE INTELLIGENCE</span>
            <h2 id="ci-h" className="section-h2 light">
              Know exactly who a clause favors.
            </h2>
            <p className="section-sub light">
              Most AI tools just summarize. LAWJOURNEY goes further — every clause is checked for
              favorability, legal validity under Indian law, and constitutional compliance.
            </p>
            <ul className="ci-feature-list">
              {[
                { icon: '⚖️', text: 'Favorability: Favors you / Other party / Balanced' },
                { icon: '📜', text: 'Legal basis: Specific Act and Section cited' },
                { icon: '🏛️', text: 'Constitutional check: Articles 14, 19, 21' },
                { icon: '🚩', text: 'Red flags: Clauses claiming authority they don\'t have' },
                { icon: '✅', text: 'Before-you-sign checklist for every document' },
              ].map(item => (
                <li key={item.text} className="ci-feature-item">
                  <span className="ci-feature-icon" aria-hidden="true">{item.icon}</span>
                  {item.text}
                </li>
              ))}
            </ul>
            <a
              href="#tool"
              className="btn-ci-cta"
              onClick={() => switchTab('understand')}
            >
              Try Clause Intelligence →
            </a>
          </div>

          <div className="ci-visual" aria-hidden="true">
            <div className="ci-card">
              <div className="ci-card-header">
                <span className="ci-clause-label">
                  TERMINATION CLAUSE <span style={{ color: 'var(--gold)' }}>§3</span>
                </span>
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
          <h2 id="how-h" className="section-h2 centered">
            From document to understanding in seconds.
          </h2>
          <div className="how-steps">
            {[
              { n: '01', title: 'Upload or paste', body: 'Upload a photo, scan, or PDF — or paste legal text directly. OCR extraction happens automatically within the Analyze workflow.' },
              { n: '02', title: 'Gemini AI analyzes it', body: 'Every clause is checked against real Indian statutes. Risk, favorability, constitutional compliance, and legal flags — all grounded.' },
              { n: '03', title: 'You get clear answers', body: 'Plain-English breakdown with risk levels, who each clause favors, specific law references, and a before-you-sign checklist.' },
              { n: '04', title: 'Ask follow-up questions', body: 'Not satisfied? Use Ask AI to continue the conversation — about the document or any Indian legal concept.' },
            ].map((s, i, arr) => (
              <div key={s.n} className="how-step-wrap">
                <div className="how-card">
                  <div className="how-step-num">{s.n}</div>
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
            <span className="section-label light">INDIAN LAW COVERAGE</span>
            <h2 id="laws-h" className="section-h2 light">
              Grounded in real Indian statutes.
            </h2>
            <p className="section-sub light">
              Not generic AI answers. Every flag traces back to a specific Act, Section,
              or Constitutional Article.
            </p>
          </div>
          <ul className="laws-grid" role="list" aria-label="Indian laws covered">
            {[
              { short: 'Constitution of India',          detail: 'Part III — Fundamental Rights: Articles 14, 19(1)(g), 21' },
              { short: 'Indian Contract Act, 1872',      detail: 'Sections 10, 23, 27, 28, 73, 74 — Formation, restraint, penalty' },
              { short: 'Bharatiya Nyaya Sanhita, 2023',  detail: 'BNS replaces IPC — criminal liability in contracts' },
              { short: 'Consumer Protection Act, 2019',  detail: 'Unfair contract terms & unfair trade practices' },
              { short: 'Transfer of Property Act, 1882', detail: 'Leases, tenancy rights, property transfer clauses' },
              { short: 'Arbitration & Conciliation Act, 1996', detail: 'Dispute resolution & arbitration clause validity' },
              { short: 'Specific Relief Act, 1963',      detail: 'Remedies, injunctions & specific performance' },
              { short: 'Information Technology Act, 2000', detail: 'E-contracts, digital signatures, data terms' },
            ].map(l => (
              <li key={l.short} className="law-chip" role="listitem" title={l.detail}>
                <span className="law-chip-icon" aria-hidden="true">⚖️</span>
                <span className="law-chip-text">{l.short}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ══ EXAMPLE QUESTIONS ════════════════════════════════════ */}
      <section className="questions-section" aria-labelledby="q-h">
        <div className="questions-inner">
          <div className="section-label-row centered">
            <span className="section-label">EXAMPLE QUESTIONS</span>
          </div>
          <h2 id="q-h" className="section-h2 centered">Try asking LAWJOURNEY AI</h2>
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
            <a href="#tool" className="btn-hero-primary" onClick={() => switchTab('chat')}>
              Ask LAWJOURNEY AI →
            </a>
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

      {/* ══ FLOATING CHAT BUTTON ═════════════════════════════════ */}
      <FloatingChatButton
        initialMessage={clauseForChat}
        onInitialMessageConsumed={() => setClauseForChat(undefined)}
      />
    </>
  );
}
