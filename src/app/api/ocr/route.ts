import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { OCRInputSchema, OCROutputSchema } from '@/lib/validators';
import { callOpenRouter, extractJSON, type OpenRouterContentPart } from '@/lib/openrouter';
import { ocrWithFallback } from '@/lib/ai-router';
import { retrieveProvisions, retrieveSection, retrieveArticle } from '@/lib/legal-corpus';
import { checkRateLimit, extractClientId, pruneStaleClients } from '@/lib/rate-limit';
import { log } from '@/lib/logger';

const SYSTEM_PROMPT = `You are LAWJOURNEY AI, an Indian legal document analysis assistant.

Your responsibilities:
1. Extract all readable text from the provided image or text
2. Identify the document type (contract, legal notice, NDA, lease, employment agreement, etc.)
3. Detect legal references (Act names, Section numbers, Article numbers)
4. Identify parties and key dates
5. Provide a concise summary

CRITICAL RULES — ANTI-HALLUCINATION:
- Do NOT invent Act names, Section numbers, Article numbers, or case references
- If a reference is unclear due to image quality, set verificationStatus to "POSSIBLE_OCR_ERROR"
- If you cannot verify a section exists in the provided corpus context, set verificationStatus to "NOT_VERIFIED"
- Only set verificationStatus to "VERIFIED" if the corpus context explicitly matches
- NEVER fabricate statutory text
- Always preserve uncertainty — "possible reference" is better than a confident hallucination

You are providing legal INFORMATION, not legal ADVICE, and are not a substitute for a licensed advocate.`;

function buildUserPrompt(pastedText: string | undefined, hasImage: boolean, corpusContext: string): string {
  const inputDesc = hasImage
    ? 'The user has uploaded a legal document image. Extract all text you can read from it.'
    : `The user has provided this text:\n"""\n${pastedText ?? ''}\n"""`;

  return `${inputDesc}

AUTHORITATIVE LEGAL CORPUS CONTEXT (use this for verification — do not invent):
${corpusContext}

Return ONLY valid JSON matching this exact schema (no markdown, no preamble):
{
  "documentType": "string",
  "extractedText": "string — full text extracted, preserve original",
  "ocrConfidence": "high|medium|low|not_applicable",
  "ocrWarning": "string or omit if not applicable",
  "parties": ["party names"],
  "keyDates": ["important dates"],
  "legalReferences": [
    {
      "type": "section|article|act|case|other",
      "act": "full Act name",
      "shortName": "BNS|BNSS|BSA|ICA|CPA|Constitution|etc",
      "section": "section number if applicable, else omit",
      "article": "article number if applicable, else omit",
      "description": "one sentence about what this reference covers",
      "verificationStatus": "VERIFIED|PARTIALLY_VERIFIED|NOT_VERIFIED|POSSIBLE_OCR_ERROR|VERSION_CHECK_REQUIRED",
      "verifiedText": "if VERIFIED: the exact text from the corpus context",
      "verifiedSource": "if VERIFIED: the source string from the corpus context",
      "confidence": "high|medium|low"
    }
  ],
  "summary": "2-3 sentence plain-English summary of the document",
  "disclaimer": "This is legal information grounded in Indian law, not legal advice. Verify with a licensed advocate."
}`;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const clientId = extractClientId(req);
  const rateLimit = checkRateLimit(clientId);
  if (!rateLimit.allowed) {
    const retryAfterSec = Math.ceil(rateLimit.retryAfterMs / 1000);
    return NextResponse.json(
      { error: `Too many requests. Try again in ${retryAfterSec}s.` },
      { status: 429, headers: { 'Retry-After': String(retryAfterSec) } }
    );
  }
  pruneStaleClients();

  try {
    // 1. Parse body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
    }

    // 2. Validate input
    const parsed = OCRInputSchema.safeParse(body);
    if (!parsed.success) {
      log.warn('ocr_invalid_input', { errors: parsed.error.flatten() });
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input.' }, { status: 400 });
    }
    const input = parsed.data;

    // 3. Build corpus context
    const searchText = input.pastedText ?? 'contract legal notice agreement';
    const retrieved = retrieveProvisions(searchText);

    const specificProvisions: string[] = [];
    if (input.pastedText) {
      // Targeted BNS section lookup
      for (const m of Array.from(input.pastedText.matchAll(/BNS\s+[Ss]ection\s+(\d+[A-Za-z]*)/g))) {
        const p = retrieveSection('BNS', m[1]);
        if (p) specificProvisions.push(`BNS §${p.section} — ${p.heading}:\n${p.text}\nSource: ${p.source}`);
      }
      // Targeted BNSS section lookup
      for (const m of Array.from(input.pastedText.matchAll(/BNSS\s+[Ss]ection\s+(\d+[A-Za-z]*)/g))) {
        const p = retrieveSection('BNSS', m[1]);
        if (p) specificProvisions.push(`BNSS §${p.section} — ${p.heading}:\n${p.text}\nSource: ${p.source}`);
      }
      // Targeted BSA section lookup
      for (const m of Array.from(input.pastedText.matchAll(/BSA\s+[Ss]ection\s+(\d+[A-Za-z]*)/g))) {
        const p = retrieveSection('BSA', m[1]);
        if (p) specificProvisions.push(`BSA §${p.section} — ${p.heading}:\n${p.text}\nSource: ${p.source}`);
      }
      // Article lookup
      for (const m of Array.from(input.pastedText.matchAll(/Article\s+([\d()\w]+)/gi))) {
        const p = retrieveArticle(m[1]);
        if (p) specificProvisions.push(`Constitution Article ${p.article} — ${p.heading}:\n${p.text}\nSource: ${p.source}`);
      }
    }

    const corpusContext = [
      ...specificProvisions,
      ...retrieved.map(r =>
        `${r.provision.act} ${r.provision.section ? `§${r.provision.section}` : `Art.${r.provision.article ?? ''}`} — ${r.provision.heading}:\n${r.provision.text.slice(0, 350)}\nSource: ${r.provision.source}`
      ),
    ].join('\n\n---\n\n') || 'No specific provisions loaded. Flag uncertainty on all references.';

    // 4. If image provided — use Bodhan OCR with Gemini Vision fallback
    let rawResponse: string;

    if (input.imageBase64 && input.mimeType) {
      try {
        const ocrResult = await ocrWithFallback(input.imageBase64, input.mimeType);
        log.info('ocr_image_extracted', { provider: ocrResult.provider });
        // Wrap OCR result in the expected JSON schema
        const syntheticResult = {
          documentType: 'Legal Document (OCR extracted)',
          extractedText: ocrResult.extractedText,
          ocrConfidence: 'high' as const,
          parties: [],
          keyDates: [],
          legalReferences: [],
          summary: `Text extracted via ${ocrResult.provider} (${ocrResult.model}).`,
          disclaimer: 'This is legal information grounded in Indian law, not legal advice. Verify with a licensed advocate.',
        };
        const validated = OCROutputSchema.safeParse(syntheticResult);
        if (validated.success) {
          return NextResponse.json(validated.data);
        }
        // If schema validation fails, fall through to full OpenRouter analysis
        log.warn('ocr_synthetic_invalid', { errors: validated.error.flatten() });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'OCR failed.';
        log.error('ocr_image_failed', { message: msg });
        return NextResponse.json({ error: msg }, { status: 502 });
      }
    }

    // 5. Build OpenRouter messages for text analysis (or re-analysis after OCR)
    const contentParts: OpenRouterContentPart[] = [];
    contentParts.push({
      type: 'text',
      text: buildUserPrompt(input.pastedText, Boolean(input.imageBase64), corpusContext),
    });

    // 6. Call Claude Opus via OpenRouter
    try {
      rawResponse = await callOpenRouter(
        [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user',   content: contentParts },
        ],
        { maxTokens: 4096, temperature: 0.1 }
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'AI processing failed.';
      log.error('ocr_openrouter_error', { message: msg });
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    // 6. Extract JSON
    const jsonStr = extractJSON(rawResponse);
    let aiData: unknown;
    try {
      aiData = JSON.parse(jsonStr);
    } catch {
      log.error('ocr_json_parse_error');
      return NextResponse.json({ error: 'AI returned malformed response. Please try again.' }, { status: 502 });
    }

    // 7. Validate output
    const validated = OCROutputSchema.safeParse(aiData);
    if (!validated.success) {
      log.error('ocr_bad_ai_shape', { errors: validated.error.flatten() });
      return NextResponse.json({ error: 'AI response validation failed. Please try again.' }, { status: 502 });
    }

    log.info('ocr_success', { refCount: validated.data.legalReferences.length });
    return NextResponse.json(validated.data);

  } catch (err) {
    log.error('ocr_unexpected', { message: (err as Error).message });
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
