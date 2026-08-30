<?php
/**
 * Seolive_Logs_Repository — lớp DUY NHẤT được phép chạm vào dữ liệu cho REST
 * API log. Controller KHÔNG viết SQL trực tiếp, mọi truy vấn đi qua đây.
 *
 * Các hàm $wpdb gốc (đã viết + test cho trang Admin ở
 * includes/seoulive-logs.php: seolive_get_logs_paginated(), seolive_count_logs(),
 * seolive_get_log(), seolive_delete_log()) được TÁI SỬ DỤNG nguyên vẹn ở đây,
 * không viết lại SQL từ đầu — tránh 2 nơi có 2 câu SQL khác nhau cùng thao
 * tác 1 bảng, dễ lệch logic khi sửa sau này. Repository ở đây chỉ đóng vai
 * trò "cổng vào" thống nhất cho REST API, cộng thêm lớp cache (Transients).
 *
 * @package Seoulive_Core
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Repository truy xuất/xóa dữ liệu bảng log, có cache qua Transients API.
 */
class Seolive_Logs_Repository {

	/**
	 * Tên option lưu "phiên bản cache" hiện tại — dùng để invalidate toàn bộ
	 * cache danh sách log cùng lúc mà KHÔNG cần biết chính xác có bao nhiêu
	 * transient đang tồn tại (mỗi tổ hợp page/per_page/user_id ra 1
	 * transient riêng — không có cách nào liệt kê hết để xóa từng cái, vì
	 * Transients API không hỗ trợ xóa theo pattern/wildcard).
	 *
	 * Cách hoạt động: mỗi transient cache được đặt tên có kèm số phiên bản
	 * này. Khi có DELETE, chỉ cần TĂNG số phiên bản lên — mọi transient cũ
	 * (mang số phiên bản cũ) coi như "mồ côi", request sau sẽ build ra 1
	 * cache key mới (khác version), không bao giờ đọc trúng data cũ nữa. Các
	 * transient cũ tự hết hạn theo TTL bình thường, không cần dọn tay.
	 *
	 * @var string
	 */
	const CACHE_VERSION_OPTION = 'seolive_logs_cache_version';

	/**
	 * Thời gian sống của cache danh sách log.
	 *
	 * @var int
	 */
	const CACHE_TTL = 5 * MINUTE_IN_SECONDS;

	/**
	 * Lấy danh sách log có phân trang, có cache qua Transients API.
	 *
	 * @param int $page     Trang hiện tại (>= 1).
	 * @param int $per_page Số dòng mỗi trang.
	 * @param int $user_id  Lọc theo user_id nếu > 0, bỏ qua nếu = 0.
	 * @return array{items: array, total: int, total_pages: int}
	 */
	public function get_logs( $page, $per_page, $user_id ) {

		$cache_key = $this->build_list_cache_key( $page, $per_page, $user_id );
		$cached    = get_transient( $cache_key );

		if ( false !== $cached ) {
			return $cached;
		}

		// Tái sử dụng đúng hàm $wpdb đã có sẵn (đã dùng prepare() đầy đủ) —
		// xem includes/seoulive-logs.php. KHÔNG viết SQL mới ở đây.
		$items = seolive_get_logs_paginated( $page, $user_id, $per_page );
		$total = seolive_count_logs( $user_id );

		$result = array(
			'items'       => $items,
			'total'       => $total,
			'total_pages' => (int) ceil( $total / $per_page ),
		);

		set_transient( $cache_key, $result, self::CACHE_TTL );

		return $result;
	}

	/**
	 * Lấy 1 log theo ID — không cache riêng lẻ, vì single item ít bị gọi lặp
	 * lại tới mức cần cache (khác với danh sách, hay bị gọi lại liên tục).
	 *
	 * @param int $id ID log.
	 * @return object|null
	 */
	public function get_log( $id ) {
		return seolive_get_log( $id );
	}

	/**
	 * Xóa 1 log theo ID, đồng thời invalidate cache danh sách nếu xóa thành công.
	 *
	 * @param int $id ID log.
	 * @return string 'success' | 'not_found' | 'error' | 'invalid'.
	 */
	public function delete_log( $id ) {
		$result = seolive_delete_log( $id );

		if ( 'success' === $result ) {
			$this->bump_cache_version();
		}

		return $result;
	}

	/**
	 * Tăng số phiên bản cache lên 1 — cách "vô hiệu hóa" toàn bộ cache danh
	 * sách log hiện có mà không cần liệt kê/xóa từng transient cụ thể.
	 */
	private function bump_cache_version() {
		$version = (int) get_option( self::CACHE_VERSION_OPTION, 1 );
		update_option( self::CACHE_VERSION_OPTION, $version + 1 );
	}

	/**
	 * Build cache key duy nhất cho 1 tổ hợp (page, per_page, user_id), có
	 * kèm số phiên bản cache hiện tại.
	 *
	 * @param int $page     Trang hiện tại.
	 * @param int $per_page Số dòng mỗi trang.
	 * @param int $user_id  Lọc theo user_id.
	 * @return string
	 */
	private function build_list_cache_key( $page, $per_page, $user_id ) {
		$version = (int) get_option( self::CACHE_VERSION_OPTION, 1 );

		return sprintf( 'seolive_logs_v%d_p%d_pp%d_u%d', $version, $page, $per_page, $user_id );
	}
}