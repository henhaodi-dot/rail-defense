const CACHE = 'snow-v1';
const ASSETS = [
  './', './index.html',
  './src/main.js', './src/scene.js', './src/player.js',
  './src/joystick.js', './src/resources.js', './src/economy.js',
  './src/ui.js', './src/camera.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
