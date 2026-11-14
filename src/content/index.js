(function (root, factory) {
  const exports = factory(root.Kanalisa || {});
  root.Kanalisa = Object.assign(root.Kanalisa || {}, exports);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (K) {
  let scheduled = false;
  let observer;

  function pageType() {
    const path = window.location.pathname;
    if (path === '/watch' || path.startsWith('/shorts/')) return 'watch';
    if (path === '/results') return 'results';
    if (/^\/@[^/]+|^\/channel\/|^\/c\//.test(path)) return 'channel';
    return null;
  }

  let lastUrl = '';

  function hostMissing(type) {
    const id = type === 'watch' ? 'kanalisa-watch-panel' : type === 'results' ? 'kanalisa-results-card' : null;
    return id !== null && !document.getElementById(id);
  }

  async function render(force) {
    scheduled = false;
    const type = pageType();
    const urlChanged = window.location.href !== lastUrl;
    if (!force && !urlChanged && !hostMissing(type)) return;
    lastUrl = window.location.href;
    if (urlChanged) {
      K.clearWatchPage?.();
      K.clearResultsPage?.();
    }
    if (type === 'watch') await K.renderWatchPage?.();
    if (type === 'results') await K.renderResultsPage?.();
  }

  function scheduleRender() {
    if (scheduled) return;
    scheduled = true;
    window.setTimeout(() => render(false), 150);
  }
  function start() {
    K.syncRemoteSelectors?.().then(scheduleRender);
    document.addEventListener('yt-navigate-finish', scheduleRender);
    observer = new MutationObserver(scheduleRender);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes['remoteConfig:selectors']) K.syncRemoteSelectors?.().then(scheduleRender);
    });
  }

  start();
  return { pageType, scheduleRender };
});
