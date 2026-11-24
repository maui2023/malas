import React, { useState, useEffect } from 'react';
import {
  Shield,
  Bot,
  Key,
  FileJson,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  LogOut,
  Sliders,
  ChevronRight,
  RefreshCw,
  Loader2,
  ChevronDown,
  Download,
  Smartphone
} from 'lucide-react';
import {
  STORAGE_KEYS,
  getSetting,
  setSetting,
  getTokenRemainingSeconds,
  subscribeSettings
} from '../services/localDb';
import {
  getAuthStatus,
  subscribeAuthStatus,
  AUTH_STATUS
} from '../services/googleAuth';
import {
  DEFAULT_MODELS,
  validateApiKeyAndPull
} from '../services/aiModels';

export default function MobileSettingsView({
  onOpenConnector,
  onOpenSettings,
  onOpenExportImport,
  onOpenInstall,
  isInstalled = false,
  isInstallable = false,
}) {
  const [authStatus, setAuthStatus] = useState(AUTH_STATUS.DISCONNECTED);
  const [tokenRemaining, setTokenRemaining] = useState(0);
  const [userProfile, setUserProfile] = useState(null);

  // AI Provider states
  const [aiProvider, setAiProvider] = useState('gemini');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [aiModel, setAiModel] = useState('');
  const [aiKeyStatus, setAiKeyStatus] = useState('disconnected');
  const [availableModels, setAvailableModels] = useState([]);
  const [isRefreshingModels, setIsRefreshingModels] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState(null);
  const [gmailApiStatus, setGmailApiStatus] = useState('unknown');
  const [projectNumber, setProjectNumber] = useState('');

  const updateAi = () => {
    const provider = getSetting(STORAGE_KEYS.AI_PROVIDER, 'gemini');
    const key = getSetting(STORAGE_KEYS.AI_API_KEY, '');
    const model = getSetting(STORAGE_KEYS.AI_MODEL, provider === 'gemini' ? 'gemini-2.5-flash' : 'gpt-4o-mini');
    const status = getSetting(STORAGE_KEYS.AI_KEY_STATUS, key ? 'connected' : 'disconnected');
    const cachedModels = getSetting(STORAGE_KEYS.AI_MODELS_CACHE, null);
    const gStatus = getSetting(STORAGE_KEYS.GMAIL_API_STATUS, 'unknown');
    const clientId = getSetting(STORAGE_KEYS.OAUTH_CLIENT_ID, '');
    const proj = clientId.match(/^(\d+)/)?.[1] || getSetting(STORAGE_KEYS.GMAIL_API_PROJECT_ID, '');

    setAiProvider(provider);
    setHasApiKey(Boolean(key));
    setAiModel(model);
    setAiKeyStatus(status);
    setGmailApiStatus(gStatus);
    setProjectNumber(proj);

    const defaultList = DEFAULT_MODELS[provider] || [];
    if (Array.isArray(cachedModels) && cachedModels.length > 0) {
      setAvailableModels(cachedModels);
    } else {
      setAvailableModels(defaultList);
    }
  };

  useEffect(() => {
    const unsubscribeAuth = subscribeAuthStatus((status, remaining) => {
      setAuthStatus(status);
      setTokenRemaining(remaining);
      setUserProfile(getSetting(STORAGE_KEYS.USER_PROFILE, null));
    });

    const unsubscribeSettings = subscribeSettings(() => {
      updateAi();
    });

    updateAi();

    // Re-check when user switches back to this view or tab
    const onVisibilityChange = () => {
      if (!document.hidden) updateAi();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      unsubscribeAuth();
      unsubscribeSettings();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  const handleQuickRefreshModels = async () => {
    const key = getSetting(STORAGE_KEYS.AI_API_KEY, '');
    const provider = getSetting(STORAGE_KEYS.AI_PROVIDER, 'gemini');
    const endpoint = getSetting(STORAGE_KEYS.AI_ENDPOINT, '');

    if (!key) {
      onOpenSettings();
      return;
    }

    setIsRefreshingModels(true);
    setRefreshMessage(null);

    const res = await validateApiKeyAndPull({ provider, apiKey: key, endpoint });
    setIsRefreshingModels(false);

    if (res.success && Array.isArray(res.models)) {
      setAvailableModels(res.models);
      setSetting(STORAGE_KEYS.AI_MODELS_CACHE, res.models);
      setSetting(STORAGE_KEYS.AI_KEY_STATUS, 'connected');
      setAiKeyStatus('connected');
      setRefreshMessage({ type: 'success', text: `${res.count} model berjaya dikemaskini!` });
      setTimeout(() => setRefreshMessage(null), 3000);
    } else {
      setSetting(STORAGE_KEYS.AI_KEY_STATUS, 'invalid');
      setAiKeyStatus('invalid');
      setRefreshMessage({ type: 'error', text: res.error || 'Gagal menyambung ke API.' });
      setTimeout(() => setRefreshMessage(null), 4000);
    }
  };

  const handleModelChange = (newModel) => {
    setAiModel(newModel);
    setSetting(STORAGE_KEYS.AI_MODEL, newModel);
  };

  const formatRemaining = (seconds) => {
    if (!seconds) return 'Expired';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const isConnected = authStatus === AUTH_STATUS.CONNECTED;
  const isExpired = authStatus === AUTH_STATUS.EXPIRED;
  const isAiConnected = hasApiKey && aiKeyStatus === 'connected';
  const isAiInvalid = hasApiKey && aiKeyStatus === 'invalid';

  const providerLabel =
    aiProvider === 'gemini'
      ? 'Google Gemini'
      : aiProvider === 'openai'
      ? 'OpenAI'
      : 'OpenRouter';

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

        {isConnected && gmailApiStatus === 'api_disabled' && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Gmail API Belum Didayakan</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Google Cloud memerlukan Gmail API didayakan secara manual untuk projek {projectNumber || ''}.
            </p>
            <a
              href={`https://console.developers.google.com/apis/api/gmail.googleapis.com/overview?project=${projectNumber || '1077153893867'}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs rounded-xl shadow transition"
            >
              <span>Dayakan Gmail API Sekarang</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
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
            isAiConnected
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : isAiInvalid
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              : hasApiKey
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              (isAiConnected || hasApiKey) && !isAiInvalid ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
            }`} />
            {isAiConnected
              ? 'Bersambung'
              : isAiInvalid
              ? 'Kunci Tidak Sah'
              : hasApiKey
              ? 'Bersambung'
              : 'Tiada Key'}
          </span>
        </div>

        {/* Provider and Model Details Box */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-200">{providerLabel}</div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                {availableModels.length > 0 ? `${availableModels.length} model sedia ada` : 'BYOK Model'}
              </div>
            </div>
            
            {hasApiKey && (
              <button
                type="button"
                onClick={handleQuickRefreshModels}
                disabled={isRefreshingModels}
                title="Tarik Semula Model & Uji Sambungan"
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] flex items-center gap-1 transition active:scale-95 disabled:opacity-50"
              >
                {isRefreshingModels ? (
                  <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
                ) : (
                  <RefreshCw className="w-3 h-3 text-emerald-400" />
                )}
                <span>Tarik Model</span>
              </button>
            )}
          </div>

          {/* Quick Model Selector Dropdown if models are available */}
          {availableModels.length > 0 ? (
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider block">
                Model Aktif:
              </label>
              <div className="relative">
                <select
                  value={aiModel}
                  onChange={(e) => handleModelChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-lg text-xs font-mono text-emerald-300 outline-none transition appearance-none cursor-pointer pr-8"
                >
                  {availableModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.id} {m.recommended ? '★ (Disyorkan)' : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-slate-400 font-mono">
              Model: <span className="text-emerald-400">{aiModel || 'gemini-2.5-flash'}</span>
            </div>
          )}

          {/* Refresh notification */}
          {refreshMessage && (
            <div
              className={`p-2 rounded-lg text-[11px] flex items-center gap-1.5 ${
                refreshMessage.type === 'success'
                  ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/20'
                  : 'bg-rose-950/40 text-rose-300 border border-rose-500/20'
              }`}
            >
              {refreshMessage.type === 'success' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              )}
              <span>{refreshMessage.text}</span>
            </div>
          )}

          {isAiInvalid && !refreshMessage && (
            <div className="p-2 rounded-lg text-[11px] bg-rose-950/40 text-rose-300 border border-rose-500/20 flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
              <span>Kunci API tidak sah atau ralat sambungan. Sila kemaskini kunci anda.</span>
            </div>
          )}
        </div>

        <button
          onClick={onOpenSettings}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 text-xs font-semibold flex items-center justify-center gap-2 transition active:scale-98"
        >
          <Key className="w-4 h-4 text-emerald-400" />
          <span>Tetapan Kunci API & Model</span>
        </button>
      </div>

      {/* PWA App Installation Card */}
      {onOpenInstall && (
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Aplikasi Web (PWA)
              </span>
            </div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
              isInstalled
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-teal-500/10 border-teal-500/30 text-teal-300'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isInstalled ? 'bg-emerald-400' : 'bg-teal-400'}`} />
              {isInstalled ? 'Telah Dipasang' : 'Boleh Dipasang'}
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            {isInstalled
              ? 'Aplikasi sedang berjalan dalam mod aplikasi kendiri penuh (Standalone) tanpa bar pelayar.'
              : 'Pasang malas terus ke skrin utama telefon anda untuk capaian pantas dan storan luar talian.'}
          </p>

          <button
            onClick={onOpenInstall}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition active:scale-98 ${
              isInstalled
                ? 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
            }`}
          >
            {isInstalled ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Maklumat & Status Aplikasi</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Pasang Aplikasi (Install App)</span>
              </>
            )}
          </button>
        </div>
      )}

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
