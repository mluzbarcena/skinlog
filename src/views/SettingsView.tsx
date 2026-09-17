/* =============================================================================
   SettingsView — routine/phase targets, appearance, language, the editable
   product catalog, the editable routine steps, and data export/import/clear.
   All changes persist immediately.
   ============================================================================= */

import { useEffect, useRef, useState } from "react";
import { todayStr } from "../domain/dates";
import { maxSanaPerWeek, recentIrritation } from "../domain/logic";
import { NIGHT_TYPES_BY_PHASE } from "../domain/config";
import {
  clearAll,
  exportCSV,
  exportJSON,
  importJSON,
  updateSettings,
  useStore,
} from "../state/useStore";
import { useI18n } from "../i18n/useI18n";
import type { Dict } from "../i18n/es";
import { useToast } from "../components/Toast";
import { Icon } from "../components/Icon";
import { useSync } from "../sync/useSync";
import type { EditableNight, Lang, Phase, Product, RoutineStep } from "../domain/types";

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

/** Editable ordered list of routine steps for one slot (AM or a night type). */
function StepList({
  list,
  products,
  t,
  onChange,
}: {
  list: RoutineStep[];
  products: Product[];
  t: Dict;
  onChange: (next: RoutineStep[]) => void;
}) {
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  return (
    <>
      {list.length === 0 && (
        <p className="hint" style={{ fontSize: 13 }}>
          {t.settings.emptyRoutine}
        </p>
      )}
      {list.map((step, i) => (
        <div className="field" key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select
            style={{ flex: 1 }}
            value={step.id}
            onChange={(e) => onChange(list.map((s, k) => (k === i ? { ...s, id: e.target.value } : s)))}
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name || p.id}
              </option>
            ))}
          </select>
          <label
            className="switch"
            title={t.settings.optionalStep}
            style={{ display: "inline-flex", alignItems: "center" }}
          >
            <input
              type="checkbox"
              checked={!!step.optional}
              onChange={(e) => onChange(list.map((s, k) => (k === i ? { ...s, optional: e.target.checked } : s)))}
            />
            <span className="track" />
            <span className="thumb" />
          </label>
          <button className="iconbtn" aria-label={t.settings.moveUp} disabled={i === 0} onClick={() => move(i, -1)}>
            <Icon name="chevronUp" size={18} />
          </button>
          <button
            className="iconbtn"
            aria-label={t.settings.moveDown}
            disabled={i === list.length - 1}
            onClick={() => move(i, 1)}
          >
            <Icon name="chevronDown" size={18} />
          </button>
          <button
            className="iconbtn"
            aria-label={t.settings.removeStep}
            onClick={() => onChange(list.filter((_, k) => k !== i))}
          >
            <Icon name="close" size={18} />
          </button>
        </div>
      ))}
      <button
        className="btn ghost btn-block"
        style={{ marginBottom: 12 }}
        onClick={() => onChange([...list, { id: products[0].id }])}
      >
        <Icon name="plus" size={16} /> {t.settings.addStep}
      </button>
    </>
  );
}

/** Optional cloud-sync card. Renders nothing unless Firebase is configured. */
function SyncCard({ t }: { t: Dict }) {
  const sync = useSync();
  if (!sync.configured) return null;
  return (
    <div className="card">
      <h2>{t.settings.sync.title}</h2>
      {sync.user ? (
        <>
          <p className="hint">{t.settings.sync.signedInAs(sync.user.email ?? "—")}</p>
          <div className="field" style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {sync.status === "synced" && <Icon name="check" size={16} />}
            {sync.status === "error" && <Icon name="warning" size={16} />}
            <span className="hint" style={{ marginTop: 0 }}>
              {sync.status === "syncing"
                ? t.settings.sync.statusSyncing
                : sync.status === "error"
                  ? t.settings.sync.statusError
                  : sync.lastSyncedAt
                    ? t.settings.sync.lastSynced(new Date(sync.lastSyncedAt).toLocaleTimeString())
                    : t.settings.sync.statusSynced}
            </span>
          </div>
          <button className="btn ghost btn-block" onClick={sync.disable}>
            <Icon name="globe" size={18} /> {t.settings.sync.signOut}
          </button>
        </>
      ) : (
        <>
          <p className="hint">{t.settings.sync.intro}</p>
          <button className="btn ghost btn-block" onClick={sync.enable}>
            <Icon name="globe" size={18} /> {t.settings.sync.signIn}
          </button>
        </>
      )}
    </div>
  );
}

export function SettingsView() {
  const state = useStore();
  const { t, lang } = useI18n();
  const toast = useToast();
  const s = state.settings;
  const maxSana = maxSanaPerWeek(state);

  const [ret, setRet] = useState(String(s.retinolB3PerWeek));
  const [sana, setSana] = useState(String(s.sanaPerWeek));
  const [routinePhase, setRoutinePhase] = useState<Phase>(1);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => setRet(String(s.retinolB3PerWeek)), [s.retinolB3PerWeek]);
  useEffect(() => setSana(String(s.sanaPerWeek)), [s.sanaPerWeek]);

  // Catalog always rendered/edited in explicit order.
  const products = [...s.products].sort((a, b) => a.order - b.order);
  const editableNights = NIGHT_TYPES_BY_PHASE[routinePhase].filter(
    (n): n is EditableNight => n !== "none",
  );

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

  // --- product catalog editing (order renumbered contiguously on commit) ---
  function commitProducts(next: Product[]) {
    updateSettings({ products: next.map((p, i) => ({ ...p, order: i })) });
  }
  function addProduct() {
    commitProducts([...products, { id: crypto.randomUUID(), name: "", order: products.length }]);
  }
  function renameProduct(id: string, name: string) {
    commitProducts(products.map((p) => (p.id === id ? { ...p, name } : p)));
  }
  function moveProduct(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= products.length) return;
    const next = [...products];
    [next[i], next[j]] = [next[j], next[i]];
    commitProducts(next);
  }
  function deleteProduct(id: string) {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    if (!confirm(t.settings.deleteProductConfirm(p.name || p.id))) return;
    // Drop the product and any routine step that referenced it.
    const routines = structuredClone(s.routines);
    for (const ph of [1, 2] as const) {
      routines[ph].am = routines[ph].am.filter((st) => st.id !== id);
      for (const nt of Object.keys(routines[ph].pm) as EditableNight[]) {
        routines[ph].pm[nt] = routines[ph].pm[nt]!.filter((st) => st.id !== id);
      }
    }
    updateSettings({
      products: products.filter((x) => x.id !== id).map((x, i) => ({ ...x, order: i })),
      routines,
    });
    toast(t.settings.saved);
  }

  // --- routine editing ---
  function setRoutineList(
    phase: Phase,
    slot: { kind: "am" } | { kind: "pm"; night: EditableNight },
    next: RoutineStep[],
  ) {
    const routines = structuredClone(s.routines);
    if (slot.kind === "am") routines[phase].am = next;
    else routines[phase].pm[slot.night] = next;
    updateSettings({ routines });
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
        <h2>{t.settings.productsTitle}</h2>
        {products.map((p, i) => (
          <div className="field" key={p.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="text"
              style={{ flex: 1 }}
              placeholder={t.settings.productNamePlaceholder}
              value={p.name}
              onChange={(e) => renameProduct(p.id, e.target.value)}
            />
            <button className="iconbtn" aria-label={t.settings.moveUp} disabled={i === 0} onClick={() => moveProduct(i, -1)}>
              <Icon name="chevronUp" size={18} />
            </button>
            <button
              className="iconbtn"
              aria-label={t.settings.moveDown}
              disabled={i === products.length - 1}
              onClick={() => moveProduct(i, 1)}
            >
              <Icon name="chevronDown" size={18} />
            </button>
            <button className="iconbtn" aria-label={t.settings.removeStep} onClick={() => deleteProduct(p.id)}>
              <Icon name="trash" size={18} />
            </button>
          </div>
        ))}
        <button className="btn ghost btn-block" style={{ marginTop: 4 }} onClick={addProduct}>
          <Icon name="plus" size={16} /> {t.settings.addProduct}
        </button>
      </div>

      <div className="card">
        <h2>{t.settings.routinesTitle}</h2>
        {products.length === 0 ? (
          <p className="hint">{t.settings.noProducts}</p>
        ) : (
          <>
            <div className="field">
              <label>{t.settings.routinePhase}</label>
              <div className="seg">
                {([1, 2] as const).map((ph) => (
                  <button key={ph} className={routinePhase === ph ? "on" : ""} onClick={() => setRoutinePhase(ph)}>
                    {ph === 1 ? t.phases.phase1 : t.phases.phase2}
                  </button>
                ))}
              </div>
            </div>

            <h3>{t.settings.routineAm}</h3>
            <StepList
              list={s.routines[routinePhase].am}
              products={products}
              t={t}
              onChange={(next) => setRoutineList(routinePhase, { kind: "am" }, next)}
            />

            {editableNights.map((nt) => (
              <div key={nt}>
                <h3>{t.night.short(nt)}</h3>
                <StepList
                  list={s.routines[routinePhase].pm[nt] ?? []}
                  products={products}
                  t={t}
                  onChange={(next) => setRoutineList(routinePhase, { kind: "pm", night: nt }, next)}
                />
              </div>
            ))}
          </>
        )}
      </div>

      <SyncCard t={t} />

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
