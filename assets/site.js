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
