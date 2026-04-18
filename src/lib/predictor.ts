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
  // Helper to get historical stats
  const getHistoricalStats = (teamId: string) => {
    const relevant = fixtures
      .filter(f => f.status === 'finished' && (f.homeTeamId === teamId || f.awayTeamId === teamId))
      .sort((a, b) => b.round - a.round)
      .slice(0, 5);
    
    if (relevant.length === 0) return { shots: 8, passes: 350, passAccuracy: 75 };

    const totals = relevant.reduce((acc, f) => {
      const isHome = f.homeTeamId === teamId;
      acc.shots += (isHome ? f.stats?.shots_home : f.stats?.shots_away) || 8;
      acc.passes += (isHome ? f.stats?.passes_home : f.stats?.passes_away) || 350;
      const successful = (isHome ? f.stats?.successful_passes_home : f.stats?.successful_passes_away) || 280;
      const total = (isHome ? f.stats?.passes_home : f.stats?.passes_away) || 350;
      acc.accTotal += (successful / total) * 100;
      return acc;
    }, { shots: 0, passes: 0, accTotal: 0 });

    return {
      shots: totals.shots / relevant.length,
      passes: totals.passes / relevant.length,
      passAccuracy: totals.accTotal / relevant.length
    };
  };

  const homeStats = getHistoricalStats(homeTeam.id);
  const awayStats = getHistoricalStats(awayTeam.id);

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

  // 5. Final Strength Adjustment
  // Factors: Base Strength, Goals/GA Averages, Form, historical Shots/Passes
  const hEffect = (homeBase * 0.4) + (homeAvgGoals * 10) - (homeAvgGa * 5) + (homeStats.shots * 0.5) + (homeStats.passAccuracy * 0.1);
  const aEffect = (awayBase * 0.4) + (awayAvgGoals * 10) - (awayAvgGa * 5) + (awayStats.shots * 0.5) + (awayStats.passAccuracy * 0.1);
  
  const homeFinalStrength = (hEffect * homeForm) + 5; // +5 for home advantage
  const awayFinalStrength = (aEffect * awayForm);

  const diff = homeFinalStrength - awayFinalStrength;
  
  // Calculate expected goals based on strength diff and scoring history
  let hExp = (homeAvgGoals * 0.6) + 0.8 + (diff / 25) + (Math.random() * 0.8);
  let aExp = (awayAvgGoals * 0.6) + 0.8 - (diff / 25) + (Math.random() * 0.8);

  // Clamp values
  const homeScore = Math.max(0, Math.min(6, Math.round(hExp)));
  const awayScore = Math.max(0, Math.min(6, Math.round(aExp)));

  // 6. Generate Tactical Reasoning
  let reasoning = "";
  if (homeScore > awayScore) {
    if (diff > 20) {
      reasoning = `${homeTeam.name}'s overwhelming statistical dominance and ${homeTeam.playstyle || 'Balanced'} setup should prove too much for the opposition.`;
    } else if (homeScore - awayScore === 1) {
      reasoning = `A narrow victory predicted for ${homeTeam.name}, utilizing home advantage and superior ${homeTeam.playstyle || 'Tactical'} depth to edge out a result.`;
    } else {
      reasoning = `${homeTeam.name} are favorites here. Their average of ${homeStats.shots.toFixed(1)} shots per game suggests they will eventually find the breakthrough.`;
    }
  } else if (awayScore > homeScore) {
    if (diff < -15) {
      reasoning = `${awayTeam.name} are heavy favorites despite being away, with stats suggesting a clinical offensive display against ${homeTeam.name}.`;
    } else if (awayScore - homeScore === 1) {
      reasoning = `Tactical setup suggests a tight away win. ${awayTeam.name} appear better equipped to exploit defensive transitions with ${awayStats.passAccuracy.toFixed(0)}% pass accuracy.`;
    } else {
      reasoning = `${awayTeam.name}'s technical superiority in possession and direct playstyle should secure them a comfortable result.`;
    }
  } else {
    if (homeStats.passAccuracy > 80 && awayStats.passAccuracy > 80) {
      reasoning = "A high-level tactical stalemate is expected. Both squads exhibit elite retention and defensive positioning.";
    } else {
      reasoning = "Statistical parity between these squads suggests a tactical stalemate with shared points based on current form.";
    }
  }

  return { homeScore, awayScore, reasoning };
}
