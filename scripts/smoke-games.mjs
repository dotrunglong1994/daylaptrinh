// Kiểm thử nhanh mọi game trên trình duyệt thật: npm run test:games
//
// Mở từng game trong Chrome không giao diện (headless), vào màn 1 rồi để "bé ảo" bấm ngẫu nhiên các nút
// trong phần chơi cho tới khi thắng hoặc hết giờ. Game trí não: bấm "Bắt đầu" rồi bấm ngẫu nhiên một lúc.
// Báo LỖI khi trang có lỗi JavaScript hoặc console.error. Không thắng được trong thời gian cho phép
// (game cần kéo thả, cần suy nghĩ nhiều bước) chỉ là ghi chú, không tính lỗi.
//
// Không cần cài thêm gói: script tự phục vụ thư mục public/ và nói chuyện với Chrome qua giao thức CDP.
// Cần Chrome hoặc Edge trên máy; đặt biến CHROME_PATH nếu script không tự tìm được.
// Tùy chọn: --only=dong-ho,ban-bong-so   --seconds=20 (thời gian tối đa cho mỗi game)
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

if (typeof WebSocket === "undefined") {
  console.error("Node chưa có WebSocket. Dùng Node 22, hoặc chạy: node --experimental-websocket scripts/smoke-games.mjs");
  process.exit(1);
}

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const PUBLIC = join(ROOT, "public");
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")));
const SECONDS = Number(args.seconds || 15);
const ONLY = args.only ? args.only.split(",") : null;

/* ---------- Danh sách game (đọc từ src/lib) ---------- */
function gamesIn(file) {
  // Chỉ đọc phần danh sách game (bỏ qua danh sách đảo ở trên)
  const all = readFileSync(join(ROOT, file), "utf8");
  const src = all.slice(Math.max(0, all.search(/export const (GAMES|BRAIN_GAMES)\b/)));
  return [...src.matchAll(/id:\s*"([^"]+)"[\s\S]*?src:\s*"([^"]+)"/g)].map((m) => ({ id: m[1], src: m[2] }));
}
const kidGames = gamesIn("src/lib/games.ts").map((g) => ({ ...g, brain: false }));
const brainGames = gamesIn("src/lib/brain.ts").map((g) => ({ ...g, brain: true }));
const games = [...kidGames, ...brainGames].filter((g) => !ONLY || ONLY.includes(g.id));

/* ---------- Máy chủ tĩnh cho thư mục public/ ---------- */
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".json": "application/json", ".ico": "image/x-icon" };
const server = createServer((req, res) => {
  const path = normalize(join(PUBLIC, decodeURIComponent(new URL(req.url, "http://x").pathname)));
  if (!path.startsWith(PUBLIC + sep) || !existsSync(path) || statSync(path).isDirectory()) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { "content-type": TYPES[extname(path)] || "application/octet-stream" });
  res.end(readFileSync(path));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const BASE = `http://127.0.0.1:${server.address().port}`;

/* ---------- Mở Chrome ---------- */
function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, "Google\\Chrome\\Application\\chrome.exe"),
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/opt/pw-browsers/chromium",
  ];
  return candidates.find((p) => p && existsSync(p) && statSync(p).isFile());
}
const chromePath = findChrome();
if (!chromePath) {
  console.error("Không tìm thấy Chrome/Edge. Đặt biến CHROME_PATH tới file chrome.exe rồi chạy lại.");
  process.exit(1);
}
const profile = mkdtempSync(join(tmpdir(), "bhv-smoke-"));
const chrome = spawn(chromePath, [
  "--headless=new", "--no-sandbox", "--no-first-run", "--disable-gpu", "--mute-audio",
  "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows",
  "--remote-debugging-port=0", `--user-data-dir=${profile}`, "--window-size=420,900", "about:blank",
], { stdio: ["ignore", "ignore", "pipe"] });
const wsUrl = await new Promise((resolve, reject) => {
  let buf = "";
  chrome.stderr.on("data", (d) => {
    buf += d;
    const m = /DevTools listening on (ws:\/\/\S+)/.exec(buf);
    if (m) resolve(m[1]);
  });
  chrome.on("exit", () => reject(new Error(`Chrome thoát sớm:\n${buf}`)));
  setTimeout(() => reject(new Error("Chrome không mở được cổng gỡ lỗi sau 20 giây")), 20000);
});
const port = new URL(wsUrl).port;
const page = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === "page");

/* ---------- CDP tối giản ---------- */
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let seq = 0;
const pending = new Map();
const listeners = [];
ws.addEventListener("message", (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(msg.error.message));
    else resolve(msg.result);
  } else if (msg.method) {
    for (const fn of listeners) fn(msg);
  }
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++seq;
  pending.set(id, { resolve, reject });
  ws.send(JSON.stringify({ id, method, params }));
});
const evaluate = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  return r.result?.value;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let errors = [];
listeners.push((msg) => {
  if (msg.method === "Runtime.exceptionThrown") {
    const d = msg.params.exceptionDetails;
    errors.push(d.exception?.description?.split("\n")[0] || d.text);
  }
  if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") {
    errors.push(`console.error: ${msg.params.args.map((a) => a.value ?? a.description ?? "").join(" ")}`);
  }
});
await send("Runtime.enable");
await send("Page.enable");
await send("Page.bringToFront");
await send("Emulation.setFocusEmulationEnabled", { enabled: true });
// Không tải phông chữ từ mạng (máy có thể không có mạng); chặn để không phải chờ
await send("Network.enable");
await send("Network.setBlockedURLs", { urls: ["*fonts.googleapis.com*", "*fonts.gstatic.com*"] });

// "Bé ảo": mỗi lần gọi bấm một nút ngẫu nhiên còn bấm được trong phần chơi.
// Trả về 'win' (bảng thắng của kit.js, hoặc nút Chơi lại của game kiểu cũ), 'done' (game trí não hết lượt),
// 'click' hoặc 'idle' (không có gì để bấm, ví dụ đang chạy hiệu ứng).
const step = (brain) => `(() => {
  // Bảng thắng nằm ở position: fixed nên offsetParent luôn là null: xét display thay vì offsetParent
  const open = (el) => el && !el.classList.contains('hidden') && getComputedStyle(el).display !== 'none';
  const visible = (el) => el && el.offsetParent !== null && !el.classList.contains('hidden') && !el.disabled;
  if (${brain}) { if (open(document.querySelector('section#result'))) return 'done'; }
  else if (open(document.querySelector('#winModal')) || visible(document.querySelector('#againBtn'))) return 'win';
  const SKIP = ['homeBtn', 'soundBtn', 'voiceBtn', 'menuBtn', 'musicBtn', 'backBtn', 'quitBtn', 'againBtn', 'startBtn'];
  const scope = document.querySelector('#stage') || document.querySelector('#game') || document.body;
  const choices = [...scope.querySelectorAll('.choice')].filter(visible);
  const all = choices.length ? choices
    : [...scope.querySelectorAll('button, [data-i], [data-k], [data-d], .balloon')].filter((el) => visible(el) && !SKIP.includes(el.id));
  if (!all.length) return 'idle';
  const el = all[Math.floor(Math.random() * all.length)];
  // Bóng bay của Bắn Bóng Số nghe sự kiện pointerdown thay vì click
  if (el.classList.contains('balloon')) el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
  else el.click();
  return 'click';
})()`;

async function load(url) {
  const loaded = new Promise((r) => {
    const fn = (msg) => {
      if (msg.method === "Page.loadEventFired") {
        listeners.splice(listeners.indexOf(fn), 1);
        r();
      }
    };
    listeners.push(fn);
  });
  await send("Page.navigate", { url });
  await Promise.race([loaded, sleep(10000)]);
  await sleep(300);
}

/* ---------- Chạy ---------- */
console.log(`Kiểm thử ${games.length} game bằng ${chromePath.split(/[\\/]/).pop()}, tối đa ${SECONDS} giây mỗi game\n`);
const rows = [];
for (const g of games) {
  errors = [];
  const t0 = Date.now();
  let outcome = "";
  try {
    await load(BASE + g.src);
    if (g.brain) {
      const started = await evaluate(`(() => { const b = document.querySelector('#startBtn'); if (!b) return false; b.click(); return true; })()`);
      if (!started) throw new Error("không thấy nút Bắt đầu");
      await sleep(4000); // đếm ngược 3, 2, 1
      const until = Date.now() + Math.min(SECONDS, 10) * 1000;
      let clicks = 0;
      while (Date.now() < until && (await evaluate(step(true))) !== "done") { clicks++; await sleep(150); }
      outcome = `đã chơi (${clicks} lần bấm)`;
    } else {
      // Game dùng kit.js: bấm màn 1; game kiểu cũ: bấm nút Bắt đầu (cấp dễ nhất được chọn sẵn)
      const opened = await evaluate(`(() => {
        const b = document.querySelector('#levelGrid button:not(:disabled)') || document.querySelector('#startBtn');
        if (!b) return false; b.click(); return true; })()`);
      if (!opened) throw new Error("không thấy nút chọn màn 1 hay nút Bắt đầu");
      await sleep(400);
      const until = Date.now() + SECONDS * 1000;
      let state = "", clicks = 0;
      while (Date.now() < until) {
        state = await evaluate(step(false));
        if (state === "win") break;
        if (state === "click") clicks++;
        await sleep(state === "idle" ? 300 : 180);
      }
      outcome = state === "win" ? `thắng màn 1 (${clicks} lần bấm)` : `chưa thắng sau ${SECONDS} giây (${clicks} lần bấm)`;
    }
  } catch (e) {
    errors.push(e.message);
  }
  const ok = errors.length === 0;
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`${ok ? "✓" : "✗"} ${g.id.padEnd(22)} ${secs.padStart(5)}s  ${ok ? outcome : errors[0]}`);
  for (const e of errors.slice(1, 4)) console.log(`    ${e}`);
  rows.push({ g, ok });
}

ws.close();
chrome.kill();
server.close();
try { rmSync(profile, { recursive: true, force: true }); } catch {}

const failed = rows.filter((r) => !r.ok);
console.log(failed.length ? `\n${failed.length} game có lỗi: ${failed.map((r) => r.g.id).join(", ")}` : `\nCả ${rows.length} game chạy không lỗi.`);
process.exit(failed.length ? 1 : 0);
