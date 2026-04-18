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
  // Simulate network/AI delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Return realistic mock data
  return {
    home_handle: "HOME_PLAYER",
    away_handle: "AWAY_PLAYER",
    score_home: 2,
    score_away: 1,
    possession_home: 55,
    possession_away: 45,
    shots_home: 12,
    shots_away: 8,
    shots_on_target_home: 6,
    shots_on_target_away: 4,
    fouls_home: 8,
    fouls_away: 10,
    offsides_home: 2,
    offsides_away: 1,
    corners_home: 5,
    corners_away: 3,
    free_kicks_home: 11,
    free_kicks_away: 9,
    passes_home: 450,
    passes_away: 380,
    successful_passes_home: 390,
    successful_passes_away: 310,
    crosses_home: 15,
    crosses_away: 12,
    interceptions_home: 10,
    interceptions_away: 14,
    tackles_home: 18,
    tackles_away: 22,
    saves_home: 3,
    saves_away: 4,
    scorers: [
      { name: "Scorer 1", team: 'home', minute: 24 },
      { name: "Scorer 2", team: 'away', minute: 45 },
      { name: "Scorer 3", team: 'home', minute: 78 }
    ]
  };
}
