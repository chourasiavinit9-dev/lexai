'use client';

import { useState, useCallback } from 'react';
import { RISK_META, FAVORABILITY_META, LEGAL_SEVERITY_META, CONSTITUTIONAL_META } from '@/lib/constants';
import type { Clause, LegalConcern, ConstitutionalCheck } from '@/lib/types';
import type { UnderstandOutput } from '@/lib/validators';
import { saveClause } from '@/lib/firestore';
import { IndicTranslateButton } from './IndicTranslateButton';

// ── Copy button ──────────────────────────────────────────────
function CopyBtn({ text, label }: { readonly text: string; readonly label: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => fallbackCopy());
    } else {
      fallbackCopy();
    }
  }

  function fallbackCopy() {
    try {
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <button type="button" className="copy-btn" onClick={handleCopy} aria-label={label} title={label}>
      {copied ? '✓ Copied' : '⎘ Copy'}
    </button>
  );
}

// ── Save Clause button ───────────────────────────────────────
function SaveClauseBtn({ clause }: { readonly clause: Clause }) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await saveClause({
        clauseText: clause.originalText,
        title: clause.title,
        category: clause.category,
        favorability: (clause.favorability === 'balanced' ? 'neutral' : clause.favorability) as 'favors_you' | 'favors_other_party' | 'neutral' | 'unclear',
        riskLevel: clause.riskLevel,
        verificationStatus: 'unverified',
        notes: clause.whatItMeans ? `${clause.whatItMeans}${clause.whatYouShouldDo ? '\n\nAction: ' + clause.whatYouShouldDo : ''}` : undefined,
      });
      setSaved(true);
    } catch {
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      type="button"
      className={`copy-btn${saved ? ' saved' : ''}`}
      onClick={handleSave}
      disabled={saved || saving}
      title={saved ? 'Clause saved to Dashboard' : 'Save clause to Dashboard'}
      aria-label={saved ? 'Clause saved to Dashboard' : 'Save clause'}
      style={saved ? { color: 'var(--safe)', borderColor: 'var(--safe)' } : undefined}
    >
      {saved ? '♥ Saved' : saving ? '… Saving' : '♡ Save'}
    </button>
  );
}

// ── Clause card ──────────────────────────────────────────────
function ClauseCard({
  clause,
  onAskClause,
}: {
  readonly clause: Clause;
  readonly onAskClause: (text: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const risk = RISK_META[clause.riskLevel];
  const fav = FAVORABILITY_META[clause.favorability];

  const clauseSummary = `${clause.title}\n\nOriginal text: ${clause.originalText}\n\nWhat it means: ${clause.whatItMeans}\n\nWho it favors: ${clause.favorabilityReason}`;

  return (
    <article className={`clause-item ${clause.riskLevel}`} aria-label={clause.title}>
      <button
        className="clause-trigger"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={`clause-${clause.id}`}
      >
        <span
          className={`risk-badge ${clause.riskLevel}`}
          style={{ color: risk.color, background: risk.bg, border: `1px solid ${risk.border}` }}
          aria-label={`Risk: ${risk.label}`}
        >
          {risk.label}
        </span>
        <span className="clause-trigger-title">{clause.title}</span>
        <span
          className="tag"
          style={{ color: fav.color, background: fav.bg, border: `1px solid ${fav.border}`, fontWeight: 600 }}
          aria-label={`Favorability: ${fav.label}`}
        >
          {fav.label}
        </span>
        <span className="clause-cat">{clause.category.replace(/_/g, ' ')}</span>
        <span className={`clause-chevron ${open ? 'open' : ''}`} aria-hidden="true">▾</span>
      </button>

      <div id={`clause-${clause.id}`} className={`clause-content ${open ? 'open' : ''}`} aria-hidden={!open}>
        <blockquote className="original-snippet">{clause.originalText}</blockquote>

        <p className="clause-meaning"><strong>What this means:</strong> {clause.whatItMeans}</p>
        <p className="clause-meaning" style={{ color: fav.color }}>
          <strong>Who this favors:</strong> {clause.favorabilityReason}
        </p>

        {clause.whatYouShouldDo.length > 0 && (
          <ul className="clause-actions">
            {clause.whatYouShouldDo.map((a, i) => <li key={i} className="clause-action">{a}</li>)}
          </ul>
        )}

        {/* Action row */}
        <div className="clause-action-row">
          <CopyBtn text={clauseSummary} label={`Copy explanation for ${clause.title}`} />
          <CopyBtn text={clause.originalText} label={`Copy original clause text for ${clause.title}`} />
          <SaveClauseBtn clause={clause} />
          <button
            type="button"
            className="ask-clause-btn"
            onClick={() => onAskClause(
              `I have a question about this clause: "${clause.title}"\n\nOriginal text: "${clause.originalText}"\n\nWhat it means: ${clause.whatItMeans}\n\nPlease explain this further and tell me if I should be concerned.`
            )}
          >
            ✦ Ask AI about this
          </button>
        </div>
      </div>
    </article>
  );
}

// ── Legal concern ────────────────────────────────────────────
function LegalConcernCard({ concern }: { readonly concern: LegalConcern }) {
  const sev = LEGAL_SEVERITY_META[concern.severity];
  const citationText = `${concern.clauseReference}\n\nWhat it claims: ${concern.whatTheClauseClaims}\n\nWhy it's questionable: ${concern.whyItsQuestionable}\n\nWhat Indian law actually says: ${concern.relevantIndianLaw}\n\nStatute: ${concern.statuteReference}`;
  return (
    <article className="clause-item" style={{ borderLeft: `3px solid ${sev.color}` }} aria-label={concern.clauseReference}>
      <div style={{ padding: '0.875rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.625rem', flexWrap: 'wrap' }}>
          <span className="risk-badge" style={{ color: sev.color, background: sev.bg, border: `1px solid ${sev.border}` }}>{sev.label}</span>
          <span className="clause-trigger-title">{concern.clauseReference}</span>
        </div>
        <p className="clause-meaning"><strong>What it claims:</strong> {concern.whatTheClauseClaims}</p>
        <p className="clause-meaning"><strong>Why it&apos;s questionable:</strong> {concern.whyItsQuestionable}</p>
        <p className="clause-meaning"><strong>What Indian law actually says:</strong> {concern.relevantIndianLaw}</p>
        <div className="clause-action-row" style={{ marginTop: '0.75rem' }}>
          <span className="tag" style={{ color: 'var(--navy)', background: 'var(--cream)', border: '1px solid var(--border)', fontWeight: 600 }}>
            📖 {concern.statuteReference}
          </span>
          <CopyBtn text={citationText} label={`Copy legal citation for ${concern.clauseReference}`} />
        </div>
      </div>
    </article>
  );
}

// ── Constitutional panel ─────────────────────────────────────
function ConstitutionalPanel({ check }: { readonly check: ConstitutionalCheck }) {
  const meta = CONSTITUTIONAL_META[check.overallAssessment];
  return (
    <section className="panel" aria-labelledby="const-h">
      <div className="panel-head">
        <span aria-hidden="true">🏛️</span>
        <h3 id="const-h">Constitutional Rights Check</h3>
        <span className="risk-badge" style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.border}`, marginLeft: 'auto' }}>{meta.label}</span>
      </div>
      <div className="panel-body">
        <p className="clause-meaning">{check.summary}</p>
        {check.articlesConsidered.length > 0 && (
          <div style={{ marginTop: '0.75rem' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--slate)', marginBottom: '0.375rem' }}>ARTICLES CONSIDERED</p>
            <div className="tag-row">
              {check.articlesConsidered.map((a, i) => <span key={i} className="tag">{a}</span>)}
            </div>
          </div>
        )}
        {check.concerns.length > 0 && (
          <ul className="clause-list" style={{ marginTop: '1rem' }} role="list">
            {check.concerns.map((c, i) => (
              <li key={i} role="listitem" className="clause-item" style={{ borderLeft: `3px solid ${meta.color}`, padding: '0.75rem 1rem' }}>
                <p className="clause-meaning" style={{ marginBottom: '0.375rem' }}>
                  <strong>{c.clauseReference}</strong> — <span className="tag">{c.articleOrDoctrine}</span>
                </p>
                <p className="clause-meaning" style={{ marginBottom: 0 }}>{c.explanation}</p>
              </li>
            ))}
          </ul>
        )}
        <p style={{ fontSize: '0.75rem', color: 'var(--slate)', marginTop: '1rem', lineHeight: '1.55' }}>
          Fundamental rights under the Constitution primarily restrain State action; for private
          contracts, courts apply related public-policy principles (Contract Act, 1872, Section 23).
          This check is informational, not a constitutional ruling.
        </p>
      </div>
    </section>
  );
}

// ── Risk Overview card ───────────────────────────────────────
function RiskOverviewCard({ data }: { readonly data: UnderstandOutput }) {
  const risk = RISK_META[data.overallRisk];
  const levels: Array<keyof typeof RISK_META> = ['safe', 'caution', 'risky', 'critical'];
  const levelIndex = levels.indexOf(data.overallRisk);
  const pct = Math.round(((levelIndex + 1) / 4) * 100);

  const counts = data.keyClauses.reduce<Record<string, number>>((acc, c) => {
    acc[c.riskLevel] = (acc[c.riskLevel] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="risk-overview-card">
      <div className="risk-overview-header">
        <p className="risk-overview-label">DOCUMENT OVERVIEW</p>
        <span className={`risk-badge ${data.overallRisk}`} style={{ color: risk.color, background: risk.bg, border: `1px solid ${risk.border}` }}>
          {risk.label} attention needed
        </span>
      </div>
      <div className="risk-bar-wrap">
        <div className="risk-bar-track">
          <div className="risk-bar-fill" style={{ width: `${pct}%`, background: risk.color }} />
        </div>
        <span className="risk-bar-label" style={{ color: risk.color }}>{data.overallRisk.toUpperCase()}</span>
      </div>
      <div className="risk-counts">
        {Object.entries(counts).map(([level, n]) => {
          const m = RISK_META[level as keyof typeof RISK_META];
          return (
            <div key={level} className="risk-count-chip" style={{ color: m.color, background: m.bg, border: `1px solid ${m.border}` }}>
              <span className="risk-count-n">{n}</span>
              <span className="risk-count-l">{m.label}</span>
            </div>
          );
        })}
        <div className="risk-count-chip" style={{ color: 'var(--slate)', background: 'var(--gray-100)', border: '1px solid var(--border)' }}>
          <span className="risk-count-n">{data.keyClauses.length}</span>
          <span className="risk-count-l">Total clauses</span>
        </div>
      </div>
    </div>
  );
}

// ── Doc overview card ────────────────────────────────────────
function DocOverviewCard({ data }: { readonly data: UnderstandOutput }) {
  const risk = RISK_META[data.overallRisk];
  const copyText = `${data.documentType}\n\nSummary: ${data.oneSentenceSummary}\n\n${data.whatThisDocumentDoes}\n\nOverall balance: ${data.favorabilitySummary}`;
  return (
    <div className="doc-card">
      <div className="doc-card-left">
        <p className="doc-type">{data.documentType} · Analyzed under Indian law</p>
        <h2 className="doc-summary-head">{data.oneSentenceSummary}</h2>
        <p className="doc-long-summary">{data.whatThisDocumentDoes}</p>
        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.75rem' }}>
          <strong style={{ color: 'rgba(255,255,255,0.7)' }}>Who should sign:</strong> {data.whoShouldSign}
        </p>
        <p style={{ fontSize: '0.8125rem', color: 'var(--gold-light)', marginTop: '0.625rem', lineHeight: '1.6' }}>
          <strong>Overall balance:</strong> {data.favorabilitySummary}
        </p>
      </div>
      <div className="doc-meta">
        <span className={`risk-badge ${data.overallRisk}`} style={{ color: risk.color, background: risk.bg, border: `1px solid ${risk.border}` }} role="status">
          {risk.label} risk
        </span>
        <span className="reading-time">~{data.readingTimeMinutes} min read</span>
        <CopyBtn text={copyText} label="Copy document summary" />
      </div>
    </div>
  );
}

// ── Simple panels ────────────────────────────────────────────
function MainPointsPanel({ points }: { readonly points: string[] }) {
  if (points.length === 0) return null;
  return (
    <section className="panel" aria-labelledby="points-h">
      <div className="panel-head"><span aria-hidden="true">📝</span><h3 id="points-h">Main Points</h3></div>
      <div className="panel-body">
        <ul className="key-list" role="list">
          {points.map((p, i) => <li key={i} className="key-item" role="listitem">{p}</li>)}
        </ul>
      </div>
    </section>
  );
}

function KeyClausesPanel({ clauses, onAskClause }: { readonly clauses: Clause[]; readonly onAskClause: (text: string) => void }) {
  return (
    <section className="panel" aria-labelledby="clauses-h">
      <div className="panel-head">
        <span aria-hidden="true">📋</span>
        <h3 id="clauses-h">Key Clauses</h3>
        <span className="panel-count">{clauses.length} found</span>
      </div>
      <div className="panel-body">
        <ul className="clause-list" role="list">
          {clauses.map((c) => <li key={c.id} role="listitem"><ClauseCard clause={c} onAskClause={onAskClause} /></li>)}
        </ul>
      </div>
    </section>
  );
}

function LegalConcernsPanel({ concerns }: { readonly concerns: LegalConcern[] }) {
  if (concerns.length === 0) return null;
  return (
    <section className="panel" aria-labelledby="legal-h" style={{ borderColor: 'var(--risky-bd)' }}>
      <div className="panel-head" style={{ background: 'var(--crit-bg)' }}>
        <span aria-hidden="true">⚖️</span>
        <h3 id="legal-h">Legal Basis Flags</h3>
        <span className="panel-count">{concerns.length}</span>
      </div>
      <div className="panel-body">
        <p style={{ fontSize: '0.8rem', color: 'var(--slate)', marginBottom: '1rem', lineHeight: '1.6' }}>
          AI-detected patterns — language that claims legal authority it may not have under Indian law.
          Confirm with a licensed advocate before relying on any flag.
        </p>
        <ul className="clause-list" role="list">
          {concerns.map((c) => <li key={c.id} role="listitem"><LegalConcernCard concern={c} /></li>)}
        </ul>
      </div>
    </section>
  );
}

function RedFlagsPanel({ flags }: { readonly flags: string[] }) {
  if (flags.length === 0) return null;
  return (
    <section className="panel" aria-labelledby="flags-h">
      <div className="panel-head"><span aria-hidden="true">🚩</span><h3 id="flags-h">Red Flags</h3></div>
      <div className="panel-body">
        <ul className="flag-list" role="list">
          {flags.map((f, i) => <li key={i} className="flag-item" role="listitem"><span aria-hidden="true">⚠️</span> {f}</li>)}
        </ul>
      </div>
    </section>
  );
}

function BeforeYouSignPanel({ items }: { readonly items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section className="panel" aria-labelledby="before-h">
      <div className="panel-head"><span aria-hidden="true">✅</span><h3 id="before-h">Before You Sign</h3></div>
      <div className="panel-body">
        <ul className="rec-list" role="list">
          {items.map((r, i) => <li key={i} className="rec-item" role="listitem"><span aria-hidden="true">✓</span> {r}</li>)}
        </ul>
      </div>
    </section>
  );
}

// ── Main export ──────────────────────────────────────────────
export function UnderstandResults({
  data,
  onAskClause,
}: {
  readonly data: UnderstandOutput;
  readonly onAskClause: (text: string) => void;
}) {
  const stableAskClause = useCallback(onAskClause, [onAskClause]);

  // Build plain-English content for Indic translation
  const translationText = [
    data.oneSentenceSummary ? `Document Summary: ${data.oneSentenceSummary}` : '',
    data.whatThisDocumentDoes ? `What this document does: ${data.whatThisDocumentDoes}` : '',
    data.mainPoints?.length
      ? `Key Points:\n${data.mainPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}`
      : '',
    data.beforeYouSign?.length
      ? `Before You Sign:\n${data.beforeYouSign.map(p => `• ${p}`).join('\n')}`
      : '',
  ].filter(Boolean).join('\n\n');

  return (
    <div className="results" aria-live="polite" aria-label="Document analysis results">
      <DocOverviewCard data={data} />

      {/* Indic Translation — powered by Bodhan AI */}
      {translationText && (
        <IndicTranslateButton
          text={translationText}
          label="इस दस्तावेज़ का अनुवाद करें"
          className="results__translate"
        />
      )}

      <RiskOverviewCard data={data} />
      <MainPointsPanel points={data.mainPoints} />
      <KeyClausesPanel clauses={data.keyClauses} onAskClause={stableAskClause} />
      <ConstitutionalPanel check={data.constitutionalCheck} />
      <LegalConcernsPanel concerns={data.legalConcerns} />
      <div className="result-cols">
        <RedFlagsPanel flags={data.redFlags} />
        <BeforeYouSignPanel items={data.beforeYouSign} />
      </div>
    </div>
  );
}
