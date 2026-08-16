import * as THREE from 'three';

export const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
document.body.appendChild(renderer.domElement);

export const scene = new THREE.Scene();
scene.background = new THREE.Color('#b8cfe0');
scene.fog = new THREE.Fog('#b8cfe0', 35, 65);

export const camera = new THREE.PerspectiveCamera(
  40, window.innerWidth / window.innerHeight, 0.1, 100
);

export const clock = new THREE.Clock();

export const materials = {
  snow:   new THREE.MeshStandardMaterial({ color: '#e8eef4', roughness: 0.85 }),
  wood:   new THREE.MeshStandardMaterial({ color: '#b07840', roughness: 0.7 }),
  woodD:  new THREE.MeshStandardMaterial({ color: '#8a5a2c', roughness: 0.7 }),
  rail:   new THREE.MeshStandardMaterial({ color: '#5a4a40', roughness: 0.5, metalness: 0.3 }),
  metal:  new THREE.MeshStandardMaterial({ color: '#8899a6', roughness: 0.4, metalness: 0.5 }),
  red:    new THREE.MeshStandardMaterial({ color: '#c04030', roughness: 0.6 }),
  green:  new THREE.MeshStandardMaterial({ color: '#4a8a50', roughness: 0.7 }),
  greenD: new THREE.MeshStandardMaterial({ color: '#366838', roughness: 0.7 }),
  cart:   new THREE.MeshStandardMaterial({ color: '#d09040', roughness: 0.5 }),
  gold:   new THREE.MeshStandardMaterial({ color: '#e8c040', roughness: 0.3, metalness: 0.6 }),
  fence:  new THREE.MeshStandardMaterial({ color: '#c8b89a', roughness: 0.8 }),
  blue:   new THREE.MeshStandardMaterial({ color: '#4488cc', roughness: 0.6 }),
  skin:   new THREE.MeshStandardMaterial({ color: '#f0c8a0', roughness: 0.7 }),
  stone:  new THREE.MeshStandardMaterial({ color: '#7a7a7a', roughness: 0.9 }),
  stoneL: new THREE.MeshStandardMaterial({ color: '#9a9a9a', roughness: 0.85 }),
  meat:   new THREE.MeshStandardMaterial({ color: '#cc5544', roughness: 0.6 }),
};

/* ---- lights ---- */
const amb = new THREE.AmbientLight('#c0d8f0', 0.6);
scene.add(amb);

export const sun = new THREE.DirectionalLight('#fff5e0', 1.1);
sun.position.set(8, 15, 6);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -18;
sun.shadow.camera.right = 18;
sun.shadow.camera.top = 18;
sun.shadow.camera.bottom = -18;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 50;
sun.shadow.bias = -0.002;
scene.add(sun);
scene.add(sun.target);

/* ---- ground ---- */
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(50, 50),
  materials.snow
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

/* ---- snow mounds ---- */
for (let i = 0; i < 18; i++) {
  const r = 1.2 + Math.random() * 2;
  const m = new THREE.Mesh(
    new THREE.SphereGeometry(r, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    materials.snow
  );
  m.position.set((Math.random() - 0.5) * 38, 0, (Math.random() - 0.5) * 38);
  m.scale.y = 0.25 + Math.random() * 0.2;
  m.receiveShadow = true;
  scene.add(m);
}

/* ---- trees ---- */
function makeTree(x, z, h) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.15, h * 0.3, 6), materials.wood
  );
  trunk.position.y = h * 0.15;
  trunk.castShadow = true;
  g.add(trunk);

  const layers = 3 + Math.floor(Math.random() * 2);
  for (let i = 0; i < layers; i++) {
    const t = i / layers;
    const r = (1 - t * 0.7) * h * 0.35;
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(r, h / layers * 1.1, 7),
      i % 2 === 0 ? materials.green : materials.greenD
    );
    cone.position.y = h * 0.3 + (h * 0.7) * (i + 0.5) / layers;
    cone.castShadow = true;
    cone.receiveShadow = true;
    g.add(cone);
  }
  for (let i = 0; i < layers; i++) {
    const t = i / layers;
    const r = (1 - t * 0.7) * h * 0.33;
    const cap = new THREE.Mesh(new THREE.ConeGeometry(r, 0.15, 7), materials.snow);
    cap.position.y = h * 0.3 + (h * 0.7) * (i + 1) / layers - 0.1;
    g.add(cap);
  }
  g.position.set(x, 0, z);
  scene.add(g);
}

const treePos = [
  [-10, -9], [-9, -11], [-12, -6], [-8, -12], [-13, -8],
  [9, -10], [11, -8], [10, -12], [13, -10],
  [-10, 10], [-12, 8], [-11, 12], [-9, 9],
  [10, 10], [9, 12], [12, 9], [13, 11],
  [-6, -14], [6, -14], [0, -15],
  [-6, 14], [6, 14], [0, 15],
  [-15, 0], [-15, 4], [-15, -4],
  [15, 0], [15, 4], [15, -4],
];
treePos.forEach(([x, z]) => makeTree(x, z, 2.5 + Math.random() * 1.5));

/* ---- snowfall particles ---- */
const snowCount = 500;
const snowGeo = new THREE.BufferGeometry();
const snowPositions = new Float32Array(snowCount * 3);
const snowVelocities = new Float32Array(snowCount);
for (let i = 0; i < snowCount; i++) {
  snowPositions[i * 3]     = (Math.random() - 0.5) * 40;
  snowPositions[i * 3 + 1] = Math.random() * 15;
  snowPositions[i * 3 + 2] = (Math.random() - 0.5) * 40;
  snowVelocities[i] = 0.5 + Math.random() * 1.5;
}
snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));
const snowMat = new THREE.PointsMaterial({
  color: '#ffffff', size: 0.08, transparent: true, opacity: 0.8,
});
const snowParticles = new THREE.Points(snowGeo, snowMat);
scene.add(snowParticles);

export function updateSnowfall(dt, center) {
  const pos = snowGeo.attributes.position.array;
  for (let i = 0; i < snowCount; i++) {
    pos[i * 3 + 1] -= snowVelocities[i] * dt;
    pos[i * 3] += Math.sin(performance.now() * 0.001 + i) * 0.003;
    if (pos[i * 3 + 1] < 0) {
      pos[i * 3 + 1] = 12 + Math.random() * 3;
      pos[i * 3]     = center.x + (Math.random() - 0.5) * 35;
      pos[i * 3 + 2] = center.z + (Math.random() - 0.5) * 35;
    }
  }
  snowGeo.attributes.position.needsUpdate = true;
}

/* ---- resize ---- */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
