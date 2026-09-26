'use strict';
// Everything that moves: the hero, enemies, items, projectiles, platforms, effects.
// Entities talk to the running game through the global `G` (defined in game.js).

function drawSpr(ctx, spr, x, y, flipX = false, flipY = false) {
  const img = flipX ? spr.flip : spr.img;
  const dx = Math.round(x - G.camX);
  const dy = Math.round(y);
  if (dx > VIEW_W || dx + spr.w < 0) return;
  if (flipY) {
    ctx.save();
    ctx.translate(dx, dy + spr.h);
    ctx.scale(1, -1);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  } else {
    ctx.drawImage(img, dx, dy);
  }
}

class Ent {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.vx = 0;
    this.vy = 0;
    this.dead = false;
    this.onGround = false;
    this.awake = true;
    this.t = 0;
  }
  get cx() {
    return this.x + this.w / 2;
  }
  get cy() {
    return this.y + this.h / 2;
  }
  update() {}
  draw() {}
}

// =================================================================== hero ===
class Player extends Ent {
  constructor(x, y, form = 0) {
    super(x, y, 12, form ? 27 : 15);
    this.form = form; // 0 small, 1 big (vada pav), 2 mirchi fire
    this.facing = 1;
    this.state = 'normal';
    this.invuln = 0;
    this.star = 0;
    this.anim = 0;
    this.combo = 0;
    this.jumping = false;
    this.coyote = 0;
    this.jumpBuffer = 0;
    this.crouching = false;
    this.platform = null;
    this.throwAnim = 0;
    this.prevY = y;
    this.hidden = false;
    this.stateT = 0;
  }
  get big() {
    return this.form > 0;
  }
  setHeight(h) {
    if (h === this.h) return;
    this.y += this.h - h;
    this.h = h;
  }
  palette() {
    if (this.star > 0) {
      const speed = this.star < 120 ? 8 : 3;
      return ['star1', 'star2', 'star3', this.form === 2 ? 'fire' : 'normal'][Math.floor(G.frame / speed) % 4];
    }
    return this.form === 2 ? 'fire' : 'normal';
  }

  update() {
    this.t++;
    this.stateT++;
    switch (this.state) {
      case 'normal':
        this.updateNormal();
        break;
      case 'dead':
        if (this.stateT > 30) {
          this.vy = Math.min(this.vy + 0.22, 5);
          this.y += this.vy;
        }
        break;
      case 'flag':
        this.updateFlag();
        break;
      case 'walk':
        this.updateWalkToDoor();
        break;
      case 'pipeDown':
        this.y += 1;
        if (this.stateT >= 34) G.finishPipe(this.pipe);
        break;
      case 'pipeRight':
        this.x += 1;
        this.anim += 0.18;
        if (this.stateT >= 24) G.finishPipe(this.pipe);
        break;
      case 'pipeUp':
        this.y -= 1;
        if (this.stateT >= this.pipeRise) {
          this.state = 'normal';
          this.inPipe = false;
        }
        break;
      case 'idle':
      case 'stuck':
        stepPlayerPhysics(this, {}, G.area, G.platforms);
        break;
      case 'auto':
        // walk right on its own (after the boss is beaten)
        this.vx = 1.2;
        this.facing = 1;
        stepPlayerPhysics(this, { right: true }, G.area, G.platforms);
        this.anim += 0.2;
        break;
    }
  }

  updateNormal() {
    const inp = G.inp;
    this.prevY = this.y;

    // ride moving platforms
    if (this.platform && !this.platform.dead) {
      moveX(this, G.area, this.platform.dx);
      this.y += this.platform.dy;
    }

    // crouch / stand hitbox
    const wantCrouch = this.big && inp.down && (this.onGround || this.crouching);
    let targetH = this.big && !wantCrouch ? 27 : 15;
    if (targetH > this.h) {
      // standing up: make sure there is head room
      const topY = this.y + this.h - targetH;
      const l = Math.floor(this.x / TILE);
      const r = Math.floor((this.x + this.w - 0.01) / TILE);
      for (let tx = l; tx <= r; tx++) if (isSolid(G.area, tx, Math.floor(topY / TILE))) targetH = this.h;
    }
    this.setHeight(targetH);
    const res = stepPlayerPhysics(this, inp, G.area, G.platforms);
    this.crouching = this.big && this.h === 15;
    if (res.jumped) Sound.play(this.big ? 'jumpBig' : 'jump');
    if (res.ceil) G.hitBlock(res.ceil.tx, res.ceil.ty, this);
    if (this.onGround) this.combo = 0;

    if (inp.runPressed && this.form === 2 && !this.crouching) this.shoot();

    // animation
    if (this.onGround) this.anim += Math.abs(this.vx) * 0.13;
    if (this.throwAnim > 0) this.throwAnim--;
    if (this.invuln > 0) this.invuln--;
    if (this.star > 0) {
      this.star--;
      if (this.t % 5 === 0) G.fx.push(new Sparkle(this.x + rand(-2, this.w + 2), this.y + rand(0, this.h)));
      if (this.star === 0) G.restoreMusic();
    }
    if (this.skidding && this.onGround && this.t % 5 === 0) G.fx.push(new Dust(this.cx - this.facing * 4, this.y + this.h - 3));

    // hazards
    if (this.y > VIEW_H + 8) G.killPlayer('pit');
    const lt = G.area.get(Math.floor(this.cx / TILE), Math.floor((this.y + this.h - 3) / TILE));
    if (lt === T.LAVA) G.killPlayer('lava');

    // coins placed in the level
    const l = Math.floor(this.x / TILE);
    const r = Math.floor((this.x + this.w - 1) / TILE);
    const tp = Math.floor(this.y / TILE);
    const bt = Math.floor((this.y + this.h - 1) / TILE);
    for (let tx = l; tx <= r; tx++) {
      for (let ty = tp; ty <= bt; ty++) {
        if (G.area.get(tx, ty) === T.COIN) {
          G.area.set(tx, ty, T.EMPTY);
          G.addCoin();
          G.fx.push(new Sparkle(tx * TILE + 8, ty * TILE + 8));
        }
      }
    }
    G.checkPipes(this, inp);
  }

  shoot() {
    let count = 0;
    for (const e of G.ents) if (e instanceof Fireball) count++;
    if (count >= 2) return;
    const fx = this.facing > 0 ? this.x + this.w - 2 : this.x - 6;
    G.spawn(new Fireball(fx, this.y + 6, this.facing));
    Sound.play('fireball');
    this.throwAnim = 8;
  }

  hurt() {
    if (this.invuln > 0 || this.star > 0 || this.state !== 'normal' || G.freezeT > 0) return;
    if (this.form > 0) {
      const from = this.form;
      this.form -= 1; // mirchi -> vada pav -> small (kinder than losing both)
      G.transform(from === 2 ? 'unfire' : 'shrink');
      this.invuln = 130;
      Sound.play('shrink');
    } else {
      G.killPlayer('hit');
    }
  }

  bounce(held) {
    this.vy = held ? -5.2 : -3.4;
    this.jumping = true;
    this.onGround = false;
    this.airMax = Math.max(Math.abs(this.vx), PHYS.maxWalk);
  }

  stompScore(x, y) {
    const table = [100, 200, 400, 500, 800, 1000, 2000, 4000, 5000, 8000];
    if (this.combo >= table.length) G.addLife(x, y);
    else G.addScore(table[this.combo], x, y);
    this.combo++;
  }

  // ----- flagpole and ending walk -----
  updateFlag() {
    const f = G.flagState;
    if (f.phase === 'slide') {
      const bottom = 12 * TILE - this.h;
      if (this.y < bottom) this.y = Math.min(bottom, this.y + 2);
      this.anim += 0.15;
      if (this.y >= bottom && f.flagY >= f.flagBottom) {
        f.phase = 'turn';
        this.stateT = 0;
        this.x = f.poleX + 2;
        this.facing = -1;
      }
    } else if (f.phase === 'turn') {
      if (this.stateT > 24) {
        this.state = 'walk';
        this.stateT = 0;
        this.facing = 1;
        G.playMusicOnce('clear');
      }
    }
  }

  updateWalkToDoor() {
    stepPlayerPhysics(this, { right: true }, G.area, G.platforms);
    if (this.vx > 1.2) this.vx = 1.2;
    this.anim += Math.abs(this.vx) * 0.13;
    const door = G.area.house ? G.area.house.x * TILE + 40 : Infinity;
    if (this.cx >= door && !this.hidden) {
      this.hidden = true;
      G.beginTally();
    }
  }

  frameName() {
    const walk = ['walk1', 'walk2', 'walk3'][Math.floor(this.anim) % 3];
    if (this.state === 'dead') return 'die';
    if (this.state === 'flag') return Math.floor(this.anim) % 2 ? 'climb2' : 'climb1';
    if (this.state === 'pipeDown' || this.state === 'pipeUp') return 'stand';
    if (this.state === 'pipeRight') return walk;
    if (this.crouching) return 'crouch';
    if (!this.onGround) return 'jump';
    if (this.skidding && this.state === 'normal') return 'skid';
    if (Math.abs(this.vx) < 0.1) return 'stand';
    return walk;
  }

  draw(ctx, opts = {}) {
    if (this.hidden) return;
    if (this.invuln > 0 && Math.floor(this.invuln / 3) % 2 === 0 && this.state === 'normal') return;
    const pal = opts.palette || this.palette();
    const size = opts.size || (this.big ? 'big' : 'small');
    let name = this.frameName();
    if (this.state === 'dead') {
      const s = Sprites.hero[pal].small.die;
      drawSpr(ctx, s, this.x - 2, this.y + this.h - 16);
      return;
    }
    const set = Sprites.hero[pal][size];
    if (!set[name]) name = 'stand';
    const spr = set[name];
    drawSpr(ctx, spr, this.x - 2, this.y + this.h - spr.h, this.facing < 0);
  }
}

// ================================================================ enemies ===
class Enemy extends Ent {
  constructor(x, y, w, h) {
    super(x, y, w, h);
    this.awake = false;
    this.knocked = false;
    this.harmful = true;
    this.stompable = true;
    this.fireproof = false;
    this.dir = -1;
    this.solidToOthers = true;
  }
  knock(dir) {
    if (this.knocked) return;
    this.knocked = true;
    this.harmful = false;
    this.vy = -3.6;
    this.vx = (dir || 1) * 0.9;
    Sound.play('kick');
  }
  updateKnocked() {
    this.vy = Math.min(this.vy + 0.25, 6);
    this.x += this.vx;
    this.y += this.vy;
    if (this.y > VIEW_H + 40) this.dead = true;
  }
  walkPhysics(smart) {
    this.vy = Math.min(this.vy + 0.3, 4.5);
    if (moveX(this, G.area, this.vx)) {
      this.vx = -this.vx;
      this.dir = -this.dir;
    }
    const r = moveY(this, G.area, this.vy);
    this.onGround = r.floor;
    if (r.floor) this.vy = 0;
    if (smart && this.onGround) {
      const ax = this.vx > 0 ? this.x + this.w + 1 : this.x - 1;
      const t = G.area.get(Math.floor(ax / TILE), Math.floor((this.y + this.h + 2) / TILE));
      if (!SOLID[t] && t !== T.LEDGE) {
        this.vx = -this.vx;
        this.dir = -this.dir;
      }
    }
    if (this.y > VIEW_H + 40) this.dead = true;
  }
  // player interaction; return true if handled
  onStomp() {}
  onTouch(p) {
    if (this.harmful) p.hurt();
  }
}

class Auto extends Enemy {
  constructor(x, y) {
    super(x + 1, y + 2, 14, 14);
    this.vx = -0.5;
    this.flat = 0;
  }
  update() {
    this.t++;
    if (this.knocked) return this.updateKnocked();
    if (this.flat) {
      if (++this.flat > 34) this.dead = true;
      return;
    }
    this.walkPhysics(false);
  }
  onStomp(p) {
    this.flat = 1;
    this.harmful = false;
    this.solidToOthers = false;
    Sound.play('stomp');
    p.stompScore(this.cx, this.y);
    for (let i = 0; i < 4; i++) G.fx.push(new Dust(this.cx + rand(-6, 6), this.y + 10));
  }
  draw(ctx) {
    if (this.flat) return drawSpr(ctx, Sprites.s.autoFlat, this.x - 1, this.y - 2);
    const spr = Math.floor(this.t / 8) % 2 ? Sprites.s.auto2 : Sprites.s.auto1;
    drawSpr(ctx, spr, this.x - 1, this.y - 2, this.vx > 0, this.knocked);
  }
}

class Monkey extends Enemy {
  constructor(x, y, smart) {
    super(x + 1, y + 1, 14, 15);
    this.smart = !!smart;
    this.vx = -0.45;
    this.state = 'walk';
    this.timer = 0;
    this.kickGrace = 0;
    this.combo = 0;
  }
  sprite(n) {
    return Sprites.s[(this.smart ? 'gold_' : '') + n];
  }
  update() {
    this.t++;
    if (this.knocked) return this.updateKnocked();
    if (this.kickGrace > 0) this.kickGrace--;
    if (this.state === 'walk') {
      this.walkPhysics(this.smart);
    } else if (this.state === 'ball') {
      this.vx = 0;
      this.walkPhysics(false);
      if (++this.timer > 420) {
        this.state = 'walk';
        this.vx = G.player.cx < this.cx ? -0.45 : 0.45;
        this.harmful = true;
      }
    } else if (this.state === 'roll') {
      const before = this.vx;
      this.walkPhysics(false);
      if (this.vx !== before) Sound.play('bump');
      // knock over everything in the way
      for (const e of G.ents) {
        if (e === this || !(e instanceof Enemy) || e.knocked || e.dead || !e.awake) continue;
        if (e instanceof Firebar || e instanceof Flame || e instanceof Boss) continue;
        if (overlap(this, e)) {
          e.knock(sign(this.vx));
          const table = [500, 800, 1000, 2000, 4000, 5000, 8000];
          if (this.combo >= table.length) G.addLife(e.cx, e.y);
          else G.addScore(table[this.combo], e.cx, e.y);
          this.combo++;
        }
      }
      if (this.x < G.camX - VIEW_W || this.x > G.camX + VIEW_W * 2) this.dead = true;
    }
  }
  onStomp(p) {
    Sound.play('stomp');
    if (this.state === 'walk') {
      this.state = 'ball';
      this.timer = 0;
      this.vx = 0;
      this.harmful = false;
      p.stompScore(this.cx, this.y);
    } else if (this.state === 'roll') {
      this.state = 'ball';
      this.timer = 0;
      this.vx = 0;
      this.harmful = false;
      p.stompScore(this.cx, this.y);
    } else {
      this.kick(p);
    }
  }
  kick(p) {
    const d = this.cx >= p.cx ? 1 : -1;
    this.state = 'roll';
    this.vx = 3.4 * d;
    this.harmful = true;
    this.kickGrace = 14;
    this.combo = 0;
    Sound.play('kick');
    G.addScore(400, this.cx, this.y);
  }
  onTouch(p) {
    if (this.state === 'ball') return this.kick(p);
    if (this.state === 'roll' && this.kickGrace > 0) return;
    if (this.harmful) p.hurt();
  }
  draw(ctx) {
    if (this.state === 'walk' || this.knocked) {
      const spr = this.sprite(Math.floor(this.t / 10) % 2 ? 'monkey2' : 'monkey1');
      drawSpr(ctx, spr, this.x - 1, this.y - 1, this.vx > 0, this.knocked);
    } else {
      let n = 'monkeyBall1';
      if (this.state === 'ball' && this.timer > 330 && Math.floor(this.t / 4) % 2) n = 'monkeyBall2';
      const shake = this.state === 'ball' && this.timer > 330 ? (Math.floor(this.t / 3) % 2 ? 1 : -1) : 0;
      const spin = this.state === 'roll' && Math.floor(this.t / 3) % 2;
      drawSpr(ctx, this.sprite(n), this.x - 1 + shake, this.y - 1, spin, false);
    }
  }
}

class Pigeon extends Enemy {
  constructor(x, y) {
    super(x + 1, y + 4, 14, 10);
    this.baseY = y + 4;
    this.vx = -0.45;
    this.phase = Math.random() * Math.PI * 2;
  }
  update() {
    this.t++;
    if (this.knocked) return this.updateKnocked();
    this.x += this.vx;
    this.y = this.baseY + Math.sin(this.t * 0.045 + this.phase) * 22;
    // turn toward the player now and then
    if (this.t % 180 === 0) this.vx = G.player.cx < this.cx ? -0.45 : 0.45;
    if (this.x < G.camX - VIEW_W) this.dead = true;
  }
  onStomp(p) {
    Sound.play('stomp');
    p.stompScore(this.cx, this.y);
    this.knock(p.facing);
  }
  draw(ctx) {
    const spr = Math.floor(this.t / 7) % 2 ? Sprites.s.pigeon2 : Sprites.s.pigeon1;
    drawSpr(ctx, spr, this.x - 1, this.y - 4, this.vx > 0, this.knocked);
  }
}

class Cobra extends Enemy {
  constructor(tx, ty) {
    super(tx * TILE + 10, ty * TILE, 12, 20);
    this.hideY = ty * TILE + 2;
    this.upY = ty * TILE - 22;
    this.y = this.hideY;
    this.stompable = false;
    this.phase = 'down';
    this.wait = 60;
    this.behindTiles = true;
    this.solidToOthers = false;
  }
  update() {
    this.t++;
    if (this.knocked) return this.updateKnocked();
    const p = G.player;
    if (this.phase === 'down') {
      const near = Math.abs(p.cx - this.cx) < 30 && p.y + p.h > this.upY - 16;
      if (--this.wait <= 0 && !near) this.phase = 'rise';
      else if (this.wait <= 0) this.wait = 20;
      this.harmful = false;
    } else if (this.phase === 'rise') {
      this.harmful = true;
      this.y -= 0.6;
      if (this.y <= this.upY) {
        this.y = this.upY;
        this.phase = 'up';
        this.wait = 70;
      }
    } else if (this.phase === 'up') {
      if (--this.wait <= 0) this.phase = 'lower';
    } else {
      this.y += 0.6;
      if (this.y >= this.hideY) {
        this.y = this.hideY;
        this.phase = 'down';
        this.wait = 90;
      }
    }
  }
  onTouch(p) {
    if (this.phase !== 'down') p.hurt();
  }
  draw(ctx) {
    const spr = Math.floor(this.t / 12) % 2 ? Sprites.s.cobra2 : Sprites.s.cobra1;
    drawSpr(ctx, spr, this.x - 2, this.y - 2, false, this.knocked);
  }
}

class Flame extends Enemy {
  constructor(tx, ty, delay = 0) {
    super(tx * TILE + 2, VIEW_H + 16, 12, 12);
    this.stompable = false;
    this.fireproof = true;
    this.wait = delay;
    this.active = false;
    this.solidToOthers = false;
  }
  update() {
    this.t++;
    if (this.knocked) return this.updateKnocked();
    if (!this.active) {
      this.harmful = false;
      if (--this.wait <= 0) {
        this.active = true;
        this.y = VIEW_H + 8;
        this.vy = -7.2;
      }
      return;
    }
    this.harmful = true;
    this.vy += 0.2;
    this.y += this.vy;
    if (this.vy > 0 && this.y > VIEW_H + 16) {
      this.active = false;
      this.wait = 110;
    }
  }
  draw(ctx) {
    if (!this.active && !this.knocked) return;
    const spr = Math.floor(this.t / 5) % 2 ? Sprites.s.flame2 : Sprites.s.flame1;
    drawSpr(ctx, spr, this.x - 2, this.y - 2, false, this.vy > 0);
  }
}

class Firebar extends Enemy {
  constructor(tx, ty, len = 5, speed = 0.03) {
    super(tx * TILE, ty * TILE, 16, 16);
    this.ocx = tx * TILE + 8;
    this.ocy = ty * TILE + 8;
    this.len = len;
    this.speed = speed;
    this.angle = 0;
    this.stompable = false;
    this.fireproof = true;
    this.solidToOthers = false;
  }
  knock() {}
  balls() {
    const out = [];
    for (let i = 0; i < this.len; i++) {
      out.push({ x: this.ocx + Math.cos(this.angle) * i * 8 - 3, y: this.ocy + Math.sin(this.angle) * i * 8 - 3, w: 6, h: 6 });
    }
    return out;
  }
  update() {
    this.angle += this.speed;
    this.t++;
  }
  hits(p) {
    for (const b of this.balls()) if (overlap(b, p)) return true;
    return false;
  }
  draw(ctx) {
    const spr = Math.floor(this.t / 4) % 2 ? Sprites.s.fireball2 : Sprites.s.fireball;
    for (const b of this.balls()) drawSpr(ctx, spr, b.x - 1, b.y - 1);
  }
}

class Banana extends Enemy {
  constructor(x, y, vx, vy) {
    super(x, y, 7, 7);
    this.vx = vx;
    this.vy = vy;
    this.stompable = false;
    this.fireproof = true;
    this.awake = true;
    this.solidToOthers = false;
  }
  update() {
    this.t++;
    this.vy += 0.14;
    this.x += this.vx;
    this.y += this.vy;
    if (this.y > VIEW_H + 20) this.dead = true;
  }
  knock() {
    this.dead = true;
  }
  draw(ctx) {
    const r = Math.floor(this.t / 4) % 4;
    const dx = Math.round(this.x - G.camX + 4);
    const dy = Math.round(this.y + 4);
    ctx.save();
    ctx.translate(dx, dy);
    ctx.rotate((r * Math.PI) / 2);
    ctx.drawImage(Sprites.s.banana.img, -4, -4);
    ctx.restore();
  }
}

class Boss extends Enemy {
  constructor(tx, ty, info) {
    super(tx * TILE + 4, ty * TILE + 4, 24, 28);
    this.info = info;
    this.hp = 5;
    this.stompable = true;
    this.fireproof = false;
    this.minX = (info.bridge.x0 + 3) * TILE;
    this.maxX = (info.bridge.x1 - 1) * TILE;
    this.vx = -0.4;
    this.throwT = 90;
    this.jumpT = 150;
    this.hurtT = 0;
    this.facing = -1;
    this.solidToOthers = false;
    this.throwing = 0;
  }
  knock(dir) {
    // fireballs and stomps chip away at the boss instead of knocking it out
    if (this.hurtT > 0 || this.knocked) return;
    this.hp--;
    this.hurtT = 40;
    Sound.play('bossHit');
    if (this.hp <= 0) {
      Enemy.prototype.knock.call(this, dir);
      Sound.play('bossFall');
      G.addScore(5000, this.cx, this.y);
      G.bossDefeated = true;
    }
  }
  update() {
    this.t++;
    if (this.knocked) return this.updateKnocked();
    if (this.hurtT > 0) this.hurtT--;
    const p = G.player;
    this.facing = p.cx < this.cx ? -1 : 1;
    if (G.bridgeFalling) {
      this.vx = 0;
      this.vy = Math.min(this.vy + 0.3, 5);
      const r = moveY(this, G.area, this.vy);
      if (r.floor) this.vy = 0;
      if (this.y > VIEW_H + 40) this.dead = true;
      return;
    }
    // pace back and forth on the bridge
    if (this.x < this.minX) this.vx = Math.abs(this.vx);
    if (this.x > this.maxX) this.vx = -Math.abs(this.vx);
    this.vy = Math.min(this.vy + 0.25, 5);
    moveX(this, G.area, this.vx);
    const r = moveY(this, G.area, this.vy);
    this.onGround = r.floor;
    if (r.floor) this.vy = 0;
    if (this.onGround && --this.jumpT <= 0) {
      this.vy = -4.6;
      this.jumpT = randi(110, 200);
    }
    const dist = Math.abs(p.cx - this.cx);
    if (dist < 13 * TILE && --this.throwT <= 0 && p.state === 'normal') {
      this.throwT = randi(70, 130);
      this.throwing = 16;
      const d = this.facing;
      const speed = clamp(dist / 40, 1.2, 2.6);
      G.spawn(new Banana(this.cx + d * 10, this.y + 2, d * speed, -3.6));
      Sound.play('throwIt');
    }
    if (this.throwing > 0) this.throwing--;
  }
  onStomp(p) {
    if (this.hurtT > 0) {
      p.bounce(true);
      return;
    }
    this.knock(p.facing);
    p.bounce(true);
  }
  draw(ctx) {
    let spr;
    if (this.hurtT > 0 && Math.floor(this.hurtT / 3) % 2) spr = Sprites.s.boss_hurt;
    else if (this.throwing > 0) spr = Sprites.s.boss_throw;
    else spr = Math.floor(this.t / 14) % 2 ? Sprites.s.boss_walk2 : Sprites.s.boss_walk1;
    drawSpr(ctx, spr, this.x - 4, this.y - 4, this.facing > 0, this.knocked);
  }
}

// ================================================================== items ===
class PowerUp extends Ent {
  constructor(kind, tx, ty) {
    super(tx * TILE + 1, ty * TILE, 14, 16);
    this.kind = kind; // vadapav | mirchi | dhol | modak
    this.emerge = 16;
    this.startY = ty * TILE;
    this.behindTiles = true;
    this.vx = 0;
  }
  update() {
    this.t++;
    if (this.emerge > 0) {
      this.emerge--;
      this.y = this.startY - (16 - this.emerge);
      if (this.emerge === 0) {
        this.behindTiles = false;
        if (this.kind !== 'mirchi') this.vx = 1;
      }
      return;
    }
    if (this.kind === 'mirchi') return;
    this.vy = Math.min(this.vy + (this.kind === 'dhol' ? 0.2 : 0.3), 4);
    if (moveX(this, G.area, this.vx)) this.vx = -this.vx;
    const r = moveY(this, G.area, this.vy);
    if (r.floor) {
      this.vy = this.kind === 'dhol' ? -4.2 : 0;
    }
    if (r.ceil) this.vy = 0.5;
    if (this.y > VIEW_H + 32) this.dead = true;
  }
  bumped(fromX) {
    this.vy = -3;
    if (this.kind !== 'mirchi') this.vx = this.cx < fromX ? -1 : 1;
  }
  draw(ctx) {
    let spr = Sprites.s[this.kind];
    if (this.kind === 'mirchi' && Math.floor(this.t / 6) % 2) spr = Sprites.s.mirchi2;
    if (this.kind === 'dhol' && Math.floor(this.t / 5) % 2) spr = Sprites.s.dhol2;
    drawSpr(ctx, spr, this.x - 1, this.y);
  }
}

class BlockCoin extends Ent {
  constructor(tx, ty) {
    super(tx * TILE, ty * TILE - 16, 16, 16);
    this.vy = -5.2;
  }
  update() {
    this.t++;
    this.vy += 0.3;
    this.y += this.vy;
    if (this.t > 30) {
      this.dead = true;
      G.fx.push(new Popup('200', this.cx, this.y));
    }
  }
  draw(ctx) {
    const f = Math.floor(this.t / 3) % 4;
    const spr = [Sprites.s.coin0, Sprites.s.coin1, Sprites.s.coin2, Sprites.s.coin1][f];
    drawSpr(ctx, spr, this.x, this.y, f === 3);
  }
}

class Fireball extends Ent {
  constructor(x, y, dir) {
    super(x, y, 8, 8);
    this.vx = 4 * dir;
    this.vy = 2.5;
  }
  update() {
    this.t++;
    this.vy = Math.min(this.vy + 0.35, 4);
    if (moveX(this, G.area, this.vx)) return this.pop();
    const r = moveY(this, G.area, this.vy);
    if (r.floor) this.vy = -3;
    if (r.ceil) return this.pop();
    if (this.x < G.camX - 16 || this.x > G.camX + VIEW_W + 16 || this.y > VIEW_H) this.dead = true;
    for (const e of G.ents) {
      if (!(e instanceof Enemy) || e.knocked || e.dead || !e.awake) continue;
      if (e instanceof Cobra && e.phase === 'down') continue;
      const hit = e instanceof Firebar ? false : overlap(this, e);
      if (!hit) continue;
      if (e.fireproof) return this.pop();
      e.knock(sign(this.vx));
      if (!(e instanceof Boss)) G.addScore(200, e.cx, e.y);
      return this.pop();
    }
  }
  pop() {
    this.dead = true;
    G.fx.push(new Puff(this.cx, this.cy));
    Sound.play('bump');
  }
  draw(ctx) {
    const f = Math.floor(this.t / 3) % 2;
    drawSpr(ctx, f ? Sprites.s.fireball2 : Sprites.s.fireball, this.x, this.y, this.vx < 0);
  }
}

// ============================================================== platforms ===
class Platform extends Ent {
  constructor(o, theme) {
    super(o.x * TILE, o.y * TILE, o.w * TILE, 8);
    this.kind = o.kind;
    this.theme = theme;
    this.axis = o.axis || 'x';
    this.min = (o.min == null ? o.x : o.min) * TILE;
    this.max = (o.max == null ? o.x : o.max) * TILE;
    this.speed = o.speed || 0.6;
    this.dir = o.phase ? -1 : 1;
    this.dx = 0;
    this.dy = 0;
    this.stood = 0;
    this.falling = false;
  }
  update() {
    this.t++;
    const p = G.player;
    const on = p.platform === this && p.state === 'normal';
    const ox = this.x;
    const oy = this.y;
    if (this.kind === 'move') {
      if (this.axis === 'x') {
        this.x += this.speed * this.dir;
        if (this.x >= this.max) (this.x = this.max), (this.dir = -1);
        if (this.x <= this.min) (this.x = this.min), (this.dir = 1);
      } else {
        this.y += this.speed * this.dir;
        if (this.y >= this.max) (this.y = this.max), (this.dir = -1);
        if (this.y <= this.min) (this.y = this.min), (this.dir = 1);
      }
    } else if (this.kind === 'fall') {
      if (on) this.stood++;
      if (this.stood > 28) this.falling = true;
      if (this.falling) {
        this.vy = Math.min(this.vy + 0.18, 4);
        this.y += this.vy;
        if (this.y > VIEW_H + 16) this.dead = true;
      }
    }
    this.dx = this.x - ox;
    this.dy = this.y - oy;
  }
  draw(ctx) {
    const x = Math.round(this.x - G.camX);
    let y = Math.round(this.y);
    if (this.kind === 'fall' && this.stood > 10 && !this.falling) y += Math.floor(this.t / 2) % 2;
    const pal = {
      overworld: ['#b87a3a', '#e0a860', '#6a3e18'],
      underground: ['#8a96aa', '#d8e0ec', '#3a4458'],
      metro: ['#8a96aa', '#d8e0ec', '#3a4458'],
      sky: ['#9a8e7a', '#c8bca6', '#4a4034'],
      castle: ['#8a8698', '#bab6c8', '#3a3848'],
    }[this.theme];
    ctx.fillStyle = pal[2];
    ctx.fillRect(x, y, this.w, 8);
    ctx.fillStyle = pal[0];
    ctx.fillRect(x + 1, y + 1, this.w - 2, 5);
    ctx.fillStyle = pal[1];
    ctx.fillRect(x + 1, y + 1, this.w - 2, 1);
    ctx.fillStyle = pal[2];
    for (let i = 8; i < this.w; i += 16) ctx.fillRect(x + i, y + 2, 1, 4);
    if (this.theme === 'underground' || this.theme === 'metro') {
      ctx.fillStyle = '#f8d030';
      for (let i = 2; i < this.w - 2; i += 6) ctx.fillRect(x + i, y + 6, 3, 1);
    }
    if (this.kind === 'fall') {
      ctx.fillStyle = '#6a8a40';
      for (let i = 1; i < this.w - 1; i += 5) ctx.fillRect(x + i, y, 2, 1);
    }
  }
}

// =========================================================== checkpoints ===
class Checkpoint extends Ent {
  constructor(tx, ty) {
    super(tx * TILE, (ty - 2) * TILE, 16, 48);
    this.reached = false;
    this.tx = tx;
    this.ty = ty;
  }
  update() {
    this.t++;
  }
  draw(ctx) {
    const x = Math.round(this.x - G.camX) + 6;
    const y = Math.round(this.y);
    ctx.fillStyle = '#6a4024';
    ctx.fillRect(x, y + 4, 2, 44);
    ctx.fillStyle = '#fcd23c';
    ctx.fillRect(x - 1, y + 2, 4, 3);
    const wave = Math.floor(this.t / 8) % 2;
    const col = this.reached ? '#f5821f' : '#9a9aa8';
    for (let r = 0; r < 9; r++) {
      ctx.fillStyle = col;
      ctx.fillRect(x + 2, y + 5 + r, 11 - Math.abs(4 - r) - (wave && r % 3 === 0 ? 1 : 0), 1);
    }
    if (this.reached) {
      ctx.fillStyle = '#fff4d0';
      ctx.fillRect(x + 5, y + 8, 3, 3);
    }
  }
}

class Bell extends Ent {
  constructor(tx, ty) {
    super(tx * TILE, ty * TILE - 16, 16, 48);
    this.rung = false;
    this.swing = 0;
  }
  update() {
    this.t++;
    if (this.swing > 0) this.swing--;
  }
  draw(ctx) {
    const x = Math.round(this.x - G.camX);
    const y = Math.round(this.y);
    // wooden frame
    ctx.fillStyle = '#6a3e22';
    ctx.fillRect(x - 4, y, 24, 3);
    ctx.fillRect(x - 4, y, 3, 48);
    ctx.fillRect(x + 17, y, 3, 48);
    ctx.fillStyle = '#8a5a32';
    ctx.fillRect(x - 4, y, 24, 1);
    ctx.fillStyle = '#c8a040';
    ctx.fillRect(x + 7, y + 3, 2, 6);
    const a = this.swing > 0 ? Math.sin(this.swing * 0.4) * 0.5 : Math.sin(this.t * 0.05) * 0.08;
    ctx.save();
    ctx.translate(x + 8, y + 8);
    ctx.rotate(a);
    ctx.drawImage(Sprites.s.bell.img, -8, 0);
    ctx.restore();
  }
}

// ================================================================ effects ===
class Popup {
  constructor(text, x, y, color = '#ffffff') {
    this.text = text;
    this.x = x;
    this.y = y;
    this.t = 0;
    this.color = color;
  }
  update() {
    this.t++;
    this.y -= this.t < 30 ? 0.8 : 0.1;
    return this.t < 50;
  }
  draw(ctx) {
    Font.draw(ctx, this.text, this.x - G.camX, this.y, this.color, { tiny: true, align: 'center', outline: '#1a1020' });
  }
}

// Speech bubble for honking drivers and the stuck hero.
class Bubble {
  constructor(text, x, y, life = 70) {
    Object.assign(this, { text, x, y, t: 0, life });
  }
  update() {
    this.t++;
    if (this.t < 8) this.y -= 0.8;
    return this.t < this.life;
  }
  draw(ctx) {
    const w = this.text.length * 4 + 5;
    const x = Math.round(this.x - G.camX - w / 2);
    const y = Math.round(this.y);
    ctx.fillStyle = '#1a1020';
    ctx.fillRect(x - 1, y - 1, w + 2, 11);
    ctx.fillRect(x + w / 2 - 1, y + 10, 3, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y, w, 9);
    ctx.fillRect(x + w / 2, y + 9, 1, 3);
    Font.draw(ctx, this.text, x + 3, y + 2, '#1a1020', { tiny: true });
  }
}

class Debris {
  constructor(x, y, vx, vy, img) {
    Object.assign(this, { x, y, vx, vy, img, t: 0 });
  }
  update() {
    this.t++;
    this.vy += 0.3;
    this.x += this.vx;
    this.y += this.vy;
    return this.y < VIEW_H + 16;
  }
  draw(ctx) {
    const flip = Math.floor(this.t / 4) % 2;
    ctx.save();
    ctx.translate(Math.round(this.x - G.camX) + 4, Math.round(this.y) + 4);
    if (flip) ctx.scale(-1, 1);
    ctx.drawImage(this.img, -4, -4);
    ctx.restore();
  }
}

class Sparkle {
  constructor(x, y) {
    Object.assign(this, { x, y, t: 0 });
  }
  update() {
    this.t++;
    return this.t < 16;
  }
  draw(ctx) {
    const x = Math.round(this.x - G.camX);
    const y = Math.round(this.y);
    const s = this.t < 8 ? Math.floor(this.t / 3) + 1 : Math.floor((16 - this.t) / 3) + 1;
    ctx.fillStyle = this.t % 4 < 2 ? '#fff8c0' : '#ffffff';
    ctx.fillRect(x - s, y, s * 2 + 1, 1);
    ctx.fillRect(x, y - s, 1, s * 2 + 1);
  }
}

class Dust {
  constructor(x, y) {
    Object.assign(this, { x, y, t: 0 });
  }
  update() {
    this.t++;
    this.y -= 0.3;
    return this.t < 14;
  }
  draw(ctx) {
    ctx.fillStyle = this.t < 7 ? '#f4efe6' : '#c8c0b4';
    const r = this.t < 7 ? 2 : 1;
    ctx.fillRect(Math.round(this.x - G.camX) - r, Math.round(this.y) - r, r * 2, r * 2);
  }
}

class Puff {
  constructor(x, y) {
    Object.assign(this, { x, y, t: 0 });
  }
  update() {
    this.t++;
    return this.t < 12;
  }
  draw(ctx) {
    const r = 2 + Math.floor(this.t / 3);
    const x = Math.round(this.x - G.camX);
    const y = Math.round(this.y);
    ctx.fillStyle = this.t < 6 ? '#fff2b0' : '#f5821f';
    ctx.fillRect(x - r, y - 1, r * 2, 2);
    ctx.fillRect(x - 1, y - r, 2, r * 2);
  }
}

class Firework {
  constructor(x, y, delay = 0) {
    Object.assign(this, { x, y, t: -delay, parts: [] });
    const cols = ['#fcd23c', '#f5821f', '#f07cb0', '#8fd8f8', '#9ce05a', '#ffffff'];
    this.col = cols[randi(0, cols.length - 1)];
    this.col2 = cols[randi(0, cols.length - 1)];
    this.screen = false;
  }
  update() {
    this.t++;
    if (this.t === 1) {
      Sound.play('firework');
      for (let i = 0; i < 28; i++) {
        const a = (i / 28) * Math.PI * 2;
        const s = rand(1.2, 2.4);
        this.parts.push({ x: this.x, y: this.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s });
      }
    }
    for (const p of this.parts) {
      p.vy += 0.04;
      p.vx *= 0.97;
      p.vy *= 0.97;
      p.x += p.vx;
      p.y += p.vy;
    }
    return this.t < 70;
  }
  draw(ctx) {
    if (this.t <= 0) return;
    const ox = this.screen ? 0 : G.camX;
    for (let i = 0; i < this.parts.length; i++) {
      const p = this.parts[i];
      if (this.t > 50 && (this.t + i) % 3 === 0) continue;
      ctx.fillStyle = i % 2 ? this.col : this.col2;
      ctx.fillRect(Math.round(p.x - ox), Math.round(p.y), 2, 2);
    }
    if (this.t < 5) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.round(this.x - ox) - 3, Math.round(this.y) - 3, 6, 6);
    }
  }
}
