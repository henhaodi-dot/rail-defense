import * as THREE from 'three';
import {createRenderer,createScene,createCamera,createLights,
        createGround,createTrees,createSnowfall,materials} from './scene.js';
import {Grid} from './grid.js';
import {InputManager} from './input.js';
import {TrackManager} from './track.js';
import {BuildingManager,TYPES} from './buildings.js';
import {CartManager} from './cart.js';
import {EnemyManager} from './enemies.js';
import {CombatManager} from './combat.js';
import {WaveManager} from './waves.js';
import {UIManager} from './ui.js';

let state, grid, track, bldg, carts, enemies, combat, waves, input, ui;
let renderer, scene, camera, ground, updateSnow;
let lumberT = 0, mineT = 0;

function init() {
  state = { gold:200, wood:100, mode:'IDLE', baseHP:100, maxHP:100, over:false, selBuilding:null };

  if (!renderer) {
    renderer = createRenderer();
    document.getElementById('canvas-container').appendChild(renderer.domElement);
  }

  if (scene) {
    while (scene.children.length) scene.remove(scene.children[0]);
  }
  scene = createScene();
  camera = createCamera();
  createLights(scene);
  ground = createGround(scene);
  createTrees(scene);
  updateSnow = createSnowfall(scene);

  grid    = new Grid();
  grid.createVisual(scene, materials);
  track   = new TrackManager(scene, grid, materials);
  bldg    = new BuildingManager(scene, grid, materials);
  carts   = new CartManager(scene, materials, track, bldg);
  enemies = new EnemyManager(scene, camera);
  combat  = new CombatManager(scene, bldg, enemies);
  waves   = new WaveManager(enemies);
  if (!input) {
    input = new InputManager(renderer, camera, ground);
  } else {
    input.camera = camera;
    input.ground = ground;
    input.theta = Math.PI/4;
    input.phi = Math.PI/4.5;
    input.dist = 22;
    input.target.set(0,0,0);
    input.updateCamera();
  }
  if (!ui) {
    ui = new UIManager();
  } else {
    ui.hideOverlay();
    ui.hideUpgrade();
    ui.deselect();
  }

  const BASE_R = 6, BASE_C = 6;
  bldg.place('BASE', BASE_R, BASE_C);
  const baseWorld = grid.toWorld(BASE_R, BASE_C);
  enemies.setBase(baseWorld.x, baseWorld.z);

  carts.onDeliver = (c) => {
    const mine = c.mine;
    const bonus = mine.level >= 3 ? 20 : mine.level >= 2 ? 15 : 10;
    state.gold += bonus;
    ui.msg(`+${bonus} 💰`, 1200);
  };

  enemies.onHitBase = (dmg) => {
    if (state.over) return;
    state.baseHP = Math.max(0, state.baseHP - dmg);
    if (state.baseHP <= 0) {
      state.over = true;
      ui.gameOver(waves.wave);
    }
  };

  enemies.onDied = (e) => { state.gold += e.reward; };

  waves.onWaveDone = (w) => { ui.msg(`Wave ${w} cleared! +50 💰`, 2500); state.gold += 50; };
  waves.onAllDone  = () => { ui.victory(); state.over = true; };

  ui.onStartWave = () => waves.start();
  ui.onRestart = () => { lumberT = 0; mineT = 0; init(); };

  ui.onUpgrade = () => {
    const b = state.selBuilding;
    if (!b) return;
    const cost = bldg.upgradeCost(b);
    if (!cost) { ui.msg('Max level!'); return; }
    if (state.gold < cost.cost) { ui.msg('Not enough gold!'); return; }
    if (state.wood < (cost.wood || 0)) { ui.msg('Not enough wood!'); return; }
    state.gold -= cost.cost;
    state.wood -= (cost.wood || 0);
    bldg.upgrade(b);
    ui.msg(`Upgraded to Lv${b.level}!`);
    const next = bldg.upgradeCost(b);
    if (next) {
      ui.showUpgrade(b, next);
    } else {
      ui.hideUpgrade();
      state.selBuilding = null;
    }
  };

  ui.onBuildSelect = (type) => {
    ui.hideUpgrade();
    state.selBuilding = null;
    if (type === 'CANCEL') {
      state.mode = 'IDLE'; grid.hide(); ui.setMode(''); return;
    }
    state.mode = 'BUILD_' + type;
    grid.show();
    const labels = {
      BUILD_TRACK:   'Tap cells to lay track',
      BUILD_MINING:  'Tap to place Mine',
      BUILD_STORAGE: 'Tap to place Storage',
      BUILD_TOWER:   'Tap to place Tower',
      BUILD_CANNON:  'Tap to place Cannon',
      BUILD_ICE:     'Tap to place Ice Tower',
      BUILD_LUMBER:  'Tap to place Lumber Mill',
    };
    ui.setMode(labels[state.mode] || '');
  };

  input.onCellTap = (wx, wz) => {
    if (state.over) return;
    const cell = grid.toGrid(wx, wz);
    if (!cell) return;
    const {row, col} = cell;

    if (state.mode === 'IDLE') {
      const existing = bldg.at(row, col);
      if (existing && existing.type !== 'BASE') {
        const cost = bldg.upgradeCost(existing);
        if (cost) {
          state.selBuilding = existing;
          ui.showUpgrade(existing, cost);
        } else {
          ui.msg(`${existing.type} Lv${existing.level} (Max)`);
        }
      }
      return;
    }

    if (state.mode === 'BUILD_TRACK') {
      if (state.gold < 5) { ui.msg('Not enough gold!'); return; }
      if (track.add(row, col)) { state.gold -= 5; }
      else { ui.msg("Can't place here"); }
      return;
    }

    const typeMap = {
      BUILD_MINING:'MINING', BUILD_STORAGE:'STORAGE',
      BUILD_TOWER:'TOWER', BUILD_CANNON:'CANNON',
      BUILD_ICE:'ICE', BUILD_LUMBER:'LUMBER',
    };
    const bt = typeMap[state.mode];
    if (!bt) return;
    const info = TYPES[bt];
    if (state.gold < info.cost) { ui.msg('Not enough gold!'); return; }
    if (state.wood < (info.wood || 0)) { ui.msg('Not enough wood!'); return; }
    if (bldg.place(bt, row, col)) {
      state.gold -= info.cost;
      state.wood -= (info.wood || 0);
      ui.msg(`${info.name} placed`);
      state.mode = 'IDLE'; grid.hide(); ui.deselect();
    } else { ui.msg("Can't place here"); }
  };

  lumberT = 0;
  mineT = 0;

  input.updateCamera();
  renderer.render(scene, camera);
}

function tickLumber(dt) {
  const mills = bldg.byType('LUMBER');
  if (!mills.length) return;
  lumberT += dt;
  if (lumberT >= 5) {
    lumberT = 0;
    let amt = 0;
    for (const m of mills) {
      amt += m.level >= 3 ? 18 : m.level >= 2 ? 10 : 5;
    }
    state.wood += amt;
    ui.msg(`+${amt} 🪵`, 1200);
  }
}

function tickMines(dt) {
  const mines = bldg.byType('MINING');
  const passive = mines.filter(m => m.level >= 2);
  if (!passive.length) return;
  mineT += dt;
  if (mineT >= 5) {
    mineT = 0;
    let amt = 0;
    for (const m of passive) {
      amt += m.level >= 3 ? 6 : 3;
    }
    state.gold += amt;
    ui.msg(`+${amt} 💰 (mines)`, 1200);
  }
}

init();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const fpsEl = document.getElementById('fps');
let frames = 0, lastFps = performance.now();
const clock = new THREE.Clock();

(function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.5);

  if (!state.over) {
    carts.update(dt);
    enemies.update(dt);
    combat.update(dt);
    waves.update(dt);
    tickLumber(dt);
    tickMines(dt);
  }
  updateSnow(dt);

  ui.setRes(state.gold, state.wood);
  ui.setBaseHP(state.baseHP, state.maxHP);
  ui.setWave(waves.wave, waves.total, waves.active, waves.buildTimer);

  renderer.render(scene, camera);

  frames++;
  const now = performance.now();
  if (now - lastFps >= 500) {
    fpsEl.textContent = Math.round(frames / ((now - lastFps) / 1000)) + ' fps';
    frames = 0; lastFps = now;
  }
})();
