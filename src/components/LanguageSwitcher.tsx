/* =============================================================================
   LanguageSwitcher.tsx — globe button that toggles between Spanish and English.
   ============================================================================= */

import { updateSettings } from "../state/useStore";
import { useI18n } from "../i18n/useI18n";
import { Icon } from "./Icon";

export function LanguageSwitcher() {
  const { lang, t } = useI18n();
  const next = lang === "es" ? "en" : "es";
  return (
    <button
      className="iconbtn"
      onClick={() => updateSettings({ language: next })}
      aria-label={t.langSwitch}
      title={`${t.langSwitch} · ${lang.toUpperCase()}`}
    >
      <Icon name="globe" size={20} />
    </button>
  );
}
