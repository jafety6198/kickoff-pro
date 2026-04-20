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
  Layout
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
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const topTeam = teamStats.sort((a,b) => b.pts - a.pts)[0];
      const mostGoals = teamStats.sort((a,b) => b.totalGoals - a.totalGoals)[0];

      const insight = `## 📊 LUMINAMATH INSIGHTS\n\n### 👑 Team to Watch: **${topTeam.name}**\nDominating the standings with ${topTeam.pts} points. Their statistical efficiency in transition is currently unmatched in the series.\n\n### 🎯 Tactical Trend\nWe're seeing a shift towards high-volume offensive strategies. **${mostGoals.name}** leads the league in scoring with ${mostGoals.totalGoals} goals, forcing opponents into defensive adaptations.\n\n### 🔮 Strategic Outlook\nData points to a high-scoring finish for the upcoming rounds. Teams with balanced defensive strength metrics are currently showing higher win-probability in simulation.`;

      setGeneratedPost(insight);
      setIsPostDialogOpen(true);
    } catch (error) {
      toast.error('Failed to generate insights.');
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
        if (f.status === 'finished') {
          if (f.homeTeamId === team.id) {
            goals += f.homeScore || 0;
            passes += f.stats?.passes_home || 0;
            saves += f.stats?.saves_home || 0;
            shots += f.stats?.shots_home || 0;
            shotsOnTarget += f.stats?.shots_on_target_home || 0;
            fouls += f.stats?.fouls_home || 0;
            corners += f.stats?.corners_home || 0;
            freeKicks += f.stats?.free_kicks_home || 0;
            successfulPasses += f.stats?.successful_passes_home || 0;
            crosses += f.stats?.crosses_home || 0;
            interceptions += f.stats?.interceptions_home || 0;
            tackles += f.stats?.tackles_home || 0;
            if (f.stats?.possession_home) {
              possessionTotal += f.stats.possession_home;
              possessionCount++;
            }
          } else if (f.awayTeamId === team.id) {
            goals += f.awayScore || 0;
            passes += f.stats?.passes_away || 0;
            saves += f.stats?.saves_away || 0;
            shots += f.stats?.shots_away || 0;
            shotsOnTarget += f.stats?.shots_on_target_away || 0;
            fouls += f.stats?.fouls_away || 0;
            corners += f.stats?.corners_away || 0;
            freeKicks += f.stats?.free_kicks_away || 0;
            successfulPasses += f.stats?.successful_passes_away || 0;
            crosses += f.stats?.crosses_away || 0;
            interceptions += f.stats?.interceptions_away || 0;
            tackles += f.stats?.tackles_away || 0;
            if (f.stats?.possession_away) {
              possessionTotal += f.stats.possession_away;
              possessionCount++;
            }
          }
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

  const teamForm = useMemo(() => {
    return teams.map(team => {
      const teamFixtures = fixtures
        .filter(f => f.status === 'finished' && (f.homeTeamId === team.id || f.awayTeamId === team.id))
        .sort((a, b) => b.round - a.round)
        .slice(0, 5);

      const form = teamFixtures.map(f => {
        const isHome = f.homeTeamId === team.id;
        const score = isHome ? f.homeScore! : f.awayScore!;
        const oppScore = isHome ? f.awayScore! : f.homeScore!;
        
        if (score > oppScore) return 'W';
        if (score < oppScore) return 'L';
        return 'D';
      }).reverse();

      return { ...team, form };
    });
  }, [teams, fixtures]);

  const tournamentStats = useMemo(() => {
    const finishedFixtures = fixtures.filter(f => f.status === 'finished');
    
    let highestScore = { value: 0, team: '', match: '' };
    let totalYellowCards = players.reduce((sum, p) => sum + p.yellowCards, 0);
    let totalRedCards = players.reduce((sum, p) => sum + p.redCards, 0);

    finishedFixtures.forEach(f => {
      if (f.homeScore! > highestScore.value) {
        highestScore = { 
          value: f.homeScore!, 
          team: teams.find(t => t.id === f.homeTeamId)?.handleName || teams.find(t => t.id === f.homeTeamId)?.name || '',
          match: `${teams.find(t => t.id === f.homeTeamId)?.name} vs ${teams.find(t => t.id === f.awayTeamId)?.name}`
        };
      }
      if (f.awayScore! > highestScore.value) {
        highestScore = { 
          value: f.awayScore!, 
          team: teams.find(t => t.id === f.awayTeamId)?.handleName || teams.find(t => t.id === f.awayTeamId)?.name || '',
          match: `${teams.find(t => t.id === f.homeTeamId)?.name} vs ${teams.find(t => t.id === f.awayTeamId)?.name}`
        };
      }
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

  return (
    <div className="space-y-8 pb-12">
      {/* Quick Insights Hero */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        {[
          { label: 'Season Goals', value: teamStats.reduce((acc, t) => acc + t.totalGoals, 0), icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Total Passes', value: teamStats.reduce((acc, t) => acc + t.totalPasses, 0).toLocaleString(), icon: Zap, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Matches Played', value: fixtures.filter(f => f.status === 'finished').length, icon: Activity, color: 'text-purple-500', bg: 'bg-purple-50' },
          { label: 'Avg Attendance', value: '42.5K', icon: Users, color: 'text-amber-500', bg: 'bg-amber-50' },
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 uppercase tracking-tighter italic">Tournament Stats</h2>
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleTournamentInsight}
            disabled={insightLoading}
            className="rounded-full bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] px-6 h-10 hover:bg-slate-800 shadow-xl transition-all"
          >
            {insightLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2 text-primary" />}
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
        <div className="lg:col-span-2 space-y-6">
          <div id="golden-boot-section" className="glass-card p-6 sm:p-8 space-y-6 relative bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                   < Award className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">Golden Boot Race (Team)</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleGeneratePost('golden-boot-section', { 
                    title: 'Golden Boot (Team Rankings)', 
                    topTeams: teamScorerRace.map(t => ({ team: t.name, goals: t.totalGoals })) 
                  })}
                  disabled={generatingPostId === 'golden-boot-section'}
                  className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary border-slate-200"
                >
                  {generatingPostId === 'golden-boot-section' ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Sparkles className="w-3 h-3 mr-2" />}
                  AI Post
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const data = teamScorerRace.map(t => ({ 
                      id: t.id, 
                      name: t.name, 
                      goals: t.totalGoals, 
                      teamName: 'Total Team Goals' 
                    }));
                    setGraphicData({ type: 'golden-boot', data });
                  }}
                  className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary border-slate-200"
                >
                  <Eye className="w-3 h-3 mr-2" />
                  View Graphic
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {teamScorerRace.length > 0 ? teamScorerRace.map((team, i) => {
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI Generated Post
            </DialogTitle>
            <DialogDescription>
              Copy this post to share your tournament stats on social media!
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mt-4 relative">
            <p className="text-sm text-slate-700 whitespace-pre-wrap font-medium">{generatedPost}</p>
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-2 right-2 text-slate-400 hover:text-primary"
              onClick={copyPostToClipboard}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={() => setIsPostDialogOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
