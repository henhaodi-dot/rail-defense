import * as THREE from 'three';

export const GRID = 12;
export const CELL = 2.0;
const HALF = (GRID * CELL) / 2;

export class Grid {
  constructor() {
    this.cells = [];
    for (let r = 0; r < GRID; r++) {
      this.cells[r] = [];
      for (let c = 0; c < GRID; c++)
        this.cells[r][c] = { type: 0, data: null };
    }
    this._group = null;
    this._hl = null;
  }

  ok(r, c) { return r >= 0 && r < GRID && c >= 0 && c < GRID; }

  get(r, c) { return this.ok(r,c) ? this.cells[r][c] : null; }

  set(r, c, type, data=null) {
    if (this.ok(r,c)) this.cells[r][c] = { type, data };
  }

  toWorld(r, c) {
    return {
      x: (c - GRID/2 + 0.5) * CELL,
      z: (r - GRID/2 + 0.5) * CELL,
    };
  }

  toGrid(x, z) {
    const c = Math.floor(x / CELL + GRID/2);
    const r = Math.floor(z / CELL + GRID/2);
    return this.ok(r,c) ? { row:r, col:c } : null;
  }

  neighbors(r, c) {
    const out = [];
    for (const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]]) {
      const nr = r+dr, nc = c+dc;
      if (this.ok(nr,nc)) out.push({row:nr, col:nc});
    }
    return out;
  }

  createVisual(scene, materials) {
    this._group = new THREE.Group();
    this._group.visible = false;

    const lineMat = new THREE.LineBasicMaterial({color:'#ffffff', transparent:true, opacity:0.12});
    const pts = [];
    for (let i = 0; i <= GRID; i++) {
      const p = (i - GRID/2) * CELL;
      pts.push(new THREE.Vector3(-HALF, 0.02, p), new THREE.Vector3(HALF, 0.02, p));
      pts.push(new THREE.Vector3(p, 0.02, -HALF), new THREE.Vector3(p, 0.02, HALF));
    }
    this._group.add(new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints(pts), lineMat
    ));

    this._hl = new THREE.Mesh(
      new THREE.PlaneGeometry(CELL*0.92, CELL*0.92),
      materials.highlight.clone()
    );
    this._hl.rotation.x = -Math.PI/2;
    this._hl.position.y = 0.03;
    this._hl.visible = false;
    this._group.add(this._hl);

    scene.add(this._group);
  }

  show() { if (this._group) this._group.visible = true; }
  hide() {
    if (this._group) this._group.visible = false;
    if (this._hl) this._hl.visible = false;
  }

  highlight(r, c, valid=true) {
    if (!this._hl) return;
    const {x,z} = this.toWorld(r,c);
    this._hl.position.x = x;
    this._hl.position.z = z;
    this._hl.material.color.set(valid ? '#40a0ff' : '#ff4040');
    this._hl.visible = true;
  }

  clearHL() { if (this._hl) this._hl.visible = false; }
}
