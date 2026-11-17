/* 꽃단장 서비스워커 — 인터넷이 없어도 앱 화면이 열리게 해 줍니다.
   · 화면(index.html): 인터넷이 되면 항상 최신본을 받아오고(네트워크 우선), 안 되면 저장해 둔 사본을 보여 줌
   · 아이콘 등: 저장해 둔 사본을 먼저 사용
   · 기록 데이터는 여기서 다루지 않음 (폰 저장공간 + 가족 공유 클라우드에 그대로) */
var CACHE = 'kkotdanjang-v1';
var CORE = ['./', './index.html', './manifest.webmanifest', './favicon.ico',
  './apple-touch-icon.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(CORE); }).then(function(){ return self.skipWaiting(); }));
});

self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  var url = new URL(req.url);
  if(url.origin !== self.location.origin) return;   /* Firebase 등 바깥 주소는 건드리지 않음 */

  var isPage = req.mode === 'navigate' || /\/(index\.html)?$/.test(url.pathname);
  if(isPage){
    e.respondWith(
      fetch(req).then(function(res){
        if(res && res.ok){
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put('./index.html', copy); });
        }
        return res;
      }).catch(function(){
        return caches.match('./index.html').then(function(r){ return r || caches.match('./'); });
      })
    );
    return;
  }
  e.respondWith(
    caches.match(req, {ignoreSearch:true}).then(function(hit){
      return hit || fetch(req).then(function(res){
        if(res && res.ok){ var copy = res.clone(); caches.open(CACHE).then(function(c){ c.put(req, copy); }); }
        return res;
      });
    })
  );
});
