(function (root, factory) {
  const exports = factory();
  if (typeof module === 'object' && module.exports) module.exports = exports;
  else root.Kanalisa = Object.assign(root.Kanalisa || {}, exports);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const MINUTE = 60 * 1000;
  const TTL = Object.freeze({ video: 15 * MINUTE, tags: 24 * 60 * MINUTE, channel: 24 * 60 * MINUTE, keyword: 24 * 60 * MINUTE });
  const PREFIX = 'cache:';

  async function cacheGet(key) {
    const storageKey = PREFIX + key;
    const stored = (await chrome.storage.local.get(storageKey))[storageKey];
    if (!stored) return null;
    if (stored.expiresAt <= Date.now()) {
      await chrome.storage.local.remove(storageKey);
      return null;
    }
    return stored.value;
  }

  async function cacheSet(key, value, ttlMs) {
    await chrome.storage.local.set({ [PREFIX + key]: { value, expiresAt: Date.now() + ttlMs } });
  }

  async function cacheFetch(key, ttlMs, loader) {
    const hit = await cacheGet(key);
    if (hit !== null) return hit;
    const value = await loader();
    await cacheSet(key, value, ttlMs);
    return value;
  }

  async function cachePurgeExpired() {
    const all = await chrome.storage.local.get(null);
    const expired = Object.keys(all).filter((k) => k.startsWith(PREFIX) && all[k]?.expiresAt <= Date.now());
    if (expired.length) await chrome.storage.local.remove(expired);
  }

  return { CACHE_TTL: TTL, cacheGet, cacheSet, cacheFetch, cachePurgeExpired };
});
