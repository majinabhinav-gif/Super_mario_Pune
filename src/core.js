'use strict';
// Shared constants and small helpers used by every other module.

const TILE = 16;
const ROWS = 15;
const VIEW_H = ROWS * TILE; // 240
let VIEW_W = 400; // recalculated to match the screen's aspect ratio

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const sign = (v) => (v > 0 ? 1 : v < 0 ? -1 : 0);
const approach = (v, target, step) => (v < target ? Math.min(v + step, target) : Math.max(v - step, target));
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

// localStorage can be missing or throw (private windows, sandboxed frames).
const Store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem('superpunekar.' + key);
      return v === null ? fallback : JSON.parse(v);
    } catch (e) {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem('superpunekar.' + key, JSON.stringify(value));
    } catch (e) {
      /* storage unavailable: progress simply isn't remembered */
    }
  },
};

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function cleanName(raw) {
  return String(raw || '')
    .toUpperCase()
    .replace(/[^A-Z ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 10);
}
