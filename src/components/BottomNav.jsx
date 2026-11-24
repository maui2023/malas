import React from 'react';
import { MessageSquare, Sparkles, Database, Settings } from 'lucide-react';

export default function BottomNav({ activeTab, onTabChange, isRunning = false }) {
  const navItems = [
    {
      id: 'chat',
      label: 'Chat',
      icon: MessageSquare,
      badge: isRunning,
    },
    {
      id: 'workflows',
      label: 'Workflows',
      icon: Sparkles,
    },
    {
      id: 'storage',
      label: 'Storage',
      icon: Database,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 pb-[env(safe-area-inset-bottom,0px)] shadow-2xl">
      <div className="grid grid-cols-4 h-16 max-w-md mx-auto items-center px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-150 active:scale-95 ${
                isActive
                  ? 'text-emerald-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {/* Active subtle pill background */}
              {isActive && (
                <span className="absolute inset-x-2 inset-y-1 bg-emerald-500/10 rounded-xl -z-10 border border-emerald-500/20 animate-fadeIn" />
              )}

              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-150 ${
                    isActive ? 'scale-110 text-emerald-400' : 'text-slate-400'
                  }`}
                />
                {item.badge && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                )}
              </div>

              <span
                className={`text-[10px] tracking-tight mt-1 truncate transition-colors ${
                  isActive ? 'text-emerald-300 font-semibold' : 'text-slate-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
