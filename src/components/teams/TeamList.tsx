import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Globe, Shield, Users, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { Team } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function TeamList() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  const [newTeam, setNewTeam] = useState({
    name: '',
    logo_url: '',
    university_id: ''
  });

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast.error('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeam = async () => {
    if (!newTeam.name) {
      toast.error('Team name is required');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('teams')
        .insert([{
          name: newTeam.name,
          logo_url: newTeam.logo_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${newTeam.name}`,
          university_id: newTeam.university_id
        }])
        .select();

      if (error) throw error;
      
      setTeams([...teams, data[0]]);
      setIsAddDialogOpen(false);
      setNewTeam({ name: '', logo_url: '', university_id: '' });
      toast.success('Team registered successfully');
    } catch (error) {
      console.error('Error adding team:', error);
      toast.error('Failed to register team');
    }
  };

  const handleDeleteTeam = async (id: string) => {
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setTeams(teams.filter(t => t.id !== id));
      toast.success('Team removed');
    } catch (error) {
      console.error('Error deleting team:', error);
      toast.error('Failed to remove team');
    }
  };

  const filteredTeams = teams.filter(team => 
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.university_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
        <div className="relative flex-1 lg:max-w-md">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-pl-purple/50" />
          <input
            type="text"
            placeholder="Search clubs or university..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-black/5 rounded-2xl pl-14 pr-6 h-14 lg:h-16 text-pl-purple font-bold focus:outline-none focus:ring-2 focus:ring-pl-purple/10 transition-all shadow-sm"
          />
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl bg-pl-purple text-white hover:bg-pl-dark px-8 py-4 lg:py-6 h-auto font-black uppercase tracking-widest shadow-xl shadow-pl-purple/20">
              <Plus className="w-5 h-5 mr-2" />
              Register Club
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-none rounded-[32px] sm:max-w-[425px] p-8 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-3xl font-black text-pl-purple uppercase tracking-tighter">Register Club</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-pl-purple/60 font-bold uppercase text-[10px] tracking-widest">Club Name</Label>
                <Input
                  id="name"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  className="bg-black/5 border-none rounded-xl h-12 font-bold focus:ring-pl-purple"
                  placeholder="e.g. Manchester City"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="university" className="text-pl-purple/60 font-bold uppercase text-[10px] tracking-widest">University ID</Label>
                <Input
                  id="university"
                  value={newTeam.university_id}
                  onChange={(e) => setNewTeam({ ...newTeam, university_id: e.target.value })}
                  className="bg-black/5 border-none rounded-xl h-12 font-bold focus:ring-pl-purple"
                  placeholder="e.g. UCL-2024"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logo" className="text-pl-purple/60 font-bold uppercase text-[10px] tracking-widest">Logo URL</Label>
                <Input
                  id="logo"
                  value={newTeam.logo_url}
                  onChange={(e) => setNewTeam({ ...newTeam, logo_url: e.target.value })}
                  className="bg-black/5 border-none rounded-xl h-12 font-bold focus:ring-pl-purple"
                  placeholder="https://..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddTeam} className="w-full rounded-2xl bg-pl-purple text-white hover:bg-pl-dark py-6 h-auto font-black uppercase tracking-widest">
                Confirm Registration
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-64 bg-white rounded-[32px] animate-pulse shadow-sm" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredTeams.map((team) => (
              <motion.div
                key={team.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-[32px] p-6 group relative overflow-hidden shadow-sm hover:shadow-xl transition-all border border-black/5"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-pl-purple/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-pl-purple/10 transition-colors" />
                
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-black/5 p-3 flex items-center justify-center border border-black/5 group-hover:scale-105 transition-transform">
                      <img src={team.logo_url} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-pl-purple tracking-tighter uppercase leading-tight">{team.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Shield className="w-3 h-3 text-pl-purple/50" />
                        <span className="text-[10px] text-pl-purple/60 font-black uppercase tracking-widest">
                          {team.university_id || 'Independent'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleDeleteTeam(team.id)}
                    className="p-2.5 rounded-xl text-pl-purple/20 hover:text-pl-pink hover:bg-pl-pink/10 transition-all lg:opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="mt-8 grid grid-cols-3 gap-4 relative z-10">
                  <div className="text-center p-4 rounded-2xl bg-pl-purple/5 border border-pl-purple/5">
                    <p className="text-[8px] uppercase tracking-widest text-pl-purple/60 font-black mb-1">Played</p>
                    <p className="text-xl font-black text-pl-purple italic">28</p>
                  </div>
                  <div className="text-center p-4 rounded-2xl bg-pl-purple/5 border border-pl-purple/5">
                    <p className="text-[8px] uppercase tracking-widest text-pl-purple/60 font-black mb-1">Points</p>
                    <p className="text-xl font-black text-pl-purple italic">64</p>
                  </div>
                  <div className="text-center p-4 rounded-2xl bg-pl-purple/5 border border-pl-purple/5">
                    <p className="text-[8px] uppercase tracking-widest text-pl-purple/40 font-black mb-1">GD</p>
                    <p className="text-xl font-black text-pl-green italic">+34</p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-black/5 flex items-center justify-between relative z-10">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-6 h-6 rounded-full bg-pl-purple/10 border-2 border-white flex items-center justify-center text-[8px] font-bold text-pl-purple">
                        {i}
                      </div>
                    ))}
                  </div>
                  <button className="text-[10px] font-black text-pl-purple uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
                    Club Profile <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filteredTeams.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white rounded-[32px] border-2 border-dashed border-black/5">
              <Users className="w-16 h-16 text-pl-purple/10 mx-auto mb-4" />
              <h3 className="text-2xl font-black text-pl-purple/40 uppercase tracking-tighter">No clubs found</h3>
              <p className="text-sm text-pl-purple/20 font-bold">Register your first club to start the season</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
