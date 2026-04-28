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
    console.log('supabaseService: Creating league...', { name, mode, teamCount });
    // 1. Create League
    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .insert({
        name,
        mode,
        team_count: teamCount,
        creator_id: userId,
        password_hash: password ? btoa(password) : null,
      })
      .select()
      .single();

    if (leagueError) {
      console.error('supabaseService: League creation error:', leagueError);
      throw leagueError;
    }

    // 2. Add creator as owner member
    const { error: memberError } = await supabase
      .from('league_members')
      .insert({
        league_id: league.id,
        user_id: userId,
        role: 'owner'
      });

    if (memberError) {
      console.error('supabaseService: Member creation error:', memberError);
      throw memberError;
    }

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
    console.log('supabaseService: Starting migration for:', profile.name);
    
    // Ensure user profile exists (fails if trigger didn't run yet)
    const { data: profileCheck, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (profileError || !profileCheck) {
      console.log('supabaseService: Profile missing, creating manually...');
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('user_profiles').upsert({
          id: userId,
          email: user.email!,
          display_name: user.user_metadata?.display_name || user.email?.split('@')[0]
        });
      }
    }

    // 1. Create the League
    const league = await supabaseService.createLeague(
      profile.name, 
      profile.mode, 
      profile.teamCount, 
      userId
    );

    // 2. Upload Teams and get back their new UUIDs
    const insertedTeams = await supabaseService.saveTeams(league.id, profile.teams);
    
    // Create mapping of old team names to new IDs
    const teamMapping: Record<string, string> = {};
    insertedTeams?.forEach(t => {
      teamMapping[t.name] = t.id;
    });

    console.log('supabaseService: Teams migrated, count:', insertedTeams?.length);

    // 3. Upload Fixtures with mapped IDs
    if (profile.fixtures && profile.fixtures.length > 0) {
      console.log('supabaseService: Migrating fixtures...', profile.fixtures.length);
      const fixturesToInsert = profile.fixtures.map(f => {
        // Find home/away team IDs using the names from local data
        const homeTeamName = profile.teams.find(t => t.id === f.homeTeamId)?.name;
        const awayTeamName = profile.teams.find(t => t.id === f.awayTeamId)?.name;

        if (!homeTeamName || !awayTeamName) return null;

        return {
          league_id: league.id,
          home_team_id: teamMapping[homeTeamName],
          away_team_id: teamMapping[awayTeamName],
          round: f.round,
          leg1_score_home: f.leg1.homeScore,
          leg1_score_away: f.leg1.awayScore,
          leg1_status: f.leg1.status,
          prediction: f.prediction || null
        };
      }).filter((f): f is any => f !== null && !!f.home_team_id && !!f.away_team_id);

      if (fixturesToInsert.length > 0) {
        const { error: fError } = await supabase.from('fixtures').insert(fixturesToInsert);
        if (fError) {
          console.error('Migration: Fixtures error', fError);
          toast.error(`Fixture migration error: ${fError.message}`);
        }
      }
    }

    // 4. Upload Players
    if (profile.players && profile.players.length > 0) {
      console.log('supabaseService: Migrating players...', profile.players.length);
      const playersToInsert = profile.players.map(p => {
        const teamName = profile.teams.find(t => t.id === p.teamId)?.name;
        if (!teamName) return null;

        return {
          league_id: league.id,
          team_id: teamMapping[teamName],
          name: p.name,
          goals: p.goals,
          assists: p.assists,
          yellow_cards: p.yellowCards,
          red_cards: p.redCards
        };
      }).filter((p): p is any => p !== null && !!p.team_id);

      if (playersToInsert.length > 0) {
        const { error: pError } = await supabase.from('players').insert(playersToInsert);
        if (pError) {
          console.error('Migration: Players error', pError);
          toast.error(`Player migration error: ${pError.message}`);
        }
      }
    }

    return league;
  }
};
