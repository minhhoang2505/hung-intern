<?php
/**
 * Seolive_Logs_Controller — đăng ký + xử lý REST API cho bảng
 * {$wpdb->prefix}seolive_logs, namespace 'seolive/v1'.
 *
 * CHỈ xử lý Request/Response — KHÔNG viết SQL trực tiếp ở đây, mọi thao tác
 * dữ liệu đều gọi qua Seolive_Logs_Repository.
 *
 * Endpoints:
 *   GET    /wp-json/seolive/v1/logs
 *   GET    /wp-json/seolive/v1/logs/{id}
 *   DELETE /wp-json/seolive/v1/logs/{id}
 *
 * @package Seoulive_Core
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Controller xử lý REST API cho log — chỉ nhận Request, gọi Repository, trả Response.
 */
class Seolive_Logs_Controller {

	/**
	 * REST namespace dùng cho toàn bộ endpoint của controller này.
	 *
	 * @var string
	 */
	const NAMESPACE_NAME = 'seolive/v1';

	/**
	 * Route base (phần sau namespace) cho endpoint log.
	 *
	 * @var string
	 */
	const REST_BASE = 'logs';

	/**
	 * Repository xử lý toàn bộ truy vấn Database — controller không viết SQL.
	 *
	 * @var Seolive_Logs_Repository
	 */
	private $repository;

	/**
	 * Khởi tạo repository ngay khi controller được tạo.
	 */
	public function __construct() {
		$this->repository = new Seolive_Logs_Repository();
	}

	/**
	 * Đăng ký 3 route: GET list, GET single, DELETE.
	 * Gọi qua hook 'rest_api_init' (xem add_action() cuối file).
	 */
	public static function register_routes() {
		$controller = new self();

		register_rest_route(
			self::NAMESPACE_NAME,
			'/' . self::REST_BASE,
			array(
				'methods'             => WP_REST_Server::READABLE, // GET.
				'callback'            => array( $controller, 'get_items' ),
				'permission_callback' => array( $controller, 'check_permission' ),
				'args'                => array(
					'page'     => array(
						'default'           => 1,
						'sanitize_callback' => 'absint',
						'validate_callback' => array( __CLASS__, 'validate_page' ),
					),
					'per_page' => array(
						'default'           => 10,
						'sanitize_callback' => 'absint',
						'validate_callback' => array( __CLASS__, 'validate_per_page' ),
					),
					'user_id'  => array(
						'default'           => 0,
						'sanitize_callback' => 'absint',
						'validate_callback' => array( __CLASS__, 'validate_user_id' ),
					),
				),
			)
		);

		register_rest_route(
			self::NAMESPACE_NAME,
			'/' . self::REST_BASE . '/(?P<id>\d+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE, // GET.
					'callback'            => array( $controller, 'get_item' ),
					'permission_callback' => array( $controller, 'check_permission' ),
					'args'                => self::get_id_arg_schema(),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE, // DELETE.
					'callback'            => array( $controller, 'delete_item' ),
					'permission_callback' => array( $controller, 'check_permission' ),
					'args'                => self::get_id_arg_schema(),
				),
			)
		);
	}

	/**
	 * Schema validate chung cho tham số {id} trên route — dùng lại cho cả
	 * GET single và DELETE, tránh lặp code.
	 *
	 * @return array
	 */
	private static function get_id_arg_schema() {
		return array(
			'id' => array(
				'required'          => true,
				'sanitize_callback' => 'absint',
				'validate_callback' => array( __CLASS__, 'validate_id' ),
			),
		);
	}

	/**
	 * Validate tham số 'page' — phải là số nguyên >= 1.
	 *
	 * @param mixed $value Giá trị 'page' nhận từ request.
	 * @return bool
	 */
	public static function validate_page( $value ) {
		return is_numeric( $value ) && (int) $value >= 1;
	}

	/**
	 * Validate tham số 'per_page' — giới hạn 1-100.
	 *
	 * @param mixed $value Giá trị 'per_page' nhận từ request.
	 * @return bool
	 */
	public static function validate_per_page( $value ) {
		// Giới hạn tối đa 100/trang — chống việc client cố tình gọi
		// per_page=999999 để kéo hết toàn bộ dữ liệu trong 1 request.
		return is_numeric( $value ) && (int) $value >= 1 && (int) $value <= 100;
	}

	/**
	 * Validate tham số 'user_id' — phải là số nguyên >= 0.
	 *
	 * @param mixed $value Giá trị 'user_id' nhận từ request.
	 * @return bool
	 */
	public static function validate_user_id( $value ) {
		return is_numeric( $value ) && (int) $value >= 0;
	}

	/**
	 * Validate tham số 'id' — phải là số nguyên dương.
	 *
	 * @param mixed $value Giá trị 'id' nhận từ route.
	 * @return bool
	 */
	public static function validate_id( $value ) {
		return is_numeric( $value ) && (int) $value > 0;
	}

	/**
	 * BẢO MẬT: chỉ user có quyền quản trị mới được đọc/xóa log — dữ liệu log
	 * (user_id, hành động) là thông tin nhạy cảm, không public. Cùng
	 * capability với trang Admin quản lý log (nhất quán quyền hạn).
	 *
	 * @return bool
	 */
	public function check_permission() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Xử lý GET /wp-json/seolive/v1/logs.
	 *
	 * @param WP_REST_Request $request Request hiện tại, gồm page/per_page/user_id.
	 * @return WP_REST_Response
	 */
	public function get_items( WP_REST_Request $request ) {
		$page     = (int) $request->get_param( 'page' );
		$per_page = (int) $request->get_param( 'per_page' );
		$user_id  = (int) $request->get_param( 'user_id' );

		$result = $this->repository->get_logs( $page, $per_page, $user_id );

		if ( empty( $result['items'] ) ) {
			return new WP_REST_Response(
				array(
					'items'       => array(),
					'total'       => 0,
					'total_pages' => 0,
					'page'        => $page,
					'per_page'    => $per_page,
					'message'     => __( 'Không có log nào phù hợp.', 'seoulive-core' ),
				),
				200
			);
		}

		return new WP_REST_Response(
			array(
				'items'       => $result['items'],
				'total'       => $result['total'],
				'total_pages' => $result['total_pages'],
				'page'        => $page,
				'per_page'    => $per_page,
			),
			200
		);
	}

	/**
	 * Xử lý GET /wp-json/seolive/v1/logs/{id}.
	 *
	 * @param WP_REST_Request $request Request hiện tại, gồm tham số route 'id'.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_item( WP_REST_Request $request ) {
		$id  = (int) $request->get_param( 'id' );
		$log = $this->repository->get_log( $id );

		if ( ! $log ) {
			return new WP_Error(
				'seolive_log_not_found',
				__( 'Không tìm thấy log với ID này.', 'seoulive-core' ),
				array( 'status' => 404 )
			);
		}

		return new WP_REST_Response( $log, 200 );
	}

	/**
	 * Xử lý DELETE /wp-json/seolive/v1/logs/{id}.
	 *
	 * @param WP_REST_Request $request Request hiện tại, gồm tham số route 'id'.
	 * @return WP_REST_Response|WP_Error
	 */
	public function delete_item( WP_REST_Request $request ) {
		$id     = (int) $request->get_param( 'id' );
		$result = $this->repository->delete_log( $id );

		switch ( $result ) {
			case 'success':
				return new WP_REST_Response(
					array(
						'deleted' => true,
						'id'      => $id,
					),
					200
				);

			case 'not_found':
				return new WP_Error(
					'seolive_log_not_found',
					__( 'Không tìm thấy log với ID này.', 'seoulive-core' ),
					array( 'status' => 404 )
				);

			case 'invalid':
				return new WP_Error(
					'seolive_invalid_id',
					__( 'ID log không hợp lệ.', 'seoulive-core' ),
					array( 'status' => 400 )
				);

			default:
				return new WP_Error(
					'seolive_delete_failed',
					__( 'Lỗi database khi xóa log.', 'seoulive-core' ),
					array( 'status' => 500 )
				);
		}
	}
}

add_action( 'rest_api_init', array( 'Seolive_Logs_Controller', 'register_routes' ) );