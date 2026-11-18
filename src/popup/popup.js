(function () {
  const K = globalThis.Kanalisa;
  const text = (key, substitutions) => chrome.i18n.getMessage(key, substitutions) || key;
  const $ = (id) => document.getElementById(id);
  const searchInput = $('search-input');
  const searchButton = $('search-submit');
  const youtubeLink = $('search-youtube');

  function localize() {
    document.querySelectorAll('[data-i18n]').forEach((element) => {
      element.textContent = text(element.dataset.i18n);
    });
  }

  function setState(message, isError = false) {
    const state = $('state');
    state.textContent = message || '';
    state.setAttribute('role', isError ? 'alert' : 'status');
    state.style.color = isError ? 'var(--k-bad, #c00)' : 'var(--k-muted, #666)';
  }

  function render(user, credits) {
    const connected = Boolean(user);
    $('auth-status').textContent = connected ? text('connectedAs', [user.email]) : text('notSignedIn');
    $('ai-credits').textContent = connected && credits ? `${credits.remaining} / ${credits.limit}` : text('unknown');
    renderKeywordUsage(user?.keywordUsage);
    $('login-toggle').textContent = text(connected ? 'signOutDummy' : 'googleSignIn');
    $('login-toggle').dataset.connected = String(connected);
  }

  function renderKeywordUsage(usage) {
    let label = text('unknown');
    if (usage) label = usage.limit === null ? text('unlimitedQuota') : `${usage.used} / ${usage.limit}`;
    $('keyword-quota').textContent = label;
  }

  async function loadAccount() {
    const token = await K.getToken();
    if (!token) return render(null);

    setState(text('loading'));
    try {
      const [{ user }, credits] = await Promise.all([
        K.apiRequest('/api/auth/me'),
        K.apiRequest('/api/ai/credits'),
      ]);
      render(user, credits);
      setState('');
    } catch (err) {
      console.warn('[Kanalisa] loadAccount failed:', err.message);
      render(null);
      setState(err.status === 0 ? 'Backend tidak aktif (http://localhost:3000)' : text('fetchVideoError'), true);
    }
  }

  async function signIn() {
    // Cek konfigurasi auth dari backend terlebih dahulu
    let serverClientId = '';
    let isMockMode = false;
    try {
      const configRes = await K.apiRequest('/api/auth/config', { auth: false });
      serverClientId = configRes?.googleClientId || '';
      isMockMode = configRes?.authMode === 'mock';
    } catch (_) {
      // Jika backend tidak bisa diakses, tetap biarkan error tertangani di luar
    }

    const { googleClientId: storedClientId = '' } = await chrome.storage.sync.get('googleClientId');
    const clientId = storedClientId || serverClientId;

    if (isMockMode || !clientId) {
      // Mode development/mock: login otomatis menggunakan akun uji coba
      const { token } = await K.apiRequest('/api/auth/google', {
        method: 'POST',
        auth: false,
        body: { credential: 'dev-mock' },
      });
      return K.setToken(token);
    }

    // Mode live: Google OAuth flow via launchWebAuthFlow
    const redirectUri = chrome.identity.getRedirectURL();
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account',
    });

    const redirect = await chrome.identity.launchWebAuthFlow({
      url: `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
      interactive: true,
    });

    const code = new URL(redirect).searchParams.get('code');
    if (!code) throw new Error('Tidak ada kode autentikasi dari Google');

    const { token } = await K.apiRequest('/api/auth/google', {
      method: 'POST',
      auth: false,
      body: { code, redirectUri },
    });
    await K.setToken(token);
  }

  $('login-toggle').addEventListener('click', async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      if (button.dataset.connected === 'true') {
        await K.setToken(null);
        render(null);
        setState('');
      } else {
        setState(text('authenticating'));
        await signIn();
        await loadAccount();
        setState(text('loginSuccess'));
        setTimeout(() => setState(''), 2000);
      }
    } catch (err) {
      console.error('[Kanalisa] Login error:', err);
      setState(err.message || text('authFailed'), true);
    } finally {
      button.disabled = false;
    }
  });

  function renderKeywordResult(query, data) {
    $('keyword-query').textContent = query;
    $('keyword-volume').textContent = `${data.volumeRelative} / 100`;
    $('keyword-competition').textContent = `${data.competition} / 100`;
    $('keyword-opportunity').textContent = `${data.opportunityScore} / 100`;
    $('keyword-level').textContent = text(`${K.getKeywordOpportunityLevel(data.opportunityScore)}Opportunity`);

    const related = (data.relatedKeywords || []).map(({ keyword }) => {
      const item = document.createElement('li');
      item.textContent = keyword;
      return item;
    });
    $('keyword-related-list').replaceChildren(...related);
    $('keyword-related').hidden = related.length === 0;
    $('keyword-mock').hidden = !data.isMock;
    $('keyword-result').hidden = false;
  }

  function updateYoutubeLink() {
    const query = searchInput.value.trim();
    youtubeLink.hidden = !query;
    if (query) youtubeLink.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  }

  searchInput.addEventListener('input', updateYoutubeLink);
  updateYoutubeLink();

  $('search-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const query = searchInput.value.trim();
    if (!query || searchButton.disabled) return;

    searchButton.disabled = true;
    $('keyword-result').hidden = true;
    $('keyword-state').textContent = text('keywordSearchLoading');
    $('keyword-error').textContent = '';
    try {
      const token = await K.getToken();
      const data = await K.apiRequest(`/api/keyword/search?q=${encodeURIComponent(query)}`);
      renderKeywordResult(query, data);
      if (token && data.keywordUsage && token === await K.getToken()) renderKeywordUsage(data.keywordUsage);
    } catch (error) {
      $('keyword-error').textContent = error.status === 429 ? text('keywordQuotaExceeded') : text('keywordSearchError');
    } finally {
      $('keyword-state').textContent = '';
      searchButton.disabled = false;
    }
  });

  chrome.storage.sync.get({ theme: 'system' }).then(({ theme }) => {
    if (theme !== 'system') document.documentElement.dataset.theme = theme;
  });

  localize();
  loadAccount();
})();
