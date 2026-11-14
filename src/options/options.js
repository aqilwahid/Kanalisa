(function () {
  const text = (key) => chrome.i18n.getMessage(key) || key;
  const form = document.getElementById('settings-form');
  const status = document.getElementById('status');
  const nicheError = document.getElementById('niche-error');

  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = text(el.dataset.i18n); });
  document.getElementById('niche').placeholder = text('nichePlaceholder');

  async function load() {
    const s = await chrome.storage.sync.get({
      niche: '', timezone: 'Asia/Jakarta', languageStyle: 'casual', videoPanelEnabled: true, searchCardEnabled: true,
    });
    form.niche.value = s.niche;
    form.timezone.value = s.timezone;
    form.languageStyle.value = s.languageStyle;
    form.videoPanelEnabled.checked = s.videoPanelEnabled;
    form.searchCardEnabled.checked = s.searchCardEnabled;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const niche = form.niche.value.trim();
    nicheError.hidden = Boolean(niche);
    nicheError.textContent = niche ? '' : text('requiredField');
    form.niche.setAttribute('aria-invalid', String(!niche));
    if (!niche) { form.niche.focus(); return; }
    await chrome.storage.sync.set({
      niche,
      timezone: form.timezone.value,
      languageStyle: form.languageStyle.value,
      videoPanelEnabled: form.videoPanelEnabled.checked,
      searchCardEnabled: form.searchCardEnabled.checked,
      onboarded: true,
    });
    status.textContent = text('settingsSaved');
  });

  load();
})();
