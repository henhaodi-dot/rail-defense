import { renderer, scene, camera, materials, clock, sun, updateSnowfall } from './scene.js';
import { createPlayer, updatePlayer } from './player.js';
import { createJoystick } from './joystick.js';
import { createResources, updateResources, createSellStation, checkSellStation } from './resources.js';
import { createEconomy } from './economy.js';
import { createUI, updateHUD, showProgress, hideProgress, showFull, hideFull, showSellFeedback } from './ui.js';
import { updateCamera, worldToScreen } from './camera.js';

/* ---- init ---- */
const player = createPlayer(scene, materials);
const joystick = createJoystick();
const resources = createResources(scene, materials);
const sellStation = createSellStation(scene, materials);
const economy = createEconomy();
const ui = createUI();

const CAM_THETA = Math.PI / 4;
const CAM_PHI = Math.PI / 5;
const CAM_DIST = 15;

updateCamera(camera, player.mesh.position, CAM_THETA, CAM_PHI, CAM_DIST);

/* ---- service worker ---- */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

/* ---- joystick → world-space transform ---- */
const sinT = Math.sin(CAM_THETA);
const cosT = Math.cos(CAM_THETA);

/* ---- game loop ---- */
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1);

  // input
  const joy = joystick.getInput();
  const worldInput = {
    x:  joy.x * cosT + joy.z * sinT,
    z: -joy.x * sinT + joy.z * cosT,
  };

  // update
  updatePlayer(player, worldInput, dt);
  updateCamera(camera, player.mesh.position, CAM_THETA, CAM_PHI, CAM_DIST);

  // move shadow camera with player
  sun.position.set(
    player.mesh.position.x + 8, 15,
    player.mesh.position.z + 6
  );
  sun.target.position.copy(player.mesh.position);
  sun.target.updateMatrixWorld();

  // resources
  const collecting = updateResources(
    resources, player.mesh.position, economy, dt
  );

  // sell station
  const earned = checkSellStation(
    player.mesh.position, economy, sellStation, dt
  );

  // UI
  updateHUD(ui, economy);

  const head = worldToScreen(
    player.mesh.position.x,
    player.mesh.position.y + 1.5,
    player.mesh.position.z,
    camera
  );

  if (collecting) {
    showProgress(ui, collecting.progress, head.x, head.y);
    hideFull(ui);
  } else if (economy.isFull()) {
    hideProgress(ui);
    showFull(ui, head.x, head.y);
  } else {
    hideProgress(ui);
    hideFull(ui);
  }

  if (earned > 0) {
    const stationScreen = worldToScreen(
      sellStation.pos.x,
      sellStation.pos.y + 2.5,
      sellStation.pos.z,
      camera
    );
    showSellFeedback(ui, earned, stationScreen.x, stationScreen.y);
  }

  // snow
  updateSnowfall(dt, player.mesh.position);

  renderer.render(scene, camera);
}

animate();
