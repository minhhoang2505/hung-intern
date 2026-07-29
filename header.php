<!DOCTYPE html>
<html <?php language_attributes(); ?>>

<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

    <?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<div class="announcement-bar">
    <div class="announcement-track">
        <span>Complimentary shipping on all orders above $200</span>
        <span class="divider">✦</span>
        <span>Exclusive launch: New Fall/Winter '25 Collection</span>
        <span class="divider">✦</span>
        <span>Members enjoy 10% off their first order</span>
    </div>
</div>
<header class="header">
    <div class="header-container">
        <a href="<?php echo esc_url(home_url('/')); ?>" class="logo"><?php bloginfo('name'); ?></a>
        <form class="search-form">
            <input type="text" placeholder="Search">
            <button type="submit">
                <i class="fa-solid fa-magnifying-glass"></i>
            </button>
        </form>
        <div class="header-actions">

            <button
                class="action-item mobile-search-toggle d-md-none"
                type="button"
                data-bs-toggle="offcanvas"
                data-bs-target="#mobileMenu"
                aria-controls="mobileMenu"
                aria-label="Search">
                <i class="fa-solid fa-magnifying-glass"></i>
            </button>
            <a href="#" class="action-item d-none d-md-flex">
                <i class="fa-regular fa-heart"></i>
                <span>Wishlist</span>
            </a>
            <a href="#" class="action-item">
                <i class="fa-solid fa-cart-shopping"></i>
                <span>Cart</span>
            </a>
            <a href="#" class="action-item d-none d-md-flex">
                <i class="fa-regular fa-user"></i>
                <span>Account</span>
            </a>
            <button
                class="action-item mobile-menu-toggle d-md-none"
                type="button"
                data-bs-toggle="offcanvas"
                data-bs-target="#mobileMenu"
                aria-controls="mobileMenu">
                <i class="fa-solid fa-bars"></i>
            </button>
        </div>
    </div>
</header>