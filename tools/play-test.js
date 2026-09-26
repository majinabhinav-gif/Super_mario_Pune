// Scripted gameplay checks: drives the real game frame by frame in headless Chromium.
// Usage: node tools/play-test.js   (needs Playwright)
const path = require('path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
let failures = 0;
function check(cond, msg) {
  console.log((cond ? '  ok   ' : '  FAIL ') + msg);
  if (!cond) failures++;
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message + '\n' + e.stack));
  await page.goto('file://' + path.join(root, 'index.html'));
  await page.waitForTimeout(400);
  const ev = (fn, arg) => page.evaluate(fn, arg);
  const step = (n) => ev((n) => window.SuperPunekar.step(n), n);
  const start = async (i, form = 0) => {
    await ev(([i, form]) => {
      window.SuperPunekar.setManual(true);
      window.SuperPunekar.startLevel(i, form);
    }, [i, form]);
    await step(2);
  };
  const G = (expr) => ev((expr) => new Function('G', 'S', 'return ' + expr)(window.SuperPunekar.G, window.SuperPunekar), expr);
  const hold = async (key, frames) => {
    await page.keyboard.down(key);
    await step(frames);
    await page.keyboard.up(key);
  };

  console.log('stomping an auto');
  await start(0);
  await ev(() => {
    const G = window.SuperPunekar.G;
    const a = G.ents.find((e) => e.constructor.name === 'Auto');
    a.awake = true;
    G.player.x = a.x;
    G.player.y = a.y - 40;
    G.player.onGround = false;
  });
  await step(30);
  check(await G("G.ents.filter(e => e.constructor.name === 'Auto' && e.flat).length === 1 || G.score >= 100"), 'auto squashed and scored');
  check(await G("G.player.state === 'normal'"), 'hero unharmed');

  console.log('vada pav from a ? block');
  await start(0);
  await ev(() => window.SuperPunekar.teleport(19, 12));
  await hold('KeyZ', 20);
  await step(40);
  check(await G("G.ents.some(e => e.kind === 'vadapav')"), 'vada pav came out of the block');
  check(await G('G.area.get(19, 9) === 4'), 'block is used up');
  await ev(() => {
    const G = window.SuperPunekar.G;
    const v = G.ents.find((e) => e.kind === 'vadapav');
    G.player.x = v.x;
    G.player.y = v.y + v.h - G.player.h;
  });
  await step(80);
  check(await G('G.player.form === 1 && G.player.h === 27'), 'hero grew big');

  console.log('big hero breaks a brick');
  await ev(() => window.SuperPunekar.teleport(18, 12));
  await hold('KeyZ', 18);
  await step(30);
  check(await G('G.area.get(18, 9) === 0'), 'brick at (18,9) broken');

  console.log('monkey ball kick');
  await start(0);
  await ev(() => {
    const G = window.SuperPunekar.G;
    const m = G.ents.find((e) => e.constructor.name === 'Monkey');
    m.awake = true;
    G.player.x = m.x;
    G.player.y = m.y - 40;
    G.player.onGround = false;
    window.__m = m;
  });
  for (let i = 0; i < 30 && (await ev(() => window.__m.state)) === 'walk'; i++) await step(1);
  check(await ev(() => window.__m.state === 'ball'), 'stomped monkey curls into a ball');
  await ev(() => {
    const G = window.SuperPunekar.G;
    const m = window.__m;
    G.player.x = m.x - 10;
    G.player.y = m.y + m.h - G.player.h;
    G.player.vy = 0;
  });
  await step(3);
  check(await ev(() => window.__m.state === 'roll' && window.__m.vx > 0), 'ball kicked to the right');
  check(await G("G.player.state === 'normal'"), 'kicking did not hurt the hero');

  console.log('secret pipe to the bonus room and back');
  await start(0);
  await ev(() => window.SuperPunekar.teleport(56, 8));
  await step(10);
  await hold('ArrowDown', 45);
  check(await G("G.areaName === 'bonus'"), 'entered bonus room');
  await step(60);
  const coinsBefore = await G('G.coins');
  await ev(() => window.SuperPunekar.teleport(11, 12));
  await hold('ArrowRight', 50);
  await step(10);
  check(await G("G.areaName === 'main'"), 'back on the street');
  await step(60);
  check(await G("G.player.state === 'normal' && Math.abs(G.player.y + G.player.h - 11 * 16) < 1"), 'hero stands on the exit pipe');
  check((await G('G.coins')) >= coinsBefore, 'coins kept');

  console.log('checkpoint and respawn');
  await start(0);
  await ev(() => window.SuperPunekar.teleport(102, 12));
  await step(5);
  check(await G('G.checkpoint && G.checkpoint.tx === 101'), 'checkpoint reached');
  await ev(() => window.SuperPunekar.G.killPlayer('hit'));
  await step(200);
  check(await G("G.state === 'intro' && G.lives === 4"), 'lost a life, back to intro card');
  await step(160);
  check(await G("G.state === 'play' && Math.abs(G.player.x - (101 * 16 + 2)) < 2"), 'respawned at the checkpoint');

  console.log('falling in a pit');
  await start(0);
  await ev(() => window.SuperPunekar.teleport(67, 11));
  await step(60);
  check(await G("G.player.state === 'dead'"), 'pit is deadly');

  console.log('mirchi fire and dhol');
  await start(0, 2);
  await hold('KeyX', 2);
  await step(2);
  check(await G("G.ents.some(e => e.constructor.name === 'Fireball')"), 'mirchi hero throws a fireball');
  await ev(() => window.SuperPunekar.G.area.q(8, 9, 'dhol'));
  await ev(() => window.SuperPunekar.teleport(8, 12));
  await hold('KeyZ', 16);
  await step(40);
  await ev(() => {
    const G = window.SuperPunekar.G;
    const d = G.ents.find((e) => e.kind === 'dhol');
    if (d) {
      G.player.x = d.x;
      G.player.y = d.y + d.h - G.player.h;
    }
  });
  await step(3);
  check(await G('G.player.star > 0'), 'dhol makes the hero invincible');

  console.log('pause');
  await start(0);
  await hold('Enter', 1);
  check(await G('G.paused === true'), 'paused');
  await step(2);
  await hold('Enter', 1);
  check(await G('G.paused === false'), 'resumed');

  console.log('flagpole, tally and next level');
  await start(0, 1);
  await ev(() => window.SuperPunekar.teleport(193, 5));
  await page.keyboard.down('ArrowRight');
  await step(90);
  await page.keyboard.up('ArrowRight');
  check(await G("['flag','walk'].includes(G.player.state)"), 'grabbed the flagpole');
  let st = '';
  for (let i = 0; i < 20 && st !== 'intro'; i++) {
    await step(60);
    st = await G('G.state');
  }
  check(st === 'intro' && (await G('G.levelIndex')) === 1, 'moved on to 1-2');
  check(await G('G.form === 1'), 'power-up carried to next level');

  console.log('metro exit pipe');
  await start(1);
  await ev(() => window.SuperPunekar.teleport(182, 12));
  await hold('ArrowRight', 60);
  check(await G("G.areaName === 'exit'"), 'side pipe leads outside');
  await step(40);
  check(await G("G.player.state === 'normal'"), 'hero climbed out of the pipe');

  console.log('falling stones in 1-3');
  await start(2);
  await ev(() => {
    const G = window.SuperPunekar.G;
    const pl = G.platforms.find((p) => p.kind === 'fall');
    G.player.x = pl.x + 4;
    G.player.y = pl.y - G.player.h - 2;
    window.__pl = pl;
  });
  await step(80);
  check(await ev(() => window.__pl.falling), 'stone crumbles after standing on it');

  console.log('boss: ring the bell');
  await start(3);
  await ev(() => window.SuperPunekar.teleport(145, 11));
  await step(3);
  check(await G('G.bell.rung'), 'bell rung');
  st = '';
  for (let i = 0; i < 20 && st !== 'ending'; i++) {
    await step(60);
    st = await G('G.state');
  }
  check(st === 'ending', 'reached the Ganeshotsav ending');
  await step(260);
  await page.locator('#game').screenshot({ path: path.join(process.env.SHOTS || '/tmp', 'ending.png') });
  await hold('KeyZ', 1);
  check(await G("G.state === 'title'"), 'play again returns to the title');

  console.log('boss can be beaten with stomps');
  await start(3, 1);
  await ev(() => {
    const G = window.SuperPunekar.G;
    window.__b = G.ents.find((e) => e.constructor.name === 'Boss');
    window.__b.awake = true;
  });
  for (let i = 0; i < 5; i++) {
    await ev(() => {
      const G = window.SuperPunekar.G;
      const b = window.__b;
      b.hurtT = 0;
      G.player.x = b.x + 6;
      G.player.y = b.y - 30;
      G.player.vy = 2;
      G.player.onGround = false;
      G.player.invuln = 999;
    });
    await step(8);
  }
  check(await ev(() => window.__b.knocked && window.SuperPunekar.G.bossDefeated), 'boss knocked out after 5 stomps');

  console.log('game over and continue');
  await start(0);
  await ev(() => {
    const G = window.SuperPunekar.G;
    G.lives = 1;
    G.killPlayer('hit');
  });
  await step(200);
  check(await G("G.state === 'gameover'"), 'game over screen');
  await step(70);
  await hold('KeyZ', 1);
  check(await G("G.state === 'intro' && G.lives === 5"), 'continue gives fresh lives');

  console.log('time running out');
  await start(0);
  await ev(() => (window.SuperPunekar.G.time = 1));
  await step(40);
  check(await G("G.player.state === 'dead'"), 'time up ends the life');

  await browser.close();
  if (errors.length) {
    console.log('PAGE ERRORS:\n' + errors.join('\n'));
    failures++;
  }
  console.log(failures ? `${failures} check(s) failed` : 'all play checks passed');
  process.exit(failures ? 1 : 0);
})();
