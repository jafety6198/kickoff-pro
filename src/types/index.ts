export interface Team {
  id: string;
  name: string;
  logo_url: string;
  university_id?: string;
  created_at?: string;
}

export interface Fixture {
  id: string;
  team_a_id: string;
  team_b_id: string;
  match_date: string;
  status: 'pending' | 'live' | 'finished';
  score_a?: number;
  score_b?: number;
  tournament_type: 'league' | 'knockout';
  round?: number;
  created_at?: string;
}

export interface MatchStats {
  id: string;
  fixture_id: string;
  home_team: string;
  away_team: string;
  score_home: number;
  score_away: number;
  possession_home?: number;
  possession_away?: number;
  shots_home?: number;
  shots_away?: number;
  scorers: Array<{ name: string; team: 'home' | 'away'; minute?: number }>;
  raw_data?: any;
  created_at?: string;
}

export interface LeaderboardEntry {
  team_id: string;
  team_name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
}
