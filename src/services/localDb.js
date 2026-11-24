import Dexie from 'dexie';

// 1. Initialize Local-First IndexedDB Database
export const db = new Dexie('MalasOpenWorkDB');

db.version(1).stores({
  messages: '++id, sessionId, role, timestamp',
  email_cache: 'id, threadId, subject, from, date, fetchedAt',
  drafts: '++id, to, subject, threadId, gmailDraftId, status, createdAt',
  audit_logs: '++id, timestamp, action, status'
});

// Storage Keys
export const STORAGE_KEYS = {
  OAUTH_CLIENT_ID: 'malas_oauth_client_id',
  OAUTH_SCOPES: 'malas_oauth_scopes',
  AI_PROVIDER: 'malas_ai_provider',
  AI_API_KEY: 'malas_ai_api_key',
  AI_MODEL: 'malas_ai_model',
  AI_ENDPOINT: 'malas_ai_endpoint',
  AI_SYSTEM_PROMPT: 'malas_ai_system_prompt',
  WEBHOOK_URL: 'malas_webhook_url',
  USER_PROFILE: 'malas_user_profile',
  AUTO_SEND_HEADLESS: 'malas_auto_send_headless',
  AI_MODELS_CACHE: 'malas_ai_models_cache',
  AI_KEY_STATUS: 'malas_ai_key_status', // 'connected' | 'invalid' | 'disconnected'
  AI_LAST_CHECKED: 'malas_ai_last_checked',
  GMAIL_API_STATUS: 'malas_gmail_api_status', // 'ready' | 'api_disabled' | 'unknown'
  GMAIL_API_PROJECT_ID: 'malas_gmail_api_project_id',
};

export const SESSION_KEYS = {
  ACCESS_TOKEN: 'malas_access_token',
  EXPIRES_AT: 'malas_token_expires_at',
};

// Default scopes for Google Workspace Connector
export const DEFAULT_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

export const AVAILABLE_SCOPES = [
  {
    id: 'https://www.googleapis.com/auth/gmail.readonly',
    category: 'Gmail',
    label: 'Read Gmail',
    desc: 'Fetch emails, unread counts, and message threads',
    default: true,
  },
  {
    id: 'https://www.googleapis.com/auth/gmail.compose',
    category: 'Gmail',
    label: 'Create & edit email drafts',
    desc: 'Draft replies directly into your Gmail account',
    default: true,
  },
  {
    id: 'https://www.googleapis.com/auth/gmail.send',
    category: 'Gmail',
    label: 'Send emails (with confirmation)',
    desc: 'Send drafted replies when explicitly approved',
    default: false,
  },
  {
    id: 'https://www.googleapis.com/auth/gmail.labels',
    category: 'Gmail',
    label: 'Create & manage Gmail labels',
    desc: 'Organize emails with custom tags and categories',
    default: false,
  },
  {
    id: 'https://www.googleapis.com/auth/gmail.modify',
    category: 'Gmail',
    label: 'Modify / Archive / Mark as read',
    desc: 'Archive newsletters, clean inbox, or mark read',
    default: false,
  },
  {
    id: 'https://www.googleapis.com/auth/calendar.readonly',
    category: 'Calendar',
    label: 'Read calendar events',
    desc: 'Inspect schedule to coordinate email responses',
    default: false,
  },
  {
    id: 'https://www.googleapis.com/auth/calendar.events',
    category: 'Calendar',
    label: 'Create & edit calendar events',
    desc: 'Add meetings or follow-up events from emails',
    default: false,
  },
];

// Default System Prompt
export const DEFAULT_SYSTEM_PROMPT = `You are "malas", an intelligent, high-efficiency AI Executive Assistant embedded directly inside the user's browser.
Your primary role is to help busy people manage, triage, summarize, draft, and organize their Gmail inbox with zero manual hassle.

Core Directives:
1. Be concise, structured, and action-oriented. Group emails by urgency (🔥 Urgent, 📌 Needs Reply, ℹ️ FYI / Low Priority).
2. When summarizing emails, extract sender, core topic, deadlines, and clear next steps or bullet points.
3. When drafting replies:
   - Match the professional tone of the sender or use polite, concise business communication.
   - Always prepare the draft using the 'create_draft' tool or present it clearly so the user can review before sending.
4. SAFETY FIRST: Never send emails directly without explicit user authorization. Propose drafts or request confirmation cards.
5. If the user asks to clean up or archive promotions, identify spam/newsletters safely.`;

// LocalStorage Helpers
export function getSetting(key, defaultValue = '') {
  try {
    const val = localStorage.getItem(key);
    if (val === null || val === undefined) return defaultValue;
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  } catch (err) {
    console.warn(`Error reading localStorage for ${key}:`, err);
    return defaultValue;
  }
}

let settingsListeners = [];

export function subscribeSettings(callback) {
  settingsListeners.push(callback);
  return () => {
    settingsListeners = settingsListeners.filter((cb) => cb !== callback);
  };
}

export function notifySettingsChanged(key, value) {
  settingsListeners.forEach((cb) => {
    try {
      cb(key, value);
    } catch (e) {
      console.warn('Error in settings listener:', e);
    }
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('malas_settings_changed', { detail: { key, value } })
    );
  }
}

// Cross-tab synchronization
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key && Object.values(STORAGE_KEYS).includes(e.key)) {
      let val = e.newValue;
      try {
        val = JSON.parse(e.newValue);
      } catch {}
      notifySettingsChanged(e.key, val);
    }
  });
}

export function setSetting(key, value) {
  try {
    if (typeof value === 'object') {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      localStorage.setItem(key, String(value));
    }
    notifySettingsChanged(key, value);
  } catch (err) {
    console.warn(`Error writing localStorage for ${key}:`, err);
  }
}

export function removeSetting(key) {
  try {
    localStorage.removeItem(key);
    notifySettingsChanged(key, null);
  } catch (err) {
    console.warn(`Error removing localStorage for ${key}:`, err);
  }
}

// SessionStorage Helpers (Tokens)
export function getAccessToken() {
  const token = sessionStorage.getItem(SESSION_KEYS.ACCESS_TOKEN);
  const expiresAt = Number(sessionStorage.getItem(SESSION_KEYS.EXPIRES_AT) || 0);

  if (!token || !expiresAt) return null;
  if (Date.now() >= expiresAt) {
    clearAccessToken();
    return null;
  }
  return token;
}

export function setAccessToken(token, expiresInSeconds = 3599) {
  const expiresAt = Date.now() + expiresInSeconds * 1000;
  sessionStorage.setItem(SESSION_KEYS.ACCESS_TOKEN, token);
  sessionStorage.setItem(SESSION_KEYS.EXPIRES_AT, String(expiresAt));
}

export function clearAccessToken() {
  sessionStorage.removeItem(SESSION_KEYS.ACCESS_TOKEN);
  sessionStorage.removeItem(SESSION_KEYS.EXPIRES_AT);
}

export function getTokenRemainingSeconds() {
  const expiresAt = Number(sessionStorage.getItem(SESSION_KEYS.EXPIRES_AT) || 0);
  if (!expiresAt) return 0;
  return Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
}

// Export / Import Workspace Config
export function exportWorkspaceConfig() {
  const config = {
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
    app: 'malas-openwork-lite',
    settings: {
      oauthClientId: getSetting(STORAGE_KEYS.OAUTH_CLIENT_ID, ''),
      oauthScopes: getSetting(STORAGE_KEYS.OAUTH_SCOPES, DEFAULT_SCOPES),
      aiProvider: getSetting(STORAGE_KEYS.AI_PROVIDER, 'gemini'),
      aiModel: getSetting(STORAGE_KEYS.AI_MODEL, 'gemini-2.5-flash'),
      aiEndpoint: getSetting(STORAGE_KEYS.AI_ENDPOINT, ''),
      aiSystemPrompt: getSetting(STORAGE_KEYS.AI_SYSTEM_PROMPT, DEFAULT_SYSTEM_PROMPT),
      webhookUrl: getSetting(STORAGE_KEYS.WEBHOOK_URL, ''),
      autoSendHeadless: getSetting(STORAGE_KEYS.AUTO_SEND_HEADLESS, false),
    },
  };
  return JSON.stringify(config, null, 2);
}

export function importWorkspaceConfig(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed.settings) throw new Error("Invalid config format: missing 'settings' object");

    const s = parsed.settings;
    if (s.oauthClientId !== undefined) setSetting(STORAGE_KEYS.OAUTH_CLIENT_ID, s.oauthClientId);
    if (s.oauthScopes !== undefined) setSetting(STORAGE_KEYS.OAUTH_SCOPES, s.oauthScopes);
    if (s.aiProvider !== undefined) setSetting(STORAGE_KEYS.AI_PROVIDER, s.aiProvider);
    if (s.aiModel !== undefined) setSetting(STORAGE_KEYS.AI_MODEL, s.aiModel);
    if (s.aiEndpoint !== undefined) setSetting(STORAGE_KEYS.AI_ENDPOINT, s.aiEndpoint);
    if (s.aiSystemPrompt !== undefined) setSetting(STORAGE_KEYS.AI_SYSTEM_PROMPT, s.aiSystemPrompt);
    if (s.webhookUrl !== undefined) setSetting(STORAGE_KEYS.WEBHOOK_URL, s.webhookUrl);
    if (s.autoSendHeadless !== undefined) setSetting(STORAGE_KEYS.AUTO_SEND_HEADLESS, s.autoSendHeadless);

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// PANIC BUTTON: Clear all local data completely
export async function clearAllLocalData() {
  try {
    // 1. Clear IndexedDB
    await db.messages.clear();
    await db.email_cache.clear();
    await db.drafts.clear();
    await db.audit_logs.clear();

    // 2. Clear Session tokens
    clearAccessToken();

    // 3. Clear LocalStorage related to malas
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));

    return { success: true };
  } catch (err) {
    console.error("Failed to clear local data:", err);
    return { success: false, error: err.message };
  }
}
