import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStore, Fixture } from '@/store/useStore';
import { Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface MatchManagementModalProps {
  fixture: Fixture;
  isOpen: boolean;
  onClose: () => void;
}

export function MatchManagementModal({ fixture, isOpen, onClose }: MatchManagementModalProps) {
  const { teams, updateFixtureScore } = useStore();
  const [homeScore, setHomeScore] = useState<string>(fixture.homeScore?.toString() || '');
  const [awayScore, setAwayScore] = useState<string>(fixture.awayScore?.toString() || '');
  const [homeScore2, setHomeScore2] = useState<string>(fixture.homeScore2?.toString() || '');
  const [awayScore2, setAwayScore2] = useState<string>(fixture.awayScore2?.toString() || '');
  
  const [stats, setStats] = useState({
    possession_home: fixture.stats?.possession_home?.toString() || '',
    possession_away: fixture.stats?.possession_away?.toString() || '',
    shots_home: fixture.stats?.shots_home?.toString() || '',
    shots_away: fixture.stats?.shots_away?.toString() || '',
    shots_on_target_home: fixture.stats?.shots_on_target_home?.toString() || '',
    shots_on_target_away: fixture.stats?.shots_on_target_away?.toString() || '',
    fouls_home: fixture.stats?.fouls_home?.toString() || '',
    fouls_away: fixture.stats?.fouls_away?.toString() || '',
    corners_home: fixture.stats?.corners_home?.toString() || '',
    corners_away: fixture.stats?.corners_away?.toString() || '',
    free_kicks_home: fixture.stats?.free_kicks_home?.toString() || '',
    free_kicks_away: fixture.stats?.free_kicks_away?.toString() || '',
    passes_home: fixture.stats?.passes_home?.toString() || '',
    passes_away: fixture.stats?.passes_away?.toString() || '',
    successful_passes_home: fixture.stats?.successful_passes_home?.toString() || '',
    successful_passes_away: fixture.stats?.successful_passes_away?.toString() || '',
    crosses_home: fixture.stats?.crosses_home?.toString() || '',
    crosses_away: fixture.stats?.crosses_away?.toString() || '',
    interceptions_home: fixture.stats?.interceptions_home?.toString() || '',
    interceptions_away: fixture.stats?.interceptions_away?.toString() || '',
    tackles_home: fixture.stats?.tackles_home?.toString() || '',
    tackles_away: fixture.stats?.tackles_away?.toString() || '',
    saves_home: fixture.stats?.saves_home?.toString() || '',
    saves_away: fixture.stats?.saves_away?.toString() || '',
  });

  const homeTeam = teams.find(t => t.id === fixture.homeTeamId);
  const awayTeam = teams.find(t => t.id === fixture.awayTeamId);

  const handleStatChange = (key: keyof typeof stats, value: string) => {
    setStats(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    const h1 = homeScore !== '' ? parseInt(homeScore) : null;
    const a1 = awayScore !== '' ? parseInt(awayScore) : null;
    const h2 = homeScore2 !== '' ? parseInt(homeScore2) : null;
    const a2 = awayScore2 !== '' ? parseInt(awayScore2) : null;
    
    if ((homeScore !== '' && isNaN(h1!)) || (awayScore !== '' && isNaN(a1!)) || 
        (homeScore2 !== '' && isNaN(h2!)) || (awayScore2 !== '' && isNaN(a2!))) {
      toast.error('Please enter valid scores');
      return;
    }
    
    const parsedStats = {
      possession_home: parseInt(stats.possession_home) || 0,
      possession_away: parseInt(stats.possession_away) || 0,
      shots_home: parseInt(stats.shots_home) || 0,
      shots_away: parseInt(stats.shots_away) || 0,
      shots_on_target_home: parseInt(stats.shots_on_target_home) || 0,
      shots_on_target_away: parseInt(stats.shots_on_target_away) || 0,
      fouls_home: parseInt(stats.fouls_home) || 0,
      fouls_away: parseInt(stats.fouls_away) || 0,
      corners_home: parseInt(stats.corners_home) || 0,
      corners_away: parseInt(stats.corners_away) || 0,
      free_kicks_home: parseInt(stats.free_kicks_home) || 0,
      free_kicks_away: parseInt(stats.free_kicks_away) || 0,
      passes_home: parseInt(stats.passes_home) || 0,
      passes_away: parseInt(stats.passes_away) || 0,
      successful_passes_home: parseInt(stats.successful_passes_home) || 0,
      successful_passes_away: parseInt(stats.successful_passes_away) || 0,
      crosses_home: parseInt(stats.crosses_home) || 0,
      crosses_away: parseInt(stats.crosses_away) || 0,
      interceptions_home: parseInt(stats.interceptions_home) || 0,
      interceptions_away: parseInt(stats.interceptions_away) || 0,
      tackles_home: parseInt(stats.tackles_home) || 0,
      tackles_away: parseInt(stats.tackles_away) || 0,
      saves_home: parseInt(stats.saves_home) || 0,
      saves_away: parseInt(stats.saves_away) || 0,
    };

    updateFixtureScore(fixture.id, h1, a1, h2, a2, parsedStats);
    toast.success('Match result updated!');
    onClose();
  };

  const statFields = [
    { label: 'Possession (%)', homeKey: 'possession_home', awayKey: 'possession_away' },
    { label: 'Shots', homeKey: 'shots_home', awayKey: 'shots_away' },
    { label: 'Shots on Target', homeKey: 'shots_on_target_home', awayKey: 'shots_on_target_away' },
    { label: 'Fouls', homeKey: 'fouls_home', awayKey: 'fouls_away' },
    { label: 'Corner Kicks', homeKey: 'corners_home', awayKey: 'corners_away' },
    { label: 'Free Kicks', homeKey: 'free_kicks_home', awayKey: 'free_kicks_away' },
    { label: 'Passes', homeKey: 'passes_home', awayKey: 'passes_away' },
    { label: 'Successful Passes', homeKey: 'successful_passes_home', awayKey: 'successful_passes_away' },
    { label: 'Crosses', homeKey: 'crosses_home', awayKey: 'crosses_away' },
    { label: 'Interceptions', homeKey: 'interceptions_home', awayKey: 'interceptions_away' },
    { label: 'Tackles', homeKey: 'tackles_home', awayKey: 'tackles_away' },
    { label: 'Saves', homeKey: 'saves_home', awayKey: 'saves_away' },
  ] as const;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0 rounded-[32px] border-none bg-slate-50">
        <div className="p-6 sm:p-8 space-y-8">
          <DialogHeader>
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline" className="border-primary/20 text-primary font-black uppercase tracking-widest text-[10px]">
                Round {fixture.round} • Match Management
              </Badge>
              <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <DialogTitle className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">
              Record Result
            </DialogTitle>
            <DialogDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
              Enter scores and match statistics manually
            </DialogDescription>
          </DialogHeader>          <div className="space-y-10">
            {/* Leg 1: Home Match */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-center">Leg 1: Home Match</h4>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 flex flex-col items-center text-center space-y-3">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border border-slate-100 p-2.5 shadow-sm">
                    <img src={homeTeam?.logo} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                  <p className="font-black text-slate-900 uppercase tracking-tighter text-[10px] truncate w-full">{homeTeam?.name}</p>
                  <Input 
                    type="number" 
                    value={homeScore}
                    onChange={(e) => setHomeScore(e.target.value)}
                    className="w-14 h-14 sm:w-16 sm:h-16 text-center text-2xl font-black rounded-2xl bg-white border-slate-200 focus:ring-primary/20"
                    placeholder="-"
                  />
                </div>

                <div className="text-xl font-black text-slate-200 italic pt-12">VS</div>

                <div className="flex-1 flex flex-col items-center text-center space-y-3">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border border-slate-100 p-2.5 shadow-sm">
                    <img src={awayTeam?.logo} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                  <p className="font-black text-slate-900 uppercase tracking-tighter text-[10px] truncate w-full">{awayTeam?.name}</p>
                  <Input 
                    type="number" 
                    value={awayScore}
                    onChange={(e) => setAwayScore(e.target.value)}
                    className="w-14 h-14 sm:w-16 sm:h-16 text-center text-2xl font-black rounded-2xl bg-white border-slate-200 focus:ring-primary/20"
                    placeholder="-"
                  />
                </div>
              </div>
            </div>

            {/* Leg 2: Away Match */}
            <div className="space-y-4 p-6 bg-slate-100 rounded-3xl border border-slate-200/50">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-center">Leg 2: Away Match</h4>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 flex flex-col items-center text-center space-y-3">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border border-slate-100 p-2.5 shadow-sm">
                    <img src={awayTeam?.logo} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                  <p className="font-black text-slate-900 uppercase tracking-tighter text-[10px] truncate w-full">{awayTeam?.name}</p>
                  <Input 
                    type="number" 
                    value={awayScore2}
                    onChange={(e) => setAwayScore2(e.target.value)}
                    className="w-14 h-14 sm:w-16 sm:h-16 text-center text-2xl font-black rounded-2xl bg-white border-slate-200 focus:ring-primary/20"
                    placeholder="-"
                  />
                </div>

                <div className="text-xl font-black text-slate-200 italic pt-12">VS</div>

                <div className="flex-1 flex flex-col items-center text-center space-y-3">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border border-slate-100 p-2.5 shadow-sm">
                    <img src={homeTeam?.logo} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                  <p className="font-black text-slate-900 uppercase tracking-tighter text-[10px] truncate w-full">{homeTeam?.name}</p>
                  <Input 
                    type="number" 
                    value={homeScore2}
                    onChange={(e) => setHomeScore2(e.target.value)}
                    className="w-14 h-14 sm:w-16 sm:h-16 text-center text-2xl font-black rounded-2xl bg-white border-slate-200 focus:ring-primary/20"
                    placeholder="-"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-2">Match Statistics</h4>
              
              {statFields.map((field) => (
                <div key={field.label} className="flex items-center justify-between gap-4">
                  <Input
                    type="number"
                    value={stats[field.homeKey]}
                    onChange={(e) => handleStatChange(field.homeKey, e.target.value)}
                    className="w-20 text-center font-bold bg-white"
                    placeholder="0"
                  />
                  <span className="flex-1 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">{field.label}</span>
                  <Input
                    type="number"
                    value={stats[field.awayKey]}
                    onChange={(e) => handleStatChange(field.awayKey, e.target.value)}
                    className="w-20 text-center font-bold bg-white"
                    placeholder="0"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-4 pt-4">
              <Button 
                variant="outline" 
                onClick={onClose}
                className="flex-1 h-14 rounded-2xl border-slate-200 text-slate-400 font-black uppercase tracking-widest"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                className="flex-1 h-14 rounded-2xl bg-gradient-primary text-white font-black uppercase tracking-widest shadow-xl shadow-primary/20"
              >
                <Save className="w-5 h-5 mr-2" /> Save Result
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
