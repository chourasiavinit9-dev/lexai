'use client';

import { useState } from 'react';
import { CLARIFY_QUESTION_TYPES, MAX_CLAUSE_CHARS } from '@/lib/constants';
import type { ClarifyOutput } from '@/lib/validators';
import { ClarifyResults } from './ClarifyResults';

interface Props {
  readonly onResult: (d: ClarifyOutput) => void;
  readonly onLoading: (v: boolean) => void;
  readonly onError: (e: string | null) => void;
  readonly result: ClarifyOutput | null;
  readonly isLoading: boolean;
  readonly error: string | null;
}

type QuestionType = 'plain_english' | 'risks' | 'obligations' | 'negotiation_tips';

import { clientClarify } from '@/lib/client-api';

async function submitClarifyRequest(
  clauseText: string,
  context: string,
  questionType: QuestionType
): Promise<ClarifyOutput> {
  return clientClarify({ clauseText, context: context || '', questionType });
}

import { DocumentDropzone } from './DocumentDropzone';

export function ClarifyPanel({ onResult, onLoading, onError, result, isLoading, error }: Props) {
  const [clauseText, setClauseText] = useState('');
  const [context, setContext] = useState('');
  const [questionType, setQuestionType] = useState<QuestionType>('plain_english');
  const [showUpload, setShowUpload] = useState(false);

  async function submit() {
    onLoading(true);
    onError(null);
    try {
      const data = await submitClarifyRequest(clauseText, context, questionType);
      onResult(data);
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      onLoading(false);
    }
  }

  return (
    <>
      <section className="form-stack" aria-label="Clause clarification form">
        <div className="field">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <label htmlFor="clause-text" className="field-label" style={{ margin: 0 }}>
              Clause to clarify
            </label>
            <button
              type="button"
              className="inline-upload-link"
              onClick={() => setShowUpload(v => !v)}
            >
              {showUpload ? '✍️ Back to text' : '📷 Upload clause photo/scan (OCR)'}
            </button>
          </div>
          <span className="field-hint" id="clause-hint">
            Paste a specific clause, sentence, or paragraph from any legal document, or upload a photo.
          </span>

          {showUpload ? (
            <div style={{ marginBottom: '1rem' }}>
              <DocumentDropzone
                compact
                onTextExtracted={(text) => {
                  setClauseText(text);
                  setShowUpload(false);
                }}
                onError={(err) => onError(err)}
              />
            </div>
          ) : (
            <textarea
              id="clause-text"
              value={clauseText}
              onChange={(e) => setClauseText(e.target.value)}
              aria-describedby="clause-hint"
              aria-required="true"
              placeholder="e.g. The Employee agrees to assign to the Company all inventions made during employment, including those developed outside working hours on personal equipment, provided they relate to the Company's business..."
              maxLength={MAX_CLAUSE_CHARS}
              rows={6}
            />
          )}
        </div>

        <fieldset>
          <legend className="field-label" style={{ marginBottom: '0.75rem' }}>
            What would you like to know?
          </legend>
          <div className="question-grid" role="group" aria-label="Choose what to focus on">
            {CLARIFY_QUESTION_TYPES.map((qt) => (
              <button
                key={qt.id}
                type="button"
                className="question-btn"
                aria-pressed={questionType === qt.id}
                onClick={() => setQuestionType(qt.id as QuestionType)}
              >
                {qt.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="field">
          <label htmlFor="clause-context" className="field-label">
            Additional context <span style={{ fontWeight: 400, color: 'var(--stone-300)' }}>(optional)</span>
          </label>
          <span className="field-hint" id="context-hint">
            e.g. your role, the type of contract this is from, or anything else relevant.
          </span>
          <textarea
            id="clause-context"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            aria-describedby="context-hint"
            placeholder="e.g. I'm a software developer being asked to sign this. The role is a 6-month contract."
            maxLength={500}
            rows={3}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-submit"
            onClick={submit}
            disabled={isLoading || clauseText.trim().length < 10}
            aria-busy={isLoading}
          >
            {isLoading ? 'Clarifying…' : '💡 Clarify this clause'}
          </button>
          {!clauseText && (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setClauseText('The Employee shall not, during the term of this Agreement or for a period of 2 years thereafter, directly or indirectly engage in any business that competes with the Company anywhere in India.');
                setContext('I am a software engineer resigning to join a fintech startup.');
              }}
            >
              ✦ Try sample non-compete clause
            </button>
          )}
          {clauseText && !isLoading && (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setClauseText('');
                setContext('');
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
          <p className="loading-label">Reading this clause…</p>
          <p className="loading-sub">Checking favorability and legal basis under Indian law</p>
        </div>
      )}
      {result && !isLoading && <ClarifyResults data={result} />}
    </>
  );
}
