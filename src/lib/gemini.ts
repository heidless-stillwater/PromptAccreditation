import { GoogleGenAI } from '@google/genai';
import { getSecret } from './config-helper';

let genaiInstance: GoogleGenAI | null = null;

/**
 * Lazily initialises the Gemini client.
 * Checks global_secrets first, falls back to NANOBANANA_API_KEY env var.
 */
export async function getGemini(): Promise<GoogleGenAI> {
  if (!genaiInstance) {
    let apiKey = await getSecret('STILLWATER_AI_TOKEN');

    // Fallback to local environment variable for development/testing
    if (!apiKey) {
      apiKey = process.env.NANOBANANA_API_KEY || process.env.GEMINI_API_KEY;
    }

    if (!apiKey) {
      throw new Error(
        '[Gemini] No API key found. Set STILLWATER_AI_TOKEN in global_secrets or NANOBANANA_API_KEY in .env.local'
      );
    }
    genaiInstance = new GoogleGenAI({ apiKey });
  }
  return genaiInstance;
}

/** Model handles — long-context for RAG, flash for quick ops */
export const MODELS = {
  RAG: 'gemini-2.5-pro',
  EMBEDDING: 'gemini-embedding-001',
  FLASH: 'gemini-2.5-flash',
  ULTRA: 'gemini-2.5-pro'
} as const;
