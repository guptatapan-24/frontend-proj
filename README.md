# Bolly Shampoo landing Page (WordPress + Elementor + Interactive 3D)
---
## 📺 Project Previews & Demo
Here you can see the Bolly Shampoo interactive landing page in action on both desktop and mobile viewports.
### 💻 Dashboard Preview
<p align="center">
  <img src="assets/Screenshot%202026-07-16%20181639.png" alt="Bolly Shampoo Dashboard Preview" width="100%" style="border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);">
</p>
### 📱 Live Demo Video (Laptop)
<p align="center">
  <video src="assets/2026-07-16%2017-48-29.mp4" width="100%" controls muted autoplay loop style="border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);"></video>
</p>
### 📱 Live Demo Video (Phone)
<p align="center">
  <video src="assets/2026-07-16%2017-58-03.mp4" width="100%" controls muted autoplay loop style="border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);"></video>
</p>
---

This repository contains a high-fidelity recreation of the landing page for the hair-care brand **Bolly**, highlighting their hero product **Bolly Clarify Shampoo**. The page incorporates a lightweight, interactive 3D shampoo bottle built from scratch in WebGL using Three.js, packaged inside a custom WordPress plugin.

The project is built to run inside a WebAssembly-powered WordPress Playground environment, enabling full functionality on any system using Node.js without needing Docker, local PHP, or local MySQL installations.

## 🛠️ Technology Stack

1. **CMS**: WordPress (latest)
2. **Themes & Builders**: Elementor Page Builder (free tier) + Hello Elementor theme
3. **Interactive 3D Layer**: Three.js (WebGL) + Canvas 2D Texture Mapper (no external assets or texture files needed)
4. **Local WP Development Server**: `@wp-playground/cli` (WordPress running via WebAssembly in Node.js)

---

## 📂 Project Structure

```
├── package.json                   # Script configurations for local dev & WP server
├── server.js                      # Custom static server for standalone testing
├── blueprint.json                 # WP Playground Blueprint configuration
├── demo/                          # Standalone HTML/CSS/JS prototype
│   ├── index.html                 # Hero structure layout
│   ├── main.css                   # Palette styling and responsiveness
│   └── bottle-3d.js               # Standalone Three.js scene & drag logic
└── plugins/
    └── bolly-3d-bottle/           # Custom WordPress plugin
        ├── bolly-3d-bottle.php    # Plugin loader & automatic homepage creation
        └── assets/
            ├── css/
            │   └── bottle-3d.css  # Consolidated landing page and 3D styles
            └── js/
                └── bottle-3d.js   # Interactive 3D script (Pointer Events)
```

---

## 🚀 Setup & Execution

### Prerequisites
- Node.js (version 18 or higher recommended)
- Git

### 1. Clone the Repository
```bash
git clone https://www.github.com/guptatapan-24/frontend-proj
cd frontend-proj
```

### 2. Run the WordPress Local Site
Start the WordPress development server in your terminal:
```bash
npm run start:wp
```
The server will initialize, automatically download the required WordPress version, install the Hello Elementor theme and Elementor plugin, mount the custom 3D plugin, and configure the homepage.

Once initialized, the terminal will display the local URL:
```
Ready! WordPress is running on http://127.0.0.1:9400
```
Open **`http://127.0.0.1:9400`** in your browser. The "Bolly Shampoo" page will be pre-configured as the homepage.

### 3. Run the Standalone HTML/CSS Dev Server
To run or preview the standalone prototype without the WordPress environment:
```bash
npm run start:demo
```
Then open **`http://localhost:3000`** in your browser.

---

## 📐 Key Design and Technical Details

### Procedural 3D Bottle Design
To make the site highly performant and eliminate loading latency (Core Web Vitals LCP), the 3D bottle is generated procedurally in `bottle-3d.js`:
- The bottle body is a custom cylinder, paired with a white pump neck, collar, collar stem, and nozzle.
- The brand label text is rendered onto a dynamic offscreen canvas in high-resolution and wrapped onto the cylinder as a standard texture. This ensures crisp typography at all DPI scales.
- A floor plane is placed under the bottle with a radial black gradient texture, creating a premium soft-contact shadow.

### Pointer Event Interactions
- **Desktop**: Moving cursor near the bottle horizontally rotates the bottle on its Y-axis, while doing so vertically tilts it slightly (clamped between -0.1 and 0.25 radians).
- **Mobile Damping & Scroll Protection**: Damping (inertia) is applied by interpolating the mesh's rotation towards the target using linear interpolation. Setting the CSS rule `touch-action: pan-y` on the canvas ensures that mobile swiping vertically scrolls the webpage, while horizontal dragging is captured to rotate the bottle.
- **Auto-Rotation**: The bottle enters a slow, idle spin immediately after user inactivity.
