import React, { useState, useRef } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useStore, Team } from '@/store/useStore';
import { scanSquadImage, ScannedSquadResult } from '@/lib/squad-scanner';
import { Upload, Scan, Loader2, Save, X, Shield, Zap, Target } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface SquadManagementModalProps {
  team: Team;
  isOpen: boolean;
  onClose: () => void;
}

export function SquadManagementModal({ team, isOpen, onClose }: SquadManagementModalProps) {
  const { updateTeam } = useStore();
  const [scanning, setScanning] = useState(false);
  const [image, setImage] = useState<string | null>(team.squadImage || null);
  const [formation, setFormation] = useState(team.formation || '');
  const [strength, setStrength] = useState(team.collectiveStrength?.toString() || '');
  const [playstyle, setPlaystyle] = useState(team.playstyle || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startSquadScan = async () => {
    if (!image) return;
    try {
      setScanning(true);
      const base64Data = image.split(',')[1];
      const result = await scanSquadImage(base64Data);
      
      setFormation(result.formation);
      setStrength(result.collective_strength.toString());
      setPlaystyle(result.team_playstyle);
      
      toast.success('Squad details extracted successfully!');
    } catch (error) {
      toast.error('Failed to scan squad image. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  const handleSave = () => {
    updateTeam(team.id, {
      squadImage: image || undefined,
      formation,
      collectiveStrength: parseInt(strength) || undefined,
      playstyle
    });
    toast.success('Squad updated!');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-[32px] border-none bg-slate-50">
        <div className="p-6 sm:p-8 space-y-8">
          <DialogHeader>
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline" className="border-primary/20 text-primary font-black uppercase tracking-widest text-[10px]">
                Squad Management • {team.name}
              </Badge>
              <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <DialogTitle className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">
              Team Lineup
            </DialogTitle>
            <DialogDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
              Upload your eFootball squad screenshot to sync formation and stats
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative aspect-video rounded-[32px] border-2 border-dashed border-slate-200 bg-white flex flex-col items-center justify-center cursor-pointer group overflow-hidden transition-all hover:border-primary/40"
            >
              {image ? (
                <img src={image} className="w-full h-full object-contain" />
              ) : (
                <>
                  <Upload className="w-8 h-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Upload Squad Screenshot</p>
                </>
              )}
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            </div>

            <Button 
              onClick={startSquadScan}
              disabled={!image || scanning}
              className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest hover:bg-slate-800"
            >
              {scanning ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Scan className="w-5 h-5 mr-2" />}
              {scanning ? 'Analyzing Squad...' : 'Scan Squad with AI'}
            </Button>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <Shield className="w-3 h-3" /> Formation
                </label>
                <input 
                  value={formation}
                  onChange={(e) => setFormation(e.target.value)}
                  placeholder="e.g. 4-3-3"
                  className="w-full h-12 px-4 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <Zap className="w-3 h-3" /> Strength
                </label>
                <input 
                  type="number"
                  value={strength}
                  onChange={(e) => setStrength(e.target.value)}
                  placeholder="e.g. 3200"
                  className="w-full h-12 px-4 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <Target className="w-3 h-3" /> Playstyle
                </label>
                <input 
                  value={playstyle}
                  onChange={(e) => setPlaystyle(e.target.value)}
                  placeholder="e.g. Long Ball"
                  className="w-full h-12 px-4 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button 
                variant="outline" 
                onClick={onClose}
                className="flex-1 h-14 rounded-2xl border-slate-200 text-slate-400 font-black uppercase tracking-widest"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                className="flex-1 h-14 rounded-2xl bg-gradient-primary text-white font-black uppercase tracking-widest shadow-xl shadow-primary/20"
              >
                <Save className="w-5 h-5 mr-2" /> Save Squad
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
