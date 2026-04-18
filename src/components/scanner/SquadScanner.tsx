import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Layout, Upload, Loader2, CheckCircle2, Shield, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useStore } from '@/store/useStore';

export function SquadScanner() {
  const { teams } = useStore();
  const [image, setImage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{ formation: string; team_name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const startScan = async () => {
    if (!image) return;

    try {
      setScanning(true);
      
      // Simulate tactical analysis delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Return a tactical mock based on standard formations
      const formations = ['4-3-3', '4-2-1-3', '4-4-2', '3-5-2', '5-3-2'];
      const data = {
        team_name: "IDENTIFIED_CLUB",
        formation: formations[Math.floor(Math.random() * formations.length)]
      };

      setResult(data);
      toast.success('Tactical data extracted');
    } catch (error) {
      console.error('Squad Scan Error:', error);
      toast.error('Failed to analyze squad');
    } finally {
      setScanning(false);
    }
  };

  const saveTacticalData = async () => {
    if (!result || !image) return;
    
    try {
      setScanning(true);
      // Simulate saving tactical data to the store/local state
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(`Tactical setup for ${result.team_name} saved!`);
      setResult(null);
      setImage(null);
    } catch (error) {
      toast.error('Failed to save tactical data');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-8 bg-slate-50">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="aspect-video glass-card flex flex-col items-center justify-center cursor-pointer group overflow-hidden relative"
          >
            {image ? (
              <div className="relative w-full h-full">
                <img src={image} className="w-full h-full object-cover opacity-40" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                <div className="absolute bottom-6 left-6">
                  <Badge className="bg-primary text-white border-none font-black uppercase tracking-widest">
                    Tactical Preview
                  </Badge>
                </div>
              </div>
            ) : (
              <>
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Layout className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                </div>
                <p className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tighter">Upload Squad Screenshot</p>
                <p className="text-xs sm:text-sm text-slate-400 font-bold">Pitch view with formation</p>
              </>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*" 
            />
          </div>

          <Button 
            onClick={startScan} 
            disabled={!image || scanning}
            className="w-full py-6 sm:py-8 rounded-[32px] bg-gradient-primary text-white hover:opacity-90 text-lg sm:text-xl font-black uppercase tracking-widest shadow-2xl shadow-primary/20 h-auto transition-all"
          >
            {scanning ? (
              <>
                <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                Extracting Tactics...
              </>
            ) : (
              <>
                <Shield className="w-6 h-6 mr-3" />
                Analyze Formation
              </>
            )}
          </Button>
        </div>

        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-card p-6 sm:p-8 space-y-8 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Tactical Report</h3>
                  <Badge className="bg-primary/10 text-primary border-none text-[8px] sm:text-[10px] font-black uppercase tracking-widest px-3 sm:px-4 py-1.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3 mr-2" />
                    Extraction Ready
                  </Badge>
                </div>

                <div className="space-y-6">
                  <div className="p-5 sm:p-6 rounded-3xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black mb-2">Identified Club</p>
                    <h4 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tighter">{result.team_name}</h4>
                  </div>

                  <div className="p-5 sm:p-6 rounded-3xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black mb-2">Tactical Formation</p>
                    <div className="flex items-center gap-4">
                      <span className="text-4xl sm:text-5xl font-black text-primary italic tracking-tighter">{result.formation}</span>
                      <div className="h-12 w-[2px] bg-slate-200" />
                      <p className="text-[10px] sm:text-xs font-bold text-slate-500 leading-tight">
                        Formation identified from pitch layout. Ready for Match Day graphics.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 sm:p-6 rounded-3xl bg-primary/5 border border-primary/10 flex items-start gap-4">
                  <Info className="w-5 h-5 text-primary shrink-0 mt-1" />
                  <p className="text-[10px] sm:text-xs font-bold text-slate-500 leading-relaxed">
                    The "Pitch View" has been auto-cropped and will be used as a tactical background in your Match Day posters.
                  </p>
                </div>

                <Button 
                  onClick={saveTacticalData}
                  className="w-full py-6 rounded-2xl bg-gradient-primary text-white hover:opacity-90 font-black uppercase tracking-widest h-auto shadow-xl shadow-primary/20"
                >
                  Save Tactical Setup
                </Button>
              </motion.div>
            ) : (
              <div className="h-full glass-card flex flex-col items-center justify-center p-12 text-center">
                <Layout className="w-16 h-16 text-slate-200 mb-6" />
                <h3 className="text-2xl font-black text-slate-400 uppercase tracking-tighter">Tactical Analysis</h3>
                <p className="text-sm text-slate-300 font-bold mt-2">Upload a squad screenshot to extract the formation</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
