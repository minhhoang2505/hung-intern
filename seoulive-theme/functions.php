<?php

function seoulive_theme_setup() {

    add_theme_support('title-tag');

    add_theme_support('post-thumbnails');

    add_theme_support('menus');

}

add_action('after_setup_theme', 'seoulive_theme_setup');