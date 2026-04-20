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
          leg1: { homeScore: null, awayScore: null, status: 'pending' },
          leg2: { homeScore: null, awayScore: null, status: 'pending' },
          round: round + 1
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
  sortedFixtures.forEach(f => {
    // Check Leg 1
    if (f.leg1.status === 'finished' && f.leg1.homeScore !== null && f.leg1.awayScore !== null) {
      updateStats(f.homeTeamId, f.awayTeamId, f.leg1.homeScore, f.leg1.awayScore);
    }
    // Check Leg 2
    if (f.leg2.status === 'finished' && f.leg2.homeScore !== null && f.leg2.awayScore !== null) {
      // In Leg 2, roles are reversed for stadium/home advantage usually, 
      // but the data structure says homeTeamId/awayTeamId for the FIXTURE.
      // We assume Leg 2 is played at the original Away Team's stadium.
      // So homeScore in Leg 2 belongs to the original Away Team.
      updateStats(f.awayTeamId, f.homeTeamId, f.leg2.homeScore, f.leg2.awayScore);
    }
  });

  function updateStats(team1Id: string, team2Id: string, score1: number, score2: number) {
    const team1 = standingsMap.get(team1Id);
    const team2 = standingsMap.get(team2Id);
    
    if (team1 && team2) {
      team1.played += 1;
      team2.played += 1;
      team1.gf += score1;
      team1.ga += score2;
      team2.gf += score2;
      team2.ga += score1;
      
      if (score1 > score2) {
        team1.won += 1;
        team1.pts += 3;
        team1.form?.push('W');
        team2.lost += 1;
        team2.form?.push('L');
      } else if (score1 < score2) {
        team2.won += 1;
        team2.pts += 3;
        team2.form?.push('W');
        team1.lost += 1;
        team1.form?.push('L');
      } else {
        team1.drawn += 1;
        team2.drawn += 1;
        team1.pts += 1;
        team1.form?.push('D');
        team2.pts += 1;
        team2.form?.push('D');
      }
      
      team1.gd = team1.gf - team1.ga;
      team2.gd = team2.gf - team2.ga;
    }
  }

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
