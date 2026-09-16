/* =============================================================================
   DayEditor.tsx — modal to edit a single day: AM checklist, PM night type +
   checklist, skin tolerance and a note. Edits happen on a local copy and are
   committed with saveDay() on "Save" (empty days are dropped by the store).
   ============================================================================= */

import { useEffect, useState } from "react";
import { parse, todayStr } from "../domain/dates";
import { amSteps, nightTypesFor, phaseForDate, pmSteps, recentIrritation, suggestNight } from "../domain/logic";
import { NIGHT_TYPES, TOLERANCE } from "../domain/config";
import { emptyDay, getDay, saveDay, useStore } from "../state/useStore";
import { useI18n } from "../i18n/useI18n";
import { useToast } from "./Toast";
import { Icon } from "./Icon";
import type { DayRecord, NightType, ToleranceLevel } from "../domain/types";

export function DayEditor({ date, onClose }: { date: string; onClose: () => void }) {
  const state = useStore();
  const { t, fmt } = useI18n();
  const toast = useToast();
  const s = state.settings;

  const [day, setDay] = useState<DayRecord>(() => structuredClone(getDay(date) ?? emptyDay()));

  // lock background scroll + close on Escape while the modal is mounted.
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  function patch(mut: (d: DayRecord) => void) {
    setDay((prev) => {
      const d = structuredClone(prev);
      mut(d);
      return d;
    });
  }

  const phase = phaseForDate(state, date);
  const isToday = date === todayStr();
  const sug = suggestNight(state, date);
  const names = s.productNames;

  const amList = amSteps(state, date);
  const types = nightTypesFor(state, date);
  const pmList = pmSteps(state, date, day.pm.type);
  const nightMeta = day.pm.type && day.pm.type !== "none" ? NIGHT_TYPES[day.pm.type] : null;
  const showIrritationWarn = !!nightMeta?.counts && recentIrritation(state, date).triggered;

  function toggleAm(id: (typeof amList)[number]["id"]) {
    patch((d) => {
      d.am.done[id] = !d.am.done[id];
      if (d.am.done[id]) d.am.skipped = false;
    });
  }
  function toggleAmSkip() {
    patch((d) => {
      d.am.skipped = !d.am.skipped;
      if (d.am.skipped) d.am.done = {};
    });
  }
  function pickType(type: NightType) {
    patch((d) => {
      d.pm.type = d.pm.type === type ? null : type;
      if (d.pm.type === "none" || d.pm.type === null) d.pm.done = {};
    });
  }
  function togglePm(id: (typeof pmList)[number]["id"]) {
    patch((d) => {
      d.pm.done[id] = !d.pm.done[id];
    });
  }
  function pickTol(lv: ToleranceLevel) {
    patch((d) => {
      d.tolerance = d.tolerance === lv ? null : lv;
    });
  }

  function save() {
    saveDay(date, day);
    toast(t.settings.saved);
    onClose();
  }

  return (
    <div
      className="modal-back"
      role="dialog"
      aria-modal="true"
      aria-label={fmt.longDate(date)}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal">
        <div className="modal-head">
          <div>
            <h2>{isToday ? t.editor.todayTitle : `${fmt.weekday(date)} ${parse(date).getDate()}`}</h2>
            <div className="sub">
              {fmt.longDate(date)} · {t.editor.phaseLabel(phase)}
            </div>
          </div>
          <button className="iconbtn" aria-label={t.editor.close} onClick={onClose}>
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Morning */}
        <div className="editor-section">
          <div className="es-head">
            <Icon name="sun" size={18} /> {t.editor.morning}
          </div>
          {amList.map((step) => {
            const on = !!day.am.done[step.id];
            return (
              <button key={step.id} className={"chk" + (on ? " on" : "")} onClick={() => toggleAm(step.id)}>
                <span className="box">{on && <Icon name="check" size={17} />}</span>
                <span className="name">
                  {names[step.id]}
                  {step.optional && <span className="opt">{t.editor.optional}</span>}
                </span>
              </button>
            );
          })}
          <button
            className={"chk" + (day.am.skipped ? " on" : "")}
            style={{ borderTop: "1px dashed var(--border)", marginTop: 4 }}
            onClick={toggleAmSkip}
          >
            <span className="box" style={{ borderRadius: "50%" }}>
              {day.am.skipped && <Icon name="check" size={17} />}
            </span>
            <span className="name" style={{ color: "var(--muted)" }}>
              {t.editor.noAmRoutine}
            </span>
          </button>
        </div>

        {/* Night */}
        <div className="editor-section">
          <div className="es-head">
            <Icon name="moon" size={18} /> {t.editor.night}
          </div>

          {isToday && !day.pm.type && (
            <div
              className="hintbox recovery"
              style={{ background: "var(--accent-weak)", color: "var(--accent-ink)" }}
            >
              <Icon name="spark" size={16} />
              <div>
                {t.editor.suggested} <b>{t.night.label(sug.type)}</b> — {t.suggestion(sug.reason)}{" "}
                <button
                  className="btn ghost"
                  style={{ minHeight: 32, padding: "0 10px", marginLeft: 6 }}
                  onClick={() => pickType(sug.type)}
                >
                  {t.editor.use}
                </button>
              </div>
            </div>
          )}

          <div className="ntypes">
            {types.map((type) => (
              <button
                key={type}
                className={"ntype" + (day.pm.type === type ? " on" : "")}
                data-type={type}
                onClick={() => pickType(type)}
              >
                <span className="swatch" />
                {t.night.label(type)}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 12 }}>
            {day.pm.type && day.pm.type !== "none" && (
              <>
                {pmList.map((step) => {
                  const on = !!day.pm.done[step.id];
                  return (
                    <button key={step.id} className={"chk" + (on ? " on" : "")} onClick={() => togglePm(step.id)}>
                      <span className="box">{on && <Icon name="check" size={17} />}</span>
                      <span className="name">{names[step.id]}</span>
                    </button>
                  );
                })}
                {nightMeta && t.night.hint(day.pm.type) && (
                  <div className={"hintbox " + nightMeta.color}>
                    <Icon name="info" size={16} />
                    <div>{t.night.hint(day.pm.type)}</div>
                  </div>
                )}
                {showIrritationWarn && (
                  <div className="hintbox warn">
                    <Icon name="warning" size={16} />
                    <div>{t.irritationWarning}</div>
                  </div>
                )}
              </>
            )}
            {day.pm.type === "none" && (
              <p className="hint" style={{ fontSize: 13 }}>
                {t.editor.noRoutineNote}
              </p>
            )}
          </div>
        </div>

        {/* Tolerance + note */}
        <div className="editor-section">
          <div className="es-head">
            <Icon name="droplet" size={18} /> {t.editor.skinTolerance}
          </div>
          <div className="tolgrid">
            {TOLERANCE.map((tol) => (
              <button
                key={tol.level}
                className={"tol" + (day.tolerance === tol.level ? " on" : "")}
                data-lv={tol.level}
                onClick={() => pickTol(tol.level)}
              >
                <span className="lv">{tol.level}</span>
                <span className="tt">{t.tolerance.label(tol.level)}</span>
              </button>
            ))}
          </div>
          <div className="field" style={{ border: "none", padding: "12px 0 0" }}>
            <label>{t.editor.notes}</label>
            <textarea
              value={day.note}
              placeholder={t.editor.notePlaceholder}
              onChange={(e) => patch((d) => (d.note = e.target.value))}
            />
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn ghost" onClick={onClose}>
            {t.editor.cancel}
          </button>
          <button className="btn primary" onClick={save}>
            {t.editor.save}
          </button>
        </div>
      </div>
    </div>
  );
}
