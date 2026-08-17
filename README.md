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

---

## 3. Cài đặt Frontend (Next.js)

```bash
cd seoulive-next
npm install
```

### 3.1. Cấu hình `.env.local`

Tạo file `.env.local` ở thư mục gốc `seoulive-next/` với nội dung:

```env
# URL gốc của site WordPress (không có dấu / ở cuối)
WP_BASE_URL=http://test1.local

# Secret dùng chung với SEOULIVE_API_SECRET bên wp-config.php — phải TRÙNG KHỚP
# tuyệt đối với giá trị đã set bên WordPress, nếu không mọi request tới
# /api/quick-order sẽ bị WordPress từ chối với lỗi 403.
SEOULIVE_API_SECRET=GIA_TRI_TU_SINH_CUA_BAN
```

> File `.env.local` không được commit lên Git (đã có trong `.gitignore` mặc định
> của Next.js) — mỗi máy dev tự tạo file này với giá trị secret riêng, khớp với
> `wp-config.php` trên máy mình.

### 3.2. Chạy dự án

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
- **Rate limit:** endpoint `/quick-order` giới hạn 5 request/phút cho mỗi IP
  khách hàng thật (IP được Next.js forward qua header `x-seoulive-client-ip`,
  không phải IP của server Next.js).