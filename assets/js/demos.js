/* ============================================================
   Live algorithm demos.
   Vanilla canvas, no libraries. Each <canvas data-demo="..."> is
   picked up automatically.

     parcellation  — recursive site subdivision into land parcels
     flowfield     — multi-agent pathfinding over a flow field
     seamcarve     — content-aware image resizing

   All three pause when scrolled out of view and render a single
   static frame when the visitor prefers reduced motion.
   ============================================================ */

(function () {
  'use strict';

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- shared helpers ---------- */

  function palette() {
    var cs = getComputedStyle(document.documentElement);
    var v = function (n, f) { return (cs.getPropertyValue(n) || f).trim(); };
    return {
      bg:     v('--bg-alt', '#f3f3f1'),
      line:   v('--line', '#e3e3df'),
      soft:   v('--line-soft', '#ececE8'),
      dim:    v('--text-dim', '#8a8a94'),
      text:   v('--text', '#16161a'),
      accent: v('--accent', '#b4532a')
    };
  }

  function fitCanvas(cv) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var r = cv.getBoundingClientRect();
    var w = Math.max(1, Math.round(r.width));
    var h = Math.max(1, Math.round(r.height));
    if (cv.width !== w * dpr || cv.height !== h * dpr) {
      cv.width = w * dpr; cv.height = h * dpr;
    }
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: w, h: h };
  }

  /* Drives a demo: rAF loop, visibility pause, theme + resize redraw. */
  function mount(cv, demo) {
    var running = false, raf = null, last = 0;

    function frame(t) {
      if (!running) return;
      var dt = Math.min((t - last) || 16, 50);
      last = t;
      demo.step(dt);
      demo.draw();
      raf = requestAnimationFrame(frame);
    }
    function start() {
      if (running || REDUCED) return;
      running = true; last = performance.now();
      raf = requestAnimationFrame(frame);
    }
    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    }
    function reset() {
      var g = fitCanvas(cv);
      demo.init(g.w, g.h, palette());
      demo.draw();
    }

    demo._reset = reset;

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { e.isIntersecting ? start() : stop(); });
      }, { threshold: 0.05 }).observe(cv);
    } else { start(); }

    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt); rt = setTimeout(reset, 160);
    });

    // redraw on theme change so the demo matches light/dark
    new MutationObserver(reset).observe(document.documentElement,
      { attributes: true, attributeFilter: ['data-theme'] });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener
      && window.matchMedia('(prefers-color-scheme: dark)')
           .addEventListener('change', reset);

    reset();
    return { reset: reset };
  }

  /* ---------- geometry ---------- */

  function area(p) {
    var a = 0;
    for (var i = 0, n = p.length; i < n; i++) {
      var q = p[(i + 1) % n];
      a += p[i][0] * q[1] - q[0] * p[i][1];
    }
    return Math.abs(a) / 2;
  }

  function centroid(p) {
    var x = 0, y = 0;
    for (var i = 0; i < p.length; i++) { x += p[i][0]; y += p[i][1]; }
    return [x / p.length, y / p.length];
  }

  /* Sutherland–Hodgman: keep the half-plane where dot(pt - o, n) >= 0 */
  function clipHalf(poly, o, n) {
    var out = [];
    for (var i = 0; i < poly.length; i++) {
      var a = poly[i], b = poly[(i + 1) % poly.length];
      var da = (a[0] - o[0]) * n[0] + (a[1] - o[1]) * n[1];
      var db = (b[0] - o[0]) * n[0] + (b[1] - o[1]) * n[1];
      if (da >= 0) out.push(a);
      if ((da >= 0) !== (db >= 0)) {
        var t = da / (da - db);
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      }
    }
    return out;
  }

  function shrink(poly, d) {
    var c = centroid(poly);
    return poly.map(function (p) {
      var dx = p[0] - c[0], dy = p[1] - c[1];
      var L = Math.hypot(dx, dy) || 1;
      var s = Math.max(0, L - d) / L;
      return [c[0] + dx * s, c[1] + dy * s];
    });
  }

  /* In-canvas caption. Suppressed on small canvases (a card thumbnail),
     where it is unreadable and collides with the corner tags. */
  function caption(ctx, w, h, C, text) {
    if (w < 420) return;
    ctx.fillStyle = C.dim;
    ctx.font = '10px ui-monospace, monospace';
    ctx.fillText(text, 10, h - 10);
  }

  function tracePoly(ctx, poly) {
    ctx.beginPath();
    ctx.moveTo(poly[0][0], poly[0][1]);
    for (var i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0], poly[i][1]);
    ctx.closePath();
  }

  /* ============================================================
     1. PARCELLATION
     Recursively splits a site boundary across its long axis until
     every parcel is under a target area. The gaps left between
     parcels are the road network.
     ============================================================ */

  function Parcellation() {
    var W, H, C, polys, minArea, timer, done, pad;

    this.init = function (w, h, col) {
      W = w; H = h; C = col;
      pad = Math.max(10, Math.min(w, h) * 0.08);
      var jitter = function (v) { return v + (Math.random() - 0.5) * pad * 0.6; };
      polys = [[
        [jitter(pad), jitter(pad)],
        [jitter(W - pad), jitter(pad * 1.4)],
        [jitter(W - pad * 1.2), jitter(H - pad)],
        [jitter(pad * 1.3), jitter(H - pad * 0.9)]
      ]];
      minArea = (W * H) / 26;
      timer = 0; done = false;
    };

    function split() {
      // take the largest parcel still above target
      var bi = -1, best = 0;
      for (var i = 0; i < polys.length; i++) {
        var a = area(polys[i]);
        if (a > best) { best = a; bi = i; }
      }
      if (bi < 0 || best < minArea) { done = true; return; }

      var poly = polys[bi];
      // long axis = the most separated pair of vertices
      var p0, p1, md = -1;
      for (var i2 = 0; i2 < poly.length; i2++) {
        for (var j = i2 + 1; j < poly.length; j++) {
          var d = Math.hypot(poly[i2][0] - poly[j][0], poly[i2][1] - poly[j][1]);
          if (d > md) { md = d; p0 = poly[i2]; p1 = poly[j]; }
        }
      }
      var ax = p1[0] - p0[0], ay = p1[1] - p0[1];
      var L = Math.hypot(ax, ay) || 1;
      var n = [ax / L, ay / L];                 // cut normal = long axis
      var c = centroid(poly);
      var off = (Math.random() - 0.5) * md * 0.18;   // off-centre cut
      var o = [c[0] + n[0] * off, c[1] + n[1] * off];

      var a1 = clipHalf(poly, o, n);
      var a2 = clipHalf(poly, o, [-n[0], -n[1]]);
      if (a1.length < 3 || a2.length < 3) { done = true; return; }
      polys.splice(bi, 1, a1, a2);
    }

    this.step = function (dt) {
      if (done) {
        timer += dt;
        if (timer > 2600) this._reset();   // restart the whole run
        return;
      }
      timer += dt;
      if (timer > 260) { timer = 0; split(); }
    };

    this.draw = function () {
      var g = fitCanvas(this.cv), ctx = g.ctx;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);

      var gap = Math.max(1.5, Math.min(W, H) * 0.012);
      for (var i = 0; i < polys.length; i++) {
        var p = shrink(polys[i], gap);
        if (p.length < 3) continue;
        tracePoly(ctx, p);
        ctx.fillStyle = C.soft;
        ctx.fill();
        ctx.strokeStyle = C.dim;
        ctx.globalAlpha = 0.45;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // outline the original site boundary
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = C.dim;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.5;
      ctx.strokeRect(2, 2, W - 4, H - 4);
      ctx.globalAlpha = 1;
      ctx.setLineDash([]);

      caption(ctx, W, H, C, polys.length + ' parcels');
    };
    this._reset = function () {};
  }

  /* ============================================================
     2. FLOW FIELD PATHFINDING
     One Dijkstra sweep from the goal builds an integration field;
     every agent then just reads its cell's gradient. Cost is O(grid)
     once, not O(agents x path).
     ============================================================ */

  function FlowField() {
    var W, H, C, cols, rows, cs, obs, cost, flow, agents, goal, timer;

    this.init = function (w, h, col) {
      W = w; H = h; C = col;
      cs = Math.max(10, Math.round(Math.min(w, h) / 16));
      cols = Math.ceil(w / cs); rows = Math.ceil(h / cs);

      obs = new Uint8Array(cols * rows);
      // a few rectangular blocks, kept off the edges
      var blocks = 3 + ((Math.random() * 3) | 0);
      for (var b = 0; b < blocks; b++) {
        var bw = 2 + ((Math.random() * 3) | 0), bh = 2 + ((Math.random() * 4) | 0);
        var bx = 1 + ((Math.random() * (cols - bw - 2)) | 0);
        var by = 1 + ((Math.random() * (rows - bh - 2)) | 0);
        for (var y = by; y < by + bh; y++)
          for (var x = bx; x < bx + bw; x++) obs[y * cols + x] = 1;
      }

      goal = [cols - 2, (rows / 2) | 0];
      if (obs[goal[1] * cols + goal[0]]) obs[goal[1] * cols + goal[0]] = 0;

      agents = [];
      for (var i = 0; i < 46; i++) agents.push(spawn());
      compute();
      timer = 0;
    };

    function spawn() {
      var x, y, g;
      do {
        x = Math.random() * cs * 3 + cs * 0.5;
        y = Math.random() * (H - cs) + cs * 0.5;
        g = cell(x, y);
      } while (g < 0 || obs[g]);
      return { x: x, y: y, vx: 0, vy: 0 };
    }

    function cell(x, y) {
      var cx = (x / cs) | 0, cy = (y / cs) | 0;
      if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) return -1;
      return cy * cols + cx;
    }

    /* Dijkstra over the grid, diagonals cost sqrt(2) */
    function compute() {
      var n = cols * rows;
      cost = new Float32Array(n).fill(Infinity);
      flow = new Float32Array(n * 2);
      var gi = goal[1] * cols + goal[0];
      cost[gi] = 0;

      // bucket queue is overkill here; a simple sorted frontier is fine
      var q = [gi], head = 0;
      while (head < q.length) {
        var ci = q[head++];
        var cx = ci % cols, cy = (ci / cols) | 0;
        for (var dy = -1; dy <= 1; dy++) {
          for (var dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            var nx = cx + dx, ny = cy + dy;
            if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
            var ni = ny * cols + nx;
            if (obs[ni]) continue;
            // don't cut corners through diagonal gaps
            if (dx && dy && (obs[cy * cols + nx] || obs[ny * cols + cx])) continue;
            var step = (dx && dy) ? 1.414 : 1;
            var nc = cost[ci] + step;
            if (nc < cost[ni]) { cost[ni] = nc; q.push(ni); }
          }
        }
      }

      // gradient: point at the cheapest reachable neighbour
      for (var i = 0; i < n; i++) {
        if (obs[i] || !isFinite(cost[i])) continue;
        var x0 = i % cols, y0 = (i / cols) | 0, bc = cost[i], bx = 0, by = 0;
        for (var b = -1; b <= 1; b++) {
          for (var a = -1; a <= 1; a++) {
            if (!a && !b) continue;
            var mx = x0 + a, my = y0 + b;
            if (mx < 0 || my < 0 || mx >= cols || my >= rows) continue;
            var mi = my * cols + mx;
            if (obs[mi] || !isFinite(cost[mi])) continue;
            if (cost[mi] < bc) { bc = cost[mi]; bx = a; by = b; }
          }
        }
        var L = Math.hypot(bx, by) || 1;
        flow[i * 2] = bx / L; flow[i * 2 + 1] = by / L;
      }
    }

    this.step = function (dt) {
      var f = Math.min(dt / 16, 2);
      timer += dt;
      if (timer > 5200) {          // move the goal, re-solve
        timer = 0;
        do {
          goal = [(Math.random() * (cols - 2) | 0) + 1, (Math.random() * (rows - 2) | 0) + 1];
        } while (obs[goal[1] * cols + goal[0]]);
        compute();
      }

      for (var i = 0; i < agents.length; i++) {
        var A = agents[i], ci = cell(A.x, A.y);
        if (ci < 0) { agents[i] = spawn(); continue; }

        var fx = flow[ci * 2], fy = flow[ci * 2 + 1];

        // separation: push away from close neighbours
        var sx = 0, sy = 0;
        for (var j = 0; j < agents.length; j++) {
          if (j === i) continue;
          var dx = A.x - agents[j].x, dy = A.y - agents[j].y;
          var d2 = dx * dx + dy * dy;
          if (d2 < 180 && d2 > 0.01) { sx += dx / d2; sy += dy / d2; }
        }

        A.vx += (fx * 0.42 + sx * 2.6 - A.vx * 0.12) * f;
        A.vy += (fy * 0.42 + sy * 2.6 - A.vy * 0.12) * f;
        var sp = Math.hypot(A.vx, A.vy), max = 1.5;
        if (sp > max) { A.vx = A.vx / sp * max; A.vy = A.vy / sp * max; }
        A.x += A.vx * f; A.y += A.vy * f;

        var gx = goal[0] * cs + cs / 2, gy = goal[1] * cs + cs / 2;
        if (Math.hypot(A.x - gx, A.y - gy) < cs * 0.7) agents[i] = spawn();
        if (A.x < 0 || A.y < 0 || A.x > W || A.y > H) agents[i] = spawn();
      }
    };

    this.draw = function () {
      var g = fitCanvas(this.cv), ctx = g.ctx;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);

      // obstacles, hatched like poché
      ctx.strokeStyle = C.line; ctx.lineWidth = 1;
      for (var i = 0; i < obs.length; i++) {
        if (!obs[i]) continue;
        var x = (i % cols) * cs, y = ((i / cols) | 0) * cs;
        ctx.fillStyle = C.soft;
        ctx.fillRect(x, y, cs, cs);
        ctx.beginPath();
        ctx.moveTo(x, y + cs); ctx.lineTo(x + cs, y);
        ctx.globalAlpha = 0.7; ctx.stroke(); ctx.globalAlpha = 1;
      }

      // goal
      var gx = goal[0] * cs + cs / 2, gy = goal[1] * cs + cs / 2;
      ctx.strokeStyle = C.accent; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(gx, gy, cs * 0.42, 0, 6.2832); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(gx - cs * 0.6, gy); ctx.lineTo(gx + cs * 0.6, gy);
      ctx.moveTo(gx, gy - cs * 0.6); ctx.lineTo(gx, gy + cs * 0.6);
      ctx.stroke();

      // agents
      ctx.fillStyle = C.text;
      for (var a = 0; a < agents.length; a++) {
        var A = agents[a];
        ctx.beginPath(); ctx.arc(A.x, A.y, 2, 0, 6.2832); ctx.fill();
      }

      caption(ctx, W, H, C, agents.length + ' agents \u00b7 1 field solve');
    };
    this._reset = function () {};
  }

  /* ============================================================
     3. SEAM CARVING
     Sobel energy map, then dynamic programming finds the lowest
     energy top-to-bottom seam. Remove, repeat. The synthetic image
     is generated so the demo carries no image payload.
     ============================================================ */

  function SeamCarve() {
    var W, H, C, iw, ih, px, work, ww, timer, seam, phase;

    this.init = function (w, h, col) {
      W = w; H = h; C = col;
      iw = 160; ih = Math.max(60, Math.round(iw * h / w));
      px = new Float32Array(iw * ih * 3);

      /* Procedural image, deliberately in the site's own muted range rather
         than random hues. Subjects get hard edges so they read as high
         energy — that's what makes the seams visibly route around them
         instead of wandering through the middle. */
      var TONES = [
        [0.71, 0.33, 0.17],   // terracotta
        [0.29, 0.34, 0.42],   // slate
        [0.52, 0.55, 0.44],   // olive grey
        [0.85, 0.72, 0.52]    // sand
      ];
      var shapes = [];
      for (var b = 0; b < 3; b++) {
        shapes.push({
          x: iw * (0.22 + Math.random() * 0.56),
          y: ih * (0.22 + Math.random() * 0.56),
          r: Math.min(iw, ih) * (0.14 + Math.random() * 0.13),
          c: TONES[(Math.random() * TONES.length) | 0],
          box: Math.random() < 0.4
        });
      }
      for (var y = 0; y < ih; y++) {
        for (var x = 0; x < iw; x++) {
          var i = (y * iw + x) * 3;
          var t = x / iw, u = y / ih;
          // warm neutral wash
          var r = 0.90 - u * 0.10, g = 0.89 - u * 0.11, bl = 0.87 - u * 0.09;
          r += (t - 0.5) * 0.03; bl -= (t - 0.5) * 0.04;

          for (var k = 0; k < shapes.length; k++) {
            var S = shapes[k], m;
            if (S.box) {
              var inside = Math.abs(x - S.x) < S.r && Math.abs(y - S.y) < S.r * 0.8;
              m = inside ? 1 : 0;
            } else {
              var d = Math.hypot(x - S.x, y - S.y);
              m = d < S.r ? 1 : 0;
              if (d >= S.r && d < S.r + 1.2) m = (S.r + 1.2 - d) / 1.2;  // 1px feather
            }
            if (m > 0) {
              r += (S.c[0] - r) * m; g += (S.c[1] - g) * m; bl += (S.c[2] - bl) * m;
            }
          }
          var n = (Math.random() - 0.5) * 0.012;
          px[i] = r + n; px[i + 1] = g + n; px[i + 2] = bl + n;
        }
      }
      work = px.slice(); ww = iw;
      timer = 0; seam = null; phase = 0;
    };

    function energy() {
      var e = new Float32Array(ww * ih);
      for (var y = 0; y < ih; y++) {
        for (var x = 0; x < ww; x++) {
          var xl = Math.max(0, x - 1), xr = Math.min(ww - 1, x + 1);
          var yu = Math.max(0, y - 1), yd = Math.min(ih - 1, y + 1);
          var s = 0;
          for (var c = 0; c < 3; c++) {
            var gx = work[(y * ww + xr) * 3 + c] - work[(y * ww + xl) * 3 + c];
            var gy = work[(yd * ww + x) * 3 + c] - work[(yu * ww + x) * 3 + c];
            s += gx * gx + gy * gy;
          }
          e[y * ww + x] = Math.sqrt(s);
        }
      }
      return e;
    }

    function findSeam() {
      var e = energy();
      var M = new Float32Array(ww * ih);
      var back = new Int8Array(ww * ih);
      for (var x = 0; x < ww; x++) M[x] = e[x];
      for (var y = 1; y < ih; y++) {
        for (var x2 = 0; x2 < ww; x2++) {
          var best = M[(y - 1) * ww + x2], bd = 0;
          if (x2 > 0 && M[(y - 1) * ww + x2 - 1] < best) { best = M[(y - 1) * ww + x2 - 1]; bd = -1; }
          if (x2 < ww - 1 && M[(y - 1) * ww + x2 + 1] < best) { best = M[(y - 1) * ww + x2 + 1]; bd = 1; }
          M[y * ww + x2] = e[y * ww + x2] + best;
          back[y * ww + x2] = bd;
        }
      }
      var bx = 0, bv = Infinity;
      for (var x3 = 0; x3 < ww; x3++) {
        if (M[(ih - 1) * ww + x3] < bv) { bv = M[(ih - 1) * ww + x3]; bx = x3; }
      }
      var s = new Int32Array(ih);
      for (var y2 = ih - 1; y2 >= 0; y2--) { s[y2] = bx; bx += back[y2 * ww + bx]; }
      return s;
    }

    function removeSeam(s) {
      var out = new Float32Array((ww - 1) * ih * 3);
      for (var y = 0; y < ih; y++) {
        var o = 0;
        for (var x = 0; x < ww; x++) {
          if (x === s[y]) continue;
          for (var c = 0; c < 3; c++)
            out[(y * (ww - 1) + o) * 3 + c] = work[(y * ww + x) * 3 + c];
          o++;
        }
      }
      work = out; ww--;
    }

    this.step = function (dt) {
      timer += dt;
      if (phase === 0) {                 // show the seam we're about to cut
        if (timer > 130) {
          timer = 0;
          if (ww < iw * 0.55) { this._reset(); return; }
          seam = findSeam(); phase = 1;
        }
      } else {                           // cut it
        if (timer > 90) { timer = 0; removeSeam(seam); seam = null; phase = 0; }
      }
    };

    this.draw = function () {
      var g = fitCanvas(this.cv), ctx = g.ctx;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);

      var scale = Math.min(W / iw, H / ih);
      var dw = ww * scale, dh = ih * scale;
      var ox = (W - dw) / 2, oy = (H - dh) / 2;

      var img = ctx.createImageData(ww, ih);
      for (var i = 0; i < ww * ih; i++) {
        img.data[i * 4]     = Math.max(0, Math.min(255, work[i * 3] * 255));
        img.data[i * 4 + 1] = Math.max(0, Math.min(255, work[i * 3 + 1] * 255));
        img.data[i * 4 + 2] = Math.max(0, Math.min(255, work[i * 3 + 2] * 255));
        img.data[i * 4 + 3] = 255;
      }
      // stage through an offscreen canvas so we can scale it up
      var off = document.createElement('canvas');
      off.width = ww; off.height = ih;
      off.getContext('2d').putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, ox, oy, dw, dh);

      if (seam) {
        ctx.strokeStyle = C.accent;
        ctx.lineWidth = Math.max(1, scale);
        ctx.beginPath();
        for (var y = 0; y < ih; y++) {
          var sx = ox + (seam[y] + 0.5) * scale, sy = oy + (y + 0.5) * scale;
          y ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy);
        }
        ctx.stroke();
      }

      ctx.strokeStyle = C.line; ctx.lineWidth = 1;
      ctx.strokeRect(ox, oy, dw, dh);

      caption(ctx, W, H, C, ww + ' \u00d7 ' + ih + '  (' + Math.round(ww / iw * 100) + '%)');
    };
    this._reset = function () {};
  }

  /* ---------- boot ---------- */

  var KINDS = {
    parcellation: Parcellation,
    flowfield: FlowField,
    seamcarve: SeamCarve
  };

  function boot() {
    var nodes = document.querySelectorAll('canvas[data-demo]');
    Array.prototype.forEach.call(nodes, function (cv) {
      var Kind = KINDS[cv.getAttribute('data-demo')];
      if (!Kind) return;
      var demo = new Kind();
      demo.cv = cv;
      var handle = mount(cv, demo);

      var wrap = cv.closest('.demo');
      var btn = wrap && wrap.querySelector('.demo-again');
      if (btn) btn.addEventListener('click', function () { handle.reset(); });
    });
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', boot)
    : boot();
})();
