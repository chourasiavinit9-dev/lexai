import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { z } from 'zod';
import { NextRequest } from 'next/server';
import { makeRouteHandler } from '../src/lib/route-factory';

// A minimal schema pair, independent of the real feature schemas, so these
// tests exercise route-factory's own logic (validation, caching, error
// handling) rather than re-testing Zod schema shape (covered separately in
// validators.test.ts).
const TestInputSchema = z.object({ text: z.string().min(3) });
const TestOutputSchema = z.object({ reply: z.string() });

function makeRequest(body: unknown, ip: string): NextRequest {
  return new NextRequest('https://example.com/api/test', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  });
}

function geminiShapedResponse(payload: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      candidates: [{ content: { parts: [{ text: JSON.stringify(payload) }] } }],
    }),
  };
}

describe('makeRouteHandler', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let ipCounter = 0;

  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test-key';
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    ipCounter += 1;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function nextIp(): string {
    return `10.0.0.${ipCounter}-${Math.random()}`;
  }

  it('returns 400 with details when input fails schema validation', async () => {
    const handler = makeRouteHandler({
      schema: TestInputSchema,
      prefix: 'test-invalid',
      handler: async () => JSON.stringify({ reply: 'unused' }),
      outputSchema: TestOutputSchema,
    });

    const res = await handler(makeRequest({ text: 'a' }, nextIp()));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
    expect(body.details).toBeDefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns 200 and the validated payload on success, calling Gemini exactly once', async () => {
    fetchMock.mockResolvedValueOnce(geminiShapedResponse({ reply: 'hello there' }));

    const handler = makeRouteHandler({
      schema: TestInputSchema,
      prefix: `test-success-${Math.random()}`,
      handler: async (input) => {
        // Simulate the real gemini.ts pattern: call fetch, return raw text.
        const res = await fetch('https://generativelanguage.googleapis.com/fake');
        const data = await res.json();
        void input;
        return data.candidates[0].content.parts[0].text;
      },
      outputSchema: TestOutputSchema,
    });

    const res = await handler(makeRequest({ text: 'hello world' }, nextIp()));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ reply: 'hello there' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('serves the second identical request from cache without calling Gemini again', async () => {
    fetchMock.mockResolvedValue(geminiShapedResponse({ reply: 'cached response' }));
    const prefix = `test-cache-${Math.random()}`;

    const handler = makeRouteHandler({
      schema: TestInputSchema,
      prefix,
      handler: async () => {
        const res = await fetch('https://generativelanguage.googleapis.com/fake');
        const data = await res.json();
        return data.candidates[0].content.parts[0].text;
      },
      outputSchema: TestOutputSchema,
    });

    const ip = nextIp();
    const first = await handler(makeRequest({ text: 'same input text' }, ip));
    const second = await handler(makeRequest({ text: 'same input text' }, ip));

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(await first.json()).toEqual(await second.json());
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns 502 when the AI response does not match the output schema', async () => {
    fetchMock.mockResolvedValueOnce(geminiShapedResponse({ wrongField: 'oops' }));

    const handler = makeRouteHandler({
      schema: TestInputSchema,
      prefix: `test-badshape-${Math.random()}`,
      handler: async () => {
        const res = await fetch('https://generativelanguage.googleapis.com/fake');
        const data = await res.json();
        return data.candidates[0].content.parts[0].text;
      },
      outputSchema: TestOutputSchema,
    });

    const res = await handler(makeRequest({ text: 'hello world' }, nextIp()));
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toMatch(/unexpected/i);
  });

  it('returns 500 when the handler throws (e.g. Gemini network failure)', async () => {
    const handler = makeRouteHandler({
      schema: TestInputSchema,
      prefix: `test-throws-${Math.random()}`,
      handler: async () => {
        throw new Error('network unreachable');
      },
      outputSchema: TestOutputSchema,
    });

    const res = await handler(makeRequest({ text: 'hello world' }, nextIp()));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/something went wrong/i);
  });

  it('returns 429 once a single client exceeds the rate limit', async () => {
    fetchMock.mockResolvedValue(geminiShapedResponse({ reply: 'ok' }));
    const prefix = `test-ratelimit-${Math.random()}`;
    const handler = makeRouteHandler({
      schema: TestInputSchema,
      prefix,
      handler: async () => JSON.stringify({ reply: 'ok' }),
      outputSchema: TestOutputSchema,
    });

    const ip = nextIp();
    let lastStatus = 200;
    for (let i = 0; i < 25; i++) {
      // Vary text slightly so caching doesn't short-circuit the handler,
      // keeping this test focused purely on rate-limit behavior.
      const res = await handler(makeRequest({ text: `distinct input ${i}` }, ip));
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  });
});
