(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mqMobile = window.matchMedia('(max-width: 960px)');

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

  var items = document.querySelectorAll('.reveal');
  function show(el) {
    el.classList.add('is-in');
    if (el.classList.contains('composer') || el.querySelector('.composer')) {
      var fig = el.classList.contains('composer') ? el : el.querySelector('.composer');
      if (fig && !fig._typed) { fig._typed = true; typeOut(fig); }
    }
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

  var flow = document.querySelector('[data-flow]');
  var marks = flow ? flow.querySelectorAll('.flow__mark') : [];
  var steps = flow ? flow.querySelectorAll('.flow__step') : [];
  var entries = flow ? flow.querySelectorAll('.flow__entry') : [];
  var active = 0;

  function setStep(n, force) {
    n = Math.max(0, Math.min(5, n | 0));
    if (!force && n === active && flow && flow.getAttribute('data-active') === String(n)) return;
    active = n;
    if (flow) {
      flow.setAttribute('data-active', String(n));
      flow.style.setProperty('--flow-p', ((n + 1) / 6).toFixed(4));
    }
    steps.forEach(function (el, i) {
      el.classList.toggle('is-active', i === n);
      el.classList.toggle('is-done', i < n);
    });
    entries.forEach(function (el, i) {
      el.classList.toggle('is-shown', i <= n);
      el.classList.toggle('is-on', i === n);
      el.classList.toggle('is-past', i < n);
    });
  }

  function flowProgress() {
    if (!flow || !marks.length) return;
    if (reduce || mqMobile.matches) return;
    var vh = window.innerHeight || 1;
    var best = 0;
    var bestScore = -Infinity;
    marks.forEach(function (m, i) {
      var r = m.getBoundingClientRect();
      var mid = r.top + r.height * 0.25;
      var score = -Math.abs(mid - vh * 0.38);
      if (r.bottom > vh * 0.1 && r.top < vh * 0.9 && score > bestScore) {
        bestScore = score;
        best = i;
      }
    });
    var last = marks[marks.length - 1].getBoundingClientRect();
    /* Stay on step 6 for most of the last (taller) mark; only keep 5 once entered */
    if (last.top < vh * 0.55) best = 5;
    setStep(best);
  }

  var stepIO = null;
  function setupMobileIO() {
    if (stepIO) { stepIO.disconnect(); stepIO = null; }
    if (!mqMobile.matches || reduce || !steps.length) {
      if (reduce && flow) {
        entries.forEach(function (el) {
          el.classList.add('is-shown');
          el.classList.remove('is-on', 'is-past');
        });
        if (entries[entries.length - 1]) entries[entries.length - 1].classList.add('is-on');
        flow.style.setProperty('--flow-p', '1');
        flow.setAttribute('data-active', '5');
        steps.forEach(function (el, i) {
          el.classList.toggle('is-done', i < 5);
          el.classList.toggle('is-active', i === 5);
        });
      }
      return;
    }
    stepIO = new IntersectionObserver(function (entriesIO) {
      var visible = entriesIO.filter(function (e) { return e.isIntersecting; })
        .sort(function (a, b) { return b.intersectionRatio - a.intersectionRatio; })[0];
      if (visible) {
        var i = parseInt(visible.target.getAttribute('data-step'), 10);
        if (!isNaN(i)) setStep(i);
      }
    }, { rootMargin: '-35% 0px -45% 0px', threshold: [0, 0.25, 0.5, 1] });
    steps.forEach(function (el) { stepIO.observe(el); });
  }

  if (flow) {
    flow.querySelectorAll('[data-goto]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var i = parseInt(btn.getAttribute('data-goto'), 10);
        if (isNaN(i)) return;
        if (mqMobile.matches || reduce) {
          setStep(i, true);
          return;
        }
        var mark = marks[i];
        if (mark) {
          var y = mark.getBoundingClientRect().top + (window.scrollY || window.pageYOffset);
          window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
        }
        setStep(i, true);
      });
    });
    setStep(0, true);
  }

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
    flowProgress();
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { setupMobileIO(); onScroll(); });
  setupMobileIO();
  update();

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
