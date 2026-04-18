import { createGoogleGenerativeAI } from '@ai-sdk/google';

// In Vite/Vercel, environment variables are handled differently
// We check both the server-side style and the Vite-specific prefixed style
const getApiKey = () => {
  try {
    // 1. Try Vite's client-side prefix (standard for Vercel/Standard Vite)
    if (import.meta.env.VITE_GEMINI_API_KEY) return import.meta.env.VITE_GEMINI_API_KEY;
    
    // 2. Try the platform-provided process.env (AI Studio Preview environment)
    if (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;

    // 3. Fallback to generic process.env if available
    if (typeof process !== 'undefined' && process.env?.VITE_GEMINI_API_KEY) return process.env.VITE_GEMINI_API_KEY;
  } catch (e) {
    console.warn('Error accessing environment variables:', e);
  }
  return '';
};

const apiKey = getApiKey();

if (!apiKey) {
  console.warn('🚨 GEMINI_API_KEY is missing. AI features will fail. Ensure VITE_GEMINI_API_KEY is set in Vercel settings.');
}

// Export the Vercel AI SDK Google provider
export const google = createGoogleGenerativeAI({
  apiKey: apiKey || '',
});
