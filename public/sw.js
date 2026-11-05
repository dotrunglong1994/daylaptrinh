// Service worker: cho website chạy như ứng dụng và chơi được khi không có mạng.
// - Trang, game: lấy từ mạng trước (luôn mới nhất), mất mạng thì dùng bản đã lưu.
// - /_next/static (tên file có mã băm, không bao giờ đổi) và font Google: dùng bản đã lưu nếu có.
// - Khi website gửi "warm", tải sẵn mọi trang + game theo /offline.json (mỗi lần deploy một lần).
const CACHE = "bhv-offline";
const META = "/__bhv-offline-version";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (FONT_HOSTS.includes(url.hostname)) return e.respondWith(cacheFirst(req));
  if (url.origin !== location.origin) return; // Supabase… để trình duyệt tự lo
  if (url.pathname === "/sw.js" || url.pathname === "/offline.json") return;
  // Dữ liệu RSC khi chuyển trang trong website: mất mạng thì để lỗi, Next.js sẽ tải lại cả trang (lấy từ bộ nhớ)
  if (req.headers.get("RSC") || url.searchParams.has("_rsc")) return;
  if (url.pathname.startsWith("/_next/static/")) return e.respondWith(cacheFirst(req));
  e.respondWith(networkFirst(req));
});

async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === "opaque") cache.put(req, res.clone());
  return res;
}

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(req, { ignoreSearch: req.mode === "navigate" });
    if (hit) return hit;
    if (req.mode === "navigate") {
      const home = await cache.match("/");
      if (home) return home;
    }
    throw err;
  }
}

/* ---------- Tải sẵn để chơi khi không có mạng ---------- */
let warming = null;

self.addEventListener("message", (e) => {
  if (e.data !== "warm") return;
  warming ??= warm()
    .then((done) => done && broadcast({ type: "offline-ready" }))
    .catch(() => {})
    .finally(() => (warming = null));
  e.waitUntil(warming);
});

async function broadcast(msg) {
  for (const c of await self.clients.matchAll()) c.postMessage(msg);
}

/** Lấy các file mà trang HTML cần: /_next/static/… và file cạnh game (style.css, ../shared/kit.js…) */
function refsOf(html, base) {
  const out = new Set();
  for (const m of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    const u = new URL(m[1].replace(/&amp;/g, "&"), base);
    if (u.origin === location.origin && /\.(js|css|png|svg|ico|woff2?|webp|jpg)$/.test(u.pathname)) out.add(u.href);
  }
  // Mảnh JS Next.js nạp sau (không có thẻ <script>) nằm trong dữ liệu trang
  for (const m of html.matchAll(/\/_next\/static\/[^"'\\\s)]+\.(?:js|css)/g)) out.add(new URL(m[0], base).href);
  return out;
}

async function warm() {
  const list = await (await fetch("/offline.json", { cache: "no-store" })).json();
  const cache = await caches.open(CACHE);
  const old = await cache.match(META);
  if (old && (await old.text()) === list.version) return true;

  const needed = new Set();
  const save = async (href) => {
    const res = await fetch(href, { cache: "no-cache" });
    if (!res.ok) throw new Error(`${res.status} ${href}`);
    const copy = res.clone();
    await cache.put(href, res);
    return copy;
  };
  const pages = [...list.pages, ...list.games].map((p) => new URL(p, location.origin).href);
  // Tải từng nhóm nhỏ để không làm chậm máy của bé
  for (let i = 0; i < pages.length; i += 6) {
    await Promise.all(
      pages.slice(i, i + 6).map(async (href) => {
        const html = await (await save(href)).text();
        for (const ref of refsOf(html, href)) needed.add(ref);
      }),
    );
  }
  const files = [...needed];
  for (let i = 0; i < files.length; i += 8) {
    await Promise.all(files.slice(i, i + 8).map((f) => cache.match(f).then((hit) => hit || save(f))));
  }

  // Xóa mảnh JS của bản deploy cũ mà trang mới không dùng nữa
  for (const req of await cache.keys()) {
    const u = new URL(req.url);
    if (u.pathname.startsWith("/_next/static/") && !needed.has(u.href)) await cache.delete(req);
  }
  await cache.put(META, new Response(list.version));
  return true;
}
