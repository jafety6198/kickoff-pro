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
  Edit3,
  Sparkles,
  Loader2,
  Zap,
  Newspaper,
  Cpu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStore, Fixture, Team, Role } from '@/store/useStore';
import { calculateStandings } from '@/lib/tournament-engine';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { TacticalHub } from './TacticalHub';
import { TacticalTeamHub } from './TacticalTeamHub';
import { AILeagueGraphicsEngine } from './AILeagueGraphicsEngine';
import { PosterGenerator } from '../graphics/PosterGenerator';
import { AIOracle } from './AIOracle';
import { MatchManagementModal } from './MatchManagementModal';
import { SquadManagementModal } from './SquadManagementModal';
import { TeamManagementModal } from './TeamManagementModal';
import { StatsDashboard } from './StatsDashboard';
import { SeasonEndModal } from './SeasonEndModal';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { calculateLocalPrediction } from '@/lib/predictor';

interface FixtureCardProps {
  key?: string;
  fixture: Fixture;
  teams: Team[];
  fixtures: Fixture[];
  role: Role;
  updateFixtureScore: (fixtureId: string, leg: 1 | 2, homeScore: number, awayScore: number) => void;
  updateFixturePrediction: (fixtureId: string, prediction: Fixture['prediction']) => void;
  onTeamClick?: (team: Team) => void;
}

function FixtureCard({ fixture, teams, fixtures, role, updateFixtureScore, updateFixturePrediction, onTeamClick }: FixtureCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const { tournamentName } = useStore();
  const homeTeam = teams.find(t => t.id === fixture.homeTeamId);
  const awayTeam = teams.find(t => t.id === fixture.awayTeamId);

  const status = useMemo(() => {
    const l1Finished = fixture.leg1?.status === 'finished';
    const l2Finished = fixture.leg2?.status === 'finished';
    if (l1Finished && l2Finished) return 'completed';
    if (l1Finished) return 'in-progress';
    return 'pending';
  }, [fixture.leg1?.status, fixture.leg2?.status]);

  const handlePredict = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!homeTeam || !awayTeam) return;

    try {
      setPredicting(true);
      
      // Simulate a small delay for "thinking" effect
      await new Promise(resolve => setTimeout(resolve, 500));

      const prediction = calculateLocalPrediction(homeTeam, awayTeam, fixtures);
      
      if (prediction.homeScore !== undefined) {
        updateFixturePrediction(fixture.id, prediction);
        toast.success(`Predicted: ${homeTeam.name} ${prediction.homeScore} - ${prediction.awayScore} ${awayTeam.name}`);
      }
    } catch (error) {
      console.error('Prediction Error:', error);
      toast.error('Prediction engine encountered an error.');
    } finally {
      setPredicting(false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // Prevent expanding/modal if a team link was clicked
    if ((e.target as HTMLElement).closest('.team-link')) return;

    if (role === 'admin') {
      setIsModalOpen(true);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const isFinished = fixture.leg1?.status === 'finished' && fixture.leg2?.status === 'finished';

  return (
    <>
      <motion.div 
        layout
        onClick={handleClick}
        className={cn(
          "relative overflow-hidden border rounded-2xl cursor-pointer group transition-all duration-500",
          status === 'completed' && "bg-green-50 border-green-500 shadow-lg shadow-green-500/10",
          status === 'in-progress' && "bg-amber-50 border-amber-400 shadow-lg shadow-amber-500/10",
          status === 'pending' && "bg-white border-slate-200",
          role === 'admin' 
            ? "hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10" 
            : "hover:border-slate-400 hover:shadow-xl"
        )}
      >
        {/* Decorative Background Element */}
        <div className={cn(
          "absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700",
          status === 'completed' ? "bg-green-100/50" : status === 'in-progress' ? "bg-amber-100/50" : "bg-slate-50"
        )} />
        
        <div className="relative p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Home Team */}
            <div className="flex flex-col items-center sm:items-end gap-3 flex-1 w-full sm:w-auto">
              <div 
                onClick={(e) => {
                  if (role === 'admin' && homeTeam) {
                    onTeamClick?.(homeTeam);
                  }
                }}
                className={cn(
                  "w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-white p-2.5 border border-slate-100 shadow-inner transition-transform duration-500",
                  role === 'admin' ? "team-link cursor-pointer hover:scale-110 hover:border-primary/30" : "group-hover:scale-110"
                )}
              >
                <img 
                  src={homeTeam?.logo} 
                  className="w-full h-full object-contain" 
                  referrerPolicy="no-referrer" 
                  onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${homeTeam?.name.replace(' ', '+')}&background=random`; }}
                />
              </div>
              <div className="text-center sm:text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Home</p>
                <h4 className={cn(
                  "font-black text-sm sm:text-base uppercase tracking-tight italic leading-tight transition-colors",
                  role === 'admin' ? "team-link cursor-pointer hover:text-primary" : "text-slate-900"
                )}
                onClick={(e) => {
                  if (role === 'admin' && homeTeam) {
                    onTeamClick?.(homeTeam);
                  }
                }}
                >
                  {homeTeam?.name}
                </h4>
              </div>
            </div>
            
            {/* Leg Scores Center */}
            <div className="flex flex-col items-center justify-center gap-2 min-w-[200px]">
              <div className="flex items-center gap-3">
                {/* Leg 1 */}
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Leg 1</span>
                  <div className={cn(
                    "px-4 py-2 rounded-xl flex items-center justify-center font-black text-xl italic min-w-[60px]",
                    fixture.leg1?.status === 'finished' ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"
                  )}>
                    {fixture.leg1?.status === 'finished' ? `${fixture.leg1?.homeScore}-${fixture.leg1?.awayScore}` : "20:00"}
                  </div>
                </div>

                {/* Leg 2 */}
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Leg 2</span>
                  <div className={cn(
                    "px-4 py-2 rounded-xl flex items-center justify-center font-black text-xl italic min-w-[60px]",
                    fixture.leg2?.status === 'finished' ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"
                  )}>
                    {fixture.leg2?.status === 'finished' ? `${fixture.leg2?.homeScore}-${fixture.leg2?.awayScore}` : "20:00"}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <span className={cn(
                  "text-[8px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-full",
                  status === 'completed' ? "bg-green-100 text-green-600" : status === 'in-progress' ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-400"
                )}>
                  {status === 'completed' ? 'Completed' : status === 'in-progress' ? 'In Progress' : 'Pending'}
                </span>
              </div>
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center sm:items-start gap-3 flex-1 w-full sm:w-auto">
              <div 
                onClick={(e) => {
                  if (role === 'admin' && awayTeam) {
                    onTeamClick?.(awayTeam);
                  }
                }}
                className={cn(
                  "w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-slate-50 p-2.5 border border-slate-100 shadow-inner transition-transform duration-500",
                  role === 'admin' ? "team-link cursor-pointer hover:scale-110 hover:border-primary/30" : "group-hover:scale-110"
                )}
              >
                <img 
                  src={awayTeam?.logo} 
                  className="w-full h-full object-contain" 
                  referrerPolicy="no-referrer" 
                  onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${awayTeam?.name.replace(' ', '+')}&background=random`; }}
                />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Away</p>
                <h4 className={cn(
                  "font-black text-sm sm:text-base uppercase tracking-tight italic leading-tight transition-colors",
                  role === 'admin' ? "team-link cursor-pointer hover:text-primary" : "text-slate-900"
                )}
                onClick={(e) => {
                  if (role === 'admin' && awayTeam) {
                    onTeamClick?.(awayTeam);
                  }
                }}
                >
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
                      <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Aggregate</p>
                      <p className="text-[10px] font-black text-slate-700 uppercase">
                        {(fixture.leg1?.homeScore || 0) + (fixture.leg2?.homeScore || 0)} - {(fixture.leg1?.awayScore || 0) + (fixture.leg2?.awayScore || 0)}
                      </p>
                    </div>
                  </div>
                </div>

                {(fixture.leg1?.status === 'finished' || fixture.leg2?.status === 'finished') && (
                  <div className="space-y-3">
                    <h6 className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Aggregate Statistics</h6>
                    <div className="space-y-4">
                      {/* Combined Possession */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
                          <span>{Math.round(((fixture.leg1.stats.possession_home || 50) + (fixture.leg2.stats.possession_away || 50)) / 2)}%</span>
                          <span className="uppercase tracking-widest opacity-50">Possession</span>
                          <span>{Math.round(((fixture.leg1.stats.possession_away || 50) + (fixture.leg2.stats.possession_home || 50)) / 2)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                          <div className="h-full bg-slate-900" style={{ width: `${Math.round(((fixture.leg1.stats.possession_home || 50) + (fixture.leg2.stats.possession_away || 50)) / 2)}%` }} />
                          <div className="h-full bg-slate-300" style={{ width: `${Math.round(((fixture.leg1.stats.possession_away || 50) + (fixture.leg2.stats.possession_home || 50)) / 2)}%` }} />
                        </div>
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
  const [activeTab, setActiveTab] = useState<'standings' | 'fixtures' | 'tactical-hub' | 'team-hub' | 'stats' | 'oracle' | 'graphics-engine' | 'graphics'>('standings');
  const [selectedTeamForSquad, setSelectedTeamForSquad] = useState<Team | null>(null);
  const [selectedTeamForProfile, setSelectedTeamForProfile] = useState<Team | null>(null);
  const standings = useMemo(() => calculateStandings(teams, fixtures), [teams, fixtures]);
  
  const isSeasonFinished = useMemo(() => {
    return fixtures.length > 0 && fixtures.every(f => f.leg1?.status === 'finished' && f.leg2?.status === 'finished');
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
            { id: 'tactical-hub', label: 'AI News Room', icon: Newspaper },
            { id: 'team-hub', label: 'Tactical Scout', icon: Users },
            { id: 'stats', label: 'Leagues Stats', icon: BarChart3 },
            { id: 'oracle', label: 'AI Oracle', icon: Sparkles, adminOnly: true },
            { id: 'graphics', label: 'Poster Creator', icon: ImageIcon },
            { id: 'graphics-engine', label: 'Graphic Suite', icon: Cpu },
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
          { id: 'tactical-hub', icon: Newspaper },
          { id: 'team-hub', icon: Users },
          { id: 'stats', icon: BarChart3 },
          { id: 'oracle', icon: Sparkles, adminOnly: true },
          { id: 'graphics', icon: ImageIcon },
        ].filter((item: any) => !item.adminOnly || role === 'admin').map((item: any) => {
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
        "flex-1 overflow-y-auto no-scrollbar pb-24 md:pb-8 p-4 sm:p-8"
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
                <div className="space-y-1">
                  <h2 className="text-3xl sm:text-4xl font-black text-slate-900 uppercase tracking-tighter italic">League Standings</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Season 2024/25 • Live Competition</p>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Live Updates</span>
                </div>
              </div>

              <div className="relative glass-card overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left min-w-[800px]">
                    <thead>
                      <tr className="bg-slate-50/50 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-100">
                        <th className="px-6 py-5 text-center w-20">POS</th>
                        <th className="px-6 py-5">TEAM</th>
                        <th className="px-4 py-5 text-center">PL</th>
                        <th className="px-4 py-5 text-center">W</th>
                        <th className="px-4 py-5 text-center">D</th>
                        <th className="px-4 py-5 text-center">L</th>
                        <th className="px-4 py-5 text-center">GF</th>
                        <th className="px-4 py-5 text-center">GA</th>
                        <th className="px-4 py-5 text-center">GD</th>
                        <th className="px-6 py-5 text-center w-40">FORM</th>
                        <th className="px-8 py-5 text-right w-24">PTS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {standings.map((team, i) => {
                        const isTopThree = i < 3;
                        const rankColor = i === 0 ? 'text-amber-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-orange-400' : 'text-slate-400';
                        const bgColor = i === 0 ? 'bg-amber-50/30' : i === 1 ? 'bg-slate-50/30' : i === 2 ? 'bg-orange-50/30' : 'bg-transparent';

                        return (
                          <motion.tr 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            key={team.id} 
                            className={cn(
                              "group hover:bg-slate-100/50 transition-colors relative",
                              bgColor
                            )}
                          >
                            <td className="px-6 py-5 text-center">
                              <div className="flex items-center justify-center">
                                <span className={cn(
                                  "text-2xl font-black italic tracking-tighter tabular-nums",
                                  isTopThree ? rankColor : "text-slate-900 opacity-20"
                                )}>
                                  {i + 1}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div 
                                className={cn(
                                  "flex items-center gap-4",
                                  role === 'admin' && "cursor-pointer hover:text-primary transition-all group/team"
                                )}
                                onClick={() => {
                                  if (role === 'admin') {
                                    setSelectedTeamForProfile(team);
                                  }
                                }}
                              >
                                <div className="relative">
                                  <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-slate-100 p-2 flex items-center justify-center transition-transform group-hover/team:scale-110">
                                    <img src={team.logo} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                                  </div>
                                  {i === 0 && (
                                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center shadow-lg">
                                      <Trophy className="w-3 h-3 text-white" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-base font-black uppercase tracking-tight text-slate-900">{team.name}</span>
                                  {isTopThree && (
                                    <span className={cn("text-[9px] font-bold uppercase tracking-widest", rankColor)}>
                                      {i === 0 ? 'League Leader' : i === 1 ? 'Title Contender' : 'Champions Zone'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-5 text-center text-sm font-bold text-slate-600 tabular-nums">{team.played}</td>
                            <td className="px-4 py-5 text-center text-sm font-bold text-slate-600 tabular-nums">{team.won}</td>
                            <td className="px-4 py-5 text-center text-sm font-bold text-slate-600 tabular-nums">{team.drawn}</td>
                            <td className="px-4 py-5 text-center text-sm font-bold text-slate-600 tabular-nums">{team.lost}</td>
                            <td className="px-4 py-5 text-center text-sm font-bold text-slate-400 tabular-nums opacity-60">{team.gf}</td>
                            <td className="px-4 py-5 text-center text-sm font-bold text-slate-400 tabular-nums opacity-60">{team.ga}</td>
                            <td className={cn(
                              "px-4 py-5 text-center text-sm font-black tabular-nums",
                              team.gd > 0 ? "text-green-600" : team.gd < 0 ? "text-red-600" : "text-slate-400"
                            )}>
                              {team.gd > 0 ? `+${team.gd}` : team.gd}
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex items-center justify-center gap-1.5">
                                {team.form?.map((result, idx) => (
                                  <div key={idx} className={cn(
                                    "w-6 h-6 flex items-center justify-center text-[9px] font-black rounded-md text-white shadow-sm transition-transform hover:scale-110",
                                    result === 'W' ? "bg-green-500" : result === 'D' ? "bg-slate-400" : "bg-red-500"
                                  )}>
                                    {result}
                                  </div>
                                ))}
                                {(!team.form || team.form.length === 0) && (
                                  <span className="text-[10px] font-black text-slate-300 uppercase italic tracking-widest">No Matches</span>
                                )}
                              </div>
                            </td>
                            <td className="px-8 py-5 text-right font-black text-2xl italic tracking-tighter text-slate-900 tabular-nums drop-shadow-sm">
                              {team.pts}
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                {/* Visual Legend */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Winner / Champions League</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-slate-300" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Europa League Spot</span>
                  </div>
                </div>
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
                            fixtures={fixtures}
                            role={role}
                            updateFixtureScore={updateFixtureScore}
                            updateFixturePrediction={useStore.getState().updateFixturePrediction}
                            onTeamClick={setSelectedTeamForProfile}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'tactical-hub' && (
            <motion.div
              key="tactical-hub"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6 sm:space-y-8"
            >
              <TacticalHub />
            </motion.div>
          )}

          {activeTab === 'team-hub' && (
            <motion.div
              key="team-hub"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <TacticalTeamHub />
            </motion.div>
          )}

          {activeTab === 'oracle' && <AIOracle />}
          {activeTab === 'graphics-engine' && <AILeagueGraphicsEngine />}
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
      
      {selectedTeamForProfile && (
        <TeamManagementModal 
          team={standings.find(t => t.id === selectedTeamForProfile.id) || selectedTeamForProfile}
          isOpen={!!selectedTeamForProfile}
          onClose={() => setSelectedTeamForProfile(null)}
        />
      )}
    </div>
  );
}
