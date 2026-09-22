/* ============================================================
   Hero intro + theme transition.

   The conceit: the page drafts itself. Grid paper, then the
   construction lines, then the name strokes in, then the
   dimension annotation is added last — the order you'd actually
   draw a title in.

   Everything degrades: without JS the hero renders in its final
   state, and prefers-reduced-motion skips straight to it too.
   ============================================================ */

(function () {
  'use strict';

  var root = document.documentElement;
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     1. Split the name into per-character spans so each one can
        be strokedelayed. The HTML keeps plain text, so search
        engines and no-JS visitors see "Clifford Tan".
     --------------------------------------------------------- */
  function splitName() {
    var h1 = document.querySelector('.hero h1');
    if (!h1 || h1.dataset.split) return;
    var text = h1.textContent.trim();
    h1.dataset.split = '1';
    h1.setAttribute('aria-label', text);

    var out = '';
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (ch === ' ') { out += '<span class="sp">&nbsp;</span>'; continue; }
      out += '<span class="ch" aria-hidden="true" style="--i:' + i + '">' + ch + '</span>';
    }
    h1.innerHTML = out;
  }

  /* ---------------------------------------------------------
     2. Run the intro. Each stage is a class on <body>; the CSS
        owns the actual timing so it can be tuned in one place.
     --------------------------------------------------------- */
  function intro() {
    if (REDUCED) { document.body.classList.add('intro-done'); return; }
    document.body.classList.add('intro-run');
    // after the longest animation, drop to a static end state so
    // nothing is left mid-transition if the tab is backgrounded
    setTimeout(function () {
      document.body.classList.add('intro-done');
    }, 2600);
  }

  /* ---------------------------------------------------------
     3. CAD crosshair — thin guides tracking the cursor, but only
        over the hero, only with a real pointer, never on touch.
     --------------------------------------------------------- */
  function crosshair() {
    if (REDUCED) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    var hero = document.querySelector('.hero');
    if (!hero) return;

    var wrap = document.createElement('div');
    wrap.className = 'xhair';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.innerHTML = '<span class="xh-v"></span><span class="xh-h"></span>' +
                     '<span class="xh-read"></span>';
    hero.appendChild(wrap);

    var v = wrap.querySelector('.xh-v'),
        h = wrap.querySelector('.xh-h'),
        read = wrap.querySelector('.xh-read');
    var raf = null, mx = 0, my = 0;

    function draw() {
      raf = null;
      var r = hero.getBoundingClientRect();
      var x = mx - r.left, y = my - r.top;
      v.style.transform = 'translateX(' + x + 'px)';
      h.style.transform = 'translateY(' + y + 'px)';
      read.style.transform = 'translate(' + (x + 12) + 'px,' + (y + 12) + 'px)';
      // read out as if it were a drawing, in millimetres
      read.textContent = Math.round(x) + ', ' + Math.round(y);
    }

    hero.addEventListener('pointermove', function (e) {
      mx = e.clientX; my = e.clientY;
      if (!raf) raf = requestAnimationFrame(draw);
    });
    hero.addEventListener('pointerenter', function () { wrap.classList.add('on'); });
    hero.addEventListener('pointerleave', function () { wrap.classList.remove('on'); });
  }

  /* ---------------------------------------------------------
     4. Theme change as a circular wipe out of the toggle.

        Uses the View Transitions API where it exists, which is
        the only way to cross-fade two full-page paints cheaply.
        Where it doesn't, an expanding overlay disc does the same
        job with one element. Reduced motion switches instantly.
     --------------------------------------------------------- */
  function currentTheme() {
    return root.getAttribute('data-theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }

  function applyTheme(next) {
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('ct-theme', next); } catch (e) { /* ignore */ }
  }

  function wipeTo(next, originEl) {
    var r = originEl.getBoundingClientRect();
    var x = r.left + r.width / 2;
    var y = r.top + r.height / 2;
    // radius needed to cover the furthest corner
    var end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

    if (REDUCED || !document.startViewTransition) {
      fallbackWipe(next, x, y, end);
      return;
    }

    var vt = document.startViewTransition(function () { applyTheme(next); });
    vt.ready.then(function () {
      root.animate(
        { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)',
                     'circle(' + end + 'px at ' + x + 'px ' + y + 'px)'] },
        { duration: 620, easing: 'cubic-bezier(.22,.61,.36,1)',
          pseudoElement: '::view-transition-new(root)' }
      );
    }).catch(function () { /* transition skipped — theme still applied */ });
  }

  /* One disc, painted in the incoming background colour, grows from
     the button. The theme flips once it has covered the viewport, so
     the switch itself is never visible. */
  function fallbackWipe(next, x, y, end) {
    if (REDUCED) { applyTheme(next); return; }

    var disc = document.createElement('span');
    disc.className = 'theme-wipe';
    disc.dataset.to = next;
    disc.style.left = x + 'px';
    disc.style.top = y + 'px';
    document.body.appendChild(disc);

    var anim = disc.animate(
      { width: ['0px', end * 2 + 'px'], height: ['0px', end * 2 + 'px'] },
      { duration: 520, easing: 'cubic-bezier(.22,.61,.36,1)', fill: 'forwards' }
    );
    anim.finished.then(function () {
      applyTheme(next);
      return disc.animate({ opacity: [1, 0] },
        { duration: 220, easing: 'ease-out', fill: 'forwards' }).finished;
    }).then(function () {
      disc.remove();
    }).catch(function () {
      applyTheme(next);
      disc.remove();
    });
  }

  function wireToggle() {
    var btn = document.getElementById('themeToggle');
    if (!btn) return;
    // hero.js owns the toggle; main.js only sets the initial value
    btn.addEventListener('click', function () {
      wipeTo(currentTheme() === 'dark' ? 'light' : 'dark', btn);
    });
  }

  /* ---------------------------------------------------------- */

  function boot() {
    splitName();
    wireToggle();
    crosshair();
    // let the first paint settle before starting, so the animation
    // doesn't compete with layout and font loading
    requestAnimationFrame(function () { requestAnimationFrame(intro); });
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', boot)
    : boot();
})();
