/**
 * JULY DRIVE 2026 — 3D Three.js Championship Trophy
 * High-performance metallic 3D trophy with dynamic studio reflection,
 * real-time rotation, sine levitation, interactive mouse tilt, and sparkle glints.
 */

(function () {
  'use strict';

  if (typeof THREE === 'undefined') {
    console.warn('Three.js is not loaded. 3D Trophy will fall back.');
    return;
  }

  // Tier configuration with realistic metallic PBR materials
  const TIER_CONFIG = {
    champ: {
      color: 0xF7D87D,
      metalness: 0.95,
      roughness: 0.15,
      accent: 0xFFF2A8,
      glow: 'rgba(240, 208, 112, 0.45)',
      scale: 1.05,
      hasLid: true,
      label: 'CHAMPION'
    },
    gold: {
      color: 0xF2D06B,
      metalness: 0.94,
      roughness: 0.16,
      accent: 0xFFEAA0,
      glow: 'rgba(201, 168, 76, 0.4)',
      scale: 1.0,
      hasLid: false,
      label: '1ST PLACE'
    },
    silver: {
      color: 0xE8ECF2,
      metalness: 0.96,
      roughness: 0.14,
      accent: 0xFFFFFF,
      glow: 'rgba(216, 216, 224, 0.35)',
      scale: 0.96,
      hasLid: false,
      label: '2ND PLACE'
    },
    bronze: {
      color: 0xD69250,
      metalness: 0.88,
      roughness: 0.22,
      accent: 0xF5BA7E,
      glow: 'rgba(176, 112, 48, 0.35)',
      scale: 0.94,
      hasLid: false,
      label: '3RD PLACE'
    },
    teal: {
      color: 0x00E5C0,
      metalness: 0.85,
      roughness: 0.2,
      accent: 0x40DFC8,
      glow: 'rgba(0, 191, 165, 0.45)',
      scale: 0.98,
      hasLid: false,
      label: 'LEAD CONVERTER'
    },
    amber: {
      color: 0xF59E2E,
      metalness: 0.88,
      roughness: 0.2,
      accent: 0xF8C06A,
      glow: 'rgba(232, 146, 42, 0.45)',
      scale: 0.98,
      hasLid: false,
      label: 'REF CONVERTER'
    }
  };

  class Trophy3DManager {
    constructor() {
      this.renderer = null;
      this.scene = null;
      this.camera = null;
      this.envTexture = null;
      this.trophyGroups = {};
      this.currentGroup = null;
      this.currentTier = null;
      this.currentMount = null;
      this.sparkles = null;
      this.animId = null;
      this.clock = new THREE.Clock();
      this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
      this.size = { width: 170, height: 170 };
      this.isRunning = false;

      this.init();
    }

    init() {
      // 1. Scene & Camera
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
      this.camera.position.set(0, 0.4, 7.8);

      // 2. High-performance WebGL Renderer
      const canvas = document.createElement('canvas');
      canvas.className = 'trophy-3d-canvas';
      this.renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.setSize(this.size.width, this.size.height, false);
      if (this.renderer.outputEncoding !== undefined) {
        this.renderer.outputEncoding = THREE.sRGBEncoding;
      }
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.25;

      // 3. Procedural Studio Reflection Map (Equirectangular)
      this.envTexture = this.generateStudioEnv();
      this.scene.environment = this.envTexture;

      // 4. Studio 3-Point Lighting
      this.setupLighting();

      // 5. Sparkle Particle System
      this.setupSparkles();

      // 6. Prebuild Trophy Meshes for Tiers
      Object.keys(TIER_CONFIG).forEach(tier => {
        const group = this.buildTrophy(tier);
        group.visible = false;
        this.trophyGroups[tier] = group;
        this.scene.add(group);
      });

      // 7. Mouse Interaction
      window.addEventListener('mousemove', (e) => {
        const halfX = window.innerWidth / 2;
        const halfY = window.innerHeight / 2;
        this.mouse.targetX = (e.clientX - halfX) / halfX;
        this.mouse.targetY = (e.clientY - halfY) / halfY;
      }, { passive: true });

      // 8. Observe active slide changes
      this.observeSlides();

      // 9. Initial check
      this.checkActiveSlide();
    }

    generateStudioEnv() {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 128;
      const ctx = c.getContext('2d');

      // Atmospheric metallic reflection gradient
      const grad = ctx.createLinearGradient(0, 0, 0, 128);
      grad.addColorStop(0.0, '#0a0a0d');
      grad.addColorStop(0.25, '#282218');
      grad.addColorStop(0.48, '#6e5625');
      grad.addColorStop(0.68, '#fff6d4');
      grad.addColorStop(0.74, '#ffffff');
      grad.addColorStop(0.82, '#c9a84c');
      grad.addColorStop(0.92, '#382a10');
      grad.addColorStop(1.0, '#0a0a0c');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 128);

      // Studio softbox highlights
      ctx.fillStyle = 'rgba(255, 255, 245, 0.95)';
      ctx.beginPath();
      ctx.ellipse(65, 45, 45, 22, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(160, 220, 255, 0.75)';
      ctx.beginPath();
      ctx.ellipse(190, 75, 38, 26, 0, 0, Math.PI * 2);
      ctx.fill();

      const tex = new THREE.CanvasTexture(c);
      tex.mapping = THREE.EquirectangularReflectionMapping;
      return tex;
    }

    setupLighting() {
      // Ambient warm fill
      const ambLight = new THREE.AmbientLight(0xfff5e0, 0.85);
      this.scene.add(ambLight);

      // Key light - Warm gold from top right
      const keyLight = new THREE.DirectionalLight(0xfff2cc, 2.6);
      keyLight.position.set(4.5, 7.5, 5.0);
      this.scene.add(keyLight);

      // Rim light - Cool cyan accent from back left
      const rimLight = new THREE.DirectionalLight(0x40dfc8, 1.4);
      rimLight.position.set(-5.5, 2.5, -4.5);
      this.scene.add(rimLight);

      // Front glint point light
      const glintLight = new THREE.PointLight(0xffe699, 1.8, 8);
      glintLight.position.set(0, 1.2, 4.0);
      this.scene.add(glintLight);

      // Bottom bounce light
      const bounceLight = new THREE.DirectionalLight(0xffe0a0, 1.2);
      bounceLight.position.set(0, -5, 3);
      this.scene.add(bounceLight);
    }

    setupSparkles() {
      const count = 30;
      const positions = new Float32Array(count * 3);
      const scales = new Float32Array(count);
      const speeds = [];

      for (let i = 0; i < count; i++) {
        const r = 1.4 + Math.random() * 1.8;
        const theta = Math.random() * Math.PI * 2;
        const y = -1.2 + Math.random() * 2.8;

        positions[i * 3 + 0] = Math.cos(theta) * r;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = Math.sin(theta) * r;

        scales[i] = Math.random();
        speeds.push({
          orbitSpeed: 0.3 + Math.random() * 0.5,
          radius: r,
          angle: theta,
          baseY: y,
          ySpeed: 0.4 + Math.random() * 0.6
        });
      }

      // Sparkle sprite texture
      const c = document.createElement('canvas');
      c.width = 32; c.height = 32;
      const ctx = c.getContext('2d');
      const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.3, 'rgba(240, 208, 112, 0.8)');
      grad.addColorStop(0.7, 'rgba(201, 168, 76, 0.2)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 32, 32);

      const sparkleTex = new THREE.CanvasTexture(c);

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const mat = new THREE.PointsMaterial({
        size: 0.18,
        map: sparkleTex,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      this.sparkles = new THREE.Points(geo, mat);
      this.sparklesData = speeds;
      this.scene.add(this.sparkles);
    }

    buildTrophy(tier) {
      const cfg = TIER_CONFIG[tier] || TIER_CONFIG.gold;
      const group = new THREE.Group();

      const mat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        metalness: cfg.metalness,
        roughness: cfg.roughness,
        envMapIntensity: 1.35
      });

      const accentMat = new THREE.MeshStandardMaterial({
        color: cfg.accent,
        metalness: 0.98,
        roughness: 0.12,
        envMapIntensity: 1.5
      });

      // Dark pedestal base ring
      const baseMat = new THREE.MeshStandardMaterial({
        color: 0x1a1815,
        metalness: 0.5,
        roughness: 0.4
      });

      // 1. Multi-tier Base
      // Bottom plinth (octagonal)
      const base1 = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.68, 0.38, 8), baseMat);
      base1.position.y = 0.19;
      // Golden step
      const base2 = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.5, 0.18, 32), accentMat);
      base2.position.y = 0.46;
      // Pedestal column
      const base3 = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.25, 0.42, 32), baseMat);
      base3.position.y = 0.74;
      // Top collar ring
      const baseCollar = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.08, 16, 32), accentMat);
      baseCollar.rotation.x = Math.PI / 2;
      baseCollar.position.y = 0.95;
      group.add(base1, base2, base3, baseCollar);

      // 2. Stem
      const stemLower = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.68, 0.55, 32), mat);
      stemLower.position.y = 1.22;
      const stemKnop = new THREE.Mesh(new THREE.SphereGeometry(0.52, 32, 16), accentMat);
      stemKnop.scale.set(1, 0.65, 1);
      stemKnop.position.y = 1.55;
      const stemUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.38, 0.45, 32), mat);
      stemUpper.position.y = 1.85;
      group.add(stemLower, stemKnop, stemUpper);

      // 3. Chalice / Cup Body (Lathe)
      const cupPoints = [
        new THREE.Vector2(0.3, 0),
        new THREE.Vector2(0.68, 0.22),
        new THREE.Vector2(1.12, 0.62),
        new THREE.Vector2(1.3, 1.12),
        new THREE.Vector2(1.34, 1.62),
        new THREE.Vector2(1.48, 1.98),  // outer lip
        new THREE.Vector2(1.4, 2.0),    // crest
        new THREE.Vector2(1.26, 1.88),  // inner lip
        new THREE.Vector2(1.16, 1.3),
        new THREE.Vector2(0.92, 0.62),
        new THREE.Vector2(0.0, 0.28)    // floor
      ];
      const cup = new THREE.Mesh(new THREE.LatheGeometry(cupPoints, 48), mat);
      cup.position.y = 2.02;
      group.add(cup);

      // Ornate waist ring on cup
      const waistRing = new THREE.Mesh(new THREE.TorusGeometry(1.32, 0.06, 16, 48), accentMat);
      waistRing.rotation.x = Math.PI / 2;
      waistRing.position.y = 3.25;
      group.add(waistRing);

      // 4. Dual Swept Ornate Handles
      const handlePoints = [
        new THREE.Vector3(1.28, 1.75, 0),
        new THREE.Vector3(2.0, 1.9, 0),
        new THREE.Vector3(2.32, 1.45, 0),
        new THREE.Vector3(2.15, 0.72, 0),
        new THREE.Vector3(1.62, 0.2, 0),
        new THREE.Vector3(0.92, 0.35, 0)
      ];
      const handleCurve = new THREE.CatmullRomCurve3(handlePoints);
      const handleGeo = new THREE.TubeGeometry(handleCurve, 32, 0.1, 16, false);
      const handleRight = new THREE.Mesh(handleGeo, accentMat);
      handleRight.position.y = 2.02;
      const handleLeft = new THREE.Mesh(handleGeo, accentMat);
      handleLeft.position.y = 2.02;
      handleLeft.scale.set(-1, 1, 1);
      group.add(handleRight, handleLeft);

      // 5. Crown Lid + Victory Star (Champion tier only)
      if (cfg.hasLid) {
        const lidPoints = [
          new THREE.Vector2(0.0, 0.68),
          new THREE.Vector2(0.48, 0.62),
          new THREE.Vector2(0.95, 0.44),
          new THREE.Vector2(1.28, 0.2),
          new THREE.Vector2(1.38, 0.05),
          new THREE.Vector2(1.35, 0.0)
        ];
        const lid = new THREE.Mesh(new THREE.LatheGeometry(lidPoints, 40), mat);
        lid.position.y = 3.96;
        group.add(lid);

        // 3D 5-pointed star finial
        const starShape = new THREE.Shape();
        const pts = 5;
        for (let i = 0; i < pts * 2; i++) {
          const r = (i % 2 === 0) ? 0.36 : 0.16;
          const a = (i / (pts * 2)) * Math.PI * 2 - Math.PI / 2;
          const x = Math.cos(a) * r;
          const y = Math.sin(a) * r;
          if (i === 0) starShape.moveTo(x, y);
          else starShape.lineTo(x, y);
        }
        starShape.closePath();
        const starGeo = new THREE.ExtrudeGeometry(starShape, {
          depth: 0.09,
          bevelEnabled: true,
          bevelThickness: 0.03,
          bevelSize: 0.02,
          bevelSegments: 2
        });
        const star = new THREE.Mesh(starGeo, accentMat);
        star.position.set(0, 4.82, 0);
        group.add(star);
      }

      // Center geometry pivot
      group.children.forEach(c => {
        c.position.y -= 2.2;
      });

      group.scale.setScalar(cfg.scale);
      return group;
    }

    setTier(tier) {
      if (this.currentTier === tier && this.currentGroup) return;

      const newTier = TIER_CONFIG[tier] ? tier : 'gold';
      this.currentTier = newTier;

      Object.keys(this.trophyGroups).forEach(k => {
        this.trophyGroups[k].visible = (k === newTier);
      });
      this.currentGroup = this.trophyGroups[newTier];

      // Reset rotation with smooth entrance
      if (this.currentGroup) {
        this.currentGroup.scale.set(0, 0, 0);
        const targetScale = TIER_CONFIG[newTier].scale;
        if (typeof gsap !== 'undefined') {
          gsap.to(this.currentGroup.scale, {
            x: targetScale,
            y: targetScale,
            z: targetScale,
            duration: 0.85,
            ease: 'back.out(1.8)'
          });
        } else {
          this.currentGroup.scale.setScalar(targetScale);
        }
      }
    }

    mountTo(container, tier = 'gold') {
      if (!container) return;

      this.currentMount = container;
      const rect = container.getBoundingClientRect();
      const w = Math.max(rect.width || 170, 140);
      const h = Math.max(rect.height || 170, 140);

      this.size = { width: w, height: h };
      this.renderer.setSize(w, h, false);

      const canvas = this.renderer.domElement;
      if (canvas.parentElement !== container) {
        // Hide existing static trophy image inside container if present
        const staticImg = container.querySelector('.trophy-img');
        if (staticImg) staticImg.style.display = 'none';

        container.appendChild(canvas);
      }

      this.setTier(tier);
      this.start();
    }

    unmount() {
      if (this.currentMount) {
        const staticImg = this.currentMount.querySelector('.trophy-img');
        if (staticImg) staticImg.style.display = '';
      }
      if (this.renderer && this.renderer.domElement.parentElement) {
        this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
      }
      this.currentMount = null;
      this.stop();
    }

    start() {
      if (this.isRunning) return;
      this.isRunning = true;
      this.clock.start();
      this.tick();
    }

    stop() {
      this.isRunning = false;
      if (this.animId) {
        cancelAnimationFrame(this.animId);
        this.animId = null;
      }
    }

    tick() {
      if (!this.isRunning) return;
      this.animId = requestAnimationFrame(() => this.tick());

      const dt = this.clock.getDelta();
      const time = this.clock.getElapsedTime();

      // Mouse smoothing
      this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.06;
      this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.06;

      if (this.currentGroup) {
        // Continuous smooth 360 rotation
        this.currentGroup.rotation.y += dt * 0.95;

        // Sine wave levitation bob
        this.currentGroup.position.y = Math.sin(time * 2.2) * 0.12;

        // Interactive mouse parallax tilt
        this.currentGroup.rotation.x = this.mouse.y * 0.28;
        this.currentGroup.rotation.z = -this.mouse.x * 0.18;
      }

      // Orbiting sparkles update
      if (this.sparkles && this.sparklesData) {
        const positions = this.sparkles.geometry.attributes.position.array;
        for (let i = 0; i < this.sparklesData.length; i++) {
          const s = this.sparklesData[i];
          s.angle += dt * s.orbitSpeed;
          positions[i * 3 + 0] = Math.cos(s.angle) * s.radius;
          positions[i * 3 + 1] = s.baseY + Math.sin(time * s.ySpeed) * 0.25;
          positions[i * 3 + 2] = Math.sin(s.angle) * s.radius;
        }
        this.sparkles.geometry.attributes.position.needsUpdate = true;
      }

      this.renderer.render(this.scene, this.camera);
    }

    observeSlides() {
      // 1. Listen for active slide mutations
      const observer = new MutationObserver(() => {
        this.checkActiveSlide();
      });

      const slides = document.querySelectorAll('.slide');
      slides.forEach(slide => {
        observer.observe(slide, { attributes: true, attributeFilter: ['class'] });
      });

      // 2. Window resize handler
      window.addEventListener('resize', () => {
        if (this.currentMount) {
          const rect = this.currentMount.getBoundingClientRect();
          const w = Math.max(rect.width || 170, 140);
          const h = Math.max(rect.height || 170, 140);
          this.renderer.setSize(w, h, false);
        }
      });
    }

    checkActiveSlide() {
      const activeSlide = document.querySelector('.slide.active:not(.exit)');
      if (!activeSlide) {
        this.unmount();
        return;
      }

      // Check for .trophy-float container inside active slide
      const trophyMount = activeSlide.querySelector('.trophy-float');
      if (trophyMount) {
        const tier = trophyMount.dataset.tier ||
          (trophyMount.classList.contains('champ-trophy') ? 'champ' :
            (activeSlide.classList.contains('gold-winner') ? 'gold' : 'gold'));
        this.mountTo(trophyMount, tier);
      } else {
        this.unmount();
      }
    }
  }

  // Export globally and auto-mount on ready
  window.Trophy3D = Trophy3DManager;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.trophy3DInstance = new Trophy3DManager();
    });
  } else {
    window.trophy3DInstance = new Trophy3DManager();
  }
})();
