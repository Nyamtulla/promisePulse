import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export type ClassificationLabel = 'NEW_PROMISE' | 'PROMISE_UPDATE' | 'IRRELEVANT';

export interface PromiseCandidate {
  promiseText: string;
  category: string;
  region: string;
  summary: string;
  confidence: number;
  keywords: string[];
}

export interface NewPromiseResult {
  classification: 'NEW_PROMISE';
  promises: PromiseCandidate[];
  confidence: number;
  rationale?: string;
}

export interface PromiseUpdateResult {
  classification: 'PROMISE_UPDATE';
  matchedPromiseId: string | null;
  matchedCandidates: string[];
  reason: string;
  triggerType: string;
  confidence: number;
  summary: string;
}

export interface IrrelevantResult {
  classification: 'IRRELEVANT';
  explanation: string;
}

export type ClassificationResult = NewPromiseResult | PromiseUpdateResult | IrrelevantResult;

const SYSTEM_PROMPT = `You are an AI classifier for a government commitment tracking system focused on GOVERNANCE AND PUBLIC SERVICE.

Domain: campaign pledges, manifesto items, everyday government promises and commitments—roads, drainage, streetlights, water supply, sanitation, public works, transparency, service delivery.

For each artifact (speech, article, report, news), classify it as exactly one of:
1. NEW_PROMISE - The artifact contains one or more new campaign pledges, government promises, manifesto commitments, or public commitments about governance or public services.
2. PROMISE_UPDATE - The artifact is a follow-up or progress report related to an EXISTING pledge (e.g., "work has started", "road repairs completed downtown", "drainage project finished").
3. IRRELEVANT - The artifact does not contain relevant pledges or updates in the governance domain.

Respond with valid JSON only. No markdown or extra text.`;

export interface ExistingPromise {
  id: string;
  summary: string;
}

const CLASSIFY_PROMPT = (text: string, existingPromises?: ExistingPromise[]) => {
  let prompt = `Classify this artifact:\n\n${text.slice(0, 8000)}\n\n`;
  if (existingPromises && existingPromises.length > 0) {
    prompt += `Existing pledges in the system:\n`;
    for (const p of existingPromises) {
      prompt += `- ID: ${p.id} | ${p.summary}\n`;
    }
    prompt += `If this is a PROMISE_UPDATE, provide matchedPromiseId (the ID) from the list above, or matchedCandidates if uncertain.\n`;
  }
  prompt += `\nRespond with JSON in one of these exact formats:

For NEW_PROMISE:
{"classification":"NEW_PROMISE","promises":[{"promiseText":"...","category":"...","region":"...","summary":"...","confidence":0.9,"keywords":["..."]}],"confidence":0.9,"rationale":"..."}

For PROMISE_UPDATE:
{"classification":"PROMISE_UPDATE","matchedPromiseId":"id or null","matchedCandidates":["id1","id2"],"reason":"...","triggerType":"...","confidence":0.9,"summary":"..."}

For IRRELEVANT:
{"classification":"IRRELEVANT","explanation":"..."}`;
  return prompt;
};

export async function classifyArtifact(
  extractedText: string,
  existingPromises?: ExistingPromise[]
): Promise<ClassificationResult> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is required');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: CLASSIFY_PROMPT(extractedText, existingPromises) }] }],
    systemInstruction: SYSTEM_PROMPT,
  });

  const response = result.response.text();
  if (!response) {
    throw new Error('Empty AI response');
  }

  const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
  const parsed = JSON.parse(cleaned) as ClassificationResult;

  const valid =
    parsed.classification === 'NEW_PROMISE' ||
    parsed.classification === 'PROMISE_UPDATE' ||
    parsed.classification === 'IRRELEVANT';
  if (!valid) {
    throw new Error(`Invalid classification: ${(parsed as { classification?: string }).classification}`);
  }

  return parsed;
}
