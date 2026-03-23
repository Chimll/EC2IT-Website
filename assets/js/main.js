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
     2. LIVE MONITORING PANEL
  ════════════════════════════════════════════ */
  function initMonitorPanel() {
    const panel = document.querySelector('.monitor-panel');
    if (!panel) return;

    /* ── Clock ── */
    const clockEl = document.getElementById('monitor-clock');
    function tickClock() {
      if (!clockEl) return;
      const n = new Date();
      clockEl.textContent = [n.getHours(), n.getMinutes(), n.getSeconds()]
        .map((v) => String(v).padStart(2, '0')).join(':');
    }
    tickClock();
    setInterval(tickClock, 1000);

    /* ── Pulse graph ── */
    const canvas = document.getElementById('monitor-graph');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      const BUF = 120;
      // Seed with realistic-looking traffic (mostly 20–40%, occasional spikes)
      const data = Array.from({ length: BUF }, (_, i) => {
        const base = 22 + Math.sin(i * 0.18) * 8;
        const noise = (Math.random() - 0.5) * 10;
        const spike = Math.random() < 0.06 ? Math.random() * 45 : 0;
        return Math.max(5, Math.min(95, base + noise + spike));
      });

      function resizeCanvas() {
        canvas.width = canvas.offsetWidth * window.devicePixelRatio;
        canvas.height = canvas.offsetHeight * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
      resizeCanvas();

      function drawGraph() {
        const W = canvas.offsetWidth;
        const H = canvas.offsetHeight;
        ctx.clearRect(0, 0, W, H);

        // Grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        [0.25, 0.5, 0.75].forEach((f) => {
          ctx.beginPath();
          ctx.moveTo(0, H * f);
          ctx.lineTo(W, H * f);
          ctx.stroke();
        });

        // Build path
        const step = W / (BUF - 1);
        ctx.beginPath();
        data.forEach((v, i) => {
          const x = i * step;
          const y = H - (v / 100) * H * 0.9 - H * 0.05;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });

        // Stroke
        ctx.strokeStyle = '#0057ff';
        ctx.lineWidth = 1.5;
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Fill gradient below line
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, 'rgba(0,87,255,0.2)');
        grad.addColorStop(1, 'rgba(0,87,255,0)');
        ctx.lineTo(W, H);
        ctx.lineTo(0, H);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Advance data every 300ms (feels live)
      function advanceData() {
        const last = data[data.length - 1];
        const drift = (Math.random() - 0.5) * 12;
        const spike = Math.random() < 0.04 ? Math.random() * 50 : 0;
        data.push(Math.max(5, Math.min(95, last + drift + spike)));
        data.shift();
        drawGraph();
      }
      drawGraph();
      setInterval(advanceData, 280);
      window.addEventListener('resize', () => { resizeCanvas(); drawGraph(); }, { passive: true });
    }

    /* ── Log stream ── */
    const logsEl = document.getElementById('monitor-logs');
    const LOG_POOL = [
      ['OK',   'Network check: all 500 nodes responsive'],
      ['OK',   'Backup completed — 142 GB synced to cloud'],
      ['INFO', 'VPN session opened: James.T@client.co.uk'],
      ['OK',   'Patch MS25-0291 applied to 24 endpoints'],
      ['INFO', 'Helpdesk ticket #4821 resolved in 18 min'],
      ['OK',   'Security scan: 0 threats detected'],
      ['INFO', 'M365 licence audit — 0 anomalies'],
      ['OK',   'Firewall rule updated across 12 devices'],
      ['INFO', 'Scheduled reboot: SRV-PROD-01 — no impact'],
      ['OK',   'SSL cert renewal: 90 days remaining'],
      ['INFO', '2FA enrolled: 3 new users onboarded'],
      ['OK',   'DNS check: all records healthy'],
      ['INFO', 'Asset scan: 500 devices inventoried'],
      ['OK',   'EDR signature update pushed to all endpoints'],
      ['INFO', 'Email filter: 148 spam messages quarantined'],
    ];
    let logIdx = 0;

    function addLog() {
      if (!logsEl) return;
      const [type, msg] = LOG_POOL[logIdx % LOG_POOL.length];
      logIdx++;
      const now = new Date();
      const ts = [now.getHours(), now.getMinutes(), now.getSeconds()]
        .map((v) => String(v).padStart(2, '0')).join(':');
      const cls = type === 'OK' ? 'mlog-ok' : type === 'WARN' ? 'mlog-warn' : 'mlog-info';
      const line = document.createElement('div');
      line.className = 'mlog';
      line.innerHTML = `<span class="${cls}">[${type}]</span> ${ts} ${msg}`;
      logsEl.prepend(line);
      // Keep max 4 lines
      while (logsEl.children.length > 4) logsEl.lastElementChild.remove();
    }
    // Stagger first few additions
    setTimeout(addLog, 1800);
    setTimeout(addLog, 3400);
    setInterval(addLog, 4500);

    /* ── Uptime counter ── */
    const uptimeEl = document.getElementById('monitor-uptime');
    if (uptimeEl) {
      const founded = new Date('2009-01-15');
      const diff = Date.now() - founded;
      const yrs = Math.floor(diff / (365.25 * 24 * 3600 * 1000));
      const mos = Math.floor((diff % (365.25 * 24 * 3600 * 1000)) / (30.44 * 24 * 3600 * 1000));
      uptimeEl.textContent = `${yrs}y ${mos}m`;
    }
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
  initMonitorPanel();
  initCounters();
  initTerminal();

})();
