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
  ShieldAlert
} from 'lucide-react';
import {
  STORAGE_KEYS,
  getSetting,
  setSetting,
  DEFAULT_SYSTEM_PROMPT
} from '../services/localDb';

export default function SettingsModal({ isOpen, onClose }) {
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

  useEffect(() => {
    setProvider(getSetting(STORAGE_KEYS.AI_PROVIDER, 'gemini'));
    setApiKey(getSetting(STORAGE_KEYS.AI_API_KEY, ''));
    setModel(getSetting(STORAGE_KEYS.AI_MODEL, 'gemini-2.5-flash'));
    setEndpoint(getSetting(STORAGE_KEYS.AI_ENDPOINT, ''));
    setSystemPrompt(getSetting(STORAGE_KEYS.AI_SYSTEM_PROMPT, DEFAULT_SYSTEM_PROMPT));
    setWebhookUrl(getSetting(STORAGE_KEYS.WEBHOOK_URL, ''));
    setAutoSendHeadless(getSetting(STORAGE_KEYS.AUTO_SEND_HEADLESS, false));
  }, [isOpen]);

  const handleProviderChange = (newProvider) => {
    setProvider(newProvider);
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

  const handleSave = () => {
    setSetting(STORAGE_KEYS.AI_PROVIDER, provider);
    setSetting(STORAGE_KEYS.AI_API_KEY, apiKey.trim());
    setSetting(STORAGE_KEYS.AI_MODEL, model.trim());
    setSetting(STORAGE_KEYS.AI_ENDPOINT, endpoint.trim());
    setSetting(STORAGE_KEYS.AI_SYSTEM_PROMPT, systemPrompt.trim());
    setSetting(STORAGE_KEYS.WEBHOOK_URL, webhookUrl.trim());
    setSetting(STORAGE_KEYS.AUTO_SEND_HEADLESS, autoSendHeadless);

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
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
              <h2 className="text-xl font-bold tracking-tight text-white">AI Provider & Workspace Settings</h2>
              <p className="text-xs text-slate-400">BYOK (Bring Your Own Key) &bull; Zero Server Storage</p>
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
            AI Provider
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'gemini', label: 'Google Gemini', badge: 'Recommended' },
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

        {/* API Key */}
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>{provider.toUpperCase()} API Key</span>
            </label>
            {provider === 'gemini' && (
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:underline flex items-center gap-1 text-xs"
              >
                Get Free Gemini API Key <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {provider === 'openai' && (
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:underline flex items-center gap-1 text-xs"
              >
                Get OpenAI Key <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {provider === 'openrouter' && (
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:underline flex items-center gap-1 text-xs"
              >
                Get OpenRouter Key <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <div className="relative">
            <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={`Enter your ${provider === 'gemini' ? 'AI Studio' : provider} API key`}
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
          <p className="text-xs text-slate-400">
            Stored locally in browser <code>localStorage</code>. Direct client-side calls to official APIs.
          </p>
        </div>

        {/* Model Selection */}
        <div className="mt-6 space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span>Model Name</span>
          </label>
          {provider === 'gemini' ? (
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-xs font-mono text-slate-100 outline-none transition"
            >
              <option value="gemini-2.5-flash">gemini-2.5-flash (Fastest & Best Tool Calling)</option>
              <option value="gemini-1.5-flash">gemini-1.5-flash</option>
              <option value="gemini-1.5-pro">gemini-1.5-pro</option>
            </select>
          ) : (
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g. gpt-4o-mini, google/gemini-2.5-flash"
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-xs font-mono text-slate-100 outline-none transition"
            />
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
            <span>Headless Webhook Notification URL (Optional)</span>
          </label>
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://discord.com/api/webhooks/... or Telegram Bot webhook"
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-xs font-mono text-slate-100 outline-none transition"
          />
          <p className="text-xs text-slate-400">
            When running in headless mode (<code>?headless=true</code>), the task output summary will be POSTed to this URL.
          </p>
        </div>

        {/* Auto Send in Headless checkbox */}
        <div className="mt-4 p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-200">Allow Headless Auto-Send</span>
            <p className="text-[11px] text-slate-400">
              If enabled, automated CLI/cron scripts can send replies without human interactive confirmation.
            </p>
          </div>
          <input
            type="checkbox"
            checked={autoSendHeadless}
            onChange={(e) => setAutoSendHeadless(e.target.checked)}
            className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-900 w-4 h-4 cursor-pointer"
          />
        </div>

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
              Reset to default
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
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:scale-95 rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center gap-2"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-slate-950" /> Saved!
              </>
            ) : (
              <>
                <Check className="w-4 h-4" /> Save Configuration
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
