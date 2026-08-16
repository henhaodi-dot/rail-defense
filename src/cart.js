import * as THREE from 'three';

export class CartManager {
  constructor(scene, mats, track, buildings) {
    this.scene = scene;
    this.mats = mats;
    this.track = track;
    this.buildings = buildings;
    this.carts = [];
    this.group = new THREE.Group();
    scene.add(this.group);
    this.onDeliver = null;
    this._checkTimer = 0;
  }

  _mesh() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(.5,.3,.7), this.mats.cart);
    body.position.y=.25; body.castShadow=true; g.add(body);
    for (let i=0;i<3;i++){
      const bar = new THREE.Mesh(new THREE.BoxGeometry(.12,.08,.18), this.mats.gold);
      bar.position.set((i-1)*.14,.45,0); bar.rotation.y=(i-1)*.2; g.add(bar);
    }
    for (const [dx,dz] of [[-.25,-.25],[.25,-.25],[.25,.25],[-.25,.25]]){
      const w = new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,.04,8), this.mats.rail);
      w.position.set(dx,.1,dz); w.rotation.z=Math.PI/2; g.add(w);
    }
    return g;
  }

  checkRoutes() {
    const mines = this.buildings.byType('MINING');
    const stores = this.buildings.byType('STORAGE');
    for (const mine of mines) {
      if (this.carts.some(c=>c.mine===mine)) continue;
      const mt = this.track.adjacentTrack(mine.row, mine.col);
      if (!mt) continue;
      for (const store of stores) {
        const st = this.track.adjacentTrack(store.row, store.col);
        if (!st) continue;
        const path = this.track.findPath(mt, st);
        if (path) { this._spawn(mine, store, path); break; }
      }
    }
  }

  _spawn(mine, store, path) {
    const curve = this.track.curveForPath(path);
    if (!curve) return;
    const mesh = this._mesh();
    this.group.add(mesh);
    this.carts.push({ mine, store, curve, mesh, t:0, speed:.08, dir:1, wait:0 });
  }

  update(dt) {
    this._checkTimer += dt;
    if (this._checkTimer > 2) { this._checkTimer=0; this.checkRoutes(); }

    for (const c of this.carts) {
      if (c.wait > 0) { c.wait -= dt; continue; }
      c.t += c.speed * dt * c.dir;
      if (c.t >= 1) {
        c.t=1; c.dir=-1; c.wait=1;
        if (this.onDeliver) this.onDeliver(c);
      } else if (c.t <= 0) {
        c.t=0; c.dir=1; c.wait=1.5;
      }
      const ct = Math.max(0,Math.min(1,c.t));
      const p = c.curve.getPointAt(ct);
      const tan = c.curve.getTangentAt(ct);
      c.mesh.position.copy(p); c.mesh.position.y=.05;
      c.mesh.lookAt(p.x+tan.x*c.dir, .05, p.z+tan.z*c.dir);
    }
  }
}
