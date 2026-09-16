/* =============================================================================
   config.js  —  TODAS LAS REGLAS EDITABLES DE LA APP VIVEN ACÁ
   -----------------------------------------------------------------------------
   Si querés cambiar productos, qué pasos tiene cada rutina, los mensajes de
   cada tipo de noche, las frecuencias objetivo por defecto o el umbral de la
   advertencia por irritación, este es el único archivo que necesitás tocar.
   ============================================================================= */

window.SK = window.SK || {};

SK.config = (function () {
  // ---------------------------------------------------------------------------
  // 1) PRODUCTOS  (id estable -> nombre visible por defecto)
  // El "id" NO se muestra y no debe cambiarse: es lo que usa la lógica interna.
  // El nombre visible se puede editar desde Ajustes (queda guardado en settings).
  // ---------------------------------------------------------------------------
  const PRODUCTS = {
    cleanser:    "CeraVe Gel Limpiador Espumoso",
    hyaluEyes:   "La Roche-Posay Hyalu B5 Eyes",
    sanaWrinkle: "SANA Nameraka Honpo Wrinkle Care Eye Cream",
    sanaBright:  "SANA Nameraka Honpo Brightening Eye Cream",
    retinolB3:   "La Roche-Posay Retinol B3 Serum",
    moisturizer: "AMPASTUDIO Crema Restauradora",
    spf:         "La Roche-Posay Anthelios UV Air SPF50+ Serum",
  };

  // ---------------------------------------------------------------------------
  // 2) PLANTILLAS DE RUTINA POR FASE
  // Cada paso es { id } o { id, optional:true }.
  // "optional:true" => si no se marca NO cuenta como rutina incompleta.
  // 'sanaBright' además sólo aparece en AM si está activado en Ajustes.
  // ---------------------------------------------------------------------------
  const ROUTINES = {
    1: {
      am: [
        { id: "cleanser" },
        { id: "hyaluEyes" },
        { id: "moisturizer" },
        { id: "spf" },
      ],
      pm: {
        retinolB3: [{ id: "cleanser" }, { id: "retinolB3" }, { id: "hyaluEyes" }, { id: "moisturizer" }],
        recovery:  [{ id: "cleanser" }, { id: "hyaluEyes" }, { id: "moisturizer" }],
      },
    },
    2: {
      am: [
        { id: "cleanser" },
        { id: "sanaBright", optional: true },
        { id: "moisturizer" },
        { id: "spf" },
      ],
      pm: {
        retinolB3: [{ id: "cleanser" }, { id: "retinolB3" }, { id: "moisturizer" }],
        sana:      [{ id: "cleanser" }, { id: "sanaWrinkle" }, { id: "moisturizer" }],
        recovery:  [{ id: "cleanser" }, { id: "moisturizer" }],
      },
    },
  };

  // Tipos de noche disponibles por fase (incluye 'none' = no hice rutina).
  const NIGHT_TYPES_BY_PHASE = {
    1: ["retinolB3", "recovery", "none"],
    2: ["retinolB3", "sana", "recovery", "none"],
  };

  // Metadatos de cada tipo de noche: etiqueta, color semántico y aviso (reglas 4 y 5).
  const NIGHT_TYPES = {
    retinolB3: {
      label: "Retinol B3",
      short: "Retinol B3",
      color: "retinol",
      counts: true, // cuenta como aplicación de retinol facial
      hint: "Noche de retinol facial — dejá el contorno de retinol para otra noche.",
    },
    sana: {
      label: "SANA Wrinkle Care",
      short: "SANA",
      color: "sana",
      counts: true,
      hint: "Noche de retinol periocular — evitá combinar inicialmente con Retinol B3.",
    },
    recovery: {
      label: "Recuperación",
      short: "Recuperación",
      color: "recovery",
      counts: false,
      hint: "Noche de descanso: piel a reparar. Sin retinol.",
    },
    none: {
      label: "No hice rutina",
      short: "Sin rutina",
      color: "none",
      counts: false,
      hint: "",
    },
  };

  // ---------------------------------------------------------------------------
  // 3) ESCALA DE TOLERANCIA DE LA PIEL
  // ---------------------------------------------------------------------------
  const TOLERANCE = [
    { level: 0, label: "Sin irritación",            emoji: "🙂", color: "tol0" },
    { level: 1, label: "Leve sequedad / tirantez",  emoji: "😐", color: "tol1" },
    { level: 2, label: "Irritación moderada",       emoji: "😣", color: "tol2" },
    { level: 3, label: "Irritación importante",     emoji: "😖", color: "tol3" },
  ];

  // ---------------------------------------------------------------------------
  // 4) ADVERTENCIA POR IRRITACIÓN
  // Si en los últimos `lookbackDays` días hay al menos `minCount` registros con
  // tolerancia >= `minLevel`, la app avisa (sin bloquear) al elegir una noche de
  // retinol o al intentar subir una frecuencia objetivo. No es un diagnóstico.
  // ---------------------------------------------------------------------------
  const IRRITATION_WARNING = {
    lookbackDays: 7,
    minCount: 2,
    minLevel: 2, // 2 = moderada, 3 = importante
    message:
      "Registraste irritación moderada/importante en los últimos días. " +
      "Considerá espaciar el retinol antes de aumentar la frecuencia. " +
      "Esto es sólo un recordatorio, no un consejo médico.",
  };

  // ---------------------------------------------------------------------------
  // 5) FRECUENCIAS OBJETIVO POR DEFECTO (por semana)
  // La app NUNCA sube estas frecuencias sola: sólo sugiere y siempre podés
  // sobrescribir manualmente el tipo de noche de cualquier día.
  // ---------------------------------------------------------------------------
  const DEFAULT_TARGETS = {
    retinolB3PerWeek: 3, // objetivo "2–3": se guarda como número, editable en Ajustes
    sanaPerWeekStart: 1, // arranca en 1×/semana en Fase 2
    sanaPerWeekMax:   2, // sólo habilitado tras confirmar "tolero bien el SANA"
  };

  // ---------------------------------------------------------------------------
  // 6) SETTINGS POR DEFECTO (estado inicial la primera vez que se abre la app)
  // ---------------------------------------------------------------------------
  function defaultSettings() {
    return {
      routineStartDate: SK.util ? SK.util.todayStr() : new Date().toISOString().slice(0, 10),
      hyaluFinishedDate: null,          // null => Fase 1; fecha => Fase 2 desde ese día
      retinolB3PerWeek: DEFAULT_TARGETS.retinolB3PerWeek,
      sanaPerWeek: DEFAULT_TARGETS.sanaPerWeekStart,
      sanaToleratedConfirmed: false,    // habilita subir SANA a 2×/semana
      brightingEnabled: true,           // SANA Brightening opcional en AM
      theme: "auto",                    // "auto" | "light" | "dark"
      productNames: Object.assign({}, PRODUCTS),
    };
  }

  return {
    STORAGE_KEY: "skincareTracker:v1",
    SCHEMA_VERSION: 1,
    PRODUCTS,
    ROUTINES,
    NIGHT_TYPES,
    NIGHT_TYPES_BY_PHASE,
    TOLERANCE,
    IRRITATION_WARNING,
    DEFAULT_TARGETS,
    defaultSettings,
  };
})();
