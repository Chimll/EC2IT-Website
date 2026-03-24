/* ── EC2IT Main JS ── */

(function () {
  'use strict';

  /* ════════════════════════════════════════════
     1. 3D DATA CENTRE INTRO
  ════════════════════════════════════════════ */
  function initPremiumLoader() {
    const loader = document.getElementById('site-loader');
    if (!loader) return;

    // Skip on repeat visits within the same session
    if (sessionStorage.getItem('ec2it_loaded')) {
      loader.style.display = 'none';
      return;
    }

    document.body.style.overflow = 'hidden';

    // ── Shared reveal/cleanup ───────────────────
    function reveal() {
      running = false;
      sessionStorage.setItem('ec2it_loaded', '1');
      document.body.style.overflow = '';
      loader.style.transition = 'opacity 0.75s ease';
      loader.style.opacity = '0';
      setTimeout(function () {
        loader.style.display = 'none';
        if (renderer) renderer.dispose();
      }, 800);
    }

    var running = true;

    // ── Fallback for mobile or if Three.js fails ─
    var isMobile = window.innerWidth < 768;
    if (isMobile || typeof THREE === 'undefined') {
      var pb = document.getElementById('loader-progress');
      if (pb) {
        pb.style.transition = 'width 2s ease';
        setTimeout(function () { pb.style.width = '100%'; }, 60);
      }
      setTimeout(reveal, 2400);
      loader.addEventListener('click', reveal);
      return;
    }

    // ════════════════════════════════════════════
    //  THREE.JS DATA CENTRE SCENE
    // ════════════════════════════════════════════
    var canvas   = document.getElementById('loader-canvas');
    var W        = window.innerWidth;
    var H        = window.innerHeight;
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    var scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020408);
    scene.fog = new THREE.FogExp2(0x020408, 0.026);

    var camera = new THREE.PerspectiveCamera(62, W / H, 0.1, 140);
    camera.position.set(0, 1.55, 5);

    // ── Materials ────────────────────────────────
    var mRack  = new THREE.MeshLambertMaterial({ color: 0x0b1020 });
    var mDoor  = new THREE.MeshLambertMaterial({ color: 0x131b2e });
    var mFloor = new THREE.MeshLambertMaterial({ color: 0x060810 });
    var mLedB  = new THREE.MeshBasicMaterial({ color: 0x0057ff });
    var mLedC  = new THREE.MeshBasicMaterial({ color: 0x00aaff });
    var mLedG  = new THREE.MeshBasicMaterial({ color: 0x00e0a0 });
    var ledMats = [mLedB, mLedB, mLedC, mLedB, mLedG, mLedC, mLedB, mLedB];

    // ── Shared geometries ─────────────────────────
    var gBody  = new THREE.BoxGeometry(0.9, 2.2, 0.58);
    var gDoor  = new THREE.BoxGeometry(0.82, 2.1, 0.04);
    var gLed   = new THREE.BoxGeometry(0.52, 0.018, 0.01);
    var gFloor = new THREE.PlaneGeometry(8, 200);
    var gCeil  = new THREE.PlaneGeometry(8, 200);

    // ── Build a rack unit ─────────────────────────
    function makeRack(x, z) {
      var g = new THREE.Group();

      var body = new THREE.Mesh(gBody, mRack);
      body.position.y = 1.1;
      g.add(body);

      var door = new THREE.Mesh(gDoor, mDoor);
      door.position.set(0, 1.1, 0.30);
      g.add(door);

      // LED rows
      for (var r = 0; r < 8; r++) {
        if (Math.random() > 0.14) {
          var led = new THREE.Mesh(gLed, ledMats[r % ledMats.length]);
          led.position.set((Math.random() - 0.5) * 0.14, 0.35 + r * 0.245, 0.33);
          g.add(led);
        }
      }

      g.position.set(x, 0, z);
      scene.add(g);
    }

    // ── Populate corridor ─────────────────────────
    var RACKS   = 32;
    var SPACING = 2.75;
    for (var i = 0; i < RACKS; i++) {
      var rz = -(i * SPACING) - 3;
      makeRack(-2.15, rz);
      makeRack( 2.15, rz);
    }

    // ── Floor & ceiling ───────────────────────────
    var floor = new THREE.Mesh(gFloor, mFloor);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -50);
    scene.add(floor);

    var ceil = new THREE.Mesh(gCeil, mFloor);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(0, 2.85, -50);
    scene.add(ceil);

    // Floor grid for depth cue
    var grid = new THREE.GridHelper(8, 24, 0x0c2260, 0x08101e);
    grid.position.set(0, 0.005, -50);
    scene.add(grid);

    // ── Lighting ──────────────────────────────────
    scene.add(new THREE.AmbientLight(0x0a1535, 2.4));
    for (var p = 0; p < 12; p++) {
      var pt = new THREE.PointLight(0x0055dd, 1.0, 14);
      pt.position.set(0, 2.7, -(p * 7) - 4);
      scene.add(pt);
    }

    // ── Text cards ────────────────────────────────
    var CARDS = [
      document.getElementById('lt-0'),
      document.getElementById('lt-1'),
      document.getElementById('lt-2'),
      document.getElementById('lt-3')
    ];
    // [showAt, hideAt] as fraction of total progress 0–1
    var BEATS = [
      [0.05, 0.25],
      [0.30, 0.50],
      [0.55, 0.75],
      [0.80, 1.00]
    ];

    function updateCards(raw) {
      for (var c = 0; c < CARDS.length; c++) {
        if (!CARDS[c]) continue;
        var on = raw >= BEATS[c][0] && raw < BEATS[c][1];
        if (on) CARDS[c].classList.add('lt-visible');
        else    CARDS[c].classList.remove('lt-visible');
      }
    }

    var progressEl = document.getElementById('loader-progress');

    // ── Camera path ───────────────────────────────
    var START_Z  =  5;
    var END_Z    = -(RACKS * SPACING * 0.55);
    var DURATION = 6400; // ms total
    var t0       = null;

    function tick(ts) {
      if (!running) return;
      if (!t0) t0 = ts;

      var elapsed = ts - t0;
      var raw     = Math.min(elapsed / DURATION, 1);

      // Ease-in-out cubic
      var p = raw < 0.5
        ? 4 * raw * raw * raw
        : 1 - Math.pow(-2 * raw + 2, 3) / 2;

      // Fly camera forward
      camera.position.z = START_Z + (END_Z - START_Z) * p;
      // Gentle organic sway
      camera.position.x = Math.sin(elapsed * 0.00022) * 0.10;
      camera.position.y = 1.55 + Math.sin(elapsed * 0.00038) * 0.055;
      camera.lookAt(
        camera.position.x * 0.25,
        1.55,
        camera.position.z - 18
      );

      updateCards(raw);
      if (progressEl) progressEl.style.width = (raw * 100) + '%';

      renderer.render(scene, camera);

      if (raw >= 1) { reveal(); return; }
      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);

    // ── Skip handler ──────────────────────────────
    function skip() { if (running) reveal(); }
    loader.addEventListener('click', skip);
    document.addEventListener('keydown', function onKey(e) {
      if (e.key !== 'F12') { skip(); document.removeEventListener('keydown', onKey); }
    });

    // ── Resize ────────────────────────────────────
    window.addEventListener('resize', function () {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }, { passive: true });
  }

  /* ════════════════════════════════════════════
     2. ANIMATED STAT COUNTERS
  ════════════════════════════════════════════ */
  function initCounters() {
    const counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    const seen = new Set();

    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || seen.has(entry.target)) return;
        seen.add(entry.target);
        const el = entry.target;
        const target = parseFloat(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        const prefix = el.dataset.prefix || '';
        const duration = 1800;
        const isFloat = el.dataset.count.includes('.');
        const start = performance.now();

        function tick(now) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          // Ease-out cubic
          const ease = 1 - Math.pow(1 - progress, 3);
          const value = target * ease;
          el.textContent = prefix + (isFloat ? value.toFixed(1) : Math.round(value)) + suffix;
          if (progress < 1) requestAnimationFrame(tick);
          else el.textContent = prefix + (isFloat ? target.toFixed(1) : target) + suffix;
        }
        requestAnimationFrame(tick);
        counterObserver.unobserve(el);
      });
    }, { threshold: 0.5 });

    counters.forEach((el) => counterObserver.observe(el));
  }

  /* ════════════════════════════════════════════
     3. HIDDEN TERMINAL EASTER EGG
  ════════════════════════════════════════════ */
  function initTerminal() {
    const terminal = document.getElementById('ec2-terminal');
    if (!terminal) return;

    const output = terminal.querySelector('.term-output');
    const input = terminal.querySelector('.term-input');
    const closeBtn = terminal.querySelector('.term-close');
    let open = false;

    // Commands
    const now = new Date();
    const upDays = Math.floor((now - new Date('2009-01-01')) / 86400000);
    const upYrs = Math.floor(upDays / 365);
    const upMos = Math.floor((upDays % 365) / 30);

    const COMMANDS = {
      help() {
        return [
          '<span class="t-dim">Available commands:</span>',
          '  <span class="t-cmd">help</span>      — list commands',
          '  <span class="t-cmd">status</span>    — system status',
          '  <span class="t-cmd">ping</span>      — ping ec2it.co.uk',
          '  <span class="t-cmd">uptime</span>    — show uptime',
          '  <span class="t-cmd">whoami</span>    — identify user',
          '  <span class="t-cmd">ls</span>        — list services',
          '  <span class="t-cmd">clear</span>     — clear screen',
          '  <span class="t-cmd">exit</span>      — close terminal',
        ].join('\n');
      },
      status() {
        return [
          '<span class="t-ok">●</span> Network          ONLINE',
          '<span class="t-ok">●</span> Helpdesk          ONLINE  — 90min SLA',
          '<span class="t-ok">●</span> Monitoring        ONLINE  — 24/7',
          '<span class="t-ok">●</span> Security          ONLINE  — All clear',
          '<span class="t-ok">●</span> Cloud (M365)      ONLINE',
          '<span class="t-ok">●</span> Backups           ONLINE  — Last run: today',
          '<span class="t-dim">────────────────────────────────</span>',
          '<span class="t-ok">All systems operational.</span>',
        ].join('\n');
      },
      ping() {
        const ms = [1, 1, 2, 1, 1];
        return [
          'PING ec2it.co.uk (35.205.74.21): 56 bytes',
          ...ms.map((m, i) => `64 bytes from 35.205.74.21: seq=${i} TTL=56 time=${m} ms`),
          '<span class="t-dim">— Round-trip min/avg/max = 1/1.2/2 ms</span>',
        ].join('\n');
      },
      uptime() {
        return `System uptime: <span class="t-ok">${upYrs} years, ${upMos} months</span> — Since Jan 2009\nLoad average: 0.12  0.08  0.05\n500+ endpoints currently monitored`;
      },
      whoami() {
        return `User:   <span class="t-ok">guest</span>\nAccess: PUBLIC\nTip:    <span class="t-dim">We're hiring engineers. Email hello@ec2it.co.uk</span>`;
      },
      ls() {
        return [
          '<span class="t-dim">services/</span>',
          '  helpdesk/          end-user-support.sh',
          '  monitoring/        24x7-watch.service',
          '  security/          firewall.conf  backup.cron',
          '  cloud/             m365-tenant.json',
          '  projects/          office-move.plan',
          '  infrastructure/    network.topology',
        ].join('\n');
      },
      clear() { output.innerHTML = ''; return null; },
      exit() { closeTerminal(); return null; },
      quit() { closeTerminal(); return null; },
    };

    function writeOutput(html, isCmd = false) {
      const line = document.createElement('div');
      line.className = isCmd ? 'term-line term-cmd-line' : 'term-line';
      line.innerHTML = html;
      output.appendChild(line);
      output.scrollTop = output.scrollHeight;
    }

    function runCommand(raw) {
      const cmd = raw.trim().toLowerCase().split(/\s+/)[0];
      writeOutput(`<span class="t-prompt">ec2it:~$</span> ${escHtml(raw)}`, true);
      if (!cmd) return;
      if (COMMANDS[cmd]) {
        const result = COMMANDS[cmd]();
        if (result !== null) writeOutput(result);
      } else {
        writeOutput(`<span class="t-err">bash: ${escHtml(cmd)}: command not found</span>\nType <span class="t-cmd">help</span> for available commands.`);
      }
    }

    function escHtml(str) {
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function openTerminal() {
      open = true;
      terminal.classList.add('open');
      setTimeout(() => input.focus(), 50);
      if (!output.children.length) {
        writeOutput('EC2IT Terminal v15.0  —  Type <span class="t-cmd">help</span> for commands.');
        writeOutput('<span class="t-dim">─────────────────────────────────────────</span>');
      }
    }

    function closeTerminal() {
      open = false;
      terminal.classList.remove('open');
    }

    // Keyboard shortcut: backtick ` to toggle
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === '`') { e.preventDefault(); open ? closeTerminal() : openTerminal(); }
      if (e.key === 'Escape' && open) closeTerminal();
    });

    // Submit command on Enter
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const val = input.value;
        input.value = '';
        runCommand(val);
      }
    });

    // Close button
    if (closeBtn) closeBtn.addEventListener('click', closeTerminal);

    // Hint button click
    const hint = document.querySelector('.term-hint');
    if (hint) hint.addEventListener('click', () => open ? closeTerminal() : openTerminal());

    // Show hint in console for curious devs
    console.log('%c EC2IT ', 'background:#0057ff;color:#fff;font-weight:700;padding:4px 8px;border-radius:4px;', 'Press ` (backtick) to open the terminal.');
  }

  /* ════════════════════════════════════════════
     5. EXISTING FEATURES (unchanged)
  ════════════════════════════════════════════ */

  /* Scroll-triggered fade-ins */
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          setTimeout(() => e.target.classList.add('v'), i * 50);
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.06 }
  );
  document.querySelectorAll('.fi').forEach((el) => io.observe(el));

  /* Nav scroll shadow */
  const nav = document.querySelector('nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });
  }

  /* FAQ accordion */
  document.querySelectorAll('.faq-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach((i) => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });

  /* Mobile hamburger */
  const hamburger = document.querySelector('.nav-hamburger');
  const mobileMenu = document.querySelector('.nav-mobile');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.toggle('open');
      mobileMenu.classList.toggle('open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  /* Active nav link (scroll spy) */
  const navLinks = document.querySelectorAll('.nav-center a[href^="#"]');
  if (navLinks.length) {
    const sections = Array.from(navLinks)
      .map((a) => document.querySelector(a.getAttribute('href')))
      .filter(Boolean);
    window.addEventListener('scroll', () => {
      let current = '';
      sections.forEach((s) => { if (window.scrollY >= s.offsetTop - 120) current = s.id; });
      navLinks.forEach((a) => {
        a.classList.toggle('active', a.getAttribute('href') === '#' + current);
      });
    }, { passive: true });
  }

  /* Contact form */
  const form = document.getElementById('contact-form');
  if (form) {
    const successMsg = document.getElementById('form-success');

    function validateField(field) {
      const group = field.closest('.form-group');
      if (!group) return true;
      const errEl = group.querySelector('.form-error');
      let valid = true;
      let msg = '';
      if (field.required && !field.value.trim()) { valid = false; msg = 'This field is required.'; }
      else if (field.type === 'email' && field.value.trim()) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim())) { valid = false; msg = 'Please enter a valid email address.'; }
      } else if (field.name === 'phone' && field.value.trim()) {
        if (!/^[\d\s+\-().]{7,}$/.test(field.value.trim())) { valid = false; msg = 'Please enter a valid phone number.'; }
      }
      field.classList.toggle('error', !valid);
      if (errEl) { errEl.textContent = msg; errEl.classList.toggle('visible', !valid); }
      return valid;
    }

    form.querySelectorAll('input, textarea, select').forEach((f) => {
      f.addEventListener('blur', () => validateField(f));
      f.addEventListener('input', () => { if (f.classList.contains('error')) validateField(f); });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const hp = form.querySelector('.hp-field input');
      if (hp && hp.value) return;
      const fields = form.querySelectorAll('input:not(.hp-field input), textarea, select');
      let allValid = true;
      fields.forEach((f) => { if (!validateField(f)) allValid = false; });
      if (!allValid) return;
      const submitBtn = form.querySelector('[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
      try {
        const action = form.getAttribute('action');
        if (!action || action === '#') {
          await new Promise((r) => setTimeout(r, 800));
          form.reset();
          if (successMsg) successMsg.classList.add('visible');
          form.style.display = 'none';
        } else {
          const res = await fetch(action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
          if (res.ok) { form.reset(); if (successMsg) successMsg.classList.add('visible'); form.style.display = 'none'; }
          else throw new Error('Server error');
        }
      } catch {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        alert('Sorry, something went wrong. Please try calling us on 020 8142 4660.');
      }
    });
  }

  /* ════════════════════════════════════════════
     4. DARK / LIGHT THEME TOGGLE
  ════════════════════════════════════════════ */
  function initThemeToggle() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;

    // Restore saved preference (default: light)
    const saved = localStorage.getItem('ec2it_theme');
    if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark');

    btn.addEventListener('click', function () {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('ec2it_theme', 'light');
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('ec2it_theme', 'dark');
      }
    });
  }

  /* ════════════════════════════════════════════
     5. PROMISE PANEL COUNTERS
  ════════════════════════════════════════════ */
  function initPromiseCounters() {
    const counters = document.querySelectorAll('.pp-count');
    if (!counters.length) return;

    const seen = new Set();
    const obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || seen.has(entry.target)) return;
        seen.add(entry.target);
        const el = entry.target;
        const target = parseInt(el.dataset.count, 10);
        const duration = 1600;
        const start = performance.now();

        function tick(now) {
          const progress = Math.min((now - start) / duration, 1);
          // Ease-out cubic
          const ease = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.round(target * ease);
          if (progress < 1) requestAnimationFrame(tick);
          else el.textContent = target;
        }
        requestAnimationFrame(tick);
        obs.unobserve(el);
      });
    }, { threshold: 0.6 });

    counters.forEach(function (el) { obs.observe(el); });
  }

  /* ── Init all features ── */
  initPremiumLoader();
  initCounters();
  initTerminal();
  initThemeToggle();
  initPromiseCounters();

})();
