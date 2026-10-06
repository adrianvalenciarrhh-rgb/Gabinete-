(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Reveal on scroll — gentle fade only */
  var items = document.querySelectorAll('.reveal');
  function show(el) { el.classList.add('is-in'); }
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

  /* Scroll-linked: nine dots converging into one line */
  var hero = document.querySelector('.hero');
  var motif = document.querySelector('.motif--hero');
  var ticking = false;

  function update() {
    ticking = false;
    var y = window.scrollY || window.pageYOffset;
    var max = Math.max(1, root.scrollHeight - window.innerHeight);
    if (y >= max - 4) document.querySelectorAll('.reveal:not(.is-in)').forEach(show);
    if (motif && hero) {
      var p = reduce ? 1 : Math.min(1, Math.max(0, y / (hero.offsetHeight * 0.55)));
      motif.style.setProperty('--p', p.toFixed(4));
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();

  /* Hero link: smooth scroll to section 02 */
  var cta = document.querySelector('.hero .text-link');
  var target = document.getElementById('recorrido');
  if (cta && target) {
    cta.addEventListener('click', function (ev) {
      ev.preventDefault();
      target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      if (history.replaceState) history.replaceState(null, '', '#recorrido');
    });
  }
})();
