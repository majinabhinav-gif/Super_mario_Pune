'use strict';
// A tiny chiptune synth built on the Web Audio API. All music here is original,
// written for this game (pulse-wave leads, triangle bass, and a dhol-tasha drum kit).

const Sound = (() => {
  let ctx = null;
  let master, musicBus, sfxBus, noiseBuf;
  const waves = {};
  let muted = Store.get('muted', false);

  // ---------- note helpers ----------
  const NOTE_INDEX = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function midi(name) {
    const m = /^([A-G])(#|b)?(-?\d)$/.exec(name);
    if (!m) throw new Error('bad note ' + name);
    let n = NOTE_INDEX[m[1]] + (m[3] * 12 + 12);
    if (m[2] === '#') n++;
    if (m[2] === 'b') n--;
    return n;
  }
  const freqOf = (n) => 440 * Math.pow(2, (n - 69) / 12);
  const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const nameOf = (n) => NAMES[n % 12] + (Math.floor(n / 12) - 1);

  // ---------- init ----------
  function init() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      ctx = new AC();
    } catch (e) {
      ctx = null;
      return;
    }
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.55;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    master.connect(comp).connect(ctx.destination);
    musicBus = ctx.createGain();
    musicBus.gain.value = 0.42;
    musicBus.connect(master);
    sfxBus = ctx.createGain();
    sfxBus.gain.value = 0.9;
    sfxBus.connect(master);

    for (const [name, duty] of [['pulse12', 0.125], ['pulse25', 0.25], ['pulse50', 0.5]]) {
      const n = 48;
      const real = new Float32Array(n);
      const imag = new Float32Array(n);
      for (let k = 1; k < n; k++) {
        real[k] = Math.sin(2 * Math.PI * k * duty) / (k * Math.PI);
        imag[k] = (1 - Math.cos(2 * Math.PI * k * duty)) / (k * Math.PI);
      }
      waves[name] = ctx.createPeriodicWave(real, imag);
    }
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

    if (pendingSong) {
      const p = pendingSong;
      pendingSong = null;
      playMusic(p.name, p.opts);
    }
  }

  function resume() {
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }
  function suspend() {
    if (ctx && ctx.state === 'running') ctx.suspend();
  }

  // ---------- voices ----------
  function osc(t, freq, dur, o = {}) {
    const node = ctx.createOscillator();
    const wave = o.wave || 'pulse50';
    if (waves[wave]) node.setPeriodicWave(waves[wave]);
    else node.type = wave;
    node.frequency.setValueAtTime(freq, t);
    if (o.slide) node.frequency.exponentialRampToValueAtTime(o.slide, t + dur);
    if (o.vibrato && dur > 0.25) {
      const lfo = ctx.createOscillator();
      const lg = ctx.createGain();
      lfo.frequency.value = 5.5;
      lg.gain.setValueAtTime(0, t);
      lg.gain.linearRampToValueAtTime(freq * 0.012, t + 0.2);
      lfo.connect(lg).connect(node.frequency);
      lfo.start(t);
      lfo.stop(t + dur + 0.05);
    }
    const g = ctx.createGain();
    const vol = o.vol == null ? 0.15 : o.vol;
    const a = o.attack || 0.004;
    const r = Math.min(o.release || 0.03, dur * 0.5);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + a);
    if (o.decay) {
      g.gain.exponentialRampToValueAtTime(Math.max(vol * o.decay, 0.0002), t + Math.max(a + 0.001, dur - r));
    } else {
      g.gain.setValueAtTime(vol, t + Math.max(a, dur - r));
    }
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    node.connect(g).connect(o.bus || sfxBus);
    node.start(t);
    node.stop(t + dur + 0.02);
    return node;
  }

  function noise(t, dur, o = {}) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = o.type || 'highpass';
    f.frequency.setValueAtTime(o.freq || 5000, t);
    if (o.slideFreq) f.frequency.exponentialRampToValueAtTime(o.slideFreq, t + dur);
    f.Q.value = o.q || 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(o.vol || 0.2, t);
    g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    src.connect(f).connect(g).connect(o.bus || sfxBus);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.02);
  }

  function drum(t, kind, bus, vel = 1) {
    switch (kind) {
      case 'k': // kick
        osc(t, 150, 0.14, { wave: 'sine', vol: 0.55 * vel, slide: 42, bus });
        break;
      case 's': // snare
        noise(t, 0.13, { type: 'bandpass', freq: 1900, q: 0.7, vol: 0.32 * vel, bus });
        osc(t, 190, 0.07, { wave: 'triangle', vol: 0.2 * vel, slide: 120, bus });
        break;
      case 'h': // closed hat
        noise(t, 0.035, { type: 'highpass', freq: 7500, vol: 0.09 * vel, bus });
        break;
      case 'o': // open hat
        noise(t, 0.16, { type: 'highpass', freq: 6500, vol: 0.08 * vel, bus });
        break;
      case 'D': // dhol bass side ("dha")
        osc(t, 118, 0.26, { wave: 'sine', vol: 0.7 * vel, slide: 58, bus });
        noise(t, 0.07, { type: 'lowpass', freq: 500, vol: 0.35 * vel, bus });
        noise(t, 0.05, { type: 'bandpass', freq: 2600, q: 2, vol: 0.2 * vel, bus });
        break;
      case 'd': // dhol treble slap ("tin")
        noise(t, 0.06, { type: 'bandpass', freq: 2900, q: 3, vol: 0.34 * vel, bus });
        osc(t, 420, 0.06, { wave: 'sine', vol: 0.18 * vel, slide: 360, bus });
        break;
      case 't': // tasha tick
        noise(t, 0.03, { type: 'highpass', freq: 3200, vol: 0.14 * vel, bus });
        break;
      case 'T': // tasha roll
        for (let i = 0; i < 3; i++) noise(t + i * 0.025, 0.03, { type: 'highpass', freq: 3000, vol: 0.13 * vel, bus });
        break;
      case 'c': // chime (metro doors)
        osc(t, 1318, 0.25, { wave: 'sine', vol: 0.12 * vel, decay: 0.2, bus });
        break;
    }
  }

  // ---------- songs ----------
  // Token format: NOTE:LEN (LEN in 16th-notes), R for rest, chords as C4+E4+G4:2.
  const bar = (tokens) => tokens.join(' ');
  function bassLine(roots, style) {
    const out = [];
    for (const root of roots) {
      const r = midi(root);
      const n = (k) => nameOf(r + k);
      if (style === 'bounce') out.push(`${n(0)}:2 R:2 ${n(12)}:2 R:2 ${n(7)}:2 R:2 ${n(12)}:2 R:2`);
      else if (style === 'octave') out.push(Array(4).fill(`${n(0)}:1 R:1 ${n(12)}:1 R:1`).join(' '));
      else if (style === 'castle') out.push(`${n(0)}:2 ${n(12)}:2 ${n(0)}:2 ${n(12)}:2 ${n(1)}:2 ${n(13)}:2 ${n(0)}:2 ${n(12)}:2`);
      else if (style === 'waltz') out.push(`${n(0)}:4 ${n(7)}:4 ${n(12)}:4`);
      else if (style === 'march') out.push(`${n(0)}:2 R:2 ${n(0)}:2 ${n(7)}:2 ${n(12)}:2 R:2 ${n(7)}:2 R:2`);
    }
    return out.join(' ');
  }
  // Off-beat chord stabs, e.g. chordStabs(['D4+F#4+A4', ...])
  function chordStabs(chords, stepsPerBar = 16) {
    return chords.map((c) => Array(stepsPerBar / 4).fill(`R:2 ${c}:2`).join(' ')).join(' ');
  }
  function waltzChords(chords) {
    return chords.map((c) => `R:4 ${c}:3 R:1 ${c}:3 R:1`).join(' ');
  }

  const SONGS = {
    peth: {
      bpm: 148,
      loop: true,
      tracks: [
        {
          wave: 'pulse25', vol: 0.12, decay: 0.55, vibrato: true,
          notes: bar([
            'A4:2 D5:2 F#5:2 A5:4 F#5:2 A5:2 R:2',
            'B5:3 A5:1 G5:2 B5:2 D6:4 B5:2 R:2',
            'C#6:2 B5:2 A5:2 G5:2 E5:2 F#5:2 G5:2 E5:2',
            'D5:4 F#5:2 A5:2 D6:4 R:4',
            'B5:2 F#5:2 D5:2 F#5:2 B5:3 A5:1 B5:2 D6:2',
            'G5:2 B5:2 D6:2 B5:2 G5:4 E5:4',
            'A5:2 C#6:2 E6:2 C#6:2 A5:2 G5:2 F#5:2 E5:2',
            'D5:6 R:2 D6:2 A5:2 D5:4',
            'D5:2 G5:2 B5:4 A5:2 G5:2 A5:4',
            'E5:2 A5:2 C#6:4 B5:2 A5:2 B5:4',
            'A5:2 F#5:2 C#6:4 A5:2 F#5:2 E5:4',
            'D5:2 F#5:2 B5:4 A5:4 B5:4',
            'G5:2 A5:2 B5:2 D6:2 E6:4 D6:4',
            'C#6:2 B5:2 A5:2 G5:2 A5:4 E5:4',
            'F#5:3 G5:1 A5:2 F#5:2 D5:2 E5:2 F#5:2 A5:2',
            'D6:4 A5:2 F#5:2 D5:4 R:4',
          ]),
        },
        {
          wave: 'pulse50', vol: 0.035,
          notes: chordStabs([
            'D4+F#4+A4', 'D4+G4+B4', 'C#4+E4+A4', 'D4+F#4+A4', 'D4+F#4+B4', 'D4+G4+B4', 'C#4+E4+A4', 'D4+F#4+A4',
            'D4+G4+B4', 'C#4+E4+A4', 'C#4+F#4+A4', 'D4+F#4+B4', 'D4+G4+B4', 'C#4+E4+A4', 'D4+F#4+A4', 'D4+F#4+A4',
          ]),
        },
        {
          wave: 'triangle', vol: 0.3,
          notes: bassLine(['D3', 'G2', 'A2', 'D3', 'B2', 'G2', 'A2', 'D3', 'G2', 'A2', 'F#2', 'B2', 'G2', 'A2', 'D3', 'D3'], 'bounce'),
        },
        { drums: 'k.h.d.h.k.hkd.h.k.h.d.h.k.hkd.dd', vol: 0.8 },
      ],
    },

    metro: {
      bpm: 116,
      loop: true,
      tracks: [
        {
          wave: 'pulse12', vol: 0.12, decay: 0.4,
          notes: bar([
            'E5:2 C5:2 R:4 A4:2 B4:2 C5:2 E5:2',
            'D5:4 C5:2 B4:2 A4:6 R:2',
            'C5:2 F5:2 A5:4 G5:2 F5:2 E5:2 C5:2',
            'D5:2 G5:2 B5:4 A5:2 G5:2 D5:4',
            'E5:2 C5:2 R:4 A5:2 G5:2 E5:2 C5:2',
            'D5:2 E5:2 C5:4 B4:2 A4:2 E4:4',
            'F4:2 A4:2 C5:4 E4:2 G#4:2 B4:4',
            'A4:8 R:4 E5:2 C5:2',
          ]),
        },
        { wave: 'triangle', vol: 0.32, notes: bassLine(['A2', 'A2', 'F2', 'G2', 'A2', 'A2', 'F2', 'E2'], 'octave') },
        { drums: 'k...h.h.k.k.h...k...h.h.k...h.hc', vol: 0.7 },
      ],
    },

    sinhagad: {
      bpm: 168,
      loop: true,
      stepsPerBar: 12,
      tracks: [
        {
          wave: 'pulse25', vol: 0.11, decay: 0.6, vibrato: true,
          notes: bar([
            'D5:4 G5:4 B5:4', 'A5:6 G5:2 F#5:2 G5:2', 'E5:4 G5:4 C6:4', 'B5:8 R:4',
            'G5:4 B5:4 E6:4', 'D6:6 C6:2 B5:2 A5:2', 'F#5:4 A5:4 D6:4', 'C6:8 A5:4',
            'B5:4 G5:4 D5:4', 'E5:2 F#5:2 G5:4 A5:4', 'C6:4 B5:2 A5:2 G5:4', 'Eb5:4 G5:4 C6:4',
            'B5:6 A5:2 G5:4', 'A5:4 F#5:4 D5:4', 'C6:4 A5:4 F#5:4', 'G5:8 R:4',
          ]),
        },
        {
          wave: 'pulse50', vol: 0.03,
          notes: waltzChords([
            'D4+G4+B4', 'D4+G4+B4', 'E4+G4+C5', 'D4+G4+B4', 'E4+G4+B4', 'E4+A4+C5', 'D4+F#4+A4', 'D4+F#4+C5',
            'D4+G4+B4', 'D4+G4+B4', 'E4+G4+C5', 'Eb4+G4+C5', 'D4+G4+B4', 'D4+F#4+A4', 'D4+F#4+C5', 'D4+G4+B4',
          ]),
        },
        {
          wave: 'triangle', vol: 0.3,
          notes: bassLine(['G2', 'G2', 'C3', 'G2', 'E2', 'A2', 'D3', 'D3', 'G2', 'G2', 'C3', 'C3', 'G2', 'D3', 'D3', 'G2'], 'waltz'),
        },
        { drums: 'k...h...h...', vol: 0.6 },
      ],
    },

    castle: {
      bpm: 138,
      loop: true,
      tracks: [
        {
          wave: 'pulse25', vol: 0.11, decay: 0.7,
          notes: bar([
            'E5:2 G5:2 B5:2 G5:2 F5:4 E5:4',
            'E5:2 G5:2 B5:2 C6:2 B5:4 A5:4',
            'G5:2 A5:2 B5:2 A5:2 G5:4 F#5:4',
            'E5:8 D#5:4 R:4',
            'C6:2 B5:2 A5:2 G5:2 F5:4 G5:4',
            'A5:2 G5:2 F5:2 E5:2 D5:4 E5:4',
            'F5:4 E5:4 D#5:4 F#5:4',
            'E5:12 R:4',
          ]),
        },
        { wave: 'triangle', vol: 0.34, notes: bassLine(['E2', 'E2', 'E2', 'B1', 'A1', 'D2', 'B1', 'E2'], 'castle') },
        { drums: 'k..k..s.k..k..s.k..k..s.k.kk.ss.', vol: 0.75 },
      ],
    },

    dhol: {
      bpm: 172,
      loop: true,
      tracks: [
        {
          wave: 'pulse25', vol: 0.1,
          notes: bar([
            'D5:1 F#5:1 A5:1 D6:1 A5:1 F#5:1 D5:1 F#5:1 A5:1 D6:1 A5:1 F#5:1 E5:2 F#5:2',
            'G5:1 B5:1 D6:1 G6:1 D6:1 B5:1 A5:1 C#6:1 E6:1 A6:1 E6:1 C#6:1 D6:4',
          ]),
        },
        { wave: 'triangle', vol: 0.3, notes: 'D3:2 R:2 D3:2 A2:2 D3:2 R:2 D3:2 A2:2 G2:2 R:2 G2:2 D3:2 A2:2 R:2 A2:2 A2:2' },
        { drums: 'D..dD.d.D..dD.dd', vol: 1 },
        { drums: '..t...T...t..tT.', vol: 0.9 },
      ],
    },

    clear: {
      bpm: 150,
      loop: false,
      tracks: [
        {
          wave: 'pulse25', vol: 0.13, decay: 0.7,
          notes: 'A4:2 D5:2 F#5:2 A5:4 G5:2 F#5:2 E5:2 F#5:2 A5:2 D6:6 R:2 B5:1 A5:1 F#5:2 B5:1 A5:1 F#5:2 B5:1 A5:1 F#5:2 D6:12',
        },
        { wave: 'pulse50', vol: 0.04, notes: 'D4+F#4:16 C#4+E4:12 D4+F#4:12 D4+F#4+A4:12' },
        { wave: 'triangle', vol: 0.3, notes: 'D3:4 A3:4 D4:4 G3:4 A2:4 A3:4 D3:4 B2:4 A2:4 F#2:4 D2:12' },
        { drums: 'D...d...D...d...D...d...D.d.D.dD.dD.dD..D...........', vol: 1 },
      ],
    },

    death: {
      bpm: 120,
      loop: false,
      tracks: [
        { wave: 'pulse25', vol: 0.13, notes: 'G5:1 F#5:1 F5:1 E5:3 R:2 C5:2 R:1 G4:2 R:1 E4:6' },
        { wave: 'triangle', vol: 0.3, notes: 'G3:6 R:2 C3:4 G2:2 R:2 C2:4' },
      ],
    },

    gameover: {
      bpm: 96,
      loop: false,
      tracks: [
        { wave: 'pulse25', vol: 0.12, decay: 0.6, notes: 'E5:4 C5:4 A4:4 R:2 B4:2 C5:4 B4:2 A4:2 G#4:4 A4:8' },
        { wave: 'triangle', vol: 0.3, notes: 'A2:8 F2:8 E2:8 E2:4 A2:8' },
      ],
    },

    hurry: {
      bpm: 180,
      loop: false,
      tracks: [
        { wave: 'pulse25', vol: 0.12, notes: 'D6:1 R:1 D6:1 R:1 D6:1 R:1 E6:1 R:1 E6:1 R:1 E6:1 R:1 F#6:1 R:1 F#6:1 R:1 F#6:1 R:1 A6:6' },
        { wave: 'triangle', vol: 0.28, notes: 'D3:6 E3:6 F#3:6 A3:6' },
      ],
    },

    ending: {
      bpm: 132,
      loop: true,
      tracks: [
        {
          wave: 'pulse25', vol: 0.12, decay: 0.6, vibrato: true,
          notes: bar([
            'D5:2 D5:1 E5:1 F#5:2 F#5:2 A5:4 F#5:4',
            'G5:2 G5:1 A5:1 B5:2 B5:2 D6:4 B5:4',
            'A5:2 B5:2 A5:2 G5:2 F#5:2 G5:2 E5:4',
            'F#5:4 A5:4 D6:8',
            'B5:2 A5:2 B5:2 D6:2 C#6:4 B5:4',
            'G5:2 F#5:2 G5:2 B5:2 A5:4 G5:4',
            'A5:2 A5:2 B5:2 C#6:2 E6:4 C#6:4',
            'D6:8 A5:4 D6:4',
          ]),
        },
        { wave: 'pulse50', vol: 0.03, notes: chordStabs(['D4+F#4+A4', 'D4+G4+B4', 'C#4+E4+A4', 'D4+F#4+A4', 'D4+F#4+B4', 'D4+G4+B4', 'C#4+E4+A4', 'D4+F#4+A4']) },
        { wave: 'triangle', vol: 0.3, notes: bassLine(['D3', 'G2', 'A2', 'D3', 'B2', 'G2', 'A2', 'D3'], 'march') },
        { drums: 'D.d.D.ddD.d.D.dd', vol: 0.95 },
        { drums: '..t...T...t...TT', vol: 0.8 },
      ],
    },
  };

  // Parse songs into per-track event lists.
  function parseTrack(tr) {
    if (tr.drums) {
      const events = [];
      tr.drums.split('').forEach((c, i) => {
        if (c !== '.') events.push({ step: i, len: 1, drum: c });
      });
      return { ...tr, events, length: tr.drums.length };
    }
    const events = [];
    let step = 0;
    for (const tok of tr.notes.trim().split(/\s+/)) {
      const [notePart, lenPart] = tok.split(':');
      const len = Number(lenPart);
      if (!(len > 0)) throw new Error('bad token ' + tok);
      if (notePart !== 'R') {
        events.push({ step, len, freqs: notePart.split('+').map((n) => freqOf(midi(n))) });
      }
      step += len;
    }
    return { ...tr, events, length: step };
  }
  for (const key in SONGS) {
    const s = SONGS[key];
    s.tracks = s.tracks.map(parseTrack);
    s.length = Math.max(...s.tracks.map((t) => t.length));
    for (const t of s.tracks) {
      t.byStep = new Map();
      for (const e of t.events) {
        if (!t.byStep.has(e.step)) t.byStep.set(e.step, []);
        t.byStep.get(e.step).push(e);
      }
    }
  }

  // ---------- music scheduler ----------
  let current = null; // { song, name, step, nextTime, gain, tempoMul, endTime }
  let pendingSong = null;
  let tempoMul = 1;

  function playMusic(name, opts = {}) {
    stopMusic();
    tempoMul = opts.tempo || 1;
    if (!ctx) {
      pendingSong = { name, opts };
      return;
    }
    const song = SONGS[name];
    if (!song) return;
    const gain = ctx.createGain();
    gain.gain.value = 1;
    gain.connect(musicBus);
    current = { song, name, step: 0, nextTime: ctx.currentTime + 0.06, gain, endTime: null };
  }

  function stopMusic() {
    pendingSong = null;
    if (current && ctx) {
      const g = current.gain;
      g.gain.setValueAtTime(g.gain.value, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
      setTimeout(() => g.disconnect(), 200);
    }
    current = null;
  }

  function setTempo(mul) {
    tempoMul = mul;
  }

  function scheduleStep(cur, t, stepDur) {
    const s = cur.song;
    for (const tr of s.tracks) {
      const local = cur.step % tr.length;
      if (!s.loop && cur.step >= tr.length) continue;
      const evs = tr.byStep.get(local);
      if (!evs) continue;
      for (const e of evs) {
        if (e.drum) {
          drum(t, e.drum, cur.gain, tr.vol || 1);
        } else {
          const dur = e.len * stepDur * 0.92;
          for (const f of e.freqs) {
            osc(t, f, dur, { wave: tr.wave, vol: tr.vol, decay: tr.decay, vibrato: tr.vibrato, bus: cur.gain, release: 0.04 });
          }
        }
      }
    }
  }

  function update() {
    if (!ctx || !current) return;
    const cur = current;
    const stepDur = 60 / cur.song.bpm / 4 / tempoMul;
    while (cur.nextTime < ctx.currentTime + 0.15) {
      if (cur.step >= cur.song.length) {
        if (cur.song.loop) cur.step = 0;
        else {
          if (!cur.endTime) cur.endTime = cur.nextTime;
          break;
        }
      }
      scheduleStep(cur, cur.nextTime, stepDur);
      cur.nextTime += stepDur;
      cur.step++;
    }
  }

  function musicName() {
    return current ? current.name : pendingSong ? pendingSong.name : null;
  }

  // ---------- sound effects ----------
  function seq(t, notes, dur, o) {
    notes.forEach((n, i) => osc(t + i * dur, freqOf(midi(n)), dur * 0.95, o));
  }
  const SFX = {
    jump: (t) => osc(t, 290, 0.2, { wave: 'pulse25', vol: 0.17, slide: 760 }),
    jumpBig: (t) => osc(t, 200, 0.22, { wave: 'pulse25', vol: 0.17, slide: 560 }),
    coin: (t) => {
      osc(t, 1046, 0.07, { wave: 'pulse50', vol: 0.13 });
      osc(t + 0.07, 1568, 0.38, { wave: 'pulse50', vol: 0.13, decay: 0.05 });
    },
    stomp: (t) => {
      osc(t, 520, 0.12, { wave: 'pulse50', vol: 0.14, slide: 110 });
      noise(t, 0.07, { type: 'lowpass', freq: 1400, vol: 0.12 });
    },
    bump: (t) => osc(t, 150, 0.09, { wave: 'triangle', vol: 0.4, slide: 80 }),
    brick: (t) => {
      noise(t, 0.3, { type: 'lowpass', freq: 3000, slideFreq: 250, vol: 0.35 });
      osc(t, 200, 0.12, { wave: 'pulse50', vol: 0.08, slide: 60 });
    },
    sprout: (t) => {
      for (let i = 0; i < 10; i++) osc(t + i * 0.035, 330 * Math.pow(2, i / 7), 0.04, { wave: 'pulse50', vol: 0.08 });
    },
    powerup: (t) => seq(t, ['D5', 'F#5', 'A5', 'D6', 'E5', 'G5', 'B5', 'E6', 'F#5', 'A5', 'C#6', 'F#6'], 0.045, { wave: 'pulse25', vol: 0.15 }),
    oneup: (t) => seq(t, ['E6', 'G6', 'E7', 'C7', 'D7', 'G7'], 0.09, { wave: 'pulse50', vol: 0.09 }),
    fireball: (t) => osc(t, 950, 0.07, { wave: 'pulse50', vol: 0.1, slide: 260 }),
    kick: (t) => osc(t, 720, 0.08, { wave: 'pulse25', vol: 0.13, slide: 360 }),
    shrink: (t) => {
      for (let i = 0; i < 3; i++) {
        osc(t + i * 0.12, 700 - i * 150, 0.1, { wave: 'pulse50', vol: 0.1, slide: 350 - i * 80 });
      }
    },
    flag: (t) => osc(t, 1300, 1.0, { wave: 'pulse25', vol: 0.08, slide: 240 }),
    bell: (t) => {
      for (const [ratio, dur, v] of [[1, 2.2, 0.28], [2.0, 1.4, 0.12], [2.76, 1.1, 0.1], [5.4, 0.6, 0.05], [8.9, 0.35, 0.03]]) {
        osc(t, 620 * ratio, dur, { wave: 'sine', vol: v, decay: 0.01, attack: 0.002 });
      }
    },
    firework: (t) => {
      noise(t, 0.7, { type: 'lowpass', freq: 3200, slideFreq: 160, vol: 0.4 });
      osc(t, 100, 0.35, { wave: 'sine', vol: 0.35, slide: 38 });
    },
    beep: (t) => osc(t, 1760, 0.03, { wave: 'pulse50', vol: 0.05 }),
    pause: (t) => seq(t, ['E6', 'C6', 'E6', 'C6'], 0.07, { wave: 'pulse50', vol: 0.08 }),
    dhol: (t) => {
      drum(t, 'D', sfxBus, 1);
      drum(t + 0.1, 'd', sfxBus, 1);
      drum(t + 0.2, 'D', sfxBus, 1);
    },
    bossHit: (t) => {
      noise(t, 0.2, { type: 'bandpass', freq: 900, vol: 0.3 });
      osc(t, 300, 0.2, { wave: 'pulse50', vol: 0.12, slide: 90 });
    },
    bossFall: (t) => osc(t, 500, 1.6, { wave: 'pulse25', vol: 0.12, slide: 50 }),
    throwIt: (t) => noise(t, 0.12, { type: 'bandpass', freq: 1500, slideFreq: 600, vol: 0.12 }),
    checkpoint: (t) => seq(t, ['A5', 'D6', 'F#6'], 0.08, { wave: 'pulse25', vol: 0.1 }),
    select: (t) => osc(t, 880, 0.05, { wave: 'pulse25', vol: 0.08 }),
    confirm: (t) => seq(t, ['A5', 'E6'], 0.06, { wave: 'pulse25', vol: 0.09 }),
    burn: (t) => noise(t, 0.4, { type: 'lowpass', freq: 1800, slideFreq: 300, vol: 0.3 }),
  };

  let lastPlayed = {};
  function play(name) {
    if (!ctx || muted) return;
    const now = ctx.currentTime;
    // avoid stacking the exact same effect in the same instant
    if (lastPlayed[name] && now - lastPlayed[name] < 0.03) return;
    lastPlayed[name] = now;
    const fn = SFX[name];
    if (fn) fn(now + 0.005);
  }

  function setMuted(m) {
    muted = m;
    Store.set('muted', m);
    if (master && ctx) master.gain.setTargetAtTime(m ? 0 : 0.55, ctx.currentTime, 0.02);
  }

  return {
    init,
    resume,
    suspend,
    play,
    playMusic,
    stopMusic,
    setTempo,
    update,
    musicName,
    isMuted: () => muted,
    toggleMute: () => setMuted(!muted),
    _songs: SONGS,
  };
})();
