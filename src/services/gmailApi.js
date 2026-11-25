import { getAccessToken, STORAGE_KEYS, getSetting, setSetting } from './localDb';
import { db } from './localDb';

const GMAIL_BASE_URL = 'https://gmail.googleapis.com/gmail/v1/users/me';

// Base64url Encoder / Decoder with robust UTF-8 support
export function base64UrlEncode(str) {
  // Convert utf-8 string to base64
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function base64UrlDecode(base64UrlStr) {
  if (!base64UrlStr) return '';
  let base64 = base64UrlStr.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  } catch (err) {
    console.warn('base64UrlDecode fallback failed:', err);
    return atob(base64);
  }
}

// Helper to make authenticated Gmail requests
async function gmailFetch(endpoint, options = {}) {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Google Workspace not connected or token expired. Please connect in settings.');
  }

  const url = endpoint.startsWith('http') ? endpoint : `${GMAIL_BASE_URL}${endpoint}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    throw new Error('OAuth token expired. Please click Reconnect to refresh your Google session.');
  }

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.error?.message || JSON.stringify(errorJson);
    } catch {
      errorDetail = response.statusText;
    }

    // Detect Google Cloud API disabled / not enabled error
    if (
      response.status === 403 &&
      (errorDetail.includes('has not been used in project') ||
       errorDetail.includes('is disabled') ||
       errorDetail.includes('it is disabled') ||
       errorDetail.includes('not enabled'))
    ) {
      const match = errorDetail.match(/project[ =:]+(\d+)/i) || errorDetail.match(/project (\d+)/i);
      const projId = match ? match[1] : '';
      const activationUrl = projId
        ? `https://console.developers.google.com/apis/api/gmail.googleapis.com/overview?project=${projId}`
        : 'https://console.developers.google.com/apis/api/gmail.googleapis.com/overview';

      setSetting(STORAGE_KEYS.GMAIL_API_STATUS, 'api_disabled');
      if (projId) setSetting(STORAGE_KEYS.GMAIL_API_PROJECT_ID, projId);

      throw new Error(
        `Gmail API belum didayakan untuk Google Cloud Project ${projId ? `(${projId})` : ''}. Sila layari ${activationUrl} dan klik 'ENABLE' (Dayakan) untuk mengaktifkannya.`
      );
    }

    throw new Error(`Gmail API Error (${response.status}): ${errorDetail}`);
  }

  if (response.status === 204) return null;
  return await response.json();
}

// Extract header value by name
function getHeader(headers = [], name) {
  const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
  return header ? header.value : '';
}

// Extract message body from nested MIME parts
function extractBodyParts(payload) {
  let text = '';
  let html = '';

  if (!payload) return { text, html };

  if (payload.body && payload.body.data) {
    const decoded = base64UrlDecode(payload.body.data);
    if (payload.mimeType === 'text/html') {
      html = decoded;
    } else {
      text = decoded;
    }
  }

  if (payload.parts && Array.isArray(payload.parts)) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        text += base64UrlDecode(part.body.data) + '\n';
      } else if (part.mimeType === 'text/html' && part.body?.data) {
        html += base64UrlDecode(part.body.data);
      } else if (part.parts) {
        const subParts = extractBodyParts(part);
        text += subParts.text;
        html += subParts.html;
      }
    }
  }

  // Strip excessive HTML tags for clean plain text fallback if text is empty
  if (!text && html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    text = tmp.textContent || tmp.innerText || '';
  }

  return { text: text.trim(), html: html.trim() };
}

// Build RFC 2822 email payload
function buildMimeMessage({ to, subject, body, inReplyTo, references }) {
  const headers = [
    `To: ${to}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit'
  ];

  if (inReplyTo) headers.push(`In-Reply-To: ${inReplyTo}`);
  if (references) headers.push(`References: ${references}`);

  return `${headers.join('\r\n')}\r\n\r\n${body}`;
}

// ==========================================
// CORE EXPORTED GMAIL AGENT FUNCTIONS
// ==========================================

/**
 * 1. list_emails(query, maxResults, includeSpamTrash)
 * Search and fetch emails matching Gmail query syntax (e.g. 'is:unread', 'newer_than:2d', 'in:spam')
 */
export async function list_emails(query = 'is:unread', maxResults = 10, includeSpamTrash = false) {
  const q = encodeURIComponent(query);
  const needsSpamTrash =
    includeSpamTrash || /\b(in|is|label):(spam|trash)\b/i.test(query);
  const spamTrashParam = needsSpamTrash ? '&includeSpamTrash=true' : '';
  const data = await gmailFetch(
    `/messages?q=${q}&maxResults=${Math.min(maxResults, 25)}${spamTrashParam}`
  );
  
  if (!data.messages || data.messages.length === 0) {
    return {
      query,
      count: 0,
      emails: []
    };
  }

  // Fetch metadata for each message in parallel
  const detailPromises = data.messages.map(async (msg) => {
    try {
      const meta = await gmailFetch(
        `/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date&metadataHeaders=To`
      );
      const subject = getHeader(meta.payload?.headers, 'Subject') || '(No Subject)';
      const from = getHeader(meta.payload?.headers, 'From') || '';
      const date = getHeader(meta.payload?.headers, 'Date') || '';
      const to = getHeader(meta.payload?.headers, 'To') || '';

      const item = {
        id: meta.id,
        threadId: meta.threadId,
        snippet: meta.snippet || '',
        subject,
        from,
        to,
        date,
        labels: meta.labelIds || []
      };

      // Cache to IndexedDB
      try {
        await db.email_cache.put({ ...item, fetchedAt: Date.now() });
      } catch (cacheErr) {
        console.warn('Cache email error:', cacheErr);
      }

      return item;
    } catch (err) {
      console.warn(`Failed to fetch metadata for msg ${msg.id}:`, err);
      return null;
    }
  });

  const emails = (await Promise.all(detailPromises)).filter(Boolean);

  return {
    query,
    count: emails.length,
    emails
  };
}

/**
 * 2. get_email_thread(threadId)
 * Fetches full thread messages with decoded plain-text/HTML bodies
 */
export async function get_email_thread(threadId) {
  const data = await gmailFetch(`/threads/${threadId}?format=full`);
  
  const parsedMessages = (data.messages || []).map(msg => {
    const headers = msg.payload?.headers || [];
    const subject = getHeader(headers, 'Subject') || '(No Subject)';
    const from = getHeader(headers, 'From') || '';
    const to = getHeader(headers, 'To') || '';
    const date = getHeader(headers, 'Date') || '';
    const messageIdHeader = getHeader(headers, 'Message-ID') || '';
    const { text, html } = extractBodyParts(msg.payload);

    return {
      id: msg.id,
      threadId: msg.threadId,
      messageIdHeader,
      subject,
      from,
      to,
      date,
      snippet: msg.snippet,
      bodyText: text,
      bodyHtml: html,
      labels: msg.labelIds || []
    };
  });

  return {
    threadId,
    messageCount: parsedMessages.length,
    messages: parsedMessages
  };
}

/**
 * 3. summarize_inbox(filter, count)
 * Batch-fetches emails and prepares comprehensive structured executive summary data
 */
export async function summarize_inbox(filter = 'is:unread', count = 10) {
  const result = await list_emails(filter, count);
  return {
    filter,
    totalFound: result.count,
    emails: result.emails.map(e => ({
      id: e.id,
      threadId: e.threadId,
      from: e.from,
      subject: e.subject,
      snippet: e.snippet,
      date: e.date,
      labels: e.labels
    }))
  };
}

/**
 * 4. create_draft(to, subject, body, threadId)
 * Creates a real draft inside the user's Gmail account
 */
export async function create_draft(to, subject, body, threadId = null) {
  let inReplyTo = null;
  let references = null;

  if (threadId) {
    try {
      const thread = await get_email_thread(threadId);
      const lastMsg = thread.messages[thread.messages.length - 1];
      if (lastMsg && lastMsg.messageIdHeader) {
        inReplyTo = lastMsg.messageIdHeader;
        references = lastMsg.messageIdHeader;
      }
    } catch (e) {
      console.warn('Could not retrieve thread context for draft reply headers:', e);
    }
  }

  const rawMessage = buildMimeMessage({ to, subject, body, inReplyTo, references });
  const rawBase64Url = base64UrlEncode(rawMessage);

  const payload = {
    message: {
      raw: rawBase64Url,
      ...(threadId ? { threadId } : {})
    }
  };

  const response = await gmailFetch('/drafts', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  // Store in local drafts DB
  try {
    await db.drafts.add({
      to,
      subject,
      body,
      threadId,
      gmailDraftId: response.id,
      status: 'synced_to_gmail',
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn('Could not save draft locally:', err);
  }

  return {
    success: true,
    draftId: response.id,
    messageId: response.message?.id,
    threadId: response.message?.threadId,
    to,
    subject
  };
}

/**
 * 5. send_email(payload)
 * Sends drafted reply or new message directly.
 * NOTE: UI must enforce confirmation modal before calling this in interactive mode.
 */
export async function send_email({ to, subject, body, threadId = null, draftId = null }) {
  let response = null;

  if (draftId) {
    // Send existing draft
    response = await gmailFetch('/drafts/send', {
      method: 'POST',
      body: JSON.stringify({ id: draftId })
    });
  } else {
    // Send new raw message
    const rawMessage = buildMimeMessage({ to, subject, body });
    const rawBase64Url = base64UrlEncode(rawMessage);

    const payload = {
      raw: rawBase64Url,
      ...(threadId ? { threadId } : {})
    };

    response = await gmailFetch('/messages/send', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // Audit log
  try {
    await db.audit_logs.add({
      timestamp: new Date().toISOString(),
      action: 'send_email',
      details: { to, subject, threadId, draftId },
      status: 'sent'
    });
  } catch (err) {
    console.warn('Audit log error:', err);
  }

  return {
    success: true,
    id: response.id,
    threadId: response.threadId,
    labelIds: response.labelIds || []
  };
}

/**
 * 6. manage_labels(messageId, addLabels, removeLabels)
 * Archive (remove 'INBOX'), mark as read (remove 'UNREAD'), or add tags
 */
export async function manage_labels(messageId, addLabels = [], removeLabels = []) {
  const payload = {
    addLabelIds: addLabels,
    removeLabelIds: removeLabels
  };

  const response = await gmailFetch(`/messages/${messageId}/modify`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  return {
    success: true,
    messageId: response.id,
    labelIds: response.labelIds || []
  };
}

/**
 * Helper: Paginate through Gmail messages.list to collect all matching message IDs
 */
async function listAllMessageIds({
  query = '',
  labelIds = [],
  includeSpamTrash = false,
  maxTotal = 2000
} = {}) {
  const ids = [];
  let pageToken = null;
  const needsSpamTrash =
    includeSpamTrash ||
    labelIds.some(l => l === 'SPAM' || l === 'TRASH') ||
    /\b(in|is|label):(spam|trash)\b/i.test(query);

  do {
    const params = new URLSearchParams();
    params.set('maxResults', '500');
    if (query) params.set('q', query);
    if (needsSpamTrash) params.set('includeSpamTrash', 'true');
    if (pageToken) params.set('pageToken', pageToken);
    for (const labelId of labelIds) {
      params.append('labelIds', labelId);
    }

    const data = await gmailFetch(`/messages?${params.toString()}`);
    if (data.messages && data.messages.length > 0) {
      for (const m of data.messages) {
        ids.push(m.id);
        if (ids.length >= maxTotal) break;
      }
    }
    pageToken = ids.length < maxTotal ? data.nextPageToken : null;
  } while (pageToken);

  return ids;
}

function isInsufficientScopeError(err) {
  const msg = (err?.message || '').toLowerCase();
  return (
    msg.includes('insufficient') ||
    msg.includes('permission') ||
    msg.includes('403') ||
    msg.includes('scope')
  );
}

/**
 * 6b. trash_emails({ messageIds, query })
 * Moves matching or specified emails to Trash using batchModify (requires gmail.modify)
 */
export async function trash_emails({ messageIds = [], query = '' } = {}) {
  let targetIds = Array.isArray(messageIds) ? [...messageIds] : [];
  if (query && targetIds.length === 0) {
    targetIds = await listAllMessageIds({ query });
  }

  if (targetIds.length === 0) {
    return {
      success: true,
      count: 0,
      action: 'trash',
      message: 'No matching emails found to move to Trash.'
    };
  }

  try {
    for (let i = 0; i < targetIds.length; i += 1000) {
      const chunk = targetIds.slice(i, i + 1000);
      await gmailFetch('/messages/batchModify', {
        method: 'POST',
        body: JSON.stringify({
          ids: chunk,
          addLabelIds: ['TRASH'],
          removeLabelIds: ['INBOX', 'SPAM']
        })
      });
    }
  } catch (err) {
    if (isInsufficientScopeError(err)) {
      throw new Error(
        `Permission denied: Your Google connection needs the "gmail.modify" scope to move emails to Trash. Please open Connector Settings, check "Modify / Archive / Trash / Mark as read", and click Reconnect.`
      );
    }
    throw err;
  }

  try {
    await db.audit_logs.add({
      timestamp: new Date().toISOString(),
      action: 'trash_emails',
      details: { count: targetIds.length, query: query || null },
      status: 'completed'
    });
  } catch (e) {}

  return {
    success: true,
    count: targetIds.length,
    action: 'moved_to_trash',
    message: `Moved ${targetIds.length} email(s) to Trash.`
  };
}

/**
 * 6c. delete_emails({ messageIds, query, permanent })
 * Permanently deletes emails (requires https://mail.google.com/) or moves them to Trash as fallback
 */
export async function delete_emails({ messageIds = [], query = '', permanent = true } = {}) {
  let targetIds = Array.isArray(messageIds) ? [...messageIds] : [];
  if (query && targetIds.length === 0) {
    targetIds = await listAllMessageIds({ query });
  }

  if (targetIds.length === 0) {
    return {
      success: true,
      count: 0,
      action: permanent ? 'delete' : 'trash',
      message: 'No matching emails found to delete.'
    };
  }

  if (!permanent) {
    return await trash_emails({ messageIds: targetIds });
  }

  try {
    for (let i = 0; i < targetIds.length; i += 1000) {
      const chunk = targetIds.slice(i, i + 1000);
      await gmailFetch('/messages/batchDelete', {
        method: 'POST',
        body: JSON.stringify({ ids: chunk })
      });
    }

    try {
      await db.audit_logs.add({
        timestamp: new Date().toISOString(),
        action: 'delete_emails_permanent',
        details: { count: targetIds.length, query: query || null },
        status: 'completed'
      });
    } catch (e) {}

    return {
      success: true,
      count: targetIds.length,
      action: 'permanently_deleted',
      message: `Permanently deleted ${targetIds.length} email(s).`
    };
  } catch (err) {
    if (isInsufficientScopeError(err)) {
      // Fall back to moving to Trash via gmail.modify if full scope is not granted
      const trashRes = await trash_emails({ messageIds: targetIds });
      return {
        ...trashRes,
        fallbackFromPermanent: true,
        message: `Moved ${trashRes.count} email(s) out of folder into Trash (permanent delete requires the "Full Gmail Access: https://mail.google.com/" permission in Connector Settings).`
      };
    }
    throw err;
  }
}

/**
 * 6d. empty_spam({ permanent })
 * Empties all emails in the Gmail SPAM folder
 */
export async function empty_spam({ permanent = true } = {}) {
  const spamIds = await listAllMessageIds({
    labelIds: ['SPAM'],
    includeSpamTrash: true
  });

  if (spamIds.length === 0) {
    return {
      success: true,
      count: 0,
      action: 'empty_spam',
      message: 'SPAM folder is already empty (0 emails found).'
    };
  }

  return await delete_emails({
    messageIds: spamIds,
    permanent
  });
}

/**
 * 7. list_labels()
 * Lists user and system labels (INBOX, UNREAD, SENT, etc.)
 */
export async function list_labels() {
  const data = await gmailFetch('/labels');
  return data.labels || [];
}

/**
 * 8. checkGmailApiHealth()
 * Validates whether Gmail API is enabled and reachable with current token
 */
export async function checkGmailApiHealth() {
  const token = getAccessToken();
  if (!token) {
    return { ok: false, reason: 'unauthorized', message: 'Token tidak ditemui atau belum bersambung.' };
  }

  try {
    const profile = await gmailFetch('/profile');
    setSetting(STORAGE_KEYS.GMAIL_API_STATUS, 'ready');
    return { ok: true, profile };
  } catch (err) {
    const msg = err.message || '';
    if (
      msg.includes('belum didayakan') ||
      msg.includes('disabled') ||
      msg.includes('has not been used in project')
    ) {
      const match = msg.match(/project[ =:]+(\d+)/i) || msg.match(/\((\d+)\)/);
      const projId = match ? match[1] : getSetting(STORAGE_KEYS.GMAIL_API_PROJECT_ID, '');
      const enableUrl = projId
        ? `https://console.developers.google.com/apis/api/gmail.googleapis.com/overview?project=${projId}`
        : 'https://console.developers.google.com/apis/api/gmail.googleapis.com/overview';

      setSetting(STORAGE_KEYS.GMAIL_API_STATUS, 'api_disabled');
      if (projId) setSetting(STORAGE_KEYS.GMAIL_API_PROJECT_ID, projId);

      return {
        ok: false,
        reason: 'api_disabled',
        projectId: projId,
        enableUrl,
        message: err.message
      };
    }

    return { ok: false, reason: 'error', message: err.message };
  }
}
