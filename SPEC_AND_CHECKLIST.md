# LexAI Specification & Phase Checklist

## 1. Product Requirements Document (PRD)

### 1.1 Problem Statement
Legal information is often complex and difficult to navigate. Most people cannot afford a lawyer to explain a contract, spot a one-sided clause, or check whether a clause they're being asked to sign actually holds up under real law. Build a GenAI-powered solution that makes legal information and basic assistance accessible by helping users understand, compare, and navigate legal documents — grounded in real, citable Indian law (the Constitution of India, Indian Contract Act 1872, Consumer Protection Act 2019, and related statutes), not generic disclaimers.

### 1.2 Goals
- **G1**: Any user can paste a legal document and get a plain-English breakdown in under 20s.
- **G2**: Surface which party a clause favors, not just what it says.
- **G3**: Flag clauses that claim legal authority they likely don't have, citing the specific Act/Section they conflict with.
- **G4**: Let a user compare two contracts/versions side by side with a clear verdict.
- **G5**: Let a user navigate a document toward a specific goal (e.g. "understand my termination rights") with a step-by-step guide.
- **G6**: Free-text legal Q&A grounded in the same statute base.
- **G7**: Meet WCAG 2.2 AA, not as a checkbox but verified by computed contrast ratios.
- **G8**: Ship with genuine automated test coverage of business logic, not just schema shape.

### 1.3 Non-Goals
- **NG1**: This is not a licensed-advocate replacement. No feature may imply a guaranteed legal outcome or file/submit anything on the user's behalf.
- **NG2**: No user accounts, no persistent user-owned document storage in v1.
- **NG3**: No jurisdictions other than India in v1.
- **NG4**: No PDF/DOCX upload parsing in v1 — plain-text paste only.

### 1.4 Target Users
- A tenant reviewing a rental agreement before signing.
- An employee reviewing an offer letter or termination notice.
- A freelancer comparing two client contract drafts.
- Anyone who wants a plain-English answer to a legal question without booking a consult.

### 1.5 Functional Requirements
- [x] **FR-1 Understand**: Paste doc → plain-English summary, document type, main points, key clauses (risk level, category, plain English, favorability + reason, actions), red flags, constitutional check (Articles 14/19(1)(g)/21), legal-basis flags with Indian statutes, before-you-sign checklist, overall risk, reading time. Configurable reading level & user role.
- [x] **FR-2 Compare**: Paste two docs + labels → differences table, shared terms, overall verdict, negotiation opportunities, user perspective bias.
- [x] **FR-3 Navigate**: Paste doc + goal → ordered navigation steps, key dates, key parties, rights & obligations, applicable Indian laws, legal glossary.
- [x] **FR-4 Chat**: Free-text legal Q&A with optional doc context, multi-turn history, up to 3 follow-ups, one-line advocate disclaimer.
- [x] **FR-5 Grounding**: Every legal/constitutional flag traceable to named Act/Section or omitted if uncertain. Never fabricate citations.
- [x] **FR-6 Single-Page Tabbed UI**: All features reachable from a tabbed interface, no reloads, mobile-responsive.

### 1.6 Non-Functional Requirements
- [x] **NFR-1 Security**: No secrets in client bundles; Zod validation on all inputs/outputs; sliding-window rate limiting; fail-fast config; CSP headers; locked Firestore rules.
- [x] **NFR-2 Accessibility**: WCAG 2.2 AA. Skip-to-content, keyboard navigable, aria-live, 44px touch targets, computed 4.5:1 / 3:1 contrast ratios verified by automated tests.
- [x] **NFR-3 Performance**: Single AI call per user action, caching identical requests.
- [x] **NFR-4 Reliability**: Malformed AI response degrades to clean 502 error.
- [x] **NFR-5 Code Quality**: TypeScript strict mode, zero `any`, functions under ~30 lines, centralized magic values, zero ESLint warnings.
- [x] **NFR-6 Testability**: Mockable boundaries, 82 unit tests.
- [x] **NFR-7 Honesty**: Clear separation of implemented code vs production recommendations in documentation.

---

## 2. Architecture & Data Flow

```
Browser (React tabs: Understand / Clarify / Compare / Navigate / Chat)
    │
    ▼ POST /api/{understand,clarify,compare,navigate,chat}
Route Handler (server-only)
    ├─ 1. Rate limit check (sliding window, per-client-IP) → 429 if exceeded
    ├─ 2. Zod input validation → 400 with details if invalid
    ├─ 3. Cache lookup (hash of validated input) → return cached JSON if hit
    ├─ 4. Single call to Gemini with a feature-specific, law-grounded prompt
    ├─ 5. Zod output validation on the AI's JSON → 502 if the shape doesn't match
    ├─ 6. Cache store
    └─ 7. Return validated JSON → 200
Firestore (optional persistent cache) ⟷ in-memory Map (fallback)
```

---

## 3. Implementation Phases & Gate Checklist

- [x] **PHASE 0 — Scaffold**
  - **Tasks**: Initialize Next.js 14 + TypeScript (strict) + Vitest. Set up folder layout (`src/app`, `src/components`, `src/lib`, `tests`). Add ESLint with zero-warning enforcement. Add `.env.example`.
  - **Gate**: `npm run type-check` and `npm run lint` both pass on scaffold.
  - **Status**: PASSED

- [x] **PHASE 1 — Contracts First: Types, Constants, Zod Schemas**
  - **Tasks**: Write `src/lib/types.ts`, `src/lib/constants.ts`, `src/lib/validators.ts`. Input & output schemas for all features.
  - **Gate**: Write `tests/validators.test.ts` (30+ test cases). `npm test` passes.
  - **Status**: PASSED (52 unit tests passed)

- [ ] **PHASE 2 — AI Integration Layer**
  - **Tasks**: `src/lib/gemini.ts` with law grounding, honesty guardrails, `responseMimeType: application/json`.
  - **Gate**: Live/integration check ensuring returned JSON matches Phase 1 schemas.
  - **Status**: PENDING GO-AHEAD

- [ ] **PHASE 3 — Server-side Infra: Env, Rate Limiting, Caching**
  - **Tasks**: `src/lib/env.ts`, `src/lib/rate-limit.ts`, `src/lib/cache.ts`.
  - **Gate**: Unit tests for `rate-limit.ts` and `cache.ts`. `npm test` passes.
  - **Status**: PENDING GO-AHEAD

- [ ] **PHASE 4 — Route Handlers**
  - **Tasks**: `src/lib/route-factory.ts` (7-step pipeline), route endpoints under `src/app/api/`.
  - **Gate**: Unit tests in `tests/route-factory.test.ts` with mocked AI calls (400, 200, cache-hit, 502, 500, 429). `npm test` passes.
  - **Status**: PENDING GO-AHEAD

- [ ] **PHASE 5 — UI: Forms and Results**
  - **Tasks**: Form and results components decomposed under 30 lines each in `src/components/`, wired into single-page tabs in `src/app/page.tsx`.
  - **Gate**: `npm run build` succeeds; all tabs render every schema field.
  - **Status**: PENDING GO-AHEAD

- [ ] **PHASE 6 — Accessibility Pass**
  - **Tasks**: Skip-to-content, aria-live, role="alert", 44px touch targets, heading hierarchy, WCAG 2.2 AA contrast formula tests.
  - **Gate**: `tests/accessibility-contrast.test.ts` passes with zero contrast failures.
  - **Status**: PENDING GO-AHEAD

- [ ] **PHASE 7 — Security Hardening Review**
  - **Tasks**: Check `server-only`, CSP headers, Firestore rules, no secret logging, rate limiting across all routes.
  - **Gate**: Grep self-check commands + full run of type-check, lint, test, build.
  - **Status**: PENDING GO-AHEAD

- [ ] **PHASE 8 — Documentation Honesty Pass**
  - **Tasks**: Update README with strictly verified services and line references.
  - **Gate**: Cite file and line for every implemented service.
  - **Status**: PENDING GO-AHEAD

- [ ] **PHASE 9 — Final Verification**
  - **Tasks**: Clean run: `npm run type-check && npm run lint && npm test && npm run build`.
  - **Gate**: All four commands succeed with zero errors/warnings.
  - **Status**: PENDING GO-AHEAD

---

## 4. LAWJOURNEY AI — Finalized UI Palette & Design System

### 4.1 Color Palette

| Role | Description | Hex | Contrast against White |
|---|---|---|---|
| **Primary Navy** | Deep legal navy (Structure, primary actions) | `#10284A` | 14.7:1 (AAA) |
| **Dark Navy** | App/sidebar/footer/dark background | `#07182F` | 17.8:1 (AAA) |
| **Royal Navy** | Interactive/selected/hover states | `#183B68` | 10.4:1 (AAA) |
| **Gold Accent** | Brand gold (Identity, key badges, CTA) | `#C99A3E` | 6.9:1 on Navy (AAA) |
| **Light Gold** | Hover/highlight/accents | `#E8BE63` | 10.1:1 on Navy (AAA) |
| **Cream** | Premium surface / AI Message background | `#F7F0DE` | 15.6:1 (AAA) |
| **White** | Main surface / Topbar / Chat cards | `#FFFFFF` | — |
| **Soft Gray** | Secondary surface / Table alternating rows | `#F5F6F7` | — |
| **Border** | Subtle divider | `#D9DEE5` | — |
| **Text Primary** | Near-black navy | `#101828` | 17.7:1 (AAA) |
| **Text Secondary** | Slate / Muted captions | `#667085` | 4.97:1 (AA) |
| **Text on Navy** | Pure white | `#FFFFFF` | 14.7:1 (AAA) |
| **Success** | Legal/AI success (System status only) | `#16805B` | 4.91:1 (AA) |
| **Error** | Error state (System status only) | `#C93636` | 5.17:1 (AA) |

### 4.2 Typography System
- **Logo / Major Brand Headings**: `Playfair Display` (Semibold 600 / Bold 700) for a sophisticated legal-premium identity.
- **Application UI**: `Inter` (Regular 400 / Medium 500 / Semibold 600) for modern SaaS clarity and legibility.
- **Monospace Code/Citations**: `JetBrains Mono`.

### 4.3 Buttons System
- **Primary**: Background `#10284A`, Text `#FFFFFF`, Hover `#183B68`.
- **Secondary**: Background `#FFFFFF`, Border `#10284A`, Text `#10284A`, Hover `#F7F0DE`.
- **Gold CTA**: Background `#C99A3E`, Text `#07182F`, Hover `#E8BE63` (used sparingly for key triggers).

### 4.4 AI Interface Design
- **App background**: `#F7F8FA`
- **Chat surface**: `#FFFFFF`
- **User message**: `#10284A` with white text
- **AI message**: `#F7F0DE` (Cream) with navy text and subtle gold border
- **Primary button**: `#10284A`
- **AI accent**: `#C99A3E`
- **Divider/Border**: `#D9DEE5`

### 4.5 Core Design Rule
> **Navy = structure**  
> **White/Cream = space**  
> **Gold = identity + emphasis**  
> **Green/Red = system status only**

