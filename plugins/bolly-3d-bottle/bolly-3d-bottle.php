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
        
        // Enqueue Three.js from official CDN
        wp_enqueue_script(
            'three-js-cdn',
            'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
            array(),
            'r128',
            true // Load in footer
        );

        // Enqueue our custom 3D script, depending on Three.js
        wp_enqueue_script(
            'bolly-bottle-3d',
            plugins_url( 'assets/js/bottle-3d.js', __FILE__ ),
            array( 'three-js-cdn' ),
            '1.0.0',
            true // Load in footer
        );

        // Enqueue our custom 3D styles
        wp_enqueue_style(
            'bolly-bottle-3d-styles',
            plugins_url( 'assets/css/bottle-3d.css', __FILE__ ),
            array(),
            '1.0.0'
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
        <div id="bolly-bottle-canvas" class="bolly-bottle-canvas-container">
            <!-- Subtle rotation drag hint overlay -->
            <div class="bolly-drag-hint">
                <span class="hint-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M7 11l5-5 5 5M7 17l5-5 5 5"></path>
                    </svg>
                </span>
                <span class="hint-text">Drag to rotate</span>
            </div>
        </div>
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode( 'bolly_3d_bottle', 'bolly_3d_bottle_shortcode' );
