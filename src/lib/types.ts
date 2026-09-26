// ────────────────────────────────────────────────────────────
// LexAI — All TypeScript interfaces live here.
// Import from this file only. Never inline interface declarations.
// ────────────────────────────────────────────────────────────

export type FeatureMode = 'dashboard' | 'understand' | 'ocr' | 'clarify' | 'compare' | 'navigate' | 'chat' | 'tasks';

export type RiskLevel = 'safe' | 'caution' | 'risky' | 'critical';

export type ClauseCategory =
  | 'payment'
  | 'termination'
  | 'liability'
  | 'confidentiality'
  | 'intellectual_property'
  | 'dispute_resolution'
  | 'warranty'
  | 'indemnification'
  | 'other';

export type Favorability = 'favors_you' | 'favors_other_party' | 'balanced';

export type LegalConcernSeverity = 'note' | 'questionable' | 'likely_unenforceable';

// ─── Feature: Understand ──────────────────────────────────────

export interface UnderstandRequest {
  documentText: string;
  readingLevel: 'simple' | 'standard' | 'detailed';
  userRole: string;
}

export interface Clause {
  id: string;
  title: string;
  originalText: string;
  plainEnglish: string;
  riskLevel: RiskLevel;
  category: ClauseCategory;
  whatItMeans: string;
  whatYouShouldDo: string[];
  favorability: Favorability;
  favorabilityReason: string;
}

/** A clause whose legal claim looks fabricated, overreaching, or contrary to
 *  well-established Indian law. This is an AI-generated flag for human/
 *  advocate review — never a verified legal determination or substitute
 *  for advice from a licensed advocate. */
export interface LegalConcern {
  id: string;
  clauseReference: string;
  whatTheClauseClaims: string;
  whyItsQuestionable: string;
  relevantIndianLaw: string;
  statuteReference: string;
  severity: LegalConcernSeverity;
}

export type ConstitutionalConcernLevel = 'none' | 'potential_conflict' | 'likely_conflict';

/** Checks a document's clauses against fundamental rights guaranteed by the
 *  Constitution of India (Articles 14-32) and constitutionally-derived
 *  doctrines (e.g. reasonable restraint of trade, public policy under
 *  Section 23 of the Indian Contract Act, 1872). Informational only. */
export interface ConstitutionalCheck {
  overallAssessment: ConstitutionalConcernLevel;
  summary: string;
  articlesConsidered: string[];
  concerns: Array<{
    clauseReference: string;
    articleOrDoctrine: string;
    explanation: string;
  }>;
}

// Note: the authoritative Understand response shape is UnderstandOutput,
// inferred from UnderstandOutputSchema in validators.ts (single source of truth).

// ─── Feature: Compare ────────────────────────────────────────

export interface CompareRequest {
  documentA: string;
  documentB: string;
  labelA: string;
  labelB: string;
  userPerspective: string;
}

export interface DifferenceItem {
  topic: string;
  inDocA: string;
  inDocB: string;
  betterFor: 'A' | 'B' | 'equal';
  whyItMatters: string;
  riskLevel: RiskLevel;
}

// Note: the authoritative Compare response shape is CompareOutput,
// inferred from CompareOutputSchema in validators.ts.

// ─── Feature: Navigate ───────────────────────────────────────

export interface NavigateRequest {
  documentText: string;
  userGoal: string;
}

export interface NavigationStep {
  stepNumber: number;
  action: string;
  detail: string;
  lookFor: string;
  redFlag?: string;
}

// Note: the authoritative Navigate response shape is NavigateOutput,
// inferred from NavigateOutputSchema in validators.ts.

// ─── Feature: Chat ────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  documentContext?: string;
}

// Note: the authoritative Chat response shape is ChatOutput,
// inferred from ChatOutputSchema in validators.ts.

// ─── UI ──────────────────────────────────────────────────────

export interface Tab {
  id: FeatureMode;
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
}

export interface ApiError {
  error: string;
  details?: unknown;
}

export interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}
