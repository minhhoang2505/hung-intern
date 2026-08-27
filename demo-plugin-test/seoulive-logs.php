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

	require_once ABSPATH . 'wp-admin/includes/upgrade.php';
	dbDelta( $sql );
}
register_activation_hook( __FILE__, 'seolive_create_logs_table' );

/**
 * Ghi 1 dòng log vào bảng {$wpdb->prefix}seolive_logs.
 *
 * Dùng $wpdb->insert() (không dùng $wpdb->query() thô) — tự escape dữ liệu
 * và cho phép chỉ định $format đúng kiểu cho từng cột.
 *
 * @param int    $user_id     ID user liên quan tới hành động.
 * @param string $action_name Tên hành động (VD: 'login').
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
 *                             theo đúng chữ ký hook 'wp_login', không dùng
 *                             tới trong hàm này).
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

/**
 * Lấy 10 log mới nhất, sắp xếp theo id giảm dần.
 *
 * @return array Mảng object log.
 */
function seolive_get_logs() {
	global $wpdb;

	$table_name = $wpdb->prefix . 'seoulive_logs';

	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- $table_name build từ $wpdb->prefix + tên cố định, không phải input user, không cần prepare; custom table không có wrapper cấp cao thay thế.
	return $wpdb->get_results( "SELECT id, user_id, action_name, created_at FROM {$table_name} ORDER BY id DESC LIMIT 10" );
}

/**
 * Lấy 1 log theo ID.
 *
 * @param int $log_id ID của log cần lấy.
 * @return object|null Object log nếu tìm thấy, null nếu không.
 */
function seolive_get_log( $log_id ) {
	global $wpdb;

	$table_name = $wpdb->prefix . 'seoulive_logs';

	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Custom table không có wrapper cấp cao (WP_Query) để thay thế; lấy 1 log theo ID, dữ liệu hiển thị tạm, không cần object cache.
	return $wpdb->get_row(
		$wpdb->prepare(
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- $table_name build từ $wpdb->prefix + tên cố định (không phải input người dùng, không cần prepare); chỉ $log_id (dữ liệu động thật) mới cần qua placeholder %d.
			"SELECT id, user_id, action_name, created_at FROM {$table_name} WHERE id = %d",
			$log_id
		)
	);
}

/**
 * Cập nhật action_name của 1 log.
 *
 * @param int    $log_id      ID log cần sửa.
 * @param string $action_name Giá trị action_name mới.
 * @return string 'success' | 'no_change' | 'not_found' | 'error'.
 */
function seolive_update_log_action( $log_id, $action_name ) {
	global $wpdb;

	$table_name = $wpdb->prefix . 'seoulive_logs';

	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- $wpdb->update() là cách ghi chuẩn cho custom table.
	$result = $wpdb->update(
		$table_name,
		array( 'action_name' => sanitize_text_field( $action_name ) ),
		array( 'id' => absint( $log_id ) ),
		array( '%s' ),
		array( '%d' )
	);

	// false = có lỗi DB thật sự (sai tên bảng, sai kiểu dữ liệu...).
	if ( false === $result ) {
		// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- Trace log chủ động theo yêu cầu bài tập.
		error_log( '[Seoulive] Update log THẤT BẠI. Lỗi DB: ' . $wpdb->last_error );
		return 'error';
	}

	// 0 dòng bị ảnh hưởng: có thể do ID không tồn tại, HOẶC giá trị mới
	// trùng y hệt giá trị cũ (MySQL không tính là "thay đổi"). Phải tự
	// kiểm tra lại xem record có tồn tại không để phân biệt 2 trường hợp.
	if ( 0 === $result ) {
		$existing = seolive_get_log( $log_id );
		return $existing ? 'no_change' : 'not_found';
	}

	return 'success';
}

/**
 * Xóa 1 log theo ID.
 *
 * BẮT BUỘC validate $log_id ngay trong hàm này (không chỉ ở tầng gọi) —
 * "không được nhận giá trị tùy ý rồi đưa thẳng vào xử lý". Hàm này có thể
 * được gọi từ nhiều nơi khác nhau sau này, không phải lúc nào cũng đi qua
 * đúng luồng admin_init đã validate sẵn.
 *
 * @param int $log_id ID log cần xóa.
 * @return string 'success' | 'not_found' | 'error' | 'invalid'.
 */
function seolive_delete_log( $log_id ) {
	// VALIDATE trước tiên: log_id phải là số nguyên dương thật sự.
	$log_id = absint( $log_id );
	if ( $log_id <= 0 ) {
		return 'invalid';
	}

	global $wpdb;

	$table_name = $wpdb->prefix . 'seoulive_logs';

	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- $wpdb->delete() là cách xóa chuẩn cho custom table.
	$result = $wpdb->delete(
		$table_name,
		array( 'id' => $log_id ),
		array( '%d' )
	);

	if ( false === $result ) {
		// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- Trace log chủ động theo yêu cầu bài tập.
		error_log( '[Seoulive] Xóa log THẤT BẠI. Lỗi DB: ' . $wpdb->last_error );
		return 'error';
	}

	return ( $result > 0 ) ? 'success' : 'not_found';
}

/**
 * Lấy toàn bộ log của 1 user cụ thể, sắp xếp mới nhất trước.
 *
 * BẮT BUỘC dùng $wpdb->prepare() vì $user_id là dữ liệu động (đến từ tham
 * số hàm, có thể xuất phát từ input người dùng ở nơi gọi hàm này) — không
 * bao giờ được nối trực tiếp vào chuỗi SQL.
 *
 * @param int $user_id ID user cần lấy log.
 * @return array Mảng object log.
 */
function seolive_get_user_logs( $user_id ) {
	global $wpdb;

	$table_name = $wpdb->prefix . 'seoulive_logs';

	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Custom table không có wrapper cấp cao thay thế; dữ liệu log hiển thị, không cần object cache.
	return $wpdb->get_results(
		$wpdb->prepare(
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- $table_name build từ $wpdb->prefix + tên cố định, không cần prepare; $user_id đã qua placeholder %d.
			"SELECT id, user_id, action_name, created_at FROM {$table_name} WHERE user_id = %d ORDER BY created_at DESC",
			$user_id
		)
	);
}

/**
 * Đếm tổng số log khớp điều kiện — phục vụ tính tổng số trang cho Pagination.
 *
 * @param int $user_id Lọc theo user_id nếu > 0, bỏ qua nếu = 0 (đếm tất cả).
 * @return int Tổng số dòng khớp.
 */
function seolive_count_logs( $user_id = 0 ) {
	global $wpdb;

	$table_name = $wpdb->prefix . 'seoulive_logs';

	if ( $user_id > 0 ) {
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Custom table không có wrapper cấp cao thay thế.
		return (int) $wpdb->get_var(
			$wpdb->prepare(
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- $table_name build từ $wpdb->prefix + tên cố định, không cần prepare; $user_id đã qua placeholder %d.
				"SELECT COUNT(*) FROM {$table_name} WHERE user_id = %d",
				$user_id
			)
		);
	}

	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- $table_name build từ $wpdb->prefix + tên cố định, không có tham số động nào cần prepare ở câu COUNT toàn bộ này.
	return (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$table_name}" );
}

/**
 * Lấy danh sách log có phân trang, kèm tùy chọn lọc theo user_id.
 *
 * @param int $paged    Trang hiện tại (bắt đầu từ 1).
 * @param int $user_id  Lọc theo user_id nếu > 0, bỏ qua nếu = 0.
 * @param int $per_page Số dòng mỗi trang.
 * @return array Mảng object log.
 */
function seolive_get_logs_paginated( $paged = 1, $user_id = 0, $per_page = 10 ) {
	global $wpdb;

	$table_name = $wpdb->prefix . 'seoulive_logs';

	// VALIDATE: $paged phải >= 1, không được để offset âm.
	$paged  = max( 1, absint( $paged ) );
	$offset = ( $paged - 1 ) * $per_page;

	if ( $user_id > 0 ) {
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Custom table không có wrapper cấp cao thay thế.
		return $wpdb->get_results(
			$wpdb->prepare(
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- $table_name build từ $wpdb->prefix + tên cố định, không cần prepare; $user_id/$per_page/$offset đều đã qua placeholder %d.
				"SELECT id, user_id, action_name, created_at FROM {$table_name} WHERE user_id = %d ORDER BY id DESC LIMIT %d OFFSET %d",
				$user_id,
				$per_page,
				$offset
			)
		);
	}

	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Custom table không có wrapper cấp cao thay thế.
	return $wpdb->get_results(
		$wpdb->prepare(
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- $table_name build từ $wpdb->prefix + tên cố định, không cần prepare; $per_page/$offset đã qua placeholder %d.
			"SELECT id, user_id, action_name, created_at FROM {$table_name} ORDER BY id DESC LIMIT %d OFFSET %d",
			$per_page,
			$offset
		)
	);
}

/**
 * Đăng ký menu Admin "Seolive Logs".
 */
function seolive_register_logs_admin_menu() {
	add_menu_page(
		__( 'Seolive Logs', 'seoulive-core' ),
		__( 'Seolive Logs', 'seoulive-core' ),
		'manage_options',
		'seolive-logs',
		'seolive_render_logs_admin_page',
		'dashicons-list-view',
		26
	);
}
add_action( 'admin_menu', 'seolive_register_logs_admin_menu' );

/**
 * XỬ LÝ REQUEST — TÁCH RIÊNG hoàn toàn khỏi phần render HTML bên dưới.
 *
 * Hook vào 'admin_init' (không phải chạy trực tiếp trong hàm render) vì
 * đây là thời điểm chuẩn của WordPress để xử lý action trước khi bất kỳ
 * HTML nào được gửi ra — bắt buộc phải vậy nếu muốn dùng wp_safe_redirect()
 * sau đó (không thể redirect sau khi header/HTML đã xuất ra).
 *
 * Luồng đúng thứ tự: Click Delete -> Request -> Check capability ->
 * Check nonce -> Validate log_id -> Delete -> Redirect.
 */
function seolive_handle_admin_actions() {

	// Chỉ xử lý khi đang ở đúng trang Admin của mình — tránh chạy logic
	// này trên MỌI trang admin khác trong site.
	if ( ! isset( $_GET['page'] ) || 'seolive-logs' !== sanitize_key( wp_unslash( $_GET['page'] ) ) ) {
		return;
	}

	if ( ! isset( $_GET['action'] ) || 'delete' !== sanitize_key( wp_unslash( $_GET['action'] ) ) ) {
		return;
	}

	// BƯỚC 1 — CHECK CAPABILITY trước tiên, trước cả khi đụng tới nonce hay
	// dữ liệu — không tiết lộ bất kỳ điều gì cho user không đủ quyền.
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( esc_html__( 'Bạn không có quyền thực hiện thao tác này.', 'seoulive-core' ) );
	}

	// Lấy log_id thô để build đúng action name cho nonce (nonce của mỗi log
	// là duy nhất theo ID, xem wp_nonce_url() lúc render bên dưới).
	$log_id = isset( $_GET['log_id'] ) ? absint( $_GET['log_id'] ) : 0;

	// BƯỚC 2 — CHECK NONCE. check_admin_referer() tự động wp_die() với màn
	// hình "Are you sure you want to do this?" nếu nonce sai/thiếu/hết hạn,
	// không cần tự viết code chặn thủ công.
	check_admin_referer( 'seolive_delete_log_' . $log_id );

	// BƯỚC 3 — VALIDATE log_id. Nếu không hợp lệ, KHÔNG được gọi tới xóa,
	// redirect thẳng về danh sách kèm cờ báo lỗi.
	if ( $log_id <= 0 ) {
		wp_safe_redirect(
			add_query_arg(
				array(
					'page'    => 'seolive-logs',
					'deleted' => 'invalid',
				),
				admin_url( 'admin.php' )
			)
		);
		exit;
	}

	// BƯỚC 4 — DELETE (chỉ tới đây khi cả 3 bước trên đều hợp lệ).
	$result = seolive_delete_log( $log_id );

	// BƯỚC 5 — REDIRECT về danh sách, kèm kết quả để render() hiện thông báo.
	wp_safe_redirect(
		add_query_arg(
			array(
				'page'    => 'seolive-logs',
				'deleted' => $result,
			),
			admin_url( 'admin.php' )
		)
	);
	exit;
}
add_action( 'admin_init', 'seolive_handle_admin_actions' );

/**
 * Render trang Admin quản lý log.
 *
 * CHỈ LÀM ĐÚNG 1 VIỆC: đọc dữ liệu (đã validate/sanitize) và xuất ra HTML.
 * Không xử lý action Delete ở đây nữa — toàn bộ đã chuyển sang
 * seolive_handle_admin_actions() ở trên, chạy sớm hơn qua hook 'admin_init'.
 */
function seolive_render_logs_admin_page() {

	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( esc_html__( 'Bạn không có quyền truy cập trang này.', 'seoulive-core' ) );
	}

	// Thông báo kết quả Delete — đọc từ query string sau khi admin_init đã
	// redirect về đây (KHÔNG xử lý logic xóa ở đây, chỉ HIỂN THỊ kết quả).
	if ( isset( $_GET['deleted'] ) ) {
		$deleted_status = sanitize_key( wp_unslash( $_GET['deleted'] ) );

		$messages = array(
			'success'   => array( 'notice-success', __( 'Đã xóa log thành công.', 'seoulive-core' ) ),
			'not_found' => array( 'notice-warning', __( 'Không tìm thấy log để xóa.', 'seoulive-core' ) ),
			'invalid'   => array( 'notice-error', __( 'ID log không hợp lệ.', 'seoulive-core' ) ),
			'error'     => array( 'notice-error', __( 'Lỗi database khi xóa log.', 'seoulive-core' ) ),
		);

		if ( isset( $messages[ $deleted_status ] ) ) {
			printf(
				'<div class="notice %1$s is-dismissible"><p>%2$s</p></div>',
				esc_attr( $messages[ $deleted_status ][0] ),
				esc_html( $messages[ $deleted_status ][1] )
			);
		}
	}

	// SEARCH: đọc + validate user_id từ $_GET. absint() vừa sanitize (ép số)
	// vừa validate (số âm/chữ sẽ tự thành 0 = "không lọc").
	$search_user_id = isset( $_GET['search_user_id'] ) ? absint( $_GET['search_user_id'] ) : 0;

	// PAGINATION: validate $paged luôn >= 1.
	$paged = isset( $_GET['paged'] ) ? max( 1, absint( $_GET['paged'] ) ) : 1;

	$per_page    = 10;
	$total_logs  = seolive_count_logs( $search_user_id );
	$total_pages = (int) ceil( $total_logs / $per_page );
	$logs        = seolive_get_logs_paginated( $paged, $search_user_id, $per_page );
	?>
	<div class="wrap">
		<h1><?php esc_html_e( 'Seolive Logs', 'seoulive-core' ); ?></h1>

		<!--
			SEARCH FORM: dùng method="get" nên khi Search sẽ redirect ra đúng
			URL kèm ?search_user_id=..., không cần AJAX, không cần nonce (GET
			chỉ đọc dữ liệu, không thay đổi gì trong DB nên không cần chống CSRF).
		-->
		<form method="get" style="margin: 16px 0;">
			<input type="hidden" name="page" value="seolive-logs">
			<label for="search_user_id"><?php esc_html_e( 'Search User ID:', 'seoulive-core' ); ?></label>
			<input
				type="number"
				min="1"
				name="search_user_id"
				id="search_user_id"
				value="<?php echo esc_attr( $search_user_id > 0 ? $search_user_id : '' ); ?>"
				style="width: 120px;">
			<button type="submit" class="button"><?php esc_html_e( 'Search', 'seoulive-core' ); ?></button>
			<?php if ( $search_user_id > 0 ) : ?>
				<a href="<?php echo esc_url( admin_url( 'admin.php?page=seolive-logs' ) ); ?>" class="button">
					<?php esc_html_e( 'Xóa bộ lọc', 'seoulive-core' ); ?>
				</a>
			<?php endif; ?>
		</form>

		<table class="wp-list-table widefat fixed striped">
			<thead>
				<tr>
					<th><?php esc_html_e( 'ID', 'seoulive-core' ); ?></th>
					<th><?php esc_html_e( 'User ID', 'seoulive-core' ); ?></th>
					<th><?php esc_html_e( 'Action', 'seoulive-core' ); ?></th>
					<th><?php esc_html_e( 'Created At', 'seoulive-core' ); ?></th>
					<th><?php esc_html_e( 'Action', 'seoulive-core' ); ?></th>
				</tr>
			</thead>
			<tbody>
				<?php if ( $logs ) : ?>
					<?php foreach ( $logs as $log ) : ?>
						<tr>
							<td><?php echo esc_html( $log->id ); ?></td>
							<td><?php echo esc_html( $log->user_id ); ?></td>
							<td><?php echo esc_html( $log->action_name ); ?></td>
							<td><?php echo esc_html( $log->created_at ); ?></td>
							<td>
								<a href="<?php echo esc_url( wp_nonce_url( admin_url( 'admin.php?page=seolive-logs&action=delete&log_id=' . $log->id ), 'seolive_delete_log_' . $log->id ) ); ?>"
									onclick="return confirm('<?php echo esc_js( __( 'Xóa log này?', 'seoulive-core' ) ); ?>');">
									<?php esc_html_e( 'Delete', 'seoulive-core' ); ?>
								</a>
							</td>
						</tr>
					<?php endforeach; ?>
				<?php else : ?>
					<tr>
						<td colspan="5"><?php esc_html_e( 'Chưa có log nào.', 'seoulive-core' ); ?></td>
					</tr>
				<?php endif; ?>
			</tbody>
		</table>

		<?php if ( $total_pages > 1 ) : ?>
			<div class="tablenav">
				<div class="tablenav-pages">
					<?php
					// Giữ nguyên search_user_id khi chuyển trang, chỉ đổi 'paged'.
					$base_args = array( 'page' => 'seolive-logs' );
					if ( $search_user_id > 0 ) {
						$base_args['search_user_id'] = $search_user_id;
					}

					echo wp_kses_post(
						paginate_links(
							array(
								'base'      => add_query_arg( array_merge( $base_args, array( 'paged' => '%#%' ) ), admin_url( 'admin.php' ) ),
								'format'    => '',
								'current'   => $paged,
								'total'     => $total_pages,
								'prev_text' => __( '« Previous', 'seoulive-core' ),
								'next_text' => __( 'Next »', 'seoulive-core' ),
							)
						)
					);
					?>
				</div>
			</div>
		<?php endif; ?>

	</div>
	<?php
}