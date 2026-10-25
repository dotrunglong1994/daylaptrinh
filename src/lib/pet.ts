// Danh mục thú cưng, thức ăn, phụ kiện và cách tính chỉ số theo thời gian.

export type SpeciesId = "cun" | "meo" | "tho" | "gau-truc";
export type ItemSlot = "hat" | "face" | "bg";

export type PetState = {
  species: SpeciesId;
  name: string;
  fullness: number; // 0–100, no bụng
  happiness: number; // 0–100, vui vẻ
  xp: number;
  /** thời điểm fullness/happiness được tính lần cuối */
  updatedAt: string;
  lastPettedAt?: string;
  equipped: Partial<Record<ItemSlot, string>>;
};

export const SPECIES: { id: SpeciesId; emoji: string; name: string }[] = [
  { id: "cun", emoji: "🐶", name: "Cún" },
  { id: "meo", emoji: "🐱", name: "Mèo" },
  { id: "tho", emoji: "🐰", name: "Thỏ" },
  { id: "gau-truc", emoji: "🐼", name: "Gấu trúc" },
];

export const FOODS = [
  { id: "tao", emoji: "🍎", name: "Táo", price: 5, fill: 15, joy: 0 },
  { id: "com", emoji: "🍙", name: "Cơm nắm", price: 10, fill: 30, joy: 5 },
  { id: "banh-kem", emoji: "🎂", name: "Bánh kem", price: 20, fill: 45, joy: 20 },
] as const;

export type ShopItem = { id: string; slot: ItemSlot; emoji: string; name: string; price: number; bg?: string };

export const ITEMS: ShopItem[] = [
  { id: "no", slot: "hat", emoji: "🎀", name: "Nơ xinh", price: 25 },
  { id: "mu-luoi-trai", slot: "hat", emoji: "🧢", name: "Mũ lưỡi trai", price: 30 },
  { id: "mu-phu-thuy", slot: "hat", emoji: "🎩", name: "Mũ ảo thuật", price: 45 },
  { id: "vuong-mien", slot: "hat", emoji: "👑", name: "Vương miện", price: 80 },
  { id: "kinh-ram", slot: "face", emoji: "🕶️", name: "Kính râm", price: 40 },
  { id: "cong-vien", slot: "bg", emoji: "🌳", name: "Công viên", price: 50, bg: "linear-gradient(#b5e48c, #d9ed92)" },
  { id: "bai-bien", slot: "bg", emoji: "🏖️", name: "Bãi biển", price: 60, bg: "linear-gradient(#90e0ef 0 60%, #ffe8a3 60%)" },
  { id: "vu-tru", slot: "bg", emoji: "🌌", name: "Vũ trụ", price: 100, bg: "radial-gradient(circle at 30% 20%, #5a4fcf, #1b1748)" },
];

export const DEFAULT_BG = "linear-gradient(#ffe3ec, #fff0f5)";
export const PET_COOLDOWN_MIN = 30;
export const DAILY_BONUS = 10;

// Mỗi giờ giảm bao nhiêu điểm: bỏ đói khoảng một ngày là bụng đói meo
const FULLNESS_PER_HOUR = 4;
const HAPPINESS_PER_HOUR = 3;

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/** Chỉ số hiện tại sau khi trừ phần đã giảm từ lần cập nhật trước. */
export function petNow(pet: PetState, now: number): PetState {
  const hours = Math.max(0, (now - Date.parse(pet.updatedAt)) / 3_600_000);
  return {
    ...pet,
    fullness: clamp(pet.fullness - hours * FULLNESS_PER_HOUR),
    happiness: clamp(pet.happiness - hours * HAPPINESS_PER_HOUR),
    updatedAt: new Date(now).toISOString(),
  };
}

export function stageOf(xp: number) {
  if (xp >= 300) return { name: "Siêu sao ⭐", scale: 1.15, next: null };
  if (xp >= 100) return { name: "Lớn rồi", scale: 1, next: 300 };
  return { name: "Bé con", scale: 0.8, next: 100 };
}

export function moodOf(pet: PetState) {
  if (pet.fullness < 25) return { text: "Mình đói quá… 🥺", sad: true };
  if (pet.happiness < 25) return { text: "Chơi với mình đi mà! 🥺", sad: true };
  if (pet.fullness >= 70 && pet.happiness >= 70) return { text: "Mình vui lắm! 💕", sad: false };
  return { text: "Hôm nay bé học gì thế? 📚", sad: false };
}

export const speciesOf = (id: SpeciesId) => SPECIES.find((s) => s.id === id) ?? SPECIES[0];
export const itemOf = (id?: string) => ITEMS.find((i) => i.id === id);

/** Ngày theo giờ máy của bé, dạng YYYY-MM-DD. */
export const dayKey = (time: number) => new Date(time).toLocaleDateString("en-CA");
