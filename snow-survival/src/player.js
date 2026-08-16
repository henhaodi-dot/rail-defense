import * as THREE from 'three';

export function createPlayer(scene, mat) {
  const group = new THREE.Group();

  // legs
  const legMat = new THREE.MeshStandardMaterial({ color: '#6a4a2a', roughness: 0.7 });
  const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.3, 6), legMat);
  leftLeg.position.set(-0.1, 0.15, 0);
  leftLeg.castShadow = true;
  group.add(leftLeg);
  const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.3, 6), legMat);
  rightLeg.position.set(0.1, 0.15, 0);
  rightLeg.castShadow = true;
  group.add(rightLeg);

  // body
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.55, 8), mat.blue);
  body.position.y = 0.58;
  body.castShadow = true;
  group.add(body);

  // arms
  const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.4, 6), mat.blue);
  leftArm.position.set(-0.28, 0.6, 0);
  leftArm.castShadow = true;
  group.add(leftArm);
  const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.4, 6), mat.blue);
  rightArm.position.set(0.28, 0.6, 0);
  rightArm.castShadow = true;
  group.add(rightArm);

  // head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), mat.skin);
  head.position.y = 1.05;
  head.castShadow = true;
  group.add(head);

  // hat (small snow cap)
  const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 0.1, 8), mat.blue);
  hat.position.y = 1.2;
  group.add(hat);

  group.position.set(0, 0, 2);
  scene.add(group);

  return {
    mesh: group,
    speed: 5,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    walkPhase: 0,
  };
}

export function updatePlayer(player, input, dt) {
  const moving = Math.abs(input.x) > 0.05 || Math.abs(input.z) > 0.05;

  if (moving) {
    player.mesh.position.x += input.x * player.speed * dt;
    player.mesh.position.z += input.z * player.speed * dt;

    player.mesh.position.x = Math.max(-22, Math.min(22, player.mesh.position.x));
    player.mesh.position.z = Math.max(-22, Math.min(22, player.mesh.position.z));

    player.mesh.rotation.y = Math.atan2(input.x, input.z);

    // walk animation
    player.walkPhase += dt * 10;
    const s = Math.sin(player.walkPhase) * 0.25;
    player.leftLeg.rotation.x = s;
    player.rightLeg.rotation.x = -s;
    player.leftArm.rotation.x = -s * 0.7;
    player.rightArm.rotation.x = s * 0.7;
  } else {
    player.leftLeg.rotation.x = 0;
    player.rightLeg.rotation.x = 0;
    player.leftArm.rotation.x = 0;
    player.rightArm.rotation.x = 0;
  }
}
