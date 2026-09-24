/* ============================================================
   Click-to-run WebAssembly embed.

   The build is ~400 KB over the wire, which is not something to
   inflict on someone who only came to read. So nothing loads until
   the visitor asks for it, and the poster frame carries the weight
   so the choice is informed.
   ============================================================ */

(function () {
  'use strict';

  var host = document.querySelector('[data-wasm]');
  if (!host) return;

  var base   = host.getAttribute('data-wasm');          // directory
  var name   = host.getAttribute('data-wasm-name');     // loader filename
  var expor  = host.getAttribute('data-wasm-export');   // factory function
  var btn    = host.querySelector('.wasmrun-start');
  var canvas = host.querySelector('.wasmrun-canvas');
  var status = host.querySelector('.wasmrun-status');
  var started = false;

  function say(text) { if (status) status.textContent = text; }

  function fail(text) {
    host.classList.remove('is-loading');
    host.classList.add('is-failed');
    say(text);
    if (btn) { btn.disabled = false; btn.hidden = false; }
  }

  function start() {
    if (started) return;
    started = true;

    host.classList.add('is-loading');
    if (btn) btn.hidden = true;
    say('Loading…');

    var script = document.createElement('script');
    script.src = base + name;
    script.onerror = function () { fail('Could not load the build.'); };
    script.onload = function () {
      var factory = window[expor];
      if (typeof factory !== 'function') { fail('Build loaded but did not start.'); return; }

      canvas.hidden = false;

      // The page must not scroll when the pointer is over the canvas —
      // the program uses the wheel to zoom.
      canvas.addEventListener('wheel', function (e) { e.preventDefault(); },
                              { passive: false });
      // Keyboard panning needs focus, and nobody thinks to click first.
      canvas.addEventListener('mouseenter', function () { canvas.focus(); });
      canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

      factory({
        canvas: canvas,
        locateFile: function (path) { return base + path; },
        printErr: function (t) { if (window.console) console.warn('[wasm]', t); },
        onRuntimeInitialized: function () {
          host.classList.remove('is-loading');
          host.classList.add('is-running');
          say('Running');
          canvas.focus();
        }
      }).catch(function (e) {
        fail('The build failed to start: ' + e);
      });
    };
    document.body.appendChild(script);
  }

  if (btn) btn.addEventListener('click', start);
})();
