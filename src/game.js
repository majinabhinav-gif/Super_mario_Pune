'use strict';
// Game state machine, rendering and the main loop.

const G = {
  state: 'boot',
  stateT: 0,
  frame: 0,
  camX: 0,
  levelIndex: 0,
  level: null,
  area: null,
  areaName: 'main',
  player: null,
  ents: [],
  platforms: [],
  fx: [],
  bumps: [],
  decor: [],
  multi: new Map(),
  score: 0,
  coins: 0,
  lives: 5,
  form: 0,
  time: 400,
  timeTick: 0,
  hurried: false,
  freezeT: 0,
  transformKind: null,
  inp: {},
  name: 'PUNEKAR',
  best: 0,
  unlocked: 0,
  checkpoint: null,
  flagState: null,
  tally: null,
  paused: false,
  menuIndex: 0,
  menuItems: [],
  bossDefeated: false,
  bridgeFalling: false,
  bossSeq: null,
  titleLevel: null,
};

const START_LIVES = 5;

// ------------------------------------------------------------ display ----
let screen, sctx, buf, ctx;
function setupDisplay() {
  screen = document.getElementById('game');
  sctx = screen.getContext('2d');
  buf = makeCanvas(VIEW_W, VIEW_H);
  ctx = buf.getContext('2d');
  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 200));
}

function resize() {
  const wrap = document.getElementById('stage');
  const W = wrap.clientWidth || window.innerWidth;
  const H = wrap.clientHeight || window.innerHeight;
  const aspect = W / H;
  VIEW_W = clamp(Math.round((VIEW_H * aspect) / 2) * 2, 256, 480);
  buf.width = VIEW_W;
  buf.height = VIEW_H;
  ctx.imageSmoothingEnabled = false;
  const scale = Math.min(W / VIEW_W, H / VIEW_H);
  const cssW = Math.floor(VIEW_W * scale);
  const cssH = Math.floor(VIEW_H * scale);
  const dpr = window.devicePixelRatio || 1;
  screen.style.width = cssW + 'px';
  screen.style.height = cssH + 'px';
  screen.width = Math.round(cssW * dpr);
  screen.height = Math.round(cssH * dpr);
  sctx.imageSmoothingEnabled = false;
  G.displayScale = cssW / VIEW_W;
}

function present() {
  sctx.imageSmoothingEnabled = false;
  sctx.drawImage(buf, 0, 0, screen.width, screen.height);
}

// ------------------------------------------------------------ helpers ----
function setState(s) {
  G.state = s;
  G.stateT = 0;
  G.menuIndex = 0;
}

function saveProgress() {
  G.best = Math.max(G.best, G.score);
  Store.set('best', G.best);
  Store.set('unlocked', G.unlocked);
}

G.addScore = function (n, x, y) {
  G.score += n;
  if (x != null) G.fx.push(new Popup(String(n), x, y - 4));
};
G.addLife = function (x, y) {
  G.lives = Math.min(G.lives + 1, 99);
  Sound.play('oneup');
  if (x != null) G.fx.push(new Popup('1UP', x, y - 4, '#9ce05a'));
};
G.addCoin = function () {
  G.coins++;
  G.score += 200;
  Sound.play('coin');
  if (G.coins >= 100) {
    G.coins -= 100;
    G.addLife(G.player.cx, G.player.y);
  }
};
G.spawn = function (e) {
  G.ents.push(e);
  return e;
};
G.transform = function (kind) {
  G.freezeT = 44;
  G.transformKind = kind;
};
G.restoreMusic = function () {
  if (!G.area || G.player.state !== 'normal') return;
  Sound.playMusic(G.player.star > 0 ? 'dhol' : G.area.music, { tempo: G.hurried ? 1.3 : 1 });
};
G.playMusicOnce = function (name) {
  Sound.playMusic(name);
};

// ------------------------------------------------------------- levels ----
function makeEntity(s, area) {
  switch (s.type) {
    case 'auto':
      return new Auto(s.x * TILE, s.y * TILE);
    case 'monkey':
      return new Monkey(s.x * TILE, s.y * TILE, s.smart);
    case 'pigeon':
      return new Pigeon(s.x * TILE, s.y * TILE);
    case 'cobra':
      return new Cobra(s.x, s.y);
    case 'flame':
      return new Flame(s.x, s.y, s.delay || 0);
    case 'firebar':
      return new Firebar(s.x, s.y, s.len, s.speed);
  }
  throw new Error('Unknown spawn ' + s.type + ' in ' + area.name);
}

function loadArea(name, spawn) {
  const area = G.level.areas[name];
  G.area = area;
  G.areaName = name;
  G.ents = [];
  G.fx = [];
  G.bumps = [];
  G.platforms = area.platforms.map((o) => new Platform(o, area.theme));
  for (const s of area.spawns) {
    if (spawn.skipBehind && s.x < spawn.tx - 4 && s.type !== 'cobra' && s.type !== 'firebar') continue;
    G.ents.push(makeEntity(s, area));
  }
  for (const c of area.checkpoints) {
    const cp = new Checkpoint(c.x, c.y);
    const cur = G.checkpoint;
    cp.reached = !!(cur && cur.levelIndex === G.levelIndex && cur.area === name && cur.tx === c.x);
    G.ents.push(cp);
  }
  G.bell = null;
  G.bossDefeated = false;
  G.bridgeFalling = false;
  G.bossSeq = null;
  if (area.boss) {
    G.ents.push(new Boss(area.boss.x, area.boss.y, area.boss));
    G.bell = G.spawn(new Bell(area.boss.bell.x, area.boss.bell.y));
  }
  G.decor = area.decor.map((d) => (d.anim ? { d } : { d, ...paintDecor(d) }));
  const p = new Player(spawn.tx * TILE + 2, 0, G.form);
  p.y = (spawn.ty + 1) * TILE - p.h;
  G.player = p;
  if (spawn.exit === 'up') {
    // rise out of a pipe
    p.x = spawn.tx * TILE + 10;
    p.y = spawn.ty * TILE;
    p.state = 'pipeUp';
    p.stateT = 0;
    p.pipeRise = p.h;
    p.inPipe = true;
    Sound.play('shrink');
  }
  G.flagState = null;
  G.tally = null;
  snapCamera();
}

function beginLevel() {
  G.level = LEVELS[G.levelIndex]();
  G.time = G.level.time;
  G.timeTick = 0;
  G.hurried = false;
  G.multi = new Map();
  const cp = G.checkpoint && G.checkpoint.levelIndex === G.levelIndex ? G.checkpoint : null;
  const st = cp || G.level.start;
  loadArea(cp ? cp.area : st.area, { tx: st.tx, ty: st.ty, skipBehind: !!cp });
  setState('play');
  G.paused = false;
  Sound.setTempo(1);
  Sound.playMusic(G.area.music);
}

function snapCamera() {
  const p = G.player;
  const areaW = G.area.w * TILE;
  if (areaW <= VIEW_W) G.camX = (areaW - VIEW_W) / 2;
  else G.camX = clamp(p.cx - VIEW_W * 0.35, 0, areaW - VIEW_W);
}

function updateCamera() {
  const p = G.player;
  const areaW = G.area.w * TILE;
  if (areaW <= VIEW_W) {
    G.camX = (areaW - VIEW_W) / 2;
    return;
  }
  const ahead = p.cx - VIEW_W * 0.42;
  const behind = p.cx - VIEW_W * 0.3;
  if (ahead > G.camX) G.camX = ahead;
  else if (behind < G.camX) G.camX = behind;
  G.camX = clamp(G.camX, 0, areaW - VIEW_W);
}

// ---------------------------------------------------------- block hits ---
G.hitBlock = function (tx, ty, who) {
  const area = G.area;
  const t = area.get(tx, ty);
  const key = area.key(tx, ty);
  const content = area.contents.get(key);
  let bumped = false;
  if (t === T.QBLOCK || t === T.HIDDEN) {
    area.set(tx, ty, T.USED);
    release(content || 'coin', tx, ty);
    bumped = true;
  } else if (t === T.BRICK) {
    if (content === 'coins') {
      let m = G.multi.get(key);
      if (!m) {
        m = { left: 10, until: G.frame + 280 };
        G.multi.set(key, m);
      }
      release('coin', tx, ty);
      m.left--;
      if (m.left <= 0 || G.frame > m.until) area.set(tx, ty, T.USED);
      bumped = true;
    } else if (content) {
      area.set(tx, ty, T.USED);
      release(content, tx, ty);
      bumped = true;
    } else if (who.big) {
      area.set(tx, ty, T.EMPTY);
      const img = Sprites.tiles[area.theme].debris;
      const bx = tx * TILE;
      const by = ty * TILE;
      G.fx.push(new Debris(bx, by, -1.2, -5, img), new Debris(bx + 8, by, 1.2, -5, img));
      G.fx.push(new Debris(bx, by + 8, -1.2, -3, img), new Debris(bx + 8, by + 8, 1.2, -3, img));
      G.score += 50;
      Sound.play('brick');
      bumpTop(tx, ty);
      return;
    } else {
      bumped = true;
      Sound.play('bump');
    }
  } else {
    Sound.play('bump');
    return;
  }
  if (bumped) {
    G.bumps.push({ tx, ty, t: 0 });
    bumpTop(tx, ty);
  }
};

function bumpTop(tx, ty) {
  const top = ty * TILE;
  const area = { x: tx * TILE, y: top - 4, w: TILE, h: 4 };
  for (const e of G.ents) {
    if (e.dead) continue;
    if (e instanceof Enemy && !e.knocked && e.awake && !(e instanceof Firebar) && overlap(area, e)) {
      e.knock(e.cx < tx * TILE + 8 ? -1 : 1);
      G.addScore(100, e.cx, e.y);
    } else if (e instanceof PowerUp && e.emerge === 0 && overlap(area, e)) {
      e.bumped(tx * TILE + 8);
    }
  }
  if (G.area.get(tx, ty - 1) === T.COIN) {
    G.area.set(tx, ty - 1, T.EMPTY);
    G.spawn(new BlockCoin(tx, ty));
    G.addCoin();
  }
}

function release(content, tx, ty) {
  if (content === 'coin') {
    G.spawn(new BlockCoin(tx, ty));
    G.addCoin();
    return;
  }
  let kind = content;
  if (content === 'power') kind = G.player.form === 0 ? 'vadapav' : 'mirchi';
  G.spawn(new PowerUp(kind, tx, ty));
  Sound.play('sprout');
}

function collect(item) {
  const p = G.player;
  item.dead = true;
  switch (item.kind) {
    case 'vadapav':
      if (p.form === 0) {
        p.form = 1;
        G.transform('grow');
      }
      Sound.play('powerup');
      G.addScore(1000, item.cx, item.y);
      break;
    case 'mirchi':
      if (p.form === 0) {
        p.form = 1;
        G.transform('grow');
      } else if (p.form === 1) {
        p.form = 2;
        G.transform('fire');
      }
      Sound.play('powerup');
      G.addScore(1000, item.cx, item.y);
      break;
    case 'dhol':
      p.star = 620;
      Sound.play('dhol');
      Sound.playMusic('dhol', { tempo: G.hurried ? 1.15 : 1 });
      G.addScore(1000, item.cx, item.y);
      break;
    case 'modak':
      G.addLife(item.cx, item.y);
      break;
  }
}

// --------------------------------------------------------------- pipes ---
G.checkPipes = function (p, inp) {
  if (!p.onGround) return;
  for (const pipe of G.area.pipes) {
    if (pipe.dir === 'down' && inp.down) {
      const px = pipe.x * TILE;
      if (Math.abs(p.y + p.h - pipe.y * TILE) < 1 && p.cx > px + 5 && p.cx < px + 27) {
        p.state = 'pipeDown';
        p.stateT = 0;
        p.vx = 0;
        p.pipe = pipe;
        p.x = px + 16 - p.w / 2;
        p.inPipe = true;
        Sound.play('shrink');
        return;
      }
    }
    if (pipe.dir === 'right' && inp.right) {
      const mx = pipe.x * TILE;
      const feet = (pipe.y + 2) * TILE;
      if (p.x + p.w >= mx - 1 && p.x + p.w <= mx + 2 && Math.abs(p.y + p.h - feet) < 1) {
        p.state = 'pipeRight';
        p.stateT = 0;
        p.vx = 0;
        p.pipe = pipe;
        p.inPipe = true;
        Sound.play('shrink');
        return;
      }
    }
  }
};

G.finishPipe = function (pipe) {
  const form = G.player.form;
  const star = G.player.star;
  G.form = form;
  const target = G.level.areas[pipe.to];
  const musicBefore = G.area.music;
  loadArea(pipe.to, { tx: pipe.tx, ty: pipe.ty, exit: pipe.exit });
  G.player.star = star;
  if (target.music !== musicBefore && star <= 0) Sound.playMusic(target.music, { tempo: G.hurried ? 1.3 : 1 });
};

// ---------------------------------------------------------- dying etc. ---
G.killPlayer = function (reason) {
  const p = G.player;
  if (p.state === 'dead') return;
  p.state = 'dead';
  p.stateT = reason === 'pit' ? 30 : 0;
  p.vy = reason === 'pit' ? 0 : -5.2;
  p.star = 0;
  p.invuln = 0;
  if (reason === 'pit') p.y = VIEW_H + 40;
  G.form = 0;
  G.deathT = 0;
  Sound.playMusic('death');
};

function startFlag() {
  const p = G.player;
  const poleX = G.area.flag.x * TILE + 7;
  p.state = 'flag';
  p.stateT = 0;
  p.vx = 0;
  p.vy = 0;
  p.star = 0;
  p.x = poleX - p.w + 1;
  p.facing = 1;
  p.y = Math.min(p.y, 12 * TILE - p.h);
  const y = p.y;
  const pts = y < 4 * TILE ? 5000 : y < 6 * TILE ? 2000 : y < 8 * TILE ? 800 : y < 10 * TILE ? 400 : 100;
  G.addScore(pts, poleX + 12, y);
  G.flagState = { phase: 'slide', poleX, flagY: 3 * TILE, flagBottom: 11 * TILE };
  Sound.stopMusic();
  Sound.play('flag');
}

G.beginTally = function () {
  G.tally = { t: 0, phase: 'count', wait: 0 };
};

function updateTally() {
  const tl = G.tally;
  tl.t++;
  if (tl.phase === 'count') {
    if (tl.t < 40) return;
    if (G.time > 0) {
      const n = Math.min(G.time, 3);
      G.time -= n;
      G.score += 50 * n;
      if (tl.t % 3 === 0) Sound.play('beep');
    } else {
      tl.phase = 'fireworks';
      tl.t = 0;
      const hx = G.area.house ? G.area.house.x * TILE + 40 : G.player.x;
      for (let i = 0; i < 3; i++) {
        G.fx.push(new Firework(hx + rand(-60, 60), rand(40, 90), i * 28));
        G.score += 500;
      }
    }
  } else if (tl.phase === 'fireworks') {
    if (tl.t > 150) finishLevel();
  }
}

function finishLevel() {
  G.form = G.player.form;
  G.checkpoint = null;
  G.levelIndex++;
  G.unlocked = Math.max(G.unlocked, Math.min(G.levelIndex, LEVELS.length - 1));
  saveProgress();
  if (G.levelIndex >= LEVELS.length) {
    G.fx = [];
    setState('ending');
    Sound.playMusic('ending');
  } else {
    setState('intro');
    Sound.stopMusic();
  }
}

// ------------------------------------------------------------ boss end ---
function ringBell() {
  const p = G.player;
  G.bell.rung = true;
  G.bell.swing = 80;
  Sound.stopMusic();
  Sound.play('bell');
  G.bridgeFalling = true;
  G.bossSeq = { t: 0, next: G.area.boss.bridge.x1 };
  p.state = 'idle';
  p.vx = 0;
  p.star = 0;
  p.invuln = 0;
  for (const e of G.ents) if (e instanceof Banana) e.dead = true;
}

function updateBossSeq() {
  const s = G.bossSeq;
  s.t++;
  const b = G.area.boss.bridge;
  if (s.t > 40 && s.next >= b.x0 && s.t % 4 === 0) {
    G.area.set(s.next, b.y, T.EMPTY);
    G.fx.push(new Debris(s.next * TILE + 4, b.y * TILE, rand(-1, 1), -2, Sprites.tiles.castle.debris));
    if (s.next % 2 === 0) Sound.play('brick');
    s.next--;
  }
  if (s.next < b.x0 && !s.done) {
    s.done = true;
    s.doneT = s.t;
    if (!G.bossDefeated) {
      Sound.play('bossFall');
      G.addScore(5000, G.player.x, G.player.y - 20);
    }
  }
  if (s.done && s.t - s.doneT === 70) {
    G.player.state = 'auto';
    Sound.playMusic('clear');
  }
  if (G.player.state === 'auto' && G.player.x > (G.area.w - 7) * TILE && !s.found) {
    s.found = true;
    s.foundT = s.t;
    G.player.state = 'idle';
    G.player.vx = 0;
    G.fx.push(new Popup('MODAKS FOUND!', G.player.cx, G.player.y - 12, '#fcd23c'));
    for (let i = 0; i < 4; i++) G.fx.push(new Firework(G.player.x + rand(-80, 40), rand(40, 100), i * 20));
  }
  if (s.found && s.t - s.foundT > 170) {
    G.time = 0;
    finishLevel();
  }
}

// ----------------------------------------------------------- play loop ---
function readInput() {
  G.inp = {
    left: Input.down('left'),
    right: Input.down('right'),
    down: Input.down('down'),
    jumpHeld: Input.down('jump') || Input.down('up'),
    jumpPressed: Input.pressed('jump') || Input.pressed('up'),
    run: Input.down('run'),
    runPressed: Input.pressed('run'),
  };
}

function updatePlay() {
  if (G.paused) return updatePause();
  if (Input.pressed('start') && G.player.state === 'normal') {
    G.paused = true;
    G.menuIndex = 0;
    Sound.play('pause');
    return;
  }
  readInput();
  const p = G.player;

  if (G.freezeT > 0) {
    G.freezeT--;
    return;
  }

  if (p.state === 'dead') {
    p.update();
    G.deathT++;
    if (G.deathT > 190) {
      G.lives--;
      if (G.lives > 0) {
        setState('intro');
      } else {
        saveProgress();
        setState('gameover');
        Sound.playMusic('gameover');
      }
    }
    return;
  }

  for (const pl of G.platforms) pl.update();
  G.platforms = G.platforms.filter((pl) => !pl.dead);
  p.update();

  // entities
  for (const e of G.ents) {
    if (e.dead) continue;
    if (!e.awake && e.x < G.camX + VIEW_W + 24 && e.x > G.camX - 48) e.awake = true;
    if (e.awake) e.update();
    if (e instanceof Enemy && e.awake && !(e instanceof Boss) && e.x < G.camX - VIEW_W) e.dead = true;
    if (e instanceof PowerUp && (e.x < G.camX - VIEW_W || e.x > G.camX + VIEW_W * 2)) e.dead = true;
  }

  if (p.state === 'normal') collidePlayer(p);
  collideEnemies();
  G.ents = G.ents.filter((e) => !e.dead);
  G.fx = G.fx.filter((f) => f.update() !== false);
  for (const b of G.bumps) b.t++;
  G.bumps = G.bumps.filter((b) => b.t < 10);

  // checkpoints, flag, bell
  for (const e of G.ents) {
    if (e instanceof Checkpoint && !e.reached && p.x >= e.x - 4 && p.state === 'normal') {
      e.reached = true;
      G.checkpoint = { levelIndex: G.levelIndex, area: G.areaName, tx: e.tx, ty: e.ty };
      Sound.play('checkpoint');
      G.fx.push(new Popup('CHECKPOINT!', e.x + 8, e.y - 6, '#fcd23c'));
    }
  }
  if (G.area.flag && p.state === 'normal') {
    const poleX = G.area.flag.x * TILE + 7;
    if (p.x + p.w >= G.area.flag.x * TILE - 0.5 && p.x <= poleX + 2 && p.y < 13 * TILE) startFlag();
  }
  if (G.flagState && G.flagState.flagY < G.flagState.flagBottom) G.flagState.flagY += 2;
  if (G.bell && !G.bell.rung && p.state === 'normal' && overlap(p, G.bell)) ringBell();
  if (G.bossSeq) updateBossSeq();
  if (G.tally) updateTally();

  // clock
  if (p.state === 'normal' && !G.flagState && !G.bossSeq) {
    if (++G.timeTick >= 36) {
      G.timeTick = 0;
      G.time--;
      if (G.time === 100 && !G.hurried) {
        G.hurried = true;
        Sound.playMusic('hurry');
        G.hurryT = 110;
      }
      if (G.time <= 0) {
        G.time = 0;
        G.killPlayer('time');
      }
    }
  }
  if (G.hurryT > 0 && --G.hurryT === 0) G.restoreMusic();

  if (p.state === 'normal' || p.state === 'walk' || p.state === 'auto' || p.state === 'pipeUp') updateCamera();
}

function collidePlayer(p) {
  for (const e of G.ents) {
    if (e.dead) continue;
    if (e instanceof PowerUp) {
      if (e.emerge === 0 && overlap(p, e)) collect(e);
      continue;
    }
    if (!(e instanceof Enemy) || !e.awake || e.knocked) continue;
    if (e instanceof Firebar) {
      if (p.star <= 0 && e.hits(p)) p.hurt();
      continue;
    }
    if (!overlap(p, e)) continue;
    if (p.star > 0) {
      if (e instanceof Flame || e instanceof Banana) continue;
      if (e instanceof Cobra && e.phase === 'down') continue;
      e.knock(p.cx < e.cx ? 1 : -1);
      if (!(e instanceof Boss)) G.addScore(200, e.cx, e.y);
      continue;
    }
    const stomp = e.stompable && p.vy > 0 && p.prevY + p.h <= e.y + Math.max(7, p.vy + 3);
    if (stomp) {
      e.onStomp(p);
      if (!(e instanceof Boss)) {
        p.bounce(G.inp.jumpHeld);
        p.y = Math.min(p.y, e.y - p.h);
      }
    } else {
      e.onTouch(p);
    }
    if (p.state !== 'normal') return;
  }
}

function isWalker(e) {
  return (e instanceof Auto && !e.flat) || (e instanceof Monkey && e.state === 'walk');
}

function collideEnemies() {
  const list = G.ents.filter((e) => e instanceof Enemy && e.awake && !e.knocked && !e.dead && isWalker(e));
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i];
      const b = list[j];
      if (!overlap(a, b)) continue;
      if (a.cx < b.cx) {
        a.vx = -Math.abs(a.vx);
        b.vx = Math.abs(b.vx);
      } else {
        a.vx = Math.abs(a.vx);
        b.vx = -Math.abs(b.vx);
      }
    }
  }
}

// ---------------------------------------------------------------- pause --
function pauseItems() {
  return [
    { label: 'RESUME', act: () => resumeGame() },
    { label: 'SOUND: ' + (Sound.isMuted() ? 'OFF' : 'ON'), act: () => Sound.toggleMute() },
    { label: 'QUIT TO TITLE', act: () => goTitle() },
  ];
}
function resumeGame() {
  G.paused = false;
  Input.clear();
}
function updatePause() {
  G.menuItems = pauseItems();
  menuNav();
  if (Input.pressed('start')) resumeGame();
}

function menuNav() {
  const n = G.menuItems.length;
  if (Input.pressed('down')) {
    G.menuIndex = (G.menuIndex + 1) % n;
    Sound.play('select');
  }
  if (Input.pressed('up')) {
    G.menuIndex = (G.menuIndex + n - 1) % n;
    Sound.play('select');
  }
  if (Input.pressed('jump') || (Input.pressed('start') && G.state !== 'play') || Input.pressed('run')) {
    const item = G.menuItems[G.menuIndex];
    if (item) {
      Sound.play('confirm');
      item.act();
    }
  }
}

// Tapping or clicking on a menu line activates it.
function onCanvasTap(clientX, clientY) {
  if (G.state === 'story' && G.stateT > 30) {
    setState('intro');
    Sound.stopMusic();
    return true;
  }
  if (!G.menuItems.length || !G.menuRects) return false;
  const r = screen.getBoundingClientRect();
  const x = ((clientX - r.left) / r.width) * VIEW_W;
  const y = ((clientY - r.top) / r.height) * VIEW_H;
  for (let i = 0; i < G.menuRects.length; i++) {
    const m = G.menuRects[i];
    if (x >= m.x && x <= m.x + m.w && y >= m.y && y <= m.y + m.h) {
      G.menuIndex = i;
      Sound.play('confirm');
      G.menuItems[i].act();
      return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------- title --
function goTitle() {
  G.paused = false;
  setState('title');
  G.titleLevel = level1_1();
  G.level = G.titleLevel;
  G.form = 0;
  loadArea('main', { tx: 3, ty: 12 });
  G.ents = G.ents.filter((e) => !(e instanceof Enemy));
  G.camX = 0;
  Sound.stopMusic();
}

function titleItems() {
  const items = [{ label: 'START GAME', act: () => newGame(0) }];
  if (G.unlocked > 0) {
    items.push({ label: 'CONTINUE 1-' + (G.unlocked + 1), act: () => newGame(G.unlocked) });
  }
  items.push({ label: 'HERO NAME: ' + G.name, act: () => openNameEntry() });
  items.push({ label: 'SOUND: ' + (Sound.isMuted() ? 'OFF' : 'ON'), act: () => Sound.toggleMute() });
  return items;
}

function newGame(levelIndex) {
  G.score = 0;
  G.coins = 0;
  G.lives = START_LIVES;
  G.form = 0;
  G.levelIndex = levelIndex;
  G.checkpoint = null;
  if (levelIndex === 0) {
    setState('story');
    Sound.playMusic('peth');
  } else {
    setState('intro');
    Sound.stopMusic();
  }
}

function updateTitle() {
  G.menuItems = titleItems();
  if (G.nameOpen) return;
  menuNav();
}

function updateStory() {
  if (G.stateT > 30 && (Input.confirm() || Input.pressed('run'))) {
    setState('intro');
    Sound.stopMusic();
  }
}

function updateIntro() {
  if (G.stateT === 1) Sound.stopMusic();
  if (G.stateT > 150 || (G.stateT > 40 && Input.confirm())) beginLevel();
}

function gameOverItems() {
  return [
    {
      label: 'CONTINUE',
      act: () => {
        G.score = 0;
        G.coins = 0;
        G.lives = START_LIVES;
        G.form = 0;
        setState('intro');
      },
    },
    { label: 'BACK TO TITLE', act: () => goTitle() },
  ];
}

function updateGameOver() {
  G.menuItems = gameOverItems();
  if (G.stateT > 60) menuNav();
}

function updateEnding() {
  if (G.stateT % 40 === 0) {
    const fw = new Firework(rand(30, VIEW_W - 30), rand(30, 100));
    fw.screen = true;
    G.fx.push(fw);
  }
  G.fx = G.fx.filter((f) => f.update() !== false);
  G.menuItems = [{ label: 'PLAY AGAIN', act: () => goTitle() }];
  if (G.stateT > 240) menuNav();
}

// --------------------------------------------------------------- render --
function drawWorld() {
  const area = G.area;
  const camX = Math.round(G.camX);
  drawBackground(ctx, area.theme, G.camX, G.frame);
  if (G.camX < 0) {
    // narrow rooms: paint the outside dark
    ctx.fillStyle = '#05060a';
    ctx.fillRect(0, 0, -camX, VIEW_H);
    ctx.fillRect(-camX + area.w * TILE, 0, VIEW_W, VIEW_H);
  }
  // decor
  for (const dd of G.decor) {
    const d = dd.d;
    if (d.type === 'torch') {
      const x = d.x * TILE - camX;
      if (x > -16 && x < VIEW_W) drawTorch(ctx, x, d.y * TILE, G.frame + d.x * 7);
      continue;
    }
    const x = d.x * TILE + dd.ox - camX;
    if (x > VIEW_W || x + dd.img.width < 0) continue;
    ctx.drawImage(dd.img, x, d.y * TILE + dd.oy);
    if (dd.lights) {
      const cols = ['#ff5a5a', '#fcd23c', '#5ae07a', '#5ab4ff', '#f07cb0'];
      dd.lights.forEach(([lx, ly], i) => {
        if ((i + (G.frame >> 3)) % 3 === 0) return;
        ctx.fillStyle = cols[(i + (G.frame >> 5)) % cols.length];
        ctx.fillRect(x + lx, d.y * TILE + dd.oy + ly, 2, 2);
      });
    }
  }
  // things that live behind tiles
  for (const e of G.ents) if (e.behindTiles && e.awake) e.draw(ctx);
  const p = G.player;
  if (p.inPipe) drawPlayer(p);
  drawTiles(area, camX);
  drawFlag(area, camX);
  for (const pl of G.platforms) pl.draw(ctx);
  for (const e of G.ents) if (!e.behindTiles && (e.awake || e instanceof Checkpoint || e instanceof Bell)) e.draw(ctx);
  if (!p.inPipe) drawPlayer(p);
  for (const f of G.fx) f.draw(ctx);
}

function drawPlayer(p) {
  if (G.freezeT > 0 && G.transformKind) {
    const k = G.transformKind;
    const alt = Math.floor(G.freezeT / 4) % 2 === 0;
    if (k === 'grow' || k === 'shrink') {
      const big = k === 'grow' ? alt : !alt;
      p.draw(ctx, { size: big ? 'big' : 'small' });
    } else {
      p.draw(ctx, { palette: alt ? 'fire' : 'normal', size: 'big' });
    }
    return;
  }
  p.draw(ctx);
}

function drawTiles(area, camX) {
  const tiles = Sprites.tiles[area.theme];
  const x0 = Math.max(0, Math.floor(camX / TILE));
  const x1 = Math.min(area.w - 1, Math.floor((camX + VIEW_W) / TILE));
  const qFrame = [0, 0, 0, 1, 2, 1][Math.floor(G.frame / 8) % 6];
  const coinFrame = Math.floor(G.frame / 8) % 4;
  const bumpOff = new Map();
  for (const b of G.bumps) bumpOff.set(b.tx + ',' + b.ty, [0, 3, 5, 6, 6, 5, 4, 3, 1, 0][b.t] || 0);
  for (let y = 0; y < ROWS; y++) {
    for (let x = x0; x <= x1; x++) {
      const t = area.tiles[y * area.w + x];
      if (t === T.EMPTY || t === T.HIDDEN) continue;
      const dx = x * TILE - camX;
      let dy = y * TILE;
      const off = bumpOff.get(x + ',' + y);
      if (off) dy -= off;
      let img = null;
      switch (t) {
        case T.GROUND: {
          const above = area.get(x, y - 1);
          img = above !== T.GROUND && y > 0 ? tiles.groundTop : tiles.ground;
          if (area.theme === 'castle') img = tiles.stone;
          break;
        }
        case T.BRICK:
          img = tiles.brick;
          break;
        case T.QBLOCK:
          img = tiles.qblock[qFrame];
          break;
        case T.USED:
          img = tiles.used;
          break;
        case T.HARD:
          img = tiles.hard;
          break;
        case T.STONE:
          img = tiles.stone;
          break;
        case T.BRIDGE:
          img = tiles.bridge;
          break;
        case T.LEDGE:
          img = tiles.ledge;
          break;
        case T.PIPE_TL:
          img = tiles.pipeTL;
          break;
        case T.PIPE_TR:
          img = tiles.pipeTR;
          break;
        case T.PIPE_L:
          img = tiles.pipeL;
          break;
        case T.PIPE_R:
          img = tiles.pipeR;
          break;
        case T.SPIPE_MT:
          img = tiles.spipeMT;
          break;
        case T.SPIPE_MB:
          img = tiles.spipeMB;
          break;
        case T.SPIPE_T:
          img = tiles.spipeT;
          break;
        case T.SPIPE_B:
          img = tiles.spipeB;
          break;
        case T.COIN: {
          const spr = [Sprites.s.coin0, Sprites.s.coin1, Sprites.s.coin2, Sprites.s.coin1][coinFrame];
          ctx.drawImage(coinFrame === 3 ? spr.flip : spr.img, dx, dy);
          continue;
        }
        case T.LAVA:
          drawLava(dx, dy, area.get(x, y - 1) !== T.LAVA, x);
          continue;
      }
      if (img) ctx.drawImage(img, dx, dy);
    }
  }
}

function drawLava(dx, dy, top, x) {
  ctx.fillStyle = '#c8280c';
  ctx.fillRect(dx, dy, TILE, TILE);
  if (top) {
    ctx.fillStyle = '#f85818';
    ctx.fillRect(dx, dy + 3, TILE, 5);
    ctx.fillStyle = '#fcb040';
    for (let i = 0; i < TILE; i++) {
      const h = Math.round(2 + Math.sin((x * TILE + i) * 0.35 + G.frame * 0.12) * 1.6);
      ctx.fillRect(dx + i, dy + 3 - h + 2, 1, h);
    }
  } else if ((x + Math.floor(G.frame / 20)) % 3 === 0) {
    ctx.fillStyle = '#f85818';
    ctx.fillRect(dx + 4 + ((G.frame >> 3) % 6), dy + 5, 2, 2);
  }
}

function drawFlag(area, camX) {
  if (!area.flag) return;
  const x = area.flag.x * TILE + 7 - camX;
  if (x < -40 || x > VIEW_W + 20) return;
  const top = 3 * TILE - 2;
  ctx.fillStyle = '#2a5a2a';
  ctx.fillRect(x - 1, top, 4, 12 * TILE - top);
  ctx.fillStyle = '#b8e8a8';
  ctx.fillRect(x, top, 2, 12 * TILE - top);
  ctx.fillStyle = '#1a1020';
  ctx.fillRect(x - 3, top - 7, 8, 8);
  ctx.fillStyle = '#fcd23c';
  ctx.fillRect(x - 2, top - 6, 6, 6);
  ctx.fillStyle = '#fff4b0';
  ctx.fillRect(x - 1, top - 5, 2, 2);
  const fy = G.flagState ? G.flagState.flagY : 3 * TILE;
  // saffron pennant with a white modak emblem
  for (let r = 0; r < 14; r++) {
    const w = 16 - Math.abs(7 - r) * 2 - (r > 7 ? 1 : 0);
    ctx.fillStyle = '#1a1020';
    ctx.fillRect(x - w - 1, fy + r, w + 1, 1);
    ctx.fillStyle = r < 7 ? '#f5821f' : '#e06a10';
    ctx.fillRect(x - w, fy + r, w, 1);
  }
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x - 9, fy + 5, 4, 4);
  ctx.fillRect(x - 8, fy + 4, 2, 1);
}

function hudText(s, x, y, col = '#ffffff', align = 'left') {
  Font.draw(ctx, s, x, y, col, { align, shadow: '#1a1020' });
}

function drawHUD() {
  const w = VIEW_W;
  hudText(G.name, 10, 8);
  hudText(String(G.score).padStart(6, '0'), 10, 17);
  const cx = Math.max(Math.round(w * 0.33), Font.measure(G.name) + 34);
  ctx.drawImage(Sprites.s.coin0.img, 3, 1, 10, 13, cx - 12, 15, 10, 13);
  hudText('*' + String(G.coins).padStart(2, '0'), cx, 17);
  hudText('@*' + G.lives, cx, 8, '#ff8aa0');
  const wx = Math.round(w * 0.6);
  hudText('WORLD', wx, 8);
  hudText(G.level ? G.level.id : '1-1', wx + 8, 17);
  hudText('TIME', w - 10, 8, '#ffffff', 'right');
  const tcol = G.time <= 100 && G.state === 'play' ? '#ff7060' : '#ffffff';
  if (G.state === 'play') hudText(String(Math.max(0, G.time)).padStart(3, '0'), w - 10, 17, tcol, 'right');
}

function drawMenu(items, y, opts = {}) {
  G.menuRects = [];
  const gap = opts.gap || 14;
  items.forEach((it, i) => {
    const w = Font.measure(it.label);
    const x = Math.round(VIEW_W / 2 - w / 2);
    const yy = y + i * gap;
    const sel = i === G.menuIndex;
    if (sel) {
      const f = Math.floor(G.frame / 8) % 4;
      const spr = [Sprites.s.coin0, Sprites.s.coin1, Sprites.s.coin2, Sprites.s.coin1][f];
      ctx.drawImage(spr.img, x - 18, yy - 4);
    }
    Font.draw(ctx, it.label, x, yy, sel ? '#fcd23c' : '#ffffff', { shadow: '#1a1020' });
    G.menuRects.push({ x: x - 20, y: yy - 4, w: w + 40, h: gap });
  });
}

function drawPanel(x, y, w, h) {
  ctx.fillStyle = '#1a1020';
  ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  ctx.fillStyle = '#f5821f';
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = 'rgba(26,16,32,0.88)';
  ctx.fillRect(x, y, w, h);
}

function drawLogo(cy) {
  const name = G.name || 'PUNEKAR';
  const scale = name.length > 8 ? 2 : 3;
  const w = Font.measure(name, 'big', scale);
  const pw = Math.max(w, 150) + 30;
  const px = Math.round(VIEW_W / 2 - pw / 2);
  drawPanel(px, cy, pw, 58 + (scale === 3 ? 6 : 0));
  Font.draw(ctx, 'SUPER', VIEW_W / 2, cy + 7, '#fff4d0', { align: 'center', scale: 2, shadow: '#b0561a' });
  const ny = cy + 26;
  Font.draw(ctx, name, VIEW_W / 2 + scale, ny + scale, '#9e1c1c', { align: 'center', scale });
  Font.draw(ctx, name, VIEW_W / 2, ny, '#fcd23c', { align: 'center', scale, outline: '#1a1020' });
  const sub = 'WORLD 1: PUNE';
  Font.draw(ctx, sub, VIEW_W / 2, cy + 50 + (scale === 3 ? 6 : 0), '#8fd8f8', { align: 'center', tiny: false });
}

function renderTitle() {
  drawWorld();
  drawLogo(26);
  const items = G.menuItems.length ? G.menuItems : titleItems();
  const my = 124;
  drawPanel(Math.round(VIEW_W / 2 - 92), my - 10, 184, items.length * 14 + 10);
  drawMenu(items, my);
  const hint =
    Input.device() === 'touch'
      ? 'TAP A MENU LINE TO CHOOSE'
      : Input.device() === 'gamepad'
      ? 'A: JUMP   X: RUN / MIRCHI FIRE'
      : 'ARROWS: MOVE  Z: JUMP  X: RUN/FIRE';
  Font.draw(ctx, hint, VIEW_W / 2, VIEW_H - 22, '#ffffff', { align: 'center', tiny: true, outline: '#1a1020' });
  Font.draw(ctx, 'TOP ' + String(G.best).padStart(6, '0'), VIEW_W / 2, VIEW_H - 12, '#fcd23c', { align: 'center', tiny: true, outline: '#1a1020' });
}

function wrapLines(text, maxChars) {
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxChars) {
      lines.push(cur.trim());
      cur = w;
    } else cur += ' ' + w;
  }
  if (cur.trim()) lines.push(cur.trim());
  return lines;
}

function renderStory() {
  ctx.fillStyle = '#120c1c';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // a little scene: the monkey king running off with the modak basket
  const t = G.stateT;
  const bx = VIEW_W - ((t * 0.8) % (VIEW_W + 120)) + 40;
  ctx.drawImage((Math.floor(t / 10) % 2 ? Sprites.s.boss_walk2 : Sprites.s.boss_walk1).img, Math.round(bx), 150);
  const bimg = paintDecorCached('basket');
  ctx.drawImage(bimg, Math.round(bx) - 26, 156);
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(0, 182, VIEW_W, 2);
  const text =
    'OH NO! THE NAUGHTY MAKAD RAJA OF SINHAGAD HAS RUN AWAY WITH ALL THE MODAKS FOR GANESHOTSAV! ' +
    'RACE ACROSS PUNE, ' +
    G.name +
    ', AND BRING THEM BACK BEFORE THE FESTIVAL BEGINS!';
  const lines = wrapLines(text, Math.floor((VIEW_W - 30) / 8));
  const shown = Math.floor(t * 1.2);
  let used = 0;
  lines.forEach((ln, i) => {
    const part = ln.slice(0, Math.max(0, shown - used));
    used += ln.length;
    Font.draw(ctx, part, VIEW_W / 2 - Font.measure(ln) / 2, 26 + i * 13, i === lines.length - 1 ? '#fcd23c' : '#ffffff');
  });
  if (t > 30 && Math.floor(t / 20) % 2) {
    Font.draw(ctx, Input.device() === 'touch' ? 'TAP JUMP TO START' : 'PRESS JUMP TO START', VIEW_W / 2, 208, '#8fd8f8', { align: 'center' });
  }
}

const decorCache = {};
function paintDecorCached(type) {
  if (!decorCache[type]) decorCache[type] = paintDecor({ type, x: 1, y: 1 }).img;
  return decorCache[type];
}

function renderIntro() {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const lv = G.levelIndex;
  const names = ['PETH STREETS', 'METRO STATION', 'SINHAGAD CLIMB', 'SHANIWAR WADA'];
  G.level = G.level && G.level.id === '1-' + (lv + 1) ? G.level : { id: '1-' + (lv + 1) };
  drawHUD();
  Font.draw(ctx, 'WORLD 1-' + (lv + 1), VIEW_W / 2, 80, '#ffffff', { align: 'center' });
  Font.draw(ctx, names[lv], VIEW_W / 2, 96, '#fcd23c', { align: 'center' });
  const hero = Sprites.hero[G.form === 2 ? 'fire' : 'normal'][G.form ? 'big' : 'small'].stand;
  ctx.drawImage(hero.img, VIEW_W / 2 - 30, 140 - hero.h);
  Font.draw(ctx, '*  ' + G.lives, VIEW_W / 2 - 6, 128, '#ffffff');
  const tips = [
    'TIP: JUMP ON AUTOS TO STOP THEM.',
    'TIP: STOMP A MONKEY, THEN KICK THE BALL!',
    'TIP: FALLING STONES CRUMBLE. KEEP MOVING!',
    'TIP: RING THE TEMPLE BELL TO WIN.',
  ];
  Font.draw(ctx, tips[lv], VIEW_W / 2, 176, '#8fd8f8', { align: 'center', tiny: true });
  if (G.checkpoint && G.checkpoint.levelIndex === lv) {
    Font.draw(ctx, 'STARTING FROM CHECKPOINT', VIEW_W / 2, 188, '#9ce05a', { align: 'center', tiny: true });
  }
}

function renderGameOver() {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  drawHUD();
  Font.draw(ctx, 'GAME OVER', VIEW_W / 2, 84, '#ffffff', { align: 'center', scale: 2 });
  Font.draw(ctx, "DON'T WORRY, " + G.name + '!', VIEW_W / 2, 112, '#fcd23c', { align: 'center' });
  if (G.stateT > 60) drawMenu(G.menuItems, 146);
}

function renderPause() {
  ctx.fillStyle = 'rgba(10,6,16,0.6)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  drawPanel(Math.round(VIEW_W / 2 - 80), 70, 160, 92);
  Font.draw(ctx, 'PAUSED', VIEW_W / 2, 80, '#fcd23c', { align: 'center' });
  drawMenu(G.menuItems.length ? G.menuItems : pauseItems(), 104);
}

function renderEnding() {
  const t = G.stateT;
  // night sky
  const bands = ['#0a0e2a', '#10163a', '#18204a', '#22285a'];
  bands.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(0, i * 40, VIEW_W, 40);
  });
  ctx.fillStyle = '#2a2050';
  ctx.fillRect(0, 160, VIEW_W, 80);
  const r = mulberry32(99);
  for (let i = 0; i < 60; i++) {
    const x = r() * VIEW_W;
    const y = r() * 150;
    if ((i + Math.floor(t / 10)) % 7) {
      ctx.fillStyle = i % 5 ? '#c8d0ff' : '#ffffff';
      ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
    }
  }
  for (const f of G.fx) f.draw(ctx);
  // festival pandal
  const cx = Math.round(VIEW_W / 2);
  const base = 204;
  ctx.fillStyle = '#6a2a1a';
  ctx.fillRect(cx - 90, 120, 6, base - 120);
  ctx.fillRect(cx + 84, 120, 6, base - 120);
  ctx.fillStyle = '#c0302a';
  ctx.fillRect(cx - 96, 108, 192, 14);
  ctx.fillStyle = '#f5821f';
  ctx.fillRect(cx - 96, 104, 192, 4);
  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = i % 2 ? '#fcd23c' : '#f07010';
    ctx.fillRect(cx - 94 + i * 16, 122, 12, 4 + (i % 3));
  }
  // twinkling lights along the arch
  const lights = ['#ff5a5a', '#fcd23c', '#5ae07a', '#5ab4ff', '#f07cb0'];
  for (let i = 0; i < 24; i++) {
    const on = (i + Math.floor(t / 8)) % 3 !== 0;
    ctx.fillStyle = on ? lights[i % lights.length] : '#3a3050';
    ctx.fillRect(cx - 94 + i * 8, 100 + (i % 2), 2, 2);
  }
  Font.draw(ctx, 'GANESHOTSAV', cx, 111, '#fff4d0', { align: 'center' });
  // ground and a mountain of modaks
  ctx.fillStyle = '#4a2a1a';
  ctx.fillRect(0, base, VIEW_W, VIEW_H - base);
  ctx.fillStyle = '#c8a040';
  ctx.fillRect(cx - 26, base - 4, 52, 4);
  const pile = [[0, 0], [-12, 0], [12, 0], [-6, -9], [6, -9], [0, -18], [-18, 0], [18, 0]];
  for (const [ox, oy] of pile) ctx.drawImage(Sprites.s.modak.img, cx + ox - 8, base - 18 + oy);
  // the hero celebrates, the monkey king says sorry
  const hop = Math.abs(Math.sin(t * 0.08)) * 14;
  const hero = Sprites.hero[G.form === 2 ? 'fire' : 'normal'][G.form ? 'big' : 'small'];
  const hs = hop > 3 ? hero.jump : hero.stand;
  ctx.drawImage(hs.img, cx - 60, base - hs.h - Math.round(hop));
  ctx.drawImage(Sprites.s.boss_walk1.img, cx + 38, base - 32);
  ctx.drawImage(Sprites.s.modak.img, cx + 34, base - 30);
  // dhol players bouncing
  ctx.drawImage(Sprites.s.dhol.img, cx - 86, base - 16 - (Math.floor(t / 10) % 2) * 2);
  ctx.drawImage(Sprites.s.dhol2.img, cx + 72, base - 16 - (Math.floor(t / 10 + 1) % 2) * 2);

  Font.draw(ctx, 'GANPATI BAPPA MORYA!', cx, 18, '#fcd23c', { align: 'center', scale: VIEW_W > 340 ? 2 : 1, outline: '#9e1c1c' });
  const lines = ['THANK YOU, ' + G.name + '!', 'THE MODAKS ARE BACK AND', "PUNE'S GANESHOTSAV IS SAVED!"];
  lines.forEach((ln, i) => {
    if (t > 40 + i * 40) Font.draw(ctx, ln, cx, 44 + i * 12, '#ffffff', { align: 'center', shadow: '#1a1020' });
  });
  if (t > 200) {
    Font.draw(ctx, 'SCORE ' + String(G.score).padStart(6, '0') + '   COINS ' + G.coins, cx, 86, '#8fd8f8', { align: 'center', tiny: true });
  }
  if (t > 240) drawMenu(G.menuItems, 222);
}

function render() {
  ctx.imageSmoothingEnabled = false;
  switch (G.state) {
    case 'title':
      renderTitle();
      break;
    case 'story':
      renderStory();
      break;
    case 'intro':
      renderIntro();
      break;
    case 'play':
      drawWorld();
      drawHUD();
      if (G.paused) renderPause();
      else G.menuRects = null;
      break;
    case 'gameover':
      renderGameOver();
      break;
    case 'ending':
      renderEnding();
      break;
    default:
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
  if (Sound.isMuted() && G.state === 'play' && !G.paused) {
    Font.draw(ctx, 'MUTED (M)', VIEW_W - 10, VIEW_H - 12, '#ffffff', { align: 'right', tiny: true, outline: '#1a1020' });
  }
  present();
}

// ----------------------------------------------------------------- loop --
function step() {
  Input.update();
  if (Input.pressed('mute')) Sound.toggleMute();
  G.frame++;
  G.stateT++;
  switch (G.state) {
    case 'title':
      updateTitle();
      break;
    case 'story':
      updateStory();
      break;
    case 'intro':
      updateIntro();
      break;
    case 'play':
      updatePlay();
      break;
    case 'gameover':
      updateGameOver();
      break;
    case 'ending':
      updateEnding();
      break;
  }
  Sound.update();
}

let lastTime = 0;
let acc = 0;
const STEP = 1000 / 60;
function loop(now) {
  if (!lastTime) lastTime = now;
  acc += Math.min(now - lastTime, 100);
  lastTime = now;
  let steps = 0;
  while (acc >= STEP && steps < 5) {
    if (!G.manual) step();
    acc -= STEP;
    steps++;
  }
  if (steps) render();
  requestAnimationFrame(loop);
}

// ---------------------------------------------------------- name entry --
function openNameEntry() {
  const box = document.getElementById('name-entry');
  const input = document.getElementById('name-input');
  if (!box || !input) return;
  G.nameOpen = true;
  box.hidden = false;
  input.value = G.name === 'PUNEKAR' ? '' : G.name;
  setTimeout(() => input.focus(), 30);
}
function closeNameEntry(save) {
  const box = document.getElementById('name-entry');
  const input = document.getElementById('name-input');
  if (save) {
    const n = cleanName(input.value);
    G.name = n || 'PUNEKAR';
    Store.set('name', G.name);
  }
  box.hidden = true;
  input.blur();
  G.nameOpen = false;
  Input.clear();
}

// ----------------------------------------------------------------- boot --
function boot(saved) {
  buildSprites();
  buildBackgrounds();
  setupDisplay();
  G.name = cleanName(Store.get('name', '')) || 'PUNEKAR';
  const hashName = cleanName(decodeURIComponent((location.hash || '').slice(1)));
  if (hashName) G.name = hashName;
  G.best = Store.get('best', 0) || 0;
  G.unlocked = clamp(Store.get('unlocked', 0) || 0, 0, LEVELS.length - 1);

  for (const el of document.querySelectorAll('.pad')) Input.bindTouch(el);
  const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  document.body.classList.toggle('touch', isTouch);
  if (isTouch) Input.setDevice('touch');

  Input.onFirstInteraction(() => {
    Sound.init();
    Sound.resume();
  });
  screen.addEventListener('pointerdown', (e) => {
    Sound.init();
    Sound.resume();
    onCanvasTap(e.clientX, e.clientY);
  });
  const form = document.getElementById('name-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      closeNameEntry(true);
    });
    document.getElementById('name-cancel').addEventListener('click', () => closeNameEntry(false));
    document.getElementById('name-input').addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeNameEntry(false);
    });
  }
  const pauseBtn = document.getElementById('btn-pause');
  if (pauseBtn) {
    pauseBtn.addEventListener('click', () => {
      if (G.state === 'play' && G.player.state === 'normal') {
        G.paused = !G.paused;
        G.menuIndex = 0;
        Sound.play('pause');
      }
    });
  }
  const muteBtn = document.getElementById('btn-mute');
  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      Sound.init();
      Sound.toggleMute();
      muteBtn.classList.toggle('off', Sound.isMuted());
    });
    muteBtn.classList.toggle('off', Sound.isMuted());
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (G.state === 'play' && G.player && G.player.state === 'normal') G.paused = true;
      Sound.suspend();
    } else {
      Sound.resume();
    }
  });

  goTitle();
  if (saved && saved.levelIndex != null) {
    // restore after a live code update
    G.score = saved.score || 0;
    G.coins = saved.coins || 0;
    G.lives = saved.lives || START_LIVES;
    G.form = saved.form || 0;
    G.levelIndex = saved.levelIndex;
    if (saved.state === 'play' || saved.state === 'intro') setState('intro');
  }
  requestAnimationFrame(loop);

  if (window.claude && window.claude.hot && window.claude.hot.snapshot) {
    window.claude.hot.snapshot(() => ({
      state: G.state,
      levelIndex: G.levelIndex,
      score: G.score,
      coins: G.coins,
      lives: G.lives,
      form: G.form,
    }));
  }
}

// Debug hooks used by the automated tests.
window.SuperPunekar = {
  G,
  startLevel(i, form = 0) {
    Sound.init();
    G.levelIndex = i;
    G.lives = START_LIVES;
    G.form = form;
    G.checkpoint = null;
    beginLevel();
  },
  // tests drive the game frame by frame with manual mode on
  setManual(on) {
    G.manual = on;
  },
  step(n = 1) {
    for (let i = 0; i < n; i++) step();
    render();
  },
  teleport(tx, ty) {
    const p = G.player;
    p.x = tx * TILE + 2;
    p.y = (ty + 1) * TILE - p.h;
    p.vx = p.vy = 0;
    snapCamera();
  },
};
