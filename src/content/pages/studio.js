(function (K) {
  const panelId = 'kanalisa-studio-panel';
  const text = (key, substitutions) => chrome.i18n.getMessage(key, substitutions) || key;
  let currentMetadata;

  function isVisible(element) {
    return element?.getClientRects().length && getComputedStyle(element).visibility === 'visible';
  }

  function findVisibleField(key, editor) {
    return K.queryAll('studio', key, editor).find(isVisible);
  }

  function readText(field) {
    return (field?.value ?? field?.innerText ?? '').trim();
  }

  function readTags(editor) {
    const container = findVisibleField('tagsContainer', editor);
    if (!container) return null;
    return [...new Set(K.queryAll('studio', 'tagChip', container).filter(isVisible)
      .map((chip) => readText(K.queryElement('studio', 'tagText', chip) || chip)).filter(Boolean))];
  }

  function mountPanel(anchor) {
    const { host, shadow, created } = K.createShadowHost(panelId, 'section', ['styles/base.css', 'styles/studio.css']);
    if (created) {
      const body = shadow.querySelector('.kanalisa-root');
      host.setAttribute('aria-label', text('studioSeoTitle'));
      body.innerHTML = `
        <div class="kanalisa-studio-header">
          <img width="24" height="24" alt="" src="${chrome.runtime.getURL('icons/icon-32.png')}">
          <h3></h3>
          <output class="kanalisa-studio-score"></output>
        </div>
        <p class="kanalisa-studio-note" hidden></p>
        <details>
          <summary></summary>
          <ul class="kanalisa-studio-checks"></ul>
        </details>
      `;
      body.querySelector('h3').textContent = text('studioSeoTitle');
      body.querySelector('summary').textContent = text('seoChecklist');
      currentMetadata = undefined;
    }
    if (anchor.nextElementSibling !== host) anchor.after(host);
    return shadow;
  }

  function updateScore(shadow, { title, description, tags }) {
    const { score, checks } = K.calculateSeo(title, description, tags ?? []);
    const output = shadow.querySelector('output');
    output.textContent = text('studioSeoScore', [String(score)]);
    const note = shadow.querySelector('.kanalisa-studio-note');
    note.textContent = tags === null ? text('studioTagsUnavailable') : '';
    note.hidden = tags !== null;
    const items = checks.map(({ id, passed }) => {
      const pending = tags === null && (id === 'tagCount' || (id === 'keywordMatch' && !passed));
      const item = document.createElement('li');
      const label = document.createElement('span');
      label.textContent = text(id === 'keywordMatch' ? 'studioKeywordMatch' : id);
      const status = document.createElement('strong');
      status.dataset.result = pending ? 'pending' : passed ? 'pass' : 'fail';
      status.textContent = text(pending ? 'studioCheckPending' : passed ? 'checkPassed' : 'checkNeedsAttention');
      item.append(label, status);
      return item;
    });
    shadow.querySelector('.kanalisa-studio-checks').replaceChildren(...items);
  }

  function renderStudioPage() {
    const dialog = K.queryAll('studio', 'uploadDialog').find(isVisible);
    const editors = dialog ? [dialog] : K.queryAll('studio', 'metadataEditor').filter(isVisible);
    for (const editor of editors) {
      const field = findVisibleField('titleInput', editor);
      if (!field) continue;
      const anchor = field.closest(K.getSelector('studio', 'titleField')) ?? field.parentElement;
      const shadow = mountPanel(anchor);
      const metadata = {
        title: readText(field),
        description: readText(findVisibleField('descriptionInput', editor)),
        tags: readTags(editor),
      };
      const snapshot = JSON.stringify(metadata);
      if (snapshot === currentMetadata) return;
      currentMetadata = snapshot;
      updateScore(shadow, metadata);
      return;
    }
    clearStudioPage();
  }

  function clearStudioPage() {
    document.getElementById(panelId)?.remove();
    currentMetadata = undefined;
  }

  Object.assign(K, { renderStudioPage, clearStudioPage });
})(globalThis.Kanalisa);
