import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  MessageSquare, 
  History, 
  TrendingUp, 
  ShieldCheck, 
  Target, 
  Newspaper,
  Loader2,
  RefreshCw,
  Hash,
  Send,
  Zap,
  Copy,
  CheckCircle2
} from 'lucide-react';
import { useStore, NewsItem } from '@/store/useStore';
import { calculateStandings } from '@/lib/tournament-engine';
import { google } from '@/lib/gemini';
import { GoogleGenAI } from '@google/genai';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Markdown from 'react-markdown';
import { cn } from '@/lib/utils';

export function TacticalHub() {
  const { teams, fixtures, players, tournamentName, newsItems, addNewsItem } = useStore();
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Caption copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const teamStats = useMemo(() => {
    const standings = calculateStandings(teams, fixtures);
    return teams.map(team => {
      const standing = standings.find(s => s.id === team.id);
      let goalsScored = 0;
      let goalsConceded = 0;
      
      fixtures.forEach(f => {
        const processLeg = (leg: any, isHome: boolean) => {
          if (leg?.status === 'finished') {
            if (isHome) {
              goalsScored += leg.homeScore || 0;
              goalsConceded += leg.awayScore || 0;
            } else {
              goalsScored += leg.awayScore || 0;
              goalsConceded += leg.homeScore || 0;
            }
          }
        };

        if (f.homeTeamId === team.id) {
          processLeg(f.leg1, true);
          processLeg(f.leg2, false);
        } else if (f.awayTeamId === team.id) {
          processLeg(f.leg1, false);
          processLeg(f.leg2, true);
        }
      });

      return {
        ...team,
        goalsScored,
        goalsConceded,
        gd: goalsScored - goalsConceded,
        pts: standing?.pts || 0,
        played: standing?.played || 0,
      };
    });
  }, [teams, fixtures]);

  const generateNewsletter = async () => {
    if (fixtures.length === 0) {
      toast.error("No fixtures found. Generate a season first!");
      return;
    }

    setLoading(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY is missing");

      const ai = new GoogleGenAI({ apiKey });
      
      const statsContext = teamStats
        .sort((a,b) => b.pts - a.pts)
        .map(t => `${t.name}: ${t.pts}pts, ${t.played}MP, ${t.goalsScored}GF, ${t.goalsConceded}GA, ${t.gd}GD`)
        .join('\n');

      const prompt = `You are a world-class tactical football analyst and a social media insider like Fabrizio Romano.
      
      TASK 1: Write a detailed "Tactical Newsletter" analyzing the current standings of the "${tournamentName}".
      FOCUS ON: Goal scoring trends, defensive solidity (who is a wall?), and goal difference analysis.
      HIGHLIGHT: Statistical outliers (e.g., a team with high GD but low points, or a high GA team that is winning).
      PREDICTION: Provide one BOLD prediction for the next set of fixtures based on current data.
      STYLE: Professional, analytical, insightful. Use Markdown (headers, bolding).

      TASK 2: Generate 3-5 "Fabrizio Romano" style transfer/update captions for this league.
      STYLE: SNAPPY, USE EMOJIS, START WITH "HERE WE GO!" where appropriate. Focus on performance "rumors" or tactical shifts.
      
      League Data:
      ${statsContext}
      
      Return the output as a JSON object with this structure:
      {
        "newsletterTitle": "string",
        "newsletterContent": "string (markdown)",
        "romanoUpdates": ["string"]
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json"
        }
      });

      const resultText = response.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const result = JSON.parse(resultText);

      // Save Newsletter
      if (result.newsletterContent) {
        addNewsItem({
          id: Math.random().toString(36).substr(2, 9),
          title: result.newsletterTitle || "Tactical Insights Report",
          content: result.newsletterContent,
          date: new Date().toISOString(),
          type: 'newsletter',
          tags: ['Tactical', 'Analysis', 'Insights']
        });
      }

      // Save Romano Updates
      if (result.romanoUpdates && Array.isArray(result.romanoUpdates)) {
        result.romanoUpdates.forEach((update: string) => {
          addNewsItem({
            id: Math.random().toString(36).substr(2, 9),
            title: "Fabrizio Romano Update",
            content: update,
            date: new Date().toISOString(),
            type: 'romano',
            tags: ['HereWeGo', 'Exclusive']
          });
        });
      }

      toast.success("New insights generated!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate AI insights.");
    } finally {
      setLoading(false);
    }
  };

  const newsFeed = useMemo(() => {
    return [...newsItems].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [newsItems]);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-[8px] font-black uppercase tracking-[0.3em] text-slate-900 w-fit">
            AI Tactical Hub
          </div>
          <h2 className="text-4xl sm:text-6xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">
            Tactical <span className="text-primary">Insights</span>
          </h2>
          <p className="text-slate-500 font-medium max-w-xl">
            Deep statistical analysis and exclusive updates powered by the Tactical Oracle.
          </p>
        </div>
        <Button 
          onClick={generateNewsletter}
          disabled={loading}
          className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-xs transition-all shadow-xl hover:shadow-primary/20 group"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 mr-3 animate-spin" />
          ) : (
            <RefreshCw className="w-5 h-5 mr-3 transition-transform group-hover:rotate-180 duration-500" />
          )}
          Generate Latest Data
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Newsletter Section */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center gap-3 mb-2">
            <Newspaper className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">Technical Reports</h3>
          </div>

          <div className="space-y-6">
            {newsFeed.filter(item => item.type === 'newsletter').length === 0 ? (
              <div className="glass-card p-12 text-center space-y-4">
                <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto">
                  <Zap className="w-10 h-10 text-slate-300" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight italic">No insights yet</h4>
                  <p className="text-slate-400 text-sm">Hit the generate button to analyze the league.</p>
                </div>
              </div>
            ) : (
              newsFeed.filter(item => item.type === 'newsletter').map((item, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={item.id}
                  className="glass-card p-8 space-y-6 group hover:shadow-2xl transition-all border-l-4 border-l-primary"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900">
                        <TrendingUp className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">{item.title}</h4>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{new Date(item.date).toLocaleDateString()} • Global Edition</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-slate-200 text-slate-400 font-black uppercase tracking-widest text-[8px]">
                      Verified Insights
                    </Badge>
                  </div>
                  
                  <div className="prose prose-slate max-w-none prose-p:font-medium prose-headings:font-black prose-headings:italic prose-headings:uppercase prose-headings:tracking-tighter">
                    <Markdown>{item.content}</Markdown>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Romano Sidebar */}
        <div className="space-y-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-6 h-6 text-[#00FF85]" />
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">Social Feed</h3>
            </div>
          </div>

          <div className="space-y-4">
            {newsFeed.filter(item => item.type === 'romano').length === 0 ? (
              <div className="glass-card p-12 border-none text-center bg-slate-50 text-slate-900 space-y-4 shadow-sm border-slate-100">
                <div className="w-16 h-16 rounded-full bg-white border border-slate-200 flex items-center justify-center mx-auto mb-2">
                   <Hash className="w-8 h-8 text-primary animate-pulse" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Status: Monitoring</p>
                  <p className="text-[10px] uppercase tracking-widest opacity-40 mt-1 italic text-slate-400">Waiting for exclusive scoops...</p>
                </div>
              </div>
            ) : (
              newsFeed.filter(item => item.type === 'romano').map((item, i) => (
                <motion.div 
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: i * 0.05 }}
                   key={item.id}
                   className="bg-white p-6 rounded-[2rem] text-slate-900 space-y-4 relative overflow-hidden group hover:shadow-2xl hover:shadow-slate-200 transition-all border border-slate-100 shadow-sm"
                >
                  <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                    <Send className="w-24 h-24 rotate-12 text-slate-200" />
                  </div>

                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Exclusive • Romano style</span>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleCopy(item.content, item.id)}
                      className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-emerald-600 transition-colors"
                    >
                      {copiedId === item.id ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  <p className="text-sm font-bold leading-relaxed italic relative z-10 selection:bg-emerald-100 selection:text-emerald-900">
                    {item.content}
                  </p>

                  <div className="flex flex-wrap gap-3 pt-2 relative z-10">
                    {item.tags?.map(tag => (
                      <span key={tag} className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">#{tag}</span>
                    ))}
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600/40 italic">#HereWeGo</span>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* History / Stats Quick Card */}
          <div className="glass-card p-8 bg-gradient-brand text-white">
            <h4 className="text-lg font-black uppercase tracking-tight italic mb-4">League Pulse</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <span className="text-xs font-bold uppercase tracking-widest opacity-60">Total Goals</span>
                <span className="text-2xl font-black italic">{teamStats.reduce((acc, t) => acc + t.goalsScored, 0)}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <span className="text-xs font-bold uppercase tracking-widest opacity-60">Top Attack</span>
                <span className="text-lg font-black italic uppercase truncate max-w-[120px]">
                  {teamStats.sort((a,b) => b.goalsScored - a.goalsScored)[0]?.name}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-widest opacity-60">Clean Sheets</span>
                <span className="text-lg font-black italic uppercase truncate max-w-[120px]">
                  {teamStats.sort((a,b) => a.goalsConceded - b.goalsConceded)[0]?.name}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
