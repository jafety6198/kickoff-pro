import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Trophy, TrendingDown, ChevronRight, Star, Award, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Team, useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

interface SeasonEndModalProps {
  winner: Team;
  relegated: Team[];
  isOpen: boolean;
  onNextSeason: () => void;
}

export function SeasonEndModal({ winner, relegated, isOpen, onNextSeason }: SeasonEndModalProps) {
  useEffect(() => {
    if (isOpen) {
      const duration = 5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/90 backdrop-blur-md overflow-y-auto py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-4xl bg-white rounded-[3rem] overflow-hidden shadow-2xl relative border border-slate-100"
      >
        {/* Decorative Background */}
        <div className="absolute top-0 left-0 w-full h-64 bg-slate-50" />
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-primary/10 to-transparent" />
        
        <div className="relative z-10 p-8 sm:p-12 space-y-12">
          {/* Winner Poster */}
          <div className="text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-4">
                <Star className="w-3 h-3 fill-current" /> Season Champions <Star className="w-3 h-3 fill-current" />
              </div>
              <h2 className="text-5xl sm:text-7xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">
                {winner.name}
              </h2>
            </motion.div>
            
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12, delay: 0.4 }}
              className="relative inline-block"
            >
              <div className="absolute inset-0 bg-primary blur-3xl opacity-20 animate-pulse" />
              <div className="relative w-48 h-48 sm:w-64 sm:h-64 rounded-[3rem] bg-white p-8 shadow-2xl border-4 border-primary/20">
                <img 
                  src={winner.logo} 
                  alt={winner.name} 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-primary rounded-2xl flex items-center justify-center shadow-xl rotate-12">
                <Trophy className="w-10 h-10 text-white" />
              </div>
            </motion.div>

            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-900">
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Points</p>
                <p className="text-xl font-black">{winner.pts}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-900">
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Wins</p>
                <p className="text-xl font-black">{winner.won}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-900">
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">GD</p>
                <p className="text-xl font-black">+{winner.gd}</p>
              </div>
            </div>
          </div>

          {/* Relegation Zone */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-100" />
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-500" /> Relegation Zone
              </h3>
              <div className="h-px flex-1 bg-slate-100" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relegated.map((team, idx) => (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + (idx * 0.1) }}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-red-50 border border-red-100"
                >
                  <div className="w-12 h-12 rounded-xl bg-white p-2 border border-red-200 shrink-0">
                    <img src={team.logo} alt={team.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-900 uppercase truncate">{team.name}</p>
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Relegated</p>
                  </div>
                </motion.div>
              ))}
              {relegated.length === 0 && (
                <div className="col-span-full text-center py-4 text-slate-400 font-bold uppercase tracking-widest text-xs">
                  No teams relegated this season
                </div>
              )}
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-4">
            <Button
              onClick={onNextSeason}
              className="w-full h-20 rounded-[2rem] bg-primary text-white font-black uppercase tracking-[0.2em] text-lg transition-all shadow-xl shadow-primary/20 hover:shadow-primary/40 group"
            >
              Prepare Next Season <ChevronRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
