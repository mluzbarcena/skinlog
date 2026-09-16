/* =============================================================================
   SettingsView — routine/phase targets, appearance, language, product names,
   and data export/import/clear. All changes persist immediately.
   ============================================================================= */

import { useEffect, useRef, useState } from "react";
import { todayStr } from "../domain/dates";
import { maxSanaPerWeek, recentIrritation } from "../domain/logic";
import {
  clearAll,
  exportCSV,
  exportJSON,
  importJSON,
  updateSettings,
  useStore,
} from "../state/useStore";
import { useI18n } from "../i18n/useI18n";
import { useToast } from "../components/Toast";
import { Icon } from "../components/Icon";
import type { Lang, ProductId } from "../domain/types";

function download(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime + ";charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

export function SettingsView() {
  const state = useStore();
  const { t, lang } = useI18n();
  const toast = useToast();
  const s = state.settings;
  const maxSana = maxSanaPerWeek(state);

  const [ret, setRet] = useState(String(s.retinolB3PerWeek));
  const [sana, setSana] = useState(String(s.sanaPerWeek));
  const [names, setNames] = useState<Record<ProductId, string>>({ ...s.productNames });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => setRet(String(s.retinolB3PerWeek)), [s.retinolB3PerWeek]);
  useEffect(() => setSana(String(s.sanaPerWeek)), [s.sanaPerWeek]);
  useEffect(() => setNames({ ...s.productNames }), [s.productNames]);

  function commitRet() {
    let v = parseInt(ret, 10);
    if (isNaN(v)) v = 0;
    if (v > s.retinolB3PerWeek && recentIrritation(state, todayStr()).triggered) {
      if (!confirm(t.irritationWarning + "\n\n" + t.settings.raiseAnyway)) {
        setRet(String(s.retinolB3PerWeek));
        return;
      }
    }
    v = Math.max(0, Math.min(7, v));
    updateSettings({ retinolB3PerWeek: v });
    toast(t.settings.saved);
  }

  function commitSana() {
    let v = parseInt(sana, 10);
    if (isNaN(v)) v = 0;
    if (v > s.sanaPerWeek && recentIrritation(state, todayStr()).triggered) {
      if (!confirm(t.irritationWarning + "\n\n" + t.settings.raiseAnyway)) {
        setSana(String(s.sanaPerWeek));
        return;
      }
    }
    v = Math.max(0, Math.min(maxSana, v));
    updateSettings({ sanaPerWeek: v });
    toast(t.settings.saved);
  }

  function saveNames() {
    const next = { ...s.productNames };
    (Object.keys(names) as ProductId[]).forEach((id) => {
      const v = names[id].trim();
      if (v) next[id] = v;
    });
    updateSettings({ productNames: next });
    toast(t.settings.namesSaved);
  }

  function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (confirm(t.settings.importReplaceConfirm)) {
        const res = importJSON(String(reader.result));
        if (res.ok) toast(t.settings.imported(res.days ?? 0));
        else {
          const msg = res.error === "invalidJson" ? t.settings.errInvalidJson : t.settings.errInvalidShape;
          alert(t.settings.importError(msg));
        }
      }
      if (fileRef.current) fileRef.current.value = "";
    };
    reader.readAsText(f);
  }

  function clearData() {
    if (!confirm(t.settings.clearConfirm1)) return;
    if (!confirm(t.settings.clearConfirm2)) return;
    clearAll();
    toast(t.settings.dataDeleted);
  }

  const nameFields: { id: ProductId; label: string }[] = [
    { id: "cleanser", label: t.settings.nameCleanser },
    { id: "hyaluEyes", label: t.settings.nameHyaluEyes },
    { id: "sanaWrinkle", label: t.settings.nameSanaWrinkle },
    { id: "sanaBright", label: t.settings.nameSanaBright },
    { id: "retinolB3", label: t.settings.nameRetinolB3 },
    { id: "moisturizer", label: t.settings.nameMoisturizer },
    { id: "spf", label: t.settings.nameSpf },
  ];

  return (
    <section className="view" aria-label={t.nav.settings}>
      <div className="card">
        <h2>{t.settings.routineAndPhases}</h2>
        <div className="field">
          <label>{t.settings.routineStart}</label>
          <input
            type="date"
            value={s.routineStartDate}
            onChange={(e) => updateSettings({ routineStartDate: e.target.value })}
          />
        </div>
        <div className="field">
          <label>{t.settings.hyaluFinishedOn}</label>
          <input
            type="date"
            value={s.hyaluFinishedDate || ""}
            onChange={(e) => updateSettings({ hyaluFinishedDate: e.target.value || null })}
          />
          <div className="hint">{t.settings.hyaluHint}</div>
        </div>
        <div className="field">
          <label>{t.settings.retinolTarget}</label>
          <input type="number" min={0} max={7} value={ret} onChange={(e) => setRet(e.target.value)} onBlur={commitRet} />
        </div>
        <div className="field">
          <label>{t.settings.sanaTarget}</label>
          <input
            type="number"
            min={0}
            max={maxSana}
            value={sana}
            onChange={(e) => setSana(e.target.value)}
            onBlur={commitSana}
          />
          <div className="hint">
            {s.sanaToleratedConfirmed ? t.settings.sanaMaxEnabled(maxSana) : t.settings.sanaMaxLocked(maxSana)}
          </div>
        </div>
        <div className="field switchrow">
          <label style={{ margin: 0 }}>{t.settings.brightening}</label>
          <span className="switch">
            <input
              type="checkbox"
              checked={s.brightingEnabled}
              onChange={(e) => updateSettings({ brightingEnabled: e.target.checked })}
            />
            <span className="track" />
            <span className="thumb" />
          </span>
        </div>
      </div>

      <div className="card">
        <h2>{t.settings.appearance}</h2>
        <div className="field">
          <label>{t.settings.theme}</label>
          <div className="seg">
            {(["auto", "light", "dark"] as const).map((th) => (
              <button
                key={th}
                className={s.theme === th ? "on" : ""}
                onClick={() => updateSettings({ theme: th })}
              >
                {th === "auto" ? t.settings.themeAuto : th === "light" ? t.settings.themeLight : t.settings.themeDark}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>{t.settings.language}</label>
          <div className="seg">
            {(["es", "en"] as const).map((lg: Lang) => (
              <button key={lg} className={lang === lg ? "on" : ""} onClick={() => updateSettings({ language: lg })}>
                {lg.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h2>{t.settings.productNames}</h2>
        {nameFields.map(({ id, label }) => (
          <div className="field" key={id}>
            <label>{label}</label>
            <input
              type="text"
              value={names[id]}
              onChange={(e) => setNames((prev) => ({ ...prev, [id]: e.target.value }))}
            />
          </div>
        ))}
        <button className="btn primary btn-block" style={{ marginTop: 12 }} onClick={saveNames}>
          {t.settings.saveNames}
        </button>
      </div>

      <div className="card">
        <h2>{t.settings.data}</h2>
        <div className="field">
          <label>{t.settings.export}</label>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              className="btn ghost"
              style={{ flex: 1 }}
              onClick={() => download("skincare-data.json", exportJSON(), "application/json")}
            >
              <Icon name="download" size={18} /> JSON
            </button>
            <button
              className="btn ghost"
              style={{ flex: 1 }}
              onClick={() => download("skincare-data.csv", exportCSV(), "text/csv")}
            >
              <Icon name="download" size={18} /> CSV
            </button>
          </div>
          <div className="hint">{t.settings.exportHint}</div>
        </div>
        <div className="field">
          <label>{t.settings.importJson}</label>
          <button className="btn ghost btn-block" onClick={() => fileRef.current?.click()}>
            <Icon name="upload" size={18} /> {t.settings.chooseJson}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            style={{ display: "none" }}
            onChange={onImportFile}
          />
          <div className="hint">{t.settings.importHint}</div>
        </div>
        <div className="field">
          <label>{t.settings.dangerZone}</label>
          <button className="btn danger btn-block" onClick={clearData}>
            <Icon name="trash" size={18} /> {t.settings.deleteAll}
          </button>
        </div>
      </div>
      <p className="disclaimer">{t.settings.dataDisclaimer}</p>
      <p className="app-version">v{__APP_VERSION__}</p>
    </section>
  );
}
