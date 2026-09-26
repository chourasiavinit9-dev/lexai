
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const CLAUDE_MODEL = 'anthropic/claude-opus-4-5';
const SITE_URL = 'https://lawjourney.ai';
const SITE_NAME = 'LawJourney AI';

function requireOpenRouterKey(): string {
  const key = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;
  if (!key?.trim()) {
    throw new Error(
      'OPENROUTER_API_KEY is not configured. Set it in .env.local.'
    );
  }
  return key;
}

export interface OpenRouterMessage {
  readonly role: 'user' | 'assistant' | 'system';
  readonly content: string | OpenRouterContentPart[];
}

export interface OpenRouterContentPart {
  readonly type: 'text' | 'image_url';
  readonly text?: string;
  readonly image_url?: { readonly url: string };
}

interface OpenRouterChoice {
  message: { content: string };
}
interface OpenRouterResponse {
  choices: OpenRouterChoice[];
}

/** Core OpenRouter call — server-side only */
export async function callOpenRouter(
  messages: OpenRouterMessage[],
  opts: { maxTokens?: number; temperature?: number; jsonMode?: boolean } = {}
): Promise<string> {
  const apiKey = requireOpenRouterKey();

  const body: Record<string, unknown> = {
    model: CLAUDE_MODEL,
    messages,
    max_tokens: opts.maxTokens ?? 4096,
    temperature: opts.temperature ?? 0.15,
  };
  if (opts.jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': SITE_URL,
      'X-Title': SITE_NAME,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    // Do not read res.text() — raw error body may contain sensitive details
    throw new Error(`OpenRouter error ${res.status}. Please try again.`);
  }

  const data = (await res.json()) as OpenRouterResponse;
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from AI model.');
  return content;
}

/** Extract JSON from a response that may be wrapped in markdown fences */
export function extractJSON(raw: string): string {
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch?.[1]) return fenceMatch[1].trim();
  const braceStart = raw.indexOf('{');
  const braceEnd   = raw.lastIndexOf('}');
  if (braceStart !== -1 && braceEnd > braceStart) {
    return raw.slice(braceStart, braceEnd + 1);
  }
  return raw.trim();
}
