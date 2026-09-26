import { z } from 'zod';
import {
  MAX_DOC_CHARS,
  MIN_DOC_CHARS,
  MAX_CLAUSE_CHARS,
  MAX_CHAT_HISTORY,
} from './constants';

// ─── Risk / Category enums ────────────────────────────────────

const RiskLevelSchema = z.preprocess((val) => {
  const norm = String(val || '').toLowerCase().trim();
  if (norm === 'low' || norm === 'safe') return 'safe';
  if (norm === 'caution' || norm === 'moderate' || norm === 'medium' || norm === 'warning') return 'caution';
  if (norm === 'risky' || norm === 'high') return 'risky';
  if (norm === 'critical' || norm === 'severe' || norm === 'extreme') return 'critical';
  return 'caution';
}, z.enum(['safe', 'caution', 'risky', 'critical']));

const ClauseCategorySchema = z.preprocess((val) => {
  const norm = String(val || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
  const valid = ['payment', 'termination', 'liability', 'confidentiality', 'intellectual_property', 'dispute_resolution', 'warranty', 'indemnification'];
  return valid.includes(norm) ? norm : 'other';
}, z.enum([
  'payment', 'termination', 'liability', 'confidentiality',
  'intellectual_property', 'dispute_resolution', 'warranty',
  'indemnification', 'other',
]));

const FavorabilitySchema = z.preprocess((val) => {
  const norm = String(val || '').toLowerCase().trim();
  if (norm.includes('you') || norm === 'favors_you' || norm === 'favorable') return 'favors_you';
  if (norm.includes('other') || norm === 'favors_other_party' || norm === 'unfavorable') return 'favors_other_party';
  return 'balanced';
}, z.enum(['favors_you', 'favors_other_party', 'balanced']));

const LegalConcernSeveritySchema = z.preprocess((val) => {
  const norm = String(val || '').toLowerCase().trim();
  if (norm === 'note' || norm === 'low' || norm === 'info' || norm === 'minor') return 'note';
  if (norm === 'questionable' || norm === 'medium' || norm === 'moderate' || norm === 'warning') return 'questionable';
  if (norm === 'likely_unenforceable' || norm === 'unenforceable' || norm === 'critical' || norm === 'high' || norm === 'severe') return 'likely_unenforceable';
  return 'note';
}, z.enum(['note', 'questionable', 'likely_unenforceable']));

const ConstitutionalConcernLevelSchema = z.preprocess((val) => {
  const norm = String(val || '').toLowerCase().trim();
  if (norm === 'none' || norm === 'pass' || norm === 'safe' || norm === 'no_conflict') return 'none';
  if (norm === 'potential_conflict' || norm === 'warn' || norm === 'review' || norm === 'moderate' || norm === 'caution') return 'potential_conflict';
  if (norm === 'likely_conflict' || norm === 'conflict' || norm === 'violation' || norm === 'high' || norm === 'critical') return 'likely_conflict';
  return 'none';
}, z.enum(['none', 'potential_conflict', 'likely_conflict']));

const ClarifyQuestionTypeSchema = z.enum(['plain_english', 'risks', 'obligations', 'negotiation_tips']);

// ─── Input schemas ────────────────────────────────────────────

export const UnderstandInputSchema = z.object({
  documentText: z
    .string()
    .min(MIN_DOC_CHARS, `Document must be at least ${MIN_DOC_CHARS} characters`)
    .max(MAX_DOC_CHARS, `Document must be under ${MAX_DOC_CHARS} characters`)
    .trim(),
  readingLevel: z.enum(['simple', 'standard', 'detailed']).default('standard'),
  userRole: z.string().max(150).trim().default(''),
});

export const CompareInputSchema = z.object({
  documentA: z.string().min(MIN_DOC_CHARS).max(MAX_DOC_CHARS).trim(),
  documentB: z.string().min(MIN_DOC_CHARS).max(MAX_DOC_CHARS).trim(),
  labelA: z.string().min(1).max(60).trim().default('Document A'),
  labelB: z.string().min(1).max(60).trim().default('Document B'),
  userPerspective: z.string().max(200).trim().default(''),
});

export const NavigateInputSchema = z.object({
  documentText: z.string().min(MIN_DOC_CHARS).max(MAX_DOC_CHARS).trim(),
  userGoal: z
    .string()
    .min(10, 'Please describe what you want to achieve')
    .max(500)
    .trim(),
});

export const ClarifyInputSchema = z.object({
  clauseText: z
    .string()
    .min(10, 'Please paste the clause you want clarified')
    .max(MAX_CLAUSE_CHARS)
    .trim(),
  context: z.string().max(500).trim().default(''),
  questionType: ClarifyQuestionTypeSchema.default('plain_english'),
});

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(MAX_CLAUSE_CHARS),
});

export const ChatInputSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1).max(MAX_CHAT_HISTORY),
  documentContext: z.string().max(MAX_DOC_CHARS).trim().optional(),
});

// ─── AI Output schemas ────────────────────────────────────────

export const ClauseSchema = z.object({
  id: z.string(),
  title: z.string(),
  originalText: z.string(),
  plainEnglish: z.string(),
  riskLevel: RiskLevelSchema,
  category: ClauseCategorySchema,
  whatItMeans: z.string(),
  whatYouShouldDo: z.array(z.string()),
  favorability: FavorabilitySchema,
  favorabilityReason: z.string(),
});

export const LegalConcernSchema = z.object({
  id: z.string(),
  clauseReference: z.string(),
  whatTheClauseClaims: z.string(),
  whyItsQuestionable: z.string(),
  relevantIndianLaw: z.string(),
  statuteReference: z.string(),
  severity: LegalConcernSeveritySchema,
});

export const ClarifyOutputSchema = z.object({
  clauseSummary: z.string(),
  interpretation: z.string(),
  favorability: FavorabilitySchema,
  favorabilityReason: z.string(),
  keyPoints: z.array(z.string()).min(1).max(6),
  potentialRisks: z.array(z.string()),
  legalConcerns: z.array(LegalConcernSchema).max(5),
  actionableAdvice: z.string(),
  relatedLegalConcepts: z.array(z.string()),
});

export const ConstitutionalCheckSchema = z.object({
  overallAssessment: ConstitutionalConcernLevelSchema,
  summary: z.string(),
  articlesConsidered: z.array(z.string()),
  concerns: z.array(z.object({
    clauseReference: z.string(),
    articleOrDoctrine: z.string(),
    explanation: z.string(),
  })),
});

export const UnderstandOutputSchema = z.object({
  documentType: z.string(),
  oneSentenceSummary: z.string(),
  whatThisDocumentDoes: z.string(),
  whoShouldSign: z.string(),
  mainPoints: z.array(z.string()).min(1).max(8),
  keyClauses: z.array(ClauseSchema).min(1).max(12),
  redFlags: z.array(z.string()),
  legalConcerns: z.array(LegalConcernSchema).max(10),
  constitutionalCheck: ConstitutionalCheckSchema,
  favorabilitySummary: z.string(),
  beforeYouSign: z.array(z.string()),
  readingTimeMinutes: z.number().int().positive(),
  overallRisk: RiskLevelSchema,
});

export const DifferenceItemSchema = z.object({
  topic: z.string(),
  inDocA: z.string(),
  inDocB: z.string(),
  betterFor: z.enum(['A', 'B', 'equal']),
  whyItMatters: z.string(),
  riskLevel: RiskLevelSchema,
});

export const CompareOutputSchema = z.object({
  summary: z.string(),
  overallVerdict: z.enum(['A', 'B', 'equal']),
  verdictReason: z.string(),
  differences: z.array(DifferenceItemSchema).min(1).max(10),
  sharedTerms: z.array(z.string()),
  negotiationOpportunities: z.array(z.string()),
});

export const NavigationStepSchema = z.object({
  stepNumber: z.number().int().positive(),
  action: z.string(),
  detail: z.string(),
  lookFor: z.string(),
  redFlag: z.string().optional(),
});

export const NavigateOutputSchema = z.object({
  documentType: z.string(),
  userGoalSummary: z.string(),
  navigationSteps: z.array(NavigationStepSchema).min(1).max(10),
  keyDates: z.array(z.string()),
  keyParties: z.array(z.string()),
  yourRightsUnderThisDocument: z.array(z.string()),
  yourObligationsUnderThisDocument: z.array(z.string()),
  applicableIndianLaws: z.array(z.string()),
  glossary: z.array(z.object({ term: z.string(), definition: z.string() })),
});

export const ChatOutputSchema = z.object({
  answer: z.string(),
  followUpQuestions: z.array(z.string()).max(4),
  disclaimer: z.string(),
});

// ─── Type exports ─────────────────────────────────────────────

export type UnderstandInput = z.infer<typeof UnderstandInputSchema>;
export type CompareInput = z.infer<typeof CompareInputSchema>;
export type NavigateInput = z.infer<typeof NavigateInputSchema>;
export type ChatInput = z.infer<typeof ChatInputSchema>;
export type ClarifyInput = z.infer<typeof ClarifyInputSchema>;
export type UnderstandOutput = z.infer<typeof UnderstandOutputSchema>;
export type CompareOutput = z.infer<typeof CompareOutputSchema>;
export type NavigateOutput = z.infer<typeof NavigateOutputSchema>;
export type ChatOutput = z.infer<typeof ChatOutputSchema>;
export type ClarifyOutput = z.infer<typeof ClarifyOutputSchema>;
export type NavigationStep = z.infer<typeof NavigationStepSchema>;
export type DifferenceItem = z.infer<typeof DifferenceItemSchema>;

// ─── OCR / Document Analysis ─────────────────────────────────

export const VerificationStatusSchema = z.enum([
  'VERIFIED',
  'PARTIALLY_VERIFIED',
  'NOT_VERIFIED',
  'POSSIBLE_OCR_ERROR',
  'VERSION_CHECK_REQUIRED',
]);

export const LegalReferenceSchema = z.object({
  type: z.enum(['section', 'article', 'act', 'case', 'other']),
  act: z.string(),
  shortName: z.string().optional(),
  section: z.string().optional(),
  article: z.string().optional(),
  description: z.string(),
  verificationStatus: VerificationStatusSchema,
  verifiedText: z.string().optional(),
  verifiedSource: z.string().optional(),
  confidence: z.enum(['high', 'medium', 'low']),
});

export const OCRInputSchema = z.object({
  /** base64-encoded image OR raw pasted text */
  imageBase64: z.string().optional(),
  mimeType: z.string().optional(),
  pastedText: z.string().max(50_000).optional(),
}).refine(d => d.imageBase64 || d.pastedText, {
  message: 'Either imageBase64 or pastedText is required.',
});

export const OCROutputSchema = z.object({
  documentType: z.string(),
  extractedText: z.string(),
  ocrConfidence: z.enum(['high', 'medium', 'low', 'not_applicable']),
  ocrWarning: z.string().optional(),
  parties: z.array(z.string()),
  keyDates: z.array(z.string()),
  legalReferences: z.array(LegalReferenceSchema),
  summary: z.string(),
  disclaimer: z.string(),
});

export type OCRInput  = z.infer<typeof OCRInputSchema>;
export type OCROutput = z.infer<typeof OCROutputSchema>;
export type LegalReference = z.infer<typeof LegalReferenceSchema>;
export type VerificationStatus = z.infer<typeof VerificationStatusSchema>;

