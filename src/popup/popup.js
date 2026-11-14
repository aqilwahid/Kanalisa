(function () {
  const K = globalThis.Kanalisa;
  const text = (key, substitutions) => chrome.i18n.getMessage(key, substitutions) || key;

  function localize() {
    document.querySelectorAll('[data-i18n]').forEach((element) => {
      element.textContent = text(element.dataset.i18n);
    });
  }

  async function loadStatus() {
    const state = document.getElementById('state');
    const stored = await chrome.storage.local.get(['authToken', 'user']);
    const sync = await chrome.storage.sync.get(['keywordQuotaUsed']);
    const loggedIn = Boolean(stored.authToken);
    document.getElementById('auth-status').textContent = text(loggedIn ? 'signedIn' : 'notSignedIn');
    document.getElementById('keyword-quota').textContent = `${sync.keywordQuotaUsed || 0} / 3`;

    if (!loggedIn) {
      document.getElementById('ai-credits').textContent = '0 / 50';
      state.textContent = '';
      return;
    }

    try {
      const credits = await K.apiRequest('/api/ai/credits');
      document.getElementById('ai-credits').textContent = `${credits.remaining} / ${credits.limit}`;
      state.textContent = '';
    } catch (_) {
      document.getElementById('ai-credits').textContent = text('unknown');
      state.textContent = text('error');
    }
  }

  document.getElementById('search-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const query = document.getElementById('search-input').value.trim();
    if (!query) return;
    await chrome.tabs.create({ url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}` });
    window.close();
  });

  localize();
  loadStatus();
})();
