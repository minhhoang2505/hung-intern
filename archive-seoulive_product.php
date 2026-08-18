<?php
/**
 * Archive template cho custom post type "seoulive_product".
 *
 * WordPress tự động dùng file này (theo naming convention archive-{post_type}.php)
 * khi truy cập trang danh sách sản phẩm, tức /san-pham/.
 *
 * QUAN TRỌNG: template này dùng LOOP CHUẨN (Main Query), KHÔNG tạo WP_Query
 * riêng. Số lượng/sắp xếp (6 sản phẩm/trang, mới nhất trước) được chỉnh
 * ngay trên Main Query qua hook 'pre_get_posts' trong functions.php
 * (seoulive_modify_product_archive_query) — KHÔNG chỉnh ở đây.
 *
 * Lý do: nếu tạo 1 WP_Query phụ độc lập trong template, Main Query (chạy
 * ngầm trước khi template load) vẫn tự query CPT này với posts_per_page
 * mặc định. Vì Main Query chỉ thấy đúng 1 trang, khi truy cập /page/2/,
 * WordPress tự đánh dấu is_404() = true TRƯỚC KHI code trong template kịp
 * chạy — toàn bộ phân trang custom sẽ bị 404 dù code không hề sai.
 * => Bài học: cần PHÂN TRANG cho chính trang archive => sửa Main Query.
 *    Chỉ tạo WP_Query riêng khi lấy thêm 1 danh sách KHÁC Main Query
 *    (VD "Sản phẩm liên quan" trong trang single) — lúc đó mới cần
 *    wp_reset_postdata() sau vòng lặp.
 *
 * @package Seoulive_Theme
 */

get_header();
?>

<section class="archive-products">
	<div class="container">

		<div class="section-header">
			<h2><?php post_type_archive_title(); ?></h2>
		</div>

		<?php if ( have_posts() ) : ?>

			<div class="row g-3">
				<?php
				while ( have_posts() ) :
					the_post();
					seoulive_product_card();
				endwhile;
				?>
			</div>

			<style>
				.archive-pagination .page-numbers {
					display: inline-block;
					padding: 6px 14px;
					margin: 0 4px;
					border: 1px solid #ddd;
					border-radius: 6px;
					color: #111;
					text-decoration: none;
				}
				.archive-pagination .page-numbers.current {
					background: #111;
					color: #fff;
					border-color: #111;
				}
				.archive-pagination .page-numbers.dots {
					border: none;
				}
			</style>
			<nav class="archive-pagination mt-4 d-flex justify-content-center">
				<?php
				/**
				 * PHÂN TRANG: lấy tổng số trang và trang hiện tại trực tiếp
				 * từ Main Query toàn cục ($wp_query), vì Main Query mới là
				 * nơi thực sự biết có bao nhiêu trang (đã được set
				 * posts_per_page = 6 qua pre_get_posts).
				 */
				global $wp_query;

				echo wp_kses_post(
					paginate_links(
						array(
							'total'     => $wp_query->max_num_pages,
							'current'   => max( 1, get_query_var( 'paged' ) ),
							'prev_text' => '« Trước',
							'next_text' => 'Sau »',
						)
					)
				);
				?>
			</nav>

		<?php else : ?>

			<p class="text-muted">Chưa có sản phẩm nào.</p>

		<?php endif; ?>

	</div>
</section>

<?php
// KHÔNG cần wp_reset_postdata() ở đây — đây vẫn là Main Query từ đầu đến
// cuối, không có Query phụ nào để "trả lại" cả.

get_footer();