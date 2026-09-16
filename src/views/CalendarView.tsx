/* =============================================================================
   CalendarView — month grid; tapping a day opens the editor for that date.
   ============================================================================= */

import { useState } from "react";
import { isFuture, parse, todayStr } from "../domain/dates";
import { dayStatus } from "../domain/logic";
import { NIGHT_TYPES } from "../domain/config";
import { useStore } from "../state/useStore";
import { useI18n } from "../i18n/useI18n";
import { Icon } from "../components/Icon";

function shiftMonth(cm: { y: number; m: number }, delta: number) {
  let m = cm.m + delta;
  let y = cm.y;
  if (m < 0) {
    m = 11;
    y--;
  }
  if (m > 11) {
    m = 0;
    y++;
  }
  return { y, m };
}

export function CalendarView({ openEditor }: { openEditor: (date: string) => void }) {
  const state = useStore();
  const { t, fmt } = useI18n();
  const [cal, setCal] = useState(() => {
    const d = parse(todayStr());
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  const { y, m } = cal;
  const startDow = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const today = todayStr();

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < startDow; i++) cells.push(<div key={"e" + i} className="cell empty" />);
  for (let d = 1; d <= daysInMonth; d++) {
    const date = y + "-" + String(m + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
    const st = dayStatus(state, date);
    const future = isFuture(date);
    const cls = ["cell"];
    if (date === today) cls.push("today");
    if (future) cls.push("future");
    if (!st.registered && !future) cls.push("unreg");

    cells.push(
      <button key={date} className={cls.join(" ")} onClick={() => openEditor(date)}>
        <span className="dnum">{d}</span>
        {st.tolerance != null && (
          <span className={"toldot tol" + st.tolerance} title={t.cal.tolTitle(st.tolerance)} />
        )}
        <div className="marks">
          {st.am.skipped ? (
            <div className="m">
              <Icon name="sun" size={10} />—
            </div>
          ) : st.am.registered ? (
            <div className={"m" + (st.am.complete ? " ok" : "")}>
              <Icon name="sun" size={10} />
              {st.am.done}/{st.am.total}
            </div>
          ) : null}
          {st.pm.type === "none" ? (
            <div className="m">
              <Icon name="moon" size={10} />—
            </div>
          ) : st.pm.isRealRoutine ? (
            <div className={"m" + (st.pm.complete ? " ok" : "")}>
              <Icon name="moon" size={10} />
              {st.pm.done}/{st.pm.total}
            </div>
          ) : null}
          {st.pm.type && st.pm.type !== "none" && (
            <div className={"ntag " + NIGHT_TYPES[st.pm.type].color} />
          )}
        </div>
      </button>,
    );
  }

  return (
    <section className="view" aria-label={t.nav.cal}>
      <div className="cal-nav">
        <button className="btn ghost" aria-label={t.cal.prevMonth} onClick={() => setCal(shiftMonth(cal, -1))}>
          ‹
        </button>
        <h2>{fmt.monthLabel(y, m)}</h2>
        <button className="btn ghost" aria-label={t.cal.nextMonth} onClick={() => setCal(shiftMonth(cal, 1))}>
          ›
        </button>
      </div>
      <div className="dow">
        {t.weekdaysShort.map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>
      <div className="grid">{cells}</div>
      <div className="cal-legend">
        <span>
          <Icon name="sun" size={13} /> / <Icon name="moon" size={13} /> {t.cal.amPm}
        </span>
        <span>
          <i className="swatch" style={{ background: "var(--retinol)" }} /> {t.cal.retinol}
        </span>
        <span>
          <i className="swatch" style={{ background: "var(--sana)" }} /> {t.cal.sana}
        </span>
        <span>
          <i className="swatch" style={{ background: "var(--recovery)" }} /> {t.cal.recovery}
        </span>
        <span>
          <i className="swatch" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }} />{" "}
          {t.cal.unlogged}
        </span>
      </div>
    </section>
  );
}
