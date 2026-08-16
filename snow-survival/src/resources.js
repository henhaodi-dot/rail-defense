import * as THREE from 'three';

const DEFS = [
  { type: 'ore',  x:  8, z: 10 },
  { type: 'ore',  x: -10, z: 6 },
  { type: 'wood', x: -8, z: -7 },
  { type: 'wood', x: 11, z: -5 },
  { type: 'meat', x:  5, z: -11 },
];

/* ---- resource models ---- */

function makeOre(mat) {
  const g = new THREE.Group();
  const sizes = [0.4, 0.35, 0.28, 0.22];
  const offsets = [[0, 0], [0.4, 0.1], [-0.3, 0.2], [0.1, -0.35]];
  for (let i = 0; i < sizes.length; i++) {
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(sizes[i], 0),
      i % 2 === 0 ? mat.stone : mat.stoneL
    );
    rock.position.set(offsets[i][0], sizes[i] * 0.45, offsets[i][1]);
    rock.rotation.set(i * 0.8, i * 1.2, i * 0.5);
    rock.castShadow = true;
    rock.receiveShadow = true;
    g.add(rock);
  }
  return g;
}

function makeWoodPile(mat) {
  const g = new THREE.Group();
  const stump = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.4, 0.45, 8), mat.wood
  );
  stump.position.y = 0.225;
  stump.castShadow = true;
  g.add(stump);
  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.34, 0.04, 8), mat.woodD
  );
  top.position.y = 0.45;
  g.add(top);
  for (let i = 0; i < 3; i++) {
    const log = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.1, 0.6, 6), mat.wood
    );
    const a = (i / 3) * Math.PI * 2 + 0.3;
    log.position.set(Math.cos(a) * 0.55, 0.1, Math.sin(a) * 0.55);
    log.rotation.z = Math.PI / 2;
    log.rotation.y = a;
    log.castShadow = true;
    g.add(log);
  }
  return g;
}

function makeMeatRack(mat) {
  const g = new THREE.Group();
  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.08, 1.4, 6), mat.wood
    );
    post.position.set(side * 0.45, 0.7, 0);
    post.castShadow = true;
    g.add(post);
  }
  const bar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 1.1, 6), mat.wood
  );
  bar.position.y = 1.3;
  bar.rotation.z = Math.PI / 2;
  bar.castShadow = true;
  g.add(bar);
  for (let i = -1; i <= 1; i++) {
    const piece = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 6, 4), mat.meat
    );
    piece.scale.y = 1.6;
    piece.position.set(i * 0.28, 0.85, 0);
    piece.castShadow = true;
    g.add(piece);
    const rope = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.3, 4), mat.woodD
    );
    rope.position.set(i * 0.28, 1.1, 0);
    g.add(rope);
  }
  return g;
}

/* ---- icon sprites ---- */

function makeIcon(emoji) {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d');
  ctx.font = '48px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, 32, 35);
  const tex = new THREE.CanvasTexture(c);
  const sp = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, transparent: true })
  );
  sp.scale.set(0.8, 0.8, 1);
  return sp;
}

const ICONS = { ore: '⛏️', wood: '🪵', meat: '🍖' };

/* ---- public ---- */

export function createResources(scene, mat) {
  const list = [];
  const makers = { ore: makeOre, wood: makeWoodPile, meat: makeMeatRack };

  for (const def of DEFS) {
    const mesh = makers[def.type](mat);
    mesh.position.set(def.x, 0, def.z);
    scene.add(mesh);

    const icon = makeIcon(ICONS[def.type]);
    icon.position.y = 2.2;
    mesh.add(icon);

    list.push({
      type: def.type,
      mesh,
      pos: new THREE.Vector3(def.x, 0, def.z),
      progress: 0,
      collectTime: 1.8,
      range: 1.8,
    });
  }
  return list;
}

export function updateResources(resources, playerPos, economy, dt) {
  let collecting = null;

  for (const r of resources) {
    const d = playerPos.distanceTo(r.pos);

    if (d < r.range && !economy.isFull()) {
      r.progress += dt / r.collectTime;
      if (r.progress >= 1) {
        economy.addItem(r.type);
        r.progress = 0;
      }
      collecting = { progress: r.progress, type: r.type };
    } else {
      r.progress = Math.max(0, r.progress - dt * 2);
    }
  }
  return collecting;
}

/* ---- sell station ---- */

export function createSellStation(scene, mat) {
  const g = new THREE.Group();

  // counter base
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.9, 0.8), mat.wood
  );
  base.position.y = 0.45;
  base.castShadow = true;
  base.receiveShadow = true;
  g.add(base);

  // counter top (darker)
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.06, 0.9), mat.woodD
  );
  top.position.y = 0.93;
  top.castShadow = true;
  g.add(top);

  // four corner posts holding awning
  for (const [dx, dz] of [[-0.75, -0.35], [0.75, -0.35], [0.75, 0.35], [-0.75, 0.35]]) {
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.05, 1.0, 6), mat.wood
    );
    post.position.set(dx, 1.4, dz);
    post.castShadow = true;
    g.add(post);
  }

  // awning (red roof)
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(2.0, 0.06, 1.1), mat.red
  );
  roof.position.y = 1.9;
  roof.castShadow = true;
  g.add(roof);

  // gold coins on counter
  for (let i = 0; i < 3; i++) {
    const coin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 0.03, 12), mat.gold
    );
    coin.position.set(-0.3 + i * 0.3, 1.0, 0);
    g.add(coin);
  }

  // sell sign
  const signIcon = makeIcon('💰');
  signIcon.position.y = 2.4;
  signIcon.scale.set(1.2, 1.2, 1);
  g.add(signIcon);

  g.position.set(0, 0, 0);
  scene.add(g);

  return {
    mesh: g,
    pos: new THREE.Vector3(0, 0, 0),
    range: 2.0,
    cooldown: 0,
  };
}

export function checkSellStation(playerPos, economy, station, dt) {
  station.cooldown = Math.max(0, station.cooldown - dt);
  if (station.cooldown > 0) return 0;

  const d = playerPos.distanceTo(station.pos);
  if (d < station.range && economy.total() > 0) {
    const earned = economy.sellAll();
    station.cooldown = 0.5;
    return earned;
  }
  return 0;
}
