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

  /* The toggle itself is wired in hero.js, which animates the change
     as a circular wipe. This file only restores the saved choice. */

  /* ---------- sticky header border ---------- */
  var header = document.querySelector('.site-header');
  var scan = document.querySelector('.scan i');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('stuck', window.scrollY > 8);

      if (scan) {
        // read position as a fraction of the drawing, like a dimension
        var max = document.documentElement.scrollHeight - window.innerHeight;
        var p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
        scan.style.transform = 'scaleX(' + p + ')';
      }
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

  /* ---------- whole-card click -> project page ----------
     The card isn't wrapped in an <a> because it contains its own links
     (itch.io, trailers) and nested anchors are invalid HTML. Instead the
     card carries data-href and we navigate on click, unless the click
     landed on a real link or the user is selecting text. */
  document.addEventListener('click', function (e) {
    var card = e.target.closest ? e.target.closest('[data-href]') : null;
    if (!card) return;
    if (e.target.closest('a, button')) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    var sel = window.getSelection && window.getSelection();
    if (sel && String(sel).length > 0) return;
    window.location.href = card.getAttribute('data-href');
  });

  /* keyboard access for the same cards */
  Array.prototype.forEach.call(document.querySelectorAll('[data-href]'), function (card) {
    card.style.cursor = 'pointer';
  });

  /* ---------- cover videos ----------
     Playback is native: the markup carries autoplay + muted + loop +
     playsinline, so the covers run even if this script never executes.
     JS is only an optimisation on top — pause what's offscreen, and
     stand down entirely when the visitor prefers reduced motion. */
  var covers = document.querySelectorAll('video.cover-media');

  if (covers.length) {
    var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (still) {
      Array.prototype.forEach.call(covers, function (v) {
        v.removeAttribute('autoplay');
        v.autoplay = false;
        try { v.pause(); v.currentTime = 0; } catch (e) { /* ignore */ }
      });
    } else if ('IntersectionObserver' in window) {
      var vio = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var v = entry.target;
          if (entry.isIntersecting) {
            var pr = v.play();
            if (pr && pr.catch) pr.catch(function () {});
          } else if (!v.paused) {
            v.pause();
          }
        });
      }, { rootMargin: '200px 0px', threshold: 0.01 });
      Array.prototype.forEach.call(covers, function (v) { vio.observe(v); });
    }
  }

  /* ---------- footer year ---------- */
  var y = new Date().getFullYear();
  Array.prototype.forEach.call(document.querySelectorAll('#year, #year2'), function (el) {
    el.textContent = y;
  });
})();
