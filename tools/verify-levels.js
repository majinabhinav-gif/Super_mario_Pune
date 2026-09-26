// Proves every level can be finished using the game's real physics.
// It explores all standing spots reachable from the start by simulating many
// jumps (different run-ups, jump lengths and timings) with stepPlayerPhysics,
// then checks that the flag or bell can be reached, and reports spots from
// which the goal can no longer be reached (soft-locks).
//
// Usage: node tools/verify-levels.js            (small hero, walking speed allowed to build up)
//        node tools/verify-levels.js --no-run   (never hold the run button)
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const noRun = process.argv.includes('--no-run');
const ctx = vm.createContext({ console, Math, Map, Set, Array, Object, Number, String, Uint8Array, Error, JSON });
for (const f of ['core.js', 'world.js', 'levels.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', f), 'utf8'), ctx, { filename: f });
}
const { LEVELS, T, SOLID, TILE, stepPlayerPhysics, Area } = vm.runInContext(
  '({ LEVELS, T, SOLID, TILE, stepPlayerPhysics, Area })',
  ctx
);

// Moving platforms are approximated as ledges covering their whole path (the player can wait for them).
function withPlatformsAsLedges(area) {
  const a = Object.create(Object.getPrototypeOf(area));
  Object.assign(a, area);
  a.tiles = new Uint8Array(area.tiles);
  for (const pl of area.platforms) {
    if (pl.kind === 'fall') {
      for (let x = pl.x; x < pl.x + pl.w; x++) if (a.get(x, pl.y) === T.EMPTY) a.set(x, pl.y, T.LEDGE);
    } else if (pl.axis === 'x') {
      for (let x = pl.min; x < pl.max + pl.w; x++) if (a.get(x, pl.y) === T.EMPTY) a.set(x, pl.y, T.LEDGE);
    } else {
      for (let y = pl.min; y <= pl.max; y++) for (let x = pl.x; x < pl.x + pl.w; x++) if (a.get(x, y) === T.EMPTY) a.set(x, y, T.LEDGE);
    }
  }
  return a;
}

const supportive = (t) => SOLID[t] || t === T.LEDGE;
function standable(a, tx, ty) {
  return supportive(a.get(tx, ty)) && !SOLID[a.get(tx, ty - 1)] && ty - 1 >= 0;
}

function runway(a, tx, ty, dir) {
  let n = 0;
  for (let x = tx - dir; standable(a, x, ty) && n < 8; x -= dir) n++;
  return n;
}

function makePlayer(x, feet, v0) {
  return {
    x, y: feet - 15, w: 12, h: 15, vx: v0, vy: 0, onGround: true, jumping: false, coyote: 6,
    jumpBuffer: 0, big: false, facing: v0 >= 0 ? 1 : -1, airMax: Math.max(Math.abs(v0), 1.5), crouching: false,
  };
}

function overlapsSolid(a, p) {
  const l = Math.floor(p.x / TILE);
  const r = Math.floor((p.x + p.w - 0.01) / TILE);
  const t = Math.floor(p.y / TILE);
  const b = Math.floor((p.y + p.h - 0.01) / TILE);
  for (let x = l; x <= r; x++) for (let y = t; y <= b; y++) if (SOLID[a.get(x, y)]) return true;
  return false;
}

function landingNode(a, p) {
  const feetRow = Math.round((p.y + p.h) / TILE);
  const l = Math.floor(p.x / TILE);
  const r = Math.floor((p.x + p.w - 0.01) / TILE);
  const c = Math.floor((p.x + p.w / 2) / TILE);
  let best = null;
  for (let x = l; x <= r; x++) {
    if (supportive(a.get(x, feetRow)) && (best === null || Math.abs(x - c) < Math.abs(best - c))) best = x;
  }
  return best === null ? null : [best, feetRow];
}

function simulate(a, goal, sx, feet, dir, v0, run, hold, delay) {
  const p = makePlayer(sx, feet, v0);
  if (overlapsSolid(a, p)) return null;
  let airborne = false;
  let walked = 0;
  for (let f = 0; f < 320; f++) {
    const moving = f >= delay;
    const input = {
      left: moving && dir < 0,
      right: moving && dir > 0,
      down: false,
      run,
      jumpPressed: f === 0 && hold > 0,
      jumpHeld: f < hold,
    };
    stepPlayerPhysics(p, input, a, null);
    if (goal(p)) return { goal: true };
    if (!p.onGround) airborne = true;
    else if (!airborne && ++walked > 40) return null; // just walking along the floor
    if (airborne && p.onGround) return { node: landingNode(a, p) };
    if (p.y > 15 * TILE + 32) return { dead: true };
  }
  return null;
}

function verifyLevel(make) {
  const level = make();
  const areas = {};
  for (const name in level.areas) areas[name] = withPlatformsAsLedges(level.areas[name]);
  const goals = {};
  for (const name in areas) {
    const a = areas[name];
    if (a.flag) {
      const fx = a.flag.x * TILE;
      goals[name] = (p) => p.x + p.w >= fx - 0.5 && p.x <= fx + 9 && p.y < 13 * TILE;
    } else if (a.boss) {
      const b = { x: a.boss.bell.x * TILE, y: a.boss.bell.y * TILE - 16, w: 16, h: 48 };
      goals[name] = (p) => p.x < b.x + b.w && p.x + p.w > b.x && p.y < b.y + b.h && p.y + p.h > b.y;
    } else goals[name] = () => false;
  }

  const key = (area, x, y) => area + ':' + x + ',' + y;
  const edges = new Map(); // key -> Set(keys)
  const addEdge = (from, to) => {
    if (!edges.has(from)) edges.set(from, new Set());
    edges.get(from).add(to);
  };
  const GOAL = 'GOAL';

  // spawn -> node for "drop" style entries: simulate a fall
  function dropNode(areaName, tx, ty) {
    const a = areas[areaName];
    const p = makePlayer(tx * TILE + 2, (ty + 1) * TILE, 0);
    p.onGround = false;
    for (let f = 0; f < 200; f++) {
      stepPlayerPhysics(p, {}, a, null);
      if (p.onGround) {
        const n = landingNode(a, p);
        return n && key(areaName, n[0], n[1]);
      }
    }
    return null;
  }

  const startKey = dropNode(level.start.area, level.start.tx, level.start.ty);
  const queue = [startKey];
  const seen = new Set([startKey]);
  let sims = 0;

  while (queue.length) {
    const k = queue.shift();
    const [areaName, pos] = k.split(':');
    const [tx, ty] = pos.split(',').map(Number);
    const a = areas[areaName];
    const out = [];
    // walking to neighbours
    for (const d of [-1, 1]) if (standable(a, tx + d, ty)) out.push(key(areaName, tx + d, ty));
    // warp pipes
    for (const pipe of a.pipes) {
      const onDownPipe = pipe.dir === 'down' && ty === pipe.y && (tx === pipe.x || tx === pipe.x + 1);
      const atSidePipe = pipe.dir === 'right' && ty === pipe.y + 2 && tx === pipe.x - 1;
      if (onDownPipe || atSidePipe) {
        const target = pipe.exit === 'up' ? key(pipe.to, pipe.tx, pipe.ty) : dropNode(pipe.to, pipe.tx, pipe.ty);
        if (target) out.push(target);
      }
    }
    // jumps and walk-offs
    for (const dir of [-1, 1]) {
      const rw = runway(a, tx, ty, dir);
      const speeds = [[0, false]];
      if (rw >= 2) speeds.push([1.5 * dir, false]);
      if (rw >= 5 && !noRun) speeds.push([2.6 * dir, true]);
      const xs = [tx * TILE + 2, dir > 0 ? tx * TILE + 15 : tx * TILE - 11];
      for (const sx of xs) {
        for (const [v0, run] of speeds) {
          for (const hold of [0, 3, 8, 14, 20, 30, 60]) {
            for (const delay of v0 === 0 ? [0, 10, 20] : [0]) {
              sims++;
              const r = simulate(a, goals[areaName], sx, ty * TILE, dir, v0, run, hold, delay);
              if (!r) continue;
              if (r.goal) out.push(GOAL);
              else if (r.node) out.push(key(areaName, r.node[0], r.node[1]));
            }
          }
        }
      }
    }
    for (const n of out) {
      addEdge(k, n);
      if (n !== GOAL && !seen.has(n)) {
        seen.add(n);
        queue.push(n);
      }
    }
  }

  // reverse reachability from the goal
  const rev = new Map();
  for (const [from, tos] of edges) for (const to of tos) {
    if (!rev.has(to)) rev.set(to, new Set());
    rev.get(to).add(from);
  }
  const canFinish = new Set([GOAL]);
  const q2 = [GOAL];
  while (q2.length) {
    const n = q2.shift();
    for (const m of rev.get(n) || []) if (!canFinish.has(m)) {
      canFinish.add(m);
      q2.push(m);
    }
  }
  const stuck = [...seen].filter((n) => !canFinish.has(n));
  return { id: level.id, reachable: seen.size, finishable: canFinish.has(startKey), stuck, sims };
}

let ok = true;
for (const make of LEVELS) {
  const r = verifyLevel(make);
  const status = r.finishable ? 'OK ' : 'FAIL';
  console.log(`${status} ${r.id}: ${r.reachable} standing spots explored, ${r.sims} jumps simulated`);
  if (!r.finishable) ok = false;
  if (r.stuck.length) {
    ok = false;
    console.log(`     soft-lock spots (goal unreachable from here): ${r.stuck.join(' ')}`);
  }
}
process.exit(ok ? 0 : 1);
