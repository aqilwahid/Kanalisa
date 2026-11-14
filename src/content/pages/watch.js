(function (root, factory) {
  const exports = factory(root.Kanalisa || {});
  root.Kanalisa = Object.assign(root.Kanalisa || {}, exports);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (K) {
  const PANEL_ID = 'kanalisa-watch-panel';
  const text = (key, substitutions) => chrome.i18n.getMessage(key, substitutions) || key;
  const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
  const icon = (name) => name === 'pass' ? '\u2713' : name === 'partial' ? '\u2022' : '\u00D7';

  function mount() {
    const { host, shadow, created } = K.createShadowHost(PANEL_ID);
    const body = shadow.querySelector('.kanalisa-root');
    if (created) {
      body.dataset.state = 'loading';
      body.innerHTML = `<p class="kanalisa-state" role="status">${esc(text('loading'))}</p>`;
      bindEvents(body, host);
    }
    const anchor = K.queryElement('watch', 'secondaryColumn');
    if (!anchor) return null;
    if (!host.isConnected) anchor.prepend(host);
    return { host, body };
  }

  function renderError(body) {
    body.dataset.state = 'error';
    body.innerHTML = `<p class="kanalisa-state kanalisa-error" role="alert">${esc(text('error'))}</p>`;
  }

  function renderPanel(body, data) {
    const { score, video } = data;
    const metrics = score.metrics;
    const tags = video.tags || [];
    const checkList = score.checks.map((check) => {
      const status = check.passed ? 'pass' : 'fail';
      return `<li class="kanalisa-check kanalisa-check-${status}"><span aria-hidden="true">${icon(status)}</span><span>${esc(text(check.id))}</span><span class="kanalisa-check-status">${esc(text(check.passed ? 'checkPassed' : 'checkNeedsAttention'))}</span></li>`;
    }).join('');
    const tagsList = tags.length
      ? `<div class="kanalisa-tags" data-tags="${esc(tags.join('\u0001'))}">${tags.map((tag) => `<button type="button" class="kanalisa-tag" data-tag="${esc(tag)}">${esc(tag)}</button>`).join('')}</div>`
      : `<p class="kanalisa-muted">${esc(text('noTags'))}</p>`;

    body.dataset.state = 'ready';
    body.innerHTML = `
      <header class="kanalisa-panel-header">
        <div><p class="kanalisa-eyebrow">${esc(text('score'))}</p><output class="kanalisa-score" aria-label="${esc(text('score'))}">${score.total}</output></div>
        <div class="kanalisa-panel-actions">
          <button type="button" class="kanalisa-icon-button" data-action="collapse" aria-expanded="true" aria-label="${esc(text('collapsePanel'))}">\u2212</button>
          <button type="button" class="kanalisa-icon-button" data-action="close" aria-label="${esc(text('closePanel'))}">\u00D7</button>
        </div>
      </header>
      <div class="kanalisa-panel-body">
        <dl class="kanalisa-metrics">
          <div><dt>${esc(text('views'))}</dt><dd>${esc(K.formatNumber(video.views))}</dd></div>
          <div><dt title="${esc(text('viewsPerHourTip'))}">${esc(text('viewsPerHour'))}</dt><dd>${esc(K.formatNumber(metrics.viewsPerHour))}</dd></div>
          <div><dt>${esc(text('likes'))}</dt><dd>${esc(K.formatNumber(video.likes))}</dd></div>
          <div><dt>${esc(text('comments'))}</dt><dd>${esc(K.formatNumber(video.comments))}</dd></div>
          <div><dt>${esc(text('engagementRate'))}</dt><dd>${esc(K.formatPercent(metrics.engagementRate))}</dd></div>
          <div><dt>${esc(text('videoAge'))}</dt><dd>${esc(K.formatAge(metrics.hoursSincePublish, { lessThanOneHour: text('lessThanOneHour'), hours: text('hoursUnit', ['$1']), days: text('daysUnit', ['$1']) }))}</dd></div>
        </dl>
        <section class="kanalisa-section"><div class="kanalisa-section-heading"><h2>${esc(text('tags'))}</h2>${tags.length ? `<button type="button" class="kanalisa-text-button" data-action="copy-all">${esc(text('copyAll'))}</button>` : ''}</div>${tagsList}</section>
        <section class="kanalisa-section"><h2>${esc(text('seoChecklist'))}</h2><ul class="kanalisa-checklist">${checkList}</ul></section>
      </div>`;
  }

  function bindEvents(body, host) {
    body.addEventListener('click', async (event) => {
      const control = event.target.closest('button');
      if (!control) return;
      if (control.dataset.action === 'collapse') {
        const collapsed = host.classList.toggle('kanalisa-collapsed');
        control.setAttribute('aria-expanded', String(!collapsed));
        control.setAttribute('aria-label', text(collapsed ? 'expandPanel' : 'collapsePanel'));
        control.textContent = collapsed ? '+' : '\u2212';
        await chrome.storage.sync.set({ panelCollapsed: collapsed });
      } else if (control.dataset.action === 'close') {
        host.remove();
      } else if (control.dataset.action === 'copy-all') {
        const tags = body.querySelector('.kanalisa-tags')?.dataset.tags?.split('\u0001') || [];
        await navigator.clipboard.writeText(tags.join(', '));
        control.textContent = text('copied');
      } else if (control.dataset.tag) {
        await navigator.clipboard.writeText(control.dataset.tag);
        control.textContent = text('copied');
      }
    });
  }

  async function loadData(videoId) {
    const cached = await K.cacheGet(`video:${videoId}`);
    if (cached) return cached;
    let payload = null;
    try {
      const response = await K.bgApi(`/api/video/${encodeURIComponent(videoId)}`, { auth: false });
      payload = response?.video || response;
    } catch (_) {
      // Offline or backend unavailable: fall back to DOM inspection
    }
    const video = {
      title: payload?.title || K.queryElement('watch', 'title')?.textContent?.trim() || '',
      description: payload?.description || K.queryElement('watch', 'description')?.textContent?.trim() || '',
      tags: (payload?.tags && payload.tags.length) ? payload.tags : K.extractTagsFromDOM(),
      views: Number(payload?.views || payload?.viewCount || K.parseIndonesianNumber(K.queryElement('watch', 'viewCount')?.textContent)),
      likes: Number(payload?.likes || payload?.likeCount || 0),
      comments: Number(payload?.comments || payload?.commentCount || 0),
      publishedAt: payload?.publishedAt,
    };
    const score = K.calculateKanalisaScore(video, payload?.benchmarks || {});
    const data = { video, score };
    await K.cacheSet(`video:${videoId}`, data, K.CACHE_TTL.video);
    return data;
  }

  async function renderWatchPage() {
    const videoId = K.extractVideoId();
    if (!videoId) return;
    const mounted = mount();
    if (!mounted) return;
    const { host, body } = mounted;
    const saved = await chrome.storage.sync.get(['videoPanelEnabled', 'panelCollapsed']);
    if (saved.videoPanelEnabled === false) {
      host.remove();
      return;
    }
    host.classList.toggle('kanalisa-collapsed', Boolean(saved.panelCollapsed));
    try {
      renderPanel(body, await loadData(videoId));
    } catch (_) {
      renderError(body);
    }
  }

  function clearWatchPage() {
    document.getElementById(PANEL_ID)?.remove();
  }

  return { renderWatchPage, clearWatchPage };
});

