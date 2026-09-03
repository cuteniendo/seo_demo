const PEXELS_API_KEY = 'KKRi1KkJlnHkfffpv0QTp3i7tOBMqj0iOxCffGjlneYDT2OjtdzmFkTL';
const PEXELS_CACHE_KEY = 'ironforge-pexels-cache-v1';

function loadPexelsCache() {
  try { return JSON.parse(sessionStorage.getItem(PEXELS_CACHE_KEY)) || {}; }
  catch { return {}; }
}

function savePexelsCache(cache) {
  try { sessionStorage.setItem(PEXELS_CACHE_KEY, JSON.stringify(cache)); }
  catch { /* storage unavailable or full — photo just won't be cached */ }
}

async function fetchPexelsPhoto(query) {
  const cache = loadPexelsCache();
  if (cache[query]) return cache[query];
  try {
    const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`, {
      headers: { Authorization: PEXELS_API_KEY }
    });
    if (!res.ok) return null;
    const data = await res.json();
    const photo = data.photos && data.photos[0];
    const url = photo ? (photo.src.large2x || photo.src.large) : null;
    if (url) {
      cache[query] = url;
      savePexelsCache(cache);
    }
    return url;
  } catch {
    return null;
  }
}

async function applyPhoto(panel) {
  const url = await fetchPexelsPhoto(panel.dataset.photo);
  if (url) {
    panel.style.backgroundImage = `url("${url}")`;
    panel.classList.add('has-photo');
  }
}

function loadMediaPhotos() {
  const panels = document.querySelectorAll('.media-panel[data-photo]');
  if (!('IntersectionObserver' in window)) {
    panels.forEach(applyPhoto);
    return;
  }
  // Lazy-load below-fold panels: only fetch once a panel is within 300px of the viewport.
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        applyPhoto(entry.target);
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: '300px 0px' });
  panels.forEach((panel) => io.observe(panel));
}

document.addEventListener('DOMContentLoaded', () => {

  loadMediaPhotos();

  /* header scroll state */
  const header = document.querySelector('.site-header');
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 20);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* mobile nav toggle */
  const navToggle = document.querySelector('.nav-toggle');
  if (navToggle && header) {
    navToggle.addEventListener('click', () => {
      const open = header.classList.toggle('is-open');
      navToggle.classList.toggle('is-open', open);
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.querySelectorAll('.nav-main a').forEach(a => {
      a.addEventListener('click', () => {
        header.classList.remove('is-open');
        navToggle.classList.remove('is-open');
      });
    });
  }

  /* play/pause toggle on hero media */
  document.querySelectorAll('.play-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const paused = btn.classList.toggle('is-paused');
      btn.setAttribute('aria-label', paused ? 'Play' : 'Pause');
      const panel = btn.closest('.hero-stack, .hero-visual')?.querySelector('.media-panel');
      if (panel) panel.classList.toggle('is-paused', paused);
    });
  });

  /* generate spark particles */
  document.querySelectorAll('.spark-field').forEach(field => {
    const count = 14;
    for (let i = 0; i < count; i++) {
      const s = document.createElement('span');
      s.className = 'spark';
      s.style.left = (5 + Math.random() * 90) + '%';
      s.style.setProperty('--dx', (Math.random() * 40 - 20) + 'px');
      s.style.animationDelay = (Math.random() * 2.6) + 's';
      s.style.animationDuration = (2 + Math.random() * 1.6) + 's';
      field.appendChild(s);
    }
  });

  /* animated stat counters */
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    const animate = (el) => {
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || '';
      const duration = 1400;
      const start = performance.now();
      const step = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animate(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach(c => io.observe(c));
  }

  /* testimonial slider */
  const slides = document.querySelectorAll('.testimonial-slide');
  const dotsWrap = document.querySelector('.testimonial-dots');
  if (slides.length && dotsWrap) {
    let active = 0;
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      if (i === 0) dot.classList.add('is-active');
      dot.setAttribute('aria-label', 'Go to testimonial ' + (i + 1));
      dot.addEventListener('click', () => show(i));
      dotsWrap.appendChild(dot);
    });
    const dots = dotsWrap.querySelectorAll('button');
    function show(i) {
      slides[active].classList.remove('is-active');
      dots[active].classList.remove('is-active');
      active = i;
      slides[active].classList.add('is-active');
      dots[active].classList.add('is-active');
    }
    setInterval(() => show((active + 1) % slides.length), 5500);
  }

  /* blog category filter */
  const filterButtons = document.querySelectorAll('.filter-tabs button');
  const blogCards = document.querySelectorAll('[data-category]');
  if (filterButtons.length && blogCards.length) {
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        const cat = btn.dataset.filter;
        blogCards.forEach(card => {
          const match = cat === 'all' || card.dataset.category === cat;
          card.style.display = match ? '' : 'none';
        });
      });
    });
  }

  /* newsletter form (demo only) */
  document.querySelectorAll('.newsletter-form').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input');
      const btn = form.querySelector('button');
      if (!input.value) return;
      btn.textContent = 'Subscribed';
      input.value = '';
      setTimeout(() => { btn.textContent = 'Subscribe'; }, 2400);
    });
  });

  /* back to top */
  const backToTop = document.querySelector('.back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('is-visible', window.scrollY > 600);
    }, { passive: true });
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* footer year */
  document.querySelectorAll('.current-year').forEach(el => {
    el.textContent = new Date().getFullYear();
  });

});
