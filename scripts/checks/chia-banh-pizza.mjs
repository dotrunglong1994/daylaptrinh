// Chia Bánh Pizza: 3 mức độ (mỗi mức một màn) có tên, dạng bài và mẫu số hợp lệ, cặp phân số bằng nhau đúng, 4 đáp án phân số.
export default function check({ loadSection, report }) {
  console.log("Chia Bánh Pizza");
  const { LEVELS, EQUAL_PAIRS, fracOptions, sameValue } = loadSection("chia-banh-pizza/game.js", [
    "LEVELS", "EQUAL_PAIRS", "fracOptions", "sameValue",
  ]);
  const TASKS = ["paint", "read", "share", "compare"];
  const keys = Object.keys(LEVELS);
  report(keys.join(",") === "1,2,3", "Ba mức độ 1, 2, 3 (trùng data-level của nút Dễ / Vừa / Khó)");
  keys.forEach((k) => {
    const L = LEVELS[k];
    const ok = typeof L.name === "string" && L.name.trim() !== "" &&
      L.tasks.length > 0 && L.tasks.every((t) => TASKS.includes(t)) &&
      L.dens.every((d) => Number.isInteger(d) && d >= 2) &&
      (!L.tasks.includes("share") || L.dens.some((d) => d <= 6)) &&
      (!L.tasks.includes("compare") || (L.dens.length >= 2 && L.dens.some((d) => d >= 3)));
    report(ok, `Mức ${k} "${L.name}": ${L.tasks.join(", ")}; mẫu số ${L.dens.join(", ")}`);
  });
  report(EQUAL_PAIRS.every(([a, b, c, d]) => sameValue([a, b], [c, d]) && b !== d), `${EQUAL_PAIRS.length} cặp phân số bằng nhau`);

  let bad = 0;
  for (const L of Object.values(LEVELS)) {
    for (const den of L.dens) {
      for (let num = 1; num < den; num++) {
        for (let n = 0; n < 200; n++) {
          const opts = fracOptions(num, den);
          const right = opts.filter((o) => sameValue(o, [num, den]));
          const distinct = new Set(opts.map((o) => o.join("/"))).size === 4;
          if (opts.length !== 4 || !distinct || right.length !== 1 || right[0][0] !== num || right[0][1] !== den ||
            opts.some(([a, b]) => a < 1 || b < 2)) bad++;
        }
      }
    }
  }
  report(!bad, `Đáp án phân số: 4 lựa chọn khác nhau, đúng một đáp án bằng phân số cần tìm${bad ? ` — ${bad} lỗi` : ""}`);
}
