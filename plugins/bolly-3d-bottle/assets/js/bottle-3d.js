// Bolly Clarify Shampoo — Interactive 3D Bottle Script (Three.js)

class BollyBottle3D {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.bottleGroup = null;
    
    // Interaction states
    this.isDragging = false;
    this.previousPointerX = 0;
    this.previousPointerY = 0;
    this.targetRotationY = 0;
    this.targetRotationX = 0.1; // Default slight tilt forward
    
    // Auto rotation parameters
    this.autoRotateSpeed = 0.005;
    this.lastInteractedTime = 0;
    this.idleDelay = 3000; // Return to idle spin after 3 seconds of no activity

    // Animation frame ID
    this.animationFrameId = null;
    this.isIntersecting = false;

    this.init();
  }

  init() {
    // 1. Scene Setup
    this.scene = new THREE.Scene();

    // 2. Camera Setup
    this.camera = new THREE.PerspectiveCamera(40, this.width / this.height, 0.1, 100);
    this.camera.position.set(0, 0.2, 4.2);

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap at 2 for performance
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Set touch action on the canvas element directly to enable vertical page scrolling
    this.renderer.domElement.style.touchAction = 'pan-y';

    // 4. Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    // Primary key light (front-right, bright, casts soft highlight)
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.85);
    keyLight.position.set(5, 5, 4);
    this.scene.add(keyLight);

    // Fill light (front-left, softer, blueish tint to match purple theme)
    const fillLight = new THREE.DirectionalLight(0xe5e1ff, 0.45);
    fillLight.position.set(-5, 2, 3);
    this.scene.add(fillLight);

    // Rim/Back light (high-rear, creates separation highlight on bottle edges)
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.7);
    rimLight.position.set(0, 6, -5);
    this.scene.add(rimLight);

    // 5. Build Procedural Bottle Group
    this.bottleGroup = new THREE.Group();
    this.buildBottle();
    this.scene.add(this.bottleGroup);

    // Initial position adjust (center the bottle visually)
    this.bottleGroup.position.y = -0.1;

    // 6. Bind Event Listeners
    this.setupEvents();

    // 7. Initialize Visibility Tracking (Intersection Observer)
    this.setupIntersectionObserver();
  }

  // Create high-fidelity bottle mesh components procedurally
  buildBottle() {
    const bottleColor = 0x5b3fd9; // Primary violet
    
    // Custom Materials
    // Body: Glossy purple plastic with subtle metallic/clearcoat appearance
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: bottleColor,
      roughness: 0.2,
      metalness: 0.05,
      bumpScale: 0.05
    });

    // Neck / Pump Collar: Matte/Slightly reflective white plastic
    const whitePlasticMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.35,
      metalness: 0.05
    });

    // 5A. Bottle Body Assembly
    const bodyGeo = new THREE.CylinderGeometry(0.52, 0.54, 1.8, 64);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMaterial);
    bodyMesh.position.y = 0;
    this.bottleGroup.add(bodyMesh);

    // Smooth rounded shoulder at the top of the body
    const shoulderGeo = new THREE.SphereGeometry(0.54, 64, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const shoulderMesh = new THREE.Mesh(shoulderGeo, bodyMaterial);
    shoulderMesh.scale.set(1, 0.35, 1);
    shoulderMesh.position.y = 0.9;
    this.bottleGroup.add(shoulderMesh);

    // Base cap (slightly rounded bottom edge)
    const baseGeo = new THREE.SphereGeometry(0.54, 64, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    const baseMesh = new THREE.Mesh(baseGeo, bodyMaterial);
    baseMesh.scale.set(1, 0.15, 1);
    baseMesh.position.y = -0.9;
    this.bottleGroup.add(baseMesh);

    // 5B. White Pump Cap Assembly
    const neckGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.16, 32);
    const neckMesh = new THREE.Mesh(neckGeo, whitePlasticMaterial);
    neckMesh.position.y = 1.08;
    this.bottleGroup.add(neckMesh);

    // Pump collar
    const collarGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.12, 32);
    const collarMesh = new THREE.Mesh(collarGeo, whitePlasticMaterial);
    collarMesh.position.y = 1.20;
    this.bottleGroup.add(collarMesh);

    // Pump stem
    const stemGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.28, 16);
    const stemMesh = new THREE.Mesh(stemGeo, whitePlasticMaterial);
    stemMesh.position.y = 1.34;
    this.bottleGroup.add(stemMesh);

    // Pump dispenser head
    const capMainGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.3, 32);
    const capMainMesh = new THREE.Mesh(capMainGeo, whitePlasticMaterial);
    capMainMesh.position.y = 1.56;
    this.bottleGroup.add(capMainMesh);

    // Pump spout / nozzle
    const nozzleGeo = new THREE.BoxGeometry(0.12, 0.1, 0.44);
    const nozzleMesh = new THREE.Mesh(nozzleGeo, whitePlasticMaterial);
    nozzleMesh.position.set(0, 1.62, 0.22);
    nozzleMesh.rotation.x = 0.08;
    this.bottleGroup.add(nozzleMesh);

    // 5C. Vector-crisp Label (Canvas Texture Mapping)
    const labelHeight = 1.25;
    const labelRadius = 0.545;
    const labelGeo = new THREE.CylinderGeometry(labelRadius, labelRadius, labelHeight, 64, 1, true);
    
    const labelTexture = this.createLabelTexture();
    const labelMaterial = new THREE.MeshStandardMaterial({
      map: labelTexture,
      transparent: true,
      roughness: 0.3,
      metalness: 0.0
    });

    const labelMesh = new THREE.Mesh(labelGeo, labelMaterial);
    labelMesh.position.y = -0.1;
    labelMesh.rotation.y = Math.PI * 0.95; 
    this.bottleGroup.add(labelMesh);

    // 5D. Soft Ambient Shadow (Floor Plane)
    const shadowGeo = new THREE.PlaneGeometry(1.8, 1.8);
    const shadowTexture = this.createShadowTexture();
    const shadowMaterial = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      depthWrite: false,
      opacity: 0.55
    });

    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMaterial);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -1.1;
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

    // Draw grid styling elements or side details
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(0, 10, canvas.width, 100);
    ctx.fillRect(0, canvas.height - 110, canvas.width, 100);

    // Add Label Content
    // Brand category: "HAIRCARE"
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '800 24px "Inter", sans-serif';
    ctx.letterSpacing = '10px';
    ctx.fillText('HAIRCARE', 120, 260);

    // Brand Name: "bolly"
    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic 900 135px "Inter", sans-serif';
    ctx.letterSpacing = '-4px';
    ctx.fillText('bolly', 120, 390);

    // Product Title: "Clarify"
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.font = '500 70px "Inter", sans-serif';
    ctx.letterSpacing = '-1px';
    ctx.fillText('Clarify', 120, 520);

    // Product Subtitle: "Shampoo"
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '400 50px "Inter", sans-serif';
    ctx.fillText('Shampoo', 120, 590);

    // Ingredients note / details
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '400 22px "Inter", sans-serif';
    ctx.fillText('Shines • Hydrates • Revitalizes', 120, 680);
    ctx.fillText('Knocks Out Flakes from Root to Shine', 120, 720);

    // Volume label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '700 24px "Inter", sans-serif';
    ctx.fillText('350ml e', 120, 850);

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

  // Interaction Events
  setupEvents() {
    const el = this.renderer.domElement;
    const hint = document.querySelector('.bolly-drag-hint');

    const handleStart = (clientX, clientY) => {
      this.isDragging = true;
      this.previousPointerX = clientX;
      this.previousPointerY = clientY;
      this.lastInteractedTime = Date.now();
      
      if (hint && !hint.classList.contains('fade-out')) {
        hint.classList.add('fade-out');
      }
    };

    const handleMove = (clientX, clientY) => {
      if (!this.isDragging) return;
      
      const deltaX = clientX - this.previousPointerX;
      const deltaY = clientY - this.previousPointerY;

      // Sensitivity factor
      this.targetRotationY += deltaX * 0.008;
      // Slight vertical tilt clamp
      this.targetRotationX = Math.max(-0.1, Math.min(0.25, this.targetRotationX + deltaY * 0.004));

      this.previousPointerX = clientX;
      this.previousPointerY = clientY;
      this.lastInteractedTime = Date.now();
    };

    const handleEnd = () => {
      this.isDragging = false;
    };

    // Pointer events (handles mouse + touch in modern browsers)
    el.addEventListener('pointerdown', (e) => {
      el.setPointerCapture(e.pointerId);
      handleStart(e.clientX, e.clientY);
    });

    el.addEventListener('pointermove', (e) => {
      handleMove(e.clientX, e.clientY);
    });

    el.addEventListener('pointerup', (e) => {
      el.releasePointerCapture(e.pointerId);
      handleEnd();
    });

    el.addEventListener('pointercancel', (e) => {
      el.releasePointerCapture(e.pointerId);
      handleEnd();
    });

    // Resize Handler
    window.addEventListener('resize', () => this.onResize());
  }

  onResize() {
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height);
  }

  // Intersection Observer for Lazy Animation Rendering
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

    // Apply slow idle spin when not dragging and idle delay elapsed
    if (!this.isDragging && timeSinceInteraction > this.idleDelay) {
      this.targetRotationY += this.autoRotateSpeed;
      this.targetRotationX += (0.1 - this.targetRotationX) * 0.05;
    }

    // Apply smooth inertia damping (linear interpolation towards target)
    this.bottleGroup.rotation.y += (this.targetRotationY - this.bottleGroup.rotation.y) * 0.08;
    this.bottleGroup.rotation.x += (this.targetRotationX - this.bottleGroup.rotation.x) * 0.08;

    this.renderer.render(this.scene, this.camera);
  }
}

// Instantiate on load
document.addEventListener('DOMContentLoaded', () => {
  new BollyBottle3D('bolly-bottle-canvas');
});
