import React, { useState, useEffect } from 'react';
import { Trophy, Calendar, Zap, ChevronRight, Play, CheckCircle2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { Team, Fixture } from '@/types';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface FixtureGeneratorProps {
  role: 'admin' | 'guest';
}

export function FixtureGenerator({ role }: FixtureGeneratorProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teamsRes, fixturesRes] = await Promise.all([
        supabase.from('teams').select('*'),
        supabase.from('fixtures').select('*, team_a:team_a_id(name, logo_url), team_b:team_b_id(name, logo_url)')
      ]);

      if (teamsRes.error) throw teamsRes.error;
      if (fixturesRes.error) throw fixturesRes.error;

      setTeams(teamsRes.data || []);
      setFixtures(fixturesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const generateLeagueFixtures = async () => {
    if (teams.length < 2) {
      toast.error('Need at least 2 clubs to generate fixtures');
      return;
    }

    try {
      setGenerating(true);
      
      const teamIds = teams.map(t => t.id);
      if (teamIds.length % 2 !== 0) teamIds.push('BYE');
      
      const numTeams = teamIds.length;
      const numRounds = numTeams - 1;
      const matchesPerRound = numTeams / 2;
      
      const newFixtures = [];
      const startDate = new Date();

      for (let round = 0; round < numRounds; round++) {
        for (let match = 0; match < matchesPerRound; match++) {
          const home = teamIds[match];
          const away = teamIds[numTeams - 1 - match];
          
          if (home !== 'BYE' && away !== 'BYE') {
            const matchDate = new Date(startDate);
            matchDate.setDate(startDate.getDate() + round * 2);
            
            newFixtures.push({
              team_a_id: home,
              team_b_id: away,
              match_date: matchDate.toISOString(),
              status: 'pending',
              tournament_type: 'league',
              round: round + 1
            });
          }
        }
        teamIds.splice(1, 0, teamIds.pop()!);
      }

      const { error } = await supabase.from('fixtures').insert(newFixtures);
      if (error) throw error;

      toast.success(`Generated ${newFixtures.length} league fixtures`);
      fetchData();
    } catch (error) {
      console.error('Error generating league:', error);
      toast.error('Failed to generate fixtures');
    } finally {
      setGenerating(false);
    }
  };

  const clearFixtures = async () => {
    try {
      const { error } = await supabase.from('fixtures').delete().neq('id', '0');
      if (error) throw error;
      setFixtures([]);
      toast.success('All fixtures cleared');
    } catch (error) {
      toast.error('Failed to clear fixtures');
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {role === 'admin' && (
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between bg-white rounded-[32px] p-8 gap-6 shadow-sm border border-black/5">
          <div>
            <h3 className="text-2xl font-black text-pl-purple uppercase tracking-tighter">Tournament Control</h3>
            <p className="text-sm text-pl-purple/60 font-bold">Manage match schedules and generate league fixtures</p>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={clearFixtures}
              className="flex-1 lg:flex-none rounded-2xl border-black/5 hover:bg-pl-pink/10 hover:text-pl-pink h-14 lg:h-16 px-8 font-black uppercase tracking-widest transition-all"
            >
              Clear All
            </Button>
            <Button 
              onClick={generateLeagueFixtures}
              disabled={generating}
              className="flex-1 lg:flex-none rounded-2xl bg-pl-purple text-white hover:bg-pl-dark px-10 h-14 lg:h-16 font-black uppercase tracking-widest shadow-xl shadow-pl-purple/20 transition-all"
            >
              {generating ? 'Generating...' : 'Generate League'}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="h-24 bg-white rounded-[32px] animate-pulse shadow-sm" />)
        ) : (
          fixtures.map((fixture: any, index) => (
            <motion.div
              key={fixture.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-[32px] p-6 flex flex-col sm:flex-row items-center justify-between group gap-6 shadow-sm border border-black/5 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-6 lg:gap-12 flex-1 w-full sm:w-auto">
                <div className="flex flex-col items-center gap-1 w-12 shrink-0">
                  <span className="text-[8px] font-black text-pl-purple/50 uppercase tracking-widest">Round</span>
                  <span className="text-2xl font-black text-pl-purple italic">{fixture.round}</span>
                  <Badge variant="outline" className="text-[6px] font-black uppercase border-pl-purple/20 text-pl-purple/60 px-1">
                    {fixture.tournament_type}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-end gap-4 flex-1">
                  <span className="font-black text-sm lg:text-lg text-pl-purple uppercase tracking-tighter truncate max-w-[150px]">{fixture.team_a?.name}</span>
                  <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-2xl bg-black/5 p-3 border border-black/5 group-hover:scale-105 transition-transform">
                    <img src={fixture.team_a?.logo_url} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2 px-4 lg:px-12 shrink-0">
                  <div className="px-4 py-1.5 bg-pl-purple/5 rounded-full text-pl-purple font-black text-xl italic shadow-inner">
                    {fixture.status === 'finished' ? `${fixture.score_a} - ${fixture.score_b}` : 'VS'}
                  </div>
                  <Badge variant="outline" className="border-black/5 text-pl-purple/60 text-[8px] font-black uppercase tracking-widest h-5 px-3">
                    {fixture.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-start gap-4 flex-1">
                  <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-2xl bg-black/5 p-3 border border-black/5 group-hover:scale-105 transition-transform">
                    <img src={fixture.team_b?.logo_url} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                  <span className="font-black text-sm lg:text-lg text-pl-purple uppercase tracking-tighter truncate max-w-[150px]">{fixture.team_b?.name}</span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-8 sm:ml-8 pt-6 sm:pt-0 border-t sm:border-t-0 border-black/5">
                <div className="text-left sm:text-right">
                  <p className="text-[8px] font-black text-pl-purple/50 uppercase tracking-widest">Match Date</p>
                  <div className="flex items-center gap-2 text-xs lg:text-sm text-pl-purple font-bold">
                    <Clock className="w-4 h-4 text-pl-purple/40" />
                    {format(new Date(fixture.match_date), 'MMM dd, HH:mm')}
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="rounded-2xl hover:bg-pl-purple/5 text-pl-purple/40 hover:text-pl-purple group-hover:translate-x-1 transition-all w-12 h-12">
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </div>
            </motion.div>
          ))
        )}

        {fixtures.length === 0 && !loading && (
          <div className="py-24 text-center bg-white rounded-[40px] border-2 border-dashed border-black/5">
            <Trophy className="w-20 h-20 text-pl-purple/10 mx-auto mb-6" />
            <h3 className="text-2xl font-black text-pl-purple/40 uppercase tracking-tighter">No fixtures generated</h3>
            <p className="text-sm text-pl-purple/20 font-bold">Select a tournament type to generate the season schedule</p>
          </div>
        )}
      </div>
    </div>
  );
}
