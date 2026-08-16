import * as THREE from 'three';

export const TYPES = {
  MINING:  { name:'Mine',    cost:50, wood:0,  icon:'⛏️',  desc:'Produces gold' },
  STORAGE: { name:'Storage', cost:30, wood:0,  icon:'📦', desc:'Stores resources' },
  TOWER:   { name:'Tower',   cost:40, wood:0,  icon:'🏰', desc:'Arrow tower' },
  CANNON:  { name:'Cannon',  cost:80, wood:30, icon:'💣', desc:'Splash damage' },
  ICE:     { name:'Ice',     cost:60, wood:20, icon:'❄️', desc:'Slows enemies' },
  LUMBER:  { name:'Lumber',  cost:60, wood:0,  icon:'🪓', desc:'Produces wood' },
  BASE:    { name:'Base',    cost:0,  wood:0,  icon:'🏠', desc:'Defend this!' },
};

export const TOWER_BASE = {
  TOWER:  { dmg:15, range:7,   cd:1.4 },
  CANNON: { dmg:25, range:6,   cd:2.5, splash:2.0 },
  ICE:    { dmg:5,  range:6.5, cd:2.0, slow:0.5, slowDur:3 },
};

export const UPGRADES = {
  TOWER:  [{cost:60, wood:0,  dmg:22, range:8,  cd:1.2},
           {cost:100,wood:0,  dmg:30, range:10, cd:1.0}],
  CANNON: [{cost:80, wood:20, dmg:35, range:7,  cd:2.2, splash:2.5},
           {cost:130,wood:40, dmg:50, range:8,  cd:2.0, splash:3.0}],
  ICE:    [{cost:70, wood:15, dmg:8,  range:7,  cd:1.8, slow:0.6, slowDur:3},
           {cost:110,wood:30, dmg:12, range:8,  cd:1.5, slow:0.7, slowDur:4}],
  MINING: [{cost:40, wood:0,  passive:3}, {cost:80, wood:0,  passive:6}],
  LUMBER: [{cost:50, wood:30, rate:10},   {cost:80, wood:60, rate:18}],
  STORAGE:[{cost:30, wood:0},             {cost:60, wood:0}],
};

export class BuildingManager {
  constructor(scene, grid, mats) {
    this.scene = scene;
    this.grid = grid;
    this.mats = mats;
    this.buildings = [];
    this.group = new THREE.Group();
    scene.add(this.group);
  }

  canPlace(r, c) {
    return this.grid.ok(r,c) && this.grid.get(r,c).type === 0;
  }

  place(type, r, c) {
    if (!this.canPlace(r,c)) return null;
    const {x,z} = this.grid.toWorld(r,c);
    const mesh = this['_'+type.toLowerCase()](x, z);
    this.group.add(mesh);
    const b = { type, row:r, col:c, mesh, level:1 };
    if (TOWER_BASE[type]) Object.assign(b, TOWER_BASE[type]);
    this.buildings.push(b);
    this.grid.set(r,c,2,b);
    return b;
  }

  at(r, c) {
    const cell = this.grid.get(r,c);
    return (cell && cell.type === 2) ? cell.data : null;
  }

  upgrade(b) {
    if (!UPGRADES[b.type]) return false;
    if (b.level >= 3) return false;
    const upg = UPGRADES[b.type][b.level - 1];
    if (!upg) return false;
    b.level++;
    if (TOWER_BASE[b.type]) {
      if (upg.dmg) b.dmg = upg.dmg;
      if (upg.range) b.range = upg.range;
      if (upg.cd) b.cd = upg.cd;
      if (upg.splash) b.splash = upg.splash;
      if (upg.slow) b.slow = upg.slow;
      if (upg.slowDur) b.slowDur = upg.slowDur;
    }
    this._addLevelRing(b);
    const s = 1 + (b.level - 1) * 0.08;
    b.mesh.scale.set(s, s, s);
    return true;
  }

  upgradeCost(b) {
    if (!UPGRADES[b.type] || b.level >= 3) return null;
    return UPGRADES[b.type][b.level - 1];
  }

  byType(type) { return this.buildings.filter(b=>b.type===type); }

  isTower(type) { return type === 'TOWER' || type === 'CANNON' || type === 'ICE'; }

  _addLevelRing(b) {
    const old = b.mesh.getObjectByName('lvlRing');
    if (old) b.mesh.remove(old);
    const color = b.level === 2 ? '#4488ff' : '#ffcc00';
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.6, 0.72, 16),
      new THREE.MeshStandardMaterial({color, emissive:color, emissiveIntensity:0.3, side:THREE.DoubleSide})
    );
    ring.rotation.x = -Math.PI/2;
    ring.position.y = 0.04;
    ring.name = 'lvlRing';
    b.mesh.add(ring);
  }

  _mining(x, z) {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.4,.2,1.4), this.mats.stone);
    base.position.y=.1; base.castShadow=true; base.receiveShadow=true; g.add(base);
    const body = new THREE.Mesh(new THREE.BoxGeometry(.9,.8,.9), this.mats.wood);
    body.position.y=.6; body.castShadow=true; g.add(body);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(.7,.4,4), this.mats.red);
    roof.position.y=1.2; roof.rotation.y=Math.PI/4; roof.castShadow=true; g.add(roof);
    const axle = new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.6,4), this.mats.woodD);
    axle.position.set(0,.55,.5); axle.rotation.z=Math.PI/6; g.add(axle);
    g.position.set(x,0,z);
    return g;
  }

  _storage(x, z) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.6,1.2,1.4), this.mats.red);
    body.position.y=.6; body.castShadow=true; body.receiveShadow=true; g.add(body);
    for (const s of [-1,1]) {
      const rf = new THREE.Mesh(new THREE.BoxGeometry(1,.06,1.5), this.mats.woodD);
      rf.position.set(s*.3,1.3,0); rf.rotation.z=s*-.35; rf.castShadow=true; g.add(rf);
    }
    const door = new THREE.Mesh(new THREE.PlaneGeometry(.5,.8), this.mats.woodD);
    door.position.set(0,.4,.71); g.add(door);
    const snow = new THREE.Mesh(new THREE.BoxGeometry(.4,.08,1.3), this.mats.snow);
    snow.position.y=1.38; g.add(snow);
    g.position.set(x,0,z);
    return g;
  }

  _tower(x, z) {
    const g = new THREE.Group(); const h=2.5;
    for (const [dx,dz] of [[-.35,-.35],[.35,-.35],[.35,.35],[-.35,.35]]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(.07,.09,h,6), this.mats.wood);
      p.position.set(dx,h/2,dz); p.castShadow=true; g.add(p);
    }
    const plat = new THREE.Mesh(new THREE.BoxGeometry(1,.08,1), this.mats.wood);
    plat.position.y=h*.7; plat.castShadow=true; plat.receiveShadow=true; g.add(plat);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(.7,.5,4), this.mats.red);
    roof.position.y=h*.7+.5; roof.rotation.y=Math.PI/4; roof.castShadow=true; g.add(roof);
    for (const dy of [h*.25, h*.5])
      for (const s of [0, Math.PI/2]) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(.06,.06,.7), this.mats.woodD);
        b.position.y=dy; b.rotation.y=s; g.add(b);
      }
    g.position.set(x,0,z);
    return g;
  }

  _cannon(x, z) {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(.6,.7,.4,8), this.mats.stone);
    base.position.y=.2; base.castShadow=true; base.receiveShadow=true; g.add(base);
    const turret = new THREE.Mesh(new THREE.CylinderGeometry(.35,.4,.6,8), this.mats.metal);
    turret.position.y=.7; turret.castShadow=true; g.add(turret);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.1,.12,.9,6), this.mats.metal);
    barrel.position.set(0,.8,.4); barrel.rotation.x=Math.PI/2.5; barrel.castShadow=true; g.add(barrel);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(.14,.04,6,8), this.mats.woodD);
    rim.position.set(0,.82,.8); rim.rotation.x=Math.PI/2; g.add(rim);
    const plat = new THREE.Mesh(new THREE.BoxGeometry(1.2,.06,1.2), this.mats.wood);
    plat.position.y=.42; plat.castShadow=true; g.add(plat);
    g.position.set(x,0,z);
    return g;
  }

  _ice(x, z) {
    const g = new THREE.Group();
    const iceMat = new THREE.MeshStandardMaterial({color:'#88ccff', roughness:0.2, metalness:0.1, transparent:true, opacity:0.85});
    const base = new THREE.Mesh(new THREE.CylinderGeometry(.5,.6,.3,6), this.mats.stone);
    base.position.y=.15; base.castShadow=true; g.add(base);
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(.45,0), iceMat);
    crystal.position.y=1.0; crystal.castShadow=true; g.add(crystal);
    const shard1 = new THREE.Mesh(new THREE.OctahedronGeometry(.2,0), iceMat);
    shard1.position.set(.35,.6,.2); shard1.rotation.z=.4; g.add(shard1);
    const shard2 = new THREE.Mesh(new THREE.OctahedronGeometry(.18,0), iceMat);
    shard2.position.set(-.3,.55,-.25); shard2.rotation.z=-.3; g.add(shard2);
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(.08,.12,.7,5), this.mats.stone);
    pillar.position.y=.65; pillar.castShadow=true; g.add(pillar);
    const glow = new THREE.PointLight('#66aaff',.3,5);
    glow.position.y=1; g.add(glow);
    g.position.set(x,0,z);
    return g;
  }

  _lumber(x, z) {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.4,.15,1.4), this.mats.woodD);
    base.position.y=.075; base.castShadow=true; g.add(base);
    for (let i=0;i<3;i++){
      const log = new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,1,6), this.mats.wood);
      log.position.set(-.15+i*.15,.27,-.2); log.rotation.z=Math.PI/2; log.castShadow=true; g.add(log);
    }
    for (let i=0;i<2;i++){
      const log = new THREE.Mesh(new THREE.CylinderGeometry(.11,.11,1,6), this.mats.wood);
      log.position.set(-.07+i*.15,.48,-.2); log.rotation.z=Math.PI/2; log.castShadow=true; g.add(log);
    }
    const rf = new THREE.Mesh(new THREE.BoxGeometry(1.2,.06,.8), this.mats.red);
    rf.position.set(0,1,.3); rf.rotation.z=.15; rf.castShadow=true; g.add(rf);
    for (const dx of [-.5,.5]){
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(.04,.05,1,5), this.mats.wood);
      pole.position.set(dx,.5,.3); pole.castShadow=true; g.add(pole);
    }
    g.position.set(x,0,z);
    return g;
  }

  _base(x, z) {
    const g = new THREE.Group();
    const found = new THREE.Mesh(new THREE.BoxGeometry(2.4,.3,2.4), this.mats.stone);
    found.position.y=.15; found.castShadow=true; found.receiveShadow=true; g.add(found);
    const keep = new THREE.Mesh(new THREE.BoxGeometry(1.5,1.8,1.5), this.mats.wood);
    keep.position.y=1.2; keep.castShadow=true; g.add(keep);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.2,.8,4), this.mats.red);
    roof.position.y=2.5; roof.rotation.y=Math.PI/4; roof.castShadow=true; g.add(roof);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(1,.12,4), this.mats.snow);
    cap.position.y=2.65; cap.rotation.y=Math.PI/4; g.add(cap);
    for (const [dx,dz] of [[-.85,-.85],[.85,-.85],[.85,.85],[-.85,.85]]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(.08,.1,1.2,6), this.mats.woodD);
      post.position.set(dx,.9,dz); post.castShadow=true; g.add(post);
    }
    for (const [dx,dz,ry] of [[-1.1,0,0],[1.1,0,0],[0,-1.1,Math.PI/2],[0,1.1,Math.PI/2]]) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(.18,.7,1.8), this.mats.stone);
      wall.position.set(dx,.65,dz); wall.rotation.y=ry; wall.castShadow=true; g.add(wall);
    }
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.9,4), this.mats.woodD);
    pole.position.y=3.05; g.add(pole);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(.35,.22),
      new THREE.MeshStandardMaterial({color:'#c04030',side:THREE.DoubleSide}));
    flag.position.set(.18,3.35,0); g.add(flag);
    const light = new THREE.PointLight('#ffaa44',.4,8);
    light.position.y=2; g.add(light);
    g.position.set(x,0,z);
    return g;
  }
}
