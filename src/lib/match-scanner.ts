import { ai } from './gemini';
import { Type } from '@google/genai';

export interface ScannedMatchResult {
  home_handle: string;
  away_handle: string;
  score_home: number;
  score_away: number;
  possession_home: number;
  possession_away: number;
  shots_home: number;
  shots_away: number;
  shots_on_target_home: number;
  shots_on_target_away: number;
  fouls_home: number;
  fouls_away: number;
  offsides_home: number;
  offsides_away: number;
  corners_home: number;
  corners_away: number;
  free_kicks_home: number;
  free_kicks_away: number;
  passes_home: number;
  passes_away: number;
  successful_passes_home: number;
  successful_passes_away: number;
  crosses_home: number;
  crosses_away: number;
  interceptions_home: number;
  interceptions_away: number;
  tackles_home: number;
  tackles_away: number;
  saves_home: number;
  saves_away: number;
  scorers: Array<{
    name: string;
    team: 'home' | 'away';
    minute?: number;
  }>;
}

export async function scanMatchStats(imageBase64: string): Promise<ScannedMatchResult> {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [
      {
        parts: [
          {
            text: `Analyze this eFootball match stats screenshot. 
            1. Extract the user handle names (the names at the top next to the scores).
            2. Extract all match statistics listed in the table.
            3. Return the data in strict JSON format following this schema:
            {
              "home_handle": string,
              "away_handle": string,
              "score_home": number,
              "score_away": number,
              "possession_home": number,
              "possession_away": number,
              "shots_home": number,
              "shots_away": number,
              "shots_on_target_home": number,
              "shots_on_target_away": number,
              "fouls_home": number,
              "fouls_away": number,
              "offsides_home": number,
              "offsides_away": number,
              "corners_home": number,
              "corners_away": number,
              "free_kicks_home": number,
              "free_kicks_away": number,
              "passes_home": number,
              "passes_away": number,
              "successful_passes_home": number,
              "successful_passes_away": number,
              "crosses_home": number,
              "crosses_away": number,
              "interceptions_home": number,
              "interceptions_away": number,
              "tackles_home": number,
              "tackles_away": number,
              "saves_home": number,
              "saves_away": number,
              "scorers": Array<{ name: string, team: 'home' | 'away', minute?: number }>
            }
            Ensure handle names are extracted exactly as they appear.`
          },
          {
            inlineData: {
              mimeType: "image/png",
              data: imageBase64
            }
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          home_handle: { type: Type.STRING },
          away_handle: { type: Type.STRING },
          score_home: { type: Type.NUMBER },
          score_away: { type: Type.NUMBER },
          possession_home: { type: Type.NUMBER },
          possession_away: { type: Type.NUMBER },
          shots_home: { type: Type.NUMBER },
          shots_away: { type: Type.NUMBER },
          shots_on_target_home: { type: Type.NUMBER },
          shots_on_target_away: { type: Type.NUMBER },
          fouls_home: { type: Type.NUMBER },
          fouls_away: { type: Type.NUMBER },
          offsides_home: { type: Type.NUMBER },
          offsides_away: { type: Type.NUMBER },
          corners_home: { type: Type.NUMBER },
          corners_away: { type: Type.NUMBER },
          free_kicks_home: { type: Type.NUMBER },
          free_kicks_away: { type: Type.NUMBER },
          passes_home: { type: Type.NUMBER },
          passes_away: { type: Type.NUMBER },
          successful_passes_home: { type: Type.NUMBER },
          successful_passes_away: { type: Type.NUMBER },
          crosses_home: { type: Type.NUMBER },
          crosses_away: { type: Type.NUMBER },
          interceptions_home: { type: Type.NUMBER },
          interceptions_away: { type: Type.NUMBER },
          tackles_home: { type: Type.NUMBER },
          tackles_away: { type: Type.NUMBER },
          saves_home: { type: Type.NUMBER },
          saves_away: { type: Type.NUMBER },
          scorers: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                team: { type: Type.STRING, enum: ['home', 'away'] },
                minute: { type: Type.NUMBER }
              },
              required: ['name', 'team']
            }
          }
        },
        required: ['home_handle', 'away_handle', 'score_home', 'score_away']
      }
    }
  });

  const text = response.text || '{}';
  const data = JSON.parse(text);
  
  // Provide default values if AI misses some fields
  return {
    home_handle: data.home_handle || 'Home',
    away_handle: data.away_handle || 'Away',
    score_home: data.score_home || 0,
    score_away: data.score_away || 0,
    possession_home: data.possession_home || 0,
    possession_away: data.possession_away || 0,
    shots_home: data.shots_home || 0,
    shots_away: data.shots_away || 0,
    shots_on_target_home: data.shots_on_target_home || 0,
    shots_on_target_away: data.shots_on_target_away || 0,
    fouls_home: data.fouls_home || 0,
    fouls_away: data.fouls_away || 0,
    offsides_home: data.offsides_home || 0,
    offsides_away: data.offsides_away || 0,
    corners_home: data.corners_home || 0,
    corners_away: data.corners_away || 0,
    free_kicks_home: data.free_kicks_home || 0,
    free_kicks_away: data.free_kicks_away || 0,
    passes_home: data.passes_home || 0,
    passes_away: data.passes_away || 0,
    successful_passes_home: data.successful_passes_home || 0,
    successful_passes_away: data.successful_passes_away || 0,
    crosses_home: data.crosses_home || 0,
    crosses_away: data.crosses_away || 0,
    interceptions_home: data.interceptions_home || 0,
    interceptions_away: data.interceptions_away || 0,
    tackles_home: data.tackles_home || 0,
    tackles_away: data.tackles_away || 0,
    saves_home: data.saves_home || 0,
    saves_away: data.saves_away || 0,
    scorers: data.scorers || []
  };
}
