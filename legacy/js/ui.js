/* =============================================================================
   ui.js  —  render de vistas + editor de día (modal) + gráfico de tolerancia
   ============================================================================= */

window.SK = window.SK || {};

SK.ui = (function () {
  const u = SK.util, cfg = SK.config, L = SK.logic, S = SK.store, I = SK.icon;

  let calMonth; // {y, m} mes visible en calendario
  let editor = null; // { date, day } estado del editor abierto

  // --------------------------------------------------------------------------
  function badgeForNight(type) {
    const nt = cfg.NIGHT_TYPES[type];
    if (!nt) return "";
    const cls = { retinolB3: "b-retinol", sana: "b-sana", recovery: "b-recovery", none: "b-none" }[type];
    return '<span class="badge ' + cls + '">' + I("dot") + u.esc(nt.short) + "</span>";
  }
  function tolBadge(lv) {
    if (lv == null) return "";
    const t = cfg.TOLERANCE[lv];
    return '<span class="badge b-tol' + lv + '">' + u.esc(t.emoji) + " " + lv + " · " + u.esc(t.label) + "</span>";
  }

  // ==== TOPBAR ==============================================================
  function renderTopbar() {
    const phase = L.currentPhase();
    const label = phase === 1 ? "Fase 1" : (S.settings().sanaToleratedConfirmed ? "Fase 2" : "Fase 2 · adaptación");
    u.el("phasechip").textContent = label;
  }

  // ==== HOY =================================================================
  function renderToday() {
    const date = u.todayStr();
    const st = L.dayStatus(date);
    const s = S.settings();
    const sug = L.suggestNight(date);
    const nt = cfg.NIGHT_TYPES;

    const amCls = st.am.complete ? "done" : "";
    const pmCls = st.pm.complete ? "done" : "";

    let pmMain, pmSub;
    if (!st.pm.type) { pmMain = "—"; pmSub = "Sin registrar"; }
    else if (st.pm.type === "none") { pmMain = "—"; pmSub = "No hiciste rutina"; }
    else { pmMain = st.pm.done + "/" + st.pm.total; pmSub = nt[st.pm.type].label; }

    let piel;
    if (st.tolerance == null) piel = '<span class="sub">Sin registrar</span>';
    else { const t = cfg.TOLERANCE[st.tolerance]; piel = '<span class="big">' + t.emoji + '</span><div><b>' + st.tolerance + " · " + u.esc(t.label) + "</b></div>"; }

    const html =
      '<div class="today-head"><div class="date">Hoy<span>' + u.esc(u.longDate(date)) + "</span></div>" +
      (st.fullComplete ? '<span class="badge b-tol0">' + I("check") + " Completo</span>" : "") + "</div>" +

      '<div class="slots">' +
        '<div class="slot"><div class="slot-top">' + I("sun", 18) + " Mañana</div>" +
          '<div class="ratio ' + amCls + '">' + (st.am.skipped ? "—" : st.am.done + "/" + st.am.total) + "</div>" +
          '<div class="sub">' + (st.am.skipped ? "No realizada" : (st.am.complete ? "Completa" : "Pendiente")) + "</div></div>" +
        '<div class="slot"><div class="slot-top">' + I("moon", 18) + " Noche</div>" +
          '<div class="ratio ' + pmCls + '">' + pmMain + "</div>" +
          '<div class="sub">' + u.esc(pmSub) + "</div></div>" +
      "</div>" +

      '<div class="today-piel">' + I("droplet", 20) + '<div style="flex:1;display:flex;align-items:center;gap:10px">' + piel + "</div></div>" +

      (st.pm.type ? "" :
        '<div class="suggest">' + I("spark", 18) +
        "<div>Sugerido esta noche: <b>" + u.esc(nt[sug.type].label) + "</b><br>" + u.esc(sug.reason) + "</div></div>") +

      '<button class="btn primary big block" id="registerToday">' + I("edit", 18) +
      (st.registered ? " Editar rutina de hoy" : " Registrar rutina") + "</button>";

    u.el("view-today").innerHTML = html;
    u.el("registerToday").onclick = function () { openEditor(date); };
  }

  // ==== CALENDARIO ==========================================================
  function ensureCalMonth() {
    if (!calMonth) { const d = u.parse(u.todayStr()); calMonth = { y: d.getFullYear(), m: d.getMonth() }; }
  }
  function renderCalendar() {
    ensureCalMonth();
    const { y, m } = calMonth;
    const first = new Date(y, m, 1);
    const startDow = first.getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const today = u.todayStr();

    let cells = "";
    for (let i = 0; i < startDow; i++) cells += '<div class="cell empty"></div>';
    for (let d = 1; d <= daysInMonth; d++) {
      const date = y + "-" + String(m + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
      const st = L.dayStatus(date);
      const future = u.isFuture(date);
      const cls = ["cell"];
      if (date === today) cls.push("today");
      if (future) cls.push("future");
      if (!st.registered && !future) cls.push("unreg");

      let marks = "";
      // AM
      if (st.am.skipped) marks += '<div class="m">' + I("sun") + "—</div>";
      else if (st.am.registered) marks += '<div class="m ' + (st.am.complete ? "ok" : "") + '">' + I("sun") + st.am.done + "/" + st.am.total + "</div>";
      // PM
      if (st.pm.type === "none") marks += '<div class="m">' + I("moon") + "—</div>";
      else if (st.pm.isRealRoutine) marks += '<div class="m ' + (st.pm.complete ? "ok" : "") + '">' + I("moon") + st.pm.done + "/" + st.pm.total + "</div>";
      // etiqueta de tipo de noche (barra de color)
      if (st.pm.type && st.pm.type !== "none") marks += '<div class="ntag ' + cfg.NIGHT_TYPES[st.pm.type].color + '"></div>';

      const toldot = st.tolerance != null ? '<span class="toldot tol' + st.tolerance + '" title="Tolerancia ' + st.tolerance + '"></span>' : "";

      cells += '<button class="' + cls.join(" ") + '" data-date="' + date + '">' +
        '<span class="dnum">' + d + "</span>" + toldot +
        '<div class="marks">' + marks + "</div></button>";
    }

    const monthLabel = u.monthName(m) + " " + y;
    const dow = u.WEEKDAYS_SHORT.map((w) => "<span>" + w + "</span>").join("");

    u.el("view-cal").innerHTML =
      '<div class="cal-nav"><button class="btn ghost" id="calPrev" aria-label="Mes anterior">‹</button>' +
      '<h2>' + u.esc(monthLabel) + '</h2>' +
      '<button class="btn ghost" id="calNext" aria-label="Mes siguiente">›</button></div>' +
      '<div class="dow">' + dow + "</div>" +
      '<div class="grid">' + cells + "</div>" +
      '<div class="cal-legend">' +
        '<span>' + I("sun", 13) + " / " + I("moon", 13) + " AM / PM</span>" +
        '<span><i class="swatch" style="background:var(--retinol)"></i> Retinol B3</span>' +
        '<span><i class="swatch" style="background:var(--sana)"></i> SANA</span>' +
        '<span><i class="swatch" style="background:var(--recovery)"></i> Recuperación</span>' +
        '<span><i class="swatch" style="background:var(--surface-2);border:1px solid var(--border)"></i> Sin registrar</span>' +
      "</div>";

    u.el("calPrev").onclick = function () { calMonth = shiftMonth(calMonth, -1); renderCalendar(); };
    u.el("calNext").onclick = function () { calMonth = shiftMonth(calMonth, +1); renderCalendar(); };
    Array.prototype.forEach.call(document.querySelectorAll(".cell[data-date]"), function (btn) {
      btn.onclick = function () { openEditor(btn.getAttribute("data-date")); };
    });
  }
  function shiftMonth(cm, delta) {
    let m = cm.m + delta, y = cm.y;
    if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
    return { y, m };
  }

  // ==== PROGRESO ============================================================
  function renderProgress() {
    const today = u.todayStr();
    const s7 = L.stats(today, 7);
    const s30 = L.stats(today, 30);

    function statCard(k, v, sub) {
      return '<div class="stat"><div class="k">' + k + '</div><div class="v">' + v + (sub ? ' <small>' + sub + "</small>" : "") + "</div></div>";
    }
    const avg7 = s7.tolAvg == null ? "—" : s7.tolAvg.toFixed(1);
    const avg30 = s30.tolAvg == null ? "—" : s30.tolAvg.toFixed(1);

    u.el("view-progress").innerHTML =
      '<div class="section-title">Últimos 7 días</div>' +
      '<div class="statgrid">' +
        statCard("Mañanas completas", s7.amComplete, "/ " + s7.totalDays) +
        statCard("Noches completas", s7.pmComplete, "/ " + s7.totalDays) +
        statCard("Retinol B3", s7.retinol, "aplic.") +
        statCard("SANA Wrinkle", s7.sana, "aplic.") +
        statCard("Recuperación", s7.recovery, "noches") +
        statCard("Días con irritación", s7.irritation, "≥ mod.") +
      "</div>" +

      '<div class="section-title">Últimos 30 días</div>' +
      '<div class="statgrid">' +
        statCard("Mañanas completas", s30.amPct + "%", "") +
        statCard("Noches completas", s30.pmPct + "%", "") +
        statCard("Retinol B3", s30.retinol, "aplic.") +
        statCard("SANA Wrinkle", s30.sana, "aplic.") +
        statCard("Recuperación", s30.recovery, "noches") +
        statCard("Tolerancia media", avg30, "/ 3") +
      "</div>" +

      '<div class="card" style="margin-top:16px"><h2>Evolución de la tolerancia (30 días)</h2>' +
        '<div class="chart-wrap">' + tolChart(s30.tolSeries) + "</div>" +
        '<div class="cal-legend" style="margin-top:10px">' +
          '<span><i class="swatch" style="background:var(--tol0)"></i> 0 sin irrit.</span>' +
          '<span><i class="swatch" style="background:var(--tol2)"></i> 2 moderada</span>' +
          '<span><i class="swatch" style="background:var(--tol3)"></i> 3 importante</span>' +
        "</div>" +
      "</div>" +
      '<p class="disclaimer">Esta app es sólo un registro personal. No hace diagnósticos ni reemplaza a un profesional de la salud.</p>';
  }

  // gráfico de línea (0=abajo, 3=arriba => subir = más irritación)
  function tolChart(series) {
    const pts = series.map((p, i) => ({ i, v: p.value })).filter((p) => p.v != null);
    if (pts.length === 0) return '<div class="chart-empty">Todavía no registraste tolerancia. Aparecerá acá cuando lo hagas.</div>';

    const W = 320, H = 132, padL = 22, padR = 8, padT = 10, padB = 18;
    const n = series.length;
    const x = (i) => padL + (i / Math.max(1, n - 1)) * (W - padL - padR);
    const y = (v) => padT + (1 - v / 3) * (H - padT - padB);

    let grid = "", labels = "";
    for (let g = 0; g <= 3; g++) {
      const gy = y(g).toFixed(1);
      grid += '<line x1="' + padL + '" y1="' + gy + '" x2="' + (W - padR) + '" y2="' + gy + '" stroke="var(--border)" stroke-width="1"' + (g > 0 ? ' stroke-dasharray="2 3"' : "") + "/>";
      labels += '<text x="' + (padL - 5) + '" y="' + (parseFloat(gy) + 3) + '" text-anchor="end" font-size="9" fill="var(--muted)">' + g + "</text>";
    }
    const line = pts.map((p, k) => (k ? "L" : "M") + x(p.i).toFixed(1) + " " + y(p.v).toFixed(1)).join(" ");
    const dots = pts.map((p) => {
      const c = ["--tol0", "--tol1", "--tol2", "--tol3"][p.v];
      return '<circle cx="' + x(p.i).toFixed(1) + '" cy="' + y(p.v).toFixed(1) + '" r="3.1" fill="var(' + c + ')"/>';
    }).join("");

    return '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Gráfico de evolución de la tolerancia">' +
      grid + labels +
      '<path d="' + line + '" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' +
      dots + "</svg>";
  }

  // ==== FASES ===============================================================
  function renderPhases() {
    const s = S.settings();
    const phase = L.currentPhase();

    let html = "";
    // Fase 1
    html += '<div class="card phase-card ' + (phase === 1 ? "active" : "") + '">' +
      '<div class="ph-head"><h3>Fase 1</h3>' +
      '<span class="phase-state ' + (phase === 1 ? "on" : "off") + '">' + (phase === 1 ? "🟢 Activa" : "Finalizada") + "</span></div>" +
      '<div class="ph-row"><span class="lbl">' + u.esc(s.productNames.hyaluEyes) + '</span><span>' + (phase === 1 ? "en uso" : "terminado") + "</span></div>" +
      '<div class="ph-row"><span class="lbl">Retinol B3</span><span>' + s.retinolB3PerWeek + "×/semana</span></div>";
    if (phase === 1) {
      html += '<button class="btn block" id="finishHyalu" style="margin-top:12px">' + I("check", 18) + " Terminé Hyalu B5</button>";
    } else {
      html += '<div class="ph-row"><span class="lbl">Terminado el</span><span>' + u.esc(u.shortDate(s.hyaluFinishedDate)) + "</span></div>";
    }
    html += "</div>";

    // Fase 2
    const inAdapt = phase === 2 && !s.sanaToleratedConfirmed;
    html += '<div class="card phase-card ' + (phase === 2 ? (inAdapt ? "adapt" : "active") : "") + '">' +
      '<div class="ph-head"><h3>Fase 2</h3>' +
      '<span class="phase-state ' + (phase === 2 ? (inAdapt ? "adapt" : "on") : "off") + '">' +
      (phase === 2 ? (inAdapt ? "🟡 En adaptación" : "🟢 Activa") : "Pendiente") + "</span></div>" +
      '<div class="ph-row"><span class="lbl">Retinol B3</span><span>' + s.retinolB3PerWeek + "×/semana</span></div>" +
      '<div class="ph-row"><span class="lbl">SANA Wrinkle Care</span><span>' + s.sanaPerWeek + "×/semana</span></div>";

    if (phase === 2) {
      if (!s.sanaToleratedConfirmed) {
        html += '<p class="hint" style="font-size:12.5px;color:var(--muted);margin:10px 0 4px">Regla inicial: Retinol B3 y SANA en noches distintas. Cuando notes que tolerás bien el SANA, podés habilitar 2×/semana.</p>' +
          '<button class="btn block" id="confirmSana" style="margin-top:8px">' + I("check", 18) + " Considero que tolero bien el SANA</button>";
      } else {
        html += '<div class="ph-row"><span class="lbl">SANA tolerado</span><span>confirmado — hasta ' + cfg.DEFAULT_TARGETS.sanaPerWeekMax + "×/sem</span></div>";
      }
    }
    html += "</div>";
    html += '<p class="disclaimer">La app nunca sube la frecuencia sola: las metas se cambian a mano en Ajustes y siempre podés sobrescribir el tipo de noche de cualquier día.</p>';

    u.el("view-phases").innerHTML = html;

    if (u.el("finishHyalu")) u.el("finishHyalu").onclick = finishHyalu;
    if (u.el("confirmSana")) u.el("confirmSana").onclick = confirmSana;
  }

  function finishHyalu() {
    const today = u.todayStr();
    if (!confirm("¿Marcar Hyalu B5 como terminado a partir de hoy (" + u.longDate(today) + ")?\n\nDesde esta fecha la app pasa a Fase 2 y habilita SANA Wrinkle Care. Podés ajustar la fecha en Ajustes.")) return;
    S.updateSettings({ hyaluFinishedDate: today });
    toast("Fase 2 activada");
    SK.app.render();
  }
  function confirmSana() {
    if (!confirm("¿Confirmás que tolerás bien el SANA?\n\nEsto habilita subir la meta de SANA hasta " + cfg.DEFAULT_TARGETS.sanaPerWeekMax + "×/semana. No la sube sola: la ajustás en Ajustes.")) return;
    S.updateSettings({ sanaToleratedConfirmed: true });
    toast("SANA: podés subir a 2×/semana en Ajustes");
    SK.app.render();
  }

  // ==== AJUSTES =============================================================
  function renderSettings() {
    const s = S.settings();
    const pn = s.productNames;
    const maxSana = s.sanaToleratedConfirmed ? cfg.DEFAULT_TARGETS.sanaPerWeekMax : cfg.DEFAULT_TARGETS.sanaPerWeekStart;

    function nameField(id, label) {
      return '<div class="field"><label>' + u.esc(label) + '</label>' +
        '<input type="text" data-pname="' + id + '" value="' + u.esc(pn[id]) + '"></div>';
    }

    u.el("view-settings").innerHTML =
      '<div class="card"><h2>Rutina y fases</h2>' +
        '<div class="field"><label>Inicio de la rutina</label>' +
          '<input type="date" id="setStart" value="' + u.esc(s.routineStartDate) + '"></div>' +
        '<div class="field"><label>Hyalu B5 terminado el</label>' +
          '<input type="date" id="setHyalu" value="' + u.esc(s.hyaluFinishedDate || "") + '">' +
          '<div class="hint">Vacío = seguís en Fase 1. Con fecha = Fase 2 desde ese día.</div></div>' +
        '<div class="field"><label>Meta Retinol B3 (noches/semana)</label>' +
          '<input type="number" id="setRet" min="0" max="7" value="' + (s.retinolB3PerWeek | 0) + '"></div>' +
        '<div class="field"><label>Meta SANA Wrinkle (noches/semana)</label>' +
          '<input type="number" id="setSana" min="0" max="' + maxSana + '" value="' + (s.sanaPerWeek | 0) + '">' +
          '<div class="hint">' + (s.sanaToleratedConfirmed ? "Máximo habilitado: " + maxSana + "×." : "Máximo " + maxSana + "× hasta confirmar tolerancia en Fases.") + "</div></div>" +
        '<div class="field switchrow"><label style="margin:0">SANA Brightening (opcional AM)</label>' +
          '<span class="switch"><input type="checkbox" id="setBright" ' + (s.brightingEnabled ? "checked" : "") + '><span class="track"></span><span class="thumb"></span></span></div>' +
      "</div>" +

      '<div class="card"><h2>Apariencia</h2>' +
        '<div class="field"><label>Tema</label><div class="seg" id="themeSeg">' +
          ['auto', 'light', 'dark'].map((t) =>
            '<button data-theme="' + t + '" class="' + (s.theme === t ? "on" : "") + '">' +
            ({ auto: "Auto", light: "Claro", dark: "Oscuro" }[t]) + "</button>").join("") +
        "</div></div></div>" +

      '<div class="card"><h2>Nombres de productos</h2>' +
        nameField("cleanser", "Limpiador") +
        nameField("hyaluEyes", "Contorno actual (Hyalu B5)") +
        nameField("sanaWrinkle", "Contorno retinol (SANA Wrinkle)") +
        nameField("sanaBright", "Contorno brightening (SANA)") +
        nameField("retinolB3", "Sérum retinol facial (B3)") +
        nameField("moisturizer", "Hidratante") +
        nameField("spf", "Protector solar") +
        '<button class="btn primary block" id="saveNames" style="margin-top:12px">Guardar nombres</button>' +
      "</div>" +

      '<div class="card"><h2>Datos</h2>' +
        '<div class="field"><label>Exportar</label>' +
          '<div style="display:flex;gap:10px">' +
          '<button class="btn ghost" id="expJson" style="flex:1">' + I("download", 18) + " JSON</button>" +
          '<button class="btn ghost" id="expCsv" style="flex:1">' + I("download", 18) + " CSV</button></div>" +
          '<div class="hint">El JSON sirve para volver a importar. El CSV es para abrir en Excel/Sheets (sólo exportación).</div></div>' +
        '<div class="field"><label>Importar (JSON)</label>' +
          '<button class="btn ghost block" id="impJson">' + I("upload", 18) + " Elegir archivo JSON</button>" +
          '<input type="file" id="impFile" accept="application/json,.json" style="display:none">' +
          '<div class="hint">Reemplaza todos los datos actuales por los del archivo.</div></div>' +
        '<div class="field"><label>Zona de riesgo</label>' +
          '<button class="btn danger block" id="clearAll">' + I("trash", 18) + " Borrar todos los datos</button></div>" +
      "</div>" +
      '<p class="disclaimer">Todos los datos viven sólo en este navegador (localStorage). No se envían a ningún servidor. Si borrás los datos del navegador, se pierden: exportá de vez en cuando.</p>';

    wireSettings();
  }

  function wireSettings() {
    const setNum = (el, key, min, max) => {
      el.onchange = function () {
        let v = parseInt(el.value, 10); if (isNaN(v)) v = min;
        v = Math.max(min, Math.min(max, v)); el.value = v;
        S.updateSettings({ [key]: v }); toast("Guardado"); renderTopbar();
      };
    };
    u.el("setStart").onchange = function () { S.updateSettings({ routineStartDate: this.value }); toast("Guardado"); };
    u.el("setHyalu").onchange = function () {
      S.updateSettings({ hyaluFinishedDate: this.value || null }); toast("Guardado"); SK.app.render();
    };
    setNum(u.el("setRet"), "retinolB3PerWeek", 0, 7);
    const sanaEl = u.el("setSana");
    const maxSana = S.settings().sanaToleratedConfirmed ? cfg.DEFAULT_TARGETS.sanaPerWeekMax : cfg.DEFAULT_TARGETS.sanaPerWeekStart;
    sanaEl.onchange = function () {
      let v = parseInt(sanaEl.value, 10); if (isNaN(v)) v = 0;
      const irr = L.recentIrritation(u.todayStr());
      if (v > (S.settings().sanaPerWeek | 0) && irr.triggered) {
        if (!confirm(irr.message + "\n\n¿Subir la frecuencia igualmente?")) { sanaEl.value = S.settings().sanaPerWeek | 0; return; }
      }
      v = Math.max(0, Math.min(maxSana, v)); sanaEl.value = v;
      S.updateSettings({ sanaPerWeek: v }); toast("Guardado"); renderTopbar();
    };
    // también avisar al subir retinol
    const retEl = u.el("setRet");
    const baseRetHandler = retEl.onchange;
    retEl.onchange = function () {
      let v = parseInt(retEl.value, 10); if (isNaN(v)) v = 0;
      const irr = L.recentIrritation(u.todayStr());
      if (v > (S.settings().retinolB3PerWeek | 0) && irr.triggered) {
        if (!confirm(irr.message + "\n\n¿Subir la frecuencia igualmente?")) { retEl.value = S.settings().retinolB3PerWeek | 0; return; }
      }
      baseRetHandler.call(retEl);
    };

    u.el("setBright").onchange = function () { S.updateSettings({ brightingEnabled: this.checked }); toast("Guardado"); };

    Array.prototype.forEach.call(u.el("themeSeg").children, function (b) {
      b.onclick = function () { const t = b.getAttribute("data-theme"); S.updateSettings({ theme: t }); applyTheme(); renderSettings(); };
    });

    u.el("saveNames").onclick = function () {
      const names = Object.assign({}, S.settings().productNames);
      Array.prototype.forEach.call(document.querySelectorAll("[data-pname]"), function (inp) {
        const v = inp.value.trim(); if (v) names[inp.getAttribute("data-pname")] = v;
      });
      S.updateSettings({ productNames: names }); toast("Nombres guardados"); SK.app.render();
    };

    u.el("expJson").onclick = function () { download("skincare-datos.json", S.exportJSON(), "application/json"); };
    u.el("expCsv").onclick = function () { download("skincare-datos.csv", S.exportCSV(), "text/csv"); };
    u.el("impJson").onclick = function () { u.el("impFile").click(); };
    u.el("impFile").onchange = function () {
      const f = this.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = function () {
        if (!confirm("Esto reemplaza TODOS los datos actuales por los del archivo. ¿Continuar?")) { u.el("impFile").value = ""; return; }
        const res = S.importJSON(String(r.result));
        if (res.ok) { toast("Importado: " + res.days + " días"); SK.app.render(); }
        else alert("No se pudo importar: " + res.error);
        u.el("impFile").value = "";
      };
      r.readAsText(f);
    };
    u.el("clearAll").onclick = function () {
      if (!confirm("¿Borrar TODOS los datos de forma permanente? Esta acción no se puede deshacer.")) return;
      if (!confirm("Última confirmación: se borra todo el historial y la configuración.")) return;
      S.clearAll(); applyTheme(); toast("Datos borrados"); SK.app.render();
    };
  }

  function download(filename, text, mime) {
    const blob = new Blob([text], { type: mime + ";charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; document.body.appendChild(a); a.click();
    setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
  }

  // ==== EDITOR DE DÍA (modal) ==============================================
  function openEditor(date) {
    const src = S.getDay(date) || { am: { done: {}, skipped: false }, pm: { type: null, done: {} }, tolerance: null, note: "" };
    editor = { date, day: JSON.parse(JSON.stringify(src)) };
    editor.day.am = editor.day.am || { done: {}, skipped: false };
    editor.day.am.done = editor.day.am.done || {};
    editor.day.pm = editor.day.pm || { type: null, done: {} };
    editor.day.pm.done = editor.day.pm.done || {};
    renderEditor();
    u.el("modalBack").classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeEditor() {
    u.el("modalBack").classList.remove("open");
    document.body.style.overflow = "";
    editor = null;
  }

  function renderEditor() {
    const { date, day } = editor;
    const phase = L.phaseForDate(date);
    const s = S.settings();
    const pn = s.productNames;
    const nt = cfg.NIGHT_TYPES;
    const isToday = date === u.todayStr();
    const sug = L.suggestNight(date);

    // AM
    const amSteps = L.amSteps(date);
    const amChk = amSteps.map(function (st) {
      const on = !!day.am.done[st.id];
      return '<button class="chk ' + (on ? "on" : "") + '" data-slot="am" data-id="' + st.id + '">' +
        '<span class="box">' + (on ? I("check") : "") + "</span>" +
        '<span class="name">' + u.esc(pn[st.id]) + (st.optional ? '<span class="opt">opcional</span>' : "") + "</span></button>";
    }).join("");

    // PM tipos
    const types = L.nightTypesFor(date);
    const typeBtns = types.map(function (t) {
      return '<button class="ntype ' + (day.pm.type === t ? "on" : "") + '" data-type="' + t + '">' +
        '<span class="swatch"></span>' + u.esc(nt[t].label) + "</button>";
    }).join("");

    let pmBody = "";
    if (day.pm.type && day.pm.type !== "none") {
      const steps = L.pmSteps(date, day.pm.type);
      pmBody = steps.map(function (st) {
        const on = !!day.pm.done[st.id];
        return '<button class="chk ' + (on ? "on" : "") + '" data-slot="pm" data-id="' + st.id + '">' +
          '<span class="box">' + (on ? I("check") : "") + "</span>" +
          '<span class="name">' + u.esc(pn[st.id]) + "</span></button>";
      }).join("");
      // aviso de la regla (4/5) + advertencia por irritación
      const hint = nt[day.pm.type].hint;
      if (hint) pmBody += '<div class="hintbox ' + nt[day.pm.type].color + '">' + I("info", 16) + "<div>" + u.esc(hint) + "</div></div>";
      if (nt[day.pm.type].counts) {
        const irr = L.recentIrritation(date);
        if (irr.triggered) pmBody += '<div class="hintbox warn">' + I("warning", 16) + "<div>" + u.esc(irr.message) + "</div></div>";
      }
    } else if (day.pm.type === "none") {
      pmBody = '<p class="hint" style="color:var(--muted);font-size:13px">Marcaste que esta noche no hiciste rutina.</p>';
    }

    // tolerancia
    const tolBtns = cfg.TOLERANCE.map(function (t) {
      return '<button class="tol ' + (day.tolerance === t.level ? "on" : "") + '" data-lv="' + t.level + '">' +
        '<span class="lv">' + t.level + "</span><span class=\"tt\">" + u.esc(t.label) + "</span></button>";
    }).join("");

    const suggestLine = (isToday && !day.pm.type)
      ? '<div class="hintbox recovery" style="background:var(--accent-weak);color:var(--accent-ink)">' + I("spark", 16) +
        "<div>Sugerido: <b>" + u.esc(nt[sug.type].label) + "</b> — " + u.esc(sug.reason) +
        ' <button class="btn ghost" id="useSuggest" style="min-height:32px;padding:0 10px;margin-left:6px">Usar</button></div></div>'
      : "";

    u.el("modal").innerHTML =
      '<div class="modal-head"><div><h2>' + (isToday ? "Hoy" : u.esc(u.weekday(date))) + " " + u.parse(date).getDate() + "</h2>" +
        '<div class="sub">' + u.esc(u.longDate(date)) + " · Fase " + phase + "</div></div>" +
        '<button class="iconbtn" id="closeModal" aria-label="Cerrar">' + I("close", 20) + "</button></div>" +

      '<div class="editor-section"><div class="es-head">' + I("sun", 18) + " Mañana</div>" +
        amChk +
        '<button class="chk ' + (day.am.skipped ? "on" : "") + '" data-slot="amskip" style="border-top:1px dashed var(--border);margin-top:4px">' +
        '<span class="box" style="border-radius:50%">' + (day.am.skipped ? I("check") : "") + "</span>" +
        '<span class="name" style="color:var(--muted)">No hice rutina AM</span></button>' +
      "</div>" +

      '<div class="editor-section"><div class="es-head">' + I("moon", 18) + " Noche</div>" +
        suggestLine +
        '<div class="ntypes">' + typeBtns + "</div>" +
        '<div style="margin-top:12px">' + pmBody + "</div>" +
      "</div>" +

      '<div class="editor-section"><div class="es-head">' + I("droplet", 18) + " Tolerancia de la piel</div>" +
        '<div class="tolgrid">' + tolBtns + "</div>" +
        '<div class="field" style="border:none;padding:12px 0 0"><label>Observaciones</label>' +
        '<textarea id="noteInput" placeholder="Ej.: leve descamación en la nariz, todo normal, ardor al aplicar…">' + u.esc(day.note || "") + "</textarea></div>" +
      "</div>" +

      '<div class="modal-actions"><button class="btn ghost" id="cancelEdit">Cancelar</button>' +
      '<button class="btn primary" id="saveEdit">Guardar</button></div>';

    wireEditor();
  }

  function wireEditor() {
    u.el("closeModal").onclick = closeEditor;
    u.el("cancelEdit").onclick = closeEditor;
    u.el("saveEdit").onclick = function () {
      editor.day.note = u.el("noteInput").value;
      S.saveDay(editor.date, editor.day);
      toast("Guardado");
      closeEditor();
      SK.app.render();
    };

    // checklist AM/PM
    Array.prototype.forEach.call(document.querySelectorAll(".chk[data-slot]"), function (btn) {
      const slot = btn.getAttribute("data-slot");
      btn.onclick = function () {
        if (slot === "amskip") {
          editor.day.am.skipped = !editor.day.am.skipped;
          if (editor.day.am.skipped) editor.day.am.done = {};
        } else {
          const id = btn.getAttribute("data-id");
          const bag = slot === "am" ? editor.day.am.done : editor.day.pm.done;
          bag[id] = !bag[id];
          if (slot === "am" && bag[id]) editor.day.am.skipped = false;
        }
        // guardar nota en curso antes de re-render
        editor.day.note = u.el("noteInput").value;
        renderEditor();
      };
    });

    // tipos de noche
    Array.prototype.forEach.call(document.querySelectorAll(".ntype[data-type]"), function (btn) {
      btn.onclick = function () {
        const t = btn.getAttribute("data-type");
        editor.day.pm.type = (editor.day.pm.type === t) ? null : t;
        if (editor.day.pm.type === "none" || editor.day.pm.type === null) editor.day.pm.done = {};
        editor.day.note = u.el("noteInput").value;
        renderEditor();
      };
    });

    // tolerancia
    Array.prototype.forEach.call(document.querySelectorAll(".tol[data-lv]"), function (btn) {
      btn.onclick = function () {
        const lv = parseInt(btn.getAttribute("data-lv"), 10);
        editor.day.tolerance = (editor.day.tolerance === lv) ? null : lv;
        editor.day.note = u.el("noteInput").value;
        renderEditor();
      };
    });

    if (u.el("useSuggest")) u.el("useSuggest").onclick = function () {
      const sug = L.suggestNight(editor.date);
      editor.day.pm.type = sug.type;
      editor.day.note = u.el("noteInput").value;
      renderEditor();
    };
  }

  // ==== tema + toast ========================================================
  function applyTheme() {
    const t = S.settings().theme;
    if (t === "auto") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", t);
  }
  let toastTimer;
  function toast(msg) {
    const el = u.el("toast");
    el.textContent = msg; el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("show"); }, 1600);
  }

  return {
    renderTopbar, renderToday, renderCalendar, renderProgress, renderPhases, renderSettings,
    openEditor, closeEditor, applyTheme, toast,
  };
})();
