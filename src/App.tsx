import React from 'react';
import { useStore } from '@/store/useStore';
import { EntryGate } from '@/components/auth/EntryGate';
import { ProfileSelector } from '@/components/auth/ProfileSelector';
import { TournamentSetup } from '@/components/setup/TournamentSetup';
import { TeamEditor } from '@/components/setup/TeamEditor';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { Toaster } from '@/components/ui/sonner';

export default function App() {
  const { step } = useStore();

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
