export const SITE_NAME = "Bé Học Vui";

export type SubjectId = "toan" | "lap-trinh";

export type Subject = {
  id: SubjectId;
  name: string;
  emoji: string;
  color: string;
  description: string;
};

export type Game = {
  id: string;
  title: string;
  emoji: string;
  subject: SubjectId;
  description: string;
  skills: string[];
  /** Các lớp (1–5) hợp với game, theo chương trình GDPT 2018 */
  grades: number[];
  /** Đường dẫn tới game trong public/games. Không có = sắp ra mắt. */
  src?: string;
};

export const GRADES = [1, 2, 3, 4, 5];

export const SUBJECTS: Subject[] = [
  { id: "toan", name: "Đảo Toán Học", emoji: "🧮", color: "#ff5e7e", description: "Tính nhẩm, đo lường, hình học, thống kê" },
  { id: "lap-trinh", name: "Đảo Lập Trình", emoji: "💻", color: "#4c6ef5", description: "Thuật toán, vòng lặp, sự kiện, biến" },
];

// Mỗi đảo xếp game từ lớp nhỏ đến lớp lớn
export const GAMES: Game[] = [
  {
    id: "ngoi-nha-so",
    title: "Ngôi Nhà Số",
    emoji: "🏠",
    subject: "toan",
    description: "Đếm các bạn thú, tách gộp số, tìm xem ai ở đâu",
    skills: ["Đếm đến 10", "Tách gộp số", "Cộng trừ trong 10", "Vị trí"],
    grades: [1],
    src: "/games/ngoi-nha-so/index.html",
  },
  {
    id: "ban-bong-so",
    title: "Bắn Bóng Số",
    emoji: "🎈",
    subject: "toan",
    description: "Chạm vào quả bóng có đáp án đúng",
    skills: ["Cộng trừ", "Nhân chia", "Tính nhẩm"],
    grades: [1, 2, 3, 4],
    src: "/games/ban-bong-so/index.html",
  },
  {
    id: "dong-ho",
    title: "Đồng Hồ Thần Kỳ",
    emoji: "🕰️",
    subject: "toan",
    description: "Quay kim đồng hồ, đọc giờ, tính thời gian",
    skills: ["Xem giờ", "Thời gian"],
    grades: [1, 2, 3],
    src: "/games/dong-ho/index.html",
  },
  {
    id: "tau-hoa-so",
    title: "Tàu Hỏa Số",
    emoji: "🚂",
    subject: "toan",
    description: "Xếp hàng lên toa, so sánh và làm tròn số",
    skills: ["Đọc viết số", "So sánh", "Làm tròn"],
    grades: [1, 2, 3, 4],
    src: "/games/tau-hoa-so/index.html",
  },
  {
    id: "tham-tu-hinh-hoc",
    title: "Thám Tử Hình Học",
    emoji: "🔍",
    subject: "toan",
    description: "Đọc manh mối, tìm đúng các hình bị giấu",
    skills: ["Hình học", "Cạnh và góc"],
    grades: [1, 2, 3],
    src: "/games/tham-tu-hinh-hoc/index.html",
  },
  {
    id: "sieu-thi-mini",
    title: "Siêu Thị Mini",
    emoji: "🛒",
    subject: "toan",
    description: "Làm thu ngân, tính tiền và thối tiền",
    skills: ["Tiền Việt Nam", "Cộng trừ"],
    grades: [1, 2, 3],
    src: "/games/sieu-thi-mini/index.html",
  },
  {
    id: "xay-cau",
    title: "Xây Cầu",
    emoji: "🌉",
    subject: "toan",
    description: "Đo khe núi, ghép ván vừa khít cho xe qua",
    skills: ["Đo lường", "Đổi đơn vị"],
    grades: [2, 3],
    src: "/games/xay-cau/index.html",
  },
  {
    id: "bep-can-dong",
    title: "Bếp Cân Đong",
    emoji: "🧁",
    subject: "toan",
    description: "Cân bột, đong sữa thật chuẩn để nấu món ngon",
    skills: ["kg, g", "l, ml", "Đổi đơn vị"],
    grades: [2, 3],
    src: "/games/bep-can-dong/index.html",
  },
  {
    id: "nong-trai-bieu-do",
    title: "Nông Trại Biểu Đồ",
    emoji: "🐄",
    subject: "toan",
    description: "Đếm con vật, vẽ biểu đồ, trả lời câu hỏi",
    skills: ["Thống kê", "Biểu đồ", "Trung bình"],
    grades: [2, 3, 4],
    src: "/games/nong-trai-bieu-do/index.html",
  },
  {
    id: "can-thang-bang",
    title: "Cân Thăng Bằng",
    emoji: "⚖️",
    subject: "toan",
    description: "Tìm số bí ẩn để cân thăng bằng",
    skills: ["Phương trình", "Cộng trừ"],
    grades: [2, 3, 4],
    src: "/games/can-thang-bang/index.html",
  },
  {
    id: "hu-keo-may-man",
    title: "Hũ Kẹo May Mắn",
    emoji: "🍬",
    subject: "toan",
    description: "Chắc chắn, có thể hay không thể?",
    skills: ["Xác suất", "Phân số"],
    grades: [2, 3, 4, 5],
    src: "/games/hu-keo-may-man/index.html",
  },
  {
    id: "chia-banh-pizza",
    title: "Chia Bánh Pizza",
    emoji: "🍕",
    subject: "toan",
    description: "Chia bánh đều cho các bạn thú",
    skills: ["Phân số"],
    grades: [3, 4, 5],
    src: "/games/chia-banh-pizza/index.html",
  },
  {
    id: "khu-vuon-dien-tich",
    title: "Khu Vườn Diện Tích",
    emoji: "🌻",
    subject: "toan",
    description: "Đếm ô, rào vườn, tự thiết kế khu vườn",
    skills: ["Chu vi", "Diện tích"],
    grades: [3, 4, 5],
    src: "/games/khu-vuon-dien-tich/index.html",
  },
  {
    id: "cua-hang-giam-gia",
    title: "Cửa Hàng Giảm Giá",
    emoji: "🏷️",
    subject: "toan",
    description: "Số thập phân, phần trăm, săn hàng giảm giá",
    skills: ["Số thập phân", "Phần trăm"],
    grades: [5],
    src: "/games/cua-hang-giam-gia/index.html",
  },
  {
    id: "chu-ech-nhay",
    title: "Chú Ếch Nhảy",
    emoji: "🐸",
    subject: "lap-trinh",
    description: "Đọc lệnh, tìm quy luật, giúp ếch nhảy qua lá sen",
    skills: ["Đọc lệnh", "Quy luật", "Tuần tự", "Sửa lỗi"],
    grades: [1, 2],
    src: "/games/chu-ech-nhay/index.html",
  },
  {
    id: "robot-tim-duong",
    title: "Robot Tìm Đường",
    emoji: "🤖",
    subject: "lap-trinh",
    description: "Xếp lệnh đưa robot tới kho báu",
    skills: ["Tuần tự", "Vòng lặp"],
    grades: [1, 2, 3],
    src: "/games/robot-tim-duong/index.html",
  },
  {
    id: "den-giao-thong",
    title: "Đèn Giao Thông",
    emoji: "🚦",
    subject: "lap-trinh",
    description: "Học câu lệnh nếu… thì…",
    skills: ["Điều kiện"],
    grades: [2, 3, 4],
    src: "/games/den-giao-thong/index.html",
  },
  {
    id: "dau-bep-nhi",
    title: "Đầu Bếp Nhí",
    emoji: "👩‍🍳",
    subject: "lap-trinh",
    description: "Xếp các bước thành công thức nấu ăn",
    skills: ["Thuật toán", "Thứ tự"],
    grades: [2, 3, 4],
    src: "/games/dau-bep-nhi/index.html",
  },
  {
    id: "tho-det-hoa-van",
    title: "Thợ Dệt Hoa Văn",
    emoji: "🧵",
    subject: "lap-trinh",
    description: "Tìm quy luật, dệt bằng vòng lặp và hàm",
    skills: ["Quy luật", "Lặp lồng nhau", "Hàm"],
    grades: [2, 3, 4, 5],
    src: "/games/tho-det-hoa-van/index.html",
  },
  {
    id: "bat-bo",
    title: "Bắt Bọ",
    emoji: "🐞",
    subject: "lap-trinh",
    description: "Tìm và sửa lỗi trong chương trình",
    skills: ["Debug"],
    grades: [3, 4, 5],
    src: "/games/bat-bo/index.html",
  },
  {
    id: "hoa-si-rua",
    title: "Họa Sĩ Rùa",
    emoji: "🐢",
    subject: "lap-trinh",
    description: "Viết lệnh cho rùa vẽ hình",
    skills: ["Vòng lặp", "Góc quay"],
    grades: [3, 4, 5],
    src: "/games/hoa-si-rua/index.html",
  },
  {
    id: "thi-tran-su-kien",
    title: "Thị Trấn Sự Kiện",
    emoji: "🎬",
    subject: "lap-trinh",
    description: "Gắn sự kiện cho nhân vật như Scratch",
    skills: ["Sự kiện", "Gửi tin"],
    grades: [3, 4, 5],
    src: "/games/thi-tran-su-kien/index.html",
  },
  {
    id: "bong-den-nhi-phan",
    title: "Bóng Đèn Nhị Phân",
    emoji: "💡",
    subject: "lap-trinh",
    description: "Bật tắt bóng đèn để viết số như máy tính",
    skills: ["Số nhị phân", "Mã hóa"],
    grades: [3, 4, 5],
    src: "/games/bong-den-nhi-phan/index.html",
  },
  {
    id: "xep-hang-thong-minh",
    title: "Xếp Hàng Thông Minh",
    emoji: "📏",
    subject: "lap-trinh",
    description: "Sắp xếp và tìm kiếm như máy tính",
    skills: ["Sắp xếp", "Tìm kiếm"],
    grades: [3, 4, 5],
    src: "/games/xep-hang-thong-minh/index.html",
  },
  {
    id: "robot-nha-kho",
    title: "Rô-bốt Nhà Kho",
    emoji: "📦",
    subject: "lap-trinh",
    description: "Cất số vào các hộp có tên: biến",
    skills: ["Biến", "Vòng lặp"],
    grades: [4, 5],
    src: "/games/robot-nha-kho/index.html",
  },
];

export const getGame = (id: string) => GAMES.find((g) => g.id === id);

/** [3, 4, 5] → "Lớp 3–5" */
export function gradeText(grades: number[]) {
  const lo = Math.min(...grades);
  const hi = Math.max(...grades);
  return lo === hi ? `Lớp ${lo}` : `Lớp ${lo}–${hi}`;
}

/** Game chơi được, hợp với lớp của bé */
export const gamesForGrade = (grade: number) => GAMES.filter((g) => g.src && g.grades.includes(grade));

type Played = Record<string, { bestStars: number; lastPlayed: string }>;

/**
 * Gợi ý game cho bé: game hợp lớp mà bé chưa chơi đứng trước, rồi tới game còn ít sao,
 * cùng số sao thì game lâu chưa chơi đứng trước. Mỗi đảo lấy xen kẽ để có cả toán lẫn lập trình.
 */
export function suggestGames(grade: number, played: Played, count = 3): Game[] {
  const rank = (g: Game) => {
    const r = played[g.id];
    return r ? [1 + r.bestStars, Date.parse(r.lastPlayed)] : [0, 0];
  };
  const byNeed = (a: Game, b: Game) => {
    const [x, y] = [rank(a), rank(b)];
    return x[0] - y[0] || x[1] - y[1];
  };
  const pending = gamesForGrade(grade).filter((g) => (played[g.id]?.bestStars ?? 0) < 3);
  const lists = SUBJECTS.map((s) => pending.filter((g) => g.subject === s.id).sort(byNeed));
  const picked: Game[] = [];
  for (let i = 0; picked.length < count && lists.some((l) => i < l.length); i++) {
    for (const l of lists) if (l[i] && picked.length < count) picked.push(l[i]);
  }
  return picked;
}
