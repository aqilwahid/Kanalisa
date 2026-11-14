(function () {
  const K = globalThis.Kanalisa;
  const text = (key, substitutions) => chrome.i18n.getMessage(key, substitutions) || key;
  const $ = (id) => document.getElementById(id);

  function localize() {
    document.querySelectorAll('[data-i18n]').forEach((element) => {
      element.textContent = text(element.dataset.i18n);
    });
  }

  // Fase 2: login dummy tersimpan lokal, tanpa backend.
  function render(connected) {
    const user = K.mockUser;
    $('auth-status').textContent = connected ? text('connectedAs', [user.email]) : text('notSignedIn');
    $('ai-credits').textContent = connected ? `${user.credits.remaining} / ${user.credits.limit}` : '0 / 0';
    $('keyword-quota').textContent = connected ? `${user.keywordQuota.used} / ${user.keywordQuota.limit}` : '0 / 0';
    $('login-toggle').textContent = text(connected ? 'signOutDummy' : 'loginPlaceholder');
    $('login-toggle').dataset.connected = String(connected);
  }

  $('login-toggle').addEventListener('click', async () => {
    const connected = $('login-toggle').dataset.connected !== 'true';
    await chrome.storage.local.set({ dummyLogin: connected });
    render(connected);
  });

  $('search-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const query = $('search-input').value.trim();
    if (!query) return;
    await chrome.tabs.create({ url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}` });
    window.close();
  });

  localize();
  chrome.storage.local.get({ dummyLogin: false }).then(({ dummyLogin }) => render(dummyLogin));
})();