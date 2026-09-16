/* =============================================================================
   app.js  —  arranque, navegación entre vistas y re-render central
   ============================================================================= */

window.SK = window.SK || {};

SK.app = (function () {
  const u = SK.util, S = SK.store, ui = SK.ui;
  let current = "today";

  const VIEWS = {
    today:    ui.renderToday,
    cal:      ui.renderCalendar,
    progress: ui.renderProgress,
    phases:   ui.renderPhases,
    settings: ui.renderSettings,
  };

  function show(name) {
    current = name;
    Array.prototype.forEach.call(document.querySelectorAll(".view"), function (v) { v.classList.remove("active"); });
    Array.prototype.forEach.call(document.querySelectorAll(".nav button"), function (b) {
      b.classList.toggle("on", b.getAttribute("data-view") === name);
    });
    const el = u.el("view-" + ({ today: "today", cal: "cal", progress: "progress", phases: "phases", settings: "settings" }[name]));
    el.classList.add("active");
    render();
  }

  // re-render de la vista actual + topbar (se llama tras cualquier cambio de datos)
  function render() {
    ui.renderTopbar();
    (VIEWS[current] || VIEWS.today)();
  }

  function init() {
    S.load();
    ui.applyTheme();

    // navegación
    Array.prototype.forEach.call(document.querySelectorAll(".nav button"), function (b) {
      b.onclick = function () { show(b.getAttribute("data-view")); };
    });
    // cerrar modal tocando el fondo
    u.el("modalBack").addEventListener("click", function (e) {
      if (e.target === this) ui.closeEditor();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && u.el("modalBack").classList.contains("open")) ui.closeEditor();
    });
    // si cambia el tema del sistema y estamos en "auto", re-render nada especial (CSS lo maneja)

    show("today");
  }

  return { init, show, render };
})();

document.addEventListener("DOMContentLoaded", SK.app.init);
