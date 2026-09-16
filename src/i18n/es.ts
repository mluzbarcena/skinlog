/* =============================================================================
   es.ts — Spanish dictionary. This is the CANONICAL dictionary: its shape
   defines the `Dict` type that every other language must satisfy.
   Entries are plain strings or functions (for typed interpolation).
   ============================================================================= */

import type { NightType, Phase, SuggestionReason, ToleranceLevel } from "../domain/types";

const WEEKDAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const WEEKDAYS_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function since(n: number): string {
  if (!isFinite(n)) return "más de 2 semanas";
  if (n === 1) return "1 día";
  return n + " días";
}

export const es = {
  weekdays: WEEKDAYS,
  weekdaysShort: WEEKDAYS_SHORT,
  months: MONTHS,

  brand: { name: "Rutina", tag: "skincare" },

  nav: {
    today: "Hoy",
    cal: "Calendario",
    progress: "Progreso",
    phases: "Fases",
    settings: "Ajustes",
  },

  phaseChip: (phase: Phase, sanaConfirmed: boolean): string =>
    phase === 1 ? "Fase 1" : sanaConfirmed ? "Fase 2" : "Fase 2 · adaptación",

  night: {
    label: (t: NightType): string =>
      ({ retinolB3: "Retinol B3", sana: "SANA Wrinkle Care", recovery: "Recuperación", none: "No hice rutina" })[t],
    short: (t: NightType): string =>
      ({ retinolB3: "Retinol B3", sana: "SANA", recovery: "Recuperación", none: "Sin rutina" })[t],
    hint: (t: NightType): string =>
      ({
        retinolB3: "Noche de retinol facial — dejá el contorno de retinol para otra noche.",
        sana: "Noche de retinol periocular — evitá combinar inicialmente con Retinol B3.",
        recovery: "Noche de descanso: piel a reparar. Sin retinol.",
        none: "",
      })[t],
  },

  tolerance: {
    label: (lv: ToleranceLevel): string =>
      ["Sin irritación", "Leve sequedad / tirantez", "Irritación moderada", "Irritación importante"][lv],
  },

  suggestion: (r: SuggestionReason): string => {
    switch (r.code) {
      case "retBehind":
        return `Llevás ${r.ret}/${r.target} noches de retinol esta semana; última hace ${since(r.since)}.`;
      case "retPaused":
        return "Retinol en pausa (objetivo 0). Toca recuperación.";
      case "retMet":
        return `Ya llevás ${r.ret}/${r.target} de retinol esta semana; conviene descansar.`;
      case "retPreferred":
        return `Retinol facial va ${r.ret}/${r.target}; el SANA lo dejás para otra noche.`;
      case "sanaPreferred":
        return `SANA va ${r.sana}/${r.target} esta semana; el retinol facial lo dejás para otra noche.`;
      case "sanaBehind":
        return `SANA ${r.sana}/${r.target}; última hace ${since(r.since)}.`;
      case "allMet":
        return "Metas de retinol al día; toca recuperación.";
    }
  },

  irritationWarning:
    "Registraste irritación moderada/importante en los últimos días. " +
    "Considerá espaciar el retinol antes de aumentar la frecuencia. " +
    "Esto es sólo un recordatorio, no un consejo médico.",

  today: {
    title: "Hoy",
    complete: "Completo",
    morning: "Mañana",
    night: "Noche",
    notDone: "No realizada",
    amComplete: "Completa",
    pending: "Pendiente",
    notRecorded: "Sin registrar",
    noRoutine: "No hiciste rutina",
    skinTolerance: "Tolerancia de la piel",
    suggestedTonight: "Sugerido esta noche",
    editRoutine: "Editar rutina de hoy",
    logRoutine: "Registrar rutina",
  },

  cal: {
    prevMonth: "Mes anterior",
    nextMonth: "Mes siguiente",
    amPm: "AM / PM",
    retinol: "Retinol B3",
    sana: "SANA",
    recovery: "Recuperación",
    unlogged: "Sin registrar",
    tolTitle: (n: number): string => `Tolerancia ${n}`,
  },

  progress: {
    last7: "Últimos 7 días",
    last30: "Últimos 30 días",
    morningsComplete: "Mañanas completas",
    nightsComplete: "Noches completas",
    retinol: "Retinol B3",
    sana: "SANA Wrinkle",
    recovery: "Recuperación",
    irritationDays: "Días con irritación",
    avgTolerance: "Tolerancia media",
    applications: "aplic.",
    nights: "noches",
    modOrMore: "≥ mod.",
    outOf3: "/ 3",
    outOf: (n: number): string => `/ ${n}`,
    chartTitle: "Evolución de la tolerancia (30 días)",
    chartEmpty: "Todavía no registraste tolerancia. Aparecerá acá cuando lo hagas.",
    legend0: "0 sin irrit.",
    legend2: "2 moderada",
    legend3: "3 importante",
    disclaimer:
      "Esta app es sólo un registro personal. No hace diagnósticos ni reemplaza a un profesional de la salud.",
  },

  phases: {
    phase1: "Fase 1",
    phase2: "Fase 2",
    active: "🟢 Activa",
    finished: "Finalizada",
    adapting: "🟡 En adaptación",
    pending: "Pendiente",
    inUse: "en uso",
    done: "terminado",
    perWeek: (n: number): string => `${n}×/semana`,
    finishHyaluBtn: "Terminé Hyalu B5",
    finishedOn: "Terminado el",
    sanaWrinkle: "SANA Wrinkle Care",
    adaptHint:
      "Regla inicial: Retinol B3 y SANA en noches distintas. Cuando notes que tolerás bien el SANA, podés habilitar 2×/semana.",
    confirmSanaBtn: "Considero que tolero bien el SANA",
    sanaTolerated: "SANA tolerado",
    sanaConfirmedUpTo: (max: number): string => `confirmado — hasta ${max}×/sem`,
    disclaimer:
      "La app nunca sube la frecuencia sola: las metas se cambian a mano en Ajustes y siempre podés sobrescribir el tipo de noche de cualquier día.",
    finishHyaluConfirm: (longDate: string): string =>
      `¿Marcar Hyalu B5 como terminado a partir de hoy (${longDate})?\n\nDesde esta fecha la app pasa a Fase 2 y habilita SANA Wrinkle Care. Podés ajustar la fecha en Ajustes.`,
    phase2Enabled: "Fase 2 activada",
    confirmSanaDialog: (max: number): string =>
      `¿Confirmás que tolerás bien el SANA?\n\nEsto habilita subir la meta de SANA hasta ${max}×/semana. No la sube sola: la ajustás en Ajustes.`,
    sanaRaiseHint: "SANA: podés subir a 2×/semana en Ajustes",
  },

  settings: {
    routineAndPhases: "Rutina y fases",
    appearance: "Apariencia",
    productNames: "Nombres de productos",
    data: "Datos",
    language: "Idioma",
    routineStart: "Inicio de la rutina",
    hyaluFinishedOn: "Hyalu B5 terminado el",
    hyaluHint: "Vacío = seguís en Fase 1. Con fecha = Fase 2 desde ese día.",
    retinolTarget: "Meta Retinol B3 (noches/semana)",
    sanaTarget: "Meta SANA Wrinkle (noches/semana)",
    sanaMaxEnabled: (max: number): string => `Máximo habilitado: ${max}×.`,
    sanaMaxLocked: (max: number): string => `Máximo ${max}× hasta confirmar tolerancia en Fases.`,
    brightening: "SANA Brightening (opcional AM)",
    theme: "Tema",
    themeAuto: "Auto",
    themeLight: "Claro",
    themeDark: "Oscuro",
    saveNames: "Guardar nombres",
    export: "Exportar",
    exportHint:
      "El JSON sirve para volver a importar. El CSV es para abrir en Excel/Sheets (sólo exportación).",
    importJson: "Importar (JSON)",
    chooseJson: "Elegir archivo JSON",
    importHint: "Reemplaza todos los datos actuales por los del archivo.",
    dangerZone: "Zona de riesgo",
    deleteAll: "Borrar todos los datos",
    dataDisclaimer:
      "Todos los datos viven sólo en este navegador (localStorage). No se envían a ningún servidor. Si borrás los datos del navegador, se pierden: exportá de vez en cuando.",
    nameCleanser: "Limpiador",
    nameHyaluEyes: "Contorno actual (Hyalu B5)",
    nameSanaWrinkle: "Contorno retinol (SANA Wrinkle)",
    nameSanaBright: "Contorno brightening (SANA)",
    nameRetinolB3: "Sérum retinol facial (B3)",
    nameMoisturizer: "Hidratante",
    nameSpf: "Protector solar",
    saved: "Guardado",
    namesSaved: "Nombres guardados",
    imported: (n: number): string => `Importado: ${n} días`,
    dataDeleted: "Datos borrados",
    raiseAnyway: "¿Subir la frecuencia igualmente?",
    importReplaceConfirm: "Esto reemplaza TODOS los datos actuales por los del archivo. ¿Continuar?",
    clearConfirm1: "¿Borrar TODOS los datos de forma permanente? Esta acción no se puede deshacer.",
    clearConfirm2: "Última confirmación: se borra todo el historial y la configuración.",
    importError: (msg: string): string => `No se pudo importar: ${msg}`,
    errInvalidJson: "El archivo no es JSON válido.",
    errInvalidShape: "El JSON no tiene la estructura esperada (falta 'days').",
  },

  editor: {
    todayTitle: "Hoy",
    phaseLabel: (n: number): string => `Fase ${n}`,
    morning: "Mañana",
    noAmRoutine: "No hice rutina AM",
    night: "Noche",
    optional: "opcional",
    suggested: "Sugerido:",
    use: "Usar",
    skinTolerance: "Tolerancia de la piel",
    notes: "Observaciones",
    notePlaceholder: "Ej.: leve descamación en la nariz, todo normal, ardor al aplicar…",
    cancel: "Cancelar",
    save: "Guardar",
    noRoutineNote: "Marcaste que esta noche no hiciste rutina.",
    close: "Cerrar",
  },

  langSwitch: "Cambiar idioma",
};

export type Dict = typeof es;
