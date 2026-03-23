/* ── EC2IT Main JS ── */

(function () {
  'use strict';

  /* ── Scroll-triggered fade-ins ── */
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

  /* ── Nav scroll shadow ── */
  const nav = document.querySelector('nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });
  }

  /* ── FAQ accordion ── */
  document.querySelectorAll('.faq-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach((i) => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });

  /* ── Mobile hamburger ── */
  const hamburger = document.querySelector('.nav-hamburger');
  const mobileMenu = document.querySelector('.nav-mobile');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const open = hamburger.classList.toggle('open');
      mobileMenu.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    // Close on link click
    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ── Active nav link (scroll spy, index only) ── */
  const navLinks = document.querySelectorAll('.nav-center a[href^="#"]');
  if (navLinks.length) {
    const sections = Array.from(navLinks)
      .map((a) => document.querySelector(a.getAttribute('href')))
      .filter(Boolean);

    window.addEventListener('scroll', () => {
      let current = '';
      sections.forEach((s) => {
        if (window.scrollY >= s.offsetTop - 120) current = s.id;
      });
      navLinks.forEach((a) => {
        a.classList.toggle('active', a.getAttribute('href') === '#' + current);
      });
    }, { passive: true });
  }

  /* ── Contact form ── */
  const form = document.getElementById('contact-form');
  if (form) {
    const successMsg = document.getElementById('form-success');

    function validateField(field) {
      const group = field.closest('.form-group');
      if (!group) return true;
      const errEl = group.querySelector('.form-error');
      let valid = true;
      let msg = '';

      if (field.required && !field.value.trim()) {
        valid = false;
        msg = 'This field is required.';
      } else if (field.type === 'email' && field.value.trim()) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!re.test(field.value.trim())) { valid = false; msg = 'Please enter a valid email address.'; }
      } else if (field.name === 'phone' && field.value.trim()) {
        const re = /^[\d\s+\-().]{7,}$/;
        if (!re.test(field.value.trim())) { valid = false; msg = 'Please enter a valid phone number.'; }
      }

      field.classList.toggle('error', !valid);
      if (errEl) {
        errEl.textContent = msg;
        errEl.classList.toggle('visible', !valid);
      }
      return valid;
    }

    // Live validation on blur
    form.querySelectorAll('input, textarea, select').forEach((f) => {
      f.addEventListener('blur', () => validateField(f));
      f.addEventListener('input', () => {
        if (f.classList.contains('error')) validateField(f);
      });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Honeypot check
      const hp = form.querySelector('.hp-field input');
      if (hp && hp.value) return; // likely a bot

      // Validate all fields
      const fields = form.querySelectorAll('input:not(.hp-field input), textarea, select');
      let allValid = true;
      fields.forEach((f) => { if (!validateField(f)) allValid = false; });
      if (!allValid) return;

      const submitBtn = form.querySelector('[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

      try {
        const data = new FormData(form);
        const action = form.getAttribute('action');

        if (!action || action === '#') {
          // Demo mode — simulate success
          await new Promise((r) => setTimeout(r, 800));
          form.reset();
          if (successMsg) successMsg.classList.add('visible');
          form.style.display = 'none';
        } else {
          const res = await fetch(action, {
            method: 'POST',
            body: data,
            headers: { Accept: 'application/json' },
          });
          if (res.ok) {
            form.reset();
            if (successMsg) successMsg.classList.add('visible');
            form.style.display = 'none';
          } else {
            throw new Error('Server error');
          }
        }
      } catch {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        alert('Sorry, something went wrong. Please try calling us on 020 8142 4660.');
      }
    });
  }
})();
