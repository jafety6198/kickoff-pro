import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, Globe, ChevronRight, Users, Edit3, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';

export function TournamentSetup() {
  const { createProfile, setTeamCount, teamCount, setStep } = useStore();
  const [leagueName, setLeagueName] = useState('');

  const handleModeSelect = (mode: 'league' | 'knockout') => {
    if (!leagueName.trim()) {
      toast.error('Please enter a league name first');
      return;
    }
    createProfile(leagueName.trim(), mode, teamCount);
    toast.success(`${leagueName} career initialized!`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-50 relative">
      {/* Back Button */}
      <div className="absolute top-8 left-8">
        <Button 
          variant="ghost"
          onClick={() => setStep('profiles')}
          className="text-slate-400 hover:text-slate-900 font-black uppercase tracking-widest text-[10px] sm:text-xs"
        >
          <ChevronLeft className="w-4 h-4 mr-2" /> Back to Career Hub
        </Button>
      </div>

      <div className="max-w-4xl w-full space-y-8 sm:space-y-12">
        <div className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-2 sm:mb-4"
          >
            <Trophy className="w-3 h-3" />
            Tournament Setup
          </motion.div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 uppercase tracking-tighter italic">Start New Career</h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] sm:text-xs">Define your league parameters and begin your journey</p>
        </div>

        <div className="max-w-md mx-auto space-y-8">
          {/* League Name Input */}
          <div className="glass-card p-8 sm:p-10 space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">League Name</label>
            <div className="relative">
              <Edit3 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <Input 
                value={leagueName}
                onChange={(e) => setLeagueName(e.target.value)}
                placeholder="e.g. Premier League 2024"
                className="glass-input w-full pl-12 font-bold text-slate-900 h-14"
              />
            </div>
          </div>

          {/* Team Count Slider */}
          <div className="glass-card p-8 sm:p-10 space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Number of Clubs
                </span>
                <span className="text-2xl sm:text-3xl font-black text-primary italic">{teamCount}</span>
              </div>
              <input 
                type="range" 
                min="2" 
                max="30" 
                step="1"
                value={teamCount}
                onChange={(e) => setTeamCount(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[8px] sm:text-[10px] font-black text-slate-300 uppercase">
                <span>2 Clubs</span>
                <span>30 Clubs</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          <motion.button 
            whileHover={{ y: -5 }}
            onClick={() => handleModeSelect('league')}
            className="glass-card p-8 sm:p-10 text-left group border-2 border-transparent hover:border-primary/50 transition-all"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 sm:mb-8 group-hover:scale-110 transition-transform">
              <Globe className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">League Mode</h3>
            <p className="text-slate-500 font-bold text-xs sm:text-sm leading-relaxed">Round Robin format where everyone plays everyone. Perfect for a long season.</p>
          </motion.button>

          <motion.button 
            whileHover={{ y: -5 }}
            onClick={() => handleModeSelect('knockout')}
            className="glass-card p-8 sm:p-10 text-left group border-2 border-transparent hover:border-accent/50 transition-all"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-6 sm:mb-8 group-hover:scale-110 transition-transform">
              <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-accent" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">Knockout Mode</h3>
            <p className="text-slate-500 font-bold text-xs sm:text-sm leading-relaxed">Bracket-style tournament. Win or go home. High stakes action.</p>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
