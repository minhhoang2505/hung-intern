<?php
/**
 * Plugin Name:       Seoulive Core
 * Plugin URI:        https://www.youtube.com/watch?v=dQw4w9WgXcQ
 * Description:       Hihi
 * Version:           1.0.0
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            Terries
 * Author URI:        https://www.youtube.com/watch?v=dQw4w9WgXcQ
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       seoulive-core
 *
 * @package Seoulive_Core
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Main plugin class.
 *
 * Registers the Seoulive product post type, brand taxonomy, price meta box,
 * REST enhancements and the custom user registration endpoint.
 */
class Seoulive_Core_Plugin {

	/**
	 * Singleton instance.
	 *
	 * @var Seoulive_Core_Plugin|null
	 */
	private static $instance = null;

	/**
	 * REST namespace used by this plugin's custom endpoints.
	 *
	 * @var string
	 */
	private $rest_namespace = 'seoulive/v1';

	/**
	 * Get (or create) the single instance of the plugin.
	 *
	 * @return Seoulive_Core_Plugin
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Constructor. Wires up all WordPress hooks.
	 */
	private function __construct() {
		add_action( 'init', array( $this, 'register_product_post_type' ) );
		add_action( 'init', array( $this, 'register_brand_taxonomy' ) );
		add_action( 'init', array( $this, 'register_price_meta_for_rest' ) );
		add_action( 'init', array( $this, 'register_order_post_type' ) );

		// Quick-order feature: cache invalidation + email notification.
		add_action( 'seoulive_new_order_created', array( $this, 'invalidate_product_cache_on_order' ), 10, 2 );
		add_action( 'seoulive_new_order_created', array( $this, 'notify_admin_on_order' ), 10, 2 );

		// FIX: cache cũng phải được xoá khi admin tự sửa sản phẩm trong wp-admin
		// (đổi giá, đổi tồn kho...), không chỉ khi có đơn hàng mới. Trước đây thiếu
		// hook này nên sửa tồn kho xong Next.js vẫn thấy data cache cũ tới 1 tiếng.
		add_action( 'save_post_seoulive_product', array( $this, 'invalidate_product_cache_on_save' ) );

		// Logging: WordPress tự bắn hook này bất cứ khi nào wp_mail() thất bại
		// (SMTP auth sai, mất kết nối...). Chỉ log lại, không làm gián đoạn
		// response đã trả về Next.js — xem chi tiết ở log_mail_failure().
		add_action( 'wp_mail_failed', array( $this, 'log_mail_failure' ) );

		add_action( 'add_meta_boxes', array( $this, 'add_price_meta_box' ) );
		add_action( 'save_post', array( $this, 'save_price_meta' ) );

		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );
		add_filter( 'rest_prepare_seoulive_product', array( $this, 'add_discount_percentage' ), 10, 3 );

		// Caching cho danh sách sản phẩm (Transients API) — xem chi tiết ở khối
		// method get_products_cache_version() / check_products_cache() /
		// save_products_cache() phía cuối class.
		add_filter( 'rest_pre_dispatch', array( $this, 'check_products_cache' ), 10, 3 );
		add_filter( 'rest_post_dispatch', array( $this, 'save_products_cache' ), 10, 3 );

		add_action( 'user_register', array( $this, 'log_new_registration' ) );

		// Keep Application Passwords available even on non-HTTPS/local
		// environments, required by the REST registration flow.
		add_filter( 'wp_is_application_passwords_available', '__return_true' );
	}

	/**
	 * Register the "seoulive_product" custom post type.
	 */
	public function register_product_post_type() {

		$labels = array(
			'name'               => __( 'Sản phẩm', 'seoulive-core' ),
			'singular_name'      => __( 'Sản phẩm', 'seoulive-core' ),
			'menu_name'          => __( 'Sản phẩm Seoulive', 'seoulive-core' ),
			'add_new'            => __( 'Thêm sản phẩm', 'seoulive-core' ),
			'add_new_item'       => __( 'Thêm sản phẩm mới', 'seoulive-core' ),
			'edit_item'          => __( 'Sửa sản phẩm', 'seoulive-core' ),
			'new_item'           => __( 'Sản phẩm mới', 'seoulive-core' ),
			'view_item'          => __( 'Xem sản phẩm', 'seoulive-core' ),
			'all_items'          => __( 'Tất cả sản phẩm', 'seoulive-core' ),
			'search_items'       => __( 'Tìm sản phẩm', 'seoulive-core' ),
			'not_found'          => __( 'Không tìm thấy sản phẩm nào.', 'seoulive-core' ),
			'not_found_in_trash' => __( 'Không có sản phẩm nào trong thùng rác.', 'seoulive-core' ),
		);

		$args = array(
			'labels'        => $labels,
			'public'        => true,
			'has_archive'   => true,
			'show_in_menu'  => true,
			'menu_icon'     => 'dashicons-cart',
			'menu_position' => 5,
			// FIX: 'custom-fields' bắt buộc phải có ở đây thì WordPress mới đưa object
			// "meta" vào REST response. Thiếu dòng này thì dù register_post_meta() đã
			// bật show_in_rest cho regular_price/sale_price/stock cũng vô nghĩa — REST
			// API sẽ không bao giờ trả field "meta" về, khiến Next.js luôn đọc được
			// stock = undefined và hiển thị nhầm là hết hàng.
			'supports'      => array( 'title', 'editor', 'thumbnail', 'custom-fields' ),
			'rewrite'       => array( 'slug' => 'san-pham' ),
			'show_in_rest'  => true,
			'rest_base'     => 'seoulive_product',
		);

		register_post_type( 'seoulive_product', $args );
	}

	/**
	 * Register the "product_brand" taxonomy.
	 */
	public function register_brand_taxonomy() {

		$labels = array(
			'name'          => __( 'Thương hiệu', 'seoulive-core' ),
			'singular_name' => __( 'Thương hiệu', 'seoulive-core' ),
			'menu_name'     => __( 'Thương hiệu', 'seoulive-core' ),
			'all_items'     => __( 'Tất cả thương hiệu', 'seoulive-core' ),
			'edit_item'     => __( 'Sửa thương hiệu', 'seoulive-core' ),
			'add_new_item'  => __( 'Thêm thương hiệu mới', 'seoulive-core' ),
			'search_items'  => __( 'Tìm thương hiệu', 'seoulive-core' ),
		);

		$args = array(
			'labels'            => $labels,
			'hierarchical'      => true,
			'public'            => true,
			'show_ui'           => true,
			'show_admin_column' => true,
			'rewrite'           => array( 'slug' => 'brand' ),
			'show_in_rest'      => true,
		);

		register_taxonomy( 'product_brand', array( 'seoulive_product' ), $args );
	}

	/**
	 * Register REST meta fields for regular/sale price.
	 */
	public function register_price_meta_for_rest() {
		$args = array(
			'show_in_rest'  => true,
			'single'        => true,
			'type'          => 'string',
			'auth_callback' => function () {
				return current_user_can( 'edit_posts' );
			},
		);

		register_post_meta( 'seoulive_product', 'regular_price', $args );
		register_post_meta( 'seoulive_product', 'sale_price', $args );
		register_post_meta( 'seoulive_product', 'stock', $args );
	}

	/**
	 * Register the "seoulive_order" custom post type (admin-only, not public).
	 * Used to store quick orders created from the headless Next.js frontend.
	 */
	public function register_order_post_type() {

		$labels = array(
			'name'          => __( 'Đơn hàng', 'seoulive-core' ),
			'singular_name' => __( 'Đơn hàng', 'seoulive-core' ),
			'menu_name'     => __( 'Đơn hàng Seoulive', 'seoulive-core' ),
			'all_items'     => __( 'Tất cả đơn hàng', 'seoulive-core' ),
			'view_item'     => __( 'Xem đơn hàng', 'seoulive-core' ),
			'search_items'  => __( 'Tìm đơn hàng', 'seoulive-core' ),
			'not_found'     => __( 'Không tìm thấy đơn hàng nào.', 'seoulive-core' ),
		);

		$args = array(
			'labels'          => $labels,
			'public'          => false,
			'show_ui'         => true,
			'show_in_menu'    => true,
			'menu_icon'       => 'dashicons-clipboard',
			'menu_position'   => 6,
			'supports'        => array( 'title' ),
			'show_in_rest'    => false, // Không expose ra REST mặc định, chỉ tạo qua endpoint riêng bên dưới.
			'capability_type' => 'post',
		);

		register_post_type( 'seoulive_order', $args );
	}

	/**
	 * Add the price meta box to the product edit screen.
	 */
	public function add_price_meta_box() {
		add_meta_box(
			'seoulive_price_meta_box',
			__( 'Thông tin giá', 'seoulive-core' ),
			array( $this, 'render_price_meta_box' ),
			'seoulive_product',
			'side',
			'high'
		);
	}

	/**
	 * Render the price meta box fields.
	 *
	 * @param WP_Post $post Current post object.
	 */
	public function render_price_meta_box( $post ) {

		wp_nonce_field( 'seoulive_save_price_meta', 'seoulive_price_meta_nonce' );

		$regular_price = get_post_meta( $post->ID, 'regular_price', true );
		$sale_price    = get_post_meta( $post->ID, 'sale_price', true );
		?>
		<p>
			<label for="seoulive_regular_price"><strong><?php esc_html_e( 'Giá gốc ($)', 'seoulive-core' ); ?></strong></label><br>
			<input
				type="number"
				step="0.01"
				min="0"
				name="seoulive_regular_price"
				id="seoulive_regular_price"
				value="<?php echo esc_attr( $regular_price ); ?>"
				class="widefat">
		</p>
		<p>
			<label for="seoulive_sale_price"><strong><?php esc_html_e( 'Giá khuyến mãi ($)', 'seoulive-core' ); ?></strong></label><br>
			<input
				type="number"
				step="0.01"
				min="0"
				name="seoulive_sale_price"
				id="seoulive_sale_price"
				value="<?php echo esc_attr( $sale_price ); ?>"
				class="widefat">
			<span class="description"><?php esc_html_e( 'Để trống nếu sản phẩm không giảm giá.', 'seoulive-core' ); ?></span>
		</p>
		<p>
			<label for="seoulive_stock"><strong><?php esc_html_e( 'Tồn kho', 'seoulive-core' ); ?></strong></label><br>
			<input
				type="number"
				step="1"
				min="0"
				name="seoulive_stock"
				id="seoulive_stock"
				value="<?php echo esc_attr( get_post_meta( $post->ID, 'stock', true ) ); ?>"
				class="widefat">
		</p>
		<?php
	}

	/**
	 * Save the price meta box fields.
	 *
	 * @param int $post_id Post ID being saved.
	 */
	public function save_price_meta( $post_id ) {

		if (
			! isset( $_POST['seoulive_price_meta_nonce'] ) ||
			! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['seoulive_price_meta_nonce'] ) ), 'seoulive_save_price_meta' )
		) {
			return;
		}

		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}

		if ( ! isset( $_POST['post_type'] ) || 'seoulive_product' !== $_POST['post_type'] ) {
			return;
		}

		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}

		if ( isset( $_POST['seoulive_regular_price'] ) ) {
			$regular_price = sanitize_text_field( wp_unslash( $_POST['seoulive_regular_price'] ) );
			update_post_meta( $post_id, 'regular_price', $regular_price );
		}

		if ( isset( $_POST['seoulive_sale_price'] ) ) {
			$sale_price = sanitize_text_field( wp_unslash( $_POST['seoulive_sale_price'] ) );
			update_post_meta( $post_id, 'sale_price', $sale_price );
		}

		if ( isset( $_POST['seoulive_stock'] ) ) {
			$stock = absint( wp_unslash( $_POST['seoulive_stock'] ) );
			update_post_meta( $post_id, 'stock', $stock );
		}
	}

	/**
	 * Register custom REST routes (e.g. /seoulive/v1/register).
	 */
	public function register_rest_routes() {
		register_rest_route(
			$this->rest_namespace,
			'/register',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'handle_user_registration' ),
				'permission_callback' => '__return_true',
			)
		);

		register_rest_route(
			$this->rest_namespace,
			'/quick-order',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'handle_quick_order' ),
				'permission_callback' => array( $this, 'quick_order_permission_check' ),
				'args'                => array(
					'name'       => array(
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
					'phone'      => array(
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
					'address'    => array(
						'required'          => true,
						'sanitize_callback' => 'sanitize_textarea_field',
					),
					'product_id' => array(
						'required'          => true,
						'sanitize_callback' => 'absint',
					),
				),
			)
		);
	}

	/**
	 * Permission check for POST /seoulive/v1/quick-order.
	 *
	 * Chặn spam bằng 2 lớp:
	 * 1) Secret header dùng chung với server Next.js (không lộ ra browser).
	 * 2) Rate limit theo IP bằng Transient (tối đa 5 request/phút).
	 *
	 * @param WP_REST_Request $request Incoming request.
	 * @return bool|WP_Error
	 */
	public function quick_order_permission_check( WP_REST_Request $request ) {

		$secret = $request->get_header( 'x-seoulive-secret' );

		if ( ! defined( 'SEOULIVE_API_SECRET' ) || ! $secret || ! hash_equals( SEOULIVE_API_SECRET, $secret ) ) {
			return new WP_Error( 'forbidden', __( 'Không có quyền truy cập.', 'seoulive-core' ), array( 'status' => 403 ) );
		}

		$ip = $request->get_header( 'x-seoulive-client-ip' );
		if ( ! $ip ) {
			$ip = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '0.0.0.0';
		}
		$rate_limit_key = 'seoulive_rl_' . md5( $ip );
		$count          = (int) get_transient( $rate_limit_key );

		if ( $count >= 5 ) {
			return new WP_Error(
				'rate_limited',
				__( 'Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút.', 'seoulive-core' ),
				array( 'status' => 429 )
			);
		}

		set_transient( $rate_limit_key, $count + 1, MINUTE_IN_SECONDS );

		return true;
	}

	/**
	 * Handle POST /seoulive/v1/quick-order — creates a quick order from the
	 * headless Next.js product page, decrementing stock atomically to avoid
	 * race conditions.
	 *
	 * @param WP_REST_Request $request Incoming request.
	 * @return array|WP_Error
	 */
	public function handle_quick_order( WP_REST_Request $request ) {
		global $wpdb;

		$name       = $request->get_param( 'name' );
		$phone      = $request->get_param( 'phone' );
		$address    = $request->get_param( 'address' );
		$product_id = $request->get_param( 'product_id' );

		if ( ! preg_match( '/^[0-9+ ]{9,15}$/', $phone ) ) {
			return new WP_Error( 'invalid_phone', __( 'Số điện thoại không hợp lệ.', 'seoulive-core' ), array( 'status' => 400 ) );
		}

		$product = get_post( $product_id );
		if ( ! $product || 'seoulive_product' !== $product->post_type ) {
			return new WP_Error( 'invalid_product', __( 'Sản phẩm không tồn tại.', 'seoulive-core' ), array( 'status' => 400 ) );
		}

		// RACE CONDITION FIX: trừ kho bằng 1 câu UPDATE atomic có điều kiện,
		// KHÔNG được đọc stock ra PHP rồi tính toán rồi ghi lại (2 bước đó không atomic
		// khi có 2 request chạy gần như song song).
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Bắt buộc dùng $wpdb->query() trực tiếp để đảm bảo phép trừ kho ATOMIC (WHERE ... AND stock > 0); các hàm WP cấp cao (update_post_meta) không đảm bảo tính atomic này. Không áp dụng object cache cho câu UPDATE ghi dữ liệu.
		$updated = $wpdb->query(
			$wpdb->prepare(
				"UPDATE {$wpdb->postmeta}
				 SET meta_value = meta_value - 1
				 WHERE post_id = %d
				   AND meta_key = 'stock'
				   AND CAST( meta_value AS SIGNED ) > 0",
				$product_id
			)
		);

		if ( ! $updated ) {
			return new WP_Error( 'out_of_stock', __( 'Sản phẩm vừa hết hàng, vui lòng chọn sản phẩm khác.', 'seoulive-core' ), array( 'status' => 409 ) );
		}

		$order_id = wp_insert_post(
			array(
				'post_type'   => 'seoulive_order',
				'post_title'  => sprintf( 'Đơn hàng nhanh - %s', $name ),
				'post_status' => 'publish',
				'meta_input'  => array(
					'customer_name'    => $name,
					'customer_phone'   => $phone,
					'customer_address' => $address,
					'product_id'       => $product_id,
				),
			)
		);

		if ( is_wp_error( $order_id ) || ! $order_id ) {
			// Rollback kho nếu tạo đơn thất bại, tránh mất hàng oan.
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Rollback đối xứng với UPDATE atomic phía trên, cùng lý do phải thao tác trực tiếp trên $wpdb.
			$wpdb->query(
				$wpdb->prepare(
					"UPDATE {$wpdb->postmeta} SET meta_value = meta_value + 1 WHERE post_id = %d AND meta_key = 'stock'",
					$product_id
				)
			);

			// Ghi chi tiết lỗi thật vào debug.log để dev tự trace được nguyên nhân
			// (VD: lỗi DB, lỗi permission...) — KHÔNG echo/var_dump ra ngoài,
			// vì response cho Next.js phải luôn là JSON thuần, không được lẫn
			// bất kỳ output nào khác làm hỏng res.json() phía front-end.
			$error_detail = is_wp_error( $order_id )
				? $order_id->get_error_message()
				: 'wp_insert_post() trả về giá trị rỗng/false không rõ lý do.';

			// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- Trace log chủ động theo yêu cầu bài tập, không phải debug sót lại.
			error_log(
				sprintf(
					'[Seoulive] handle_quick_order() THẤT BẠI khi tạo đơn hàng. product_id=%d, name=%s, phone=%s. Chi tiết: %s',
					$product_id,
					$name,
					$phone,
					$error_detail
				)
			);

			// Trả 400 cho Next.js theo đúng yêu cầu đề bài — front-end chỉ cần
			// biết "tạo đơn thất bại, thử lại", không cần và không nên nhận
			// chi tiết lỗi kỹ thuật (tránh lộ thông tin nội bộ hệ thống).
			return new WP_Error( 'order_failed', __( 'Không thể tạo đơn hàng, vui lòng thử lại.', 'seoulive-core' ), array( 'status' => 400 ) );
		}

		// Bắn 1 event duy nhất, các phần cache-invalidation và email tự lắng nghe riêng (xem constructor).
		do_action(
			'seoulive_new_order_created',
			$order_id,
			array(
				'name'         => $name,
				'phone'        => $phone,
				'address'      => $address,
				'product_id'   => $product_id,
				'product_name' => get_the_title( $product_id ),
			)
		);

		return array(
			'success'  => true,
			'order_id' => $order_id,
			'message'  => __( 'Đặt hàng thành công!', 'seoulive-core' ),
		);
	}

	/**
	 * Listener: xóa cache danh sách sản phẩm ngay khi có đơn hàng mới,
	 * vì cache hiện tại (seoulive_products_cache) chứa cả số lượng tồn kho.
	 *
	 * @param int   $order_id Newly created order ID.
	 * @param array $data     Order data (không dùng tới ở đây, giữ lại vì
	 *                        do_action('seoulive_new_order_created') luôn
	 *                        truyền 2 tham số cho mọi listener đăng ký).
	 */
	public function invalidate_product_cache_on_order( $order_id, $data ) { // phpcs:ignore -- $data không dùng tới, nhưng do_action() luôn truyền 2 tham số cho mọi listener đăng ký chung 1 hook.
		$this->bump_products_cache_version();
		// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- Trace log chủ động theo yêu cầu bài tập.
		error_log( 'Seoulive: Đã xóa cache sản phẩm do có đơn hàng mới #' . $order_id );
	}

	/**
	 * Listener: xóa cache danh sách/chi tiết sản phẩm khi admin lưu (thêm/sửa)
	 * một sản phẩm trong wp-admin. Trigger riêng với luồng đặt hàng ở trên vì
	 * đây là một "nguồn ghi dữ liệu" (write path) khác.
	 *
	 * @param int $post_id ID sản phẩm vừa được lưu.
	 */
	public function invalidate_product_cache_on_save( $post_id ) {
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}
		if ( wp_is_post_revision( $post_id ) ) {
			return;
		}
		$this->bump_products_cache_version();
		// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- Trace log chủ động theo yêu cầu bài tập.
		error_log( 'Seoulive: Đã xóa cache sản phẩm do sản phẩm #' . $post_id . ' vừa được lưu trong wp-admin.' );
	}

	/**
	 * Listener: báo admin qua email ngay khi có đơn hàng mới, không cần F5 kiểm tra.
	 *
	 * @param int   $order_id Newly created order ID.
	 * @param array $data     Order data.
	 */
	public function notify_admin_on_order( $order_id, $data ) {
		$to      = get_option( 'admin_email' );
		$subject = sprintf( '[Đơn hàng mới #%d] %s', $order_id, $data['product_name'] );
		$body    = "Có đơn hàng mới trên website:\n\n"
			. "Khách hàng: {$data['name']}\n"
			. "SĐT: {$data['phone']}\n"
			. "Địa chỉ: {$data['address']}\n"
			. "Sản phẩm: {$data['product_name']}\n\n"
			. 'Xem chi tiết: ' . admin_url( 'post.php?post=' . $order_id . '&action=edit' );

		wp_mail( $to, $subject, $body );
	}

	/**
	 * Listener: WordPress tự bắn hook 'wp_mail_failed' bất cứ khi nào wp_mail()
	 * thất bại (SMTP auth sai, mất kết nối tới Gmail...). Chỉ log lại, KHÔNG
	 * làm gián đoạn response đã trả về Next.js — vì lúc hook này chạy, đơn hàng
	 * đã được tạo và lưu vào DB thành công rồi, khách hàng không nên bị ảnh
	 * hưởng bởi một lỗi hoàn toàn nội bộ (admin chưa nhận được thông báo).
	 *
	 * @param WP_Error $error Đối tượng lỗi WordPress tự tạo, chứa chi tiết SMTP.
	 */
	public function log_mail_failure( $error ) {
		// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- Trace log chủ động theo yêu cầu bài tập, không phải debug sót lại.
		error_log(
			sprintf(
				'[Seoulive] wp_mail() THẤT BẠI khi gửi thông báo đơn hàng cho admin. Chi tiết: %s',
				$error->get_error_message()
			)
		);
	}

	/**
	 * Handle POST /seoulive/v1/register — creates a new subscriber account.
	 *
	 * @param WP_REST_Request $request Incoming request, gồm username/email/password.
	 * @return array|WP_Error
	 */
	public function handle_user_registration( WP_REST_Request $request ) {
		$username = sanitize_user( $request->get_param( 'username' ) );
		$email    = sanitize_email( $request->get_param( 'email' ) );
		$password = $request->get_param( 'password' );

		if ( empty( $username ) || empty( $email ) || empty( $password ) ) {
			return new WP_Error(
				'missing_fields',
				__( 'Vui lòng nhập đầy đủ username, email, password', 'seoulive-core' ),
				array( 'status' => 400 )
			);
		}

		if ( username_exists( $username ) ) {
			return new WP_Error(
				'username_exists',
				__( 'Username đã tồn tại', 'seoulive-core' ),
				array( 'status' => 409 )
			);
		}

		if ( email_exists( $email ) ) {
			return new WP_Error(
				'email_exists',
				__( 'Email đã được đăng ký', 'seoulive-core' ),
				array( 'status' => 409 )
			);
		}

		$user_id = wp_insert_user(
			array(
				'user_login' => $username,
				'user_email' => $email,
				'user_pass'  => $password,
				'role'       => 'subscriber',
			)
		);

		if ( is_wp_error( $user_id ) ) {
			return new WP_Error( 'registration_failed', $user_id->get_error_message(), array( 'status' => 500 ) );
		}

		return array(
			'success' => true,
			'user_id' => $user_id,
			'message' => __( 'Đăng ký thành công', 'seoulive-core' ),
		);
	}

	/**
	 * Append a computed discount percentage to the product REST response.
	 *
	 * @param WP_REST_Response $response The response object.
	 * @param WP_Post          $post     Post object của sản phẩm hiện tại.
	 * @param WP_REST_Request  $request  Request hiện tại (không dùng tới, giữ
	 *                                   lại vì filter 'rest_prepare_seoulive_product'
	 *                                   luôn truyền đủ 3 tham số cho mọi callback).
	 * @return WP_REST_Response
	 */
	public function add_discount_percentage( $response, $post, $request ) { // phpcs:ignore -- $request không dùng tới, nhưng filter 'rest_prepare_seoulive_product' luôn truyền đủ 3 tham số cho mọi callback.
		$regular_price = get_post_meta( $post->ID, 'regular_price', true );
		$sale_price    = get_post_meta( $post->ID, 'sale_price', true );

		$discount_percentage = null;

		if ( '' !== $regular_price && '' !== $sale_price && (float) $regular_price > 0 ) {
			$regular = (float) $regular_price;
			$sale    = (float) $sale_price;

			if ( $sale < $regular ) {
				$discount_percentage = round( ( ( $regular - $sale ) / $regular ) * 100 );
			}
		}

		$response->data['discount_percentage'] = $discount_percentage;

		return $response;
	}

	/**
	 * Log every new user registration to the PHP error log.
	 *
	 * @param int $user_id ID của user vừa đăng ký thành công.
	 */
	public function log_new_registration( $user_id ) {
		$user  = get_userdata( $user_id );
		$email = $user ? $user->user_email : 'unknown';

		// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- Chủ động dùng error_log() để ghi trace log theo đúng yêu cầu bài tập (không phải debug sót lại).
		error_log( 'Thành viên mới đăng ký: ' . $email );
	}

	// ---------- CACHING: Transients API cho danh sách sản phẩm ----------
	//
	// FIX quan trọng: bản cũ dùng ĐÚNG 1 transient key ('seoulive_products_cache')
	// cho MỌI request GET tới route này, bất kể query params (?slug=..., ?page=...).
	// Hậu quả: request đầu tiên (VD: list rỗng, hoặc slug khác) cache lại, rồi mọi
	// request sau — kể cả lấy đúng 1 sản phẩm theo slug khác — đều bị trả nhầm data
	// cũ đó trong tối đa 1 tiếng, dù DB đã đúng. Đây chính là lý do sản phẩm đã có
	// tồn kho > 0 trong wp-admin mà Next.js vẫn báo hết hàng.
	//
	// Cách fix: build cache key riêng cho từng tổ hợp query param, và thêm 1 "cache
	// version" lưu trong option — mỗi lần cần invalidate (có đơn hàng mới HOẶC admin
	// sửa sản phẩm) chỉ cần tăng version lên 1, mọi key cũ (ứng với mọi query khác
	// nhau) tự động bị coi là "miss" mà không cần biết hết có bao nhiêu biến thể key.

	/**
	 * Lấy version hiện tại của cache sản phẩm.
	 *
	 * @return int
	 */
	public function get_products_cache_version() {
		return (int) get_option( 'seoulive_products_cache_version', 1 );
	}

	/**
	 * Tăng version cache sản phẩm lên 1 => vô hiệu hoá toàn bộ cache cũ ngay lập tức,
	 * bất kể có bao nhiêu key (theo bao nhiêu query params) đang tồn tại.
	 */
	public function bump_products_cache_version() {
		update_option( 'seoulive_products_cache_version', $this->get_products_cache_version() + 1 );
	}

	/**
	 * Build transient key duy nhất cho từng tổ hợp query param + version hiện tại.
	 *
	 * @param WP_REST_Request $request Request hiện tại.
	 * @return string
	 */
	public function build_products_cache_key( $request ) {
		$params = $request->get_query_params();
		ksort( $params );
		return 'seoulive_pc_v' . $this->get_products_cache_version() . '_' . md5( wp_json_encode( $params ) );
	}

	/**
	 * Hook vào 'rest_pre_dispatch' — chạy TRƯỚC khi WordPress thực sự xử lý
	 * request. Nếu có cache hợp lệ, trả luôn data từ transient và bỏ qua
	 * hoàn toàn bước query Database.
	 *
	 * @param mixed           $result Giá trị mặc định (null nếu chưa ai xử lý).
	 * @param WP_REST_Server  $server REST server instance.
	 * @param WP_REST_Request $request Request hiện tại.
	 * @return mixed
	 */
	public function check_products_cache( $result, $server, $request ) {
		if ( '/wp/v2/seoulive_product' !== $request->get_route() || 'GET' !== $request->get_method() ) {
			return $result;
		}

		$cache_key   = $this->build_products_cache_key( $request );
		$cached_data = get_transient( $cache_key );

		if ( false !== $cached_data ) {
			// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- Trace log chủ động, phục vụ debug caching theo yêu cầu bài tập.
			error_log( 'Seoulive: Trả dữ liệu từ CACHE (transient) - key: ' . $cache_key );
			// Đánh dấu để rest_post_dispatch biết là đã dùng cache, không lưu lại nữa.
			$request->set_param( '_seoulive_from_cache', true );
			return rest_ensure_response( $cached_data );
		}

		return $result;
	}

	/**
	 * Hook vào 'rest_post_dispatch' — chạy SAU khi WordPress đã tự query
	 * Database và có response thật. Lưu lại response đó vào transient để
	 * lần gọi kế tiếp (với cùng query params) không cần chạm DB nữa.
	 *
	 * @param WP_REST_Response|WP_Error $response Response WordPress vừa tạo ra.
	 * @param WP_REST_Server            $server   REST server instance.
	 * @param WP_REST_Request           $request  Request hiện tại.
	 * @return WP_REST_Response|WP_Error
	 */
	public function save_products_cache( $response, $server, $request ) {
		if ( '/wp/v2/seoulive_product' !== $request->get_route() || 'GET' !== $request->get_method() ) {
			return $response;
		}

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		// Nếu data này vừa lấy từ cache ra, KHÔNG lưu lại nữa.
		if ( $request->get_param( '_seoulive_from_cache' ) ) {
			return $response;
		}

		$cache_key = $this->build_products_cache_key( $request );
		set_transient( $cache_key, $response->get_data(), 3600 );
		// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- Trace log chủ động, phục vụ debug caching theo yêu cầu bài tập.
		error_log( 'Seoulive: Đã LƯU cache mới (thời hạn 1 giờ) - key: ' . $cache_key );

		return $response;
	}
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

	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Custom table không có wrapper cấp cao (WP_Query) để thay thế; không có tham số động nào cần $wpdb->prepare() ở câu này.
	$logs = $wpdb->get_results(
		"SELECT id, user_id, action_name, created_at
		 FROM {$table_name}
		 ORDER BY created_at DESC
		 LIMIT 10"
	);

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

Seoulive_Core_Plugin::get_instance();