'use client';

import { useRef, useState } from 'react';
import type { OCROutput, LegalReference } from '@/lib/validators';
import { clientOcr } from '@/lib/client-api';
import { bodhanOcr } from '@/lib/bodhan';
import { Loader } from './Loader';

// ── Status badge ─────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; icon: string; cls: string }> = {
  VERIFIED:               { label: 'Verified',             icon: '✓', cls: 'verified' },
  PARTIALLY_VERIFIED:     { label: 'Partial',              icon: '~', cls: 'partial' },
  NOT_VERIFIED:           { label: 'Not Verified',         icon: '⚠', cls: 'unverified' },
  POSSIBLE_OCR_ERROR:     { label: 'OCR uncertainty',      icon: '?', cls: 'ocr-error' },
  VERSION_CHECK_REQUIRED: { label: 'Check version',        icon: '↻', cls: 'version' },
};

function VerificationBadge({ status }: { readonly status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, icon: '?', cls: 'unverified' };
  return (
    <span className={`ocr-verify-badge ocr-verify-badge--${cfg.cls}`} title={cfg.label}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

// ── Single legal reference card ───────────────────────────────
function ReferenceCard({ ref: r, idx }: { readonly ref: LegalReference; readonly idx: number }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={`ocr-ref-card ocr-ref-card--${STATUS_CONFIG[r.verificationStatus]?.cls ?? 'unverified'}`}>
      <div className="ocr-ref-header" onClick={() => setExpanded(e => !e)}>
        <div className="ocr-ref-title-row">
          <span className="ocr-ref-num">Ref {idx + 1}</span>
          <span className="ocr-ref-act">{r.act}{r.section ? ` §${r.section}` : r.article ? ` Art. ${r.article}` : ''}</span>
          <VerificationBadge status={r.verificationStatus} />
        </div>
        <p className="ocr-ref-desc">{r.description}</p>
        {expanded && r.verifiedText && (
          <div className="ocr-ref-provision">
            <p className="ocr-provision-label">Provision text (from corpus)</p>
            <blockquote className="ocr-provision-text">{r.verifiedText}</blockquote>
            {r.verifiedSource && (
              <p className="ocr-provision-source">Source: {r.verifiedSource}</p>
            )}
          </div>
        )}
        {expanded && !r.verifiedText && (
          <p className="ocr-ref-unverified-note">
            This reference could not be matched against the loaded authoritative corpus. Verify with a licensed advocate.
          </p>
        )}
        <button
          type="button"
          className="ocr-ref-expand-btn"
          aria-expanded={expanded}
          aria-label={expanded ? 'Collapse' : 'Show provision'}
        >
          {expanded ? 'Hide ▲' : 'View provision ▼'}
        </button>
      </div>
    </div>
  );
}

// ── Confidence bar ────────────────────────────────────────────
function ConfidenceBar({ confidence, label }: { readonly confidence: string; readonly label: string }) {
  const pct = confidence === 'high' ? 90 : confidence === 'medium' ? 60 : confidence === 'not_applicable' ? 100 : 35;
  const cls = confidence === 'high' ? 'high' : confidence === 'medium' ? 'med' : 'low';
  return (
    <div className="ocr-conf-row">
      <span className="ocr-conf-label">{label}</span>
      <div className="ocr-conf-track">
        <div className={`ocr-conf-fill ocr-conf-fill--${cls}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="ocr-conf-pct">{confidence}</span>
    </div>
  );
}

// ── Full OCR result panel ─────────────────────────────────────
function OCRResultPanel({
  result,
  onAskAbout,
  onDismiss,
  onTransferToUnderstand,
}: {
  readonly result: OCROutput;
  readonly onAskAbout: (q: string) => void;
  readonly onDismiss: () => void;
  readonly onTransferToUnderstand?: (text: string) => void;
}) {
  const [showExtracted, setShowExtracted] = useState(false);
  const [copied, setCopied] = useState(false);
  const verified = result.legalReferences.filter(r => r.verificationStatus === 'VERIFIED').length;
  const total    = result.legalReferences.length;

  function copyText() {
    if (result.extractedText) {
      void navigator.clipboard.writeText(result.extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="ocr-result" role="region" aria-label="Document analysis result">
      {/* Doc type header */}
      <div className="ocr-result-header">
        <div>
          <p className="ocr-result-eyebrow">DOCUMENT ANALYSIS & STATUTORY CITATIONS</p>
          <h3 className="ocr-result-type">{result.documentType}</h3>
        </div>
        <button type="button" className="ocr-dismiss-btn" onClick={onDismiss} aria-label="Clear result">✕</button>
      </div>

      {/* OCR quality */}
      {result.ocrConfidence !== 'not_applicable' && (
        <div className="ocr-quality-bar">
          <ConfidenceBar confidence={result.ocrConfidence} label="OCR quality" />
          {result.ocrWarning && (
            <p className="ocr-warning">⚠ {result.ocrWarning}</p>
          )}
        </div>
      )}

      {/* Summary */}
      <div className="ocr-section">
        <p className="ocr-section-label">SUMMARY</p>
        <p className="ocr-summary">{result.summary}</p>
      </div>

      {/* Extracted text accordion */}
      {result.extractedText && (
        <div className="ocr-section" style={{ background: 'var(--gray-50)', padding: '0.875rem', borderRadius: 'var(--r-lg)', border: '1.5px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--navy)' }}>
              EXTRACTED DOCUMENT TEXT ({result.extractedText.length.toLocaleString()} characters)
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn-ghost"
                style={{ padding: '0.2rem 0.6rem', fontSize: '0.72rem' }}
                onClick={copyText}
              >
                {copied ? '✓ Copied' : '📋 Copy Text'}
              </button>
              <button
                type="button"
                className="btn-ghost"
                style={{ padding: '0.2rem 0.6rem', fontSize: '0.72rem' }}
                onClick={() => setShowExtracted(v => !v)}
              >
                {showExtracted ? 'Hide Text ▲' : 'Show Text ▼'}
              </button>
            </div>
          </div>
          {showExtracted && (
            <div style={{ marginTop: '0.75rem', maxHeight: '250px', overflowY: 'auto', fontSize: '0.8rem', lineHeight: 1.6, background: '#fff', padding: '0.75rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', whiteSpace: 'pre-wrap' }}>
              {result.extractedText}
            </div>
          )}
        </div>
      )}

      {/* Parties + dates */}
      {(result.parties.length > 0 || result.keyDates.length > 0) && (
        <div className="ocr-meta-grid">
          {result.parties.length > 0 && (
            <div className="ocr-meta-cell">
              <p className="ocr-meta-label">PARTIES</p>
              {result.parties.map((p, i) => <p key={i} className="ocr-meta-val">{p}</p>)}
            </div>
          )}
          {result.keyDates.length > 0 && (
            <div className="ocr-meta-cell">
              <p className="ocr-meta-label">KEY DATES</p>
              {result.keyDates.map((d, i) => <p key={i} className="ocr-meta-val">{d}</p>)}
            </div>
          )}
        </div>
      )}

      {/* Legal references */}
      {total > 0 && (
        <div className="ocr-section">
          <div className="ocr-section-header-row">
            <p className="ocr-section-label">LEGAL REFERENCES ({total})</p>
            <span className="ocr-ref-tally">
              <span className="ocr-ref-tally-verified">{verified} verified</span>
              {total - verified > 0 && <span className="ocr-ref-tally-unverified"> · {total - verified} unverified</span>}
            </span>
          </div>
          {result.legalReferences.map((r, i) => (
            <ReferenceCard key={i} ref={r} idx={i} />
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
        {onTransferToUnderstand && result.extractedText && (
          <button
            type="button"
            className="btn-submit"
            style={{ flex: 1, minWidth: '220px' }}
            onClick={() => onTransferToUnderstand(result.extractedText)}
          >
            📄 Analyze in Full Document Breakdown (Understand) →
          </button>
        )}
        <button
          type="button"
          className="ocr-ask-btn"
          style={{ flex: 1, minWidth: '220px' }}
          onClick={() => onAskAbout(`I've uploaded a document. Here is what was extracted:\n\nDocument type: ${result.documentType}\n\nSummary: ${result.summary}\n\nPlease give me a detailed legal analysis under Indian law.`)}
        >
          ✦ Ask LAWJOURNEY AI about this document
        </button>
      </div>

      <p className="ocr-disclaimer">{result.disclaimer}</p>
    </div>
  );
}

// ── Upload drop zone ──────────────────────────────────────────
interface OCRUploaderProps {
  readonly onResult: (r: OCROutput) => void;
  readonly onAskAbout: (q: string) => void;
  readonly isLoading: boolean;
  readonly onLoadingChange: (v: boolean) => void;
  readonly onTransferToUnderstand?: (text: string) => void;
}

export function OCRUploader({
  onResult,
  onAskAbout,
  isLoading,
  onLoadingChange,
  onTransferToUnderstand,
}: OCRUploaderProps) {
  const [result, setResult] = useState<OCROutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function processFile(file: File) {
    setError(null);
    setResult(null);

    const isImage = file.type.startsWith('image/');
    const isText  = file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md');
    const isPdf   = file.type === 'application/pdf' || file.name.endsWith('.pdf');

    if (!isImage && !isText && !isPdf) {
      setError('Please upload an image (JPG, PNG, WebP), PDF, or plain text file.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError('File must be under 15MB.');
      return;
    }

    onLoadingChange(true);

    try {
      if (isText) {
        setStage('Reading text document…');
        const text = await file.text();
        setStage('Identifying legal references…');
        const output = await clientOcr({ pastedText: text });
        setStage('Preparing results…');
        setResult(output);
        onResult(output);
        return;
      }

      setStage('Reading document…');
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          resolve(dataUrl.split(',')[1] || '');
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Step 1: Extract raw text using Bodhan indic-ocr (Indian language aware)
      let extractedText: string | undefined;
      try {
        setStage('Extracting text with Bodhan AI Indic-OCR…');
        const bodhanResult = await bodhanOcr(base64, file.type || 'image/png');
        extractedText = bodhanResult.extractedText;
        setStage('Checking legal references against Indian law…');
      } catch {
        // Bodhan OCR fallback — pass image to vision pipeline
        setStage('Analyzing document image…');
      }

      // Step 2: Legal analysis
      setStage('Checking legal sources…');
      const output = await clientOcr(
        extractedText
          ? { pastedText: extractedText }
          : { imageBase64: base64, mimeType: file.type || 'image/png' }
      );
      setStage('Preparing results…');
      setResult(output);
      onResult(output);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      onLoadingChange(false);
      setStage(null);
    }
  }

  async function processSample() {
    onLoadingChange(true);
    setError(null);
    setStage('Identifying legal references…');
    try {
      setStage('Checking legal sources…');
      const output = await clientOcr({
        pastedText: `EMPLOYMENT AND CONFIDENTIALITY AGREEMENT — TECH VENTURES INDIA
1. Restraint of Trade: Under Clause 12, Employee agrees not to participate in any competitive software business anywhere in India for 2 years following termination. Note: Indian Contract Act 1872 Section 27 renders agreements in restraint of trade void.
2. Criminal Breach of Trust: Any disclosure of customer passwords shall constitute criminal breach of trust under BNS Section 316 and Bharatiya Nyaya Sanhita Section 318 (Cheating).
3. Evidence Admissibility: All WhatsApp messages and Slack logs shall be admitted without certificate under BSA Section 63.
4. Constitutional Rights: This agreement honors Fundamental Rights guaranteed under Constitution Article 14, Article 19(1)(g), and Article 21.`,
      });
      setStage('Preparing results…');
      setResult(output);
      onResult(output);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sample analysis failed.');
    } finally {
      onLoadingChange(false);
      setStage(null);
    }
  }

  function handleFiles(files: FileList | null) {
    if (files?.[0]) void processFile(files[0]);
  }

  if (result) {
    return (
      <OCRResultPanel
        result={result}
        onAskAbout={onAskAbout}
        onDismiss={() => { setResult(null); setError(null); }}
        onTransferToUnderstand={onTransferToUnderstand}
      />
    );
  }

  return (
    <div className="ocr-uploader">
      {/* Drop zone */}
      <div
        className={`ocr-dropzone${dragging ? ' dragging' : ''}${isLoading ? ' loading' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => !isLoading && fileRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload legal document image or scan"
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*,application/pdf,.txt,.md"
          className="visually-hidden"
          onChange={e => handleFiles(e.target.files)}
        />

        {isLoading ? (
          <div className="ocr-loading-state">
            <Loader size="2.6rem" color="var(--gold)" />
            <p className="ocr-loading-stage">{stage ?? 'Processing…'}</p>
            <div className="ocr-loading-stages">
              {['Reading document…', 'Extracting text (Bodhan AI)…', 'Checking legal sources…', 'Preparing results…'].map(s => (
                <span key={s} className={`ocr-stage-pip${s === stage ? ' active' : ''}`} aria-hidden="true" />
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="ocr-drop-icon" aria-hidden="true">📷</div>
            <p className="ocr-drop-title">Upload a legal document, scan, or photo</p>
            <p className="ocr-drop-sub">
              Bodhan AI Indic-OCR extracts the legal text and verifies statutory citations (BNS, BSA, ICA) against Indian law
            </p>
            <span className="ocr-drop-btn">Choose Document / Image</span>
            <p className="ocr-drop-formats">JPG · PNG · WebP · PDF · TXT · up to 15MB</p>
          </>
        )}
      </div>

      {!isLoading && (
        <div style={{ marginTop: '0.875rem', textAlign: 'center' }}>
          <button type="button" className="btn-ghost" onClick={processSample}>
            ✦ Try sample agreement (BNS, BNSS, BSA & ICA verification)
          </button>
        </div>
      )}

      {error && (
        <div className="ocr-error" role="alert">
          <span aria-hidden="true">⚠</span> {error}
          <button type="button" className="ocr-error-dismiss" onClick={() => setError(null)} aria-label="Dismiss">✕</button>
        </div>
      )}

      {/* Powered by note */}
      <p className="ocr-powered-note">
        Powered by Bodhan AI Indic-OCR & Claude Opus · Verified against India Code · Not legal advice
      </p>
    </div>
  );
}
