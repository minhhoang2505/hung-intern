# ANALYSIS.md — Tính năng "Đặt hàng nhanh" (Quick Order)

Phân tích rủi ro trước khi triển khai Custom API Endpoint `/seoulive/v1/quick-order`.

---

## 1. Rủi ro về Cache

**Vấn đề:** Danh sách sản phẩm (bao gồm `stock`) đang được cache bằng Transients API
(`seoulive_products_cache`, hạn 3600s) từ bài học trước. Nếu có đơn hàng mới làm
giảm tồn kho trong DB mà cache không được xoá, khách hàng tiếp theo trên Next.js
vẫn thấy số lượng tồn kho **cũ** trong tối đa 1 giờ — có thể dẫn tới việc khách đặt
hàng một sản phẩm đã thực sự hết hàng.

**Giải pháp:** Kết hợp Transients API với Action Hook, theo đúng gợi ý tài liệu
tham khảo (hook chạy ngay sau khi tạo đơn hàng thành công):

- Sau khi `wp_insert_post()` tạo đơn hàng (`seoulive_order`) thành công, plugin bắn
  ra 1 custom action: `do_action( 'seoulive_new_order_created', $order_id, $data )`.
- Action này có 2 listener đăng ký sẵn trong constructor:
  - `invalidate_product_cache_on_order()` — xoá cache sản phẩm ngay lập tức.
  - `notify_admin_on_order()` — gửi email cho admin (xem mục 3).
- Ngoài luồng đặt hàng, cache cũng phải được xoá khi **admin tự sửa sản phẩm**
  trong wp-admin (đổi giá, đổi tồn kho tay) — đây là 1 write-path khác mà bản đầu
  hay bị bỏ sót. Nên có thêm hook `save_post_seoulive_product` gọi cùng 1 cơ chế
  invalidate.
- Thay vì `delete_transient()` theo 1 key cố định (dễ bỏ sót các biến thể query
  như `?slug=...`, `?page=...` — mỗi biến thể là 1 transient riêng), dùng cơ chế
  **cache version**: một số nguyên lưu trong `wp_options`
  (`seoulive_products_cache_version`), được đưa vào tên transient key. Mỗi lần
  cần invalidate chỉ cần tăng version lên 1 — toàn bộ cache cũ (bất kể sinh ra từ
  query nào) tự động bị coi là "miss" ở request kế tiếp, không cần biết trước có
  bao nhiêu key đang tồn tại.

## 2. Rủi ro về Spam / Security

**Vấn đề:** Endpoint `/seoulive/v1/quick-order` là API công khai (khách chưa đăng
nhập cũng đặt được hàng). Không có rào chắn, kẻ xấu có thể viết script gửi hàng
loạt request giả trong thời gian ngắn — vừa làm rác dữ liệu đơn hàng, vừa có nguy
cơ làm quá tải server (giống một dạng DoS nhẹ qua application layer).

**Giải pháp:** Chặn ở `permission_callback` của route (`quick_order_permission_check`)
theo đúng 2 lớp:

1. **Secret header dùng chung với server Next.js:** request phải kèm header
   `x-seoulive-secret` khớp với hằng số `SEOULIVE_API_SECRET` (định nghĩa ở
   `wp-config.php`, không bao giờ lộ ra trình duyệt vì Next.js gọi WordPress qua
   Route Handler phía server, không gọi thẳng từ client). Request thiếu/sai secret
   bị từ chối ngay với `403`, trước khi chạm tới bất kỳ logic tạo đơn hàng nào.
2. **Rate limiting theo IP bằng Transient:** đếm số request trong 60 giây gần nhất
   theo `REMOTE_ADDR` (key `seoulive_rl_<md5(ip)>`), giới hạn tối đa 5
   request/phút/IP. Vượt ngưỡng trả về `429 Too Many Requests`.
3. Ở tầng xử lý đơn hàng, số lượng tồn kho được trừ bằng **1 câu UPDATE atomic**
   có điều kiện (`WHERE ... AND stock > 0`) thay vì đọc-tính-ghi 2 bước, nên dù có
   lọt qua rate limit thì cũng không thể tạo đơn vượt quá số hàng thực tế trong
   kho (xem thêm mục Race Condition).

*Có thể nâng cấp thêm (ngoài phạm vi bài, ghi chú để biết hướng mở rộng): honeypot
field ở form (đã có bên Next.js), CAPTCHA, hoặc rate-limit ở tầng reverse proxy/CDN
cho các trường hợp traffic lớn hơn.*

## 3. Trải nghiệm Admin (Event-Driven Notification)

**Vấn đề:** Admin không muốn phải mở website liên tục F5 để kiểm tra có đơn hàng
mới hay không.

**Giải pháp:** Tận dụng đúng custom action `seoulive_new_order_created` đã bắn ra ở
mục 1 — thêm listener `notify_admin_on_order()` lắng nghe action này, dùng
`wp_mail()` gửi email ngay khi đơn hàng được tạo, nội dung gồm:

- Tên khách hàng, số điện thoại, địa chỉ.
- Tên sản phẩm.
- Link trực tiếp tới trang sửa đơn hàng trong wp-admin (`admin_url(...)`).

Vì đây là **event-driven** (nhờ `do_action`/`add_action` — Observer pattern có sẵn
trong WordPress), việc cache-invalidation và gửi email được tách thành 2 listener
độc lập, cùng lắng nghe chung 1 sự kiện — không cần gọi thủ công 2 hàm nối tiếp
nhau trong `handle_quick_order()`, dễ mở rộng thêm listener khác sau này (ví dụ:
đẩy sang Slack, ghi log riêng...) mà không cần sửa lại logic tạo đơn hàng.