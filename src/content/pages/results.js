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

  function renderCard(body, query, mock) {
    const note = `<p class="kanalisa-note">${esc(text('mockNotice'))}</p>`;
    if (!mock) {
      body.dataset.state = 'empty';
      body.innerHTML = `<h1 class="kanalisa-title">${esc(text('keywordResearch'))}</h1><p class="kanalisa-state">${esc(text('noMockKeyword'))}</p>${note}`;
      return;
    }
    const opportunity = K.calculateKeywordOpportunity(mock);
    const labelKey = opportunity.label === 'high' ? 'highOpportunity' : opportunity.label === 'medium' ? 'mediumOpportunity' : 'lowOpportunity';
    const chips = (mock.related || []).map((keyword) => `<button type="button" class="kanalisa-tag" data-keyword="${esc(keyword)}">${esc(keyword)}</button>`).join('');
    body.dataset.state = 'ready';
    body.innerHTML = `
      <header class="kanalisa-panel-header">
        <div><p class="kanalisa-eyebrow">${esc(text('keywordLabel', [query]))}</p><h1 class="kanalisa-title">${esc(query)}</h1></div>
        <span class="kanalisa-badge kanalisa-badge-${esc(opportunity.label)}">${esc(text(labelKey))}</span>
      </header>
      <dl class="kanalisa-metrics kanalisa-metrics-horizontal">
        <div><dt>${esc(text('relativeVolume'))}</dt><dd>${esc(mock.volume)} / 100</dd></div>
        <div><dt>${esc(text('competition'))}</dt><dd>${esc(mock.competition)} / 100</dd></div>
        <div><dt>${esc(text('opportunity'))}</dt><dd class="kanalisa-opp-${esc(opportunity.label)}">${esc(opportunity.score)} / 100</dd></div>
      </dl>
      ${chips ? `<section class="kanalisa-section"><h2>${esc(text('relatedKeywords'))}</h2><div class="kanalisa-tags">${chips}</div></section>` : ''}${note}`;
    body.querySelectorAll('[data-keyword]').forEach((button) => {
      button.addEventListener('click', () => { window.location.assign(`/results?search_query=${encodeURIComponent(button.dataset.keyword)}`); });
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
    renderCard(body, query, K.getMockKeyword(query));
  }
  function clearResultsPage() {
    document.getElementById(CARD_ID)?.remove();
    document.querySelectorAll('.kanalisa-mini-badge').forEach((el) => el.remove());
  }

  return { renderResultsPage, clearResultsPage };
});
