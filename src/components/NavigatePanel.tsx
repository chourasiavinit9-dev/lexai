'use client';

import { useState } from 'react';
import { MAX_DOC_CHARS } from '@/lib/constants';
import type { NavigateOutput } from '@/lib/validators';
import { NavigateResults } from './NavigateResults';

interface Props {
  readonly onResult: (d: NavigateOutput) => void;
  readonly onLoading: (v: boolean) => void;
  readonly onError: (e: string | null) => void;
  readonly result: NavigateOutput | null;
  readonly isLoading: boolean;
  readonly error: string | null;
}

import { clientNavigate } from '@/lib/client-api';

async function submitNavigateRequest(text: string, goal: string): Promise<NavigateOutput> {
  return clientNavigate({ documentText: text, userGoal: goal });
}

export function NavigatePanel({ onResult, onLoading, onError, result, isLoading, error }: Props) {
  const [text, setText] = useState('');
  const [goal, setGoal] = useState('');

  async function submit() {
    onLoading(true);
    onError(null);
    try {
      const data = await submitNavigateRequest(text, goal);
      onResult(data);
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      onLoading(false);
    }
  }

  const canSubmit = text.trim().length > 80 && goal.trim().length >= 10 && !isLoading;

  return (
    <>
      <section className="form-stack" aria-label="Document navigation form">
        <div className="field">
          <label htmlFor="nav-goal" className="field-label">What are you trying to do?</label>
          <span className="field-hint" id="goal-hint">Be specific. The more context you give, the more tailored your navigation steps will be.</span>
          <input id="nav-goal" type="text" value={goal} onChange={(e) => setGoal(e.target.value)} aria-describedby="goal-hint" aria-required="true" placeholder="e.g. I want to understand my termination rights before resigning" maxLength={500} />
        </div>
        <div className="field">
          <label htmlFor="nav-text" className="field-label">Paste your document</label>
          <textarea id="nav-text" value={text} onChange={(e) => setText(e.target.value)} aria-required="true" placeholder="Paste your legal document here…" maxLength={MAX_DOC_CHARS} rows={9} />
          <span className="char-count">{text.length.toLocaleString()} / {MAX_DOC_CHARS.toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn-submit" onClick={submit} disabled={!canSubmit} aria-busy={isLoading}>
            {isLoading ? 'Navigating…' : '🧭 Show me how to navigate this'}
          </button>
          {(!text || !goal) && (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setGoal('I want to break my residential lease 4 months early without losing my entire security deposit');
                setText(`RESIDENTIAL LEASE AGREEMENT — KORAMANGALA, BANGALORE
Clause 4 (Deposit): Tenant has deposited INR 1,50,000 as refundable security deposit with the Landlord.
Clause 7 (Lock-in Period): There shall be a mandatory lock-in period of 11 (eleven) months from the commencement date. If the Tenant terminates prior to the expiry of 11 months, the entire security deposit shall be forfeited by the Landlord without set-off.
Clause 11 (Notice): Either party may terminate with 30 days notice in writing post completion of lock-in period.
Clause 15 (Deductions): Landlord is entitled to deduct one month rent for painting and refurbishment irrespective of condition.`);
              }}
            >
              ✦ Try sample lease exit
            </button>
          )}
          {(text || goal) && !isLoading && (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setText('');
                setGoal('');
              }}
            >
              ✕ Clear
            </button>
          )}
        </div>
      </section>
      {error && <div role="alert" aria-live="assertive" className="error-msg">⚠️ {error}</div>}
      {isLoading && (
        <div role="status" aria-live="polite" className="loading-wrap">
          <div className="spinner" aria-hidden="true" />
          <p className="loading-label">Mapping your document…</p>
          <p className="loading-sub">Gemini is building your step-by-step guide</p>
        </div>
      )}
      {result && !isLoading && <NavigateResults data={result} />}
    </>
  );
}
