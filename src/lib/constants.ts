// ────────────────────────────────────────────────────────────
// LexAI — All magic values live here. Never hardcode elsewhere.
// ────────────────────────────────────────────────────────────

export const GEMINI_MODEL = 'gemini-3.5-flash' as const;
export const GEMINI_API_BASE =
  'https://generativelanguage.googleapis.com/v1beta/models' as const;
export const MAX_TOKENS = 8192 as const;
export const TEMPERATURE = 0.25 as const;

export const MAX_DOC_CHARS = 50_000 as const;
export const MIN_DOC_CHARS = 80 as const;
export const MAX_CLAUSE_CHARS = 5_000 as const;
export const MAX_CHAT_HISTORY = 10 as const;
export const CACHE_TTL_MS: number = 60 * 60 * 1000;
export const RATE_LIMIT_MAX_REQUESTS = 20 as const;
export const RATE_LIMIT_WINDOW_MS: number = 10 * 60 * 1000; // 20 requests per 10 minutes per IP

export const RISK_META = {
  safe:     { label: 'Safe',     color: '#16805b', bg: '#f0fdf4', border: '#86efac' },
  caution:  { label: 'Caution',  color: '#9a6007', bg: '#fefce8', border: '#fde047' },
  risky:    { label: 'Risky',    color: '#c2410c', bg: '#fff7ed', border: '#fdba74' },
  critical: { label: 'Critical', color: '#c93636', bg: '#fef2f2', border: '#fca5a5' },
} as const;

export const FAVORABILITY_META = {
  favors_you:         { label: 'Favors you',       color: '#16805b', bg: '#f0fdf4', border: '#86efac' },
  favors_other_party: { label: 'Favors other party', color: '#c2410c', bg: '#fff7ed', border: '#fdba74' },
  balanced:           { label: 'Balanced',          color: '#183b68', bg: '#f5f6f7', border: '#d9dee5' },
} as const;

export const LEGAL_SEVERITY_META = {
  note:                   { label: 'Worth noting',        color: '#9a6007', bg: '#fefce8', border: '#fde047' },
  questionable:           { label: 'Questionable',        color: '#c2410c', bg: '#fff7ed', border: '#fdba74' },
  likely_unenforceable:   { label: 'Likely unenforceable', color: '#c93636', bg: '#fef2f2', border: '#fca5a5' },
} as const;

export const CONSTITUTIONAL_META = {
  none:                { label: 'No conflict found',     color: '#16805b', bg: '#f0fdf4', border: '#86efac' },
  potential_conflict:  { label: 'Potential conflict',     color: '#9a6007', bg: '#fefce8', border: '#fde047' },
  likely_conflict:     { label: 'Likely conflict',        color: '#c93636', bg: '#fef2f2', border: '#fca5a5' },
} as const;

export const READING_LEVELS = [
  { id: 'simple',   label: 'Simple' },
  { id: 'standard', label: 'Standard' },
  { id: 'detailed', label: 'Detailed' },
] as const;

export const CLARIFY_QUESTION_TYPES = [
  { id: 'plain_english',    label: 'Plain English' },
  { id: 'risks',             label: 'Risks & Liabilities' },
  { id: 'obligations',       label: 'My Obligations' },
  { id: 'negotiation_tips',  label: 'Negotiation Tips' },
] as const;

// OCR is part of Analyze — not a standalone tab in primary navigation.
// The 'ocr' FeatureMode still exists for internal routing/state management.
export const APP_TABS = [
  {
    id: 'dashboard' as const,
    label: 'Dashboard',
    shortLabel: 'Dashboard',
    description: 'Your LAWJOURNEY overview — recent conversations, documents, analyses, and saved clauses.',
    icon: '⊞',
  },
  {
    id: 'understand' as const,
    label: 'Analyze a Document',
    shortLabel: 'Analyze',
    description: 'Upload or paste any legal document. OCR extraction, plain-English breakdown, clause intelligence, risk analysis, favorability, and legal flags — all grounded in Indian statutes.',
    icon: '📄',
  },
  {
    id: 'clarify' as const,
    label: 'Clarify a Clause',
    shortLabel: 'Clarify',
    description: 'Paste just one clause or sentence. Get a focused explanation, who it favors, the risks, and whether it claims legal authority it may not have.',
    icon: '💡',
  },
  {
    id: 'compare' as const,
    label: 'Compare Two Contracts',
    shortLabel: 'Compare',
    description: 'Side-by-side comparison of two contracts or versions. Find out which is better for you and why.',
    icon: '⚖️',
  },
  {
    id: 'navigate' as const,
    label: 'Navigate a Document',
    shortLabel: 'Navigate',
    description: 'Tell us what you want to achieve. We will walk you through the document step-by-step.',
    icon: '🧭',
  },
  {
    id: 'chat' as const,
    label: 'Ask a Legal Question',
    shortLabel: 'Ask AI',
    description: 'Have a conversation about any legal topic or document. Ask follow-up questions naturally.',
    icon: '✦',
  },
  {
    id: 'tasks' as const,
    label: 'My Legal Tasks',
    shortLabel: 'Tasks',
    description: 'Your personal legal task checklist. Track what needs review, verification, or signature — synced to Firebase in real time.',
    icon: '📋',
  },
] as const;

export const JURISDICTION = 'India' as const;

export const SAMPLE_QUESTIONS = [
  'What does "indemnify" mean in plain English?',
  'Can my employer change my salary without notice?',
  'Is a 3-year non-compete clause enforceable in India?',
  'What should I check before signing a rent agreement?',
  'What does "at-will employment" mean under Indian labour law?',
] as const;
