import { GEMINI_MODEL, GEMINI_API_BASE, MAX_TOKENS, TEMPERATURE } from './constants';
import { callOpenRouter } from './openrouter';
import type { UnderstandInput, CompareInput, NavigateInput, ChatInput, ClarifyInput } from './validators';


type GeminiPart = { text: string };
type GeminiCandidate = { content: { parts: GeminiPart[] } };
type GeminiResponse = { candidates: GeminiCandidate[] };

/** Grounds every legal judgment in real, specific Indian law. */
const INDIAN_LAW_GROUNDING = `You are LexAI, an Indian legal-literacy assistant. Ground every legal
judgment in REAL, SPECIFIC Indian law — never invent a law, section number, or case.
When you reference law, draw from what is actually relevant, such as:
- The Constitution of India — especially Part III Fundamental Rights: Article 14 (equality
  before law), Article 19(1)(g) (right to practise any profession, or to carry on any
  occupation, trade or business — the basis for striking down unreasonably restrictive
  non-compete or restraint-of-trade clauses), Article 21 (right to life and personal liberty,
  read to include dignity and privacy), and Article 23 (prohibition of forced labour).
- The Indian Contract Act, 1872 — especially Section 10 (what agreements are contracts),
  Section 23 (unlawful consideration/object and "opposed to public policy"), Section 27
  (agreements in restraint of trade are void, subject to narrow exceptions), Section 28
  (agreements restricting legal proceedings are void), and Section 74 (penalty vs genuine
  pre-estimate of liquidated damages).
- The Consumer Protection Act, 2019 — unfair contract terms and unfair trade practices,
  especially one-sided terms imposed on consumers.
- The Indian Penal Code, 1860 / Bharatiya Nyaya Sanhita, 2023 — for clauses that purport to
  authorize something actually criminal (e.g. coercion, criminal intimidation, cheating).
- The Specific Relief Act, 1963 — remedies and when specific performance is available.
- The Transfer of Property Act, 1882 — for leases and rent agreements.
- The Industrial Disputes Act, 1947 / Shops and Establishments Acts / Code on Wages, 2019 —
  for employment terms, notice periods, and non-waivable statutory dues.
- The Arbitration and Conciliation Act, 1996 — for dispute resolution and arbitration clauses.
- The Information Technology Act, 2000 — for electronic contracts, e-signatures, and data terms.
When you are not fully certain a specific section applies, say so plainly ("this appears to
relate to Section 27 of the Contract Act, but confirm with an advocate") rather than stating
it as settled fact. You are providing legal INFORMATION, not legal ADVICE, and you are not a
substitute for a licensed advocate — say this only where the schema asks for a disclaimer,
do not repeat it in every field.`;



/** Internal: call Gemini directly. Returns null on any error (rate limit, quota, missing key etc)
 *  so the caller can immediately fall through to OpenRouter. */
async function tryGeminiDirect(prompt: string): Promise<string | null> {
  try {
    const key = (process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '').trim();
    if (!key) return null;                           // no key → skip to OpenRouter

    const url = `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${key}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: TEMPERATURE,
          maxOutputTokens: MAX_TOKENS,
          responseMimeType: 'application/json',
        },
      }),
    });

    // 429 / 5xx → return null so caller uses OpenRouter
    if (!res.ok) return null;

    const data = (await res.json()) as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return text ?? null;
  } catch {
    return null;   // network error → fall through to OpenRouter
  }
}

/** OpenRouter fallback: tries Gemini Flash first, then Claude */
async function callOpenRouterFallback(prompt: string): Promise<string> {
  // First: try Gemini 2.0 Flash via OpenRouter (free tier)
  try {
    const result = await callOpenRouter(
      [{ role: 'user', content: prompt }],
      { maxTokens: MAX_TOKENS, temperature: TEMPERATURE, jsonMode: true, model: 'google/gemini-2.0-flash-exp:free' }
    );
    return result;
  } catch { /* fall through to Claude */ }

  // Second: Claude via OpenRouter
  return callOpenRouter(
    [{ role: 'user', content: prompt }],
    { maxTokens: MAX_TOKENS, temperature: TEMPERATURE, jsonMode: true }
  );
}

/** Primary entry point — tries Gemini first, auto-falls back to OpenRouter on any error */
async function callGemini(prompt: string): Promise<string> {
  const geminiResult = await tryGeminiDirect(prompt);
  if (geminiResult) return geminiResult;

  // Gemini unavailable (rate limit, quota, missing key) → OpenRouter
  return callOpenRouterFallback(prompt);
}


export async function geminiUnderstand(input: UnderstandInput): Promise<string> {
  const levelGuide: Record<string, string> = {
    simple: 'Use very simple language, short sentences, no jargon. Explain as if to someone with no legal background.',
    standard: 'Use plain English. Avoid jargon. Define any legal terms you must use.',
    detailed: 'Include legal context and explain why clauses matter legally. Still avoid unnecessary jargon.',
  };
  const roleContext = input.userRole
    ? `The reader is: ${input.userRole}. Judge favorability from their perspective specifically.`
    : 'The reader is the party signing or bound by this document. Judge favorability from their perspective.';

  return callGemini(`${INDIAN_LAW_GROUNDING}
${levelGuide[input.readingLevel]}
${roleContext}

You have three extra responsibilities beyond plain-English translation:

1. FAVORABILITY — For each key clause, judge whether it favors the reader, favors the
   other party, or is balanced/standard/mutual. Be specific about why (e.g. "this shifts
   liability entirely onto you" or "this is a standard mutual clause with no lopsided terms").

2. LEGAL-BASIS CHECK — Scan for language that claims, implies, or is phrased to sound like
   it has legal force or authority it likely does NOT have under Indian law. Examples:
   - A clause asserting a "right" or "waiver" that is void under the Indian Contract Act,
     1872 (e.g. Section 27 — an unreasonably broad non-compete/restraint of trade; Section 23
     — a term "opposed to public policy"; Section 74 — a penalty dressed up as liquidated
     damages), or a purported waiver of non-waivable statutory dues (minimum wage, statutory
     notice period, PF/gratuity where applicable).
   - Invented or garbled legal terminology dressed up to sound authoritative.
   - A cited "Section", "Act", or "Code" that is vague, generic, or looks fabricated —
     contrast this with what the REAL relevant Indian statute/section actually is.
   - Overreaching language going well beyond what is enforceable under Indian law.
   For each flag: state what the clause claims, why it's questionable, what the relevant
   Indian law actually establishes (relevantIndianLaw), and cite the specific Act/Section
   you are basing this on (statuteReference), e.g. "Indian Contract Act, 1872 — Section 27".
   If you are inferring rather than certain, say so in relevantIndianLaw. Only flag genuinely
   suspicious items. If nothing is questionable, return an empty array — never invent a concern.

3. CONSTITUTIONAL CHECK — Separately assess whether any clause raises a plausible conflict
   with fundamental rights under Part III of the Constitution of India (most commonly Article
   14 equality, Article 19(1)(g) freedom of trade/profession, Article 21 personal liberty/
   dignity/privacy). Note that fundamental rights primarily restrain State action, but courts
   have applied related public-policy principles (via Contract Act Section 23) to private
   contracts that are unconscionable or against the interests of the public. Set
   overallAssessment honestly: "none" if nothing stands out, "potential_conflict" if there is
   a plausible but uncertain issue, "likely_conflict" only for a clearly overreaching term
   (e.g. a lifetime nationwide non-compete, or a clause purporting to waive a fundamental
   right entirely). List which Articles you considered even if the answer is "none".

Document:
"""
${input.documentText}
"""

Return ONLY valid JSON (no markdown, no preamble):
{
  "documentType": "what kind of document this is",
  "oneSentenceSummary": "one sentence: what this document is and what it does",
  "whatThisDocumentDoes": "2-3 sentences explaining the document's purpose and effect",
  "whoShouldSign": "who this document is for and any warnings about signing",
  "mainPoints": ["short bullet: a main point of the document, in plain English"],
  "keyClauses": [
    {
      "id": "c1",
      "title": "short clause name",
      "originalText": "excerpt from doc (max 150 chars)",
      "plainEnglish": "what this clause says in simple terms",
      "riskLevel": "safe|caution|risky|critical",
      "category": "payment|termination|liability|confidentiality|intellectual_property|dispute_resolution|warranty|indemnification|other",
      "whatItMeans": "practical impact on the signer",
      "whatYouShouldDo": ["specific action to take"],
      "favorability": "favors_you|favors_other_party|balanced",
      "favorabilityReason": "one sentence explaining who this clause benefits and why"
    }
  ],
  "redFlags": ["concerning provisions the reader must know about"],
  "legalConcerns": [
    {
      "id": "lc1",
      "clauseReference": "which clause or section this relates to",
      "whatTheClauseClaims": "what the document says or implies",
      "whyItsQuestionable": "why this looks legally shaky or fabricated under Indian law",
      "relevantIndianLaw": "what the relevant Indian law actually establishes on this point",
      "statuteReference": "specific Act and Section, e.g. Indian Contract Act, 1872 — Section 27",
      "severity": "note|questionable|likely_unenforceable"
    }
  ],
  "constitutionalCheck": {
    "overallAssessment": "none|potential_conflict|likely_conflict",
    "summary": "1-2 sentences on the overall constitutional read of this document",
    "articlesConsidered": ["e.g. Article 14", "Article 19(1)(g)"],
    "concerns": [
      { "clauseReference": "which clause", "articleOrDoctrine": "e.g. Article 19(1)(g) / Section 27 restraint of trade", "explanation": "why this clause plausibly conflicts" }
    ]
  },
  "favorabilitySummary": "1-2 sentences on overall balance: does this document mostly favor the reader, the other party, or is it fair/mutual?",
  "beforeYouSign": ["checklist items to verify or negotiate before signing"],
  "readingTimeMinutes": 5,
  "overallRisk": "safe|caution|risky|critical"
}
Extract 4-8 clauses and 4-8 main points. legalConcerns and constitutionalCheck.concerns can be
empty arrays if nothing is genuinely questionable — never fabricate a concern to fill them.`);
}

export async function geminiCompare(input: CompareInput): Promise<string> {
  const perspective = input.userPerspective
    ? `The user is: ${input.userPerspective}. Tailor your analysis to their interests.`
    : 'Analyze objectively, noting which document favors which party.';

  return callGemini(`${INDIAN_LAW_GROUNDING}
${perspective}
When a difference has legal weight under Indian law (e.g. one version has an enforceable
notice period and the other does not, or one imposes a restraint of trade risking Section 27
of the Contract Act), mention the specific Act/Section briefly inside whyItMatters.

${input.labelA}:
"""
${input.documentA}
"""

${input.labelB}:
"""
${input.documentB}
"""

Return ONLY valid JSON:
{
  "summary": "2-3 sentence overview of the main differences and which document is more favorable",
  "overallVerdict": "A|B|equal",
  "verdictReason": "one sentence explaining the verdict",
  "differences": [
    {
      "topic": "e.g. Payment Terms",
      "inDocA": "what A says",
      "inDocB": "what B says",
      "betterFor": "A|B|equal",
      "whyItMatters": "practical impact of this difference, citing Indian law where relevant",
      "riskLevel": "safe|caution|risky|critical"
    }
  ],
  "sharedTerms": ["provisions both documents agree on"],
  "negotiationOpportunities": ["specific things the reader could negotiate"]
}
Find 4-8 meaningful differences.`);
}

export async function geminiNavigate(input: NavigateInput): Promise<string> {
  return callGemini(`${INDIAN_LAW_GROUNDING}

The user's goal: "${input.userGoal}"

Document:
"""
${input.documentText}
"""

Ground yourRightsUnderThisDocument and yourObligationsUnderThisDocument in both the document's
actual text AND applicable Indian law where relevant (e.g. a statutory minimum notice period
even if the document tries to shorten it). List the specific Acts that actually apply to this
document in applicableIndianLaws (e.g. "Indian Contract Act, 1872", "Transfer of Property Act,
1882" for a lease, "Code on Wages, 2019" for an employment contract).

Return ONLY valid JSON:
{
  "documentType": "type of document",
  "userGoalSummary": "one sentence: what the user is trying to do",
  "navigationSteps": [
    {
      "stepNumber": 1,
      "action": "short imperative action title",
      "detail": "detailed explanation of this step",
      "lookFor": "what to look for in the document at this step",
      "redFlag": "optional: what would be a red flag here"
    }
  ],
  "keyDates": ["important dates or deadlines in the document"],
  "keyParties": ["who the parties to this document are"],
  "yourRightsUnderThisDocument": ["rights the user has, grounded in the document and Indian law"],
  "yourObligationsUnderThisDocument": ["what the user must do"],
  "applicableIndianLaws": ["specific Acts relevant to this document type"],
  "glossary": [
    { "term": "legal term", "definition": "plain English definition" }
  ]
}
Provide 4-7 navigation steps. Include 3-6 glossary terms and 2-5 applicable laws.`);
}

export async function geminiClarify(input: ClarifyInput): Promise<string> {
  const questionFocus: Record<string, string> = {
    plain_english: 'Focus mainly on translating this clause into simple, plain language a non-lawyer can follow. Still fill every field, but keep interpretation as the centerpiece.',
    risks: 'Focus mainly on identifying every risk, trap, or hidden liability in this clause. Still fill every field, but let potentialRisks be the most developed section.',
    obligations: 'Focus mainly on listing every obligation this clause creates and exactly who bears each one. Still fill every field, but let keyPoints emphasize obligations.',
    negotiation_tips: 'Focus mainly on concrete negotiation strategies to improve this clause. Still fill every field, but let actionableAdvice carry the negotiation strategy.',
  };

  return callGemini(`${INDIAN_LAW_GROUNDING}
${questionFocus[input.questionType]}

Clause to clarify:
"""
${input.clauseText}
"""
${input.context ? `\nAdditional context from the user: ${input.context}\n` : ''}

Apply the same LEGAL-BASIS CHECK discipline used elsewhere: if this clause claims or implies
legal authority it likely does not have under Indian law (e.g. Contract Act 1872 Section 27
restraint of trade, Section 23 public policy, Section 74 penalty vs liquidated damages, or a
purported waiver of a non-waivable statutory right), add it to legalConcerns with a specific
statuteReference. If nothing about this clause is legally questionable, return an empty array —
never invent a concern to fill it.

Return ONLY valid JSON:
{
  "clauseSummary": "one sentence restating what this clause does, in plain language",
  "interpretation": "full explanation of what this clause means and does, per the focus above",
  "favorability": "favors_you|favors_other_party|balanced",
  "favorabilityReason": "one sentence on who this clause benefits and why",
  "keyPoints": ["specific point about this clause"],
  "potentialRisks": ["specific risk this clause creates"],
  "legalConcerns": [
    {
      "id": "cc1",
      "clauseReference": "this clause",
      "whatTheClauseClaims": "what it says or implies",
      "whyItsQuestionable": "why this looks legally shaky under Indian law",
      "relevantIndianLaw": "what the relevant Indian law actually establishes",
      "statuteReference": "specific Act and Section",
      "severity": "note|questionable|likely_unenforceable"
    }
  ],
  "actionableAdvice": "concrete advice on what the reader should do about this clause",
  "relatedLegalConcepts": ["related legal term or doctrine worth knowing"]
}
Provide 2-6 keyPoints. potentialRisks and legalConcerns may be empty arrays if genuinely none apply.`);
}

export async function geminiChat(input: ChatInput): Promise<string> {
  const history = input.messages
    .map((m) => `${m.role === 'user' ? 'User' : 'LexAI'}: ${m.content}`)
    .join('\n');

  const context = input.documentContext
    ? `\nDocument context provided by the user:\n"""\n${input.documentContext}\n"""\n`
    : '';

  return callGemini(`${INDIAN_LAW_GROUNDING}
You do NOT provide legal advice or represent yourself as an advocate.
You explain legal concepts clearly, cite the specific Act/Section when you reference Indian
law, note when professional help from a licensed advocate is recommended, and always add a
disclaimer.
${context}
Conversation so far:
${history}

Return ONLY valid JSON:
{
  "answer": "your clear, helpful answer to the user's latest question, citing specific Indian law where relevant",
  "followUpQuestions": ["up to 3 natural follow-up questions the user might want to ask"],
  "disclaimer": "one-line reminder that this is legal information, not legal advice from a licensed advocate"
}`);
}
