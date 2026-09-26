'use strict';
// Tile map, level-building helpers and the core platformer physics.
// This file has no DOM dependencies, so tools/verify-levels.js can run it in Node.

const T = {
  EMPTY: 0,
  GROUND: 1,
  BRICK: 2,
  QBLOCK: 3,
  USED: 4,
  HARD: 5,
  PIPE_TL: 6,
  PIPE_TR: 7,
  PIPE_L: 8,
  PIPE_R: 9,
  HIDDEN: 10,
  COIN: 11,
  LEDGE: 12, // jump-through from below
  STONE: 13,
  LAVA: 14,
  BRIDGE: 15,
  SPIPE_MT: 16,
  SPIPE_MB: 17,
  SPIPE_T: 18,
  SPIPE_B: 19,
  VEHICLE: 20, // invisible solid box under a traffic-jam vehicle drawing
};

const SOLID = new Uint8Array(32);
[T.GROUND, T.BRICK, T.QBLOCK, T.USED, T.HARD, T.PIPE_TL, T.PIPE_TR, T.PIPE_L, T.PIPE_R, T.STONE, T.BRIDGE,
  T.SPIPE_MT, T.SPIPE_MB, T.SPIPE_T, T.SPIPE_B, T.VEHICLE].forEach((t) => (SOLID[t] = 1));

class Area {
  constructor(name, width, theme, opts = {}) {
    this.name = name;
    this.w = width;
    this.h = ROWS;
    this.theme = theme;
    this.music = opts.music || 'peth';
    this.tiles = new Uint8Array(width * ROWS);
    this.contents = new Map(); // "x,y" -> content for ? / brick / hidden blocks
    this.spawns = []; // {type, x, y, ...} in tiles
    this.decor = []; // {type, x, y, ...}
    this.pipes = []; // warp pipes
    this.platforms = []; // moving / falling platforms
    this.lava = []; // {x0, x1, y} surface rows for drawing
    this.flag = null; // {x}
    this.house = null; // {x}
    this.checkpoints = [];
    this.boss = null;
    this.bgTint = opts.bgTint || null;
    this.jam = null; // traffic jam gag: { x0, x1 } in tiles
    this.cameraMaxX = null;
  }
  inBounds(x, y) {
    return x >= 0 && x < this.w && y >= 0 && y < ROWS;
  }
  get(x, y) {
    if (x < 0 || x >= this.w) return T.HARD; // level edges act as walls
    if (y < 0 || y >= ROWS) return T.EMPTY;
    return this.tiles[y * this.w + x];
  }
  set(x, y, t) {
    if (this.inBounds(x, y)) this.tiles[y * this.w + x] = t;
  }
  key(x, y) {
    return x + ',' + y;
  }

  // ---------------- builder helpers (coordinates in tiles, rows 0..14) -----
  ground(x0, x1, top = 13) {
    for (let x = x0; x <= x1; x++) for (let y = top; y < ROWS; y++) this.set(x, y, T.GROUND);
    return this;
  }
  fill(x0, x1, y0, y1, t) {
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) this.set(x, y, t);
    return this;
  }
  row(t, x0, x1, y) {
    for (let x = x0; x <= x1; x++) this.set(x, y, t);
    return this;
  }
  q(x, y, content = 'coin') {
    this.set(x, y, T.QBLOCK);
    this.contents.set(this.key(x, y), content);
    return this;
  }
  brick(x, y, content) {
    this.set(x, y, T.BRICK);
    if (content) this.contents.set(this.key(x, y), content);
    return this;
  }
  bricks(x0, x1, y) {
    for (let x = x0; x <= x1; x++) this.brick(x, y);
    return this;
  }
  hidden(x, y, content = 'modak') {
    this.set(x, y, T.HIDDEN);
    this.contents.set(this.key(x, y), content);
    return this;
  }
  coins(x0, x1, y) {
    for (let x = x0; x <= x1; x++) this.set(x, y, T.COIN);
    return this;
  }
  hard(x, y) {
    this.set(x, y, T.HARD);
    return this;
  }
  // staircase standing on the ground (rows above 13); dir 1 = rising to the right
  stairs(x, n, dir = 1, base = 12, tile = T.HARD) {
    for (let i = 0; i < n; i++) {
      const h = dir > 0 ? i + 1 : n - i;
      for (let k = 0; k < h; k++) this.set(x + i, base - k, tile);
    }
    return this;
  }
  column(x, h, base = 12, tile = T.HARD) {
    for (let k = 0; k < h; k++) this.set(x, base - k, tile);
    return this;
  }
  // vertical pipe with its lip at row `top`, reaching down to `bottom`
  pipe(x, top, opts = {}) {
    const bottom = opts.bottom == null ? 12 : opts.bottom;
    this.set(x, top, T.PIPE_TL);
    this.set(x + 1, top, T.PIPE_TR);
    for (let y = top + 1; y <= bottom; y++) {
      this.set(x, y, T.PIPE_L);
      this.set(x + 1, y, T.PIPE_R);
    }
    if (opts.cobra) this.spawns.push({ type: 'cobra', x, y: top });
    if (opts.warp) this.pipes.push({ x, y: top, dir: 'down', ...opts.warp });
    return this;
  }
  // ceiling pipe hanging down (lip at the bottom), used for bonus-room exits
  pipeDown(x, bottomRow, topRow = 0) {
    for (let y = topRow; y < bottomRow; y++) {
      this.set(x, y, T.PIPE_L);
      this.set(x + 1, y, T.PIPE_R);
    }
    this.set(x, bottomRow, T.PIPE_TL);
    this.set(x + 1, bottomRow, T.PIPE_TR);
    return this;
  }
  // sideways pipe whose mouth faces left at (x, y..y+1); joins a vertical pipe going up
  sidePipe(x, y, warp) {
    this.set(x, y, T.SPIPE_MT);
    this.set(x, y + 1, T.SPIPE_MB);
    this.set(x + 1, y, T.SPIPE_T);
    this.set(x + 1, y + 1, T.SPIPE_B);
    for (let yy = 0; yy <= y + 1; yy++) {
      this.set(x + 2, yy, T.PIPE_L);
      this.set(x + 3, yy, T.PIPE_R);
    }
    this.pipes.push({ x, y, dir: 'right', ...warp });
    return this;
  }
  ledge(x0, x1, y, pillar = true) {
    this.row(T.LEDGE, x0, x1, y);
    if (pillar) this.decor.push({ type: 'pillar', x: x0, y: y + 1, w: x1 - x0 + 1, back: true });
    return this;
  }
  lavaPit(x0, x1, top = 13) {
    this.fill(x0, x1, top, ROWS - 1, T.LAVA);
    this.lava.push({ x0, x1, y: top });
    return this;
  }
  // a stuck vehicle: drawn as decor, solid so the hero can hop along the roofs
  vehicle(kind, x, w, h) {
    this.fill(x, x + w - 1, 13 - h, 12, T.VEHICLE);
    this.decor.push({ type: 'vehicle', kind, x, y: 13, w, h, jam: true });
    if (!this.jam) this.jam = { x0: x, x1: x + w - 1 };
    this.jam.x0 = Math.min(this.jam.x0, x);
    this.jam.x1 = Math.max(this.jam.x1, x + w - 1);
    return this;
  }
  enemy(type, x, y = 12, opts = {}) {
    this.spawns.push({ type, x, y, ...opts });
    return this;
  }
  deco(type, x, y = 13, opts = {}) {
    this.decor.push({ type, x, y, ...opts });
    return this;
  }
  sign(x, lines, opts = {}) {
    return this.deco('sign', x, opts.y || 13, { lines, ...opts });
  }
  platform(opts) {
    this.platforms.push(opts);
    return this;
  }
  checkpoint(x, y = 12) {
    this.checkpoints.push({ x, y });
    return this;
  }
  setFlag(x) {
    // flagpole standing on a hard block at row 12
    this.hard(x, 12);
    this.flag = { x };
    return this;
  }
  setHouse(x) {
    this.house = { x };
    this.deco('house', x, 13);
    return this;
  }
}

function isSolid(area, tx, ty) {
  return SOLID[area.get(tx, ty)] === 1;
}

// ------------------------------------------------------------ physics -------
const PHYS = {
  walkAcc: 0.055,
  runAcc: 0.085,
  airAcc: 0.06,
  friction: 0.07,
  skidDec: 0.2,
  maxWalk: 1.5,
  maxRun: 2.6,
  jumpV: 4.6,
  jumpVRun: 5.0,
  gHold: 0.15,
  gFall: 0.46,
  maxFall: 5,
  coyote: 6,
  buffer: 7,
};

// Move an entity horizontally and resolve against the tile map.
// Returns -1/1 when a wall is hit on that side, else 0.
function moveX(e, area, dx) {
  if (dx === 0) return 0;
  e.x += dx;
  const top = Math.floor(e.y / TILE);
  const bot = Math.floor((e.y + e.h - 0.01) / TILE);
  if (dx > 0) {
    const tx = Math.floor((e.x + e.w - 0.01) / TILE);
    for (let ty = top; ty <= bot; ty++) {
      if (isSolid(area, tx, ty)) {
        e.x = tx * TILE - e.w;
        return 1;
      }
    }
  } else {
    const tx = Math.floor(e.x / TILE);
    for (let ty = top; ty <= bot; ty++) {
      if (isSolid(area, tx, ty)) {
        e.x = (tx + 1) * TILE;
        return -1;
      }
    }
  }
  return 0;
}

// Move vertically. Returns { floor, ceil: [{tx, ty}], } info.
// opts.hidden: player can hit hidden blocks from below.
// opts.ledges: land on jump-through ledges.
function moveY(e, area, dy, opts = {}) {
  const res = { floor: false, ceil: null };
  if (dy === 0) return res;
  const prevBottom = e.y + e.h;
  e.y += dy;
  const left = Math.floor(e.x / TILE);
  const right = Math.floor((e.x + e.w - 0.01) / TILE);
  if (dy > 0) {
    const ty = Math.floor((e.y + e.h - 0.01) / TILE);
    for (let tx = left; tx <= right; tx++) {
      const t = area.get(tx, ty);
      const ledge = t === T.LEDGE && opts.ledges !== false && prevBottom <= ty * TILE + 0.01;
      if (SOLID[t] || ledge) {
        e.y = ty * TILE - e.h;
        res.floor = true;
        return res;
      }
    }
  } else {
    const ty = Math.floor(e.y / TILE);
    if (ty < 0) return res;
    const hits = [];
    for (let tx = left; tx <= right; tx++) {
      const t = area.get(tx, ty);
      if (SOLID[t] || (opts.hidden && t === T.HIDDEN)) hits.push(tx);
    }
    if (hits.length) {
      // corner forgiveness: nudge sideways if only a sliver of the head clips a block
      if (opts.nudge && hits.length === 1) {
        const tx = hits[0];
        const overlapL = (tx + 1) * TILE - e.x; // clipping a block to our left
        const overlapR = e.x + e.w - tx * TILE; // clipping a block to our right
        if (tx === left && overlapL <= 5 && !isSolid(area, tx + 1, ty)) {
          e.x = (tx + 1) * TILE;
          return res;
        }
        if (tx === right && overlapR <= 5 && !isSolid(area, tx - 1, ty)) {
          e.x = tx * TILE - e.w;
          return res;
        }
      }
      e.y = (ty + 1) * TILE;
      // choose the block under the centre of the head
      const cx = e.x + e.w / 2;
      let best = hits[0];
      let bestD = 1e9;
      for (const tx of hits) {
        const d = Math.abs(tx * TILE + TILE / 2 - cx);
        if (d < bestD) {
          bestD = d;
          best = tx;
        }
      }
      res.ceil = { tx: best, ty };
    }
  }
  return res;
}

function onGroundCheck(e, area) {
  const y = e.y + e.h;
  const ty = Math.floor(y / TILE);
  if (Math.abs(y - ty * TILE) > 0.01) return false;
  const left = Math.floor(e.x / TILE);
  const right = Math.floor((e.x + e.w - 0.01) / TILE);
  for (let tx = left; tx <= right; tx++) {
    const t = area.get(tx, ty);
    if (SOLID[t] || t === T.LEDGE) return true;
  }
  return false;
}

// One frame of player movement physics, shared by the game and the level verifier.
// input: { left, right, down, jumpHeld, jumpPressed, run }
function stepPlayerPhysics(p, input, area, platforms) {
  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const crouch = p.big && input.down && p.onGround;
  p.crouching = p.big && input.down && (p.onGround || p.crouching);
  const maxSpeed = input.run ? PHYS.maxRun : PHYS.maxWalk;

  if (p.onGround) {
    p.airMax = Math.max(Math.abs(p.vx), PHYS.maxWalk);
    if (crouch) {
      p.vx = approach(p.vx, 0, PHYS.friction);
    } else if (dir !== 0) {
      if (p.vx * dir < 0) {
        p.vx += dir * PHYS.skidDec;
        p.skidding = true;
      } else {
        p.skidding = false;
        if (Math.abs(p.vx) < maxSpeed) {
          p.vx += dir * (input.run ? PHYS.runAcc : PHYS.walkAcc);
          if (Math.abs(p.vx) > maxSpeed) p.vx = dir * maxSpeed;
        } else {
          // let go of RUN: ease back down to walking speed
          p.vx = approach(p.vx, dir * maxSpeed, 0.05);
        }
      }
      p.facing = dir;
    } else {
      p.skidding = false;
      p.vx = approach(p.vx, 0, PHYS.friction);
    }
  } else {
    if (dir !== 0) {
      p.vx += dir * PHYS.airAcc;
      const airMax = Math.max(p.airMax || 0, PHYS.maxWalk);
      if (Math.abs(p.vx) > airMax) p.vx = sign(p.vx) * airMax;
    }
  }

  // jump buffering and coyote time
  if (input.jumpPressed) p.jumpBuffer = PHYS.buffer;
  else if (p.jumpBuffer > 0) p.jumpBuffer--;
  if (p.onGround) p.coyote = PHYS.coyote;
  else if (p.coyote > 0) p.coyote--;

  let jumped = false;
  if (p.jumpBuffer > 0 && p.coyote > 0 && !p.jumping) {
    const speed = Math.abs(p.vx);
    p.vy = -(PHYS.jumpV + (PHYS.jumpVRun - PHYS.jumpV) * clamp((speed - PHYS.maxWalk) / (PHYS.maxRun - PHYS.maxWalk), 0, 1));
    p.jumping = true;
    p.onGround = false;
    p.coyote = 0;
    p.jumpBuffer = 0;
    p.airMax = Math.max(speed, PHYS.maxWalk);
    p.platform = null;
    jumped = true;
  }

  const g = p.vy < 0 && input.jumpHeld && p.jumping ? PHYS.gHold : PHYS.gFall;
  p.vy = Math.min(p.vy + g, PHYS.maxFall);

  // horizontal
  const hitX = moveX(p, area, p.vx);
  if (hitX) p.vx = 0;
  if (p.x < 0) {
    p.x = 0;
    p.vx = Math.max(p.vx, 0);
  }

  // vertical
  const wasOnGround = p.onGround;
  const res = moveY(p, area, p.vy, { hidden: true, nudge: true });
  let landed = false;
  if (res.floor) {
    p.vy = 0;
    landed = true;
  }
  if (res.ceil) {
    p.vy = Math.max(p.vy, 0.5);
    p.jumping = false;
  }
  // moving platforms (landing only from above)
  if (platforms && p.vy >= 0) {
    for (const pl of platforms) {
      if (pl.dead) continue;
      const prevBottom = p.y + p.h - p.vy;
      const tol = 2 + Math.abs(pl.dy || 0);
      if (p.x + p.w > pl.x && p.x < pl.x + pl.w && p.y + p.h >= pl.y && prevBottom <= pl.y + tol) {
        p.y = pl.y - p.h;
        p.vy = 0;
        landed = true;
        p.platform = pl;
      }
    }
  }
  p.onGround = landed || (p.vy >= 0 && onGroundCheck(p, area));
  if (p.onGround) p.jumping = false;
  if (!landed) p.platform = null;
  return { jumped, ceil: res.ceil, landedNow: p.onGround && !wasOnGround };
}
