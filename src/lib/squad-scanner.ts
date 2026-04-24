import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export interface ScannedSquadResult {
  formation: string;
  collective_strength: number;
  team_playstyle: string;
}

export async function scanSquadImage(base64Image: string): Promise<ScannedSquadResult> {
  try {
    const prompt = `
      Analyze this eFootball/PES squad management screenshot.
      Extract the following details:
      1. Formation (e.g., 4-1-1-4, 4-3-3, etc.)
      2. Collective Strength (the large yellow number, e.g., 3182, 3205)
      3. Team Playstyle (e.g., Long Ball, Quick Counter, Possession Game)

      Return ONLY a JSON object with these keys:
      {
        "formation": string,
        "collective_strength": number,
        "team_playstyle": string
      }
    `;

    // Extract mimeType and base64 data
    const parts = base64Image.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const data = parts[1];

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash-latest',
      contents: [{
        role: 'user',
        parts: [
          { text: prompt },
          { inlineData: { data, mimeType } }
        ]
      }],
      config: { responseMimeType: 'application/json' }
    });

    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("Squad Scan Error:", error);
    throw error;
  }
}
