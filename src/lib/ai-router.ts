/**
 * ai-router.ts — Resilient AI execution with automatic fallback.
 *
 * Execution order:
 *   1. Primary: Google Gemini (native REST)
 *   2. Fallback A: Gemini via OpenRouter  (model: google/gemini-2.0-flash-exp)
 *   3. Fallback B: Claude via OpenRouter  (model: anthropic/claude-opus-4-5)
 *
 * Triggers fallback on:
 *   - HTTP 429  (rate limit / quota exceeded)
 *   - HTTP 500/502/503/504  (transient server errors)
 *   - Network timeout  (> GEMINI_TIMEOUT_MS)
 *   - Empty / malformed response
 *
 * Bodhan OCR fallback:
 *   Bodhan 429/401/5xx → Gemini Vision via direct API
 */
import 'server-only';

import { GEMINI_MODEL, GEMINI_API_BASE, MAX_TOKENS, TEMPERATURE } from './constants';

// Lightweight inline logger so ai-router has no dependency on logger.ts
// (which pulls in 'server-only' transitively into client bundles when imported via gemini.ts)
/* eslint-disable no-console */
const log = {
  info:  (event: string, data?: Record<string, unknown>) => console.info(JSON.stringify({ level: 'info', event, ...data })),
  warn:  (event: string, data?: Record<string, unknown>) => console.warn(JSON.stringify({ level: 'warn', event, ...data })),
  error: (event: string, data?: Record<string, unknown>) => console.error(JSON.stringify({ level: 'error', event, ...data })),
} as const;
/* eslint-enable no-console */


// ── Tunables ───────────────────────────────────────────────────
const GEMINI_TIMEOUT_MS = 25_000;          // 25 s primary timeout
const RETRY_DELAYS_MS   = [500, 1_500];   // wait before retry 1, retry 2

// ── OpenRouter fallback models ─────────────────────────────────
const OR_GEMINI_MODEL = 'google/gemini-2.0-flash-exp:free';
const OR_CLAUDE_MODEL = 'anthropic/claude-opus-4-5';
const OR_BASE         = 'https://openrouter.ai/api/v1';
const SITE_URL        = 'https://lawjourney-ai-2026.web.app';
const SITE_NAME       = 'LawJourney AI';

// ── Error classification ───────────────────────────────────────
function isRetriable(status: number): boolean {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}
function isRateLimit(status: number): boolean {
  return status === 429;
}

// ── Helpers ────────────────────────────────────────────────────
function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

function getGeminiKey(): string | null {
  return (process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '').trim() || null;
}

function getOpenRouterKey(): string | null {
  return (process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY || '').trim() || null;
}

function getBodhanKey(): string | null {
  return (
    process.env.NEXT_PUBLIC_BODHAN_OCR_API_KEY ||
    process.env.BODHAN_OCR_API_KEY             ||
    process.env.NEXT_PUBLIC_BODHAN_API_KEY      ||
    process.env.BODHAN_API_KEY                  || ''
  ).trim() || null;
}

// ── Gemini types ───────────────────────────────────────────────
type GeminiPart      = { text: string };
type GeminiCandidate = { content: { parts: GeminiPart[] } };
type GeminiResponse  = { candidates: GeminiCandidate[] };

// ── 1. Primary: Direct Gemini REST ────────────────────────────
async function callGeminiDirect(prompt: string): Promise<string> {
  const apiKey = getGeminiKey();
  if (!apiKey) throw new Error('Gemini API key not configured');

  const url = `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: TEMPERATURE,
          maxOutputTokens: MAX_TOKENS,
          responseMimeType: 'application/json',
        },
      }),
    });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const err = new Error(`Gemini ${res.status}: ${body.slice(0, 200)}`);
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }

  const data = (await res.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty Gemini response');
  return text;
}

// ── 2. Fallback A: Gemini via OpenRouter ──────────────────────
async function callGeminiViaOpenRouter(prompt: string): Promise<string> {
  const apiKey = getOpenRouterKey();
  if (!apiKey) throw new Error('OpenRouter key not configured — cannot use Gemini fallback');

  const res = await fetch(`${OR_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type':  'application/json',
      'HTTP-Referer':  SITE_URL,
      'X-Title':       SITE_NAME,
    },
    body: JSON.stringify({
      model: OR_GEMINI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const err = new Error(`OpenRouter/Gemini ${res.status}`);
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty OpenRouter/Gemini response');
  return content;
}

// ── 3. Fallback B: Claude via OpenRouter ──────────────────────
async function callClaudeViaOpenRouter(prompt: string): Promise<string> {
  const apiKey = getOpenRouterKey();
  if (!apiKey) throw new Error('OpenRouter key not configured — cannot use Claude fallback');

  const res = await fetch(`${OR_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type':  'application/json',
      'HTTP-Referer':  SITE_URL,
      'X-Title':       SITE_NAME,
    },
    body: JSON.stringify({
      model: OR_CLAUDE_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const err = new Error(`OpenRouter/Claude ${res.status}`);
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty OpenRouter/Claude response');
  return content;
}

// ── Main router: callWithFallback ─────────────────────────────
/**
 * Executes a prompt with cascading fallback:
 *   Gemini Direct → Gemini via OpenRouter → Claude via OpenRouter
 *
 * Retries primary on transient errors before escalating to fallbacks.
 */
export async function callWithFallback(prompt: string): Promise<string> {
  let lastError: Error = new Error('No providers available');

  // ── Primary: Gemini Direct (up to 2 retries on retriable errors) ──
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      if (attempt > 0) {
        log.warn(`ai_router_gemini_retry`, { attempt });
        await sleep(RETRY_DELAYS_MS[attempt - 1]);
      }
      const result = await callGeminiDirect(prompt);
      if (attempt > 0) log.info('ai_router_gemini_recovered', { attempt });
      return result;
    } catch (err) {
      lastError = err as Error;
      const status = (err as Error & { status?: number }).status;

      // Abort early if not retriable (e.g. 400 bad request, 401 auth)
      if (status && !isRetriable(status)) break;

      // If rate-limited on last retry, stop and go to fallback
      if (status && isRateLimit(status) && attempt === RETRY_DELAYS_MS.length) {
        log.warn('ai_router_gemini_rate_limited', { attempt });
        break;
      }

      if (attempt < RETRY_DELAYS_MS.length) {
        log.warn('ai_router_gemini_transient', { attempt, status });
      }
    }
  }

  log.warn('ai_router_fallback_a', { reason: lastError.message });

  // ── Fallback A: Gemini via OpenRouter ──
  try {
    const result = await callGeminiViaOpenRouter(prompt);
    log.info('ai_router_fallback_a_success');
    return result;
  } catch (err) {
    lastError = err as Error;
    log.warn('ai_router_fallback_a_failed', { reason: lastError.message });
  }

  // ── Fallback B: Claude via OpenRouter ──
  try {
    const result = await callClaudeViaOpenRouter(prompt);
    log.info('ai_router_fallback_b_success');
    return result;
  } catch (err) {
    lastError = err as Error;
    log.error('ai_router_all_failed', { reason: lastError.message });
  }

  throw new Error(
    'All AI providers are currently unavailable. Please try again in a moment. ' +
    `(Last error: ${lastError.message})`
  );
}

// ── Gemini Vision Fallback for OCR ────────────────────────────
/**
 * Uses Gemini Vision API directly to extract text from an image.
 * Invoked as fallback when Bodhan OCR fails.
 */
export async function geminiVisionOcr(imageBase64: string, mimeType: string): Promise<string> {
  const apiKey = getGeminiKey();
  if (!apiKey) throw new Error('Gemini Vision: API key not configured');

  // Use gemini-3.5-flash which supports vision
  const url = `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              inline_data: {
                mime_type: mimeType,
                data: imageBase64,
              },
            },
            {
              text: 'Extract ALL text from this legal document image. Preserve reading order, numbered clauses, headings, signatures, dates, and party names. Return the complete text in Markdown format.',
            },
          ],
        }],
        generationConfig: {
          temperature: 0.0,
          maxOutputTokens: 4096,
        },
      }),
    });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Gemini Vision ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini Vision returned empty OCR result');
  return text;
}

/**
 * Resilient Bodhan OCR with Gemini Vision fallback.
 * Falls back to Gemini if Bodhan hits 429, 401, or any 5xx.
 */
export async function ocrWithFallback(
  imageBase64: string,
  mimeType: string,
): Promise<{ extractedText: string; model: string; provider: string }> {
  const bodhanKey = getBodhanKey();

  // ── Primary: Bodhan OCR ──
  if (bodhanKey) {
    try {
      const response = await fetch('https://api.bodhan.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${bodhanKey}`,
          'Content-Type':  'application/json',
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

      if (response.ok) {
        const data = await response.json() as {
          choices?: { message?: { content?: string } }[];
          blocks?: { text?: string }[];
          model?: string;
        };
        let extractedText = data.choices?.[0]?.message?.content ?? '';
        if (!extractedText.trim() && Array.isArray(data.blocks)) {
          extractedText = data.blocks
            .map(b => b.text?.trim())
            .filter((t): t is string => Boolean(t))
            .join('\n\n');
        }
        if (extractedText.trim()) {
          return {
            extractedText: extractedText.trim(),
            model: data.model ?? 'indic-ocr',
            provider: 'bodhan',
          };
        }
      } else {
        log.warn('ocr_bodhan_failed', { status: response.status });
        // Fall through to Gemini Vision
      }
    } catch (err) {
      log.warn('ocr_bodhan_error', { message: (err as Error).message });
      // Fall through to Gemini Vision
    }
  } else {
    log.warn('ocr_bodhan_no_key');
  }

  // ── Fallback: Gemini Vision ──
  log.info('ocr_gemini_vision_fallback');
  try {
    const extractedText = await geminiVisionOcr(imageBase64, mimeType);
    return {
      extractedText,
      model: GEMINI_MODEL,
      provider: 'gemini-vision',
    };
  } catch (err) {
    throw new Error(
      `OCR failed on all providers. Bodhan and Gemini Vision both unavailable. ` +
      `(${(err as Error).message})`
    );
  }
}
