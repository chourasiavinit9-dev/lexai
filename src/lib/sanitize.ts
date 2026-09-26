/**
 * sanitize.ts — Input sanitization and security utilities
 *
 * Prevents:
 * - XSS via HTML injection
 * - Prompt injection attacks (malicious instructions in document text)
 * - Excessively long inputs that could cause DoS
 * - Control character injection
 */

/** Strip HTML tags to prevent XSS when reflecting user input */
export function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')           // remove HTML tags
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'");
}

/** Remove control characters and null bytes */
export function removeControlChars(input: string): string {
  // eslint-disable-next-line no-control-regex
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/** Truncate to a maximum character length */
export function truncate(input: string, maxLen: number): string {
  return input.length > maxLen ? input.slice(0, maxLen) : input;
}

/**
 * Detect potential prompt injection attempts.
 * Returns true if suspicious content is found.
 *
 * Prompt injection patterns that could hijack the AI:
 * - "Ignore previous instructions"
 * - "You are now..."
 * - "SYSTEM:", "### SYSTEM"
 * - Base64-encoded instructions
 */
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions?/i,
  /you\s+are\s+now\s+(a|an|the)\s+/i,
  /\[?system\]?:/i,
  /###\s*system/i,
  /act\s+as\s+(a|an|the)\s+/i,
  /forget\s+(all\s+)?(previous|prior|your)\s+/i,
  /jailbreak/i,
  /dan\s+mode/i,
  /override\s+(all\s+)?safety/i,
  /pretend\s+(you\s+are|to\s+be)/i,
];

export function detectPromptInjection(input: string): boolean {
  return INJECTION_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Sanitize user-provided document text before sending to AI.
 * - Strips control chars
 * - Truncates to max length
 * - Warns on potential injection (does NOT block — the AI system prompts
 *   already guard against this, but we flag it for logging)
 */
export function sanitizeDocumentText(text: string, maxLen = 50_000): {
  sanitized: string;
  wasTruncated: boolean;
  injectionSuspected: boolean;
} {
  const cleaned = removeControlChars(text);
  const truncated = truncate(cleaned, maxLen);
  const injectionSuspected = detectPromptInjection(text);

  return {
    sanitized: truncated,
    wasTruncated: cleaned.length > maxLen,
    injectionSuspected,
  };
}

/** Sanitize a short text input (clause, question, etc.) */
export function sanitizeShortText(text: string, maxLen = 2000): string {
  return truncate(removeControlChars(stripHtml(text)), maxLen).trim();
}

/**
 * Rate limiting utility — in-memory, per-session.
 * For a static SPA this is client-side only; for real rate limiting
 * add Firebase App Check + Cloud Functions.
 */
class RateLimiter {
  private readonly calls: number[] = [];
  constructor(
    private readonly maxCalls: number,
    private readonly windowMs: number,
  ) {}

  check(): boolean {
    const now = Date.now();
    // Remove calls outside the window
    while (this.calls.length > 0 && this.calls[0] < now - this.windowMs) {
      this.calls.shift();
    }
    if (this.calls.length >= this.maxCalls) return false;
    this.calls.push(now);
    return true;
  }

  remaining(): number {
    const now = Date.now();
    const active = this.calls.filter(t => t >= now - this.windowMs);
    return Math.max(0, this.maxCalls - active.length);
  }
}

/** 10 AI requests per minute per session */
export const aiRateLimiter = new RateLimiter(10, 60_000);

/** Check rate limit before an AI call, throws if exceeded */
export function checkRateLimit(): void {
  if (!aiRateLimiter.check()) {
    throw new Error(
      `Rate limit reached — you can make ${aiRateLimiter.remaining()} more requests per minute. ` +
      `Please wait a moment before trying again.`
    );
  }
}
