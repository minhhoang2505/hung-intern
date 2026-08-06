<?php
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

function seoulive_render_price_meta_box( $post ) {
   
    wp_nonce_field( 'seoulive_save_price_meta', 'seoulive_price_meta_nonce' );

    $regular_price = get_post_meta( $post->ID, 'regular_price', true );
    $sale_price    = get_post_meta( $post->ID, 'sale_price', true );
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
    <?php
}

function seoulive_save_price_meta( $post_id ) {

    if (
        ! isset( $_POST['seoulive_price_meta_nonce'] ) ||
        ! wp_verify_nonce( $_POST['seoulive_price_meta_nonce'], 'seoulive_save_price_meta' )
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
add_action( 'save_post', 'seoulive_save_price_meta' );

function seoulive_register_price_meta_for_rest() {
    $args = array(
        'show_in_rest' => true,
        'single'       => true,
        'type'         => 'string',
        'auth_callback' => function () {
            return current_user_can( 'edit_posts' );
        },
    );

    register_post_meta( 'seoulive_product', 'regular_price', $args );
    register_post_meta( 'seoulive_product', 'sale_price', $args );
}
add_action( 'init', 'seoulive_register_price_meta_for_rest' );

function seoulive_theme_setup() {

    add_theme_support('title-tag');

    add_theme_support('post-thumbnails');

    add_theme_support('menus');

}

add_action('after_setup_theme', 'seoulive_theme_setup');

function seoulive_enqueue_assets() {

    $theme_version = wp_get_theme()->get('Version');

    // Google Fonts - Poppins
    wp_enqueue_style(
        'seoulive-google-fonts',
        'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap',
        array(),
        null
    );

    // Font Awesome (CDN)
    wp_enqueue_style(
        'seoulive-font-awesome',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css',
        array(),
        '6.7.2'
    );

    // Bootstrap CSS (CDN)
    wp_enqueue_style(
        'seoulive-bootstrap',
        'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
        array(),
        '5.3.3'
    );

    // style.css của theme - phụ thuộc vào Bootstrap/Font Awesome/Font để nạp sau chúng
    wp_enqueue_style(
        'seoulive-style',
        get_stylesheet_uri(),
        array('seoulive-bootstrap', 'seoulive-font-awesome', 'seoulive-google-fonts'),
        $theme_version
    );

    // Bootstrap JS bundle (CDN) - nạp ở footer
    wp_enqueue_script(
        'seoulive-bootstrap-js',
        'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js',
        array(),
        '5.3.3',
        true
    );

    // app.js của theme - phụ thuộc Bootstrap JS, nạp ở footer
    wp_enqueue_script(
        'seoulive-app',
        get_template_directory_uri() . '/app.js',
        array('seoulive-bootstrap-js'),
        $theme_version,
        true
    );


    wp_localize_script('seoulive-app', 'seouliveData', array(
        'imgUrl' => get_template_directory_uri() . '/img',
    ));
}

add_action('wp_enqueue_scripts', 'seoulive_enqueue_assets');

function seoulive_product_card() {
    $post_id = get_the_ID();

    $regular_price = get_post_meta( $post_id, 'regular_price', true );
    $sale_price    = get_post_meta( $post_id, 'sale_price', true );

    $brand_terms = get_the_terms( $post_id, 'product_brand' );
    $brand_name  = ( $brand_terms && ! is_wp_error( $brand_terms ) ) ? $brand_terms[0]->name : '';

    $has_sale = ( $sale_price !== '' && $regular_price !== '' && (float) $sale_price < (float) $regular_price );
    ?>
    <div class="col-12 col-sm-6 col-lg-3">
        <article class="product-card mx-auto">
            <a href="<?php the_permalink(); ?>" class="product-image d-block">
                <?php if ( has_post_thumbnail() ) : ?>
                    <?php the_post_thumbnail('medium', array('class' => 'img-fluid w-100')); ?>
                <?php else : ?>
                    <img src="<?php echo esc_url( get_template_directory_uri() . '/img/placeholder.jpg' ); ?>"
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
                    <a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
                </h3>
                <?php if ( $regular_price !== '' || $sale_price !== '' ) : ?>
                    <div class="product-price">
                        <?php if ( $has_sale ) : ?>
                            <del class="original-price">$<?php echo esc_html( number_format( (float) $regular_price, 2 ) ); ?></del>
                            <span class="sale-price">$<?php echo esc_html( number_format( (float) $sale_price, 2 ) ); ?></span>
                        <?php else : ?>
                            <span class="sale-price">$<?php echo esc_html( number_format( (float) ( $regular_price !== '' ? $regular_price : $sale_price ), 2 ) ); ?></span>
                        <?php endif; ?>
                    </div>
                <?php endif; ?>
            </div>
        </article>
    </div>
    
    <?php
}
add_filter( 'wp_is_application_passwords_available', '__return_true' );
add_action('rest_api_init', function () {
    register_rest_route('custom/v1', '/register', array(
        'methods' => 'POST',
        'callback' => 'custom_register_user',
        'permission_callback' => '__return_true', 
    ));
});

function custom_register_user(WP_REST_Request $request) {
    $username = sanitize_user($request->get_param('username'));
    $email    = sanitize_email($request->get_param('email'));
    $password = $request->get_param('password');

    // Validate cơ bản
    if (empty($username) || empty($email) || empty($password)) {
        return new WP_Error('missing_fields', 'Vui lòng nhập đầy đủ username, email, password', array('status' => 400));
    }

    if (username_exists($username)) {
        return new WP_Error('username_exists', 'Username đã tồn tại', array('status' => 409));
    }

    if (email_exists($email)) {
        return new WP_Error('email_exists', 'Email đã được đăng ký', array('status' => 409));
    }

    // Tạo user mới
    $user_id = wp_insert_user(array(
        'user_login' => $username,
        'user_email' => $email,
        'user_pass'  => $password,
        'role'       => 'subscriber', // quyền hạn cơ bản, không phải admin
    ));

    if (is_wp_error($user_id)) {
        return new WP_Error('registration_failed', $user_id->get_error_message(), array('status' => 500));
    }

    return array(
        'success' => true,
        'user_id' => $user_id,
        'message' => 'Đăng ký thành công',
    );
}