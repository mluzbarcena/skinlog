/* =============================================================================
   render.test.tsx — smoke test: the whole app renders without throwing and the
   five nav labels show up. Uses SSR string rendering (no DOM needed).
   ============================================================================= */

import { renderToString } from "react-dom/server";
import { expect, test } from "vitest";
import App from "../App";
import { ToastProvider } from "../components/Toast";
import { SettingsView } from "../views/SettingsView";

test("app renders and shows the five nav sections", () => {
  const html = renderToString(<App />);
  // default language auto-detects; in the node test env it falls back to Spanish.
  for (const label of ["Hoy", "Calendario", "Progreso", "Fases", "Ajustes"]) {
    expect(html).toContain(label);
  }
  // today view is the default and shows the log button
  expect(html.toLowerCase()).toContain("rutina");
});

test("settings view renders the product & routine editors with seeded data", () => {
  const html = renderToString(
    <ToastProvider>
      <SettingsView />
    </ToastProvider>,
  );
  // section headings + a seeded product name + the add-product control.
  expect(html).toContain("Productos");
  expect(html).toContain("Pasos de la rutina");
  expect(html).toContain("CeraVe Gel Limpiador Espumoso");
  expect(html).toContain("Añadir producto");
});
