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

  function renderCard(body, query, data) {
    const volume = data.volumeRelative ?? data.volume ?? 0;
    const competition = data.competition ?? 50;
    const opportunityScore = data.opportunityScore ?? data.score ?? Math.round((volume * (100 - competition)) / 100);

    const labelClass = K.getKeywordOpportunityLevel(opportunityScore);
    const relatedList = data.relatedKeywords || (data.related || []).map((r) => (typeof r === 'string' ? { keyword: r } : r));

    const chips = relatedList.map((item) => {
      const kw = typeof item === 'string' ? item : item.keyword;
      return `<button type="button" class="kanalisa-tag" data-keyword="${esc(kw)}">${esc(kw)}</button>`;
    }).join('');

    const note = data.isMock ? `<p class="kanalisa-note">${esc(text('mockNotice'))}</p>` : '';

    body.dataset.state = 'ready';
    body.innerHTML = `
      <header class="kanalisa-panel-header">
        <div>
          <p class="kanalisa-eyebrow">${esc(text('keywordLabel', [query]))}</p>
          <h1 class="kanalisa-title">${esc(query)}</h1>
        </div>
        <span class="kanalisa-badge kanalisa-badge-${labelClass}">${esc(text(`${labelClass}Opportunity`))}</span>
      </header>
      <dl class="kanalisa-metrics kanalisa-metrics-horizontal">
        <div><dt>${esc(text('relativeVolume'))}</dt><dd>${esc(volume)} / 100</dd></div>
        <div><dt>${esc(text('competition'))}</dt><dd>${esc(competition)} / 100</dd></div>
        <div><dt>${esc(text('opportunity'))}</dt><dd class="kanalisa-opp-${labelClass}">${esc(opportunityScore)} / 100</dd></div>
      </dl>
      ${chips ? `<section class="kanalisa-section"><h2>${esc(text('relatedKeywords'))}</h2><div class="kanalisa-tags">${chips}</div></section>` : ''}
      ${note}
    `;

    body.querySelectorAll('[data-keyword]').forEach((button) => {
      button.addEventListener('click', () => {
        window.location.assign(`/results?search_query=${encodeURIComponent(button.dataset.keyword)}`);
      });
    });
  }

  function renderCardError(body, query, errorMsg) {
    body.dataset.state = 'error';
    body.innerHTML = `
      <header class="kanalisa-panel-header">
        <div>
          <p class="kanalisa-eyebrow">${esc(text('keywordResearch'))}</p>
          <h1 class="kanalisa-title">${esc(query)}</h1>
        </div>
      </header>
      <p class="kanalisa-state kanalisa-error" role="alert">${esc(errorMsg || text('error'))}</p>
      <button type="button" class="kanalisa-text-button" data-action="retry">${esc(text('retry'))}</button>
    `;

    body.querySelector('[data-action="retry"]')?.addEventListener('click', () => {
      renderResultsPage();
    });
  }

  async function renderResultsPage() {
    const query = K.extractSearchQuery();
    if (!query) return;

    const mounted = mountCard();
    if (!mounted) return;
    const { host, body } = mounted;

    const { searchCardEnabled } = await chrome.storage.sync.get({ searchCardEnabled: true });
    if (searchCardEnabled === false) {
      host.remove();
      return;
    }

    body.dataset.state = 'loading';
    body.innerHTML = `<p class="kanalisa-state" role="status">${esc(text('loading'))}</p>`;

    try {
      const data = await K.bgApi(`/api/keyword/search?q=${encodeURIComponent(query)}`);
      if (K.extractSearchQuery() !== query) return;
      renderCard(body, query, data);
    } catch (err) {
      console.warn('[Kanalisa] API keyword search failed, using local fallback:', err.message);
      const fallback = K.getMockKeyword ? K.getMockKeyword(query) : null;
      if (fallback) {
        renderCard(body, query, { ...fallback, isMock: true });
      } else {
        renderCardError(body, query, err.message);
      }
    }
  }

  function clearResultsPage() {
    document.getElementById(CARD_ID)?.remove();
    document.querySelectorAll('.kanalisa-mini-badge').forEach((el) => el.remove());
  }

  return { renderResultsPage, clearResultsPage };
});
