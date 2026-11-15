(function (root, factory) {
  const exports = factory(root.Kanalisa || {});
  root.Kanalisa = Object.assign(root.Kanalisa || {}, exports);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (K) {
  const PANEL_ID = 'kanalisa-watch-panel';
  const text = (key, substitutions) => chrome.i18n.getMessage(key, substitutions) || key;
  const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
  const icon = (name) => name === 'pass' || name === true ? '\u2713' : name === 'partial' ? '\u2022' : '\u00D7';

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

  const TABS = ['tabSummary', 'tabTags', 'tabSeo'];
  const ratingOf = (total) => total >= 70 ? ['ratingGood', 'high'] : total >= 40 ? ['ratingFair', 'medium'] : ['ratingLow', 'low'];

  function renderPanel(body, data, isCollapsed = false) {
    const { score, video, isMock, channel } = data;
    const metrics = score.meta || score.metrics || {};
    const tags = video.tags || [];
    const [ratingKey, ratingClass] = ratingOf(score.total);
    const ageLabels = { lessThanOneHour: text('lessThanOneHour'), hours: text('hoursUnit', ['$1']), days: text('daysUnit', ['$1']) };
    const tabs = TABS.map((key, i) => `<button type="button" role="tab" class="kanalisa-tab" id="kt-${i}" aria-controls="kp-${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-tab="${i}">${esc(text(key))}</button>`).join('');

    const checks = score.checks || (score.breakdown && score.breakdown.seo && score.breakdown.seo.checks) || [];
    const checkList = checks.map((check) => {
      const isPassed = check.passed === true || check.passed === 'pass';
      const statusClass = isPassed ? 'pass' : (check.passed === 'partial' ? 'partial' : 'fail');
      const labelText = check.id ? text(check.id) : (check.check || 'Pemeriksaan SEO');
      const statusText = isPassed ? text('checkPassed') : (check.passed === 'partial' ? 'Sebagian' : text('checkNeedsAttention'));
      return `<li class="kanalisa-check kanalisa-check-${statusClass}"><span aria-hidden="true">${icon(check.passed)}</span><span>${esc(labelText)}</span><span class="kanalisa-check-status">${esc(statusText)}</span></li>`;
    }).join('');

    const tagsList = tags.length
      ? `<div class="kanalisa-tags" data-tags="${esc(tags.join('\u0001'))}">${tags.map((tag) => `<button type="button" class="kanalisa-tag" data-tag="${esc(tag)}">${esc(tag)}</button>`).join('')}</div><button type="button" class="kanalisa-text-button" data-action="copy-all">${esc(text('copyAll'))}</button>`
      : `<p class="kanalisa-muted">${esc(text('noTags'))}</p>`;

    const mockBadge = isMock
      ? `<span class="kanalisa-badge kanalisa-badge-medium" title="${esc(text('mockNotice'))}" style="font-size:11px;padding:2px 6px;">Data Mock</span>`
      : '';

    const outlierBadge = score.outlier
      ? `<div class="kanalisa-badge kanalisa-badge-high" style="margin-top:8px;">${esc(text('outlierRatio', [String(score.outlier)]))}</div>`
      : '';

    body.dataset.state = 'ready';
    body.innerHTML = `
      <header class="kanalisa-panel-header">
        <div style="display:flex;align-items:center;gap:6px;">
          <h1 class="kanalisa-title">${esc(text('extensionName'))}</h1>
          ${mockBadge}
        </div>
        <div class="kanalisa-panel-actions">
          <button type="button" class="kanalisa-icon-button" data-action="toggle-collapse" aria-label="${esc(text(isCollapsed ? 'expandPanel' : 'collapsePanel'))}" title="${esc(text(isCollapsed ? 'expandPanel' : 'collapsePanel'))}">${isCollapsed ? '+' : '−'}</button>
          <button type="button" class="kanalisa-icon-button" data-action="close" aria-label="${esc(text('closePanel'))}" title="${esc(text('closePanel'))}">\u00D7</button>
        </div>
      </header>
      <div class="kanalisa-panel-body" ${isCollapsed ? 'style="display:none;"' : ''}>
        <div class="kanalisa-hero">
          <div><p class="kanalisa-eyebrow">${esc(text('score'))}</p><output class="kanalisa-score">${score.total}</output></div>
          <span class="kanalisa-badge kanalisa-badge-${ratingClass}">${esc(text(ratingKey))}</span>
        </div>
        ${outlierBadge}
        <div role="tablist" class="kanalisa-tablist" aria-label="${esc(text('extensionName'))}">${tabs}</div>
        <section role="tabpanel" id="kp-0" aria-labelledby="kt-0" class="kanalisa-tabpanel">
          <dl class="kanalisa-metrics">
            <div>
              <dt title="${esc(text('viewsPerHourTip'))}">${esc(text('viewsPerHour'))}</dt>
              <dd>${esc(K.formatNumber(metrics.vph ?? metrics.viewsPerHour ?? 0))}</dd>
            </div>
            <div>
              <dt>${esc(text('views'))}</dt>
              <dd>${esc(K.formatNumber(video.views ?? video.viewCount ?? 0))}</dd>
            </div>
          </dl>
          <dl class="kanalisa-metrics" id="kanalisa-more" hidden>
            <div>
              <dt>${esc(text('likes'))}</dt>
              <dd>${esc(K.formatNumber(video.likes ?? video.likeCount ?? 0))}</dd>
            </div>
            <div>
              <dt>${esc(text('comments'))}</dt>
              <dd>${esc(K.formatNumber(video.comments ?? video.commentCount ?? 0))}</dd>
            </div>
            <div>
              <dt>${esc(text('engagementRate'))}</dt>
              <dd>${esc(K.formatPercent(metrics.engagementRate ?? 0))}</dd>
            </div>
            <div>
              <dt>${esc(text('videoAge'))}</dt>
              <dd>${esc(K.formatAge(metrics.hoursSincePublish ?? 1, ageLabels))}</dd>
            </div>
          </dl>
          <button type="button" class="kanalisa-text-button" data-action="expand" aria-expanded="false" aria-controls="kanalisa-more">${esc(text('seeMore'))}</button>
        </section>
        <section role="tabpanel" id="kp-1" aria-labelledby="kt-1" class="kanalisa-tabpanel" hidden>${tagsList}</section>
        <section role="tabpanel" id="kp-2" aria-labelledby="kt-2" class="kanalisa-tabpanel" hidden><ul class="kanalisa-checklist">${checkList}</ul></section>
      </div>
    `;
  }

  function selectTab(body, index) {
    body.querySelectorAll('[role="tab"]').forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      if (i === index) tab.focus();
    });
    body.querySelectorAll('[role="tabpanel"]').forEach((panel, i) => { panel.hidden = i !== index; });
  }

  async function copy(button, value) {
    await navigator.clipboard.writeText(value);
    const original = button.textContent;
    button.textContent = text('copied');
    setTimeout(() => { button.textContent = original; }, 1500);
  }

  function bindEvents(body, host) {
    body.addEventListener('click', async (event) => {
      const control = event.target.closest('button');
      if (!control) return;
      if (control.dataset.action === 'retry') {
        renderWatchPage();
      } else if (control.dataset.tab) {
        selectTab(body, Number(control.dataset.tab));
      } else if (control.dataset.action === 'close') {
        host.remove();
      } else if (control.dataset.action === 'toggle-collapse') {
        const panelBody = body.querySelector('.kanalisa-panel-body');
        const isCurrentlyHidden = panelBody.style.display === 'none';
        panelBody.style.display = isCurrentlyHidden ? 'block' : 'none';
        control.textContent = isCurrentlyHidden ? '−' : '+';
        control.setAttribute('aria-label', text(isCurrentlyHidden ? 'collapsePanel' : 'expandPanel'));
        await chrome.storage.sync.set({ panelCollapsed: !isCurrentlyHidden });
      } else if (control.dataset.action === 'expand') {
        const open = control.getAttribute('aria-expanded') !== 'true';
        control.setAttribute('aria-expanded', String(open));
        control.textContent = text(open ? 'seeLess' : 'seeMore');
        body.querySelector('#kanalisa-more').hidden = !open;
      } else if (control.dataset.action === 'copy-all') {
        copy(control, (body.querySelector('.kanalisa-tags')?.dataset.tags || '').split('\u0001').join(', '));
      } else if (control.dataset.tag) {
        copy(control, control.dataset.tag);
      }
    });

    body.addEventListener('keydown', (event) => {
      const tab = event.target.closest('[role="tab"]');
      if (!tab || !['ArrowRight', 'ArrowLeft'].includes(event.key)) return;
      event.preventDefault();
      selectTab(body, (Number(tab.dataset.tab) + (event.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length);
    });
  }

  function renderMessage(body, state, messageText, retry = false) {
    body.dataset.state = state;
    body.innerHTML = `
      <header class="kanalisa-panel-header">
        <h1 class="kanalisa-title">${esc(text('extensionName'))}</h1>
      </header>
      <div style="padding:12px 0;">
        <p class="kanalisa-state${state === 'error' ? ' kanalisa-error' : ''}" role="${state === 'error' ? 'alert' : 'status'}">${esc(messageText)}</p>
        ${retry ? `<button type="button" class="kanalisa-button" data-action="retry" style="margin-top:8px;font-size:13px;padding:6px 14px;">${esc(text('retry'))}</button>` : ''}
      </div>
    `;
  }

  const BENCHMARKS = { medianVPH: 1000, categoryMedianEngagement: 0.02 };

  function toVideo(apiVideo) {
    return {
      ...apiVideo,
      views: apiVideo.viewCount ?? apiVideo.views ?? 0,
      likes: apiVideo.likeCount ?? apiVideo.likes ?? 0,
      comments: apiVideo.commentCount ?? apiVideo.comments ?? 0,
    };
  }

  async function renderWatchPage() {
    const videoId = K.extractVideoId();
    if (!videoId) return;

    const mounted = mount();
    if (!mounted) return;
    const { host, body } = mounted;

    const { videoPanelEnabled = true, panelCollapsed = false } = await chrome.storage.sync.get({
      videoPanelEnabled: true,
      panelCollapsed: false,
    });

    if (videoPanelEnabled === false) {
      host.remove();
      return;
    }

    renderMessage(body, 'loading', text('loading'));

    try {
      const data = await K.bgApi(`/api/video/${encodeURIComponent(videoId)}?includeScore=true&includeChannel=true`);

      if (!data?.video) {
        return renderMessage(body, 'empty', text('videoNotFound'), true);
      }

      const video = toVideo(data.video);
      if (K.extractVideoId() !== videoId) return;

      const score = data.score || K.calculateKanalisaScore(video, BENCHMARKS);
      renderPanel(body, { video, score, isMock: Boolean(data.isMock), channel: data.channel }, panelCollapsed);
    } catch (error) {
      console.error('[Kanalisa] Error rendering watch page:', error);
      const isNotFound = /404|not found/i.test(error.message);
      const errorMsg = isNotFound ? text('videoNotFound') : text('fetchVideoError');
      renderMessage(body, 'error', errorMsg, true);
    }
  }

  function clearWatchPage() {
    document.getElementById(PANEL_ID)?.remove();
  }

  return { renderWatchPage, clearWatchPage };
});
