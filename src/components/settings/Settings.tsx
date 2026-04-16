import React, { useState } from 'react';
import { Database, Shield, Bell, Palette, Save, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';

export function Settings() {
  const [dbConfig, setDbConfig] = useState({
    url: import.meta.env.VITE_SUPABASE_URL || '',
    key: import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  });

  const handleSave = () => {
    toast.success('Settings saved to local session. Note: Permanent changes require updating .env file.');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="glass-card p-8 space-y-8">
        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
            <Database className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Database Configuration</h3>
            <p className="text-sm text-white/40">Connect your Supabase project to sync data</p>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="space-y-2">
            <Label className="text-white/60">Supabase Project URL</Label>
            <Input 
              value={dbConfig.url}
              onChange={(e) => setDbConfig({ ...dbConfig, url: e.target.value })}
              className="glass-input border-white/5"
              placeholder="https://your-project.supabase.co"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/60">Supabase Anon Key</Label>
            <Input 
              type="password"
              value={dbConfig.key}
              onChange={(e) => setDbConfig({ ...dbConfig, key: e.target.value })}
              className="glass-input border-white/5"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex gap-4">
          <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
          <p className="text-xs text-yellow-500/80 leading-relaxed">
            <strong>Security Note:</strong> These keys are used for client-side operations. Ensure your Supabase RLS (Row Level Security) policies are correctly configured to prevent unauthorized access.
          </p>
        </div>

        <Button onClick={handleSave} className="w-full py-6 rounded-2xl bg-white text-black hover:bg-white/90 font-bold">
          <Save className="w-5 h-5 mr-2" />
          Save Configuration
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 flex items-center justify-between group cursor-pointer hover:bg-white/5 transition-all">
          <div className="flex items-center gap-4">
            <Shield className="w-5 h-5 text-green-400" />
            <span className="font-bold">Security Policies</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:translate-x-1 transition-transform">
            <Save className="w-4 h-4 text-white/40" />
          </div>
        </div>
        <div className="glass-card p-6 flex items-center justify-between group cursor-pointer hover:bg-white/5 transition-all">
          <div className="flex items-center gap-4">
            <Bell className="w-5 h-5 text-purple-400" />
            <span className="font-bold">Notifications</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:translate-x-1 transition-transform">
            <Save className="w-4 h-4 text-white/40" />
          </div>
        </div>
      </div>
    </div>
  );
}
