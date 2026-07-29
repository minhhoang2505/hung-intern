<?php

function seoulive_theme_setup() {

    add_theme_support('title-tag');

    add_theme_support('post-thumbnails');

    add_theme_support('menus');

}

add_action('after_setup_theme', 'seoulive_theme_setup');

function seoulive_enqueue_assets() {

    $theme_version = wp_get_theme()->get('Version');

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


    wp_enqueue_style(
        'seoulive-bootstrap',
        'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
        array(),
        '5.3.3'
    );

    wp_enqueue_style(
        'seoulive-style',
        get_stylesheet_uri(),
        array('seoulive-bootstrap', 'seoulive-font-awesome', 'seoulive-google-fonts'),
        $theme_version
    );

   
    wp_enqueue_script(
        'seoulive-bootstrap-js',
        'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js',
        array(),
        '5.3.3',
        true
    );

    
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