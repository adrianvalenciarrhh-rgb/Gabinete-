(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Split the example question into words so it can be "typed". Text content stays intact. */
  var typed = document.querySelector('.typed');
  var words = [];
  if (typed && !reduce) {
    var parts = typed.textContent.split(/(\s+)/);
    typed.textContent = '';
    parts.forEach(function (p) {
      if (/^\s+$/.test(p) || p === '') { typed.appendChild(document.createTextNode(p)); return; }
      var s = document.createElement('span');
      s.className = 'w';
      s.textContent = p;
      typed.appendChild(s);
      words.push(s);
    });
  }

  function typeOut(fig) {
    if (!words.length) { fig.classList.add('is-sent'); return; }
    var i = 0;
    (function step() {
      if (i < words.length) { words[i++].classList.add('on'); setTimeout(step, 110); }
      else setTimeout(function () { fig.classList.add('is-sent'); }, 350);
    })();
  }

  /* Reveal on scroll */
  var items = document.querySelectorAll('.reveal');
  function show(el) {
    el.classList.add('is-in');
    if (el.classList.contains('composer')) typeOut(el);
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
