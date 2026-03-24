/* ── EC2IT Main JS ── */

(function () {
  'use strict';

  /* ════════════════════════════════════════════
     1. PREMIUM BRAND LOADER
  ════════════════════════════════════════════ */
  function initPremiumLoader() {
    const loader = document.getElementById('site-loader');
    if (!loader) return;

    // Skip on repeat visits within the same session
    if (sessionStorage.getItem('ec2it_loaded')) {
      loader.style.display = 'none';
      return;
    }

    // Lock scroll while loader is active
    document.body.style.overflow = 'hidden';

    // Phase 1 — tiny delay so first paint is not blocked, then start ring + progress bar
    setTimeout(() => {
      loader.classList.add('progress');
    }, 80);

    // Phase 2 — reveal: fade content then slide panels apart
    function reveal() {
      sessionStorage.setItem('ec2it_loaded', '1');
      document.body.style.overflow = '';
      loader.classList.add('reveal');
      // Remove from DOM after transition finishes so it no longer intercepts events
      setTimeout(() => {
        loader.style.display = 'none';
      }, 1000);
    }

    // Auto-reveal after ring fills (1.5 s progress + small buffer)
    const autoTimer = setTimeout(reveal, 1900);

    // Allow skipping by click or any key (except F12)
    function skip() {
      clearTimeout(autoTimer);
      reveal();
    }
    loader.addEventListener('click', skip);
    document.addEventListener('keydown', function onKey(e) {
      if (e.key !== 'F12') { skip(); document.removeEventListener('keydown', onKey); }
    });
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

  /* ── Init all features ── */
  initPremiumLoader();
  initCounters();
  initTerminal();

})();
