// Robot Tìm Đường: mỗi màn có tên, bản đồ đúng khung, par = số lệnh ít nhất (BFS), đủ chỗ cho lời giải.
export default function check({ loadSection, report }) {
  console.log("Robot Tìm Đường");
  const { LEVELS, DIRS, MAX_REPEAT, parseLevel } = loadSection("robot-tim-duong/game.js", ["LEVELS", "DIRS", "MAX_REPEAT", "parseLevel"]);

  // Số lệnh ít nhất: mỗi lệnh đi một hướng 1 bước (hoặc 1..MAX_REPEAT bước nếu màn cho lặp), chạm kho báu là thắng.
  function minBlocks(L) {
    const key = (p) => `${p.x},${p.y}`;
    const free = (x, y) => x >= 0 && y >= 0 && x < L.cols && y < L.rows && !L.walls.has(`${x},${y}`);
    const dist = new Map([[key(L.start), 0]]);
    const queue = [L.start];
    while (queue.length) {
      const p = queue.shift();
      const d = dist.get(key(p));
      for (const { dx, dy } of Object.values(DIRS)) {
        for (let n = 1; n <= (L.repeat ? MAX_REPEAT : 1); n++) {
          const x = p.x + dx * n;
          const y = p.y + dy * n;
          if (!free(x, y)) break;
          if (x === L.goal.x && y === L.goal.y) return d + 1;
          if (!dist.has(`${x},${y}`)) { dist.set(`${x},${y}`, d + 1); queue.push({ x, y }); }
        }
      }
    }
    return Infinity;
  }

  const names = new Set();
  LEVELS.forEach((def, i) => {
    const L = parseLevel(def);
    const shape = def.map.every((r) => r.length === L.cols) && def.map.join("").split("S").length === 2 && def.map.join("").split("G").length === 2;
    const min = shape ? minBlocks(L) : Infinity;
    const ok = typeof def.name === "string" && def.name.trim() !== "" && !names.has(def.name) && shape &&
      min === def.par && def.slots >= def.par && typeof def.tip === "string";
    names.add(def.name);
    report(ok, `Màn ${i + 1} "${def.name}": ít nhất ${min} lệnh (khai báo ${def.par}), ${def.slots} chỗ`);
  });
}
