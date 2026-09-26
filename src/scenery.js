'use strict';
// Procedurally painted backgrounds and decorations (Pune landmarks), pixel by pixel.

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function PX(g) {
  return {
    g,
    rect(x, y, w, h, c) {
      g.fillStyle = c;
      g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    },
    dot(x, y, c) {
      g.fillStyle = c;
      g.fillRect(Math.round(x), Math.round(y), 1, 1);
    },
    circle(cx, cy, r, c) {
      g.fillStyle = c;
      for (let y = -r; y <= r; y++) {
        const w = Math.floor(Math.sqrt(r * r - y * y) + 0.35);
        g.fillRect(Math.round(cx - w), Math.round(cy + y), 2 * w + 1, 1);
      }
    },
    // triangle roof: apex at (cx, top), base width w at top + h
    roof(cx, top, w, h, c) {
      g.fillStyle = c;
      for (let r = 0; r < h; r++) {
        const rw = Math.max(1, Math.round((w * (r + 1)) / h));
        g.fillRect(Math.round(cx - rw / 2), top + r, rw, 1);
      }
    },
  };
}

// ------------------------------------------------------------ buildings ----
function paintWada(p, x, groundY, w, floors, pal) {
  const fh = pal.floorH || 15;
  const h = floors * fh;
  const top = groundY - h;
  p.rect(x, top, w, h, pal.wall);
  p.rect(x + w - 3, top, 3, h, pal.wallShade);
  p.rect(x - 1, groundY - 4, w + 2, 4, pal.stone);
  // windows on each floor
  for (let f = 0; f < floors; f++) {
    const wy = groundY - (f + 1) * fh + 4;
    for (let wx = x + 4; wx + 4 <= x + w - 3; wx += 9) {
      p.rect(wx - 1, wy - 1, 6, 9, pal.wood);
      p.rect(wx, wy, 4, 7, pal.window);
      p.dot(wx + 1, wy, pal.wood);
      p.dot(wx + 2, wy, pal.wood);
    }
    if (f > 0) {
      // wooden balcony
      const by = groundY - f * fh;
      p.rect(x - 2, by - 1, w + 4, 2, pal.wood);
      for (let rx = x - 1; rx < x + w + 2; rx += 3) p.rect(rx, by - 5, 1, 4, pal.wood);
      p.rect(x - 2, by - 6, w + 4, 1, pal.wood);
    }
  }
  // ground floor door
  const dx = x + Math.floor(w / 2) - 3;
  p.rect(dx - 1, groundY - 13, 8, 9, pal.wood);
  p.rect(dx, groundY - 12, 6, 8, pal.door);
  // sloping clay-tile roof
  const rh = 7;
  for (let r = 0; r < rh; r++) {
    const inset = rh - 1 - r;
    p.rect(x - 4 + inset, top - rh + r, w + 8 - inset * 2, 1, r % 2 ? pal.roof : pal.roofShade);
  }
}

function paintTempleSpire(p, cx, groundY, pal, scale = 1) {
  const bw = Math.round(34 * scale);
  const bh = Math.round(20 * scale);
  p.rect(cx - bw / 2, groundY - bh, bw, bh, pal.stone);
  for (let i = 0; i < 5; i++) {
    const px = cx - bw / 2 + 3 + i * ((bw - 6) / 4);
    p.rect(px, groundY - bh + 5, 2, bh - 5, pal.shade);
  }
  p.rect(cx - bw / 2 - 2, groundY - bh - 2, bw + 4, 3, pal.trim);
  let y = groundY - bh - 2;
  let w = Math.round(26 * scale);
  let i = 0;
  while (w > 3) {
    const th = Math.round(5 * scale);
    p.rect(cx - w / 2, y - th, w, th, i % 2 ? pal.stone : pal.light);
    p.rect(cx - w / 2 + w - 2, y - th, 2, th, pal.shade);
    y -= th;
    w -= Math.max(2, Math.round(3 * scale));
    i++;
  }
  p.circle(cx, y - 2, 2, pal.gold);
  p.rect(cx, y - 7, 1, 4, pal.gold);
  // saffron pennant
  p.rect(cx + 1, y - 16, 1, 10, pal.pole);
  for (let r = 0; r < 5; r++) p.rect(cx + 2, y - 16 + r, 6 - r, 1, pal.flag);
}

function paintTree(p, cx, groundY, size, pal, rnd) {
  p.rect(cx - 1, groundY - size, 3, size, pal.trunk);
  const blobs = 6 + Math.floor(size / 5);
  for (let i = 0; i < blobs; i++) {
    const a = rnd() * Math.PI * 2;
    const d = rnd() * size * 0.35;
    p.circle(cx + Math.cos(a) * d, groundY - size + Math.sin(a) * d * 0.6, Math.round(size * 0.28 + rnd() * 3), pal.leaf);
  }
  for (let i = 0; i < blobs; i++) {
    const a = rnd() * Math.PI * 2;
    const d = rnd() * size * 0.3;
    p.circle(cx + Math.cos(a) * d - 2, groundY - size - 3 + Math.sin(a) * d * 0.5, Math.round(size * 0.15 + rnd() * 2), pal.leafLight);
  }
  if (pal.flower) {
    for (let i = 0; i < size * 2; i++) {
      const a = rnd() * Math.PI * 2;
      const d = rnd() * size * 0.5;
      p.dot(cx + Math.cos(a) * d, groundY - size + Math.sin(a) * d * 0.6, pal.flower);
    }
  }
}

// ----------------------------------------------------------- backgrounds ---
function ridge(w, base, waves, mesas) {
  const ys = new Array(w);
  for (let x = 0; x < w; x++) {
    let y = base;
    for (const [amp, k, ph] of waves) y += amp * Math.sin((2 * Math.PI * k * x) / w + ph);
    for (const m of mesas) {
      const my = m.top + Math.max(0, m.x0 - x) * m.slope + Math.max(0, x - m.x1) * m.slope;
      y = Math.min(y, my);
    }
    ys[x] = Math.round(y);
  }
  return ys;
}

function paintRidge(p, ys, color, edge) {
  for (let x = 0; x < ys.length; x++) {
    p.rect(x, ys[x], 1, 240 - ys[x], color);
    if (edge) p.dot(x, ys[x], edge);
  }
}

function buildOverworldBG() {
  // far: Sahyadri ranges with Sinhagad fort and its TV tower
  const far = makeCanvas(640, 240);
  let p = PX(far.getContext('2d'));
  const back = ridge(640, 150, [[7, 2, 0.5], [4, 5, 1.2], [2, 13, 0.2]], [
    { x0: 80, x1: 170, top: 131, slope: 0.8 },
    { x0: 400, x1: 530, top: 112, slope: 0.95 },
  ]);
  paintRidge(p, back, '#a4c4de', '#c4dcee');
  // fort walls along Sinhagad's plateau
  for (let x = 404; x <= 526; x++) {
    p.rect(x, back[x] - 3, 1, 3, '#8fb0cc');
    if (x % 5 < 2) p.rect(x, back[x] - 5, 1, 2, '#8fb0cc');
  }
  for (const bx of [404, 452, 526]) p.circle(bx, back[bx] - 3, 4, '#8fb0cc');
  // TV tower
  const tx = 492;
  const ttop = back[tx] - 44;
  for (let y = ttop; y < back[tx] - 3; y++) p.rect(tx, y, 2, 1, Math.floor((y - ttop) / 5) % 2 ? '#dfe7f2' : '#c98c98');
  p.rect(tx - 3, ttop + 6, 8, 2, '#b0c4d8');
  p.rect(tx + 0.5, ttop - 8, 1, 8, '#b0c4d8');
  const front = ridge(640, 176, [[6, 3, 2.0], [4, 7, 0.4], [2, 17, 1.0]], [{ x0: 250, x1: 330, top: 150, slope: 0.7 }]);
  paintRidge(p, front, '#8eb4d2', '#aecbe2');

  // mid: Pune city skyline with Parvati hill
  const mid = makeCanvas(768, 240);
  p = PX(mid.getContext('2d'));
  const rnd = mulberry32(7);
  const G = 214; // ground line in this layer
  // Parvati hill
  for (let x = 0; x < 260; x++) {
    const t = (x - 125) / 70;
    const y = Math.round(G - 72 * Math.exp(-t * t));
    p.rect(x, y, 1, 240 - y, '#79ad72');
    p.dot(x, y, '#98c890');
  }
  for (let i = 0; i < 70; i++) {
    const x = 50 + rnd() * 150;
    const t = (x - 125) / 70;
    const y = G - 72 * Math.exp(-t * t) + 6 + rnd() * 50;
    p.circle(x, y, 2 + Math.floor(rnd() * 2), '#5f9660');
  }
  // steps up the hill
  for (let s = 0; s < 22; s++) {
    const x = 70 + s * 2.4;
    const t = (x - 125) / 70;
    p.rect(x, G - 72 * Math.exp(-t * t) + 2, 2, 1, '#e8e0cc');
  }
  // Parvati temple on the summit
  const tpal = { stone: '#efe6d2', light: '#fbf4e4', shade: '#c9bca2', trim: '#d8b070', gold: '#f2c040', pole: '#6a5040', flag: '#f5821f' };
  paintTempleSpire(p, 125, G - 70, tpal, 0.55);
  p.rect(105, G - 76, 8, 6, '#efe6d2');
  p.roof(109, G - 83, 8, 7, '#e6dcc4');
  p.rect(138, G - 75, 7, 5, '#efe6d2');
  p.roof(141, G - 81, 7, 6, '#e6dcc4');

  const wadaA = { wall: '#ecdcbc', wallShade: '#d4c09c', stone: '#9a8e80', wood: '#7a4a2a', window: '#3a2a2a', door: '#4a2a18', roof: '#c0604a', roofShade: '#a44c3a' };
  const wadaB = { ...wadaA, wall: '#b8d4e0', wallShade: '#98b8c8' };
  const wadaC = { ...wadaA, wall: '#f0c8a0', wallShade: '#d8ac84' };
  const trees = { trunk: '#6a4a30', leaf: '#5f9a58', leafLight: '#7cb870' };
  const gulmohar = { trunk: '#6a4a30', leaf: '#5f9a58', leafLight: '#e8643a', flower: '#f89040' };

  paintTree(p, 262, G, 22, gulmohar, rnd);
  paintWada(p, 276, G, 58, 3, wadaA);
  // Dagdusheth-style temple
  paintTempleSpire(p, 362, G, { ...tpal, stone: '#f4ead0', trim: '#e0a040' }, 1);
  // apartment block
  const apt = (x, w, h, wall, win) => {
    p.rect(x, G - h, w, h, wall);
    p.rect(x + w - 3, G - h, 3, h, 'rgba(0,0,0,0.08)');
    for (let y = G - h + 5; y < G - 6; y += 8) for (let wx = x + 4; wx < x + w - 5; wx += 7) p.rect(wx, y, 4, 4, win);
    p.rect(x - 1, G - h - 2, w + 2, 2, '#bca894');
  };
  apt(398, 48, 78, '#e8b8a4', '#8a6a78');
  p.rect(410, G - 90, 12, 10, '#9aa4ac'); // water tank
  p.rect(412, G - 80, 2, 2, '#7a848c');
  p.rect(418, G - 80, 2, 2, '#7a848c');
  paintTree(p, 458, G, 18, trees, rnd);
  paintWada(p, 470, G, 50, 2, wadaB);
  apt(530, 56, 62, '#dcd4a8', '#7a7458');
  paintTree(p, 600, G, 20, gulmohar, rnd);
  paintWada(p, 614, G, 62, 3, wadaC);
  // small dome temple
  p.rect(690, G - 20, 26, 20, '#f2ead8');
  p.circle(703, G - 22, 9, '#f6efe0');
  p.rect(702, G - 36, 2, 5, '#f2c040');
  paintTree(p, 738, G, 24, trees, rnd);
  // what you see down a pit: a shadowy drain below the street
  const pit = ['#6a5446', '#5a463a', '#4a382e', '#3a2c24', '#2c201a', '#201712'];
  for (let y = G; y < 240; y++) p.rect(0, y, 768, 1, pit[Math.min(pit.length - 1, Math.floor((y - G) / 4))]);

  // clouds
  const clouds = makeCanvas(960, 110);
  p = PX(clouds.getContext('2d'));
  const crnd = mulberry32(3);
  for (const [cx, cy, s] of [[60, 34, 1], [250, 60, 0.7], [420, 26, 1.2], [640, 52, 0.8], [820, 30, 1]]) {
    const parts = 5 + Math.floor(s * 3);
    for (let i = 0; i < parts; i++) {
      const ox = (i - parts / 2) * 7 * s;
      p.circle(cx + ox, cy + 3, Math.round((6 + crnd() * 4) * s), '#d6ecfa');
    }
    for (let i = 0; i < parts; i++) {
      const ox = (i - parts / 2) * 7 * s;
      p.circle(cx + ox, cy - crnd() * 3, Math.round((5 + crnd() * 5) * s), '#ffffff');
    }
  }

  return {
    sky: [['#5aa8ec', 0], ['#6cb4f0', 50], ['#80c0f4', 95], ['#96ccf6', 130], ['#b0daf8', 160]],
    layers: [
      { img: clouds, par: 0.12, drift: 0.08, y: 0 },
      { img: far, par: 0.18, y: 0 },
      { img: mid, par: 0.4, y: 0 },
    ],
  };
}

function buildUndergroundBG() {
  const wall = makeCanvas(256, 240);
  const p = PX(wall.getContext('2d'));
  p.rect(0, 0, 256, 240, '#0b0f1a');
  p.rect(0, 28, 256, 180, '#161e30');
  // tunnel ribs
  for (let x = 0; x < 256; x += 64) {
    p.rect(x, 28, 8, 180, '#1f2a42');
    p.rect(x + 8, 28, 1, 180, '#0e1422');
  }
  // cable trays and lights
  p.rect(0, 46, 256, 2, '#0a0d16');
  p.rect(0, 52, 256, 1, '#0a0d16');
  for (let x = 30; x < 256; x += 128) {
    p.rect(x, 36, 12, 3, '#f6eec0');
    p.rect(x - 2, 39, 16, 1, '#6a6a58');
  }
  // Pune Metro purple and aqua line stripes
  p.rect(0, 120, 256, 4, '#7a4ab0');
  p.rect(0, 126, 256, 2, '#3cc0c8');
  // tiled lower wall
  for (let y = 140; y < 208; y += 8) {
    for (let x = (y / 8) % 2 ? 0 : 8; x < 256; x += 16) p.rect(x, y, 15, 7, '#1a2338');
  }
  return {
    sky: [['#0b0f1a', 0]],
    layers: [{ img: wall, par: 0.5, y: 0 }],
  };
}

// Inside a Pune Metro station: ceiling lights, the purple/aqua line band and
// platform screen doors. The glass is left see-through so trains can pass behind it.
function buildMetroBG() {
  const W = 384;
  const back = makeCanvas(W, 240);
  let p = PX(back.getContext('2d'));
  p.rect(0, 0, W, 240, '#121824');
  p.rect(0, 150, W, 50, '#0c1018');
  for (let x = 20; x < W; x += 96) p.rect(x, 120, 6, 2, '#39445a');
  p.rect(0, 196, W, 3, '#3a3f4a'); // rail

  const front = makeCanvas(W, 240);
  const fg = front.getContext('2d');
  p = PX(fg);
  // ceiling panels and light strips
  p.rect(0, 0, W, 60, '#cdd2dc');
  for (let x = 0; x < W; x += 32) p.rect(x, 0, 1, 60, '#b2b8c4');
  for (let x = 6; x < W; x += 48) {
    p.rect(x, 42, 26, 4, '#fffbe6');
    p.rect(x - 1, 46, 28, 1, '#a8aebb');
  }
  // header band with the metro line colours
  p.rect(0, 60, W, 14, '#262b36');
  p.rect(0, 67, W, 3, '#7a4ab0');
  p.rect(0, 70, W, 2, '#3cc0c8');
  // platform screen doors: [frame][fixed glass][frame][door][seam][door][frame]
  for (let m = 0; m < W; m += 96) {
    const frame = (x, w) => {
      p.rect(m + x, 74, w, 126, '#aeb6c4');
      p.rect(m + x, 74, 1, 126, '#d8dde6');
    };
    frame(0, 4);
    frame(42, 4);
    frame(68, 2);
    frame(92, 4);
    fg.fillStyle = 'rgba(160, 205, 235, 0.16)';
    fg.fillRect(m + 4, 74, 38, 126);
    fg.fillRect(m + 46, 74, 22, 126);
    fg.fillRect(m + 70, 74, 22, 126);
    fg.fillStyle = 'rgba(255, 255, 255, 0.35)';
    fg.fillRect(m + 8, 80, 2, 30);
    fg.fillRect(m + 50, 80, 2, 20);
    p.rect(m + 52, 140, 12, 3, '#f5821f');
    p.rect(m + 74, 140, 12, 3, '#f5821f');
    p.rect(m + 66, 76, 6, 3, '#2ad06a');
    p.rect(m + 4, 196, 88, 4, '#8a92a0');
  }
  p.rect(0, 200, W, 8, '#9ca3b0');
  p.rect(0, 200, W, 1, '#c4cad4');
  return {
    sky: [['#121824', 0]],
    layers: [
      { img: back, par: 0.5, y: 0 },
      { train: true },
      { img: front, par: 0.5, y: 0 },
    ],
  };
}

// A metro train glides past behind the screen doors every so often.
function drawTrain(ctx, frame) {
  const t = frame % 1000;
  const len = 640;
  const x0 = Math.round(VIEW_W + 40 - t * 4.5);
  if (x0 + len < -20) return;
  const top = 92;
  const h = 102;
  ctx.fillStyle = '#e6eaf0';
  ctx.fillRect(x0, top, len, h);
  ctx.fillStyle = '#c6ccd6';
  ctx.fillRect(x0, top + h - 10, len, 10);
  ctx.fillStyle = '#7a4ab0';
  ctx.fillRect(x0, top + 58, len, 6);
  ctx.fillStyle = '#3cc0c8';
  ctx.fillRect(x0, top + 64, len, 3);
  for (let c = 0; c < len; c += 160) {
    ctx.fillStyle = '#9aa2ae';
    ctx.fillRect(x0 + c, top, 2, h);
    for (let w = 14; w < 150; w += 34) {
      ctx.fillStyle = '#2a3654';
      ctx.fillRect(x0 + c + w, top + 16, 22, 30);
      ctx.fillStyle = '#f6eec8';
      ctx.fillRect(x0 + c + w, top + 16, 22, 3);
    }
  }
  ctx.fillStyle = '#e6eaf0';
  ctx.fillRect(x0 - 8, top + 10, 8, h - 10);
  ctx.fillStyle = '#2a3654';
  ctx.fillRect(x0 - 6, top + 16, 12, 26);
  ctx.fillStyle = '#fff8c0';
  ctx.fillRect(x0 - 7, top + 76, 4, 4);
}

function buildSkyBG() {
  const far = makeCanvas(640, 240);
  let p = PX(far.getContext('2d'));
  // sun sits in the far layer so it drifts slowly
  p.circle(170, 150, 26, '#fbd89a');
  p.circle(170, 150, 21, '#fff0c0');
  const back = ridge(640, 158, [[8, 2, 0.1], [5, 6, 2.2], [2, 15, 0.7]], [
    { x0: 300, x1: 450, top: 124, slope: 1.0 },
  ]);
  paintRidge(p, back, '#8a6aa0', '#a684b8');
  // bastions and walls of the fort on the ridge
  for (let x = 305; x <= 445; x++) {
    p.rect(x, back[x] - 4, 1, 4, '#7a5a92');
    if (x % 6 < 2) p.rect(x, back[x] - 6, 1, 2, '#7a5a92');
  }
  for (const bx of [305, 350, 400, 445]) p.circle(bx, back[bx] - 4, 5, '#7a5a92');
  const tx = 420;
  const ttop = back[tx] - 40;
  p.rect(tx, ttop, 2, 36, '#6e5086');
  p.rect(tx - 3, ttop + 6, 8, 2, '#6e5086');

  const mid = makeCanvas(768, 240);
  p = PX(mid.getContext('2d'));
  const m = ridge(768, 190, [[10, 2, 1.1], [6, 5, 0.3], [3, 11, 2.4]], [{ x0: 500, x1: 600, top: 168, slope: 0.9 }]);
  paintRidge(p, m, '#4a4a7c', '#5e5e92');
  const rnd = mulberry32(11);
  for (let i = 0; i < 40; i++) {
    const x = Math.floor(rnd() * 768);
    p.circle(x, m[x] + 2, 2 + Math.floor(rnd() * 3), '#3e3e6c');
  }

  const mist = makeCanvas(512, 240);
  const mg = mist.getContext('2d');
  const grad = mg.createLinearGradient(0, 170, 0, 240);
  grad.addColorStop(0, 'rgba(255,236,220,0)');
  grad.addColorStop(1, 'rgba(255,236,220,0.75)');
  mg.fillStyle = grad;
  mg.fillRect(0, 170, 512, 70);
  const mp = PX(mg);
  const r2 = mulberry32(5);
  for (let i = 0; i < 14; i++) {
    const x = r2() * 512;
    const y = 196 + r2() * 30;
    for (let j = 0; j < 6; j++) mp.circle(x + j * 8, y + (j % 2) * 2, 7, 'rgba(255,240,230,0.22)');
  }
  return {
    sky: [['#2c3a7a', 0], ['#44468e', 30], ['#62509e', 60], ['#8e5ca4', 90], ['#c46a94', 118], ['#ec8a78', 146], ['#f7ad72', 172], ['#fbd28c', 196]],
    layers: [
      { img: far, par: 0.12, y: 0 },
      { img: mid, par: 0.3, y: 0 },
      { img: mist, par: 0.8, drift: 0.2, y: 0, front: false },
    ],
  };
}

function buildCastleBG() {
  const wall = makeCanvas(384, 240);
  const p = PX(wall.getContext('2d'));
  p.rect(0, 0, 384, 240, '#141020');
  for (let y = 0; y < 240; y += 16) {
    const off = (y / 16) % 2 ? 16 : 0;
    for (let x = -off; x < 384; x += 32) {
      p.rect(x + 1, y + 1, 30, 14, '#1c1729');
      p.rect(x + 1, y + 1, 30, 1, '#241e34');
    }
  }
  // arched windows looking out on the night sky
  for (const wx of [40, 232]) {
    p.rect(wx - 3, 50, 38, 62, '#2c2440');
    p.circle(wx + 16, 64, 16, '#2c2440');
    p.rect(wx, 64, 32, 46, '#15204a');
    p.circle(wx + 16, 64, 13, '#15204a');
    p.rect(wx + 15, 50, 2, 60, '#2c2440');
    p.rect(wx, 84, 32, 2, '#2c2440');
    const r = mulberry32(wx);
    for (let i = 0; i < 12; i++) p.dot(wx + 2 + r() * 28, 54 + r() * 52, '#e8e8ff');
  }
  p.circle(52, 70, 5, '#f4f0d0'); // the moon
  p.circle(54, 69, 4, '#15204a');
  // carved teak pillars (Shaniwar Wada style)
  for (const px of [150, 342]) {
    p.rect(px, 30, 10, 180, '#3e2618');
    p.rect(px + 1, 30, 2, 180, '#5a3a24');
    p.rect(px - 4, 30, 18, 6, '#4e3020');
    p.rect(px - 2, 36, 14, 3, '#4e3020');
    for (let y = 60; y < 200; y += 24) p.rect(px + 2, y, 6, 2, '#2a180e');
  }
  return {
    sky: [['#141020', 0]],
    layers: [{ img: wall, par: 0.5, y: 0 }],
  };
}

const Backgrounds = {};
function buildBackgrounds() {
  Backgrounds.overworld = buildOverworldBG();
  Backgrounds.underground = buildUndergroundBG();
  Backgrounds.metro = buildMetroBG();
  Backgrounds.sky = buildSkyBG();
  Backgrounds.castle = buildCastleBG();
}

function drawBackground(ctx, theme, camX, frame) {
  const bg = Backgrounds[theme];
  const sky = bg.sky;
  for (let i = 0; i < sky.length; i++) {
    const y0 = sky[i][1];
    const y1 = i + 1 < sky.length ? sky[i + 1][1] : VIEW_H;
    ctx.fillStyle = sky[i][0];
    ctx.fillRect(0, y0, VIEW_W, y1 - y0);
  }
  for (const L of bg.layers) {
    if (L.train) {
      drawTrain(ctx, frame);
      continue;
    }
    const w = L.img.width;
    const off = camX * L.par + (L.drift ? frame * L.drift : 0);
    let x = -(((off % w) + w) % w);
    for (; x < VIEW_W; x += w) ctx.drawImage(L.img, Math.round(x), L.y);
  }
}

// ------------------------------------------------------------ decorations --
// Decor is painted once into its own canvas when a level loads.
const DecorPainters = {
  bush(d) {
    const w = 16 * (d.size || 2);
    const c = makeCanvas(w + 8, 20);
    const p = PX(c.getContext('2d'));
    const n = d.size || 2;
    for (let i = 0; i <= n; i++) p.circle(4 + i * (w / n), 13, 7, '#1f6e2a');
    for (let i = 0; i <= n; i++) p.circle(4 + i * (w / n), 12, 6, '#3caa44');
    for (let i = 0; i <= n; i++) p.circle(3 + i * (w / n), 10, 3, '#7ad060');
    const r = mulberry32(d.x * 13);
    for (let i = 0; i < n * 5; i++) p.dot(2 + r() * (w + 2), 7 + r() * 10, i % 2 ? '#f06aa8' : '#ffffff');
    p.rect(0, 19, w + 8, 1, '#1f6e2a');
    return { img: c, ox: -4, oy: -20 };
  },
  sign(d) {
    const lines = d.lines;
    const maxLen = Math.max(...lines.map((l) => l.length));
    const bw = maxLen * 4 + 7;
    const bh = lines.length * 7 + 5;
    const postH = d.post == null ? 14 : d.post;
    const c = makeCanvas(bw + 2, bh + postH + 2);
    const g = c.getContext('2d');
    const p = PX(g);
    p.rect(4, bh, 2, postH + 2, '#6a4024');
    p.rect(bw - 5, bh, 2, postH + 2, '#6a4024');
    p.rect(1, 1, bw, bh, '#2a1a12');
    p.rect(0, 0, bw, bh, '#8a1c1c');
    p.rect(1, 1, bw - 2, bh - 2, '#fbf6e8');
    lines.forEach((ln, i) => {
      Font.draw(g, ln, bw / 2, 3 + i * 7, i === 0 && d.red !== false ? '#b01818' : '#1a1020', { tiny: true, align: 'center' });
    });
    return { img: c, ox: 0, oy: -(bh + postH + 2) };
  },
  lamp() {
    const c = makeCanvas(14, 62);
    const p = PX(c.getContext('2d'));
    p.rect(3, 6, 2, 56, '#3a3a48');
    p.rect(2, 58, 4, 4, '#2a2a36');
    p.rect(3, 4, 8, 2, '#3a3a48');
    p.rect(9, 5, 4, 3, '#3a3a48');
    p.rect(9, 8, 4, 2, '#fff2a8');
    return { img: c, ox: 0, oy: -62 };
  },
  stall(d) {
    const c = makeCanvas(52, 46);
    const g = c.getContext('2d');
    const p = PX(g);
    const kind = d.kind || 'chai';
    const stripe = { chai: ['#c83030', '#fbf6e8'], vadapav: ['#e07820', '#fbf6e8'], bhaji: ['#2a8a4a', '#fbf6e8'], misal: ['#b02020', '#f8d040'] }[kind];
    // canopy
    for (let x = 0; x < 52; x += 6) p.rect(x, 8, 6, 7, (x / 6) % 2 ? stripe[1] : stripe[0]);
    for (let x = 0; x < 52; x += 6) p.rect(x + 1, 15, 4, 2, (x / 6) % 2 ? stripe[1] : stripe[0]);
    p.rect(3, 15, 2, 20, '#6a4024');
    p.rect(47, 15, 2, 20, '#6a4024');
    // name board
    const label = { chai: 'CHAI', vadapav: 'VADA PAV', bhaji: 'BHAJI', misal: 'MISAL' }[kind];
    const lw = label.length * 4 + 5;
    p.rect(26 - lw / 2, 0, lw, 8, '#1a1020');
    p.rect(27 - lw / 2, 1, lw - 2, 6, '#fce070');
    Font.draw(g, label, 26, 2, '#8a1c1c', { tiny: true, align: 'center' });
    // counter
    p.rect(1, 30, 50, 10, '#9a5a2a');
    p.rect(1, 30, 50, 2, '#c07a3a');
    p.rect(1, 38, 50, 2, '#6a3a1a');
    // wheels
    p.circle(10, 42, 3, '#2a2a36');
    p.circle(42, 42, 3, '#2a2a36');
    p.dot(10, 42, '#8a8a9a');
    p.dot(42, 42, '#8a8a9a');
    if (kind === 'chai') {
      p.rect(14, 23, 9, 7, '#c8c8d0');
      p.rect(22, 25, 3, 2, '#c8c8d0');
      p.rect(16, 21, 5, 2, '#8a8a9a');
      for (let i = 0; i < 4; i++) p.rect(30 + i * 4, 26, 3, 4, '#f4ead8');
      for (let i = 0; i < 4; i++) p.rect(30 + i * 4, 27, 3, 2, '#b8783a');
    } else {
      p.rect(12, 25, 16, 5, '#4a4a58');
      p.rect(13, 24, 14, 2, '#e0a030');
      for (let i = 0; i < 3; i++) p.circle(34 + i * 5, 27, 2, '#d88a30');
    }
    return { img: c, ox: -4, oy: -46 };
  },
  tulsi() {
    const c = makeCanvas(16, 24);
    const p = PX(c.getContext('2d'));
    p.rect(3, 12, 10, 12, '#f2ead8');
    p.rect(2, 11, 12, 2, '#e07820');
    p.rect(2, 22, 12, 2, '#e07820');
    p.rect(6, 15, 4, 4, '#e07820');
    p.circle(8, 7, 5, '#2f8a3a');
    p.circle(6, 6, 2, '#5fc05a');
    p.circle(10, 4, 2, '#5fc05a');
    return { img: c, ox: 0, oy: -24 };
  },
  tree(d) {
    const size = d.size || 30;
    const c = makeCanvas(size * 2 + 8, size * 2 + 8);
    const p = PX(c.getContext('2d'));
    const pal =
      d.kind === 'neem'
        ? { trunk: '#5a3a24', leaf: '#2f7a3a', leafLight: '#52a04a' }
        : { trunk: '#5a3a24', leaf: '#2f7a3a', leafLight: '#e2502a', flower: '#fb8a30' };
    paintTree(p, size + 4, size * 2 + 8, size, pal, mulberry32(d.x * 7 + 1));
    return { img: c, ox: -(size + 4) + 8, oy: -(size * 2 + 8) };
  },
  house(d) {
    // end-of-level wada with a marigold toran over the door
    const c = makeCanvas(96, 96);
    const p = PX(c.getContext('2d'));
    const pal = { wall: '#f0dcb4', wallShade: '#d4bc90', stone: '#8a7e70', wood: '#6a3e22', window: '#2a1a1a', door: '#2a1610', roof: '#c0563e', roofShade: '#9e4430', floorH: 26 };
    paintWada(p, 8, 96, 80, 3, pal);
    // big arched doorway (the player walks in here)
    p.rect(38, 60, 20, 36, '#6a3e22');
    p.circle(48, 62, 10, '#6a3e22');
    p.rect(40, 62, 16, 34, '#1a0e0a');
    p.circle(48, 63, 8, '#1a0e0a');
    for (let i = 0; i < 9; i++) p.circle(36 + i * 3, 52 + Math.round(Math.sin(i / 2.6) * 2), 1, i % 2 ? '#f8b820' : '#f07010');
    return { img: c, ox: -8, oy: -96 };
  },
  pillar(d) {
    const w = d.w * 16;
    const h = (15 - d.y) * 16;
    const c = makeCanvas(w, h);
    const p = PX(c.getContext('2d'));
    const inset = 3;
    p.rect(inset, 0, w - inset * 2, h, '#7a6e5e');
    p.rect(inset, 0, 3, h, '#9a8e7a');
    p.rect(w - inset - 3, 0, 3, h, '#5a5044');
    for (let y = 8; y < h; y += 10) {
      const off = (y / 10) % 2 ? 0 : 8;
      p.rect(inset, y, w - inset * 2, 1, '#5a5044');
      for (let x = inset + off; x < w - inset; x += 16) p.rect(x, y - 9, 1, 9, '#5a5044');
    }
    const r = mulberry32(d.x * 3 + d.y);
    for (let i = 0; i < w / 4; i++) p.circle(inset + r() * (w - inset * 2), r() * 30, 1, '#5aa840');
    return { img: c, ox: 0, oy: 0 };
  },
  metroSign(d) {
    const tw = Font.measure(d.text);
    const c = makeCanvas(tw + 28, 16);
    const g = c.getContext('2d');
    const p = PX(g);
    p.rect(0, 0, tw + 28, 16, '#0e1830');
    p.rect(1, 1, tw + 26, 14, '#1d4aa8');
    p.circle(9, 8, 5, '#ffffff');
    p.circle(9, 8, 3, '#7a4ab0');
    Font.draw(g, d.text, 19, 4, '#ffffff');
    return { img: c, ox: 0, oy: 0 };
  },
  bunting(d) {
    const w = d.w * 16;
    const c = makeCanvas(w, 24);
    const p = PX(c.getContext('2d'));
    const cols = ['#f5821f', '#fcd23c', '#3cb043', '#e2352b', '#f07cb0', '#2f63d8'];
    let i = 0;
    for (let x = 0; x < w; x++) {
      const t = x / (w - 1);
      const y = Math.round(2 + 10 * 4 * t * (1 - t));
      p.dot(x, y, '#3a2a2a');
      if (x % 8 === 2 && x < w - 6) {
        const col = cols[i++ % cols.length];
        for (let r = 0; r < 6; r++) p.rect(x, y + 1 + r, 5 - Math.floor(r * 0.8), 1, col);
      }
    }
    return { img: c, ox: 0, oy: 0 };
  },
  fortWall(d) {
    const w = d.w * 16;
    const h = d.h * 16;
    const c = makeCanvas(w, h + 8);
    const p = PX(c.getContext('2d'));
    p.rect(0, 8, w, h, '#6e6252');
    for (let x = 0; x < w; x += 10) p.rect(x, 0, 6, 9, '#6e6252');
    for (let y = 14; y < h + 8; y += 8) {
      const off = (y / 8) % 2 ? 0 : 6;
      p.rect(0, y, w, 1, '#544a3e');
      for (let x = off; x < w; x += 12) p.rect(x, y - 7, 1, 7, '#544a3e');
    }
    return { img: c, ox: 0, oy: -(h + 8) };
  },
  // ---- traffic jam ----
  vehicle(d) {
    const W = d.w * 16;
    const H = d.h * 16 + (d.kind === 'scooter' ? 0 : 0);
    const c = makeCanvas(W, H);
    const g = c.getContext('2d');
    const p = PX(g);
    const wheel = (x, y, r = 4) => {
      p.circle(x, y, r, '#1a1a22');
      p.circle(x, y, Math.max(1, r - 2), '#8a8a96');
    };
    const plate = (x, y) => {
      p.rect(x, y, 19, 7, '#1a1020');
      p.rect(x + 1, y + 1, 17, 5, '#ffffff');
      Font.draw(g, 'MH12', x + 10, y + 1, '#1a1020', { tiny: true, align: 'center' });
    };
    const face = (x, y) => {
      p.circle(x, y, 3, '#d99a6c');
      p.rect(x - 3, y - 4, 7, 2, '#2b1a12');
      p.dot(x + 1, y - 1, '#1a1020');
    };
    if (d.kind === 'auto') {
      p.rect(3, 2, 24, 2, '#c8920e');
      p.rect(1, 4, 28, 13, '#fcd23c');
      p.rect(3, 6, 12, 11, '#2a2230');
      face(9, 11);
      p.rect(20, 6, 8, 9, '#8fd8f8');
      p.rect(20, 6, 8, 2, '#1a1020');
      p.rect(0, 17, 31, 9, '#1a1a1a');
      p.rect(0, 20, 31, 2, '#fcd23c');
      p.rect(28, 18, 3, 3, '#fff4b0');
      plate(4, 22);
      wheel(7, 28);
      wheel(24, 28);
    } else if (d.kind === 'car') {
      p.rect(9, 3, 26, 2, '#f0f0f4');
      p.rect(7, 5, 30, 10, '#f0f0f4');
      p.rect(10, 6, 11, 8, '#6aa8d8');
      p.rect(23, 6, 11, 8, '#6aa8d8');
      face(28, 10);
      p.rect(1, 14, 46, 11, '#e2352b');
      p.rect(1, 14, 46, 2, '#f07060');
      p.rect(44, 16, 3, 3, '#fff4b0');
      p.rect(1, 17, 3, 3, '#ff5a3a');
      plate(14, 18);
      wheel(10, 27);
      wheel(38, 27);
    } else if (d.kind === 'bus') {
      p.rect(2, 1, 92, 3, '#8e2420');
      p.rect(0, 4, 96, 38, '#b8322a');
      p.rect(0, 9, 96, 15, '#f4e8c8');
      for (let x = 6; x < 80; x += 12) {
        p.rect(x, 11, 10, 11, '#2a3654');
        face(x + 5, 18);
      }
      p.rect(82, 7, 12, 18, '#6aa8d8');
      p.rect(80, 26, 10, 14, '#2a2230');
      face(85, 32); // hanging on at the door
      p.rect(58, 3, 36, 7, '#1a1020');
      Font.draw(g, 'SWARGATE', 76, 4, '#ffb030', { tiny: true, align: 'center' });
      Font.draw(g, 'PMPML', 36, 30, '#fff4d0', { tiny: true, align: 'center' });
      p.rect(0, 37, 96, 3, '#6a1814');
      wheel(16, 43, 5);
      wheel(78, 43, 5);
    } else if (d.kind === 'scooter') {
      p.rect(6, 3, 7, 6, '#2f63d8'); // helmet
      p.rect(9, 5, 4, 3, '#8fd8f8');
      p.rect(7, 9, 6, 9, '#3cb043'); // rider
      p.rect(9, 11, 6, 2, '#d99a6c');
      p.rect(1, 18, 14, 7, '#f07cb0');
      p.rect(13, 12, 2, 7, '#8a8a96');
      wheel(4, 28, 3);
      wheel(13, 28, 3);
    } else if (d.kind === 'cow') {
      p.rect(4, 6, 22, 9, '#f4efe2');
      p.rect(8, 3, 6, 4, '#e8e0cc'); // hump
      p.rect(6, 9, 5, 4, '#b8a890');
      p.rect(24, 3, 7, 8, '#f4efe2'); // head
      p.rect(24, 1, 2, 3, '#8a6a4a');
      p.rect(29, 1, 2, 3, '#8a6a4a');
      p.dot(29, 6, '#1a1020');
      p.rect(28, 9, 4, 2, '#f0b8a8');
      p.rect(2, 7, 2, 5, '#b8a890');
      p.rect(3, 14, 24, 2, '#c8c0b0');
    } else if (d.kind === 'truck') {
      p.rect(0, 4, 46, 34, '#2f63d8');
      p.rect(0, 4, 46, 4, '#fcd23c');
      p.rect(2, 10, 42, 22, '#fcd23c');
      Font.draw(g, 'HORN OK', 23, 13, '#b01818', { tiny: true, align: 'center' });
      Font.draw(g, 'PLEASE', 23, 20, '#b01818', { tiny: true, align: 'center' });
      for (let x = 4; x < 44; x += 6) p.rect(x, 28, 3, 3, x % 12 ? '#3cb043' : '#e2352b');
      p.rect(46, 14, 18, 24, '#f5821f'); // cabin
      p.rect(50, 17, 12, 9, '#8fd8f8');
      face(56, 22);
      p.rect(61, 30, 3, 3, '#fff4b0');
      p.rect(0, 38, 64, 3, '#1a1a1a');
      wheel(10, 43, 5);
      wheel(54, 43, 5);
    }
    return { img: c, ox: 0, oy: -H };
  },
  trafficCop() {
    const c = makeCanvas(20, 34);
    const p = PX(c.getContext('2d'));
    p.rect(5, 0, 10, 3, '#f4f4f4'); // white cap
    p.rect(4, 3, 12, 1, '#1a1020');
    p.rect(6, 4, 8, 7, '#b87a4a');
    p.dot(11, 6, '#1a1020');
    p.rect(8, 9, 5, 1, '#2b1a12'); // moustache
    p.rect(4, 11, 12, 11, '#f4f4f4');
    p.rect(15, 4, 3, 9, '#f4f4f4'); // arm raised, stopping traffic
    p.rect(15, 2, 3, 3, '#b87a4a');
    p.rect(1, 12, 3, 8, '#f4f4f4');
    p.rect(4, 22, 12, 9, '#c8a060'); // khaki trousers
    p.rect(9, 22, 1, 9, '#8a6a30');
    p.rect(3, 31, 6, 3, '#1a1a1a');
    p.rect(11, 31, 6, 3, '#1a1a1a');
    p.rect(12, 8, 2, 2, '#c0c0c0'); // whistle
    return { img: c, ox: 0, oy: -34 };
  },
  // ---- metro station furniture ----
  bench() {
    const c = makeCanvas(40, 16);
    const p = PX(c.getContext('2d'));
    p.rect(0, 5, 40, 3, '#c8ced8');
    p.rect(0, 5, 40, 1, '#eef1f5');
    p.rect(2, 0, 36, 4, '#7a4ab0');
    p.rect(4, 8, 2, 8, '#5a606c');
    p.rect(34, 8, 2, 8, '#5a606c');
    p.rect(18, 8, 4, 8, '#5a606c');
    return { img: c, ox: 0, oy: -16 };
  },
  gates() {
    const c = makeCanvas(56, 26);
    const p = PX(c.getContext('2d'));
    for (const x of [0, 20, 40]) {
      p.rect(x, 4, 14, 22, '#b8bec9');
      p.rect(x, 4, 14, 2, '#e4e8ee');
      p.rect(x + 3, 8, 8, 5, '#1a2230');
      p.rect(x + 5, 9, 4, 3, x === 20 ? '#e2352b' : '#2ad06a');
    }
    p.rect(14, 14, 6, 2, '#f5821f');
    p.rect(34, 14, 6, 2, '#f5821f');
    return { img: c, ox: 0, oy: -26 };
  },
  screen(d) {
    const lines = d.lines || ['NEXT TRAIN', '2 MIN'];
    const w = Math.max(...lines.map((l) => l.length)) * 4 + 8;
    const c = makeCanvas(w, lines.length * 7 + 12);
    const g = c.getContext('2d');
    const p = PX(g);
    p.rect(w / 2 - 1, 0, 2, 6, '#5a606c');
    p.rect(0, 6, w, lines.length * 7 + 6, '#3a404c');
    p.rect(1, 7, w - 2, lines.length * 7 + 4, '#0a0c10');
    lines.forEach((ln, i) => Font.draw(g, ln, w / 2, 9 + i * 7, '#ffb030', { tiny: true, align: 'center' }));
    return { img: c, ox: 0, oy: 0 };
  },
  exitSign(d) {
    const text = d.text || 'EXIT';
    const w = text.length * 4 + 16;
    const c = makeCanvas(w, 16);
    const g = c.getContext('2d');
    const p = PX(g);
    p.rect(w / 2 - 1, 0, 2, 5, '#5a606c');
    p.rect(0, 5, w, 11, '#1e8a3e');
    p.rect(1, 6, w - 2, 9, '#27a84c');
    p.rect(3, 8, 5, 5, '#ffffff');
    p.rect(4, 9, 3, 3, '#27a84c');
    Font.draw(g, text, 10, 8, '#ffffff', { tiny: true });
    return { img: c, ox: 0, oy: 0 };
  },
  routeMap() {
    const c = makeCanvas(72, 40);
    const g = c.getContext('2d');
    const p = PX(g);
    p.rect(0, 0, 72, 40, '#5a606c');
    p.rect(1, 1, 70, 38, '#f6f7f9');
    Font.draw(g, 'PUNE METRO', 36, 3, '#1a2230', { tiny: true, align: 'center' });
    p.rect(6, 16, 60, 2, '#7a4ab0');
    p.rect(36, 11, 2, 26, '#3cc0c8');
    for (let x = 8; x <= 64; x += 8) p.rect(x - 1, 15, 3, 4, '#ffffff');
    for (let y = 13; y <= 34; y += 7) p.rect(35, y, 4, 3, '#ffffff');
    p.circle(37, 17, 3, '#1a2230');
    p.circle(37, 17, 1, '#f5821f');
    Font.draw(g, 'YOU ARE HERE', 36, 30, '#b01818', { tiny: true, align: 'center' });
    return { img: c, ox: 0, oy: -40 };
  },
  // ---- Ganeshotsav pandal ----
  pandal() {
    const W = 96;
    const H = 100;
    const c = makeCanvas(W, H);
    const g = c.getContext('2d');
    const p = PX(g);
    // back curtain with a golden halo, and the stage
    p.rect(8, 26, 80, 66, '#7a1a22');
    for (let x = 12; x < 88; x += 8) p.rect(x, 26, 1, 66, '#6a141c');
    for (let y = 34; y < 90; y += 12) for (let x = 14; x < 86; x += 12) p.dot(x + ((y / 12) % 2) * 6, y, '#e0a030');
    p.circle(48, 58, 22, '#a82a26');
    p.circle(48, 58, 20, '#f2b030');
    p.circle(48, 58, 17, '#a82a26');
    p.rect(26, 82, 44, 10, '#c89030');
    p.rect(26, 82, 44, 2, '#f2d060');
    // the idol
    g.drawImage(Sprites.s.ganesha.img, 36, 54);
    // offerings: a plate of modaks and two diyas
    p.rect(40, 92, 16, 2, '#d8b040');
    for (const [x, y] of [[43, 88], [48, 88], [53, 88], [45.5, 85], [50.5, 85]]) {
      p.circle(x, y + 2, 2, '#fbf6e8');
      p.dot(x, y - 1, '#f5821f');
    }
    for (const x of [28, 64]) {
      p.rect(x, 91, 5, 3, '#b0561a');
      p.rect(x + 2, 88, 1, 3, '#fcd23c');
    }
    // bamboo poles
    for (const x of [4, 88]) {
      p.rect(x, 18, 4, 82, '#c8a060');
      for (let y = 26; y < 100; y += 14) p.rect(x, y, 4, 1, '#8a6a30');
    }
    // canopy with a scalloped edge
    p.roof(48, 0, 100, 9, '#f5821f');
    p.rect(0, 8, W, 12, '#e2352b');
    p.rect(0, 8, W, 2, '#f5821f');
    for (let x = 0; x < W; x += 8) p.circle(x + 4, 20, 4, x % 16 ? '#fcd23c' : '#e2352b');
    Font.draw(g, 'GANPATI BAPPA MORYA', 48, 12, '#fff4d0', { tiny: true, align: 'center' });
    // marigold garlands
    for (let i = 0; i < 5; i++) {
      const gx = 12 + i * 18;
      for (let y = 25; y < 40 + (i % 2) * 8; y += 2) p.dot(gx, y, y % 4 ? '#f07010' : '#fcd23c');
    }
    const lights = [];
    for (let x = 2; x < W; x += 6) lights.push([x, 25 + ((x / 6) % 2)]);
    return { img: c, ox: -8, oy: -H, lights };
  },
  basket() {
    const c = makeCanvas(40, 30);
    const p = PX(c.getContext('2d'));
    p.rect(2, 16, 36, 14, '#a8702a');
    for (let x = 3; x < 38; x += 4) p.rect(x, 17, 2, 12, '#7a4a1a');
    p.rect(0, 14, 40, 3, '#c88a3a');
    for (let i = 0; i < 7; i++) {
      const x = 6 + i * 5;
      const y = 10 - (i % 2) * 3;
      p.circle(x, y + 3, 3, '#fbf6e8');
      p.rect(x, y - 2, 1, 2, '#f5821f');
    }
    return { img: c, ox: -4, oy: -30 };
  },
};

function paintDecor(d) {
  const painter = DecorPainters[d.type];
  if (!painter) throw new Error('Unknown decor ' + d.type);
  return painter(d);
}

// Animated wall torch (castle), drawn every frame.
function drawTorch(ctx, x, y, frame) {
  ctx.fillStyle = '#4a3020';
  ctx.fillRect(x + 6, y + 8, 4, 10);
  ctx.fillStyle = '#6a4a30';
  ctx.fillRect(x + 4, y + 7, 8, 2);
  const f = Math.floor(frame / 6) % 3;
  const h = [7, 8, 6][f];
  ctx.fillStyle = '#f85818';
  ctx.fillRect(x + 5, y + 7 - h, 6, h);
  ctx.fillStyle = '#fcb040';
  ctx.fillRect(x + 6, y + 8 - h + 2, 4, h - 2);
  ctx.fillStyle = '#fff2b0';
  ctx.fillRect(x + 7, y + 4, 2, 3);
}
