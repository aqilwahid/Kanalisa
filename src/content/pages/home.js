(function (K) {
  const badgeClass = 'kanalisa-feed-metric';
  const cache = new Map();
  let pending = false;

  function renderBadge(anchor, id, { vph, isMock }) {
    const text = (key, substitutions) => chrome.i18n.getMessage(key, substitutions) || key;
    const { host, shadow } = K.createShadowHost(null, 'div', ['styles/base.css', 'styles/feed.css']);
    host.className = badgeClass;
    host.dataset.videoId = id;
    host.dataset.vph = String(vph);
    host.dataset.source = isMock ? 'mock' : 'youtube';
    const body = shadow.querySelector('.kanalisa-root');
    body.title = text('viewsPerHourTip');

    const logo = document.createElement('img');
    logo.src = chrome.runtime.getURL('icons/icon-32.png');
    logo.width = 16;
    logo.height = 16;
    logo.alt = '';
    const value = document.createElement('span');
    value.textContent = text('feedViewsPerHour', [K.formatNumber(vph)]);
    body.append(logo, value);
    if (isMock) {
      const source = document.createElement('span');
      source.className = 'kanalisa-feed-source';
      source.textContent = text('sampleData');
      source.title = text('mockNotice');
      body.append(source);
    }
    anchor.append(host);
  }

  async function renderHomeFeed() {
    const now = Date.now();
    const missing = new Set();
    for (const card of K.queryAll('home', 'videoCard')) {
      const link = K.queryElement('home', 'videoLink', card);
      const id = link && K.extractVideoId(link.href);
      const anchor = K.queryElement('home', 'videoMetadata', card);
      const badge = card.querySelector(`.${badgeClass}`);
      if (badge && (badge.dataset.videoId !== id || badge.parentElement !== anchor)) badge.remove();
      if (!id || !/^[\w-]{11}$/.test(id) || !anchor) continue;

      const rect = card.getBoundingClientRect();
      if (!rect.height || rect.bottom < -300 || rect.top > window.innerHeight + 300) continue;
      const entry = cache.get(id);
      if (entry?.expiresAt > now) {
        if (entry.metrics) {
          const { vph, isMock } = entry.metrics;
          if (badge?.isConnected && badge.dataset.vph === String(vph) && badge.dataset.source === (isMock ? 'mock' : 'youtube')) continue;
          badge?.remove();
          renderBadge(anchor, id, entry.metrics);
        }
      } else {
        missing.add(id);
      }
    }

    if (pending || !missing.size) return;
    pending = true;
    const ids = [...missing].slice(0, 50);
    let metricsById = new Map();
    try {
      const data = await K.bgApi('/api/video/batch?metrics=true', { method: 'POST', body: { ids }, auth: false });
      metricsById = new Map(data.videos.filter(({ vph }) => Number.isFinite(vph))
        .map(({ id, vph }) => [id, { vph, isMock: data.isMock }]));
    } catch (error) {
      console.warn('[Kanalisa] Gagal memuat TPJ beranda:', error.message);
    } finally {
      for (const id of ids) {
        const metrics = metricsById.get(id);
        cache.delete(id);
        cache.set(id, { metrics, expiresAt: Date.now() + (metrics ? K.CACHE_TTL.video : 60_000) });
      }
      while (cache.size > 250) cache.delete(cache.keys().next().value);
      pending = false;
      if (location.pathname === '/' && (metricsById.size || missing.size > ids.length)) K.scheduleRender();
    }
  }

  function clearHomeFeed() {
    document.querySelectorAll(`.${badgeClass}`).forEach((badge) => badge.remove());
  }

  Object.assign(K, { renderHomeFeed, clearHomeFeed });
})(globalThis.Kanalisa);
