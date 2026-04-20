import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateRoundRobinFixtures } from '@/lib/tournament-engine';

export type Role = 'admin' | 'guest' | null;
export type TournamentMode = 'league' | 'knockout' | null;

export interface Team {
  id: string;
  name: string;
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

export interface Profile {
  id: string;
  name: string;
  season: number;
  mode: TournamentMode;
  teamCount: number;
  teams: Team[];
  fixtures: Fixture[];
  players: Player[];
  createdAt: string;
  updatedAt: string;
}

interface TournamentState {
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
  
  // Actions
  setRole: (role: Role) => void;
  setStep: (step: TournamentState['step']) => void;
  
  // Profile Actions
  createProfile: (name: string, mode: TournamentMode, teamCount: number) => void;
  loadProfile: (id: string) => void;
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

      setRole: (role) => set({ role }),
      setStep: (step) => set({ step }),
      
      createProfile: (name, mode, teamCount) => set((state) => {
        const newProfile: Profile = {
          id: Math.random().toString(36).substr(2, 9),
          name,
          season: 1,
          mode,
          teamCount,
          teams: [],
          fixtures: [],
          players: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return {
          profiles: [...state.profiles, newProfile],
          currentProfileId: newProfile.id,
          tournamentName: name,
          mode,
          teamCount,
          season: 1,
          teams: [],
          fixtures: [],
          players: [],
          step: 'editor'
        };
      }),

      loadProfile: (id) => set((state) => {
        const profile = state.profiles.find(p => p.id === id);
        if (!profile) return state;
        
        // If the profile has no teams, it's a new career that hasn't finished setup
        const nextStep = profile.teams.length === 0 ? 'editor' : 'dashboard';
        
        return {
          currentProfileId: id,
          tournamentName: profile.name,
          mode: profile.mode,
          teamCount: profile.teamCount,
          season: profile.season,
          teams: profile.teams,
          fixtures: profile.fixtures,
          players: profile.players,
          step: nextStep
        };
      }),

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
          goals: 0, assists: 0, yellowCards: 0, redCards: 0, passes: 0
        }));

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
