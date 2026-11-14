(function () {
  const K = globalThis.Kanalisa;
  const text = (key, substitutions) => chrome.i18n.getMessage(key, substitutions) || key;
  const $ = (id) => document.getElementById(id);
  const NICHES = [['gaming', 'nicheGaming'], ['beauty', 'nicheBeauty'], ['education', 'nicheEducation'], ['tech', 'nicheTech'], ['culinary', 'nicheCulinary'], ['finance', 'nicheFinance'], ['other', 'nicheOther']];
  const form = $('onboarding-form');
  const steps = [...form.querySelectorAll('.k-step')];
  const tabs = [$('onboarding-tab'), $('settings-tab')];
  const panels = [$('onboarding-panel'), $('settings-panel')];
  let niche = '';
  let step = 0;

  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = text(el.dataset.i18n); });

  const status = (key, substitutions) => { $('status').textContent = key ? text(key, substitutions) : ''; };
  const applyTheme = (theme) => {
    if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
    else delete document.documentElement.dataset.theme;
  };

  function selectTab(index) {
    tabs.forEach((tab, i) => { tab.setAttribute('aria-selected', String(i === index)); tab.tabIndex = i === index ? 0 : -1; panels[i].hidden = i !== index; });
    tabs[index].focus();
    status('');
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectTab(i));
    tab.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') selectTab((i + 1) % tabs.length);
      if (event.key === 'ArrowLeft') selectTab((i + tabs.length - 1) % tabs.length);
    });
  });

  function renderNiches() {
    $('niche-choices').replaceChildren(...NICHES.map(([value, key]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'k-choice';
      button.textContent = text(key);
      button.setAttribute('aria-pressed', String(niche === value));
      button.addEventListener('click', () => { niche = value; $('niche-error').hidden = true; renderNiches(); });
      return button;
    }));
  }

  function renderReview() {
    const nicheKey = NICHES.find(([value]) => value === niche)?.[1];
    const style = form.languageStyle.selectedOptions[0].textContent;
    const rows = [text('reviewNiche', [nicheKey ? text(nicheKey) : niche]), text('reviewTimezone', [form.timezone.selectedOptions[0].textContent]), text('reviewStyle', [style])];
    $('review').replaceChildren(...rows.map((row) => Object.assign(document.createElement('dd'), { textContent: row })));
  }

  function showStep(index) {
    step = index;
    steps.forEach((el, i) => { el.hidden = i !== index; });
    if (index === 2) renderReview();
    steps[index].querySelector('button, select')?.focus();
  }

  form.addEventListener('click', (event) => {
    if (event.target.closest('[data-prev]')) return showStep(step - 1);
    if (!event.target.closest('[data-next]')) return;
    if (step === 0 && !niche) {
      $('niche-error').textContent = text('requiredField');
      $('niche-error').hidden = false;
      return;
    }
    showStep(step + 1);
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    await chrome.storage.sync.set({ niche, timezone: form.timezone.value, languageStyle: form.languageStyle.value, onboarded: true });
    status('onboardingCompleted');
  });

  $('settings-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const theme = $('theme').value;
    await chrome.storage.sync.set({ videoPanelEnabled: $('videoPanelEnabled').checked, searchCardEnabled: $('searchCardEnabled').checked, theme });
    applyTheme(theme);
    status('settingsSaved');
  });

  $('delete-account').addEventListener('click', async (event) => {
    if (!window.confirm(text('deleteAccountConfirm'))) return;
    const button = event.currentTarget;
    button.disabled = true;
    try {
      await K.callAPI('/api/auth/account', { method: 'DELETE' });
      await K.setToken(null);
      await chrome.storage.sync.clear();
      status('deleteAccountSuccess');
    } catch (_) {
      status('deleteAccountError');
    } finally {
      button.disabled = false;
    }
  });

  async function load() {
    const s = await chrome.storage.sync.get({ niche: '', timezone: 'Asia/Jakarta', languageStyle: 'casual', videoPanelEnabled: true, searchCardEnabled: true, theme: 'system' });
    niche = s.niche;
    form.timezone.value = s.timezone;
    form.languageStyle.value = s.languageStyle;
    $('videoPanelEnabled').checked = s.videoPanelEnabled;
    $('searchCardEnabled').checked = s.searchCardEnabled;
    $('theme').value = s.theme;
    applyTheme(s.theme);
    renderNiches();
  }

  load();
})();