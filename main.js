'use strict';

/* ================================================================
   GSAP Registration
   ================================================================ */
gsap.registerPlugin(ScrollTrigger, CustomEase);

// Custom cinematic ease
CustomEase.create('cinematic', 'M0,0 C0.05,0 0.133,0.26 0.24,0.52 C0.348,0.78 0.45,1 1,1');

/* ================================================================
   ASSET REGISTRY — Central mapping of winners to photographs
   ================================================================ */
const ASSET_REGISTRY = {
  AKSHATA:   { file: 'Akshata.png',    bgType: 'photo',       orientation: 'portrait'  },
  SAHIL:     { file: 'Sahil.png',      bgType: 'transparent', orientation: 'full-body' },
  SIDDHARTH: { file: 'Siddharth.png',  bgType: 'photo',       orientation: 'portrait'  },
  SIDDHESH:  { file: 'Siddhesh.png',   bgType: 'white',       orientation: 'portrait'  },
  YASHPREET: { file: 'Yashpreet.png',  bgType: 'white',       orientation: 'full-body' },
};

/* ================================================================
   TEAM LOGO REGISTRY
   ================================================================ */
const TEAM_LOGOS = {
  WOLFS:   'Wolf logo.png',
  WOLFVES: 'Wolf logo.png',
  WOLF:    'Wolf logo.png',
  ASTRAS:  'Astras logo.jpeg',
  MKM:     'MKM logo.jpeg',
};

/* ================================================================
   SLIDE → PHOTO MAP
   ================================================================ */
const SLIDE_PHOTOS = {
  2:  ['photo-sahil'],
  3:  ['photo-akshata-adm'],
  4:  ['photo-yashpreet-adm'],
  6:  ['photo-siddhesh-pts'],
  7:  ['photo-yashpreet-pts'],
  8:  ['photo-akshata-pts'],
  10: ['photo-siddharth'],
  12: ['photo-siddhesh-ref'],
  14: ['photo-akshata-champ'],
};

/* ================================================================
   CANVAS — Geometric mesh background
   ================================================================ */
const canvas = document.getElementById('bg-canvas');
const ctx    = canvas.getContext('2d');
let W, H;
let meshPoints = [];
let floatStars = [];

function resizeCanvas() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
  buildMesh();
  buildStars();
}

function buildMesh() {
  const cols = 14, rows = 9;
  meshPoints = [];
  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c <= cols; c++) {
      meshPoints.push({
        bx: (c / cols) * W,
        by: (r / rows) * H,
        ox: (Math.random() - 0.5) * 70,
        oy: (Math.random() - 0.5) * 70,
        speed: Math.random() * 0.4 + 0.08,
        phase: Math.random() * Math.PI * 2,
        cols: cols + 1,
      });
    }
  }
}

function buildStars() {
  floatStars = Array.from({ length: 140 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: Math.random() * 1.3 + 0.2,
    a: Math.random() * 0.5 + 0.04,
    ta: Math.random() * 0.018 + 0.004,
    dir: 1,
    vy: -(Math.random() * 0.14 + 0.03),
  }));
}

function drawBg(t) {
  ctx.clearRect(0, 0, W, H);

  // Deep gradient background
  const grad = ctx.createLinearGradient(0, 0, W * 0.4, H);
  grad.addColorStop(0, '#06080F');
  grad.addColorStop(0.45, '#050709');
  grad.addColorStop(1, '#030507');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Vignette
  const vig = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W,H) * 0.72);
  vig.addColorStop(0, 'transparent');
  vig.addColorStop(1, 'rgba(0,0,0,0.58)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // Animated geometric mesh lines
  const ts   = t * 0.00028;
  const cols = meshPoints[0]?.cols || 15;
  const rows = Math.floor(meshPoints.length / cols);

  function px(idx) {
    const p = meshPoints[idx];
    if (!p) return { x: 0, y: 0 };
    return {
      x: p.bx + Math.sin(ts * p.speed + p.phase) * p.ox,
      y: p.by + Math.cos(ts * p.speed + p.phase + 1.2) * p.oy,
    };
  }

  ctx.strokeStyle = 'rgba(201,168,76,0.038)';
  ctx.lineWidth = 0.5;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const i = r * cols + c;
      const a = px(i), b = px(i + 1);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
  }
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const a = px(i), b = px(i + cols);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
  }

  // Floating stars
  floatStars.forEach(s => {
    s.a += s.ta * s.dir;
    if (s.a > 0.68 || s.a < 0.04) s.dir *= -1;
    s.y += s.vy;
    if (s.y < -5) { s.y = H + 5; s.x = Math.random() * W; }
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${s.a.toFixed(2)})`;
    ctx.fill();
  });
}

/* ================================================================
   PARTICLE SYSTEM
   ================================================================ */
const partOverlay = document.getElementById('particles-overlay');
let pInterval = null;

function spawnParticle(type = 'ambient') {
  const p = document.createElement('div');
  const x   = Math.random() * 100;
  const sz  = type === 'gold' ? (Math.random() * 5 + 2) : (Math.random() * 2.5 + 0.8);
  const dur = Math.random() * 7 + 5;
  const delay = Math.random() * 2;
  const colors = type === 'gold'
    ? ['rgba(201,168,76,0.8)', 'rgba(240,208,112,0.6)', 'rgba(255,248,200,0.7)']
    : ['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.04)'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  p.style.cssText = `
    position:absolute;
    left:${x}%;bottom:-8px;
    width:${sz}px;height:${sz}px;border-radius:50%;
    background:${color};
    ${type === 'gold' ? `box-shadow:0 0 ${sz * 2}px ${color};` : ''}
    animation:pRise ${dur}s ${delay}s linear forwards;
    pointer-events:none;
  `;
  partOverlay.appendChild(p);
  setTimeout(() => p.remove(), (dur + delay) * 1000 + 100);
}

if (!document.getElementById('__pRise')) {
  const s = document.createElement('style');
  s.id = '__pRise';
  s.textContent = `@keyframes pRise{0%{transform:translateY(0) scale(1);opacity:1}100%{transform:translateY(-105vh) scale(0.2);opacity:0}}`;
  document.head.appendChild(s);
}

function startParticles(type = 'ambient', rate = 900) {
  if (pInterval) clearInterval(pInterval);
  pInterval = setInterval(() => spawnParticle(type), rate);
}

/* ================================================================
   CONFETTI
   ================================================================ */
const CONF_COLORS = ['#C9A84C','#F0D070','#FFF8D6','#A07820','#fff','#D8D8E0','#8B5CF6','#00BFA5','#E8922A'];

function fireConfetti(id, count = 70) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    piece.className = 'conf-piece';
    const x     = Math.random() * 100;
    const delay = Math.random() * 2.5;
    const dur   = Math.random() * 3 + 2.5;
    const color = CONF_COLORS[Math.floor(Math.random() * CONF_COLORS.length)];
    const isRect = Math.random() > 0.45;
    piece.style.cssText = `
      left:${x}%;
      background:${color};
      width:${isRect ? Math.random()*7+4 : Math.random()*5+3}px;
      height:${isRect ? Math.random()*11+5 : Math.random()*5+3}px;
      border-radius:${isRect ? '1px' : '50%'};
      animation-duration:${dur}s;
      animation-delay:${delay}s;
    `;
    el.appendChild(piece);
  }
}

/* ================================================================
   GSAP SLIDE REVEAL SYSTEM
   ================================================================ */
function buildSlideTimeline(slide) {
  const tl = gsap.timeline({ defaults: { ease: 'cinematic' } });

  // Slide panel itself — fade + subtle lift
  tl.fromTo(slide, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.7 }, 0);

  // Individual .gs-fade-up elements
  slide.querySelectorAll('.gs-fade-up').forEach(el => {
    const delay = parseFloat(el.dataset.delay || '0');
    tl.fromTo(el,
      { opacity: 0, y: 26, filter: 'blur(4px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.65 },
      0.1 + delay
    );
  });

  // Scale-in elements (team emblems)
  slide.querySelectorAll('.gs-scale-in').forEach(el => {
    const delay = parseFloat(el.dataset.delay || '0');
    tl.fromTo(el,
      { opacity: 0, scale: 0.55, rotation: -15 },
      { opacity: 1, scale: 1, rotation: 0, duration: 0.85, ease: 'back.out(1.7)' },
      0.05 + delay
    );
  });

  // Stat cards staggered
  slide.querySelectorAll('.gs-stagger-cards .stat-card').forEach((card, i) => {
    tl.fromTo(card,
      { opacity: 0, y: 20, scale: 0.92 },
      { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'power3.out' },
      0.55 + i * 0.08
    );
  });

  // Podium columns rise
  slide.querySelectorAll('.gs-pod-rise').forEach(el => {
    const delay = parseFloat(el.dataset.delay || '0');
    tl.fromTo(el,
      { opacity: 0, y: 60, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 0.75, ease: 'back.out(1.4)' },
      0.2 + delay
    );
  });

  // Metric number count-up effect via GSAP ticker
  slide.querySelectorAll('.metric-num').forEach(el => {
    const raw = el.textContent.trim();
    const isPercent = raw.endsWith('%');
    const num = parseFloat(raw.replace('%', ''));
    if (!isNaN(num)) {
      const obj = { val: 0 };
      tl.to(obj, {
        val: num,
        duration: 1.1,
        ease: 'power2.out',
        onUpdate() {
          el.textContent = isPercent
            ? obj.val.toFixed(2) + '%'
            : Number.isInteger(num) ? Math.round(obj.val) : obj.val.toFixed(1);
        },
      }, 0.55);
    }
  });

  return tl;
}

function playSlideExit(slide) {
  return gsap.to(slide, {
    opacity: 0,
    y: -28,
    duration: 0.5,
    ease: 'power2.in',
    onComplete() {
      slide.classList.remove('active', 'exit');
      gsap.set(slide, { y: 0, clearProps: 'filter' });
    },
  });
}

/* ================================================================
   SLIDE CONTROLLER
   ================================================================ */
let currentSlide = 0;
const slides  = document.querySelectorAll('.slide');
const dotsEl  = document.getElementById('slide-dots');
const curEl   = document.getElementById('current-slide');
const totEl   = document.getElementById('total-slides');
const prevBtn = document.getElementById('btn-prev');
const nextBtn = document.getElementById('btn-next');

totEl.textContent = slides.length;

// Build dots
slides.forEach((_, i) => {
  const d = document.createElement('div');
  d.className = 'dot' + (i === 0 ? ' active' : '');
  d.addEventListener('click', () => goToSlide(i));
  dotsEl.appendChild(d);
});

function updateNav(idx) {
  document.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === idx));
  curEl.textContent = idx + 1;
}

function updateFooterCategory(idx) {
  const active = slides[idx];
  const fc = document.getElementById('footer-category');
  fc.innerHTML = active?.dataset.category || 'JULY DRIVE 2026';
}

let isTransitioning = false;

function goToSlide(idx) {
  if (idx === currentSlide || isTransitioning) return;
  isTransitioning = true;

  const oldSlide = slides[currentSlide];
  const newSlide = slides[idx];

  oldSlide.classList.add('exit');
  playSlideExit(oldSlide).then(() => {
    isTransitioning = false;
  });

  currentSlide = idx;
  newSlide.classList.add('active');

  // Reset GSAP states on incoming slide elements before animating
  newSlide.querySelectorAll('.gs-fade-up, .gs-scale-in, .gs-pod-rise').forEach(el => {
    gsap.set(el, { opacity: 0, y: 0, scale: 1, clearProps: 'filter' });
  });
  newSlide.querySelectorAll('.gs-stagger-cards .stat-card').forEach(el => {
    gsap.set(el, { opacity: 0, y: 20, scale: 0.92 });
  });

  buildSlideTimeline(newSlide);
  updateNav(idx);
  updateFooterCategory(idx);
  onSlideEnter(idx);
}

const next = () => { if (currentSlide < slides.length - 1) goToSlide(currentSlide + 1); };
const prev = () => { if (currentSlide > 0) goToSlide(currentSlide - 1); };

prevBtn.addEventListener('click', prev);
nextBtn.addEventListener('click', next);
document.addEventListener('keydown', e => {
  if (['ArrowRight','ArrowDown',' '].includes(e.key)) { e.preventDefault(); next(); }
  if (['ArrowLeft','ArrowUp'].includes(e.key))         { e.preventDefault(); prev(); }
});

let tStart = 0;
document.addEventListener('touchstart', e => { tStart = e.touches[0].clientX; });
document.addEventListener('touchend',   e => {
  const dx = e.changedTouches[0].clientX - tStart;
  if (Math.abs(dx) > 50) { dx < 0 ? next() : prev(); }
});

/* ================================================================
   PARALLAX BG ON MOUSE MOVE (GSAP)
   ================================================================ */
document.addEventListener('mousemove', e => {
  const xRatio = (e.clientX / window.innerWidth  - 0.5) * 2;
  const yRatio = (e.clientY / window.innerHeight - 0.5) * 2;

  // Move spotlight
  gsap.to('#spotlight', {
    left: e.clientX,
    top: e.clientY,
    duration: 0.12,
    ease: 'none',
  });

  // Subtle bg parallax
  gsap.to('.slide.active .slide-bg-img', {
    x: xRatio * -10,
    y: yRatio * -10,
    duration: 0.5,
    ease: 'power1.out',
  });

  // Aurora orbs subtle follow
  gsap.to('.aurora-orb--1', { x: xRatio * 20, y: yRatio * 15, duration: 2.5, ease: 'power1.out' });
  gsap.to('.aurora-orb--2', { x: xRatio * -15, y: yRatio * -12, duration: 3, ease: 'power1.out' });
});

/* ================================================================
   SLIDE ENTER HANDLER
   ================================================================ */
function onSlideEnter(idx) {
  const activeSlide = slides[idx];

  // Photo reveals on active slide
  const photoIds = SLIDE_PHOTOS[idx];
  if (photoIds) {
    photoIds.forEach(id => {
      const img = document.getElementById(id);
      if (!img) return;
      const reveal = () => {
        gsap.fromTo(img,
          { opacity: 0, scale: 1.04, filter: 'blur(6px)' },
          { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.9, ease: 'power2.out', delay: 0.35 }
        );
        img.classList.add('loaded');
      };
      if (img.complete && img.naturalWidth > 0) reveal();
      else img.addEventListener('load', reveal, { once: true });
    });
  } else if (activeSlide) {
    activeSlide.querySelectorAll('.winner-photo').forEach(img => {
      const reveal = () => {
        gsap.fromTo(img,
          { opacity: 0, scale: 1.04, filter: 'blur(6px)' },
          { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.9, ease: 'power2.out', delay: 0.35 }
        );
        img.classList.add('loaded');
      };
      if (img.complete && img.naturalWidth > 0) reveal();
      else img.addEventListener('load', reveal, { once: true });
    });
  }

  // Particle mode per slide (gold for gold/champ slides, all team slides, and finale)
  const isGoldSlide = [4, 8, 13, 14, 15, 16, 17, 18, 19, 20, 21].includes(idx) ||
                      activeSlide?.classList.contains('gold-winner') ||
                      activeSlide?.querySelector('.gold-winner') ||
                      activeSlide?.querySelector('.champ-winner') ||
                      activeSlide?.querySelector('.gold-theme') ||
                      activeSlide?.querySelector('.champ-theme');
  if (isGoldSlide) startParticles('gold', (idx === 14 || activeSlide?.id === 'slide-champ') ? 260 : 460);
  else startParticles('ambient', 1100);

  // Confetti trigger
  const confEl = activeSlide?.querySelector('.confetti-burst');
  if (confEl && confEl.id) {
    const isFinale = activeSlide.id === 'slide-finale' || confEl.id === 'confetti-finale';
    const isChamp = confEl.id === 'confetti-champ';
    const delay = isFinale ? 500 : (isChamp ? 1600 : 1200);
    const count = isFinale ? 160 : (isChamp ? 130 : 80);
    setTimeout(() => fireConfetti(confEl.id, count), delay);
  }

  // Header aurora color shift per category
  const auroraColors = {
    5:  ['rgba(139,92,246,0.22)', null], // Cat Pts
    6:  ['rgba(139,92,246,0.20)', null], // Siddhesh Pts
    7:  ['rgba(139,92,246,0.20)', null], // Yashpreet Pts
    8:  ['rgba(139,92,246,0.22)', null], // Akshata Pts
    9:  ['rgba(0,191,165,0.18)', null],  // Cat Lead
    10: ['rgba(0,191,165,0.18)', null],  // Siddharth Lead
    11: ['rgba(232,146,42,0.16)', null], // Cat Ref
    12: ['rgba(232,146,42,0.16)', null], // Siddhesh Ref
    13: ['rgba(201,168,76,0.22)', null], // Cat Champ
    14: ['rgba(201,168,76,0.25)', null], // Akshata Champ
    15: ['rgba(201,168,76,0.22)', null], // Cat Team Adm (Gold)
    16: ['rgba(201,168,76,0.24)', null], // Team Adm (Gold)
    17: ['rgba(201,168,76,0.22)', null], // Cat Team Pct (Gold)
    18: ['rgba(201,168,76,0.24)', null], // Team Pct (Gold)
    19: ['rgba(201,168,76,0.22)', null], // Cat Team Pts (Gold)
    20: ['rgba(201,168,76,0.24)', null], // Team Pts (Gold)
    21: ['rgba(201,168,76,0.25)', null], // Finale (Gold)
  };
  const aCol = auroraColors[idx];
  if (aCol) {
    gsap.to('.aurora-orb--1', { background: `radial-gradient(circle, ${aCol[0] || 'rgba(201,168,76,0.18)'} 0%, transparent 70%)`, duration: 1.5, ease: 'power2.out' });
  } else {
    gsap.to('.aurora-orb--1', { background: 'radial-gradient(circle, rgba(201,168,76,0.18) 0%, transparent 70%)', duration: 1.5, ease: 'power2.out' });
  }
}

/* ================================================================
   IMAGE PRELOADING
   ================================================================ */
const imgCache = {};
function preloadImg(src) {
  if (imgCache[src]) return Promise.resolve(imgCache[src]);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => { imgCache[src] = img; resolve(img); };
    img.onerror = reject;
    img.src = src;
  });
}
function preloadAll() {
  const winnerFiles = Object.values(ASSET_REGISTRY).map(a => a.file);
  const teamFiles = Object.values(TEAM_LOGOS);
  const extraFiles = ['trophy.png', 'stage-bg.png'];
  const allFiles = Array.from(new Set([...winnerFiles, ...teamFiles, ...extraFiles]));
  return Promise.all(allFiles.map(f => preloadImg(f).catch(() => {})));
}

/* ================================================================
   WHITE-BG PNG PROCESSING
   ================================================================ */
function processWhiteBgImage(img) {
  if (!img.complete || img.naturalWidth === 0) return;
  try {
    const off = document.createElement('canvas');
    off.width = img.naturalWidth;
    off.height = img.naturalHeight;
    const oc = off.getContext('2d');
    oc.drawImage(img, 0, 0);
    const data = oc.getImageData(0, 0, off.width, off.height);
    const d = data.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i+1], b = d[i+2];
      const brightness = (r + g + b) / 3;
      const minCh = Math.min(r, g, b);
      if (minCh > 232 && brightness > 237) {
        d[i+3] = Math.max(0, 255 - (minCh - 220) * 8);
      } else if (minCh > 205 && brightness > 215) {
        const alpha = Math.max(0, ((minCh - 205) / 27));
        d[i+3] = Math.min(d[i+3], Math.round((1 - alpha) * 255));
      }
    }
    oc.putImageData(data, 0, 0);
    img.src = off.toDataURL('image/png');
    img.classList.remove('white-bg');
    img.classList.add('transparent-bg');
  } catch (e) {
    console.warn('White-bg canvas processing skipped:', e.message);
  }
}

function processAllWhiteBg() {
  document.querySelectorAll('.winner-photo.white-bg, .pod-img.white-bg').forEach(img => {
    if (img.complete && img.naturalWidth > 0) processWhiteBgImage(img);
    else img.addEventListener('load', () => processWhiteBgImage(img), { once: true });
  });
}

/* ================================================================
   IMAGE ERROR FALLBACKS
   ================================================================ */
function setupFallbacks() {
  document.querySelectorAll('.winner-photo, .pod-img, .team-logo-img').forEach(img => {
    function triggerFallback() {
      const wrap = img.closest('.winner-photo-col, .pod-photo-wrap, .team-logo-wrap');
      if (!wrap || wrap.querySelector('.img-fallback')) return;
      const alt = img.alt || '?';
      const initials = alt.split(/[\s—–-]+/).filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '★';
      const fb = document.createElement('div');
      fb.className = 'img-fallback';
      fb.textContent = initials;
      wrap.style.position = 'relative';
      wrap.appendChild(fb);
      img.style.display = 'none';
    }

    img.addEventListener('error', triggerFallback);

    if (img.complete) {
      if (img.naturalWidth === 0) triggerFallback();
      else img.classList.add('loaded');
    } else {
      img.addEventListener('load', () => img.classList.add('loaded'), { once: true });
    }
  });
}

/* ================================================================
   GSAP FOOTER CATEGORY UPDATE
   ================================================================ */
function animateFooterCat(text) {
  const el = document.getElementById('footer-category');
  gsap.to(el, {
    opacity: 0, y: -5, duration: 0.2, ease: 'power2.in',
    onComplete() {
      el.innerHTML = text;
      gsap.fromTo(el, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' });
    },
  });
}

/* ================================================================
   ANIMATION LOOP
   ================================================================ */
function loop(t) {
  drawBg(t);
  requestAnimationFrame(loop);
}

/* ================================================================
   INIT
   ================================================================ */
async function init() {
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  requestAnimationFrame(loop);

  // Keyboard hint fade
  const hint = document.getElementById('kbd-hint');
  if (hint) {
    gsap.to(hint, { opacity: 0, duration: 1.4, delay: 7, ease: 'power2.in', onComplete() { hint.style.display = 'none'; } });
  }

  setupFallbacks();

  const overlay = document.getElementById('loading-overlay');
  try { await preloadAll(); } catch (e) { /* continue */ }

  processAllWhiteBg();

  await new Promise(r => setTimeout(r, 300));

  // Fade out loading overlay
  gsap.to(overlay, {
    opacity: 0, duration: 0.6, ease: 'power2.out',
    onComplete() { overlay.classList.add('hidden'); }
  });

  // Animate first slide in
  const firstSlide = slides[0];
  firstSlide.classList.add('active');

  // Reset initial states for first slide
  firstSlide.querySelectorAll('.gs-fade-up').forEach(el => gsap.set(el, { opacity: 0, y: 26, filter: 'blur(4px)' }));

  // Build intro timeline with extra flair
  const tl = gsap.timeline({ defaults: { ease: 'cinematic' } });
  tl.fromTo(firstSlide, { opacity: 0 }, { opacity: 1, duration: 1 }, 0);
  firstSlide.querySelectorAll('.gs-fade-up').forEach(el => {
    const delay = parseFloat(el.dataset.delay || '0') + 0.3;
    tl.fromTo(el,
      { opacity: 0, y: 32, filter: 'blur(5px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8 },
      delay
    );
  });

  updateNav(0);
  updateFooterCategory(0);
  onSlideEnter(0);

  // Header entrance
  gsap.fromTo('#global-header', { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: 0.9, delay: 0.4, ease: 'power2.out' });
  gsap.fromTo('#global-footer', { opacity: 0, y: 14 },  { opacity: 1, y: 0, duration: 0.9, delay: 0.5, ease: 'power2.out' });
  gsap.fromTo('#slide-dots', { opacity: 0 }, { opacity: 1, duration: 0.7, delay: 0.8, ease: 'power2.out' });
}

document.addEventListener('DOMContentLoaded', init);
