/* =============================================================================
   PhasesView — Phase 1 / Phase 2 status, "finished Hyalu B5" and SANA tolerance.
   ============================================================================= */

import { todayStr } from "../domain/dates";
import { currentPhase, productName } from "../domain/logic";
import { DEFAULT_TARGETS } from "../domain/config";
import { updateSettings, useStore } from "../state/useStore";
import { useI18n } from "../i18n/useI18n";
import { useToast } from "../components/Toast";
import { Icon } from "../components/Icon";

export function PhasesView() {
  const state = useStore();
  const { t, fmt } = useI18n();
  const toast = useToast();
  const s = state.settings;
  const phase = currentPhase(state);
  const max = DEFAULT_TARGETS.sanaPerWeekMax;

  function finishHyalu() {
    const today = todayStr();
    if (!confirm(t.phases.finishHyaluConfirm(fmt.longDate(today)))) return;
    updateSettings({ hyaluFinishedDate: today });
    toast(t.phases.phase2Enabled);
  }
  function confirmSana() {
    if (!confirm(t.phases.confirmSanaDialog(max))) return;
    updateSettings({ sanaToleratedConfirmed: true });
    toast(t.phases.sanaRaiseHint);
  }

  const inAdapt = phase === 2 && !s.sanaToleratedConfirmed;

  return (
    <section className="view" aria-label={t.nav.phases}>
      {/* Phase 1 */}
      <div className={"card phase-card" + (phase === 1 ? " active" : "")}>
        <div className="ph-head">
          <h3>{t.phases.phase1}</h3>
          <span className={"phase-state " + (phase === 1 ? "on" : "off")}>
            {phase === 1 ? t.phases.active : t.phases.finished}
          </span>
        </div>
        <div className="ph-row">
          <span className="lbl">{productName(state, "hyaluEyes")}</span>
          <span>{phase === 1 ? t.phases.inUse : t.phases.done}</span>
        </div>
        <div className="ph-row">
          <span className="lbl">{t.night.short("retinolB3")}</span>
          <span>{t.phases.perWeek(s.retinolB3PerWeek)}</span>
        </div>
        {phase === 1 ? (
          <button className="btn btn-block" style={{ marginTop: 12 }} onClick={finishHyalu}>
            <Icon name="check" size={18} /> {t.phases.finishHyaluBtn}
          </button>
        ) : (
          <div className="ph-row">
            <span className="lbl">{t.phases.finishedOn}</span>
            <span>{s.hyaluFinishedDate && fmt.shortDate(s.hyaluFinishedDate)}</span>
          </div>
        )}
      </div>

      {/* Phase 2 */}
      <div className={"card phase-card" + (phase === 2 ? (inAdapt ? " adapt" : " active") : "")}>
        <div className="ph-head">
          <h3>{t.phases.phase2}</h3>
          <span className={"phase-state " + (phase === 2 ? (inAdapt ? "adapt" : "on") : "off")}>
            {phase === 2 ? (inAdapt ? t.phases.adapting : t.phases.active) : t.phases.pending}
          </span>
        </div>
        <div className="ph-row">
          <span className="lbl">{t.night.short("retinolB3")}</span>
          <span>{t.phases.perWeek(s.retinolB3PerWeek)}</span>
        </div>
        <div className="ph-row">
          <span className="lbl">{t.phases.sanaWrinkle}</span>
          <span>{t.phases.perWeek(s.sanaPerWeek)}</span>
        </div>
        {phase === 2 &&
          (!s.sanaToleratedConfirmed ? (
            <>
              <p className="hint" style={{ margin: "10px 0 4px" }}>
                {t.phases.adaptHint}
              </p>
              <button className="btn btn-block" style={{ marginTop: 8 }} onClick={confirmSana}>
                <Icon name="check" size={18} /> {t.phases.confirmSanaBtn}
              </button>
            </>
          ) : (
            <div className="ph-row">
              <span className="lbl">{t.phases.sanaTolerated}</span>
              <span>{t.phases.sanaConfirmedUpTo(max)}</span>
            </div>
          ))}
      </div>

      <p className="disclaimer">{t.phases.disclaimer}</p>
    </section>
  );
}
