import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useStore, Team } from '@/store/useStore';
import { Save, X, Info, BarChart3, Edit3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TeamManagementModalProps {
  team: Team;
  isOpen: boolean;
  onClose: () => void;
}

export function TeamManagementModal({ team, isOpen, onClose }: TeamManagementModalProps) {
  const { updateTeam } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(team.name);
  const [description, setDescription] = useState(team.description || '');

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Team name cannot be empty');
      return;
    }
    updateTeam(team.id, { 
      name: name.trim(), 
      description: description.trim() 
    });
    toast.success('Team details updated!');
    setIsEditing(false);
  };

  const stats = [
    { label: 'Played', value: team.played },
    { label: 'Won', value: team.won },
    { label: 'Drawn', value: team.drawn },
    { label: 'Lost', value: team.lost },
    { label: 'GF', value: team.gf },
    { label: 'GA', value: team.ga },
    { label: 'GD', value: team.gd },
    { label: 'Points', value: team.pts },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-[32px] border-none bg-slate-50">
        <div className="p-6 sm:p-8 space-y-8">
          <DialogHeader>
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline" className="border-primary/20 text-primary font-black uppercase tracking-widest text-[10px]">
                Team Profile • {team.id.slice(0, 8)}
              </Badge>
              <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 p-3 shadow-sm shrink-0">
                <img 
                  src={team.logo} 
                  alt={team.name} 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                  onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${team.name.replace(' ', '+')}&background=random`; }}
                />
              </div>
              <div className="space-y-1 flex-1">
                {isEditing ? (
                  <Input 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-2xl font-black uppercase tracking-tighter italic h-12 bg-white border-primary/20"
                    placeholder="Enter Team Name"
                    autoFocus
                  />
                ) : (
                  <DialogTitle className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic truncate">
                    {team.name}
                  </DialogTitle>
                )}
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Participant</span>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-3">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-white p-3 rounded-2xl border border-slate-100 text-center shadow-sm">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-sm font-black text-slate-900">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Description Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <Info className="w-3 h-3 text-primary" /> Team Bio & Intel
                </label>
                {!isEditing && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsEditing(true)}
                    className="h-8 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5"
                  >
                    Edit Detail
                  </Button>
                )}
              </div>
              {isEditing ? (
                <Textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter team description, tactical notes, or historical background..."
                  className="min-h-[120px] rounded-2xl bg-white border-slate-200 font-bold text-slate-700 focus:ring-primary/20"
                />
              ) : (
                <div className="min-h-[100px] p-4 rounded-2xl bg-slate-100/50 border border-slate-200">
                  <p className={cn(
                    "text-sm font-medium leading-relaxed",
                    description ? "text-slate-600" : "text-slate-400 italic"
                  )}>
                    {description || "No description set for this team yet. Use the edit button to add tactical details or club history."}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              {isEditing ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsEditing(false);
                      setName(team.name);
                      setDescription(team.description || '');
                    }}
                    className="flex-1 h-14 rounded-2xl border-slate-200 text-slate-400 font-black uppercase tracking-widest"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSave}
                    className="flex-1 h-14 rounded-2xl bg-gradient-primary text-white font-black uppercase tracking-widest shadow-xl shadow-primary/20"
                  >
                    <Save className="w-5 h-5 mr-2" /> Save Changes
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={onClose}
                  className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest hover:bg-slate-800"
                >
                  Close Profile
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
