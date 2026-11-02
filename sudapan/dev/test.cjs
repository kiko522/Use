// 用法：node dev/test.cjs  —— 用 Playwright 在手机尺寸下跑一遍主要流程并截图
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const dir = __dirname;
const html = 'file://' + path.join(dir, '..', 'index.html');
const outDir = process.argv[2] || path.join(dir, 'shots');
fs.mkdirSync(outDir, { recursive: true });
const mock = fs.readFileSync(path.join(dir, 'mock-nuo.js'), 'utf8');
const errors = [];
(async () => {
const browser = await chromium.launch();
for (const scheme of ['light', 'dark']) {
  const page = await browser.newPage({ viewport: { width: 390, height: 780 }, colorScheme: scheme, deviceScaleFactor: 2 });
  page.on('pageerror', (e) => errors.push(scheme + ': ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(scheme + ' console: ' + m.text()); });
  page.on('request', (r) => { if (!r.url().startsWith('file:') && !r.url().startsWith('data:')) errors.push('external request: ' + r.url()); });
  await page.addInitScript(mock);
  await page.goto(html);
  await page.waitForTimeout(800);
  const shot = (n) => page.screenshot({ path: path.join(outDir, `${scheme}-${n}.png`) });
  await shot('1-empty-or-inbox');
  await page.click('button[aria-label="刷新"]');
  await page.waitForTimeout(1500);
  await shot('2-hot');
  await page.click('.tab:nth-child(3)'); // 영화·드라마
  await page.click('button[aria-label="刷新"]');
  await page.waitForTimeout(1500);
  await page.click('.tab:nth-child(6)'); // 심야
  await page.waitForTimeout(300);
  await shot('3-night');
  await page.click('.tab:nth-child(2)');
  await page.click('.row >> nth=0');
  await page.waitForTimeout(1200);
  await shot('4-post');
  await page.click('.c-actions button >> nth=0');
  await page.fill('#cInput', '我也是这样的！');
  await page.click('.send');
  await page.waitForTimeout(1800);
  await shot('5-commented');
  await page.click('button[aria-label="分享到聊天"]');
  await page.waitForTimeout(300);
  await page.click('button[aria-label="返回"]');
  await page.click('button[aria-label="发帖"]');
  await page.fill('#wTitle', '今天好累');
  await page.fill('#wBody', '上了一整天班');
  await shot('6-write');
  await page.click('.topbar .text-btn');
  await page.waitForTimeout(1800);
  await shot('7-mypost');
  await page.click('button[aria-label="返回"]');
  await page.click('button[aria-label="设置"]');
  await page.waitForTimeout(300);
  await shot('8-settings');
  const info = await page.evaluate(() => ({ feed: window.__lastFeed && window.__lastFeed.items.map((i) => i.id + (i.chars ? ' chars' : '') + (i.notChars ? ' notChars' : '')), ack: window.__lastAck, card: !!window.__lastCard, w: document.documentElement.scrollWidth }));
  console.log(scheme, JSON.stringify(info));
  await page.close();
}
await browser.close();
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no errors');
})();
