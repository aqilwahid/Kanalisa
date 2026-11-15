// Service Worker Kanalisa (MV3)
importScripts('../utils/api.js');

const QUOTA_ALARM = 'reset-keyword-quota-wib';
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
  await chrome.alarms.create(QUOTA_ALARM, {
    when: nextMidnightWib(),
    periodInMinutes: 24 * 60,
  });
}

chrome.runtime.onInstalled.addListener(async (details) => {
  const existing = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  await chrome.storage.sync.set(existing);
  await scheduleQuotaReset();

  // Buka onboarding secara otomatis saat pertama kali diinstal
  if (details.reason === 'install') {
    chrome.runtime.openOptionsPage();
  }
});

chrome.runtime.onStartup.addListener(scheduleQuotaReset);

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== QUOTA_ALARM) return;
  await chrome.storage.sync.set({
    keywordQuotaUsed: 0,
    keywordQuotaResetAt: new Date().toISOString(),
  });
  await scheduleQuotaReset();
});

// Listener perpesanan dari content script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'api') return undefined;

  const K = globalThis.Kanalisa;
  if (!K || !K.apiRequest) {
    sendResponse({ error: 'Modul API Kanalisa belum siap di background' });
    return false;
  }

  K.apiRequest(message.path, message.options)
    .then((data) => sendResponse({ data }))
    .catch((error) => sendResponse({ error: error.message || 'Gagal memanggil API' }));

  return true; // Menandakan respon asynchronous
});
