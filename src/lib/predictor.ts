import { Team, Fixture } from '@/store/useStore';

export interface PredictionResult {
  homeScore: number;
  awayScore: number;
  reasoning: string;
}

export function calculateLocalPrediction(
  homeTeam: Team,
  awayTeam: Team,
  fixtures: Fixture[]
): PredictionResult {
  // 1. Base Strength (0-100)
  const homeBase = homeTeam.collectiveStrength || 75;
  const awayBase = awayTeam.collectiveStrength || 75;

  // 2. Goal Potential (Attacking Strength)
  const homeAvgGoals = homeTeam.played > 0 ? homeTeam.gf / homeTeam.played : 1.5;
  const awayAvgGoals = awayTeam.played > 0 ? awayTeam.gf / awayTeam.played : 1.5;

  // 3. Defensive Leaks (Opposition Goal Potential)
  const homeAvgGa = homeTeam.played > 0 ? homeTeam.ga / homeTeam.played : 1.2;
  const awayAvgGa = awayTeam.played > 0 ? awayTeam.ga / awayTeam.played : 1.2;

  // 4. Form Calculation (Last 5 games)
  const getFormWeight = (team: Team) => {
    const last5 = fixtures
      .filter(f => f.status === 'finished' && (f.homeTeamId === team.id || f.awayTeamId === team.id))
      .sort((a, b) => b.round - a.round)
      .slice(0, 5);
    
    if (last5.length === 0) return 1.0;
    
    const points = last5.reduce((acc, f) => {
      const isHome = f.homeTeamId === team.id;
      const score = isHome ? f.homeScore! : f.awayScore!;
      const oppScore = isHome ? f.awayScore! : f.homeScore!;
      if (score > oppScore) return acc + 3;
      if (score === oppScore) return acc + 1;
      return acc;
    }, 0);
    
    return 1.0 + (points / 15) * 0.2; // Max 20% boost for perfect form
  };

  const homeForm = getFormWeight(homeTeam);
  const awayForm = getFormWeight(awayTeam);

  // 5. Final Prediction Logic
  // Home Advantage (instinctive +3 strength or similar)
  const homeFinalStrength = (homeBase * homeForm) + 5;
  const awayFinalStrength = awayBase * awayForm;

  const diff = homeFinalStrength - awayFinalStrength;
  
  // Calculate expected goals
  // Base goals around 1.2 per team, adjusted by strength diff
  let hExp = 1.2 + (diff / 20) + (Math.random() * 1.5);
  let aExp = 1.2 - (diff / 20) + (Math.random() * 1.5);

  // Clamp values
  const homeScore = Math.max(0, Math.min(6, Math.round(hExp)));
  const awayScore = Math.max(0, Math.min(6, Math.round(aExp)));

  // 6. Generate Tactical Reasoning
  let reasoning = "";
  if (homeScore > awayScore) {
    if (diff > 15) {
      reasoning = `${homeTeam.name}'s overwhelming statistical dominance and ${homeTeam.playstyle || 'Balanced'} setup should prove too much.`;
    } else {
      reasoning = `A narrow victory predicted for ${homeTeam.name}, utilizing home advantage and superior ${homeTeam.playstyle || 'Tactical'} depth.`;
    }
  } else if (awayScore > homeScore) {
    if (diff < -10) {
      reasoning = `${awayTeam.name} are heavy favorites despite being away, with stats suggesting a clinical offensive display.`;
    } else {
      reasoning = `Tactical setup suggests an upset. ${awayTeam.name} appear better equipped to exploit defensive transitions.`;
    }
  } else {
    reasoning = "Statistical parity between these squads suggests a tactical stalemate with shared points.";
  }

  // Add random flavor to reasoning based on form
  if (homeForm > 1.1 && awayForm > 1.1) {
    reasoning = "A high-stakes clash between two teams in peak form. Expect intensity and tactical discipline.";
  }

  return { homeScore, awayScore, reasoning };
}
