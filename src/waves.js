const DEFS = [
  { foes:[{t:'WOLF',n:4}], gap:2.5 },
  { foes:[{t:'WOLF',n:6}], gap:2 },
  { foes:[{t:'WOLF',n:5},{t:'BEAR',n:1}], gap:2 },
  { foes:[{t:'BEAR',n:2},{t:'WOLF',n:5}], gap:1.8 },
  { foes:[{t:'BEAR',n:3},{t:'WOLF',n:6}], gap:1.5 },
  { foes:[{t:'WOLF',n:10},{t:'BEAR',n:3}], gap:1.2 },
  { foes:[{t:'BEAR',n:5},{t:'WOLF',n:6}], gap:1.2 },
  { foes:[{t:'BEAR',n:4},{t:'WOLF',n:10}], gap:1.0 },
  { foes:[{t:'BEAR',n:6},{t:'WOLF',n:8}], gap:0.9 },
  { foes:[{t:'WOLF',n:14},{t:'BEAR',n:5}], gap:0.8 },
  { foes:[{t:'BEAR',n:8},{t:'WOLF',n:10}], gap:0.7 },
  { foes:[{t:'BEAR',n:10},{t:'WOLF',n:14}], gap:0.6 },
];

export class WaveManager {
  constructor(enemyMgr) {
    this.em = enemyMgr;
    this.wave = 0;
    this.active = false;
    this.buildTime = 25;
    this.buildTimer = 0;
    this.queue = [];
    this.spawnTimer = 0;
    this.gap = 2;
    this.started = false;
    this.onWaveDone = null;
    this.onAllDone = null;
  }

  get total() { return DEFS.length; }
  get building() { return this.started && !this.active && this.wave < DEFS.length; }

  start() {
    if (this.active || this.wave >= DEFS.length) return;
    this.wave++;
    this.active = true;
    this.started = true;
    const def = DEFS[this.wave - 1];
    this.gap = def.gap;
    this.queue = [];
    for (const g of def.foes)
      for (let i = 0; i < g.n; i++) this.queue.push(g.t);
    for (let i = this.queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
    }
    this.spawnTimer = 0;
  }

  update(dt) {
    if (!this.started) return;
    if (this.active) {
      if (this.queue.length) {
        this.spawnTimer += dt;
        if (this.spawnTimer >= this.gap) {
          this.spawnTimer = 0;
          const {x, z} = this._edge();
          this.em.spawn(this.queue.shift(), x, z);
        }
      }
      if (!this.queue.length && !this.em.alive().length) {
        this.active = false;
        this.buildTimer = this.buildTime;
        if (this.wave >= DEFS.length) {
          if (this.onAllDone) this.onAllDone();
        } else {
          if (this.onWaveDone) this.onWaveDone(this.wave);
        }
      }
    } else if (this.wave > 0 && this.wave < DEFS.length) {
      this.buildTimer -= dt;
      if (this.buildTimer <= 0) this.start();
    }
  }

  reset() {
    this.wave = 0;
    this.active = false;
    this.buildTimer = 0;
    this.queue = [];
    this.spawnTimer = 0;
    this.started = false;
  }

  _edge() {
    const H = 13;
    const side = Math.floor(Math.random() * 4);
    const a = (Math.random() - .5) * H * 2;
    switch (side) {
      case 0: return {x:-H, z:a};
      case 1: return {x:H, z:a};
      case 2: return {x:a, z:-H};
      default: return {x:a, z:H};
    }
  }
}
