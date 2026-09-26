/**
 * sanitize.ts — Enterprise-Grade Input Sanitization & Threat Protection
 *
 * Provides defense-in-depth against:
 * 1. XSS Attacks (DOM-based, reflected, stored, SVG injection, event handlers, javascript URIs)
 * 2. Unrelated Text & Garbage / Spam (detects recipes, code dumps, keyboard mashes, non-legal spam)
 * 3. Phishing & Digital Arrest Scams (detects fake court notices, credential theft, crypto/UPI extortion)
 * 4. Malware & Trojan Attachment Detection (magic bytes, executable extensions, malicious SVG payloads)
 * 5. DDoS & Request Burst Flooding (dual-window rate limiting & payload size constraints)
 * 6. Prompt Injection & AI Sandboxing
 */

// ─── 1. XSS & HTML SANITIZATION ────────────────────────────────

/** Strip HTML tags and entities to neutralize XSS vectors */
export function stripHtml(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // remove script tags & body
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')   // remove style tags & body
    .replace(/<[^>]*>/g, '')                                          // remove all other HTML tags
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;/gi, "'")
    .replace(/&#39;/gi, "'");
}

/** Comprehensive XSS sanitizer neutralizing dangerous URIs and event handlers */
export function sanitizeXSS(input: string): string {
  let cleaned = stripHtml(input);

  // Remove dangerous URI schemes
  cleaned = cleaned.replace(/(javascript|vbscript|data|file):/gi, '$1_blocked:');

  // Remove any inline event handler leftovers (e.g. onload=, onerror=, onclick=)
  cleaned = cleaned.replace(/\bon\w+\s*=/gi, 'blocked_attr=');

  return cleaned;
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

// ─── 2. UNRELATED TEXT & GIBBERISH DETECTION ──────────────────

/** Legal terminology and contractual markers common in Indian documents */
const LEGAL_MARKERS = [
  'agreement', 'contract', 'clause', 'party', 'parties', 'terms', 'conditions',
  'shall', 'hereby', 'hereto', 'wherein', 'whereas', 'liability', 'indemnify',
  'termination', 'terminate', 'jurisdiction', 'governing law', 'dispute', 'arbitration',
  'tenant', 'landlord', 'lessor', 'lessee', 'employer', 'employee', 'contractor',
  'confidential', 'non-disclosure', 'payment', 'rent', 'salary', 'notice period',
  'act', 'section', 'article', 'statute', 'court', 'advocate', 'stamp paper',
  'affidavit', 'memorandum', 'deed', 'witness', 'signed', 'effective date',
  'obligations', 'rights', 'breach', 'remedy', 'damages', 'severability',
  'bns', 'bnss', 'bsa', 'constitution', 'indian contract act',
];

/**
 * Validates whether the text appears to be an actual legal or contractual document.
 * Protects AI budget from random code dumps, cooking recipes, poems, or gibberish.
 */
export function validateLegalRelevance(text: string): {
  isLegal: boolean;
  score: number;
  reason?: string;
} {
  const clean = text.toLowerCase().trim();

  // 1. Minimum character length check
  if (clean.length < 50) {
    return {
      isLegal: false,
      score: 0,
      reason: 'Input is too brief to represent a legal document (minimum 50 characters required).',
    };
  }

  // 2. High entropy / keyboard smash detection (e.g. "asdfghjklasdfghjkl", "aaaaaa", "128371982739")
  if (/([a-zA-Z0-9])\1{5,}/.test(clean)) {
    return {
      isLegal: false,
      score: 0,
      reason: 'Input appears to be repetitive keyboard-mash or corrupt text.',
    };
  }

  const lettersOnly = clean.replace(/[^a-z]/g, '');
  const uniqueLetters = new Set(lettersOnly).size;
  if (lettersOnly.length > 35 && uniqueLetters < 8) {
    return {
      isLegal: false,
      score: 0,
      reason: 'Input appears to be repetitive keyboard-mash or corrupt text.',
    };
  }

  // Check for 8+ consecutive consonants without a vowel (keyboard smash like "sdfghjkl")
  if (/[bcdfghjklmnpqrstvwxyz]{8,}/i.test(clean)) {
    return {
      isLegal: false,
      score: 0,
      reason: 'Input appears to be repetitive keyboard-mash or corrupt text.',
    };
  }

  // Check vowel-to-consonant distribution for human language
  if (lettersOnly.length > 50) {
    const vowels = (lettersOnly.match(/[aeiou]/g) || []).length;
    const vowelRatio = vowels / lettersOnly.length;
    if (vowelRatio < 0.10 || vowelRatio > 0.70) {
      return {
        isLegal: false,
        score: 0,
        reason: 'Input does not resemble standard human legal text (atypical character distribution).',
      };
    }
  }

  // 3. Count legal marker matches
  let markerHits = 0;
  for (const marker of LEGAL_MARKERS) {
    if (clean.includes(marker)) {
      markerHits++;
    }
  }

  // Normalize score between 0 and 1
  const score = Math.min(1, markerHits / 3);

  // If text is over 200 chars and contains ZERO legal concepts, flag as unrelated
  if (clean.length >= 200 && markerHits === 0) {
    return {
      isLegal: false,
      score: 0,
      reason: 'The provided text does not appear to contain standard contractual, legal, or statutory provisions.',
    };
  }

  return { isLegal: true, score };
}

// ─── 3. PHISHING & SCAM CONTRACT DETECTION ────────────────────

export interface PhishingCheckResult {
  isSuspicious: boolean;
  warnings: string[];
}

/** Detects indicators of online legal scams, "Digital Arrest" extortion, and credential theft */
export function detectPhishingAndScams(text: string): PhishingCheckResult {
  const clean = text.toLowerCase();
  const warnings: string[] = [];

  // "Digital Arrest" & Fake Law Enforcement Extortion (Common in India)
  if (
    (clean.includes('digital arrest') || clean.includes('immediate arrest') || clean.includes('arrest warrant')) &&
    (clean.includes('transfer money') || clean.includes('transfer funds') || clean.includes('pay fine immediately') || clean.includes('security deposit'))
  ) {
    warnings.push('CRITICAL SCAM WARNING: This document exhibits signs of a "Digital Arrest" extortion scam. Law enforcement and courts in India NEVER conduct digital arrests or demand money transfers over video calls.');
  }

  // Demands for payment to personal UPI or Cryptocurrency
  if (
    (clean.includes('supreme court') || clean.includes('high court') || clean.includes('cbi') || clean.includes('police') || clean.includes('rbi')) &&
    (clean.includes('usdt') || clean.includes('bitcoin') || clean.includes('crypto wallet') || clean.includes('@paytm') || clean.includes('@upi') || clean.includes('@ybl'))
  ) {
    warnings.push('FRAUD ALERT: Authentic Indian courts and government authorities do not accept fines or legal settlements via personal UPI IDs or Cryptocurrency.');
  }

  // Credential & Banking PIN Theft
  if (
    clean.includes('net banking password') ||
    clean.includes('atm pin') ||
    clean.includes('cvv') ||
    clean.includes('share your otp') ||
    clean.includes('enter your otp')
  ) {
    warnings.push('SECURITY ALERT: This document solicits confidential banking credentials (PIN, CVV, or OTP). Legitimate contracts never require payment passwords.');
  }

  // Suspicious Shortlinks in Legal Notices
  if (
    clean.includes('bit.ly/') ||
    clean.includes('tinyurl.com/') ||
    clean.includes('t.co/') ||
    clean.includes('is.gd/')
  ) {
    warnings.push('CAUTION: Document contains obfuscated short-URLs (e.g. bit.ly/tinyurl). Legitimate legal notices should reference verifiable official domains (.gov.in or registered company domains).');
  }

  return {
    isSuspicious: warnings.length > 0,
    warnings,
  };
}

// ─── 4. MALWARE & TROJAN ATTACHMENT PROTECTION ───────────────

const DANGEROUS_EXTENSIONS = new Set([
  'exe', 'dll', 'bat', 'cmd', 'sh', 'vbs', 'vbe', 'js', 'jse', 'wsf', 'wsh',
  'scr', 'msi', 'com', 'pif', 'hta', 'cpl', 'jar', 'ps1', 'ps2', 'reg',
]);

const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/heic',
  'application/pdf',
]);

/**
 * Validates uploaded files and base64 strings against malware, trojans, and executable wrappers.
 */
export function validateFilePayload(
  fileName: string,
  mimeType: string,
  base64Data?: string
): { isValid: boolean; error?: string } {
  // 1. Check file extension
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (DANGEROUS_EXTENSIONS.has(ext)) {
    return {
      isValid: false,
      error: `Security Violation: Executable file types (.${ext}) are strictly disallowed to prevent Trojan and malware execution.`,
    };
  }

  // 2. Strict MIME type whitelist
  if (mimeType && !ALLOWED_MIME_TYPES.has(mimeType.toLowerCase())) {
    return {
      isValid: false,
      error: `Invalid file type (${mimeType}). Only legal document images (PNG, JPEG, WebP) and PDFs are permitted.`,
    };
  }

  // 3. Inspect base64 payload & Magic Header bytes
  if (base64Data) {
    const rawHead = base64Data.slice(0, 30);

    // Windows Executable Header "MZ" in base64: "TVqQ" or "TVoA"
    if (rawHead.startsWith('TVqQ') || rawHead.startsWith('TVoA')) {
      return {
        isValid: false,
        error: 'Security Alert: Embedded Windows executable signature (PE/MZ) detected in payload.',
      };
    }

    // Linux ELF binary header "\x7fELF" in base64: "f0VMRg"
    if (rawHead.startsWith('f0VMRg')) {
      return {
        isValid: false,
        error: 'Security Alert: Embedded Linux ELF executable signature detected in payload.',
      };
    }

    // SVG with script payload check (SVG Trojan carrier)
    if (mimeType.includes('svg') || fileName.endsWith('.svg')) {
      let decoded = '';
      try {
        decoded = atob(base64Data.slice(0, 5000));
      } catch {
        decoded = '';
      }
      if (/<script\b/i.test(decoded) || /onload\s*=/i.test(decoded) || /<foreignObject\b/i.test(decoded)) {
        return {
          isValid: false,
          error: 'Security Alert: Malicious script tags detected inside SVG document vector.',
        };
      }
    }
  }

  return { isValid: true };
}

// ─── 5. PROMPT INJECTION DEFENSE ──────────────────────────────

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
  /bypass\s+(all\s+)?guidelines/i,
];

export function detectPromptInjection(input: string): boolean {
  return INJECTION_PATTERNS.some(pattern => pattern.test(input));
}

// ─── 6. DOCUMENT SANITIZER & COMBINED DEFENSE ─────────────────

export function sanitizeDocumentText(text: string, maxLen = 50_000): {
  sanitized: string;
  wasTruncated: boolean;
  injectionSuspected: boolean;
  phishingAlerts: string[];
} {
  const cleaned = removeControlChars(sanitizeXSS(text));
  const truncated = truncate(cleaned, maxLen);
  const injectionSuspected = detectPromptInjection(text);
  const phishing = detectPhishingAndScams(text);

  return {
    sanitized: truncated,
    wasTruncated: cleaned.length > maxLen,
    injectionSuspected,
    phishingAlerts: phishing.warnings,
  };
}

export function sanitizeShortText(text: string, maxLen = 2000): string {
  return truncate(removeControlChars(sanitizeXSS(text)), maxLen).trim();
}

// ─── 7. ANTI-DDOS & BURST RATE LIMITER ────────────────────────

export class AntiDdosRateLimiter {
  private readonly calls: number[] = [];
  private readonly burstCalls: number[] = [];

  constructor(
    private readonly maxCalls = 20,
    private readonly windowMs = 10 * 60 * 1000, // 20 requests per 10 minutes
    private readonly burstMax = 5,
    private readonly burstWindowMs = 3000       // max 5 requests per 3 seconds
  ) {}

  /**
   * Check rate limits with dual burst and sliding-window protection.
   * Throws explicit error on DDoS flooding.
   */
  check(payloadSizeBytes = 0): { allowed: boolean; error?: string } {
    const now = Date.now();

    // 1. Payload size constraint (Max 100 KB text to mitigate memory exhaustion DDoS)
    if (payloadSizeBytes > 100 * 1024) {
      return {
        allowed: false,
        error: 'Payload size exceeds 100 KB limit. Please reduce document size to mitigate DoS.',
      };
    }

    // 2. Burst flood protection (mitigates rapid script automated attacks)
    while (this.burstCalls.length > 0 && this.burstCalls[0] < now - this.burstWindowMs) {
      this.burstCalls.shift();
    }
    if (this.burstCalls.length >= this.burstMax) {
      return {
        allowed: false,
        error: 'DDoS Burst Protection: Too many rapid requests. Please wait 3 seconds before retrying.',
      };
    }

    // 3. Sliding window limit
    while (this.calls.length > 0 && this.calls[0] < now - this.windowMs) {
      this.calls.shift();
    }
    if (this.calls.length >= this.maxCalls) {
      return {
        allowed: false,
        error: `Rate limit reached (max ${this.maxCalls} requests per 10 minutes). Please wait before retrying.`,
      };
    }

    this.burstCalls.push(now);
    this.calls.push(now);
    return { allowed: true };
  }

  remaining(): number {
    const now = Date.now();
    const active = this.calls.filter(t => t >= now - this.windowMs);
    return Math.max(0, this.maxCalls - active.length);
  }

  reset(): void {
    this.calls.length = 0;
    this.burstCalls.length = 0;
  }
}

/** Global anti-DDoS rate limiter */
export const antiDdosLimiter = new AntiDdosRateLimiter();

/** Check rate limit helper */
export function checkRateLimit(payloadSize = 0): void {
  const result = antiDdosLimiter.check(payloadSize);
  if (!result.allowed) {
    throw new Error(result.error);
  }
}
