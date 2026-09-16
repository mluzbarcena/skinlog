/* =============================================================================
   logic.js  —  toda la "inteligencia" de la app (funciones puras sobre el estado)
   No toca el DOM. Depende de config, util y store.
   ============================================================================= */

window.SK = window.SK || {};

SK.logic = (function () {
  const cfg = SK.config;
  const u = SK.util;

  // --- FASE -------------------------------------------------------------------
  // Fase 1 mientras no se haya terminado el Hyalu B5.
  // Fase 2 para las fechas >= hyaluFinishedDate (regla 2: SANA se activa desde ahí).
  function phaseForDate(dateStr) {
    const fin = SK.store.settings().hyaluFinishedDate;
    if (!fin) return 1;
    return u.diffDays(dateStr, fin) >= 0 ? 2 : 1;
  }
  function currentPhase() { return phaseForDate(u.todayStr()); }

  // --- PLANTILLAS -------------------------------------------------------------
  // AM depende de la fase; filtra sanaBright si está desactivado.
  function amSteps(dateStr) {
    const phase = phaseForDate(dateStr);
    const brighting = SK.store.settings().brightingEnabled;
    return cfg.ROUTINES[phase].am.filter((s) => s.id !== "sanaBright" || brighting);
  }
  function pmSteps(dateStr, type) {
    if (!type || type === "none") return [];
    const phase = phaseForDate(dateStr);
    const table = cfg.ROUTINES[phase].pm;
    return table[type] ? table[type].slice() : [];
  }
  function nightTypesFor(dateStr) {
    return cfg.NIGHT_TYPES_BY_PHASE[phaseForDate(dateStr)];
  }

  // --- COMPLETITUD ------------------------------------------------------------
  function amStatus(dateStr) {
    const d = SK.store.getDay(dateStr);
    const steps = amSteps(dateStr);
    const required = steps.filter((s) => !s.optional);
    const done = d ? (d.am && d.am.done) || {} : {};
    const doneRequired = required.filter((s) => done[s.id]).length;
    const doneOptional = steps.filter((s) => s.optional && done[s.id]).length;
    const skipped = !!(d && d.am && d.am.skipped);
    return {
      total: required.length,
      done: doneRequired,
      optionalDone: doneOptional,
      complete: !skipped && required.length > 0 && doneRequired === required.length,
      skipped,
      registered: skipped || doneRequired > 0 || doneOptional > 0,
    };
  }

  function pmStatus(dateStr) {
    const d = SK.store.getDay(dateStr);
    const type = d && d.pm ? d.pm.type : null;
    const steps = pmSteps(dateStr, type);
    const required = steps.filter((s) => !s.optional);
    const done = d ? (d.pm && d.pm.done) || {} : {};
    const doneRequired = required.filter((s) => done[s.id]).length;
    const isRealRoutine = type && type !== "none";
    return {
      type: type || null,
      total: required.length,
      done: doneRequired,
      isRealRoutine,
      noRoutine: type === "none",
      complete: isRealRoutine && required.length > 0 && doneRequired === required.length,
      registered: !!type || doneRequired > 0,
    };
  }

  // Estado resumido de un día (lo usa calendario, hoy, stats, CSV).
  function dayStatus(dateStr) {
    const am = amStatus(dateStr);
    const pm = pmStatus(dateStr);
    const d = SK.store.getDay(dateStr);
    return {
      date: dateStr,
      phase: phaseForDate(dateStr),
      am, pm,
      tolerance: d ? d.tolerance : null,
      note: d ? d.note : "",
      registered: !!(am.registered || pm.registered || (d && d.tolerance != null) || (d && d.note && d.note.trim())),
      fullComplete: am.complete && pm.complete,
    };
  }

  // --- SUGERENCIA DE NOCHE (suave: meta semanal + espaciado) ------------------
  // Nunca obliga. Devuelve { type, reason } o null si no hay nada que sugerir.
  function countNightsInWindow(endStr, days, type) {
    let c = 0;
    for (const date of u.lastNDays(u.addDays(endStr, -1), days)) { // ventana previa (sin incluir hoy)
      const d = SK.store.getDay(date);
      if (d && d.pm && d.pm.type === type) c++;
    }
    return c;
  }
  function daysSinceLast(endStr, type, maxBack) {
    for (let i = 1; i <= maxBack; i++) {
      const date = u.addDays(endStr, -i);
      const d = SK.store.getDay(date);
      if (d && d.pm && d.pm.type === type) return i;
    }
    return Infinity;
  }

  function suggestNight(dateStr) {
    const phase = phaseForDate(dateStr);
    const s = SK.store.settings();

    const retTarget = Math.max(0, s.retinolB3PerWeek | 0);
    const retCount = countNightsInWindow(dateStr, 7, "retinolB3");
    const retSince = daysSinceLast(dateStr, "retinolB3", 14);
    const retSpacing = retTarget > 0 ? Math.max(1, Math.floor(7 / retTarget)) : 99;
    const retBehind = retCount < retTarget && retSince >= retSpacing;

    if (phase === 1) {
      if (retBehind) {
        return { type: "retinolB3", reason: `Llevás ${retCount}/${retTarget} noches de retinol esta semana; última hace ${fmtSince(retSince)}.` };
      }
      return { type: "recovery", reason: retTarget === 0
        ? "Retinol en pausa (objetivo 0). Toca recuperación."
        : `Ya llevás ${retCount}/${retTarget} de retinol esta semana; conviene descansar.` };
    }

    // Fase 2: retinol y SANA nunca la misma noche (reglas 3–5).
    const sanaTarget = Math.max(0, s.sanaPerWeek | 0);
    const sanaCount = countNightsInWindow(dateStr, 7, "sana");
    const sanaSince = daysSinceLast(dateStr, "sana", 14);
    const sanaSpacing = sanaTarget > 0 ? Math.max(1, Math.floor(7 / sanaTarget)) : 99;
    const sanaBehind = sanaCount < sanaTarget && sanaSince >= sanaSpacing;

    // "Déficit" relativo para priorizar al que está más atrasado respecto de su meta.
    const retDeficit = retTarget > 0 ? (retTarget - retCount) / retTarget : -1;
    const sanaDeficit = sanaTarget > 0 ? (sanaTarget - sanaCount) / sanaTarget : -1;

    if (retBehind && sanaBehind) {
      // ambos hacen falta -> el más atrasado hoy; el otro quedará para otra noche
      if (sanaDeficit > retDeficit) {
        return { type: "sana", reason: `SANA va ${sanaCount}/${sanaTarget} esta semana; el retinol facial lo dejás para otra noche.` };
      }
      return { type: "retinolB3", reason: `Retinol facial va ${retCount}/${retTarget}; el SANA lo dejás para otra noche.` };
    }
    if (retBehind) return { type: "retinolB3", reason: `Retinol facial ${retCount}/${retTarget}; última hace ${fmtSince(retSince)}.` };
    if (sanaBehind) return { type: "sana", reason: `SANA ${sanaCount}/${sanaTarget}; última hace ${fmtSince(sanaSince)}.` };

    return { type: "recovery", reason: "Metas de retinol al día; toca recuperación." };
  }

  function fmtSince(n) {
    if (!isFinite(n)) return "más de 2 semanas";
    if (n === 1) return "1 día";
    return n + " días";
  }

  // --- ADVERTENCIA POR IRRITACIÓN --------------------------------------------
  function recentIrritation(dateStr) {
    const w = cfg.IRRITATION_WARNING;
    let count = 0;
    for (const date of u.lastNDays(dateStr, w.lookbackDays)) {
      const d = SK.store.getDay(date);
      if (d && d.tolerance != null && d.tolerance >= w.minLevel) count++;
    }
    return { triggered: count >= w.minCount, count, message: w.message };
  }

  // --- ESTADÍSTICAS -----------------------------------------------------------
  function stats(endStr, windowDays) {
    const dates = u.lastNDays(endStr, windowDays).filter((dt) => !u.isFuture(dt));
    let amComplete = 0, pmComplete = 0, retinol = 0, sana = 0, recovery = 0, irritation = 0;
    let tolSum = 0, tolN = 0, registered = 0;
    const tolSeries = [];
    for (const date of dates) {
      const st = dayStatus(date);
      if (st.am.complete) amComplete++;
      if (st.pm.complete) pmComplete++;
      if (st.pm.type === "retinolB3") retinol++;
      if (st.pm.type === "sana") sana++;
      if (st.pm.type === "recovery") recovery++;
      if (st.tolerance != null) { tolSum += st.tolerance; tolN++; if (st.tolerance >= 2) irritation++; }
      if (st.registered) registered++;
      tolSeries.push({ date, value: st.tolerance });
    }
    return {
      windowDays, totalDays: dates.length, registered,
      amComplete, pmComplete, retinol, sana, recovery, irritation,
      tolAvg: tolN ? tolSum / tolN : null, tolN, tolSeries,
      amPct: u.pct(amComplete, dates.length),
      pmPct: u.pct(pmComplete, dates.length),
    };
  }

  return {
    phaseForDate, currentPhase,
    amSteps, pmSteps, nightTypesFor,
    amStatus, pmStatus, dayStatus,
    suggestNight, recentIrritation, stats,
    countNightsInWindow, daysSinceLast,
  };
})();
