import React, { useState, useEffect } from 'react';
import {
  Shield,
  Bot,
  Settings,
  FileJson,
  Plus,
  RefreshCw,
  ExternalLink,
  Download,
  Smartphone
} from 'lucide-react';
import {
  STORAGE_KEYS,
  getSetting,
  getTokenRemainingSeconds,
  subscribeSettings,
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
  onOpenInstall,
  onNewChat,
  activeMobileTab = 'chat',
  isInstalled = false,
  isInstallable = false,
  isIphonePreview = false,
  onToggleIphonePreview,
  showSimulatedDynamicIsland = false,
  isSimulatedIphone = false,
}) {
  const [authStatus, setAuthStatus] = useState(AUTH_STATUS.DISCONNECTED);
  const [tokenRemaining, setTokenRemaining] = useState(0);
  const [userProfile, setUserProfile] = useState(null);
  const [aiProvider, setAiProvider] = useState('gemini');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [aiKeyStatus, setAiKeyStatus] = useState('disconnected');

  useEffect(() => {
    const unsubscribeAuth = subscribeAuthStatus((status, remaining) => {
      setAuthStatus(status);
      setTokenRemaining(remaining);
      setUserProfile(getSetting(STORAGE_KEYS.USER_PROFILE, null));
    });

    const updateAi = () => {
      const key = getSetting(STORAGE_KEYS.AI_API_KEY, '');
      setAiProvider(getSetting(STORAGE_KEYS.AI_PROVIDER, 'gemini'));
      setHasApiKey(Boolean(key));
      setAiKeyStatus(getSetting(STORAGE_KEYS.AI_KEY_STATUS, key ? 'connected' : 'disconnected'));
    };

    const unsubscribeSettings = subscribeSettings(() => {
      updateAi();
    });

    updateAi();
    return () => {
      unsubscribeAuth();
      unsubscribeSettings();
    };
  }, []);

  const formatRemaining = (seconds) => {
    if (!seconds) return 'Expired';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  return (
    <header className="sticky top-0 z-30 shrink-0 w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-800 transition-all">
      
      {/* 
        iOS Safe Area Inset Zone:
        Strictly reserves a clear 59px (or env(safe-area-inset-top)) status bar space at the very top
        for the iPhone Dynamic Island / notch, time, and battery icons.
        This ensures that no text or buttons in the app header are obscured by the front camera cutout.
      */}
      <div 
        className={`w-full shrink-0 select-none relative transition-[height] duration-150 ${
          isSimulatedIphone ? 'block' : 'block md:hidden'
        }`}
        style={{
          height: 'max(59px, env(safe-area-inset-top, 59px))'
        }}
        aria-hidden="true"
      >
        {/* Visual status bar for simulated preview mode */}
        {showSimulatedDynamicIsland && (
          <div className="absolute inset-0 flex items-center justify-between px-7 text-slate-200 pointer-events-none select-none z-10">
            {/* iOS System Time */}
            <span className="font-semibold text-xs tracking-tight text-white font-mono">9:41</span>

            {/* Dynamic Island Cutout (Pill for iPhone 14/15/16 Pro) */}
            <div className="w-[122px] h-[33px] bg-black rounded-full border border-slate-800 shadow-inner flex items-center justify-end px-3">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700/80" />
            </div>

            {/* iOS Status Icons */}
            <div className="flex items-center gap-1.5 text-slate-200">
              <span className="text-[10px] font-bold font-mono">5G</span>
              <div className="w-5 h-2.5 border border-slate-300 rounded-[3px] p-0.5 flex items-center">
                <div className="w-3 h-full bg-white rounded-[1px]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 
        App's Main Navigation Header:
        Positioned directly below the safe area zone so no text or buttons
        are obscured by the front camera cutout or Dynamic Island.
      */}
      <div className="h-14 md:h-16 px-3.5 md:px-6 flex items-center justify-between w-full">
        
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-2.5 md:gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-xl md:text-2xl select-none shrink-0">
            🦥
          </div>
          <div>
            <div className="flex items-center gap-1.5 md:gap-2">
              <h1 className="text-base md:text-lg font-black tracking-tight text-white">malas</h1>
              <span className="text-[9px] md:text-[10px] font-mono px-1.5 md:px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold uppercase">
                <span className="hidden sm:inline">OpenWork </span>Lite
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              100% Client-Side AI Email Agent &bull; Zero Server Storage
            </p>
          </div>
        </div>

        {/* Mobile Top Controls (Only on mobile < md, or when running in simulated iPhone) */}
        <div className={`${isSimulatedIphone ? 'flex' : 'flex md:hidden'} items-center gap-1.5`}>
          {/* PWA Install Button Mobile */}
          {onOpenInstall && (
            <button
              onClick={onOpenInstall}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-xl border transition text-[11px] font-semibold active:scale-95 ${
                isInstalled
                  ? 'bg-slate-950/80 border-slate-800 text-slate-400'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
              }`}
              title={isInstalled ? 'Aplikasi malas (Dipasang)' : 'Pasang malas sebagai App'}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isInstalled ? 'App' : 'Install'}</span>
            </button>
          )}

          {/* Google Status Badge Mobile */}
          <button
            onClick={onOpenConnector}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition text-xs active:scale-95"
            title="Google Workspace Status"
          >
            <div className={`w-2 h-2 rounded-full ${
              authStatus === AUTH_STATUS.CONNECTED ? 'bg-emerald-400 animate-pulse' :
              authStatus === AUTH_STATUS.EXPIRED ? 'bg-amber-400' : 'bg-slate-600'
            }`} />
            <span className="font-semibold text-slate-300 text-[11px]">Google</span>
          </button>

          {/* Quick New Chat Button on Mobile */}
          {onNewChat && (
            <button
              onClick={onNewChat}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition text-[11px] font-bold active:scale-95"
              title="Sesi Chat Baru"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          )}
        </div>

        {/* Desktop Status Badges & Controls (hidden on mobile and in simulated iPhone) */}
        <div className={`${isSimulatedIphone ? 'hidden' : 'hidden md:flex'} items-center gap-2 md:gap-3`}>
          {/* iPhone Mobile Preview Toggle */}
          {onToggleIphonePreview && (
            <button
              onClick={onToggleIphonePreview}
              title={isIphonePreview ? 'Tutup Pratonton iPhone' : 'Buka Pratonton Skrin iPhone (59px Top Inset)'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition text-xs font-semibold active:scale-95 border ${
                isIphonePreview
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                  : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{isIphonePreview ? 'Desktop View' : 'iPhone View'}</span>
            </button>
          )}

          {/* PWA Install App Button Desktop */}
          {onOpenInstall && (
            <button
              onClick={onOpenInstall}
              title={isInstalled ? 'Aplikasi malas (Dipasang)' : 'Pasang malas sebagai Aplikasi (PWA)'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition text-xs font-semibold active:scale-95 border ${
                isInstalled
                  ? 'bg-slate-950/80 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/25 shadow-sm shadow-emerald-500/10'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isInstalled ? 'App Mode' : 'Install App'}</span>
            </button>
          )}
          
          {/* Google Workspace Pill */}
          <button
            onClick={onOpenConnector}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition text-xs"
          >
            <div className={`w-2.5 h-2.5 rounded-full ${
              authStatus === AUTH_STATUS.CONNECTED ? 'bg-emerald-400 animate-pulse' :
              authStatus === AUTH_STATUS.EXPIRED ? 'bg-amber-400' : 'bg-slate-600'
            }`} />
            
            <div className="flex flex-col text-left">
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
          </button>

          {/* AI Provider Status Pill */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition text-xs"
          >
            <Bot className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-slate-200 capitalize">
              {aiProvider}
            </span>
            <div
              className={`w-2 h-2 rounded-full ${
                hasApiKey && aiKeyStatus !== 'invalid'
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-rose-500'
              }`}
            />
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
      </div>
    </header>
  );
}
