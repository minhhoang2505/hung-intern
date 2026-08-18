# DEBUG_NOTES.md — Đọc hiểu debug.log

Bật `WP_DEBUG` + `WP_DEBUG_LOG` trong `wp-config.php` (đã có sẵn trong dự án, xem
`README.md` mục 2.3). Log ghi vào `wp-content/debug.log`, không hiện trực tiếp
lên trang (`WP_DEBUG_DISPLAY => false`).

Dưới đây là 2 lỗi tự tạo để quan sát, chạy thật bằng PHP CLI để lấy đúng format
dòng log (không phải viết tay/bịa).

---

## Tình huống 1: Fatal Error — gọi hàm không tồn tại

**Code gây lỗi (cố tình gõ sai tên hàm):**
```php
function seoulive_render_price( $product_id ) {
    // Gõ nhầm: đúng phải là get_post_meta()
    $price = get_post_meta_typo( $product_id, 'regular_price', true );
    return $price;
}

seoulive_render_price( 51 );
```

**Dòng log thu được:**
```
[18-Aug-2026 03:55:33 UTC] PHP Fatal error:  Uncaught Error: Call to undefined function get_post_meta_typo() in /home/claude/debug-sim/fatal-example.php:4
Stack trace:
#0 /home/claude/debug-sim/fatal-example.php(8): seoulive_render_price()
#1 {main}
  thrown in /home/claude/debug-sim/fatal-example.php on line 4
```

**Phân tích cấu trúc:**
| Thành phần | Giá trị |
|---|---|
| Thời gian | `18-Aug-2026 03:55:33 UTC` |
| Loại lỗi | `PHP Fatal error` |
| Chi tiết lỗi | `Uncaught Error: Call to undefined function get_post_meta_typo()` |
| File | `/home/claude/debug-sim/fatal-example.php` |
| Dòng | `4` (dòng gọi hàm sai) — dòng `8` trong stack trace là nơi *gọi tới* hàm chứa lỗi, dòng `4` mới là dòng thực sự gây crash |

**Vì sao là Fatal:** PHP không tìm thấy hàm `get_post_meta_typo` trong bộ nhớ —
đây là lỗi không thể phục hồi, PHP dừng thực thi ngay lập tức, toàn bộ trang
(hoặc toàn bộ site nếu lỗi nằm trong 1 plugin đang active) sẽ trắng hoặc hiện
"There has been a critical error" — đúng như lỗi anh từng gặp lúc file
`seoulive-quick-order.php` bị trùng hàm với `seoulive-core.php`.

**Cách sửa:** sửa lại đúng tên hàm có sẵn của WordPress:
```php
$price = get_post_meta( $product_id, 'regular_price', true );
```

---

## Tình huống 2: Truy cập key mảng không tồn tại

**Code gây lỗi (thiếu kiểm tra trước khi truy cập key):**
```php
$data = array(
    'name'  => 'Nguyen Van A',
    'phone' => '0912345678',
);

// Quên isset() trước khi truy cập key 'address' — key này không tồn tại
echo 'Địa chỉ: ' . $data['address'];
```

**Dòng log thu được:**
```
[18-Aug-2026 03:55:33 UTC] PHP Warning:  Undefined array key "address" in /home/claude/debug-sim/notice-example.php on line 8
```

**Phân tích cấu trúc:**
| Thành phần | Giá trị |
|---|---|
| Thời gian | `18-Aug-2026 03:55:33 UTC` |
| Loại lỗi | `PHP Warning` (trên PHP 8.x) |
| Chi tiết lỗi | `Undefined array key "address"` |
| File | `/home/claude/debug-sim/notice-example.php` |
| Dòng | `8` |

> ⚠️ **Lưu ý về phiên bản PHP:** trên **PHP 8.0 trở lên**, lỗi này được PHP xếp
> loại **Warning** (đúng như log thật ở trên, chạy bằng PHP 8.3). Trên **PHP
> 7.x** (phiên bản `wp-config.php` của dự án yêu cầu tối thiểu — `Requires PHP:
> 7.4`), cùng lỗi này sẽ hiện dưới dạng **Notice**, với message hơi khác:
> `PHP Notice:  Undefined index: address in ... on line 8`. Bản chất vấn đề
> giống nhau, chỉ khác cách PHP phân loại mức độ nghiêm trọng theo từng version.

**Vì sao chỉ là Notice/Warning, không phải Fatal:** PHP vẫn hiểu `$data` là 1
mảng hợp lệ, chỉ là key `'address'` không tồn tại trong đó — PHP coi giá trị
trả về là `null`, in ra chuỗi rỗng, và **tiếp tục chạy code phía sau bình
thường**. Đây là lý do Notice/Warning không làm sập trang — nhưng nếu tích lũy
nhiều chỗ code thiếu kiểm tra key như vậy, dữ liệu hiển thị cho người dùng có
thể bị thiếu/sai mà không ai để ý, vì trang trông vẫn "chạy được".

**Cách sửa:** luôn kiểm tra key tồn tại trước khi truy cập, dùng `isset()` hoặc
toán tử `??` (null coalescing):
```php
echo 'Địa chỉ: ' . ( $data['address'] ?? '' );
// hoặc
echo 'Địa chỉ: ' . ( isset( $data['address'] ) ? $data['address'] : '' );
```

---

## Tóm tắt cách đọc nhanh 1 dòng log

```
[THỜI GIAN]  LOẠI LỖI  :  CHI TIẾT LỖI  in  ĐƯỜNG DẪN FILE  on line  SỐ DÒNG
```

- **Fatal error** → trang/site sập ngay, phải sửa trước khi làm gì khác.
- **Warning** → code vẫn chạy tiếp, nhưng có khả năng dữ liệu sai/thiếu, nên sửa
  sớm.
- **Notice** (PHP 7.x) → mức nhẹ nhất, thường là thói quen code chưa chuẩn
  (thiếu kiểm tra biến/key tồn tại), không khẩn cấp nhưng nên dọn dần.
- Luôn đọc **dòng cuối cùng** trong `debug.log` trước — đó là lỗi mới nhất, gần
  với hành động vừa gây ra lỗi nhất.