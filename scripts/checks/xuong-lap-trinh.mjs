// Xưởng Lập Trình: lời giải mẫu của mỗi màn chạy đúng yêu cầu và không vượt số khối, chương trình trống không thắng,
// ngôi sao / đá / ô cần tô nằm trong sân. Màn giới hạn số khối: thử mọi chương trình không dùng "Lặp lại"
// trong giới hạn đó, không cái nào thắng (bé buộc phải dùng vòng lặp).
export default function check({ loadSection, report }) {
  console.log("Xưởng Lập Trình");
  const { LEVELS, BLOCKS, HATS, W, H, SAYINGS, COLORS, simulate, checkGoal, blankState, totalBlocks, overLimit } = loadSection(
    "xuong-lap-trinh/game.js",
    ["LEVELS", "BLOCKS", "HATS", "W", "H", "SAYINGS", "COLORS", "simulate", "checkGoal", "blankState", "totalBlocks", "overLimit"],
  );
  const runAll = (L, scripts) => L.hats.map((hat) => {
    const res = simulate(L, scripts[hat] || [], blankState(L), hat);
    return checkGoal(L, hat, scripts, res).ok;
  }).some(Boolean);
  const types = (list) => list.flatMap((b) => [b.t, ...(b.body ? types(b.body) : [])]);
  const variants = (t) => {
    const d = BLOCKS[t];
    if (d.num) return Array.from({ length: d.num[1] - d.num[0] + 1 }, (_, i) => ({ t, n: d.num[0] + i }));
    if (d.text) return SAYINGS.map((_, s) => ({ t, s }));
    if (d.color) return COLORS.map((_, c) => ({ t, c }));
    return [{ t }];
  };

  LEVELS.forEach((L, i) => {
    const problems = [];
    const inside = ([x, y]) => x >= 0 && y >= 0 && x < W && y < H;
    const cells = [...(L.stars || []), ...(L.rocks || []), ...(L.paint || [])];
    if (!cells.every(inside) || !inside(L.start)) problems.push("ô nằm ngoài sân");
    const rocks = new Set((L.rocks || []).map(String));
    if ([...(L.stars || []), ...(L.paint || []), L.start.slice(0, 2)].some((c) => rocks.has(String(c)))) problems.push("đá đè lên ô khác");
    if (!L.hats.every((h) => HATS[h]) || !L.palette.every((t) => BLOCKS[t])) problems.push("sự kiện / khối lạ");
    if (!L.name || !L.intro || !L.task || !L.hint) problems.push("thiếu lời");

    const sol = L.solution;
    if (!Object.keys(sol).every((h) => L.hats.includes(h))) problems.push("lời giải dùng sự kiện không có");
    if (!Object.values(sol).flatMap(types).every((t) => L.palette.includes(t))) problems.push("lời giải dùng khối không có trong hộp");
    if (overLimit(L, sol)) problems.push(`lời giải ${totalBlocks(sol)} khối > ${L.maxBlocks}`);
    if (!runAll(L, sol)) problems.push("lời giải không thắng");
    const empty = Object.fromEntries(L.hats.map((h) => [h, []]));
    if (runAll(L, empty)) problems.push("chương trình trống cũng thắng");

    let tried = 0;
    if (L.maxBlocks) {
      const opts = L.palette.filter((t) => t !== "repeat").flatMap(variants);
      const hat = L.hats[0];
      const search = (prog) => {
        tried++;
        if (prog.length && runAll(L, { [hat]: prog })) problems.push(`thắng mà không cần lặp: ${JSON.stringify(prog)}`);
        if (prog.length < L.maxBlocks && problems.length < 3) for (const b of opts) search([...prog, b]);
      };
      search([]);
    }
    report(!problems.length, `Màn ${i + 1} (${L.name})${tried ? `: thử ${tried} chương trình không lặp` : ""}${problems.length ? ` — ${problems.join("; ")}` : ""}`);
  });
}
