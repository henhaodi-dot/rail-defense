import * as THREE from 'three';

export class InputManager {
  constructor(renderer, camera, ground) {
    this.camera = camera;
    this.ground = ground;
    this.ray = new THREE.Raycaster();
    this.ndc = new THREE.Vector2();

    this.theta = Math.PI/4;
    this.phi = Math.PI/4.5;
    this.dist = 22;
    this.target = new THREE.Vector3(0, 0, 0);

    this.onCellTap = null;

    this._ptrs = new Map();
    this._pinch = null;
    this._tapOrigin = null;
    this._moved = false;

    const el = renderer.domElement;
    el.addEventListener('pointerdown',  e => this._down(e));
    el.addEventListener('pointermove',  e => this._move(e));
    el.addEventListener('pointerup',    e => this._up(e));
    el.addEventListener('pointercancel',e => this._up(e));

    this.updateCamera();
  }

  updateCamera() {
    const {theta, phi, dist, target, camera} = this;
    camera.position.set(
      target.x + dist*Math.cos(phi)*Math.sin(theta),
      target.y + dist*Math.sin(phi),
      target.z + dist*Math.cos(phi)*Math.cos(theta)
    );
    camera.lookAt(target);
  }

  _down(e) {
    this._ptrs.set(e.pointerId, {x:e.clientX, y:e.clientY});
    this._tapOrigin = {x:e.clientX, y:e.clientY, t:Date.now()};
    this._moved = false;
    if (this._ptrs.size === 2) {
      const [a,b] = [...this._ptrs.values()];
      this._pinch = {d:Math.hypot(a.x-b.x, a.y-b.y), dist:this.dist};
    }
  }

  _move(e) {
    if (!this._ptrs.has(e.pointerId)) return;
    const prev = this._ptrs.get(e.pointerId);
    const dx = e.clientX-prev.x, dy = e.clientY-prev.y;
    this._ptrs.set(e.pointerId, {x:e.clientX, y:e.clientY});
    if (Math.abs(dx)>3 || Math.abs(dy)>3) this._moved = true;

    if (this._ptrs.size >= 2 && this._pinch) {
      const [a,b] = [...this._ptrs.values()];
      const d = Math.hypot(a.x-b.x, a.y-b.y);
      this.dist = Math.max(10, Math.min(35, this._pinch.dist*(this._pinch.d/d)));
    } else if (this._ptrs.size === 1) {
      this.theta -= dx*0.006;
      this.phi = Math.max(0.15, Math.min(1.2, this.phi+dy*0.006));
    }
    this.updateCamera();
  }

  _up(e) {
    this._ptrs.delete(e.pointerId);
    if (this._ptrs.size < 2) this._pinch = null;

    if (this._tapOrigin && !this._moved && Date.now()-this._tapOrigin.t < 300) {
      this._tap(this._tapOrigin.x, this._tapOrigin.y);
    }
    this._tapOrigin = null;
  }

  _tap(cx, cy) {
    this.ndc.x = (cx/window.innerWidth)*2 - 1;
    this.ndc.y = -(cy/window.innerHeight)*2 + 1;
    this.ray.setFromCamera(this.ndc, this.camera);
    const hits = this.ray.intersectObject(this.ground);
    if (hits.length && this.onCellTap) {
      this.onCellTap(hits[0].point.x, hits[0].point.z);
    }
  }
}
