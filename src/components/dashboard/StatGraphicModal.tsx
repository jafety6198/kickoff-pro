import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, TrendingUp, AlertTriangle, Activity, Download, Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useStore } from '@/store/useStore';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';
import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface StatGraphicModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'golden-boot' | 'power-rankings' | 'season-highs' | 'team-stats' | 'relegation' | 'form' | 'underdog';
  data?: any;
}

export function StatGraphicModal({ isOpen, onClose, type, data }: StatGraphicModalProps) {
  const { tournamentName } = useStore();
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
      link.download = `kickoff-${type}-${new Date().getTime()}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Professional Graphic Downloaded!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export graphic');
    } finally {
      setDownloading(false);
    }
  };

  const renderContent = () => {
    switch (type) {
      case 'golden-boot':
        return (
          <div className="w-full h-full bg-[#3D195B] p-10 flex flex-col relative overflow-hidden text-white font-sans">
            {/* Dynamic Background */}
            <div className="absolute top-0 right-0 w-64 h-full opacity-10 rotate-12 translate-x-12">
              {[...Array(15)].map((_, i) => (
                <div key={i} className="w-full h-12 bg-white -skew-x-12 mb-4" />
              ))}
            </div>
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-6xl font-black uppercase tracking-tighter italic leading-none">Golden Boot</h2>
                  <p className="text-[#00FF85] font-black uppercase tracking-[0.4em] text-xs mt-2">{tournamentName}</p>
                </div>
                <img src="https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg" className="w-16 h-16 brightness-0 invert" alt="PL" />
              </div>
              
              <div className="flex-1 flex items-end justify-center gap-6 pb-8">
                {data?.slice(0, 5).map((player: any, i: number) => {
                  const heights = ['h-72', 'h-56', 'h-44', 'h-32', 'h-24'];
                  const colors = ['bg-[#00FF85]', 'bg-amber-400', 'bg-slate-300', 'bg-slate-400', 'bg-slate-500'];
                  return (
                    <motion.div 
                      initial={{ y: 100, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: i * 0.1, type: 'spring' }}
                      key={player.id} 
                      className="flex flex-col items-center gap-4 w-32"
                    >
                      <div className="text-center">
                        <p className="font-black text-4xl italic text-[#00FF85] leading-none drop-shadow-lg">{player.goals}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Goals</p>
                      </div>
                      <div className={cn(
                        "w-full rounded-t-2xl flex items-end justify-center pb-6 shadow-2xl relative group overflow-hidden",
                        heights[i] || 'h-20',
                        colors[i] || 'bg-slate-600'
                      )}>
                        <div className="absolute inset-0 bg-black/10 transition-opacity group-hover:opacity-0" />
                        <span className="text-black font-black text-6xl opacity-20 italic">{i + 1}</span>
                      </div>
                      <div className="text-center w-full px-2">
                        <p className="font-black uppercase truncate text-sm tracking-tight">{player.name}</p>
                        <p className="text-[10px] font-bold uppercase opacity-60 truncate">{player.teamName}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 'power-rankings':
        return (
          <div className="w-full h-full bg-[#1e1b4b] p-10 flex flex-col relative overflow-hidden text-white">
             <div className="absolute inset-0 opacity-5">
              <div className="grid grid-cols-8 h-full">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="border-r border-white" />
                ))}
              </div>
            </div>

            <div className="relative z-10 flex flex-col h-full">
              <div className="mb-10 flex items-end justify-between">
                <div>
                  <div className="bg-[#00FF85] text-black text-[10px] font-black px-3 py-0.5 rounded-sm uppercase tracking-widest mb-2 inline-block">Trending Now</div>
                  <h2 className="text-6xl font-black uppercase tracking-tighter italic italic drop-shadow-md">Power Rankings</h2>
                </div>
                <Trophy className="w-16 h-16 text-[#00FF85]/20" />
              </div>

              <div className="flex-1 space-y-4">
                {data?.map((team: any, i: number) => (
                  <motion.div 
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    key={i} 
                    className="flex items-center gap-6"
                  >
                    <span className="text-4xl font-black italic text-[#00FF85] w-12 text-center">{i + 1}</span>
                    <div className="flex-1 h-14 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 flex items-center px-6 justify-between group hover:bg-white/10 transition-colors">
                      <span className="text-xl font-black uppercase tracking-tight">{team.name}</span>
                      <div className="flex items-center gap-4">
                        <div className="h-1.5 w-32 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-[#00FF85]" 
                            style={{ width: `${Math.min(100, (team.pts / (data[0].pts || 1)) * 100)}%` }} 
                          />
                        </div>
                        <span className="text-2xl font-black tabular-nums">{team.pts}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 text-[10px] font-black text-white/30 uppercase tracking-[0.3em] flex items-center gap-4">
                <p>KickOff Intelligence Unit</p>
                <div className="h-0.5 flex-1 bg-white/10" />
              </div>
            </div>
          </div>
        );

      case 'team-stats':
        return (
          <div className="w-full h-full bg-[#3D195B] p-10 flex flex-col relative overflow-hidden text-white">
            <div className="absolute -left-20 -top-20 w-80 h-80 bg-[#00FF85] rounded-full blur-[120px] opacity-10" />
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center justify-between mb-8 border-b-2 border-[#00FF85] pb-6">
                <div>
                  <h2 className="text-5xl font-black uppercase tracking-tighter italic">League Leaders</h2>
                  <p className="text-[#00FF85] text-xs font-black uppercase tracking-[0.2em] mt-1">Tournament Statistical Breakdown</p>
                </div>
                <div className="text-right">
                   <p className="text-3xl font-black italic opacity-20">STAT TRACK</p>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-2 gap-8">
                {data?.map((group: any, i: number) => (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.15 }}
                    key={i} 
                    className="flex flex-col"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1.5 h-4 bg-[#00FF85]" />
                      <h4 className="text-sm font-black uppercase tracking-widest text-[#00FF85]">{group.title}</h4>
                    </div>
                    <div className="space-y-2">
                      {group.teams.slice(0, 3).map((team: any, j: number) => (
                        <div key={j} className="flex items-center justify-between h-10 px-4 bg-white/5 rounded-lg border border-white/5">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-black opacity-40">{j + 1}</span>
                            <span className="text-sm font-black uppercase tracking-tighter">{team.name}</span>
                          </div>
                          <span className="text-lg font-black text-[#00FF85] italic">{team.value}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center p-12 text-center">
            <Activity className="w-16 h-16 text-primary mb-6 animate-pulse" />
            <h2 className="text-2xl font-black text-white uppercase tracking-widest">Generating Insight...</h2>
            <p className="text-slate-400 mt-2">Connecting to tournament data streams</p>
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
