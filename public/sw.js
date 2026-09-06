const CACHE_NAME = "qr-vui-shell-v1";

const scopeUrl = new URL(self.registration.scope);
const shellUrl = new URL("./", scopeUrl).href;
const coreAssets = [
  shellUrl,
  new URL("manifest.webmanifest", scopeUrl).href,
  new URL("favicon.svg", scopeUrl).href,
  new URL("pwa-192.png", scopeUrl).href,
  new URL("pwa-512.png", scopeUrl).href,
];

const isCacheableResponse = (response) => response && response.ok && response.type !== "opaque";

async function cacheDocumentAssets(cache) {
  const response = await fetch(shellUrl, { cache: "reload" });
  if (!isCacheableResponse(response)) return;

  await cache.put(shellUrl, response.clone());
  const html = await response.text();
  const urls = new Set(coreAssets.slice(1));
  const attributePattern = /(?:src|href)=["']([^"']+)["']/g;

  for (const match of html.matchAll(attributePattern)) {
    try {
      const url = new URL(match[1], shellUrl);
      if (url.origin === scopeUrl.origin && url.pathname.startsWith(scopeUrl.pathname)) urls.add(url.href);
    } catch {
      // Ignore malformed or non-URL attributes in generated HTML.
    }
  }

  await Promise.allSettled([...urls].map(async (url) => {
    const assetResponse = await fetch(url, { cache: "reload" });
    if (isCacheableResponse(assetResponse)) await cache.put(url, assetResponse);
  }));
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cacheDocumentAssets(cache);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== scopeUrl.origin || !url.pathname.startsWith(scopeUrl.pathname)) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (isCacheableResponse(response)) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
          await cache.put(shellUrl, response.clone());
        }
        return response;
      } catch {
        return (await caches.match(request)) || (await caches.match(shellUrl)) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) {
      event.waitUntil((async () => {
        try {
          const fresh = await fetch(request);
          if (isCacheableResponse(fresh)) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, fresh);
          }
        } catch {
          // The cached response remains usable while offline.
        }
      })());
      return cached;
    }

    try {
      const response = await fetch(request);
      if (isCacheableResponse(response)) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    } catch {
      return Response.error();
    }
  })());
});
