(function (root, factory) {
  const exports = factory(root.Kanalisa || {});
  root.Kanalisa = Object.assign(root.Kanalisa || {}, exports);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (K) {
  let scheduled = false;
  let forceRender = false;
  let videoPanelEnabled = false;
  const isStudio = window.location.hostname === 'studio.youtube.com';

  function pageType() {
    if (isStudio) return 'studio';
    const path = window.location.pathname;
    if (path === '/') return 'home';
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

  async function render() {
    scheduled = false;
    const force = forceRender;
    forceRender = false;
    const type = pageType();
    const urlChanged = window.location.href !== lastUrl;
    lastUrl = window.location.href;
    if (urlChanged) {
      K.clearWatchPage?.();
      K.clearResultsPage?.();
      K.clearHomeFeed();
      K.clearStudioPage();
    }
    if (type === 'home' && videoPanelEnabled) return K.renderHomeFeed();
    if (type === 'studio' && videoPanelEnabled) return K.renderStudioPage();
    if (!force && !urlChanged && !hostMissing(type)) return;
    if (type === 'watch' && videoPanelEnabled) await K.renderWatchPage?.();
    if (type === 'results') await K.renderResultsPage?.();
  }

  function scheduleRender(force = false) {
    forceRender ||= force === true;
    if (scheduled) return;
    scheduled = true;
    window.setTimeout(render, 150);
  }
  function start() {
    const settingsReady = chrome.storage.sync.get({ videoPanelEnabled: true }).then((settings) => {
      videoPanelEnabled = settings.videoPanelEnabled;
    });
    Promise.all([K.syncRemoteSelectors(), settingsReady]).then(() => scheduleRender());
    document.addEventListener('yt-navigate-finish', scheduleRender);
    const observer = new MutationObserver(scheduleRender);
    observer.observe(document.documentElement, isStudio
      ? { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'aria-hidden', 'style', 'class'] }
      : { childList: true, subtree: true, attributes: true, attributeFilter: ['href'] });
    if (isStudio) {
      document.addEventListener('input', scheduleRender, true);
      document.addEventListener('change', scheduleRender, true);
    } else {
      window.addEventListener('scroll', () => { if (pageType() === 'home') scheduleRender(); }, { passive: true });
      window.addEventListener('resize', () => { if (pageType() === 'home') scheduleRender(); });
    }
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes['remoteConfig:selectors']) K.syncRemoteSelectors().then(() => scheduleRender(true));
      if (area === 'sync' && changes.videoPanelEnabled) {
        videoPanelEnabled = changes.videoPanelEnabled.newValue !== false;
        if (!videoPanelEnabled) {
          K.clearWatchPage();
          K.clearHomeFeed();
          K.clearStudioPage();
        }
        scheduleRender();
      }
    });
  }

  start();
  return { pageType, scheduleRender };
});
