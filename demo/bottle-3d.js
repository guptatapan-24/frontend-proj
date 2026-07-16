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
    this.camera = new THREE.PerspectiveCamera(38, this.width / this.height, 0.1, 100);
    this.camera.position.set(0, 0.0, 5.2); // Moved camera back to Z=5.2 to ensure the bottle is completely within the frame // Moved camera back to Z=4.3 to keep bottle completely inside frame

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

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
    keyLight.position.set(5, 5, 4);
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe8e5ff, 0.5);
    fillLight.position.set(-5, 2, 3);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.85);
    rimLight.position.set(0, 6, -5);
    this.scene.add(rimLight);

    // 5. Build Procedural Bottle Group
    this.bottleGroup = new THREE.Group();
    
    this.tiltedGroup = new THREE.Group();
    this.buildBottle();
    this.bottleGroup.add(this.tiltedGroup);
    
    this.scene.add(this.bottleGroup);

    // Apply the static tilt from the reference design
    this.tiltedGroup.rotation.x = 0.22; 
    this.tiltedGroup.rotation.z = -0.24; 
    
    this.bottleGroup.position.set(0.0, -0.05, 0);

    // 6. Bind Event Listeners
    this.setupEvents();

    // 7. Initialize Visibility Tracking (Intersection Observer)
    this.setupIntersectionObserver();
  }

  buildBottle() {
    const bottleColor = 0x55379b; // Warm, saturated violet-plum color matching reference photo
    
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: bottleColor,
      roughness: 0.16, // Snugger roughness for a sleeker satin gloss sheen
      metalness: 0.05,
      bumpScale: 0.05
    });

    const whitePlasticMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.05
    });

    // 5A. Bottle Body (Fat, stubby cylinder like reference)
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
    const neckGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.16, 32);
    const neckMesh = new THREE.Mesh(neckGeo, whitePlasticMaterial);
    neckMesh.position.y = 0.88;
    this.tiltedGroup.add(neckMesh);

    // Pump collar
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
    nozzleMesh.position.set(-0.24, 1.48, 0.0);
    nozzleMesh.rotation.z = 0.06;
    this.tiltedGroup.add(nozzleMesh);

    // 5C. Vector-crisp Label (Canvas Texture Mapping)
    const labelHeight = 0.95;
    const labelRadius = 0.654;
    const labelGeo = new THREE.CylinderGeometry(labelRadius, labelRadius, labelHeight, 64, 1, true);
    
    const labelTexture = this.createLabelTexture();

    // Enable Anisotropic Filtering & Mipmapping for vector-sharp label text at all tilt angles
    const maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();
    labelTexture.anisotropy = maxAnisotropy;
    labelTexture.generateMipmaps = true;
    labelTexture.minFilter = THREE.LinearMipmapLinearFilter;
    labelTexture.magFilter = THREE.LinearFilter;

    const labelMaterial = new THREE.MeshStandardMaterial({
      map: labelTexture,
      transparent: true,
      roughness: 0.22,
      metalness: 0.0
    });

    const labelMesh = new THREE.Mesh(labelGeo, labelMaterial);
    labelMesh.position.y = -0.05;
    labelMesh.rotation.y = Math.PI * 0.92;
    this.tiltedGroup.add(labelMesh);

    // Shadow mesh removed as requested
  }

  // Create standard high-res vector label on canvas (2048x2048 for maximum text legibility)
  createLabelTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');

    // Fill background with matching brand deep warm violet
    ctx.fillStyle = 'rgba(85, 55, 155, 1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle side border styling
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.fillRect(0, 20, canvas.width, 200);
    ctx.fillRect(0, canvas.height - 220, canvas.width, 200);    // Add Label Content (Centered alignments and tight X-coordinates to fit perfectly on the bottle front)
    // Left Section: Stacked Performance Haircare label (Pushed left to x=460 and sized down to prevent bolly overlap)
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.font = '800 26px "Inter", sans-serif';
    ctx.letterSpacing = '2px';
    ctx.fillText('PERFORMANCE DRIVEN', 460, 710);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '900 48px "Inter", sans-serif';
    ctx.letterSpacing = '8px';
    ctx.fillText('HAIRCARE', 460, 780);

    // Right Section: Huge brand Name "bolly" (Centered at 1200)
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic 900 290px "Inter", sans-serif'; // Perfectly sized italic wordmark
    ctx.letterSpacing = '-12px';
    ctx.fillText('bolly', 1200, 780);

    // Product Title: "Clarify" (Aligned to new center 1200)
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.font = '500 135px "Inter", sans-serif';
    ctx.letterSpacing = '-4px';
    ctx.fillText('Clarify', 1200, 970);

    // Product Subtitle: "Shampoo" (Aligned to new center 1200)
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.font = '400 100px "Inter", sans-serif';
    ctx.fillText('Shampoo', 1200, 1100);

    // Subtext: Scalp details (Aligned to new center 1200)
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '400 44px "Inter", sans-serif';
    ctx.fillText('Scalp Reset + Deep Cleanse', 1200, 1220);
    ctx.fillText('For build-up-prone and oily scalps', 1200, 1290);

    // Left Bottom: Volume label (Aligned left to x=460)
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.font = '700 52px "Inter", sans-serif';
    ctx.fillText('350ml', 460, 1560);

    // Create texture
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

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

    this.tiltedGroup.rotation.y += (this.targetRotationY - this.tiltedGroup.rotation.y) * 0.08;
    this.bottleGroup.rotation.x += (this.targetRotationX - this.bottleGroup.rotation.x) * 0.08;

    this.renderer.render(this.scene, this.camera);
  }
}

// Instantiate and initialize components on load
document.addEventListener('DOMContentLoaded', () => {
  new BollyBottle3D('bolly-bottle-canvas');
  
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
