# LexAI — Indian Legal Information Made Accessible
> **Google Prompt Wars Submission — Legal AI Access Track**

[![Gemini](https://img.shields.io/badge/Gemini-2.0_Flash-blue?style=flat-square)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=flat-square)]()
[![WCAG](https://img.shields.io/badge/Accessibility-WCAG_2.2_AA-purple?style=flat-square)]()
[![Tests](https://img.shields.io/badge/Tests-82_Unit-green?style=flat-square)]()
[![Jurisdiction](https://img.shields.io/badge/Grounded_in-Indian_Law-orange?style=flat-square)]()

## Problem Statement

> *"Engineer GenAI solutions to simplify complex legal docs, compare contracts, or clarify clauses. Legal information can often be complex and difficult to navigate. Build a GenAI-powered solution that makes legal information and basic assistance accessible by helping users understand, compare, and navigate legal documents — summarising main points, surfacing any lapse or favorability to the other party, and flagging language that claims legal authority not present in any existing law."*

## Solution

LexAI is a free, accessible web app powered by Gemini 2.0 Flash that gives everyone — not just those who can afford a lawyer — the ability to understand their legal documents, grounded specifically in **Indian law**: the Constitution of India, the Indian Contract Act 1872, the Consumer Protection Act 2019, and related statutes.

## Five Core Features

| Feature | What it does |
|---|---|
| **📄 Understand** | Paste any legal doc → plain-English summary, key clauses with risk levels, **who each clause favors**, **legal-basis flags** citing specific Indian statutes, a **Constitutional Rights Check** against Articles 14/19/21, and a before-you-sign checklist |
| **💡 Clarify** | Paste just one clause or sentence → a focused explanation, who it favors and why, key points, potential risks, the same statute-grounded legal-basis flagging as Understand, and actionable advice. Pick a focus: Plain English, Risks, Obligations, or Negotiation Tips |
| **⚖️ Compare** | Two contracts side-by-side → differences table with advantage analysis grounded in Indian contract law, negotiation opportunities, and AI verdict |
| **🧭 Navigate** | Tell us your goal → step-by-step walkthrough, your rights and obligations (grounded in both the document and applicable Indian Acts), key dates, and a legal glossary |
| **💬 Chat** | Conversational Q&A on Indian legal topics, with optional document context and suggested follow-up questions |

## What Makes This Different: Real Legal Grounding

Most "explain my contract" tools give generic plain-English summaries. LexAI goes further —
it's built to catch the specific way people get deceived in contracts:

1. **Favorability analysis** — every clause is tagged `favors you`, `favors other party`, or
   `balanced`, with a plain-English reason. This surfaces one-sided terms that read as neutral
   boilerplate but aren't.

2. **Legal-basis flagging** — the AI scans for clauses that *claim* legal authority they don't
   actually have under Indian law: a non-compete that ignores Section 27 of the Contract Act
   (restraint of trade is void), a "waiver" of statutory rights that can't legally be waived, a
   penalty dressed up as liquidated damages (Section 74), or a citation to a vague/fabricated
   "Act" or "Section." Each flag names the **specific Act and Section** it's checked against.

3. **Constitutional Rights Check** — a dedicated pass that checks clauses against Part III of
   the Constitution of India (Article 14 equality, Article 19(1)(g) freedom of trade, Article 21
   personal liberty/dignity), flagging `none` / `potential_conflict` / `likely_conflict` with
   plain-English reasoning.

**Built-in honesty guardrail:** the AI is instructed to return an empty array rather than invent
a concern when nothing is genuinely questionable, and every legal/constitutional panel carries an
explicit disclaimer that this is AI-generated information for a licensed advocate to verify — not
a legal ruling.

## Architecture

```
Browser (Next.js 14, React 18)
    │
    ▼  POST /api/understand | /api/clarify | /api/compare | /api/navigate | /api/chat
    │
Route Handler (server-only)
    ├── Rate limit check (sliding window, per-IP)
    ├── Zod input validation
    ├── Cache check — Firestore if configured, else in-memory (SHA-256 keyed, 1hr TTL)
    └── Gemini 2.0 Flash (single call per action, grounded in Indian law)
            │
            ▼ JSON response
    ├── Zod output validation (incl. statute references, constitutional check)
    ├── Cache store — Firestore if configured, else in-memory
    └── NextResponse.json → Browser

Security: CSP headers · server-only · env-var secrets · fail-fast env validation ·
          rate limiting · no client writes to Firestore
```

## Google Services Used

**Actually implemented in code** (verify in `src/lib/`):

1. **Gemini 2.0 Flash** — `src/lib/gemini.ts`. Core AI engine for all 4 features, one
   call per request, grounded in a shared Indian-law prompt preamble.
2. **Google AI Studio** — where the `GEMINI_API_KEY` used above is issued.
3. **Cloud Firestore** — `src/lib/cache.ts`. Real `@google-cloud/firestore` SDK
   integration for persistent, multi-instance result caching. **Opt-in**: set
   `FIRESTORE_CACHE_ENABLED=true` and `GOOGLE_CLOUD_PROJECT` in your environment;
   otherwise the app runs correctly on a fast in-memory cache (the right default for
   local dev and single-instance demos). A failed Firestore read/write logs a warning
   and falls back to memory rather than failing the request. See `firestore.rules`
   for the security rules that block all client-side reads/writes.

**Recommended for a production deployment, not wired into this codebase**:

4. **Cloud Run** — the `Dockerfile` in this repo is written for it, but no deployment
   was performed as part of this submission.
5. **Cloud Logging** — `src/lib/logger.ts` emits structured JSON to stdout, which
   Cloud Run/Cloud Logging picks up automatically with zero extra code; no Cloud
   Logging SDK call is made directly.
6. **Secret Manager** — for production, `GEMINI_API_KEY` should move from a plain
   environment variable to Secret Manager; the code reads `process.env` either way,
   so this is a deployment-config change, not an application-code change.

## Setup

```bash
git clone https://github.com/yourusername/lexai
cd lexai
npm install
cp .env.example .env.local
# Add your GEMINI_API_KEY from https://aistudio.google.com/app/apikey
# (Optional) set FIRESTORE_CACHE_ENABLED=true + GOOGLE_CLOUD_PROJECT for persistent caching
npm run dev
# → http://localhost:3000
```

## Tests

```bash
npm test           # 82 Vitest unit tests across 5 suites
npm run lint       # ESLint — zero warnings
npm run type-check # TypeScript strict
npm run build      # Production build
```

Test breakdown:
- `validators.test.ts` (52) — every Zod input/output schema, valid and invalid cases,
  including the restored Clarify feature's schemas
- `route-factory.test.ts` (6) — the actual request lifecycle: 400 on bad input, 200 +
  single Gemini call on success, cache-hit skips the second Gemini call, 502 on
  malformed AI output, 500 on handler failure, 429 once rate-limited
- `rate-limit.test.ts` (8) — sliding-window limiter behavior, per-client isolation
- `cache.test.ts` (6) — hash stability, get/set/overwrite round-trips
- `accessibility-contrast.test.ts` (10) — real WCAG relative-luminance contrast math
  run against the actual hex values in `globals.css`, so a future color change that
  drops a token below 4.5:1 fails CI instead of shipping silently

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                  ← skip-to-content, semantic HTML, India badge
│   ├── page.tsx                    ← tab orchestration, 5 feature panels
│   ├── globals.css                 ← full design system (navy + gold), WCAG AA-verified tokens
│   └── api/
│       ├── understand/route.ts     ← POST /api/understand
│       ├── clarify/route.ts        ← POST /api/clarify
│       ├── compare/route.ts        ← POST /api/compare
│       ├── navigate/route.ts       ← POST /api/navigate
│       └── chat/route.ts           ← POST /api/chat
├── components/
│   ├── UnderstandPanel.tsx         ← form + submit logic only
│   ├── UnderstandResults.tsx       ← decomposed result subcomponents (clause cards, constitutional panel, legal flags)
│   ├── ClarifyPanel.tsx            ← form + submit logic only (single-clause focus)
│   ├── ClarifyResults.tsx          ← decomposed result subcomponents (interpretation, key points, legal flags)
│   ├── ComparePanel.tsx            ← form + submit logic only
│   ├── CompareResults.tsx          ← decomposed result subcomponents (verdict, diff rows, negotiation)
│   ├── NavigatePanel.tsx           ← form + submit logic only
│   ├── NavigateResults.tsx         ← decomposed result subcomponents (steps, rights, glossary)
│   └── ChatPanel.tsx                ← decomposed subcomponents (bubbles, starters, input row)
└── lib/
    ├── types.ts                    ← shared TypeScript interfaces (Clause, LegalConcern, ConstitutionalCheck…)
    ├── constants.ts                ← all magic values, risk/favorability/constitutional color metadata
    ├── validators.ts               ← all Zod schemas — single source of truth for input/output shapes
    ├── gemini.ts                   ← Gemini API client with INDIAN_LAW_GROUNDING preamble, one fn per feature
    ├── cache.ts                    ← Firestore-backed cache with in-memory fallback
    ├── env.ts                      ← fail-fast environment variable validation
    ├── rate-limit.ts               ← sliding-window per-IP rate limiter
    ├── logger.ts                   ← structured JSON logging
    └── route-factory.ts            ← shared route handler: rate limit → validate → cache → Gemini → validate → cache
tests/
├── validators.test.ts              ← 41 tests, all Zod schemas
├── route-factory.test.ts           ← 7 tests, real request lifecycle with mocked Gemini fetch
├── rate-limit.test.ts              ← 8 tests, limiter behavior
├── cache.test.ts                   ← 6 tests, cache round-trips
├── accessibility-contrast.test.ts  ← 10 tests, real WCAG contrast math on actual design tokens
└── __mocks__/server-only.ts        ← test stub for the server-only guard package
```

## Security

- **Rate limiting**: sliding-window limiter, 20 requests per 10 minutes per client IP,
  enforced in `route-factory.ts` before any Gemini call — protects the API budget from
  abuse on a public, unauthenticated demo. Returns `429` with a `Retry-After` header.
- **Fail-fast environment validation**: `env.ts` throws a clear error the moment
  `GEMINI_API_KEY` is missing, instead of surfacing as an opaque Gemini 401 mid-request.
- **Input validation**: every request body is parsed through a Zod schema before it
  touches any business logic; invalid input never reaches the Gemini call.
- **Output validation**: every Gemini response is parsed through a Zod schema before
  being returned to the client — a malformed or off-schema AI response returns a clean
  `502` rather than leaking raw, unvalidated model output.
- **`server-only`** guards every file in `src/lib/` that touches the API key or
  Firestore, so a client-side import mistake fails at build time, not silently at runtime.
- **CSP headers** (`next.config.mjs`): script/style/connect-src locked to same-origin
  plus the specific Google Fonts and Gemini API hosts needed; `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, HSTS.
- **Firestore security rules** (`firestore.rules`): blocks all client-side reads and
  writes — only the server-side Admin SDK path in `cache.ts` can touch the cache collection.

## Accessibility (WCAG 2.2 AA)

- Skip-to-content link is first focusable element
- `aria-live="polite"` on all AI result regions
- `role="alert"` on all error messages
- Full `role="tablist"` ARIA tab navigation  
- All form inputs have associated `<label>` elements
- 44px minimum touch targets on all buttons
- Focus rings always visible, `prefers-reduced-motion` respected
- Semantic HTML: `<main>`, `<header>`, `<footer>`, `<nav>`, `<section>`, `<article>`, `<dl>`
- **Color contrast verified by computation, not eyeballed** — every design token was run
  through the real WCAG relative-luminance formula (see `accessibility-contrast.test.ts`).
  This caught and fixed two real failures during development: `--stone-300` was 1.74:1 on
  white (severe fail, used for hint/label text) and `--stone-500` was 3.53:1 (fails normal-text
  AA); both were re-picked within the same hue family to clear 4.5:1 with margin. Two
  alpha-blended white-on-navy footer/metadata colors were also under 4.5:1 and adjusted.
- **Heading hierarchy**: Compare results previously jumped from `<h1>` straight to `<h3>`
  panel headings with no `<h2>` (the verdict was a styled `<p>`); fixed by promoting it to
  `<h2>`, matching the pattern already used in Understand and Navigate results.

## Legal Disclaimer

LexAI provides legal information grounded in Indian law, not legal advice. It is not a
substitute for a licensed advocate. For important legal decisions, always consult one.
