<?php
/**
 * Plugin Name: Bolly 3D Interactive Bottle
 * Description: Embeds an interactive 3D shampoo bottle in WordPress + Elementor using Three.js.
 * Version: 1.0.0
 * Author: Antigravity AI
 * Text Domain: bolly-3d-bottle
 */

// Block direct access
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Register and enqueue plugin assets
 */
function bolly_3d_bottle_enqueue_assets() {
    // Only load these assets on the homepage/frontpage to maintain high performance
    if ( is_front_page() || is_home() ) {
        
        // Enqueue Google Fonts
        wp_enqueue_style(
            'bolly-google-fonts',
            'https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@1,400&display=swap',
            array(),
            null
        );

        // Enqueue Three.js from official CDN
        wp_enqueue_script(
            'three-js-cdn',
            'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
            array(),
            'r128',
            true // Load in footer
        );

        // Enqueue our custom 3D script, using filemtime to bust cache
        $js_path = plugin_dir_path( __FILE__ ) . 'assets/js/bottle-3d.js';
        $js_version = file_exists( $js_path ) ? filemtime( $js_path ) : '1.0.0';
        wp_enqueue_script(
            'bolly-bottle-3d',
            plugins_url( 'assets/js/bottle-3d.js', __FILE__ ),
            array( 'three-js-cdn' ),
            $js_version,
            true // Load in footer
        );

        // Enqueue our custom styles, using filemtime to bust cache
        $css_path = plugin_dir_path( __FILE__ ) . 'assets/css/bottle-3d.css';
        $css_version = file_exists( $css_path ) ? filemtime( $css_path ) : '1.0.0';
        wp_enqueue_style(
            'bolly-bottle-3d-styles',
            plugins_url( 'assets/css/bottle-3d.css', __FILE__ ),
            array(),
            $css_version
        );
    }
}
add_action( 'wp_enqueue_scripts', 'bolly_3d_bottle_enqueue_assets' );

/**
 * Register shortcode to output the 3D bottle canvas container
 * Usage: [bolly_3d_bottle]
 */
function bolly_3d_bottle_shortcode() {
    ob_start();
    ?>
    <div class="bolly-interactive-3d-wrapper">
        <!-- Decorative elements (concentric arcs and radial glow background) -->
        <div class="bolly-3d-backdrop">
            <div class="bolly-glow"></div>
            <div class="bolly-arcs">
                <div class="arc arc--1"></div>
                <div class="arc arc--2"></div>
                <div class="arc arc--3"></div>
            </div>
        </div>
        
        <!-- Target container for the WebGL Canvas -->
        <div id="bolly-bottle-canvas" class="bolly-bottle-canvas-container"></div>
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode( 'bolly_3d_bottle', 'bolly_3d_bottle_shortcode' );

/**
 * Programmatically create the Bolly landing page on initialization
 */
function bolly_3d_bottle_auto_create_homepage() {
    // Only run this once to prevent overhead (bumped to v2 for HTML updates)
    if ( get_option( 'bolly_homepage_created_v2' ) ) {
        return;
    }

    $page_title = 'Bolly Shampoo';
    
    // Check if the page exists already
    $page_check = get_page_by_title( $page_title );

    // Exact HTML structure for the landing page body
    $page_content = '
<div class="bolly-page-wrapper">
  <!-- Header Navigation -->
  <header class="bolly-header">
    <div class="bolly-header__container">
      <!-- Logo -->
      <a href="#" class="bolly-logo">bolly</a>
      
      <!-- Nav Pill (Desktop Only) -->
      <nav class="bolly-nav-pill">
        <ul class="bolly-nav-list">
          <li><a href="#" class="bolly-nav-link active">Shop +</a></li>
          <li><a href="#" class="bolly-nav-link">About</a></li>
          <li><a href="#" class="bolly-nav-link">Blog</a></li>
          <li><a href="#" class="bolly-nav-link">Contact</a></li>
        </ul>
      </nav>

      <!-- Cart Button -->
      <div class="bolly-header__actions">
        <button class="bolly-cart-btn" aria-label="Shopping Cart">
          <span class="bolly-cart-label">Cart</span>
          <div class="bolly-cart-icon-wrapper">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
          </div>
        </button>

        <!-- Mobile Hamburger Toggle -->
        <button class="bolly-menu-toggle" aria-label="Toggle Menu" aria-expanded="false">
          <div class="hamburger-bar"></div>
          <div class="hamburger-bar"></div>
          <div class="hamburger-bar"></div>
        </button>
      </div>
    </div>

    <!-- Mobile Dropdown Menu -->
    <div class="bolly-mobile-menu">
      <ul class="bolly-mobile-nav-list">
        <li><a href="#" class="bolly-mobile-link">Shop</a></li>
        <li><a href="#" class="bolly-mobile-link">About</a></li>
        <li><a href="#" class="bolly-mobile-link">Blog</a></li>
        <li><a href="#" class="bolly-mobile-link">Contact</a></li>
      </ul>
    </div>
  </header>

  <!-- Hero Card Frame -->
  <main class="bolly-hero-frame">
    <div class="bolly-hero-card">
      
      <!-- Left Column -->
      <section class="bolly-hero-col bolly-hero-col--left">
        <div class="bolly-badge-container">
          <span class="bolly-badge-text">FROM ROOT</span>
          <span class="bolly-badge-pill">TO SHINE</span>
        </div>
        
        <h1 class="bolly-hero__headline">
          KNOCK<br>OUT<br>FLAKES
        </h1>
      </section>

      <!-- Center Column: Interactive 3D Bottle Shortcode -->
      <section class="bolly-hero-col bolly-hero-col--center">
        [bolly_3d_bottle]
      </section>

      <!-- Right Column -->
      <section class="bolly-hero-col bolly-hero-col--right">
        <p class="bolly-hero__tagline">
          Journey in to the <span class="tagline-serif">wonderful</span> world of shampoo
        </p>
        
        <div class="bolly-cta-wrapper">
          <button class="bolly-cta-btn">
            <span>EXPLORE MORE</span>
            <span class="bolly-cta-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <line x1="7" y1="17" x2="17" y2="7"></line>
                <polyline points="7 7 17 7 17 17"></polyline>
              </svg>
            </span>
          </button>
        </div>
      </section>

    </div>
  </main>
</div>
';

    if ( ! isset( $page_check->ID ) ) {
        $page_id = wp_insert_post( array(
            'post_title'    => $page_title,
            'post_content'  => $page_content,
            'post_status'   => 'publish',
            'post_type'     => 'page',
            'post_name'     => 'bolly-shampoo'
        ) );
    } else {
        $page_id = $page_check->ID;
        wp_update_post( array(
            'ID'           => $page_id,
            'post_content' => $page_content
        ) );
    }

    // Assign Elementor Canvas template to page
    update_post_meta( $page_id, '_wp_page_template', 'elementor_canvas' );

    // Configure static front page settings
    update_option( 'show_on_front', 'page' );
    update_option( 'page_on_front', $page_id );

    // Set flag so we don't insert page again
    update_option( 'bolly_homepage_created_v2', 1 );
}
add_action( 'init', 'bolly_3d_bottle_auto_create_homepage' );

/**
 * Disable wpautop on the Bolly landing page to prevent grid column breakage
 */
function bolly_remove_wpautop_for_homepage() {
    $page_on_front = get_option( 'page_on_front' );
    if ( is_front_page() || is_home() || ( is_page() && get_the_ID() == $page_on_front ) ) {
        remove_filter( 'the_content', 'wpautop' );
        remove_filter( 'the_excerpt', 'wpautop' );
    }
}
add_action( 'wp', 'bolly_remove_wpautop_for_homepage' );
