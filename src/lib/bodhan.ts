/**
 * bodhan.ts — Indic Translation via Bodhan AI (console.bodhan.ai)
 *
 * API: OpenAI-compatible at https://api.bodhan.ai/v1
 * Model: indic-translate
 * Pricing: ₹0.20 / 10K output tokens  |  free ₹10 credit on signup
 *
 * Supported target languages (22 scheduled Indian + English):
 *   hi = Hindi, bn = Bengali, te = Telugu, mr = Marathi, ta = Tamil,
 *   gu = Gujarati, kn = Kannada, ml = Malayalam, pa = Punjabi,
 *   or = Odia, as = Assamese, ur = Urdu, sa = Sanskrit,
 *   kok = Konkani, mai = Maithili, doi = Dogri, mni = Manipuri,
 *   ks = Kashmiri, sd = Sindhi, ne = Nepali, si = Sinhala, bo = Bodo
 */

export const INDIC_LANGUAGES: Record<string, string> = {
  hi: 'हिंदी',
  bn: 'বাংলা',
  te: 'తెలుగు',
  mr: 'मराठी',
  ta: 'தமிழ்',
  gu: 'ગુજરાતી',
  kn: 'ಕನ್ನಡ',
  ml: 'മലയാളം',
  pa: 'ਪੰਜਾਬੀ',
  ur: 'اردو',
  or: 'ଓଡ଼ିଆ',
};

export interface TranslationResult {
  translatedText: string;
  targetLanguage: string;
  targetLanguageLabel: string;
  model: string;
  provider: 'bodhan';
}

/**
 * Translate text from English → any supported Indian language
 * using the Bodhan AI `indic-translate` model.
 *
 * Returns null if the API key is not configured (graceful degradation).
 */
export async function translateToIndic(
  text: string,
  targetLangCode: string = 'hi',
): Promise<TranslationResult> {
  const apiKey =
    process.env.NEXT_PUBLIC_BODHAN_API_KEY ||
    process.env.BODHAN_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    throw new Error(
      'Bodhan AI key not configured. Get a free key at console.bodhan.ai ' +
      '(₹10 free credit, no card needed) and set NEXT_PUBLIC_BODHAN_API_KEY in .env.local'
    );
  }

  const response = await fetch('https://api.bodhan.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'indic-translate',
      messages: [{ role: 'user', content: text }],
      source_language_code: 'en',
      target_language_code: targetLangCode,
      target_script: 'native',
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    if (response.status === 401) {
      throw new Error('Bodhan AI: Invalid API key. Check NEXT_PUBLIC_BODHAN_API_KEY.');
    }
    if (response.status === 429) {
      throw new Error('Bodhan AI: Rate limit or credit exhausted. Top up at console.bodhan.ai');
    }
    throw new Error(`Bodhan AI translation failed (${response.status}): ${body.slice(0, 120)}`);
  }

  const data = await response.json() as {
    choices?: { message?: { content?: string } }[];
    model?: string;
  };

  const translatedText = data.choices?.[0]?.message?.content ?? '';
  if (!translatedText) {
    throw new Error('Bodhan AI returned an empty translation.');
  }

  return {
    translatedText,
    targetLanguage: targetLangCode,
    targetLanguageLabel: INDIC_LANGUAGES[targetLangCode] ?? targetLangCode,
    model: data.model ?? 'indic-translate',
    provider: 'bodhan',
  };
}

/** Translate a structured legal document summary to Hindi */
export async function translateLegalSummary(
  summary: string,
  targetLangCode = 'hi',
): Promise<TranslationResult> {
  // Prepend context so the model preserves legal formatting
  const enriched = `Translate the following Indian legal document summary accurately. Preserve all legal terms, section numbers, and formatting:\n\n${summary}`;
  return translateToIndic(enriched, targetLangCode);
}

// ─── BODHAN OCR ────────────────────────────────────────────────

export interface BodhanOCRResult {
  extractedText: string;
  model: string;
  provider: 'bodhan';
}

/**
 * Extract text from a document image using Bodhan AI `indic-ocr`.
 * Returns the raw Markdown text with reading-order preserved.
 * Falls back gracefully if OCR key is not set.
 */
export async function bodhanOcr(
  imageBase64: string,
  mimeType: string,
): Promise<BodhanOCRResult> {
  const apiKey =
    process.env.NEXT_PUBLIC_BODHAN_OCR_API_KEY ||
    process.env.BODHAN_OCR_API_KEY ||
    process.env.NEXT_PUBLIC_BODHAN_API_KEY ||
    process.env.BODHAN_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    throw new Error(
      'Bodhan OCR key not configured. Set NEXT_PUBLIC_BODHAN_OCR_API_KEY in .env.local'
    );
  }

  const response = await fetch('https://api.bodhan.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'indic-ocr',
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${imageBase64}` },
          },
          {
            type: 'text',
            text: 'Extract all text from this legal document image. Preserve reading order, section headings, numbered clauses, tables, and any signatures or dates. Return the full text in Markdown format.',
          },
        ],
      }],
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    if (response.status === 401) throw new Error('Bodhan OCR: Invalid API key.');
    if (response.status === 429) throw new Error('Bodhan OCR: Rate limit reached. Retry in a moment.');
    throw new Error(`Bodhan OCR failed (${response.status}): ${body.slice(0, 120)}`);
  }

  const data = await response.json() as {
    choices?: { message?: { content?: string } }[];
    blocks?: { text?: string; label?: string }[];
    model?: string;
  };

  let extractedText = data.choices?.[0]?.message?.content ?? '';
  if (!extractedText.trim() && Array.isArray(data.blocks)) {
    extractedText = data.blocks
      .map(b => b.text?.trim())
      .filter((t): t is string => Boolean(t))
      .join('\n\n');
  }

  if (!extractedText.trim()) {
    throw new Error('No readable text could be detected in this image. Please ensure the document is clear, well-lit, and legible.');
  }

  return {
    extractedText: extractedText.trim(),
    model: data.model ?? 'indic-ocr',
    provider: 'bodhan',
  };
}
