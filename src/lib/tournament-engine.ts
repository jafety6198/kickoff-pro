import { Team, Fixture } from '@/store/useStore';

export function generateRoundRobinFixtures(teams: Team[]): Fixture[] {
  const fixtures: Fixture[] = [];
  const teamCount = teams.length;
  const teamIds = teams.map(t => t.id);
  
  // If odd number of teams, add a "bye" team
  if (teamCount % 2 !== 0) {
    teamIds.push('bye');
  }
  
  const numTeams = teamIds.length;
  const numRounds = numTeams - 1;
  const half = numTeams / 2;
  
  const rotation = [...teamIds];
  
  for (let round = 0; round < numRounds; round++) {
    for (let i = 0; i < half; i++) {
      const home = rotation[i];
      const away = rotation[numTeams - 1 - i];
      
      if (home !== 'bye' && away !== 'bye') {
        fixtures.push({
          id: `${round}-${home}-${away}`,
          homeTeamId: home,
          awayTeamId: away,
          homeScore: null,
          awayScore: null,
          round: round + 1,
          status: 'pending'
        });
      }
    }
    
    // Rotate: keep first element fixed, rotate others
    const last = rotation.pop()!;
    rotation.splice(1, 0, last);
  }
  
  return fixtures;
}

export function calculateStandings(teams: Team[], fixtures: Fixture[]): Team[] {
  const standingsMap = new Map<string, Team>();
  
  // Initialize standings
  teams.forEach(team => {
    standingsMap.set(team.id, {
      ...team,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      pts: 0,
      form: []
    });
  });
  
  // Sort fixtures by round and ID to ensure predictable order
  const sortedFixtures = [...fixtures].sort((a, b) => {
    if (a.round !== b.round) return a.round - b.round;
    return a.id.localeCompare(b.id);
  });

  // Process finished fixtures
  sortedFixtures.filter(f => f.status === 'finished').forEach(f => {
    const home = standingsMap.get(f.homeTeamId);
    const away = standingsMap.get(f.awayTeamId);
    
    if (home && away && f.homeScore !== null && f.awayScore !== null) {
      home.played += 1;
      away.played += 1;
      home.gf += f.homeScore;
      home.ga += f.awayScore;
      away.gf += f.awayScore;
      away.ga += f.homeScore;
      
      if (f.homeScore > f.awayScore) {
        home.won += 1;
        home.pts += 3;
        home.form?.push('W');
        away.lost += 1;
        away.form?.push('L');
      } else if (f.homeScore < f.awayScore) {
        away.won += 1;
        away.pts += 3;
        away.form?.push('W');
        home.lost += 1;
        home.form?.push('L');
      } else {
        home.drawn += 1;
        away.drawn += 1;
        home.pts += 1;
        home.form?.push('D');
        away.pts += 1;
        away.form?.push('D');
      }
      
      home.gd = home.gf - home.ga;
      away.gd = away.gf - away.ga;
    }
  });

  // Keep only the last 5 results for form
  standingsMap.forEach(team => {
    if (team.form) {
      team.form = team.form.slice(-5);
    }
  });
  
  return Array.from(standingsMap.values()).sort((a, b) => {
    // 1. Points
    if (b.pts !== a.pts) return b.pts - a.pts;
    // 2. Goal Difference
    if (b.gd !== a.gd) return b.gd - a.gd;
    // 3. Goals Scored
    return b.gf - a.gf;
  });
}
