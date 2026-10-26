// Kiểm tra dữ liệu màn chơi của các game lập trình: npm run check:levels
// Đọc đoạn code giữa "// LEVELS-START" và "// LEVELS-END" trong game.js (đoạn này không dùng DOM).
import { readFileSync } from "node:fs";

function loadSection(file, names) {
  const src = readFileSync(new URL(`../public/games/${file}`, import.meta.url), "utf8");
  const start = src.indexOf("// LEVELS-START");
  const end = src.indexOf("// LEVELS-END");
  if (start < 0 || end < 0) throw new Error(`${file}: thiếu đánh dấu LEVELS-START/END`);
  return new Function(`${src.slice(start, end)}\nreturn { ${names.join(", ")} };`)();
}

let failures = 0;

/* ---------- Bắt Bọ ---------- */
{
  console.log("Bắt Bọ");
  const { LEVELS, DIR_ORDER, MAX_REPEAT, parseMap, simulate } = loadSection("bat-bo/game.js", [
    "LEVELS", "DIR_ORDER", "MAX_REPEAT", "parseMap", "simulate",
  ]);
  const variants = DIR_ORDER.flatMap((d) => Array.from({ length: MAX_REPEAT }, (_, i) => [d, i + 1]));

  // Số lệnh ít nhất phải sửa để tới kho báu (thử 0, 1, 2, 3 lệnh)
  function minEdits(level, program) {
    const solved = (p) => simulate(level, p).result === "goal";
    const search = (p, from, left) => {
      if (solved(p)) return true;
      if (left === 0) return false;
      for (let i = from; i < p.length; i++) {
        for (const v of variants) {
          if (v[0] === p[i][0] && v[1] === p[i][1]) continue;
          const next = p.map((b, j) => (j === i ? v : b));
          if (search(next, i + 1, left - 1)) return true;
        }
      }
      return false;
    };
    for (let k = 0; k <= 3; k++) if (search(program, 0, k)) return k;
    return Infinity;
  }

  LEVELS.forEach((def, i) => {
    const level = parseMap(def.map);
    const fixed = simulate(level, def.fixed).result;
    const buggy = simulate(level, def.buggy).result;
    const min = minEdits(level, def.buggy);
    const ok = fixed === "goal" && buggy !== "goal" && min === def.bugs && def.fixed.length === def.buggy.length;
    console.log(`  ${ok ? "✓" : "✗"} Màn ${i + 1}: fixed=${fixed}, buggy=${buggy}, sửa ít nhất ${min} lệnh (khai báo ${def.bugs})`);
    if (!ok) failures++;
  });
}

/* ---------- Đèn Giao Thông ---------- */
{
  console.log("Đèn Giao Thông");
  const { LEVELS, expected, matches } = loadSection("den-giao-thong/game.js", ["LEVELS", "expected", "matches"]);

  const permutations = (arr) =>
    arr.length <= 1 ? [arr] : arr.flatMap((x, i) => permutations([...arr.slice(0, i), ...arr.slice(i + 1)]).map((p) => [x, ...p]));
  const assignments = (n, actions) =>
    n === 0 ? [[]] : assignments(n - 1, actions).flatMap((rest) => actions.map((a) => [a, ...rest]));
  const passes = (order, acts, scenes) =>
    scenes.every((scene) => {
      const idx = order.findIndex((c) => matches(c, scene));
      return idx >= 0 && expected(scene).includes(acts[idx]);
    });
  const solvable = (order, level) => assignments(order.length, level.actions).some((acts) => passes(order, acts, level.scenes));

  LEVELS.forEach((level, i) => {
    const movable = level.rules.filter((c) => c !== "else");
    const tail = level.rules.includes("else") ? ["else"] : [];
    const orders = level.order ? permutations(movable).map((p) => [...p, ...tail]) : [level.rules];
    const ok = orders.some((order) => solvable(order, level));
    const needsReorder = level.order && !solvable(level.rules, level);
    console.log(`  ${ok ? "✓" : "✗"} Màn ${i + 1}: ${ok ? "giải được" : "KHÔNG giải được"}${needsReorder ? " (phải đổi thứ tự luật)" : ""}`);
    if (!ok) failures++;
  });
}

/* ---------- Họa Sĩ Rùa ---------- */
{
  console.log("Họa Sĩ Rùa");
  const { LEVELS, MAX_LOOP, trace, drawingOf } = loadSection("hoa-si-rua/game.js", ["LEVELS", "MAX_LOOP", "trace", "drawingOf"]);
  LEVELS.forEach((level, i) => {
    const segments = drawingOf(trace(level.solution, level.loop ?? 1)).size;
    const turnsOk = level.solution.every(([op, v]) => op === "fd" || level.turns.includes(v));
    const loopOk = !level.loop || (level.loop >= 2 && level.loop <= MAX_LOOP);
    const ok = segments > 0 && level.solution.length <= level.slots && turnsOk && loopOk;
    console.log(`  ${ok ? "✓" : "✗"} Màn ${i + 1} (${level.name}): ${segments} đoạn, lời giải ${level.solution.length}/${level.slots} lệnh${level.loop ? `, lặp ${level.loop} lần` : ""}`);
    if (!ok) failures++;
  });
}

/* ---------- Cân Thăng Bằng (sinh đề ngẫu nhiên) ---------- */
{
  console.log("Cân Thăng Bằng");
  const { LEVELS, makeTask, findOptions } = loadSection("can-thang-bang/game.js", ["LEVELS", "makeTask", "findOptions"]);
  const sum = (a) => a.reduce((s, v) => s + v, 0);
  for (const id of Object.keys(LEVELS)) {
    const L = LEVELS[id];
    const problems = [];
    for (let n = 0; n < 3000; n++) {
      const t = makeTask(Number(id));
      if (t.type === "balance") {
        if (sum(t.left) > L.max || t.left.some((v) => v < 1)) problems.push(JSON.stringify(t));
        continue;
      }
      const opts = findOptions(t);
      const balanced = t.k * t.x + sum(t.left) === sum(t.right);
      const optsOk = opts.length === 4 && new Set(opts).size === 4 && opts.filter((v) => v === t.x).length === 1 && opts.every((v) => v > 0);
      if (!balanced || !optsOk || t.x < 1 || sum(t.right) > L.max || [...t.left, ...t.right].some((v) => v < 1)) problems.push(JSON.stringify(t));
    }
    console.log(`  ${problems.length ? "✗" : "✓"} Mức ${id}: 3000 đề ngẫu nhiên, ${problems.length} đề lỗi`);
    if (problems.length) {
      failures++;
      console.log(`    ví dụ: ${problems[0]}`);
    }
  }
}

/* ---------- Thám Tử Hình Học ---------- */
{
  console.log("Thám Tử Hình Học");
  const { LEVELS, SHAPES, COLORS, parseItems, matches, props } = loadSection("tham-tu-hinh-hoc/game.js", [
    "LEVELS", "SHAPES", "COLORS", "parseItems", "matches", "props",
  ]);
  // Hình vuông cũng là hình chữ nhật/hình thoi đặc biệt, nên manh mối gọi tên
  // "hình chữ nhật" hay "hình thoi" không được đặt cạnh hình vuông.
  const AMBIGUOUS = { rect: ["square"], rhombus: ["square"], triangle: ["rtriangle"] };
  // Tính chất hình phải đúng với tên gọi
  const EXPECT = {
    circle: [0, 0, false], triangle: [3, 0, true], rtriangle: [3, 1, false], square: [4, 4, true],
    rect: [4, 4, false], rhombus: [4, 0, true], pentagon: [5, 0, true], hexagon: [6, 0, true],
  };
  for (const [type, [sides, right, equal]] of Object.entries(EXPECT)) {
    const p = props(type);
    if (p.sides !== sides || p.right !== right || p.equal !== equal) {
      console.log(`  ✗ ${type}: ${JSON.stringify(p)}`);
      failures++;
    }
  }
  LEVELS.forEach((level, i) => {
    const notes = level.rounds.map((round) => {
      const items = parseItems(round.items);
      const hit = items.filter((it) => matches(round.want, it)).length;
      const bad = items.filter((it) => !SHAPES[it.type] || !COLORS[it.color]);
      const clash = (AMBIGUOUS[round.want.shape] || []).filter((t) => items.some((it) => it.type === t));
      const ok = hit >= 1 && items.length - hit >= 2 && !bad.length && !clash.length;
      if (!ok) failures++;
      return `${ok ? "" : "✗"}${hit}/${items.length}${clash.length ? ` (lẫn ${clash})` : ""}${bad.length ? " (hình/màu sai)" : ""}`;
    });
    console.log(`  ${notes.some((n) => n.startsWith("✗")) ? "✗" : "✓"} Vụ ${i + 1} (${level.name}): hình đúng ${notes.join(", ")}`);
  });
}

/* ---------- Xây Cầu ---------- */
{
  console.log("Xây Cầu");
  const { LEVELS, parseLen } = loadSection("xay-cau/game.js", ["LEVELS", "parseLen"]);
  LEVELS.forEach((level, i) => {
    const gap = parseLen(level.gap);
    const planks = level.planks.map(parseLen);
    // Số ván ít nhất để ghép vừa khít (mỗi loại dùng nhiều lần)
    const best = Array(gap + 1).fill(Infinity);
    best[0] = 0;
    for (let n = 1; n <= gap; n++) for (const p of planks) if (p <= n) best[n] = Math.min(best[n], best[n - p] + 1);
    const ok = best[gap] <= 16 && planks.every((p) => p < gap) && (!level.ruler || gap <= 20);
    console.log(`  ${ok ? "✓" : "✗"} Màn ${i + 1}: khe ${gap} cm, ${best[gap] === Infinity ? "KHÔNG ghép được" : `ít nhất ${best[gap]} tấm ván`}`);
    if (!ok) failures++;
  });
}

/* ---------- Đầu Bếp Nhí ---------- */
{
  console.log("Đầu Bếp Nhí");
  const { LEVELS, cardsOf, checkPlan } = loadSection("dau-bep-nhi/game.js", ["LEVELS", "cardsOf", "checkPlan"]);
  const permutations = (arr) =>
    arr.length <= 1 ? [arr] : arr.flatMap((x, i) => permutations([...arr.slice(0, i), ...arr.slice(i + 1)]).map((p) => [x, ...p]));
  LEVELS.forEach((level, i) => {
    const ids = level.steps.map((s) => s[0]);
    const unique = new Set(ids).size === ids.length;
    const depsOk = level.steps.every(([, , , after = []], k) => after.every((d) => ids.slice(0, k).includes(d)));
    const extras = cardsOf(level).filter((c) => c.extra).map((c) => c.id);
    const extraFails = extras.every((x) => !checkPlan(level, [...ids.slice(0, -1), x]).ok);
    const valid = permutations(ids).filter((p) => checkPlan(level, p).ok).length;
    const ok = unique && depsOk && extraFails && checkPlan(level, ids).ok && valid < permutations(ids).length;
    console.log(`  ${ok ? "✓" : "✗"} Món ${i + 1} (${level.dish[1]}): ${ids.length} bước, ${extras.length} thẻ thừa, ${valid} thứ tự đúng`);
    if (!ok) failures++;
  });
}

if (failures) {
  console.log(`\n${failures} lỗi`);
  process.exit(1);
}
console.log("\nTất cả màn chơi đều hợp lệ.");
