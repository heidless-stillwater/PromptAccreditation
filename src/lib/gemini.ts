import { GoogleGenAI } from '@google/genai';
import { getSecret } from './config-helper';

let genaiInstance: GoogleGenAI | null = null;

/**
 * Lazily initialises the Gemini client.
 * Checks global_secrets first, falls back to NANOBANANA_API_KEY env var.
 */
export async function getGemini(): Promise<GoogleGenAI> {
  if (!genaiInstance) {
    const apiKey =
      (await getSecret('GEMINI_API_KEY')) || process.env.NANOBANANA_API_KEY;

    if (!apiKey) {
      throw new Error(
        '[Gemini] No API key found. Set GEMINI_API_KEY in global_secrets or NANOBANANA_API_KEY in .env.local'
      );
    }
    genaiInstance = new GoogleGenAI({ apiKey });
  }
  return genaiInstance;
}

/** Model handles — long-context for RAG, flash for quick ops */
export const MODELS = {
  RAG: 'gemini-1.5-pro',
  EMBEDDING: 'text-embedding-004',
  FLASH: 'gemini-2.0-flash',
} as const;
