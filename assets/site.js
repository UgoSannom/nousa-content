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
