# Seoulive — Headless WordPress + Next.js

Dự án thương mại điện tử headless: **WordPress** (`seoulive-core` plugin) đóng vai
trò backend/CMS quản lý sản phẩm & đơn hàng, **Next.js** đóng vai trò frontend
hiển thị cho khách hàng.

---

## 1. Yêu cầu hệ thống

- [Local by Flywheel](https://localwp.com/) (hoặc môi trường PHP/MySQL local tương
  đương) — chạy WordPress.
- PHP >= 7.4, MySQL/MariaDB.
- Node.js >= 18, npm.
- 1 tài khoản Gmail (dùng để cấu hình gửi mail qua SMTP).

---

## 2. Cài đặt Backend (WordPress)

### 2.1. Setup site local

1. Mở Local by Flywheel → **Create a new site** → đặt tên site (ví dụ `seoulive`).
2. Chọn PHP >= 7.4, MySQL, Nginx/Apache (mặc định của Local là đủ dùng).
3. Cài WordPress bình thường theo wizard, tạo tài khoản admin.

> ⚠️ Local by Flywheel tự sinh domain riêng cho từng máy theo tên site, ví dụ
> `seoulive.local` hoặc `seoulive-abc.local` — **không phải luôn là `test1.local`**.
> Mọi chỗ trong README này ghi `test1.local` chỉ là ví dụ trên máy gốc tạo dự án.
> Cậu cần thay bằng đúng domain site của máy mình ở mọi nơi xuất hiện biến
> `WP_BASE_URL` / `WP_API_URL` bên dưới.

### 2.2. Cài plugin bắt buộc

Vào **wp-admin → Plugins → Add New**, cài và **kích hoạt** đủ các plugin sau:

| Plugin | Vai trò |
|---|---|
| **seoulive-core** (custom, nằm trong `wp-content/plugins/seoulive-core/`) | Đăng ký product/order post type, các REST endpoint riêng, cache, cron logic của dự án |
| **JWT Authentication for WP REST API** | Xử lý đăng nhập/đăng xuất — sinh & verify JWT token cho Next.js |
| **WP Mail SMTP** (by WPForms) | Gửi email thật qua Gmail SMTP thay vì hàm `mail()` mặc định của PHP (vốn không hoạt động trên môi trường local) |

Copy thư mục `seoulive-core` vào đúng đường dẫn:
```
wp-content/plugins/seoulive-core/
```
rồi vào **Plugins** kích hoạt như plugin thường.

> ⚠️ **Bắt buộc sau khi kích hoạt plugin lần đầu (hoặc bất cứ khi nào thấy lỗi
> 404 ở 1 custom endpoint/route mà chắc chắn code đã đúng):** vào **Settings →
> Permalinks**, bấm **Save Changes** (không cần đổi gì, chỉ cần bấm Save) để
> WordPress "flush" lại rewrite rules. Đây là lỗi hay gặp nhất trong dự án —
> thiếu bước này, các custom post type (`seoulive_product`, `seoulive_order`)
> và custom REST route đều có thể trả về 404 dù code hoàn toàn không có vấn đề.

### 2.3. Cấu hình `wp-config.php`

Thêm các định nghĩa sau vào khu vực giữa dòng `/* Add any custom values... */` và
`/* That's all, stop editing! */` (xem file `wp-config.php` mẫu trong repo, đã có
sẵn các dòng này — chỉ cần đổi giá trị cho đúng môi trường của cậu):

```php
// Bật debug, ghi log ra file thay vì hiện lỗi trực tiếp trên trang/response.
define( 'WP_DEBUG', true );
define( 'WP_DEBUG_LOG', true );
define( 'WP_DEBUG_DISPLAY', false );

// Secret dùng chung giữa Next.js server và WordPress cho endpoint /quick-order.
// Next.js gửi kèm header 'x-seoulive-secret' khớp đúng giá trị này.
// Tự sinh 1 chuỗi ngẫu nhiên đủ dài (khuyến khích >= 32 ký tự), KHÔNG dùng giá
// trị mẫu có sẵn khi lên production.
define( 'SEOULIVE_API_SECRET', 'GIA_TRI_TU_SINH_CUA_BAN' );

// Secret ký JWT token cho đăng nhập — plugin "JWT Authentication for WP REST API"
// dùng giá trị này. PHẢI đổi sang 1 chuỗi ngẫu nhiên mạnh khi lên production,
// không dùng giá trị test.
define( 'JWT_AUTH_SECRET_KEY', 'GIA_TRI_TU_SINH_CUA_BAN' );
define( 'JWT_AUTH_CORS_ENABLE', true );

define( 'WP_ENVIRONMENT_TYPE', 'local' );
```

> ⚠️ `SEOULIVE_API_SECRET` và `JWT_AUTH_SECRET_KEY` là 2 secret khác nhau, dùng
> cho 2 mục đích khác nhau — không nhầm lẫn hoặc dùng chung 1 giá trị.

### 2.4. Cấu hình SMTP (gửi mail qua Gmail)

WordPress mặc định (đặc biệt trên local) **không gửi được email thật**. Cần cấu
hình SMTP qua Gmail:

1. Bật **2-Step Verification** cho tài khoản Gmail (Google Account → Security).
2. Tạo **App Password** (Google Account → Security → App passwords) — dùng chuỗi
   16 ký tự này, **không dùng mật khẩu Gmail gốc**.
3. Vào **wp-admin → WP Mail SMTP → Settings**, chọn mailer **"Other SMTP"**, điền:
   - SMTP Host: `smtp.gmail.com`
   - Encryption: `TLS`
   - SMTP Port: `587`
   - Auto TLS: bật
   - Authentication: bật
   - SMTP Username: email Gmail
   - SMTP Password: App Password vừa tạo (16 ký tự)
4. Save, sau đó vào tab **Tools → Email Test** để gửi thử, xác nhận nhận được
   mail thật trước khi coi như xong.

### 2.5. Tạo Application Password cho WordPress (khác với App Password Gmail ở trên)

Một số tính năng frontend (form Subscribe ở Footer, gọi tới
`/wp-json/wp/v2/subscriber`) xác thực bằng **Application Password của chính user
WordPress**, không phải JWT hay `SEOULIVE_API_SECRET`. Đây là 1 secret thứ 3,
khác hoàn toàn 2 secret ở mục 2.3.

1. Vào **wp-admin → Users → Profile** (của tài khoản sẽ dùng để gọi API, thường
   là `admin`).
2. Cuộn xuống mục **Application Passwords**, đặt tên bất kỳ (VD `seoulive-next`),
   bấm **Add New Application Password**.
3. WordPress hiện ra 1 chuỗi dạng `xxxx xxxx xxxx xxxx xxxx xxxx` — **copy ngay
   lúc này**, vì sau khi rời trang sẽ không xem lại được. Dán vào biến
   `WP_APP_PASSWORD` ở mục 3.1 bên dưới.

> Application Password chỉ hoạt động qua HTTPS theo mặc định của WordPress.
> Trên môi trường local (HTTP), code trong `seoulive-core.php` đã tự thêm filter
> `wp_is_application_passwords_available` trả về `true` để bỏ qua giới hạn này —
> đây là lý do filter đó tồn tại trong plugin, không phải thừa.

---

## 3. Cài đặt Frontend (Next.js)

```bash
cd seoulive-next
npm install
```

### 3.1. Cấu hình `.env.local`

Tạo file `.env.local` ở thư mục gốc `seoulive-next/` với nội dung đầy đủ (thiếu
bất kỳ biến nào bên dưới, tính năng liên quan sẽ lỗi 500 âm thầm mà không rõ lý
do — đặc biệt là 3 biến `WP_USERNAME` / `WP_APP_PASSWORD` / `WP_API_URL` hay bị
bỏ sót vì chỉ dùng cho form Subscribe, không phải luồng chính):

```env
# URL gốc của site WordPress (không có dấu / ở cuối).
# Đổi theo đúng domain Local site của máy mình — xem cảnh báo ở mục 2.1.
WP_BASE_URL=http://test1.local

# Secret dùng chung với SEOULIVE_API_SECRET bên wp-config.php — phải TRÙNG KHỚP
# tuyệt đối với giá trị đã set bên WordPress, nếu không mọi request tới
# /api/quick-order sẽ bị WordPress từ chối với lỗi 403.
SEOULIVE_API_SECRET=GIA_TRI_TU_SINH_CUA_BAN

# 3 biến dưới đây dùng cho route /api/subscribe (form đăng ký nhận email ở
# Footer), gọi tới /wp-json/wp/v2/subscriber bằng Basic Auth.
WP_API_URL=http://test1.local/wp-json/wp/v2/subscriber
WP_USERNAME=admin
WP_APP_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx
```

> File `.env.local` không được commit lên Git (đã có trong `.gitignore` mặc định
> của Next.js) — mỗi máy dev tự tạo file này với giá trị secret riêng, khớp với
> `wp-config.php` trên máy mình.

### 3.2. Cấu hình domain ảnh trong `next.config.ts`

Ảnh sản phẩm lấy trực tiếp từ WordPress (`wp-content/uploads/...`) qua domain
`.local`. Next.js **mặc định chặn** load ảnh từ domain lạ — nếu không cấu hình,
mọi ảnh sản phẩm sẽ vỡ với lỗi `Invalid src prop ... hostname is not
configured`. Thêm vào `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "test1.local", // đổi theo domain site thật của máy mình
        pathname: "/wp-content/uploads/**",
      },
    ],
  },
};

export default nextConfig;
```

### 3.3. Chạy dự án

```bash
npm run dev
```

Mặc định chạy tại `http://localhost:3000`.

---

## 4. API Endpoints đã tạo

### Custom endpoints (plugin `seoulive-core`, namespace `seoulive/v1`)

| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| `POST` | `/wp-json/seoulive/v1/register` | Đăng ký tài khoản subscriber mới | Public |
| `POST` | `/wp-json/seoulive/v1/quick-order` | Tạo đơn "đặt hàng nhanh" — body gồm `name`, `phone`, `address`, `product_id` | Header `x-seoulive-secret` (bắt buộc trùng khớp `SEOULIVE_API_SECRET`) + rate limit 5 req/phút/IP |

> ⚠️ **Cần rà soát:** dự án có dấu hiệu tồn tại **2 route đăng ký trùng chức
> năng** — `seoulive/v1/register` (trong plugin `seoulive-core`, liệt kê ở trên)
> và khả năng còn `custom/v1/register` cũ (từng viết trong `functions.php` của
> theme ở giai đoạn đầu dự án). Nếu cả 2 còn tồn tại song song, đây là trùng lặp
> logic thật trong code, không chỉ là vấn đề tài liệu — cần mở `functions.php`
> của theme đang active, tìm `register_rest_route` với namespace `custom/v1`,
> xác nhận còn hay đã xóa, và gỡ bỏ 1 bên trước khi bàn giao.

### Endpoint từ plugin JWT Authentication (đăng nhập/đăng xuất)

| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/wp-json/jwt-auth/v1/token` | Đăng nhập — body gồm `username`, `password`, trả về JWT token |
| `POST` | `/wp-json/jwt-auth/v1/token/validate` | Kiểm tra token còn hợp lệ hay không |

### REST API mặc định của WordPress (tự động có sẵn nhờ `show_in_rest`)

| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/wp-json/wp/v2/seoulive_product` | Danh sách sản phẩm — có cache qua Transients API (1 giờ), response được bổ sung field `discount_percentage` tính sẵn |
| `GET` | `/wp-json/wp/v2/seoulive_product/<id>` | Chi tiết 1 sản phẩm |

> Custom post type `seoulive_order` (lưu đơn hàng) **không** được expose qua REST
> API mặc định (`show_in_rest => false`) — chỉ có thể tạo đơn qua endpoint
> `/seoulive/v1/quick-order` ở trên, xem trực tiếp trong **wp-admin → Đơn hàng
> Seoulive**.

---

## 5. Ghi chú vận hành

- **Cache sản phẩm:** danh sách sản phẩm được cache 1 giờ qua Transients API, tự
  động xóa (invalidate) ngay khi có đơn hàng mới hoặc khi admin sửa sản phẩm
  trong wp-admin — không cần can thiệp tay.
- **Debug log:** khi có lỗi tạo đơn hàng hoặc lỗi gửi email, chi tiết được ghi
  vào `wp-content/debug.log` (cần `WP_DEBUG_LOG = true`, xem mục 2.3) — không
  hiển thị lỗi kỹ thuật ra response trả về Next.js.
- **Rate limit:** endpoint `/quick-order` giới hạn 5 request/phút theo IP mà
  WordPress nhận được trong `$_SERVER['REMOTE_ADDR']` (tức IP thật của khách
  hàng khi Next.js gọi trực tiếp server-to-server, không qua proxy/CDN trung
  gian nào làm đổi IP nguồn).

---

## 6. Cấu hình bổ sung bắt buộc (checklist trước khi test)

Đây là các bước **hay bị bỏ sót nhất**, không làm đủ sẽ khiến tính năng "Đặt
hàng nhanh" hoặc trang chủ bị lỗi dù code hoàn toàn không có vấn đề:

- [ ] Đã **Flush Permalinks** (Settings → Permalinks → Save Changes) sau khi
      kích hoạt/cập nhật plugin `seoulive-core` (mục 2.2).
- [ ] Đã cấu hình `remotePatterns` trong `next.config.ts` đúng domain site thật
      (mục 3.2) — nếu không, ảnh sản phẩm sẽ vỡ toàn bộ.
- [ ] `.env.local` có đủ **5 biến**: `WP_BASE_URL`, `SEOULIVE_API_SECRET`,
      `WP_API_URL`, `WP_USERNAME`, `WP_APP_PASSWORD` (mục 3.1).
- [ ] Đã tạo **Application Password** cho user WordPress dùng để gọi API
      (mục 2.5), không nhầm với App Password Gmail (mục 2.4).
- [ ] Domain `test1.local` trong mọi file cấu hình đã đổi thành đúng domain
      Local site thật trên máy mình (mục 2.1).
- [ ] Đã vào **wp-admin → từng sản phẩm → Tồn kho**, nhập số lượng > 0. Mặc
      định trường này **để trống (= 0)** khi tạo sản phẩm mới — chưa nhập thì
      tính năng "Đặt hàng nhanh" sẽ báo "Sản phẩm tạm hết hàng" với **mọi** sản
      phẩm, kể cả khi code hoàn toàn đúng.

---

## 7. Troubleshooting — các lỗi thường gặp

| Lỗi | Nguyên nhân | Cách fix |
|---|---|---|
| `ECONNREFUSED` khi Next.js gọi API WordPress | Site Local chưa bật (Local by Flywheel chưa Start site) | Mở app Local, bấm **Start** cho site, đợi vài giây rồi thử lại |
| Ảnh sản phẩm vỡ, lỗi `Invalid src prop ... hostname is not configured` | Thiếu `remotePatterns` trong `next.config.ts`, hoặc domain khai báo sai | Xem mục 3.2, đảm bảo đúng domain + protocol (`http`, không phải `https`) |
| Ảnh/API trả lỗi 400 hoặc không load được khi domain `.local` | Máy chạy Node.js đôi khi không resolve được domain `.local` giống trình duyệt (do khác DNS resolver) | Thử đổi `WP_BASE_URL` sang `http://localhost:<port>` (xem port thật trong Local by Flywheel → site → "Open site") thay vì domain `.local`, hoặc restart Local |
| Custom route (`seoulive_product`, `/quick-order`...) trả về 404 dù code đúng | Chưa flush permalinks sau khi sửa/kích hoạt plugin | Settings → Permalinks → Save Changes (mục 2.2) |
| Trang trắng hoặc "There has been a critical error" ở cả frontend lẫn wp-admin | Thường do 2 file PHP cùng định nghĩa lại 1 hàm/class (VD còn sót file nháp cũ trong thư mục plugin) | Kiểm tra `wp-content/debug.log` (dòng cuối cùng) để biết chính xác hàm/dòng nào bị trùng, xóa file thừa |
| Tính năng Đặt hàng nhanh luôn báo "Sản phẩm tạm hết hàng" | Trường Tồn kho của sản phẩm đang để trống/0 | Vào sửa sản phẩm, nhập số vào ô Tồn kho, Update (mục 6) |
| React hiển thị cảnh báo "Hydration failed" ở console, nhưng trang vẫn chạy được | Thường do extension trình duyệt (password manager, ad-blocker...) chèn thêm DOM vào trang trước khi React hydrate, không phải lỗi code | Thử mở bằng cửa sổ ẩn danh (tắt hết extension) để xác nhận — nếu hết cảnh báo thì bỏ qua, không phải bug thật |