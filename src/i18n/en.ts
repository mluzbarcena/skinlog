/* =============================================================================
   en.ts — English dictionary. Must satisfy the `Dict` shape defined by es.ts.
   ============================================================================= */

import type { NightType, Phase, SuggestionReason, ToleranceLevel } from "../domain/types";
import type { Dict } from "./es";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function since(n: number): string {
  if (!isFinite(n)) return "more than 2 weeks";
  if (n === 1) return "1 day";
  return n + " days";
}

export const en: Dict = {
  weekdays: WEEKDAYS,
  weekdaysShort: WEEKDAYS_SHORT,
  months: MONTHS,

  brand: { name: "Routine", tag: "skincare" },

  nav: {
    today: "Today",
    cal: "Calendar",
    progress: "Progress",
    phases: "Phases",
    settings: "Settings",
  },

  phaseChip: (phase: Phase, sanaConfirmed: boolean): string =>
    phase === 1 ? "Phase 1" : sanaConfirmed ? "Phase 2" : "Phase 2 · adapting",

  night: {
    label: (t: NightType): string =>
      ({ retinolB3: "Retinol B3", sana: "SANA Wrinkle Care", recovery: "Recovery", none: "No routine" })[t],
    short: (t: NightType): string =>
      ({ retinolB3: "Retinol B3", sana: "SANA", recovery: "Recovery", none: "No routine" })[t],
    hint: (t: NightType): string =>
      ({
        retinolB3: "Facial retinol night — save the retinol eye cream for another night.",
        sana: "Periocular retinol night — avoid combining with Retinol B3 at first.",
        recovery: "Rest night: let the skin repair. No retinol.",
        none: "",
      })[t],
  },

  tolerance: {
    label: (lv: ToleranceLevel): string =>
      ["No irritation", "Mild dryness / tightness", "Moderate irritation", "Severe irritation"][lv],
  },

  suggestion: (r: SuggestionReason): string => {
    switch (r.code) {
      case "retBehind":
        return `You're at ${r.ret}/${r.target} retinol nights this week; last one ${since(r.since)} ago.`;
      case "retPaused":
        return "Retinol paused (target 0). Time for recovery.";
      case "retMet":
        return `You're already at ${r.ret}/${r.target} retinol this week; better to rest.`;
      case "retPreferred":
        return `Facial retinol is at ${r.ret}/${r.target}; leave SANA for another night.`;
      case "sanaPreferred":
        return `SANA is at ${r.sana}/${r.target} this week; leave facial retinol for another night.`;
      case "sanaBehind":
        return `SANA ${r.sana}/${r.target}; last one ${since(r.since)} ago.`;
      case "allMet":
        return "Retinol targets on track; time for recovery.";
    }
  },

  irritationWarning:
    "You logged moderate/severe irritation in the last few days. " +
    "Consider spacing out retinol before increasing frequency. " +
    "This is only a reminder, not medical advice.",

  today: {
    title: "Today",
    complete: "Complete",
    morning: "Morning",
    night: "Night",
    notDone: "Not done",
    amComplete: "Complete",
    pending: "Pending",
    notRecorded: "Not recorded",
    noRoutine: "You did no routine",
    skinTolerance: "Skin tolerance",
    suggestedTonight: "Suggested tonight",
    editRoutine: "Edit today's routine",
    logRoutine: "Log routine",
  },

  cal: {
    prevMonth: "Previous month",
    nextMonth: "Next month",
    amPm: "AM / PM",
    retinol: "Retinol B3",
    sana: "SANA",
    recovery: "Recovery",
    unlogged: "Not logged",
    tolTitle: (n: number): string => `Tolerance ${n}`,
  },

  progress: {
    last7: "Last 7 days",
    last30: "Last 30 days",
    morningsComplete: "Mornings complete",
    nightsComplete: "Nights complete",
    retinol: "Retinol B3",
    sana: "SANA Wrinkle",
    recovery: "Recovery",
    irritationDays: "Days with irritation",
    avgTolerance: "Average tolerance",
    applications: "appl.",
    nights: "nights",
    modOrMore: "≥ mod.",
    outOf3: "/ 3",
    outOf: (n: number): string => `/ ${n}`,
    chartTitle: "Tolerance trend (30 days)",
    chartEmpty: "You haven't logged tolerance yet. It will show up here once you do.",
    legend0: "0 no irrit.",
    legend2: "2 moderate",
    legend3: "3 severe",
    disclaimer:
      "This app is just a personal log. It does not diagnose or replace a health professional.",
  },

  phases: {
    phase1: "Phase 1",
    phase2: "Phase 2",
    active: "🟢 Active",
    finished: "Finished",
    adapting: "🟡 Adapting",
    pending: "Pending",
    inUse: "in use",
    done: "finished",
    perWeek: (n: number): string => `${n}×/week`,
    finishHyaluBtn: "I finished Hyalu B5",
    finishedOn: "Finished on",
    sanaWrinkle: "SANA Wrinkle Care",
    adaptHint:
      "Starting rule: Retinol B3 and SANA on separate nights. Once you tolerate SANA well, you can enable 2×/week.",
    confirmSanaBtn: "I tolerate SANA well",
    sanaTolerated: "SANA tolerated",
    sanaConfirmedUpTo: (max: number): string => `confirmed — up to ${max}×/wk`,
    disclaimer:
      "The app never raises the frequency on its own: targets are changed manually in Settings and you can always override any day's night type.",
    finishHyaluConfirm: (longDate: string): string =>
      `Mark Hyalu B5 as finished starting today (${longDate})?\n\nFrom this date the app moves to Phase 2 and enables SANA Wrinkle Care. You can adjust the date in Settings.`,
    phase2Enabled: "Phase 2 enabled",
    confirmSanaDialog: (max: number): string =>
      `Confirm that you tolerate SANA well?\n\nThis unlocks raising the SANA target up to ${max}×/week. It won't raise on its own: you adjust it in Settings.`,
    sanaRaiseHint: "SANA: you can raise to 2×/week in Settings",
  },

  settings: {
    routineAndPhases: "Routine & phases",
    appearance: "Appearance",
    productNames: "Product names",
    data: "Data",
    language: "Language",
    routineStart: "Routine start",
    hyaluFinishedOn: "Hyalu B5 finished on",
    hyaluHint: "Empty = still in Phase 1. With a date = Phase 2 from that day.",
    retinolTarget: "Retinol B3 target (nights/week)",
    sanaTarget: "SANA Wrinkle target (nights/week)",
    sanaMaxEnabled: (max: number): string => `Max enabled: ${max}×.`,
    sanaMaxLocked: (max: number): string => `Max ${max}× until you confirm tolerance in Phases.`,
    brightening: "SANA Brightening (optional AM)",
    theme: "Theme",
    themeAuto: "Auto",
    themeLight: "Light",
    themeDark: "Dark",
    saveNames: "Save names",
    export: "Export",
    exportHint:
      "JSON can be re-imported. CSV is for opening in Excel/Sheets (export only).",
    importJson: "Import (JSON)",
    chooseJson: "Choose JSON file",
    importHint: "Replaces all current data with the file's data.",
    dangerZone: "Danger zone",
    deleteAll: "Delete all data",
    dataDisclaimer:
      "All data lives only in this browser (localStorage). Nothing is sent to any server. If you clear the browser data it is lost: export from time to time.",
    nameCleanser: "Cleanser",
    nameHyaluEyes: "Current eye cream (Hyalu B5)",
    nameSanaWrinkle: "Retinol eye cream (SANA Wrinkle)",
    nameSanaBright: "Brightening eye cream (SANA)",
    nameRetinolB3: "Face retinol serum (B3)",
    nameMoisturizer: "Moisturizer",
    nameSpf: "Sunscreen",
    saved: "Saved",
    namesSaved: "Names saved",
    imported: (n: number): string => `Imported: ${n} days`,
    dataDeleted: "Data deleted",
    raiseAnyway: "Raise the frequency anyway?",
    importReplaceConfirm: "This replaces ALL current data with the file's data. Continue?",
    clearConfirm1: "Delete ALL data permanently? This cannot be undone.",
    clearConfirm2: "Final confirmation: this erases all history and settings.",
    importError: (msg: string): string => `Could not import: ${msg}`,
    errInvalidJson: "The file is not valid JSON.",
    errInvalidShape: "The JSON doesn't have the expected structure (missing 'days').",
  },

  editor: {
    todayTitle: "Today",
    phaseLabel: (n: number): string => `Phase ${n}`,
    morning: "Morning",
    noAmRoutine: "I did no AM routine",
    night: "Night",
    optional: "optional",
    suggested: "Suggested:",
    use: "Use",
    skinTolerance: "Skin tolerance",
    notes: "Notes",
    notePlaceholder: "E.g.: slight flaking on the nose, all normal, stinging on application…",
    cancel: "Cancel",
    save: "Save",
    noRoutineNote: "You marked that you did no routine tonight.",
    close: "Close",
  },

  pwa: {
    updateAvailable: "A new version is available",
    update: "Update",
    dismiss: "Not now",
    offlineReady: "Ready to use offline",
  },

  langSwitch: "Switch language",
};
