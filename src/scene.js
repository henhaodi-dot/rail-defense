import * as THREE from 'three';

export const materials = {
  snow:  new THREE.MeshStandardMaterial({color:'#e8eef4', roughness:0.85}),
  wood:  new THREE.MeshStandardMaterial({color:'#b07840', roughness:0.7}),
  woodD: new THREE.MeshStandardMaterial({color:'#8a5a2c', roughness:0.7}),
  rail:  new THREE.MeshStandardMaterial({color:'#5a4a40', roughness:0.5, metalness:0.3}),
  metal: new THREE.MeshStandardMaterial({color:'#8899a6', roughness:0.4, metalness:0.5}),
  red:   new THREE.MeshStandardMaterial({color:'#c04030', roughness:0.6}),
  green: new THREE.MeshStandardMaterial({color:'#4a8a50', roughness:0.7}),
  greenD:new THREE.MeshStandardMaterial({color:'#366838', roughness:0.7}),
  cart:  new THREE.MeshStandardMaterial({color:'#d09040', roughness:0.5}),
  gold:  new THREE.MeshStandardMaterial({color:'#e8c040', roughness:0.3, metalness:0.6}),
  fence: new THREE.MeshStandardMaterial({color:'#c8b89a', roughness:0.8}),
  stone: new THREE.MeshStandardMaterial({color:'#8a8a80', roughness:0.8}),
  highlight: new THREE.MeshStandardMaterial({color:'#40a0ff', roughness:0.5, transparent:true, opacity:0.35}),
};

export function createRenderer() {
  const r = new THREE.WebGLRenderer({antialias:true, alpha:false});
  r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  r.setSize(window.innerWidth, window.innerHeight);
  r.shadowMap.enabled = true;
  r.shadowMap.type = THREE.PCFSoftShadowMap;
  r.outputEncoding = THREE.sRGBEncoding;
  return r;
}

export function createScene() {
  const s = new THREE.Scene();
  s.background = new THREE.Color('#b8cfe0');
  s.fog = new THREE.Fog('#b8cfe0', 35, 65);
  return s;
}

export function createCamera() {
  return new THREE.PerspectiveCamera(40, window.innerWidth/window.innerHeight, 0.1, 100);
}

export function createLights(scene) {
  scene.add(new THREE.AmbientLight('#c0d8f0', 0.6));
  const sun = new THREE.DirectionalLight('#fff5e0', 1.1);
  sun.position.set(8, 15, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, {left:-18, right:18, top:18, bottom:-18, near:1, far:45});
  sun.shadow.bias = -0.002;
  scene.add(sun);
}

export function createGround(scene) {
  const g = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), materials.snow);
  g.rotation.x = -Math.PI/2;
  g.receiveShadow = true;
  g.name = 'ground';
  scene.add(g);
  for (let i = 0; i < 14; i++) {
    const r = 1.2 + Math.random()*2;
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(r, 10, 6, 0, Math.PI*2, 0, Math.PI/2),
      materials.snow
    );
    m.position.set((Math.random()-.5)*40, 0, (Math.random()-.5)*40);
    m.scale.y = 0.25 + Math.random()*0.2;
    m.receiveShadow = true;
    scene.add(m);
  }
  return g;
}

function makeTree(scene, x, z, h) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.12,.15,h*.3,6), materials.wood);
  trunk.position.y = h*.15; trunk.castShadow = true; g.add(trunk);
  const layers = 3 + Math.floor(Math.random()*2);
  for (let i = 0; i < layers; i++) {
    const t = i/layers;
    const r = (1-t*0.7)*h*0.35;
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(r, h/layers*1.1, 7),
      i%2===0 ? materials.green : materials.greenD
    );
    cone.position.y = h*0.3 + (h*0.7)*(i+0.5)/layers;
    cone.castShadow = true; cone.receiveShadow = true;
    g.add(cone);
  }
  for (let i = 0; i < layers; i++) {
    const t = i/layers;
    const r = (1-t*0.7)*h*0.33;
    const cap = new THREE.Mesh(new THREE.ConeGeometry(r, 0.15, 7), materials.snow);
    cap.position.y = h*0.3 + (h*0.7)*(i+1)/layers - 0.1;
    g.add(cap);
  }
  g.position.set(x, 0, z);
  scene.add(g);
}

export function createTrees(scene) {
  const P = [
    [-15,-11],[-14,-14],[-16,-7],[-13,-15],[-17,-9],
    [14,-12],[16,-8],[15,-14],[17,-11],
    [-14,12],[-16,9],[-15,14],[-13,11],
    [15,12],[14,14],[16,10],[17,13],
    [-9,-15],[9,-15],[0,-17],
    [-9,15],[9,15],[0,17],
  ];
  P.forEach(([x,z]) => makeTree(scene, x, z, 2.5+Math.random()*1.5));
}

export function createSnowfall(scene) {
  const N = 500;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(N*3);
  const vel = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    pos[i*3]   = (Math.random()-.5)*40;
    pos[i*3+1] = Math.random()*15;
    pos[i*3+2] = (Math.random()-.5)*40;
    vel[i] = 0.5 + Math.random()*1.5;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({color:'#ffffff', size:0.08, transparent:true, opacity:0.8});
  scene.add(new THREE.Points(geo, mat));

  return function updateSnow(dt) {
    const a = geo.attributes.position.array;
    for (let i = 0; i < N; i++) {
      a[i*3+1] -= vel[i]*dt;
      a[i*3]   += Math.sin(performance.now()*0.001+i)*0.003;
      if (a[i*3+1] < 0) {
        a[i*3+1] = 12+Math.random()*3;
        a[i*3]   = (Math.random()-.5)*40;
        a[i*3+2] = (Math.random()-.5)*40;
      }
    }
    geo.attributes.position.needsUpdate = true;
  };
}
