import React, { useState, useEffect } from 'react';
import {
  X,
  Bot,
  Key,
  Eye,
  EyeOff,
  Sparkles,
  Sliders,
  Webhook,
  Check,
  ExternalLink,
  ShieldAlert,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Layers,
  ChevronDown,
  Download,
  Smartphone
} from 'lucide-react';
import {
  STORAGE_KEYS,
  getSetting,
  setSetting,
  DEFAULT_SYSTEM_PROMPT
} from '../services/localDb';
import {
  DEFAULT_MODELS,
  fetchModelsFromProvider,
  validateApiKeyAndPull
} from '../services/aiModels';

export default function SettingsModal({
  isOpen,
  onClose,
  onOpenInstall,
  isInstalled = false,
  isInstallable = false
}) {
  if (!isOpen) return null;

  const [provider, setProvider] = useState('gemini');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [model, setModel] = useState('gemini-2.5-flash');
  const [endpoint, setEndpoint] = useState('');
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [autoSendHeadless, setAutoSendHeadless] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Model pulling & validation states
  const [availableModels, setAvailableModels] = useState([]);
  const [isPulling, setIsPulling] = useState(false);
  const [pullStatus, setPullStatus] = useState(null); // { type: 'success' | 'error', text: '' }
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [customModelText, setCustomModelText] = useState('');

  useEffect(() => {
    const curProvider = getSetting(STORAGE_KEYS.AI_PROVIDER, 'gemini');
    const curKey = getSetting(STORAGE_KEYS.AI_API_KEY, '');
    const curModel = getSetting(STORAGE_KEYS.AI_MODEL, curProvider === 'gemini' ? 'gemini-2.5-flash' : 'gpt-4o-mini');
    const curEndpoint = getSetting(STORAGE_KEYS.AI_ENDPOINT, '');
    const curPrompt = getSetting(STORAGE_KEYS.AI_SYSTEM_PROMPT, DEFAULT_SYSTEM_PROMPT);
    const curWebhook = getSetting(STORAGE_KEYS.WEBHOOK_URL, '');
    const curAutoSend = getSetting(STORAGE_KEYS.AUTO_SEND_HEADLESS, false);
    const cachedModels = getSetting(STORAGE_KEYS.AI_MODELS_CACHE, null);
    const keyStatus = getSetting(STORAGE_KEYS.AI_KEY_STATUS, '');

    setProvider(curProvider);
    setApiKey(curKey);
    setEndpoint(curEndpoint);
    setSystemPrompt(curPrompt);
    setWebhookUrl(curWebhook);
    setAutoSendHeadless(curAutoSend);

    // Initialize model list from cache or defaults
    const defaultList = DEFAULT_MODELS[curProvider] || [];
    let initialList = defaultList;
    if (Array.isArray(cachedModels) && cachedModels.length > 0) {
      initialList = cachedModels;
    }
    setAvailableModels(initialList);

    // Check if current model exists in initial list
    const found = initialList.some((m) => m.id === curModel);
    if (found || !curModel) {
      setModel(curModel || (initialList[0]?.id || 'gemini-2.5-flash'));
      setIsCustomModel(false);
    } else {
      setModel('__custom__');
      setIsCustomModel(true);
      setCustomModelText(curModel);
    }

    if (keyStatus === 'connected' && curKey) {
      setPullStatus({ type: 'success', text: `Kunci tersambung (${initialList.length} model sedia ada)` });
    } else if (keyStatus === 'invalid') {
      setPullStatus({ type: 'error', text: 'Kunci API sebelum ini gagal disahkan.' });
    } else {
      setPullStatus(null);
    }
  }, [isOpen]);

  const handleProviderChange = (newProvider) => {
    setProvider(newProvider);
    setPullStatus(null);
    setIsCustomModel(false);
    setCustomModelText('');

    const defaults = DEFAULT_MODELS[newProvider] || [];
    setAvailableModels(defaults);

    if (newProvider === 'gemini') {
      setModel('gemini-2.5-flash');
      setEndpoint('');
    } else if (newProvider === 'openai') {
      setModel('gpt-4o-mini');
      setEndpoint('https://api.openai.com/v1');
    } else if (newProvider === 'openrouter') {
      setModel('google/gemini-2.5-flash');
      setEndpoint('https://openrouter.ai/api/v1');
    }
  };

  // Pull real-time model list from provider using API key
  const handlePullModels = async (keyOverride = null) => {
    const keyToUse = (keyOverride !== null ? keyOverride : apiKey).trim();
    if (!keyToUse) {
      setPullStatus({
        type: 'error',
        text: 'Sila masukkan Kunci API terlebih dahulu sebelum menarik senarai model.'
      });
      return false;
    }

    setIsPulling(true);
    setPullStatus(null);

    const result = await validateApiKeyAndPull({
      provider,
      apiKey: keyToUse,
      endpoint
    });

    setIsPulling(false);

    if (result.success && Array.isArray(result.models) && result.models.length > 0) {
      setAvailableModels(result.models);
      setSetting(STORAGE_KEYS.AI_MODELS_CACHE, result.models);
      setSetting(STORAGE_KEYS.AI_KEY_STATUS, 'connected');

      // If current model is not in list, select recommended or first
      const stillValid = result.models.some((m) => m.id === model);
      if (!stillValid && !isCustomModel) {
        const recommended = result.models.find((m) => m.recommended) || result.models[0];
        if (recommended) setModel(recommended.id);
      }

      setPullStatus({
        type: 'success',
        text: `Berjaya bersambung! ${result.count} model ditarik terus daripada ${provider === 'gemini' ? 'Google Gemini' : provider}.`
      });
      return true;
    } else {
      setSetting(STORAGE_KEYS.AI_KEY_STATUS, 'invalid');
      setPullStatus({
        type: 'error',
        text: result.error || 'Gagal menarik senarai model. Sila semak Kunci API anda.'
      });
      return false;
    }
  };

  const handleModelSelectChange = (e) => {
    const val = e.target.value;
    if (val === '__custom__') {
      setIsCustomModel(true);
      setModel('__custom__');
    } else {
      setIsCustomModel(false);
      setModel(val);
    }
  };

  const handleSave = async () => {
    const trimmedKey = apiKey.trim();
    const effectiveModel = isCustomModel ? customModelText.trim() : model.trim();

    if (!effectiveModel) {
      setPullStatus({ type: 'error', text: 'Sila pilih atau masukkan nama model.' });
      return;
    }

    // If key is present and hasn't been verified yet (or user just typed it without pulling),
    // let's auto-verify and pull models immediately so user is 100% connected
    if (trimmedKey && pullStatus?.type !== 'success') {
      setIsPulling(true);
      const isOk = await handlePullModels(trimmedKey);
      if (!isOk) {
        // Validation failed, let user see error
        return;
      }
    }

    // Save configuration
    setSetting(STORAGE_KEYS.AI_PROVIDER, provider);
    setSetting(STORAGE_KEYS.AI_API_KEY, trimmedKey);
    setSetting(STORAGE_KEYS.AI_MODEL, effectiveModel);
    setSetting(STORAGE_KEYS.AI_ENDPOINT, endpoint.trim());
    setSetting(STORAGE_KEYS.AI_SYSTEM_PROMPT, systemPrompt.trim());
    setSetting(STORAGE_KEYS.WEBHOOK_URL, webhookUrl.trim());
    setSetting(STORAGE_KEYS.AUTO_SEND_HEADLESS, autoSendHeadless);

    if (trimmedKey) {
      setSetting(STORAGE_KEYS.AI_KEY_STATUS, 'connected');
    } else {
      setSetting(STORAGE_KEYS.AI_KEY_STATUS, 'disconnected');
    }

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-slate-100 p-6 md:p-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">Tetapan Kunci API & Model</h2>
              <p className="text-xs text-slate-400">BYOK (Bring Your Own Key) &bull; 100% Client-Side & Direct API</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Provider Tabs */}
        <div className="mt-6 space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
            Pilih AI Provider
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'gemini', label: 'Google Gemini', badge: 'Disyorkan' },
              { id: 'openai', label: 'OpenAI', badge: 'Direct API' },
              { id: 'openrouter', label: 'OpenRouter', badge: 'Multi-LLM' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleProviderChange(p.id)}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  provider === p.id
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300 ring-1 ring-emerald-500/30'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <span className="text-xs font-bold">{p.label}</span>
                <span className="text-[10px] mt-1 text-slate-400">{p.badge}</span>
              </button>
            ))}
          </div>
        </div>

        {/* API Key Section */}
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>Kunci API {provider.toUpperCase()}</span>
            </label>
            {provider === 'gemini' && (
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:underline flex items-center gap-1 text-xs"
              >
                Dapatkan Kunci Percuma di AI Studio <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {provider === 'openai' && (
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:underline flex items-center gap-1 text-xs"
              >
                Dapatkan OpenAI Key <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {provider === 'openrouter' && (
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:underline flex items-center gap-1 text-xs"
              >
                Dapatkan OpenRouter Key <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <div className="relative">
            <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setPullStatus(null);
              }}
              placeholder={`Masukkan Kunci API ${provider === 'gemini' ? 'Google AI Studio' : provider}`}
              className="w-full pl-10 pr-12 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-xs font-mono text-slate-100 placeholder-slate-600 outline-none transition"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
            >
              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Pull Models / Verify Key Action Bar */}
          <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] text-slate-400">
              Disimpan secara lokal dalam pelayar (browser) anda.
            </p>

            <button
              type="button"
              disabled={isPulling || !apiKey.trim()}
              onClick={() => handlePullModels()}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                !apiKey.trim()
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 active:scale-95'
              }`}
            >
              {isPulling ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menarik Senarai Model...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Tarik Senarai Model & Uji Sambungan</span>
                </>
              )}
            </button>
          </div>

          {/* Pull / Verification Status Banner */}
          {pullStatus && (
            <div
              className={`mt-2 p-3 rounded-xl border text-xs flex items-start gap-2.5 animate-fadeIn ${
                pullStatus.type === 'success'
                  ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
              }`}
            >
              {pullStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 leading-relaxed">{pullStatus.text}</div>
            </div>
          )}
        </div>

        {/* Model Selection */}
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-slate-400" />
              <span>Pilihan Model ({availableModels.length} Tersedia)</span>
            </label>
            <span className="text-[11px] text-slate-400">
              {provider === 'gemini' ? 'Gemini 2.5 Flash disyorkan' : ''}
            </span>
          </div>

          <div className="relative">
            <select
              value={isCustomModel ? '__custom__' : model}
              onChange={handleModelSelectChange}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-xs font-mono text-slate-100 outline-none transition appearance-none cursor-pointer pr-10"
            >
              {availableModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id} {m.desc ? `— ${m.desc}` : ''}
                </option>
              ))}
              <option value="__custom__">✍️ Masukkan model lain (Custom)...</option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>

          {/* Custom Model Input if selected */}
          {isCustomModel && (
            <div className="mt-2 space-y-1 animate-fadeIn">
              <label className="text-[11px] text-slate-400 block">Nama Model Tersuai:</label>
              <input
                type="text"
                value={customModelText}
                onChange={(e) => setCustomModelText(e.target.value)}
                placeholder="Contoh: gemini-2.5-flash atau gpt-4o"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-xs font-mono text-slate-100 outline-none transition"
              />
            </div>
          )}
        </div>

        {/* Custom Endpoint (if not gemini) */}
        {provider !== 'gemini' && (
          <div className="mt-4 space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Base API Endpoint
            </label>
            <input
              type="text"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="https://api.openai.com/v1"
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-xs font-mono text-slate-100 outline-none transition"
            />
          </div>
        )}

        {/* Headless Webhook URL */}
        <div className="mt-6 space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Webhook className="w-3.5 h-3.5 text-slate-400" />
            <span>Headless Webhook Notification URL (Pilihan)</span>
          </label>
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://discord.com/api/webhooks/... atau webhook Telegram"
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-xs font-mono text-slate-100 outline-none transition"
          />
          <p className="text-xs text-slate-400">
            Apabila berjalan dalam mod headless (<code>?headless=true</code>), ringkasan tugasan akan dihantar ke webhook ini.
          </p>
        </div>

        {/* Auto Send in Headless checkbox */}
        <div className="mt-4 p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-200">Benarkan Auto-Send dalam Headless</span>
            <p className="text-[11px] text-slate-400">
              Jika aktif, skrip CLI/cron automatik boleh menghantar balasan tanpa pengesahan butang manual.
            </p>
          </div>
          <input
            type="checkbox"
            checked={autoSendHeadless}
            onChange={(e) => setAutoSendHeadless(e.target.checked)}
            className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-900 w-4 h-4 cursor-pointer"
          />
        </div>

        {/* PWA Section */}
        {onOpenInstall && (
          <div className="mt-4 p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
            <div className="space-y-0.5 pr-2">
              <div className="flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-200">
                  Aplikasi Web (PWA)
                </span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${
                  isInstalled
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-teal-500/10 border-teal-500/30 text-teal-300'
                }`}>
                  {isInstalled ? 'Dipasang' : 'Tersedia'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {isInstalled
                  ? 'Aplikasi berjalan dalam mod standalone dengan aset disimpan setempat.'
                  : 'Pasang sebagai aplikasi kendiri pada Windows, Mac, Linux, Android atau iOS.'}
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenInstall}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 ${
                isInstalled
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-sm shadow-emerald-500/20'
              }`}
            >
              {isInstalled ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Info App</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Pasang App</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* System Prompt */}
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-slate-400" />
              <span>System Prompt</span>
            </label>
            <button
              type="button"
              onClick={() => setSystemPrompt(DEFAULT_SYSTEM_PROMPT)}
              className="text-[11px] text-emerald-400 hover:underline"
            >
              Kembalikan Asal
            </button>
          </div>
          <textarea
            rows={4}
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-xs font-mono text-slate-200 outline-none transition resize-y"
          />
        </div>

        {/* Actions */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={isPulling}
            className="px-5 py-2.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:scale-95 rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center gap-2 disabled:opacity-50"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-slate-950" /> Tersimpan!
              </>
            ) : isPulling ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> Mengesahkan...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" /> Simpan Konfigurasi
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
