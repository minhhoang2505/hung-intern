<?php
/**
 * Demo cấu hình SMTP thủ công qua hook 'phpmailer_init'.
 *
 * Đây chính là cơ chế nội bộ mà plugin WP Mail SMTP cũng dùng bên dưới lớp
 * UI. File này chứng minh hiểu bản chất SMTP, KHÔNG chỉ phụ thuộc vào 1
 * plugin cấu hình qua giao diện.
 *
 * LƯU Ý QUAN TRỌNG: đoạn code này và plugin "WP Mail SMTP" đang cấu hình
 * CÙNG 1 mục đích (đăng nhập SMTP Gmail) qua CÙNG 1 hook. Nếu bật cả 2 cùng
 * lúc, cái chạy SAU trong thứ tự hook sẽ ghi đè giá trị của cái chạy TRƯỚC
 * — không gây lỗi (vì cùng set 1 giá trị), nhưng gây "config trùng lặp, khó
 * biết ai đang thực sự điều khiển việc gửi mail" khi maintain sau này.
 *
 * => Best practice: chỉ nên dùng 1 trong 2 cách khi lên thật (production),
 * không dùng song song cả hai. Đoạn dưới có check is_plugin_active() để tự
 * tắt nếu plugin WP Mail SMTP đang bật, tránh xung đột — bật code này lên
 * khi cậu tắt/gỡ plugin đi và muốn tự quản lý SMTP bằng code thuần.
 *
 * @package Seoulive_Core
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! function_exists( 'is_plugin_active' ) ) {
	require_once ABSPATH . 'wp-admin/includes/plugin.php';
}

if ( ! is_plugin_active( 'wp-mail-smtp/wp_mail_smtp.php' ) ) {

	add_action( 'phpmailer_init', 'seoulive_configure_smtp_manually' );

	/**
	 * Cấu hình PHPMailer để gửi qua Gmail SMTP bằng App Password.
	 *
	 * Hook 'phpmailer_init' chạy NGAY TRƯỚC khi wp_mail() thực sự gửi đi,
	 * cho phép mình "chèn" cấu hình SMTP vào đối tượng PHPMailer nội bộ mà
	 * WordPress dùng — đây là đúng cơ chế mà mọi plugin SMTP (kể cả WP Mail
	 * SMTP) đều dựa vào, chỉ khác là họ có thêm UI để nhập giá trị.
	 *
	 * Các thuộc tính bên dưới ($Host, $SMTPAuth, $Port...) thuộc về class
	 * PHPMailer (thư viện bên thứ 3 WordPress core bundle sẵn) — tên do
	 * chính thư viện đó quy định, không thể đổi sang snake_case theo WPCS.
	 *
	 * @param PHPMailer $phpmailer Đối tượng PHPMailer, truyền theo reference.
	 */
	function seoulive_configure_smtp_manually( $phpmailer ) {
		$phpmailer->isSMTP();
		$phpmailer->Host       = 'smtp.gmail.com'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase -- Tên thuộc tính do thư viện PHPMailer quy định.
		$phpmailer->SMTPAuth   = true; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase -- Tên thuộc tính do thư viện PHPMailer quy định.
		$phpmailer->Port       = 587; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase -- Tên thuộc tính do thư viện PHPMailer quy định.
		$phpmailer->SMTPSecure = 'tls'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase -- Tên thuộc tính do thư viện PHPMailer quy định.

		// KHÔNG hardcode giá trị thật trực tiếp trong code — đọc từ hằng số
		// định nghĩa trong wp-config.php (tương tự cách làm với
		// SEOULIVE_API_SECRET), tránh commit secret lên Git.
		$phpmailer->Username = defined( 'SEOULIVE_SMTP_USERNAME' ) ? SEOULIVE_SMTP_USERNAME : ''; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase -- Tên thuộc tính do thư viện PHPMailer quy định.
		$phpmailer->Password = defined( 'SEOULIVE_SMTP_APP_PASSWORD' ) ? SEOULIVE_SMTP_APP_PASSWORD : ''; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase -- Tên thuộc tính do thư viện PHPMailer quy định.
		$phpmailer->From     = $phpmailer->Username; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase -- Tên thuộc tính do thư viện PHPMailer quy định.
		$phpmailer->FromName = 'Seoulive'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase -- Tên thuộc tính do thư viện PHPMailer quy định.
	}
}
