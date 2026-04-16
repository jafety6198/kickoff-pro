import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Users, Plus, Trash2, ChevronRight, ChevronLeft, Check, Upload, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EPL_TEAMS } from '@/constants';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface SetupWizardProps {
  onComplete: () => void;
}

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<'league' | 'tournament' | null>(null);
  const [participantCount, setParticipantCount] = useState(8);
  const [participants, setParticipants] = useState<Array<{ name: string; logo: string; isCustom: boolean }>>([]);
  const [loading, setLoading] = useState(false);

  const handleModeSelect = (selectedMode: 'league' | 'tournament') => {
    setMode(selectedMode);
    setStep(2);
  };

  const handleCountSubmit = () => {
    const initialParticipants = Array.from({ length: participantCount }, () => ({
      name: '',
      logo: '',
      isCustom: false
    }));
    setParticipants(initialParticipants);
    setStep(3);
  };

  const updateParticipant = (index: number, data: Partial<{ name: string; logo: string; isCustom: boolean }>) => {
    const newParticipants = [...participants];
    newParticipants[index] = { ...newParticipants[index], ...data };
    setParticipants(newParticipants);
  };

  const handleEPLSelect = (index: number, teamName: string) => {
    const team = EPL_TEAMS.find(t => t.name === teamName);
    if (team) {
      updateParticipant(index, { name: team.name, logo: team.logo, isCustom: false });
    }
  };

  const generateFixtures = async () => {
    setLoading(true);
    try {
      // 1. Clear existing data (as requested: "Resets the state")
      await supabase.from('match_stats').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('fixtures').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('teams').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      // 2. Insert Teams
      const { data: insertedTeams, error: teamError } = await supabase
        .from('teams')
        .insert(participants.map(p => ({
          name: p.name || `Club ${Math.random().toString(36).substr(2, 4)}`,
          logo_url: p.logo || `https://api.dicebear.com/7.x/identicon/svg?seed=${p.name}`
        })))
        .select();

      if (teamError) throw teamError;

      // 3. Generate Fixtures
      const fixtures = [];
      const teamIds = insertedTeams.map(t => t.id);
      const startDate = new Date();

      if (mode === 'league') {
        // Simple Round Robin algorithm
        for (let i = 0; i < teamIds.length; i++) {
          for (let j = i + 1; j < teamIds.length; j++) {
            const matchDate = new Date(startDate);
            matchDate.setDate(startDate.getDate() + (i + j) * 2);
            fixtures.push({
              team_a_id: teamIds[i],
              team_b_id: teamIds[j],
              tournament_type: 'league',
              status: 'pending',
              round: 1,
              match_date: matchDate.toISOString()
            });
          }
        }
      } else {
        // Knockout Brackets (Round 1)
        for (let i = 0; i < teamIds.length; i += 2) {
          if (teamIds[i + 1]) {
            const matchDate = new Date(startDate);
            matchDate.setDate(startDate.getDate() + (i / 2) * 2);
            fixtures.push({
              team_a_id: teamIds[i],
              team_b_id: teamIds[i + 1],
              tournament_type: 'knockout',
              status: 'pending',
              round: 1,
              match_date: matchDate.toISOString()
            });
          }
        }
      }

      const { error: fixtureError } = await supabase.from('fixtures').insert(fixtures);
      if (fixtureError) throw fixtureError;

      toast.success('Tournament initialized successfully!');
      onComplete();
    } catch (error: any) {
      console.error('Setup Error:', error);
      toast.error(error.message || 'Failed to initialize tournament');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F4F4] p-6 lg:p-12 flex items-center justify-center">
      <div className="max-w-4xl w-full">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-4xl font-black text-pl-purple uppercase tracking-tighter italic">Select Mode</h2>
                <p className="text-pl-purple/60 font-bold uppercase tracking-widest text-xs">Choose your tournament structure</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <button 
                  onClick={() => handleModeSelect('league')}
                  className="bg-white rounded-[40px] p-10 border-2 border-transparent hover:border-pl-purple transition-all group text-left shadow-xl shadow-black/5"
                >
                  <div className="w-16 h-16 rounded-2xl bg-pl-purple/5 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                    <Globe className="w-8 h-8 text-pl-purple" />
                  </div>
                  <h3 className="text-2xl font-black text-pl-purple uppercase tracking-tighter mb-2">League Mode</h3>
                  <p className="text-pl-purple/60 font-bold text-sm leading-relaxed">Round Robin format where everyone plays everyone. Perfect for a long season.</p>
                </button>

                <button 
                  onClick={() => handleModeSelect('tournament')}
                  className="bg-white rounded-[40px] p-10 border-2 border-transparent hover:border-pl-pink transition-all group text-left shadow-xl shadow-black/5"
                >
                  <div className="w-16 h-16 rounded-2xl bg-pl-pink/5 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                    <Trophy className="w-8 h-8 text-pl-pink" />
                  </div>
                  <h3 className="text-2xl font-black text-pl-purple uppercase tracking-tighter mb-2">Knockout Mode</h3>
                  <p className="text-pl-purple/60 font-bold text-sm leading-relaxed">Bracket-style tournament. Win or go home. High stakes action.</p>
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-md mx-auto space-y-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-4xl font-black text-pl-purple uppercase tracking-tighter italic">Participants</h2>
                <p className="text-pl-purple/60 font-bold uppercase tracking-widest text-xs">How many clubs are competing?</p>
              </div>

              <div className="bg-white rounded-[40px] p-10 shadow-xl shadow-black/5 space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-black text-pl-purple uppercase tracking-widest">Number of Clubs</span>
                    <span className="text-3xl font-black text-pl-purple italic">{participantCount}</span>
                  </div>
                  <input 
                    type="range" 
                    min="4" 
                    max="20" 
                    step="2"
                    value={participantCount}
                    onChange={(e) => setParticipantCount(parseInt(e.target.value))}
                    className="w-full h-2 bg-pl-purple/10 rounded-lg appearance-none cursor-pointer accent-pl-purple"
                  />
                  <div className="flex justify-between text-[10px] font-black text-pl-purple/40 uppercase">
                    <span>4 Clubs</span>
                    <span>20 Clubs</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button 
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1 h-16 rounded-2xl border-black/5 font-black uppercase tracking-widest"
                  >
                    <ChevronLeft className="w-5 h-5 mr-2" /> Back
                  </Button>
                  <Button 
                    onClick={handleCountSubmit}
                    className="flex-[2] h-16 rounded-2xl bg-pl-purple text-white font-black uppercase tracking-widest hover:bg-pl-dark"
                  >
                    Next Step <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-4xl font-black text-pl-purple uppercase tracking-tighter italic">Club Registration</h2>
                <p className="text-pl-purple/60 font-bold uppercase tracking-widest text-xs">Assign EPL teams or create custom ones</p>
              </div>

              <div className="bg-white rounded-[40px] p-8 shadow-xl shadow-black/5 max-h-[60vh] overflow-y-auto no-scrollbar border border-black/5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {participants.map((p, i) => (
                    <div key={i} className="p-6 rounded-3xl bg-pl-purple/5 border border-pl-purple/5 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-pl-purple/60 uppercase tracking-widest">Club {i + 1}</span>
                        {p.logo && (
                          <img src={p.logo} alt="Logo" className="w-8 h-8 object-contain" />
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <Select value={p.name} onValueChange={(val: string) => handleEPLSelect(i, val)}>
                          <SelectTrigger className="bg-white border-none h-12 rounded-xl font-bold text-pl-purple">
                            <SelectValue placeholder="Select EPL Team" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-none shadow-2xl">
                            {EPL_TEAMS.map(team => (
                              <SelectItem key={team.name} value={team.name} className="font-bold py-3">
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                            <Plus className="w-4 h-4 text-pl-purple/40" />
                          </div>
                          <Input 
                            value={p.name}
                            onChange={(e) => updateParticipant(i, { name: e.target.value, isCustom: true })}
                            placeholder="Or enter custom name"
                            className="bg-white border-none h-12 rounded-xl pl-10 font-bold text-pl-purple"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 max-w-md mx-auto">
                <Button 
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="flex-1 h-16 rounded-2xl border-black/5 font-black uppercase tracking-widest"
                >
                  Back
                </Button>
                <Button 
                  onClick={generateFixtures}
                  disabled={loading}
                  className="flex-[2] h-16 rounded-2xl bg-pl-green text-pl-dark font-black uppercase tracking-widest hover:opacity-90 shadow-xl shadow-pl-green/20"
                >
                  {loading ? 'Initializing...' : 'Generate Tournament'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
