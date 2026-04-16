import React from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  Users, 
  Trophy, 
  Scan, 
  Image as ImageIcon, 
  Settings,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role: 'admin' | 'guest';
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'teams', label: 'Teams', icon: Users },
  { id: 'fixtures', label: 'Fixtures', icon: Trophy },
  { id: 'scanner', label: 'Stats Scanner', icon: Scan },
  { id: 'graphics', label: 'Graphics', icon: ImageIcon },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ activeTab, setActiveTab, role }: SidebarProps) {
  const filteredMenuItems = menuItems.filter(item => {
    if (role === 'guest') {
      return ['dashboard', 'fixtures'].includes(item.id);
    }
    return true;
  });

  const handleSignOut = () => {
    window.location.reload();
  };
  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-72 h-full flex-col p-6 bg-pl-dark border-r border-white/5 shrink-0">
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="w-10 h-10 rounded-xl bg-pl-green flex items-center justify-center shadow-lg shadow-pl-green/20">
            <Trophy className="w-6 h-6 text-pl-dark" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white uppercase">KickOff Pro</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-pl-green font-black">Premier League</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 group",
                  isActive 
                    ? "bg-pl-purple text-white shadow-xl shadow-black/20" 
                    : "text-white/60 hover:text-white/80 hover:bg-white/5"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn(
                    "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
                    isActive ? "text-pl-green" : "text-white/40"
                  )} />
                  <span className="font-bold tracking-tight">{item.label}</span>
                </div>
                {isActive && (
                  <motion.div
                    layoutId="active-indicator-desktop"
                    className="w-1.5 h-1.5 rounded-full bg-pl-green shadow-[0_0_8px_rgba(0,255,133,0.8)]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5">
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-white/40 hover:text-pl-pink hover:bg-pl-pink/10 transition-all duration-300 group"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold">Sign Out</span>
          </button>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-6 pb-8 pt-2 pointer-events-none">
        <nav className="bg-white border border-black/5 rounded-[32px] flex items-center justify-around p-2 pointer-events-auto shadow-[0_20px_50px_rgba(0,0,0,0.15)] max-w-md mx-auto">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300",
                  isActive ? "text-pl-purple" : "text-pl-purple/60"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-indicator-mobile"
                    className="absolute inset-0 bg-pl-purple/5 rounded-2xl -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon className={cn(
                  "w-5 h-5 mb-1",
                  isActive ? "scale-110" : "scale-100"
                )} />
                <span className="text-[9px] font-black uppercase tracking-tighter">{item.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}
