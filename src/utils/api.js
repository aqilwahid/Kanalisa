// Klien API Kanalisa terpusat untuk background service worker, popup, options, dan content script
(function (root, factory) {
  const exports = factory();
  if (typeof module === 'object' && module.exports) module.exports = exports;
  else root.Kanalisa = Object.assign(root.Kanalisa || {}, exports);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const TOKEN_KEY = 'authToken';

  class ApiError extends Error {
    constructor(status, message) {
      super(message);
      this.status = status;
      this.name = 'ApiError';
    }
  }

  /**
   * Menentukan URL dasar backend:
   * 1. Jika ada override di storage local ('apiBaseUrl') -> gunakan nilai tersebut.
   * 2. Jika ekstensi dipasang via 'Load unpacked' (tidak ada 'update_url') -> http://localhost:3000
   * 3. Jika dipasang dari Chrome Web Store ('update_url' ada) -> https://api.kanalisa.id
   */
  async function getApiBase() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const stored = await chrome.storage.local.get('apiBaseUrl');
        if (stored?.apiBaseUrl && typeof stored.apiBaseUrl === 'string') {
          return stored.apiBaseUrl.trim().replace(/\/+$/, '');
        }
      }
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest) {
        const manifest = chrome.runtime.getManifest();
        const isUnpacked = !('update_url' in manifest);
        return isUnpacked ? 'http://localhost:3000' : 'https://api.kanalisa.id';
      }
    } catch (_) {
      // Fallback aman
    }
    return 'http://localhost:3000';
  }

  async function getToken() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        return (await chrome.storage.local.get(TOKEN_KEY))[TOKEN_KEY] || null;
      }
    } catch (_) {}
    return null;
  }

  async function setToken(token) {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        if (token) await chrome.storage.local.set({ [TOKEN_KEY]: token });
        else await chrome.storage.local.remove(TOKEN_KEY);
      }
    } catch (_) {}
  }

  async function request(path, { method = 'GET', body, auth = true, retry = true } = {}) {
    const base = await getApiBase();
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    const token = auth ? await getToken() : null;
    if (token) headers.Authorization = `Bearer ${token}`;

    let response;
    try {
      response = await fetch(base + path, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch (netErr) {
      throw new ApiError(0, `Tidak dapat terhubung ke backend Kanalisa (${base}). Pastikan backend sedang aktif.`);
    }

    if (response.status === 401 && token && retry) {
      try {
        const refreshed = await fetch(`${base}/api/auth/refresh`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (refreshed.ok) {
          const data = await refreshed.json();
          await setToken(data.token);
          return request(path, { method, body, auth, retry: false });
        }
      } catch (_) {}
      await setToken(null);
    }

    if (!response.ok) {
      const detail = await response.json().catch(() => ({}));
      throw new ApiError(response.status, detail.error || detail.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async function callAPI(path, options = {}) {
    try {
      return await request(path, options);
    } catch (error) {
      if (error.status === 401 && typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      }
      throw error;
    }
  }

  return {
    ApiError,
    getApiBase,
    getToken,
    setToken,
    apiRequest: request,
    callAPI,
  };
});
