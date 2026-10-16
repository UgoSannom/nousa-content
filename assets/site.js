// Sélecteur de langue : mémorise le choix et ouvre la même page dans l'autre langue.
document.querySelectorAll("select[data-lang]").forEach(function (s) {
  s.addEventListener("change", function () {
    try { localStorage.setItem("nousa-lang", s.value); } catch (e) {}
    location.href = s.options[s.selectedIndex].getAttribute("data-href") + location.hash;
  });
});
// Menu mobile : se referme après un clic sur un lien.
document.querySelectorAll(".menu a").forEach(function (a) {
  a.addEventListener("click", function () { a.closest("details").removeAttribute("open"); });
});
// Sommaire des pages légales : surligne la section en cours de lecture.
(function () {
  var links = [].slice.call(document.querySelectorAll(".toc a"));
  if (!links.length || !("IntersectionObserver" in window)) return;
  var byId = {};
  links.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      links.forEach(function (a) { a.classList.remove("on"); });
      byId[e.target.id].classList.add("on");
    });
  }, { rootMargin: "0px 0px -70% 0px" });
  Object.keys(byId).forEach(function (id) { var h = document.getElementById(id); if (h) io.observe(h); });
})();
// ---------- Mouvement ----------
(function () {
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = matchMedia("(pointer: fine)").matches;

  // En-tête : passe en verre dépoli dès qu'on défile.
  var top = document.querySelector(".top");
  function onScroll() { if (top) top.classList.toggle("scrolled", scrollY > 8); }
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  // Apparition des blocs au défilement, en cascade dans chaque groupe.
  var groups = [".shead", ".steps", ".tiles", ".cols", ".rows", ".privacy .intro", ".final", ".faq", ".contact", ".prose", ".toc"];
  if (!reduce && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    groups.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (g) {
        var items = /steps|tiles|cols|rows|faq/.test(sel) ? g.children : [g];
        [].forEach.call(items, function (el, i) { el.classList.add("rv"); el.style.setProperty("--i", i); io.observe(el); });
      });
    });
  }
  if (reduce || !fine) return;

  // Hero : parallaxe légère qui suit la souris.
  var hero = document.querySelector(".hero"), vis = document.querySelector(".visual");
  if (hero && vis) {
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      vis.style.setProperty("--mx", ((e.clientX - r.left) / r.width - .5) * 2);
      vis.style.setProperty("--my", ((e.clientY - r.top) / r.height - .5) * 2);
    });
    hero.addEventListener("pointerleave", function () { vis.style.setProperty("--mx", 0); vis.style.setProperty("--my", 0); });
  }

  // Catégories : inclinaison 3D et reflet sous le curseur.
  document.querySelectorAll(".tile").forEach(function (t) {
    t.addEventListener("pointermove", function (e) {
      var r = t.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      t.style.setProperty("--rx", ((x - .5) * 10).toFixed(2));
      t.style.setProperty("--ry", ((.5 - y) * 10).toFixed(2));
      t.style.setProperty("--gx", (x * 100) + "%"); t.style.setProperty("--gy", (y * 100) + "%");
    });
    t.addEventListener("pointerleave", function () { t.style.setProperty("--rx", 0); t.style.setProperty("--ry", 0); });
  });
})();

// FAQ : un seul tiroir ouvert à la fois, ouverture et fermeture animées.
(function () {
  var items = [].slice.call(document.querySelectorAll(".faq details"));
  if (!items.length) return;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function anim(el, from, to, done) {
    if (reduce || !el.animate) { done && done(); return; }
    var a = el.animate([{ height: from + "px", opacity: from ? 1 : 0 }, { height: to + "px", opacity: to ? 1 : 0 }],
      { duration: 380, easing: "cubic-bezier(.22,1,.36,1)" });
    a.onfinish = function () { done && done(); };
  }
  function close(d) {
    var ans = d.querySelector(".ans");
    anim(ans, ans.offsetHeight, 0, function () { d.removeAttribute("open"); });
    d.classList.remove("opening");
  }
  function open(d) {
    d.setAttribute("open", "");
    var ans = d.querySelector(".ans");
    anim(ans, 0, ans.offsetHeight);
  }
  items.forEach(function (d) {
    d.querySelector("summary").addEventListener("click", function (e) {
      e.preventDefault();
      if (d.hasAttribute("open")) { close(d); return; }
      items.forEach(function (o) { if (o !== d && o.hasAttribute("open")) close(o); });
      open(d);
    });
  });
})();
