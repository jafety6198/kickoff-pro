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
import { cn } from '@/lib/utils';

interface MatchManagementModalProps {
  fixture: Fixture;
  isOpen: boolean;
  onClose: () => void;
}

export function MatchManagementModal({ fixture, isOpen, onClose }: MatchManagementModalProps) {
  const { teams, updateFixtureScore } = useStore();
  
  const [l1Home, setL1Home] = useState<string>(fixture.leg1.homeScore?.toString() || '');
  const [l1Away, setL1Away] = useState<string>(fixture.leg1.awayScore?.toString() || '');
  const [l2Home, setL2Home] = useState<string>(fixture.leg2.homeScore?.toString() || '');
  const [l2Away, setL2Away] = useState<string>(fixture.leg2.awayScore?.toString() || '');
  
  const [activeLeg, setActiveLeg] = useState<1 | 2>(fixture.leg1?.status === 'pending' ? 1 : 2);
  
  const currentLegData = activeLeg === 1 ? fixture.leg1 : fixture.leg2;

  const [stats, setStats] = useState({
    possession_home: currentLegData.stats?.possession_home?.toString() || '',
    possession_away: currentLegData.stats?.possession_away?.toString() || '',
    shots_home: currentLegData.stats?.shots_home?.toString() || '',
    shots_away: currentLegData.stats?.shots_away?.toString() || '',
    shots_on_target_home: currentLegData.stats?.shots_on_target_home?.toString() || '',
    shots_on_target_away: currentLegData.stats?.shots_on_target_away?.toString() || '',
    fouls_home: currentLegData.stats?.fouls_home?.toString() || '',
    fouls_away: currentLegData.stats?.fouls_away?.toString() || '',
    corners_home: currentLegData.stats?.corners_home?.toString() || '',
    corners_away: currentLegData.stats?.corners_away?.toString() || '',
    free_kicks_home: currentLegData.stats?.free_kicks_home?.toString() || '',
    free_kicks_away: currentLegData.stats?.free_kicks_away?.toString() || '',
    passes_home: currentLegData.stats?.passes_home?.toString() || '',
    passes_away: currentLegData.stats?.passes_away?.toString() || '',
    successful_passes_home: currentLegData.stats?.successful_passes_home?.toString() || '',
    successful_passes_away: currentLegData.stats?.successful_passes_away?.toString() || '',
    crosses_home: currentLegData.stats?.crosses_home?.toString() || '',
    crosses_away: currentLegData.stats?.crosses_away?.toString() || '',
    interceptions_home: currentLegData.stats?.interceptions_home?.toString() || '',
    interceptions_away: currentLegData.stats?.interceptions_away?.toString() || '',
    tackles_home: currentLegData.stats?.tackles_home?.toString() || '',
    tackles_away: currentLegData.stats?.tackles_away?.toString() || '',
    saves_home: currentLegData.stats?.saves_home?.toString() || '',
    saves_away: currentLegData.stats?.saves_away?.toString() || '',
  });

  const homeTeam = teams.find(t => t.id === fixture.homeTeamId);
  const awayTeam = teams.find(t => t.id === fixture.awayTeamId);

  const handleStatChange = (key: keyof typeof stats, value: string) => {
    setStats(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    const h1 = parseInt(l1Home);
    const a1 = parseInt(l1Away);
    const h2 = parseInt(l2Home);
    const a2 = parseInt(l2Away);

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

    if (!isNaN(h1) && !isNaN(a1)) {
      updateFixtureScore(fixture.id, 1, h1, a1, activeLeg === 1 ? parsedStats : fixture.leg1.stats);
    }
    
    if (!isNaN(h2) && !isNaN(a2)) {
      updateFixtureScore(fixture.id, 2, h2, a2, activeLeg === 2 ? parsedStats : fixture.leg2.stats);
    }

    toast.success('Match results updated!');
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
          </DialogHeader>

          <div className="space-y-10">
            {/* Score Entry Area */}
            <div className="space-y-6">
              {/* Leg 1 */}
              <div className={cn(
                "p-6 rounded-[32px] border transition-all space-y-4 cursor-pointer",
                activeLeg === 1 ? "bg-white border-primary/20 shadow-md ring-2 ring-primary/5" : "bg-white/50 border-slate-100 opacity-60"
              )}
              onClick={() => setActiveLeg(1)}
              >
                <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Leg 1 • Home Match</span>
                  {activeLeg === 1 && <Badge className="bg-primary text-white border-none text-[8px] font-black uppercase tracking-tighter shadow-sm">Recording Statistics</Badge>}
                </div>
                
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 flex flex-col items-center gap-2">
                    <img src={homeTeam?.logo} className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
                    <span className="text-[10px] font-bold text-slate-900 uppercase truncate w-full text-center">{homeTeam?.name}</span>
                    <Input 
                      type="number" 
                      value={l1Home}
                      onChange={(e) => setL1Home(e.target.value)}
                      className="w-16 h-16 text-center text-2xl font-black rounded-2xl bg-slate-50 border-none focus:ring-primary/20"
                      placeholder="-"
                    />
                  </div>
                  <div className="text-xl font-black text-slate-200 italic">VS</div>
                  <div className="flex-1 flex flex-col items-center gap-2">
                    <img src={awayTeam?.logo} className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
                    <span className="text-[10px] font-bold text-slate-900 uppercase truncate w-full text-center">{awayTeam?.name}</span>
                    <Input 
                      type="number" 
                      value={l1Away}
                      onChange={(e) => setL1Away(e.target.value)}
                      className="w-16 h-16 text-center text-2xl font-black rounded-2xl bg-slate-50 border-none focus:ring-primary/20"
                      placeholder="-"
                    />
                  </div>
                </div>
              </div>

              {/* Leg 2 */}
              <div className={cn(
                "p-6 rounded-[32px] border transition-all space-y-4 cursor-pointer",
                activeLeg === 2 ? "bg-white border-primary/20 shadow-md ring-2 ring-primary/5" : "bg-white/50 border-slate-100 opacity-60"
              )}
              onClick={() => setActiveLeg(2)}
              >
                <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Leg 2 • Away Match</span>
                  {activeLeg === 2 && <Badge className="bg-primary text-white border-none text-[8px] font-black uppercase tracking-tighter shadow-sm">Recording Statistics</Badge>}
                </div>
                
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 flex flex-col items-center gap-2">
                    <img src={awayTeam?.logo} className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
                    <span className="text-[10px] font-bold text-slate-900 uppercase truncate w-full text-center">{awayTeam?.name}</span>
                    <Input 
                      type="number" 
                      value={l2Home}
                      onChange={(e) => setL2Home(e.target.value)}
                      className="w-16 h-16 text-center text-2xl font-black rounded-2xl bg-slate-50 border-none focus:ring-primary/20"
                      placeholder="-"
                    />
                  </div>
                  <div className="text-xl font-black text-slate-200 italic">VS</div>
                  <div className="flex-1 flex flex-col items-center gap-2">
                    <img src={homeTeam?.logo} className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
                    <span className="text-[10px] font-bold text-slate-900 uppercase truncate w-full text-center">{homeTeam?.name}</span>
                    <Input 
                      type="number" 
                      value={l2Away}
                      onChange={(e) => setL2Away(e.target.value)}
                      className="w-16 h-16 text-center text-2xl font-black rounded-2xl bg-slate-50 border-none focus:ring-primary/20"
                      placeholder="-"
                    />
                  </div>
                </div>
              </div>

              {/* Aggregate Score Display */}
              {(l1Home || l1Away || l2Home || l2Away) && (
                <div className="text-center">
                  <div className="inline-block px-6 py-2 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] italic">
                    Aggregate: {parseInt(l1Home || '0') + parseInt(l2Away || '0')} - {parseInt(l1Away || '0') + parseInt(l2Home || '0')}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Match Statistics</h4>
                <span className="text-[10px] font-bold text-primary uppercase">Managing Leg {activeLeg}</span>
              </div>
              
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
