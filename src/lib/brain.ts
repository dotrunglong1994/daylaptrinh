// Phòng Tập Trí Não: game cho người lớn, tách riêng khỏi bản đồ của bé (không tính sao, xu).
// Mỗi game nằm trong public/games/<id>/ và dùng khung public/games/shared/brain.js.

export type BrainGame = {
  id: string;
  title: string;
  emoji: string;
  /** Kỹ năng não bộ được luyện */
  skill: string;
  description: string;
  /** Mỗi lượt kéo dài khoảng bao lâu */
  minutes: string;
  src: string;
};

export const BRAIN_GAMES: BrainGame[] = [
  {
    id: "nho-o-sang",
    title: "Nhớ Ô Sáng",
    emoji: "🟦",
    skill: "Trí nhớ",
    description: "Nhớ thứ tự các ô sáng lên rồi bấm lại đúng thứ tự. Dãy dài dần.",
    minutes: "2–4 phút",
    src: "/games/nho-o-sang/index.html",
  },
  {
    id: "mau-va-chu",
    title: "Màu Và Chữ",
    emoji: "🎨",
    skill: "Tập trung",
    description: "Chọn màu của chữ, không phải nghĩa của chữ. Càng nhanh càng nhiều điểm.",
    minutes: "1 phút",
    src: "/games/mau-va-chu/index.html",
  },
  {
    id: "tinh-nham-nhanh",
    title: "Tính Nhẩm Nhanh",
    emoji: "⚡",
    skill: "Tốc độ",
    description: "Giải liên tục các phép tính trong 60 giây, đúng nhiều thì đề khó dần.",
    minutes: "1 phút",
    src: "/games/tinh-nham-nhanh/index.html",
  },
  {
    id: "nho-lui",
    title: "Nhớ Lùi N Bước",
    emoji: "🔁",
    skill: "Trí nhớ làm việc",
    description: "Bấm khi ô hiện tại trùng với ô cách đó N lượt. Làm tốt thì N tăng lên.",
    minutes: "2–3 phút",
    src: "/games/nho-lui/index.html",
  },
];

export const getBrainGame = (id: string) => BRAIN_GAMES.find((g) => g.id === id);
