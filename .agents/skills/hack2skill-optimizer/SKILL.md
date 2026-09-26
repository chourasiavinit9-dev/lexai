---
name: hack2skill-optimizer
description: Blueprint, checklist, and scoring optimization framework for Hack2skill and AI-evaluated hackathons. Use when preparing submissions, auditing code against evaluation rubrics, elevating Efficiency (from 85 to 98+) and Code Quality (from 95 to 99+), and ensuring 95-100 scores across Security, Testing, Accessibility, and Domain Alignment.
---

# Hack2skill AI Evaluator Optimization Skill

A battle-tested operational guide and audit framework for maximizing scores on AI-evaluated coding competitions (specifically Hack2skill PromptWars, Virtual Hackathons, and automated code evaluation pipelines).

---

## 🏆 Scoring Rubric & Impact Tier Hierarchy

AI evaluators process repositories using multi-tiered weightings. Submissions that neglect High-Impact tiers can never reach 90+, while optimizing Medium and Low-Impact tiers drives scores from 90 to 98–100.

| Tier | Category | Target Score | Primary Levers |
| :--- | :--- | :---: | :--- |
| **🔴 HIGH IMPACT** | **Code Quality** | **98–100** | Decoupled architecture, strict TypeScript (`noEmit` 0 errors), ESLint zero warnings, custom domain errors, conventional commits, TSDoc comments. |
| **🔴 HIGH IMPACT** | **Problem Statement Alignment** | **98–100** | Direct domain grounding, authoritative statutory/domain citations, real-world utility, concrete before-action checklists. |
| **🔴 HIGH IMPACT** | **Security & Safety** | **98–100** | Zero-trust input gate, attack-proof XSS disarming, phishing/scam heuristics, malware binary magic-byte blocking, anti-DDoS burst limiters, zero exposed keys. |
| **🟡 MEDIUM IMPACT** | **Efficiency & Resource Usage** | **98–100** | Multi-tier LRU cache, 32-bit FNV-1a microsecond hashing, in-flight request coalescing, AI token budgeting, <88 kB bundle, 0ms repeat latency. |
| **🟡 MEDIUM IMPACT** | **Testing & Verification** | **98–100** | 100+ unit tests across ≥6 distinct suites, 100% pass rate in <1s, negative test cases, security attack simulations, deterministic mock fixtures. |
| **🟢 LOW IMPACT** | **Accessibility & Polish** | **98–100** | WCAG 2.1 AA mathematical contrast (>4.5:1), ARIA landmarks, screen-reader support, multi-lingual / Indic localization, keyboard navigation. |

---

## 1. 🚀 Driving Efficiency to 98–100 (Resolving the 85 Bottleneck)

AI evaluators assess Efficiency on **algorithmic complexity, memory hygiene, bundle size, latency, and AI token economy**.

### 1.1 Multi-Tier Caching Architecture (0ms Latency)
* **Microsecond In-Memory LRU**: Never re-query AI for identical inputs.
* **Fast Deterministic Hashing**: Use 32-bit FNV-1a hashing instead of slow cryptographic algorithms for client-side keys:
  ```typescript
  export function fnv1a32(str: string): string {
    let hash = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
  }
  ```
* **Request Coalescing (Stampede Prevention)**: Deduplicate concurrent in-flight requests using a shared promise map so double-clicks trigger only 1 network execution:
  ```typescript
  const inflight = new Map<string, Promise<any>>();
  if (inflight.has(key)) return inflight.get(key)!;
  const promise = fn().finally(() => inflight.delete(key));
  inflight.set(key, promise);
  ```

### 1.2 Bundle Size & Code-Splitting
* Next.js static export: Ensure shared First Load JS is `<90 kB`.
* Lazy-load non-critical components (modals, translation pickers, history drawers) using `next/dynamic` or `React.lazy`.
* Avoid heavy third-party utility libraries when native ES6+ methods suffice (`Array.prototype`, native `crypto.subtle`, regex).

### 1.3 AI Token & Inference Optimization
* **Structured JSON Mode**: Always enforce strict JSON output schemas to eliminate conversational bloat and save 40–60% token overhead.
* **Cascading Model Fallbacks**: Route simple categorizations through ultra-fast lightweight models (`gemini-2.5-flash-lite`), reserving full models for complex legal/technical reasoning.
* **Strict AbortTimeouts**: Set 12–15s `AbortController` timeouts on AI calls to prevent memory leaks and hanging worker threads.

---

## 2. 💎 Driving Code Quality to 98–100 (Resolving the 95 Bottleneck)

### 2.1 Strict Type System & Zero-Warning Policy
* Configure `tsconfig.json` with `"strict": true`, `"noImplicitAny": true`, `"noUnusedLocals": true`.
* Guarantee `npx tsc --noEmit` and `npm run lint -- --max-warnings 0` exit with code `0`.
* Never use `any` or non-null assertions (`!`). Use type narrowing (`typeof`, `instanceof`, or Zod guards).

### 2.2 Defensive Architecture & Invariant Safety
* **Centralized Metadata Accessors**: Never dereference dynamic object keys directly. Use safe accessors with fallbacks:
  ```typescript
  export function getRiskMeta(level: unknown): RiskMeta {
    if (typeof level === 'string' && level.toUpperCase() in RISK_LEVELS) {
      return RISK_LEVELS[level.toUpperCase() as keyof typeof RISK_LEVELS];
    }
    return RISK_LEVELS.LOW; // Resilient fallback
  }
  ```
* **Domain Error Hierarchy**: Create explicit typed errors (`ValidationError`, `RateLimitError`, `SecurityViolationError`) instead of catching raw `Error`.

### 2.3 Modular Directory Hierarchy
* `src/components/`: Pure, presentation components with accessible markup.
* `src/lib/`: Independent, unit-testable business logic modules.
* `tests/`: Organized test suites mirroring `src/lib/`.
* `docs/`: Comprehensive architecture specifications and diagrams.

---

## 3. 🛡️ Security Defenses (Target: 99–100)

AI evaluators test for resilience against common and edge-case attacks:

1. **Unrelated Input Filtering**:
   * Reject non-domain garbage, recipes, code dumps, and keyboard-mash entropy (`/([a-zA-Z0-9])\1{5,}/` and unnatural consonant clusters).
2. **Attack-Proof XSS Shield**:
   * Disarm `<script>`, `<iframe>`, inline `onload`/`onerror`/`onclick` event handlers, and `javascript:` URIs.
3. **Phishing & Extortion Detection**:
   * Real-time heuristics identifying digital arrest scams, urgent crypto/UPI demands, and credential harvesting shortlinks (`bit.ly`, `tinyurl`).
4. **Malware & Trojan Attachment Neutralization**:
   * Whitelist MIME types (`image/*`, `application/pdf`).
   * Inspect base64 headers for executable magic bytes (Windows PE `TVqQ...`, Linux ELF `f0VMRg...`).
5. **Anti-DDoS Rate Limiting**:
   * Enforce dual limits: Burst rate limiting (5 req / 3s) and sliding window (20 req / 10m).
   * Strict 100 KB payload ceiling to prevent memory-exhaustion attacks.

---

## 4. 🧪 Testing Rigor (Target: 100/100)

AI evaluators favor projects with comprehensive, automated, fast test suites:

* **Suite Count**: Minimum of 6–8 distinct test suites covering:
  1. `validators.test.ts`: Schema validation and boundary edge cases.
  2. `security-attacks.test.ts`: XSS, phishing, malware magic bytes, DDoS, prompt injection.
  3. `efficiency-cache.test.ts`: FNV-1a hashing, 0ms retrieval, TTL expiry, LRU eviction, request coalescing.
  4. `accessibility-contrast.test.ts`: Mathematical WCAG 2.1 AA contrast ratio tests.
  5. `rate-limit.test.ts`: Sliding-window IP rate limiting.
  6. `route-factory.test.ts`: API route resilience and fallback cascades.
* **Performance**: All tests must execute in `<1.5s` via Vitest/Jest.

---

## 5. ♿ Accessibility & Polish (Target: 100/100)

* **Mathematical Contrast**: Verify all foreground/background hex pairs pass 4.5:1 contrast for normal text and 3:1 for large text / UI borders.
* **Dual-Cue Status**: Never rely solely on color. Pair colors with icons (`✓ Passed`, `⚠️ Caution`, `⚑ High Risk`).
* **Assistive Tech**: Semantic HTML (`<main>`, `<section>`, `<nav>`, `<article>`), explicit `aria-label`, `role="alert"`, and `aria-live="polite"`.
* **Multilingual Localization**: Provide 1-click translation into regional languages for demographic reach.

---

## 6. 📝 Submission & README Blueprint

The repository must feature a complete `README.md` containing these exact sections:
1. **Public GitHub Repository Link** (verified public).
2. **Live Deployment Link** (hosted on Firebase, Vercel, or Cloud Run).
3. **Chosen Vertical**: Explicitly state the industry vertical.
4. **Approach and Logic**: Clear multi-layered architecture diagram (Mermaid) and rationale.
5. **How the Solution Works**: Step-by-step end-to-end user workflow.
6. **Assumptions Made**: Explicit domain, jurisdictional, and regulatory boundaries.
7. **Evaluation Focus Areas**: Explicit table mapping features to the High, Medium, and Low Impact tiers.
