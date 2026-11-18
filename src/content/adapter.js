(function (root, factory) {
  const exports = factory();
  if (typeof module === 'object' && module.exports) module.exports = exports;
  else root.Kanalisa = Object.assign(root.Kanalisa || {}, exports);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  /**
   * Centralized DOM selectors for YouTube desktop and YouTube Studio.
   * NOTE: Selectors can be updated at runtime via remote configuration
   * stored in chrome.storage.local ('remoteConfig:selectors') without
   * requiring an extension release, mitigating YouTube DOM updates.
   */
  const DEFAULT_SELECTORS = Object.freeze({
    home: {
      videoCard: 'ytd-rich-item-renderer',
      videoLink: 'a[href^="/watch?"], a[href^="/shorts/"], a[href^="https://www.youtube.com/watch?"], a[href^="https://www.youtube.com/shorts/"]',
      videoMetadata: '.yt-lockup-metadata-view-model__text-container, .yt-lockup-metadata-view-model__metadata, #meta, #details',
    },
    watch: {
      secondaryColumn: '#secondary-inner, #secondary, ytd-watch-next-secondary-results-renderer',
      primaryColumn: '#primary-inner, #primary',
      videoPlayer: 'video.html5-main-video, .video-stream.html5-main-video',
      title: 'h1.ytd-watch-metadata yt-formatted-string, #title h1 yt-formatted-string, h1.title',
      channelName: '#owner ytd-channel-name a, ytd-channel-name a, #channel-name a',
      channelSubscribers: '#owner-sub-count, yt-formatted-string#owner-sub-count',
      viewCount: '#info ytd-video-view-count-renderer, ytd-watch-info-text #info span:first-child',
      likeButton: 'like-button-view-model button, #top-level-buttons-computed ytd-toggle-button-renderer:first-child button',
      description: '#description-inline-expander, ytd-text-inline-expander#description-inline-expander',
      commentsHeader: '#comments #header',
    },
    results: {
      contentsContainer: 'ytd-search #contents.ytd-section-list-renderer, ytd-search #contents',
      itemSection: 'ytd-item-section-renderer #contents',
      videoRenderer: 'ytd-video-renderer',
      videoTitle: '#video-title',
      searchInput: 'input#search, ytd-searchbox input',
    },
    channel: {
      header: 'ytd-channel-header-renderer, ytd-c4-tabbed-header-renderer',
      tabs: '#tabs-container, ytd-tabbed-header-renderer',
    },
    studio: {
      uploadDialog: 'ytcp-uploads-dialog',
      metadataEditor: 'ytcp-video-metadata-editor, ytcp-video-details',
      titleInput: '#title-textarea #textbox, #title-textarea textarea, #textbox[aria-label*="title" i], #textbox[aria-label*="judul" i]',
      titleField: '#title-textarea, #title-wrapper, ytcp-social-suggestions-textbox',
      descriptionInput: '#description-textarea #textbox, #description-textarea textarea, #textbox[aria-label*="description" i], #textbox[aria-label*="deskripsi" i]',
      tagsContainer: '#tags-container, ytcp-chip-bar, ytcp-video-metadata-tag-editor',
      tagChip: 'ytcp-chip, ytcp-tag-chip, [data-tag-chip]',
      tagText: '#chip-text, #text, .chip-text',
    },
  });

  let activeSelectors = { ...DEFAULT_SELECTORS };

  /**
   * Loads remote configuration overrides from storage.
   */
  async function syncRemoteSelectors() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const stored = await chrome.storage.local.get('remoteConfig:selectors');
        if (stored && stored['remoteConfig:selectors']) {
          activeSelectors = {
            home: { ...DEFAULT_SELECTORS.home, ...stored['remoteConfig:selectors'].home },
            watch: { ...DEFAULT_SELECTORS.watch, ...stored['remoteConfig:selectors'].watch },
            results: { ...DEFAULT_SELECTORS.results, ...stored['remoteConfig:selectors'].results },
            channel: { ...DEFAULT_SELECTORS.channel, ...stored['remoteConfig:selectors'].channel },
            studio: { ...DEFAULT_SELECTORS.studio, ...stored['remoteConfig:selectors'].studio },
          };
        }
      }
    } catch (_) {
      // Fallback silently to default selectors
    }
    return activeSelectors;
  }

  function getSelector(page, key) {
    return (activeSelectors[page] && activeSelectors[page][key]) || (DEFAULT_SELECTORS[page] && DEFAULT_SELECTORS[page][key]);
  }

  function queryElement(page, key, root = document) {
    const selector = getSelector(page, key);
    return selector ? root.querySelector(selector) : null;
  }

  function queryAll(page, key, root = document) {
    const selector = getSelector(page, key);
    return selector ? Array.from(root.querySelectorAll(selector)) : [];
  }

  function extractVideoId(urlOrSearch = window.location.href) {
    try {
      const parsed = new URL(urlOrSearch, window.location.origin);
      if (parsed.pathname === '/watch') {
        return parsed.searchParams.get('v');
      }
      const shortsMatch = parsed.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
      if (shortsMatch) {
        return shortsMatch[1];
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  function extractSearchQuery(urlOrSearch = window.location.href) {
    try {
      const parsed = new URL(urlOrSearch, window.location.origin);
      if (parsed.pathname === '/results') {
        return parsed.searchParams.get('search_query') || '';
      }
      return '';
    } catch (_) {
      return '';
    }
  }

  function parseIndonesianNumber(text) {
    if (!text) return 0;
    const clean = text.trim().replace(/\./g, '').replace(',', '.');
    const match = clean.match(/([\d.]+)\s*(rb|jt|miliar|m)?/i);
    if (!match) return 0;
    const base = parseFloat(match[1]);
    const unit = (match[2] || '').toLowerCase();
    if (unit === 'rb') return Math.round(base * 1000);
    if (unit === 'jt') return Math.round(base * 1000000);
    if (unit === 'm' || unit === 'miliar') return Math.round(base * 1000000000);
    return Math.round(base);
  }

  function extractTagsFromDOM() {
    const metaTags = Array.from(document.querySelectorAll('meta[property="og:video:tag"]'))
      .map(el => el.getAttribute('content'))
      .filter(Boolean);
    if (metaTags.length > 0) return metaTags;

    const keywordsMeta = document.querySelector('meta[name="keywords"]');
    if (keywordsMeta && keywordsMeta.content) {
      return keywordsMeta.content.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
  }

  // Content-script fetch is bound by youtube.com CORS, so API calls go through the service worker.
  async function bgApi(path, options) {
    const reply = await chrome.runtime.sendMessage({ type: 'api', path, options });
    if (!reply || reply.error) throw new Error(reply?.error || 'api');
    return reply.data;
  }

  // Shadow DOM isolates panel CSS from YouTube's styles (PRD §9.1).
  function createShadowHost(id, tag = 'aside', styles = ['styles/base.css', 'styles/panel.css']) {
    let host = id ? document.getElementById(id) : null;
    if (host) return { host, shadow: host.shadowRoot, created: false };
    host = document.createElement(tag);
    if (id) host.id = id;
    const shadow = host.attachShadow({ mode: 'open' });
    for (const file of styles) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = chrome.runtime.getURL(file);
      shadow.appendChild(link);
    }
    const body = document.createElement('div');
    body.className = 'kanalisa-root';
    shadow.appendChild(body);
    return { host, shadow, created: true };
  }

  return {
    bgApi,
    createShadowHost,
    DEFAULT_SELECTORS,
    syncRemoteSelectors,
    getSelector,
    queryElement,
    queryAll,
    extractVideoId,
    extractSearchQuery,
    parseIndonesianNumber,
    extractTagsFromDOM,
  };
});
