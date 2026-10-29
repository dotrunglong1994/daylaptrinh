# Bé Học Vui

Website giúp trẻ 6–10 tuổi học **toán** và **lập trình** qua trò chơi. Bé chơi game để nhận sao và xu, dùng xu nuôi thú cưng ảo; phụ huynh xem tiến độ ở trang riêng.

## Chạy dự án

```bash
npm install
npm run dev            # mở http://localhost:3000
npm run lint           # kiểm tra code
npm run check:levels   # kiểm tra dữ liệu màn chơi của các game
npm run build          # build production
```

## Tài khoản phụ huynh (không bắt buộc)

Mặc định tiến độ chỉ lưu trong trình duyệt, không cần đăng nhập. Nếu cấu hình Supabase, Góc phụ huynh hiện thêm
phần đăng nhập bằng mã OTP gửi qua email để đồng bộ tiến độ giữa các máy.

1. Chép `.env.example` thành `.env.local`, điền Project URL (`https://<ref>.supabase.co`) và anon key.
2. Supabase → SQL Editor: chạy `supabase/schema.sql` (tạo bảng `progress` có RLS, mỗi tài khoản một dòng).
3. Supabase → Authentication → Emails → mẫu **Magic Link**: thêm `{{ .Token }}` để email có mã số.
   Bấm vào liên kết trong email cũng đăng nhập được.
4. Supabase → Authentication → URL Configuration: thêm địa chỉ website (vd. `http://localhost:3000/**`) vào Redirect URLs.
5. Khởi động lại `npm run dev` để nạp biến môi trường.

Cách đồng bộ (`src/lib/cloud.ts`): localStorage vẫn là nơi lưu chính, mỗi lần ghi sẽ đẩy lên sau 1,5 giây.
Khi đăng nhập hoặc quay lại tab, bản nào có `savedAt` mới hơn sẽ thắng. Lần đầu nối một máy đã có dữ liệu với
tài khoản cũng đã có dữ liệu khác, website hỏi phụ huynh muốn giữ bản nào.
Email miễn phí của Supabase giới hạn vài email mỗi giờ; dùng thật nên cấu hình SMTP riêng.

## Các trang

| Đường dẫn | Nội dung |
|---|---|
| `/` | Trang chủ |
| `/ban-do` | Bản đồ phiêu lưu: Đảo Toán Học và Đảo Lập Trình |
| `/choi/[gameId]` | Chơi một game (game chạy trong iframe) |
| `/thu-cung` | Thú cưng ảo: cho ăn, vuốt ve, cửa hàng, chuỗi ngày học |
| `/phu-huynh` | Góc phụ huynh: sao, xu, lượt chơi, chuỗi ngày học |

## Các game

| Game | Đảo | Dạy gì |
|---|---|---|
| 🎈 Bắn Bóng Số | Toán | Tính nhẩm 4 phép tính, chế độ thử thách 60 giây |
| 🛒 Siêu Thị Mini | Toán | Cộng trừ, tính tiền và thối tiền Việt Nam |
| 🍕 Chia Bánh Pizza | Toán | Phân số: tô, đọc, chia đều, so sánh |
| ⚖️ Cân Thăng Bằng | Toán | Làm quen phương trình (🎁 + 3 = 7) |
| 🔍 Thám Tử Hình Học | Toán | Nhận biết hình theo tên, màu, số cạnh, góc vuông, cạnh bằng nhau |
| 🌉 Xây Cầu | Toán | Đo bằng thước, cộng độ dài, đổi m – dm – cm |
| 🤖 Robot Tìm Đường | Lập trình | Tuần tự, vòng lặp |
| 🚦 Đèn Giao Thông | Lập trình | NẾU… THÌ…, NGƯỢC LẠI, thứ tự ưu tiên |
| 🐞 Bắt Bọ | Lập trình | Tìm và sửa lỗi chương trình (debug) |
| 🐢 Họa Sĩ Rùa | Lập trình | Vẽ hình bằng lệnh, vòng lặp, góc quay |
| 👩‍🍳 Đầu Bếp Nhí | Lập trình | Thuật toán: sắp thứ tự các bước, bước nào phụ thuộc bước nào, loại bước thừa |

## Cấu trúc

```
public/games/<game-id>/     mỗi game là một trang HTML/CSS/JS độc lập
public/games/shared/        khủng long cổ vũ (mascot.js/.css) và bridge.js gửi kết quả về website
src/lib/games.ts            danh sách game và đảo; game không có `src` hiện "Sắp ra mắt"
src/lib/progress.ts         lưu tiến độ trong localStorage
src/lib/cloud.ts            đăng nhập OTP và đồng bộ tiến độ với Supabase (bảng trong supabase/schema.sql)
src/lib/pet.ts              thú cưng: loài, thức ăn, đồ trong cửa hàng, cách chỉ số giảm theo giờ
src/lib/useNow.ts           đồng hồ dùng chung (chỉ đọc giờ trên trình duyệt)
scripts/check-levels.mjs    kiểm tra màn chơi: đọc đoạn giữa `// LEVELS-START` và `// LEVELS-END` trong game.js
```

## Thêm một game mới

1. Tạo `public/games/<game-id>/index.html`, `style.css`, `game.js`. Nên chép một game có sẵn làm khung.
2. Nạp `../shared/mascot.css`, `../shared/mascot.js`, `../shared/bridge.js`.
3. Khi bé chơi xong, gọi `window.reportResult?.({ gameId, stars, score, progressText? })`.
   Website cộng 5 xu cho mỗi sao, và thêm 10 xu cho game đầu tiên trong ngày.
4. Khai báo game trong `src/lib/games.ts` (kèm `src`).
5. Nếu game có dữ liệu màn chơi, đặt nó giữa `// LEVELS-START` và `// LEVELS-END` (không dùng DOM)
   rồi thêm phần kiểm tra vào `scripts/check-levels.mjs`.

## Lưu ý

- Bản Next.js này (16, Cache Components) khác bản cũ, đọc `node_modules/next/dist/docs/` trước khi sửa.
  Không gọi `Date.now()` khi render component (dùng `useNow`); đọc `params` bên trong `<Suspense>`.
- Thám Tử Hình Học: không đặt manh mối gọi tên "hình chữ nhật"/"hình thoi" cạnh hình vuông (hình vuông
  cũng là hai loại đó), `check:levels` sẽ báo lỗi. Số cạnh, góc vuông được tính từ tọa độ đỉnh.
- Đèn vàng trong Đèn Giao Thông chấp nhận cả "Đi chậm" lẫn "Dừng lại", vì luật Việt Nam yêu cầu dừng.
- Nếu server dev hiện lỗi hydration do HTML cũ, khởi động lại `npm run dev`.

## Việc tiếp theo

- Một tài khoản phụ huynh quản lý nhiều bé (hiện mỗi tài khoản một hồ sơ bé).
- Thêm game, ví dụ Xem đồng hồ, So sánh số / làm tròn, Vòng lặp lồng nhau.
- Bám theo chương trình SGK, thêm lớp học cho giáo viên.
