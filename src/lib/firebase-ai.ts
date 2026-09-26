// Firebase AI Logic client — browser-side Gemini via Gemini Developer API
// Uses firebase/ai (Firebase 12+). No API key exposed to client.
// Auth token from Firebase Anonymous Auth secures quota.

import { getFirebaseApp } from './firebase-client';
import {
  getAI,
  getGenerativeModel,
  GoogleAIBackend,
  type GenerativeModel,
} from 'firebase/ai';

let model: GenerativeModel | null = null;

export function getAIModel(): GenerativeModel {
  if (model) return model;
  const app = getFirebaseApp();
  const ai = getAI(app, { backend: new GoogleAIBackend() });
  model = getGenerativeModel(ai, { model: 'gemini-2.0-flash' });
  return model;
}

/** Single-shot text generation */
export async function generateText(prompt: string): Promise<string> {
  const m = getAIModel();
  const result = await m.generateContent(prompt);
  return result.response.text();
}

/** Streaming text generation — calls onChunk on each streamed piece */
export async function generateTextStream(
  prompt: string,
  onChunk: (chunk: string) => void
): Promise<string> {
  const m = getAIModel();
  const stream = m.generateContentStream(prompt);
  let full = '';
  for await (const chunk of (await stream).stream) {
    const text = chunk.text();
    full += text;
    onChunk(text);
  }
  return full;
}
