import * as THREE from 'three';

const TYPES = {
  WOLF: { hp:40, speed:3.2, damage:8, atkRate:1, reward:10 },
  BEAR: { hp:120, speed:1.6, damage:20, atkRate:0.5, reward:25 },
};

export class EnemyManager {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.enemies = [];
    this.group = new THREE.Group();
    scene.add(this.group);
    this.basePos = new THREE.Vector3();
    this.onHitBase = null;
    this.onDied = null;
  }

  setBase(x, z) { this.basePos.set(x, 0, z); }

  spawn(type, x, z) {
    const d = TYPES[type];
    const mesh = type === 'BEAR' ? this._bear() : this._wolf();
    mesh.position.set(x, 0, z);
    this.group.add(mesh);
    const hpBar = this._hpBar(type === 'BEAR' ? 1.6 : 1.2);
    mesh.add(hpBar);
    this.enemies.push({
      type, mesh, hpBar,
      hp: d.hp, maxHp: d.hp, speed: d.speed, baseSpeed: d.speed,
      damage: d.damage, atkRate: d.atkRate, reward: d.reward,
      atkTimer: 0, dying: false, deathT: 0,
      slowTimer: 0,
    });
  }

  update(dt) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.dying) {
        e.deathT += dt;
        const s = Math.max(0, 1 - e.deathT * 2.5);
        e.mesh.scale.set(s, s, s);
        e.mesh.position.y = -e.deathT * 0.3;
        if (e.deathT > 0.5) {
          this.group.remove(e.mesh);
          this.enemies.splice(i, 1);
        }
        continue;
      }
      if (e.slowTimer > 0) {
        e.slowTimer -= dt;
        if (e.slowTimer <= 0) e.speed = e.baseSpeed;
      }
      const dx = this.basePos.x - e.mesh.position.x;
      const dz = this.basePos.z - e.mesh.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 1.8) {
        e.atkTimer += dt;
        if (e.atkTimer >= 1 / e.atkRate) {
          e.atkTimer = 0;
          if (this.onHitBase) this.onHitBase(e.damage);
        }
      } else {
        const step = e.speed * dt;
        e.mesh.position.x += (dx / dist) * step;
        e.mesh.position.z += (dz / dist) * step;
        e.mesh.lookAt(this.basePos.x, 0, this.basePos.z);
        e.mesh.position.y = Math.sin(performance.now() * 0.006 * e.speed) * 0.05;
      }
      this._updateHP(e);
    }
  }

  hit(enemy, dmg) {
    enemy.hp -= dmg;
    if (enemy.hp <= 0 && !enemy.dying) {
      enemy.dying = true;
      if (this.onDied) this.onDied(enemy);
    }
  }

  applySlow(enemy, factor, dur) {
    enemy.speed = enemy.baseSpeed * (1 - factor);
    enemy.slowTimer = dur;
  }

  alive() { return this.enemies.filter(e => !e.dying); }

  _wolf() {
    const g = new THREE.Group();
    const sc = 1.4;
    const m = new THREE.MeshStandardMaterial({color:'#6a6a6a', roughness:.7});
    const body = new THREE.Mesh(new THREE.BoxGeometry(.4*sc,.32*sc,.75*sc), m);
    body.position.y = .32*sc; body.castShadow = true; g.add(body);
    const head = new THREE.Mesh(new THREE.BoxGeometry(.24*sc,.24*sc,.28*sc), m);
    head.position.set(0,.42*sc,.42*sc); head.castShadow = true; g.add(head);
    const snout = new THREE.Mesh(new THREE.BoxGeometry(.14*sc,.1*sc,.14*sc),
      new THREE.MeshStandardMaterial({color:'#aaa',roughness:.7}));
    snout.position.set(0,.36*sc,.56*sc); g.add(snout);
    for (const dx of [-.09*sc,.09*sc]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(.05*sc,.11*sc,4), m);
      ear.position.set(dx,.57*sc,.38*sc); g.add(ear);
    }
    for (const [dx,dz] of [[-.11,-.22],[.11,-.22],[-.11,.22],[.11,.22]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(.04*sc,.04*sc,.28*sc,5), m);
      leg.position.set(dx*sc,.14*sc,dz*sc); g.add(leg);
    }
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(.03*sc,.02*sc,.22*sc,4), m);
    tail.position.set(0,.38*sc,-.42*sc); tail.rotation.x = -.5; g.add(tail);
    return g;
  }

  _bear() {
    const g = new THREE.Group();
    const sc = 1.4;
    const m = new THREE.MeshStandardMaterial({color:'#e8e0d8', roughness:.8});
    const body = new THREE.Mesh(new THREE.BoxGeometry(.65*sc,.55*sc,.9*sc), m);
    body.position.y = .48*sc; body.castShadow = true; g.add(body);
    const head = new THREE.Mesh(new THREE.BoxGeometry(.42*sc,.38*sc,.38*sc), m);
    head.position.set(0,.65*sc,.55*sc); head.castShadow = true; g.add(head);
    const snout = new THREE.Mesh(new THREE.BoxGeometry(.18*sc,.14*sc,.14*sc),
      new THREE.MeshStandardMaterial({color:'#c0b8b0',roughness:.7}));
    snout.position.set(0,.58*sc,.73*sc); g.add(snout);
    for (const dx of [-.16*sc,.16*sc]) {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(.07*sc,5,4), m);
      ear.position.set(dx,.87*sc,.5*sc); g.add(ear);
    }
    const eye = new THREE.MeshStandardMaterial({color:'#222'});
    for (const dx of [-.09*sc,.09*sc]) {
      const e = new THREE.Mesh(new THREE.SphereGeometry(.025*sc,4,4), eye);
      e.position.set(dx,.7*sc,.74*sc); g.add(e);
    }
    for (const [dx,dz] of [[-.2,-.28],[.2,-.28],[-.2,.28],[.2,.28]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(.08*sc,.07*sc,.38*sc,6), m);
      leg.position.set(dx*sc,.19*sc,dz*sc); leg.castShadow = true; g.add(leg);
    }
    return g;
  }

  _hpBar(yOff) {
    const g = new THREE.Group();
    const bg = new THREE.Mesh(
      new THREE.PlaneGeometry(.7,.09),
      new THREE.MeshBasicMaterial({color:'#400000',transparent:true,opacity:.6,side:THREE.DoubleSide})
    );
    g.add(bg);
    const fg = new THREE.Mesh(
      new THREE.PlaneGeometry(.68,.07),
      new THREE.MeshBasicMaterial({color:'#40c040',side:THREE.DoubleSide})
    );
    fg.name = 'fill'; g.add(fg);
    g.position.y = yOff;
    return g;
  }

  _updateHP(e) {
    const fill = e.hpBar.children.find(c => c.name === 'fill');
    if (!fill) return;
    const pct = Math.max(0, e.hp / e.maxHp);
    fill.scale.x = pct;
    fill.material.color.setHex(pct > .5 ? 0x40c040 : pct > .25 ? 0xc0c040 : 0xc04040);
    e.hpBar.lookAt(this.camera.position);
  }
}
