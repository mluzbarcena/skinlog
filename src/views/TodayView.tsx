/* =============================================================================
   TodayView — today's AM/PM summary, skin tolerance and a soft night suggestion.
   ============================================================================= */

import { todayStr } from "../domain/dates";
import { dayStatus, suggestNight } from "../domain/logic";
import { TOLERANCE } from "../domain/config";
import { useStore } from "../state/useStore";
import { useI18n } from "../i18n/useI18n";
import { Icon } from "../components/Icon";

export function TodayView({ openEditor }: { openEditor: (date: string) => void }) {
  const state = useStore();
  const { t, fmt } = useI18n();
  const date = todayStr();
  const st = dayStatus(state, date);
  const sug = suggestNight(state, date);

  let pmMain: string, pmSub: string;
  if (!st.pm.type) {
    pmMain = "—";
    pmSub = t.today.notRecorded;
  } else if (st.pm.type === "none") {
    pmMain = "—";
    pmSub = t.today.noRoutine;
  } else {
    pmMain = st.pm.done + "/" + st.pm.total;
    pmSub = t.night.label(st.pm.type);
  }

  const tol = st.tolerance != null ? TOLERANCE[st.tolerance] : null;

  return (
    <section className="view" aria-label={t.nav.today}>
      <div className="today-head">
        <div className="date">
          {t.today.title}
          <span>{fmt.longDate(date)}</span>
        </div>
        {st.fullComplete && (
          <span className="badge b-tol0">
            <Icon name="check" size={13} /> {t.today.complete}
          </span>
        )}
      </div>

      <div className="slots">
        <div className="slot">
          <div className="slot-top">
            <Icon name="sun" size={18} /> {t.today.morning}
          </div>
          <div className={"ratio" + (st.am.complete ? " done" : "")}>
            {st.am.skipped ? "—" : st.am.done + "/" + st.am.total}
          </div>
          <div className="sub">
            {st.am.skipped ? t.today.notDone : st.am.complete ? t.today.amComplete : t.today.pending}
          </div>
        </div>
        <div className="slot">
          <div className="slot-top">
            <Icon name="moon" size={18} /> {t.today.night}
          </div>
          <div className={"ratio" + (st.pm.complete ? " done" : "")}>{pmMain}</div>
          <div className="sub">{pmSub}</div>
        </div>
      </div>

      <div className="today-piel">
        <Icon name="droplet" size={20} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
          {tol ? (
            <>
              <span className="big">{tol.emoji}</span>
              <div>
                <b>
                  {st.tolerance} · {t.tolerance.label(tol.level)}
                </b>
              </div>
            </>
          ) : (
            <span className="sub">{t.today.notRecorded}</span>
          )}
        </div>
      </div>

      {!st.pm.type && (
        <div className="suggest">
          <Icon name="spark" size={18} />
          <div>
            {t.today.suggestedTonight}: <b>{t.night.label(sug.type)}</b>
            <br />
            {t.suggestion(sug.reason)}
          </div>
        </div>
      )}

      <button className="btn primary big block" onClick={() => openEditor(date)}>
        <Icon name="edit" size={18} /> {st.registered ? t.today.editRoutine : t.today.logRoutine}
      </button>
    </section>
  );
}
