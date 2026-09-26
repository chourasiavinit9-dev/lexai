// ────────────────────────────────────────────────────────────
// LexAI — All magic values live here. Never hardcode elsewhere.
// ────────────────────────────────────────────────────────────

export const GEMINI_MODEL = 'gemini-3.1-flash-lite' as const;
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

export function getRiskMeta(risk?: string | null): { label: string; color: string; bg: string; border: string } {
  const norm = (risk || '').toLowerCase().trim();
  if (norm === 'safe' || norm === 'low') return RISK_META.safe;
  if (norm === 'caution' || norm === 'moderate' || norm === 'medium' || norm === 'warning') return RISK_META.caution;
  if (norm === 'risky' || norm === 'high') return RISK_META.risky;
  if (norm === 'critical' || norm === 'severe' || norm === 'extreme') return RISK_META.critical;
  return RISK_META.caution;
}

export const FAVORABILITY_META = {
  favors_you:         { label: 'Favors you',       color: '#16805b', bg: '#f0fdf4', border: '#86efac' },
  favors_other_party: { label: 'Favors other party', color: '#c2410c', bg: '#fff7ed', border: '#fdba74' },
  balanced:           { label: 'Balanced',          color: '#183b68', bg: '#f5f6f7', border: '#d9dee5' },
} as const;

export function getFavorabilityMeta(fav?: string | null): { label: string; color: string; bg: string; border: string } {
  const norm = (fav || '').toLowerCase().trim();
  if (norm.includes('you') || norm === 'favors_you' || norm === 'favorable') return FAVORABILITY_META.favors_you;
  if (norm.includes('other') || norm === 'favors_other_party' || norm === 'unfavorable') return FAVORABILITY_META.favors_other_party;
  if (norm === 'balanced' || norm === 'neutral' || norm === 'equal' || norm === 'mutual' || norm === 'unclear') return FAVORABILITY_META.balanced;
  return FAVORABILITY_META.balanced;
}

export const LEGAL_SEVERITY_META = {
  note:                   { label: 'Worth noting',        color: '#9a6007', bg: '#fefce8', border: '#fde047' },
  questionable:           { label: 'Questionable',        color: '#c2410c', bg: '#fff7ed', border: '#fdba74' },
  likely_unenforceable:   { label: 'Likely unenforceable', color: '#c93636', bg: '#fef2f2', border: '#fca5a5' },
} as const;

export function getLegalSeverityMeta(sev?: string | null): { label: string; color: string; bg: string; border: string } {
  const norm = (sev || '').toLowerCase().trim();
  if (norm === 'note' || norm === 'low' || norm === 'info' || norm === 'minor') return LEGAL_SEVERITY_META.note;
  if (norm === 'questionable' || norm === 'medium' || norm === 'moderate' || norm === 'warning') return LEGAL_SEVERITY_META.questionable;
  if (norm === 'likely_unenforceable' || norm === 'unenforceable' || norm === 'critical' || norm === 'high' || norm === 'severe') return LEGAL_SEVERITY_META.likely_unenforceable;
  return LEGAL_SEVERITY_META.note;
}

export const CONSTITUTIONAL_META = {
  none:                { label: 'No conflict found',     color: '#16805b', bg: '#f0fdf4', border: '#86efac' },
  potential_conflict:  { label: 'Potential conflict',     color: '#9a6007', bg: '#fefce8', border: '#fde047' },
  likely_conflict:     { label: 'Likely conflict',        color: '#c93636', bg: '#fef2f2', border: '#fca5a5' },
} as const;

export function getConstitutionalMeta(c?: string | null): { label: string; color: string; bg: string; border: string } {
  const norm = (c || '').toLowerCase().trim();
  if (norm === 'none' || norm === 'pass' || norm === 'safe' || norm === 'no_conflict') return CONSTITUTIONAL_META.none;
  if (norm === 'potential_conflict' || norm === 'warn' || norm === 'review' || norm === 'moderate' || norm === 'caution') return CONSTITUTIONAL_META.potential_conflict;
  if (norm === 'likely_conflict' || norm === 'conflict' || norm === 'violation' || norm === 'high' || norm === 'critical') return CONSTITUTIONAL_META.likely_conflict;
  return CONSTITUTIONAL_META.none;
}

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
