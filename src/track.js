import * as THREE from 'three';

export class TrackManager {
  constructor(scene, grid, mats) {
    this.scene = scene;
    this.grid = grid;
    this.mats = mats;
    this.cells = new Set();
    this.group = new THREE.Group();
    scene.add(this.group);
  }

  key(r,c) { return `${r},${c}`; }
  parse(k) { const [r,c]=k.split(',').map(Number); return {row:r,col:c}; }

  has(r,c) { return this.cells.has(this.key(r,c)); }

  canPlace(r,c) {
    if (!this.grid.ok(r,c)) return false;
    if (this.grid.get(r,c).type !== 0) return false;
    if (this.cells.size === 0) return true;
    return this.grid.neighbors(r,c).some(({row,col}) => this.has(row,col));
  }

  add(r,c) {
    if (!this.canPlace(r,c)) return false;
    this.cells.add(this.key(r,c));
    this.grid.set(r,c,1);
    this._rebuild();
    return true;
  }

  adjacentTrack(r,c) {
    for (const {row,col} of this.grid.neighbors(r,c))
      if (this.has(row,col)) return {row,col};
    return null;
  }

  findPath(from, to) {
    const sk = this.key(from.row,from.col), ek = this.key(to.row,to.col);
    if (!this.cells.has(sk) || !this.cells.has(ek)) return null;
    const visited = new Set([sk]);
    const queue = [[sk]];
    while (queue.length) {
      const path = queue.shift();
      const cur = this.parse(path[path.length-1]);
      if (path[path.length-1] === ek) return path.map(k=>this.parse(k));
      for (const {row,col} of this.grid.neighbors(cur.row, cur.col)) {
        const k = this.key(row,col);
        if (!visited.has(k) && this.cells.has(k)) {
          visited.add(k);
          queue.push([...path, k]);
        }
      }
    }
    return null;
  }

  curveForPath(path) {
    if (!path || path.length < 2) return null;
    const pts = path.map(({row,col}) => {
      const {x,z} = this.grid.toWorld(row,col);
      return new THREE.Vector3(x, 0.05, z);
    });
    return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.3);
  }

  _rebuild() {
    while (this.group.children.length) {
      const ch = this.group.children[0];
      this.group.remove(ch);
      if (ch.geometry) ch.geometry.dispose();
    }
    const chains = this._chains();
    for (const chain of chains) {
      if (chain.length < 2) {
        const {x,z} = this.grid.toWorld(chain[0].row, chain[0].col);
        const m = new THREE.Mesh(new THREE.BoxGeometry(.3,.06,.3), this.mats.rail);
        m.position.set(x,.03,z);
        this.group.add(m);
        continue;
      }
      const pts = chain.map(({row,col})=>{
        const {x,z}=this.grid.toWorld(row,col);
        return new THREE.Vector3(x,.05,z);
      });
      const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.3);
      const steps = Math.max(chain.length*10, 40);

      const offset = (d) => {
        const op = [];
        for (let i=0;i<=steps;i++){
          const t=i/steps;
          const p=curve.getPointAt(t), tan=curve.getTangentAt(t);
          const n = new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0), tan).normalize();
          op.push(new THREE.Vector3(p.x+n.x*d, p.y, p.z+n.z*d));
        }
        return new THREE.CatmullRomCurve3(op);
      };

      for (const d of [0.22, -0.22]) {
        const rail = new THREE.Mesh(
          new THREE.TubeGeometry(offset(d), steps, 0.04, 4, false),
          this.mats.rail
        );
        rail.castShadow = true;
        this.group.add(rail);
      }

      const tieN = Math.max(chain.length*3, 8);
      for (let i=0;i<tieN;i++){
        const t=(i+.5)/tieN;
        const p=curve.getPointAt(t), tan=curve.getTangentAt(t);
        const tie = new THREE.Mesh(new THREE.BoxGeometry(.08,.04,.6), this.mats.woodD);
        tie.position.copy(p); tie.position.y=.02;
        tie.rotation.y = Math.atan2(tan.x, tan.z);
        tie.castShadow = true;
        this.group.add(tie);
      }
    }
  }

  _chains() {
    if (!this.cells.size) return [];
    const adj = new Map();
    for (const k of this.cells) adj.set(k,[]);
    for (const k of this.cells) {
      const {row,col} = this.parse(k);
      for (const {row:nr,col:nc} of this.grid.neighbors(row,col)) {
        const nk = this.key(nr,nc);
        if (this.cells.has(nk)) adj.get(k).push(nk);
      }
    }
    const visited = new Set();
    const chains = [];
    const endpoints = [...this.cells].filter(k => adj.get(k).length<=1);
    const starts = endpoints.length ? endpoints : [...this.cells];
    for (const start of starts) {
      if (visited.has(start)) continue;
      const chain = [];
      let cur = start, prev = null;
      while (cur && !visited.has(cur)) {
        visited.add(cur);
        chain.push(this.parse(cur));
        const next = adj.get(cur).find(n => n!==prev && !visited.has(n));
        prev = cur; cur = next;
      }
      if (chain.length) chains.push(chain);
    }
    return chains;
  }
}
