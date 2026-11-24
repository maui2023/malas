import React, { useState, useEffect } from 'react';
import {
  Shield,
  Bot,
  Key,
  FileJson,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Sliders,
  ChevronRight
} from 'lucide-react';
import {
  STORAGE_KEYS,
  getSetting,
  getTokenRemainingSeconds
} from '../services/localDb';
import {
  getAuthStatus,
  subscribeAuthStatus,
  AUTH_STATUS
} from '../services/googleAuth';

export default function MobileSettingsView({
  onOpenConnector,
  onOpenSettings,
  onOpenExportImport,
}) {
  const [authStatus, setAuthStatus] = useState(AUTH_STATUS.DISCONNECTED);
  const [tokenRemaining, setTokenRemaining] = useState(0);
  const [userProfile, setUserProfile] = useState(null);
  const [aiProvider, setAiProvider] = useState('gemini');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [aiModel, setAiModel] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeAuthStatus((status, remaining) => {
      setAuthStatus(status);
      setTokenRemaining(remaining);
      setUserProfile(getSetting(STORAGE_KEYS.USER_PROFILE, null));
    });

    const updateAi = () => {
      setAiProvider(getSetting(STORAGE_KEYS.AI_PROVIDER, 'gemini'));
      setHasApiKey(Boolean(getSetting(STORAGE_KEYS.AI_API_KEY, '')));
      setAiModel(getSetting(STORAGE_KEYS.AI_MODEL, 'gemini-2.5-flash'));
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

  const isConnected = authStatus === AUTH_STATUS.CONNECTED;
  const isExpired = authStatus === AUTH_STATUS.EXPIRED;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-y-auto px-4 py-5 pb-24 text-slate-100">
      
      {/* Title */}
      <div className="flex items-center gap-2 mb-4 px-1">
        <Sliders className="w-5 h-5 text-emerald-400" />
        <h2 className="text-base font-bold text-white">Tetapan & Sambungan</h2>
      </div>

      {/* Google Workspace Account Card */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 mb-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-3 h-3 rounded-full ${
              isConnected ? 'bg-emerald-400 animate-pulse' :
              isExpired ? 'bg-amber-400' : 'bg-slate-600'
            }`} />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Google Workspace
            </span>
          </div>

          <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
            isConnected
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : isExpired
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}>
            {isConnected ? 'Connected' : isExpired ? 'Expired' : 'Disconnected'}
          </span>
        </div>

        {isConnected && (
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
            <div className="text-xs font-semibold text-slate-200 truncate">
              {userProfile?.email || 'Akaun Google Terhubung'}
            </div>
            <div className="text-[11px] text-emerald-400 font-mono">
              Token sah: {formatRemaining(tokenRemaining)}
            </div>
          </div>
        )}

        <button
          onClick={onOpenConnector}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 text-xs font-semibold flex items-center justify-center gap-2 transition active:scale-98"
        >
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>{isConnected ? 'Urus Sambungan Google' : 'Sambungkan Google Workspace'}</span>
        </button>
      </div>

      {/* AI Provider Card */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 mb-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Bot className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              AI Provider
            </span>
          </div>

          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${
            hasApiKey
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${hasApiKey ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            {hasApiKey ? 'API Key Siap' : 'Tiada Key'}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs">
          <div>
            <div className="font-semibold text-slate-200 capitalize">{aiProvider}</div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">{aiModel}</div>
          </div>
          <span className="text-[11px] text-slate-400">BYOK Model</span>
        </div>

        <button
          onClick={onOpenSettings}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 text-xs font-semibold flex items-center justify-center gap-2 transition active:scale-98"
        >
          <Key className="w-4 h-4 text-emerald-400" />
          <span>Tetapan Kunci API & Model</span>
        </button>
      </div>

      {/* More Options / Backup */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 mb-4 space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
          Penyelenggaraan
        </div>

        <button
          onClick={onOpenExportImport}
          className="w-full p-2.5 rounded-xl hover:bg-slate-800 text-slate-300 text-xs font-medium flex items-center justify-between transition"
        >
          <span className="flex items-center gap-2">
            <FileJson className="w-4 h-4 text-slate-400" />
            Eksport / Import Konfigurasi
          </span>
          <ChevronRight className="w-4 h-4 text-slate-600" />
        </button>
      </div>

      {/* App Info */}
      <div className="mt-auto pt-3 text-center text-xs text-slate-500">
        <p className="font-semibold text-slate-400">malas (OpenWork Lite)</p>
        <p className="text-[11px] mt-0.5">Versi 1.0.0 &bull; 100% Client-Side Agent</p>
      </div>

    </div>
  );
}
