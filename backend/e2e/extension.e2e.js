import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { chromium, expect, test as base } from '@playwright/test';

const extensionPath = fileURLToPath(new URL('../../src', import.meta.url));
const youtube = 'https://www.youtube.com';
const studio = 'https://studio.youtube.com';
const watchUrl = `${youtube}/watch?v=dQw4w9WgXcQ`;
const resultsUrl = `${youtube}/results?search_query=ayam%20geprek`;

const test = base.extend({
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      locale: 'id-ID',
      args: [
        '--lang=id',
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });
    try {
      await context.route(`${youtube}/**`, (route) => route.fulfill({
        contentType: 'text/html',
        body: '<!doctype html><title>YouTube fixture</title><div id="secondary-inner"></div><ytd-search><div id="contents"></div></ytd-search>',
      }));
      await use(context);
    } finally {
      await context.close();
    }
  },
  extensionUrl: async ({ context }, use) => {
    const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
    await use(`chrome-extension://${new URL(worker.url()).host}`);
  },
});

let server;

test.beforeAll(async () => {
  Object.assign(process.env, {
    NODE_ENV: 'test',
    YOUTUBE_API_KEY: '',
    GOOGLE_CLIENT_ID: '',
    GOOGLE_CLIENT_SECRET: '',
    LLM_API_KEY: '',
    DATABASE_URL: '',
    REDIS_URL: '',
    PAYMENT_GATEWAY_WEBHOOK_SECRET: '',
  });
  const { default: app } = await import('../src/index.js');
  server = app.listen(3000, 'localhost');
  await once(server, 'listening');
});

test.afterAll(async () => {
  if (server?.listening) await new Promise((resolve) => server.close(resolve));
});

test('navigates from the video overlay to keyword results and back', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: youtube });
  await page.goto(watchUrl);
  const panel = page.locator('#secondary-inner > #kanalisa-watch-panel');
  const score = panel.locator('.kanalisa-score');
  await expect(score).toBeVisible();
  expect(Number(await score.textContent())).toBeGreaterThan(0);
  await expect(panel.getByText('125 rb', { exact: true })).toBeVisible();
  await expect(panel.getByText('Tingkat interaksi', { exact: true })).toBeVisible();
  await expect(panel.getByText('Tayangan per jam (TPJ)').locator('..').locator('dd')).toHaveText(/\d/);
  await panel.getByRole('tab', { name: 'Tag' }).click();
  await panel.getByRole('button', { name: 'Salin semua' }).click();
  await expect(panel.getByRole('button', { name: 'Tersalin' })).toBeVisible();
  await panel.getByRole('tab', { name: 'Tag' }).press('ArrowRight');
  await expect(panel.getByRole('tab', { name: 'SEO' })).toBeFocused();
  await expect(panel.getByRole('tabpanel', { name: 'SEO' }).getByRole('listitem')).toHaveCount(7);
  await panel.getByRole('button', { name: 'Ciutkan panel' }).click();
  await expect(score).toBeHidden();

  await page.evaluate((url) => {
    history.pushState(null, '', url);
    document.dispatchEvent(new Event('yt-navigate-finish'));
  }, resultsUrl);
  await expect(panel).toHaveCount(0);
  const card = page.locator('ytd-search #contents > #kanalisa-results-card');
  await expect(card.getByRole('heading', { name: 'ayam geprek', exact: true })).toBeVisible();
  await expect(card.locator('dd')).toHaveText(['78 / 100', '64 / 100', '28 / 100']);
  await expect(card.getByRole('button')).toHaveCount(5);
  await card.getByRole('button', { name: 'ayam geprek sambal matah' }).click();
  await expect(card.getByRole('heading', { name: 'ayam geprek sambal matah', exact: true })).toBeVisible();

  await page.goto(watchUrl);
  await expect(panel.getByRole('button', { name: 'Buka panel' })).toBeVisible();
  await expect(score).toBeHidden();
  await panel.getByRole('button', { name: 'Buka panel' }).click();
  await expect(score).toBeVisible();
});

test('batches TPJ for nearby home cards and updates recycled cards', async ({ page, context }) => {
  await context.route(`${youtube}/`, (route) => route.fulfill({
    contentType: 'text/html',
    body: `<!doctype html><title>YouTube fixture</title>
      <style>ytd-rich-item-renderer { display: block; }</style>
      <ytd-rich-item-renderer id="first">
        <a href="/watch?v=dQw4w9WgXcQ">Video pertama</a>
        <div class="yt-lockup-metadata-view-model__text-container"></div>
      </ytd-rich-item-renderer>
      <ytd-rich-item-renderer id="second">
        <a href="/watch?v=dQw4w9WgXcQ">Video duplikat</a><div id="meta"></div>
      </ytd-rich-item-renderer>
      <ytd-rich-item-renderer id="third">
        <a href="/watch?v=abcdefghijk">Video lain</a><div id="details"></div>
      </ytd-rich-item-renderer>
      <ytd-rich-item-renderer id="below" style="margin-top: 1600px">
        <a href="/shorts/lmnopqrstuv">Shorts</a><div id="details"></div>
      </ytd-rich-item-renderer>`,
  }));
  const batches = [];
  context.on('request', (request) => {
    if (request.url().endsWith('/api/video/batch?metrics=true')) batches.push(request.postDataJSON().ids);
  });

  await page.goto(`${youtube}/`);
  const badges = page.locator('.kanalisa-feed-metric');
  await expect(badges).toHaveCount(3);
  await expect(page.locator('#first .kanalisa-feed-metric')).toContainText('TPJ');
  await expect(page.locator('#first .kanalisa-feed-metric')).toContainText('Data contoh');
  await expect(page.locator('#first .kanalisa-feed-metric img')).toHaveJSProperty('naturalWidth', 32);
  expect(batches).toEqual([['dQw4w9WgXcQ', 'abcdefghijk']]);

  await page.locator('#first a').evaluate((link) => { link.href = '/watch?v=abcdefghijk'; });
  await expect(page.locator('#first .kanalisa-feed-metric')).toHaveAttribute('data-video-id', 'abcdefghijk');
  expect(batches).toHaveLength(1);
  await page.locator('#below a').scrollIntoViewIfNeeded();
  await expect(page.locator('#below .kanalisa-feed-metric')).toContainText('TPJ');
  expect(batches).toEqual([['dQw4w9WgXcQ', 'abcdefghijk'], ['lmnopqrstuv']]);
});

test('updates the local SEO score in the Studio upload and edit forms', async ({ page, context }) => {
  const metadata = `
    <div id="title-textarea"><div id="textbox" contenteditable="true" aria-label="Judul">2026 11 12</div></div>
    <div id="description-textarea"><div id="textbox" contenteditable="true" aria-label="Deskripsi"></div></div>
    <div id="tags-container" hidden></div>`;
  await context.route(`${studio}/**`, (route) => {
    const editorTag = new URL(route.request().url()).pathname.startsWith('/video/') ? 'ytcp-video-metadata-editor' : 'ytcp-uploads-dialog';
    return route.fulfill({
      contentType: 'text/html',
      body: `<!doctype html><html dark><title>Studio fixture</title>
        <style>
          body { background: #242424; color: #fff; font: 16px sans-serif; }
          [contenteditable] { box-sizing: border-box; border: 1px solid #777; padding: 8px; min-height: 42px; }
          #editor { max-width: 640px; margin: 0 auto; }
        </style>
        <main id="editor"><${editorTag}><div id="details-step">${metadata}</div></${editorTag}></main>`,
    });
  });
  const backendRequests = [];
  context.on('request', (request) => {
    if (request.url().startsWith('http://localhost:3000/')) backendRequests.push(request.url());
  });

  await page.setViewportSize({ width: 400, height: 800 });
  await page.goto(`${studio}/channel/example/videos/upload`);
  const panel = page.getByRole('region', { name: 'Skor SEO Kanalisa' });
  const score = panel.locator('output');
  await expect(score).toHaveText('0 / 100');
  await expect(panel).toContainText('Skor sementara');
  const checklist = panel.getByText('Pemeriksaan SEO', { exact: true });
  await checklist.focus();
  await checklist.press('Enter');
  await expect(panel.getByRole('listitem')).toHaveCount(7);
  await expect(panel.getByText('Belum dinilai')).toHaveCount(2);

  const title = 'Tutorial CapCut untuk pemula dengan langkah sederhana';
  const description = 'Tutorial CapCut membantu pemula membuat video dari nol. Mulai dengan mengatur klip, menambahkan transisi, dan memeriksa hasil ekspor dengan panduan ini. 00:00 https://example.com #CapCut';
  await page.locator('#title-textarea #textbox').fill(title);
  await page.locator('#description-textarea #textbox').fill(description);
  await expect(score).toHaveText('85 / 100');
  await page.locator('#tags-container').evaluate((element) => {
    element.hidden = false;
    for (const name of ['capcut', 'pemula', 'tutorial', 'video', 'edit']) {
      const chip = document.createElement('ytcp-chip');
      chip.textContent = name;
      element.append(chip, ' ');
    }
  });
  await expect(score).toHaveText('100 / 100');
  await expect(panel.getByText('Belum dinilai')).toHaveCount(0);
  await expect(page.locator('#title-textarea #textbox')).toHaveText(title);
  await expect(page.locator('#description-textarea #textbox')).toHaveText(description);
  const { scrollWidth, clientWidth } = await page.evaluate(() => document.documentElement);
  expect(scrollWidth).toBe(clientWidth);
  await page.locator('ytcp-chip').last().evaluate((element) => element.remove());
  await expect(score).toHaveText('85 / 100');
  await page.locator('#details-step').evaluate((element) => { element.style.display = 'none'; });
  await expect(panel).toHaveCount(0);

  await page.goto(`${studio}/video/dQw4w9WgXcQ/edit`);
  await expect(score).toHaveText('0 / 100');
  expect(backendRequests).toEqual([]);
});

test('completes onboarding and restores preferences after reload', async ({ page, extensionUrl }) => {
  await page.goto(`${extensionUrl}/options/options.html`);
  await page.getByRole('button', { name: 'Kuliner' }).click();
  await page.getByRole('button', { name: 'Lanjut' }).click();
  await page.locator('#timezone').selectOption('Asia/Makassar');
  await page.locator('#languageStyle').selectOption('formal');
  await page.getByRole('button', { name: 'Lanjut' }).click();
  await expect(page.locator('#review')).toContainText('WITA');
  await page.getByRole('button', { name: 'Selesai' }).click();
  await expect(page.getByRole('status')).toContainText('Onboarding selesai');

  await page.getByRole('tab', { name: 'Onboarding' }).press('ArrowRight');
  await page.locator('#videoPanelEnabled').uncheck();
  await page.locator('#theme').selectOption('dark');
  await page.getByRole('button', { name: 'Simpan pengaturan' }).click();
  await expect(page.getByRole('status')).toHaveText('Pengaturan tersimpan.');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('tab', { name: 'Pengaturan' }).click();
  await expect(page.locator('#videoPanelEnabled')).not.toBeChecked();
  await page.getByRole('tab', { name: 'Onboarding' }).click();
  await page.getByRole('button', { name: 'Lanjut' }).click();
  await expect(page.locator('#timezone')).toHaveValue('Asia/Makassar');
  await expect(page.locator('#languageStyle')).toHaveValue('formal');
});

test('researches a keyword from the popup and shows the daily quota', async ({ page, context, extensionUrl }) => {
  await page.setViewportSize({ width: 320, height: 600 });
  await page.goto(`${extensionUrl}/popup/popup.html`);
  await expect(page.locator('#auth-status')).toHaveText('Belum masuk');
  await page.getByRole('button', { name: 'Login dengan Google' }).click();
  await expect(page.locator('#auth-status')).toHaveText('Terkoneksi sebagai test@example.com');
  await expect(page.locator('#ai-credits')).toHaveText('50 / 50');
  await expect(page.locator('#keyword-quota')).toHaveText('0 / 3');

  const input = page.getByRole('searchbox', { name: 'Riset kata kunci' });
  await input.fill(' ayam geprek ');
  const keywordApi = '**/api/keyword/search?*';
  await page.route(keywordApi, (route) => route.abort());
  await input.press('Enter');
  await expect(page.getByRole('alert')).toHaveText('Hasil riset gagal dimuat. Coba lagi.');
  await expect(page.locator('#keyword-result')).toBeHidden();
  await page.unroute(keywordApi);
  await input.press('Enter');
  await expect(page.locator('#keyword-result dd')).toHaveText(['78 / 100', '64 / 100', '28 / 100']);
  await expect(page.locator('#keyword-result li')).toHaveCount(5);
  await expect(page.locator('#keyword-result')).toContainText('Data contoh');
  await expect(page.locator('#keyword-result')).toContainText('Peluang rendah');
  expect(context.pages().some((tab) => tab.url().startsWith(youtube))).toBe(false);
  await expect(page.locator('#keyword-quota')).toHaveText('1 / 3');

  for (const query of ['capcut', 'teknologi'.repeat(20)]) {
    await input.fill(query);
    await input.press('Enter');
    await expect(page.getByRole('heading', { name: query, exact: true })).toBeVisible();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
  await expect(page.locator('#keyword-quota')).toHaveText('3 / 3');
  await input.fill('resep masakan');
  await input.press('Enter');
  await expect(page.getByRole('alert')).toContainText('Batas kuota harian');
  await expect(page.locator('#keyword-result')).toBeHidden();
  await page.reload();
  await expect(page.locator('#keyword-quota')).toHaveText('3 / 3');
  await input.fill('ayam geprek');
  const newTab = context.waitForEvent('page');
  await page.getByRole('link', { name: 'Cari di YouTube' }).click();
  await expect(await newTab).toHaveURL(resultsUrl);
});

if (process.env.KANALISA_YOUTUBE_LIVE === '1') {
  test('mounts the extension on live YouTube video and search pages', async ({ page, context }) => {
    await context.unroute(`${youtube}/**`);
    await page.goto(watchUrl, { waitUntil: 'domcontentloaded', timeout: 20_000 });
    await expect(page.locator('#kanalisa-watch-panel .kanalisa-score')).toBeVisible({ timeout: 10_000 });
    await page.goto(resultsUrl, { waitUntil: 'domcontentloaded', timeout: 20_000 });
    await expect(page.locator('#kanalisa-results-card').getByRole('heading', { name: 'ayam geprek', exact: true })).toBeVisible({ timeout: 10_000 });
  });
}
