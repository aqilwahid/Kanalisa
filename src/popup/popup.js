(function () {
  const K = globalThis.Kanalisa;
  const text = (key, substitutions) => chrome.i18n.getMessage(key, substitutions) || key;
  const $ = (id) => document.getElementById(id);

  function localize() {
    document.querySelectorAll('[data-i18n]').forEach((element) => {
      element.textContent = text(element.dataset.i18n);
    });
  }

  function setState(key) {
    const state = $('state');
    state.textContent = key ? text(key) : '';
    state.setAttribute('role', key === 'authFailed' || key === 'fetchVideoError' ? 'alert' : 'status');
  }

  function render(user, credits) {
    const connected = Boolean(user);
    $('auth-status').textContent = connected ? text('connectedAs', [user.email]) : text('notSignedIn');
    $('ai-credits').textContent = connected && credits ? `${credits.remaining} / ${credits.limit}` : text('unknown');
    $('keyword-quota').textContent = connected && user.keywordQuota != null ? `${user.keywordQuotaUsed || 0} / ${user.keywordQuota}` : text('unknown');
    $('login-toggle').textContent = text(connected ? 'signOutDummy' : 'googleSignIn');
    $('login-toggle').dataset.connected = String(connected);
  }

  async function loadAccount() {
    if (!(await K.getToken())) return render(null);
    setState('loading');
    try {
      const [{ user }, credits] = await Promise.all([K.apiRequest('/api/auth/me'), K.apiRequest('/api/ai/credits')]);
      const { keywordQuotaUsed = 0 } = await chrome.storage.sync.get('keywordQuotaUsed');
      render({ ...user, keywordQuotaUsed }, credits);
      setState('');
    } catch (_) {
      render(null);
      setState(await K.getToken() ? 'fetchVideoError' : '');
    }
  }

  async function signIn() {
    const { googleClientId } = await chrome.storage.sync.get({ googleClientId: '' });
    if (!googleClientId) {
      // dev: backend mode mock menerima credential apa pun
      const { token } = await K.apiRequest('/api/auth/google', { method: 'POST', auth: false, body: { credential: 'dev-mock' } });
      return K.setToken(token);
    }
    const redirectUri = chrome.identity.getRedirectURL();
    const params = new URLSearchParams({
      client_id: googleClientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account',
    });
    const redirect = await chrome.identity.launchWebAuthFlow({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}`, interactive: true });
    const code = new URL(redirect).searchParams.get('code');
    if (!code) throw new Error('no code');
    const { token } = await K.apiRequest('/api/auth/google', { method: 'POST', auth: false, body: { code, credential: code, redirectUri } });
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
        setState('authenticating');
        await signIn();
        await loadAccount();
      }
    } catch (_) {
      setState('authFailed');
    } finally {
      button.disabled = false;
    }
  });

  $('search-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const query = $('search-input').value.trim();
    if (!query) return;
    await chrome.tabs.create({ url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}` });
    window.close();
  });

  chrome.storage.sync.get({ theme: 'system' }).then(({ theme }) => { if (theme !== 'system') document.documentElement.dataset.theme = theme; });
  localize();
  loadAccount();
})();