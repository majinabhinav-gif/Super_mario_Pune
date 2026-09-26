// Headless smoke test: loads the game, visits every level and fails on any script error.
// Usage: node tools/smoke-test.js [screenshot-dir]
// Needs Playwright (npm i -D playwright, or a global install on NODE_PATH).
const path = require('path');
const { chromium } = require('playwright');

const outDir = process.argv[2];
const root = path.resolve(__dirname, '..');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message + '\n' + e.stack));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|net::/.test(m.text())) errors.push('console: ' + m.text());
  });
  await page.goto('file://' + path.join(root, 'index.html'));
  await page.waitForTimeout(600);
  const shot = async (name) => {
    if (outDir) await page.locator('#game').screenshot({ path: path.join(outDir, name + '.png') });
  };
  await shot('title');

  // run each level for a few seconds while holding right, then look around
  for (let i = 0; i < 4; i++) {
    await page.evaluate((i) => window.SuperPunekar.startLevel(i), i);
    await page.waitForTimeout(300);
    await shot(`level${i + 1}-start`);
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(1500);
    await page.keyboard.press('KeyZ');
    await page.waitForTimeout(800);
    await page.keyboard.up('ArrowRight');
    const info = await page.evaluate(() => {
      const G = window.SuperPunekar.G;
      return { state: G.state, x: G.player.x, playerState: G.player.state, ents: G.ents.length, w: G.area.w };
    });
    console.log(`level 1-${i + 1}:`, JSON.stringify(info));
    const w = info.w;
    for (const frac of [0.25, 0.5, 0.75, 0.95]) {
      await page.evaluate(
        ([tx]) => {
          const S = window.SuperPunekar;
          S.G.player.invuln = 99999;
          S.teleport(tx, 2);
        },
        [Math.floor(w * frac)]
      );
      await page.waitForTimeout(250);
      await shot(`level${i + 1}-${Math.round(frac * 100)}`);
    }
  }
  await browser.close();
  if (errors.length) {
    console.error('ERRORS:\n' + errors.join('\n'));
    process.exit(1);
  }
  console.log('smoke test passed');
})();
