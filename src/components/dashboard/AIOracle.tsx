import React, { useState, useMemo, useRef } from 'react';
import { Sparkles, Loader2, Brain, Zap, Target, TrendingUp, ChevronRight, AlertCircle, Download, Layout } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore, Fixture, Team } from '@/store/useStore';
import { calculateLocalPrediction } from '@/lib/predictor';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { toPng } from 'html-to-image';

export function AIOracle() {
  const { teams, fixtures, tournamentName, updateFixturePrediction } = useStore();
  const [predictingId, setPredictingId] = useState<string | null>(null);
  const [masterPredicting, setMasterPredicting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const groupedMatches = useMemo(() => {
    const upcoming = fixtures.filter(f => f.leg1?.status === 'pending' || f.leg2?.status === 'pending');
    const groups: { [key: number]: Fixture[] } = {};
    
    upcoming.forEach(f => {
      if (!groups[f.round]) groups[f.round] = [];
      groups[f.round].push(f);
    });

    return Object.entries(groups).sort(([a], [b]) => Number(a) - Number(b));
  }, [fixtures]);

  const upcomingMatchesCount = fixtures.filter(f => f.leg1?.status === 'pending' || f.leg2?.status === 'pending').length;

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
    const upcoming = fixtures.filter(f => f.leg1?.status === 'pending' || f.leg2?.status === 'pending');
    const unpredicted = upcoming.filter(m => !m.prediction);
    if (unpredicted.length === 0) {
      toast.info('All upcoming matches already have predictions!');
      return;
    }

    try {
      setMasterPredicting(true);
      toast.loading('Oracle is calculating all upcoming results...', { id: 'predict-all' });
      
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

  const handleExportGraphic = async () => {
    if (!exportRef.current) return;
    try {
      setIsExporting(true);
      toast.loading('Generating prediction summary...', { id: 'export-oracle' });
      
      const dataUrl = await toPng(exportRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#f8fafc'
      });
      
      const link = document.createElement('a');
      link.download = `${tournamentName.replace(/\s+/g, '_')}_Oracle_Predictions.png`;
      link.href = dataUrl;
      link.click();
      
      toast.success('Prediction summary exported!', { id: 'export-oracle' });
    } catch (error) {
      toast.error('Failed to export graphic', { id: 'export-oracle' });
    } finally {
      setIsExporting(false);
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
          <p className="text-sm text-slate-500 font-medium max-w-md">Precision math-driven analysis for upcoming fixtures based on team chemistry, form, and tactical depth.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <Button 
            onClick={handleExportGraphic}
            disabled={isExporting || upcomingMatchesCount === 0}
            variant="outline"
            className="h-14 px-8 rounded-2xl border-slate-200 text-slate-900 font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export Summary
          </Button>

          <Button 
            onClick={predictAll}
            disabled={masterPredicting || upcomingMatchesCount === 0}
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
            <p className="text-xl font-black text-slate-900 italic">{upcomingMatchesCount} Pending</p>
          </div>
        </div>
      </div>

      <div className="space-y-12">
        {groupedMatches.length > 0 ? (
          groupedMatches.map(([round, roundFixtures]) => (
            <div key={round} className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-200" />
                <Badge className="bg-slate-900 text-white border-none py-2 px-6 rounded-full font-black uppercase tracking-[0.2em] text-[10px]">
                  Matchday {round}
                </Badge>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <div className="grid grid-cols-1 gap-4">
                {roundFixtures.map((fixture) => {
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
            </div>
          ))
        ) : (
          <div className="h-64 flex flex-col items-center justify-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
            <Zap className="w-12 h-12 text-slate-200 mb-4" />
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No pending fixtures found</p>
            <p className="text-xs text-slate-300 mt-2 italic font-medium">Generate matches to begin predictions.</p>
          </div>
        )}
      </div>

      {/* Hidden Export Component */}
      <div className="fixed -left-[2000px] top-0">
        <div 
          ref={exportRef}
          className="w-[1080px] p-20 bg-slate-50 space-y-12"
        >
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white text-xs font-black uppercase tracking-[0.3em]">
              <Brain className="w-4 h-4" />
              Lumina Math Oracle
            </div>
            <h1 className="text-7xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">
              Matchday <span className="text-primary">Predictions</span>
            </h1>
            <p className="text-2xl font-bold text-slate-400 uppercase tracking-widest italic">{tournamentName}</p>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {fixtures.filter(f => f.leg1?.status === 'pending' || f.leg2?.status === 'pending').slice(0, 10).map((fixture) => {
              const homeTeam = teams.find(t => t.id === fixture.homeTeamId);
              const awayTeam = teams.find(t => t.id === fixture.awayTeamId);
              return (
                <div key={fixture.id} className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex items-center justify-between gap-6">
                  <div className="flex flex-col items-center gap-3 w-32">
                    <img src={homeTeam?.logo} className="w-16 h-16 object-contain" referrerPolicy="no-referrer" />
                    <span className="text-xs font-black text-slate-900 uppercase text-center">{homeTeam?.name}</span>
                  </div>
                  
                  <div className="flex-1 flex flex-col items-center justify-center">
                    {fixture.prediction ? (
                      <div className="text-4xl font-black italic text-slate-900 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
                        {fixture.prediction.homeScore} - {fixture.prediction.awayScore}
                      </div>
                    ) : (
                      <div className="text-xl font-black text-slate-200 uppercase">VS</div>
                    )}
                  </div>

                  <div className="flex flex-col items-center gap-3 w-32">
                    <img src={awayTeam?.logo} className="w-16 h-16 object-contain" referrerPolicy="no-referrer" />
                    <span className="text-xs font-black text-slate-900 uppercase text-center">{awayTeam?.name}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-12 border-t border-slate-200 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-3xl bg-slate-900 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="text-lg font-black text-slate-900 uppercase">Powered by KickOffPro</p>
                <p className="text-sm font-bold text-slate-400">Tactical Statistical Engine v2.0</p>
              </div>
            </div>
            <Badge className="bg-primary/10 text-primary border-none text-sm font-black uppercase tracking-widest px-6 py-3 rounded-full">
               Verified Logic
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
