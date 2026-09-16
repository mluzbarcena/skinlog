/* Test rápido del núcleo lógico (no UI). Ejecutar: node _test.js */
const fs = require("fs");
const path = require("path");

// --- shims de entorno navegador -------------------------------------------
global.window = global;
const mem = {};
global.localStorage = {
  getItem: (k) => (k in mem ? mem[k] : null),
  setItem: (k, v) => { mem[k] = String(v); },
  removeItem: (k) => { delete mem[k]; },
};
global.alert = () => {};
global.confirm = () => true;

// --- cargar módulos en orden ----------------------------------------------
function load(f) { eval(fs.readFileSync(path.join(__dirname, "js", f), "utf8")); }
["config.js", "util.js", "icons.js", "storage.js", "logic.js"].forEach(load);

const { store: S, logic: L, util: u, config: cfg } = SK;

let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; } else { fail++; console.log("  ✗ FALLA:", name); } }

// fecha base fija para test (no "hoy" real, para reproducibilidad relativa)
const T = "2026-03-15"; // domingo
function setDay(date, obj) { const d = S.ensureDay(date); Object.assign(d, obj); S.commit(); }

S.load();
S.clearAll();

// 1) estado inicial
ok("fase inicial = 1", L.phaseForDate(T) === 1);
let st = L.dayStatus(T);
ok("día vacío no registrado", st.registered === false);
ok("AM total fase1 = 4", L.amSteps(T).filter(s => !s.optional).length === 4);

// 2) AM completa
setDay(T, { am: { done: { cleanser: true, hyaluEyes: true, moisturizer: true, spf: true }, skipped: false } });
st = L.dayStatus(T);
ok("AM completa", st.am.complete === true && st.am.done === 4);

// 3) PM retinol completa (fase 1 => 4 pasos)
setDay(T, { pm: { type: "retinolB3", done: { cleanser: true, retinolB3: true, hyaluEyes: true, moisturizer: true } } });
st = L.dayStatus(T);
ok("PM retinol fase1 total=4", st.pm.total === 4);
ok("PM retinol completa", st.pm.complete === true);
ok("día full complete", st.fullComplete === true);

// 4) transición de fase
S.updateSettings({ hyaluFinishedDate: T });
ok("fase en la fecha de corte = 2", L.phaseForDate(T) === 2);
ok("fase día previo = 1", L.phaseForDate(u.addDays(T, -1)) === 1);
ok("SANA disponible en fase 2", L.nightTypesFor(T).indexOf("sana") !== -1);
ok("SANA NO disponible en fase 1", L.nightTypesFor(u.addDays(T, -1)).indexOf("sana") === -1);
ok("retinol fase2 total=3", L.pmSteps(T, "retinolB3").length === 3);
ok("sana fase2 total=3", L.pmSteps(T, "sana").length === 3);

// AM fase2 incluye sanaBright opcional cuando brighting on
ok("AM fase2 con brightening tiene 4 pasos (1 opcional)", L.amSteps(T).length === 4 && L.amSteps(T).some(s => s.id === "sanaBright" && s.optional));
S.updateSettings({ brightingEnabled: false });
ok("AM fase2 sin brightening tiene 3 pasos", L.amSteps(T).length === 3);
S.updateSettings({ brightingEnabled: true });

// 5) sugerencia sin historial (fase 1 sintética) -> retinol (atrasado)
S.clearAll();
ok("sugerencia sin historial (fase1) = retinolB3", L.suggestNight(T).type === "retinolB3");

// 6) tras 3 retinol en la semana -> recuperación
S.clearAll();
[1,3,5].forEach(off => setDay(u.addDays(T, -off), { pm: { type: "retinolB3", done: {} } }));
ok("con meta 3 cumplida -> recuperación", L.suggestNight(T).type === "recovery");

// 7) advertencia por irritación
S.clearAll();
setDay(u.addDays(T,-1), { tolerance: 2 });
setDay(u.addDays(T,-2), { tolerance: 3 });
ok("irritación reciente dispara advertencia", L.recentIrritation(T).triggered === true);
setDay(u.addDays(T,-1), { tolerance: 0 });
setDay(u.addDays(T,-2), { tolerance: 0 });
ok("sin irritación no dispara", L.recentIrritation(T).triggered === false);

// 8) SANA opcional no genera incompleto en AM
S.clearAll();
S.updateSettings({ hyaluFinishedDate: T });
setDay(T, { am: { done: { cleanser: true, moisturizer: true, spf: true }, skipped: false } }); // sin sanaBright
st = L.dayStatus(T);
ok("AM fase2 completa sin usar sanaBright (opcional)", st.am.complete === true);

// 9) stats
S.clearAll();
for (let i = 0; i < 7; i++) {
  const d = u.addDays(T, -i);
  setDay(d, { am: { done: { cleanser:true, hyaluEyes:true, moisturizer:true, spf:true }, skipped:false } });
}
setDay(T, { pm: { type: "retinolB3", done: { cleanser:true, retinolB3:true, hyaluEyes:true, moisturizer:true } }, tolerance: 1 });
const s7 = L.stats(T, 7);
ok("stats 7d: 7 mañanas completas", s7.amComplete === 7);
ok("stats 7d: 1 retinol", s7.retinol === 1);
ok("stats 7d: tolAvg definido", s7.tolAvg === 1);

// 10) export / import roundtrip
S.clearAll();
setDay(T, { pm: { type: "sana", done: { sanaWrinkle: true } }, tolerance: 2, note: "prueba, con coma" });
S.updateSettings({ retinolB3PerWeek: 2 });
const dump = S.exportJSON();
const csv = S.exportCSV();
ok("CSV tiene header y una fila", csv.split("\r\n").length === 2 && csv.indexOf("prueba") !== -1);
S.clearAll();
ok("tras clear no hay días", Object.keys(S.get().days).length === 0);
const res = S.importJSON(dump);
ok("import ok", res.ok === true && res.days === 1);
ok("import preserva nota", S.getDay(T).note === "prueba, con coma");
ok("import preserva settings", S.settings().retinolB3PerWeek === 2);
ok("import rechaza basura", S.importJSON("{no json").ok === false);

// 11) día vacío se descarta al guardar
S.clearAll();
S.saveDay(T, { am: { done: {}, skipped: false }, pm: { type: null, done: {} }, tolerance: null, note: "" });
ok("día vacío no se persiste", S.getDay(T) === null);

console.log(`\n${pass} pruebas OK, ${fail} fallas`);
process.exit(fail ? 1 : 0);
