import * as THREE from 'three';

const PROJ_COLORS = {
  TOWER:  { color:'#ff8800', emissive:'#ff4400' },
  CANNON: { color:'#ff4444', emissive:'#aa0000' },
  ICE:    { color:'#66ccff', emissive:'#2288cc' },
};

export class CombatManager {
  constructor(scene, buildings, enemies) {
    this.buildings = buildings;
    this.enemies = enemies;
    this.projectiles = [];
    this.group = new THREE.Group();
    scene.add(this.group);
    this.towerCD = new Map();
  }

  update(dt) {
    this._towers(dt);
    this._projectiles(dt);
  }

  _towers(dt) {
    const allTowers = [
      ...this.buildings.byType('TOWER'),
      ...this.buildings.byType('CANNON'),
      ...this.buildings.byType('ICE'),
    ];
    const alive = this.enemies.alive();
    if (!alive.length) return;

    for (const t of allTowers) {
      if (!this.towerCD.has(t)) this.towerCD.set(t, 99);
      const cd = this.towerCD.get(t) + dt;
      this.towerCD.set(t, cd);
      if (cd < t.cd) continue;

      const {x, z} = this.buildings.grid.toWorld(t.row, t.col);
      let best = null, bestD = t.range;
      for (const e of alive) {
        const dx = e.mesh.position.x - x, dz = e.mesh.position.z - z;
        const d = Math.sqrt(dx * dx + dz * dz);
        if (d < bestD) { bestD = d; best = e; }
      }
      if (best) {
        this.towerCD.set(t, 0);
        const fireY = t.type === 'CANNON' ? 1.1 : t.type === 'ICE' ? 1.0 : 1.9;
        this._fire(new THREE.Vector3(x, fireY, z), best, t);
      }
    }
  }

  _fire(from, target, tower) {
    const pc = PROJ_COLORS[tower.type] || PROJ_COLORS.TOWER;
    const size = tower.type === 'CANNON' ? 0.12 : 0.08;
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(size, 5, 4),
      new THREE.MeshStandardMaterial({color:pc.color, emissive:pc.emissive, emissiveIntensity:.5})
    );
    mesh.position.copy(from);
    mesh.castShadow = true;
    this.group.add(mesh);
    this.projectiles.push({
      mesh, target, damage: tower.dmg, speed: tower.type === 'CANNON' ? 9 : 12,
      towerType: tower.type,
      splash: tower.splash || 0,
      slow: tower.slow || 0,
      slowDur: tower.slowDur || 0,
    });
  }

  _projectiles(dt) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      if (p.target.dying) { this._removeProj(i); continue; }
      const tp = p.target.mesh.position.clone(); tp.y += .4;
      const dir = tp.sub(p.mesh.position);
      const dist = dir.length();
      if (dist < .3) {
        this._onHit(p);
        this._removeProj(i);
        continue;
      }
      dir.normalize().multiplyScalar(Math.min(p.speed * dt, dist));
      p.mesh.position.add(dir);
    }
  }

  _onHit(p) {
    if (p.splash > 0) {
      const alive = this.enemies.alive();
      const center = p.target.mesh.position;
      for (const e of alive) {
        const dx = e.mesh.position.x - center.x;
        const dz = e.mesh.position.z - center.z;
        if (Math.sqrt(dx*dx + dz*dz) <= p.splash) {
          this.enemies.hit(e, p.damage);
        }
      }
    } else {
      this.enemies.hit(p.target, p.damage);
    }
    if (p.slow > 0) {
      this.enemies.applySlow(p.target, p.slow, p.slowDur);
    }
  }

  _removeProj(i) {
    const p = this.projectiles[i];
    this.group.remove(p.mesh);
    if (p.mesh.geometry) p.mesh.geometry.dispose();
    this.projectiles.splice(i, 1);
  }
}
