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

  const TABS = ['tabSummary', 'tabTags', 'tabSeo'];
  const ratingOf = (total) => total >= 70 ? ['ratingGood', 'high'] : total >= 40 ? ['ratingFair', 'medium'] : ['ratingLow', 'low'];

  function renderPanel(body, data) {
    const { score, video } = data;
    const metrics = score.metrics;
    const tags = video.tags || [];
    const [ratingKey, ratingClass] = ratingOf(score.total);
    const ageLabels = { lessThanOneHour: text('lessThanOneHour'), hours: text('hoursUnit', ['$1']), days: text('daysUnit', ['$1']) };
    const tabs = TABS.map((key, i) => `<button type="button" role="tab" class="kanalisa-tab" id="kt-${i}" aria-controls="kp-${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-tab="${i}">${esc(text(key))}</button>`).join('');
    const checkList = score.checks.map((check) => {
      const status = check.passed ? 'pass' : 'fail';
      return `<li class="kanalisa-check kanalisa-check-${status}"><span aria-hidden="true">${icon(status)}</span><span>${esc(text(check.id))}</span><span class="kanalisa-check-status">${esc(text(check.passed ? 'checkPassed' : 'checkNeedsAttention'))}</span></li>`;
    }).join('');
    const tagsList = tags.length
      ? `<div class="kanalisa-tags" data-tags="${esc(tags.join('\u0001'))}">${tags.map((tag) => `<button type="button" class="kanalisa-tag" data-tag="${esc(tag)}">${esc(tag)}</button>`).join('')}</div><button type="button" class="kanalisa-text-button" data-action="copy-all">${esc(text('copyAll'))}</button>`
      : `<p class="kanalisa-muted">${esc(text('noTags'))}</p>`;

    body.dataset.state = 'ready';
    body.innerHTML = `
      <header class="kanalisa-panel-header">
        <h1 class="kanalisa-title">${esc(text('extensionName'))}</h1>
        <button type="button" class="kanalisa-icon-button" data-action="close" aria-label="${esc(text('closePanel'))}">\u00D7</button>
      </header>
      <div class="kanalisa-hero">
        <div><p class="kanalisa-eyebrow">${esc(text('score'))}</p><output class="kanalisa-score">${score.total}</output></div>
        <span class="kanalisa-badge kanalisa-badge-${ratingClass}">${esc(text(ratingKey))}</span>
      </div>
      <div role="tablist" class="kanalisa-tablist" aria-label="${esc(text('extensionName'))}">${tabs}</div>
      <section role="tabpanel" id="kp-0" aria-labelledby="kt-0" class="kanalisa-tabpanel">
        <dl class="kanalisa-metrics">
          <div><dt title="${esc(text('viewsPerHourTip'))}">${esc(text('viewsPerHour'))}</dt><dd>${esc(K.formatNumber(metrics.viewsPerHour))}</dd></div>
          <div><dt>${esc(text('views'))}</dt><dd>${esc(K.formatNumber(video.views))}</dd></div>
        </dl>
        <dl class="kanalisa-metrics" id="kanalisa-more" hidden>
          <div><dt>${esc(text('likes'))}</dt><dd>${esc(K.formatNumber(video.likes))}</dd></div>
          <div><dt>${esc(text('comments'))}</dt><dd>${esc(K.formatNumber(video.comments))}</dd></div>
          <div><dt>${esc(text('engagementRate'))}</dt><dd>${esc(K.formatPercent(metrics.engagementRate))}</dd></div>
          <div><dt>${esc(text('videoAge'))}</dt><dd>${esc(K.formatAge(metrics.hoursSincePublish, ageLabels))}</dd></div>
        </dl>
        <button type="button" class="kanalisa-text-button" data-action="expand" aria-expanded="false" aria-controls="kanalisa-more">${esc(text('seeMore'))}</button>
      </section>
      <section role="tabpanel" id="kp-1" aria-labelledby="kt-1" class="kanalisa-tabpanel" hidden>${tagsList}</section>
      <section role="tabpanel" id="kp-2" aria-labelledby="kt-2" class="kanalisa-tabpanel" hidden><ul class="kanalisa-checklist">${checkList}</ul></section>
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
    body.addEventListener('click', (event) => {
      const control = event.target.closest('button');
      if (!control) return;
      if (control.dataset.action === 'retry') renderWatchPage();
      else if (control.dataset.tab) selectTab(body, Number(control.dataset.tab));
      else if (control.dataset.action === 'close') host.remove();
      else if (control.dataset.action === 'expand') {
        const open = control.getAttribute('aria-expanded') !== 'true';
        control.setAttribute('aria-expanded', String(open));
        control.textContent = text(open ? 'seeLess' : 'seeMore');
        body.querySelector('#kanalisa-more').hidden = !open;
      } else if (control.dataset.action === 'copy-all') {
        copy(control, (body.querySelector('.kanalisa-tags')?.dataset.tags || '').split('\u0001').join(', '));
      } else if (control.dataset.tag) copy(control, control.dataset.tag);
    });
    body.addEventListener('keydown', (event) => {
      const tab = event.target.closest('[role="tab"]');
      if (!tab || !['ArrowRight', 'ArrowLeft'].includes(event.key)) return;
      event.preventDefault();
      selectTab(body, (Number(tab.dataset.tab) + (event.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length);
    });
  }
  function renderMessage(body, state, messageKey, retry) {
    body.dataset.state = state;
    body.innerHTML = `<p class="kanalisa-state${state === 'error' ? ' kanalisa-error' : ''}" role="${state === 'error' ? 'alert' : 'status'}">${esc(text(messageKey))}</p>${retry ? `<button type="button" class="kanalisa-text-button" data-action="retry">${esc(text('retry'))}</button>` : ''}`;
  }

  // Skor dihitung di klien dengan scoring.js; backend memakai benchmark yang sama sementara data kanal belum tersedia.
  const BENCHMARKS = { medianVph: 1000, categoryMedianEngagement: 0.02 };

  function toVideo(apiVideo) {
    return { ...apiVideo, views: apiVideo.viewCount, likes: apiVideo.likeCount, comments: apiVideo.commentCount };
  }

  async function renderWatchPage() {
    const videoId = K.extractVideoId();
    if (!videoId) return;
    const mounted = mount();
    if (!mounted) return;
    const { host, body } = mounted;
    const { videoPanelEnabled } = await chrome.storage.sync.get({ videoPanelEnabled: true });
    if (videoPanelEnabled === false) {
      host.remove();
      return;
    }
    renderMessage(body, 'loading', 'loading');
    try {
      const data = await K.bgApi(`/api/video/${encodeURIComponent(videoId)}?includeScore=false&includeChannel=false`);
      if (!data?.video) return renderMessage(body, 'empty', 'videoNotFound');
      const video = toVideo(data.video);
      if (K.extractVideoId() !== videoId) return;
      renderPanel(body, { video, score: K.calculateKanalisaScore(video, BENCHMARKS) });
    } catch (error) {
      renderMessage(body, 'error', /404|not found/i.test(error.message) ? 'videoNotFound' : 'fetchVideoError', true);
    }
  }
  function clearWatchPage() {
    document.getElementById(PANEL_ID)?.remove();
  }

  return { renderWatchPage, clearWatchPage };
});

