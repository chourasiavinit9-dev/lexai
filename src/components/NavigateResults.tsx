'use client';

import type { NavigateOutput, NavigationStep } from '@/lib/validators';

function NavDocOverview({ data }: { readonly data: NavigateOutput }) {
  return (
    <div className="doc-card">
      <div className="doc-card-left">
        <p className="doc-type">{data.documentType} · Indian law</p>
        <h2 className="doc-summary-head">{data.userGoalSummary}</h2>
        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.875rem', flexWrap: 'wrap' }}>
          {data.keyParties.length > 0 && <TagGroup label="PARTIES" items={data.keyParties} />}
          {data.keyDates.length > 0 && <TagGroup label="KEY DATES" items={data.keyDates} />}
        </div>
      </div>
    </div>
  );
}

function TagGroup({ label, items }: { readonly label: string; readonly items: string[] }) {
  return (
    <div>
      <p style={{ fontSize: '0.7rem', color: 'var(--gold)', fontWeight: 600, marginBottom: '0.375rem' }}>{label}</p>
      <div className="tag-row">
        {items.map((item, i) => (
          <span key={i} className="tag" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)' }}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function StepItem({ step }: { readonly step: NavigationStep }) {
  return (
    <li className="step-item" role="listitem">
      <div className="step-num" aria-hidden="true">{step.stepNumber}</div>
      <div className="step-body">
        <p className="step-action">{step.action}</p>
        <p className="step-detail">{step.detail}</p>
        <p className="step-look">Look for: {step.lookFor}</p>
        {step.redFlag && <p className="step-redflag">⚠️ Red flag: {step.redFlag}</p>}
      </div>
    </li>
  );
}

function StepsPanel({ steps }: { readonly steps: NavigationStep[] }) {
  return (
    <section className="panel" aria-labelledby="steps-h">
      <div className="panel-head">
        <span aria-hidden="true">🧭</span>
        <h3 id="steps-h">Your Navigation Steps</h3>
        <span className="panel-count">{steps.length} steps</span>
      </div>
      <div className="panel-body">
        <ol className="step-list" role="list">
          {steps.map((s) => <StepItem key={s.stepNumber} step={s} />)}
        </ol>
      </div>
    </section>
  );
}

function RightsAndObligations({ data }: { readonly data: NavigateOutput }) {
  return (
    <div className="result-cols">
      <section className="panel" aria-labelledby="rights-h">
        <div className="panel-head"><span aria-hidden="true">🛡️</span><h3 id="rights-h">Your Rights</h3></div>
        <div className="panel-body">
          <ul className="rights-list" role="list">
            {data.yourRightsUnderThisDocument.map((r, i) => <li key={i} className="rights-item" role="listitem">{r}</li>)}
          </ul>
        </div>
      </section>
      <section className="panel" aria-labelledby="oblig-h">
        <div className="panel-head"><span aria-hidden="true">📌</span><h3 id="oblig-h">Your Obligations</h3></div>
        <div className="panel-body">
          <ul className="obligation-list" role="list">
            {data.yourObligationsUnderThisDocument.map((o, i) => <li key={i} className="obligation-item" role="listitem">{o}</li>)}
          </ul>
        </div>
      </section>
    </div>
  );
}

function ApplicableLawsPanel({ laws }: { readonly laws: string[] }) {
  if (laws.length === 0) return null;
  return (
    <section className="panel" aria-labelledby="laws-h">
      <div className="panel-head"><span aria-hidden="true">📖</span><h3 id="laws-h">Applicable Indian Laws</h3></div>
      <div className="panel-body">
        <div className="tag-row">
          {laws.map((law, i) => <span key={i} className="tag" style={{ fontWeight: 600 }}>{law}</span>)}
        </div>
      </div>
    </section>
  );
}

function GlossaryPanel({ glossary }: { readonly glossary: NavigateOutput['glossary'] }) {
  if (glossary.length === 0) return null;
  return (
    <section className="panel" aria-labelledby="gloss-h">
      <div className="panel-head"><span aria-hidden="true">📚</span><h3 id="gloss-h">Legal Terms Explained</h3></div>
      <div className="panel-body">
        <dl className="glossary-list">
          {glossary.map((g, i) => (
            <div key={i} className="glossary-entry">
              <dt className="glossary-term">{g.term}</dt>
              <dd className="glossary-def">{g.definition}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export function NavigateResults({ data }: { readonly data: NavigateOutput }) {
  return (
    <div className="results" aria-live="polite">
      <NavDocOverview data={data} />
      <StepsPanel steps={data.navigationSteps} />
      <RightsAndObligations data={data} />
      <ApplicableLawsPanel laws={data.applicableIndianLaws} />
      <GlossaryPanel glossary={data.glossary} />
    </div>
  );
}
