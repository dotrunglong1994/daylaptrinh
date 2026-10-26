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
  /** Đường dẫn tới game trong public/games. Không có = sắp ra mắt. */
  src?: string;
};

export const SUBJECTS: Subject[] = [
  { id: "toan", name: "Đảo Toán Học", emoji: "🧮", color: "#ff5e7e", description: "Tính nhẩm, đo lường, phân số" },
  { id: "lap-trinh", name: "Đảo Lập Trình", emoji: "💻", color: "#4c6ef5", description: "Tư duy thuật toán, vòng lặp, điều kiện" },
];

export const GAMES: Game[] = [
  {
    id: "ban-bong-so",
    title: "Bắn Bóng Số",
    emoji: "🎈",
    subject: "toan",
    description: "Chạm vào quả bóng có đáp án đúng",
    skills: ["Cộng trừ", "Nhân chia", "Tính nhẩm"],
    src: "/games/ban-bong-so/index.html",
  },
  {
    id: "sieu-thi-mini",
    title: "Siêu Thị Mini",
    emoji: "🛒",
    subject: "toan",
    description: "Làm thu ngân, tính tiền và thối tiền",
    skills: ["Tiền Việt Nam", "Cộng trừ"],
    src: "/games/sieu-thi-mini/index.html",
  },
  {
    id: "chia-banh-pizza",
    title: "Chia Bánh Pizza",
    emoji: "🍕",
    subject: "toan",
    description: "Chia bánh đều cho các bạn thú",
    skills: ["Phân số"],
    src: "/games/chia-banh-pizza/index.html",
  },
  {
    id: "can-thang-bang",
    title: "Cân Thăng Bằng",
    emoji: "⚖️",
    subject: "toan",
    description: "Tìm số bí ẩn để cân thăng bằng",
    skills: ["Phương trình", "Cộng trừ"],
    src: "/games/can-thang-bang/index.html",
  },
  {
    id: "tham-tu-hinh-hoc",
    title: "Thám Tử Hình Học",
    emoji: "🔍",
    subject: "toan",
    description: "Đọc manh mối, tìm đúng các hình bị giấu",
    skills: ["Hình học", "Cạnh và góc"],
    src: "/games/tham-tu-hinh-hoc/index.html",
  },
  {
    id: "xay-cau",
    title: "Xây Cầu",
    emoji: "🌉",
    subject: "toan",
    description: "Đo khe núi, ghép ván vừa khít cho xe qua",
    skills: ["Đo lường", "Đổi đơn vị"],
    src: "/games/xay-cau/index.html",
  },
  {
    id: "robot-tim-duong",
    title: "Robot Tìm Đường",
    emoji: "🤖",
    subject: "lap-trinh",
    description: "Xếp lệnh đưa robot tới kho báu",
    skills: ["Tuần tự", "Vòng lặp"],
    src: "/games/robot-tim-duong/index.html",
  },
  {
    id: "den-giao-thong",
    title: "Đèn Giao Thông",
    emoji: "🚦",
    subject: "lap-trinh",
    description: "Học câu lệnh nếu… thì…",
    skills: ["Điều kiện"],
    src: "/games/den-giao-thong/index.html",
  },
  {
    id: "bat-bo",
    title: "Bắt Bọ",
    emoji: "🐞",
    subject: "lap-trinh",
    description: "Tìm và sửa lỗi trong chương trình",
    skills: ["Debug"],
    src: "/games/bat-bo/index.html",
  },
  {
    id: "hoa-si-rua",
    title: "Họa Sĩ Rùa",
    emoji: "🐢",
    subject: "lap-trinh",
    description: "Viết lệnh cho rùa vẽ hình",
    skills: ["Vòng lặp", "Góc quay"],
    src: "/games/hoa-si-rua/index.html",
  },
  {
    id: "dau-bep-nhi",
    title: "Đầu Bếp Nhí",
    emoji: "👩‍🍳",
    subject: "lap-trinh",
    description: "Xếp các bước thành công thức nấu ăn",
    skills: ["Thuật toán", "Thứ tự"],
    src: "/games/dau-bep-nhi/index.html",
  },
];

export const getGame = (id: string) => GAMES.find((g) => g.id === id);
