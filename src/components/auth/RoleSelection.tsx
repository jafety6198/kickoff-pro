import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Eye, Lock, ArrowRight, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface RoleSelectionProps {
  onSelect: (role: 'admin' | 'guest') => void;
}

export function RoleSelection({ onSelect }: RoleSelectionProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');

  const handleAdminClick = () => {
    setShowPassword(true);
  };

  const handleAdminLogin = () => {
    // For demo purposes, we'll use a simple password check
    // In a real app, this would use supabase.auth.signInWithPassword
    if (password === 'JAPHET123%') {
      onSelect('admin');
      toast.success('Admin access granted');
    } else {
      toast.error('Invalid password');
    }
  };

  return (
    <div className="min-h-screen bg-pl-dark flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pl-purple/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pl-green/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-4xl w-full relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-pl-green mb-6 shadow-lg shadow-pl-green/20">
            <Trophy className="w-10 h-10 text-pl-dark" />
          </div>
          <h1 className="text-5xl font-black text-white uppercase tracking-tighter mb-2">KickOff Pro</h1>
          <p className="text-pl-green font-black uppercase tracking-[0.3em] text-sm">Premier League Commissioner</p>
        </motion.div>

        {!showPassword ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Admin Card */}
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAdminClick}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[40px] p-10 cursor-pointer group transition-all hover:bg-white/10"
            >
              <div className="w-16 h-16 rounded-2xl bg-pl-purple flex items-center justify-center mb-8 shadow-lg shadow-pl-purple/20 group-hover:scale-110 transition-transform">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Commissioner</h2>
              <p className="text-white/60 font-medium leading-relaxed mb-8">
                Full access to manage teams, generate fixtures, and scan match results.
              </p>
              <div className="flex items-center gap-2 text-pl-green font-black uppercase tracking-widest text-xs">
                Enter Dashboard <ArrowRight className="w-4 h-4" />
              </div>
            </motion.div>

            {/* Guest Card */}
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect('guest')}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[40px] p-10 cursor-pointer group transition-all hover:bg-white/10"
            >
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <Eye className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Guest View</h2>
              <p className="text-white/60 font-medium leading-relaxed mb-8">
                View live tables, upcoming fixtures, and official match posters.
              </p>
              <div className="flex items-center gap-2 text-white/60 font-black uppercase tracking-widest text-xs">
                View Only Mode <ArrowRight className="w-4 h-4" />
              </div>
            </motion.div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto bg-white/5 backdrop-blur-xl border border-white/10 rounded-[40px] p-10"
          >
            <button 
              onClick={() => setShowPassword(false)}
              className="text-white/60 hover:text-white mb-8 flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
            >
              Back to Selection
            </button>
            <div className="w-16 h-16 rounded-2xl bg-pl-purple flex items-center justify-center mb-8">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-6">Security Check</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/60 uppercase tracking-widest ml-1">Admin Password</label>
                <Input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                  className="bg-white/5 border-white/10 h-14 rounded-2xl text-white font-bold px-6 focus:ring-pl-green"
                  placeholder="••••••••"
                  autoFocus
                />
              </div>
              <Button 
                onClick={handleAdminLogin}
                className="w-full h-14 rounded-2xl bg-pl-green text-pl-dark font-black uppercase tracking-widest hover:bg-pl-green/90"
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
