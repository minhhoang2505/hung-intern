<?php
/**
 * Các hàm chức năng của theme Seoulive.
 *
 * @package Seoulive_Theme
 */

/**
 * Đăng ký Custom Post Type "seoulive_product".
 */
function seoulive_register_product_post_type() {

	$labels = array(
		'name'               => 'Sản phẩm',
		'singular_name'      => 'Sản phẩm',
		'menu_name'          => 'Sản phẩm Seoulive',
		'add_new'            => 'Thêm sản phẩm',
		'add_new_item'       => 'Thêm sản phẩm mới',
		'edit_item'          => 'Sửa sản phẩm',
		'new_item'           => 'Sản phẩm mới',
		'view_item'          => 'Xem sản phẩm',
		'all_items'          => 'Tất cả sản phẩm',
		'search_items'       => 'Tìm sản phẩm',
		'not_found'          => 'Không tìm thấy sản phẩm nào.',
		'not_found_in_trash' => 'Không có sản phẩm nào trong thùng rác.',
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
add_action( 'init', 'seoulive_register_product_post_type' );

/**
 * Đăng ký Taxonomy "product_brand" (Thương hiệu).
 */
function seoulive_register_brand_taxonomy() {

	$labels = array(
		'name'          => 'Thương hiệu',
		'singular_name' => 'Thương hiệu',
		'menu_name'     => 'Thương hiệu',
		'all_items'     => 'Tất cả thương hiệu',
		'edit_item'     => 'Sửa thương hiệu',
		'add_new_item'  => 'Thêm thương hiệu mới',
		'search_items'  => 'Tìm thương hiệu',
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
add_action( 'init', 'seoulive_register_brand_taxonomy' );

/**
 * Đăng ký Meta Box thông tin giá trên màn hình sửa sản phẩm.
 */
function seoulive_add_price_meta_box() {
	add_meta_box(
		'seoulive_price_meta_box',
		'Thông tin giá',
		'seoulive_render_price_meta_box',
		'seoulive_product',
		'side',
		'high'
	);
}
add_action( 'add_meta_boxes', 'seoulive_add_price_meta_box' );

/**
 * Render nội dung Meta Box giá gốc / giá khuyến mãi.
 *
 * @param WP_Post $post Bài viết (sản phẩm) đang sửa.
 */
function seoulive_render_price_meta_box( $post ) {

	wp_nonce_field( 'seoulive_save_price_meta', 'seoulive_price_meta_nonce' );

	$regular_price = get_post_meta( $post->ID, 'regular_price', true );
	$sale_price    = get_post_meta( $post->ID, 'sale_price', true );
	// 'con_hang' (mặc định) hoặc 'het_hang' - dùng cho bộ lọc AJAX "Tình trạng còn hàng".
	$stock_status = get_post_meta( $post->ID, 'stock_status', true );
	if ( '' === $stock_status ) {
		$stock_status = 'con_hang';
	}
	?>
	<p>
		<label for="seoulive_regular_price"><strong>Giá gốc ($)</strong></label><br>
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
		<label for="seoulive_sale_price"><strong>Giá khuyến mãi ($)</strong></label><br>
		<input
			type="number"
			step="0.01"
			min="0"
			name="seoulive_sale_price"
			id="seoulive_sale_price"
			value="<?php echo esc_attr( $sale_price ); ?>"
			class="widefat">
		<span class="description">Để trống nếu sản phẩm không giảm giá.</span>
	</p>
	<p>
		<label for="seoulive_stock_status"><strong>Tình trạng kho</strong></label><br>
		<select
			name="seoulive_stock_status"
			id="seoulive_stock_status"
			class="widefat">
			<option value="con_hang" <?php selected( $stock_status, 'con_hang' ); ?>>Còn hàng</option>
			<option value="het_hang" <?php selected( $stock_status, 'het_hang' ); ?>>Hết hàng</option>
		</select>
	</p>
	<?php
}

/**
 * Lưu giá gốc / giá khuyến mãi khi sản phẩm được cập nhật.
 *
 * @param int $post_id ID bài viết (sản phẩm) đang lưu.
 */
function seoulive_save_price_meta( $post_id ) {

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

	if ( isset( $_POST['seoulive_stock_status'] ) ) {
		// sanitize_key(): chỉ dùng cho các giá trị dạng "mã key" cố định
		// (chữ thường, số, gạch dưới/gạch ngang) như slug/option value -
		// khác với sanitize_text_field() dùng cho text tự do người dùng nhập.
		$stock_status = sanitize_key( wp_unslash( $_POST['seoulive_stock_status'] ) );
		if ( ! in_array( $stock_status, array( 'con_hang', 'het_hang' ), true ) ) {
			$stock_status = 'con_hang';
		}
		update_post_meta( $post_id, 'stock_status', $stock_status );
	}
}
add_action( 'save_post', 'seoulive_save_price_meta' );

/**
 * Đăng ký các field giá để hiển thị được qua REST API.
 */
function seoulive_register_price_meta_for_rest() {
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
	register_post_meta( 'seoulive_product', 'stock_status', $args );
}
add_action( 'init', 'seoulive_register_price_meta_for_rest' );

/**
 * Khai báo các tính năng hỗ trợ của theme (title-tag, thumbnails, menus).
 */
function seoulive_theme_setup() {

	add_theme_support( 'title-tag' );

	add_theme_support( 'post-thumbnails' );

	add_theme_support( 'menus' );
}

add_action( 'after_setup_theme', 'seoulive_theme_setup' );

/**
 * Đăng ký và nạp toàn bộ CSS/JS của theme (Google Fonts, Bootstrap, app.js...).
 */
function seoulive_enqueue_assets() {

	$theme_version = wp_get_theme()->get( 'Version' );

	// Google Fonts - Poppins.
	wp_enqueue_style(
		'seoulive-google-fonts',
		'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap',
		array(),
		$theme_version
	);

	// Font Awesome (CDN).
	wp_enqueue_style(
		'seoulive-font-awesome',
		'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css',
		array(),
		'6.7.2'
	);

	// Bootstrap CSS (CDN).
	wp_enqueue_style(
		'seoulive-bootstrap',
		'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
		array(),
		'5.3.3'
	);

	// style.css của theme - phụ thuộc vào Bootstrap/Font Awesome/Font để nạp sau chúng.
	wp_enqueue_style(
		'seoulive-style',
		get_stylesheet_uri(),
		array( 'seoulive-bootstrap', 'seoulive-font-awesome', 'seoulive-google-fonts' ),
		$theme_version
	);

	// Bootstrap JS bundle (CDN) - nạp ở footer.
	wp_enqueue_script(
		'seoulive-bootstrap-js',
		'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js',
		array(),
		'5.3.3',
		true
	);

	// app.js của theme - phụ thuộc Bootstrap JS, nạp ở footer.
	wp_enqueue_script(
		'seoulive-app',
		get_template_directory_uri() . '/app.js',
		array( 'seoulive-bootstrap-js' ),
		$theme_version,
		true
	);

	wp_localize_script(
		'seoulive-app',
		'seouliveData',
		array(
			'imgUrl'  => get_template_directory_uri() . '/img',
			// admin-ajax.php: cổng vào duy nhất xử lý mọi request AJAX của
			// WordPress (cả admin lẫn front-end). URL này luôn giống nhau
			// nên không hardcode trong JS mà lấy qua admin_url().
			'ajaxUrl' => admin_url( 'admin-ajax.php' ),
			// Nonce ("number used once") gắn với action 'seoulive_ajax_filter'
			// - JS gửi kèm nonce này trong mỗi request, back-end sẽ xác thực
			// lại bằng check_ajax_referer() để chống giả mạo request (CSRF).
			'nonce'   => wp_create_nonce( 'seoulive_ajax_filter' ),
		)
	);
}

add_action( 'wp_enqueue_scripts', 'seoulive_enqueue_assets' );

/**
 * Render 1 thẻ (card) sản phẩm trong The Loop.
 */
function seoulive_product_card() {
	$post_id = get_the_ID();

	$regular_price = get_post_meta( $post_id, 'regular_price', true );
	$sale_price    = get_post_meta( $post_id, 'sale_price', true );

	$brand_terms = get_the_terms( $post_id, 'product_brand' );
	$brand_name  = ( $brand_terms && ! is_wp_error( $brand_terms ) ) ? $brand_terms[0]->name : '';

	$has_sale = ( '' !== $sale_price && '' !== $regular_price && (float) $sale_price < (float) $regular_price );
	?>
	<div class="col-12 col-sm-6 col-lg-3">
		<article class="product-card mx-auto">
			<a href="<?php the_permalink(); ?>" class="product-image d-block">
				<?php if ( has_post_thumbnail() ) : ?>
					<?php the_post_thumbnail( 'medium', array( 'class' => 'img-fluid w-100' ) ); ?>
				<?php else : ?>
					<img
						src="<?php echo esc_url( get_template_directory_uri() . '/img/placeholder.jpg' ); ?>"
						alt="<?php the_title_attribute(); ?>">
				<?php endif; ?>
				<span class="quick-view-label">
					<i class="fa-regular fa-eye me-1"></i>Xem chi tiết
				</span>
			</a>
			<div class="product-info">
				<?php if ( $brand_name ) : ?>
					<p class="product-brand"><?php echo esc_html( $brand_name ); ?></p>
				<?php endif; ?>
				<h3 class="product-name">
					<a href="<?php the_permalink(); ?>"><?php echo esc_html( get_the_title() ); ?></a>
				</h3>
				<p class="product-date"><?php echo esc_html( get_the_date() ); ?></p>
				<div class="product-excerpt"><?php echo esc_html( wp_trim_words( get_the_excerpt(), 15 ) ); ?></div>
				<?php if ( '' !== $regular_price || '' !== $sale_price ) : ?>
					<div class="product-price">
						<?php if ( $has_sale ) : ?>
							<del class="original-price">$<?php echo esc_html( number_format( (float) $regular_price, 2 ) ); ?></del>
							<span class="sale-price">$<?php echo esc_html( number_format( (float) $sale_price, 2 ) ); ?></span>
						<?php else : ?>
							<span class="sale-price">$<?php echo esc_html( number_format( (float) ( '' !== $regular_price ? $regular_price : $sale_price ), 2 ) ); ?></span>
						<?php endif; ?>
					</div>
				<?php endif; ?>
			</div>
		</article>
	</div>
	<?php
}

/**
 * Xử lý AJAX lọc sản phẩm (giá thấp->cao, giá cao->thấp, còn hàng).
 *
 * Hook vào CẢ HAI action:
 * - wp_ajax_seoulive_filter_products        -> user đã đăng nhập (kể cả admin).
 * - wp_ajax_nopriv_seoulive_filter_products -> khách (chưa đăng nhập).
 * Trang archive sản phẩm là trang public, ai cũng xem/lọc được, nên bắt
 * buộc phải có bản 'nopriv' - thiếu nó, request AJAX của khách sẽ nhận
 * lỗi -1 vì WordPress không tìm thấy action nào khớp.
 */
function seoulive_ajax_filter_products() {

	// 1) KIỂM TRA NONCE TRƯỚC TIÊN.
	// check_ajax_referer( $action, $query_arg ) sẽ tự động die() với mã
	// lỗi -1 nếu nonce trong $_POST['nonce'] sai hoặc thiếu, ngắt luôn
	// script tại đây -> code phía dưới chỉ chạy khi nonce hợp lệ.
	check_ajax_referer( 'seoulive_ajax_filter', 'nonce' );

	// 2) SANITIZE TOÀN BỘ DỮ LIỆU NHẬN TỪ $_POST.
	// 'filter' là 1 trong các key cố định ('price_asc', 'price_desc',
	// 'in_stock', ...) do chính JS của mình gửi lên -> dùng sanitize_key()
	// (không phải sanitize_text_field, vì đây không phải văn bản tự do).
	$filter = isset( $_POST['filter'] ) ? sanitize_key( wp_unslash( $_POST['filter'] ) ) : '';

	// 'paged' là số trang -> absint() ép về số nguyên không âm, chống
	// trường hợp cố tình truyền chuỗi/ký tự lạ vào WP_Query.
	$paged = isset( $_POST['paged'] ) ? absint( $_POST['paged'] ) : 1;
	if ( $paged < 1 ) {
		$paged = 1;
	}

	$query_args = array(
		'post_type'      => 'seoulive_product',
		'post_status'    => 'publish',
		'posts_per_page' => 6,
		'paged'          => $paged,

		// TỐI ƯU: request AJAX này chỉ hiện đúng trang hiện tại, không cần
		// tính lại paginate_links() dựa trên tổng số bài match toàn bộ DB
		// (đó là việc của trang archive gốc, không phải của response AJAX)
		// -> tắt bước SQL_CALC_FOUND_ROWS mặc định, giảm 1 query mỗi lần lọc.
		'no_found_rows'  => true,

		// LƯU Ý: KHÔNG set 'update_post_meta_cache' => false ở đây, dù có vẻ
		// "tối ưu thêm". Lý do: seoulive_product_card() bên dưới gọi
		// get_post_meta() nhiều lần cho MỖI sản phẩm (regular_price,
		// sale_price, stock_status). Mặc định (true), WordPress preload toàn
		// bộ meta của 6 sản phẩm này trong 1 query duy nhất -> các lệnh
		// get_post_meta() sau đó đọc từ cache, không query lại DB. Nếu tắt
		// cache này, mỗi get_post_meta() phải tự query riêng lẻ (N+1 query)
		// -> CHẬM HƠN, ngược lại với mục đích tối ưu.
	);

	switch ( $filter ) {

		case 'price_asc':
			$query_args['meta_key'] = 'regular_price'; // phpcs:ignore WordPress.DB.SlowDBQuery
			$query_args['orderby']  = 'meta_value_num';
			$query_args['order']    = 'ASC';
			break;

		case 'price_desc':
			$query_args['meta_key'] = 'regular_price'; // phpcs:ignore WordPress.DB.SlowDBQuery
			$query_args['orderby']  = 'meta_value_num';
			$query_args['order']    = 'DESC';
			break;

		case 'in_stock':
			$query_args['meta_query'] = array( // phpcs:ignore WordPress.DB.SlowDBQuery.
			'relation' => 'OR',
			array(
			'key'     => 'stock_status',
			'value'   => 'con_hang',
			'compare' => '=',
			),
			array(
			'key'     => 'stock_status',
			'compare' => 'NOT EXISTS', // sản phẩm chưa từng lưu field này -> coi như mặc định "còn hàng".
			),
			);
			$query_args['orderby']    = 'date';
			$query_args['order']      = 'DESC';
			break;
		default:
			// Không truyền filter hợp lệ -> giữ nguyên thứ tự mặc định (mới nhất trước).
			$query_args['orderby'] = 'date';
			$query_args['order']   = 'DESC';
			break;
	}

	$product_query = new WP_Query( $query_args );

	// Dùng output buffering để "chụp" lại HTML mà seoulive_product_card()
	// echo ra trực tiếp, gom thành 1 chuỗi rồi trả về cho JS - thay vì
	// phải viết lại một bản HTML riêng cho AJAX.
	ob_start();

	if ( $product_query->have_posts() ) {
		while ( $product_query->have_posts() ) {
			$product_query->the_post();
			seoulive_product_card();
		}
	} else {
		echo '<p class="seoulive-empty-state text-muted">Không tìm thấy sản phẩm nào phù hợp với tiêu chí của bạn.</p>';
	}

	// Query phụ (khác Main Query của trang archive) -> LUÔN reset lại
	// $post toàn cục sau khi dùng xong, tránh ảnh hưởng phần code chạy
	// sau đó (dù ở đây request AJAX sẽ die() ngay, vẫn giữ cho đúng chuẩn).
	wp_reset_postdata();

	$html = ob_get_clean();

	wp_send_json_success(
		array(
			'html'          => $html,
			'max_num_pages' => $product_query->max_num_pages,
			'found_posts'   => $product_query->found_posts,
		)
	);
}
add_action( 'wp_ajax_seoulive_filter_products', 'seoulive_ajax_filter_products' );
add_action( 'wp_ajax_nopriv_seoulive_filter_products', 'seoulive_ajax_filter_products' );

add_filter( 'wp_is_application_passwords_available', '__return_true' );

add_action(
	'rest_api_init',
	function () {
		register_rest_route(
			'custom/v1',
			'/register',
			array(
				'methods'             => 'POST',
				'callback'            => 'custom_register_user',
				'permission_callback' => '__return_true',
			)
		);
	}
);

/**
 * Xử lý đăng ký user mới qua endpoint /custom/v1/register.
 *
 * @param WP_REST_Request $request Request gửi lên từ Next.js.
 * @return array|WP_Error
 */
function custom_register_user( WP_REST_Request $request ) {
	$username = sanitize_user( $request->get_param( 'username' ) );
	$email    = sanitize_email( $request->get_param( 'email' ) );
	$password = $request->get_param( 'password' );

	// Validate cơ bản.
	if ( empty( $username ) || empty( $email ) || empty( $password ) ) {
		return new WP_Error( 'missing_fields', 'Vui lòng nhập đầy đủ username, email, password', array( 'status' => 400 ) );
	}

	if ( username_exists( $username ) ) {
		return new WP_Error( 'username_exists', 'Username đã tồn tại', array( 'status' => 409 ) );
	}

	if ( email_exists( $email ) ) {
		return new WP_Error( 'email_exists', 'Email đã được đăng ký', array( 'status' => 409 ) );
	}

	// Tạo user mới.
	$user_id = wp_insert_user(
		array(
			'user_login' => $username,
			'user_email' => $email,
			'user_pass'  => $password,
			'role'       => 'subscriber', // Quyền hạn cơ bản, không phải admin.
		)
	);

	if ( is_wp_error( $user_id ) ) {
		return new WP_Error( 'registration_failed', $user_id->get_error_message(), array( 'status' => 500 ) );
	}

	return array(
		'success' => true,
		'user_id' => $user_id,
		'message' => 'Đăng ký thành công',
	);
}
/**
 * Chỉnh Main Query của trang archive seoulive_product:
 * 6 sản phẩm/trang, mới nhất trước.
 *
 *  @param WP_Query $query Đối tượng query đang được xử lý (từ hook pre_get_posts).
 */
function seoulive_modify_product_archive_query( $query ) {
	if ( is_admin() || ! $query->is_main_query() ) {
		return;
	}

	if ( $query->is_post_type_archive( 'seoulive_product' ) ) {
		$query->set( 'posts_per_page', 6 );
		$query->set( 'orderby', 'date' );
		$query->set( 'order', 'DESC' );
	}
}
add_action( 'pre_get_posts', 'seoulive_modify_product_archive_query' );