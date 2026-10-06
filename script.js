(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Reveal on scroll */
  var items = document.querySelectorAll('.reveal');
  function show(el) {
    el.classList.add('is-in');
  }
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach(show);
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* Scroll-linked: progress bar + nine dots converging into one line */
  var hero = document.querySelector('.hero');
  var motif = document.querySelector('.motif--hero');
  var bar = document.querySelector('.progress');
  var ticking = false;

  function update() {
    ticking = false;
    var y = window.scrollY || window.pageYOffset;
    var max = Math.max(1, root.scrollHeight - window.innerHeight);
    if (y >= max - 4) document.querySelectorAll('.reveal:not(.is-in)').forEach(show);
    if (bar) bar.style.setProperty('--sp', Math.min(1, y / max).toFixed(4));
    if (motif && hero) {
      var p = reduce ? 1 : Math.min(1, Math.max(0, y / (hero.offsetHeight * 0.55)));
      motif.style.setProperty('--p', p.toFixed(4));
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();

  /* Hero button: smooth scroll to section 02 (instant when reduced motion) */
  var cta = document.querySelector('.hero .btn');
  var target = document.getElementById('recorrido');
  if (cta && target) {
    cta.addEventListener('click', function (ev) {
      ev.preventDefault();
      target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      if (history.replaceState) history.replaceState(null, '', '#recorrido');
    });
  }
})();

/* 02 — Criterio. Many strands of light, one point. Canvas/WebGL, no libraries; pauses offscreen. */
(function () {
  'use strict';
  var sec = document.getElementById('recorrido');
  var fig = sec && sec.querySelector('.beam');
  var canvas = fig && fig.querySelector('.beam__canvas');
  if (!canvas) return;
  var glow = fig.querySelector('.beam__glow'), line = fig.querySelector('.beam__line'), me = fig.querySelector('.beam__tag--me');
  var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  function reduced() { return mq.matches; }

  /* ---- point renderer: WebGL with a 2D canvas fallback ---- */
  function makeRenderer(cv, bg) {
    var gl = null;
    try { gl = cv.getContext('webgl', { alpha: false, antialias: false, depth: false, preserveDrawingBuffer: false, powerPreference: 'low-power' }); } catch (e) { gl = null; }
    if (gl) {
      var vs = 'attribute vec2 p;attribute float s;attribute float a;attribute vec3 c;uniform vec2 r;uniform float k;varying float va;varying vec3 vc;' +
        'void main(){vec2 z=p/r*2.0-1.0;gl_Position=vec4(z.x,-z.y,0.0,1.0);gl_PointSize=s*k;va=a;vc=c;}';
      var fs = 'precision mediump float;varying float va;varying vec3 vc;' +
        'void main(){vec2 q=gl_PointCoord-0.5;float d=dot(q,q)*4.0;float m=1.0-smoothstep(0.25,1.0,d);gl_FragColor=vec4(vc*va*m,1.0);}';
      var sh = function (t, src) { var o = gl.createShader(t); gl.shaderSource(o, src); gl.compileShader(o); return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null; };
      var v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs);
      var prog = v && f && gl.createProgram();
      if (prog) { gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog); }
      if (prog && gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        gl.useProgram(prog);
        var vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb);
        var at = function (n, size, off) { var l = gl.getAttribLocation(prog, n); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, size, gl.FLOAT, false, 28, off); };
        at('p', 2, 0); at('s', 1, 8); at('a', 1, 12); at('c', 3, 16);
        var ur = gl.getUniformLocation(prog, 'r'), uk = gl.getUniformLocation(prog, 'k');
        gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
        return { kind: 'gl', draw: function (buf, n, w, h, dpr) {
          gl.viewport(0, 0, cv.width, cv.height);
          gl.clearColor(bg[0], bg[1], bg[2], 1); gl.clear(gl.COLOR_BUFFER_BIT);
          gl.uniform2f(ur, w, h); gl.uniform1f(uk, dpr);
          gl.bufferData(gl.ARRAY_BUFFER, buf.subarray(0, n * 7), gl.DYNAMIC_DRAW);
          gl.drawArrays(gl.POINTS, 0, n);
        } };
      }
    }
    var ctx = cv.getContext('2d');
    var bgs = 'rgb(' + Math.round(bg[0] * 255) + ',' + Math.round(bg[1] * 255) + ',' + Math.round(bg[2] * 255) + ')';
    return { kind: '2d', draw: function (buf, n, w, h, dpr) {
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = bgs; ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (var i = 0; i < n; i++) {
        var o = i * 7, a = buf[o + 3]; if (a < 0.01) continue;
        var s = buf[o + 2] * 0.9;
        ctx.fillStyle = 'rgba(' + (buf[o + 4] * 255 | 0) + ',' + (buf[o + 5] * 255 | 0) + ',' + (buf[o + 6] * 255 | 0) + ',' + Math.min(1, a).toFixed(3) + ')';
        ctx.fillRect(buf[o] - s / 2, buf[o + 1] - s / 2, s, s);
      }
    } };
  }


  var BG = [10 / 255, 10 / 255, 10 / 255];
  var DEEP = [0.16, 0.22, 0.80], ACC = [0.486, 0.549, 1.0], PAPER = [0.93, 0.93, 0.91];
  var R = makeRenderer(canvas, BG);
  var small = window.matchMedia('(max-width: 700px)').matches;
  var S = R.kind === 'gl' ? (small ? 96 : 168) : (small ? 48 : 72);
  var M = R.kind === 'gl' ? (small ? 130 : 190) : (small ? 50 : 64);
  var ND = R.kind === 'gl' ? (small ? 900 : 2400) : 400;
  var NP = S * M + ND;
  var strands = [], P = new Float32Array(NP * 5), buf = new Float32Array(NP * 7);
  var W = 0, H = 0, DPR = 1, AX = 0, AY = 0;
  var mx = -9999, my = -9999, tmx = -9999, tmy = -9999, ms = 0, mst = 0;
  var reveal = 0, lastT = 0, raf = 0, visible = false, tapT = -99, clock = 0;

  for (var s = 0; s < S; s++) {
    var tt = s / (S - 1), lib = tt < 0.5, side = lib ? -1 : 1;
    var g = Math.abs(tt - 0.5) * 2; if (!lib) g = Math.min(1, Math.max(0, g + (Math.random() - 0.5) * 1.2 / S));
    var ge = 1 - Math.pow(1 - g, 1.7);
    strands.push({
      lib: lib, x: side * ge, g: ge,
      p: 1.45 + 1.7 * ge + (lib ? 0 : (Math.random() - 0.5) * 0.4),
      bf: 0.35 + 0.65 * Math.pow(ge, 1.6),
      amp: lib ? 0 : (4 + 18 * ge) * (0.6 + 0.4 * Math.random()),
      ph: tt * 9, dy: lib ? 0 : Math.random()
    });
  }
  var n = 0;
  for (s = 0; s < S; s++) {
    for (var j = 0; j < M; j++, n++) {
      var o = n * 5, st = strands[s];
      P[o] = s;
      P[o + 1] = st.lib ? j / M : Math.random();
      P[o + 2] = st.lib ? 0.022 : 0.03 + Math.random() * 0.05;
      P[o + 3] = st.lib ? 1.15 : 0.8 + 1.5 * Math.pow(Math.random(), 2);
      P[o + 4] = Math.random();
    }
  }
  for (; n < NP; n++) { var od = n * 5; P[od] = -1; P[od + 1] = Math.random(); P[od + 2] = Math.random(); P[od + 3] = 0.7 + Math.random() * 1.1; P[od + 4] = Math.random(); }

  function size() {
    var rc = fig.getBoundingClientRect();
    W = Math.max(1, rc.width); H = Math.max(1, rc.height);
    DPR = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    AX = W * 0.5; AY = H * (small ? 0.3 : 0.29);
    glow.style.left = AX + 'px'; glow.style.top = AY + 'px';
    line.style.left = AX + 'px'; line.style.height = AY + 'px';
    me.style.left = AX + 'px'; me.style.top = AY + 'px';
  }
  function sstep(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }

  function render(t) {
    var spread = Math.max(W * 0.62, 520), baseY = H * 1.02, q = 0, cnt = 0;
    var beat = (t % 3.2), pulse = Math.exp(-Math.pow((beat - 0.25) / 0.12, 2)) + 0.45 * Math.exp(-Math.pow((beat - 0.62) / 0.1, 2));
    var tap = Math.exp(-Math.max(0, t - tapT) * 2.2);
    var R2 = small ? 100 * 100 : 150 * 150, F = (small ? 40 : 64) * ms;
    for (var i = 0; i < NP; i++) {
      var o = i * 5, sid = P[o], seed = P[o + 4], x, y, a, c0, c1, c2, sz = P[o + 3];
      if (sid < 0) {
        x = P[o + 1] * W; y = ((P[o + 2] - t * 0.004 * (0.5 + seed)) % 1 + 1) % 1 * H;
        a = (0.05 + 0.08 * (0.5 + 0.5 * Math.sin(t * (0.5 + seed) + seed * 40))) * reveal;
        c0 = PAPER[0]; c1 = PAPER[1]; c2 = PAPER[2];
      } else {
        var st = strands[sid];
        var u = P[o + 1] + t * P[o + 2] * (1 + 2.2 * tap); u -= Math.floor(u);
        var x0 = AX + st.x * spread * 1.2;
        var f = Math.pow(u, st.p);
        x = x0 + (AX - x0) * u;
        y = baseY + st.dy * H * 0.08 + (AY - baseY - st.dy * H * 0.08) * f;
        if (st.amp) {
          var wv = Math.sin(u * 7 - t * 1.3 + st.ph) * st.amp * Math.sin(3.1416 * u) * (1 - u);
          x += wv * 0.6; y += wv;
          if (seed < 0.22) {
            var sp = Math.pow(1 - u, 1.2);
            y += ((seed * 137.7) % 1 - 0.5) * 2 * (small ? 34 : 60) * sp;
            x += ((seed * 71.3) % 1 - 0.5) * (small ? 20 : 36) * sp;
          }
        }
        a = (st.lib ? 0.42 : 0.6) * st.bf * (0.25 + 0.75 * Math.pow(u, 1.4)) * sstep(0, 0.06, u) * (1 - 0.55 * sstep(0.965, 1, u));
        if (!st.lib && seed < 0.22) a *= 0.55;
        a *= sstep(u - 0.05, u, reveal * 1.06);
        a *= 1 + (pulse * 0.9 + tap * 1.2) * sstep(0.7, 1, u);
        var m1 = sstep(0.2, 0.75, u), m2 = sstep(0.82, 0.99, u);
        if (st.lib) { c0 = PAPER[0] * (1 - m2 * 0.1) + 0.05 * m2; c1 = PAPER[1]; c2 = PAPER[2] + 0.05 * m2; }
        else {
          c0 = (DEEP[0] + (ACC[0] - DEEP[0]) * m1) * (1 - m2) + PAPER[0] * m2;
          c1 = (DEEP[1] + (ACC[1] - DEEP[1]) * m1) * (1 - m2) + PAPER[1] * m2;
          c2 = (DEEP[2] + (ACC[2] - DEEP[2]) * m1) * (1 - m2) + PAPER[2] * m2;
        }
        sz *= 1 + 0.45 * u;
      }
      if (F > 0.5) {
        var dx = x - mx, dy = y - my, d2 = dx * dx + dy * dy;
        if (d2 < R2 * 4) { var dd = Math.sqrt(d2) || 1, ex = Math.exp(-d2 / R2), push = F * ex; x += dx / dd * push; y += dy / dd * push; a *= 1 + 1.6 * ex * ms; }
      }
      if (a < 0.004 || y < -4 || y > H + 4) continue;
      q = cnt * 7;
      buf[q] = x; buf[q + 1] = y; buf[q + 2] = sz; buf[q + 3] = a; buf[q + 4] = c0; buf[q + 5] = c1; buf[q + 6] = c2; cnt++;
    }
    R.draw(buf, cnt, W, H, DPR);
    var lit = sstep(0.82, 1, reveal);
    glow.style.opacity = (lit * (0.62 + 0.3 * pulse + 0.4 * tap)).toFixed(3);
    glow.style.transform = 'scale(' + (0.92 + 0.08 * pulse + 0.12 * tap).toFixed(3) + ')';
    line.style.opacity = (lit * 0.8).toFixed(3);
    fig.classList.toggle('is-lit', lit > 0.5);
  }

  function progress() {
    var rc = fig.getBoundingClientRect(), vh = window.innerHeight || 800;
    return Math.min(1, Math.max(0, (vh - rc.top) / (vh * 0.85)));
  }
  function frame(now) {
    raf = 0;
    var r = reduced(), t = now / 1000, dt = Math.min(0.05, Math.max(0, t - lastT)); lastT = t;
    if (r) { reveal = 1; ms = 0; render(9.3); return; }
    clock += dt;
    var target = progress();
    reveal += (Math.max(reveal, target) - reveal) * (1 - Math.exp(-dt * 2.2));
    mx += (tmx - mx) * (1 - Math.exp(-dt * 10)); my += (tmy - my) * (1 - Math.exp(-dt * 10));
    ms += (mst - ms) * (1 - Math.exp(-dt * 5));
    render(clock + 4);
    if (visible && !document.hidden) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && visible) raf = requestAnimationFrame(frame); }

  function point(e) { var rc = fig.getBoundingClientRect(); tmx = e.clientX - rc.left; tmy = e.clientY - rc.top; if (mx < -999) { mx = tmx; my = tmy; } mst = 1; }
  fig.addEventListener('pointermove', point);
  fig.addEventListener('pointerdown', function (e) { point(e); tapT = clock + 4; kick(); });
  fig.addEventListener('pointerleave', function () { mst = 0; });
  fig.addEventListener('pointerup', function (e) { if (e.pointerType !== 'mouse') mst = 0; });

  size();
  if ('ResizeObserver' in window) new ResizeObserver(function () { size(); if (reduced()) kick(); }).observe(fig);
  else window.addEventListener('resize', size);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) kick(); }, { rootMargin: '100px 0px' }).observe(fig);
  } else { visible = true; kick(); }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) kick(); });
  if (mq.addEventListener) mq.addEventListener('change', kick);
})();


/* 05 — departures board: rows flip in, lamps light, touch to flip again */
(function () {
  'use strict';
  var rows = Array.prototype.slice.call(document.querySelectorAll('#avances .book__rows li'));
  if (!rows.length) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  rows.forEach(function (li) { li._name = li.querySelector('.row__name'); li._text = li._name.textContent; });

  function flip(li, delay) {
    if (li._busy) return;
    li._busy = true;
    setTimeout(function () {
      var name = li._name, text = li._text, n = text.length, start = performance.now(), dur = 520 + n * 9;
      li.classList.remove('is-set', 'is-flip'); void li.offsetWidth; li.classList.add('is-flip');
      name.setAttribute('aria-hidden', 'true');
      function step(now) {
        var t = Math.min(1, (now - start) / dur), out = '';
        for (var i = 0; i < n; i++) {
          var c = text[i];
          if (c === ' ' || t * (n + 6) > i + 6 || /[.,]/.test(c)) out += c;
          else out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
        }
        name.textContent = t < 1 ? out : text;
        if (t < 1) requestAnimationFrame(step);
        else { name.removeAttribute('aria-hidden'); li.classList.add('is-set'); li._busy = false; }
      }
      requestAnimationFrame(step);
    }, delay || 0);
  }

  if (reduce || !('IntersectionObserver' in window)) {
    rows.forEach(function (li) { li.classList.add('is-set'); });
    return;
  }
  var io = new IntersectionObserver(function (en) {
    if (en[0].isIntersecting) { io.disconnect(); rows.forEach(function (li, i) { flip(li, 150 + i * 260); }); }
  }, { threshold: 0.35 });
  io.observe(document.querySelector('#avances .book__rows'));
  rows.forEach(function (li) {
    li.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse' && li.classList.contains('is-set')) flip(li); });
    li.addEventListener('click', function () { if (li.classList.contains('is-set')) flip(li); });
    li.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(li); } });
  });
})();
