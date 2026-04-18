import React, { useState, useMemo } from 'react';
import { Sparkles, Loader2, Brain, Zap, Target, TrendingUp, ChevronRight, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore, Fixture, Team } from '@/store/useStore';
import { calculateLocalPrediction } from '@/lib/predictor';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function AIOracle() {
  const { teams, fixtures, tournamentName, updateFixturePrediction } = useStore();
  const [predictingId, setPredictingId] = useState<string | null>(null);
  const [masterPredicting, setMasterPredicting] = useState(false);

  const upcomingMatches = useMemo(() => {
    return fixtures.filter(f => f.status === 'pending').sort((a, b) => a.round - b.round);
  }, [fixtures]);

  const handlePredict = async (fixture: Fixture) => {
    const homeTeam = teams.find(t => t.id === fixture.homeTeamId);
    const awayTeam = teams.find(t => t.id === fixture.awayTeamId);
    
    if (!homeTeam || !awayTeam) return;

    try {
      setPredictingId(fixture.id);
      
      // Simulate a small delay for "thinking" effect
      await new Promise(resolve => setTimeout(resolve, 600));

      const prediction = calculateLocalPrediction(homeTeam, awayTeam, fixtures);
      
      if (prediction.homeScore !== undefined) {
        updateFixturePrediction(fixture.id, prediction);
      }
    } catch (error) {
      console.error('Prediction Error:', error);
      toast.error('Prediction engine encountered a calculation error.');
    } finally {
      setPredictingId(null);
    }
  };

  const predictAll = async () => {
    const unpredicted = upcomingMatches.filter(m => !m.prediction);
    if (unpredicted.length === 0) {
      toast.info('All upcoming matches already have predictions!');
      return;
    }

    try {
      setMasterPredicting(true);
      toast.loading('Oracle is calculating all upcoming results...', { id: 'predict-all' });
      
      // We do them sequentially or in small batches to respect rate limits if many
      for (const fixture of unpredicted) {
        await handlePredict(fixture);
      }
      
      toast.success('All upcoming matches predicted!', { id: 'predict-all' });
    } catch (error) {
      toast.error('Failed to complete all predictions', { id: 'predict-all' });
    } finally {
      setMasterPredicting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-4 sm:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
            <Sparkles className="w-3 h-3" />
            AI Oracle Engine
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter italic">Match <span className="text-primary">Oracle</span></h2>
          <p className="text-sm text-slate-500 font-medium max-w-md">Precision AI analysis for upcoming fixtures based on team chemistry, form, and tactical depth.</p>
        </div>
        
        <Button 
          onClick={predictAll}
          disabled={masterPredicting || upcomingMatches.length === 0}
          className="h-14 px-8 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-xs hover:bg-slate-800 shadow-2xl shadow-slate-200 transition-all group"
        >
          {masterPredicting ? (
            <Loader2 className="w-5 h-5 mr-3 animate-spin" />
          ) : (
            <Brain className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
          )}
          Predict Full Schedule
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confidence Rating</p>
            <p className="text-xl font-black text-slate-900 italic">High Fidelity</p>
          </div>
        </div>
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Model Engine</p>
            <p className="text-xl font-black text-slate-900 italic">Lumina Math Engine</p>
          </div>
        </div>
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Upcoming Matches</p>
            <p className="text-xl font-black text-slate-900 italic">{upcomingMatches.length} Pending</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic flex items-center gap-2">
          Upcoming Prediction Queue
          <Badge className="bg-slate-100 text-slate-400 border-none font-black">{upcomingMatches.length}</Badge>
        </h3>
        
        {upcomingMatches.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {upcomingMatches.map((fixture) => {
              const homeTeam = teams.find(t => t.id === fixture.homeTeamId);
              const awayTeam = teams.find(t => t.id === fixture.awayTeamId);
              
              return (
                <motion.div 
                  layout
                  key={fixture.id}
                  className="glass-card p-6 border rounded-3xl border-slate-200 bg-white group hover:border-primary/30 transition-all duration-300"
                >
                  <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-8 flex-1 justify-center md:justify-start">
                      <div className="flex flex-col items-center gap-2 w-24">
                        <img src={homeTeam?.logo} className="w-12 h-12 object-contain" referrerPolicy="no-referrer" />
                        <span className="text-[10px] font-black text-slate-900 uppercase text-center truncate w-full">{homeTeam?.name}</span>
                      </div>
                      
                      <div className="flex flex-col items-center shrink-0">
                        <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-1">VS</div>
                        <div className="h-px w-8 bg-slate-100" />
                      </div>

                      <div className="flex flex-col items-center gap-2 w-24">
                        <img src={awayTeam?.logo} className="w-12 h-12 object-contain" referrerPolicy="no-referrer" />
                        <span className="text-[10px] font-black text-slate-900 uppercase text-center truncate w-full">{awayTeam?.name}</span>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col items-center md:items-start gap-2">
                       {fixture.prediction ? (
                         <div className="space-y-2 w-full">
                           <div className="flex items-center gap-3">
                             <div className="text-3xl font-black italic text-primary leading-none">
                               {fixture.prediction.homeScore} - {fixture.prediction.awayScore}
                             </div>
                             <Badge className="bg-primary text-white border-none font-black text-[9px] uppercase tracking-widest">
                               Math Forecast
                             </Badge>
                           </div>
                           <p className="text-xs text-slate-500 font-medium italic border-l-2 border-primary/20 pl-3">
                             "{fixture.prediction.reasoning || 'Tactical analysis suggests equilibrium.'}"
                           </p>
                         </div>
                       ) : (
                         <div className="flex items-center gap-2 text-slate-300">
                           <AlertCircle className="w-4 h-4" />
                           <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Analysis</p>
                         </div>
                       )}
                    </div>

                    <Button
                      onClick={() => handlePredict(fixture)}
                      disabled={predictingId === fixture.id}
                      variant="outline"
                      className="rounded-xl border-slate-200 text-[10px] font-black uppercase tracking-widest h-10 px-6 hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all"
                    >
                      {predictingId === fixture.id ? (
                        <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3 mr-2" />
                      )}
                      {fixture.prediction ? 'Recalculate' : 'Analyze'}
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
            <Zap className="w-12 h-12 text-slate-200 mb-4" />
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No pending fixtures found</p>
            <p className="text-xs text-slate-300 mt-2 italic font-medium">Generate matches to begin AI predictions.</p>
          </div>
        )}
      </div>
    </div>
  );
}
