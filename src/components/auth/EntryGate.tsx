import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Eye, Lock, ArrowRight, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useStore } from '@/store/useStore';

export function EntryGate() {
  const { setRole, setStep } = useStore();
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');

  const handleAdminLogin = () => {
    if (password === 'JAPHET123%') {
      setRole('admin');
      setStep('profiles');
      toast.success('Admin access granted');
    } else {
      toast.error('Invalid password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-slate-50">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-accent/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-4xl w-full relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10 sm:mb-16"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-primary mb-6 shadow-2xl shadow-primary/20">
            <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 uppercase tracking-tighter mb-2">KickOff Pro</h1>
          <p className="text-primary font-black uppercase tracking-[0.4em] text-[10px] sm:text-sm">Tournament Management System</p>
        </motion.div>

        {!showPassword ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Admin Card */}
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowPassword(true)}
              className="glass-card p-8 sm:p-10 cursor-pointer group"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 sm:mb-8 group-hover:scale-110 transition-transform">
                <Lock className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4">Commissioner</h2>
              <p className="text-slate-600 font-medium leading-relaxed mb-8 text-sm sm:text-base">
                Full access to manage teams, generate fixtures, and record scores.
              </p>
              <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px] sm:text-xs">
                Enter Dashboard <ArrowRight className="w-4 h-4" />
              </div>
            </motion.div>

            {/* Guest Card */}
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setRole('guest');
                setStep('profiles');
              }}
              className="glass-card p-8 sm:p-10 cursor-pointer group"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-6 sm:mb-8 group-hover:scale-110 transition-transform">
                <Eye className="w-6 h-6 sm:w-8 sm:h-8 text-slate-600" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4">Guest View</h2>
              <p className="text-slate-600 font-medium leading-relaxed mb-8 text-sm sm:text-base">
                View live tables, upcoming fixtures, and official tournament stats.
              </p>
              <div className="flex items-center gap-2 text-slate-400 font-black uppercase tracking-widest text-[10px] sm:text-xs">
                View Only Mode <ArrowRight className="w-4 h-4" />
              </div>
            </motion.div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto glass-card p-8 sm:p-10"
          >
            <button 
              onClick={() => setShowPassword(false)}
              className="text-slate-400 hover:text-slate-600 mb-8 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-colors"
            >
              Back to Selection
            </button>
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-8">
              <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tighter mb-6">Security Check</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Admin Password</label>
                <Input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                  className="glass-input w-full text-slate-900"
                  placeholder="••••••••"
                  autoFocus
                />
              </div>
              <Button 
                onClick={handleAdminLogin}
                className="w-full h-14 rounded-2xl bg-gradient-primary text-white font-black uppercase tracking-widest hover:opacity-90 transition-opacity"
              >
                Unlock Dashboard
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
