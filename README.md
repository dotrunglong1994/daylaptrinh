# Bé Học Vui

Website giúp trẻ 6–10 tuổi học **toán** và **lập trình** qua trò chơi. Bé chơi game để nhận sao và xu, dùng xu nuôi thú cưng ảo; phụ huynh xem tiến độ ở trang riêng.

## Chạy dự án

```bash
npm install
npm run dev            # mở http://localhost:3000
npm run lint           # kiểm tra code
npm run check:levels   # kiểm tra dữ liệu màn chơi của các game
npm run test:games     # mở từng game trên Chrome không giao diện, tự bấm chơi màn 1, báo lỗi JavaScript
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
| `/` | Trang chủ: thử thách hôm nay (3 game), thi đua anh chị em (từ 2 bé), gợi ý game theo lớp của bé |
| `/ban-do` | Bản đồ phiêu lưu: Đảo Toán Học và Đảo Lập Trình, tự lọc theo lớp của bé |
| `/choi/[gameId]` | Chơi một game (game chạy trong iframe) |
| `/thu-cung` | Thú cưng ảo: cho ăn, vuốt ve, hành trình tuần (rương đồ hiếm), cửa hàng, chuỗi ngày học |
| `/huy-hieu` | Huy hiệu bé đã đạt và tiến độ các huy hiệu còn lại (nút 🏅 trên thanh trên) |
| `/phu-huynh` | Góc phụ huynh: chọn bé để xem, sao, xu, lượt chơi, báo cáo 7 ngày qua, tiến độ theo lớp, xóa tiến độ / hồ sơ bé |
| `/tri-nao` | Phòng Tập Trí Não cho người lớn: kỷ lục, điểm hôm nay, chuỗi ngày tập |
| `/tri-nao/[gameId]` | Chơi một game trí não |

## Các game

34 game, mỗi game ghi các lớp phù hợp theo chương trình GDPT 2018 (`grades` trong `src/lib/games.ts`).
Hồ sơ bé có thể chọn lớp (`profile.grade`, không bắt buộc): bản đồ mặc định lọc theo lớp đó, trang chủ gợi ý
3 game hợp lớp mà bé chưa chơi hoặc chưa đủ 3 sao (`suggestGames` trong `src/lib/games.ts`, xen kẽ toán và lập trình).

| Game | Đảo | Lớp | Dạy gì |
|---|---|---|---|
| 🏠 Ngôi Nhà Số | Toán | 1 | Đếm đến 10 (chạm để đếm), so sánh, tách gộp số, cộng trừ trong 10, vị trí trên/dưới/trái/phải |
| 🎈 Bắn Bóng Số | Toán | 1–4 | Tính nhẩm 4 phép tính, chế độ thử thách 60 giây |
| 🕰️ Đồng Hồ Thần Kỳ | Toán | 1–3 | Quay kim, đọc giờ (rưỡi, kém), số La Mã, tính thời gian trôi |
| 📅 Tờ Lịch Nhà Bé | Toán | 1–3 | Các ngày trong tuần, đọc tờ lịch bóc, xem lịch tháng (thứ của một ngày, chạm vào ngày, đếm ngày Chủ nhật), tuần trước / tuần sau, mẹo nắm tay đếm số ngày trong tháng (30 hay 31, không hỏi tháng 2), đếm ngày đến sinh nhật |
| 🚂 Tàu Hỏa Số | Toán | 1–4 | Giá trị theo hàng, đọc số bằng chữ, so sánh, sắp xếp, làm tròn |
| 🔍 Thám Tử Hình Học | Toán | 1–3 | Nhận biết hình theo tên, màu, số cạnh, góc vuông, cạnh bằng nhau |
| 🛒 Siêu Thị Mini | Toán | 1–3 | Cộng trừ, tính tiền và thối tiền Việt Nam |
| 🌉 Xây Cầu | Toán | 2–3 | Đo bằng thước, cộng độ dài, đổi m – dm – cm |
| 🧁 Bếp Cân Đong | Toán | 2–3 | Đọc cân đồng hồ, ca đong, đổi kg – g, l – ml |
| 🐄 Nông Trại Biểu Đồ | Toán | 2–4 | Đếm, vẽ biểu đồ tranh / cột, đọc biểu đồ, trung bình cộng |
| 🏭 Nhà Máy Cửu Chương | Toán | 2–3 | Nhân là cộng lặp lại, bảng nhân và bảng chia 2–9 (máy chia kẹo vào hộp), tìm số còn thiếu, chia có dư, toán có lời văn; câu sai được hỏi lại cuối màn |
| ⚖️ Cân Thăng Bằng | Toán | 2–4 | Làm quen phương trình (🎁 + 3 = 7) |
| 🍬 Hũ Kẹo May Mắn | Toán | 2–5 | Chắc chắn / có thể / không thể, so sánh khả năng, tỉ số |
| 🍕 Chia Bánh Pizza | Toán | 3–5 | Phân số: tô, đọc, chia đều, so sánh |
| 🌻 Khu Vườn Diện Tích | Toán | 3–5 | Đếm ô, chu vi, diện tích, công thức, tính ngược |
| 📐 Thước Đo Góc | Toán | 4–5 | Góc nhọn/vuông/tù/bẹt, đọc thước đo độ (hai vòng số), xoay tia, góc kim đồng hồ, góc còn thiếu |
| 🧊 Kho Hộp Lập Phương | Toán | 5 | Đếm khối lập phương, xếp đầy hộp, thể tích hình hộp và hình lập phương, đổi cm³ – dm³ – m³ – lít, bể nước |
| 🏎️ Đường Đua Vận Tốc | Toán | 5 | Quãng đường, vận tốc, thời gian; chỉnh tốc độ cho xe về đích đúng giờ; giờ và phút; hai xe ngược chiều, đuổi kịp |
| 🏷️ Cửa Hàng Giảm Giá | Toán | 5 | Số thập phân, phần trăm, tính giá sau giảm |
| 🕵️ Thám Tử Đề Bài | Toán | 1–5 | Toán có lời văn theo 3 bước: chạm vào số cần dùng (có manh mối thừa), chọn phép tính, tìm đáp số; thêm bớt, nhiều hơn / ít hơn, nhân chia, gấp / giảm, hai bước tính, trung bình cộng, tổng – hiệu, rút về đơn vị |
| 📝 Bài Kiểm Tra | Toán | 1–5 | Mỗi lớp 10 câu trộn toán và lập trình, mỗi câu trả lời một lần; đúng từ 8 câu có bằng khen để in (mọi lớp mở sẵn) |
| 🐸 Chú Ếch Nhảy | Lập trình | 1–2 | Đọc lệnh (ếch dừng ở đâu), quy luật mũi tên, chọn chương trình đúng, xếp lệnh, sửa một lệnh sai |
| 🤖 Robot Tìm Đường | Lập trình | 1–3 | Tuần tự, vòng lặp |
| 🚦 Đèn Giao Thông | Lập trình | 2–4 | NẾU… THÌ…, NGƯỢC LẠI, thứ tự ưu tiên |
| 👩‍🍳 Đầu Bếp Nhí | Lập trình | 2–4 | Thuật toán: sắp thứ tự các bước, bước nào phụ thuộc bước nào, loại bước thừa |
| 🧵 Thợ Dệt Hoa Văn | Lập trình | 2–5 | Quy luật, vòng lặp, vòng lặp lồng nhau, hàm |
| 🐞 Bắt Bọ | Lập trình | 3–5 | Tìm và sửa lỗi chương trình (debug) |
| 🐢 Họa Sĩ Rùa | Lập trình | 3–5 | Vẽ hình bằng lệnh, vòng lặp, góc quay |
| 🎬 Thị Trấn Sự Kiện | Lập trình | 3–5 | Sự kiện như Scratch: cờ xanh, bấm vào nhân vật, phím, gửi / nhận tin |
| 💡 Bóng Đèn Nhị Phân | Lập trình | 3–5 | Số nhị phân (hoạt động "Đếm chấm" của CS Unplugged), mật thư |
| 📏 Xếp Hàng Thông Minh | Lập trình | 3–5 | Sắp xếp nổi bọt, tìm kiếm tuần tự và tìm kiếm nhị phân |
| 🚃 Tàu Danh Sách | Lập trình | 4–5 | Danh sách: toa thứ mấy, độ dài, thêm / xóa toa, vòng lặp tính tổng, đếm theo điều kiện, tìm lớn nhất |
| 🚪 Cổng Logic | Lập trình | 4–5 | Điều kiện VÀ / HOẶC / KHÔNG: ai qua cổng, chọn mọi bạn qua cổng, Đúng hay Sai, tìm luật của cổng |
| 📦 Rô-bốt Nhà Kho | Lập trình | 4–5 | Biến: gán, cộng dồn, biến trong vòng lặp, đổi chỗ hai biến |

## Nhiều bé trong một tài khoản

- `localStorage["dlt-family-v2"]` (và cột `data` trên Supabase) lưu cả nhà: `{ version: 2, kids: KidData[], brain, brainDaily, savedAt }`.
  Mỗi bé (`KidData`) có hồ sơ, sao, xu, thú cưng, nhật ký, thử thách, huy hiệu, hành trình riêng; điểm trí não dùng chung.
- Bé đang chơi trên máy này lưu ở `localStorage["bhv-kid"]` (không đồng bộ). `useProgress()` trả về tiến độ của bé đó
  cộng phần dùng chung, nên các trang đọc `progress.profile`, `progress.games`… như cũ. `switchKid`, `addKid`, `removeKid`
  trong `src/lib/progress.ts`.
- Dữ liệu cũ một bé (`dlt-progress-v1`, hoặc bản cũ trên tài khoản) được `normalize()` đổi thành bé `k1`.
- Tiến độ chọn màn trong game cũng tách theo bé: game gọi `kidKey(key)` (trong `shared/bridge.js`) khi đọc/ghi localStorage.
  Bé `k1` dùng khóa cũ để giữ tiến độ đã có.
- Có từ 2 bé thì mở web sẽ hỏi "Ai đang chơi?" (mỗi phiên một lần); bấm vào tên bé ở góc trên để đổi bé, thêm bé, sửa hồ sơ.

## Thử thách, huy hiệu, báo cáo tuần

- Mỗi lượt chơi được ghi vào `progress.log` (`{ d: ngày, g: id game, s: sao }`, giữ 400 lượt gần nhất).
- **Thử thách hằng ngày** (`src/lib/challenge.ts`, `DailyChallenge.tsx`): mỗi ngày 3 game cố định theo ngày và lớp của bé,
  có cả toán lẫn lập trình. Chơi xong cả 3 (ít nhất 1 sao) thì `recordResult` cộng thêm 30 xu, mỗi ngày một lần
  (`progress.challenge = { day, count, days }`). Một suất là **game cần ôn lại**: game bé đã chơi trước hôm nay, chưa
  đạt 3 sao và đã ít nhất 2 ngày chưa chơi lại (`reviewGame`), hiện nhãn "🔁 Ôn lại".
- **Hành trình tuần** (`src/lib/journey.ts`, `Journey.tsx`): mỗi ngày xong thử thách thú cưng đi một chặng (tuần từ thứ Hai).
  Đủ 5 chặng mở rương: một món đồ hiếm (`RARE_ITEMS` trong `pet.ts`, không bán) hoặc 50 xu nếu đã có đủ.
- **Huy hiệu** (`src/lib/badges.ts`): mỗi huy hiệu có `measure(data) → [đã làm, cần đạt]`. Đạt rồi thì lưu ngày đạt vào
  `progress.badges`, giữ mãi kể cả khi chuỗi ngày học bị đứt. Kiểm tra sau mỗi lượt chơi và khi mở `/huy-hieu`
  (`syncBadges`, để bắt các huy hiệu như thú cưng lớn lên). Bé thấy thông báo huy hiệu mới ngay sau khi chơi.
- **Báo cáo 7 ngày** (`WeeklyReport.tsx`, Góc phụ huynh): số ngày có học, lượt chơi so với tuần trước, biểu đồ lượt chơi
  mỗi ngày, game bé làm tốt / cần luyện thêm, game nên chơi tiếp.

## Gợi ý, pháo giấy, nhạc nền (kit.js)

- `renderChoices(el, labels, onPick, isRight)`: truyền `isRight(i)` thì khi bé chọn sai, khủng long cất bớt một đáp án sai
  (chỉ khi còn từ 3 đáp án, để không lộ đáp án). Lời gợi ý từng bước vẫn do từng game nói qua `game.say`.
- Được 3 sao thì có pháo giấy. Nút 🎵 bật nhạc nền nhẹ (mặc định tắt, nhớ ở `localStorage["bhv-music"]`).
- `createGame({ free: true, levelLabel })`: mở sẵn mọi màn và đổi chữ trên nút chọn màn (dùng cho Bài Kiểm Tra).

## Phòng Tập Trí Não (người lớn)

| Game | Kỹ năng | Cách chơi |
|---|---|---|
| 🟦 Nhớ Ô Sáng | Trí nhớ | Nhớ thứ tự các ô sáng, bấm lại; dãy dài dần, 3 mạng |
| 🎨 Màu Và Chữ | Tập trung | Chọn màu của chữ (không phải nghĩa), 60 giây, có lúc đổi luật |
| ⚡ Tính Nhẩm Nhanh | Tốc độ | Phép tính liên tục trong 60 giây, khó dần theo chuỗi đúng |
| 🔁 Nhớ Lùi N Bước | Trí nhớ làm việc | Bấm khi ô hiện tại trùng ô cách đó N bước; N tự tăng giảm |
| 🃏 Lật Thẻ Nhớ | Trí nhớ hình ảnh | Lật hai thẻ tìm cặp giống nhau, bàn lớn dần, tìm liền nhiều cặp được thưởng; 90 giây |
| 🧩 Suy Luận Thứ Tự | Logic | Đọc manh mối "An cao hơn Bình"… rồi chạm tên đúng thứ tự; đúng liền thì thêm người; 120 giây |

Danh sách trong `src/lib/brain.ts`. Game dùng khung `public/games/shared/brain.js/.css` (màn giới thiệu, đếm ngược,
màn kết quả, kỷ lục `<game-id>-best`), gửi điểm qua `bridge.js`; website lưu vào `progress.brain` (kỷ lục, lượt chơi,
điểm cao nhất mỗi ngày trong 30 ngày) và `progress.brainDaily` (chuỗi ngày tập), đồng bộ Supabase cùng tiến độ của bé
nhưng không cộng sao, xu. "Xóa tiến độ" ở Góc phụ huynh giữ lại điểm trí não.

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
src/lib/brain.ts            danh sách game Phòng Tập Trí Não
scripts/check-levels.mjs    kiểm tra màn chơi: đọc đoạn giữa `// LEVELS-START` và `// LEVELS-END` trong game.js
scripts/checks/<id>.mjs     kiểm tra riêng của từng game mới, check-levels tự nạp (export default ({ loadSection, report, seeded, optionsOk }))
```

## Kiểm thử game trên trình duyệt (`npm run test:games`)

`scripts/smoke-games.mjs` tự phục vụ thư mục `public/`, mở Chrome hoặc Edge không giao diện qua CDP (không cần
cài thêm gói, cần Node 22 hoặc `node --experimental-websocket` với Node 20) rồi với mỗi game trong `src/lib/games.ts`
và `src/lib/brain.ts`: vào màn 1 (hoặc bấm Bắt đầu), để "bé ảo" bấm ngẫu nhiên các nút trong phần chơi tới khi thắng
hoặc hết giờ. Game nào có lỗi JavaScript hay `console.error` thì báo ✗ và lệnh trả mã lỗi 1. "Chưa thắng sau … giây"
không phải lỗi: nhiều game cần kéo thả hoặc suy nghĩ nhiều bước nên bấm ngẫu nhiên không thắng được.

- Không tìm thấy trình duyệt: đặt biến `CHROME_PATH` tới file `chrome.exe` / `msedge.exe`.
- Chỉ thử vài game: `npm run test:games -- --only=dong-ho,ban-bong-so`. Đổi thời gian mỗi game: `--seconds=30`.
- Chạy hết khoảng 8–9 phút.

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

- Thêm lớp học cho giáo viên.
