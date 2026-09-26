'use client';

import { useState } from 'react';
import { MAX_DOC_CHARS } from '@/lib/constants';
import type { CompareOutput } from '@/lib/validators';
import { CompareResults } from './CompareResults';

interface Props {
  readonly onResult: (d: CompareOutput) => void;
  readonly onLoading: (v: boolean) => void;
  readonly onError: (e: string | null) => void;
  readonly result: CompareOutput | null;
  readonly isLoading: boolean;
  readonly error: string | null;
}

interface CompareFormState {
  docA: string;
  docB: string;
  labelA: string;
  labelB: string;
  perspective: string;
}

import { clientCompare } from '@/lib/client-api';

async function submitCompareRequest(form: CompareFormState): Promise<CompareOutput> {
  return clientCompare({
    documentA: form.docA,
    documentB: form.docB,
    labelA: form.labelA || 'Document A',
    labelB: form.labelB || 'Document B',
    userPerspective: form.perspective || '',
  });
}

export function ComparePanel({ onResult, onLoading, onError, result, isLoading, error }: Props) {
  const [docA, setDocA] = useState('');
  const [docB, setDocB] = useState('');
  const [labelA, setLabelA] = useState('Document A');
  const [labelB, setLabelB] = useState('Document B');
  const [perspective, setPerspective] = useState('');

  async function submit() {
    onLoading(true);
    onError(null);
    try {
      const data = await submitCompareRequest({ docA, docB, labelA, labelB, perspective });
      onResult(data);
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      onLoading(false);
    }
  }

  const canSubmit = docA.trim().length > 80 && docB.trim().length > 80 && !isLoading;

  return (
    <>
      <section className="form-stack" aria-label="Contract comparison form">
        <div className="two-col">
          <div className="field">
            <label htmlFor="label-a" className="field-label">Label for first document</label>
            <input id="label-a" type="text" value={labelA} onChange={(e) => setLabelA(e.target.value)} maxLength={60} placeholder="e.g. Employer's version" />
          </div>
          <div className="field">
            <label htmlFor="label-b" className="field-label">Label for second document</label>
            <input id="label-b" type="text" value={labelB} onChange={(e) => setLabelB(e.target.value)} maxLength={60} placeholder="e.g. My negotiated version" />
          </div>
        </div>
        <div className="two-col">
          <div className="field">
            <label htmlFor="doc-a" className="field-label">{labelA}</label>
            <textarea id="doc-a" value={docA} onChange={(e) => setDocA(e.target.value)} placeholder="Paste first document…" maxLength={MAX_DOC_CHARS} rows={10} aria-required="true" />
            <span className="char-count">{docA.length.toLocaleString()} chars</span>
          </div>
          <div className="field">
            <label htmlFor="doc-b" className="field-label">{labelB}</label>
            <textarea id="doc-b" value={docB} onChange={(e) => setDocB(e.target.value)} placeholder="Paste second document…" maxLength={MAX_DOC_CHARS} rows={10} aria-required="true" />
            <span className="char-count">{docB.length.toLocaleString()} chars</span>
          </div>
        </div>
        <div className="field">
          <label htmlFor="perspective" className="field-label">Your perspective <span style={{ fontWeight: 400, color: 'var(--stone-300)' }}>(optional)</span></label>
          <span className="field-hint" id="persp-hint">Tell us who you are so we can tailor the analysis.</span>
          <input id="perspective" type="text" value={perspective} onChange={(e) => setPerspective(e.target.value)} placeholder="e.g. I'm the employee reviewing my contract" maxLength={200} aria-describedby="persp-hint" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn-submit" onClick={submit} disabled={!canSubmit} aria-busy={isLoading}>
            {isLoading ? 'Comparing…' : '⚖️ Compare these contracts'}
          </button>
          {(!docA || !docB) && (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setLabelA("Original Employer's Draft");
                setDocA(`EMPLOYMENT TERMS — DRAFT 1
1. TERMINATION: The Company may terminate employment at any time with seven (7) days notice. The Employee must serve ninety (90) days notice.
2. NON-COMPETE: The Employee shall not engage in any competing software enterprise across India for twenty-four (24) months post-separation.
3. IP OWNERSHIP: All intellectual property created by the Employee at any time, on any device, belongs to the Company.`);
                setLabelB('Negotiated Counter-Offer');
                setDocB(`EMPLOYMENT TERMS — DRAFT 2 (NEGOTIATED)
1. TERMINATION: Mutual notice period of thirty (30) days for either party, or payment of gross salary in lieu thereof.
2. NON-COMPETE: Reasonable confidentiality obligations apply. Post-employment non-compete is limited strictly to direct solicitation of existing active clients for six (6) months.
3. IP OWNERSHIP: Intellectual property created specifically for Company project assignments during working hours belongs to the Company; personal open-source projects remain Employee's property.`);
                setPerspective('Senior Developer reviewing new offer');
              }}
            >
              ✦ Try sample comparison
            </button>
          )}
          {(docA || docB) && !isLoading && (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setDocA('');
                setDocB('');
                setPerspective('');
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
          <p className="loading-label">Comparing both documents…</p>
          <p className="loading-sub">Gemini is finding meaningful differences</p>
        </div>
      )}
      {result && !isLoading && <CompareResults data={result} labelA={labelA} labelB={labelB} />}
    </>
  );
}
