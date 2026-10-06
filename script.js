document.addEventListener("DOMContentLoaded", () => {
  const isCoarse =
    window.matchMedia("(hover: none) and (pointer: coarse)").matches ||
    window.innerWidth < 768;

  // Clock — visitor local time
  const timeEl = document.getElementById("time");
  function tick() {
    if (!timeEl) return;
    timeEl.textContent = new Date().toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }
  tick();
  setInterval(tick, 1000);

  // Nav scroll state
  const nav = document.getElementById("navbar");
  const onScroll = () => {
    if (!nav) return;
    nav.classList.toggle("nav-scrolled", window.scrollY > 40);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Accordions — scoped to nearest section / oficios list
  function panelOf(trigger) {
    const id = trigger.getAttribute("aria-controls");
    return (id && document.getElementById(id)) || trigger.nextElementSibling;
  }
  function setState(trigger, open) {
    const panel = panelOf(trigger);
    if (!panel) return;
    panel.classList.toggle("open", open);
    trigger.setAttribute("aria-expanded", open ? "true" : "false");
  }

  document.querySelectorAll(".accordion-trigger").forEach((acc) => {
    const panel = panelOf(acc);
    setState(acc, !!(panel && panel.classList.contains("open")));

    acc.addEventListener("click", (ev) => {
      ev.preventDefault();
      const open = panelOf(acc).classList.contains("open");
      // Oficios: independent cells — only toggle self (map stays readable)
      // Other sections: exclusive within section
      const inOficios = acc.closest(".oficios-grid");
      if (!inOficios) {
        const scope = acc.closest("section") || document;
        scope.querySelectorAll(".accordion-trigger").forEach((t) => {
          if (t !== acc) setState(t, false);
        });
      }
      setState(acc, !open);
    });
  });

  // Soft hyphens for justified ES prose (same idea as pro site, lighter)
  (function hyphenateES() {
    if (isCoarse && window.innerWidth < 480) return; // skip on tiny phones
    const SHY = "\u00AD";
    const V = "aeiouáéíóúüAEIOUÁÉÍÓÚÜ";
    const targets = document.querySelectorAll(".prose p, .lede, .oficio-desc, .layer p, .steps p");
    targets.forEach((el) => {
      if (el.dataset.hyphened) return;
      el.dataset.hyphened = "1";
      el.childNodes.forEach((node) => {
        if (node.nodeType !== 3) return;
        const words = node.textContent.split(/(\s+)/);
        node.textContent = words
          .map((w) => {
            if (w.length < 8 || /\s/.test(w) || /[0-9]/.test(w)) return w;
            let out = "";
            for (let i = 0; i < w.length; i++) {
              out += w[i];
              if (
                i > 2 &&
                i < w.length - 3 &&
                V.includes(w[i]) &&
                !V.includes(w[i + 1]) &&
                V.includes(w[i + 2] || "")
              ) {
                out += SHY;
              }
            }
            return out;
          })
          .join("");
      });
    });
  })();
});
