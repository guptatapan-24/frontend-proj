// Bolly Clarify Shampoo — Refined Interactive 3D Bottle Script (Three.js)

class BollyBottle3D {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.bottleGroup = null; // Container group for positioning
    this.tiltedGroup = null; // Tilted group for rotating on local axis
    
    // Interaction states
    this.isDragging = false;
    this.isHovering = false;
    this.hoverStartNormX = 0;
    this.hoverStartNormY = 0;
    this.hoverBaseRotationY = 0;
    this.hoverBaseRotationX = 0;
    this.previousPointerX = 0;
    this.previousPointerY = 0;
    this.targetRotationY = 0.2; // Initial rotation to show label beautifully
    this.targetRotationX = 0.0;
    
    // Auto rotation parameters
    this.autoRotateSpeed = 0.004;
    this.lastInteractedTime = 0;
    this.idleDelay = 3500; // Return to idle spin after 3.5 seconds of no activity

    // Animation frame ID
    this.animationFrameId = null;
    this.isIntersecting = false;

    this.init();
  }

  init() {
    // 1. Scene Setup
    this.scene = new THREE.Scene();

    // 2. Camera Setup
    // Adjusted FOV and distance to prevent visual clipping/cropping on narrow/mobile viewports
    this.camera = new THREE.PerspectiveCamera(38, this.width / this.height, 0.1, 100);
    this.camera.position.set(0, 0.0, 5.2); // Moved camera back to Z=5.2 to ensure the bottle is completely within the frame

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    this.renderer.domElement.style.touchAction = 'pan-y';

    // 4. Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    this.scene.add(ambientLight);

    // Primary key light (front-right, bright, casts soft highlight)
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
    keyLight.position.set(5, 5, 4);
    this.scene.add(keyLight);

    // Fill light (front-left, softer, blueish tint to match purple theme)
    const fillLight = new THREE.DirectionalLight(0xe8e5ff, 0.5);
    fillLight.position.set(-5, 2, 3);
    this.scene.add(fillLight);

    // Rim/Back light (high-rear, creates separation highlight on bottle edges)
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.85);
    rimLight.position.set(0, 6, -5);
    this.scene.add(rimLight);

    // 5. Build Procedural Bottle Group
    this.bottleGroup = new THREE.Group();
    
    // We create a nested tiltedGroup to rotate the bottle cleanly on its own local tilt axis
    this.tiltedGroup = new THREE.Group();
    this.buildBottle();
    this.bottleGroup.add(this.tiltedGroup);
    
    this.scene.add(this.bottleGroup);

    // Apply the static tilt from the reference design
    // Tilted slightly forward (X) and to the right (Z)
    this.tiltedGroup.rotation.x = 0.22; 
    this.tiltedGroup.rotation.z = -0.24; 
    
    // Adjust height position
    this.bottleGroup.position.set(0.0, -0.05, 0);

    // 6. Bind Event Listeners
    this.setupEvents();

    // 7. Initialize Visibility Tracking (Intersection Observer)
    this.setupIntersectionObserver();
  }

  // Create high-fidelity bottle mesh components procedurally
  buildBottle() {
    const bottleColor = 0x5b3fd9; // Primary brand violet
    
    // Custom Materials
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: bottleColor,
      roughness: 0.18,
      metalness: 0.05,
      bumpScale: 0.05
    });

    const whitePlasticMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.05
    });

    // 5A. Bottle Body (Fat, stubby cylinder like reference)
    // Height: 1.35, Radius: 0.65, 64 segments
    const bodyGeo = new THREE.CylinderGeometry(0.63, 0.65, 1.35, 64);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMaterial);
    bodyMesh.position.y = 0;
    this.tiltedGroup.add(bodyMesh);

    // Smooth rounded shoulder at the top of the body
    const shoulderGeo = new THREE.SphereGeometry(0.65, 64, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const shoulderMesh = new THREE.Mesh(shoulderGeo, bodyMaterial);
    shoulderMesh.scale.set(1, 0.42, 1);
    shoulderMesh.position.y = 0.675;
    this.tiltedGroup.add(shoulderMesh);

    // Base cap (slightly rounded bottom edge)
    const baseGeo = new THREE.SphereGeometry(0.65, 64, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    const baseMesh = new THREE.Mesh(baseGeo, bodyMaterial);
    baseMesh.scale.set(1, 0.22, 1);
    baseMesh.position.y = -0.675;
    this.tiltedGroup.add(baseMesh);

    // 5B. White Pump Cap Assembly
    // Bottle neck
    const neckGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.16, 32);
    const neckMesh = new THREE.Mesh(neckGeo, whitePlasticMaterial);
    neckMesh.position.y = 0.88;
    this.tiltedGroup.add(neckMesh);

    // Pump collar (wider screw-on section)
    const collarGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.14, 32);
    const collarMesh = new THREE.Mesh(collarGeo, whitePlasticMaterial);
    collarMesh.position.y = 1.02;
    this.tiltedGroup.add(collarMesh);

    // Pump stem
    const stemGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.26, 16);
    const stemMesh = new THREE.Mesh(stemGeo, whitePlasticMaterial);
    stemMesh.position.y = 1.18;
    this.tiltedGroup.add(stemMesh);

    // Pump dispenser head
    const capMainGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.28, 32);
    const capMainMesh = new THREE.Mesh(capMainGeo, whitePlasticMaterial);
    capMainMesh.position.y = 1.42;
    this.tiltedGroup.add(capMainMesh);

    // Pump spout / nozzle (nozzle extends to the left like reference)
    const nozzleGeo = new THREE.BoxGeometry(0.48, 0.09, 0.13);
    const nozzleMesh = new THREE.Mesh(nozzleGeo, whitePlasticMaterial);
    nozzleMesh.position.set(-0.24, 1.48, 0.0); // Extends negative X direction (left)
    nozzleMesh.rotation.z = 0.06; // Downward nozzle tilt
    this.tiltedGroup.add(nozzleGeo ? nozzleMesh : null);

    // 5C. Vector-crisp Label (Canvas Texture Mapping)
    const labelHeight = 0.95;
    const labelRadius = 0.654; // Sits slightly outside to prevent z-fighting
    const labelGeo = new THREE.CylinderGeometry(labelRadius, labelRadius, labelHeight, 64, 1, true);
    
    const labelTexture = this.createLabelTexture();
    const labelMaterial = new THREE.MeshStandardMaterial({
      map: labelTexture,
      transparent: true,
      roughness: 0.25,
      metalness: 0.0
    });

    const labelMesh = new THREE.Mesh(labelGeo, labelMaterial);
    labelMesh.position.y = -0.05;
    labelMesh.rotation.y = Math.PI * 0.92; // Aligns front of label facing camera
    this.tiltedGroup.add(labelMesh);

    // 5D. Soft Ambient Shadow (Floor Plane)
    // Sits in bottleGroup (not tiltedGroup) so the shadow stays flat on the floor
    const shadowGeo = new THREE.PlaneGeometry(2.0, 2.0);
    const shadowTexture = this.createShadowTexture();
    const shadowMaterial = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      depthWrite: false,
      opacity: 0.6
    });

    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMaterial);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -1.1; // Placed on the floor directly below the bottle
    this.bottleGroup.add(shadowMesh);
  }

  // Create standard high-res vector label on canvas
  createLabelTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Fill background with matching brand purple
    ctx.fillStyle = 'rgba(91, 63, 217, 1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle side border styling
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(0, 10, canvas.width, 100);
    ctx.fillRect(0, canvas.height - 110, canvas.width, 100);

    // Add Label Content - Matches Screenshot 1
    // Left Section: Stacked Performance Haircare label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.font = '800 16px "Inter", sans-serif';
    ctx.letterSpacing = '1px';
    ctx.fillText('PERFORMANCE DRIVEN', 90, 345);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '900 32px "Inter", sans-serif';
    ctx.letterSpacing = '6px';
    ctx.fillText('HAIRCARE', 90, 385);

    // Right Section: Huge brand Name "bolly"
    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic 900 210px "Inter", sans-serif'; // Taller, extremely bold italic wordmark
    ctx.letterSpacing = '-6px';
    ctx.fillText('bolly', 440, 390);

    // Product Title: "Clarify"
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.font = '500 84px "Inter", sans-serif';
    ctx.letterSpacing = '-2px';
    ctx.fillText('Clarify', 460, 520);

    // Product Subtitle: "Shampoo"
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.font = '400 58px "Inter", sans-serif';
    ctx.fillText('Shampoo', 460, 595);

    // Subtext: Scalp details
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '400 24px "Inter", sans-serif';
    ctx.fillText('Scalp Reset + Deep Cleanse', 460, 665);
    ctx.fillText('For build-up-prone and oily scalps', 460, 705);

    // Left Bottom: Volume labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.font = '700 26px "Inter", sans-serif';
    ctx.fillText('350ml e', 90, 825);
    ctx.font = '400 22px "Inter", sans-serif';
    ctx.fillText('11.8 FL. OZ.', 90, 865);

    // Right Bottom: Volume details
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '600 24px "Inter", sans-serif';
    ctx.fillText('300° ROTATION', 740, 825);

    // Create texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }

  // Create a procedural soft radial gradient shadow
  createShadowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 110);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
    gradient.addColorStop(0.3, 'rgba(0, 0, 0, 0.45)');
    gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.15)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  // Interaction Events (Desktop Cursor Hover & Mobile Swipe)
  setupEvents() {
    const el = this.renderer.domElement;

    el.addEventListener('pointermove', (e) => {
      this.lastInteractedTime = Date.now();
      
      if (e.pointerType === 'mouse') {
        const rect = el.getBoundingClientRect();
        const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const normY = ((e.clientY - rect.top) / rect.height) * 2 - 1;

        if (!this.isHovering) {
          // Hover Start: Capture current rotation angle and initial cursor position
          this.isHovering = true;
          this.hoverStartNormX = normX;
          this.hoverStartNormY = normY;
          this.hoverBaseRotationY = this.tiltedGroup.rotation.y;
          this.hoverBaseRotationX = this.bottleGroup.rotation.x;
        }

        // Calculate delta coordinate relative to hover start
        const deltaNormX = normX - this.hoverStartNormX;
        const deltaNormY = normY - this.hoverStartNormY;

        // Apply smooth relative rotation offset (approx 270 degrees total range)
        this.targetRotationY = this.hoverBaseRotationY + deltaNormX * Math.PI * 1.5;
        this.targetRotationX = Math.max(-0.15, Math.min(0.2, this.hoverBaseRotationX + deltaNormY * 0.40));
      } else {
        // Touch events (mobile) require active contact (drag)
        if (!this.isDragging) return;
        const deltaX = e.clientX - this.previousPointerX;
        const deltaY = e.clientY - this.previousPointerY;

        this.targetRotationY += deltaX * 0.012;
        this.targetRotationX = Math.max(-0.15, Math.min(0.2, this.targetRotationX + deltaY * 0.006));

        this.previousPointerX = e.clientX;
        this.previousPointerY = e.clientY;
      }
    });

    el.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse') {
        el.setPointerCapture(e.pointerId);
        this.isDragging = true;
        this.previousPointerX = e.clientX;
        this.previousPointerY = e.clientY;
        this.lastInteractedTime = Date.now();
      }
    });

    el.addEventListener('pointerup', (e) => {
      if (e.pointerType !== 'mouse') {
        el.releasePointerCapture(e.pointerId);
      }
      this.isDragging = false;
    });

    el.addEventListener('pointercancel', (e) => {
      if (e.pointerType !== 'mouse') {
        el.releasePointerCapture(e.pointerId);
      }
      this.isDragging = false;
    });

    el.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'mouse') {
        this.isHovering = false;
        // Resume automatic spin instantly
        this.lastInteractedTime = 0;
      }
      this.isDragging = false;
    });

    window.addEventListener('resize', () => this.onResize());
  }

  onResize() {
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height);
  }

  setupIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.isIntersecting = true;
          this.animate();
        } else {
          this.isIntersecting = false;
          if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
          }
        }
      });
    }, { threshold: 0.1 });

    observer.observe(this.container);
  }

  // Unified Render & Animation Loop
  animate() {
    if (!this.isIntersecting) return;

    this.animationFrameId = requestAnimationFrame(() => this.animate());

    const now = Date.now();
    const timeSinceInteraction = now - this.lastInteractedTime;

    // Apply slow idle spin when not dragging/hovering and idle delay elapsed
    if (!this.isDragging && !this.isHovering && timeSinceInteraction > this.idleDelay) {
      this.targetRotationY += this.autoRotateSpeed;
      this.targetRotationX += (0.0 - this.targetRotationX) * 0.05;
    }

    // Apply smooth local damping (drag rotates the nested tilted group local Y axis)
    this.tiltedGroup.rotation.y += (this.targetRotationY - this.tiltedGroup.rotation.y) * 0.08;
    
    // Tilt on X axis is mapped to the main bottle group to avoid gimbal lock conflicts
    this.bottleGroup.rotation.x += (this.targetRotationX - this.bottleGroup.rotation.x) * 0.08;

    this.renderer.render(this.scene, this.camera);
  }
}

// Instantiate and initialize components on load
document.addEventListener('DOMContentLoaded', () => {
  new BollyBottle3D('bolly-bottle-canvas');
  
  // Mobile Hamburger Menu Toggle handler
  const toggle = document.querySelector('.bolly-menu-toggle');
  const menu = document.querySelector('.bolly-mobile-menu');
  
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', !expanded);
      menu.classList.toggle('is-open');
      toggle.classList.toggle('active');
    });
  }
});
