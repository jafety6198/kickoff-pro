import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Plus, 
  Play, 
  Trash2, 
  Search, 
  Clock, 
  Users, 
  BarChart3, 
  MoreVertical, 
  Edit2,
  ChevronRight,
  Flame,
  LogOut,
  Link,
  Cloud,
  CloudOff,
  Zap
} from 'lucide-react';
import { useStore, Profile } from '@/store/useStore';
import { supabaseService } from '@/services/supabaseService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from 'sonner';

export function ProfileSelector() {
  const { profiles, loadProfile, deleteProfile, renameProfile, setStep, role, setRole, syncLeagues, migrateProfile } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [profileToRename, setProfileToRename] = useState<Profile | null>(null);
  const [newName, setNewName] = useState('');
  
  const [joinLeagueId, setJoinLeagueId] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [joining, setJoining] = useState(false);

  const isAdmin = role === 'admin';

  const handleJoinLeague = async () => {
    if (!joinLeagueId.trim()) return;
    setJoining(true);
    try {
      await supabaseService.joinLeague(joinLeagueId.trim(), joinPassword.trim());
      await syncLeagues();
      setIsJoinModalOpen(false);
      setJoinLeagueId('');
      setJoinPassword('');
      toast.success('Successfully joined the league!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to join league');
    } finally {
      setJoining(false);
    }
  };

  const filteredProfiles = useMemo(() => {
    return profiles
      .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [profiles, searchQuery]);

  const lastProfile = useMemo(() => {
    if (profiles.length === 0) return null;
    return [...profiles].sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )[0];
  }, [profiles]);

  const calculateProgress = (profile: Profile) => {
    if (!profile.fixtures || profile.fixtures.length === 0) return 0;
    const totalLegs = profile.fixtures.length * 2;
    const finishedLegs = profile.fixtures.reduce((acc, f) => {
      let count = 0;
      if (f.leg1.status === 'finished') count++;
      if (f.leg2.status === 'finished') count++;
      return acc + count;
    }, 0);
    return Math.round((finishedLegs / totalLegs) * 100);
  };

  const handleRename = () => {
    if (profileToRename && newName.trim()) {
      renameProfile(profileToRename.id, newName.trim());
      setIsRenameModalOpen(false);
      setProfileToRename(null);
      setNewName('');
      toast.success('Career renamed successfully');
    }
  };

  const handleSignOut = () => {
    setRole(null);
    setStep('entry');
    toast.info('Signed out successfully');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em]">
                <Flame className="w-3 h-3" /> Career Management
              </div>
              <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-slate-200">
                Mode: {role?.toUpperCase()}
              </Badge>
            </div>
            <h1 className="text-5xl sm:text-7xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">
              Career <span className="text-primary">Hub</span>
            </h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs sm:text-sm max-w-xl">
              Manage your football empires. Each profile is an independent workspace with its own teams, fixtures, and history.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search careers..."
                className="h-14 w-full sm:w-72 pl-12 rounded-2xl border-slate-200 bg-white shadow-sm focus:ring-primary/20 font-bold"
              />
            </div>
            {!isAdmin && (
              <Button 
                onClick={() => setIsJoinModalOpen(true)}
                className="h-14 px-8 rounded-2xl bg-primary text-white font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:-translate-y-1"
              >
                <Link className="w-5 h-5 mr-2" /> Join Shared League
              </Button>
            )}
            {isAdmin && (
              <Button 
                onClick={() => setStep('setup')}
                className="h-14 px-8 rounded-2xl bg-slate-900 hover:bg-primary text-white font-black uppercase tracking-widest shadow-xl shadow-slate-200 transition-all hover:-translate-y-1"
              >
                <Plus className="w-5 h-5 mr-2" /> Start New Career
              </Button>
            )}
            <Button 
              variant="outline"
              onClick={handleSignOut}
              className="h-14 px-6 rounded-2xl border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 font-black uppercase tracking-widest transition-all"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Migration Nudge */}
        {profiles.some(p => !(p as any).isCloud) && isAdmin && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-black text-amber-900 uppercase tracking-tighter italic">Local Data Detected</p>
                <p className="text-xs text-amber-700 font-medium tracking-tight">Sync your local careers to the cloud to access them anywhere.</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick Access / Last Played */}
        {lastProfile && !searchQuery && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 sm:p-12 text-white shadow-2xl"
          >
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/20 to-transparent pointer-events-none" />
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Continue Last Career</span>
                  <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter italic">{lastProfile.name}</h2>
                </div>
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Progress</p>
                      <p className="text-sm font-black">{calculateProgress(lastProfile)}% Complete</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Teams</p>
                      <p className="text-sm font-black">{lastProfile.teamCount} Clubs</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Last Active</p>
                      <p className="text-sm font-black">{formatDistanceToNow(new Date(lastProfile.updatedAt), { addSuffix: true })}</p>
                    </div>
                  </div>
                </div>
              </div>
              <Button 
                onClick={() => loadProfile(lastProfile.id)}
                className="h-20 px-12 rounded-3xl bg-primary hover:bg-white hover:text-primary text-white font-black uppercase tracking-[0.2em] text-lg transition-all shadow-2xl shadow-primary/40 group"
              >
                {isAdmin ? 'Resume Career' : 'View Career'} <ChevronRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Career Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredProfiles.map((profile) => (
              <motion.div
                key={profile.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group relative bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm hover:shadow-2xl hover:border-primary/30 transition-all duration-500"
              >
                <div className="space-y-8">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic truncate max-w-[200px]">
                        {profile.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-500 text-[8px] font-black uppercase tracking-widest">
                          Season {profile.season}
                        </Badge>
                        <Badge variant="secondary" className="bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest">
                          {profile.mode}
                        </Badge>
                        {(profile as any).isCloud ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                            <Cloud className="w-2.5 h-2.5" /> Cloud
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-100 text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                            <CloudOff className="w-2.5 h-2.5" /> Local
                          </Badge>
                        )}
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1">
                        {!(profile as any).isCloud && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => migrateProfile(profile.id)}
                            className="w-8 h-8 rounded-lg text-amber-500 hover:text-emerald-500 hover:bg-emerald-50"
                            title="Migrate to Cloud"
                          >
                            <Zap className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setProfileToRename(profile);
                            setNewName(profile.name);
                            setIsRenameModalOpen(true);
                          }}
                          className="w-8 h-8 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this career? This action cannot be undone.')) {
                              deleteProfile(profile.id);
                              toast.error('Career deleted');
                            }
                          }}
                          className="w-8 h-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <span>Season Progress</span>
                      <span className="text-slate-900">{calculateProgress(profile)}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${calculateProgress(profile)}%` }}
                        className="h-full bg-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 py-6 border-y border-slate-100">
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Clubs</p>
                      <p className="text-sm font-black text-slate-900">{profile.teamCount}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Last Updated</p>
                      <p className="text-sm font-black text-slate-900 truncate">
                        {formatDistanceToNow(new Date(profile.updatedAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  <Button 
                    onClick={() => loadProfile(profile.id)}
                    className="w-full h-14 rounded-2xl bg-slate-50 hover:bg-primary hover:text-white text-slate-900 font-black uppercase tracking-widest transition-all group/btn"
                  >
                    {isAdmin ? 'Load Career' : 'View Career'} <Play className="w-4 h-4 ml-2 group-hover/btn:fill-current" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Empty State / Add New */}
          {filteredProfiles.length === 0 && (
            <div className="col-span-full py-20 text-center space-y-6">
              <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto">
                <Trophy className="w-10 h-10 text-slate-300" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">No Careers Found</h3>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                  {searchQuery ? `No results for "${searchQuery}"` : "Start your first career to begin the journey"}
                </p>
              </div>
              {isAdmin && (
                <Button 
                  onClick={() => setStep('setup')}
                  className="h-14 px-8 rounded-2xl bg-primary text-white font-black uppercase tracking-widest"
                >
                  <Plus className="w-5 h-5 mr-2" /> Create New Profile
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Rename Modal */}
      <Dialog open={isRenameModalOpen} onOpenChange={setIsRenameModalOpen}>
        <DialogContent className="sm:max-w-md rounded-[2rem] border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">Rename Career</DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">New Career Name</label>
            <Input 
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter new name..."
              className="h-14 rounded-2xl border-slate-200 font-bold"
              autoFocus
            />
          </div>
          <DialogFooter className="gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsRenameModalOpen(false)}
              className="h-12 rounded-xl font-black uppercase tracking-widest border-slate-200"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRename}
              className="h-12 rounded-xl bg-primary text-white font-black uppercase tracking-widest px-8"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Join League Modal */}
      <Dialog open={isJoinModalOpen} onOpenChange={setIsJoinModalOpen}>
        <DialogContent className="sm:max-w-md rounded-[2rem] border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">Join Private League</DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">League ID (UUID)</label>
              <Input 
                value={joinLeagueId}
                onChange={(e) => setJoinLeagueId(e.target.value)}
                placeholder="Paste the shared ID..."
                className="h-14 rounded-2xl border-slate-200 font-bold"
                autoFocus
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Join Password</label>
              <Input 
                type="password"
                value={joinPassword}
                onChange={(e) => setJoinPassword(e.target.value)}
                placeholder="Enter password..."
                className="h-14 rounded-2xl border-slate-200 font-bold"
              />
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsJoinModalOpen(false)}
              className="h-12 rounded-xl font-black uppercase tracking-widest border-slate-200"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleJoinLeague}
              disabled={joining}
              className="h-12 rounded-xl bg-primary text-white font-black uppercase tracking-widest px-8"
            >
              {joining ? 'Joining...' : 'Unlock League'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
