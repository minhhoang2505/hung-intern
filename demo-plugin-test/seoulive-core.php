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

		add_action( 'add_meta_boxes', array( $this, 'add_price_meta_box' ) );
		add_action( 'save_post', array( $this, 'save_price_meta' ) );

		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );
		add_filter( 'rest_prepare_seoulive_product', array( $this, 'add_discount_percentage' ), 10, 3 );

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
			'supports'      => array( 'title', 'editor', 'thumbnail' ),
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
	}

	/**
	 * Handle POST /seoulive/v1/register — creates a new subscriber account.
	 *
	 * @param WP_REST_Request
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
	 * @param WP_REST_Response
	 * @param WP_Post
	 * @param WP_REST_Request
	 * @return WP_REST_Response
	 */
	public function add_discount_percentage( $response, $post, $request ) {
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
	 * @param int
	 */
	public function log_new_registration( $user_id ) {
		$user  = get_userdata( $user_id );
		$email = $user ? $user->user_email : 'unknown';

		error_log( 'Thành viên mới đăng ký: ' . $email );
	}
}
// ---------- CACHING: Transients API cho danh sách sản phẩm ----------

add_filter( 'rest_pre_dispatch', 'seoulive_check_products_cache', 10, 3 );

function seoulive_check_products_cache( $result, $server, $request ) {

	if ( $request->get_route() !== '/wp/v2/seoulive_product' || $request->get_method() !== 'GET' ) {
		return $result;
	}

	$cached_data = get_transient( 'seoulive_products_cache' );

	if ( $cached_data !== false ) {
		error_log( 'Seoulive: Trả dữ liệu từ CACHE (transient)' );
		return rest_ensure_response( $cached_data );
	}
	return $result;
}

add_filter( 'rest_post_dispatch', 'seoulive_save_products_cache', 10, 3 );

function seoulive_save_products_cache( $response, $server, $request ) {
	if ( $request->get_route() !== '/wp/v2/seoulive_product' || $request->get_method() !== 'GET' ) {
		return $response;
	}

	if ( is_wp_error( $response ) ) {
		return $response;
	}

	set_transient( 'seoulive_products_cache', $response->get_data(), 3600 ); // 1 giờ
	error_log( 'Seoulive: Đã LƯU cache mới (thời hạn 1 giờ)' );

	return $response;
}

Seoulive_Core_Plugin::get_instance();
