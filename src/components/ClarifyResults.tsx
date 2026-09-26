'use client';

import { getFavorabilityMeta, getLegalSeverityMeta } from '@/lib/constants';
import type { LegalConcern } from '@/lib/types';
import type { ClarifyOutput } from '@/lib/validators';

function InterpretationCard({ data }: { readonly data: ClarifyOutput }) {
  const fav = getFavorabilityMeta(data?.favorability);
  return (
    <div className="clarify-interpretation">
      <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
        What this clause means
      </p>
      <p style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>{data?.clauseSummary || 'Clause Summary'}</p>
      <p style={{ fontSize: '0.9rem', lineHeight: '1.75' }}>{data?.interpretation || ''}</p>
      <div style={{ marginTop: '1rem' }}>
        <span
          className="risk-badge"
          style={{ color: fav.color, background: 'rgba(255,255,255,0.12)', border: `1px solid ${fav.border}` }}
          aria-label={`Favorability: ${fav.label}`}
        >
          {fav.label}
        </span>
        <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.65)', marginTop: '0.5rem', lineHeight: '1.6' }}>
          {data?.favorabilityReason || ''}
        </p>
      </div>
    </div>
  );
}

function KeyPointsPanel({ points }: { readonly points: string[] }) {
  return (
    <section className="panel" aria-labelledby="cc-points-h">
      <div className="panel-head"><span aria-hidden="true">🔑</span><h3 id="cc-points-h">Key Points</h3></div>
      <div className="panel-body">
        <ol className="key-points" role="list">
          {points.map((p, i) => (
            <li key={i} className="key-point" role="listitem">
              <span className="key-point-num" aria-hidden="true">{i + 1}</span>
              <span>{p}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function PotentialRisksPanel({ risks }: { readonly risks: string[] }) {
  if (risks.length === 0) return null;
  return (
    <section className="panel" aria-labelledby="cc-risks-h">
      <div className="panel-head"><span aria-hidden="true">⚠️</span><h3 id="cc-risks-h">Potential Risks</h3></div>
      <div className="panel-body">
        <ul className="flag-list" role="list">
          {risks.map((r, i) => <li key={i} className="flag-item" role="listitem"><span aria-hidden="true">⚠️</span> {r}</li>)}
        </ul>
      </div>
    </section>
  );
}

function ClarifyLegalConcernCard({ concern }: { readonly concern: LegalConcern }) {
  const sev = getLegalSeverityMeta(concern?.severity);
  return (
    <article className="clause-item" style={{ borderLeft: `3px solid ${sev.color}` }}>
      <div style={{ padding: '0.875rem 1rem' }}>
        <span className="risk-badge" style={{ color: sev.color, background: sev.bg, border: `1px solid ${sev.border}`, marginBottom: '0.625rem', display: 'inline-flex' }}>
          {sev.label}
        </span>
        <p className="clause-meaning"><strong>What it claims:</strong> {concern.whatTheClauseClaims}</p>
        <p className="clause-meaning"><strong>Why it&apos;s questionable:</strong> {concern.whyItsQuestionable}</p>
        <p className="clause-meaning"><strong>What Indian law actually says:</strong> {concern.relevantIndianLaw}</p>
        <p className="clause-meaning" style={{ marginBottom: 0 }}>
          <span className="tag" style={{ color: 'var(--navy)', background: 'var(--off-white)', border: '1px solid var(--stone-100)', fontWeight: 600 }}>
            📖 {concern.statuteReference}
          </span>
        </p>
      </div>
    </article>
  );
}

function ClarifyLegalConcernsPanel({ concerns }: { readonly concerns: LegalConcern[] }) {
  if (concerns.length === 0) return null;
  return (
    <section className="panel" aria-labelledby="cc-legal-h" style={{ borderColor: 'var(--risky-border)' }}>
      <div className="panel-head" style={{ background: 'var(--critical-bg)' }}>
        <span aria-hidden="true">⚖️</span>
        <h3 id="cc-legal-h">Legal Basis Flags</h3>
        <span className="panel-count">{concerns.length}</span>
      </div>
      <div className="panel-body">
        <p style={{ fontSize: '0.8rem', color: 'var(--stone-500)', marginBottom: '1rem', lineHeight: '1.6' }}>
          This clause contains language worth double-checking against Indian law. Confirm with
          a licensed advocate before relying on this flag.
        </p>
        <ul className="clause-list" role="list">
          {concerns.map((c) => <li key={c.id} role="listitem"><ClarifyLegalConcernCard concern={c} /></li>)}
        </ul>
      </div>
    </section>
  );
}

function ActionableAdvicePanel({ advice }: { readonly advice: string }) {
  return (
    <section className="panel" aria-labelledby="cc-advice-h">
      <div className="panel-head"><span aria-hidden="true">💼</span><h3 id="cc-advice-h">What Should You Do?</h3></div>
      <div className="panel-body">
        <p style={{ fontSize: '0.875rem', color: 'var(--stone-700)', lineHeight: '1.8', padding: '1rem', background: 'var(--safe-bg)', borderRadius: 'var(--radius)', borderLeft: '3px solid var(--safe)' }}>
          {advice}
        </p>
      </div>
    </section>
  );
}

function RelatedConceptsPanel({ concepts }: { readonly concepts: string[] }) {
  if (concepts.length === 0) return null;
  return (
    <section className="panel" aria-labelledby="cc-concepts-h">
      <div className="panel-head"><span aria-hidden="true">📚</span><h3 id="cc-concepts-h">Related Legal Concepts</h3></div>
      <div className="panel-body">
        <div className="concept-tags" role="list" aria-label="Related legal concepts">
          {concepts.map((c, i) => <span key={i} className="concept-tag" role="listitem">{c}</span>)}
        </div>
      </div>
    </section>
  );
}

export function ClarifyResults({ data }: { readonly data: ClarifyOutput }) {
  return (
    <div className="results" aria-live="polite" aria-label="Clause clarification results">
      <InterpretationCard data={data} />
      <div className="result-cols">
        <KeyPointsPanel points={data.keyPoints} />
        <PotentialRisksPanel risks={data.potentialRisks} />
      </div>
      <ClarifyLegalConcernsPanel concerns={data.legalConcerns} />
      <ActionableAdvicePanel advice={data.actionableAdvice} />
      <RelatedConceptsPanel concepts={data.relatedLegalConcepts} />
    </div>
  );
}
