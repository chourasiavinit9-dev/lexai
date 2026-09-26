'use client';

import { useState, useEffect } from 'react';
import { READING_LEVELS, MAX_DOC_CHARS } from '@/lib/constants';
import type { UnderstandOutput } from '@/lib/validators';
import { UnderstandResults } from './UnderstandResults';
import { AnalysisProgress } from './AnalysisProgress';
import { EmptyState } from './EmptyState';
import { DocumentDropzone } from './DocumentDropzone';
import { clientUnderstand } from '@/lib/client-api';

const SAMPLE_CLAUSE = `This Agreement shall be governed by and construed in accordance with the laws of the State of Maharashtra. Any disputes arising out of or in connection with this Agreement shall be subject to the exclusive jurisdiction of the courts located in Mumbai. Either party may terminate this agreement with seven (7) days written notice, however all outstanding payment obligations of the Employee/Contractor shall remain binding and continue through the end of the current billing cycle, notwithstanding any termination.`;

interface Props {
  readonly onResult: (d: UnderstandOutput) => void;
  readonly onLoading: (v: boolean) => void;
  readonly onError: (e: string | null) => void;
  readonly onAskClause: (text: string) => void;
  readonly result: UnderstandOutput | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly initialText?: string;
}

async function submitUnderstandRequest(
  text: string,
  level: 'simple' | 'standard' | 'detailed',
  role: string
): Promise<UnderstandOutput> {
  return clientUnderstand({ documentText: text, readingLevel: level, userRole: role || '' });
}

export function UnderstandPanel({
  onResult,
  onLoading,
  onError,
  onAskClause,
  result,
  isLoading,
  error,
  initialText = '',
}: Props) {
  const [text, setText] = useState(initialText);
  const [level, setLevel] = useState<'simple' | 'standard' | 'detailed'>('standard');
  const [role, setRole] = useState('');
  const [inputMode, setInputMode] = useState<'paste' | 'upload'>('paste');
  const [extractedSource, setExtractedSource] = useState<{ name: string; source: 'bodhan' | 'file' } | null>(null);

  useEffect(() => {
    if (initialText && initialText !== text) {
      setText(initialText);
    }
  }, [initialText]);

  async function submit() {
    onLoading(true);
    onError(null);
    try {
      const data = await submitUnderstandRequest(text, level, role);
      onResult(data);
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      onLoading(false);
    }
  }

  function loadSample(sampleText?: string, sampleRole?: string) {
    setText(sampleText ?? SAMPLE_CLAUSE);
    setExtractedSource(null);
    if (sampleRole) setRole(sampleRole);
    setInputMode('paste');
    setTimeout(() => {
      document.getElementById('doc-text')?.focus();
    }, 50);
  }

  function handleExtractedText(extractedText: string, fileName: string, source: 'bodhan' | 'file') {
    setText(extractedText);
    setExtractedSource({ name: fileName, source });
    // Switch to paste view so user can review the extracted text and submit
    setInputMode('paste');
    setTimeout(() => {
      document.getElementById('doc-text')?.focus();
    }, 50);
  }

  const isEmpty = !text.trim() && !result && !isLoading && !error;

  return (
    <>
      <section className="form-stack" aria-label="Document understanding form">
        {/* Input mode switcher */}
        <div className="input-mode-header">
          <div className="input-mode-toggle" role="tablist" aria-label="Document input method">
            <button
              type="button"
              role="tab"
              aria-selected={inputMode === 'paste'}
              className={`input-mode-tab ${inputMode === 'paste' ? 'active' : ''}`}
              onClick={() => setInputMode('paste')}
            >
              ✍️ Paste Text
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={inputMode === 'upload'}
              className={`input-mode-tab ${inputMode === 'upload' ? 'active' : ''}`}
              onClick={() => setInputMode('upload')}
            >
              📷 Upload Document / Image (OCR)
            </button>
          </div>
          {extractedSource && (
            <div className="extracted-source-pill">
              <span>
                {extractedSource.source === 'bodhan' ? '⚡ Bodhan AI OCR' : '📄 File'}: {extractedSource.name}
              </span>
              <button
                type="button"
                className="extracted-source-clear"
                onClick={() => setExtractedSource(null)}
                title="Dismiss tag"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Upload mode */}
        {inputMode === 'upload' ? (
          <div className="upload-container-card">
            <DocumentDropzone
              onTextExtracted={handleExtractedText}
              onError={err => onError(err)}
            />
            {text && (
              <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setInputMode('paste')}
                >
                  ← Return to editor with previously extracted text ({text.length.toLocaleString()} chars)
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Paste mode */
          <div className="field">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <label htmlFor="doc-text" className="field-label" style={{ margin: 0 }}>
                Legal Document Text
              </label>
              <button
                type="button"
                className="inline-upload-link"
                onClick={() => setInputMode('upload')}
              >
                📷 Upload document photo or scan (OCR) →
              </button>
            </div>
            <span className="field-hint" id="doc-hint">
              Works with contracts, NDAs, leases, employment agreements, terms of service, and more. Analyzed under Indian law.
            </span>
            <textarea
              id="doc-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              aria-describedby="doc-hint doc-count"
              aria-required="true"
              placeholder="Paste your document text here, or switch to 'Upload Document / Image (OCR)' to scan a photo or PDF…"
              maxLength={MAX_DOC_CHARS}
              rows={10}
            />
            <span id="doc-count" className={`char-count ${text.length > MAX_DOC_CHARS * 0.9 ? 'over' : ''}`} aria-live="polite">
              {text.length.toLocaleString()} / {MAX_DOC_CHARS.toLocaleString()}
            </span>
          </div>
        )}

        <div className="field">
          <label htmlFor="user-role" className="field-label">
            Your role in this document <span style={{ fontWeight: 400, color: 'var(--slate)' }}>(optional)</span>
          </label>
          <span className="field-hint" id="role-hint">
            Tells the AI whose side to judge favorability from — e.g. tenant, employee, freelancer.
          </span>
          <input
            id="user-role"
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            aria-describedby="role-hint"
            placeholder="e.g. I'm the tenant signing this lease"
            maxLength={150}
          />
        </div>

        <fieldset>
          <legend className="field-label" style={{ marginBottom: '0.5rem' }}>Explanation level</legend>
          <div className="level-row">
            {READING_LEVELS.map((l) => (
              <button key={l.id} type="button" className="level-btn" aria-pressed={level === l.id} onClick={() => setLevel(l.id as typeof level)}>
                {l.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-submit"
            onClick={submit}
            disabled={isLoading || text.trim().length < 80}
            aria-busy={isLoading}
          >
            {isLoading ? 'Analyzing…' : '📄 Understand this document'}
          </button>
          {!text && (
            <>
              <button type="button" className="btn-ghost" onClick={() => loadSample()}>
                ✦ Try a sample
              </button>
              <button type="button" className="btn-ghost" onClick={() => setInputMode('upload')}>
                📷 Upload Scan / Photo
              </button>
            </>
          )}
          {text && !isLoading && (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setText('');
                setExtractedSource(null);
                onResult({
                  keyClauses: [],
                  mainPoints: [],
                  redFlags: [],
                  beforeYouSign: [],
                  legalConcerns: [],
                  constitutionalCheck: {
                    overallAssessment: 'none',
                    summary: '',
                    articlesConsidered: [],
                    concerns: [],
                  },
                  documentType: '',
                  oneSentenceSummary: '',
                  whatThisDocumentDoes: '',
                  whoShouldSign: '',
                  favorabilitySummary: '',
                  overallRisk: 'safe',
                  readingTimeMinutes: 0,
                });
                onError(null);
              }}
            >
              ✕ Clear
            </button>
          )}
        </div>
      </section>

      {error && <div role="alert" aria-live="assertive" className="error-msg">⚠️ {error}</div>}

      {isLoading && <AnalysisProgress label="Analyzing document under Indian law" />}

      {isEmpty && <EmptyState onTryExample={() => loadSample()} onSelectSample={(t, r) => loadSample(t, r)} />}

      {result && !isLoading && <UnderstandResults data={result} onAskClause={onAskClause} />}
    </>
  );
}
