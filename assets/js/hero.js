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
     3. AutoCAD cursor — full-viewport crosshair with a pickbox at
        the intersection, and a coordinate readout pinned bottom
        left like the status bar.

        Only on a fine pointer, never on touch, never with reduced
        motion. The native cursor is hidden only once ours is
        actually on screen, and restored whenever the pointer
        leaves the window or the tab is hidden — so you can never
        end up with no cursor at all.
     --------------------------------------------------------- */
  function cadCursor() {
    if (REDUCED) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    var el = document.createElement('div');
    el.className = 'cad';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<span class="cad-v"></span><span class="cad-h"></span>' +
                   '<span class="cad-box"></span>';
    document.body.appendChild(el);

    var readout = document.createElement('div');
    readout.className = 'cad-read';
    readout.setAttribute('aria-hidden', 'true');
    readout.innerHTML = '<span class="cr-xy">0, 0</span>' +
                        '<span class="cr-sep"></span>' +
                        '<span class="cr-hint">SNAP</span>';
    document.body.appendChild(readout);

    var v = el.querySelector('.cad-v'),
        h = el.querySelector('.cad-h'),
        box = el.querySelector('.cad-box'),
        xy = readout.querySelector('.cr-xy'),
        hint = readout.querySelector('.cr-hint');

    var raf = null, mx = 0, my = 0, live = false;

    function show(on) {
      live = on;
      el.classList.toggle('on', on);
      readout.classList.toggle('on', on);
      document.body.classList.toggle('cad-on', on);
    }

    function draw() {
      raf = null;
      v.style.transform = 'translateX(' + mx + 'px)';
      h.style.transform = 'translateY(' + my + 'px)';
      box.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
      xy.textContent = Math.round(mx) + ', ' + Math.round(my + window.scrollY);
    }

    document.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      mx = e.clientX; my = e.clientY;
      if (!live) show(true);
      if (!raf) raf = requestAnimationFrame(draw);

      // the pickbox reacts to what is under it, the way AutoCAD's does
      var t = e.target;
      var over = t && t.closest && t.closest('a, button, [data-href], .chip, .demo-again');
      el.classList.toggle('pick', !!over);
      hint.textContent = over ? 'SELECT' : 'SNAP';
    }, { passive: true });

    // never strand the visitor without a cursor
    document.addEventListener('pointerleave', function () { show(false); });
    window.addEventListener('blur', function () { show(false); });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) show(false);
    });
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

  /* A pen plotter draws a sheet in one pass. The new theme is
     revealed behind a travelling edge rather than expanding out of
     the button — same API, but the motion belongs to the drawing
     rather than to the widget.

     The pen line itself is CSS: on the View Transitions path a
     drop-shadow on the clipped snapshot traces the reveal edge
     (normal DOM can't paint above those pseudo-elements), and on
     the fallback path it rides the wipe panel's own edge. */
  var SWEEP = 720;

  /* Phones sit this one out. A View Transition snapshots the whole
     page, and on mobile the visual viewport moves under it while the
     browser's own toolbars collapse and expand — so the sweep showed
     up as the page nudging sideways and settling back. The theme is
     what the visitor asked for; the flourish is optional. */
  function sweepWorthIt() {
    return window.matchMedia('(min-width: 760px)').matches &&
           window.matchMedia('(pointer: fine)').matches;
  }

  function wipeTo(next) {
    if (REDUCED || !sweepWorthIt()) { applyTheme(next); return; }

    if (!document.startViewTransition) { fallbackSweep(next); return; }

    var vt = document.startViewTransition(function () { applyTheme(next); });
    vt.ready.then(function () {
      root.animate(
        { clipPath: ['inset(0 100% 0 0)', 'inset(0 0 0 0)'] },
        { duration: SWEEP, easing: 'cubic-bezier(.62,.02,.34,1)',
          pseudoElement: '::view-transition-new(root)' }
      );
    }).catch(function () { /* transition skipped — theme still applied */ });
  }

  /* No View Transitions: a panel in the incoming colour wipes across,
     the theme flips underneath it, then it wipes off the far side. */
  function fallbackSweep(next) {
    var panel = document.createElement('span');
    panel.className = 'theme-wipe';
    panel.dataset.to = next;
    document.body.appendChild(panel);

    panel.animate(
      { transform: ['translateX(-100%)', 'translateX(0%)'] },
      { duration: SWEEP * 0.55, easing: 'cubic-bezier(.62,.02,.34,1)', fill: 'forwards' }
    ).finished.then(function () {
      applyTheme(next);
      return panel.animate(
        { transform: ['translateX(0%)', 'translateX(100%)'] },
        { duration: SWEEP * 0.55, easing: 'cubic-bezier(.62,.02,.34,1)', fill: 'forwards' }
      ).finished;
    }).then(function () { panel.remove(); })
      .catch(function () { applyTheme(next); panel.remove(); });
  }

  function wireToggle() {
    var btn = document.getElementById('themeToggle');
    if (!btn) return;
    // hero.js owns the toggle; main.js only sets the initial value
    btn.addEventListener('click', function () {
      wipeTo(currentTheme() === 'dark' ? 'light' : 'dark');
    });
  }

  /* ---------------------------------------------------------- */

  function boot() {
    splitName();
    wireToggle();
    cadCursor();
    // let the first paint settle before starting, so the animation
    // doesn't compete with layout and font loading
    requestAnimationFrame(function () { requestAnimationFrame(intro); });
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', boot)
    : boot();
})();
