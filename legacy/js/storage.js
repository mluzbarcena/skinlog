/* =============================================================================
   storage.js  —  estado en memoria + persistencia en localStorage
   Estructura persistida (una sola clave):
     {
       version: 1,
       settings: { ...ver config.defaultSettings() },
       days: {
         "YYYY-MM-DD": {
           am:  { done: { productId: true, ... }, skipped: false },
           pm:  { type: "retinolB3"|"sana"|"recovery"|"none"|null, done: {...} },
           tolerance: 0|1|2|3|null,
           note: ""
         }
       }
     }
   ============================================================================= */

window.SK = window.SK || {};

SK.store = (function () {
  const cfg = SK.config;
  let state = null;
  const listeners = [];

  function emptyState() {
    return { version: cfg.SCHEMA_VERSION, settings: cfg.defaultSettings(), days: {} };
  }

  // Rellena claves que puedan faltar tras una actualización de esquema.
  function migrate(s) {
    if (!s || typeof s !== "object") return emptyState();
    if (!s.settings) s.settings = cfg.defaultSettings();
    else {
      const def = cfg.defaultSettings();
      for (const k in def) if (!(k in s.settings)) s.settings[k] = def[k];
      s.settings.productNames = Object.assign({}, cfg.PRODUCTS, s.settings.productNames || {});
    }
    if (!s.days || typeof s.days !== "object") s.days = {};
    s.version = cfg.SCHEMA_VERSION;
    return s;
  }

  function load() {
    try {
      const raw = localStorage.getItem(cfg.STORAGE_KEY);
      state = raw ? migrate(JSON.parse(raw)) : emptyState();
    } catch (e) {
      console.warn("No se pudo leer localStorage, empezando vacío:", e);
      state = emptyState();
    }
    return state;
  }

  function persist() {
    try {
      localStorage.setItem(cfg.STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error("No se pudo guardar en localStorage:", e);
      alert("No se pudieron guardar los datos. Puede que el almacenamiento del navegador esté lleno o bloqueado.");
    }
  }

  function commit() { persist(); listeners.forEach((fn) => fn(state)); }
  function onChange(fn) { listeners.push(fn); }

  // --- accesores --------------------------------------------------------------
  function get() { return state; }
  function settings() { return state.settings; }

  function getDay(dateStr) {
    return state.days[dateStr] || null;
  }
  // Devuelve el día (creándolo en memoria si no existe) para editar.
  function ensureDay(dateStr) {
    if (!state.days[dateStr]) {
      state.days[dateStr] = { am: { done: {}, skipped: false }, pm: { type: null, done: {} }, tolerance: null, note: "" };
    }
    const d = state.days[dateStr];
    d.am = d.am || { done: {}, skipped: false };
    d.am.done = d.am.done || {};
    d.pm = d.pm || { type: null, done: {} };
    d.pm.done = d.pm.done || {};
    if (!("tolerance" in d)) d.tolerance = null;
    if (!("note" in d)) d.note = "";
    return d;
  }

  // Guarda un día completo (objeto ya construido por la UI) y limpia si quedó vacío.
  function saveDay(dateStr, day) {
    state.days[dateStr] = day;
    if (isDayEmpty(day)) delete state.days[dateStr];
    commit();
  }

  function isDayEmpty(day) {
    if (!day) return true;
    const amDone = day.am && day.am.done ? Object.values(day.am.done).some(Boolean) : false;
    const amSkip = day.am && day.am.skipped;
    const pmType = day.pm && day.pm.type;
    const pmDone = day.pm && day.pm.done ? Object.values(day.pm.done).some(Boolean) : false;
    const tol = day.tolerance != null;
    const note = day.note && day.note.trim().length > 0;
    return !(amDone || amSkip || pmType || pmDone || tol || note);
  }

  function updateSettings(patch) {
    Object.assign(state.settings, patch);
    commit();
  }

  function clearAll() {
    state = emptyState();
    commit();
  }

  // --- export / import --------------------------------------------------------
  function exportJSON() {
    return JSON.stringify(state, null, 2);
  }

  function exportCSV() {
    const names = settings().productNames;
    const rows = [];
    const header = [
      "fecha", "fase",
      "am_completa", "am_pasos_hechos", "am_pasos_total", "am_no_realizada",
      "pm_tipo", "pm_completa", "pm_pasos_hechos", "pm_pasos_total",
      "tolerancia", "nota",
    ];
    rows.push(header);
    const dates = Object.keys(state.days).sort();
    for (const date of dates) {
      const st = SK.logic.dayStatus(date);
      const d = state.days[date];
      rows.push([
        date,
        st.phase,
        st.am.complete ? "si" : "no",
        st.am.done, st.am.total,
        st.am.skipped ? "si" : "no",
        d.pm.type || "",
        st.pm.complete ? "si" : "no",
        st.pm.done, st.pm.total,
        d.tolerance == null ? "" : d.tolerance,
        (d.note || "").replace(/\r?\n/g, " "),
      ]);
    }
    return rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
  }

  function csvCell(v) {
    v = String(v == null ? "" : v);
    return /[",\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }

  // Importa un JSON exportado previamente. Reemplaza todo el estado. Valida forma.
  function importJSON(text) {
    let parsed;
    try { parsed = JSON.parse(text); }
    catch (e) { return { ok: false, error: "El archivo no es JSON válido." }; }
    if (!parsed || typeof parsed !== "object" || typeof parsed.days !== "object") {
      return { ok: false, error: "El JSON no tiene la estructura esperada (falta 'days')." };
    }
    state = migrate(parsed);
    commit();
    const n = Object.keys(state.days).length;
    return { ok: true, days: n };
  }

  return {
    load, get, settings, getDay, ensureDay, saveDay, isDayEmpty,
    updateSettings, clearAll, commit, onChange,
    exportJSON, exportCSV, importJSON, emptyState,
  };
})();
