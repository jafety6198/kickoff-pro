import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Eye, Lock, ArrowRight, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';

export function EntryGate() {
  const { setRole, setStep, setUser } = useStore();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = isLogin 
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

      if (error) throw error;

      if (data.user) {
        setUser(data.user);
        setRole('admin');
        setStep('profiles');
        toast.success(isLogin ? 'Welcome back!' : 'Account created successfully');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
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
          <p className="text-primary font-black uppercase tracking-[0.4em] text-[10px] sm:text-sm">Cloud Tournament Hub</p>
        </motion.div>

        {!showAuth ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Commissioner Card */}
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAuth(true)}
              className="glass-card p-8 sm:p-10 cursor-pointer group"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 sm:mb-8 group-hover:scale-110 transition-transform">
                <Lock className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4">Commissioner</h2>
              <p className="text-slate-600 font-medium leading-relaxed mb-8 text-sm sm:text-base">
                Sign in to manage your private leagues and sync your progress across all devices.
              </p>
              <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px] sm:text-xs">
                Login / Register <ArrowRight className="w-4 h-4" />
              </div>
            </motion.div>

            {/* Guest/Shared Card */}
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
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4">Join League</h2>
              <p className="text-slate-600 font-medium leading-relaxed mb-8 text-sm sm:text-base">
                Access a shared league using a join code or invitation password.
              </p>
              <div className="flex items-center gap-2 text-slate-400 font-black uppercase tracking-widest text-[10px] sm:text-xs">
                Enter League <ArrowRight className="w-4 h-4" />
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
              onClick={() => setShowAuth(false)}
              className="text-slate-400 hover:text-slate-600 mb-8 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-colors"
            >
              Back to Selection
            </button>
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-8">
              <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tighter mb-6">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <Input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input w-full text-slate-900"
                  placeholder="name@example.com"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                <Input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                  className="glass-input w-full text-slate-900"
                  placeholder="••••••••"
                />
              </div>
              <Button 
                onClick={handleAuth}
                disabled={loading}
                className="w-full h-14 rounded-2xl bg-gradient-primary text-white font-black uppercase tracking-widest hover:opacity-90 transition-opacity mt-4"
              >
                {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
              </Button>
              
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="w-full text-center text-xs font-bold text-slate-400 hover:text-primary transition-colors py-2"
              >
                {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
