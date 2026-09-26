import { describe, it, expect } from 'vitest';
import {
  UnderstandInputSchema,
  CompareInputSchema,
  NavigateInputSchema,
  ChatInputSchema,
  ClarifyInputSchema,
  UnderstandOutputSchema,
  CompareOutputSchema,
  NavigateOutputSchema,
  ChatOutputSchema,
  ClarifyOutputSchema,
  ConstitutionalCheckSchema,
  LegalConcernSchema,
} from '../src/lib/validators';

const VALID_DOC = 'This Employment Agreement is entered into between Acme Corp and John Doe. The Employee agrees to the terms of this contract including salary, benefits, and termination clauses as set forth herein.';
const SHORT_DOC = 'Too short';

const VALID_CONST_CHECK = {
  overallAssessment: 'none',
  summary: 'No plausible constitutional conflict was identified.',
  articlesConsidered: ['Article 14', 'Article 19(1)(g)'],
  concerns: [],
};

describe('UnderstandInputSchema', () => {
  it('accepts valid document with default level', () => {
    const r = UnderstandInputSchema.safeParse({ documentText: VALID_DOC });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.readingLevel).toBe('standard');
      expect(r.data.userRole).toBe('');
    }
  });

  it('accepts a userRole string', () => {
    const r = UnderstandInputSchema.safeParse({ documentText: VALID_DOC, userRole: 'Tenant' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.userRole).toBe('Tenant');
  });

  it('rejects userRole over 150 chars', () => {
    const r = UnderstandInputSchema.safeParse({ documentText: VALID_DOC, userRole: 'x'.repeat(151) });
    expect(r.success).toBe(false);
  });

  it('accepts all three reading levels', () => {
    for (const level of ['simple', 'standard', 'detailed']) {
      const r = UnderstandInputSchema.safeParse({ documentText: VALID_DOC, readingLevel: level });
      expect(r.success).toBe(true);
    }
  });

  it('rejects text shorter than minimum', () => {
    expect(UnderstandInputSchema.safeParse({ documentText: SHORT_DOC }).success).toBe(false);
  });

  it('rejects document over 50,000 chars', () => {
    expect(UnderstandInputSchema.safeParse({ documentText: 'x'.repeat(50_001) }).success).toBe(false);
  });

  it('trims whitespace', () => {
    const r = UnderstandInputSchema.safeParse({ documentText: `  ${VALID_DOC}  ` });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.documentText).not.toMatch(/^\s/);
  });

  it('rejects invalid reading level', () => {
    expect(UnderstandInputSchema.safeParse({ documentText: VALID_DOC, readingLevel: 'expert' }).success).toBe(false);
  });
});

describe('CompareInputSchema', () => {
  const base = { documentA: VALID_DOC, documentB: VALID_DOC };

  it('accepts valid pair with defaults', () => {
    const r = CompareInputSchema.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.labelA).toBe('Document A');
      expect(r.data.labelB).toBe('Document B');
    }
  });

  it('accepts custom labels', () => {
    expect(CompareInputSchema.safeParse({ ...base, labelA: 'Employer', labelB: 'Employee' }).success).toBe(true);
  });

  it('rejects label over 60 chars', () => {
    expect(CompareInputSchema.safeParse({ ...base, labelA: 'x'.repeat(61) }).success).toBe(false);
  });

  it('rejects when documentA is missing', () => {
    expect(CompareInputSchema.safeParse({ documentB: VALID_DOC }).success).toBe(false);
  });

  it('rejects short documentB', () => {
    expect(CompareInputSchema.safeParse({ documentA: VALID_DOC, documentB: SHORT_DOC }).success).toBe(false);
  });
});

describe('NavigateInputSchema', () => {
  it('accepts valid input with goal', () => {
    const r = NavigateInputSchema.safeParse({ documentText: VALID_DOC, userGoal: 'I want to understand my termination rights before resigning' });
    expect(r.success).toBe(true);
  });

  it('rejects goal shorter than 10 chars', () => {
    expect(NavigateInputSchema.safeParse({ documentText: VALID_DOC, userGoal: 'Help me' }).success).toBe(false);
  });

  it('rejects when goal is missing', () => {
    expect(NavigateInputSchema.safeParse({ documentText: VALID_DOC }).success).toBe(false);
  });

  it('rejects goal over 500 chars', () => {
    expect(NavigateInputSchema.safeParse({ documentText: VALID_DOC, userGoal: 'g'.repeat(501) }).success).toBe(false);
  });
});

describe('ClarifyInputSchema', () => {
  it('accepts valid clause with default question type', () => {
    const r = ClarifyInputSchema.safeParse({ clauseText: 'The Employee shall not compete with the Employer for two years after termination.' });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.questionType).toBe('plain_english');
      expect(r.data.context).toBe('');
    }
  });

  it('accepts all four question types', () => {
    for (const qt of ['plain_english', 'risks', 'obligations', 'negotiation_tips']) {
      const r = ClarifyInputSchema.safeParse({ clauseText: 'A valid clause for testing purposes here.', questionType: qt });
      expect(r.success).toBe(true);
    }
  });

  it('rejects an invalid question type', () => {
    const r = ClarifyInputSchema.safeParse({ clauseText: 'A valid clause for testing purposes here.', questionType: 'summarize_it' });
    expect(r.success).toBe(false);
  });

  it('rejects clause text under 10 characters', () => {
    expect(ClarifyInputSchema.safeParse({ clauseText: 'Too short' }).success).toBe(false);
  });

  it('accepts optional context up to 500 chars and rejects over', () => {
    const okCtx = ClarifyInputSchema.safeParse({ clauseText: 'A valid clause for testing purposes here.', context: 'I am a tenant.' });
    expect(okCtx.success).toBe(true);
    const tooLong = ClarifyInputSchema.safeParse({ clauseText: 'A valid clause for testing purposes here.', context: 'x'.repeat(501) });
    expect(tooLong.success).toBe(false);
  });

  it('rejects clause text over MAX_CLAUSE_CHARS', () => {
    expect(ClarifyInputSchema.safeParse({ clauseText: 'x'.repeat(5001) }).success).toBe(false);
  });
});

describe('ChatInputSchema', () => {
  const validMsgs = [{ role: 'user', content: 'What is an indemnity clause?' }];

  it('accepts valid chat message array', () => {
    expect(ChatInputSchema.safeParse({ messages: validMsgs }).success).toBe(true);
  });

  it('accepts with optional document context', () => {
    expect(ChatInputSchema.safeParse({ messages: validMsgs, documentContext: VALID_DOC }).success).toBe(true);
  });

  it('rejects empty messages array', () => {
    expect(ChatInputSchema.safeParse({ messages: [] }).success).toBe(false);
  });

  it('rejects invalid role', () => {
    expect(ChatInputSchema.safeParse({ messages: [{ role: 'bot', content: 'hello' }] }).success).toBe(false);
  });

  it('rejects empty message content', () => {
    expect(ChatInputSchema.safeParse({ messages: [{ role: 'user', content: '' }] }).success).toBe(false);
  });
});

describe('LegalConcernSchema', () => {
  it('validates a well-formed legal concern with statute reference', () => {
    const valid = {
      id: 'lc1', clauseReference: 'Section 5 — Non-Compete',
      whatTheClauseClaims: 'Claims a worldwide, perpetual non-compete.',
      whyItsQuestionable: 'Indian courts generally strike down unreasonably broad restraints of trade.',
      relevantIndianLaw: 'Agreements in restraint of trade are void unless they fall within narrow statutory exceptions.',
      statuteReference: 'Indian Contract Act, 1872 — Section 27',
      severity: 'questionable',
    };
    expect(LegalConcernSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a legal concern missing statuteReference', () => {
    const invalid = {
      id: 'lc1', clauseReference: 'Section 5', whatTheClauseClaims: 'Test',
      whyItsQuestionable: 'Test', relevantIndianLaw: 'Test', severity: 'note',
    };
    expect(LegalConcernSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects invalid severity value', () => {
    const invalid = {
      id: 'lc1', clauseReference: 'Test', whatTheClauseClaims: 'Test',
      whyItsQuestionable: 'Test', relevantIndianLaw: 'Test',
      statuteReference: 'Test', severity: 'definitely_illegal',
    };
    expect(LegalConcernSchema.safeParse(invalid).success).toBe(false);
  });
});

describe('ConstitutionalCheckSchema', () => {
  it('validates a well-formed constitutional check with no concerns', () => {
    expect(ConstitutionalCheckSchema.safeParse(VALID_CONST_CHECK).success).toBe(true);
  });

  it('validates a constitutional check with concerns', () => {
    const valid = {
      overallAssessment: 'potential_conflict',
      summary: 'The non-compete clause may conflict with the right to trade.',
      articlesConsidered: ['Article 19(1)(g)'],
      concerns: [{
        clauseReference: 'Section 5 — Non-Compete',
        articleOrDoctrine: 'Article 19(1)(g) / Section 27 restraint of trade',
        explanation: 'A worldwide, perpetual restriction goes beyond what courts generally uphold.',
      }],
    };
    expect(ConstitutionalCheckSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects an invalid overallAssessment value', () => {
    const invalid = { ...VALID_CONST_CHECK, overallAssessment: 'definitely_unconstitutional' };
    expect(ConstitutionalCheckSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects when summary is missing', () => {
    const invalid = { overallAssessment: 'none', articlesConsidered: [], concerns: [] };
    expect(ConstitutionalCheckSchema.safeParse(invalid).success).toBe(false);
  });
});

describe('UnderstandOutputSchema', () => {
  it('validates well-formed AI output with statute-grounded legal concerns and constitutional check', () => {
    const valid = {
      documentType: 'Employment Contract',
      oneSentenceSummary: 'A standard employment agreement.',
      whatThisDocumentDoes: 'Defines the employment relationship.',
      whoShouldSign: 'Both the employee and an authorized company rep.',
      mainPoints: ['Salary is 15,00,000/year', 'Two year non-compete applies'],
      keyClauses: [{
        id: 'c1', title: 'Non-Compete', originalText: 'Employee shall not compete...',
        plainEnglish: 'You cannot work for competitors.', riskLevel: 'risky',
        category: 'liability', whatItMeans: 'Broad restriction on future work.',
        whatYouShouldDo: ['Negotiate the duration'],
        favorability: 'favors_other_party',
        favorabilityReason: 'This clause protects only the employer.',
      }],
      redFlags: ['Overly broad non-compete'],
      legalConcerns: [{
        id: 'lc1', clauseReference: 'Section 5 — Non-Compete',
        whatTheClauseClaims: 'Claims a worldwide, perpetual non-compete.',
        whyItsQuestionable: 'Indian courts generally strike down unreasonably broad restraints of trade.',
        relevantIndianLaw: 'Agreements in restraint of trade are void unless within narrow statutory exceptions.',
        statuteReference: 'Indian Contract Act, 1872 — Section 27',
        severity: 'questionable',
      }],
      constitutionalCheck: {
        overallAssessment: 'potential_conflict',
        summary: 'The non-compete may conflict with the right to trade.',
        articlesConsidered: ['Article 19(1)(g)'],
        concerns: [{
          clauseReference: 'Section 5 — Non-Compete',
          articleOrDoctrine: 'Article 19(1)(g)',
          explanation: 'A worldwide, perpetual restriction is unusually broad.',
        }],
      },
      favorabilitySummary: 'This document mostly favors the employer.',
      beforeYouSign: ['Consult a licensed advocate'],
      readingTimeMinutes: 5,
      overallRisk: 'risky',
    };
    expect(UnderstandOutputSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts empty legalConcerns and no constitutional concerns', () => {
    const valid = {
      documentType: 'NDA', oneSentenceSummary: 'A mutual NDA.', whatThisDocumentDoes: 'Protects confidential info.',
      whoShouldSign: 'Both parties.', mainPoints: ['Standard mutual NDA'],
      keyClauses: [{
        id: 'c1', title: 'Confidentiality', originalText: 'Both parties shall keep info confidential.',
        plainEnglish: 'Keep secrets secret.', riskLevel: 'safe', category: 'confidentiality',
        whatItMeans: 'Mutual obligation.', whatYouShouldDo: [],
        favorability: 'balanced', favorabilityReason: 'Applies equally to both parties.',
      }],
      redFlags: [], legalConcerns: [],
      constitutionalCheck: VALID_CONST_CHECK,
      favorabilitySummary: 'Balanced and standard.',
      beforeYouSign: [], readingTimeMinutes: 3, overallRisk: 'safe',
    };
    expect(UnderstandOutputSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects output missing constitutionalCheck', () => {
    const invalid = {
      documentType: 'Test', oneSentenceSummary: 'Test', whatThisDocumentDoes: 'Test',
      whoShouldSign: 'Test', mainPoints: ['Test'],
      keyClauses: [{
        id: 'c1', title: 'Test', originalText: 'Test', plainEnglish: 'Test',
        riskLevel: 'safe', category: 'other', whatItMeans: 'Test', whatYouShouldDo: [],
        favorability: 'balanced', favorabilityReason: 'Test',
      }],
      redFlags: [], legalConcerns: [], favorabilitySummary: 'Test',
      beforeYouSign: [], readingTimeMinutes: 3, overallRisk: 'safe',
    };
    expect(UnderstandOutputSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects invalid favorability value', () => {
    const invalid = {
      documentType: 'Test', oneSentenceSummary: 'Test', whatThisDocumentDoes: 'Test',
      whoShouldSign: 'Test', mainPoints: ['Test'],
      keyClauses: [{
        id: 'c1', title: 'Test', originalText: 'Test', plainEnglish: 'Test',
        riskLevel: 'safe', category: 'other', whatItMeans: 'Test', whatYouShouldDo: [],
        favorability: 'favors_nobody', favorabilityReason: 'Test',
      }],
      redFlags: [], legalConcerns: [], constitutionalCheck: VALID_CONST_CHECK,
      favorabilitySummary: 'Test', beforeYouSign: [], readingTimeMinutes: 3, overallRisk: 'safe',
    };
    expect(UnderstandOutputSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects invalid risk level', () => {
    expect(UnderstandOutputSchema.safeParse({ overallRisk: 'extreme' }).success).toBe(false);
  });

  it('rejects empty keyClauses array', () => {
    const invalid = {
      documentType: 'Test', oneSentenceSummary: 'Test', whatThisDocumentDoes: 'Test',
      whoShouldSign: 'Test', mainPoints: ['Test'], keyClauses: [], redFlags: [],
      legalConcerns: [], constitutionalCheck: VALID_CONST_CHECK, favorabilitySummary: 'Test',
      beforeYouSign: [], readingTimeMinutes: 5, overallRisk: 'safe',
    };
    expect(UnderstandOutputSchema.safeParse(invalid).success).toBe(false);
  });
});

describe('CompareOutputSchema', () => {
  it('validates well-formed compare output', () => {
    const valid = {
      summary: 'Document A is more favorable.',
      overallVerdict: 'A',
      verdictReason: 'Better payment terms.',
      differences: [{ topic: 'Payment', inDocA: 'Net 30', inDocB: 'Net 60', betterFor: 'A', whyItMatters: 'Faster payment.', riskLevel: 'caution' }],
      sharedTerms: ['Confidentiality'],
      negotiationOpportunities: ['Push for Net 15'],
    };
    expect(CompareOutputSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects invalid overallVerdict', () => {
    expect(CompareOutputSchema.safeParse({ overallVerdict: 'C' }).success).toBe(false);
  });
});

describe('NavigateOutputSchema', () => {
  it('validates well-formed navigate output with applicable Indian laws', () => {
    const valid = {
      documentType: 'Employment Contract',
      userGoalSummary: 'Understand termination rights.',
      navigationSteps: [{ stepNumber: 1, action: 'Find the termination clause', detail: 'Look in Section 7.', lookFor: 'Notice period' }],
      keyDates: ['Jan 1 2025'],
      keyParties: ['Acme Corp', 'John Doe'],
      yourRightsUnderThisDocument: ['Right to statutory notice period'],
      yourObligationsUnderThisDocument: ['Provide 4 weeks notice'],
      applicableIndianLaws: ['Industrial Disputes Act, 1947', 'Code on Wages, 2019'],
      glossary: [{ term: 'At-will', definition: 'Either party can end employment.' }],
    };
    expect(NavigateOutputSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects navigate output missing applicableIndianLaws', () => {
    const invalid = {
      documentType: 'Employment Contract', userGoalSummary: 'Test',
      navigationSteps: [{ stepNumber: 1, action: 'Test', detail: 'Test', lookFor: 'Test' }],
      keyDates: [], keyParties: [], yourRightsUnderThisDocument: [],
      yourObligationsUnderThisDocument: [], glossary: [],
    };
    expect(NavigateOutputSchema.safeParse(invalid).success).toBe(false);
  });
});

describe('ChatOutputSchema', () => {
  it('validates well-formed chat output', () => {
    const valid = {
      answer: 'An indemnity clause requires one party to compensate the other.',
      followUpQuestions: ['Can I negotiate this?'],
      disclaimer: 'This is legal information, not legal advice from a licensed advocate.',
    };
    expect(ChatOutputSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects more than 4 follow-up questions', () => {
    const invalid = { answer: 'Answer.', followUpQuestions: ['q1','q2','q3','q4','q5'], disclaimer: 'Not advice.' };
    expect(ChatOutputSchema.safeParse(invalid).success).toBe(false);
  });
});

describe('ClarifyOutputSchema', () => {
  it('validates well-formed clarify output with a statute-grounded legal concern', () => {
    const valid = {
      clauseSummary: 'This clause bars the employee from competing for two years.',
      interpretation: 'You cannot work for a competing business for two years after leaving, in any capacity.',
      favorability: 'favors_other_party',
      favorabilityReason: 'This clause exists purely to restrict the employee for the employer\u2019s benefit.',
      keyPoints: ['Two-year duration', 'No geographic limit stated'],
      potentialRisks: ['Could block you from your entire industry for two years'],
      legalConcerns: [{
        id: 'cc1', clauseReference: 'this clause',
        whatTheClauseClaims: 'An unrestricted, unlimited-scope non-compete.',
        whyItsQuestionable: 'Indian courts generally strike down unreasonably broad restraints of trade.',
        relevantIndianLaw: 'Agreements in restraint of trade are void unless within narrow statutory exceptions.',
        statuteReference: 'Indian Contract Act, 1872 \u2014 Section 27',
        severity: 'questionable',
      }],
      actionableAdvice: 'Ask for the non-compete to be narrowed to a specific competitor list and region.',
      relatedLegalConcepts: ['Restraint of trade', 'Non-compete agreement'],
    };
    expect(ClarifyOutputSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts empty potentialRisks and legalConcerns for an unremarkable clause', () => {
    const valid = {
      clauseSummary: 'Both parties agree to keep the terms confidential.',
      interpretation: 'A standard mutual confidentiality obligation.',
      favorability: 'balanced',
      favorabilityReason: 'Applies equally to both parties with no one-sided carve-out.',
      keyPoints: ['Mutual obligation', 'No unusual duration'],
      potentialRisks: [],
      legalConcerns: [],
      actionableAdvice: 'No action needed \u2014 this is a standard clause.',
      relatedLegalConcepts: ['Confidentiality agreement'],
    };
    expect(ClarifyOutputSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects an invalid favorability value', () => {
    const invalid = {
      clauseSummary: 'Test', interpretation: 'Test', favorability: 'favors_nobody',
      favorabilityReason: 'Test', keyPoints: ['Test'], potentialRisks: [], legalConcerns: [],
      actionableAdvice: 'Test', relatedLegalConcepts: [],
    };
    expect(ClarifyOutputSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects empty keyPoints array', () => {
    const invalid = {
      clauseSummary: 'Test', interpretation: 'Test', favorability: 'balanced',
      favorabilityReason: 'Test', keyPoints: [], potentialRisks: [], legalConcerns: [],
      actionableAdvice: 'Test', relatedLegalConcepts: [],
    };
    expect(ClarifyOutputSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects a legalConcerns entry missing statuteReference', () => {
    const invalid = {
      clauseSummary: 'Test', interpretation: 'Test', favorability: 'balanced',
      favorabilityReason: 'Test', keyPoints: ['Test'], potentialRisks: [],
      legalConcerns: [{
        id: 'cc1', clauseReference: 'this clause', whatTheClauseClaims: 'Test',
        whyItsQuestionable: 'Test', relevantIndianLaw: 'Test', severity: 'note',
      }],
      actionableAdvice: 'Test', relatedLegalConcepts: [],
    };
    expect(ClarifyOutputSchema.safeParse(invalid).success).toBe(false);
  });
});
