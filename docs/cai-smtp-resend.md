# Cài email đăng nhập bằng Resend (SMTP miễn phí cho Supabase)

Website gửi **mã đăng nhập** qua email cho phụ huynh (Góc phụ huynh) và thầy cô (Lớp học). Email có sẵn của Supabase
chỉ gửi được **2 email mỗi giờ**, và chỉ tới email của thành viên trong dự án Supabase. Muốn phụ huynh và giáo viên
thật đăng nhập được, cần nối Supabase với một dịch vụ gửi email riêng (SMTP). Hướng dẫn này dùng **Resend**, gói miễn phí.

| | Email có sẵn của Supabase | Resend miễn phí |
|---|---|---|
| Gửi tối đa | 2 email / giờ | 100 email / ngày, 3.000 email / tháng |
| Gửi tới | Chỉ email thành viên dự án | Bất kỳ email nào |
| Cần tên miền riêng | Không | **Có** (vd. `behocvui.vn`) |

Mất khoảng 20–30 phút, cộng thời gian chờ tên miền nhận bản ghi DNS (thường vài phút, lâu nhất vài giờ).

## Bước 0: Chuẩn bị một tên miền

Resend chỉ gửi email từ tên miền bạn sở hữu (không dùng được `daylaptrinh.vercel.app`). Nếu chưa có:

- Mua một tên miền ở nhà đăng ký bất kỳ (Mắt Bão, PA Vietnam, Tenten, Namecheap, Cloudflare…).
  Tên `.com` khoảng 250–350 nghìn đồng / năm, `.vn` đắt hơn.
- Nên chọn nơi cho phép **tự sửa bản ghi DNS** (hầu hết đều có, trong mục "Quản lý DNS").
- Có tên miền rồi thì sau này cũng gắn được vào Vercel để website có địa chỉ đẹp (không bắt buộc cho việc gửi email).

Trong hướng dẫn, tên miền ví dụ là `behocvui.vn`. Bạn thay bằng tên miền của mình.

## Bước 1: Tạo tài khoản Resend và thêm tên miền

1. Vào <https://resend.com>, bấm **Sign up**, đăng ký (có thể đăng nhập bằng Google hoặc GitHub).
2. Ở menu trái chọn **Domains** → **Add Domain**.
3. Nhập tên miền, ví dụ `behocvui.vn`. Vùng (Region) để mặc định, hoặc chọn **Tokyo (ap-northeast-1)** cho gần Việt Nam.
4. Resend hiện một bảng **bản ghi DNS** (thường gồm 1 bản ghi MX và 2–3 bản ghi TXT, có tên như `send`,
   `resend._domainkey`). Để nguyên trang này.

## Bước 2: Thêm bản ghi DNS ở nơi bạn mua tên miền

1. Mở trang quản lý DNS của tên miền (ở nhà đăng ký, hoặc Cloudflare nếu bạn dùng Cloudflare).
2. Với **mỗi dòng** trong bảng của Resend, tạo một bản ghi mới, chép đúng:
   - **Loại** (Type): MX hoặc TXT.
   - **Tên** (Name / Host): vd. `send` hoặc `resend._domainkey`. Một số nơi tự thêm đuôi tên miền, chỉ nhập phần đầu.
   - **Giá trị** (Value / Content): bấm biểu tượng chép bên Resend rồi dán, đừng gõ tay.
   - **Ưu tiên** (Priority) cho bản ghi MX: theo số Resend ghi (thường là 10).
   - Dùng Cloudflare thì để bản ghi ở chế độ **DNS only** (đám mây màu xám).
3. Quay lại Resend, bấm **Verify DNS Records**. Khi mọi dòng chuyển sang **Verified** (màu xanh) là xong.
   Nếu còn "Pending", đợi 10–30 phút rồi bấm lại.

## Bước 3: Tạo khóa API (dùng làm mật khẩu SMTP)

1. Resend → menu trái **API Keys** → **Create API Key**.
2. Tên: `supabase-dang-nhap`. Quyền (Permission): **Sending access**. Domain: chọn tên miền vừa thêm.
3. Bấm **Add**, rồi **chép ngay khóa** (bắt đầu bằng `re_`). Resend chỉ hiện khóa này một lần.
   Không gửi khóa này cho ai và không đưa vào code.

## Bước 4: Nhập SMTP vào Supabase

1. Vào <https://supabase.com/dashboard>, mở dự án của website.
2. Menu trái **Authentication** → **Emails** (mục Notifications) → tab **SMTP Settings**.
3. Bật **Enable custom SMTP**, rồi điền:

   | Ô | Điền |
   |---|---|
   | Sender email | `dangnhap@behocvui.vn` (đuôi phải là tên miền đã xác minh ở Bước 2) |
   | Sender name | `Bé Học Vui` |
   | Host | `smtp.resend.com` |
   | Port number | `465` |
   | Minimum interval between emails | để mặc định (60 giây) |
   | Username | `resend` |
   | Password | khóa `re_...` ở Bước 3 |

4. Bấm **Save changes**.

## Bước 5: Nâng giới hạn gửi email của Supabase

Khi dùng SMTP riêng, Supabase mặc định cho **30 email mỗi giờ**. Đủ cho lúc đầu. Muốn tăng:

1. **Authentication** → **Rate Limits**.
2. Ô **Rate limit for sending emails**: đặt khoảng `60` / giờ. Đừng đặt quá cao, vì Resend miễn phí chỉ gửi 100 email mỗi ngày.
3. Bấm **Save changes**.

## Bước 6: Kiểm tra lại các cài đặt cũ

Những bước này đã có trong README, kiểm tra lại cho chắc:

- **Authentication** → **Emails** → **Templates** → mẫu **Magic Link**: nội dung email có `{{ .Token }}`
  để email hiện mã 6 số. Có thể sửa tiêu đề thành "Mã đăng nhập Bé Học Vui".
- **Authentication** → **URL Configuration**:
  - **Site URL**: `https://daylaptrinh.vercel.app`
  - **Redirect URLs** có `https://daylaptrinh.vercel.app/**` (dấu `**` để cả `/phu-huynh` và `/giao-vien` đều dùng được).
- **SQL Editor**: chạy lại `supabase/schema.sql` nếu chưa chạy sau khi có Lớp học.

## Bước 7: Thử

1. Mở <https://daylaptrinh.vercel.app/phu-huynh> bằng cửa sổ ẩn danh.
2. Ở phần ☁️, nhập một email **không phải** email thành viên Supabase (vd. email của người thân), bấm **Gửi mã**.
3. Email từ `Bé Học Vui <dangnhap@behocvui.vn>` tới trong khoảng 1 phút. Nhập mã là đăng nhập được.
4. Xem email đã gửi ở Resend → **Emails** (thấy trạng thái Delivered / Bounced).

## Gặp lỗi thì xem ở đây

| Hiện tượng | Cách xử lý |
|---|---|
| Website báo "Gửi email nhiều quá…" | Chạm giới hạn ở Bước 5, hoặc gửi lại quá nhanh (phải cách nhau 60 giây). Đợi rồi thử lại. |
| Supabase báo lỗi khi gửi, Resend không có email nào | Sai Username / Password / Port. Username đúng là chữ `resend`, Password là khóa `re_...`. |
| Resend báo "domain is not verified" | Sender email chưa dùng đúng tên miền đã xác minh, hoặc bản ghi DNS chưa Verified. |
| Email vào thư mục Spam | Thêm bản ghi DMARC ở DNS: loại TXT, tên `_dmarc`, giá trị `v=DMARC1; p=none;`. Đợi vài giờ. |
| Bấm liên kết trong email bị báo lỗi chuyển trang | Kiểm tra Redirect URLs ở Bước 6. |

Nguồn (tháng 11/2026): [Resend: Send with Supabase SMTP](https://resend.com/docs/send-with-supabase-smtp),
[Resend: Pricing](https://resend.com/pricing), [Supabase: Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp),
[Supabase: Rate limits](https://supabase.com/docs/guides/auth/rate-limits).
