// Lật Thẻ Nhớ: mỗi bàn số thẻ chẵn và đủ hình, bộ bài mỗi hình đúng 2 lần, cách tính điểm.
export default function check({ loadSection, report, seeded }) {
  console.log("Lật Thẻ Nhớ");
  const { BOARDS, SYMBOLS, makeDeck, pairScore, boardBonus, boardAt } = loadSection("lat-the/game.js", [
    "BOARDS", "SYMBOLS", "makeDeck", "pairScore", "boardBonus", "boardAt",
  ]);
  const boardsOk = BOARDS.every(([c, r]) => (c * r) % 2 === 0 && (c * r) / 2 <= SYMBOLS.length) && new Set(SYMBOLS).size === SYMBOLS.length;
  report(boardsOk && boardAt(99) === BOARDS[BOARDS.length - 1], `${BOARDS.length} cỡ bàn, số thẻ chẵn, đủ ${SYMBOLS.length} hình khác nhau`);
  const rand = seeded(13);
  let bad = 0;
  for (const [c, r] of BOARDS) {
    for (let n = 0; n < 3000; n++) {
      const deck = makeDeck((c * r) / 2, rand);
      const counts = new Map();
      deck.forEach((s) => counts.set(s, (counts.get(s) ?? 0) + 1));
      if (deck.length !== c * r || [...counts.values()].some((v) => v !== 2) || counts.size !== (c * r) / 2) bad++;
    }
  }
  report(!bad, `${3000 * BOARDS.length} bộ bài: mỗi hình đúng 2 thẻ${bad ? ` — ${bad} lỗi` : ""}`);
  report(pairScore(1) === 10 && pairScore(2) === 15 && pairScore(9) === 30 && boardBonus(6) === 30, "Điểm: 10 mỗi cặp, liền cặp +5 (tối đa +20), xong bàn +5 mỗi cặp");
}
