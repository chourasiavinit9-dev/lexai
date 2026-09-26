import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import type { ZodTypeAny, z } from 'zod';
import { hashInput, getCache, setCache } from './cache';
import { checkRateLimit, extractClientId, pruneStaleClients } from './rate-limit';
import { log } from './logger';
import { callWithFallback } from './ai-router';

// Status codes where we fall back to the AI router instead of surfacing an error
const RETRIABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

interface RouteOptions<TSchema extends ZodTypeAny, TOutSchema extends ZodTypeAny> {
  schema: TSchema;
  prefix: string;
  /** The primary handler — must return a raw JSON string from Gemini or similar */
  handler: (input: z.infer<TSchema>) => Promise<string>;
  /** Optional: a function that builds the full LLM prompt from the parsed input.
   *  When provided, the router can re-run the prompt via callWithFallback on failure. */
  buildPrompt?: (input: z.infer<TSchema>) => string;
  outputSchema: TOutSchema;
}

function rateLimitResponse(retryAfterMs: number): NextResponse {
  const retryAfterSec = Math.ceil(retryAfterMs / 1000);
  return NextResponse.json(
    { error: `Too many requests. Try again in ${retryAfterSec}s.` },
    { status: 429, headers: { 'Retry-After': String(retryAfterSec) } }
  );
}

interface ResolveResult<TOutput> {
  status: number;
  body: TOutput | { error: string; details?: unknown };
}

async function resolveOutput<TSchema extends ZodTypeAny, TOutSchema extends ZodTypeAny>(
  opts: RouteOptions<TSchema, TOutSchema>,
  parsedData: z.infer<TSchema>
): Promise<ResolveResult<z.infer<TOutSchema>>> {
  type TOutput = z.infer<TOutSchema>;
  const key = `${opts.prefix}:${hashInput(parsedData)}`;

  const cached = await getCache<TOutput>(key);
  if (cached) {
    log.info(`${opts.prefix}_cache_hit`);
    return { status: 200, body: cached };
  }

  let rawJson: string;

  // ── Primary: call the original handler (usually direct Gemini) ──
  try {
    rawJson = await opts.handler(parsedData);
  } catch (primaryErr) {
    const status = (primaryErr as Error & { status?: number }).status;
    const isRetriable = status ? RETRIABLE_STATUSES.has(status) : true; // network errors are also retriable

    log.warn(`${opts.prefix}_primary_failed`, {
      status,
      message: (primaryErr as Error).message,
      retriable: String(isRetriable),
    });

    if (!isRetriable) {
      // Auth errors, bad input etc — surface immediately
      return {
        status: status ?? 502,
        body: { error: `AI service error: ${(primaryErr as Error).message}` },
      };
    }

    // ── Fallback: re-route through ai-router (Gemini OR → Claude OR) ──
    if (opts.buildPrompt) {
      log.info(`${opts.prefix}_fallback_router`);
      try {
        rawJson = await callWithFallback(opts.buildPrompt(parsedData));
        log.info(`${opts.prefix}_fallback_success`);
      } catch (fallbackErr) {
        log.error(`${opts.prefix}_fallback_failed`, { message: (fallbackErr as Error).message });
        return {
          status: 503,
          body: { error: 'All AI providers are currently unavailable. Please try again shortly.' },
        };
      }
    } else {
      // No buildPrompt — surface the original error
      return {
        status: 502,
        body: { error: 'AI service is temporarily unavailable. Please try again.' },
      };
    }
  }

  const aiResult: unknown = JSON.parse(rawJson);
  const validated = opts.outputSchema.safeParse(aiResult);

  if (!validated.success) {
    log.error(`${opts.prefix}_bad_ai_shape`, { errors: validated.error.flatten() });
    return { status: 502, body: { error: 'Unexpected AI response. Please try again.' } };
  }

  await setCache(key, validated.data);
  log.info(`${opts.prefix}_success`);
  return { status: 200, body: validated.data };
}

export function makeRouteHandler<TSchema extends ZodTypeAny, TOutSchema extends ZodTypeAny>(
  opts: RouteOptions<TSchema, TOutSchema>
) {
  return async function POST(req: NextRequest): Promise<NextResponse> {
    const clientId = extractClientId(req);
    const rateLimit = checkRateLimit(clientId);
    if (!rateLimit.allowed) {
      log.warn(`${opts.prefix}_rate_limited`, { clientId });
      return rateLimitResponse(rateLimit.retryAfterMs);
    }
    pruneStaleClients();

    try {
      const body: unknown = await req.json();
      const parsed = opts.schema.safeParse(body);

      if (!parsed.success) {
        log.warn(`${opts.prefix}_invalid_input`, { errors: parsed.error.flatten() });
        return NextResponse.json(
          { error: 'Invalid input', details: parsed.error.flatten() },
          { status: 400 }
        );
      }

      const result = await resolveOutput(opts, parsed.data);
      return NextResponse.json(result.body, { status: result.status });
    } catch (err) {
      log.error(`${opts.prefix}_error`, { message: (err as Error).message });
      return NextResponse.json(
        { error: 'Something went wrong. Please try again.' },
        { status: 500 }
      );
    }
  };
}

