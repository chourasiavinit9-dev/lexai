import {
  UnderstandInputSchema,
  UnderstandOutputSchema,
  ClarifyInputSchema,
  ClarifyOutputSchema,
  CompareInputSchema,
  CompareOutputSchema,
  NavigateInputSchema,
  NavigateOutputSchema,
  ChatInputSchema,
  ChatOutputSchema,
  OCRInputSchema,
  OCROutputSchema,
  type UnderstandInput,
  type UnderstandOutput,
  type ClarifyInput,
  type ClarifyOutput,
  type CompareInput,
  type CompareOutput,
  type NavigateInput,
  type NavigateOutput,
  type ChatInput,
  type ChatOutput,
  type OCRInput,
  type OCROutput,
} from './validators';
import {
  geminiUnderstand,
  geminiClarify,
  geminiCompare,
  geminiNavigate,
  geminiChat,
} from './gemini';
import { callOpenRouter, extractJSON, type OpenRouterContentPart } from './openrouter';
import { retrieveProvisions, retrieveSection, retrieveArticle } from './legal-corpus';

/** Safe JSON parse helper that handles markdown code fences */
function parseJsonPayload<T>(raw: string, schema: { parse: (val: unknown) => T }): T {
  const jsonStr = extractJSON(raw);
  const parsed = JSON.parse(jsonStr);
  return schema.parse(parsed);
}

// ─── RETRY + FALLBACK LAYER ────────────────────────────────────

/** Transient error codes that are worth retrying */
function isRetryable(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    // 503 overload, 429 rate-limit, network errors
    if (msg.includes('503') || msg.includes('unavailable') || msg.includes('high demand')) return true;
    if (msg.includes('429') || msg.includes('rate limit') || msg.includes('quota')) return true;
    if (msg.includes('network') || msg.includes('failed to fetch') || msg.includes('timeout')) return true;
  }
  return false;
}

/** Exponential backoff delay: 1s, 2s, 4s */
function backoffMs(attempt: number): number {
  return Math.min(1000 * Math.pow(2, attempt), 8000);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Call `primaryFn` up to `maxRetries` times with exponential backoff.
 * On persistent transient errors, call `fallbackFn` (OpenRouter) instead.
 * Surfaces a friendly error message — never raw API JSON.
 */
async function withRetryAndFallback<T>(
  primaryFn: () => Promise<T>,
  fallbackFn: () => Promise<T>,
  maxRetries = 3,
): Promise<T> {
  let lastErr: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await primaryFn();
    } catch (err) {
      lastErr = err;
      if (!isRetryable(err)) break;            // non-retryable — go straight to fallback
      if (attempt < maxRetries - 1) {
        await sleep(backoffMs(attempt));         // wait before next attempt
      }
    }
  }

  // Gemini failed — try OpenRouter as backup
  console.warn('[LawJourney] Gemini unavailable, switching to backup AI provider…', lastErr);
  try {
    return await fallbackFn();
  } catch (fallbackErr) {
    // Both providers failed — throw a friendly error
    const msg = lastErr instanceof Error ? lastErr.message : String(lastErr);
    if (msg.includes('503') || msg.includes('unavailable') || msg.includes('high demand')) {
      throw new Error('AI service is temporarily busy — please try again in 30 seconds. Your document is safe.');
    }
    if (msg.includes('429') || msg.includes('quota')) {
      throw new Error('Usage limit reached — please try again in a minute.');
    }
    throw new Error('Could not reach the AI service. Please check your connection and try again.');
  }
}

// ─── UNDERSTAND ───────────────────────────────────────────────
export async function clientUnderstand(input: UnderstandInput): Promise<UnderstandOutput> {
  // Try static API route first (no-op on Firebase Hosting static export)
  try {
    const res = await fetch('/api/understand', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (res.ok) return (await res.json()) as UnderstandOutput;
  } catch { /* static hosting — no API routes */ }

  const validated = UnderstandInputSchema.parse(input);

  return withRetryAndFallback(
    async () => parseJsonPayload(await geminiUnderstand(validated), UnderstandOutputSchema),
    async () => {
      const raw = await callOpenRouter(
        [{ role: 'user', content: `You are LAWJOURNEY AI. Analyze this Indian legal document and return ONLY valid JSON matching the UnderstandOutput schema.\n\nDocument:\n${validated.documentText}\n\nRole: ${validated.userRole || 'general reader'}\nLevel: ${validated.readingLevel}` }],
        { maxTokens: 4096, temperature: 0.1 }
      );
      return parseJsonPayload(raw, UnderstandOutputSchema);
    }
  );
}

// ─── CLARIFY ──────────────────────────────────────────────────
export async function clientClarify(input: ClarifyInput): Promise<ClarifyOutput> {
  try {
    const res = await fetch('/api/clarify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (res.ok) return (await res.json()) as ClarifyOutput;
  } catch { /* static hosting */ }

  const validated = ClarifyInputSchema.parse(input);

  return withRetryAndFallback(
    async () => parseJsonPayload(await geminiClarify(validated), ClarifyOutputSchema),
    async () => {
      const raw = await callOpenRouter(
        [{ role: 'user', content: `You are LAWJOURNEY AI. Clarify this Indian legal clause (question type: ${validated.questionType}) and return ONLY valid JSON matching the ClarifyOutput schema.\n\nClause:\n${validated.clauseText}\n\nContext: ${validated.context || 'none'}` }],
        { maxTokens: 2048, temperature: 0.1 }
      );
      return parseJsonPayload(raw, ClarifyOutputSchema);
    }
  );
}

// ─── COMPARE ──────────────────────────────────────────────────
export async function clientCompare(input: CompareInput): Promise<CompareOutput> {
  try {
    const res = await fetch('/api/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (res.ok) return (await res.json()) as CompareOutput;
  } catch { /* static hosting */ }

  const validated = CompareInputSchema.parse(input);

  return withRetryAndFallback(
    async () => parseJsonPayload(await geminiCompare(validated), CompareOutputSchema),
    async () => {
      const raw = await callOpenRouter(
        [{ role: 'user', content: `You are LAWJOURNEY AI. Compare these two Indian legal documents and return ONLY valid JSON matching the CompareOutput schema.\n\nVersion A:\n${validated.documentA}\n\nVersion B:\n${validated.documentB}` }],
        { maxTokens: 4096, temperature: 0.1 }
      );
      return parseJsonPayload(raw, CompareOutputSchema);
    }
  );
}

// ─── NAVIGATE ─────────────────────────────────────────────────
export async function clientNavigate(input: NavigateInput): Promise<NavigateOutput> {
  try {
    const res = await fetch('/api/navigate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (res.ok) return (await res.json()) as NavigateOutput;
  } catch { /* static hosting */ }

  const validated = NavigateInputSchema.parse(input);

  return withRetryAndFallback(
    async () => parseJsonPayload(await geminiNavigate(validated), NavigateOutputSchema),
    async () => {
      const raw = await callOpenRouter(
        [{ role: 'user', content: `You are LAWJOURNEY AI. Navigate this Indian legal document for the user's goal and return ONLY valid JSON matching the NavigateOutput schema.\n\nDocument:\n${validated.documentText}\n\nGoal: ${validated.userGoal}` }],
        { maxTokens: 3000, temperature: 0.1 }
      );
      return parseJsonPayload(raw, NavigateOutputSchema);
    }
  );
}

// ─── CHAT ─────────────────────────────────────────────────────
export async function clientChat(input: ChatInput): Promise<ChatOutput> {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (res.ok) return (await res.json()) as ChatOutput;
  } catch { /* static hosting */ }

  const validated = ChatInputSchema.parse(input);

  return withRetryAndFallback(
    async () => parseJsonPayload(await geminiChat(validated), ChatOutputSchema),
    async () => {
      const msgs = validated.messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));
      const raw = await callOpenRouter(
        [
          { role: 'user', content: `You are LAWJOURNEY AI, an Indian legal assistant. Answer questions grounded in real Indian statutes.\n\nReturn ONLY valid JSON matching the ChatOutput schema.${validated.documentContext ? '\n\nDocument context:\n' + validated.documentContext : ''}` },
          ...msgs,
        ],
        { maxTokens: 2048, temperature: 0.2 }
      );
      return parseJsonPayload(raw, ChatOutputSchema);
    }
  );
}

// ─── OCR & DOCUMENT EXTRACTION ───────────────────────────────
export async function clientOcr(input: OCRInput): Promise<OCROutput> {
  try {
    const res = await fetch('/api/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (res.ok) return (await res.json()) as OCROutput;
  } catch { /* static hosting */ }

  const validatedInput = OCRInputSchema.parse(input);

  // 1. Legal corpus retrieval
  const searchText = validatedInput.pastedText ?? 'contract legal notice agreement';
  const retrieved = retrieveProvisions(searchText);

  const specificProvisions: string[] = [];
  if (validatedInput.pastedText) {
    for (const m of Array.from(validatedInput.pastedText.matchAll(/BNS\s+[Ss]ection\s+(\d+[A-Za-z]*)/g))) {
      const p = retrieveSection('BNS', m[1]);
      if (p) specificProvisions.push(`BNS §${p.section} — ${p.heading}:\n${p.text}\nSource: ${p.source}`);
    }
    for (const m of Array.from(validatedInput.pastedText.matchAll(/BNSS\s+[Ss]ection\s+(\d+[A-Za-z]*)/g))) {
      const p = retrieveSection('BNSS', m[1]);
      if (p) specificProvisions.push(`BNSS §${p.section} — ${p.heading}:\n${p.text}\nSource: ${p.source}`);
    }
    for (const m of Array.from(validatedInput.pastedText.matchAll(/BSA\s+[Ss]ection\s+(\d+[A-Za-z]*)/g))) {
      const p = retrieveSection('BSA', m[1]);
      if (p) specificProvisions.push(`BSA §${p.section} — ${p.heading}:\n${p.text}\nSource: ${p.source}`);
    }
    for (const m of Array.from(validatedInput.pastedText.matchAll(/Article\s+([\d()\w]+)/gi))) {
      const p = retrieveArticle(m[1]);
      if (p) specificProvisions.push(`Constitution Article ${p.article} — ${p.heading}:\n${p.text}\nSource: ${p.source}`);
    }
  }

  const corpusContext = [
    ...specificProvisions,
    ...retrieved.map(
      r => `${r.provision.act} ${r.provision.section ? `§${r.provision.section}` : `Art.${r.provision.article ?? ''}`} — ${r.provision.heading}:\n${r.provision.text.slice(0, 350)}\nSource: ${r.provision.source}`
    ),
  ].join('\n\n---\n\n') || 'No specific provisions loaded. Flag uncertainty on all references.';

  const SYSTEM_PROMPT = `You are LAWJOURNEY AI, an Indian legal document analysis assistant.
Extract all readable text, identify document type, detect legal references (BNS, BNSS, BSA, Constitution, ICA, CPA), parties, key dates, and summary.
Ground your verification against the corpus context.
Return ONLY valid JSON matching:
{
  "documentType": "string",
  "extractedText": "string",
  "ocrConfidence": "high|medium|low|not_applicable",
  "ocrWarning": "string or omit",
  "parties": ["party names"],
  "keyDates": ["important dates"],
  "legalReferences": [
    {
      "type": "section|article|act|case|other",
      "act": "full Act name",
      "shortName": "BNS|BNSS|BSA|ICA|CPA|Constitution|etc",
      "section": "section if applicable",
      "article": "article if applicable",
      "description": "one sentence summary",
      "verificationStatus": "VERIFIED|PARTIALLY_VERIFIED|NOT_VERIFIED|POSSIBLE_OCR_ERROR|VERSION_CHECK_REQUIRED",
      "verifiedText": "exact text from corpus if matched",
      "verifiedSource": "source from corpus if matched",
      "confidence": "high|medium|low"
    }
  ],
  "summary": "2-3 sentence plain-English summary",
  "disclaimer": "This is legal information grounded in Indian law, not legal advice. Verify with a licensed advocate."
}`;

  const promptText = `User input:
"""
${validatedInput.pastedText ?? (validatedInput.imageBase64 ? 'Document image attached.' : '')}
"""

AUTHORITATIVE LEGAL CORPUS CONTEXT:
${corpusContext}

Return ONLY the JSON response:`;

  const contentParts: OpenRouterContentPart[] = [];
  if (validatedInput.imageBase64 && validatedInput.mimeType) {
    contentParts.push({
      type: 'image_url',
      image_url: { url: `data:${validatedInput.mimeType};base64,${validatedInput.imageBase64}` },
    });
  }
  contentParts.push({ type: 'text', text: promptText });

  // OCR always uses OpenRouter (vision model) with retry
  return withRetryAndFallback(
    async () => {
      const raw = await callOpenRouter(
        [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: contentParts },
        ],
        { maxTokens: 4096, temperature: 0.1 }
      );
      return parseJsonPayload(raw, OCROutputSchema);
    },
    async () => {
      // Retry with text-only if vision fails
      const raw = await callOpenRouter(
        [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: [{ type: 'text', text: promptText }] },
        ],
        { maxTokens: 4096, temperature: 0.1 }
      );
      return parseJsonPayload(raw, OCROutputSchema);
    }
  );
}
