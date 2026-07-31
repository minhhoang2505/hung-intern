<?php get_header(); ?>

<section class="hero-section">
    <div class="container">
        <div class="hero"></div>
    </div>
</section>

<?php
$essence_query = new WP_Query( array(
    'post_type'      => 'seoulive_product',
    'posts_per_page' => -1,
    'tax_query'      => array(
        array(
            'taxonomy' => 'product_brand',
            'field'    => 'slug',
            'terms'    => 'essence',
        ),
    ),
) );
?>

<section class="live-show">
    <div class="container">
        <div class="section-header">
            <h2>Live Shows Favorites</h2>
            <a href="#" class="view-all">View All Products</a>
        </div>
        <div id="liveShowGrid" class="row g-3">
            <?php if ( $essence_query->have_posts() ) : ?>
                <?php while ( $essence_query->have_posts() ) : $essence_query->the_post(); ?>
                    <?php seoulive_product_card(); ?>
                <?php endwhile; ?>
            <?php else : ?>
                <p class="text-muted">Chưa có sản phẩm nào thuộc brand Essence.</p>
            <?php endif; ?>
        </div>
        <div class="carousel-dots" id="liveShowDots"></div>
    </div>
</section>
<section class="live-opportunity">
    <div class="container live-opportunity-inner">
        <div class="stream-card">
            <div class="stream-thumb" id="stream-thumb">
                <div class="stream-top">
                    <span class="stream-tag" id="stream-tag">Đang tải…</span>
                </div>
                <div class="stream-meta">
                    <span class="pill pill-replay">REPLAY</span>
                    <span class="pill pill-count"><i class="fa-solid fa-play"></i> 3.2K</span>
                    <span class="pill pill-live"><i class="dot"></i>LIVE</span>
                    <span class="pill pill-viewers"><span id="viewer-count">0</span> Viewers</span>
                </div>
                <button class="mute-btn" aria-label="Bật/tắt tiếng">
                    <i class="fa-solid fa-volume-xmark"></i>
                </button>
                <button class="like-btn" id="like-btn" aria-label="Thả tim">
                    <i class="fa-regular fa-heart"></i>
                </button>
            </div> 
            <div class="chat-overlay" id="chat-lines"></div>
            <div class="stream-bottom">
                <input class="chat-input" type="text" placeholder="Please enter your message" disabled />
                <button class="chat-help" aria-label="Trợ giúp">?</button>
            </div>
            <div class="progress-row">
                <div class="progress-bar"><span></span></div>
                <span class="time-label">
                    <span id="stream-elapsed">0:00</span>/<span id="stream-total">0:00</span>
                </span>
            </div>
        </div>
        <div class="opportunity-content">
            <h2>Don't miss this opportunity today!</h2>
            <p class="opportunity-sub">
                Watch real moments from our livestreams — no filters, just honest reactions.
            </p>
            <a href="#" class="join-live-btn">Join Live Now</a>
            <?php $essence_query->rewind_posts(); ?>
            <div id="opportunityGrid" class="row g-3">
                <?php if ( $essence_query->have_posts() ) : ?>
                    <?php while ( $essence_query->have_posts() ) : $essence_query->the_post(); ?>
                        <?php seoulive_product_card(); ?>
                    <?php endwhile; ?>
                <?php else : ?>
                    <p class="text-muted">Chưa có sản phẩm nào thuộc brand Essence.</p>
                <?php endif; ?>
            </div>
            <div class="carousel-dots" id="opportunityDots"></div>
        </div>
    </div>
</section>
<section class="buying-now">
    <div class="container">
        <div class="buying-header">
            <h2>What Everyone Is Buying Right Now</h2>
        </div>
        <?php $essence_query->rewind_posts(); ?>
        <div id="productGrid" class="row g-3">
            <?php if ( $essence_query->have_posts() ) : ?>
                <?php while ( $essence_query->have_posts() ) : $essence_query->the_post(); ?>
                    <?php seoulive_product_card(); ?>
                <?php endwhile; ?>
            <?php else : ?>
                <p class="text-muted">Chưa có sản phẩm nào thuộc brand Essence.</p>
            <?php endif; ?>
        </div>
        <div class="carousel-dots" id="buyingDots"></div>
        <div class="view-all-wrap">
            <a href="#" class="view-all-btn">View All Products</a>
        </div>
    </div>
</section>
<?php

wp_reset_postdata();
?>
<section class="trusted-brands">
    <div class="container">
        <div class="trusted-header">
            <div>
                <h2>Trusted by Leading Brands</h2>
                <p class="trusted-sub">
                    Brands partner with Seoulive to launch products through high-converting livestream campaigns.
                </p>
            </div>
            <a href="#" class="explore-brands-btn">Explore All Brands</a>
        </div>
        <div id="brandsGrid" class="brands-grid"></div>
        <div class="carousel-dots" id="brandsDots"></div>
    </div>
</section>
<section class="new-arrivals">
    <div class="container">
        <h2>New Arrivals</h2>
        <div id="arrivalsGrid" class="arrivals-grid"></div>
    </div>
</section>
<section class="trending-now">
    <div class="container">
        <h2>Trending now, popular</h2>
        <div class="trending-content">
            <article class="trending-spotlight" id="trendingSpotlight"></article>
            <ol class="trending-rank-list" id="trendingRankList"></ol>
        </div>
    </div>
</section>
<section class="instagram-feed">
    <div class="container">
        <h2>#seoulive</h2>
        <div id="instagramGrid" class="instagram-grid"></div>
    </div>
</section>

<?php get_footer(); ?>