// リリース時に本体ファイルを変更した場合は、この識別子も更新する。
const CACHE_NAME = 'kagoshima-trip-pwa-v1.1.1-20261012-1';
const CACHE_PREFIX = 'kagoshima-trip-pwa-';
const APP_SHELL = [
  './', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'
];
const appRoot = new URL('./', self.registration.scope);
const shellUrls = new Set(APP_SHELL.map(path => new URL(path, appRoot).href));
const appPage = new URL('./index.html', appRoot).href;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  // 待機中の新版は勝手に有効化しない。画面の「更新する」操作を待つ。
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  // 外部URL・同一オリジンの別アプリ・未登録ファイルは対象外。
  if (url.origin !== self.location.origin || !url.pathname.startsWith(appRoot.pathname)) return;
  if (request.mode === 'navigate') {
    if (url.href !== appRoot.href && url.href !== appPage) return;
    event.respondWith(caches.open(CACHE_NAME).then(cache => cache.match(appPage)));
    return;
  }
  if (!shellUrls.has(url.href)) return;
  event.respondWith(caches.open(CACHE_NAME).then(cache => cache.match(request)));
});
