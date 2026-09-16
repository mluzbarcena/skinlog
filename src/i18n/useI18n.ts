/* =============================================================================
   useI18n — resolves the active dictionary from settings.language and exposes
   `t` (the dictionary), `lang`, and bound date formatters. Language is persisted
   in settings (localStorage); on first run it was auto-detected from the browser
   in config.defaultSettings().
   ============================================================================= */

import { useMemo } from "react";
import { useSettings } from "../state/useStore";
import type { Lang } from "../domain/types";
import { en } from "./en";
import { es, type Dict } from "./es";
import { longDate, monthLabel, shortDate, weekday } from "./format";

const DICTS: Record<Lang, Dict> = { es, en };

export interface I18n {
  lang: Lang;
  t: Dict;
  fmt: {
    longDate: (str: string) => string;
    shortDate: (str: string) => string;
    weekday: (str: string) => string;
    monthLabel: (y: number, m: number) => string;
  };
}

export function useI18n(): I18n {
  const lang = useSettings().language;
  return useMemo<I18n>(() => {
    const t = DICTS[lang] ?? es;
    return {
      lang,
      t,
      fmt: {
        longDate: (str) => longDate(t, str, lang),
        shortDate: (str) => shortDate(t, str, lang),
        weekday: (str) => weekday(t, str),
        monthLabel: (y, m) => monthLabel(t, y, m),
      },
    };
  }, [lang]);
}
