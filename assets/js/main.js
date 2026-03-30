/* ── EC2IT Main JS ── */

(function () {
  'use strict';

  // Shared falling-ticket position read by the network map each frame
  var sharedTicketX = -999, sharedTicketY = -999;

  /* ════════════════════════════════════════════
     1. 3D DATA CENTRE INTRO
  ════════════════════════════════════════════ */
  function initPremiumLoader() {
    const loader = document.getElementById('site-loader');
    if (!loader) return;

    document.body.style.overflow = 'hidden';

    // ── Shared reveal/cleanup ───────────────────
    function reveal(skipMode) {
      running = false;
      document.body.style.overflow = '';

      var wrap = document.getElementById('page-wrap');
      var fadeMs = skipMode ? 200 : 280;

      // Pre-scale page to slightly small (invisible behind loader)
      if (wrap) {
        wrap.style.transition = 'none';
        wrap.style.transform = 'scale(0.9)';
      }

      // Fade out the loader
      loader.style.transition = 'opacity ' + (fadeMs / 1000) + 's ease';
      loader.style.opacity = '0';

      setTimeout(function () {
        loader.style.display = 'none';
        if (renderer) renderer.dispose();
        // Trigger page zoom-in on next paint
        requestAnimationFrame(function () {
          if (wrap) {
            wrap.style.transition = 'transform 0.55s cubic-bezier(0.16, 1, 0.3, 1)';
            wrap.style.transform = 'scale(1)';
            // CRITICAL: remove the inline transform once animation finishes.
            // A transform on any ancestor breaks position:fixed descendants
            // (they become fixed relative to that ancestor, not the viewport).
            setTimeout(function () {
              wrap.style.transition = '';
              wrap.style.transform  = '';
            }, 620);
          }
        });
      }, fadeMs + 20);
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
    scene.fog = new THREE.FogExp2(0x020408, 0.015);  // lighter fog — more racks visible ahead

    var camera = new THREE.PerspectiveCamera(62, W / H, 0.1, 200);
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
    var gFloor = new THREE.PlaneGeometry(8, 280);
    var gCeil  = new THREE.PlaneGeometry(8, 280);

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
    var RACKS   = 52;   // deeper corridor — camera flies further into the database
    var SPACING = 2.75;
    for (var i = 0; i < RACKS; i++) {
      var rz = -(i * SPACING) - 3;
      makeRack(-2.15, rz);
      makeRack( 2.15, rz);
    }

    // ── Floor & ceiling ───────────────────────────
    var floor = new THREE.Mesh(gFloor, mFloor);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -85);
    scene.add(floor);

    var ceil = new THREE.Mesh(gCeil, mFloor);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(0, 2.85, -85);
    scene.add(ceil);

    // ── End-wall server bank: camera crashes INTO these ──
    // Camera destination sits just inside this rack cluster
    var PORTAL_Z = -(RACKS * SPACING) - 2;

    // Cross-corridor wall of racks — fills the full width so camera flies into them
    var ewZ = PORTAL_Z + 1.2;
    makeRack(-3.30, ewZ);
    makeRack(-2.15, ewZ);
    makeRack(-1.00, ewZ);
    makeRack( 1.00, ewZ);
    makeRack( 2.15, ewZ);
    makeRack( 3.30, ewZ);
    // Second layer slightly behind for depth (visible as camera rushes in)
    makeRack(-2.80, ewZ - SPACING * 0.6);
    makeRack(-1.55, ewZ - SPACING * 0.6);
    makeRack( 0,    ewZ - SPACING * 0.6);
    makeRack( 1.55, ewZ - SPACING * 0.6);
    makeRack( 2.80, ewZ - SPACING * 0.6);

    // Blue point light — glows subtly, intensifies as camera dives in
    var portalLight = new THREE.PointLight(0x0044ff, 0, 80);
    portalLight.position.set(0, 1.55, PORTAL_Z + 6);
    scene.add(portalLight);

    // Extra corridor lights in the deep section so it feels endless going in
    for (var d = 0; d < 6; d++) {
      var dp = new THREE.PointLight(0x0033cc, 0.7, 14);
      dp.position.set(0, 2.7, PORTAL_Z + d * SPACING * 1.6);
      scene.add(dp);
    }

    // ── Ambient + corridor lights ─────────────────
    var ambientLight = new THREE.AmbientLight(0x0a1535, 2.4);
    scene.add(ambientLight);
    for (var p = 0; p < 22; p++) {   // more lights for the extended corridor
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
    // [showAt, hideAt] as fraction 0–1 (hideAt capped before rush at 0.78)
    var BEATS = [
      [0.04, 0.22],
      [0.27, 0.46],
      [0.51, 0.70],
      [0.75, 0.88]
    ];

    // ── Minimalist card sounds via Web Audio synthesis ──────────────
    var audioCtx = null;
    var cardPlayed = [false, false, false, false];

    function getAudioCtx() {
      if (!audioCtx) {
        try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
      }
      return audioCtx;
    }

    function playCardSound(idx) {
      var ctx = getAudioCtx();
      if (!ctx || ctx.state === 'suspended') return;
      // Ascending triangle-wave tones: clean, minimal, electronic
      var freqs = [280, 360, 480, 640];
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freqs[idx] || 440, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.10, ctx.currentTime + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.45);
    }

    // Try to unlock audio on first user interaction (browser autoplay policy)
    function unlockAudio() {
      var ctx = getAudioCtx();
      if (ctx && ctx.state === 'suspended') ctx.resume();
    }
    loader.addEventListener('click',   unlockAudio, { once: true });
    document.addEventListener('keydown', unlockAudio, { once: true });
    // Kick it immediately — works if page was opened by a user gesture (e.g. link click)
    getAudioCtx();

    function updateCards(raw) {
      for (var c = 0; c < CARDS.length; c++) {
        if (!CARDS[c]) continue;
        var on = raw >= BEATS[c][0] && raw < BEATS[c][1];
        if (on && !cardPlayed[c]) { cardPlayed[c] = true; playCardSound(c); }
        if (on) CARDS[c].classList.add('lt-visible');
        else    CARDS[c].classList.remove('lt-visible');
      }
    }

    var progressEl = document.getElementById('loader-progress');

    // ── Camera path ───────────────────────────────
    // Fly through 72% of corridor normally, then RUSH the last 28%
    var START_Z  =  5;
    var DURATION = 7000; // ms total
    var RUSH_START = 0.78; // raw progress where rush begins
    var t0 = null;

    function tick(ts) {
      if (!running) return;
      if (!t0) t0 = ts;

      var elapsed = ts - t0;
      var raw     = Math.min(elapsed / DURATION, 1);

      // Single continuous ease-in — no split, no velocity discontinuity.
      // raw^2.4 means the camera always accelerates; the final 20% of time
      // covers ~40% of the corridor, giving a genuine rush without any pause.
      var p = Math.pow(raw, 2.4);

      // Camera position
      camera.position.z = START_Z + (PORTAL_Z - START_Z) * p;

      // Sway fades to zero during rush so we go dead straight
      var swayAmt = Math.max(0, 1 - Math.max(0, (raw - RUSH_START) / 0.12));
      camera.position.x = Math.sin(elapsed * 0.00022) * 0.10 * swayAmt;
      camera.position.y = 1.55 + Math.sin(elapsed * 0.00038) * 0.055 * swayAmt;

      // Look-ahead shortens during rush (tunnel-vision effect)
      var lookDist = 18 - Math.max(0, (raw - RUSH_START) / (1 - RUSH_START)) * 14;
      camera.lookAt(
        camera.position.x * 0.25 * swayAmt,
        1.55,
        camera.position.z - Math.max(4, lookDist)
      );

      // ── Database depth glow: blue light intensifies as camera dives deeper ──
      if (raw > RUSH_START) {
        var rushT = (raw - RUSH_START) / (1 - RUSH_START); // 0→1
        portalLight.intensity  = rushT * rushT * 6;   // subtle blue bloom, not white
        ambientLight.intensity = 2.4 + rushT * 3.5;  // gentle brightening only
      }

      updateCards(raw);
      if (progressEl) progressEl.style.width = (raw * 100) + '%';

      renderer.render(scene, camera);

      if (raw >= 1) { reveal(false); return; }
      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);

    // ── Skip handler ──────────────────────────────
    function skip() { if (running) reveal(true); }
    loader.addEventListener('click', function() { unlockAudio(); skip(); });
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

  /* ════════════════════════════════════════════
     NETWORK MAP — animated hero background
  ════════════════════════════════════════════ */
  function initNetworkMap() {
    var canvas = document.getElementById('network-canvas');
    var hero   = document.getElementById('hero');
    if (!canvas || !hero) return;

    var ctx = canvas.getContext('2d');
    var W = 0, H = 0;
    var mouseX = -999, mouseY = -999;
    var scrollOff = 0;
    var active = true;

    function resize() {
      W = hero.offsetWidth;
      H = hero.offsetHeight;
      canvas.width  = W;
      canvas.height = H;
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    // ── Nodes ─────────────────────────────────
    var N    = window.innerWidth < 768 ? 12 : 26;
    var DIST = 185;
    var nodes = [];
    for (var i = 0; i < N; i++) {
      nodes.push({
        x:  Math.random() * W,
        y:  Math.random() * H,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r:  Math.random() > 0.78 ? 3.4 : 1.9,
        pf: Math.random() * 0.22 + 0.04   // parallax factor per node
      });
    }

    // ── Data packets ──────────────────────────
    var packets = [];
    var pTick   = 0;

    function spawnPacket() {
      for (var t = 0; t < 30; t++) {
        var a = (Math.random() * N) | 0;
        var b = (Math.random() * N) | 0;
        if (a === b) continue;
        var dx = nodes[b].x - nodes[a].x;
        var dy = nodes[b].y - nodes[a].y;
        if (Math.sqrt(dx*dx + dy*dy) < DIST) {
          packets.push({ a: a, b: b, t: 0, spd: 0.004 + Math.random() * 0.003 });
          return;
        }
      }
    }

    // ── Mouse ripple ──────────────────────────
    hero.addEventListener('mousemove', function(e) {
      var r = canvas.getBoundingClientRect();
      mouseX = e.clientX - r.left;
      mouseY = e.clientY - r.top;
    }, { passive: true });
    hero.addEventListener('mouseleave', function() { mouseX = -999; mouseY = -999; });

    // ── Scroll parallax ───────────────────────
    window.addEventListener('scroll', function() {
      scrollOff = -hero.getBoundingClientRect().top;
    }, { passive: true });

    // ── Pause when hero off-screen ────────────
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function(ents) {
        active = ents[0].isIntersecting;
        if (active) requestAnimationFrame(draw);
      }).observe(hero);
    }

    // ── Render ────────────────────────────────
    function draw() {
      if (!active) return;
      var dark   = document.documentElement.dataset.theme === 'dark';
      var accent = dark ? '77,138,255' : '0,87,255';

      ctx.clearRect(0, 0, W, H);

      // Update node physics
      for (var i = 0; i < N; i++) {
        var n   = nodes[i];
        var mdx = n.x - mouseX;
        var mdy = n.y - mouseY;
        var md  = Math.sqrt(mdx*mdx + mdy*mdy);
        if (md < 110 && md > 0) {
          var f = ((110 - md) / 110) * 0.016;
          n.vx += (mdx / md) * f;
          n.vy += (mdy / md) * f;
          var spd = Math.sqrt(n.vx*n.vx + n.vy*n.vy);
          if (spd > 1.3) { n.vx *= 1.3/spd; n.vy *= 1.3/spd; }
        }
        // Gentle drag so scattered nodes settle back naturally
        n.vx *= 0.988; n.vy *= 0.988;
        n.x += n.vx; n.y += n.vy;
        if (n.x < 10 || n.x > W-10) n.vx *= -1;
        if (n.y < 10 || n.y > H-10) n.vy *= -1;
      }

      // ── Ambulance repulsion: nodes scatter as vehicle passes through ──
      var ambEl = document.querySelector('.ambulance-svg');
      if (ambEl) {
        var ambR  = ambEl.getBoundingClientRect();
        var cvR   = canvas.getBoundingClientRect();
        var ambCX = ambR.left - cvR.left + ambR.width  * 0.5;
        var ambCY = ambR.top  - cvR.top  + ambR.height * 0.5;
        var ambRad = ambR.width * 0.7;   // repulsion bubble around vehicle
        for (var i = 0; i < N; i++) {
          var n  = nodes[i];
          var ry = n.y - scrollOff * n.pf;
          var dx = n.x  - ambCX;
          var dy = ry   - ambCY;
          var d  = Math.sqrt(dx*dx + dy*dy);
          if (d < ambRad && d > 0) {
            var f = ((ambRad - d) / ambRad) * 1.6;
            n.vx += (dx / d) * f * 0.055;
            n.vy += (dy / d) * f * 0.055;
            var spd = Math.sqrt(n.vx*n.vx + n.vy*n.vy);
            if (spd > 3.2) { n.vx *= 3.2/spd; n.vy *= 3.2/spd; }
          }
        }
      }

      // ── Ticket repulsion: nodes scatter as ticket passes through ──
      if (sharedTicketX > -900) {
        var tkRad = 70;
        for (var i = 0; i < N; i++) {
          var n  = nodes[i];
          var ry = n.y - scrollOff * n.pf;
          var dx = n.x - sharedTicketX;
          var dy = ry  - sharedTicketY;
          var d  = Math.sqrt(dx*dx + dy*dy);
          if (d < tkRad && d > 0) {
            var f = ((tkRad - d) / tkRad) * 1.1;
            n.vx += (dx / d) * f * 0.05;
            n.vy += (dy / d) * f * 0.05;
            var spd = Math.sqrt(n.vx*n.vx + n.vy*n.vy);
            if (spd > 2.8) { n.vx *= 2.8/spd; n.vy *= 2.8/spd; }
          }
        }
      }

      // Draw edges
      for (var i = 0; i < N; i++) {
        var ni  = nodes[i];
        var ryi = ni.y - scrollOff * ni.pf;
        for (var j = i+1; j < N; j++) {
          var nj  = nodes[j];
          var ryj = nj.y - scrollOff * nj.pf;
          var dx  = nj.x - ni.x;
          var dy  = ryj - ryi;
          var d   = Math.sqrt(dx*dx + dy*dy);
          if (d < DIST) {
            ctx.beginPath();
            ctx.moveTo(ni.x, ryi);
            ctx.lineTo(nj.x, ryj);
            ctx.strokeStyle = 'rgba('+accent+','+(1-d/DIST)*(dark?0.14:0.07)+')';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      for (var i = 0; i < N; i++) {
        var n  = nodes[i];
        var ry = n.y - scrollOff * n.pf;
        ctx.beginPath();
        ctx.arc(n.x, ry, n.r, 0, 6.283);
        ctx.fillStyle = 'rgba('+accent+','+(dark?0.40:0.24)+')';
        ctx.fill();
      }

      // Spawn + draw data packets
      if (++pTick > 45 && packets.length < 10) { spawnPacket(); pTick = 0; }
      for (var p = packets.length-1; p >= 0; p--) {
        var pk = packets[p];
        pk.t += pk.spd;
        if (pk.t >= 1) { packets.splice(p, 1); continue; }
        var na = nodes[pk.a], nb = nodes[pk.b];
        var px = na.x + (nb.x - na.x) * pk.t;
        var py = (na.y - scrollOff*na.pf) + ((nb.y - scrollOff*nb.pf) - (na.y - scrollOff*na.pf)) * pk.t;
        ctx.beginPath();
        ctx.arc(px, py, 2.4, 0, 6.283);
        ctx.fillStyle = 'rgba('+accent+','+(dark?0.8:0.6)+')';
        ctx.fill();
      }

      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  /* ════════════════════════════════════════════
     AMBULANCE + FALLING TICKET physics
  ════════════════════════════════════════════ */
  function initAmbulance() {
    var wrapper  = document.querySelector('.hero-ambulance');
    var vehicle  = document.querySelector('.amb-vehicle');
    var ambEl    = document.querySelector('.ambulance-svg');
    var heroEl   = document.getElementById('hero');
    var ticketEl = document.getElementById('amb-ticket');
    if (!wrapper || !vehicle || !ambEl || !heroEl) return;

    var heroTitleEl    = document.querySelector('#hero h1');
    var promisePanelEl = document.querySelector('.promise-panel');

    /* ── Ambulance state ── */
    var ambW      = 320;
    var x         = -(ambW + 30);
    var speed     = 2.8;
    var SLOW_V    = 2.8;
    var FAST_V    = 13.0;
    var phase     = 'slow';
    var alertDone = false;
    var alertTimer = null;

    /* ── Ticket physics state ── */
    var tk = { x: 0, y: -60, vx: 0, vy: 0, active: false, caught: false };
    var mouseHX = -999, mouseHY = -999;

    /* Track mouse in hero-relative coords for ticket repulsion */
    heroEl.addEventListener('mousemove', function(e) {
      var r = heroEl.getBoundingClientRect();
      mouseHX = e.clientX - r.left;
      mouseHY = e.clientY - r.top;
    });
    heroEl.addEventListener('mouseleave', function() { mouseHX = -999; mouseHY = -999; });

    /* Beacon elements */
    var bL  = ambEl.querySelector('.amb-beacon-l');
    var bR  = ambEl.querySelector('.amb-beacon-r');
    var bM  = ambEl.querySelector('.amb-beacon-m');
    var bR2 = ambEl.querySelector('.amb-beacon-r2');

    function setPhase(p) {
      phase = p;
      wrapper.className = 'hero-ambulance amb-' + p;
    }

    function triggerAlert() {
      if (alertDone) return;
      alertDone = true;
      if (alertTimer) { clearTimeout(alertTimer); alertTimer = null; }
      setPhase('alert');
      var f = 0;
      var iv = setInterval(function() {
        f++;
        var on = (f % 2 === 0);
        if (bL)  { bL.setAttribute('fill',    on ? '#ffffff' : '#0057ff'); bL.setAttribute('opacity', on ? '1' : '0.08'); }
        if (bR)  { bR.setAttribute('fill',    on ? '#ffffff' : '#4d8aff'); bR.setAttribute('opacity', on ? '1' : '0.08'); }
        if (bM)  { bM.setAttribute('opacity', on ? '0.95' : '0.05'); }
        if (bR2) { bR2.setAttribute('opacity', on ? '0.05' : '0.95'); }
        if (f >= 14) {
          clearInterval(iv);
          if (bL)  { bL.setAttribute('fill', '#0057ff'); bL.setAttribute('opacity', '1'); }
          if (bR)  { bR.setAttribute('fill', '#4d8aff'); bR.setAttribute('opacity', '1'); }
          if (bM)  { bM.setAttribute('opacity', '0.25'); }
          if (bR2) { bR2.setAttribute('opacity', '0.25'); }
          setPhase('fast');
        }
      }, 80);
    }

    /* Spawn ticket from random position above hero */
    function spawnTicket() {
      if (!ticketEl) return;
      var heroW = heroEl.offsetWidth;
      // Random horizontal start, weighted toward centre so it's visible
      tk.x   = heroW * 0.15 + Math.random() * heroW * 0.55;
      tk.y   = -55;
      tk.vx  = (Math.random() - 0.5) * 4.0;   // random sideways drift
      tk.vy  = 1.0 + Math.random() * 1.2;      // downward
      tk.active = true;
      tk.caught = false;
      ticketEl.style.left      = tk.x + 'px';
      ticketEl.style.top       = tk.y + 'px';
      ticketEl.style.display   = 'flex';
      ticketEl.style.opacity   = '1';
      ticketEl.style.transform = 'translate(-50%, -50%)';
      ticketEl.style.transition = '';
      // Fallback alert in case ticket never reaches ambulance
      alertTimer = setTimeout(function() { if (!alertDone) triggerAlert(); }, 3200);
    }

    /* One physics step for the ticket */
    function ticketTick() {
      if (!tk.active || !ticketEl) { sharedTicketX = -999; sharedTicketY = -999; return; }

      var heroW    = heroEl.offsetWidth;
      var heroH    = heroEl.offsetHeight;
      var heroRect = heroEl.getBoundingClientRect();

      // Gravity + air drag
      tk.vy += 0.14;
      tk.vx *= 0.994;

      // Mouse repulsion — bounces away from cursor (stronger)
      if (mouseHX > -900) {
        var mdx = tk.x - mouseHX, mdy = tk.y - mouseHY;
        var md  = Math.sqrt(mdx*mdx + mdy*mdy);
        if (md < 110 && md > 1) {
          var mf = (110 - md) / 110 * 1.4;
          tk.vx += (mdx/md) * mf;
          tk.vy += (mdy/md) * mf;
        }
      }

      // Hero left/right wall bounces
      if (tk.x < 12) { tk.vx =  Math.abs(tk.vx) * (0.65 + Math.random()*0.2); tk.x = 12; }
      if (tk.x > heroW - 12) { tk.vx = -Math.abs(tk.vx) * (0.65 + Math.random()*0.2); tk.x = heroW - 12; }

      // ── Helper: AABB bounce off a DOM element ──
      function bounceOffRect(el) {
        if (!el) return;
        var r   = el.getBoundingClientRect();
        var ptx = tk.x + heroRect.left;
        var pty = tk.y + heroRect.top;
        var pad = 14;
        if (ptx > r.left - pad && ptx < r.right  + pad &&
            pty > r.top  - pad && pty < r.bottom + pad) {
          // Distances to each edge
          var dL = Math.abs(ptx - (r.left  - pad));
          var dR = Math.abs(ptx - (r.right + pad));
          var dT = Math.abs(pty - (r.top   - pad));
          var dB = Math.abs(pty - (r.bottom + pad));
          var minD = Math.min(dL, dR, dT, dB);
          var bounce = 0.7 + Math.random() * 0.25;
          if (minD === dL) {
            tk.vx = -Math.abs(tk.vx) * bounce - 0.5;
            tk.x  = (r.left - heroRect.left) - pad - 2;
          } else if (minD === dR) {
            tk.vx =  Math.abs(tk.vx) * bounce + 0.5;
            tk.x  = (r.right - heroRect.left) + pad + 2;
          } else if (minD === dT) {
            tk.vy = -Math.abs(tk.vy) * bounce - 0.5;
            tk.y  = (r.top - heroRect.top) - pad - 2;
          } else {
            tk.vy =  Math.abs(tk.vy) * bounce + 0.5;
            tk.y  = (r.bottom - heroRect.top) + pad + 2;
          }
        }
      }

      // Bounce off hero title ("IT that just works.")
      bounceOffRect(heroTitleEl);

      // Bounce off promise panel
      bounceOffRect(promisePanelEl);

      // Speed cap
      var spd = Math.sqrt(tk.vx*tk.vx + tk.vy*tk.vy);
      if (spd > 12) { tk.vx *= 12/spd; tk.vy *= 12/spd; }

      tk.x += tk.vx;
      tk.y += tk.vy;

      // Ambulance catch — ticket meets ambulance front zone
      if (!tk.caught) {
        var ar  = ambEl.getBoundingClientRect();
        var tsx = tk.x + heroRect.left;
        var tsy = tk.y + heroRect.top;
        if (tsx > ar.left + 25 && tsx < ar.right  - 25 &&
            tsy > ar.top  - 15 && tsy < ar.bottom +  5) {
          tk.caught = true;
          tk.active = false;
          // Zoom-out + fade catch animation
          ticketEl.style.transition = 'transform 0.38s ease, opacity 0.38s ease';
          ticketEl.style.transform  = 'translate(-50%, -85%) scale(1.35)';
          ticketEl.style.opacity    = '0';
          setTimeout(function() {
            ticketEl.style.display = 'none';
            ticketEl.style.transform = 'translate(-50%, -50%)';
            ticketEl.style.transition = '';
          }, 420);
          sharedTicketX = -999; sharedTicketY = -999;
          triggerAlert();
          return;
        }
      }

      // Fell off bottom without being caught
      if (tk.y > heroH + 40) {
        tk.active = false;
        ticketEl.style.display = 'none';
        sharedTicketX = -999; sharedTicketY = -999;
        triggerAlert();  // ambulance speeds off anyway
        return;
      }

      // Share position with network map
      sharedTicketX = tk.x;
      sharedTicketY = tk.y;

      // Update DOM
      ticketEl.style.left = tk.x + 'px';
      ticketEl.style.top  = tk.y + 'px';
    }

    /* Main animation loop */
    function tick() {
      var heroW = (wrapper.parentElement || document.body).offsetWidth;
      var endX  = heroW + ambW + 30;

      // Accelerate once alert fires
      speed = (phase === 'fast') ? Math.min(speed + 0.22, FAST_V) : SLOW_V;

      x += speed;

      // Run ticket physics every frame
      ticketTick();

      // Cycle reset
      if (x > endX) {
        x         = -(ambW + 30);
        speed     = SLOW_V;
        alertDone = false;
        if (alertTimer) { clearTimeout(alertTimer); alertTimer = null; }
        // Hide any lingering ticket
        if (ticketEl) { ticketEl.style.display = 'none'; }
        tk.active = false;
        sharedTicketX = -999; sharedTicketY = -999;
        setPhase('slow');
        // Spawn next ticket after a short pause
        setTimeout(spawnTicket, 600);
      }

      vehicle.style.transform = 'translateX(' + x + 'px)';
      requestAnimationFrame(tick);
    }

    setPhase('slow');
    setTimeout(spawnTicket, 800);  // first ticket appears shortly after load
    requestAnimationFrame(tick);
  }

  /* ── Promise panel: mouse-tracked 3D tilt ── */
  function init3DTilt() {
    var panel = document.querySelector('.promise-panel');
    if (!panel) return;
    var BASE = 'translateY(-50%)';

    panel.addEventListener('mousemove', function(e) {
      var r = panel.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width  - 0.5;
      var y = (e.clientY - r.top)  / r.height - 0.5;
      panel.style.transition = 'transform 0.08s ease, box-shadow 0.08s ease';
      panel.style.transform  = BASE + ' perspective(900px) rotateX(' + (-y * 16) + 'deg) rotateY(' + (x * 16) + 'deg) scale(1.025)';
      var sx = -x * 14, sy = -y * 14 + 10;
      panel.style.boxShadow  = sx + 'px ' + sy + 'px 50px rgba(0,0,0,0.14), 0 0 28px rgba(0,87,255,' + (0.06 + Math.abs(x) * 0.08) + ')';
    });

    panel.addEventListener('mouseleave', function() {
      panel.style.transition = 'transform 0.55s cubic-bezier(0.16,1,0.3,1), box-shadow 0.55s ease';
      panel.style.transform  = BASE;
      panel.style.boxShadow  = '';
    });
  }

  /* ── Init all features ── */
  initPremiumLoader();
  initCounters();
  initTerminal();
  initThemeToggle();
  initPromiseCounters();
  initNetworkMap();
  initAmbulance();
  init3DTilt();

})();
