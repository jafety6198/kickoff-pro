import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ImageIcon, Download, Share2, Layout, Palette, Loader2, Sparkles, Trophy, Calendar, Users, Scan } from 'lucide-react';
import { motion } from 'motion/react';
import { toPng } from 'html-to-image';
import { useStore, Fixture, Team, Role } from '@/store/useStore';
import { calculateStandings } from '@/lib/tournament-engine';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

const templates = [
  { id: 'pl-result-hero', name: 'Official Result', color: 'bg-pl-purple', accent: '#00FF85' },
  { id: 'pl-round-schedule', name: 'Matchday Schedule', color: 'bg-white', accent: '#3D195B' },
  { id: 'pl-standings-vertical', name: 'Modern Standings', color: 'bg-white', accent: '#3D195B' },
  { id: 'pl-vs-modern', name: 'Duel Poster', color: 'bg-pl-purple', accent: '#00FF85' },
  { id: 'pl-run-in-grid', name: 'Run-In Comparison', color: 'bg-white', accent: '#3D195B' },
  { id: 'pl-broadcast', name: 'PL Broadcast', color: 'bg-[#3D195B]', accent: '#00FF85' },
  { id: 'pl-matchday', name: 'PL Match Day', color: 'bg-pl-purple', accent: '#00FF85' },
  { id: 'pl-fixtures', name: 'PL Fixtures', color: 'bg-white', accent: '#3D195B' },
  { id: 'pl-standings', name: 'PL Standings', color: 'bg-white', accent: '#3D195B' },
  { id: 'pl-full-table', name: 'PL Full Table', color: 'bg-white', accent: '#3D195B' },
  { id: 'pl-top-six', name: 'PL Top Six', color: 'bg-white', accent: '#00FF85' },
  { id: 'pl-power-form', name: 'Power Form Recap', color: 'bg-[#3D195B]', accent: '#00FF85' },
  { id: 'pl-stats', name: 'PL Match Stats', color: 'bg-[#3D195B]', accent: '#00FF85' },
  { id: 'pl-squad', name: 'PL Squad', color: 'bg-[#3D195B]', accent: '#00FF85' },
  { id: 'big-game', name: 'Big Game', color: 'bg-[#0a0a0a]', accent: 'yellow' },
  { id: 'minimal', name: 'Gameday Minimal', color: 'from-blue-400 to-white', accent: 'blue' },
  { id: 'gritty', name: 'Gritty Derby', color: 'bg-[#1a1a1a]', accent: 'red' },
  { id: 'modern-list', name: 'Modern List', color: 'bg-[#001f3f]', accent: 'green' },
  { id: 'standard', name: 'Standard Blue', color: 'from-blue-500 to-blue-900', accent: 'blue' },
];

export function PosterGenerator({ selectedFixture: externalFixture, templateId }: { selectedFixture?: Fixture, templateId?: string }) {
  const { fixtures: storeFixtures, teams: storeTeams, tournamentName } = useStore();
  const [selectedFixture, setSelectedFixture] = useState<any>(externalFixture || null);
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [template, setTemplate] = useState(templates.find(t => t.id === templateId) || templates[0]);
  const [generating, setGenerating] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);
  const posterRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateScale = () => {
      if (canvasRef.current) {
        const padding = 80;
        const availableWidth = canvasRef.current.clientWidth - padding;
        const availableHeight = canvasRef.current.clientHeight - padding;
        const targetWidth = 
          template.id === 'pl-full-table' ? 1400 : 
          template.id === 'pl-fixtures' || template.id === 'pl-round-schedule' || template.id === 'pl-power-form' ? 1000 : 
          template.id === 'pl-standings' || template.id === 'pl-standings-vertical' ? 1000 : 
          template.id === 'pl-vs-modern' ? 1000 : 
          template.id === 'pl-run-in-grid' ? 1200 : 700;
        const targetHeight = 850; 
        
        const scaleW = availableWidth / targetWidth;
        const scaleH = availableHeight / targetHeight;
        setPreviewScale(Math.min(scaleW, scaleH, 1));
      }
    };

    const observer = new ResizeObserver(updateScale);
    if (canvasRef.current) observer.observe(canvasRef.current);
    updateScale();

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (externalFixture) setSelectedFixture(externalFixture);
  }, [externalFixture]);

  useEffect(() => {
    if (templateId) setTemplate(templates.find(t => t.id === templateId) || templates[0]);
  }, [templateId]);

  const standings = useMemo(() => calculateStandings(storeTeams, storeFixtures), [storeTeams, storeFixtures]);

  const rounds = useMemo(() => {
    const r = Array.from(new Set(storeFixtures.map(f => f.round))).sort((a, b) => a - b);
    return r;
  }, [storeFixtures]);

  const fixtures = useMemo(() => {
    return storeFixtures.map(f => ({
      ...f,
      team_a: {
        name: storeTeams.find(t => t.id === f.homeTeamId)?.name,
        logo_url: storeTeams.find(t => t.id === f.homeTeamId)?.logo
      },
      team_b: {
        name: storeTeams.find(t => t.id === f.awayTeamId)?.name,
        logo_url: storeTeams.find(t => t.id === f.awayTeamId)?.logo
      },
      score_a: f.homeScore,
      score_b: f.awayScore,
      match_date: new Date().toISOString()
    }));
  }, [storeFixtures, storeTeams]);

  useEffect(() => {
    if (fixtures.length > 0 && !selectedFixture) {
      setSelectedFixture(fixtures[0]);
    }
  }, [fixtures]);

  const safeFormatDate = (dateStr: string, formatStr: string) => {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? 'TBD' : format(date, formatStr);
  };

  const downloadPoster = async () => {
    if (!posterRef.current) return;

    try {
      setGenerating(true);
      const downloadWidth = 
        template.id === 'pl-full-table' || template.id === 'pl-run-in-grid' ? 2200 : 
        template.id === 'pl-fixtures' || template.id === 'pl-round-schedule' || template.id === 'pl-power-form' ? 1800 : 
        template.id === 'pl-standings' || template.id === 'pl-standings-vertical' ? 1800 : 
        template.id === 'pl-vs-modern' ? 1800 : 1400;
      const dataUrl = await toPng(posterRef.current, {
        quality: 1,
        pixelRatio: 2, // For high definition
        width: downloadWidth,
        height: posterRef.current.offsetHeight * 2, // Dynamic height based on content
      });

      const link = document.createElement('a');
      link.download = `kickoff-pro-${selectedFixture?.team_a?.name}-vs-${selectedFixture?.team_b?.name}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('4K Poster generated and downloaded!');
    } catch (error) {
      console.error('Generation Error:', error);
      toast.error('Failed to generate poster');
    } finally {
      setGenerating(false);
    }
  };

  const renderTemplate = () => {
    if (!selectedFixture) return null;

    switch (template.id) {
      case 'pl-power-form':
        return (
          <div className="w-full h-full bg-[#3D195B] relative overflow-hidden flex flex-col p-12">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-1/2 h-full opacity-10">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,#00FF85,transparent_70%)]" />
            </div>
            
            <div className="relative z-10 w-full flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-12 border-b border-white/10 pb-8">
                 <div className="flex items-center gap-6">
                    <img src="https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg" className="w-16 h-16 brightness-0 invert" alt="PL" />
                    <div className="h-12 w-0.5 bg-white/20" />
                    <div>
                      <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic">POWER FORM</h1>
                      <p className="text-[#00FF85] text-[10px] font-black uppercase tracking-[0.4em]">Tournament Leaders</p>
                    </div>
                 </div>
                 <div className="bg-[#00FF85] text-[#3D195B] px-6 py-2 rounded-full font-black uppercase text-xs tracking-widest skew-x-[-12deg]">
                    TOP PERFORMERS
                 </div>
              </div>

              <div className="flex-1 flex flex-col gap-4">
                 {standings.slice(0, 5).map((team, idx) => (
                    <motion.div 
                      key={team.id}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-white/5 border border-white/10 rounded-[2rem] p-6 flex items-center justify-between group hover:bg-white/10 transition-all hover:scale-[1.02]"
                    >
                       <div className="flex items-center gap-6">
                          <span className="text-4xl font-black italic text-white/20 w-8">{idx + 1}</span>
                          <div className="w-16 h-16 bg-white rounded-2xl p-3 shadow-2xl">
                             <img src={team.logo} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                          </div>
                          <div>
                             <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{team.name}</h2>
                             <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-black text-[#00FF85] uppercase tracking-widest">Points:</span>
                                <span className="text-lg font-black text-white italic leading-none">{team.pts}</span>
                             </div>
                          </div>
                       </div>
                       
                       <div className="flex flex-col items-end gap-3">
                          <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Recent Form</p>
                          <div className="flex gap-2">
                             {team.form?.map((res, i) => (
                                <div key={i} className={cn(
                                   "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white shadow-lg",
                                   res === 'W' ? "bg-[#00FF85] text-[#3D195B]" : res === 'L' ? "bg-[#FF005A]" : "bg-white/20"
                                )}>
                                   {res}
                                </div>
                             ))}
                          </div>
                       </div>
                    </motion.div>
                 ))}
              </div>

              <div className="mt-12 flex items-center justify-between pt-8 border-t border-white/10">
                 <div className="flex items-center gap-4">
                    <img src="https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg" className="w-8 h-8 brightness-0 invert opacity-40" alt="PL" />
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Official Season Power Rankings Recap</p>
                 </div>
                 <p className="text-sm font-black text-[#00FF85] uppercase tracking-tighter italic">{tournamentName}</p>
              </div>
            </div>
          </div>
        );

      case 'pl-result-hero':
        return (
          <div className="w-full h-full bg-[#3D195B] relative overflow-hidden flex flex-col items-center">
            {/* Background Hero Image */}
            <div className="absolute inset-0 z-0">
               <img 
                 src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2400&auto=format&fit=crop" 
                 className="w-full h-full object-cover opacity-80 scale-105"
                 referrerPolicy="no-referrer"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-[#3D195B] via-transparent to-transparent opacity-90" />
               <div className="absolute inset-0 bg-[#3D195B]/30 backdrop-blur-[2px]" />
            </div>

            <div className="relative z-10 w-full h-full flex flex-col justify-between p-12">
              <div className="flex items-center justify-between">
                <img src="https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg" className="w-14 h-14 brightness-0 invert" alt="PL" />
                <div className="text-right">
                  <p className="text-[10px] font-black text-[#00FF85] uppercase tracking-[0.4em] leading-none mb-1">Official Result</p>
                  <p className="text-xs font-bold text-white/60 uppercase tracking-widest">{tournamentName}</p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-12">
                <div className="flex items-center gap-8">
                   <div className="flex flex-col items-center gap-3">
                      <img src={selectedFixture.team_a?.logo_url} className="w-20 h-20 object-contain drop-shadow-2xl" referrerPolicy="no-referrer" />
                      <span className="text-xl font-black text-white uppercase tracking-tighter">{selectedFixture.team_a?.name}</span>
                   </div>
                   
                   <div className="relative">
                      <div className="bg-[#00FF85] px-10 py-6 rounded-[2rem] shadow-[0_20px_50px_rgba(0,255,133,0.3)] rotate-[-2deg] flex items-center gap-6">
                        <span className="text-7xl font-black text-[#3D195B] italic leading-none">{selectedFixture.score_a}</span>
                        <div className="w-1.5 h-12 bg-[#3D195B]/20 rounded-full" />
                        <span className="text-7xl font-black text-[#3D195B] italic leading-none">{selectedFixture.score_b}</span>
                      </div>
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#3D195B] px-4 py-1 rounded-full border-2 border-[#00FF85]">
                         <span className="text-[10px] font-black text-[#00FF85] uppercase tracking-widest italic">Full Time</span>
                      </div>
                   </div>

                   <div className="flex flex-col items-center gap-3">
                      <img src={selectedFixture.team_b?.logo_url} className="w-20 h-20 object-contain drop-shadow-2xl" referrerPolicy="no-referrer" />
                      <span className="text-xl font-black text-white uppercase tracking-tighter">{selectedFixture.team_b?.name}</span>
                   </div>
                </div>

                <div className="flex flex-col items-center gap-2">
                   <div className="h-[2px] w-24 bg-gradient-to-r from-transparent via-[#00FF85] to-transparent mb-4" />
                   <div className="flex flex-wrap justify-center gap-8 text-white/80">
                      <div className="flex flex-col items-end gap-1">
                         <p className="text-[10px] font-black uppercase text-[#00FF85] tracking-widest">Scorers</p>
                         <p className="text-sm font-bold uppercase italic">Haaland 22', 45'</p>
                      </div>
                      <div className="w-[1px] h-8 bg-white/20" />
                      <div className="flex flex-col items-start gap-1">
                         <p className="text-[10px] font-black uppercase text-[#00FF85] tracking-widest">Scorers</p>
                         <p className="text-sm font-bold uppercase italic">Son 12'</p>
                      </div>
                   </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-8 mt-8">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white/40" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">Match Date</p>
                    <p className="text-sm font-black text-white uppercase">{safeFormatDate(selectedFixture.match_date, 'EEEE, MMMM do')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">Venue</p>
                  <p className="text-sm font-black text-white uppercase italic tracking-tighter">KickOff Main Arena</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'pl-round-schedule':
        const rFixtures = fixtures.filter(f => f.round === selectedRound);
        return (
          <div className="w-full h-full bg-white relative overflow-hidden flex flex-col">
            {/* Split Background */}
            <div className="absolute top-0 right-0 w-2/3 h-full overflow-hidden">
               <img 
                 src="https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?q=80&w=2400&auto=format&fit=crop" 
                 className="w-full h-full object-cover brightness-50 contrast-125"
                 referrerPolicy="no-referrer"
               />
               <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent" />
            </div>

            <div className="relative z-10 w-full h-full flex flex-col p-16">
              <div className="flex items-center gap-6 mb-12">
                 <img src="https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg" className="w-20 h-20" alt="PL" />
                 <div className="h-16 w-[3px] bg-[#3D195B]" />
                 <div>
                    <h1 className="text-5xl font-black text-[#3D195B] uppercase tracking-tighter leading-none">Schedule</h1>
                    <p className="text-sm font-black text-[#3D195B]/40 uppercase tracking-[0.3em]">Matchweek {selectedRound}</p>
                 </div>
              </div>

              <div className="flex-1 space-y-3">
                 {rFixtures.map((f, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 p-4 flex items-center justify-between group hover:border-[#3D195B]/20 transition-all"
                    >
                       <div className="flex items-center gap-4 flex-1">
                          <img src={f.team_a?.logo_url} className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
                          <span className="text-xl font-black text-[#3D195B] uppercase tracking-tighter">{f.team_a?.name}</span>
                       </div>
                       
                       <div className="bg-[#3D195B] text-white px-6 py-2 rounded-xl flex flex-col items-center justify-center min-w-[100px] shadow-lg group-hover:scale-105 transition-transform">
                          <span className="text-xs font-black text-[#00FF85] tracking-[0.2em] mb-0.5 uppercase">v</span>
                          <span className="text-lg font-black italic tracking-tighter leading-none">
                             {f.status === 'finished' ? `${f.score_a} - ${f.score_b}` : '15:00'}
                          </span>
                       </div>

                       <div className="flex items-center gap-4 flex-1 justify-end">
                          <span className="text-xl font-black text-[#3D195B] uppercase tracking-tighter text-right">{f.team_b?.name}</span>
                          <img src={f.team_b?.logo_url} className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
                       </div>
                    </motion.div>
                 ))}
              </div>

              <div className="mt-12 flex items-center justify-between border-t border-slate-100 pt-8">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-300" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Broadcast Schedule MW{selectedRound}</span>
                </div>
                <Badge className="bg-[#3D195B] text-white border-none font-black uppercase tracking-widest px-4 py-1">LIVE ON KICKOFF TV</Badge>
              </div>
            </div>
          </div>
        );

      case 'pl-standings-vertical':
        return (
          <div className="w-full h-full bg-white relative overflow-hidden flex">
            {/* Dark Side Panel */}
            <div className="w-1/4 h-full bg-[#3D195B] relative flex flex-col p-10 justify-between">
               <div className="space-y-6">
                 <img src="https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg" className="w-16 h-16 brightness-0 invert" alt="PL" />
                 <div className="space-y-1">
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">The</h1>
                    <h1 className="text-6xl font-black text-[#00FF85] uppercase tracking-tighter italic leading-none">Table</h1>
                 </div>
               </div>

               <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                  <p className="text-[10px] font-black text-[#00FF85] uppercase tracking-widest mb-2">Current MW</p>
                  <p className="text-4xl font-black text-white italic">{selectedRound}</p>
                  <div className="w-full h-1 bg-white/10 mt-4 rounded-full overflow-hidden">
                     <div className="w-[85%] h-full bg-[#00FF85]" />
                  </div>
               </div>
            </div>

            <div className="flex-1 h-full p-12 flex flex-col">
              <div className="mb-8 flex items-end justify-between border-b pb-4">
                 <h2 className="text-xl font-black text-[#3D195B] uppercase tracking-[0.2em]">{tournamentName} Standing</h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Updated Today • Live</p>
              </div>

              <div className="space-y-1 overflow-hidden">
                 {standings.slice(0, 10).map((team, i) => (
                    <div key={team.id} className="grid grid-cols-[50px_60px_1fr_60px_60px] items-center py-4 px-4 hover:bg-slate-50 border-b border-slate-50 transition-colors group">
                       <span className={cn(
                         "text-2xl font-black italic",
                         i < 4 ? "text-[#00FF85] drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]" : "text-[#3D195B]/20"
                       )}>{i + 1}</span>
                       <div className="flex justify-center">
                          <img src={team.logo} className="w-9 h-9 object-contain" referrerPolicy="no-referrer" />
                       </div>
                       <span className="text-xl font-black text-[#3D195B] uppercase tracking-tighter pl-4 group-hover:translate-x-1 transition-transform">{team.name}</span>
                       <span className="text-center font-bold text-slate-400 text-sm">{team.played}P</span>
                       <span className="text-center text-2xl font-black text-[#3D195B] tabular-nums bg-slate-100 rounded-lg py-1">{team.pts}</span>
                    </div>
                 ))}
                 <div className="pt-4 flex justify-center text-[10px] font-black text-[#3D195B]/40 uppercase tracking-[0.3em] italic">
                    Full table continued below...
                 </div>
              </div>
            </div>
          </div>
        );

      case 'pl-vs-modern':
        return (
          <div className="w-full h-full bg-[#3D195B] relative overflow-hidden flex flex-col items-center">
            {/* Background Texture elements */}
            <div className="absolute inset-0 opacity-10">
               <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00FF85] rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2" />
               <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#FF005A] rounded-full blur-[150px] translate-y-1/2 -translate-x-1/2" />
            </div>

            <div className="relative z-10 w-full h-full flex flex-col p-12">
               <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                     <img src="https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg" className="w-14 h-14" alt="PL" />
                     <div className="h-10 w-[2px] bg-white text-white/20" />
                     <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">BIG GAME WEEKEND</h2>
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Match Date</p>
                     <p className="text-sm font-black text-white uppercase tracking-tighter">{safeFormatDate(selectedFixture.match_date, 'EEEE, MMM do • HH:mm')}</p>
                  </div>
               </div>

               <div className="flex-1 flex items-center justify-center gap-16 relative">
                  {/* Central "VS" Glow */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[300px] font-black text-white/5 italic select-none">VS</div>
                  
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0, x: -50 }}
                    animate={{ scale: 1, opacity: 1, x: 0 }}
                    className="flex flex-col items-center gap-8 z-20"
                  >
                     <div className="relative">
                        <div className="w-56 h-56 rounded-[3rem] bg-gradient-to-br from-white/10 to-transparent border-2 border-white/20 p-10 backdrop-blur-3xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]">
                           <img src={selectedFixture.team_a?.logo_url} className="w-full h-full object-contain filter drop-shadow-[0_20px_40px_rgba(0,0,0,0.3)]" referrerPolicy="no-referrer" />
                        </div>
                        <div className="absolute -bottom-4 -left-4 bg-[#00FF85] text-[#3D195B] p-4 rounded-2xl font-black text-2xl italic shadow-2xl skew-x-[-12deg]">HOME</div>
                     </div>
                     <h3 className="text-3xl font-black text-white uppercase tracking-tighter text-center max-w-[200px] leading-none drop-shadow-lg">{selectedFixture.team_a?.name}</h3>
                  </motion.div>

                  <div className="flex flex-col items-center gap-4 z-20">
                     <div className="text-7xl font-black text-[#00FF85] italic tracking-tighter drop-shadow-[0_0_30px_rgba(0,255,133,0.5)]">VS</div>
                     <div className="px-6 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-xl">
                        <span className="text-xs font-black text-white tracking-widest uppercase">Live Coverage</span>
                     </div>
                  </div>

                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0, x: 50 }}
                    animate={{ scale: 1, opacity: 1, x: 0 }}
                    className="flex flex-col items-center gap-8 z-20"
                  >
                     <div className="relative">
                        <div className="w-56 h-56 rounded-[3rem] bg-gradient-to-br from-white/10 to-transparent border-2 border-white/20 p-10 backdrop-blur-3xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]">
                           <img src={selectedFixture.team_b?.logo_url} className="w-full h-full object-contain filter drop-shadow-[0_20px_40px_rgba(0,0,0,0.3)]" referrerPolicy="no-referrer" />
                        </div>
                        <div className="absolute -bottom-4 -right-4 bg-white text-[#3D195B] p-4 rounded-2xl font-black text-2xl italic shadow-2xl skew-x-[12deg]">AWAY</div>
                     </div>
                     <h3 className="text-3xl font-black text-white uppercase tracking-tighter text-center max-w-[200px] leading-none drop-shadow-lg">{selectedFixture.team_b?.name}</h3>
                  </motion.div>
               </div>

               <div className="mt-8 flex justify-center">
                  <div className="bg-[#00FF85] px-12 py-6 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.4)] flex items-center gap-12">
                     <div className="flex flex-col items-center border-r border-[#3D195B]/10 pr-12">
                        <p className="text-[10px] font-black text-[#3D195B] uppercase tracking-widest mb-1">Win Probability</p>
                        <p className="text-4xl font-black text-[#3D195B] italic">54%</p>
                     </div>
                     <div className="flex flex-col items-center">
                        <p className="text-[10px] font-black text-[#3D195B] uppercase tracking-widest mb-1">Venue Power</p>
                        <p className="text-4xl font-black text-[#3D195B] italic tracking-tighter">HIGH</p>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        );

      case 'pl-run-in-grid':
        const focusTeams = [selectedFixture.homeTeamId, selectedFixture.awayTeamId].filter(Boolean);
        return (
          <div className="w-full h-full bg-slate-50 relative overflow-hidden flex flex-col p-12">
            <div className="flex items-center justify-between mb-12">
               <div className="flex items-center gap-4">
                  <img src="https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg" className="w-16 h-16" alt="PL" />
                  <div className="h-12 w-0.5 bg-slate-200" />
                  <h1 className="text-4xl font-black text-[#3D195B] uppercase tracking-tighter italic">THE RUN IN</h1>
               </div>
               <Badge className="bg-[#FF005A] text-white border-none px-6 py-2 rounded-full font-black uppercase text-sm tracking-widest">SEASON 2024/25</Badge>
            </div>

            <div className="grid grid-cols-2 gap-12 flex-1">
               {focusTeams.map((teamId, idx) => {
                  const team = storeTeams.find(t => t.id === teamId);
                  const upcoming = storeFixtures
                    .filter(f => (f.homeTeamId === teamId || f.awayTeamId === teamId) && f.status === 'pending')
                    .slice(0, 5);
                  
                  return (
                    <div key={teamId} className="flex flex-col gap-6">
                       <div className="flex items-center gap-4">
                          <img src={team?.logo} className="w-14 h-14 object-contain" referrerPolicy="no-referrer" />
                          <h2 className="text-3xl font-black text-[#3D195B] uppercase tracking-tighter">{team?.name}</h2>
                       </div>
                       
                       <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-xl p-8 space-y-4">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex justify-between">
                             <span>Upcoming Fixtures</span>
                             <span>Difficulty</span>
                          </div>
                          
                          {upcoming.map((f, i) => {
                             const isHome = f.homeTeamId === teamId;
                             const opponent = isHome ? storeTeams.find(t => t.id === f.awayTeamId) : storeTeams.find(t => t.id === f.homeTeamId);
                             const diff = i % 3 === 0 ? 'CRITICAL' : i % 2 === 0 ? 'HARD' : 'EASY';
                             
                             return (
                               <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-[#3D195B]/5 transition-colors group">
                                  <div className="flex items-center gap-4">
                                     <span className="text-xs font-black text-[#3D195B]/40 uppercase w-4">{isHome ? 'H' : 'A'}</span>
                                     <img src={opponent?.logo} className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
                                     <span className="text-lg font-black text-[#3D195B] uppercase tracking-tight group-hover:translate-x-1 transition-transform">{opponent?.name}</span>
                                  </div>
                                  <div className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                    diff === 'CRITICAL' ? "bg-red-50 text-red-600 border-red-200" :
                                    diff === 'HARD' ? "bg-orange-50 text-orange-600 border-orange-200" :
                                    "bg-green-50 text-green-600 border-green-200"
                                  )}>
                                     {diff}
                                  </div>
                               </div>
                             );
                          })}

                          {upcoming.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                               <Calendar className="w-12 h-12 opacity-20" />
                               <p className="text-sm font-black uppercase tracking-widest">No scheduled fixtures</p>
                            </div>
                          )}
                       </div>
                    </div>
                  );
               })}
            </div>

            <div className="mt-8 flex items-center justify-between py-6 border-t border-slate-200">
               <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Data based on Lumina Math Prediction Engine</div>
               <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-red-500" />
                     <span className="text-[10px] font-black text-[#3D195B]">CRITICAL (Top 4)</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-orange-500" />
                     <span className="text-[10px] font-black text-[#3D195B]">HARD (Top 10)</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-green-500" />
                     <span className="text-[10px] font-black text-[#3D195B]">EASY (Bottom 10)</span>
                  </div>
               </div>
            </div>
          </div>
        );

      case 'pl-matchday':
        return (
          <div className="w-full h-full bg-pl-purple flex flex-col items-center p-12 relative overflow-hidden">
            {/* Dynamic Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0%_0%,#00FF85,transparent_50%)]" />
              <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_100%,#00FF85,transparent_50%)]" />
            </div>

            <div className="relative z-10 w-full h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                    <img src="https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg" className="w-10 h-10" alt="PL" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none italic">Match Day</h1>
                    <p className="text-[10px] font-black text-pl-green uppercase tracking-[0.4em]">{tournamentName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className="bg-pl-green text-pl-dark border-none font-black uppercase tracking-widest px-4 py-1">
                    Round {selectedFixture.round || 1}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-col items-center gap-8 w-full">
                <div className="flex items-center justify-center gap-12 w-full">
                  <motion.div 
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="flex flex-col items-center gap-6 flex-1 min-w-0"
                  >
                    <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[40px] bg-white/5 border border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
                      <img src={selectedFixture.team_a?.logo_url} className="w-full h-full object-contain drop-shadow-2xl" referrerPolicy="no-referrer" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tighter text-center leading-tight w-full break-words">{selectedFixture.team_a?.name}</h2>
                  </motion.div>

                  <div className="flex flex-col items-center gap-4 shrink-0">
                    <div className="text-5xl sm:text-6xl font-black text-pl-green italic tracking-tighter">VS</div>
                    <div className="px-6 py-2 bg-white/10 rounded-full border border-white/10">
                      <span className="text-xs font-black text-white uppercase tracking-widest">
                        {safeFormatDate(selectedFixture.match_date, 'HH:mm')}
                      </span>
                    </div>
                  </div>

                  <motion.div 
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="flex flex-col items-center gap-6 flex-1 min-w-0"
                  >
                    <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[40px] bg-white/5 border border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
                      <img src={selectedFixture.team_b?.logo_url} className="w-full h-full object-contain drop-shadow-2xl" referrerPolicy="no-referrer" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tighter text-center leading-tight w-full break-words">{selectedFixture.team_b?.name}</h2>
                  </motion.div>
                </div>
              </div>

              <div className="w-full space-y-6">
                <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                      <Calendar className="w-5 h-5 text-pl-green" />
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Match Date</p>
                      <p className="text-sm font-black text-white uppercase">{safeFormatDate(selectedFixture.match_date, 'EEEE, MMMM do')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Venue</p>
                    <p className="text-sm font-black text-white uppercase italic">KickOff Arena</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'pl-squad':
        const squadTeam = storeTeams.find(t => t.id === selectedFixture.homeTeamId); // Default to home team for squad view
        return (
          <div className="w-full h-auto min-h-full bg-[#3D195B] flex flex-col items-center p-12 relative overflow-hidden">
            {/* PL Decorative Zigzag */}
            <div className="absolute top-0 right-0 w-32 h-full opacity-20">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="w-full h-20 bg-[#38003C] -skew-x-12 mb-4" />
              ))}
            </div>

            <div className="relative z-10 w-full h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src="https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg" className="w-12 h-12 brightness-0 invert" alt="PL" />
                  <div className="h-10 w-0.5 bg-white/20" />
                  <div className="text-left">
                    <h1 className="text-2xl font-black text-white uppercase leading-none">Team Lineup</h1>
                    <p className="text-[10px] font-bold text-[#00FF85] uppercase tracking-[0.3em]">{squadTeam?.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className="bg-[#00FF85] text-[#3D195B] border-none font-black uppercase tracking-widest px-4 py-1">
                    {squadTeam?.formation || '4-3-3'}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-col items-center gap-6 w-full flex-1 justify-center mt-8">
                {/* Squad Image Card */}
                <div className="w-full bg-white/5 backdrop-blur-xl rounded-[40px] p-4 border border-white/10 shadow-2xl overflow-hidden flex flex-col">
                  <div className="aspect-video w-full rounded-[32px] overflow-hidden relative bg-black/20">
                    {squadTeam?.squadImage ? (
                      <img src={squadTeam.squadImage} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-white/20">
                        <Users className="w-16 h-16 mb-4" />
                        <p className="text-sm font-black uppercase tracking-widest">No Squad Image Uploaded</p>
                      </div>
                    )}
                    
                    {/* Overlay Stats */}
                    <div className="absolute bottom-6 left-6 flex gap-4">
                      {squadTeam?.collectiveStrength && (
                        <div className="bg-[#3D195B] border-2 border-[#00FF85] px-4 py-2 rounded-2xl shadow-xl">
                          <p className="text-[8px] font-bold text-[#00FF85] uppercase tracking-widest leading-none mb-1">Strength</p>
                          <p className="text-2xl font-black text-white italic leading-none">{squadTeam.collectiveStrength}</p>
                        </div>
                      )}
                      {squadTeam?.playstyle && (
                        <div className="bg-[#3D195B] border-2 border-[#00FF85] px-4 py-2 rounded-2xl shadow-xl">
                          <p className="text-[8px] font-bold text-[#00FF85] uppercase tracking-widest leading-none mb-1">Playstyle</p>
                          <p className="text-lg font-black text-white uppercase tracking-tighter leading-none">{squadTeam.playstyle}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-8 border-t border-white/10 mt-8">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#00FF85] rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Official Team Lineup • {tournamentName}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-black text-white uppercase tracking-tighter">{squadTeam?.name}</span>
                  <img src={squadTeam?.logo} className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
                </div>
              </div>
            </div>
          </div>
        );

      case 'pl-stats':
        return (
          <div className="w-full h-auto min-h-full bg-[#3D195B] flex flex-col items-center p-12 relative overflow-hidden">
            {/* PL Decorative Zigzag */}
            <div className="absolute top-0 right-0 w-32 h-full opacity-20">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="w-full h-20 bg-[#38003C] -skew-x-12 mb-4" />
              ))}
            </div>

            <div className="relative z-10 w-full h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src="https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg" className="w-12 h-12 brightness-0 invert" alt="PL" />
                  <div className="h-10 w-0.5 bg-white/20" />
                  <div className="text-left">
                    <h1 className="text-2xl font-black text-white uppercase leading-none">Match Stats</h1>
                    <p className="text-[10px] font-bold text-[#00FF85] uppercase tracking-[0.3em]">{tournamentName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className="bg-[#00FF85] text-[#3D195B] border-none font-black uppercase tracking-widest px-4 py-1">
                    Full Time
                  </Badge>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4 w-full flex-1 justify-center">
                {/* Score Header */}
                <div className="w-full bg-white rounded-t-3xl p-5 flex items-center justify-between shadow-2xl">
                  <div className="flex items-center gap-4 flex-1">
                    <img src={selectedFixture.team_a?.logo_url} className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
                    <span className="text-lg font-black text-[#3D195B] uppercase tracking-tighter">{selectedFixture.team_a?.name}</span>
                  </div>
                  <div className="text-3xl font-black text-[#3D195B] italic px-6">
                    {selectedFixture.score_a} - {selectedFixture.score_b}
                  </div>
                  <div className="flex items-center gap-4 flex-1 justify-end">
                    <span className="text-lg font-black text-[#3D195B] uppercase tracking-tighter">{selectedFixture.team_b?.name}</span>
                    <img src={selectedFixture.team_b?.logo_url} className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
                  </div>
                </div>

                {/* Stats Card - This is the "graphics card" that should stretch */}
                <div className="w-full bg-white/5 backdrop-blur-xl rounded-b-3xl p-6 border border-white/10 flex-1 flex flex-col justify-center space-y-4">
                  {selectedFixture.stats ? (
                    <>
                      {[
                        { label: 'Possession', home: `${selectedFixture.stats.possession_home}%`, away: `${selectedFixture.stats.possession_away}%`, homeVal: selectedFixture.stats.possession_home, awayVal: selectedFixture.stats.possession_away },
                        { label: 'Shots', home: selectedFixture.stats.shots_home, away: selectedFixture.stats.shots_away, homeVal: selectedFixture.stats.shots_home, awayVal: selectedFixture.stats.shots_away },
                        { label: 'Shots on Target', home: selectedFixture.stats.shots_on_target_home || 0, away: selectedFixture.stats.shots_on_target_away || 0, homeVal: selectedFixture.stats.shots_on_target_home || 0, awayVal: selectedFixture.stats.shots_on_target_away || 0 },
                        { label: 'Passes', home: selectedFixture.stats.passes_home || 0, away: selectedFixture.stats.passes_away || 0, homeVal: selectedFixture.stats.passes_home || 0, awayVal: selectedFixture.stats.passes_away || 0 },
                        { label: 'Fouls', home: selectedFixture.stats.fouls_home || 0, away: selectedFixture.stats.fouls_away || 0, homeVal: selectedFixture.stats.fouls_home || 0, awayVal: selectedFixture.stats.fouls_away || 0 },
                        { label: 'Corners', home: selectedFixture.stats.corners_home || 0, away: selectedFixture.stats.corners_away || 0, homeVal: selectedFixture.stats.corners_home || 0, awayVal: selectedFixture.stats.corners_away || 0 },
                      ].map((stat, i) => (
                        <div key={i} className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs font-black text-white uppercase tracking-widest">
                            <span className="w-16">{stat.home}</span>
                            <span className="text-[#00FF85] opacity-60 text-[10px]">{stat.label}</span>
                            <span className="w-16 text-right">{stat.away}</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden flex">
                            <div 
                              className="h-full bg-[#00FF85]" 
                              style={{ width: `${(stat.homeVal / (stat.homeVal + stat.awayVal || 1)) * 100}%` }} 
                            />
                            <div className="w-0.5 h-full bg-white/20" />
                            <div 
                              className="h-full bg-white/40" 
                              style={{ width: `${(stat.awayVal / (stat.homeVal + stat.awayVal || 1)) * 100}%` }} 
                            />
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-white/40 space-y-4">
                      <Sparkles className="w-12 h-12 opacity-20" />
                      <p className="text-sm font-black uppercase tracking-[0.2em]">No stats scanned for this match</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-8 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#00FF85] rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Official Match Statistics</span>
                </div>
                <img src="https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg" className="w-6 h-6 brightness-0 invert opacity-20" alt="PL" />
              </div>
            </div>
          </div>
        );

      case 'pl-fixtures':
        const roundFixtures = fixtures.filter(f => f.round === selectedRound);
        return (
          <div className="w-full h-auto min-h-full bg-white flex flex-col items-center p-12 relative overflow-hidden">
            {/* PL Side Bar */}
            <div className="absolute left-0 top-0 bottom-0 w-44 bg-gradient-to-b from-[#00FF85] via-[#02EFFE] to-[#00FF85]" />
            <div className="absolute left-22 top-1/2 -translate-y-1/2 -translate-x-1/2">
               <img src="https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg" className="w-36 h-36" alt="PL" />
            </div>

            <div className="relative z-10 w-full h-full flex flex-col pl-44 pr-12">
              <div className="mb-8">
                <h1 className="text-7xl font-black text-[#3D195B] uppercase tracking-tighter">Matchweek {selectedRound}</h1>
                <div className="h-2 w-32 bg-[#3D195B] mt-2" />
              </div>

              <div className="flex-1">
                <div className="space-y-6">
                  <div className="text-center mb-10">
                    <p className="text-xl font-black text-[#3D195B] uppercase tracking-[0.3em] border-b-4 border-[#3D195B] inline-block pb-2">
                      Premier League S1 Fixtures
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    {roundFixtures.map((f, i) => (
                      <div key={i} className="grid grid-cols-[1fr_50px_130px_50px_1fr] items-center gap-6 py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                        <div className="text-right">
                          <span className="text-2xl sm:text-3xl font-black text-[#3D195B] uppercase tracking-tighter leading-none">{f.team_a?.name}</span>
                        </div>
                        <div className="flex items-center justify-center">
                          <img src={f.team_a?.logo_url} className="w-10 h-10 object-contain drop-shadow-sm" referrerPolicy="no-referrer" />
                        </div>
                        <div className="flex justify-center">
                          <div className="bg-[#3D195B] text-white px-6 py-2 rounded-2xl min-w-[120px] text-center shadow-xl border-2 border-white/10">
                            <span className="text-2xl font-black italic tracking-tighter">
                              {f.status === 'finished' ? `${f.score_a} - ${f.score_b}` : '20:00'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-center">
                          <img src={f.team_b?.logo_url} className="w-10 h-10 object-contain drop-shadow-sm" referrerPolicy="no-referrer" />
                        </div>
                        <div className="text-left">
                          <span className="text-2xl sm:text-3xl font-black text-[#3D195B] uppercase tracking-tighter leading-none">{f.team_b?.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-8 border-t-2 border-[#3D195B]/10 flex justify-between items-center">
                <p className="text-sm font-bold text-[#3D195B]/40 uppercase tracking-widest">Premier League 2024/25 Fixtures</p>
                <img src="https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg" className="w-8 h-8 opacity-20" alt="PL" />
              </div>
            </div>
          </div>
        );

      case 'pl-top-six':
        const topSixTeams = standings.slice(0, 6);
        return (
          <div className="w-full h-full min-h-[800px] relative flex items-center justify-center overflow-hidden bg-[#0a0a0a] font-sans">
            {/* Background Image: Jurgen Klopp & Trent Alexander-Arnold (Broadcast Scene) */}
            <img 
              src="https://images.football365.com/content/uploads/2023/12/28104803/Jurgen-Klopp-Trent-Alexander-Arnold-Liverpool.jpg" 
              className="absolute inset-0 w-full h-full object-cover opacity-90 brightness-[0.9] scale-105"
              alt="Broadcast Background"
              referrerPolicy="no-referrer"
              onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?q=80&w=2400&auto=format&fit=crop"; }}
            />
            {/* Soft overlay for broadcast depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

            {/* The "Top Six" Standings Card */}
            <div className="relative z-10 w-[85%] max-w-[850px] bg-white rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col border border-white/40">
              
              {/* Header Section: Neon Lime to Cyan/Teal Gradient */}
              <div className="bg-gradient-to-r from-[#DFFF00] via-[#00FFBD] to-[#00E5FF] px-14 py-8 flex items-baseline gap-4">
                <h2 className="text-[42px] font-black text-[#3D195B] uppercase tracking-tighter leading-none">
                  Premier League
                </h2>
                <span className="text-[32px] font-medium text-[#3D195B]/70 uppercase tracking-tight">
                  Top Six
                </span>
              </div>

              <div className="px-14 py-8 relative">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="text-[14px] font-black text-slate-400 uppercase tracking-[0.4em] border-b border-slate-100">
                      <th className="text-left py-4 w-20">Pos</th>
                      <th className="text-left py-4">Club</th>
                      <th className="text-right py-4 w-20">P</th>
                      <th className="text-right py-4 w-20">GD</th>
                      <th className="text-right py-4 w-20">PTS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50/80">
                    {topSixTeams.map((team, i) => (
                      <tr key={team.id} className="group">
                        <td className="py-5 text-3xl font-black text-[#3D195B] tabular-nums">{i + 1}</td>
                        <td className="py-5">
                          <div className="flex items-center gap-6">
                            <div className="w-10 h-10 flex items-center justify-center">
                              <img src={team.logo} className="w-full h-full object-contain filter drop-shadow-sm" referrerPolicy="no-referrer" />
                            </div>
                            <span className="text-2xl font-black text-[#3D195B] uppercase tracking-tighter">
                              {team.handleName || team.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-5 text-right font-black text-[#3D195B] text-2xl tabular-nums">
                          {team.played}
                        </td>
                        <td className="py-5 text-right font-black text-[#3D195B] text-2xl tabular-nums">
                          {team.gd > 0 ? `+${team.gd}` : team.gd}
                        </td>
                        <td className="py-5 text-right font-black text-[#3D195B] text-2xl tabular-nums">
                          {team.pts}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Overlapping PL Lion Logo - Positioned as in the image */}
                <div className="absolute -left-16 bottom-[10%] w-56 h-56 z-20 pointer-events-none select-none opacity-95">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg" 
                    className="w-full h-full drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)]" 
                    alt="PL Lion" 
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'pl-standings':
        return (
          <div className="w-full h-auto min-h-full bg-white flex flex-col items-center p-12 relative overflow-hidden">
            {/* PL Side Bar */}
            <div className="absolute left-0 top-0 bottom-0 w-44 bg-gradient-to-b from-[#FF005A] via-[#3D195B] to-[#FF005A]" />
            <div className="absolute left-22 top-1/2 -translate-y-1/2 -translate-x-1/2 rotate-[-90deg]">
               <h2 className="text-7xl font-black text-white uppercase tracking-tighter whitespace-nowrap opacity-40">THE RUN IN</h2>
            </div>
            <div className="absolute left-22 top-12 -translate-x-1/2">
               <img src="https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg" className="w-24 h-24 brightness-0 invert" alt="PL" />
            </div>
            <div className="absolute left-22 bottom-12 -translate-x-1/2 text-center">
               <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">MW</p>
               <p className="text-white text-4xl font-black leading-none">{selectedRound}</p>
            </div>

            <div className="relative z-10 w-full h-auto flex flex-col pl-44 pr-12">
              <div className="grid grid-cols-[60px_80px_1fr_100px_100px_100px] items-center mb-8 px-8 border-b-2 border-slate-100 pb-4 text-[12px] font-black text-[#3D195B]/60 uppercase tracking-[0.3em]">
                <span className="text-center">Pos</span>
                <span className="pl-4">Club</span>
                <span />
                <span className="text-center">P</span>
                <span className="text-center">GD</span>
                <span className="text-center">Pts</span>
              </div>

              <div className="flex-1 space-y-1">
                {standings.map((team, i) => (
                  <div key={team.id} className="grid grid-cols-[60px_80px_1fr_100px_100px_100px] items-center px-8 py-4 border-b border-slate-50 group hover:bg-slate-50/50 transition-colors rounded-xl font-black">
                    <span className="text-3xl text-[#3D195B] italic text-center drop-shadow-sm tabular-nums">{i + 1}</span>
                    <div className="w-12 h-12 flex items-center justify-center bg-white rounded-lg shadow-sm border border-slate-100 p-1.5 mx-auto">
                      <img src={team.logo} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    </div>
                    <span className="text-2xl text-[#3D195B] uppercase tracking-tighter truncate pr-4">{team.name}</span>
                    
                    <span className="text-center text-2xl text-[#3D195B] tabular-nums">{team.played}</span>
                    <span className="text-center text-2xl text-[#3D195B] tabular-nums">{team.gd > 0 ? `+${team.gd}` : team.gd}</span>
                    <span className="text-center text-3xl text-primary tabular-nums italic">{team.pts}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 text-[8px] font-bold text-slate-400 italic">
                *Generated by {tournamentName} Standings Engine
              </div>
            </div>
          </div>
        );
      case 'pl-full-table':
        return (
          <div className="w-full h-auto min-h-full bg-white flex flex-col items-center p-10 relative overflow-hidden">
            {/* PL Side Bar */}
            <div className="absolute left-0 top-0 bottom-0 w-44 bg-gradient-to-b from-[#3D195B] via-[#00FF85] to-[#3D195B]" />
            <div className="absolute left-22 top-1/2 -translate-y-1/2 -translate-x-1/2 rotate-[-90deg]">
               <h2 className="text-7xl font-black text-white uppercase tracking-tighter whitespace-nowrap opacity-40">SEASON TABLE</h2>
            </div>
            <div className="absolute left-22 top-10 -translate-x-1/2">
               <img src="https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg" className="w-24 h-24 brightness-0 invert" alt="PL" />
            </div>
            <div className="absolute left-22 bottom-10 -translate-x-1/2 text-center">
               <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">SEASON</p>
               <p className="text-white text-3xl font-black leading-none">24/25</p>
            </div>

            <div className="relative z-10 w-full h-auto flex flex-col pl-44 pr-16 text-slate-900">
              <div className="flex items-center mb-8 px-8 bg-[#3D195B] py-5 rounded-2xl shadow-xl">
                <div className="grid grid-cols-[60px_80px_1fr_60px_60px_60px_60px_60px_60px_70px_70px_200px] w-full items-center text-[11px] font-black text-white uppercase tracking-[0.2em]">
                  <span className="text-center">#</span>
                  <span className="pl-4">Club</span>
                  <span></span>
                  <span className="text-center">P</span>
                  <span className="text-center">W</span>
                  <span className="text-center">D</span>
                  <span className="text-center">L</span>
                  <span className="text-center text-white/50">GF</span>
                  <span className="text-center text-white/50">GA</span>
                  <span className="text-center text-[#00FF85]">GD</span>
                  <span className="text-center text-[#00FF85]">Pts</span>
                  <span className="text-center">Form</span>
                </div>
              </div>

              <div className="space-y-1.5 px-2">
                {standings.map((team, i) => (
                  <div key={team.id} className="flex items-center px-6 py-4 border-b border-slate-100 group transition-all hover:bg-slate-50 rounded-xl">
                    <div className="grid grid-cols-[60px_80px_1fr_60px_60px_60px_60px_60px_60px_70px_70px_200px] w-full items-center">
                      <span className="text-3xl font-black text-[#3D195B] italic text-center leading-none tabular-nums opacity-80">{i + 1}</span>
                      <div className="flex justify-center">
                        <img src={team.logo} className="w-12 h-12 object-contain filter drop-shadow-md" referrerPolicy="no-referrer" />
                      </div>
                      <span className="text-2xl font-black text-[#3D195B] uppercase tracking-tighter truncate pr-8">{team.name}</span>
                      
                      <span className="text-center font-bold text-[#3D195B] text-xl tabular-nums">{team.played}</span>
                      <span className="text-center font-bold text-[#3D195B] text-xl tabular-nums">{team.won}</span>
                      <span className="text-center font-bold text-[#3D195B] text-xl tabular-nums">{team.drawn}</span>
                      <span className="text-center font-bold text-[#3D195B] text-xl tabular-nums">{team.lost}</span>
                      <span className="text-center font-bold text-slate-400 text-lg tabular-nums text-opacity-40">{team.gf}</span>
                      <span className="text-center font-bold text-slate-400 text-lg tabular-nums text-opacity-40">{team.ga}</span>
                      <span className="text-center font-black text-[#3D195B] text-xl tabular-nums">{team.gd > 0 ? `+${team.gd}` : team.gd}</span>
                      <span className="text-center font-black text-primary text-3xl tabular-nums drop-shadow-sm">{team.pts}</span>
                      
                      <div className="flex justify-center gap-2.5 items-center">
                        {team.form?.map((result, idx) => (
                          <div 
                            key={idx}
                            className={cn(
                              "w-8 h-8 rounded-md flex items-center justify-center text-sm font-black text-white shadow-md transition-transform hover:scale-110",
                              result === 'W' ? "bg-[#00FF85] text-[#3D195B]" : result === 'L' ? "bg-[#FF005A]" : "bg-slate-300"
                            )}
                          >
                            {result}
                          </div>
                        )) || '-'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex items-center justify-between">
                <div className="text-[9px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-sm bg-green-500" /> <span>WIN</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-sm bg-slate-400" /> <span>DRAW</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-sm bg-red-500" /> <span>LOSS</span>
                  </div>
                </div>
                <img src="https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg" className="w-8 h-8 opacity-10" alt="PL" />
              </div>
            </div>
          </div>
        );
      case 'pl-broadcast':
        return (
          <div className="w-full h-full bg-[#3D195B] flex flex-col items-center p-12 relative overflow-hidden">
            {/* PL Decorative Zigzag (Inspired by Image 2 & 5) */}
            <div className="absolute top-0 right-0 w-32 h-full opacity-20">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="w-full h-20 bg-[#38003C] -skew-x-12 mb-4" />
              ))}
            </div>
            
            <div className="relative z-10 w-full h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src="https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg" className="w-12 h-12 brightness-0 invert" alt="PL" />
                  <div className="h-10 w-0.5 bg-white/20" />
                  <div className="text-left">
                    <h1 className="text-2xl font-black text-white uppercase leading-none">Premier League</h1>
                    <p className="text-[9px] font-bold text-[#00FF85] uppercase tracking-[0.3em]">Matchweek {selectedFixture.round || 1}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{tournamentName}</p>
                  <p className="text-sm font-black text-white uppercase">2024/25 Season</p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-10 w-full">
                <div className="w-full bg-white rounded-3xl p-8 flex items-center justify-between shadow-2xl relative">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#3D195B] px-5 py-1.5 rounded-full border-4 border-white">
                    <span className="text-xs font-black text-[#00FF85] uppercase tracking-widest italic">Full Time</span>
                  </div>
                  
                  <div className="flex-1 flex flex-col items-center gap-3 min-w-0">
                    <img src={selectedFixture.team_a?.logo_url} className="w-16 h-16 sm:w-20 sm:h-20 object-contain" referrerPolicy="no-referrer" />
                    <h2 className="text-sm sm:text-base font-black text-[#3D195B] uppercase tracking-tighter text-center leading-tight w-full break-words">
                      {selectedFixture.team_a?.name}
                    </h2>
                  </div>

                  <div className="flex shrink-0 items-center gap-3 sm:gap-5 justify-center px-4">
                    <div className="text-5xl sm:text-6xl font-black text-[#3D195B] italic tracking-tighter">
                      {selectedFixture.score_a}
                    </div>
                    <div className="w-1 h-12 sm:w-1.5 sm:h-16 bg-[#3D195B]/10 rounded-full" />
                    <div className="text-5xl sm:text-6xl font-black text-[#3D195B] italic tracking-tighter">
                      {selectedFixture.score_b}
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col items-center gap-3 min-w-0">
                    <img src={selectedFixture.team_b?.logo_url} className="w-16 h-16 sm:w-20 sm:h-20 object-contain" referrerPolicy="no-referrer" />
                    <h2 className="text-sm sm:text-base font-black text-[#3D195B] uppercase tracking-tighter text-center leading-tight w-full break-words">
                      {selectedFixture.team_b?.name}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Venue</p>
                    <p className="text-lg font-black text-white uppercase tracking-tighter">KickOff Arena</p>
                  </div>
                  <div className="w-px h-10 bg-white/10" />
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Attendance</p>
                    <p className="text-lg font-black text-white uppercase tracking-tighter">54,200</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-8 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#00FF85] rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Official Broadcast Result</span>
                </div>
                <div className="flex items-center gap-4">
                  <img src="https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg" className="w-6 h-6 brightness-0 invert opacity-20" alt="PL" />
                </div>
              </div>
            </div>
          </div>
        );
      case 'big-game':
        return (
          <div className="w-full h-full flex relative">
            {/* Yellow Sidebar */}
            <div className="w-1/3 h-full bg-[#ffcc00] flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 flex flex-col justify-around py-10">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-8xl font-black text-black -rotate-90 whitespace-nowrap">BIG GAME</span>
                ))}
              </div>
              <div className="relative z-10 -rotate-90 flex flex-col items-center">
                <h1 className="text-7xl font-black text-black tracking-tighter">BIG GAME</h1>
                <p className="text-2xl font-bold text-black/60 italic">Weekend</p>
              </div>
            </div>
            {/* Match Content */}
            <div className="w-2/3 h-full bg-[#0a0a0a] p-12 flex flex-col justify-center gap-12">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-12 bg-[#ffcc00]" />
                  <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Match Result</h2>
                </div>
                <div className="p-8 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div className="flex flex-col items-center gap-4">
                    <img src={selectedFixture.team_a?.logo_url} className="w-20 h-20 object-contain" referrerPolicy="no-referrer" />
                    <span className="text-lg font-bold text-white uppercase">{selectedFixture.team_a?.name}</span>
                  </div>
                  <div className="text-7xl font-black text-[#ffcc00] italic whitespace-nowrap">{selectedFixture.score_a} - {selectedFixture.score_b}</div>
                  <div className="flex flex-col items-center gap-4">
                    <img src={selectedFixture.team_b?.logo_url} className="w-20 h-20 object-contain" referrerPolicy="no-referrer" />
                    <span className="text-lg font-bold text-white uppercase">{selectedFixture.team_b?.name}</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-white/40 text-sm font-bold uppercase tracking-widest">Tournament</p>
                  <p className="text-white text-xl font-black uppercase">{tournamentName}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/40 text-sm font-bold uppercase tracking-widest">Matchday</p>
                  <p className="text-[#ffcc00] text-3xl font-black italic">{selectedFixture.round || 1}</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'minimal':
        return (
          <div className="w-full h-full bg-gradient-to-b from-blue-400 to-white flex flex-col items-center justify-center p-20 relative overflow-hidden">
            <div className="absolute top-20 left-1/2 -translate-x-1/2 text-[180px] font-black text-blue-600/10 tracking-tighter select-none">
              GAMEDAY
            </div>
            <div className="relative z-10 flex flex-col items-center gap-12 w-full">
              <div className="flex items-center justify-center gap-16 w-full">
                <div className="flex flex-col items-center gap-6">
                  <div className="w-32 h-32 rounded-full bg-white shadow-2xl p-6">
                    <img src={selectedFixture.team_a?.logo_url} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                  <h3 className="text-2xl font-black text-blue-900 uppercase tracking-tighter text-center max-w-[200px] break-words">{selectedFixture.team_a?.name}</h3>
                </div>
                <div className="text-8xl font-black text-blue-600 tracking-tighter italic whitespace-nowrap">
                  {selectedFixture.score_a} : {selectedFixture.score_b}
                </div>
                <div className="flex flex-col items-center gap-6">
                  <div className="w-32 h-32 rounded-full bg-white shadow-2xl p-6">
                    <img src={selectedFixture.team_b?.logo_url} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                  <h3 className="text-2xl font-black text-blue-900 uppercase tracking-tighter text-center max-w-[200px] break-words">{selectedFixture.team_b?.name}</h3>
                </div>
              </div>
              <div className="h-1 w-32 bg-blue-600/20 rounded-full" />
              <div className="text-center">
                <p className="text-blue-900/40 text-sm font-bold uppercase tracking-[0.4em] mb-2">Final Score</p>
                <p className="text-blue-900 text-2xl font-black uppercase tracking-widest">{tournamentName}</p>
              </div>
            </div>
          </div>
        );

      case 'modern-list':
        return (
          <div className="w-full h-full bg-[#001f3f] flex flex-col items-center p-12 relative">
            <div className="absolute top-0 right-0 p-8 opacity-20">
              <div className="w-32 h-32 border-8 border-white/10 rounded-full" />
            </div>
            <div className="relative z-10 w-full space-y-8">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-[#2ecc71] flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-[0.2em]">Match Summary</h2>
              </div>
              
              <div className="space-y-4">
                {[selectedFixture.team_a, selectedFixture.team_b].map((team, idx) => (
                  <div key={idx} className="flex items-center gap-4 group">
                    <div className="w-16 h-16 rounded-2xl bg-[#2ecc71] shrink-0 flex items-center justify-center text-white font-black text-2xl">
                      {idx === 0 ? selectedFixture.score_a : selectedFixture.score_b}
                    </div>
                    <div className="flex-1 h-16 bg-white rounded-full flex items-center px-8 shadow-xl">
                      <img src={team?.logo_url} className="w-8 h-8 object-contain mr-4" referrerPolicy="no-referrer" />
                      <span className="text-xl font-black text-[#001f3f] uppercase">{team?.name}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-8 grid grid-cols-2 gap-6">
                <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                  <p className="text-[#2ecc71] text-[10px] font-bold uppercase tracking-widest mb-2">Tournament</p>
                  <p className="text-white text-lg font-black uppercase">KickOff Pro</p>
                </div>
                <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                  <p className="text-[#2ecc71] text-[10px] font-bold uppercase tracking-widest mb-2">Matchday</p>
                  <p className="text-white text-lg font-black uppercase">Round {selectedFixture.round}</p>
                </div>
              </div>
            </div>
            
            <div className="absolute bottom-12 left-12 flex items-center gap-4">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-[#2ecc71] rounded-full" />
              </div>
              <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Live from KickOff Arena</span>
            </div>
          </div>
        );

      case 'gritty':
        return (
          <div className="w-full h-full bg-[#1a1a1a] flex flex-col items-center justify-center p-12 relative">
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
            <div className="relative z-10 w-full space-y-12">
              <div className="flex flex-col items-center">
                <div className="bg-red-600 px-8 py-2 -rotate-2 shadow-xl">
                  <h1 className="text-5xl font-black text-white italic uppercase">It's Game Day!</h1>
                </div>
              </div>
              <div className="grid grid-cols-3 items-center gap-4 sm:gap-8">
                <div className="bg-white p-6 sm:p-8 rotate-1 shadow-2xl flex flex-col items-center gap-4 min-w-0">
                  <img src={selectedFixture.team_a?.logo_url} className="w-20 h-20 sm:w-24 sm:h-24 object-contain" referrerPolicy="no-referrer" />
                  <span className="text-lg sm:text-xl font-black text-black uppercase tracking-tighter text-center leading-tight w-full break-words">{selectedFixture.team_a?.name}</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="text-6xl sm:text-8xl font-black text-white italic drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
                    {selectedFixture.score_a}-{selectedFixture.score_b}
                  </div>
                  <Badge className="bg-red-600 text-white border-none px-4 py-1 text-sm sm:text-lg font-black uppercase whitespace-nowrap">Full Time</Badge>
                </div>
                <div className="bg-white p-6 sm:p-8 -rotate-1 shadow-2xl flex flex-col items-center gap-4 min-w-0">
                  <img src={selectedFixture.team_b?.logo_url} className="w-20 h-20 sm:w-24 sm:h-24 object-contain" referrerPolicy="no-referrer" />
                  <span className="text-lg sm:text-xl font-black text-black uppercase tracking-tighter text-center leading-tight w-full break-words">{selectedFixture.team_b?.name}</span>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="bg-zinc-800 px-10 py-4 border-l-8 border-red-600">
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Official League Result</p>
                  <p className="text-white text-xl font-black uppercase tracking-tighter">{tournamentName} • Matchday {selectedFixture.round}</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className={cn(
            "w-full h-full relative overflow-hidden flex flex-col items-center justify-center p-12 text-center",
            template.id === 'highlights' ? "text-black" : "text-white"
          )}>
            <div className={cn("absolute inset-0 bg-gradient-to-br z-0", template.color)} />
            <div className="absolute inset-0 opacity-20 z-0">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]" />
            </div>
            <div className="relative z-10 w-full h-full flex flex-col items-center justify-between glass border-white/20 rounded-[40px] p-10 ios-shadow">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-[0.4em] font-black opacity-60">Full Time Result</p>
                <div className="h-0.5 w-12 bg-current mx-auto opacity-20" />
              </div>
              <div className="flex items-center justify-between w-full gap-4">
                <div className="flex-1 flex flex-col items-center gap-4 min-w-0">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/10 p-4 border border-white/20 backdrop-blur-md">
                    <img src={selectedFixture?.team_a?.logo_url} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                  <h2 className="text-base sm:text-lg font-black tracking-tighter uppercase leading-tight text-center break-words w-full">{selectedFixture?.team_a?.name}</h2>
                </div>
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div className="text-6xl sm:text-7xl font-black tracking-tighter flex items-center gap-4">
                    <span>{selectedFixture?.score_a ?? 0}</span>
                    <span className="text-current opacity-20">-</span>
                    <span>{selectedFixture?.score_b ?? 0}</span>
                  </div>
                  <Badge className="bg-current/10 text-current border-current/20 font-black uppercase tracking-widest text-[10px]">
                    Matchday {selectedFixture?.round ?? 1}
                  </Badge>
                </div>
                <div className="flex-1 flex flex-col items-center gap-4 min-w-0">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/10 p-4 border border-white/20 backdrop-blur-md">
                    <img src={selectedFixture?.team_b?.logo_url} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                  <h2 className="text-base sm:text-lg font-black tracking-tighter uppercase leading-tight text-center break-words w-full">{selectedFixture?.team_b?.name}</h2>
                </div>
              </div>
              <div className="w-full pt-6 border-t border-current/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 opacity-40" />
                  <span className="text-[10px] uppercase tracking-widest font-black opacity-40">{tournamentName}</span>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-widest font-black opacity-40">eFootball 2024</p>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-white">
      {/* Left Sidebar: Selection & Controls */}
      <div className="w-[350px] shrink-0 border-r border-slate-200 overflow-y-auto no-scrollbar flex flex-col bg-white">
        <div className="p-6 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Layout className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-black text-slate-900 uppercase tracking-tight">Graphic Studio</h3>
            </div>

            <div className="space-y-6">
              {/* Match Selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Select Match</label>
                <Select 
                  onValueChange={(val) => setSelectedFixture(fixtures.find(f => f.id === val))}
                  value={selectedFixture?.id || ""}
                >
                  <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:ring-primary/20">
                    <SelectValue placeholder="Choose a match" />
                  </SelectTrigger>
                  <SelectContent>
                    {fixtures.map(f => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.team_a?.name} vs {f.team_b?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Round Selection */}
              {(template.id === 'pl-fixtures' || 
                template.id === 'pl-standings' || 
                template.id === 'pl-top-six' || 
                template.id === 'pl-round-schedule' || 
                template.id === 'pl-power-form' ||
                template.id === 'pl-standings-vertical' ||
                template.id === 'pl-vs-modern' ||
                template.id === 'pl-run-in-grid'
               ) && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Select Matchweek</label>
                  <Select 
                    onValueChange={(val) => setSelectedRound(parseInt(val))}
                    value={selectedRound.toString()}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:ring-primary/20">
                      <SelectValue placeholder="Choose matchweek" />
                    </SelectTrigger>
                    <SelectContent>
                      {rounds.map(r => (
                        <SelectItem key={r} value={r.toString()}>
                          Matchweek {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Template Selection: Sidebar Menu Style */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Choose Template</label>
                <div className="space-y-1">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTemplate(t)}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 group",
                        template.id === t.id 
                          ? "bg-primary text-white shadow-lg shadow-primary/20" 
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          template.id === t.id ? "bg-white" : t.color.includes('from') ? "bg-gradient-to-br" : t.color
                        )} />
                        <span className="font-bold text-sm tracking-tight">{t.name}</span>
                      </div>
                      {template.id === t.id && (
                        <motion.div layoutId="template-active">
                          <Sparkles className="w-3.5 h-3.5 text-white/80" />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <Button 
              onClick={downloadPoster}
              disabled={!selectedFixture || generating}
              className="w-full py-7 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 h-auto"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  <span className="font-black uppercase tracking-widest text-xs">Rendering...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-3" />
                  <span className="font-black uppercase tracking-widest text-xs">Export 4K Poster</span>
                </>
              )}
            </Button>
            <p className="text-center mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              High-Definition PNG Output
            </p>
          </div>
        </div>
      </div>

      {/* Right Canvas: Fluid Preview Area */}
      <div ref={canvasRef} className="flex-grow bg-[#f8f9fa] relative flex items-center justify-center p-8 lg:p-12 overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#3D195B,transparent_70%)]" />
        </div>

        {/* The Stage: Centered Workspace */}
        <div className="relative w-full h-full flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ 
              transform: `scale(${previewScale})`,
              transformOrigin: 'center center'
            }}
            className="relative flex items-center justify-center transition-transform duration-300 ease-out"
          >
            {/* Scaling Container for Preview */}
            <div className="relative shadow-[0_40px_100px_-20px_rgba(0,0,0,0.4)] rounded-[40px] overflow-hidden bg-white">
              <div 
                ref={posterRef}
                className={cn(
                  "h-auto min-h-[540px] relative overflow-hidden",
                  template.id === 'pl-full-table' || template.id === 'pl-run-in-grid' ? "w-[1400px]" : 
                  template.id === 'pl-fixtures' || template.id === 'pl-round-schedule' ? "w-[1000px]" : 
                  template.id === 'pl-standings' || template.id === 'pl-standings-vertical' ? "w-[1000px]" : 
                  template.id === 'pl-vs-modern' ? "w-[1000px]" : "w-[700px]"
                )}
              >
                {renderTemplate()}
                
                {/* Watermark */}
                <div className={cn(
                  "absolute bottom-4 right-8 z-20 opacity-20 flex items-center gap-2",
                  template.id === 'minimal' ? "text-blue-900" : "text-white"
                )}>
                  <span className="text-[8px] font-black uppercase tracking-widest">Generated by KickOff Pro</span>
                </div>
              </div>
            </div>

            {/* Floating Preview Badge */}
            <div className="absolute -top-4 -right-4 bg-white border border-slate-200 px-4 py-2 rounded-full shadow-xl z-30 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Live Preview</span>
            </div>
          </motion.div>
        </div>

        {/* Bottom Info */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 text-slate-400">
          <div className="flex items-center gap-2">
            <Palette className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Template: {template.name}</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-slate-300" />
          <div className="flex items-center gap-2">
            <Scan className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">4K Resolution Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}
