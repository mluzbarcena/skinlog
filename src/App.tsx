/* =============================================================================
   App.tsx — shell: topbar, active view, bottom nav, and the day-editor modal.
   ============================================================================= */

import { useState } from "react";
import { NavBar, type ViewName } from "./components/NavBar";
import { Topbar } from "./components/Topbar";
import { ToastProvider } from "./components/Toast";
import { UpdatePrompt } from "./components/UpdatePrompt";
import { DayEditor } from "./components/DayEditor";
import { useTheme } from "./state/useTheme";
import { TodayView } from "./views/TodayView";
import { CalendarView } from "./views/CalendarView";
import { ProgressView } from "./views/ProgressView";
import { PhasesView } from "./views/PhasesView";
import { SettingsView } from "./views/SettingsView";

export default function App() {
  useTheme();
  const [view, setView] = useState<ViewName>("today");
  const [editorDate, setEditorDate] = useState<string | null>(null);
  const openEditor = (date: string) => setEditorDate(date);

  return (
    <ToastProvider>
      <div className="app">
        <Topbar />
        <main>
          {view === "today" && <TodayView openEditor={openEditor} />}
          {view === "cal" && <CalendarView openEditor={openEditor} />}
          {view === "progress" && <ProgressView />}
          {view === "phases" && <PhasesView />}
          {view === "settings" && <SettingsView />}
        </main>
      </div>
      <NavBar current={view} onChange={setView} />
      {editorDate && <DayEditor date={editorDate} onClose={() => setEditorDate(null)} />}
      <UpdatePrompt />
    </ToastProvider>
  );
}
