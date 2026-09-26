'use strict';
// Bitmap fonts drawn straight onto the canvas, so text stays crisp and works offline.
// BIG: 5x7 glyphs, emboldened to 6x7 and placed on an 8x8 grid (arcade style).
// TINY: 3x5 glyphs on a 4x6 grid, used for the Puneri signboards.

const Font = (() => {
  const BIG_GLYPHS = {
    A: '01110 10001 10001 11111 10001 10001 10001',
    B: '11110 10001 10001 11110 10001 10001 11110',
    C: '01110 10001 10000 10000 10000 10001 01110',
    D: '11110 10001 10001 10001 10001 10001 11110',
    E: '11111 10000 10000 11110 10000 10000 11111',
    F: '11111 10000 10000 11110 10000 10000 10000',
    G: '01110 10001 10000 10111 10001 10001 01111',
    H: '10001 10001 10001 11111 10001 10001 10001',
    I: '01110 00100 00100 00100 00100 00100 01110',
    J: '00111 00010 00010 00010 00010 10010 01100',
    K: '10001 10010 10100 11000 10100 10010 10001',
    L: '10000 10000 10000 10000 10000 10000 11111',
    M: '10001 11011 10101 10101 10001 10001 10001',
    N: '10001 10001 11001 10101 10011 10001 10001',
    O: '01110 10001 10001 10001 10001 10001 01110',
    P: '11110 10001 10001 11110 10000 10000 10000',
    Q: '01110 10001 10001 10001 10101 10010 01101',
    R: '11110 10001 10001 11110 10100 10010 10001',
    S: '01111 10000 10000 01110 00001 00001 11110',
    T: '11111 00100 00100 00100 00100 00100 00100',
    U: '10001 10001 10001 10001 10001 10001 01110',
    V: '10001 10001 10001 10001 10001 01010 00100',
    W: '10001 10001 10001 10101 10101 10101 01010',
    X: '10001 10001 01010 00100 01010 10001 10001',
    Y: '10001 10001 10001 01010 00100 00100 00100',
    Z: '11111 00001 00010 00100 01000 10000 11111',
    0: '01110 10001 10011 10101 11001 10001 01110',
    1: '00100 01100 00100 00100 00100 00100 01110',
    2: '01110 10001 00001 00010 00100 01000 11111',
    3: '11111 00010 00100 00010 00001 10001 01110',
    4: '00010 00110 01010 10010 11111 00010 00010',
    5: '11111 10000 11110 00001 00001 10001 01110',
    6: '00110 01000 10000 11110 10001 10001 01110',
    7: '11111 00001 00010 00100 01000 01000 01000',
    8: '01110 10001 10001 01110 10001 10001 01110',
    9: '01110 10001 10001 01111 00001 00010 01100',
    '.': '00000 00000 00000 00000 00000 01100 01100',
    ',': '00000 00000 00000 00000 01100 00100 01000',
    '!': '00100 00100 00100 00100 00100 00000 00100',
    '?': '01110 10001 00001 00010 00100 00000 00100',
    '-': '00000 00000 00000 01110 00000 00000 00000',
    ':': '00000 01100 01100 00000 01100 01100 00000',
    "'": '01100 00100 01000 00000 00000 00000 00000',
    '(': '00010 00100 01000 01000 01000 00100 00010',
    ')': '01000 00100 00010 00010 00010 00100 01000',
    '/': '00000 00001 00010 00100 01000 10000 00000',
    '*': '00000 10001 01010 00100 01010 10001 00000', // multiplication sign
    '+': '00000 00100 00100 11111 00100 00100 00000',
    '=': '00000 00000 11111 00000 11111 00000 00000',
    '&': '01100 10010 10100 01000 10101 10010 01101',
    '<': '00010 00100 01000 10000 01000 00100 00010',
    '>': '01000 00100 00010 00001 00010 00100 01000',
    '_': '00000 00000 00000 00000 00000 00000 11111',
    '@': '00000 01010 11111 11111 01110 00100 00000', // heart
    '$': '11111 00010 11111 00010 01100 00110 00011', // rupee sign
  };

  const TINY_GLYPHS = {
    A: '25755', B: '65656', C: '34443', D: '65556', E: '74647', F: '74644', G: '34553',
    H: '55755', I: '72227', J: '11152', K: '55655', L: '44447', M: '57755', N: '65555',
    O: '25552', P: '65644', Q: '25563', R: '65655', S: '34216', T: '72222', U: '55557',
    V: '55552', W: '55775', X: '55255', Y: '55222', Z: '71247',
    0: '75557', 1: '26227', 2: '61247', 3: '61216', 4: '55711', 5: '74616', 6: '34757',
    7: '71122', 8: '75757', 9: '75716',
    '.': '00002', ',': '00024', '!': '22202', '?': '61202', "'": '22000', '-': '00700',
    ':': '02020', '(': '12221', ')': '42224', '/': '11244', '&': '25253', '+': '02720',
    '=': '07070', '<': '12421', '>': '42124', '@': '05772', '$': '71721',
  };

  // Build pixel lists once: glyph -> array of [x, y]
  const bigPix = {};
  for (const ch in BIG_GLYPHS) {
    const rows = BIG_GLYPHS[ch].split(' ');
    const set = new Set();
    rows.forEach((row, y) => {
      for (let x = 0; x < 5; x++) {
        if (row[x] === '1') {
          set.add(x + ',' + y);
          set.add(x + 1 + ',' + y); // embolden
        }
      }
    });
    bigPix[ch] = [...set].map((s) => s.split(',').map(Number));
  }
  const tinyPix = {};
  for (const ch in TINY_GLYPHS) {
    const pts = [];
    TINY_GLYPHS[ch].split('').forEach((d, y) => {
      const v = Number(d);
      for (let x = 0; x < 3; x++) if (v & (4 >> x)) pts.push([x, y]);
    });
    tinyPix[ch] = pts;
  }

  const CHARS = Object.keys(BIG_GLYPHS);
  const atlasCache = new Map();

  function atlas(kind, color) {
    const key = kind + color;
    let a = atlasCache.get(key);
    if (a) return a;
    const pix = kind === 'big' ? bigPix : tinyPix;
    const cw = kind === 'big' ? 8 : 4;
    const ch = kind === 'big' ? 8 : 6;
    const canvas = makeCanvas(CHARS.length * cw, ch);
    const c = canvas.getContext('2d');
    c.fillStyle = color;
    const index = {};
    CHARS.forEach((glyph, i) => {
      index[glyph] = i;
      const pts = pix[glyph];
      if (!pts) return;
      for (const [x, y] of pts) c.fillRect(i * cw + x, y, 1, 1);
    });
    a = { canvas, index, cw, ch };
    atlasCache.set(key, a);
    return a;
  }

  function measure(str, kind = 'big', scale = 1) {
    const cw = kind === 'big' ? 8 : 4;
    return str.length * cw * scale - (kind === 'big' ? 2 : 1) * scale;
  }

  function drawRaw(ctx, str, x, y, color, kind, scale) {
    const a = atlas(kind, color);
    let cx = Math.round(x);
    y = Math.round(y);
    for (const chr of str) {
      const i = a.index[chr];
      if (i !== undefined) {
        ctx.drawImage(a.canvas, i * a.cw, 0, a.cw, a.ch, cx, y, a.cw * scale, a.ch * scale);
      }
      cx += a.cw * scale;
    }
  }

  // opts: { align: 'left'|'center'|'right', shadow: color, outline: color, scale, tiny }
  function draw(ctx, str, x, y, color = '#fff', opts = {}) {
    str = String(str).toUpperCase();
    const kind = opts.tiny ? 'tiny' : 'big';
    const scale = opts.scale || 1;
    const w = measure(str, kind, scale);
    if (opts.align === 'center') x -= w / 2;
    else if (opts.align === 'right') x -= w;
    x = Math.round(x);
    if (opts.outline) {
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        drawRaw(ctx, str, x + dx * scale, y + dy * scale, opts.outline, kind, scale);
      }
    }
    if (opts.shadow) drawRaw(ctx, str, x + scale, y + scale, opts.shadow, kind, scale);
    drawRaw(ctx, str, x, y, color, kind, scale);
    return w;
  }

  return { draw, measure };
})();
