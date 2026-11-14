const API_BASE = 'https://api.kanalisa.id';
const QUOTA_ALARM = 'reset-keyword-quota-wib';
const TOKEN_KEY = 'authToken';
const DEFAULT_SETTINGS = Object.freeze({
  videoPanelEnabled: true,
  searchCardEnabled: true,
  panelCollapsed: false,
  timezone: 'Asia/Jakarta',
  languageStyle: 'casual',
  keywordQuotaUsed: 0,
});

function nextMidnightWib() {
  const now = new Date();
  const wibNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
  const next = new Date(wibNow);
  next.setHours(24, 0, 0, 0);
  return now.getTime() + (next.getTime() - wibNow.getTime());
}

async function scheduleQuotaReset() {
  await chrome.alarms.clear(QUOTA_ALARM);
  await chrome.alarms.create(QUOTA_ALARM, { when: nextMidnightWib(), periodInMinutes: 24 * 60 });
}

async function apiRequest(path, { method = 'GET', body, auth = true, retry = true } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = auth ? (await chrome.storage.local.get(TOKEN_KEY))[TOKEN_KEY] : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(API_BASE + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  if (response.status === 401 && token && retry) {
    const refreshed = await fetch(`${API_BASE}/api/auth/refresh`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    if (refreshed.ok) {
      await chrome.storage.local.set({ [TOKEN_KEY]: (await refreshed.json()).token });
      return apiRequest(path, { method, body, auth, retry: false });
    }
    await chrome.storage.local.remove(TOKEN_KEY);
  }
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail.error || detail.message || response.statusText);
  }
  return response.json();
}

chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  await chrome.storage.sync.set(existing);
  await scheduleQuotaReset();
});

chrome.runtime.onStartup.addListener(scheduleQuotaReset);

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== QUOTA_ALARM) return;
  await chrome.storage.sync.set({ keywordQuotaUsed: 0, keywordQuotaResetAt: new Date().toISOString() });
  await scheduleQuotaReset();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'api') return undefined;
  apiRequest(message.path, message.options)
    .then((data) => sendResponse({ data }))
    .catch((error) => sendResponse({ error: error.message }));
  return true;
});
