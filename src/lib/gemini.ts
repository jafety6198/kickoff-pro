import { GoogleGenAI } from "@google/genai";

// In Vite, environment variables are exposed on import.meta.env
// But in this specific environment, it might be on process.env
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('GEMINI_API_KEY is missing. AI features will not work.');
}

export const ai = new GoogleGenAI({ apiKey: apiKey || '' });
