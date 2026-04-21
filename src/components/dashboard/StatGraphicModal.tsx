import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, TrendingUp, AlertTriangle, Activity, Download, Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useStore } from '@/store/useStore';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';
import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface StatGraphicModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'golden-boot' | 'pl-golden-boot' | 'power-rankings' | 'season-highs' | 'team-stats' | 'relegation' | 'form' | 'underdog' | 'match-focus' | 'season-recap' | 'card-stats' | 'tactical-clash' | 'league-pulse' | 'power-form';
  data?: any;
}

export function StatGraphicModal({ isOpen, onClose, type, data }: StatGraphicModalProps) {
  const { tournamentName, season } = useStore();
  const graphicRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!graphicRef.current) return;
    try {
      setDownloading(true);
      const dataUrl = await toPng(graphicRef.current, {
        quality: 1,
        pixelRatio: 2,
        width: 1200,
        height: 900
      });
      const link = document.createElement('a');
      link.download = `kickoff-${type}-s${season}-${new Date().getTime()}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Official Graphic Exported!');
    } catch (err) {
      console.error(err);
      toast.error('Export failed - Check browser permissions');
    } finally {
      setDownloading(false);
    }
  };

  const renderContent = () => {
    switch (type) {
      case 'tactical-clash':
        return (
          <div className="w-full h-full bg-[#3D195B] relative overflow-hidden flex flex-col items-center">
            {/* Background Texture elements */}
            <div className="absolute inset-0 opacity-10">
               <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00FF85] rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2" />
               <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#FF005A] rounded-full blur-[150px] translate-y-1/2 -translate-x-1/2" />
            </div>

            <div className="relative z-10 w-full h-full flex flex-col p-16">
               <div className="flex items-center justify-between mb-12">
                  <div className="flex items-center gap-6">
                     <img src="https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg" className="w-16 h-16 brightness-0 invert" alt="PL" />
                     <div className="h-12 w-[2px] bg-white/20" />
                     <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">TACTICAL CLASH</h2>
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">MW {data?.round || 24}</p>
                     <p className="text-sm font-black text-white uppercase tracking-tighter">Season {season} Official Preview</p>
                  </div>
               </div>

               <div className="flex-1 flex items-center justify-center gap-20 relative">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[350px] font-black text-white/5 italic select-none">VS</div>
                  
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0, x: -50 }}
                    animate={{ scale: 1, opacity: 1, x: 0 }}
                    className="flex flex-col items-center gap-8 z-20"
                  >
                     <div className="relative">
                        <div className="w-64 h-64 rounded-[4rem] bg-gradient-to-br from-white/10 to-transparent border-2 border-white/20 p-12 backdrop-blur-3xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] flex items-center justify-center">
                           <img src={data?.teamA?.logo} className="w-40 h-40 object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.3)]" referrerPolicy="no-referrer" />
                        </div>
                        <div className="absolute -bottom-4 -left-4 bg-[#00FF85] text-[#3D195B] p-5 rounded-2xl font-black text-3xl italic shadow-2xl skew-x-[-12deg]">HOME</div>
                     </div>
                     <h3 className="text-4xl font-black text-white uppercase tracking-tighter text-center max-w-[250px] leading-tight drop-shadow-lg">{data?.teamA?.name}</h3>
                  </motion.div>

                  <div className="flex flex-col items-center gap-6 z-20">
                     <div className="text-9xl font-black text-[#00FF85] italic tracking-tighter drop-shadow-[0_0_50px_rgba(0,255,133,0.5)]">VS</div>
                     <div className="px-8 py-3 bg-white/5 rounded-full border border-white/10 backdrop-blur-xl">
                        <span className="text-sm font-black text-white tracking-[0.4em] uppercase whitespace-nowrap">LIVE SHOWDOWN</span>
                     </div>
                  </div>

                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0, x: 50 }}
                    animate={{ scale: 1, opacity: 1, x: 0 }}
                    className="flex flex-col items-center gap-8 z-20"
                  >
                     <div className="relative">
                        <div className="w-64 h-64 rounded-[4rem] bg-gradient-to-br from-white/10 to-transparent border-2 border-white/20 p-12 backdrop-blur-3xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] flex items-center justify-center">
                           <img src={data?.teamB?.logo} className="w-40 h-40 object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.3)]" referrerPolicy="no-referrer" />
                        </div>
                        <div className="absolute -bottom-4 -right-4 bg-white text-[#3D195B] p-5 rounded-2xl font-black text-3xl italic shadow-2xl skew-x-[12deg]">AWAY</div>
                     </div>
                     <h3 className="text-4xl font-black text-white uppercase tracking-tighter text-center max-w-[250px] leading-tight drop-shadow-lg">{data?.teamB?.name}</h3>
                  </motion.div>
               </div>

               <div className="mt-12 flex justify-center">
                  <div className="bg-gradient-to-r from-[#00FF85] to-[#02EFFE] px-16 py-8 rounded-[3rem] shadow-[0_30px_80px_rgba(0,0,0,0.5)] flex items-center gap-20">
                     <div className="flex flex-col items-center border-r border-[#3D195B]/10 pr-20">
                        <p className="text-[12px] font-black text-[#3D195B] uppercase tracking-widest mb-1">Attack Index</p>
                        <p className="text-5xl font-black text-[#3D195B] italic leading-none">{data?.teamA?.att || 88} <span className="text-lg opacity-40">v</span> {data?.teamB?.att || 85}</p>
                     </div>
                     <div className="flex flex-col items-center">
                        <p className="text-[12px] font-black text-[#3D195B] uppercase tracking-widest mb-1">Defense Stability</p>
                        <p className="text-5xl font-black text-[#3D195B] italic leading-none tracking-tighter">{data?.teamA?.def || 82} <span className="text-lg opacity-40">v</span> {data?.teamB?.def || 84}</p>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        );

      case 'power-form':
        return (
          <div className="w-full h-full bg-[#3D195B] relative overflow-hidden flex flex-col p-16">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-1/2 h-full opacity-10">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,#00FF85,transparent_70%)]" />
            </div>
            
            <div className="relative z-10 w-full flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-16 border-b border-white/10 pb-8">
                 <div className="flex items-center gap-6">
                    <img src="https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg" className="w-20 h-20 brightness-0 invert" alt="PL" />
                    <div className="h-16 w-0.5 bg-white/20" />
                    <div>
                      <h1 className="text-5xl font-black text-white uppercase tracking-tighter italic">POWER FORM</h1>
                      <p className="text-[#00FF85] text-sm font-black uppercase tracking-[0.4em]">Tournament Momentum Leaders</p>
                    </div>
                 </div>
                 <div className="bg-[#00FF85] text-[#3D195B] px-8 py-3 rounded-full font-black uppercase text-sm tracking-widest skew-x-[-12deg] shadow-[0_0_30px_rgba(0,255,133,0.3)]">
                    ELITE PERFORMANCE
                 </div>
              </div>

              <div className="flex-1 flex flex-col gap-5 justify-center">
                 {data?.slice(0, 5).map((team: any, idx: number) => (
                    <motion.div 
                      key={team.id}
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 flex items-center justify-between group hover:bg-white/10 transition-all hover:scale-[1.02] shadow-xl"
                    >
                       <div className="flex items-center gap-8">
                          <span className="text-6xl font-black italic text-white/20 w-12">{idx + 1}</span>
                          <div className="w-20 h-20 bg-white rounded-3xl p-4 shadow-2xl">
                             <img src={team.logo} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                          </div>
                          <div>
                             <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{team.name}</h2>
                             <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs font-black text-[#00FF85] uppercase tracking-widest opacity-60">Season Points</span>
                                <span className="text-2xl font-black text-white italic leading-none">{team.pts}</span>
                             </div>
                          </div>
                       </div>
                       
                       <div className="flex flex-col items-end gap-4">
                          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Recent Performance</p>
                          <div className="flex gap-3">
                             {team.form?.map((res: string, i: number) => (
                                <div key={i} className={cn(
                                   "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white shadow-lg border border-white/10",
                                   res === 'W' ? "bg-[#00FF85] text-[#3D195B] border-[#00FF85]" : res === 'L' ? "bg-[#FF005A]" : "bg-white/10"
                                )}>
                                   {res}
                                </div>
                             ))}
                          </div>
                       </div>
                    </motion.div>
                 ))}
              </div>

              <div className="mt-16 flex items-center justify-between pt-8 border-t border-white/10 leading-none">
                 <div className="flex items-center gap-4">
                    <img src="https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg" className="w-10 h-10 brightness-0 invert opacity-40" alt="PL" />
                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Official Season Power Rankings Recap • Certified Insight</p>
                 </div>
                 <p className="text-lg font-black text-[#00FF85] uppercase tracking-tighter italic">{tournamentName}</p>
              </div>
            </div>
          </div>
        );

      case 'league-pulse':
        return (
          <div className="w-full h-full bg-[#1A1A1A] p-0 flex flex-col relative overflow-hidden text-white font-sans">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,#3D195B_0%,transparent_50%)]" />
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#FF005A_0%,transparent_50%)] opacity-30" />
             
             <div className="relative z-10 flex flex-col h-full p-16">
                <div className="flex items-center justify-between mb-16">
                   <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-[#00FF85] rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(0,255,133,0.3)]">
                         <Activity className="w-8 h-8 text-black" />
                      </div>
                      <h2 className="text-5xl font-black italic tracking-tighter uppercase leading-none">League Pulse</h2>
                   </div>
                   <div className="text-right">
                      <p className="text-sm font-black text-[#00FF85] uppercase tracking-widest">{tournamentName}</p>
                      <p className="text-xs font-bold text-white/40 uppercase">Statistical Pulse • Live Trends</p>
                   </div>
                </div>

                <div className="flex-1 grid grid-cols-2 gap-12">
                   <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 backdrop-blur-md flex flex-col justify-between relative overflow-hidden group">
                      <div className="relative z-10">
                        <TrendingUp className="w-8 h-8 text-[#00FF85] mb-4" />
                        <h4 className="text-2xl font-black uppercase italic tracking-tighter mb-8 leading-none">Performance Trends</h4>
                        <div className="space-y-6">
                           {['Goals per game', 'Clean sheet rate', 'Shot accuracy'].map((label, idx) => (
                             <div key={idx} className="space-y-2">
                                <div className="flex justify-between text-xs font-black uppercase tracking-widest text-white/40">
                                   <span>{label}</span>
                                   <span className="text-[#00FF85]">{(80 - (idx * 15)).toFixed(1)}%</span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                   <motion.div 
                                     initial={{ width: 0 }}
                                     animate={{ width: `${80 - (idx * 15)}%` }}
                                     className="h-full bg-white" 
                                   />
                                </div>
                             </div>
                           ))}
                        </div>
                      </div>
                      <div className="absolute -bottom-8 -right-8 text-9xl font-black text-white/5 italic">DATA</div>
                   </div>

                   <div className="space-y-8">
                      <div className="bg-gradient-to-br from-[#FF005A] to-[#3D195B] rounded-[3rem] p-10 shadow-2xl flex items-center justify-between">
                         <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Season Total</p>
                            <h4 className="text-3xl font-black italic leading-none">GOALS SCORED</h4>
                         </div>
                         <p className="text-7xl font-black italic leading-none">{data?.totalGoals || 124}</p>
                      </div>

                      <div className="bg-white rounded-[3rem] p-10 flex flex-col justify-between h-[50%] text-black shadow-2xl relative overflow-hidden">
                         <div className="relative z-10 flex items-center justify-between">
                            <img src="https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg" className="w-12 h-12" alt="PL" />
                            <Badge className="bg-black text-white border-none font-black uppercase tracking-widest px-4 py-1">PREMIUM</Badge>
                         </div>
                         <div className="relative z-10 mt-4">
                            <h4 className="text-4xl font-black uppercase tracking-tighter leading-none italic">LEAGUE PULSE<br />ACTIVE</h4>
                            <p className="text-xs font-bold text-black/40 uppercase tracking-widest mt-2">{tournamentName} Engine Ready</p>
                         </div>
                         <div className="absolute bottom-[-20px] right-[-20px] opacity-[0.03]">
                            <img src="https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg" className="w-64 h-64" alt="PL" />
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        );

      case 'pl-golden-boot':
        return (
          <div className="w-full h-full bg-white relative flex flex-col overflow-hidden font-sans">
            {/* Background Polish pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#3D195B 2px, transparent 2px)', backgroundSize: '30px 30px' }} />
            
            {/* Header */}
            <div className="pt-16 pb-8 px-12 bg-[#3D195B] text-white relative z-10">
              <div className="flex items-center justify-between mb-2">
                 <Badge className="bg-[#00FF85] text-[#3D195B] font-black uppercase tracking-widest text-[10px] border-none shadow-lg">
                    Individual Excellence
                 </Badge>
                 <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-[#00FF85]" />
                 </div>
              </div>
              <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none">
                Golden Boot Race
              </h1>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00FF85] mt-2">
                Official Goal Scoring Leaderboard • {tournamentName}
              </p>
            </div>

            {/* List */}
            <div className="flex-1 px-12 py-10 space-y-3 relative z-10 bg-slate-50 overflow-hidden">
              {data?.slice(0, 5).map((player: any, idx: number) => (
                <motion.div 
                  key={player.id} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-[1.5rem] border transition-all shadow-sm",
                    idx === 0 ? "bg-[#3D195B] text-white border-none shadow-xl scale-[1.01]" : "bg-white text-slate-900 border-slate-100"
                  )}
                >
                  <div className="flex items-center gap-6">
                    <span className={cn(
                      "text-2xl font-black italic w-8",
                      idx === 0 ? "text-[#00FF85]" : "text-slate-200"
                    )}>{idx + 1}</span>
                    
                    <div className="w-12 h-12 rounded-xl bg-white/10 p-2 flex items-center justify-center border border-white/5 shadow-inner">
                      <img 
                        src={player.team?.logo} 
                        className="w-full h-full object-contain" 
                        referrerPolicy="no-referrer" 
                      />
                    </div>

                    <div>
                      <h3 className={cn(
                        "text-lg font-black uppercase tracking-tight leading-tight",
                        idx === 0 ? "text-[#00FF85]" : "text-slate-900"
                      )}>{player.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-[8px] font-black uppercase tracking-widest",
                          idx === 0 ? "text-white/60" : "text-slate-400"
                        )}>{player.team?.name}</span>
                        {idx === 0 && (
                          <div className="px-2 py-0.5 rounded-full bg-[#00FF85]/20 text-[#00FF85] text-[6px] font-black uppercase">Goal King</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    {/* Recent Form (Last 3) */}
                    <div className="hidden sm:flex flex-col items-end gap-1">
                       <p className={cn("text-[7px] font-black uppercase tracking-widest mb-0.5", idx === 0 ? "text-white/40" : "text-slate-300")}>Recent Form</p>
                       <div className="flex gap-1">
                          {(player.goalHistory || [0,0,0]).slice(0, 3).map((goals: number, i: number) => (
                            <div 
                              key={i}
                              className={cn(
                                "w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black",
                                goals > 0 
                                  ? "bg-[#00FF85] text-[#3D195B]" 
                                  : idx === 0 ? "bg-white/5 text-white/20" : "bg-slate-100 text-slate-300"
                              )}
                            >
                              {goals}
                            </div>
                          ))}
                       </div>
                    </div>

                    <div className="text-right">
                      <span className={cn(
                        "text-4xl font-black italic leading-none block",
                        idx === 0 ? "text-[#00FF85]" : "text-[#3D195B]"
                      )}>{player.goals}</span>
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-widest",
                        idx === 0 ? "text-white/40" : "text-slate-400"
                      )}>Goals</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-12 py-8 bg-white border-t border-slate-100 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 opacity-30 grayscale items-center text-black">
                  <div className="w-6 h-6 rounded-md bg-slate-900" />
                  <div className="w-6 h-6 rounded-md bg-[#00FF85]" />
                  <span className="font-black italic text-xs tracking-tighter">PREMIER DATA</span>
                </div>
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-300 italic">Tournament Broadcast • Season {season} Recap</p>
              </div>
            </div>
          </div>
        );

      case 'golden-boot':
        return (
          <div className="w-full h-full bg-[#3D195B] p-10 flex flex-col relative overflow-hidden text-white font-sans">
            <div className="absolute top-0 right-0 w-64 h-full opacity-10 rotate-12 translate-x-12">
              {[...Array(15)].map((_, i) => (
                <div key={i} className="w-full h-12 bg-white -skew-x-12 mb-4" />
              ))}
            </div>
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-6xl font-black uppercase tracking-tighter italic leading-none text-amber-400">Golden Boot</h2>
                  <p className="text-amber-400/60 font-black uppercase tracking-[0.4em] text-xs mt-2">{tournamentName} • Season {season}</p>
                </div>
                <Trophy className="w-16 h-16 text-amber-400/20" />
              </div>
              
              <div className="flex-1 flex items-end justify-center gap-6 pb-8">
                {data?.slice(0, 5).map((team: any, i: number) => {
                  const heights = ['h-72', 'h-56', 'h-44', 'h-32', 'h-24'];
                  const colors = ['bg-amber-400', 'bg-slate-200', 'bg-orange-300', 'bg-slate-400', 'bg-slate-500'];
                  return (
                    <motion.div 
                      initial={{ y: 100, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: i * 0.1, type: 'spring' }}
                      key={team.id} 
                      className="flex flex-col items-center gap-4 w-32"
                    >
                      <div className="text-center">
                        <p className="font-black text-4xl italic text-amber-400 leading-none drop-shadow-lg">{team.goals}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Goals</p>
                      </div>
                      <div className={cn(
                        "w-full rounded-t-2xl flex flex-col items-center justify-center pb-6 shadow-2xl relative group overflow-hidden border-t border-white/20",
                        heights[i] || 'h-20',
                        colors[i] || 'bg-slate-600'
                      )}>
                        <img src={team.logo} className="w-12 h-12 absolute top-4 opacity-40 grayscale brightness-0" alt="" referrerPolicy="no-referrer" />
                        <span className="text-black font-black text-6xl opacity-20 italic mt-8">{i + 1}</span>
                      </div>
                      <div className="text-center w-full px-2">
                        <p className="font-black uppercase truncate text-sm tracking-tight">{team.name}</p>
                        <p className="text-[10px] font-bold uppercase opacity-60 truncate">League Leaders</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 'card-stats':
        return (
          <div className="w-full h-full bg-[#1A1A1A] p-12 flex flex-col relative overflow-hidden text-white font-sans">
             <div className="absolute top-0 left-0 w-full h-full flex flex-wrap opacity-5 pointer-events-none">
              {[...Array(100)].map((_, i) => (
                <div key={i} className="w-24 h-24 border border-white" />
              ))}
            </div>

            <div className="relative z-10 flex flex-col h-full bg-red-600/5 rounded-[3rem] border border-white/5 p-12 backdrop-blur-sm">
              <div className="flex items-start justify-between mb-16">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                     <AlertTriangle className="w-8 h-8 text-red-600" />
                     <h2 className="text-7xl font-bold tracking-tighter uppercase italic leading-none">Discipline Report</h2>
                  </div>
                  <p className="text-xl font-bold text-red-600 tracking-widest uppercase italic ml-11">Total Cards Breakdown • Season {season}</p>
                </div>
                <div className="flex gap-4">
                   <div className="w-16 h-24 bg-yellow-400 rounded-lg shadow-2xl rotate-[-12deg]" />
                   <div className="w-16 h-24 bg-red-600 rounded-lg shadow-2xl rotate-6" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-12 flex-1 items-center">
                 <div className="space-y-12">
                    <motion.div 
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-10 bg-yellow-400 text-black rounded-[2rem] flex items-center justify-between"
                    >
                       <div>
                          <p className="text-2xl font-black uppercase tracking-tight leading-none">Yellow Cards</p>
                          <p className="text-sm font-bold opacity-60 uppercase mt-1">League Total</p>
                       </div>
                       <p className="text-8xl font-black italic">{data.yellows}</p>
                    </motion.div>
                    <motion.div 
                       initial={{ opacity: 0, x: -50 }}
                       animate={{ opacity: 1, x: 0 }}
                       transition={{ delay: 0.2 }}
                       className="p-10 bg-red-600 text-white rounded-[2rem] flex items-center justify-between shadow-[0_20px_40px_rgba(220,38,38,0.3)]"
                    >
                       <div>
                          <p className="text-2xl font-black uppercase tracking-tight leading-none">Red Cards</p>
                          <p className="text-sm font-bold opacity-60 uppercase mt-1">League Total</p>
                       </div>
                       <p className="text-8xl font-black italic">{data.reds}</p>
                    </motion.div>
                 </div>

                 <div className="h-full flex flex-col justify-center space-y-6 pl-12 border-l border-white/10">
                    <h3 className="text-2xl font-black uppercase tracking-widest text-slate-500 italic">Disciplinary Note</h3>
                    <p className="text-3xl font-bold leading-tight tracking-tight text-white/80 italic">
                      "Discipline has been {data.reds > 5 ? 'heated' : 'contained'} this season. Referees are keeping a tight grip on the {tournamentName} action."
                    </p>
                    <div className="flex gap-2">
                       {[...Array(5)].map((_, i) => <div key={i} className="w-12 h-1 bg-red-600" />)}
                    </div>
                 </div>
              </div>
            </div>
          </div>
        );

      case 'season-recap':
        return (
          <div className="w-full h-full bg-[#0F172A] p-0 flex flex-col relative overflow-hidden text-white font-sans">
             {/* Large Background Text */}
             <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] select-none pointer-events-none">
                <span className="text-[40rem] font-black italic rotate-[-15deg] whitespace-nowrap">RECAP</span>
             </div>

             <div className="relative z-10 flex flex-col h-full">
                {/* Header Strip */}
                <div className="h-48 bg-[#00FF85] flex items-center px-12 justify-between">
                   <div className="text-black">
                      <p className="text-xl font-black uppercase tracking-widest italic opacity-60 leading-none">Season {season} Recap</p>
                      <h2 className="text-8xl font-black uppercase tracking-tighter italic leading-none">{tournamentName}</h2>
                   </div>
                   <Trophy className="w-24 h-24 text-black opacity-10" />
                </div>

                <div className="flex-1 p-12 grid grid-cols-3 gap-8">
                   <div className="col-span-2 grid grid-cols-2 gap-8">
                      {data?.teams?.slice(0, 4).map((team: any, i: number) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.1 }}
                          className="bg-white/5 border border-white/10 rounded-[2rem] p-8 flex flex-col justify-between group hover:bg-white/10 transition-colors"
                        >
                           <div className="flex justify-between items-start">
                              <img src={team.logo} className="w-16 h-16 object-contain grayscale brightness-0 invert" alt="" referrerPolicy="no-referrer" />
                              <span className="text-4xl font-black italic opacity-20 group-hover:opacity-40 transition-opacity">#{i+1}</span>
                           </div>
                           <div>
                              <p className="text-sm font-black uppercase tracking-[0.3em] text-[#00FF85] mb-2">Power Rank</p>
                              <h4 className="text-3xl font-black uppercase tracking-tighter leading-none">{team.name}</h4>
                              <p className="text-5xl font-black italic mt-4 tabular-nums">{team.pts}<span className="text-xs italic opacity-40 ml-2">PTS</span></p>
                           </div>
                        </motion.div>
                      ))}
                   </div>

                   <div className="bg-[#00FF85] rounded-[3rem] p-10 flex flex-col justify-between text-black relative overflow-hidden shadow-2xl">
                      <div className="relative z-10">
                        <Activity className="w-12 h-12 mb-6" />
                        <h3 className="text-4xl font-black uppercase tracking-tighter italic leading-tight">Tournament<br />Insights</h3>
                        <div className="h-1.5 w-16 bg-black mt-4" />
                      </div>

                      <div className="relative z-10 space-y-6">
                         <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Top Offense</p>
                            <p className="text-xl font-black uppercase italic">{data.stats.topOffense}</p>
                         </div>
                         <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Most Consistent</p>
                            <p className="text-xl font-black uppercase italic">{data.stats.bestForm}</p>
                         </div>
                         <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">League Goals</p>
                            <p className="text-xl font-black uppercase italic">{data.stats.totalGoals} Total</p>
                         </div>
                      </div>

                      {/* Branding elements */}
                      <div className="absolute -bottom-10 -right-10 text-[10rem] font-black opacity-[0.05] italic pointer-events-none">PRO</div>
                   </div>
                </div>
             </div>
          </div>
        );

      case 'power-rankings':
        return (
          <div className="w-full h-full bg-[#1e1b4b] p-10 flex flex-col relative overflow-hidden text-white">
             <div className="absolute inset-0 opacity-10">
              <div className="grid grid-cols-12 h-full">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="border-r border-white/10" />
                ))}
              </div>
            </div>

            <div className="relative z-10 flex flex-col h-full bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] p-12 border border-white/10 shadow-3xl">
              <div className="mb-12 flex items-end justify-between">
                <div>
                  <div className="bg-[#00FF85] text-black text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest mb-4 inline-block shadow-lg">FORM & FLOW</div>
                  <h2 className="text-7xl font-black uppercase tracking-tighter italic leading-none drop-shadow-2xl">Power Rankings</h2>
                  <p className="text-white/40 font-black uppercase tracking-widest text-[10px] mt-4 ml-1">OFFICIAL BROADCAST SELECTION • SEASON {season}</p>
                </div>
                <div className="flex items-center gap-4 text-[#00FF85]">
                   <p className="text-sm font-black italic uppercase tracking-widest opacity-50">KICKOFF ENG</p>
                   <div className="w-px h-12 bg-white/20" />
                   <Activity className="w-16 h-16 opacity-20" />
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center space-y-4">
                {data?.map((team: any, i: number) => (
                  <motion.div 
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    key={i} 
                    className="flex items-center gap-8 group"
                  >
                    <span className="text-5xl font-black italic text-[#00FF85] w-16 text-center tabular-nums drop-shadow-lg">{i + 1}</span>
                    <div className="flex-1 h-16 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 flex items-center px-8 justify-between transition-all hover:scale-[1.02] transform-gpu">
                      <div className="flex items-center gap-4">
                         <img src={team.logo} className="w-8 h-8 object-contain" alt="" referrerPolicy="no-referrer" />
                         <span className="text-2xl font-black uppercase tracking-tight italic">{team.name}</span>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="h-1.5 w-48 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 via-[#00FF85] to-emerald-400" 
                            style={{ width: `${Math.min(100, (team.pts / (data[0].pts || 1)) * 100)}%` }} 
                          />
                        </div>
                        <span className="text-3xl font-black tabular-nums tracking-tighter">{team.pts}<span className="text-[10px] ml-1 uppercase opacity-40">Pts</span></span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-12 flex items-center gap-6">
                 <div className="flex -space-x-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center">
                         <TrendingUp className="w-4 h-4 text-[#00FF85]" />
                      </div>
                    ))}
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-[#00FF85] animate-pulse">Live Analytics Optimized</p>
              </div>
            </div>
          </div>
        );

      case 'team-stats':
        return (
          <div className="w-full h-full bg-[#1e1b4b] p-12 flex flex-col relative overflow-hidden text-white">
            <div className="absolute -left-20 -top-20 w-80 h-80 bg-blue-500 rounded-full blur-[150px] opacity-10" />
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-[#00FF85] rounded-full blur-[150px] opacity-10" />
            
            <div className="relative z-10 flex flex-col h-full bg-black/30 backdrop-blur-3xl rounded-[3rem] p-12 border border-white/5">
              <div className="flex items-center justify-between mb-12 relative">
                <div className="space-y-1">
                  <h2 className="text-6xl font-black uppercase tracking-tighter italic text-transparent bg-clip-text bg-gradient-to-r from-white to-white/40">League Leaders</h2>
                  <p className="text-[#00FF85] text-xs font-black uppercase tracking-[0.4em] mt-2">Season {season} Overall Statistical Report</p>
                </div>
                <div className="h-20 w-px bg-white/10 mx-8" />
                <div className="flex flex-col items-end">
                   <p className="text-4xl font-black italic opacity-10 tracking-widest">KICKOFF PRO</p>
                   <p className="text-[9px] font-black uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full mt-2">Certified Data</p>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-2 gap-x-12 gap-y-10">
                {data?.map((group: any, i: number) => (
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    key={i} 
                    className="flex flex-col relative group"
                  >
                    <div className="flex items-center justify-between mb-4 pr-2">
                       <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-[#00FF85] rounded-full group-hover:h-8 transition-all" />
                        <h4 className="text-lg font-black uppercase tracking-widest text-white/90 italic">{group.title}</h4>
                       </div>
                       <Activity className="w-4 h-4 text-white/20" />
                    </div>
                    <div className="space-y-3">
                      {group.teams.slice(0, 3).map((team: any, j: number) => (
                        <div key={j} className="flex items-center justify-between h-12 px-6 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-black italic text-[#00FF85] opacity-60">0{j + 1}</span>
                            <span className="text-lg font-black uppercase tracking-tight italic">{team.name}</span>
                          </div>
                          <span className="text-2xl font-black text-[#00FF85] tabular-nums tracking-tighter">{team.value}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <div className="mt-12 flex items-center justify-between border-t border-white/10 pt-8">
                 <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                       <div className="w-3 h-3 rounded-full bg-red-500" />
                       <div className="w-3 h-3 rounded-full bg-yellow-400" />
                       <div className="w-3 h-3 rounded-full bg-[#00FF85]" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-30 italic">Tournament broadcast services verified</p>
                 </div>
                 <div className="flex items-center gap-2">
                    <p className="text-sm font-black italic tracking-widest uppercase">{tournamentName}</p>
                 </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="w-full h-full bg-[#0F172A] flex flex-col items-center justify-center p-12 text-center text-white relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-transparent" />
            <Activity className="w-20 h-20 text-[#00FF85] mb-8 animate-pulse relative z-10" />
            <h2 className="text-4xl font-black uppercase tracking-widest italic relative z-10">Data Visualized</h2>
            <p className="text-slate-400 mt-4 text-xl font-medium max-w-lg mx-auto relative z-10">
              Transforming raw tournament feeds into professional grade broadcast graphics.
            </p>
            <div className="mt-12 flex gap-4 relative z-10">
               {[...Array(4)].map((_, i) => <div key={i} className="w-16 h-1.5 bg-white/10 rounded-full" />)}
            </div>
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-[2rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] w-full max-w-5xl flex flex-col"
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 uppercase tracking-tighter text-lg leading-none">Broadcast Graphic</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">4K Export Ready • Official Layout</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
               <Button 
                onClick={handleDownload}
                disabled={downloading}
                className="bg-[#3D195B] hover:bg-[#2a1140] text-white font-black px-6 rounded-xl uppercase tracking-widest text-[10px] shadow-lg shadow-purple-900/20"
              >
                {downloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                Export 4K PNG
              </Button>
              <div className="w-px h-8 bg-slate-200 mx-1" />
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-10 w-10 hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </Button>
            </div>
          </div>

          {/* Modal Branding Bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#3D195B] via-[#00FF85] to-[#FF005A]" />

          {/* Main Content Area */}
          <div className="p-8 sm:p-12 bg-slate-100 flex items-center justify-center overflow-auto min-h-[600px]">
            {/* The Graphic Container (Widescreen 4:3ish) */}
            <div 
              ref={graphicRef}
              className="w-[1000px] h-[750px] bg-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] rounded-3xl overflow-hidden shrink-0 transform-gpu transition-shadow"
            >
              {renderContent()}
            </div>
          </div>
          
          {/* Footer Bar */}
          <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic flex items-center gap-2">
              <TrendingUp className="w-3 h-3" /> Developed by KickOff Graphics Unit &trade;
            </p>
            <div className="flex gap-4">
               <div className="w-2 h-2 rounded-full bg-slate-200" />
               <div className="w-2 h-2 rounded-full bg-slate-200" />
               <div className="w-2 h-2 rounded-full bg-slate-200" />
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
