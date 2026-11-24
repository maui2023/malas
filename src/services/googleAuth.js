import {
  STORAGE_KEYS,
  getSetting,
  setSetting,
  getAccessToken,
  setAccessToken,
  clearAccessToken,
  getTokenRemainingSeconds,
  DEFAULT_SCOPES
} from './localDb';

let tokenClient = null;
let statusListeners = [];

export const AUTH_STATUS = {
  DISCONNECTED: 'Disconnected',
  CONNECTED: 'Connected',
  EXPIRED: 'Token Expired - Reconnect',
  INITIALIZING: 'Initializing',
};

// Check if GIS script loaded
export function isGisReady() {
  return typeof window !== 'undefined' && Boolean(window.google?.accounts?.oauth2);
}

// Subscribe to status and countdown changes
export function subscribeAuthStatus(callback) {
  statusListeners.push(callback);
  // Initial broadcast
  callback(getAuthStatus(), getTokenRemainingSeconds());
  return () => {
    statusListeners = statusListeners.filter(cb => cb !== callback);
  };
}

function notifyListeners() {
  const status = getAuthStatus();
  const remaining = getTokenRemainingSeconds();
  statusListeners.forEach(cb => cb(status, remaining));
}

// Determine current connection state
export function getAuthStatus() {
  const token = getAccessToken();
  if (token) return AUTH_STATUS.CONNECTED;

  // Check if we previously had credentials or profile
  const clientId = getSetting(STORAGE_KEYS.OAUTH_CLIENT_ID, '');
  const profile = getSetting(STORAGE_KEYS.USER_PROFILE, null);

  if (clientId && profile) {
    return AUTH_STATUS.EXPIRED;
  }
  return AUTH_STATUS.DISCONNECTED;
}

// Initialize GIS Token Client
export function initTokenClient({ clientId, scopes, onTokenReceived, onError } = {}) {
  if (!isGisReady()) {
    throw new Error('Google Identity Services (GIS) script is not loaded yet. Please wait a moment.');
  }

  const effectiveClientId = clientId || getSetting(STORAGE_KEYS.OAUTH_CLIENT_ID, '');
  if (!effectiveClientId) {
    throw new Error('OAuth Client ID is required. Please configure it in settings.');
  }

  const rawScopes = scopes || getSetting(STORAGE_KEYS.OAUTH_SCOPES, DEFAULT_SCOPES);
  const scopeString = Array.isArray(rawScopes) ? rawScopes.join(' ') : String(rawScopes);

  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: effectiveClientId.trim(),
    scope: scopeString,
    callback: async (response) => {
      if (response.error) {
        console.error('GIS OAuth Error:', response);
        if (onError) onError(response);
        notifyListeners();
        return;
      }

      if (response.access_token) {
        setAccessToken(response.access_token, response.expires_in || 3599);

        // Fetch user profile info
        try {
          const profile = await fetchUserProfile(response.access_token);
          setSetting(STORAGE_KEYS.USER_PROFILE, profile);
        } catch (e) {
          console.warn('Could not fetch user profile:', e);
        }

        notifyListeners();
        if (onTokenReceived) onTokenReceived(response.access_token);
      }
    },
    error_callback: (err) => {
      console.error('GIS Error Callback:', err);
      if (onError) onError(err);
      notifyListeners();
    }
  });

  return tokenClient;
}

// Request Access Token directly (triggers Google popup)
export async function requestToken({ prompt = '' } = {}) {
  return new Promise((resolve, reject) => {
    try {
      const client = initTokenClient({
        onTokenReceived: (token) => resolve(token),
        onError: (err) => reject(new Error(err.message || 'Authorization cancelled or failed.'))
      });

      client.requestAccessToken({ prompt });
    } catch (err) {
      reject(err);
    }
  });
}

// Fetch user profile from Google UserInfo endpoint
export async function fetchUserProfile(token) {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch user profile: ${res.status} ${res.statusText}`);
  }

  return await res.json();
}

// Revoke token & disconnect
export async function disconnectWorkspace() {
  const token = getAccessToken();
  if (token && window.google?.accounts?.oauth2?.revoke) {
    try {
      window.google.accounts.oauth2.revoke(token, () => {
        console.log('Google OAuth token revoked.');
      });
    } catch (e) {
      console.warn('Revoke token failed:', e);
    }
  }

  clearAccessToken();
  localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
  notifyListeners();
}

// Auto-check countdown timer every second
if (typeof window !== 'undefined') {
  setInterval(() => {
    if (statusListeners.length > 0) {
      notifyListeners();
    }
  }, 1000);
}
