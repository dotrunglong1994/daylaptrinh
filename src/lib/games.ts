export const SITE_NAME = "Bé Học Vui";
/** Địa chỉ chính thức, dùng cho sitemap, robots và thẻ chia sẻ (Open Graph) */
export const SITE_URL = "https://daylaptrinh.vercel.app";
export const SITE_DESCRIPTION =
  "Bé 6–10 tuổi học toán và lập trình qua hơn 30 trò chơi vui nhộn theo chương trình lớp 1–5: tính nhẩm, đồng hồ, phân số, vòng lặp, sự kiện như Scratch. Miễn phí, không cần đăng nhập.";

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
  /** Bé học gì, viết đủ câu (hiện trong phần giới thiệu dưới game, giúp phụ huynh và Google hiểu game) */
  teaches: string;
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
    teaches: "Đếm đến 10 (chạm để đếm), so sánh, tách gộp số, cộng trừ trong 10, vị trí trên/dưới/trái/phải",
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
    teaches: "Tính nhẩm 4 phép tính, chế độ thử thách 60 giây",
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
    teaches: "Quay kim, đọc giờ (rưỡi, kém), số La Mã, tính thời gian trôi",
    skills: ["Xem giờ", "Thời gian"],
    grades: [1, 2, 3],
    src: "/games/dong-ho/index.html",
  },
  {
    id: "to-lich-nha-be",
    title: "Tờ Lịch Nhà Bé",
    emoji: "📅",
    subject: "toan",
    description: "Xem thứ, ngày, tháng trên lịch, đếm ngày đến sinh nhật",
    teaches: "Các ngày trong tuần, đọc tờ lịch bóc, xem lịch tháng (thứ của một ngày, chạm vào ngày, đếm ngày Chủ nhật), tuần trước / tuần sau, mẹo nắm tay đếm số ngày trong tháng (30 hay 31, không hỏi tháng 2), đếm ngày đến sinh nhật",
    skills: ["Ngày trong tuần", "Xem lịch", "Số ngày trong tháng", "Đếm ngày"],
    grades: [1, 2, 3],
    src: "/games/to-lich-nha-be/index.html",
  },
  {
    id: "tau-hoa-so",
    title: "Tàu Hỏa Số",
    emoji: "🚂",
    subject: "toan",
    description: "Xếp hàng lên toa, so sánh và làm tròn số",
    teaches: "Giá trị theo hàng, đọc số bằng chữ, so sánh, sắp xếp, làm tròn",
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
    teaches: "Nhận biết hình theo tên, màu, số cạnh, góc vuông, cạnh bằng nhau",
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
    teaches: "Cộng trừ, tính tiền và thối tiền Việt Nam",
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
    teaches: "Đo bằng thước, cộng độ dài, đổi m – dm – cm",
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
    teaches: "Đọc cân đồng hồ, ca đong, đổi kg – g, l – ml",
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
    teaches: "Đếm, vẽ biểu đồ tranh / cột, đọc biểu đồ, trung bình cộng",
    skills: ["Thống kê", "Biểu đồ", "Trung bình"],
    grades: [2, 3, 4],
    src: "/games/nong-trai-bieu-do/index.html",
  },
  {
    id: "nha-may-cuu-chuong",
    title: "Nhà Máy Cửu Chương",
    emoji: "🏭",
    subject: "toan",
    description: "Đóng kẹo vào hộp để học bảng nhân, bảng chia, chia có dư",
    teaches: "Nhân là cộng lặp lại, bảng nhân và bảng chia 2–9 (máy chia kẹo vào hộp), tìm số còn thiếu, chia có dư, toán có lời văn; câu sai được hỏi lại cuối màn",
    skills: ["Bảng nhân 2–9", "Bảng chia", "Tìm số còn thiếu", "Chia có dư"],
    grades: [2, 3],
    src: "/games/nha-may-cuu-chuong/index.html",
  },
  {
    id: "can-thang-bang",
    title: "Cân Thăng Bằng",
    emoji: "⚖️",
    subject: "toan",
    description: "Tìm số bí ẩn để cân thăng bằng",
    teaches: "Làm quen phương trình (🎁 + 3 = 7)",
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
    teaches: "Chắc chắn / có thể / không thể, so sánh khả năng, tỉ số",
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
    teaches: "Phân số: tô, đọc, chia đều, so sánh",
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
    teaches: "Đếm ô, chu vi, diện tích, công thức, tính ngược",
    skills: ["Chu vi", "Diện tích"],
    grades: [3, 4, 5],
    src: "/games/khu-vuon-dien-tich/index.html",
  },
  {
    id: "xuong-hinh",
    title: "Xưởng Hình Lớp 5",
    emoji: "🔺",
    subject: "toan",
    description: "Tìm đường cao, chọn công thức, tính diện tích tam giác, hình thang, hình tròn",
    teaches: "Đường cao và diện tích hình tam giác, tam giác vuông, diện tích hình thang, tìm chiều cao hoặc tổng hai đáy khi biết diện tích, bán kính và đường kính, chu vi và diện tích hình tròn",
    skills: ["Diện tích tam giác", "Hình thang", "Hình tròn", "Chu vi"],
    grades: [5],
    src: "/games/xuong-hinh/index.html",
  },
  {
    id: "thuoc-do-goc",
    title: "Thước Đo Góc",
    emoji: "📐",
    subject: "toan",
    description: "Gọi tên góc, đo góc và xoay tia bằng thước đo độ",
    teaches: "Góc nhọn/vuông/tù/bẹt, đọc thước đo độ (hai vòng số), xoay tia, góc kim đồng hồ, góc còn thiếu",
    skills: ["Góc nhọn, vuông, tù, bẹt", "Đo góc", "Độ"],
    grades: [4, 5],
    src: "/games/thuoc-do-goc/index.html",
  },
  {
    id: "hop-lap-phuong",
    title: "Kho Hộp Lập Phương",
    emoji: "🧊",
    subject: "toan",
    description: "Xếp khối lập phương, tính thể tích hộp và bể nước",
    teaches: "Đếm khối lập phương, xếp đầy hộp, thể tích hình hộp và hình lập phương, đổi cm³ – dm³ – m³ – lít, bể nước",
    skills: ["Thể tích", "cm³, dm³, lít"],
    grades: [5],
    src: "/games/hop-lap-phuong/index.html",
  },
  {
    id: "duong-dua-van-toc",
    title: "Đường Đua Vận Tốc",
    emoji: "🏎️",
    subject: "toan",
    description: "Chỉnh tốc độ xe đua, tính quãng đường và thời gian",
    teaches: "Quãng đường, vận tốc, thời gian; chỉnh tốc độ cho xe về đích đúng giờ; giờ và phút; hai xe ngược chiều, đuổi kịp",
    skills: ["Vận tốc", "Quãng đường", "Thời gian"],
    grades: [5],
    src: "/games/duong-dua-van-toc/index.html",
  },
  {
    id: "cua-hang-giam-gia",
    title: "Cửa Hàng Giảm Giá",
    emoji: "🏷️",
    subject: "toan",
    description: "Số thập phân, phần trăm, săn hàng giảm giá",
    teaches: "Số thập phân, phần trăm, tính giá sau giảm",
    skills: ["Số thập phân", "Phần trăm"],
    grades: [5],
    src: "/games/cua-hang-giam-gia/index.html",
  },
  {
    id: "tham-tu-de-bai",
    title: "Thám Tử Đề Bài",
    emoji: "🕵️",
    subject: "toan",
    description: "Đọc đề, tìm manh mối, chọn phép tính rồi tìm đáp số",
    teaches: "Toán có lời văn theo 3 bước: chạm vào số cần dùng (có manh mối thừa), chọn phép tính, tìm đáp số; thêm bớt, nhiều hơn / ít hơn, nhân chia, gấp / giảm, hai bước tính, trung bình cộng, tổng – hiệu, rút về đơn vị",
    skills: ["Toán có lời văn", "Chọn phép tính", "Manh mối thừa", "Bài toán hai bước"],
    grades: [1, 2, 3, 4, 5],
    src: "/games/tham-tu-de-bai/index.html",
  },
  {
    id: "kiem-tra",
    title: "Bài Kiểm Tra",
    emoji: "📝",
    subject: "toan",
    description: "10 câu trộn toán và lập trình mỗi lớp, đạt 8 câu có bằng khen",
    teaches: "Mỗi lớp 10 câu trộn toán và lập trình, mỗi câu trả lời một lần; đúng từ 8 câu có bằng khen để in (mọi lớp mở sẵn)",
    skills: ["Ôn tập", "Kiểm tra cuối chủ đề"],
    grades: [1, 2, 3, 4, 5],
    src: "/games/kiem-tra/index.html",
  },
  {
    id: "chu-ech-nhay",
    title: "Chú Ếch Nhảy",
    emoji: "🐸",
    subject: "lap-trinh",
    description: "Đọc lệnh, tìm quy luật, giúp ếch nhảy qua lá sen",
    teaches: "Đọc lệnh (ếch dừng ở đâu), quy luật mũi tên, chọn chương trình đúng, xếp lệnh, sửa một lệnh sai",
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
    teaches: "Tuần tự, vòng lặp",
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
    teaches: "NẾU… THÌ…, NGƯỢC LẠI, thứ tự ưu tiên",
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
    teaches: "Thuật toán: sắp thứ tự các bước, bước nào phụ thuộc bước nào, loại bước thừa",
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
    teaches: "Quy luật, vòng lặp, vòng lặp lồng nhau, hàm",
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
    teaches: "Tìm và sửa lỗi chương trình (debug)",
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
    teaches: "Vẽ hình bằng lệnh, vòng lặp, góc quay",
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
    teaches: "Sự kiện như Scratch: cờ xanh, bấm vào nhân vật, phím, gửi / nhận tin",
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
    teaches: "Số nhị phân (hoạt động \"Đếm chấm\" của CS Unplugged), mật thư",
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
    teaches: "Sắp xếp nổi bọt, tìm kiếm tuần tự và tìm kiếm nhị phân",
    skills: ["Sắp xếp", "Tìm kiếm"],
    grades: [3, 4, 5],
    src: "/games/xep-hang-thong-minh/index.html",
  },
  {
    id: "tau-danh-sach",
    title: "Tàu Danh Sách",
    emoji: "🚃",
    subject: "lap-trinh",
    description: "Thêm, xóa toa và duyệt từng toa bằng vòng lặp",
    teaches: "Danh sách: toa thứ mấy, độ dài, thêm / xóa toa, vòng lặp tính tổng, đếm theo điều kiện, tìm lớn nhất",
    skills: ["Danh sách", "Vòng lặp", "Biến"],
    grades: [4, 5],
    src: "/games/tau-danh-sach/index.html",
  },
  {
    id: "cong-logic",
    title: "Cổng Logic",
    emoji: "🚪",
    subject: "lap-trinh",
    description: "Cổng thần kỳ chỉ mở khi đúng luật VÀ, HOẶC, KHÔNG",
    teaches: "Điều kiện VÀ / HOẶC / KHÔNG: ai qua cổng, chọn mọi bạn qua cổng, Đúng hay Sai, tìm luật của cổng",
    skills: ["Điều kiện", "VÀ / HOẶC / KHÔNG"],
    grades: [4, 5],
    src: "/games/cong-logic/index.html",
  },
  {
    id: "robot-nha-kho",
    title: "Rô-bốt Nhà Kho",
    emoji: "📦",
    subject: "lap-trinh",
    description: "Cất số vào các hộp có tên: biến",
    teaches: "Biến: gán, cộng dồn, biến trong vòng lặp, đổi chỗ hai biến",
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
