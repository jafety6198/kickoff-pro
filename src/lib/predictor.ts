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
    const relevantLegs: any[] = [];
    fixtures.forEach(f => {
      const isHomeTeam = f.homeTeamId === teamId;
      if (f.homeTeamId === teamId || f.awayTeamId === teamId) {
        if (f.leg1?.status === 'finished') relevantLegs.push({ stats: f.leg1?.stats, isHome: isHomeTeam, round: f.round });
        if (f.leg2?.status === 'finished') relevantLegs.push({ stats: f.leg2?.stats, isHome: !isHomeTeam, round: f.round });
      }
    });

    const sortedLegs = relevantLegs.sort((a,b) => b.round - a.round).slice(0, 5);
    
    if (sortedLegs.length === 0) return { shots: 8, goalsScored: 1, goalsConceded: 1 };

    const totals = sortedLegs.reduce((acc, l) => {
      acc.shots += (l.isHome ? l.stats?.shots_home : l.stats?.shots_away) || 8;
      acc.scored += (l.isHome ? l.stats?.goals_home : l.stats?.goals_away) || 0;
      acc.conceded += (l.isHome ? l.stats?.goals_away : l.stats?.goals_home) || 0;
      return acc;
    }, { shots: 0, scored: 0, conceded: 0 });

    return {
      shots: totals.shots / sortedLegs.length,
      avgScored: totals.scored / sortedLegs.length,
      avgConceded: totals.conceded / sortedLegs.length,
      gd: totals.scored - totals.conceded
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
    const relevantLegs: any[] = [];
    fixtures.forEach(f => {
      const isHomeTeam = f.homeTeamId === team.id;
      if (f.homeTeamId === team.id || f.awayTeamId === team.id) {
        if (f.leg1?.status === 'finished') {
          const score = isHomeTeam ? f.leg1.homeScore! : f.leg1.awayScore!;
          const oppScore = isHomeTeam ? f.leg1.awayScore! : f.leg1.homeScore!;
          relevantLegs.push({ score, oppScore, round: f.round });
        }
        if (f.leg2?.status === 'finished') {
          // Home/Away roles swap in Leg 2
          const score = isHomeTeam ? f.leg2.awayScore! : f.leg2.homeScore!;
          const oppScore = isHomeTeam ? f.leg2.homeScore! : f.leg2.awayScore!;
          relevantLegs.push({ score, oppScore, round: f.round });
        }
      }
    });

    const last5Matched = relevantLegs.sort((a,b) => b.round - a.round).slice(0, 5);
    
    if (last5Matched.length === 0) return 1.0;
    
    const points = last5Matched.reduce((acc, l) => {
      if (l.score > l.oppScore) return acc + 3;
      if (l.score === l.oppScore) return acc + 1;
      return acc;
    }, 0);
    
    return 1.0 + (points / 15) * 0.2; // Max 20% boost for perfect form
  };

  const homeForm = getFormWeight(homeTeam);
  const awayForm = getFormWeight(awayTeam);

  // 5. Final Strength Adjustment
  // Factors: Base Strength, Goals/GA Averages, Form, historical Shots/GD
  const hEffect = (homeBase * 0.4) + (homeAvgGoals * 12) - (homeAvgGa * 6) + (homeStats.shots * 0.4) + ((homeStats.gd || 0) * 2);
  const aEffect = (awayBase * 0.4) + (awayAvgGoals * 12) - (awayAvgGa * 6) + (awayStats.shots * 0.4) + ((awayStats.gd || 0) * 2);
  
  const homeFinalStrength = (hEffect * homeForm) + 5; // +5 for home advantage
  const awayFinalStrength = (aEffect * awayForm);

  const diff = homeFinalStrength - awayFinalStrength;
  
  // Calculate expected goals based on strength diff and scoring history
  let hExp = (homeAvgGoals * 0.6) + 0.8 + (diff / 25) + (Math.random() * 0.8);
  let aExp = (awayAvgGoals * 0.6) + 0.8 - (diff / 25) + (Math.random() * 0.8);

  // Clamp values
  const homeScore = Math.max(0, Math.min(6, Math.round(hExp)));
  const awayScore = Math.max(0, Math.min(6, Math.round(aExp)));

  // 6. Generate Tactical Reasoning (Simplified Goal-focused)
  let reasoning = "";
  if (homeScore > awayScore) {
    if (diff > 20) {
      reasoning = `${homeTeam.name}'s significant goal difference and clinical offense suggest a dominant home performance.`;
    } else if (homeScore - awayScore === 1) {
      reasoning = `A narrow victory for ${homeTeam.name}, exploiting a slightly superior goal difference to secure the points.`;
    } else {
      reasoning = `${homeTeam.name} are favorites with an average of ${homeAvgGoals.toFixed(1)} goals per match boosting their threat level.`;
    }
  } else if (awayScore > homeScore) {
    if (diff < -15) {
      reasoning = `${awayTeam.name} should secure a comfortable away result, driven by a superior net goal rating over 90 minutes.`;
    } else if (awayScore - homeScore === 1) {
      reasoning = `A tactical away win. ${awayTeam.name} look better equipped defensively, having conceded only ${awayAvgGa.toFixed(1)} on average.`;
    } else {
      reasoning = `${awayTeam.name}'s scoring frequency suggests they will dominate the net action in this fixture.`;
    }
  } else {
    if (homeAvgGa < 1 && awayAvgGa < 1) {
      reasoning = "A low-scoring defensive standoff is expected. Both backlines have been impenetrable recently.";
    } else {
      reasoning = "Goal-scoring parity between these squads suggests a points split based on recent scoring trends.";
    }
  }

  return { homeScore, awayScore, reasoning };
}
