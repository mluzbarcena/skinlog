/* =============================================================================
   NavBar.tsx — fixed bottom navigation between the five views.
   ============================================================================= */

import { useI18n } from "../i18n/useI18n";
import { Icon } from "./Icon";

export type ViewName = "today" | "cal" | "progress" | "phases" | "settings";

const ITEMS: { view: ViewName; icon: string }[] = [
  { view: "today", icon: "home" },
  { view: "cal", icon: "calendar" },
  { view: "progress", icon: "chart" },
  { view: "phases", icon: "layers" },
  { view: "settings", icon: "settings" },
];

export function NavBar({ current, onChange }: { current: ViewName; onChange: (v: ViewName) => void }) {
  const { t } = useI18n();
  return (
    <nav className="nav" aria-label={t.brand.name}>
      {ITEMS.map(({ view, icon }) => (
        <button
          key={view}
          className={current === view ? "on" : ""}
          aria-current={current === view ? "page" : undefined}
          onClick={() => onChange(view)}
        >
          <Icon name={icon} size={22} />
          {t.nav[view]}
        </button>
      ))}
    </nav>
  );
}
