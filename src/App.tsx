import React, { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { EntryGate } from '@/components/auth/EntryGate';
import { ProfileSelector } from '@/components/auth/ProfileSelector';
import { TournamentSetup } from '@/components/setup/TournamentSetup';
import { TeamEditor } from '@/components/setup/TeamEditor';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { Toaster } from '@/components/ui/sonner';

export default function App() {
  const { step, setUser, syncLeagues } = useStore();

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        syncLeagues();
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        syncLeagues();
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, syncLeagues]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-primary/10">
      {step === 'entry' && <EntryGate />}
      {step === 'profiles' && <ProfileSelector />}
      {step === 'setup' && <TournamentSetup />}
      {step === 'editor' && <TeamEditor />}
      {step === 'dashboard' && <Dashboard />}
      
      <Toaster position="top-right" expand={false} richColors />
    </div>
  );
}
