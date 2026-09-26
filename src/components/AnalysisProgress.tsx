'use client';

import { useState, useEffect } from 'react';

const STEPS = [
  { icon: '📖', label: 'Reading your document', sub: 'Parsing structure and clauses' },
  { icon: '⚖️', label: 'Checking favorability', sub: 'Who does each clause favor?' },
  { icon: '🇮🇳', label: 'Grounding in Indian law', sub: 'ICA 1872 · Constitution · CPA 2019' },
  { icon: '🏛️', label: 'Constitutional rights check', sub: 'Articles 14, 19(1)(g), 21' },
  { icon: '✅', label: 'Preparing your results', sub: 'Almost done…' },
];

interface Props {
  readonly label?: string;
}

import { Loader } from './Loader';

export function AnalysisProgress({ label = 'Analyzing document' }: Props) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStep(prev => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <div role="status" aria-live="polite" aria-label={label} className="analysis-progress">
      <div className="ap-header">
        <Loader size="2.4rem" color="var(--gold)" />
        <div>
          <p className="ap-title">{label}</p>
          <p className="ap-sub">Gemini AI · Indian Law Grounded</p>
        </div>
      </div>
      <ul className="ap-steps" role="list" aria-label="Analysis progress">
        {STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li
              key={s.label}
              className={`ap-step${done ? ' done' : active ? ' active' : ''}`}
              role="listitem"
              aria-current={active ? 'step' : undefined}
            >
              <span className="ap-step-icon" aria-hidden="true">
                {done ? '✓' : active ? s.icon : '○'}
              </span>
              <div className="ap-step-text">
                <span className="ap-step-label">{s.label}</span>
                {active && <span className="ap-step-sub">{s.sub}</span>}
              </div>
              {active && <span className="ap-step-pulse" aria-hidden="true" />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
