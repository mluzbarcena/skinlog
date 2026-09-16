/* =============================================================================
   util.js  —  helpers de fecha (siempre en hora LOCAL), formato y DOM
   Nota: todas las fechas se manejan como "YYYY-MM-DD" en hora local para que
   "hoy" no se corra por zona horaria (bug clásico si se usa toISOString/UTC).
   ============================================================================= */

window.SK = window.SK || {};

SK.util = (function () {
  const WEEKDAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const WEEKDAYS_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];

  // --- fechas -----------------------------------------------------------------
  function pad(n) { return String(n).padStart(2, "0"); }

  // "YYYY-MM-DD" de una fecha (por defecto hoy), en hora local
  function dateStr(d) {
    d = d || new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function todayStr() { return dateStr(new Date()); }

  // "YYYY-MM-DD" -> Date local (a medianoche)
  function parse(str) {
    const [y, m, d] = str.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  function addDays(str, n) {
    const d = parse(str);
    d.setDate(d.getDate() + n);
    return dateStr(d);
  }

  // diferencia en días enteros (a - b), positivo si a es posterior
  function diffDays(a, b) {
    return Math.round((parse(a) - parse(b)) / 86400000);
  }

  function isFuture(str) { return diffDays(str, todayStr()) > 0; }

  // últimos N días terminando en `endStr` (incluye endStr), del más viejo al más nuevo
  function lastNDays(endStr, n) {
    const out = [];
    for (let i = n - 1; i >= 0; i--) out.push(addDays(endStr, -i));
    return out;
  }

  // --- formato ----------------------------------------------------------------
  function weekday(str) { return WEEKDAYS[parse(str).getDay()]; }
  function weekdayShort(str) { return WEEKDAYS_SHORT[parse(str).getDay()]; }
  function monthName(m) { return MONTHS[m]; }

  function longDate(str) {
    const d = parse(str);
    return WEEKDAYS[d.getDay()] + " " + d.getDate() + " de " + MONTHS[d.getMonth()];
  }
  function shortDate(str) {
    const d = parse(str);
    return d.getDate() + " " + MONTHS[d.getMonth()].slice(0, 3).toLowerCase();
  }

  function pct(part, total) {
    if (!total) return 0;
    return Math.round((part / total) * 100);
  }

  // --- DOM --------------------------------------------------------------------
  function el(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  return {
    WEEKDAYS, WEEKDAYS_SHORT, MONTHS,
    dateStr, todayStr, parse, addDays, diffDays, isFuture, lastNDays,
    weekday, weekdayShort, monthName, longDate, shortDate, pct,
    el, esc,
  };
})();
