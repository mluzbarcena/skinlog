/* =============================================================================
   Topbar.tsx — brand, language switch and current-phase chip.
   ============================================================================= */

import { currentPhase } from "../domain/logic";
import { useStore } from "../state/useStore";
import { useI18n } from "../i18n/useI18n";
import { Icon } from "./Icon";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Topbar() {
  const state = useStore();
  const { t } = useI18n();
  const phase = currentPhase(state);

  return (
    <header className="topbar">
      <span className="brand">
        <span className="logo" aria-hidden="true">
          <Icon name="droplet" size={22} />
        </span>
        {t.brand.name} <small>{t.brand.tag}</small>
      </span>
      <span className="spacer" />
      <LanguageSwitcher />
      <span className="phasechip">{t.phaseChip(phase, state.settings.sanaToleratedConfirmed)}</span>
    </header>
  );
}
