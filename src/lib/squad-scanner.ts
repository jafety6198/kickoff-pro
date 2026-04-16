import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface ScannedSquadResult {
  formation: string;
  collective_strength: number;
  team_playstyle: string;
}

export async function scanSquadImage(base64Image: string): Promise<ScannedSquadResult> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: "image/jpeg"
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error("Could not parse AI response");
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Squad Scan Error:", error);
    throw error;
  }
}
