'use strict';
// Unified input: keyboard, on-screen touch buttons and gamepads all feed the same buttons.

const Input = (() => {
  const BUTTONS = ['left', 'right', 'up', 'down', 'jump', 'run', 'start', 'mute'];
  const KEYMAP = {
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    Space: 'jump', KeyZ: 'jump', KeyK: 'jump',
    KeyX: 'run', KeyJ: 'run', ShiftLeft: 'run', ShiftRight: 'run',
    Enter: 'start', Escape: 'start', KeyP: 'start',
    KeyM: 'mute',
  };

  const keys = {};
  const touch = {};
  const pad = {};
  const now = {};
  const prev = {};
  const hit = {};
  const latched = {}; // presses shorter than a frame still count once
  let anyPressedFlag = false;
  let lastDevice = 'keyboard';
  const listeners = [];

  function onFirstInteraction(fn) {
    listeners.push(fn);
  }
  function fireInteraction() {
    while (listeners.length) listeners.shift()();
  }

  window.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    const b = KEYMAP[e.code];
    if (b) {
      if (!keys[b] && !e.repeat) latched[b] = true;
      keys[b] = true;
      e.preventDefault();
    }
    lastDevice = 'keyboard';
    fireInteraction();
  });
  window.addEventListener('keyup', (e) => {
    const b = KEYMAP[e.code];
    if (b) keys[b] = false;
  });
  window.addEventListener('blur', () => {
    for (const b of BUTTONS) keys[b] = touch[b] = false;
  });
  window.addEventListener('pointerdown', fireInteraction);
  window.addEventListener('touchstart', fireInteraction, { passive: true });

  // Touch controls: every active pointer is mapped to whichever button it is over,
  // so a thumb can slide from LEFT to RIGHT without lifting.
  function bindTouch(root) {
    const pointers = new Map();
    const btns = [...root.querySelectorAll('[data-btn]')];
    const mine = new Set(btns.flatMap((el) => el.dataset.btn.split(' ')));
    function recompute() {
      for (const b of mine) touch[b] = false;
      const before = {};
      for (const b of mine) before[b] = touch[b];
      for (const p of pointers.values()) {
        for (const el of btns) {
          const r = el.getBoundingClientRect();
          const pad = 10;
          if (p.x >= r.left - pad && p.x <= r.right + pad && p.y >= r.top - pad && p.y <= r.bottom + pad) {
            for (const name of el.dataset.btn.split(' ')) touch[name] = true;
          }
        }
      }
      for (const b of mine) if (touch[b] && !before[b]) latched[b] = true;
      for (const el of btns) {
        el.classList.toggle('on', el.dataset.btn.split(' ').every((n) => touch[n]));
      }
    }
    const down = (e) => {
      e.preventDefault();
      lastDevice = 'touch';
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      try {
        root.setPointerCapture(e.pointerId);
      } catch (err) {
        /* not supported: fine */
      }
      recompute();
    };
    const move = (e) => {
      if (!pointers.has(e.pointerId)) return;
      e.preventDefault();
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      recompute();
    };
    const up = (e) => {
      pointers.delete(e.pointerId);
      recompute();
    };
    root.addEventListener('pointerdown', down);
    root.addEventListener('pointermove', move);
    root.addEventListener('pointerup', up);
    root.addEventListener('pointercancel', up);
    root.addEventListener('lostpointercapture', up);
    root.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  function pollGamepad() {
    for (const b of BUTTONS) pad[b] = false;
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const gp of pads) {
      if (!gp) continue;
      const btn = (i) => gp.buttons[i] && gp.buttons[i].pressed;
      const ax = gp.axes[0] || 0;
      const ay = gp.axes[1] || 0;
      pad.left = pad.left || btn(14) || ax < -0.4;
      pad.right = pad.right || btn(15) || ax > 0.4;
      pad.up = pad.up || btn(12) || ay < -0.5;
      pad.down = pad.down || btn(13) || ay > 0.5;
      pad.jump = pad.jump || btn(0) || btn(1);
      pad.run = pad.run || btn(2) || btn(3) || btn(6) || btn(7);
      pad.start = pad.start || btn(9) || btn(8);
      if (gp.buttons.some((b) => b.pressed)) {
        lastDevice = 'gamepad';
        fireInteraction();
      }
    }
  }

  function update() {
    pollGamepad();
    anyPressedFlag = false;
    for (const b of BUTTONS) {
      prev[b] = now[b];
      now[b] = !!(keys[b] || touch[b] || pad[b]);
      hit[b] = (now[b] && !prev[b]) || !!latched[b];
      latched[b] = false;
      if (hit[b]) anyPressedFlag = true;
    }
  }

  return {
    update,
    bindTouch,
    onFirstInteraction,
    down: (b) => !!now[b],
    pressed: (b) => !!hit[b],
    anyPressed: () => anyPressedFlag,
    device: () => lastDevice,
    setDevice: (d) => (lastDevice = d),
    // Menus: "confirm" is jump, start, or run.
    confirm: () => !!(hit.jump || hit.start),
    clear() {
      for (const b of BUTTONS) keys[b] = touch[b] = now[b] = prev[b] = hit[b] = latched[b] = false;
    },
  };
})();
