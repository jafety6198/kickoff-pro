import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { 
  Team, 
  Fixture, 
  Player, 
  NewsItem, 
  ScoutingReport, 
  Profile, 
  TournamentMode 
} from '@/store/useStore';

export const supabaseService = {
  // --- AUTH ---
  async signOut() {
    return await supabase.auth.signOut();
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // --- LEAGUES (PROFILES) ---
  async fetchUserLeagues() {
    const { data: leagues, error } = await supabase
      .from('leagues')
      .select(`
        *,
        league_members!inner(*)
      `)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return leagues;
  },

  async createLeague(name: string, mode: TournamentMode, teamCount: number, userId: string, password?: string) {
    // 1. Create League
    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .insert({
        name,
        mode,
        team_count: teamCount,
        creator_id: userId,
        password_hash: password ? btoa(password) : null, // Simple demo "hashing" for now, or use a proper lib
      })
      .select()
      .single();

    if (leagueError) throw leagueError;

    // 2. Add creator as owner member
    const { error: memberError } = await supabase
      .from('league_members')
      .insert({
        league_id: league.id,
        user_id: userId,
        role: 'owner'
      });

    if (memberError) throw memberError;

    return league;
  },

  async joinLeague(leagueId: string, password?: string) {
    const { data: league, error: fetchError } = await supabase
      .from('leagues')
      .select('password_hash')
      .eq('id', leagueId)
      .single();

    if (fetchError) throw fetchError;

    if (league.password_hash && btoa(password || '') !== league.password_hash) {
      throw new Error('Invalid league password');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error: joinError } = await supabase
      .from('league_members')
      .insert({
        league_id: leagueId,
        user_id: user.id,
        role: 'guest'
      });

    if (joinError) throw joinError;

    return true;
  },

  // --- FULL DATA FETCH ---
  async fetchLeagueData(leagueId: string) {
    const [teamsRes, fixturesRes, playersRes, newsRes, scoutingRes] = await Promise.all([
      supabase.from('teams').select('*').eq('league_id', leagueId),
      supabase.from('fixtures').select('*').eq('league_id', leagueId).order('round', { ascending: true }),
      supabase.from('players').select('*').eq('league_id', leagueId),
      supabase.from('news_items').select('*').eq('league_id', leagueId).order('created_at', { ascending: false }),
      supabase.from('scouting_reports').select('*').eq('league_id', leagueId)
    ]);

    if (teamsRes.error) throw teamsRes.error;
    
    return {
      teams: (teamsRes.data || []),
      fixtures: (fixturesRes.data || []),
      players: (playersRes.data || []),
      newsItems: (newsRes.data || []),
      scoutingReports: (scoutingRes.data || [])
    };
  },

  // --- SYNC ACTIONS ---
  async updateTeam(teamId: string, updates: any) {
    const { error } = await supabase
      .from('teams')
      .update(updates)
      .eq('id', teamId);
    if (error) throw error;
  },

  async updateFixture(fixtureId: string, updates: any) {
    const { error } = await supabase
      .from('fixtures')
      .update(updates)
      .eq('id', fixtureId);
    if (error) throw error;
  },

  async addNewsItem(leagueId: string, item: any) {
    const { error } = await supabase
      .from('news_items')
      .insert({
        league_id: leagueId,
        title: item.title,
        content: item.content,
        type: item.type,
        tags: item.tags
      });
    if (error) throw error;
  },

  async saveTeams(leagueId: string, teams: Team[]) {
    // Standardize teams for DB
    const teamsToInsert = teams.map(t => ({
      league_id: leagueId,
      name: t.name,
      manager_name: t.managerName,
      handle_name: t.handleName || '',
      logo_url: t.logo,
      played: t.played,
      won: t.won,
      drawn: t.drawn,
      lost: t.lost,
      gf: t.gf,
      ga: t.ga,
      gd: t.gd,
      pts: t.pts,
      formation: t.formation,
      strength: t.collectiveStrength,
      playstyle: t.playstyle,
      description: t.description,
      color: t.color,
      form: t.form || []
    }));

    const { data: insertedTeams, error } = await supabase
      .from('teams')
      .insert(teamsToInsert)
      .select();

    if (error) throw error;
    return insertedTeams;
  },

  async migrateFullProfile(profile: Profile, userId: string) {
    // 1. Create the League
    const league = await this.createLeague(
      profile.name, 
      profile.mode, 
      profile.teamCount, 
      userId
    );

    // 2. Upload Teams and get back their new UUIDs
    const insertedTeams = await this.saveTeams(league.id, profile.teams);
    
    // Create mapping of old team names to new IDs (since local might not have unique IDs)
    const teamMapping: Record<string, string> = {};
    insertedTeams.forEach(t => {
      teamMapping[t.name] = t.id;
    });

    // 3. Upload Fixtures with mapped IDs
    if (profile.fixtures && profile.fixtures.length > 0) {
      const fixturesToInsert = profile.fixtures.map(f => {
        return {
          league_id: league.id,
          home_team_id: teamMapping[profile.teams.find(t => t.id === f.homeTeamId)?.name || ''],
          away_team_id: teamMapping[profile.teams.find(t => t.id === f.awayTeamId)?.name || ''],
          round: f.round,
          leg1_score_home: f.leg1.homeScore,
          leg1_score_away: f.leg1.awayScore,
          leg1_status: f.leg1.status,
          prediction: f.prediction || null
        };
      }).filter(f => f.home_team_id && f.away_team_id);

      if (fixturesToInsert.length > 0) {
        const { error: fError } = await supabase.from('fixtures').insert(fixturesToInsert);
        if (fError) console.error('Migration: Fixtures error', fError);
      }
    }

    // 4. Upload Players
    if (profile.players && profile.players.length > 0) {
      const playersToInsert = profile.players.map(p => {
        const team = profile.teams.find(t => t.id === p.teamId);
        return {
          league_id: league.id,
          team_id: team ? teamMapping[team.name] : null,
          name: p.name,
          goals: p.goals,
          assists: p.assists,
          yellow_cards: p.yellowCards,
          red_cards: p.redCards
        };
      }).filter(p => p.team_id);

      if (playersToInsert.length > 0) {
        const { error: pError } = await supabase.from('players').insert(playersToInsert);
        if (pError) console.error('Migration: Players error', pError);
      }
    }

    return league;
  }
};
