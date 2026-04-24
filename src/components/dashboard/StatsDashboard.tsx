import React, { useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Trophy, 
  TrendingUp, 
  Target, 
  Shield, 
  Zap, 
  Users,
  BarChart3,
  Activity,
  Award,
  Download,
  Loader2,
  Sparkles,
  Copy,
  Eye,
  Layout,
  PieChart as PieIcon,
  MousePointer2,
  Tornado
} from 'lucide-react';
import { StatGraphicModal } from '@/components/dashboard/StatGraphicModal';
import { useStore, Team, Fixture, Player } from '@/store/useStore';
import { calculateStandings } from '@/lib/tournament-engine';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  Cell,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  BarChart,
  Bar,
  LineChart,
  Line
} from 'recharts';
import { google } from '@/lib/gemini';
import { generateText } from 'ai';
import Markdown from 'react-markdown';

export function StatsDashboard() {
  const { teams, fixtures, players, tournamentName } = useStore();
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [generatingPostId, setGeneratingPostId] = useState<string | null>(null);
  const [generatedPost, setGeneratedPost] = useState<string | null>(null);
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [insightLoading, setInsightLoading] = useState(false);
  const [graphicData, setGraphicData] = useState<{ type: any, data: any } | null>(null);

  const handleGeneratePost = async (sectionId: string, dataContext: any) => {
    try {
      setGeneratingPostId(sectionId);
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const emojiList = ['🔥', '👑', '⚽', '⚡', '📈', '💎', '🚀'];
      const randomEmoji = () => emojiList[Math.floor(Math.random() * emojiList.length)];
      
      let post = "";
      if (sectionId === 'golden-boot-section') {
        const top = dataContext.topTeams[0];
        post = `🚨 UNREAL SCENES! ${top.team} is absolutely COOKING right now with ${top.goals} goals! 👑 The level of finishing is simply clear. ${randomEmoji()}${randomEmoji()}\n\n#eFootball #KickOffPro #Elite`;
      } else if (sectionId === 'power-rankings-section') {
        const top = dataContext.topForm[0];
        post = `👑 KINGS OF FORM! ${top.team} is on a total tear. Recent form: ${top.recentForm}. They are playing a different game right now! 🚀${randomEmoji()}\n\n#eFootball #PowerRankings`;
      } else {
        post = `🔥 STATS DON'T LIE! Analysis of ${dataContext.title} shows some insane levels being reached in the series! ${randomEmoji()}\n\n#eFootball #Stats`;
      }

      setGeneratedPost(post);
      setIsPostDialogOpen(true);
    } catch (error) {
      toast.error('Failed to generate post');
    } finally {
      setGeneratingPostId(null);
    }
  };

  const handleTournamentInsight = async () => {
    try {
      setInsightLoading(true);
      
      const prompt = `You are an elite tactical analyst for the "${tournamentName}" eFootball Series. 
      Analyze the current standings and statistics provided below and write a highly creative, 
      professional, and engaging "Tactical Newsletter" or "Deep Insight" report. 
      
      FOCUS ON: Goals scored, goals conceded, goal difference, and points efficiency.
      IGNORE: Possession statistics or pass accuracy.
      
      Use a tone that is a mix of a professional sports analyst (like Tifo Football) and a high-stakes esports commentator.
      
      STANDINGS:
      ${teamStats.sort((a,b) => b.pts - a.pts).map(t => `${t.name}: ${t.pts} pts, ${t.played} MP, ${t.totalGoals} GF, ${t.ga} GA, ${t.totalGoals - (t.ga || 0)} GD`).join('\n')}
      
      ADDITIONAL DATA:
      - Total Goals: ${teamStats.reduce((acc, t) => acc + t.totalGoals, 0)}
      - Top Scorer: ${teamScorerRace[0]?.name}
      - Avg Goals/Game: ${(teamStats.reduce((acc, t) => acc + t.totalGoals, 0) / (fixtures.filter(f => f.leg1?.status === 'finished').length * 2 || 1)).toFixed(2)}
      
      STRUCTURE:
      1. THE HIERARCHY: Analyze the title race based on point efficiency and goal dominance.
      2. ATTACK VS DEFENSE: Discuss which teams are "Glass Cannons" (high GF, high GA) vs "Steel Walls" (low GA).
      3. STATISTICAL OUTLIER: Highlight a team with a surprising GD relative to their points.
      4. PREDICTION: One bold goal-based prediction for the next set of fixtures.
      
      Use Markdown formatting (bolding, headers, lists). Keep it punchy.`;

      const { text } = await generateText({
        model: google('gemini-1.5-flash'),
        prompt,
      });

      setGeneratedPost(text);
      setIsPostDialogOpen(true);
    } catch (error) {
      console.error('Insight Error:', error);
      toast.error('Oracle reached its computational limit. Standard insights applied.');
      
      // Fallback
      const topTeam = teamStats.sort((a,b) => b.pts - a.pts)[0];
      const mostGoals = teamStats.sort((a,b) => b.totalGoals - a.totalGoals)[0];
      const insight = `## 📊 LUMINAMATH INSIGHTS\n\n### 👑 Team to Watch: **${topTeam?.name}**\nDominating the standings with ${topTeam?.pts} points. \n\n### 🎯 Tactical Trend\n**${mostGoals?.name}** is the offensive benchmark.`;
      setGeneratedPost(insight);
      setIsPostDialogOpen(true);
    } finally {
      setInsightLoading(false);
    }
  };

  const copyPostToClipboard = () => {
    if (generatedPost) {
      navigator.clipboard.writeText(generatedPost);
      toast.success('Post copied to clipboard!');
    }
  };

  const handleExport = async (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    try {
      setExportingId(elementId);
      const dataUrl = await toPng(element, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });

      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Graphic exported successfully!');
    } catch (error) {
      console.error('Export Error:', error);
      toast.error('Failed to export graphic');
    } finally {
      setExportingId(null);
    }
  };

  const teamStats = useMemo(() => {
    const standings = calculateStandings(teams, fixtures);
    return teams.map(team => {
      const standing = standings.find(s => s.id === team.id);
      let goals = 0;
      let passes = 0;
      let saves = 0;
      let possessionTotal = 0;
      let possessionCount = 0;
      let shots = 0;
      let shotsOnTarget = 0;
      let fouls = 0;
      let corners = 0;
      let freeKicks = 0;
      let successfulPasses = 0;
      let crosses = 0;
      let interceptions = 0;
      let tackles = 0;

      fixtures.forEach(f => {
        const processLeg = (leg: any, isHome: boolean) => {
          if (leg?.status === 'finished') {
            if (isHome) {
              goals += leg.homeScore || 0;
              passes += leg.stats?.passes_home || 0;
              saves += leg.stats?.saves_home || 0;
              shots += leg.stats?.shots_home || 0;
              shotsOnTarget += leg.stats?.shots_on_target_home || 0;
              fouls += leg.stats?.fouls_home || 0;
              corners += leg.stats?.corners_home || 0;
              freeKicks += leg.stats?.free_kicks_home || 0;
              successfulPasses += leg.stats?.successful_passes_home || 0;
              crosses += leg.stats?.crosses_home || 0;
              interceptions += leg.stats?.interceptions_home || 0;
              tackles += leg.stats?.tackles_home || 0;
              if (leg.stats?.possession_home) {
                possessionTotal += leg.stats.possession_home;
                possessionCount++;
              }
            } else {
              goals += leg.awayScore || 0;
              passes += leg.stats?.passes_away || 0;
              saves += leg.stats?.saves_away || 0;
              shots += leg.stats?.shots_away || 0;
              shotsOnTarget += leg.stats?.shots_on_target_away || 0;
              fouls += leg.stats?.fouls_away || 0;
              corners += leg.stats?.corners_away || 0;
              freeKicks += leg.stats?.free_kicks_away || 0;
              successfulPasses += leg.stats?.successful_passes_away || 0;
              crosses += leg.stats?.crosses_away || 0;
              interceptions += leg.stats?.interceptions_away || 0;
              tackles += leg.stats?.tackles_away || 0;
              if (leg.stats?.possession_away) {
                possessionTotal += leg.stats.possession_away;
                possessionCount++;
              }
            }
          }
        };

        if (f.homeTeamId === team.id) {
          processLeg(f.leg1, true); // Home in Leg 1
          processLeg(f.leg2, false); // Away in Leg 2
        } else if (f.awayTeamId === team.id) {
          processLeg(f.leg1, false); // Away in Leg 1
          processLeg(f.leg2, true); // Home in Leg 2
        }
      });

      return {
        ...team,
        totalGoals: goals,
        totalPasses: passes,
        totalSaves: saves,
        totalShots: shots,
        totalShotsOnTarget: shotsOnTarget,
        totalFouls: fouls,
        totalCorners: corners,
        totalFreeKicks: freeKicks,
        totalSuccessfulPasses: successfulPasses,
        totalCrosses: crosses,
        totalInterceptions: interceptions,
        totalTackles: tackles,
        avgPossession: possessionCount > 0 ? Math.round(possessionTotal / possessionCount) : 0,
        pts: standing?.pts || 0,
        form: standing?.form || [],
        played: standing?.played || 0,
        gd: standing?.gd || 0,
      };
    });
  }, [teams, fixtures]);

  const teamScorerRace = useMemo(() => {
    return [...teamStats]
      .filter(t => t.totalGoals > 0)
      .sort((a, b) => b.totalGoals - a.totalGoals)
      .slice(0, 10);
  }, [teamStats]);

  const individualScorerRace = useMemo(() => {
    return [...players]
      .filter(p => p.goals > 0)
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 10)
      .map(p => ({
        ...p,
        team: teams.find(t => t.id === p.teamId)
      }));
  }, [players, teams]);

  const teamForm = useMemo(() => {
    return teams.map(team => {
      const form: string[] = [];
      const teamFixtures = fixtures
        .filter(f => (f.leg1?.status === 'finished' || f.leg2?.status === 'finished') && (f.homeTeamId === team.id || f.awayTeamId === team.id))
        .sort((a, b) => b.round - a.round);

      teamFixtures.forEach(f => {
        const isHomeTeam = f.homeTeamId === team.id;
        
        // Check Leg 1
        if (f.leg1?.status === 'finished') {
          const score = isHomeTeam ? f.leg1.homeScore! : f.leg1.awayScore!;
          const oppScore = isHomeTeam ? f.leg1.awayScore! : f.leg1.homeScore!;
          if (score > oppScore) form.push('W');
          else if (score < oppScore) form.push('L');
          else form.push('D');
        }
        
        // Check Leg 2
        if (f.leg2?.status === 'finished') {
          // Home/Away roles swap in Leg 2
          const score = isHomeTeam ? f.leg2.awayScore! : f.leg2.homeScore!;
          const oppScore = isHomeTeam ? f.leg2.homeScore! : f.leg2.awayScore!;
          if (score > oppScore) form.push('W');
          else if (score < oppScore) form.push('L');
          else form.push('D');
        }
      });

      return { ...team, form: form.slice(0, 5).reverse() };
    });
  }, [teams, fixtures]);

  const tournamentStats = useMemo(() => {
    let highestScore = { value: 0, team: '', match: '' };
    let totalYellowCards = players.reduce((sum, p) => sum + p.yellowCards, 0);
    let totalRedCards = players.reduce((sum, p) => sum + p.redCards, 0);

    fixtures.forEach(f => {
      const processLeg = (leg: any, legNum: number) => {
        if (leg?.status === 'finished') {
          const hTeam = teams.find(t => t.id === (legNum === 1 ? f.homeTeamId : f.awayTeamId))?.name || '';
          const aTeam = teams.find(t => t.id === (legNum === 1 ? f.awayTeamId : f.homeTeamId))?.name || '';
          
          if (leg.homeScore! > highestScore.value) {
            highestScore = { 
              value: leg.homeScore!, 
              team: hTeam,
              match: `${hTeam} vs ${aTeam} (Leg ${legNum})`
            };
          }
          if (leg.awayScore! > highestScore.value) {
            highestScore = { 
              value: leg.awayScore!, 
              team: aTeam,
              match: `${hTeam} vs ${aTeam} (Leg ${legNum})`
            };
          }
        }
      };

      processLeg(f.leg1, 1);
      processLeg(f.leg2, 2);
    });

    const mostPassesTeam = [...teamStats].sort((a, b) => b.totalPasses - a.totalPasses)[0];
    const mostSavesTeam = [...teamStats].sort((a, b) => b.totalSaves - a.totalSaves)[0];

    const mostPasses = {
      value: mostPassesTeam?.totalPasses || 0,
      team: mostPassesTeam?.handleName || mostPassesTeam?.name || 'N/A'
    };

    const mostSaves = {
      value: mostSavesTeam?.totalSaves || 0,
      team: mostSavesTeam?.handleName || mostSavesTeam?.name || 'N/A'
    };

    return { mostPasses, mostSaves, highestScore, totalYellowCards, totalRedCards };
  }, [fixtures, teams, players, teamStats]);

  const quadrantData = useMemo(() => {
    return teamStats.map(t => {
      const gd = t.totalGoals - (t.ga || 0);
      return {
        name: t.name,
        gf: t.totalGoals,
        ga: t.ga || 0,
        gd: gd,
        played: t.played,
        gfPerMatch: t.played > 0 ? Number((t.totalGoals / t.played).toFixed(2)) : 0,
        gaPerMatch: t.played > 0 ? Number(((t.ga || 0) / t.played).toFixed(2)) : 0,
        logo: t.logo
      };
    });
  }, [teamStats]);

  const outcomeData = useMemo(() => {
    let wins = 0, draws = 0, losses = 0;
    fixtures.forEach(f => {
      [f.leg1, f.leg2].forEach(leg => {
        if (leg?.status === 'finished') {
          if (leg.homeScore! > leg.awayScore!) wins++;
          else if (leg.homeScore! < leg.awayScore!) losses++;
          else draws++;
        }
      });
    });
    return [
      { name: 'Wins', value: wins, color: '#00FF85' },
      { name: 'Draws', value: draws, color: '#94a3b8' },
      { name: 'Losses', value: losses, color: '#f87171' }
    ];
  }, [fixtures]);

  return (
    <div className="space-y-8 pb-12">
      {/* Quick Insights Hero */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        {[
          { label: 'Season Goals', value: teamStats.reduce((acc, t) => acc + t.totalGoals, 0), icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Goals Per Game', value: (teamStats.reduce((acc, t) => acc + t.totalGoals, 0) / Math.max(fixtures.filter(f => f.leg1?.status === 'finished').length + fixtures.filter(f => f.leg2?.status === 'finished').length, 1)).toFixed(2), icon: Zap, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Total Matches', value: fixtures.reduce((acc, f) => acc + (f.leg1?.status === 'finished' ? 1 : 0) + (f.leg2?.status === 'finished' ? 1 : 0), 0), icon: Activity, color: 'text-purple-500', bg: 'bg-purple-50' },
          { label: 'Best Goal Diff', value: `+${Math.max(...teamStats.map(t => t.totalGoals - (t.ga || 0)))}`, icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-50' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm flex items-center gap-4 group hover:shadow-xl transition-all"
          >
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", stat.bg)}>
              <stat.icon className={cn("w-6 h-6", stat.color)} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900 tracking-tighter italic">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* League Leaders Spotlight */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
        <div className="glass-card p-6 border-none bg-white/40 shadow-sm hover:shadow-xl transition-all">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Most Prolific Attack</h3>
          </div>
          <div className="space-y-4">
            {[...teamStats].sort((a,b) => b.totalGoals - a.totalGoals).slice(0, 3).map((team, idx) => (
              <div key={team.id} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-slate-400">#{idx + 1}</span>
                  <img src={team.logo} className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />
                  <span className="text-xs font-bold uppercase text-slate-700">{team.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-black text-slate-900">{team.totalGoals} <span className="text-[10px] text-slate-400 uppercase">Goals</span></span>
                  <div className="w-16 h-1 rounded-full bg-slate-100 overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500" 
                      style={{ width: `${(team.totalGoals / Math.max(...teamStats.map(t => t.totalGoals), 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6 border-none bg-white/40 shadow-sm hover:shadow-xl transition-all">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Elite Defensive Wall</h3>
          </div>
          <div className="space-y-4">
            {[...teamStats].sort((a,b) => (a.ga || 0) - (b.ga || 0)).slice(0, 3).map((team, idx) => (
              <div key={team.id} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-slate-400">#{idx + 1}</span>
                  <img src={team.logo} className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />
                  <span className="text-xs font-bold uppercase text-slate-700">{team.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-black text-slate-900">{team.ga || 0} <span className="text-[10px] text-slate-400 uppercase">GA</span></span>
                  <div className="w-16 h-1 rounded-full bg-slate-100 overflow-hidden">
                    <div 
                      className="h-full bg-primary" 
                      style={{ width: `${((team.ga || 0) / Math.max(...teamStats.map(t => t.ga || 1), 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 my-12">
        {/* Tactical Quadrant: Attack vs Defense */}
        <div className="glass-card p-6 sm:p-8 space-y-6 bg-white overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">Global Net Rating</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Goals Scored vs Conceded</p>
              </div>
            </div>
          </div>
          
          <div className="h-[350px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="gf" 
                  name="Goals Scored" 
                  label={{ value: 'Total Goals Scored', position: 'insideBottom', offset: -10, fontSize: 10, fontWeight: 900 }}
                  type="number"
                  fontSize={10}
                  stroke="#94a3b8"
                />
                <YAxis 
                  dataKey="ga" 
                  name="Goals Conceded" 
                  label={{ value: 'Total Goals Conceded', angle: -90, position: 'insideLeft', fontSize: 10, fontWeight: 900 }}
                  type="number"
                  fontSize={10}
                  stroke="#94a3b8"
                  reversed
                />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }} 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white border border-slate-100 shadow-xl p-3 rounded-2xl">
                          <div className="flex items-center gap-2 mb-2">
                             <img src={data.logo} className="w-5 h-5 object-contain" referrerPolicy="no-referrer" />
                             <p className="text-xs font-black uppercase text-slate-900">{data.name}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] text-slate-500 font-bold uppercase">Scored: {data.gf}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">Conceded: {data.ga}</p>
                            <p className="text-[10px] text-emerald-500 font-black uppercase">Goal Diff: {data.gd > 0 ? `+${data.gd}` : data.gd}</p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter name="Teams" data={quadrantData}>
                   {quadrantData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.gd > 0 ? '#00FF85' : '#3D195B'} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 text-[9px] font-black uppercase tracking-widest text-center">
             <div className="p-2 border border-slate-100 rounded-xl bg-emerald-50 text-emerald-600">Goal Dominators</div>
             <div className="p-2 border border-slate-100 rounded-xl bg-slate-50 text-slate-600">Defensive Struggles</div>
          </div>
        </div>

        {/* Goals Efficiency: Scored vs Conceded */}
        <div className="glass-card p-6 sm:p-8 space-y-6 bg-white group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">Net Rating Matrix</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Goals Scored vs Conceded Per Match</p>
            </div>
          </div>

          <div className="h-[350px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="gfPerMatch" 
                  name="Goals/Match" 
                  label={{ value: 'Goals Scored/Match', position: 'insideBottom', offset: -10, fontSize: 10, fontWeight: 900 }}
                  type="number"
                  domain={[0, 'auto']}
                  fontSize={10}
                  stroke="#94a3b8"
                />
                <YAxis 
                  dataKey="gaPerMatch" 
                  name="GA/Match" 
                  label={{ value: 'Goals Conceded/Match', angle: -90, position: 'insideLeft', fontSize: 10, fontWeight: 900 }}
                  type="number"
                  fontSize={10}
                  stroke="#94a3b8"
                  reversed
                />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }} 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white border border-slate-100 shadow-xl p-3 rounded-2xl">
                          <p className="text-xs font-black uppercase text-slate-900 mb-2">{data.name}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">Attack: {data.gfPerMatch} G/M</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">Defense: {data.gaPerMatch} G/M</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter name="Efficiency" data={quadrantData}>
                   {quadrantData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.gfPerMatch > entry.gaPerMatch ? '#00FF85' : '#FB923C'} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Match Outcome Distribution */}
        <div className="glass-card p-6 sm:p-8 space-y-6 bg-white overflow-hidden group">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                <PieIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">Outcome Spectrum</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tournament Result Distribution</p>
              </div>
            </div>
            
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={outcomeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {outcomeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                    itemStyle={{ textTransform: 'uppercase' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-[10px] font-black uppercase text-slate-500">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
        </div>

        {/* Tournament Pulse - Activity over matchdays */}
        <div className="glass-card p-6 sm:p-8 space-y-6 bg-white group">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">Tournament Pulse</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Goal Velocity by Matchday</p>
              </div>
            </div>

            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(() => {
                   const dayStats: { [key: number]: number } = {};
                   fixtures.forEach(f => {
                     const round = f.round;
                     if (!dayStats[round]) dayStats[round] = 0;
                     if (f.leg1?.status === 'finished') dayStats[round] += (f.leg1.homeScore! + f.leg1.awayScore!);
                     if (f.leg2?.status === 'finished') dayStats[round] += (f.leg2.homeScore! + f.leg2.awayScore!);
                   });
                   return Object.entries(dayStats).map(([round, goals]) => ({ round: `MD ${round}`, goals }));
                })()}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="round" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip 
                     contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="goals" fill="#3D195B" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-12 mb-8">
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 uppercase tracking-tighter italic">Tournament Stats</h2>
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleTournamentInsight}
            disabled={insightLoading}
            className="rounded-full bg-primary text-white font-black uppercase tracking-widest text-[10px] px-6 h-10 hover:bg-primary/90 shadow-xl transition-all"
          >
            {insightLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2 fill-white" />}
            AI Insights
          </Button>
          <Button 
            onClick={() => {
              const sortedTeams = [...teamStats].sort((a, b) => b.pts - a.pts);
              setGraphicData({ 
                type: 'power-form', 
                data: sortedTeams.slice(0, 5)
              });
            }}
            className="rounded-full bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] px-6 h-10 hover:bg-slate-800 shadow-xl transition-all"
          >
             <Layout className="w-4 h-4 mr-2 text-[#00FF85]" />
             Social Media Post
          </Button>
          <Button 
            onClick={() => {
              const sortedTeams = [...teamStats].sort((a, b) => b.pts - a.pts);
              setGraphicData({ 
                type: 'season-recap', 
                data: {
                  teams: sortedTeams,
                  stats: {
                    topOffense: [...teamStats].sort((a,b) => b.totalGoals - a.totalGoals)[0]?.name || 'N/A',
                    bestForm: [...teamStats].sort((a,b) => b.pts - a.pts)[0]?.name || 'N/A',
                    totalGoals: teamStats.reduce((acc, t) => acc + t.totalGoals, 0)
                  }
                } 
              });
            }}
            className="rounded-full bg-slate-100 text-slate-900 border border-slate-200 font-black uppercase tracking-widest text-[10px] px-6 h-10 hover:bg-white shadow-xl transition-all"
          >
            <Eye className="w-4 h-4 mr-2" />
            Season Recap
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top Scorers */}
        <div className="lg:col-span-2 space-y-8">
          {/* Individual Golden Boot */}
          <div id="individual-golden-boot" className="glass-card p-6 sm:p-8 space-y-6 relative bg-white border-t-8 border-amber-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-200">
                   <Target className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Golden Boot Race</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Individual Top Scorers</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setGraphicData({ 
                      type: 'pl-golden-boot',
                      data: individualScorerRace.slice(0, 5)
                    });
                  }}
                  className="rounded-full border-slate-200 text-slate-500 hover:text-amber-600 hover:border-amber-200 font-black uppercase tracking-widest text-[10px] h-9 px-4 transition-all"
                >
                  <Layout className="w-3.5 h-3.5 mr-2" />
                  Social Graphic
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {individualScorerRace.slice(0, 6).map((player, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={player.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-3xl transition-all border group",
                    i === 0 ? "bg-white border-amber-200 border-2 shadow-xl scale-[1.02]" : "bg-white border-slate-100 hover:border-amber-200 hover:shadow-lg"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <span className={cn(
                      "text-xl font-black italic w-6 text-center",
                      i === 0 ? "text-amber-500" : "text-slate-300"
                    )}>{i + 1}</span>
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 p-2 relative">
                      <img 
                        src={player.team?.logo} 
                        className="w-full h-full object-contain" 
                        referrerPolicy="no-referrer" 
                      />
                      {i === 0 && (
                        <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-1 shadow-lg">
                          <Trophy className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-black uppercase tracking-tight leading-tight text-slate-900">
                        {player.name}
                      </p>
                      <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                        {player.team?.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    {/* Tiny Form Dots */}
                    <div className="hidden sm:flex gap-1">
                      {(player.goalHistory || [0, 0, 0]).slice(0, 3).map((g, gi) => (
                        <div 
                           key={gi} 
                           className={cn(
                             "w-1.5 h-4 rounded-full",
                             g > 0 ? "bg-emerald-500" : "bg-slate-100"
                           )} 
                        />
                      ))}
                    </div>
                    <div>
                      <p className={cn("text-2xl font-black italic leading-none", i === 0 ? "text-amber-500" : "text-slate-900")}>{player.goals}</p>
                      <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Goals</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div id="team-golden-boot" className="glass-card p-6 sm:p-8 space-y-6 relative bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                   < Shield className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">Club Goals Ranking</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleGeneratePost('team-golden-boot', { 
                    title: 'Club Goal Rankings', 
                    topTeams: teamScorerRace.map(t => ({ team: t.name, goals: t.totalGoals })) 
                  })}
                  disabled={generatingPostId === 'team-golden-boot'}
                  className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary border-slate-200"
                >
                  {generatingPostId === 'team-golden-boot' ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Sparkles className="w-3 h-3 mr-2" />}
                  AI Post
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {teamScorerRace.length > 0 ? teamScorerRace.slice(0, 5).map((team, i) => {
                return (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={team.id}
                    className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:bg-white hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <span className={cn(
                        "text-lg font-black italic w-6",
                        i === 0 ? "text-amber-500" : "text-slate-300"
                      )}>{i + 1}</span>
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 p-1.5 shadow-sm">
                        <img 
                          src={team.logo} 
                          className="w-full h-full object-contain" 
                          referrerPolicy="no-referrer" 
                        />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 uppercase tracking-tight">{team.name}</p>
                        <Badge className="bg-amber-500/10 text-amber-600 border-none text-[8px] font-black uppercase tracking-widest">
                          Goal Machines
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-amber-500 italic leading-none">{team.totalGoals}</p>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Goals</p>
                    </div>
                  </motion.div>
                );
              }) : (
                <div className="text-center py-12 text-slate-300">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="text-sm font-black uppercase tracking-widest">No goals recorded yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Team Form & Records */}
        <div className="space-y-8">
          {/* Team Form */}
          <div id="power-rankings-section" className="glass-card p-6 sm:p-8 space-y-6 relative bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">Power Rankings</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleGeneratePost('power-rankings-section', { 
                    title: 'Current Form Power Rankings', 
                    topForm: teamForm
                      .sort((a, b) => b.pts - a.pts)
                      .slice(0, 3)
                      .map(t => ({ 
                        team: t.name, 
                        recentForm: t.form.join(''),
                        points: t.pts 
                      })) 
                  })}
                  disabled={generatingPostId === 'power-rankings-section'}
                  className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary border-slate-200"
                >
                  {generatingPostId === 'power-rankings-section' ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Sparkles className="w-3 h-3 mr-2" />}
                  AI Post
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const data = teamForm.sort((a, b) => b.pts - a.pts).slice(0, 5).map(t => ({ name: t.name, pts: t.pts }));
                    setGraphicData({ type: 'power-rankings', data });
                  }}
                  className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary border-slate-200"
                >
                  <Eye className="w-3 h-3 mr-2" />
                  View Graphic
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {teamForm.sort((a, b) => b.pts - a.pts).slice(0, 5).map((team, i) => (
                <div key={team.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={team.logo} className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
                    <span className="text-xs font-black text-slate-700 uppercase tracking-tight truncate max-w-[100px]">{team.name}</span>
                  </div>
                  <div className="flex gap-1">
                    {team.form.map((res, idx) => (
                      <div 
                        key={idx}
                        className={cn(
                          "w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black text-white",
                          res === 'W' ? "bg-green-500" : res === 'L' ? "bg-red-500" : "bg-slate-400"
                        )}
                      >
                        {res}
                      </div>
                    ))}
                    {team.form.length === 0 && <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No games</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tournament Records */}
          <div id="season-highs-section" className="glass-card p-6 sm:p-8 space-y-6 relative bg-white overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150" />
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-orange-500" />
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">Season Highs</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleGeneratePost('season-highs-section', { title: 'Tournament Season Highs', stats: tournamentStats })}
                  disabled={generatingPostId === 'season-highs-section'}
                  className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary border-slate-200"
                >
                  {generatingPostId === 'season-highs-section' ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Sparkles className="w-3 h-3 mr-2" />}
                  AI Post
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const data = [
                      { title: 'Goal Machines', teams: [{ name: tournamentStats.highestScore.team, value: `${tournamentStats.highestScore.value} Goals` }] },
                      { title: 'Best Passers', teams: [{ name: tournamentStats.mostPasses.team, value: `${tournamentStats.mostPasses.value} Passes` }] },
                      { title: 'Top Keepers', teams: [{ name: tournamentStats.mostSaves.team, value: `${tournamentStats.mostSaves.value} Saves` }] }
                    ];
                    setGraphicData({ type: 'team-stats', data });
                  }}
                  className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary border-slate-200"
                >
                  <Eye className="w-3 h-3 mr-2" />
                  View Graphic
                </Button>
              </div>
            </div>

            <div className="space-y-4 relative z-10">
              <div className="grid grid-cols-1 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between group/item hover:bg-white hover:shadow-md transition-all relative">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Most Passes</p>
                      <p className="text-sm font-black text-slate-900 uppercase truncate max-w-[140px]">{tournamentStats.mostPasses.team}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xl font-black text-blue-500 tabular-nums">{tournamentStats.mostPasses.value}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-primary opacity-0 group-hover/item:opacity-100 transition-opacity"
                      onClick={() => handleGeneratePost('most-passes', { title: 'Tournament Passing Record', team: tournamentStats.mostPasses.team, passes: tournamentStats.mostPasses.value })}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between group/item hover:bg-white hover:shadow-md transition-all relative">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Most Saves</p>
                      <p className="text-sm font-black text-slate-900 uppercase truncate max-w-[140px]">{tournamentStats.mostSaves.team}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xl font-black text-purple-500 tabular-nums">{tournamentStats.mostSaves.value}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-primary opacity-0 group-hover/item:opacity-100 transition-opacity"
                      onClick={() => handleGeneratePost('most-saves', { title: 'Tournament Saves Record', team: tournamentStats.mostSaves.team, saves: tournamentStats.mostSaves.value })}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between group/item hover:bg-white hover:shadow-md transition-all relative">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                      <Target className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Highest Match Score</p>
                      <p className="text-sm font-black text-slate-900 uppercase truncate max-w-[140px]">{tournamentStats.highestScore.team}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xl font-black text-emerald-500 tabular-nums">{tournamentStats.highestScore.value}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-primary opacity-0 group-hover/item:opacity-100 transition-opacity"
                      onClick={() => handleGeneratePost('highest-score', { title: 'Highest Season Score', team: tournamentStats.highestScore.team, score: tournamentStats.highestScore.value, match: tournamentStats.highestScore.match })}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 relative">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setGraphicData({ type: 'card-stats', data: { yellows: tournamentStats.totalYellowCards, reds: tournamentStats.totalRedCards } })}
                  className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white shadow-md border border-slate-100 text-slate-400 hover:text-red-500 z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                   <Eye className="w-4 h-4" />
                </Button>
                <div className="p-4 rounded-2xl bg-yellow-50 border border-yellow-100 flex flex-col items-center text-center">
                  <p className="text-[9px] font-black text-yellow-600 uppercase tracking-widest mb-1">Yellows</p>
                  <p className="text-3xl font-black text-yellow-700 italic">{tournamentStats.totalYellowCards}</p>
                </div>
                <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex flex-col items-center text-center">
                  <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-1">Reds</p>
                  <p className="text-3xl font-black text-red-700 italic">{tournamentStats.totalRedCards}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      <div id="team-stats-leaderboard" className="glass-card p-6 sm:p-8 space-y-6 relative bg-white lg:col-span-3 mt-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">Team Stats Leaderboard</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleGeneratePost('team-stats-leaderboard', { title: 'Team Stats Leaderboard', stats: teamStats.map(t => ({ team: t.name, possession: t.avgPossession, shots: t.totalShots, passes: t.totalPasses, tackles: t.totalTackles })) })}
              disabled={generatingPostId === 'team-stats-leaderboard'}
              className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary border-slate-200"
            >
              {generatingPostId === 'team-stats-leaderboard' ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Sparkles className="w-3 h-3 mr-2" />}
              AI Post
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const groups = [
                  { 
                    title: 'Avg Possession (%)', 
                    teams: [...teamStats].sort((a, b) => b.avgPossession - a.avgPossession).slice(0, 5).map(t => ({ name: t.name, value: t.avgPossession })) 
                  },
                  { 
                    title: 'Total Goals', 
                    teams: [...teamStats].sort((a, b) => b.totalGoals - a.totalGoals).slice(0, 5).map(t => ({ name: t.name, value: t.totalGoals })) 
                  },
                  { 
                    title: 'Total Shots', 
                    teams: [...teamStats].sort((a, b) => b.totalShots - a.totalShots).slice(0, 5).map(t => ({ name: t.name, value: t.totalShots })) 
                  },
                  { 
                    title: 'Clean Sheets (Saves)', 
                    teams: [...teamStats].sort((a, b) => b.totalSaves - a.totalSaves).slice(0, 5).map(t => ({ name: t.name, value: t.totalSaves })) 
                  }
                ];
                setGraphicData({ type: 'team-stats', data: groups });
              }}
              className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary border-slate-200"
            >
              <Eye className="w-3 h-3 mr-2" />
              View Graphic
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: 'Avg Possession', key: 'avgPossession', suffix: '%' },
            { title: 'Total Shots', key: 'totalShots' },
            { title: 'Shots on Target', key: 'totalShotsOnTarget' },
            { title: 'Total Passes', key: 'totalPasses' },
            { title: 'Successful Passes', key: 'totalSuccessfulPasses' },
            { title: 'Total Tackles', key: 'totalTackles' },
            { title: 'Interceptions', key: 'totalInterceptions' },
            { title: 'Total Saves', key: 'totalSaves' },
          ].map((stat) => {
            const topTeams = [...teamStats]
              .sort((a, b) => (b[stat.key as keyof typeof b] as number) - (a[stat.key as keyof typeof a] as number))
              .slice(0, 3);

            return (
              <div key={stat.title} className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 group/stat">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.title}</h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-slate-300 hover:text-primary opacity-0 group-hover/stat:opacity-100 transition-opacity"
                    onClick={() => handleGeneratePost(`stat-${stat.key}`, { 
                      title: stat.title, 
                      topPerformers: topTeams.map(t => ({ team: t.name, value: t[stat.key as keyof typeof t] + (stat.suffix || '') })) 
                    })}
                  >
                    <Sparkles className="w-3 h-3" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {topTeams.map((team, idx) => (
                    <div key={team.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-xs font-black italic w-3", idx === 0 ? "text-primary" : "text-slate-300")}>{idx + 1}</span>
                        <img src={team.logo} className="w-5 h-5 object-contain" referrerPolicy="no-referrer" />
                        <span className="text-xs font-bold text-slate-700 uppercase truncate max-w-[80px]">{team.handleName || team.name}</span>
                      </div>
                      <span className="text-sm font-black text-slate-900">{team[stat.key as keyof typeof team]}{stat.suffix || ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      </div>
      
      <StatGraphicModal 
        isOpen={!!graphicData} 
        onClose={() => setGraphicData(null)} 
        type={graphicData?.type} 
        data={graphicData?.data} 
      />
      
      <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto rounded-[2rem] border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl font-black italic uppercase tracking-tighter">
              <Sparkles className="w-6 h-6 text-primary" />
              Elite Tournament Insights
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 mt-4 pb-4">
            <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 prose prose-slate max-w-none prose-headings:font-black prose-headings:uppercase prose-p:font-medium prose-p:text-slate-600">
              <div className="markdown-body">
                <Markdown>{generatedPost}</Markdown>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={copyPostToClipboard}
                className="flex-1 h-14 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all border-none"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy to Clipboard
              </Button>
              <Button 
                variant="outline"
                onClick={() => setIsPostDialogOpen(false)}
                className="flex-1 h-14 rounded-2xl border-slate-200 text-slate-500 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all"
              >
                Close Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
