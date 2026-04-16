import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Trophy, 
  Calendar, 
  Scan, 
  Image as ImageIcon, 
  Settings,
  LogOut,
  ChevronRight,
  Clock,
  Save,
  RotateCcw,
  Users,
  BarChart3,
  Edit3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStore, Fixture, Team, Role } from '@/store/useStore';
import { calculateStandings } from '@/lib/tournament-engine';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { MatchScanner } from '../scanner/MatchScanner';
import { PosterGenerator } from '../graphics/PosterGenerator';
import { MatchManagementModal } from './MatchManagementModal';
import { SquadManagementModal } from './SquadManagementModal';
import { StatsDashboard } from './StatsDashboard';
import { Badge } from '@/components/ui/badge';

interface FixtureCardProps {
  key?: string;
  fixture: Fixture;
  teams: Team[];
  role: Role;
  updateFixtureScore: (fixtureId: string, homeScore: number, awayScore: number) => void;
}

function FixtureCard({ fixture, teams, role, updateFixtureScore }: FixtureCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const homeTeam = teams.find(t => t.id === fixture.homeTeamId);
  const awayTeam = teams.find(t => t.id === fixture.awayTeamId);

  const handleClick = () => {
    if (role === 'admin') {
      setIsModalOpen(true);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <>
      <motion.div 
        layout
        onClick={handleClick}
        className={cn(
          "relative overflow-hidden bg-white border border-slate-200 rounded-2xl cursor-pointer group transition-all duration-500",
          role === 'admin' ? "hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10" : "hover:border-slate-400 hover:shadow-xl"
        )}
      >
        {/* Decorative Background Element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700" />
        
        <div className="relative p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Home Team */}
            <div className="flex flex-col items-center sm:items-end gap-3 flex-1 w-full sm:w-auto">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-slate-50 p-2.5 border border-slate-100 shadow-inner group-hover:scale-110 transition-transform duration-500">
                <img 
                  src={homeTeam?.logo} 
                  className="w-full h-full object-contain" 
                  referrerPolicy="no-referrer" 
                  onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${homeTeam?.name.replace(' ', '+')}&background=random`; }}
                />
              </div>
              <div className="text-center sm:text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Home</p>
                <h4 className="font-black text-sm sm:text-base text-slate-900 uppercase tracking-tight italic leading-tight">
                  {homeTeam?.name}
                </h4>
              </div>
            </div>
            
            {/* Score / VS Center */}
            <div className="flex flex-col items-center justify-center gap-3 min-w-[140px]">
              <div className="relative">
                <div className={cn(
                  "flex items-center justify-center gap-4 px-6 py-3 rounded-2xl font-black text-3xl italic tracking-tighter transition-all duration-500",
                  fixture.status === 'finished' 
                    ? "bg-slate-900 text-white shadow-xl shadow-slate-200" 
                    : "bg-slate-100 text-slate-400 border border-slate-200"
                )}>
                  {fixture.status === 'finished' ? (
                    <>
                      <span>{fixture.homeScore}</span>
                      <span className="text-slate-500 text-xl opacity-50">-</span>
                      <span>{fixture.awayScore}</span>
                    </>
                  ) : (
                    <span className="text-xl tracking-[0.3em] ml-1">VS</span>
                  )}
                </div>
                
                {fixture.status === 'finished' && (
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm" />
                )}
              </div>

              <div className="flex flex-col items-center">
                <span className={cn(
                  "text-[9px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-full",
                  fixture.status === 'finished' ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400"
                )}>
                  {fixture.status === 'finished' ? 'Full Time' : 'Upcoming'}
                </span>
                {role === 'admin' && fixture.status === 'pending' && (
                  <span className="text-[8px] font-black text-primary uppercase tracking-widest mt-2 animate-pulse">
                    Update Result
                  </span>
                )}
              </div>
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center sm:items-start gap-3 flex-1 w-full sm:w-auto">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-slate-50 p-2.5 border border-slate-100 shadow-inner group-hover:scale-110 transition-transform duration-500">
                <img 
                  src={awayTeam?.logo} 
                  className="w-full h-full object-contain" 
                  referrerPolicy="no-referrer" 
                  onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${awayTeam?.name.replace(' ', '+')}&background=random`; }}
                />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Away</p>
                <h4 className="font-black text-sm sm:text-base text-slate-900 uppercase tracking-tight italic leading-tight">
                  {awayTeam?.name}
                </h4>
              </div>
            </div>
          </div>
        </div>

        {/* Expandable Details (Guest View) */}
        <AnimatePresence>
          {isExpanded && role !== 'admin' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-slate-50/50 border-t border-slate-100"
            >
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Match Information</h5>
                  <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-slate-200">
                    ID: {fixture.id.slice(0, 8)}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                      <LayoutDashboard className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Venue</p>
                      <p className="text-[10px] font-black text-slate-700 uppercase">{homeTeam?.name} Stadium</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Matchday</p>
                      <p className="text-[10px] font-black text-slate-700 uppercase">Round {fixture.round}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Status</p>
                      <p className="text-[10px] font-black text-slate-700 uppercase">{fixture.status}</p>
                    </div>
                  </div>
                </div>

                {fixture.status === 'finished' && fixture.stats && (
                  <div className="space-y-3">
                    <h6 className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Match Statistics</h6>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
                        <span>{fixture.stats.possession_home}%</span>
                        <span className="uppercase tracking-widest opacity-50">Possession</span>
                        <span>{fixture.stats.possession_away}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                        <div className="h-full bg-slate-900" style={{ width: `${fixture.stats.possession_home}%` }} />
                        <div className="h-full bg-slate-300" style={{ width: `${fixture.stats.possession_away}%` }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {role === 'admin' && (
        <MatchManagementModal 
          fixture={fixture}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}

import { toast } from 'sonner';

import { SeasonEndModal } from './SeasonEndModal';

const PROMOTED_TEAMS = [
  { id: '37', name: 'Norwich' },
  { id: '43', name: 'Luton' },
  { id: '46', name: 'Leicester' },
  { id: '41', name: 'Southampton' },
  { id: '38', name: 'Watford' },
  { id: '53', name: 'Reading' },
  { id: '54', name: 'Swansea' },
  { id: '56', name: 'Hull City' },
  { id: '57', name: 'Derby' },
  { id: '58', name: 'Middlesbrough' },
  { id: '59', name: 'Stoke City' },
  { id: '60', name: 'West Brom' },
];

export function Dashboard() {
  const { teams, fixtures, updateFixtureScore, role, resetTournament, setStep, setRole, nextSeason, currentProfileId } = useStore();
  const [activeTab, setActiveTab] = useState<'standings' | 'fixtures' | 'squads' | 'stats' | 'scanner' | 'graphics'>('standings');
  const [selectedTeamForSquad, setSelectedTeamForSquad] = useState<Team | null>(null);
  const standings = useMemo(() => calculateStandings(teams, fixtures), [teams, fixtures]);
  
  const isSeasonFinished = useMemo(() => {
    return fixtures.length > 0 && fixtures.every(f => f.status === 'finished');
  }, [fixtures]);

  const [showSeasonEnd, setShowSeasonEnd] = useState(false);

  useEffect(() => {
    if (isSeasonFinished) {
      setShowSeasonEnd(true);
    }
  }, [isSeasonFinished]);

  const handleNextSeason = () => {
    const relegatedTeamIds = standings.slice(-3).map(t => t.id);
    
    // Pick 3 random teams from PROMOTED_TEAMS that aren't already in the league
    const currentTeamNames = teams.map(t => t.name.toLowerCase());
    const availablePromoted = PROMOTED_TEAMS.filter(t => !currentTeamNames.includes(t.name.toLowerCase()));
    
    const newTeams: Team[] = availablePromoted.slice(0, 3).map(t => ({
      id: crypto.randomUUID(),
      name: t.name,
      logo: `https://media.api-sports.io/football/teams/${t.id}.png`,
      played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0
    }));

    nextSeason(newTeams, relegatedTeamIds);
    setShowSeasonEnd(false);
    toast.success('Welcome to the new season!');
  };

  const fixturesByRound = useMemo(() => {
    const grouped: Record<number, Fixture[]> = {};
    fixtures.forEach(f => {
      if (!grouped[f.round]) grouped[f.round] = [];
      grouped[f.round].push(f);
    });
    return Object.entries(grouped).sort(([a], [b]) => parseInt(a) - parseInt(b));
  }, [fixtures]);

  const handleSignOut = () => {
    setRole(null);
    setStep('entry');
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar (Desktop) */}
      <div className="hidden md:flex w-72 h-full flex-col p-6 glass border-r border-slate-200 shrink-0">
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">KickOff Pro</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-black">Tournament Pro</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { id: 'standings', label: 'Standings', icon: LayoutDashboard },
            { id: 'fixtures', label: 'Fixtures', icon: Calendar },
            { id: 'squads', label: 'Squads', icon: Users },
            { id: 'stats', label: 'Stats', icon: BarChart3 },
            { id: 'scanner', label: 'Stats Scanner', icon: Scan, adminOnly: true },
            { id: 'graphics', label: 'Graphics', icon: ImageIcon },
          ].filter(item => !item.adminOnly || role === 'admin').map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 group",
                  isActive 
                    ? "bg-primary text-white shadow-xl shadow-primary/20" 
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn(
                    "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
                    isActive ? "text-white" : "text-slate-400"
                  )} />
                  <span className="font-bold tracking-tight">{item.label}</span>
                </div>
                {isActive && (
                  <motion.div
                    layoutId="active-indicator"
                    className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-200 space-y-2">
          <button 
            onClick={() => setStep('profiles')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all duration-300 group"
          >
            <Trophy className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="font-bold">Career Hub</span>
          </button>

          {role === 'admin' && (
            <>
              <button 
                onClick={() => setStep('editor')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all duration-300 group"
              >
                <Edit3 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-bold">Edit Teams</span>
              </button>
              <button 
                onClick={() => {
                  if (confirm('Are you sure you want to start the next season? Relegated teams will be removed.')) {
                    // Logic to identify relegated teams (bottom 3 for example)
                    const relegatedTeamIds = standings.slice(-3).map(t => t.id);
                    // Logic to get new teams (placeholder for now)
                    const newTeams: Team[] = []; 
                    nextSeason(newTeams, relegatedTeamIds);
                  }
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all duration-300 group"
              >
                <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                <span className="font-bold">Next Season</span>
              </button>
            </>
          )}
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-400 hover:text-accent hover:bg-accent/5 transition-all duration-300 group"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-xl border-t border-slate-200 z-50 px-4 py-2 flex items-center justify-around">
        {[
          { id: 'standings', icon: LayoutDashboard },
          { id: 'fixtures', icon: Calendar },
          { id: 'squads', icon: Users },
          { id: 'stats', icon: BarChart3 },
          { id: 'scanner', icon: Scan, adminOnly: true },
          { id: 'graphics', icon: ImageIcon },
        ].filter(item => !item.adminOnly || role === 'admin').map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                "p-3 rounded-xl transition-all",
                isActive ? "text-primary bg-primary/10" : "text-slate-400"
              )}
            >
              <Icon className="w-6 h-6" />
            </button>
          );
        })}
        <button onClick={handleSignOut} className="p-3 text-slate-400">
          <LogOut className="w-6 h-6" />
        </button>
      </div>

      {/* Main Content */}
      <main className={cn(
        "flex-1 overflow-y-auto no-scrollbar pb-24 md:pb-8",
        activeTab === 'graphics' ? "p-0" : "p-4 sm:p-8"
      )}>
        <AnimatePresence mode="wait">
          {activeTab === 'standings' && (
            <motion.div
              key="standings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6 sm:space-y-8"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 uppercase tracking-tighter italic">League Standings</h2>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400 w-fit">
                  Live Updates
                </div>
              </div>

              <div className="glass-card overflow-x-auto no-scrollbar">
                <table className="w-full text-left min-w-[600px]">
                  <thead>
                    <tr className="text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                      <th className="px-6 py-4">Pos</th>
                      <th className="px-6 py-4">Team</th>
                      <th className="px-4 py-4 text-center">Pl</th>
                      <th className="px-4 py-4 text-center">W</th>
                      <th className="px-4 py-4 text-center">D</th>
                      <th className="px-4 py-4 text-center">L</th>
                      <th className="px-4 py-4 text-center">GF</th>
                      <th className="px-4 py-4 text-center">GA</th>
                      <th className="px-4 py-4 text-center">GD</th>
                      <th className="px-4 py-4 text-center">Form</th>
                      <th className="px-6 py-4 text-right">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {standings.map((team, i) => {
                      // Calculate last 5 matches form
                      const teamFixtures = fixtures
                        .filter(f => f.status === 'finished' && (f.homeTeamId === team.id || f.awayTeamId === team.id))
                        .sort((a, b) => b.round - a.round)
                        .slice(0, 5);
                      
                      const form = teamFixtures.map(f => {
                        const isHome = f.homeTeamId === team.id;
                        const won = isHome ? (f.homeScore! > f.awayScore!) : (f.awayScore! > f.homeScore!);
                        const drawn = f.homeScore === f.awayScore;
                        return won ? 'W' : drawn ? 'D' : 'L';
                      });

                      return (
                        <tr key={team.id} className="group hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-900">{i + 1}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img src={team.logo} className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />
                              <span className="text-sm font-semibold text-slate-900">{team.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center text-sm text-slate-600">{team.played}</td>
                          <td className="px-4 py-4 text-center text-sm text-slate-600">{team.won}</td>
                          <td className="px-4 py-4 text-center text-sm text-slate-600">{team.drawn}</td>
                          <td className="px-4 py-4 text-center text-sm text-slate-600">{team.lost}</td>
                          <td className="px-4 py-4 text-center text-sm text-slate-600">{team.gf}</td>
                          <td className="px-4 py-4 text-center text-sm text-slate-600">{team.ga}</td>
                          <td className="px-4 py-4 text-center text-sm text-slate-600">{team.gd}</td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {form.map((result, idx) => (
                                <span key={idx} className={cn(
                                  "w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded-sm text-white",
                                  result === 'W' ? "bg-green-500" : result === 'D' ? "bg-slate-400" : "bg-red-500"
                                )}>
                                  {result}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-slate-900">{team.pts}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'fixtures' && (
            <motion.div
              key="fixtures"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12 sm:space-y-16"
            >
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-slate-200 pb-8">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-[8px] font-black uppercase tracking-[0.3em] text-white w-fit">
                    Tournament Schedule
                  </div>
                  <h2 className="text-5xl sm:text-7xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">
                    Match <span className="text-primary">Fixtures</span>
                  </h2>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Season</div>
                  <div className="text-3xl font-black text-slate-900 italic tracking-tighter">2024/25</div>
                </div>
              </div>

              <div className="space-y-20">
                {fixturesByRound.map(([round, roundFixtures]) => (
                  <div key={round} className="relative">
                    {/* Vertical Round Indicator */}
                    <div className="absolute -left-4 sm:-left-12 top-0 bottom-0 w-px bg-slate-200 hidden md:block">
                      <div className="sticky top-32 w-8 h-8 -ml-4 rounded-full bg-white border-4 border-slate-50 flex items-center justify-center shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </div>
                    </div>

                    <div className="space-y-8">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Matchday {round}</h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Regular Season • {roundFixtures.length} Matches</p>
                        </div>
                        <div className="h-px flex-1 bg-slate-100 mx-8 hidden sm:block" />
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-black uppercase tracking-widest text-[10px] px-4 py-1">
                          Round {round}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {roundFixtures.map((fixture) => (
                          <FixtureCard 
                            key={fixture.id}
                            fixture={fixture}
                            teams={teams}
                            role={role}
                            updateFixtureScore={updateFixtureScore}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'squads' && (
            <motion.div
              key="squads"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6 sm:space-y-8"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 uppercase tracking-tighter italic">Team Squads</h2>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400 w-fit">
                  {role === 'admin' ? 'Management Mode' : 'View Mode'}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams.map((team) => (
                  <motion.div 
                    key={team.id}
                    whileHover={{ y: -5 }}
                    className="glass-card p-6 space-y-4 relative group overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={team.logo} className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
                        <div>
                          <h3 className="font-black text-slate-900 uppercase tracking-tight">{team.name}</h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {team.formation || 'No Formation Set'}
                          </p>
                        </div>
                      </div>
                      {role === 'admin' && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => setSelectedTeamForSquad(team)}
                          className="rounded-xl hover:bg-primary/10 hover:text-primary"
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="aspect-video rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden relative">
                      {team.squadImage ? (
                        <img src={team.squadImage} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                          <Users className="w-8 h-8 mb-2 opacity-20" />
                          <p className="text-[8px] font-black uppercase tracking-widest">No Squad Image</p>
                        </div>
                      )}
                      {team.collectiveStrength && (
                        <div className="absolute bottom-3 right-3 bg-primary text-white px-3 py-1 rounded-lg text-[10px] font-black italic shadow-lg">
                          CS: {team.collectiveStrength}
                        </div>
                      )}
                    </div>

                    {team.playstyle && (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none text-[8px] font-black uppercase tracking-widest">
                          {team.playstyle}
                        </Badge>
                      </div>
                    )}

                    {role === 'admin' && !team.squadImage && (
                      <Button 
                        onClick={() => setSelectedTeamForSquad(team)}
                        className="w-full h-10 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest"
                      >
                        Upload Squad
                      </Button>
                    )}
                  </motion.div>
                ))}
              </div>

              {selectedTeamForSquad && (
                <SquadManagementModal 
                  team={selectedTeamForSquad}
                  isOpen={!!selectedTeamForSquad}
                  onClose={() => setSelectedTeamForSquad(null)}
                />
              )}
            </motion.div>
          )}

          {activeTab === 'scanner' && <MatchScanner />}
          {activeTab === 'graphics' && <PosterGenerator />}
          {activeTab === 'stats' && <StatsDashboard />}
        </AnimatePresence>
      </main>
      <SeasonEndModal 
        isOpen={showSeasonEnd}
        winner={standings[0]}
        relegated={standings.slice(-3)}
        onNextSeason={handleNextSeason}
      />
    </div>
  );
}
