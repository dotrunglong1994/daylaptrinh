// Cổng Logic: đáp án đúng theo luật, câu tìm luật có đúng một luật khớp với mọi bạn.
export default function check({ loadSection, report, seeded }) {
  console.log("Cổng Logic");
  const { LEVELS, ROUNDS, makeRound, answerOf, evalRule, ruleText, ALL_RULES } = loadSection("cong-logic/game.js", [
    "LEVELS", "ROUNDS", "makeRound", "answerOf", "evalRule", "ruleText", "ALL_RULES",
  ]);
  const rand = seeded(97);
  // Mọi luật có thể hiện ra làm đáp án (luật của màn + luật nhiễu), tra theo chữ
  const byText = new Map(ALL_RULES.map((c) => [ruleText(c), c]));
  LEVELS.forEach((L, i) => {
    const problems = [];
    const kinds = new Set();
    for (let n = 0; n < 2000; n++) {
      for (let k = 0; k < ROUNDS; k++) {
        const r = makeRound(i, k, rand);
        const ans = answerOf(r);
        kinds.add(r.kind);
        let ok = true;
        if (r.kind === "pass") ok = ans === (evalRule(r.rule, r.friends[0].attrs) ? 0 : 1);
        if (r.kind === "truth") {
          const [a, b] = r.facts.map((f) => f[1]);
          const value = { and: a && b, or: a || b, not: !a, "and-not": a && !b, "not-or": !a || b }[r.form];
          ok = ans === (value ? 0 : 1) && r.facts.length === (r.form === "not" ? 1 : 2);
        }
        if (r.kind === "select") {
          const pass = r.friends.map((f, j) => (evalRule(r.rule, f.attrs) ? j : -1)).filter((j) => j >= 0);
          ok = ans === pass.join(",") && pass.length >= 1 && pass.length <= 3 && new Set(r.friends.map((f) => f.animal)).size === 4;
        }
        if (r.kind === "rule") {
          byText.set(ruleText(r.rule), r.rule);
          const fits = r.options.filter((t) => r.friends.every((f, j) => evalRule(byText.get(t), f.attrs) === r.marks[j]));
          ok = r.options.length === 3 && new Set(r.options).size === 3 && fits.length === 1 && fits[0] === ans;
          ok &&= r.marks.some(Boolean) && r.marks.some((m) => !m);
        }
        if (!ok) problems.push(JSON.stringify(r));
      }
    }
    report(!problems.length && L.kinds.every((k) => kinds.has(k)), `Màn ${i + 1} (${L.name}): ${2000 * ROUNDS} đề, ${problems.length} đề lỗi${problems.length ? ` (vd ${problems[0]})` : ""}`);
  });
}
