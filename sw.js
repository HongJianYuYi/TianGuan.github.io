/* 天官太乙式 · Service Worker
 * 缓存三轨：
 *   导航请求（HTML） → network-first，离线回退缓存
 *   带 ?v= 的资源    → cache-first（query 即版本指纹，与站点 ?v= 强刷机制相容）
 *   其余（字体/图标）→ stale-while-revalidate
 * 升版约定：CACHE 名、下方 CORE 清单、index.html 的 ?v= 三处同改。
 */
'use strict';

var CACHE = 'tgty-1.19.1';
var CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.svg',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
  './css/style.css?v=1.19.1',
  './js/data/data.js?v=1.19.1',
  './js/data/regions.js?v=1.19.1',
  './js/data/stars.js?v=1.19.1',
  './js/astro.js?v=1.19.1',
  './js/calendar.js?v=1.19.1',
  './js/chart.js?v=1.19.1',
  './js/export.js?v=1.19.1',
  './js/app.js?v=1.19.1',
  './fonts/fz-jiaguwen-xing.woff2'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k.indexOf('tgty-') === 0 && k !== CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // 导航：network-first
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function (res) {
        var cp = res.clone();
        caches.open(CACHE).then(function (c) { c.put('./index.html', cp); });
        return res;
      }).catch(function () { return caches.match('./index.html'); })
    );
    return;
  }

  // 带 ?v= 的资源：cache-first
  if (url.search.indexOf('v=') !== -1) {
    e.respondWith(
      caches.match(req).then(function (hit) {
        return hit || fetch(req).then(function (res) {
          var cp = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, cp); });
          return res;
        });
      })
    );
    return;
  }

  // 其余：stale-while-revalidate
  e.respondWith(
    caches.match(req).then(function (hit) {
      var net = fetch(req).then(function (res) {
        var cp = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, cp); });
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    })
  );
});
