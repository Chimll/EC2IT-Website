/* ── EC2IT Main JS ── */

(function () {
  'use strict';

  /* ════════════════════════════════════════════
     1. TERMINAL BOOT LOADER
  ════════════════════════════════════════════ */
  function initBootLoader() {
    const overlay = document.getElementById('boot-loader');
    if (!overlay) return;

    // Only show once per browser session
    if (sessionStorage.getItem('ec2it_booted')) {
      overlay.style.display = 'none';
      return;
    }

    const lines = [
      { text: 'EC2IT OS v15.0  —  BOOT SEQUENCE INITIATED', delay: 0, type: 'header' },
      { text: '', delay: 300 },
      { text: 'Checking network connectivity', delay: 500, ok: true },
      { text: 'Loading security protocols', delay: 900, ok: true },
      { text: 'Starting 24/7 monitoring systems', delay: 1350, ok: true },
      { text: 'Connecting helpdesk — 90min SLA active', delay: 1850, ok: true },
      { text: 'Authenticating 500+ endpoints', delay: 2300, ok: true },
      { text: 'Verifying engineer availability', delay: 2700, ok: true },
      { text: '', delay: 3000 },
      { text: 'ALL SYSTEMS OPERATIONAL.', delay: 3200, type: 'success' },
      { text: '', delay: 3400 },
      { text: 'WELCOME TO EC2IT.', delay: 3500, type: 'welcome' },
    ];

    const output = overlay.querySelector('.boot-output');
    const skipHint = overlay.querySelector('.boot-skip');

    let dismissed = false;
    let allDone = false;

    function dismiss() {
      if (dismissed) return;
      dismissed = true;
      overlay.classList.add('fade-out');
      setTimeout(() => { overlay.style.display = 'none'; }, 600);
      sessionStorage.setItem('ec2it_booted', '1');
    }

    // Skip on click or key
    overlay.addEventListener('click', dismiss);
    document.addEventListener('keydown', function onKey(e) {
      if (e.key !== 'F12') { dismiss(); document.removeEventListener('keydown', onKey); }
    }, { once: false });

    // Show skip hint after 1s
    setTimeout(() => { if (skipHint) skipHint.style.opacity = '1'; }, 1000);

    // Type each line
    lines.forEach(({ text, delay, type, ok }) => {
      setTimeout(() => {
        if (dismissed) return;
        const line = document.createElement('div');
        line.className = 'boot-line';
        if (type === 'header') line.classList.add('boot-header');
        if (type === 'success') line.classList.add('boot-success');
        if (type === 'welcome') line.classList.add('boot-welcome');

        if (ok) {
          line.innerHTML = `<span class="boot-text"></span><span class="boot-ok">[  OK  ]</span>`;
          typeText(line.querySelector('.boot-text'), text, 18);
        } else {
          typeText(line, text, type === 'header' ? 22 : 28);
        }
        output.appendChild(line);
        output.scrollTop = output.scrollHeight;
      }, delay);
    });

    // Auto-dismiss 1.2s after last line
    const lastDelay = lines[lines.length - 1].delay;
    setTimeout(() => {
      allDone = true;
      dismiss();
    }, lastDelay + 1200);

    function typeText(el, text, speed) {
      let i = 0;
      el.textContent = '';
      if (!text) return;
      const cursor = document.createElement('span');
      cursor.className = 'boot-cursor';
      cursor.textContent = '█';
      el.appendChild(cursor);
      const t = setInterval(() => {
        if (dismissed && !allDone) { clearInterval(t); el.textContent = text; return; }
        cursor.before(text[i] || '');
        i++;
        if (i >= text.length) { clearInterval(t); cursor.remove(); }
      }, speed);
    }
  }

  /* ════════════════════════════════════════════
     2. PARTICLE NETWORK (Hero background)
  ════════════════════════════════════════════ */
  function initParticles() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, particles = [], raf;

    const CONFIG = {
      count: 55,
      speed: 0.35,
      radius: 2.2,
      connectDist: 140,
      color: '0, 87, 255',
      dotAlpha: 0.18,
      lineAlpha: 0.07,
    };

    function resize() {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    }

    function createParticle() {
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * CONFIG.speed,
        vy: (Math.random() - 0.5) * CONFIG.speed,
        r: CONFIG.radius + Math.random() * 1.2,
      };
    }

    function init() {
      resize();
      particles = Array.from({ length: CONFIG.count }, createParticle);
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // Update + wrap
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10;
        if (p.y > H + 10) p.y = -10;
      });

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONFIG.connectDist) {
            const alpha = CONFIG.lineAlpha * (1 - dist / CONFIG.connectDist);
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${CONFIG.color}, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw dots
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${CONFIG.color}, ${CONFIG.dotAlpha})`;
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    }

    // Pause when off-screen for performance
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { if (!raf) raf = requestAnimationFrame(draw); }
        else { cancelAnimationFrame(raf); raf = null; }
      });
    });
    observer.observe(canvas);

    window.addEventListener('resize', () => {
      resize();
      particles = Array.from({ length: CONFIG.count }, createParticle);
    }, { passive: true });

    // Mouse interaction — attract nearby particles
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      particles.forEach((p) => {
        const dx = mx - p.x;
        const dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          p.vx += dx * 0.0002;
          p.vy += dy * 0.0002;
          // clamp speed
          const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          if (spd > 1.5) { p.vx = (p.vx / spd) * 1.5; p.vy = (p.vy / spd) * 1.5; }
        }
      });
    }, { passive: true });

    init();
    raf = requestAnimationFrame(draw);
  }

  /* ════════════════════════════════════════════
     3. ANIMATED STAT COUNTERS
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
     4. HIDDEN TERMINAL EASTER EGG
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

  /* ── Init all features ── */
  initBootLoader();
  initParticles();
  initCounters();
  initTerminal();

})();
