import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Shield,
  Key,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  LogOut
} from 'lucide-react';
import {
  STORAGE_KEYS,
  getSetting,
  setSetting,
  DEFAULT_SCOPES,
  AVAILABLE_SCOPES,
  getTokenRemainingSeconds
} from '../services/localDb';
import {
  getAuthStatus,
  requestToken,
  disconnectWorkspace,
  AUTH_STATUS
} from '../services/googleAuth';
import { checkGmailApiHealth } from '../services/gmailApi';

export default function ConnectorModal({ isOpen, onClose, onAuthChange }) {
  if (!isOpen) return null;

  const [origin, setOrigin] = useState('');
  const [copiedOrigin, setCopiedOrigin] = useState(false);
  const [clientId, setClientId] = useState('');
  const [selectedScopes, setSelectedScopes] = useState([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [authStatus, setAuthStatus] = useState(AUTH_STATUS.DISCONNECTED);
  const [remainingTime, setRemainingTime] = useState(0);
  const [userProfile, setUserProfile] = useState(null);
  const [gmailHealth, setGmailHealth] = useState(null);
  const [isCheckingGmail, setIsCheckingGmail] = useState(false);

  const performGmailHealthCheck = async () => {
    setIsCheckingGmail(true);
    try {
      const res = await checkGmailApiHealth();
      setGmailHealth(res);
    } catch {
      // ignore
    } finally {
      setIsCheckingGmail(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
    const savedClientId = getSetting(STORAGE_KEYS.OAUTH_CLIENT_ID, '');
    const savedScopes = getSetting(STORAGE_KEYS.OAUTH_SCOPES, DEFAULT_SCOPES);
    const profile = getSetting(STORAGE_KEYS.USER_PROFILE, null);

    setClientId(savedClientId);
    setSelectedScopes(savedScopes);
    setUserProfile(profile);
    const currentStatus = getAuthStatus();
    setAuthStatus(currentStatus);
    setRemainingTime(getTokenRemainingSeconds());

    if (currentStatus === AUTH_STATUS.CONNECTED) {
      performGmailHealthCheck();
    }
  }, [isOpen]);

  const copyOriginToClipboard = () => {
    navigator.clipboard.writeText(origin);
    setCopiedOrigin(true);
    setTimeout(() => setCopiedOrigin(false), 2000);
  };

  const toggleScope = (scopeId) => {
    if (selectedScopes.includes(scopeId)) {
      setSelectedScopes(selectedScopes.filter(s => s !== scopeId));
    } else {
      setSelectedScopes([...selectedScopes, scopeId]);
    }
  };

  const handleSaveAndConnect = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!clientId.trim()) {
      setErrorMessage('Please enter your Google OAuth 2.0 Web Client ID.');
      return;
    }

    // Save settings
    setSetting(STORAGE_KEYS.OAUTH_CLIENT_ID, clientId.trim());
    setSetting(STORAGE_KEYS.OAUTH_SCOPES, selectedScopes);

    setIsConnecting(true);

    try {
      await requestToken({ prompt: 'consent' });
      setAuthStatus(AUTH_STATUS.CONNECTED);
      const profile = getSetting(STORAGE_KEYS.USER_PROFILE, null);
      setUserProfile(profile);

      // Verify Gmail API status immediately
      const health = await checkGmailApiHealth();
      setGmailHealth(health);

      if (onAuthChange) onAuthChange();

      if (!health.ok && health.reason === 'api_disabled') {
        setSuccessMessage('Akaun Google bersambung! Sila klik butang di bawah untuk mendayakan Gmail API di Google Cloud Console.');
      } else {
        setSuccessMessage('Berjaya bersambung ke Google Workspace & Gmail API aktif!');
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err) {
      console.error('Connection error:', err);
      setErrorMessage(err.message || 'Authorization failed. Check your Client ID & Authorized Origins.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await disconnectWorkspace();
    setAuthStatus(AUTH_STATUS.DISCONNECTED);
    setUserProfile(null);
    setSuccessMessage('Disconnected from Google Workspace.');
    if (onAuthChange) onAuthChange();
  };

  const formatRemaining = (seconds) => {
    if (!seconds) return 'Expired';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-slate-100 p-6 md:p-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">Google Workspace Connector</h2>
              <p className="text-xs text-slate-400">100% Client-Side OAuth via Google Identity Services (GIS)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Banner */}
        <div className="mt-4 p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-950/60 border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`w-3.5 h-3.5 rounded-full ${
              authStatus === AUTH_STATUS.CONNECTED && gmailHealth?.reason !== 'api_disabled' ? 'bg-emerald-500 animate-pulse' :
              authStatus === AUTH_STATUS.CONNECTED && gmailHealth?.reason === 'api_disabled' ? 'bg-amber-400' :
              authStatus === AUTH_STATUS.EXPIRED ? 'bg-amber-500' : 'bg-slate-600'
            }`} />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm">
                  {authStatus === AUTH_STATUS.CONNECTED ? 'Google Account Connected' :
                   authStatus === AUTH_STATUS.EXPIRED ? 'Token Expired' : 'Not Connected'}
                </span>
                {authStatus === AUTH_STATUS.CONNECTED && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                    {formatRemaining(remainingTime)}
                  </span>
                )}
                {authStatus === AUTH_STATUS.CONNECTED && gmailHealth && (
                  gmailHealth.ok ? (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-medium">
                      <Check className="w-3 h-3" /> Gmail API Active
                    </span>
                  ) : gmailHealth.reason === 'api_disabled' ? (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-medium">
                      <AlertTriangle className="w-3 h-3 text-amber-400" /> Gmail API Perlu Didayakan
                    </span>
                  ) : null
                )}
              </div>
              {userProfile && (
                <p className="text-xs text-slate-400 mt-0.5">
                  Logged in as <span className="text-slate-200 font-medium">{userProfile.email}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {authStatus === AUTH_STATUS.CONNECTED && (
              <button
                onClick={performGmailHealthCheck}
                disabled={isCheckingGmail}
                title="Semak status Gmail API"
                className="px-2.5 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-1 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCheckingGmail ? 'animate-spin text-emerald-400' : ''}`} />
                <span className="hidden sm:inline">Semak Status</span>
              </button>
            )}

            {authStatus === AUTH_STATUS.CONNECTED ? (
              <button
                onClick={handleDisconnect}
                className="px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-1.5 transition"
              >
                <LogOut className="w-3.5 h-3.5" /> Disconnect
              </button>
            ) : (
              authStatus === AUTH_STATUS.EXPIRED && (
                <button
                  onClick={handleSaveAndConnect}
                  disabled={isConnecting}
                  className="px-3 py-1.5 text-xs text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg flex items-center gap-1.5 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isConnecting ? 'animate-spin' : ''}`} /> Reconnect
                </button>
              )
            )}
          </div>
        </div>

        {/* Step 1: Origin Helper */}
        <div className="mt-6 space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>1. Authorized JavaScript Origin</span>
            <span className="text-emerald-400 normal-case font-normal text-xs">Required in Google Cloud Console</span>
          </label>
          <div className="flex items-center gap-2 p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
            <code className="text-xs font-mono text-emerald-400 flex-1 truncate px-1">
              {origin || 'https://maui2023.github.io'}
            </code>
            <button
              onClick={copyOriginToClipboard}
              className="px-3 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1.5 transition border border-slate-700"
            >
              {copiedOrigin ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy Origin
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Paste this URL into Google Cloud Console &rarr; <em>APIs & Services &rarr; Credentials &rarr; OAuth 2.0 Web Client &rarr; Authorized JavaScript origins</em>.
          </p>
        </div>

        {/* Step 2: Client ID */}
        <div className="mt-6 space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>2. OAuth 2.0 Client ID</span>
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 hover:underline flex items-center gap-1 text-xs font-normal"
            >
              Get Client ID <ExternalLink className="w-3 h-3" />
            </a>
          </label>
          <div className="relative">
            <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="xxxxxxxxxxxx-xxxxxxxxxxxxxxxx.apps.googleusercontent.com"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-xs font-mono text-slate-100 placeholder-slate-600 outline-none transition"
            />
          </div>
          <p className="text-xs text-slate-400">
            Stored locally in your browser’s <code>localStorage</code>. Never sent to any external server.
          </p>

          {/* Project-specific Gmail API Activation Banner */}
          {clientId.trim().match(/^(\d+)/)?.[1] && (
            <div className="mt-3 p-3.5 rounded-xl bg-gradient-to-r from-amber-950/40 to-slate-900 border border-amber-500/30 text-xs space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Langkah Wajib: Dayakan Gmail API (Projek {clientId.trim().match(/^(\d+)/)[1]})</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Selain OAuth, Google Cloud memerlukan anda menekan butang <b>Enable</b> untuk Gmail API bagi membolehkan AI membaca atau mengurus emel.
                  </p>
                </div>
                <a
                  href={`https://console.developers.google.com/apis/api/gmail.googleapis.com/overview?project=${clientId.trim().match(/^(\d+)/)[1]}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 shrink-0 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition active:scale-95"
                >
                  <span>Dayakan Gmail API</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Step 3: Granular Scope Checkboxes */}
        <div className="mt-6 space-y-3">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
            3. Permissions ("What your AI can do")
          </label>
          <div className="space-y-2">
            {AVAILABLE_SCOPES.map((scope) => {
              const isChecked = selectedScopes.includes(scope.id);
              return (
                <div
                  key={scope.id}
                  onClick={() => toggleScope(scope.id)}
                  className={`p-3 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                    isChecked
                      ? 'bg-emerald-950/20 border-emerald-500/40'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}} // handled by parent onClick
                    className="mt-0.5 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-900"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-200">{scope.label}</span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                        {scope.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{scope.desc}</p>
                    <code className="text-[10px] text-slate-500 font-mono block mt-1 truncate">
                      {scope.id}
                    </code>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveAndConnect}
            disabled={isConnecting}
            className="px-5 py-2.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center gap-2"
          >
            {isConnecting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Authorizing with Google...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" /> Save & Connect with Google
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
