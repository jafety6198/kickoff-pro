import React, { useState, useRef } from 'react';
import { Scan, Upload, Loader2, CheckCircle2, AlertCircle, FileText, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SquadScanner } from './SquadScanner';
import { scanMatchStats, ScannedMatchResult } from '@/lib/match-scanner';

export function MatchScanner() {
  const { teams, fixtures, updateFixtureScore, updateTeam } = useStore();
  const [activeMode, setActiveMode] = useState<'stats' | 'squad'>('stats');
  const [image, setImage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScannedMatchResult | null>(null);
  const [mapping, setMapping] = useState<{ homeTeamId: string; awayTeamId: string }>({ homeTeamId: '', awayTeamId: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startScan = async () => {
    if (!image) return;

    try {
      setScanning(true);
      setResult(null);

      const base64Data = image.split(',')[1];
      const data = await scanMatchStats(base64Data);
      
      if (!data) {
        throw new Error('Failed to extract match data from image');
      }

      setResult(data);
      
      // Try to auto-map based on handleName if it exists
      const homeTeam = teams.find(t => t.handleName && t.handleName === data.home_handle);
      const awayTeam = teams.find(t => t.handleName && t.handleName === data.away_handle);
      
      setMapping({
        homeTeamId: homeTeam?.id || '',
        awayTeamId: awayTeam?.id || ''
      });

      toast.success('Match stats extracted successfully');
    } catch (error) {
      console.error('OCR Error:', error);
      toast.error(`Failed to parse screenshot: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setScanning(false);
    }
  };

  const saveToStore = async () => {
    if (!result || !mapping.homeTeamId || !mapping.awayTeamId) {
      toast.error('Please map both teams before saving');
      return;
    }

    try {
      setScanning(true);
      
      const homeTeam = teams.find(t => t.id === mapping.homeTeamId);
      const awayTeam = teams.find(t => t.id === mapping.awayTeamId);

      if (!homeTeam || !awayTeam) {
        toast.error('Invalid team mapping');
        return;
      }

      // Update handleNames for future auto-mapping
      updateTeam(homeTeam.id, { handleName: result.home_handle });
      updateTeam(awayTeam.id, { handleName: result.away_handle });

      const fixture = fixtures.find(f => 
        ((f.homeTeamId === homeTeam.id && f.awayTeamId === awayTeam.id) || 
         (f.homeTeamId === awayTeam.id && f.awayTeamId === homeTeam.id)) &&
        (f.leg1.status === 'pending' || f.leg2.status === 'pending')
      );

      if (!fixture) {
        toast.error('No pending fixture found for these clubs');
        return;
      }

      // Determine which leg to update (Leg 1 first, then Leg 2)
      const legToUpdate = fixture.leg1.status === 'pending' ? 1 : 2;

      // Determine which score goes where based on home/away assignment in fixture
      // Remember that roles swap in Leg 2
      const isHomeInLeg = legToUpdate === 1 
        ? fixture.homeTeamId === homeTeam.id 
        : fixture.awayTeamId === homeTeam.id; // Swapped in Leg 2

      const homeScore = isHomeInLeg ? result.score_home : result.score_away;
      const awayScore = isHomeInLeg ? result.score_away : result.score_home;

      const stats: any = {
        possession_home: isHomeInLeg ? result.possession_home : result.possession_away,
        possession_away: isHomeInLeg ? result.possession_away : result.possession_home,
        shots_home: isHomeInLeg ? result.shots_home : result.shots_away,
        shots_away: isHomeInLeg ? result.shots_away : result.shots_home,
        shots_on_target_home: isHomeInLeg ? result.shots_on_target_home : result.shots_on_target_away,
        shots_on_target_away: isHomeInLeg ? result.shots_on_target_away : result.shots_on_target_home,
        passes_home: isHomeInLeg ? result.passes_home : result.passes_away,
        passes_away: isHomeInLeg ? result.passes_away : result.passes_home,
        successful_passes_home: isHomeInLeg ? result.successful_passes_home : result.successful_passes_away,
        successful_passes_away: isHomeInLeg ? result.successful_passes_away : result.successful_passes_home,
        fouls_home: isHomeInLeg ? result.fouls_home : result.fouls_away,
        fouls_away: isHomeInLeg ? result.fouls_away : result.fouls_home,
        offsides_home: isHomeInLeg ? result.offsides_home : result.offsides_away,
        offsides_away: isHomeInLeg ? result.offsides_away : result.offsides_home,
        corners_home: isHomeInLeg ? result.corners_home : result.corners_away,
        corners_away: isHomeInLeg ? result.corners_away : result.corners_home,
        free_kicks_home: isHomeInLeg ? result.free_kicks_home : result.free_kicks_away,
        free_kicks_away: isHomeInLeg ? result.free_kicks_away : result.free_kicks_home,
        crosses_home: isHomeInLeg ? result.crosses_home : result.crosses_away,
        crosses_away: isHomeInLeg ? result.crosses_away : result.crosses_home,
        interceptions_home: isHomeInLeg ? result.interceptions_home : result.interceptions_away,
        interceptions_away: isHomeInLeg ? result.interceptions_away : result.interceptions_home,
        tackles_home: isHomeInLeg ? result.tackles_home : result.tackles_away,
        tackles_away: isHomeInLeg ? result.tackles_away : result.tackles_home,
        saves_home: isHomeInLeg ? result.saves_home : result.saves_away,
        saves_away: isHomeInLeg ? result.saves_away : result.saves_home,
      };

      updateFixtureScore(fixture.id, legToUpdate, homeScore, awayScore, stats);

      // Update player goals and history
      const opponentTeam = homeTeam.id === mapping.homeTeamId ? awayTeam.name : homeTeam.name;
      
      // Group goals by player for this match
      const scorersThisMatch: Record<string, { count: number, teamId: string, name: string }> = {};
      result.scorers.forEach(scorer => {
        const teamId = scorer.team === 'home' ? mapping.homeTeamId : mapping.awayTeamId;
        const key = `${scorer.name.toLowerCase()}_${teamId}`;
        if (!scorersThisMatch[key]) {
          scorersThisMatch[key] = { count: 0, teamId, name: scorer.name };
        }
        scorersThisMatch[key].count++;
      });

      // Update all players in the tournament (those who didn't score get a 0 in history)
      const allPlayers = useStore.getState().players;
      allPlayers.forEach(p => {
        // Only update players from the two teams involved
        if (p.teamId === mapping.homeTeamId || p.teamId === mapping.awayTeamId) {
          const key = `${p.name.toLowerCase()}_${p.teamId}`;
          const goalsScored = scorersThisMatch[key]?.count || 0;
          const oppName = p.teamId === mapping.homeTeamId ? awayTeam.name : homeTeam.name;
          
          const newHistory = [goalsScored, ...(p.goalHistory || [])].slice(0, 5);
          const newOpponents = [oppName, ...(p.lastTeams || [])].slice(0, 5);

          useStore.getState().updatePlayerStats(p.id, { 
            goals: p.goals + goalsScored,
            goalHistory: newHistory,
            lastTeams: newOpponents
          });
          
          // Remove from grouping so we don't add them as "new" later
          delete scorersThisMatch[key];
        }
      });

      // Any remaining in scorersThisMatch are new players
      Object.values(scorersThisMatch).forEach(s => {
        useStore.getState().addPlayer({
          name: s.name,
          teamId: s.teamId,
          goals: s.count,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
          goalHistory: [s.count],
          lastTeams: [s.teamId === mapping.homeTeamId ? awayTeam.name : homeTeam.name]
        });
      });

      toast.success('Match results and player stats updated successfully');
      setResult(null);
      setImage(null);
    } catch (error) {
      console.error('Save Error:', error);
      toast.error('Failed to update tournament');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-8 bg-slate-50">
      {/* Mode Toggle */}
      <div className="flex items-center justify-center">
        <div className="bg-white p-1 rounded-2xl border border-slate-200 flex gap-1 shadow-sm">
          <button 
            onClick={() => setActiveMode('stats')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              activeMode === 'stats' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-400 hover:text-slate-600"
            )}
          >
            Match Stats
          </button>
          <button 
            onClick={() => setActiveMode('squad')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              activeMode === 'squad' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-400 hover:text-slate-600"
            )}
          >
            Squad Tactics
          </button>
        </div>
      </div>

      {activeMode === 'squad' ? (
        <SquadScanner />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="aspect-video glass-card flex flex-col items-center justify-center cursor-pointer group overflow-hidden relative"
            >
              {image ? (
                <img src={image} className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <>
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                  </div>
                  <p className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tighter">Upload Match Stats</p>
                  <p className="text-xs sm:text-sm text-slate-400 font-bold">Drag & drop or click to browse</p>
                </>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*" 
              />
            </div>

            <Button 
              onClick={startScan} 
              disabled={!image || scanning}
              className="w-full py-6 sm:py-8 rounded-[32px] bg-gradient-primary text-white hover:opacity-90 text-lg sm:text-xl font-black uppercase tracking-widest shadow-2xl shadow-primary/20 h-auto transition-all"
            >
              {scanning ? (
                <>
                  <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                  Analyzing with Math Engine...
                </>
              ) : (
                <>
                  <Scan className="w-6 h-6 mr-3" />
                  Start Magic Scanner
                </>
              )}
            </Button>
          </div>

          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-card p-6 sm:p-8 space-y-8 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 sm:p-6">
                    <Badge className="bg-primary/10 text-primary border-none text-[8px] sm:text-[10px] font-black uppercase tracking-widest px-3 sm:px-4 py-1.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3 mr-2" />
                      Scan Complete
                    </Badge>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between text-center gap-4 pt-4">
                    <div className="flex-1 min-w-0 flex flex-col items-center gap-3">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black">Scanned: {result.home_handle}</p>
                      <select 
                        value={mapping.homeTeamId}
                        onChange={(e) => setMapping(prev => ({ ...prev, homeTeamId: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">Select Club...</option>
                        {teams.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-slate-50 border border-slate-100 p-2">
                        <img 
                          src={teams.find(t => t.id === mapping.homeTeamId)?.logo} 
                          className="w-full h-full object-contain" 
                          referrerPolicy="no-referrer" 
                        />
                      </div>
                    </div>
                    <div className="px-6 shrink-0">
                      <div className="text-4xl sm:text-6xl font-black tracking-tighter text-primary italic flex items-center gap-4">
                        <span>{result.score_home}</span>
                        <span className="text-slate-200">:</span>
                        <span>{result.score_away}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col items-center gap-3">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black">Scanned: {result.away_handle}</p>
                      <select 
                        value={mapping.awayTeamId}
                        onChange={(e) => setMapping(prev => ({ ...prev, awayTeamId: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">Select Club...</option>
                        {teams.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-slate-50 border border-slate-100 p-2">
                        <img 
                          src={teams.find(t => t.id === mapping.awayTeamId)?.logo} 
                          className="w-full h-full object-contain" 
                          referrerPolicy="no-referrer" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 sm:p-5 rounded-3xl bg-slate-50 border border-slate-100">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black mb-2">Possession</p>
                      <div className="flex justify-between items-end">
                        <span className="text-xl sm:text-2xl font-black text-slate-900 italic">{result.possession_home}%</span>
                        <span className="text-xl sm:text-2xl font-black text-slate-900 italic">{result.possession_away}%</span>
                      </div>
                    </div>
                    <div className="p-4 sm:p-5 rounded-3xl bg-slate-50 border border-slate-100">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black mb-2">Shots</p>
                      <div className="flex justify-between items-end">
                        <span className="text-xl sm:text-2xl font-black text-slate-900 italic">{result.shots_home}</span>
                        <span className="text-xl sm:text-2xl font-black text-slate-900 italic">{result.shots_away}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black">Match Scorers</p>
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2 no-scrollbar">
                      {result.scorers.map((s: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:bg-slate-100 transition-all">
                          <div className="flex items-center gap-3">
                            <Trophy className="w-4 h-4 text-primary" />
                            <span className="font-black text-sm text-slate-700 uppercase tracking-tight">{s.name}</span>
                          </div>
                          <Badge variant="outline" className="text-[10px] font-black uppercase border-slate-200 text-slate-400 px-3 py-1">
                            {s.team} {s.minute && `• ${s.minute}'`}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button 
                    onClick={saveToStore}
                    className="w-full py-6 rounded-2xl bg-gradient-primary text-white hover:opacity-90 font-black uppercase tracking-widest h-auto shadow-xl shadow-primary/20"
                  >
                    Confirm & Update League
                  </Button>
                </motion.div>
              ) : (
                <div className="h-full glass-card flex flex-col items-center justify-center p-12 text-center">
                  <FileText className="w-16 h-16 text-slate-200 mb-6" />
                  <h3 className="text-2xl font-black text-slate-400 uppercase tracking-tighter">Extraction Results</h3>
                  <p className="text-sm text-slate-300 font-bold mt-2">Upload a match screenshot to see the magic happen</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
