import * as THREE from 'three';

const _v = new THREE.Vector3();

export function updateCamera(camera, target, theta, phi, dist) {
  camera.position.set(
    target.x + dist * Math.cos(phi) * Math.sin(theta),
    target.y + dist * Math.sin(phi),
    target.z + dist * Math.cos(phi) * Math.cos(theta)
  );
  camera.lookAt(target.x, target.y + 0.5, target.z);
}

export function worldToScreen(x, y, z, camera) {
  _v.set(x, y, z);
  _v.project(camera);
  return {
    x: (0.5 + _v.x * 0.5) * window.innerWidth,
    y: (0.5 - _v.y * 0.5) * window.innerHeight,
  };
}
