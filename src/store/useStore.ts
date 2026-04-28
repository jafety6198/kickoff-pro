import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateRoundRobinFixtures } from '@/lib/tournament-engine';
import { supabaseService } from '@/services/supabaseService';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';

export type Role = 'admin' | 'guest' | null;
export type TournamentMode = 'league' | 'knockout' | null;

export interface Team {
  id: string;
  name: string;
  managerName?: string;
  handleName?: string;
  logo: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
  squadImage?: string;
  formation?: string;
  collectiveStrength?: number;
  playstyle?: string;
  description?: string;
  color?: string;
  form?: ('W' | 'D' | 'L')[];
}

export interface Player {
  id: string;
  name: string;
  teamId: string;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  passes?: number;
  goalHistory?: number[]; // Goals in last matches
  lastTeams?: string[]; // Teams played against recently
}

export interface FixtureLeg {
  homeScore: number | null;
  awayScore: number | null;
  status: 'pending' | 'finished';
  stats?: {
    possession_home: number;
    possession_away: number;
    shots_home: number;
    shots_away: number;
    shots_on_target_home?: number;
    shots_on_target_away?: number;
    passes_home?: number;
    passes_away?: number;
    successful_passes_home?: number;
    successful_passes_away?: number;
    fouls_home?: number;
    fouls_away?: number;
    offsides_home?: number;
    offsides_away?: number;
    corners_home?: number;
    corners_away?: number;
    free_kicks_home?: number;
    free_kicks_away?: number;
    crosses_home?: number;
    crosses_away?: number;
    interceptions_home?: number;
    interceptions_away?: number;
    tackles_home?: number;
    tackles_away?: number;
    saves_home?: number;
    saves_away?: number;
  };
}

export interface Fixture {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  leg1: FixtureLeg;
  leg2: FixtureLeg;
  round: number;
  prediction?: {
    homeScore: number;
    awayScore: number;
    reasoning?: string;
  };
}

export interface ScoutingReport {
  teamId: string;
  report: string; // JSON string of the report
  generatedAt: string;
}

export interface Profile {
  id: string;
  name: string;
  season: number;
  mode: TournamentMode;
  teamCount: number;
  teams: Team[];
  fixtures: Fixture[];
  players: Player[];
  newsItems?: NewsItem[];
  scoutingReports?: ScoutingReport[];
  createdAt: string;
  updatedAt: string;
  isCloud?: boolean;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  date: string;
  type: 'newsletter' | 'romano';
  tags?: string[];
}

interface TournamentState {
  user: User | null;
  role: Role;
  step: 'entry' | 'profiles' | 'setup' | 'editor' | 'dashboard';
  
  profiles: Profile[];
  currentProfileId: string | null;

  mode: TournamentMode;
  tournamentName: string;
  season: number;
  teamCount: number;
  teams: Team[];
  fixtures: Fixture[];
  players: Player[];
  newsItems: NewsItem[];
  scoutingReports: ScoutingReport[];
  
  // Actions
  setUser: (user: User | null) => void;
  setRole: (role: Role) => void;
  setStep: (step: TournamentState['step']) => void;
  
  // Sync Actions
  syncLeagues: () => Promise<void>;
  syncActiveLeague: (id: string) => Promise<void>;
  migrateProfile: (id: string) => Promise<void>;

  // Profile Actions
  createProfile: (name: string, mode: TournamentMode, teamCount: number, password?: string) => Promise<void>;
  loadProfile: (id: string) => Promise<void>;
  deleteProfile: (id: string) => void;
  saveProfile: () => void;
  nextSeason: (newTeams: Team[], relegatedTeamIds: string[]) => void;

  // Active Data Actions
  setMode: (mode: TournamentMode) => void;
  setTournamentName: (name: string) => void;
  setTeamCount: (count: number) => void;
  setTeams: (teams: Team[]) => void;
  setFixtures: (fixtures: Fixture[]) => void;
  setPlayers: (players: Player[]) => void;
  setNewsItems: (items: NewsItem[]) => void;
  addNewsItem: (item: NewsItem) => void;
  addScoutingReport: (report: ScoutingReport) => void;
  updateFixtureScore: (fixtureId: string, leg: 1 | 2, homeScore: number, awayScore: number, stats?: FixtureLeg['stats']) => void;
  updateFixturePrediction: (fixtureId: string, prediction: Fixture['prediction']) => void;
  updateTeam: (teamId: string, updates: Partial<Team>) => void;
  updatePlayerStats: (playerId: string, updates: Partial<Player>) => void;
  addPlayer: (player: Omit<Player, 'id'>) => void;
  renameProfile: (id: string, newName: string) => void;
  resetTournament: () => void;
}

export const useStore = create<TournamentState>()(
  persist(
    (set, get) => ({
      user: null,
      role: null,
      step: 'entry',
      
      profiles: [],
      currentProfileId: null,

      mode: null,
      tournamentName: 'KickOff Pro Series',
      season: 1,
      teamCount: 8,
      teams: [],
      fixtures: [],
      players: [],
      newsItems: [],
      scoutingReports: [],

      setUser: (user) => set({ user }),
      setRole: (role) => set({ role }),
      setStep: (step) => set({ step }),
      
      syncLeagues: async () => {
        try {
          const leagues = await supabaseService.fetchUserLeagues();
          const cloudProfiles: Profile[] = leagues.map(l => ({
            id: l.id,
            name: l.name,
            season: l.season || 1,
            mode: l.mode,
            teamCount: l.team_count || 8,
            teams: [], 
            fixtures: [],
            players: [],
            createdAt: l.created_at,
            updatedAt: l.updated_at,
            isCloud: true
          }));

          // Merge with local profiles (those not marked as Cloud and not already matched by name/config)
          const localProfiles = get().profiles.filter(p => 
            !p.isCloud && !cloudProfiles.some(cp => cp.name === p.name && cp.mode === p.mode)
          );

          set({ profiles: [...cloudProfiles, ...localProfiles] });
        } catch (error) {
          console.error('Failed to sync leagues:', error);
        }
      },

      migrateProfile: async (id: string) => {
        const user = get().user;
        if (!user) {
          toast.error('Please login to migrate data');
          return;
        }

        const profile = get().profiles.find(p => p.id === id);
        if (!profile || (profile as any).isCloud) return;

        try {
          toast.loading('Migrating local data to cloud...', { id: 'migration' });
          await supabaseService.migrateFullProfile(profile, user.id);
          await get().syncLeagues();
          toast.success('Migration successful!', { id: 'migration' });
        } catch (error: any) {
          console.error('Migration failed:', error);
          toast.error(`Migration failed: ${error.message || 'Unknown error'}`, { id: 'migration' });
        }
      },

      syncActiveLeague: async (id: string) => {
        try {
          const data = await supabaseService.fetchLeagueData(id);
          set({
            teams: data.teams,
            fixtures: data.fixtures,
            players: data.players,
            newsItems: data.newsItems,
            scoutingReports: data.scoutingReports
          });
        } catch (error) {
          console.error('Failed to sync league data:', error);
        }
      },

      createProfile: async (name, mode, teamCount, password) => {
        const user = get().user;
        if (!user) return;

        try {
          const league = await supabaseService.createLeague(name, mode, teamCount, user.id, password);
          const newProfile: Profile = {
            id: league.id,
            name: league.name,
            season: 1,
            mode: league.mode,
            teamCount: league.team_count,
            teams: [],
            fixtures: [],
            players: [],
            newsItems: [],
            scoutingReports: [],
            createdAt: league.created_at,
            updatedAt: league.updated_at,
          };

          set((state) => ({
            profiles: [...state.profiles, newProfile],
            currentProfileId: league.id,
            tournamentName: name,
            mode,
            teamCount,
            season: 1,
            teams: [],
            fixtures: [],
            players: [],
            newsItems: [],
            scoutingReports: [],
            step: 'editor'
          }));
        } catch (error) {
          console.error('Failed to create league:', error);
        }
      },

      loadProfile: async (id) => {
        await get().syncActiveLeague(id);
        const profile = get().profiles.find(p => p.id === id);
        if (!profile) return;
        
        const nextStep = get().teams.length === 0 ? 'editor' : 'dashboard';
        
        set({
          currentProfileId: id,
          tournamentName: profile.name,
          mode: profile.mode,
          teamCount: profile.teamCount,
          season: profile.season,
          step: nextStep
        });
      },

      deleteProfile: (id) => set((state) => ({
        profiles: state.profiles.filter(p => p.id !== id),
        ...(state.currentProfileId === id ? { currentProfileId: null, step: 'profiles' } : {})
      })),

      renameProfile: (id, newName) => set((state) => ({
        profiles: state.profiles.map(p => p.id === id ? { ...p, name: newName, updatedAt: new Date().toISOString() } : p),
        ...(state.currentProfileId === id ? { tournamentName: newName } : {})
      })),

      saveProfile: () => set((state) => {
        if (!state.currentProfileId) return state;
        const updatedProfiles = state.profiles.map(p => {
          if (p.id === state.currentProfileId) {
            return {
              ...p,
              name: state.tournamentName,
              mode: state.mode,
              teamCount: state.teamCount,
              season: state.season,
              teams: state.teams,
              fixtures: state.fixtures,
              players: state.players,
              newsItems: state.newsItems,
              scoutingReports: state.scoutingReports,
              updatedAt: new Date().toISOString()
            };
          }
          return p;
        });
        return { profiles: updatedProfiles };
      }),

      nextSeason: (newTeams, relegatedTeamIds) => set((state) => {
        if (!state.currentProfileId) return state;
        
        // Keep teams that are not relegated, reset their stats
        const remainingTeams = state.teams
          .filter(t => !relegatedTeamIds.includes(t.id))
          .map(t => ({
            ...t,
            played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0
          }));

        const allTeams = [...remainingTeams, ...newTeams];
        
        // Reset player stats
        const resetPlayers = state.players.map(p => ({
          ...p,
          goals: 0, assists: 0, yellowCards: 0, redCards: 0, passes: 0,
          goalHistory: [], lastTeams: []
        }));

        // Reset news for new season
        const resetNews: NewsItem[] = [];
        const resetReports: ScoutingReport[] = [];

        const newSeason = state.season + 1;
        const newFixtures = generateRoundRobinFixtures(allTeams);

        const updatedProfiles = state.profiles.map(p => {
          if (p.id === state.currentProfileId) {
            return {
              ...p,
              season: newSeason,
              teams: allTeams,
              fixtures: newFixtures,
              players: resetPlayers,
              newsItems: resetNews,
              scoutingReports: resetReports,
              updatedAt: new Date().toISOString()
            };
          }
          return p;
        });

        return {
          profiles: updatedProfiles,
          season: newSeason,
          teams: allTeams,
          fixtures: newFixtures,
          players: resetPlayers,
          newsItems: resetNews,
          scoutingReports: resetReports,
          step: 'dashboard'
        };
      }),

      setMode: (mode) => set({ mode }),
      setTournamentName: (name) => set({ tournamentName: name }),
      setTeamCount: (teamCount) => set({ teamCount }),
      setTeams: (teams) => {
        set({ teams });
        get().saveProfile();
      },
      setFixtures: (fixtures) => {
        set({ fixtures });
        get().saveProfile();
      },
      setPlayers: (players) => {
        set({ players });
        get().saveProfile();
      },
      setNewsItems: (newsItems) => {
        set({ newsItems });
        get().saveProfile();
      },
      addNewsItem: (item) => {
        set((state) => ({ newsItems: [item, ...state.newsItems] }));
        get().saveProfile();
      },
      addScoutingReport: (report) => {
        set((state) => {
          const filtered = state.scoutingReports.filter(r => r.teamId !== report.teamId);
          return { scoutingReports: [report, ...filtered] };
        });
        get().saveProfile();
      },
      
      updateFixtureScore: (fixtureId, leg, homeScore, awayScore, stats) => {
        set((state) => {
          const updatedFixtures = state.fixtures.map((f) => {
            if (f.id === fixtureId) {
              const legData: FixtureLeg = { homeScore, awayScore, stats, status: 'finished' as const };
              return leg === 1 
                ? { ...f, leg1: legData } 
                : { ...f, leg2: legData };
            }
            return f;
          });
          return { fixtures: updatedFixtures };
        });
        get().saveProfile();
      },
      
      updateFixturePrediction: (fixtureId, prediction) => {
        set((state) => {
          const updatedFixtures = state.fixtures.map((f) => 
            f.id === fixtureId ? { ...f, prediction } : f
          );
          return { fixtures: updatedFixtures };
        });
        get().saveProfile();
      },

      updateTeam: (teamId, updates) => {
        set((state) => ({
          teams: state.teams.map((t) => t.id === teamId ? { ...t, ...updates } : t)
        }));
        get().saveProfile();
      },

      updatePlayerStats: (playerId, updates) => {
        set((state) => ({
          players: state.players.map((p) => p.id === playerId ? { ...p, ...updates } : p)
        }));
        get().saveProfile();
      },

      addPlayer: (playerData) => {
        set((state) => ({
          players: [...state.players, { ...playerData, id: Math.random().toString(36).substr(2, 9) }]
        }));
        get().saveProfile();
      },

      resetTournament: () => set({
        mode: null,
        teams: [],
        fixtures: [],
        players: [],
        step: 'setup'
      }),
    }),
    {
      name: 'kickoff-storage',
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (version < 2) {
          const migrateFixtures = (fixtures: any[]) => {
            if (!fixtures || !Array.isArray(fixtures)) return [];
            return fixtures.map((f: any) => {
              if (f.leg1) return f;
              return {
                ...f,
                leg1: {
                  homeScore: f.homeScore !== undefined ? f.homeScore : null,
                  awayScore: f.awayScore !== undefined ? f.awayScore : null,
                  status: f.status === 'finished' ? 'finished' : 'pending',
                  stats: f.stats
                },
                leg2: {
                  homeScore: null,
                  awayScore: null,
                  status: 'pending'
                }
              };
            });
          };

          if (persistedState.fixtures) {
            persistedState.fixtures = migrateFixtures(persistedState.fixtures);
          }
          if (persistedState.profiles) {
            persistedState.profiles = persistedState.profiles.map((p: any) => ({
              ...p,
              fixtures: migrateFixtures(p.fixtures)
            }));
          }
        }
        return persistedState;
      }
    }
  )
);
