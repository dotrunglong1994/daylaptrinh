# CLAUDE.md

@AGENTS.md
@README.md

README ở trên mô tả trang, danh sách game, cấu trúc thư mục và cách thêm game. File này chỉ ghi thêm những điều
cần biết khi làm việc trong repo.

## Giao tiếp

- Trả lời và viết mọi nội dung game/website bằng tiếng Việt, câu chữ đơn giản cho trẻ 6–10 tuổi.
- Người dùng hay chỉ gõ "tiếp" / "làm tiếp": nghĩa là làm bước đã đề xuất ở cuối lượt trước. Vì vậy cuối mỗi lượt
  hãy đề xuất rõ **một** bước kế tiếp ưu tiên.

## Trước khi báo xong

Chạy cả ba lệnh, tất cả phải qua:

```bash
npm run lint
npm run check:levels
npm run build
```

Game mới hoặc game sửa logic: chơi thử thật trên trình duyệt (xem phần Kiểm thử), không chỉ dựa vào lint/build.

## Kiểm thử trên trình duyệt

- Tiện ích Claude in Chrome có thể không kết nối. Khi đó dùng Chrome headless + CDP bằng Node 20
  (`node --experimental-websocket`), mở Chrome với cờ `--disable-background-timer-throttling`, và gọi
  `Page.bringToFront` + `Emulation.setFocusEmulationEnabled({ enabled: true })` trước khi chạy: nếu
  `document.visibilityState` là `hidden` thì timer bị hãm còn 1 giây/lần, game có hiệu ứng chạy chậm, test sai.
- Không chạy hai script CDP cùng lúc (chúng dùng chung một tab). Không pipe output qua `grep` (bị đệm, trông như treo).
- Biến `const` ở top-level của `game.js` gọi được qua `Runtime.evaluate`, nên dễ viết "người giải tự động" để
  chơi hết các màn.
- Dữ liệu thử trên localhost là hồ sơ "Bé Test" (thú cưng Bông).
- Lỗi hydration do HTML cũ khi chạy dev: khởi động lại `npm run dev`.

## Git và triển khai

- Remote: `git@github.com:dotrunglong1994/daylaptrinh.git`, đẩy bằng SSH. Máy không có `gh` hay `vercel` CLI.
- Nhánh mặc định là `master`; làm việc trên `feature/hoc-qua-tro-choi` rồi gộp (fast-forward) vào `master`.
- Thông điệp commit viết tiếng Việt, ngắn gọn, mô tả việc đã làm (xem `git log`).
- Vercel tự deploy khi đẩy `master`: https://daylaptrinh.vercel.app. Kiểm tra sau deploy bằng `curl` các đường dẫn
  `/games/<id>/index.html` và các trang chính.
- `.env.local` chứa URL + anon key Supabase, **không commit**. Biến cần có xem `.env.example`.

## Quy ước code

- Next.js 16 (Cache Components) khác bản cũ: đọc `node_modules/next/dist/docs/` trước khi sửa phần Next.
  Không gọi `Date.now()` khi render (dùng `useNow`); đọc `params` bên trong `<Suspense>`.
- Game nằm trong `public/games/<id>/` là HTML/CSS/JS thuần, không build. Game của bé dùng khung `shared/kit.js`,
  game người lớn (Phòng Tập Trí Não, `src/lib/brain.ts`) dùng `shared/brain.js`. Hai loại không lẫn: game trí não
  không cộng sao/xu, giao diện tối dành cho người lớn.
- Kiểm tra màn chơi của game mới đặt ở `scripts/checks/<id>.mjs` (không phải sửa chung `check-levels.mjs`), nhờ vậy
  nhiều agent viết game song song không đụng file của nhau.
- Mỗi game khai báo `grades` (lớp 1–5 theo chương trình GDPT 2018) trong `src/lib/games.ts`.
- Dữ liệu màn chơi đặt giữa `// LEVELS-START` và `// LEVELS-END`, không đụng DOM, và luôn có phần kiểm tra trong
  `scripts/check-levels.mjs`.
- Tiến độ lưu localStorage là chính; Supabase (đăng nhập OTP email) chỉ là tùy chọn đồng bộ. Không làm website phụ
  thuộc vào việc đăng nhập.

## Kế hoạch còn lại

1. Một tài khoản phụ huynh quản lý nhiều bé (mỗi bé có lớp riêng; log, huy hiệu, thử thách cũng tách theo bé).
2. Thêm game cho Phòng Tập Trí Não (vd. tìm cặp hình, logic sắp xếp).
3. Cấu hình SMTP riêng cho Supabase (email miễn phí bị giới hạn vài email/giờ).
4. Lớp học cho giáo viên.
5. Lỗi có sẵn: overlay dev của Next báo một issue ở `useCloud` (`src/lib/cloud.ts`), chưa xem kỹ.
