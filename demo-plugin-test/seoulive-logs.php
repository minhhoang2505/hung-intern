<?php
/**
 * Custom table logging: {$wpdb->prefix}seoulive_logs
 *
 * TÁCH RIÊNG khỏi seoulive-core.php (không gộp chung file với class chính)
 * vì WordPress Coding Standards không cho phép 1 file vừa chứa khai báo
 * class (OOP) vừa chứa hàm rời (procedural) — xem rule
 * Universal.Files.SeparateFunctionsFromOO.Mixed.
 *
 * @package Seoulive_Core
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * ============================================================================
 * CUSTOM TABLE: {$wpdb->prefix}seoulive_logs — ghi log hoạt động (đăng nhập...)
 * ============================================================================
 *
 * Lý do dùng Custom Table thay vì wp_postmeta/wp_options:
 * - Log không gắn với 1 post cụ thể nào (wp_postmeta không phù hợp).
 * - wp_options chỉ hợp cho cấu hình toàn site, ít thay đổi — log tăng dòng
 *   liên tục theo thời gian, nhét vào đó sẽ làm phình bảng options dùng
 *   chung cho toàn bộ core/plugin khác.
 * - Cần index riêng theo user_id/action_name/created_at để query nhanh khi
 *   dữ liệu lớn dần — postmeta không có index tối ưu cho kiểu truy vấn này.
 */

/**
 * Tạo (hoặc cập nhật) cấu trúc bảng log khi plugin được kích hoạt.
 *
 * Dùng dbDelta() nên hàm này AN TOÀN để gọi lại nhiều lần: nếu bảng đã tồn
 * tại, dbDelta() chỉ thêm cột/index còn thiếu so với $sql khai báo, KHÔNG
 * xóa dữ liệu hiện có, KHÔNG DROP rồi tạo lại từ đầu.
 *
 * Cách test yêu cầu ở bài tập:
 * 1. Deactivate rồi Activate lại plugin -> bảng được tạo, kiểm tra bằng
 *    phpMyAdmin/Adminer thấy đúng 4 cột (id, user_id, action_name, created_at).
 * 2. Thêm dòng `ip_address VARCHAR(45) NULL,` vào $sql bên dưới, deactivate/
 *    activate lại lần nữa -> dbDelta() tự ALTER TABLE thêm cột mới, dữ liệu
 *    cũ trong bảng vẫn còn nguyên (không bị mất).
 */
function seolive_create_logs_table() {
	global $wpdb;

	// BẮT BUỘC dùng $wpdb->prefix, không hard-code 'wp_' — nhiều môi trường
	// (Local by Flywheel, multisite, cấu hình bảo mật đổi prefix) không dùng
	// đúng tiền tố 'wp_' mặc định.
	$table_name      = $wpdb->prefix . 'seoulive_logs';
	$charset_collate = $wpdb->get_charset_collate();

	// dbDelta() rất "khó tính" về cú pháp: mỗi cột phải nằm đúng 1 dòng, có
	// đúng 2 khoảng trắng giữa "PRIMARY KEY" và tên cột — sai định dạng này
	// dbDelta() sẽ âm thầm không tạo đúng như mong đợi, không báo lỗi rõ ràng.
	$sql = "CREATE TABLE {$table_name} (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    action_name VARCHAR(100) NOT NULL,
    created_at DATETIME NOT NULL,
    ip_address VARCHAR(45) NULL,
    PRIMARY KEY  (id),
    KEY user_id (user_id),
    KEY action_name (action_name),
    KEY created_at (created_at)
) {$charset_collate};";

	include_once ABSPATH . 'wp-admin/includes/upgrade.php';
	dbDelta( $sql );
}
register_activation_hook( __FILE__, 'seolive_create_logs_table' );

/**
 * Ghi 1 dòng log vào bảng {$wpdb->prefix}seolive_logs.
 *
 * Dùng $wpdb->insert() (không dùng $wpdb->query() thô) — tự escape dữ liệu
 * và cho phép chỉ định $format đúng kiểu cho từng cột.
 *
 * @param  int    $user_id     ID user liên quan tới hành động.
 * @param  string $action_name Tên hành động (VD: 'login').
 * @return int|false ID dòng vừa insert nếu thành công, false nếu thất bại.
 */
function seolive_insert_log( $user_id, $action_name ) {
	global $wpdb;

	$table_name = $wpdb->prefix . 'seoulive_logs';

	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Custom table (seoulive_logs) không có wrapper cấp cao (WP_Query) để thay thế; $wpdb->insert() là cách ghi dữ liệu chuẩn cho custom table. Không cần object cache cho thao tác ghi (write).
	$result = $wpdb->insert(
		$table_name,
		array(
			'user_id'     => absint( $user_id ),
			'action_name' => sanitize_text_field( $action_name ),
			'created_at'  => current_time( 'mysql' ),
		),
		array(
			'%d', // user_id - số nguyên.
			'%s', // action_name - chuỗi text.
			'%s', // created_at - chuỗi datetime.
		)
	);

	// $wpdb->insert() trả về số dòng bị ảnh hưởng (1 nếu thành công), hoặc
	// false nếu có lỗi DB — BẮT BUỘC kiểm tra, không giả định luôn thành công.
	if ( false === $result ) {
     // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- Trace log chủ động theo yêu cầu bài tập, không phải debug sót lại.
		error_log( '[Seoulive] Ghi log THẤT BẠI. Lỗi DB: ' . $wpdb->last_error );
		return false;
	}

	return $wpdb->insert_id;
}

/**
 * Hook callback riêng cho sự kiện 'wp_login' — TÁCH RIÊNG khỏi
 * seolive_insert_log() có chủ đích: hàm ghi log giữ nguyên chữ ký tham số
 * đơn giản ($user_id, $action_name), tái sử dụng được ở bất kỳ nơi nào khác
 * sau này (VD: ghi log khi tạo đơn hàng, đổi mật khẩu...) mà không bị ràng
 * buộc theo đúng 2 tham số cố định mà riêng hook 'wp_login' quy định.
 *
 * @param string  $user_login Username vừa đăng nhập (WordPress tự truyền
 *                            theo đúng chữ ký hook 'wp_login', không dùng
 *                            tới trong hàm này).
 * @param WP_User $user       Đối tượng user vừa đăng nhập thành công.
 */
function seolive_handle_login( $user_login, $user ) { // phpcs:ignore -- $user_login không dùng tới, nhưng hook 'wp_login' luôn truyền đủ 2 tham số cho mọi callback.
	seolive_insert_log( $user->ID, 'login' );
}
add_action( 'wp_login', 'seolive_handle_login', 10, 2 );

/**
 * Lấy 10 log mới nhất, sắp xếp theo created_at giảm dần.
 *
 * @return array Mảng object, mỗi phần tử có: id, user_id, action_name, created_at.
 */
function seolive_get_recent_logs() {
	global $wpdb;

	$table_name = $wpdb->prefix . 'seoulive_logs';

	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Custom table không có wrapper cấp cao (WP_Query) để thay thế; $table_name build từ $wpdb->prefix + tên cố định (không phải input user, không cần prepare); đây là dữ liệu log hiển thị tạm cho dev debug, không cần object cache.
	$logs = $wpdb->get_results( "SELECT id, user_id, action_name, created_at FROM {$table_name} ORDER BY created_at DESC LIMIT 10" );

	return $logs;
}

/**
 * In thử 10 log mới nhất ra debug.log để kiểm tra dữ liệu thực tế.
 * Chỉ dùng TẠM để test — không phải code chạy thường trực trong production.
 *
 * Cách gọi thử: tạm thời thêm dòng
 *     add_action( 'init', 'seolive_debug_print_recent_logs' );
 * vào cuối file này, load thử 1 trang bất kỳ trên site, rồi xem
 * wp-content/debug.log. Nhớ XÓA dòng add_action đó sau khi test xong, vì để
 * lại sẽ khiến hàm này chạy trên MỌI request, ghi log liên tục không cần thiết.
 */
function seolive_debug_print_recent_logs() {
	$logs = seolive_get_recent_logs();

	foreach ( $logs as $log ) {
     // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- Trace log chủ động để kiểm tra dữ liệu thực tế, theo đúng yêu cầu bài tập.
		error_log(
			sprintf(
				'[Seoulive Log] #%d | user_id=%d | action=%s | created_at=%s',
				$log->id,
				$log->user_id,
				$log->action_name,
				$log->created_at
			)
		);
	}
}
