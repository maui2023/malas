import React, { useState, useEffect } from 'react';
import {
  Shield,
  Bot,
  Settings,
  FileJson,
  Trash2,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import {
  STORAGE_KEYS,
  getSetting,
  getTokenRemainingSeconds,
} from '../services/localDb';
import {
  getAuthStatus,
  subscribeAuthStatus,
  AUTH_STATUS
} from '../services/googleAuth';

export default function Header({
  onOpenConnector,
  onOpenSettings,
  onOpenExportImport,
}) {
  const [authStatus, setAuthStatus] = useState(AUTH_STATUS.DISCONNECTED);
  const [tokenRemaining, setTokenRemaining] = useState(0);
  const [userProfile, setUserProfile] = useState(null);
  const [aiProvider, setAiProvider] = useState('gemini');
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeAuthStatus((status, remaining) => {
      setAuthStatus(status);
      setTokenRemaining(remaining);
      setUserProfile(getSetting(STORAGE_KEYS.USER_PROFILE, null));
    });

    const updateAi = () => {
      setAiProvider(getSetting(STORAGE_KEYS.AI_PROVIDER, 'gemini'));
      setHasApiKey(Boolean(getSetting(STORAGE_KEYS.AI_API_KEY, '')));
    };

    updateAi();
    return () => unsubscribe();
  }, []);

  const formatRemaining = (seconds) => {
    if (!seconds) return 'Expired';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  return (
    <header className="h-16 px-4 md:px-6 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-30 sticky top-0">
      
      {/* Brand Logo & Tagline */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-2xl select-none">
          🦥
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black tracking-tight text-white">malas</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold uppercase">
              OpenWork Lite
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            100% Client-Side AI Email Agent &bull; Zero Server Storage
          </p>
        </div>
      </div>

      {/* Status Badges & Controls */}
      <div className="flex items-center gap-2 md:gap-3">
        
        {/* Google Workspace Pill */}
        <button
          onClick={onOpenConnector}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition text-xs"
        >
          <div className={`w-2.5 h-2.5 rounded-full ${
            authStatus === AUTH_STATUS.CONNECTED ? 'bg-emerald-400 animate-pulse' :
            authStatus === AUTH_STATUS.EXPIRED ? 'bg-amber-400' : 'bg-slate-600'
          }`} />
          
          <div className="hidden sm:flex flex-col text-left">
            <span className="font-semibold text-slate-200">
              {authStatus === AUTH_STATUS.CONNECTED ? (userProfile?.email || 'Google Connected') :
               authStatus === AUTH_STATUS.EXPIRED ? 'Google (Expired)' : 'Connect Google'}
            </span>
            {authStatus === AUTH_STATUS.CONNECTED && (
              <span className="text-[10px] text-emerald-400 font-mono">
                {formatRemaining(tokenRemaining)} left
              </span>
            )}
          </div>
          <span className="sm:hidden font-medium text-slate-300">Google</span>
        </button>

        {/* AI Provider Status Pill */}
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition text-xs"
        >
          <Bot className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline font-semibold text-slate-200 capitalize">
            {aiProvider}
          </span>
          <div className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-emerald-400' : 'bg-rose-500'}`} />
        </button>

        {/* Export / Import Button */}
        <button
          onClick={onOpenExportImport}
          title="Export / Import Workspace Config"
          className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition border border-transparent hover:border-slate-700"
        >
          <FileJson className="w-4 h-4" />
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          title="Settings"
          className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition border border-transparent hover:border-slate-700"
        >
          <Settings className="w-4 h-4" />
        </button>

      </div>
    </header>
  );
}
