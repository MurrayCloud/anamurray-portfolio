/**
 * anamurray.de — Premium Portfolio Script
 * Ana Mercedes Murray Adames · Webentwicklerin in Ausbildung · Hamburg
 *
 * Modules:
 *  1. Preloader
 *  2. Lenis Smooth Scroll
 *  3. Hero Particle Canvas
 *  4. Custom Cursor
 *  5. Navbar (scroll state + mobile menu)
 *  6. Scroll Reveal Animations
 *  7. Counter Animation
 *  8. Rotating Title
 *  9. Magnetic Buttons
 * 10. Contribution Grid
 * 11. VanillaTilt Cards
 * 12. Cookie Banner
 * 13. Modals
 * 14. Contact Form
 */

'use strict';

/* ─── helpers ──────────────────────────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const on = (el, ev, fn, opts) => el?.addEventListener(ev, fn, opts);
const ready = fn => {
  if (document.readyState !== 'loading') fn();
  else document.addEventListener('DOMContentLoaded', fn);
};

/* ═══════════════════════════════════════════════════════════════════
   1. PRELOADER
══════════════════════════════════════════════════════════════════════ */
function initPreloader() {
  const loader = $('#preloader');
  if (!loader) return;

  const done = () => {
    loader.classList.add('is-done');
    document.body.classList.remove('is-loading');
    startHeroAnimations();
  };

  // Ensure minimum 2s for the branded loading experience
  const minTime = 2000;
  const startTime = Date.now();

  on(window, 'load', () => {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, minTime - elapsed);
    setTimeout(done, remaining);
  });
}

/* ═══════════════════════════════════════════════════════════════════
   2. ANCHOR SCROLL (native smooth — no Lenis)
══════════════════════════════════════════════════════════════════════ */
function initSmoothScroll() {
  $$('a[href^="#"]').forEach(link => {
    on(link, 'click', e => {
      const target = $(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
      closeMobileNav();
    });
  });
}

/* ═══════════════════════════════════════════════════════════════════
   3. HERO PARTICLE CANVAS
══════════════════════════════════════════════════════════════════════ */
function initParticles() {
  const canvas = $('#hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const GOLD   = { r: 240, g: 192, b: 96  };
  const VIOLET = { r: 176, g: 123, b: 240 };

  let W, H, particles, mouse = { x: null, y: null };

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function randomBetween(a, b) { return a + Math.random() * (b - a); }

  function createParticle() {
    const isViolet = Math.random() > 0.55;
    const c = isViolet ? VIOLET : GOLD;
    return {
      x: randomBetween(0, W),
      y: randomBetween(0, H),
      vx: randomBetween(-0.18, 0.18),
      vy: randomBetween(-0.12, 0.12),
      r: randomBetween(1, 2.8),
      alpha: randomBetween(0.15, 0.55),
      cr: c.r, cg: c.g, cb: c.b,
    };
  }

  function init() {
    resize();
    const count = Math.floor((W * H) / 14000);
    particles = Array.from({ length: count }, createParticle);
  }

  function drawConnections() {
    const threshold = 140;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > threshold) continue;
        const alpha = (1 - dist / threshold) * 0.12;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${a.cr},${a.cg},${a.cb},${alpha})`;
        ctx.lineWidth = 0.6;
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  let raf;
  function draw() {
    ctx.clearRect(0, 0, W, H);
    drawConnections();
    particles.forEach(p => {
      // gentle mouse parallax
      if (mouse.x !== null) {
        const dx = (mouse.x - W / 2) * 0.00006;
        const dy = (mouse.y - H / 2) * 0.00006;
        p.x += dx;
        p.y += dy;
      }
      p.x += p.vx;
      p.y += p.vy;
      // wrap around edges
      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.cr},${p.cg},${p.cb},${p.alpha})`;
      ctx.fill();
    });
    raf = requestAnimationFrame(draw);
  }

  init();
  draw();

  on(window, 'resize', () => { cancelAnimationFrame(raf); init(); draw(); });
  on(document, 'mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
}

/* ═══════════════════════════════════════════════════════════════════
   4. CUSTOM CURSOR
══════════════════════════════════════════════════════════════════════ */
function initCursor() {
  const cursor = $('#cursor');
  if (!cursor || window.matchMedia('(pointer: coarse)').matches) return;

  const dot  = $('.cursor__dot',  cursor);
  const ring = $('.cursor__ring', cursor);

  let cx = 0, cy = 0; // ring position (lerped)
  let mx = 0, my = 0; // actual mouse position

  on(document, 'mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.cssText = `left:${mx}px;top:${my}px`;
  });

  function lerp(a, b, n) { return a + (b - a) * n; }

  (function animate() {
    cx = lerp(cx, mx, 0.22);
    cy = lerp(cy, my, 0.22);
    ring.style.cssText = `left:${cx}px;top:${cy}px`;
    requestAnimationFrame(animate);
  })();

  // Hover state on interactive elements
  const interactives = 'a, button, [tabindex="0"], input, textarea, select, label';
  on(document, 'mouseover', e => {
    if (e.target.closest(interactives)) cursor.classList.add('is-hovering');
  });
  on(document, 'mouseout', e => {
    if (e.target.closest(interactives)) cursor.classList.remove('is-hovering');
  });
}

/* ═══════════════════════════════════════════════════════════════════
   5. NAVBAR
══════════════════════════════════════════════════════════════════════ */
function closeMobileNav() {
  const menu   = $('#navbar-menu');
  const burger = $('#navbar-burger');
  menu?.classList.remove('is-open');
  burger?.setAttribute('aria-expanded', 'false');
  burger?.setAttribute('aria-label', 'Navigation öffnen');
}

function initNavbar() {
  const navbar = $('#navbar');
  const burger = $('#navbar-burger');
  const menu   = $('#navbar-menu');
  if (!navbar) return;

  // Scroll state
  on(window, 'scroll', () => {
    navbar.classList.toggle('is-scrolled', window.scrollY > 40);
  }, { passive: true });

  // Mobile burger
  on(burger, 'click', () => {
    const isOpen = menu.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(isOpen));
    burger.setAttribute('aria-label', isOpen ? 'Navigation schließen' : 'Navigation öffnen');
  });

  // Active link on scroll
  const sections = $$('section[id]');
  const links    = $$('.navbar__link');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        links.forEach(l => {
          const match = l.getAttribute('href') === `#${id}`;
          l.classList.toggle('is-active', match);
        });
      }
    });
  }, { rootMargin: '-50% 0px -50% 0px' });

  sections.forEach(s => observer.observe(s));
}

/* ═══════════════════════════════════════════════════════════════════
   6. SCROLL REVEAL ANIMATIONS
══════════════════════════════════════════════════════════════════════ */
function initScrollReveal() {
  const elements = $$('[data-anim]');
  if (!elements.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const delay = parseFloat(el.dataset.delay || 0) * 1000;
      setTimeout(() => {
        el.classList.add('is-visible');
        // Also trigger skill bars
        if (el.classList.contains('skill-card') || el.closest('.skill-card')) {
          const card = el.classList.contains('skill-card') ? el : el.closest('.skill-card');
          card.classList.add('is-visible');
        }
        // Cert progress bars
        if (el.classList.contains('cert-card') || el.closest('.cert-card')) {
          const card = el.classList.contains('cert-card') ? el : el.closest('.cert-card');
          card.classList.add('is-visible');
        }
      }, delay);
      io.unobserve(el);
    });
  }, { rootMargin: '0px 0px -80px 0px', threshold: 0.1 });

  elements.forEach(el => io.observe(el));

  // Also observe skill cards specifically (since they have bars)
  $$('.skill-card, .cert-card').forEach(card => {
    const io2 = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io2.unobserve(e.target);
        }
      });
    }, { threshold: 0.2 });
    io2.observe(card);
  });
}

/* ═══════════════════════════════════════════════════════════════════
   7. COUNTER ANIMATION
══════════════════════════════════════════════════════════════════════ */
function initCounters() {
  const counters = $$('[data-target]');
  if (!counters.length) return;

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.target, 10);
      const duration = 1500;
      const start = performance.now();

      function update(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
        el.textContent = Math.round(eased * target);
        if (progress < 1) requestAnimationFrame(update);
        else el.textContent = target;
      }

      requestAnimationFrame(update);
      io.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach(c => io.observe(c));
}

/* ═══════════════════════════════════════════════════════════════════
   8. ROTATING TITLE
══════════════════════════════════════════════════════════════════════ */
function initRotatingTitle() {
  const el = $('#rotating-title');
  if (!el) return;

  const words = [
    'Python · PCAP',
    'Scrum Master · PSM I',
    'Java · SQL',
    'HTML · CSS · JS',
    'Sorgfältige Denkerin',
    'Teamplayerin',
  ];

  let idx = 0;
  let timeout;

  function rotate() {
    el.style.opacity = '0';
    el.style.transform = 'translateY(-8px)';

    timeout = setTimeout(() => {
      idx = (idx + 1) % words.length;
      el.textContent = words[idx];
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
      timeout = setTimeout(rotate, 2800);
    }, 350);
  }

  el.style.transition = 'opacity .35s ease, transform .35s ease';
  timeout = setTimeout(rotate, 2800);
}

/* ═══════════════════════════════════════════════════════════════════
   9. MAGNETIC BUTTONS
══════════════════════════════════════════════════════════════════════ */
function initMagneticButtons() {
  $$('.btn--mag').forEach(btn => {
    on(btn, 'mousemove', e => {
      const rect = btn.getBoundingClientRect();
      const cx   = rect.left + rect.width  / 2;
      const cy   = rect.top  + rect.height / 2;
      const dx   = (e.clientX - cx) * 0.28;
      const dy   = (e.clientY - cy) * 0.28;
      btn.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    on(btn, 'mouseleave', () => {
      btn.style.transition = 'transform .5s cubic-bezier(0.34,1.56,0.64,1)';
      btn.style.transform = 'translate(0,0)';
      setTimeout(() => { btn.style.transition = ''; }, 500);
    });
  });
}

/* ═══════════════════════════════════════════════════════════════════
   10. CONTRIBUTION GRID
══════════════════════════════════════════════════════════════════════ */
function initContribGrid() {
  const grid = $('#contrib-grid');
  if (!grid) return;

  const weeks = 26;
  const days  = 7;
  const levels = [0, 1, 2, 3, 4];
  const colors = ['rgba(255,255,255,.06)', '#0d4429', '#006d32', '#26a641', '#39d353'];

  for (let w = 0; w < weeks; w++) {
    const col = document.createElement('div');
    col.style.cssText = 'display:flex;flex-direction:column;gap:3px';
    for (let d = 0; d < days; d++) {
      const cell = document.createElement('div');
      const l = Math.random() < 0.45 ? 0 : levels[Math.floor(Math.random() * 4) + 1];
      cell.style.cssText = `width:10px;height:10px;border-radius:2px;background:${colors[l]}`;
      col.appendChild(cell);
    }
    grid.appendChild(col);
  }
}

/* ═══════════════════════════════════════════════════════════════════
   11. VANILLA TILT
══════════════════════════════════════════════════════════════════════ */
function initTilt() {
  if (typeof VanillaTilt === 'undefined') return;
  if (window.matchMedia('(pointer: coarse)').matches) return;

  VanillaTilt.init($$('.tl-card, .skill-card, .proj-card:not(.proj-card--cta), .cert-card'), {
    max: 6,
    speed: 600,
    glare: false,
    'mouse-event-element': null,
  });
}

/* ═══════════════════════════════════════════════════════════════════
   12. COOKIE BANNER
══════════════════════════════════════════════════════════════════════ */
function initCookieBanner() {
  const banner = $('#cookie-banner');
  const btn    = $('#cookie-accept');
  if (!banner) return;

  const key = 'am_cookie_ok';
  if (localStorage.getItem(key)) return;

  setTimeout(() => banner.classList.add('is-visible'), 1500);

  on(btn, 'click', () => {
    banner.classList.remove('is-visible');
    localStorage.setItem(key, '1');
  });
}

/* ═══════════════════════════════════════════════════════════════════
   13. MODALS
══════════════════════════════════════════════════════════════════════ */
function initModals() {
  // Open
  on(document, 'click', e => {
    const trigger = e.target.closest('[data-modal]');
    if (!trigger) return;
    e.preventDefault();
    const id = trigger.dataset.modal;
    openModal(id);
  });

  // Close via overlay or close button
  on(document, 'click', e => {
    const closer = e.target.closest('[data-close]');
    if (!closer) return;
    closeModal(closer.dataset.close);
  });

  // Escape key
  on(document, 'keydown', e => {
    if (e.key === 'Escape') {
      $$('.modal:not([hidden])').forEach(m => {
        const id = m.id.replace('modal-', '');
        closeModal(id);
      });
    }
  });
}

function openModal(id) {
  const modal = $(`#modal-${id}`);
  if (!modal) return;
  modal.removeAttribute('hidden');
  document.body.style.overflow = 'hidden';
  // Focus first focusable
  setTimeout(() => {
    const focusable = modal.querySelector('button, a, input');
    focusable?.focus();
  }, 50);
}

function closeModal(id) {
  const modal = $(`#modal-${id}`);
  if (!modal) return;
  modal.setAttribute('hidden', '');
  document.body.style.overflow = '';
}

/* ═══════════════════════════════════════════════════════════════════
   14. CONTACT FORM
══════════════════════════════════════════════════════════════════════ */
function initContactForm() {
  const form = $('#contact-form');
  if (!form) return;

  // Zeitstempel für die Mindest-Ausfüllzeit (Bot-Schutz, siehe backend/contact.php)
  const started = $('#f-started');
  if (started) started.value = String(Date.now());

  const fields = {
    name:    { el: $('#f-name'),    err: $('#err-name'),    validate: v => v.trim().length >= 2 ? '' : 'Bitte geben Sie Ihren Namen ein (min. 2 Zeichen).' },
    email:   { el: $('#f-email'),   err: $('#err-email'),   validate: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' },
    message: { el: $('#f-message'), err: $('#err-message'), validate: v => v.trim().length >= 10 ? '' : 'Bitte schreiben Sie eine kurze Nachricht (min. 10 Zeichen).' },
    privacy: { el: $('#f-privacy'), err: $('#err-privacy'), validate: v => v ? '' : 'Bitte stimmen Sie der Datenschutzerklärung zu.' },
  };

  function validateField(key) {
    const { el, err, validate } = fields[key];
    const val = key === 'privacy' ? el.checked : el.value;
    const msg = validate(val);
    err.textContent = msg;
    el.classList.toggle('is-invalid', !!msg);
    return !msg;
  }

  // Live validation on blur
  Object.keys(fields).forEach(key => {
    const { el } = fields[key];
    on(el, 'blur', () => validateField(key));
    on(el, 'input', () => {
      if (el.classList.contains('is-invalid')) validateField(key);
    });
  });

  on(form, 'submit', async e => {
    e.preventDefault();

    // Validate all
    let valid = true;
    Object.keys(fields).forEach(k => { if (!validateField(k)) valid = false; });
    if (!valid) return;

    const submitBtn  = $('#submit-btn');
    const btnLabel   = submitBtn.querySelector('.btn-label');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    const successMsg = $('#form-success');
    const errorMsg   = $('#form-error-msg');

    // Loading state
    btnLabel.hidden  = true;
    btnLoading.hidden = false;
    submitBtn.disabled = true;

    try {
      const data = new FormData(form);
      const res  = await fetch(form.getAttribute('action') || 'backend/contact.php', { method: 'POST', body: data });
      const json = await res.json();

      if (json.success) {
        form.reset();
        if (started) started.value = String(Date.now());
        successMsg.hidden = false;
        errorMsg.hidden   = true;
      } else {
        throw new Error(json.message || 'Server error');
      }
    } catch {
      errorMsg.hidden   = false;
      successMsg.hidden = true;
    } finally {
      btnLabel.hidden   = false;
      btnLoading.hidden = true;
      submitBtn.disabled = false;
    }
  });
}

/* ═══════════════════════════════════════════════════════════════════
   15. LANGUAGE SWITCHER (i18n)
══════════════════════════════════════════════════════════════════════ */
const TRANSLATIONS = {
  de: {
    /* ─ Nav ─ */
    'nav.about':    'Über mich',
    'nav.journey':  'Werdegang',
    'nav.skills':   'Skills',
    'nav.projects': 'Projekte',
    'nav.certs':    'Zertifikate',
    'nav.contact':  'Kontakt',
    /* ─ Hero ─ */
    'hero.available':    'Praktikum ab 26.04.2027',
    'hero.cta.projects': 'Projekte entdecken',
    'hero.cta.contact':  'Kontakt aufnehmen',
    'hero.tagline.de':   '"Code mit Sorgfalt — Anwendungen mit Sinn."',
    'hero.role':         'Angehende Fachinformatikerin für Anwendungsentwicklung',
    /* ─ About ─ */
    'about.eyebrow': '01 — Über mich',
    'about.title':   'Mit Sorgfalt\nzum guten Code',
    'about.quote':   '"Gute Software entsteht aus Sorgfalt, Verantwortung und dem Willen, es richtig zu machen."',
    'about.p1': 'Ich bin Ana Mercedes Murray Adames und werde <strong>Fachinformatikerin für Anwendungsentwicklung</strong>. Mich interessiert, wie aus einer Idee eine Anwendung wird, die anderen die Arbeit leichter macht.',
    'about.p2': 'Vorher habe ich eine Ausbildung zur <strong>Gesundheits- und Pflegeassistentin</strong> abgeschlossen (2023–2025). Daraus bringe ich Verantwortungsbewusstsein, sorgfältiges Dokumentieren und einen bewussten Umgang mit sensiblen Daten mit.',
    'about.p3': 'Seit Dezember 2025 mache ich meine <strong>Umschulung am CBW Hamburg</strong> (IHK-Abschluss 2027). Parallel habe ich mich als <strong>PCAP – Certified Associate Python Programmer</strong> und <strong>Professional Scrum Master I</strong> zertifiziert.',
    'about.p4': 'Für meine betriebliche Lernphase suche ich ein <strong>Praktikum vom 26.04. bis 30.11.2027</strong> in Hamburg — in einem Team, in dem ich echten Code schreibe, Fragen stellen darf und Verantwortung übernehme.',
    'about.fact1': 'Hamburg, Deutschland',
    'about.fact2': 'Umschulung zur Fachinformatikerin für Anwendungsentwicklung · CBW Hamburg',
    'about.fact3': 'Gesundheits- und Pflegeassistentin (Abschluss 2025)',
    'about.fact4': 'Deutsch & Spanisch (Muttersprachen) · Englisch (B2)',
    /* ─ Timeline ─ */
    'timeline.eyebrow': '02 — Werdegang',
    'timeline.title':   'Mein Weg\nin die IT',
    /* ─ Skills ─ */
    'skills.eyebrow': '03 — Tech Stack',
    'skills.title':   'Skill Constellation',
    'skills.sub':     'Jede Technologie ist ein Stern in meinem digitalen Universum',
    /* ─ Building ─ */
    'building.eyebrow': '05 — Building in Public',
    'building.title':   'Meine Entwicklung\nist öffentlich',
    'building.sub':     'Jeder Commit auf GitHub ist ein Beweis meiner Disziplin',
    /* ─ Certs ─ */
    'certs.eyebrow': '06 — Zertifikate',
    'certs.title':   'Nachgewiesene\nKompetenz',
    /* ─ Projects ─ */
    'projects.eyebrow': '07 — Projekte',
    'projects.title':   'Was ich\nbaue',
    'projects.sub':     'Jedes Projekt — ein Beweis meines Lernfortschritts',
    /* ─ Warum ─ */
    'warum.eyebrow': '08 — Warum ich?',
    'warum.title':   'Warum sollten Sie mich\nfür ein Praktikum wählen?',
    'warum.lead':    'Ich bringe <strong>Lernbereitschaft, Verlässlichkeit und einen frischen technischen Blick</strong> mit — und die Erfahrung, im Berufsalltag Verantwortung zu übernehmen.',
    /* ─ Contact ─ */
    'contact.eyebrow': '09 — Kontakt',
    'contact.title':   'Lassen Sie uns\nzusammenarbeiten',
    'contact.sub':     'Für Unternehmen, Mentoren oder Gleichgesinnte',
  },
  en: {
    /* ─ Nav ─ */
    'nav.about':    'About me',
    'nav.journey':  'Career',
    'nav.skills':   'Skills',
    'nav.projects': 'Projects',
    'nav.certs':    'Certificates',
    'nav.contact':  'Contact',
    /* ─ Hero ─ */
    'hero.available':    'Internship from 26 Apr 2027',
    'hero.cta.projects': 'Discover Projects',
    'hero.cta.contact':  'Get in Touch',
    'hero.tagline.de':   '"Code with care — applications that make sense."',
    'hero.role':         'Application Developer in Training (IHK)',
    /* ─ About ─ */
    'about.eyebrow': '01 — About me',
    'about.title':   'With care\nto good code',
    'about.quote':   '"Good software comes from care, responsibility and the will to get it right."',
    'about.p1': 'I am Ana Mercedes Murray Adames and I am retraining as an <strong>application developer (Fachinformatikerin für Anwendungsentwicklung)</strong>. I am interested in how an idea becomes an application that makes other people\'s work easier.',
    'about.p2': 'Before that, I completed vocational training as a <strong>healthcare and nursing assistant</strong> (2023–2025). From it I bring a sense of responsibility, careful documentation and a conscious approach to sensitive data.',
    'about.p3': 'Since December 2025 I have been retraining at <strong>CBW Hamburg</strong> (IHK exam in 2027). Alongside, I earned the <strong>PCAP – Certified Associate Python Programmer</strong> and <strong>Professional Scrum Master I</strong> certifications.',
    'about.p4': 'For the practical phase of my retraining I am looking for an <strong>internship from 26 April to 30 November 2027</strong> in Hamburg — in a team where I write real code, can ask questions and take on responsibility.',
    'about.fact1': 'Hamburg, Germany',
    'about.fact2': 'Retraining as an application developer · CBW Hamburg',
    'about.fact3': 'Healthcare & nursing assistant (qualified 2025)',
    'about.fact4': 'German & Spanish (native) · English (B2)',
    /* ─ Timeline ─ */
    'timeline.eyebrow': '02 — Career Path',
    'timeline.title':   'My path\ninto IT',
    /* ─ Skills ─ */
    'skills.eyebrow': '03 — Tech Stack',
    'skills.title':   'Skill Constellation',
    'skills.sub':     'Every technology is a star in my digital universe',
    /* ─ Building ─ */
    'building.eyebrow': '05 — Building in Public',
    'building.title':   'My Progress\nis Public',
    'building.sub':     'Every commit on GitHub is proof of my discipline',
    /* ─ Certs ─ */
    'certs.eyebrow': '06 — Certificates',
    'certs.title':   'Proven\nSkills',
    /* ─ Projects ─ */
    'projects.eyebrow': '07 — Projects',
    'projects.title':   'What I\nbuild',
    'projects.sub':     'Every project — proof of my learning progress',
    /* ─ Warum ─ */
    'warum.eyebrow': '08 — Why me?',
    'warum.title':   'Why should you choose me\nfor an internship?',
    'warum.lead':    'I bring <strong>a willingness to learn, reliability and a fresh technical perspective</strong> — and experience in taking responsibility in everyday working life.',
    /* ─ Contact ─ */
    'contact.eyebrow': '09 — Contact',
    'contact.title':   'Let\'s\nwork together',
    'contact.sub':     'For companies, mentors or like-minded people',
  },
  es: {
    /* ─ Nav ─ */
    'nav.about':    'Sobre mí',
    'nav.journey':  'Trayectoria',
    'nav.skills':   'Habilidades',
    'nav.projects': 'Proyectos',
    'nav.certs':    'Certificados',
    'nav.contact':  'Contacto',
    /* ─ Hero ─ */
    'hero.available':    'Prácticas desde el 26.04.2027',
    'hero.cta.projects': 'Ver Proyectos',
    'hero.cta.contact':  'Contáctame',
    'hero.tagline.de':   '"Código con esmero — aplicaciones con sentido."',
    'hero.role':         'Futura Técnica en Desarrollo de Aplicaciones (IHK)',
    /* ─ About ─ */
    'about.eyebrow': '01 — Sobre mí',
    'about.title':   'Con esmero\nhacia el buen código',
    'about.quote':   '"El buen software nace del esmero, la responsabilidad y la voluntad de hacerlo bien."',
    'about.p1': 'Soy Ana Mercedes Murray Adames y me estoy formando como <strong>desarrolladora de aplicaciones (Fachinformatikerin für Anwendungsentwicklung)</strong>. Me interesa cómo una idea se convierte en una aplicación que facilita el trabajo de otras personas.',
    'about.p2': 'Antes terminé una formación profesional como <strong>asistente sanitaria y de cuidados</strong> (2023–2025). De ella traigo sentido de la responsabilidad, una documentación cuidadosa y un trato consciente de los datos sensibles.',
    'about.p3': 'Desde diciembre de 2025 hago mi reconversión profesional en <strong>CBW Hamburgo</strong> (examen IHK en 2027). Paralelamente obtuve las certificaciones <strong>PCAP – Certified Associate Python Programmer</strong> y <strong>Professional Scrum Master I</strong>.',
    'about.p4': 'Para la fase práctica busco unas <strong>prácticas del 26.04. al 30.11.2027</strong> en Hamburgo — en un equipo donde escriba código real, pueda preguntar y asuma responsabilidad.',
    'about.fact1': 'Hamburgo, Alemania',
    'about.fact2': 'Reconversión como desarrolladora de aplicaciones · CBW Hamburg',
    'about.fact3': 'Asistente sanitaria y de cuidados (título 2025)',
    'about.fact4': 'Alemán y español (lenguas maternas) · Inglés (B2)',
    /* ─ Timeline ─ */
    'timeline.eyebrow': '02 — Trayectoria',
    'timeline.title':   'Mi camino\nhacia la informática',
    /* ─ Skills ─ */
    'skills.eyebrow': '03 — Tech Stack',
    'skills.title':   'Constelación de Habilidades',
    'skills.sub':     'Cada tecnología es una estrella en mi universo digital',
    /* ─ Building ─ */
    'building.eyebrow': '05 — Construyendo en Público',
    'building.title':   'Mi Progreso\nes Público',
    'building.sub':     'Cada commit en GitHub es prueba de mi disciplina',
    /* ─ Certs ─ */
    'certs.eyebrow': '06 — Certificados',
    'certs.title':   'Competencia\nDemostrada',
    /* ─ Projects ─ */
    'projects.eyebrow': '07 — Proyectos',
    'projects.title':   'Lo que\nconstruyo',
    'projects.sub':     'Cada proyecto — prueba de mi progreso de aprendizaje',
    /* ─ Warum ─ */
    'warum.eyebrow': '08 — ¿Por qué yo?',
    'warum.title':   '¿Por qué debería elegirme\npara unas prácticas?',
    'warum.lead':    'Aporto <strong>ganas de aprender, fiabilidad y una mirada técnica fresca</strong>, además de experiencia asumiendo responsabilidades en el día a día laboral.',
    /* ─ Contact ─ */
    'contact.eyebrow': '09 — Contacto',
    'contact.title':   'Trabajemos\njuntos',
    'contact.sub':     'Para empresas, mentores o personas afines',
  },
};

let currentLang = localStorage.getItem('am_lang') || 'de';

function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('am_lang', lang);
  document.documentElement.lang = lang;

  // Tags that may contain HTML markup — use innerHTML carefully
  const htmlTags = new Set(['H1','H2','H3','H4','BLOCKQUOTE','P']);

  $$('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const translation = TRANSLATIONS[lang]?.[key];
    if (!translation) return;

    // For block elements that could have markup, use innerHTML
    // but escape any potential XSS (translations are internal constants so safe here)
    if (htmlTags.has(el.tagName)) {
      // Convert \n to <br> for multi-line titles stored with newline
      el.innerHTML = translation.replace(/\n/g, '<br>');
    } else {
      el.textContent = translation;
    }
  });

  // Update button states
  $$('.lang-btn').forEach(btn => {
    const active = btn.dataset.lang === lang;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', String(active));
  });
}

function initLanguageSwitcher() {
  const btns = $$('.lang-btn');
  if (!btns.length) return;

  btns.forEach(btn => {
    on(btn, 'click', () => applyLanguage(btn.dataset.lang));
  });

  // Apply saved language on load
  if (currentLang !== 'de') applyLanguage(currentLang);
}

/* ═══════════════════════════════════════════════════════════════════
   16. TEXT SCRAMBLE EFFECT
══════════════════════════════════════════════════════════════════════ */
function initTextScramble() {
  const target = $('#scramble-target');
  if (!target) return;

  const original = target.textContent;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%&!?<>';
  let frame = 0;
  let iteration = 0;

  const scramble = () => {
    target.textContent = original
      .split('')
      .map((char, idx) => {
        if (char === ' ') return ' ';
        if (idx < iteration) return original[idx];
        return chars[Math.floor(Math.random() * chars.length)];
      })
      .join('');

    if (iteration < original.replace(/ /g, '').length) {
      if (frame % 3 === 0) iteration++;
      frame++;
      requestAnimationFrame(scramble);
    } else {
      target.textContent = original;
    }
  };

  // Run after preloader, with a slight delay
  setTimeout(scramble, 2400);
}

/* ═══════════════════════════════════════════════════════════════════
   17. CARD SPOTLIGHT (Linear.app / Vercel effect)
══════════════════════════════════════════════════════════════════════ */
function initCardSpotlight() {
  $$('.glass-card').forEach(card => {
    const spot = document.createElement('div');
    spot.className = 'card-spotlight';
    spot.setAttribute('aria-hidden', 'true');
    card.appendChild(spot);

    on(card, 'mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width  * 100).toFixed(2);
      const y = ((e.clientY - r.top)  / r.height * 100).toFixed(2);
      card.style.setProperty('--mx', x + '%');
      card.style.setProperty('--my', y + '%');
    });
  });
}

/* ═══════════════════════════════════════════════════════════════════
   18. SCROLL PROGRESS BAR + BACK TO TOP
══════════════════════════════════════════════════════════════════════ */
function initScrollProgress() {
  const bar     = $('#scroll-progress');
  const backTop = $('#back-to-top');
  if (!bar) return;

  on(window, 'scroll', () => {
    const scrolled = window.scrollY;
    const total    = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = total ? (scrolled / total * 100).toFixed(2) + '%' : '0%';
    backTop?.classList.toggle('is-visible', scrolled > 500);
  }, { passive: true });

  on(backTop, 'click', e => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ═══════════════════════════════════════════════════════════════════
   19. HERO PARALLAX on mouse move
══════════════════════════════════════════════════════════════════════ */
function initHeroParallax() {
  const hero  = $('#hero');
  const orbs  = $$('.hero__orb');
  const water = $('.hero__watermark');
  if (!hero || !orbs.length) return;

  let ticking = false;
  on(hero, 'mousemove', e => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const rect = hero.getBoundingClientRect();
      const cx   = (e.clientX - rect.left - rect.width  / 2) / rect.width;
      const cy   = (e.clientY - rect.top  - rect.height / 2) / rect.height;

      orbs.forEach((orb, i) => {
        const depth = (i + 1) * 12;
        orb.style.transform = `translate(${cx * depth}px, ${cy * depth}px) scale(1)`;
      });
      if (water) {
        water.style.transform = `translate(${cx * 6}px, ${cy * 4}px)`;
      }
      ticking = false;
    });
  });

  on(hero, 'mouseleave', () => {
    orbs.forEach(orb => { orb.style.transform = ''; });
    if (water) water.style.transform = '';
  });
}

/* ═══════════════════════════════════════════════════════════════════
   HERO ANIMATIONS (called after preloader)
══════════════════════════════════════════════════════════════════════ */
function startHeroAnimations() {
  // Trigger hero elements that have data-anim within the hero
  const heroAnims = $$('#hero [data-anim]');
  heroAnims.forEach((el, i) => {
    const delay = parseFloat(el.dataset.delay || 0) * 1000;
    setTimeout(() => el.classList.add('is-visible'), delay + 100);
  });
}

/* ═══════════════════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════════════════════ */
ready(() => {
  initPreloader();
  initSmoothScroll();
  initParticles();
  initCursor();
  initNavbar();
  initScrollReveal();
  initCounters();
  initRotatingTitle();
  initMagneticButtons();
  initContribGrid();
  initTilt();
  initCookieBanner();
  initModals();
  initContactForm();
  initLanguageSwitcher();
  initTextScramble();
  initCardSpotlight();
  initScrollProgress();
  initHeroParallax();
});
