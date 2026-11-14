(function (root, factory) {
  const exports = factory(root.Kanalisa || {});
  root.Kanalisa = Object.assign(root.Kanalisa || {}, exports);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (K) {
  const CARD_ID = 'kanalisa-results-card';
  const text = (key, substitutions) => chrome.i18n.getMessage(key, substitutions) || key;
  const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);

  function mountCard() {
    const { host, shadow, created } = K.createShadowHost(CARD_ID, 'section');
    const body = shadow.querySelector('.kanalisa-root');
    if (created) {
      body.dataset.state = 'loading';
      body.innerHTML = `<p class="kanalisa-state" role="status">${esc(text('loading'))}</p>`;
    }
    const container = K.queryElement('results', 'contentsContainer');
    if (!container) return null;
    if (!host.isConnected) container.prepend(host);
    return { host, body };
  }

  function renderCard(body, data) {
    const { query, opportunity, relatedKeywords } = data;
    const labelKey = opportunity.label === 'high' ? 'highOpportunity' : opportunity.label === 'medium' ? 'mediumOpportunity' : 'lowOpportunity';
    const chips = (relatedKeywords || []).map((keyword) => `<button type="button" class="kanalisa-tag" data-keyword="${esc(keyword)}">${esc(keyword)}</button>`).join('');

    body.dataset.state = 'ready';
    body.innerHTML = `
      <header class="kanalisa-panel-header">
        <div><p class="kanalisa-eyebrow">${esc(text('keywordResearch'))}</p><h1 class="kanalisa-title">${esc(query)}</h1></div>
        <output class="kanalisa-badge kanalisa-badge-${esc(opportunity.label)}">${esc(text(labelKey))}</output>
      </header>
      <dl class="kanalisa-metrics kanalisa-metrics-horizontal">
        <div><dt>${esc(text('relativeVolume'))}</dt><dd>${esc(opportunity.volume)} / 100</dd></div>
        <div><dt>${esc(text('competition'))}</dt><dd>${esc(opportunity.competition)} / 100</dd></div>
        <div><dt>${esc(text('opportunity'))}</dt><dd>${esc(opportunity.score)} / 100</dd></div>
      </dl>
      ${chips ? `<section class="kanalisa-section"><h2>${esc(text('relatedKeywords'))}</h2><div class="kanalisa-tags">${chips}</div></section>` : ''}`;

    body.querySelectorAll('.kanalisa-tag').forEach((button) => {
      button.addEventListener('click', () => {
        const input = K.queryElement('results', 'searchInput');
        if (input) {
          input.value = button.dataset.keyword;
          input.form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        }
      });
    });
  }

  async function loadData(query) {
    const cacheKey = `kw:${query.toLocaleLowerCase('id-ID')}`;
    const cached = await K.cacheGet(cacheKey);
    if (cached) return cached;
    let payload = null;
    try {
      payload = await K.bgApi(`/api/keyword/search?q=${encodeURIComponent(query)}&limit=10`);
    } catch (_) {
      // Offline fallback
    }
    const volume = Number(payload?.searchVolume || payload?.volume || 50);
    const competition = Number(payload?.competition || 50);
    const opportunity = K.calculateKeywordOpportunity({ volume, competition });
    const relatedKeywords = payload?.relatedKeywords || [
      `cara ${query}`, `${query} terbaru`, `tutorial ${query}`, `${query} pemula`,
    ];
    const data = { query, opportunity, relatedKeywords };
    await K.cacheSet(cacheKey, data, K.CACHE_TTL.keyword);
    return data;
  }

  function injectVideoBadges() {
    const items = K.queryAll('results', 'videoRenderer');
    for (const item of items) {
      if (item.querySelector('.kanalisa-mini-badge')) continue;
      const metadataLine = item.querySelector('#metadata-line');
      if (!metadataLine) continue;
      const badge = document.createElement('span');
      badge.className = 'kanalisa-mini-badge';
      badge.setAttribute('role', 'status');
      badge.textContent = `\u25C6 ${text('score')}`;
      metadataLine.appendChild(badge);
    }
  }

  async function renderResultsPage() {
    const query = K.extractSearchQuery();
    if (!query) return;
    const mounted = mountCard();
    if (!mounted) return;
    const { host, body } = mounted;
    const saved = await chrome.storage.sync.get(['searchCardEnabled']);
    if (saved.searchCardEnabled === false) {
      host.remove();
      return;
    }
    try {
      renderCard(body, await loadData(query));
      injectVideoBadges();
    } catch (_) {
      body.dataset.state = 'error';
      body.innerHTML = `<p class="kanalisa-state kanalisa-error" role="alert">${esc(text('error'))}</p>`;
    }
  }

  function clearResultsPage() {
    document.getElementById(CARD_ID)?.remove();
    document.querySelectorAll('.kanalisa-mini-badge').forEach((el) => el.remove());
  }

  return { renderResultsPage, clearResultsPage };
});
