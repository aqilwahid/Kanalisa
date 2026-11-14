(function (root, factory) {
  const exports = factory();
  if (typeof module === 'object' && module.exports) module.exports = exports;
  else root.Kanalisa = Object.assign(root.Kanalisa || {}, exports);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const API_BASE = 'https://api.kanalisa.id';
  const TOKEN_KEY = 'authToken';

  class ApiError extends Error {
    constructor(status, message) {
      super(message);
      this.status = status;
    }
  }

  async function getToken() {
    return (await chrome.storage.local.get(TOKEN_KEY))[TOKEN_KEY] || null;
  }

  async function setToken(token) {
    if (token) await chrome.storage.local.set({ [TOKEN_KEY]: token });
    else await chrome.storage.local.remove(TOKEN_KEY);
  }

  async function request(path, { method = 'GET', body, auth = true, retry = true } = {}) {
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const token = auth ? await getToken() : null;
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(API_BASE + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });

    if (response.status === 401 && token && retry) {
      const refreshed = await fetch(`${API_BASE}/api/auth/refresh`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      if (refreshed.ok) {
        await setToken((await refreshed.json()).token);
        return request(path, { method, body, auth, retry: false });
      }
      await setToken(null);
    }
    if (!response.ok) {
      const detail = await response.json().catch(() => ({}));
      throw new ApiError(response.status, detail.error || detail.message || response.statusText);
    }
    return response.json();
  }

  async function callAPI(path, options = {}) {
    try {
      return await request(path, options);
    } catch (error) {
      if (error.status === 401 && chrome.runtime.openOptionsPage) chrome.runtime.openOptionsPage();
      throw error;
    }
  }

  return { ApiError, getToken, setToken, apiRequest: request, callAPI };
});
