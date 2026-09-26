'use client';

import { useState } from 'react';
import { translateLegalSummary, INDIC_LANGUAGES } from '@/lib/bodhan';

interface Props {
  /** The English text to translate (e.g. document summary / clause plain-English) */
  readonly text: string;
  /** Label shown before translation. Defaults to "Translate to:" */
  readonly label?: string;
  /** Extra CSS class */
  readonly className?: string;
}

const LANG_OPTIONS = Object.entries(INDIC_LANGUAGES).map(([code, name]) => ({ code, name }));

export function IndicTranslateButton({ text, label = 'Translate', className = '' }: Props) {
  const [selectedLang, setSelectedLang] = useState('hi');
  const [translated, setTranslated] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleTranslate() {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setTranslated(null);
    try {
      const result = await translateLegalSummary(text, selectedLang);
      setTranslated(result.translatedText);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Translation failed';
      if (msg.includes('not configured')) {
        setError('Hindi translation requires a free Bodhan AI key. Visit console.bodhan.ai to get ₹10 free credit (no card needed).');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`indic-translate ${className}`}>
      {/* Trigger row */}
      <div className="indic-translate__bar">
        {/* Language selector */}
        <div className="indic-translate__flag-wrap">
          <span className="indic-translate__flag" aria-hidden="true">🇮🇳</span>
        </div>
        <select
          className="indic-translate__select"
          value={selectedLang}
          onChange={e => { setSelectedLang(e.target.value); setTranslated(null); setError(null); }}
          aria-label="Select Indian language"
        >
          {LANG_OPTIONS.map(({ code, name }) => (
            <option key={code} value={code}>{name}</option>
          ))}
        </select>
        <button
          type="button"
          className="indic-translate__btn"
          onClick={handleTranslate}
          disabled={loading}
          aria-busy={loading}
          aria-label={`${label} to ${INDIC_LANGUAGES[selectedLang]}`}
        >
          {loading ? (
            <><span className="indic-translate__spin" aria-hidden="true" /> अनुवाद…</>
          ) : (
            <>{label} →</>
          )}
        </button>
        {(translated || error) && (
          <button
            type="button"
            className="indic-translate__clear"
            onClick={() => { setTranslated(null); setError(null); }}
            aria-label="Clear translation"
          >
            ✕
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="indic-translate__error" role="alert">
          <span aria-hidden="true">⚠️</span> {error}
          {error.includes('console.bodhan.ai') && (
            <a
              href="https://console.bodhan.ai/dashboard/login/"
              target="_blank"
              rel="noopener noreferrer"
              className="indic-translate__signup-link"
            >
              Get free key →
            </a>
          )}
        </div>
      )}

      {/* Translation result */}
      {translated && (
        <div className="indic-translate__result" lang={selectedLang} dir={selectedLang === 'ur' ? 'rtl' : 'ltr'}>
          <div className="indic-translate__result-header">
            <span className="indic-translate__lang-badge">
              🇮🇳 {INDIC_LANGUAGES[selectedLang]} अनुवाद
            </span>
            <span className="indic-translate__powered">
              via Bodhan AI
            </span>
          </div>
          <p className="indic-translate__result-text">{translated}</p>
          <p className="indic-translate__result-note">
            यह अनुवाद जानकारी के लिए है · कानूनी सलाह नहीं
          </p>
        </div>
      )}
    </div>
  );
}
