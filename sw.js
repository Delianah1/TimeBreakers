/* =========================================================================
   SERVICE WORKER : rend le jeu installable et jouable hors ligne.
   StratÃƒÂ©gie Ã‚Â« rÃƒÂ©seau d'abord Ã‚Â» : en ligne on prend toujours la derniÃƒÂ¨re
   version (et on la range dans le cache) ; hors ligne on sert le cache.
   Changer VERSION vide l'ancien cache.
   ========================================================================= */
const VERSION = 'timebreakers-v33';
const FICHIERS = [
  './', 'index.html', 'style.css', 'manifest.webmanifest',
  'icones/icone-192.png', 'icones/icone-512.png', 'icones/icone-180.png', 'icones/icone-maskable-512.png',
  'polices/polices.css',
  'polices/fredoka-500-latin.woff2', 'polices/fredoka-500-latin-ext.woff2', 'polices/fredoka-600-latin.woff2', 'polices/fredoka-600-latin-ext.woff2',
  'polices/fredoka-700-latin.woff2', 'polices/fredoka-700-latin-ext.woff2', 'polices/lilitaone-400-latin.woff2', 'polices/lilitaone-400-latin-ext.woff2',
  'js/version.js', 'js/config.js', 'js/meta.js', 'js/battle.js', 'js/render.js', 'js/art.js',
  'js/art/jurassique.js', 'js/art/antiquite.js', 'js/art/medieval.js', 'js/art/renaissance.js', 'js/art/vapeur.js',
  'js/art/moderne.js', 'js/art/heros.js', 'js/art/postapo.js', 'js/art/futur.js', 'js/art/alien.js', 'js/art/assaut.js', 'js/art/magma.js',
  'js/musique.js', 'js/sons.js', 'js/effets.js', 'js/pouvoirs.js', 'js/champions.js', 'js/modes.js', 'js/ui.js', 'js/tuto.js', 'js/magma.js', 'js/hauts-faits.js', 'js/main.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(rep => {
      if (rep.ok) { const copie = rep.clone(); caches.open(VERSION).then(c => c.put(e.request, copie)); }
      return rep;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html')))
  );
});
