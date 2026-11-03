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
| `/` | Trang chủ, gợi ý game hôm nay theo lớp của bé |
| `/ban-do` | Bản đồ phiêu lưu: Đảo Toán Học và Đảo Lập Trình, tự lọc theo lớp của bé |
| `/choi/[gameId]` | Chơi một game (game chạy trong iframe) |
| `/thu-cung` | Thú cưng ảo: cho ăn, vuốt ve, cửa hàng, chuỗi ngày học |
| `/phu-huynh` | Góc phụ huynh: sao, xu, lượt chơi, chuỗi ngày học, tiến độ theo lớp |

## Các game

23 game, mỗi game ghi các lớp phù hợp theo chương trình GDPT 2018 (`grades` trong `src/lib/games.ts`).
Hồ sơ bé có thể chọn lớp (`profile.grade`, không bắt buộc): bản đồ mặc định lọc theo lớp đó, trang chủ gợi ý
3 game hợp lớp mà bé chưa chơi hoặc chưa đủ 3 sao (`suggestGames` trong `src/lib/games.ts`, xen kẽ toán và lập trình).

| Game | Đảo | Lớp | Dạy gì |
|---|---|---|---|
| 🎈 Bắn Bóng Số | Toán | 1–4 | Tính nhẩm 4 phép tính, chế độ thử thách 60 giây |
| 🕰️ Đồng Hồ Thần Kỳ | Toán | 1–3 | Quay kim, đọc giờ (rưỡi, kém), số La Mã, tính thời gian trôi |
| 🚂 Tàu Hỏa Số | Toán | 1–4 | Giá trị theo hàng, đọc số bằng chữ, so sánh, sắp xếp, làm tròn |
| 🔍 Thám Tử Hình Học | Toán | 1–3 | Nhận biết hình theo tên, màu, số cạnh, góc vuông, cạnh bằng nhau |
| 🛒 Siêu Thị Mini | Toán | 1–3 | Cộng trừ, tính tiền và thối tiền Việt Nam |
| 🌉 Xây Cầu | Toán | 2–3 | Đo bằng thước, cộng độ dài, đổi m – dm – cm |
| 🧁 Bếp Cân Đong | Toán | 2–3 | Đọc cân đồng hồ, ca đong, đổi kg – g, l – ml |
| 🐄 Nông Trại Biểu Đồ | Toán | 2–4 | Đếm, vẽ biểu đồ tranh / cột, đọc biểu đồ, trung bình cộng |
| ⚖️ Cân Thăng Bằng | Toán | 2–4 | Làm quen phương trình (🎁 + 3 = 7) |
| 🍬 Hũ Kẹo May Mắn | Toán | 2–5 | Chắc chắn / có thể / không thể, so sánh khả năng, tỉ số |
| 🍕 Chia Bánh Pizza | Toán | 3–5 | Phân số: tô, đọc, chia đều, so sánh |
| 🌻 Khu Vườn Diện Tích | Toán | 3–5 | Đếm ô, chu vi, diện tích, công thức, tính ngược |
| 🏷️ Cửa Hàng Giảm Giá | Toán | 5 | Số thập phân, phần trăm, tính giá sau giảm |
| 🤖 Robot Tìm Đường | Lập trình | 1–3 | Tuần tự, vòng lặp |
| 🚦 Đèn Giao Thông | Lập trình | 2–4 | NẾU… THÌ…, NGƯỢC LẠI, thứ tự ưu tiên |
| 👩‍🍳 Đầu Bếp Nhí | Lập trình | 2–4 | Thuật toán: sắp thứ tự các bước, bước nào phụ thuộc bước nào, loại bước thừa |
| 🧵 Thợ Dệt Hoa Văn | Lập trình | 2–5 | Quy luật, vòng lặp, vòng lặp lồng nhau, hàm |
| 🐞 Bắt Bọ | Lập trình | 3–5 | Tìm và sửa lỗi chương trình (debug) |
| 🐢 Họa Sĩ Rùa | Lập trình | 3–5 | Vẽ hình bằng lệnh, vòng lặp, góc quay |
| 🎬 Thị Trấn Sự Kiện | Lập trình | 3–5 | Sự kiện như Scratch: cờ xanh, bấm vào nhân vật, phím, gửi / nhận tin |
| 💡 Bóng Đèn Nhị Phân | Lập trình | 3–5 | Số nhị phân (hoạt động "Đếm chấm" của CS Unplugged), mật thư |
| 📏 Xếp Hàng Thông Minh | Lập trình | 3–5 | Sắp xếp nổi bọt, tìm kiếm tuần tự và tìm kiếm nhị phân |
| 📦 Rô-bốt Nhà Kho | Lập trình | 4–5 | Biến: gán, cộng dồn, biến trong vòng lặp, đổi chỗ hai biến |

## Cấu trúc

```
public/games/<game-id>/     mỗi game là một trang HTML/CSS/JS độc lập
public/games/shared/        khủng long cổ vũ và đọc to (mascot.js/.css), bridge.js gửi kết quả về website,
                            kit.js/.css khung chung cho game mới (chọn màn, bảng thắng, âm thanh, nút đáp án)
src/lib/games.ts            danh sách game và đảo; game không có `src` hiện "Sắp ra mắt"
src/lib/progress.ts         lưu tiến độ trong localStorage
src/lib/cloud.ts            đăng nhập OTP và đồng bộ tiến độ với Supabase (bảng trong supabase/schema.sql)
src/lib/pet.ts              thú cưng: loài, thức ăn, đồ trong cửa hàng, cách chỉ số giảm theo giờ
src/lib/useNow.ts           đồng hồ dùng chung (chỉ đọc giờ trên trình duyệt)
scripts/check-levels.mjs    kiểm tra màn chơi: đọc đoạn giữa `// LEVELS-START` và `// LEVELS-END` trong game.js
```

## Thêm một game mới

1. Tạo `public/games/<game-id>/index.html`, `style.css`, `game.js`. Nên chép một game dùng kit (vd. `dong-ho`) làm khung.
2. Nạp `../shared/mascot.css`, `../shared/kit.css`, rồi `../shared/mascot.js`, `../shared/bridge.js`, `../shared/kit.js`.
   Trang chỉ cần `<div id="stage">` chứa phần chơi; kit tự dựng màn chọn màn, thanh trên, khủng long và bảng thắng.
3. Trong `game.js`: `const game = createGame({ id, title, sub, levels, unit, winTitle, start(idx) })`.
   Dùng `game.say()`, `game.sfx.good()`, `game.rounds(i, n)`, `await game.wait(ms)` (trả `false` nếu bé đã rời màn),
   `renderChoices(el, labels, onPick)`, và gọi `game.win({ stars, eq, text })` khi xong màn. Kit tự lưu sao
   (`<game-id>-progress`) và gọi `reportResult`; website cộng 5 xu cho mỗi sao, thêm 10 xu cho game đầu tiên trong ngày.
4. Khai báo game trong `src/lib/games.ts` (kèm `src` và `grades`).
5. Đặt dữ liệu màn chơi giữa `// LEVELS-START` và `// LEVELS-END` (không dùng DOM)
   rồi thêm phần kiểm tra vào `scripts/check-levels.mjs`. Game sinh đề ngẫu nhiên thì để hàm sinh đề nhận `rand`
   để script kiểm tra hàng nghìn đề với hạt giống cố định.
6. Khi bắt đầu màn, đặt lại mọi cờ đang chạy (`busy`, `running`): bé có thể bấm 🗺️ giữa lúc game đang chạy hiệu ứng.

## Đọc to

`mascot.js` đọc to mọi lời khủng long bằng giọng tiếng Việt của trình duyệt (Web Speech API), bé chạm vào bong bóng
để nghe lại. Nếu máy không có giọng tiếng Việt thì im lặng (không đọc bằng giọng tiếng Anh). Nút "Đọc to" trên thanh
chơi game lưu lựa chọn vào localStorage `bhv-read-aloud`.

## Lưu ý

- Bản Next.js này (16, Cache Components) khác bản cũ, đọc `node_modules/next/dist/docs/` trước khi sửa.
  Không gọi `Date.now()` khi render component (dùng `useNow`); đọc `params` bên trong `<Suspense>`.
- Thám Tử Hình Học: không đặt manh mối gọi tên "hình chữ nhật"/"hình thoi" cạnh hình vuông (hình vuông
  cũng là hai loại đó), `check:levels` sẽ báo lỗi. Số cạnh, góc vuông được tính từ tọa độ đỉnh.
- Đèn vàng trong Đèn Giao Thông chấp nhận cả "Đi chậm" lẫn "Dừng lại", vì luật Việt Nam yêu cầu dừng.
- Nếu server dev hiện lỗi hydration do HTML cũ, khởi động lại `npm run dev`.

## Việc tiếp theo

- Một tài khoản phụ huynh quản lý nhiều bé (hiện mỗi tài khoản một hồ sơ bé).
- Thêm game cho lớp 1 (hiện chỉ 6 game, 1 game lập trình) và các chủ đề lớp 4–5 còn thiếu: góc, thể tích, vận tốc.
- Thêm lớp học cho giáo viên.
