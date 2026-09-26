'use client';

import { RISK_META } from '@/lib/constants';
import type { CompareOutput, DifferenceItem } from '@/lib/validators';

function VerdictCard({ data, labelA, labelB }: { readonly data: CompareOutput; readonly labelA: string; readonly labelB: string }) {
  const verdictName = data.overallVerdict === 'A' ? labelA : data.overallVerdict === 'B' ? labelB : 'Equal';
  return (
    <div className="compare-verdict" role="status">
      <p className="verdict-label">AI Verdict</p>
      <h2 className="verdict-text">
        {data.overallVerdict === 'equal' ? 'Both documents are roughly equivalent' : `${verdictName} is more favorable`}
      </h2>
      <p className="verdict-reason">{data.verdictReason}</p>
      <p className="verdict-summary">{data.summary}</p>
    </div>
  );
}

function DiffRow({ diff, labelA, labelB }: { readonly diff: DifferenceItem; readonly labelA: string; readonly labelB: string }) {
  const risk = RISK_META[diff.riskLevel];
  return (
    <div className="diff-row" role="listitem">
      <div className="diff-topic-bar">
        <span>{diff.topic}</span>
        <span className="risk-badge" style={{ color: risk.color, background: risk.bg, border: `1px solid ${risk.border}` }}>{risk.label}</span>
      </div>
      <div className="diff-cols">
        <div className={`diff-col ${diff.betterFor === 'A' ? 'winner' : ''}`}>
          <p className="diff-col-label">{labelA} {diff.betterFor === 'A' && '✓'}</p>
          <p>{diff.inDocA}</p>
        </div>
        <div className={`diff-col ${diff.betterFor === 'B' ? 'winner' : ''}`}>
          <p className="diff-col-label">{labelB} {diff.betterFor === 'B' && '✓'}</p>
          <p>{diff.inDocB}</p>
        </div>
      </div>
      <p className="diff-why">Why it matters: {diff.whyItMatters}</p>
    </div>
  );
}

function DifferencesPanel({ differences, labelA, labelB }: { readonly differences: DifferenceItem[]; readonly labelA: string; readonly labelB: string }) {
  return (
    <section className="panel" aria-labelledby="diff-h">
      <div className="panel-head"><span aria-hidden="true">⚖️</span><h3 id="diff-h">Key Differences</h3><span className="panel-count">{differences.length}</span></div>
      <div className="panel-body">
        <div className="diff-grid" role="list">
          {differences.map((d, i) => <DiffRow key={i} diff={d} labelA={labelA} labelB={labelB} />)}
        </div>
      </div>
    </section>
  );
}

function SharedTermsPanel({ terms }: { readonly terms: string[] }) {
  if (terms.length === 0) return null;
  return (
    <section className="panel" aria-labelledby="shared-h">
      <div className="panel-head"><span aria-hidden="true">🤝</span><h3 id="shared-h">Common Ground</h3></div>
      <div className="panel-body">
        <ul className="flag-list" role="list">
          {terms.map((t, i) => <li key={i} className="rec-item" role="listitem"><span aria-hidden="true">✓</span> {t}</li>)}
        </ul>
      </div>
    </section>
  );
}

function NegotiationPanel({ opportunities }: { readonly opportunities: string[] }) {
  if (opportunities.length === 0) return null;
  return (
    <section className="panel" aria-labelledby="nego-h">
      <div className="panel-head"><span aria-hidden="true">↗️</span><h3 id="nego-h">Negotiation Opportunities</h3></div>
      <div className="panel-body">
        <ul className="nego-list" role="list">
          {opportunities.map((n, i) => <li key={i} className="nego-item" role="listitem">{n}</li>)}
        </ul>
      </div>
    </section>
  );
}

export function CompareResults({ data, labelA, labelB }: { readonly data: CompareOutput; readonly labelA: string; readonly labelB: string }) {
  return (
    <div className="results" aria-live="polite">
      <VerdictCard data={data} labelA={labelA} labelB={labelB} />
      <DifferencesPanel differences={data.differences} labelA={labelA} labelB={labelB} />
      <div className="result-cols">
        <SharedTermsPanel terms={data.sharedTerms} />
        <NegotiationPanel opportunities={data.negotiationOpportunities} />
      </div>
    </div>
  );
}
