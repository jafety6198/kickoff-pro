import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, 
  Target, 
  Shield, 
  Zap, 
  Map as MapIcon, 
  Trophy,
  Users,
  ChevronRight,
  Sparkles,
  Loader2,
  TrendingUp,
  BrainCircuit,
  Sword,
  Search,
  CheckCircle2,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { useStore, Team, Fixture, ScoutingReport } from '@/store/useStore';
import { calculateStandings } from '@/lib/tournament-engine';
import { GoogleGenAI } from '@google/genai';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// --- TYPES FOR SCOUTING REPORT ---
interface ScoutData {
  team_form_grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  tactical_summary: string;
  player_to_watch: {
    name: string;
    reason: string;
    threat_icon: string;
  };
  opponent_threat_levels: {
    defense: number;
    midfield: number;
    attack: number;
  };
  hype_headlines_sw: string;
  hype_headlines_en: string;
  win_probability: number;
}

// --- MICRO-COMPONENTS ---

const Typewriter = ({ text, delay = 20 }: { text: string; delay?: number }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    setDisplayedText('');
    let i = 0;
    const timer = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(i));
      i++;
      if (i >= text.length) clearInterval(timer);
    }, delay);
    return () => clearInterval(timer);
  }, [text, delay]);

  return <span>{displayedText}</span>;
};

const MomentumWave = ({ lastResults, color }: { lastResults: ('W' | 'D' | 'L')[], color?: string }) => {
  const points = lastResults.map(r => r === 'W' ? 100 : r === 'D' ? 50 : 0);
  const themeColor = color || '#00FF85';
  
  // Create an SVG path for a smooth wave
  const pathData = useMemo(() => {
    if (points.length === 0) return '';
    const width = 240;
    const height = 60;
    const step = width / (points.length - 1 || 1);
    
    let d = `M 0 ${height - (points[0] / 100 * height)}`;
    for (let i = 1; i < points.length; i++) {
        const x = i * step;
        const y = height - (points[i] / 100 * height);
        // Smooth curve
        const prevX = (i - 1) * step;
        const prevY = height - (points[i - 1] / 100 * height);
        const cp1x = prevX + (x - prevX) / 2;
        d += ` C ${cp1x} ${prevY}, ${cp1x} ${y}, ${x} ${y}`;
    }
    return d;
  }, [points]);

  return (
    <div className="relative h-20 w-full mt-4 bg-slate-50 rounded-xl p-2 border border-slate-100 flex flex-col justify-end overflow-hidden group">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 240 60" preserveAspectRatio="none">
            {/* Background Glow */}
            <defs>
                <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={themeColor} stopOpacity="0.4" />
                    <stop offset="100%" stopColor={themeColor} stopOpacity="0" />
                </linearGradient>
            </defs>
            <motion.path
                d={`${pathData} L 240 60 L 0 60 Z`}
                fill="url(#waveGradient)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
            />
            <motion.path
                d={pathData}
                fill="none"
                stroke={themeColor}
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                style={{ filter: `drop-shadow(0 0 8px ${themeColor})` }}
            />
        </svg>
        <div className="flex justify-between mt-2 px-1">
            {lastResults.map((r, i) => (
                <div key={i} className={cn(
                    "text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center",
                    r === 'W' ? "text-black" : "text-white"
                )} style={{ backgroundColor: r === 'W' ? themeColor : r === 'D' ? '#334155' : '#ef4444' }}>
                    {r}
                </div>
            ))}
        </div>
    </div>
  );
};

export function TacticalTeamHub() {
  const { teams, fixtures, scoutingReports, addScoutingReport } = useStore();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reportData, setReportData] = useState<ScoutData | null>(null);

  const selectedTeam = useMemo(() => teams.find(t => t.id === selectedTeamId), [teams, selectedTeamId]);
  
  // Get last 5 fixtures for momentum
  const lastResults = useMemo(() => {
    if (!selectedTeamId) return [];
    return fixtures
      .filter(f => (f.homeTeamId === selectedTeamId || f.awayTeamId === selectedTeamId) && (f.leg1.status === 'finished' || f.leg2.status === 'finished'))
      .sort((a, b) => b.round - a.round)
      .slice(0, 5)
      .map(f => {
        const isHome = f.homeTeamId === selectedTeamId;
        const leg1Score = f.leg1.homeScore !== null && f.leg1.awayScore !== null;
        const leg2Score = f.leg2.homeScore !== null && f.leg2.awayScore !== null;
        
        let won = 0;
        let lost = 0;
        
        if (leg1Score) {
          if (isHome) {
            if (f.leg1.homeScore! > f.leg1.awayScore!) won++;
            else if (f.leg1.homeScore! < f.leg1.awayScore!) lost++;
          } else {
            if (f.leg1.awayScore! > f.leg1.homeScore!) won++;
            else if (f.leg1.awayScore! < f.leg1.homeScore!) lost++;
          }
        }
        
        if (leg2Score) {
          if (isHome) {
            if (f.leg2.homeScore! > f.leg2.awayScore!) won++;
            else if (f.leg2.homeScore! < f.leg2.awayScore!) lost++;
          } else {
            if (f.leg2.awayScore! > f.leg2.homeScore!) won++;
            else if (f.leg2.awayScore! < f.leg2.homeScore!) lost++;
          }
        }
        
        if (won > lost) return 'W';
        if (lost > won) return 'L';
        return 'D';
      })
      .reverse(); // Show oldest to newest for chart flow
  }, [selectedTeamId, fixtures]);

  // Next 3 fixtures
  const nextFixtures = useMemo(() => {
    if (!selectedTeamId) return [];
    return fixtures
      .filter(f => (f.homeTeamId === selectedTeamId || f.awayTeamId === selectedTeamId) && f.leg1.status === 'pending')
      .sort((a, b) => a.round - b.round)
      .slice(0, 3);
  }, [selectedTeamId, fixtures]);

  const fetchScoutingReport = async () => {
    if (!selectedTeam) return;

    // Check Cache first
    const cached = scoutingReports.find(r => r.teamId === selectedTeam.id);
    if (cached) {
      const now = new Date();
      const cachedDate = new Date(cached.generatedAt);
      // Cache valid for 3 hours
      if (now.getTime() - cachedDate.getTime() < 3 * 60 * 60 * 1000) {
        setReportData(JSON.parse(cached.report));
        toast.info("Loading cached scout report...");
        return;
      }
    }

    setIsAnalyzing(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY is missing");

      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
        As a Senior Tactical Scout, analyze the following football team: ${selectedTeam.name}.
        Manager: ${selectedTeam.managerName || 'Experimental Agent'}
        Current Points: ${selectedTeam.pts}
        Recent Form (last results): ${lastResults.join(', ')}
        Next Opponents: ${nextFixtures.map(f => teams.find(t => t.id === (f.homeTeamId === selectedTeam.id ? f.awayTeamId : f.homeTeamId))?.name).join(', ')}

        Provide a scouting intelligence report in STRICT JSON format:
        {
          "team_form_grade": "A+|A|B|C|D|F",
          "tactical_summary": "Deep dive into their playing style, weaknesses, and recent tactical shifts.",
          "player_to_watch": { "name": "Player Name", "reason": "Why they are dangerous", "threat_icon": "🔥|⚡|🎯" },
          "opponent_threat_levels": { "defense": 1-10, "midfield": 1-10, "attack": 1-10 },
          "hype_headlines_sw": "A Swahili hype headline for the upcoming matches",
          "hype_headlines_en": "An English hype headline for the upcoming matches",
          "win_probability": 0-100
        }
        Make the tone professional yet energetic. Ensure Swahili vibes are authentic.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { responseMimeType: 'application/json' }
      });
      
      const reportText = response.text || "{}";
      const report = JSON.parse(reportText);
      
      setReportData(report);
      addScoutingReport({
        teamId: selectedTeam.id,
        report: reportText,
        generatedAt: new Date().toISOString()
      });
      toast.success("Intelligence Report Compiled!");
    } catch (error) {
      console.error("AI Fetch error:", error);
      toast.error("Scout failed to analyze team.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (selectedTeamId) {
      setReportData(null);
      fetchScoutingReport();
    }
  }, [selectedTeamId]);

  return (
    <div className="p-6 md:p-10 space-y-10 min-h-screen bg-slate-50 text-slate-900">
      {/* Header & Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary w-fit">
              <BrainCircuit className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Tactical Team Hub</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic drop-shadow-sm text-slate-900">
              Scout <span className="text-primary italic">Intelligence</span>
            </h1>
            <p className="text-slate-500 text-sm font-medium">Deep-dive technical analysis and win probabilities per franchise.</p>
        </div>

        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 backdrop-blur-xl shadow-sm">
           <Search className="w-5 h-5 text-slate-400 ml-2" />
           <select 
             className="bg-transparent border-none focus:outline-none text-slate-900 font-bold text-sm w-48"
             value={selectedTeamId || ''}
             onChange={(e) => setSelectedTeamId(e.target.value)}
           >
              <option value="" disabled className="bg-white">Select Franchise</option>
              {teams.sort((a, b) => b.pts - a.pts).map(t => (
                <option key={t.id} value={t.id} className="bg-white">{t.name}</option>
              ))}
           </select>
        </div>
      </div>

      {!selectedTeam ? (
        <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
           <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center animate-pulse border-2 border-dashed border-slate-200">
              <Users className="w-10 h-10 text-slate-300" />
           </div>
           <div>
             <h3 className="text-xl font-bold uppercase tracking-widest text-slate-400">Awaiting Selection</h3>
             <p className="text-sm text-slate-400 max-w-xs">Pick a franchise to initiate deep intelligence scanning and tactical analysis.</p>
           </div>
        </div>
      ) : (
        <motion.div 
          key={selectedTeamId}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-4 gap-6"
        >
          {/* TEAM PROFILE BENTO - LARGE */}
          <div className="lg:col-span-2 row-span-2 p-8 rounded-[2.5rem] bg-white shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden flex flex-col justify-between group">
             {/* Dynamic color background glow */}
             <div 
               className="absolute top-0 right-0 w-64 h-64 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 animate-pulse transition-colors duration-1000" 
               style={{ backgroundColor: selectedTeam.color || 'var(--color-primary)' }}
             />
             
             <div className="relative space-y-6">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-[2rem] bg-white p-3 shadow-2xl relative overflow-hidden border border-slate-100">
                        <img src={selectedTeam.logo} className="w-full h-full object-contain" alt={selectedTeam.name} />
                      </div>
                      <div>
                        <h2 className="text-3xl font-black uppercase tracking-tighter italic text-slate-900">{selectedTeam.name}</h2>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Manager: {selectedTeam.managerName || 'Legacy Agent'}</p>
                      </div>
                   </div>
                   {reportData && (
                     <div className="text-center">
                        <div className="text-4xl font-black text-primary italic leading-none">{reportData.team_form_grade}</div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Form Grade</div>
                     </div>
                   )}
                </div>

                <div className="space-y-2">
                   <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <span>League Standing</span>
                      <span>{selectedTeam.pts} Points</span>
                   </div>
                   <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${(selectedTeam.pts / 100) * 100}%` }} />
                   </div>
                </div>

                <div className="space-y-2">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                       <TrendingUp className="w-3 h-3" /> Momentum Wave
                   </h4>
                   <MomentumWave lastResults={lastResults} color={selectedTeam.color} />
                </div>
             </div>

             <div className="grid grid-cols-3 gap-4 pt-8">
                {[
                  { label: 'Won', value: selectedTeam.won, icon: Zap },
                  { label: 'Lost', value: selectedTeam.lost, icon: Target },
                  { label: 'GD', value: selectedTeam.gd > 0 ? `+${selectedTeam.gd}` : selectedTeam.gd, icon: Shield }
                ].map((s, i) => (
                  <div key={i} className="bg-slate-50 p-4 rounded-3xl border border-slate-100 text-center">
                     <s.icon className="w-4 h-4 mx-auto mb-2 text-slate-400" />
                     <div className="text-lg font-black text-slate-900">{s.value}</div>
                     <div className="text-[8px] font-black uppercase tracking-widest text-slate-400">{s.label}</div>
                  </div>
                ))}
             </div>
          </div>

          {/* AI SCOUTING INTELLIGENCE - LONG */}
          <div className="lg:col-span-2 p-8 rounded-[2.5rem] bg-white shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col space-y-6 relative group overflow-hidden">
             <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                   <Sparkles className="w-5 h-5 text-primary" />
                   <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Scout Intelligence</h3>
                </div>
                {isAnalyzing && (
                  <div className="flex items-center gap-2 text-primary animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Scanning...</span>
                  </div>
                )}
             </div>

             <div className="flex-1 min-h-[160px] relative z-10">
                {reportData ? (
                  <div className="space-y-6">
                     <div className="flex flex-col gap-1">
                        <div className="text-primary font-black uppercase tracking-widest text-xs italic">
                           <Typewriter text={reportData.hype_headlines_sw} />
                        </div>
                        <div className="text-slate-600 text-sm font-medium leading-relaxed italic">
                           "{reportData.hype_headlines_en}"
                        </div>
                     </div>

                     <div className="text-slate-700 text-sm leading-relaxed font-medium bg-slate-50 p-6 rounded-3xl border border-slate-100">
                        <Typewriter text={reportData.tactical_summary} delay={10} />
                     </div>
                  </div>
                ) : !isAnalyzing && (
                  <div className="flex flex-col items-center justify-center h-full text-slate-300">
                     <AlertCircle className="w-8 h-8 opacity-40 mb-2" />
                     <p className="text-xs uppercase font-black tracking-widest opacity-40">System ID: AIS-Scout-01</p>
                  </div>
                )}
             </div>

             {reportData && (
                <div className="grid grid-cols-2 gap-4 relative z-10 pt-4 border-t border-slate-100">
                   <div className="space-y-1">
                      <div className="text-[8px] font-black uppercase tracking-widest text-slate-400">Player to Watch</div>
                      <div className="flex items-center gap-2">
                         <span className="text-xl">{reportData.player_to_watch.threat_icon}</span>
                         <span className="text-slate-900 font-bold truncate">{reportData.player_to_watch.name}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">{reportData.player_to_watch.reason}</p>
                   </div>
                   <div className="space-y-2">
                      <div className="text-[8px] font-black uppercase tracking-widest text-slate-400">Threat Matrix</div>
                      <div className="flex gap-1 h-3 items-end">
                         {Object.entries(reportData.opponent_threat_levels).map(([k, v]) => (
                            <div key={k} className="flex-1 space-y-1">
                               <div className="h-full bg-primary/10 rounded-t-sm group-hover:bg-primary/20 transition-colors flex flex-col justify-end">
                                  <div className="bg-primary rounded-t-sm" style={{ height: `${(v / 10) * 100}%` }} />
                               </div>
                            </div>
                         ))}
                      </div>
                      <div className="flex justify-between text-[6px] font-black uppercase tracking-[0.2em] text-slate-300">
                         <span>DEF</span>
                         <span>MID</span>
                         <span>ATT</span>
                      </div>
                   </div>
                </div>
             )}
          </div>

          {/* NEXT FIXTURES CARDS */}
          <div className="lg:col-span-2 rounded-[2.5rem] bg-white shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col p-8 space-y-6">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400">
                   <Calendar className="w-4 h-4" />
                   <h3 className="text-xs font-black uppercase tracking-widest italic">Road Ahead</h3>
                </div>
                {reportData && (
                   <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">
                         Win Prob: {reportData.win_probability}%
                      </span>
                   </div>
                )}
             </div>

             <div className="space-y-4">
                {nextFixtures.length > 0 ? nextFixtures.map((f, i) => {
                  const opponentId = f.homeTeamId === selectedTeam.id ? f.awayTeamId : f.homeTeamId;
                  const opponent = teams.find(t => t.id === opponentId);
                  return (
                    <div key={f.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-3xl border border-slate-100 hover:border-primary/40 transition-all shadow-sm group">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-xl p-1 shadow-sm border border-slate-100">
                             <img src={opponent?.logo} className="w-full h-full object-contain" alt="opp" />
                          </div>
                          <div>
                             <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Game {i + 1}</p>
                             <h4 className="text-sm font-black uppercase tracking-tight text-slate-900 group-hover:text-primary transition-colors">{opponent?.name}</h4>
                          </div>
                       </div>
                       <Button size="icon" className="w-10 h-10 rounded-xl bg-white hover:bg-primary hover:text-white transition-colors border border-slate-200 text-slate-400">
                          <ChevronRight className="w-4 h-4" />
                       </Button>
                    </div>
                  );
                }) : (
                  <div className="text-center py-8 text-slate-300 font-black uppercase tracking-widest text-[10px]">
                    No Upcoming Fixtures
                  </div>
                )}
             </div>
             
             <button className="w-full py-4 bg-primary text-white font-black uppercase tracking-widest text-[10px] rounded-[1.5rem] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20">
               Update Playbook
             </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
