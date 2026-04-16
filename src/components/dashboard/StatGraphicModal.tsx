import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, TrendingUp, AlertTriangle, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useStore } from '@/store/useStore';

interface StatGraphicModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'golden-boot' | 'power-rankings' | 'season-highs' | 'team-stats' | 'relegation' | 'form' | 'underdog';
  data?: any;
}

export function StatGraphicModal({ isOpen, onClose, type, data }: StatGraphicModalProps) {
  const { tournamentName } = useStore();

  if (!isOpen) return null;

  const renderContent = () => {
    switch (type) {
      case 'golden-boot':
        return (
          <div className="w-full h-full bg-gradient-to-br from-amber-500 to-orange-700 p-8 flex flex-col relative overflow-hidden text-white">
            <div className="absolute top-0 right-0 p-12 opacity-10">
              <Trophy className="w-64 h-64" />
            </div>
            <div className="relative z-10 flex flex-col h-full">
              <div className="mb-8">
                <h2 className="text-5xl font-black uppercase tracking-tighter italic">Golden Boot Race</h2>
                <p className="text-amber-200 font-bold uppercase tracking-widest">{tournamentName}</p>
              </div>
              
              <div className="flex-1 flex items-end justify-center gap-4 pb-12">
                {data?.slice(0, 3).map((player: any, i: number) => {
                  const height = i === 0 ? 'h-64' : i === 1 ? 'h-48' : 'h-32';
                  const bg = i === 0 ? 'bg-amber-300' : i === 1 ? 'bg-slate-300' : 'bg-orange-400';
                  return (
                    <div key={player.id} className="flex flex-col items-center gap-4 w-32">
                      <div className="text-center">
                        <p className="font-black text-2xl">{player.goals}</p>
                        <p className="text-xs font-bold uppercase opacity-80">Goals</p>
                      </div>
                      <div className={`w-full ${height} ${bg} rounded-t-xl flex items-end justify-center pb-4 shadow-2xl`}>
                        <span className="text-black font-black text-4xl opacity-20">{i + 1}</span>
                      </div>
                      <div className="text-center">
                        <p className="font-black uppercase truncate w-full">{player.name}</p>
                        <p className="text-[10px] uppercase opacity-80 truncate w-full">{player.teamName}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 'power-rankings':
        return (
          <div className="w-full h-full bg-slate-900 p-8 flex flex-col relative overflow-hidden text-white">
            <div className="mb-8">
              <h2 className="text-4xl font-black uppercase tracking-tighter text-primary">Power Rankings</h2>
              <p className="text-slate-400 font-bold uppercase tracking-widest">Based on Form & Stats</p>
            </div>
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.slice(0, 5)} layout="vertical" margin={{ top: 0, right: 0, left: 40, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'white', fontSize: 12, fontWeight: 'bold' }} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.1)' }} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }} />
                  <Bar dataKey="pts" radius={[0, 4, 4, 0]}>
                    {data?.slice(0, 5).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#00FF85' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case 'team-stats':
        return (
          <div className="w-full h-full bg-indigo-950 p-8 flex flex-col relative overflow-hidden text-white">
            <div className="mb-8">
              <h2 className="text-4xl font-black uppercase tracking-tighter text-indigo-400">Team Stats</h2>
              <p className="text-indigo-200 font-bold uppercase tracking-widest">League Leaders</p>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-6">
              {data?.map((statGroup: any, i: number) => (
                <div key={i} className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-4">{statGroup.title}</p>
                  <div className="space-y-3">
                    {statGroup.teams.slice(0, 3).map((team: any, j: number) => (
                      <div key={j} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-indigo-400 font-black text-sm">{j + 1}</span>
                          <span className="font-bold text-sm uppercase truncate max-w-[100px]">{team.name}</span>
                        </div>
                        <span className="font-black text-indigo-300">{team.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'relegation':
        return (
          <div className="w-full h-full bg-red-950 p-8 flex flex-col relative overflow-hidden text-white border-4 border-red-600">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5">
              <AlertTriangle className="w-96 h-96" />
            </div>
            <div className="relative z-10 flex flex-col items-center justify-center h-full text-center space-y-8">
              <div className="bg-red-600 text-white px-6 py-2 uppercase font-black tracking-[0.3em] text-sm animate-pulse">
                Breaking News
              </div>
              <h2 className="text-6xl font-black uppercase tracking-tighter italic leading-none">
                Relegation<br/>Danger
              </h2>
              <p className="text-red-300 font-bold text-lg max-w-md">
                These teams are fighting for survival in the {tournamentName}. Time is running out!
              </p>
              <div className="flex gap-6 mt-8">
                {data?.slice(-3).map((team: any, i: number) => (
                  <div key={i} className="bg-black/40 p-4 rounded-xl border border-red-500/30 flex flex-col items-center gap-2">
                    <img src={team.logo} className="w-16 h-16 object-contain" />
                    <span className="font-black uppercase text-sm">{team.name}</span>
                    <span className="text-red-400 font-bold text-xs">{team.pts} PTS</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'form':
        return (
          <div className="w-full h-full bg-emerald-950 p-8 flex flex-col relative overflow-hidden text-white border-4 border-emerald-500">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5">
              <TrendingUp className="w-96 h-96" />
            </div>
            <div className="relative z-10 flex flex-col items-center justify-center h-full text-center space-y-8">
              <div className="bg-emerald-500 text-white px-6 py-2 uppercase font-black tracking-[0.3em] text-sm">
                Team in Focus
              </div>
              <h2 className="text-6xl font-black uppercase tracking-tighter italic leading-none">
                Unstoppable
              </h2>
              {data?.[0] && (
                <div className="flex flex-col items-center gap-4 mt-8">
                  <img src={data[0].logo} className="w-32 h-32 object-contain drop-shadow-[0_0_30px_rgba(16,185,129,0.5)]" />
                  <span className="font-black uppercase text-3xl">{data[0].name}</span>
                  <div className="flex gap-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="w-8 h-8 rounded bg-emerald-500 flex items-center justify-center font-black text-sm">W</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="w-full h-full bg-slate-900 flex items-center justify-center">
            <p className="text-white font-bold">Graphic not available</p>
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-slate-900/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-4xl flex flex-col"
        >
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">View Graphic</h3>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="p-8 bg-slate-100 flex items-center justify-center overflow-auto">
            {/* The Graphic Container */}
            <div className="w-[800px] h-[600px] bg-white shadow-xl rounded-2xl overflow-hidden shrink-0">
              {renderContent()}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
