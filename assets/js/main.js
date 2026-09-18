/* Clifford Tan — portfolio. Vanilla JS, no dependencies. */

(function () {
  'use strict';

  /* ---------- theme ---------- */
  var root = document.documentElement;
  var STORE = 'ct-theme';

  try {
    var saved = localStorage.getItem(STORE);
    if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved);
  } catch (e) { /* private mode / blocked storage — fall back to OS preference */ }

  var toggle = document.getElementById('themeToggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var current = root.getAttribute('data-theme');
      if (!current) {
        current = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      var next = current === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem(STORE, next); } catch (e) { /* ignore */ }
    });
  }

  /* ---------- sticky header border ---------- */
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('stuck', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- project filters ---------- */
  var chips = document.querySelectorAll('.chip');
  var cards = document.querySelectorAll('#projectGrid .card');

  Array.prototype.forEach.call(chips, function (chip) {
    chip.addEventListener('click', function () {
      var filter = chip.getAttribute('data-filter');

      Array.prototype.forEach.call(chips, function (c) {
        c.classList.toggle('is-active', c === chip);
      });

      Array.prototype.forEach.call(cards, function (card) {
        var cats = (card.getAttribute('data-cat') || '').split(/\s+/);
        var show = filter === 'all' || cats.indexOf(filter) !== -1;
        card.classList.toggle('is-hidden', !show);
      });
    });
  });

  /* ---------- reveal on scroll ---------- */
  var reveals = document.querySelectorAll('.reveal');

  if (!('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    Array.prototype.forEach.call(reveals, function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var siblings = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
        el.style.transitionDelay = Math.min(siblings, 5) * 55 + 'ms';
        el.classList.add('in');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

    Array.prototype.forEach.call(reveals, function (el) { io.observe(el); });
  }

  /* ---------- footer year ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
