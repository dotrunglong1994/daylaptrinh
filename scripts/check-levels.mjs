// Kiểm tra dữ liệu màn chơi của các game: npm run check:levels
// Đọc đoạn code giữa "// LEVELS-START" và "// LEVELS-END" trong game.js (đoạn này không dùng DOM).
import { readFileSync, readdirSync } from "node:fs";

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

/* ---------- Dùng chung cho các game mới ---------- */
const report = (ok, text) => {
  console.log(`  ${ok ? "✓" : "✗"} ${text}`);
  if (!ok) failures++;
};
// 4 đáp án khác nhau và có đáp án đúng
const optionsOk = (opts, ans) => opts.length === 4 && new Set(opts.map(String)).size === 4 && opts.filter((o) => o === ans).length === 1;
// Bộ sinh số giả ngẫu nhiên có hạt giống, để lần chạy nào cũng kiểm cùng một bộ đề
function seeded(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

/* ---------- Đồng Hồ Thần Kỳ ---------- */
{
  console.log("Đồng Hồ Thần Kỳ");
  const { LEVELS, parseTime, answerOf, readOptions } = loadSection("dong-ho/game.js", ["LEVELS", "parseTime", "answerOf", "readOptions"]);
  LEVELS.forEach((L, i) => {
    const notes = L.rounds.map((r) => {
      const t = answerOf(r);
      if (r.type !== "after") parseTime(r.time);
      // Kim phút chỉ nhảy theo bước của màn nên đáp án phải nằm đúng bước
      const onStep = (t % 60) % Math.min(L.step, 60) === 0 && (r.type !== "after" || parseTime(r.from) % Math.min(L.step, 60) === 0);
      const opts = r.type === "read" ? readOptions(r, L) : null;
      return onStep && (!opts || optionsOk(opts, t));
    });
    report(notes.every(Boolean), `Màn ${i + 1} (${L.name}): ${L.rounds.length} câu, bước ${L.step} phút`);
  });
}

/* ---------- Thị Trấn Sự Kiện ---------- */
{
  console.log("Thị Trấn Sự Kiện");
  const { LEVELS, goalMet } = loadSection("thi-tran-su-kien/game.js", ["LEVELS", "goalMet"]);
  LEVELS.forEach((L, i) => {
    const sol = L.solution;
    const inPalette = sol.every((s) => L.actors.includes(s.actor) && L.events.includes(s.event) && s.actions.every((a) => L.actions.includes(a)) && s.actions.length <= L.actionSlots);
    // Kịch bản có sẵn (khóa) phải khớp lời giải
    const locksOk = (L.scripts || []).every((s, k) => (!s.actor || s.actor === sol[k].actor) && (!s.actions || s.actions.every((a, j) => a === sol[k].actions[j])));
    const empty = Array.from({ length: L.slots }, (_, k) => ({ ...(L.scripts?.[k] || {}), actions: L.scripts?.[k]?.actions || [] }));
    const solved = L.goals.every((g) => goalMet(sol, g));
    const notFree = !L.goals.every((g) => goalMet(empty, g));
    report(solved && notFree && inPalette && locksOk && sol.length <= L.slots, `Màn ${i + 1}: ${L.goals.length} yêu cầu, lời giải ${sol.length}/${L.slots} kịch bản`);
  });
}

/* ---------- Rô-bốt Nhà Kho ---------- */
{
  console.log("Rô-bốt Nhà Kho");
  const { LEVELS, run, answerOf, predictOptions, reached } = loadSection("robot-nha-kho/game.js", ["LEVELS", "run", "answerOf", "predictOptions", "reached"]);
  // Số lệnh ít nhất để đạt đích (mỗi thẻ dùng nhiều lần)
  function minLines(r) {
    let frontier = [{ ...r.start }];
    for (let depth = 0; depth <= 6; depth++) {
      if (frontier.some((v) => reached(v, r.target))) return depth;
      const next = new Map();
      for (const v of frontier) for (const c of r.cards) {
        const out = run([c], v).vars;
        next.set(JSON.stringify(out), out);
      }
      frontier = [...next.values()];
    }
    return Infinity;
  }
  LEVELS.forEach((L, i) => {
    const notes = L.rounds.map((r) => {
      if (r.type === "predict") {
        const ok = optionsOk(predictOptions(r), answerOf(r));
        if (!ok) failures++;
        return `${ok ? "" : "✗"}đoán=${answerOf(r)}`;
      }
      const min = minLines(r);
      const ok = min >= 1 && min <= r.max;
      if (!ok) failures++;
      return `${ok ? "" : "✗"}ghép ≥${min}/${r.max}`;
    });
    console.log(`  ${notes.some((n) => n.startsWith("✗")) ? "✗" : "✓"} Màn ${i + 1} (${L.name}): ${notes.join(", ")}`);
  });
}

/* ---------- Tàu Hỏa Số (sinh đề ngẫu nhiên) ---------- */
{
  console.log("Tàu Hỏa Số");
  const { LEVELS, ROUNDS_PER_LEVEL, makeRound, readNumber, roundOptions, roundTo } = loadSection("tau-hoa-so/game.js", [
    "LEVELS", "ROUNDS_PER_LEVEL", "makeRound", "readNumber", "roundOptions", "roundTo",
  ]);
  const READ = {
    15: "mười lăm", 21: "hai mươi mốt", 24: "hai mươi tư", 105: "một trăm linh năm", 110: "một trăm mười",
    1005: "một nghìn không trăm linh năm", 2050: "hai nghìn không trăm năm mươi", 45021: "bốn mươi lăm nghìn không trăm hai mươi mốt",
  };
  const readBad = Object.entries(READ).filter(([n, t]) => readNumber(Number(n)) !== t);
  report(!readBad.length, `Đọc số: ${Object.keys(READ).length} số mẫu${readBad.length ? `, sai ${readBad.map(([n]) => n)}` : ""}`);
  const rand = seeded(7);
  LEVELS.forEach((L, i) => {
    const problems = [];
    for (let n = 0; n < 2000; n++) {
      const r = makeRound(i, n % ROUNDS_PER_LEVEL, rand);
      const inRange = (v) => v >= L.min && v <= L.max;
      let ok = true;
      if (r.kind === "build") ok = inRange(r.n) && r.n < 10 * Math.max(...L.places);
      if (r.kind === "compare") ok = inRange(r.a) && inRange(r.b);
      if (r.kind === "order") ok = r.nums.length === 4 && new Set(r.nums).size === 4 && r.nums.every(inRange);
      // Ga để chọn phải là bội của hàng làm tròn, không được trùng chính số đề cho
      if (r.kind === "round") ok = r.n % r.to !== 0 && optionsOk(roundOptions(r), roundTo(r.n, r.to)) && !roundOptions(r).includes(r.n);
      if (!ok) problems.push(JSON.stringify(r));
    }
    report(!problems.length, `Màn ${i + 1} (${L.name}): 2000 đề, ${problems.length} đề lỗi${problems.length ? ` (vd ${problems[0]})` : ""}`);
  });
}

/* ---------- Nông Trại Biểu Đồ ---------- */
{
  console.log("Nông Trại Biểu Đồ");
  const { LEVELS, ANIMALS, answerOf, questionOptions } = loadSection("nong-trai-bieu-do/game.js", ["LEVELS", "ANIMALS", "answerOf", "questionOptions"]);
  LEVELS.forEach((L, i) => {
    const counts = Object.values(L.counts);
    const animalsOk = Object.keys(L.counts).every((k) => ANIMALS[k]);
    const scaleOk = counts.every((c) => c % L.scale === 0 && c > 0);
    // Bé phải tự đếm ở màn không vẽ sẵn: tối đa 30 con, mỗi loại tối đa 30
    const fieldOk = L.read || counts.reduce((a, b) => a + b, 0) <= 30;
    const qOk = L.questions.every((q) => {
      const ans = answerOf(L, q);
      if (q.q === "most" || q.q === "least") return counts.filter((c) => c === L.counts[ans]).length === 1;
      return Number.isInteger(ans) && ans > 0 && optionsOk(questionOptions(L, q), ans);
    });
    report(animalsOk && scaleOk && fieldOk && qOk, `Màn ${i + 1}: biểu đồ ${L.chart}, ${counts.length} loại, ${L.questions.length} câu hỏi`);
  });
}

/* ---------- Thợ Dệt Hoa Văn ---------- */
{
  console.log("Thợ Dệt Hoa Văn");
  const { LEVELS, MAX_LOOP, COLORS, slotsOf, weave, sameRows } = loadSection("tho-det-hoa-van/game.js", ["LEVELS", "MAX_LOOP", "COLORS", "slotsOf", "weave", "sameRows"]);
  LEVELS.forEach((L, i) => {
    const slots = slotsOf(L);
    const valid = L.solution.length === slots.length && L.solution.every((v, k) =>
      slots[k].kind === "color" ? L.palette.includes(v) && COLORS.includes(v) : Number.isInteger(v) && v >= 1 && v <= MAX_LOOP);
    const ok = valid && sameRows(weave(L, L.solution), L.target);
    report(ok, `Màn ${i + 1} (${L.name}): ${slots.length} ô trống, mẫu ${L.target.join("/")}`);
  });
}

/* ---------- Bếp Cân Đong ---------- */
{
  console.log("Bếp Cân Đong");
  const { LEVELS, parseAmt, quizOptions } = loadSection("bep-can-dong/game.js", ["LEVELS", "parseAmt", "quizOptions"]);
  LEVELS.forEach((L, i) => {
    const notes = L.steps.map((s) => {
      const amt = parseAmt(s.amount);
      if (s.tool === "quiz") return optionsOk(quizOptions(s), amt);
      const scoops = s.scoops.map(parseAmt);
      const reach = Array(amt + 1).fill(false);
      reach[0] = true;
      for (let n = 1; n <= amt; n++) reach[n] = scoops.some((x) => x <= n && reach[n - x]);
      const tick = parseAmt(s.tick);
      // Màn giấu số: lượng cần đong phải rơi đúng vào một vạch để bé đọc được
      return reach[amt] && amt <= parseAmt(s.max) && parseAmt(s.max) % tick === 0 && (!s.hide || amt % (tick / 2) === 0);
    });
    report(notes.every(Boolean), `Món ${i + 1} (${L.dish[1]}): ${L.steps.length} bước`);
  });
}

/* ---------- Khu Vườn Diện Tích ---------- */
{
  console.log("Khu Vườn Diện Tích");
  const { LEVELS, GRID_W, GRID_H, answerOf, numberOptions, drawOk } = loadSection("khu-vuon-dien-tich/game.js", [
    "LEVELS", "GRID_W", "GRID_H", "answerOf", "numberOptions", "drawOk",
  ]);
  LEVELS.forEach((L, i) => {
    const notes = L.rounds.map((r) => {
      if (r.type === "draw") {
        let n = 0;
        for (let w = 1; w <= GRID_W; w++) for (let h = 1; h <= GRID_H; h++) if (drawOk(r, w, h)) n++;
        return n > 0;
      }
      if (r.type === "compare") return [-1, 0, 1].includes(answerOf(r));
      return optionsOk(numberOptions(r), answerOf(r));
    });
    const kinds = L.rounds.map((r) => (r.type === "compare" ? answerOf(r) : null)).filter((v) => v !== null);
    // Không để hai câu so sánh liền nhau cùng đáp án
    const varied = kinds.every((v, k) => k === 0 || v !== kinds[k - 1]);
    report(notes.every(Boolean) && varied, `Màn ${i + 1} (${L.name}): ${L.rounds.map((r) => r.type).join(", ")}`);
  });
}

/* ---------- Bóng Đèn Nhị Phân ---------- */
{
  console.log("Bóng Đèn Nhị Phân");
  const { LEVELS, LETTERS, answerOf, readOptions, valueOf } = loadSection("bong-den-nhi-phan/game.js", ["LEVELS", "LETTERS", "answerOf", "readOptions", "valueOf"]);
  LEVELS.forEach((L, i) => {
    const max = 2 ** L.bits - 1;
    const ok = L.rounds.every((r) => {
      const ans = answerOf(r);
      if (r.make !== undefined) return ans >= 1 && ans <= max && (!r.from || (r.from.length === L.bits && valueOf(r.from) !== ans));
      const bits = r.read ?? r.letter;
      return bits.length === L.bits && optionsOk(readOptions(r, L.bits), ans) && (!r.letter || ans <= LETTERS.length);
    });
    const word = L.word ? L.rounds.map((r) => LETTERS[answerOf(r) - 1]).join("") : null;
    report(ok && (!L.word || word === L.word), `Màn ${i + 1}: ${L.bits} bóng${word ? `, mật thư ${word}` : ""}`);
  });
}

/* ---------- Xếp Hàng Thông Minh ---------- */
{
  console.log("Xếp Hàng Thông Minh");
  const { LEVELS, makeDoors, isSorted, searchLimit } = loadSection("xep-hang-thong-minh/game.js", ["LEVELS", "makeDoors", "isSorted", "searchLimit"]);
  const rand = seeded(11);
  LEVELS.forEach((L, i) => {
    const ok = L.rounds.every((r) => {
      if (r.sort) return !isSorted(r.sort) && new Set(r.sort).size === r.sort.length && r.sort.every((h) => h >= 1 && h <= 8);
      for (let n = 0; n < 300; n++) {
        const { values, target } = makeDoors(r.search, rand);
        if (values.length !== r.search.n || new Set(values).size !== values.length || !values.includes(target)) return false;
        if (r.search.sorted && !isSorted(values)) return false;
      }
      return true;
    });
    const doors = L.rounds.filter((r) => r.search?.sorted).map((r) => `${r.search.n} cửa ≤ ${searchLimit(r.search.n)} lần`);
    report(ok, `Màn ${i + 1} (${L.name})${doors.length ? `: ${[...new Set(doors)].join(", ")}` : ""}`);
  });
}

/* ---------- Hũ Kẹo May Mắn ---------- */
{
  console.log("Hũ Kẹo May Mắn");
  const { LEVELS, MAX_JAR, NAMES, fillOk, ratioOptions, totalOf, countOf } = loadSection("hu-keo-may-man/game.js", [
    "LEVELS", "MAX_JAR", "NAMES", "fillOk", "ratioOptions", "totalOf", "countOf",
  ]);
  // Mọi cách bỏ kẹo (mỗi màu 0…MAX_JAR viên) để xem yêu cầu fill có làm được không
  function fillable(r) {
    const jars = r.palette.reduce((acc, c) => acc.flatMap((j) => Array.from({ length: MAX_JAR + 1 }, (_, n) => ({ ...j, ...(n ? { [c]: n } : {}) }))), [{}]);
    return jars.some((j) => fillOk(r, j));
  }
  LEVELS.forEach((L, i) => {
    const ok = L.rounds.every((r) => {
      const jars = [r.jar, r.a, r.b].filter(Boolean);
      if (!jars.every((j) => Object.keys(j).every((c) => NAMES[c]) && totalOf(j) <= MAX_JAR)) return false;
      if (r.type === "fill") return fillable(r) && !fillOk(r, {});
      if (r.type === "ratio") return countOf(r.jar, r.c) > 0 && optionsOk(ratioOptions(r), `${countOf(r.jar, r.c)}/${totalOf(r.jar)}`);
      return true;
    });
    report(ok, `Màn ${i + 1} (${L.name}): ${L.rounds.map((r) => r.type).join(", ")}`);
  });
}

/* ---------- Cửa Hàng Giảm Giá (sinh đề ngẫu nhiên) ---------- */
{
  console.log("Cửa Hàng Giảm Giá");
  const { LEVELS, makeRound, answerOf, numberOptions } = loadSection("cua-hang-giam-gia/game.js", ["LEVELS", "makeRound", "answerOf", "numberOptions"]);
  const rand = seeded(3);
  LEVELS.forEach((L, i) => {
    const problems = [];
    for (let n = 0; n < 2000; n++) {
      L.kinds.forEach((_, k) => {
        const r = makeRound(i, k, rand);
        const ans = answerOf(r);
        let ok = true;
        if (["add", "sub", "off", "pay", "pct"].includes(r.kind)) ok = ans > 0 && Number.isInteger(ans) && optionsOk(numberOptions(r), ans);
        if (["off", "pay"].includes(r.kind)) ok &&= ans % 1000 === 0;
        if (r.kind === "best") ok = r.payA !== r.payB && r.payA % 1000 === 0 && r.payB > 0;
        if (r.kind === "compare") ok = r.a.v > 0 && r.b.v > 0;
        if (r.kind === "grid") ok = r.p > 0 && r.p < 100;
        if (!ok) problems.push(JSON.stringify(r));
      });
    }
    report(!problems.length, `Màn ${i + 1} (${L.name}): ${2000 * L.kinds.length} đề, ${problems.length} đề lỗi${problems.length ? ` (vd ${problems[0]})` : ""}`);
  });
}

/* ---------- Ngôi Nhà Số (sinh đề ngẫu nhiên) ---------- */
{
  console.log("Ngôi Nhà Số");
  const { LEVELS, ROUNDS, ANIMALS, makeRound, answerOf, optionsOf, neighborOf } = loadSection("ngoi-nha-so/game.js", [
    "LEVELS", "ROUNDS", "ANIMALS", "makeRound", "answerOf", "optionsOf", "neighborOf",
  ]);
  const rand = seeded(11);
  const inTen = (n) => Number.isInteger(n) && n >= 1 && n <= 10;
  LEVELS.forEach((L, i) => {
    const problems = [];
    const seen = new Set();
    for (let n = 0; n < 2000; n++) {
      for (let k = 0; k < ROUNDS; k++) {
        const r = makeRound(i, k, rand);
        const ans = answerOf(r);
        const opts = optionsOf(r);
        seen.add(`${r.kind}:${ans}`);
        let ok = opts.filter((o) => o === ans).length === 1 && new Set(opts).size === opts.length;
        if (["count", "build", "split", "add", "sub"].includes(r.kind)) ok &&= inTen(ans) && opts.length === 4 && opts.every(inTen);
        if (r.kind === "count") ok &&= r.n <= L.max;
        if (r.kind === "add") ok &&= r.a + r.b <= 10;
        if (r.kind === "compare" || r.kind === "symbol") ok &&= inTen(r.a) && inTen(r.b);
        if (r.grid) {
          ok &&= new Set(r.grid).size === 9 && r.grid.every((a) => a >= 0 && a < ANIMALS.length);
          if (r.kind === "floor") ok &&= opts.length === 3;
          else ok &&= neighborOf(r.target, r.kind) >= 0 && ans !== r.grid[r.target] && opts.length === 4;
        }
        if (!ok) problems.push(JSON.stringify(r));
      }
    }
    report(!problems.length, `Màn ${i + 1} (${L.name}): ${2000 * ROUNDS} đề, ${problems.length} đề lỗi, ${seen.size} kiểu đáp án${problems.length ? ` (vd ${problems[0]})` : ""}`);
  });
}

/* ---------- Kiểm tra riêng của từng game trong scripts/checks/<game-id>.mjs ---------- */
// Mỗi file export default ({ loadSection, report, seeded, optionsOk }) => void
for (const file of readdirSync(new URL("./checks/", import.meta.url)).filter((f) => f.endsWith(".mjs")).sort()) {
  const { default: check } = await import(new URL(`./checks/${file}`, import.meta.url));
  check({ loadSection, report, seeded, optionsOk });
}

if (failures) {
  console.log(`\n${failures} lỗi`);
  process.exit(1);
}
console.log("\nTất cả màn chơi đều hợp lệ.");
