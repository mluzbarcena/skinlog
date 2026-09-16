/* =============================================================================
   useTheme — keeps the <html> `.dark` class in sync with settings.theme.
   "auto" follows the OS via matchMedia (and updates live if the OS flips).
   ============================================================================= */

import { useEffect } from "react";
import { useSettings } from "./useStore";

export function useTheme(): void {
  const theme = useSettings().theme;

  useEffect(() => {
    const root = document.documentElement;
    const apply = (dark: boolean) => root.classList.toggle("dark", dark);

    if (theme === "dark") {
      apply(true);
      return;
    }
    if (theme === "light") {
      apply(false);
      return;
    }
    // auto: follow the OS and keep following while mounted.
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    apply(mq.matches);
    const onChange = (e: MediaQueryListEvent) => apply(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);
}
