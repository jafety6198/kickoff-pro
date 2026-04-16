import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Users, ChevronRight, ChevronLeft, RefreshCw, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStore, Team } from '@/store/useStore';
import { generateRoundRobinFixtures } from '@/lib/tournament-engine';
import { toast } from 'sonner';

const EPL_TEAMS = [
  { id: '42', name: 'Arsenal' },
  { id: '66', name: 'Aston Villa' },
  { id: '35', name: 'Bournemouth' },
  { id: '55', name: 'Brentford' },
  { id: '51', name: 'Brighton' },
  { id: '49', name: 'Chelsea' },
  { id: '52', name: 'Crystal Palace' },
  { id: '45', name: 'Everton' },
  { id: '36', name: 'Fulham' },
  { id: '57', name: 'Ipswich' },
  { id: '46', name: 'Leicester' },
  { id: '40', name: 'Liverpool' },
  { id: '50', name: 'Man City' },
  { id: '33', name: 'Man United' },
  { id: '34', name: 'Newcastle' },
  { id: '65', name: 'Nottingham' },
  { id: '41', name: 'Southampton' },
  { id: '47', name: 'Tottenham' },
  { id: '48', name: 'West Ham' },
  { id: '39', name: 'Wolves' },
];

export function TeamEditor() {
  const { teamCount, setTeams, setFixtures, setStep, mode } = useStore();
  const [localTeams, setLocalTeams] = useState<Team[]>([]);

  useEffect(() => {
    const initialTeams: Team[] = Array.from({ length: teamCount }, (_, i) => {
      const eplTeam = EPL_TEAMS[i % EPL_TEAMS.length];
      return {
        id: crypto.randomUUID(),
        name: eplTeam.name,
        logo: `https://media.api-sports.io/football/teams/${eplTeam.id}.png`,
        played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0
      };
    });
    setLocalTeams(initialTeams);
  }, [teamCount]);

  const updateTeamName = (id: string, name: string) => {
    setLocalTeams(prev => prev.map(t => t.id === id ? { ...t, name } : t));
  };

  const handleComplete = () => {
    setTeams(localTeams);
    if (mode === 'league') {
      const fixtures = generateRoundRobinFixtures(localTeams);
      setFixtures(fixtures);
    }
    setStep('dashboard');
    toast.success('Tournament initialized!');
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-12 space-y-8 sm:space-y-12 max-w-7xl mx-auto bg-slate-50">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 uppercase tracking-tighter italic">Team Editor</h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] sm:text-xs">Customize your participants before the season starts</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
          <Button 
            variant="outline"
            onClick={() => setStep('profiles')}
            className="h-12 sm:h-14 rounded-2xl border-slate-200 text-slate-600 font-black uppercase tracking-widest px-8 w-full sm:w-auto"
          >
            <ChevronLeft className="w-5 h-5 mr-2" /> Back to Hub
          </Button>
          <Button 
            onClick={handleComplete}
            className="h-12 sm:h-14 rounded-2xl bg-gradient-primary text-white font-black uppercase tracking-widest px-8 hover:opacity-90 shadow-2xl shadow-primary/20 w-full sm:w-auto"
          >
            Start Season <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {localTeams.map((team, i) => (
          <motion.div
            key={team.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-5 sm:p-6 space-y-6 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Club {i + 1}</span>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-100 p-2 border border-slate-200 group-hover:scale-110 transition-transform">
                <img 
                  src={team.logo} 
                  alt={team.name} 
                  className="w-full h-full object-contain" 
                  referrerPolicy="no-referrer" 
                  onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${team.name.replace(' ', '+')}&background=random`; }}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Club Name</label>
              <div className="relative">
                <Edit3 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <Input 
                  value={team.name}
                  onChange={(e) => updateTeamName(team.id, e.target.value)}
                  className="glass-input w-full pl-12 font-bold text-slate-900"
                  placeholder="Enter club name..."
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
