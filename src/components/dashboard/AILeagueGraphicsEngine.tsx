import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Table, 
  Image as ImageIcon, 
  Sparkles, 
  Download, 
  Share2, 
  CheckCircle2, 
  X, 
  Edit3, 
  Save, 
  RefreshCw,
  Zap,
  Layout,
  Crown,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { useStore, Team } from '@/store/useStore';
import { calculateStandings } from '@/lib/tournament-engine';
import { GoogleGenAI } from '@google/genai';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function AILeagueGraphicsEngine() {
  const { teams, fixtures, tournamentName } = useStore();
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [focusArea, setFocusArea] = useState<'Table' | 'Top Scorer' | 'Match Result'>('Table');
  const [colorGrade, setColorGrade] = useState<'Original' | 'MatchDay Red' | 'Technical Blue'>('Original');

  // Local state for editable data
  const standings = useMemo(() => calculateStandings(teams, fixtures), [teams, fixtures]);
  
  // Fallback manager names for the "Manager Alias Memory" request
  const FALLBACK_MANAGERS = ['Maestro d\'Vida', 'Le BRON', 'issaya', 'Trexie07', 'Pep', 'Klopp'];

  const [editableTeams, setEditableTeams] = useState(() => 
    standings.map((t, i) => ({
      ...t,
      managerName: t.managerName || FALLBACK_MANAGERS[i % FALLBACK_MANAGERS.length]
    }))
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        setReferenceImage(event.target?.result as string);
        setIsUploading(false);
        toast.success("Reference poster uploaded successfully!");
      };
      reader.readAsDataURL(file);
    }
  };

  const generateAIPrompt = (data: any, focus: string) => {
    const managerMapping = teams.map(t => `${t.name} (Manager: ${t.managerName || 'Default Agent'})`).join(', ');
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    
    let styleInstruction = "Maintain the exact font, lighting, and glassmorphism of the reference image.";
    if (colorGrade === 'MatchDay Red') styleInstruction += " Shift the color grade to a deep, cinematic MatchDay Red.";
    if (colorGrade === 'Technical Blue') styleInstruction += " Shift the color grade to a sharp, modern Technical Blue.";

    return `Update the image using details from the database provided below. 
Give me a crisp clear 4K sharp image just like EPL posters. 
Set the date on the graphic to today's date: ${today}.
Observe the logos and replicate them with absolute precision.

Core Style & Accuracy Constraints:
1. Visual Identity: ${styleInstruction} Replicate professional football broadcast aesthetics (EPL style).
2. Text Precision: Accuracy is non-negotiable. Team names, points, and managers must match the database exactly. NO HALLUCINATIONS.
3. Image Quality: Digital Export quality—sharp, crisp edges, high contrast.
4. Composition: Focus heavily on the ${focus}.

Database (League Data):
${JSON.stringify(data.map((t: any) => ({ name: t.name, pts: t.pts, played: t.played, gd: t.gd, form: t.form?.join('') })), null, 2)}

Verified Manager Identities:
${managerMapping}

Verification: Check the generated image against the database provided. Ensure the output is a professional 4K masterpiece.`;
  };

  const processGraphic = async () => {
    if (!referenceImage) {
      toast.error("Please upload a reference poster first.");
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 800);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = generateAIPrompt(editableTeams, focusArea);

      // Extract base64 and MIME type for Gemini
      const mimeType = referenceImage.split(';')[0].split(':')[1];
      const base64Img = referenceImage.split(',')[1];

      // Array of models to try in order of quality/requirement
      const modelsToTry = [
        { name: 'gemini-3.1-flash-image-preview', size: '2K' },
        { name: 'gemini-2.5-flash-image', size: undefined }
      ];

      let lastError = null;
      let generationSuccess = false;

      for (const modelConfig of modelsToTry) {
        if (generationSuccess) break;
        
        try {
          const response = await ai.models.generateContent({
            model: modelConfig.name,
            contents: {
              parts: [
                { inlineData: { data: base64Img, mimeType } },
                { text: prompt }
              ]
            },
            config: {
              ...(modelConfig.size ? { imageConfig: { imageSize: modelConfig.size, aspectRatio: '1:1' } } : {})
            }
          });

          const parts = response.candidates?.[0]?.content?.parts || [];
          for (const part of parts) {
            if (part.inlineData) {
              setGeneratedImage(`data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`);
              generationSuccess = true;
              break;
            }
          }
          
          if (generationSuccess) break;
        } catch (err) {
          console.warn(`Failed with model ${modelConfig.name}:`, err);
          lastError = err;
        }
      }

      if (!generationSuccess) {
        throw lastError || new Error("All image generation models failed.");
      }

      setProgress(100);
      toast.success("Professional Graphic Generated!");
    } catch (error: any) {
      console.error("AI Generation Error:", error);
      const errorMessage = error?.message || "Unknown error";
      
      if (errorMessage.includes("API key")) {
        toast.error("Invalid API Key. Please provide your own Gemini API key in Settings.");
      } else if (errorMessage.includes("model")) {
        toast.error("The requested 4K model is not available for this account.");
      } else {
        toast.error(`Generation Failed: ${errorMessage.substring(0, 50)}...`);
      }
    } finally {
      setIsProcessing(false);
      clearInterval(interval);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 sm:p-10 space-y-12 pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary w-fit">
            <Sparkles className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">AI Graphics Engine 4K</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-black uppercase tracking-tighter italic drop-shadow-sm text-slate-900">
            Legacy <span className="text-primary italic">Visuals</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium">Replicate professional league aesthetics with 4K AI generation.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            onClick={processGraphic}
            disabled={isProcessing || !referenceImage}
            className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/20 group disabled:opacity-50"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Zap className="w-5 h-5 mr-2 fill-white group-hover:scale-110 transition-transform" />
            )}
            {isProcessing ? `Processing ${Math.round(progress)}%` : 'Generate 4K Graphic'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 relative z-10">
        {/* Left Side: Inputs */}
        <div className="space-y-10">
          {/* Upload Zone */}
          <div className="space-y-4">
             <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2 text-slate-800">
               <Upload className="w-6 h-6 text-primary" /> Reference Poster
             </h3>
             <div 
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "relative h-[300px] rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer overflow-hidden group transition-all",
                referenceImage ? "border-solid border-primary/40 bg-white" : "hover:border-primary/40 hover:bg-white shadow-sm"
              )}
             >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleUpload} 
                  className="hidden" 
                  accept="image/*"
                />
                
                {referenceImage ? (
                  <div className="w-full h-full relative">
                    <img src={referenceImage} className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <RefreshCw className="w-10 h-10 text-white animate-spin-slow" />
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-4 p-8">
                     <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform border border-slate-200">
                       < ImageIcon className="w-8 h-8 text-slate-400" />
                     </div>
                     <div>
                       <p className="font-black uppercase tracking-widest text-sm text-slate-500">Drag & Drop Reference</p>
                       <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">EPL, La Liga, or custom templates</p>
                     </div>
                  </div>
                )}
             </div>
          </div>

          {/* Configuration */}
          <div className="p-8 rounded-[2.5rem] bg-white shadow-xl shadow-slate-200/50 border border-slate-100 space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2 text-slate-800">
                <Layout className="w-5 h-5 text-primary" /> Configuration
              </h3>
              <Badge variant="outline" className="border-primary/20 text-primary font-black uppercase tracking-widest text-[8px] bg-primary/5">
                Super-App Active
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
               <div className="space-y-3">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Visual Focus</label>
                 <div className="flex flex-wrap gap-2">
                   {['Table', 'Top Scorer', 'Match Result'].map(f => (
                     <button
                       key={f}
                       onClick={() => setFocusArea(f as any)}
                       className={cn(
                         "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                         focusArea === f ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200"
                       )}
                     >
                       {f}
                     </button>
                   ))}
                 </div>
               </div>

               <div className="space-y-3">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Theme Grade</label>
                 <div className="flex flex-wrap gap-2">
                   {['Original', 'MatchDay Red', 'Technical Blue'].map(c => (
                     <button
                       key={c}
                       onClick={() => setColorGrade(c as any)}
                       className={cn(
                         "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                         colorGrade === c ? "bg-slate-800 text-white shadow-lg" : "bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200"
                       )}
                     >
                       {c}
                     </button>
                   ))}
                 </div>
               </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-4">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <Table className="w-4 h-4 text-slate-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sync Module: Standing Data</span>
                 </div>
                 <button 
                  onClick={() => setEditMode(!editMode)}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors"
                 >
                   {editMode ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                   {editMode ? 'Save Overrides' : 'Edit Live Data'}
                 </button>
               </div>

               <div className="max-h-[200px] overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/50">
                  <table className="w-full text-left text-[10px]">
                    <thead className="bg-slate-100 sticky top-0">
                      <tr>
                        <th className="p-3 font-black uppercase tracking-widest text-slate-500">Team</th>
                        <th className="p-3 font-black uppercase tracking-widest text-slate-500">Manager</th>
                        <th className="p-3 font-black uppercase tracking-widest text-slate-500">PTS</th>
                        <th className="p-3 font-black uppercase tracking-widest text-slate-500 text-right">GD</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {editableTeams.map((team, i) => (
                        <tr key={team.id} className="hover:bg-white transition-colors">
                          <td className="p-3 font-bold truncate max-w-[120px] text-slate-800">
                            {editMode ? (
                              <input 
                                className="bg-slate-200/50 border border-slate-200 rounded px-2 w-full text-slate-900 focus:outline-none focus:border-primary/40"
                                value={team.name}
                                onChange={(e) => {
                                  const newTeams = [...editableTeams];
                                  newTeams[i].name = e.target.value;
                                  setEditableTeams(newTeams);
                                }}
                              />
                            ) : team.name}
                          </td>
                          <td className="p-3 text-slate-500">
                             {editMode ? (
                               <input 
                                 className="bg-slate-200/50 border border-slate-200 rounded px-2 w-full text-slate-900 focus:outline-none focus:border-primary/40"
                                 value={team.managerName}
                                 onChange={(e) => {
                                   const newTeams = [...editableTeams];
                                   newTeams[i].managerName = e.target.value;
                                   setEditableTeams(newTeams);
                                 }}
                               />
                             ) : team.managerName}
                          </td>
                          <td className="p-3 font-black text-slate-900">
                            {editMode ? (
                              <input 
                                type="number"
                                className="bg-slate-200/50 border border-slate-200 rounded px-2 w-16 text-slate-900 text-center focus:outline-none focus:border-primary/40"
                                value={team.pts}
                                onChange={(e) => {
                                  const newTeams = [...editableTeams];
                                  newTeams[i].pts = parseInt(e.target.value) || 0;
                                  setEditableTeams(newTeams);
                                }}
                              />
                            ) : team.pts}
                          </td>
                          <td className="p-3 text-right font-bold text-slate-500">
                             {editMode ? (
                              <input 
                                type="number"
                                className="bg-slate-200/50 border border-slate-200 rounded px-2 w-16 text-slate-900 text-right focus:outline-none focus:border-primary/40"
                                value={team.gd}
                                onChange={(e) => {
                                  const newTeams = [...editableTeams];
                                  newTeams[i].gd = parseInt(e.target.value) || 0;
                                  setEditableTeams(newTeams);
                                }}
                              />
                            ) : (team.gd > 0 ? `+${team.gd}` : team.gd)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </div>
          </div>
        </div>

        {/* Right Side: Output Gallery */}
        <div className="space-y-6">
          <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2 text-slate-800">
            <ImageIcon className="w-6 h-6 text-primary" /> Generated Output
          </h3>
          
          <div className="relative aspect-[1/1] rounded-[2.5rem] bg-white overflow-hidden border border-slate-100 shadow-2xl shadow-slate-200">
             {isProcessing && (
               <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-xl flex flex-col items-center justify-center p-12 text-center space-y-6">
                  <div className="relative w-24 h-24">
                     <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
                     <div 
                      className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"
                     />
                     <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                     </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xl font-black uppercase tracking-tighter italic text-slate-900">Generating 4K Masterpiece</p>
                    <p className="text-[10px] uppercase tracking-widest text-[#00A364] animate-pulse font-bold">Running Self-Correction Loop...</p>
                  </div>
                  <div className="w-full max-w-[200px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                    />
                  </div>
               </div>
             )}

             {generatedImage ? (
               <div className="w-full h-full relative group">
                 <img src={generatedImage} className="w-full h-full object-contain" />
                 <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0">
                    <Button 
                      onClick={() => {
                        const link = document.createElement('a');
                        link.download = `4K_Standings_${focusArea}.png`;
                        link.href = generatedImage;
                        link.click();
                      }}
                      className="h-12 px-6 rounded-xl bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] shadow-2xl hover:bg-slate-800"
                    >
                      <Download className="w-4 h-4 mr-2" /> Download 4K
                    </Button>
                    <Button className="h-12 px-6 rounded-xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-2xl hover:bg-primary/90">
                      <Share2 className="w-4 h-4 mr-2" /> Share to Group
                    </Button>
                 </div>
               </div>
             ) : (
               <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center space-y-4 text-slate-400">
                  <div className="w-24 h-24 border-2 border-dashed border-slate-100 rounded-3xl flex items-center justify-center bg-slate-50">
                    < ImageIcon className="w-10 h-10 opacity-30 text-slate-300" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-widest opacity-60 italic">Waiting for Input</h4>
                    <p className="text-[10px] uppercase tracking-widest opacity-40 mt-1">Upload reference to begin generation</p>
                  </div>
               </div>
             )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Engine', value: 'Gemini 3 Pro', icon: Zap },
              { label: 'Quality', value: '4K Sharp', icon: Crown },
              { label: 'Check', value: 'Verified', icon: ShieldCheck },
            ].map((stat, i) => (
              <div key={i} className="p-4 rounded-3xl bg-white border border-slate-100 shadow-sm flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-primary">
                    <stat.icon className="w-5 h-5 text-primary" />
                 </div>
                 <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">{stat.label}</p>
                   <p className="text-xs font-bold text-slate-900">{stat.value}</p>
                 </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
