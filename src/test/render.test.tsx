/* =============================================================================
   render.test.tsx — smoke test: the whole app renders without throwing and the
   five nav labels show up. Uses SSR string rendering (no DOM needed).
   ============================================================================= */

import { renderToString } from "react-dom/server";
import { expect, test } from "vitest";
import App from "../App";

test("app renders and shows the five nav sections", () => {
  const html = renderToString(<App />);
  // default language auto-detects; in the node test env it falls back to Spanish.
  for (const label of ["Hoy", "Calendario", "Progreso", "Fases", "Ajustes"]) {
    expect(html).toContain(label);
  }
  // today view is the default and shows the log button
  expect(html.toLowerCase()).toContain("rutina");
});
