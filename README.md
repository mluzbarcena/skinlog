# Skinlog — v1.0.0

Herramienta personal para llevar el seguimiento diario de una rutina de skincare y la
progresión de retinol. **Offline, sin backend, sin cuentas.** Todos los datos viven en el
`localStorage` de tu navegador.

Reescrita en **React + Vite + TypeScript** con **Tailwind CSS**, dark mode y bilingüe
(**español / inglés**, con botón de mundo para cambiar). El resultado es un **sitio estático**.

---

## Requisitos

- Node.js 20+ (probado con Node 26) y npm.

## Correr localmente

```bash
npm install
npm run dev
```

Vite imprime una URL (por defecto `http://localhost:5173`). Abrila en el navegador.
Para probar desde el teléfono en la misma red Wi-Fi:

```bash
npm run dev -- --host
```

## Generar el build estático

```bash
npm run build      # type-check (tsc) + build de Vite -> genera dist/
npm run preview    # sirve dist/ localmente para verificar (http://localhost:4173)
```

El contenido de `dist/` es 100% estático: subilo tal cual a GitHub Pages, Netlify, Vercel,
o cualquier hosting de archivos. Las rutas de assets son **relativas** (`base: "./"`), así
que funciona también servido desde un subdirectorio.

> Nota: por ser un build multi-archivo de Vite, necesita servirse por **HTTP** (no funciona
> con doble clic sobre `dist/index.html` vía `file://`). Usá `npm run preview` o cualquier
> servidor estático (`npx serve dist`).

## ZIP listo para desplegar

El build ya viene comprimido en **`skinlog-dist.zip`** (contenido de `dist/`). Para regenerarlo:

```bash
npm run build
cd dist && zip -r ../skinlog-dist.zip . && cd ..
```

Descomprimí el ZIP en la raíz de tu hosting estático y listo.

## Tests

```bash
npm run test        # corre Vitest una vez
npm run test:watch  # modo watch
```

Cubre la lógica de negocio (fases, frecuencias, sugerencias, tolerancia, export/import) y un
smoke test que renderiza la app entera sin errores.

---

## Estructura de archivos

```
skinlog/
├─ index.html                  # entry de Vite (meta PWA, manifest, script anti-flash del tema)
├─ vite.config.ts              # plugins react + tailwind; base "./"; config de Vitest
├─ tsconfig*.json
├─ public/                     # assets estáticos copiados tal cual al build
│  ├─ manifest.webmanifest     # PWA (instalar en pantalla de inicio)
│  └─ icon-192.png / icon-512.png / apple-touch-icon.png
├─ src/
│  ├─ main.tsx                 # bootstrap de React
│  ├─ App.tsx                  # shell: topbar + vista activa + nav + modal
│  ├─ index.css                # Tailwind + sistema de diseño (tokens y componentes; dark mode por clase)
│  ├─ domain/                  # LÓGICA PURA, sin React (portable y testeable)
│  │  ├─ types.ts              # tipos del modelo de datos
│  │  ├─ config.ts             # ⭐ TODAS LAS REGLAS EDITABLES (ver abajo)
│  │  ├─ dates.ts              # helpers de fecha en hora LOCAL
│  │  ├─ logic.ts              # fases, completitud, sugerencia de noche, stats
│  │  └─ storage.ts            # estado + localStorage + export/import (external store)
│  ├─ state/
│  │  ├─ useStore.ts           # bind del store a React (useSyncExternalStore) + acciones
│  │  └─ useTheme.ts           # sincroniza la clase .dark según settings.theme
│  ├─ i18n/                    # traducciones es/en (sin dependencias)
│  │  ├─ es.ts / en.ts         # diccionarios (es define la forma del tipo Dict)
│  │  ├─ format.ts             # formato de fechas localizado
│  │  └─ useI18n.ts            # hook: { lang, t, fmt }
│  ├─ components/              # Topbar, NavBar, LanguageSwitcher, Icon, Toast, DayEditor
│  ├─ views/                   # TodayView, CalendarView, ProgressView, PhasesView, SettingsView
│  └─ test/                    # logic.test.ts (Vitest) + render.test.tsx (smoke)
└─ legacy/                     # versión vanilla original (referencia, no se usa en el build)
```

---

## Cómo funciona la persistencia de datos

- Todo el estado se guarda en **una sola clave de `localStorage`: `skincareTracker:v1`**.
- La forma persistida es:

  ```jsonc
  {
    "version": 1,
    "settings": { /* frecuencias, fase, tema, idioma, nombres de productos… */ },
    "days": {
      "2026-09-16": {
        "am": { "done": { "cleanser": true }, "skipped": false },
        "pm": { "type": "retinolB3", "done": {} },
        "tolerance": 0,
        "note": ""
      }
    }
  }
  ```

- Cada cambio (marcar un paso, elegir tipo de noche, editar ajustes) se **persiste al instante**.
  React se entera vía `useSyncExternalStore`, así que la UI y el disco quedan siempre en sync.
- Los **días vacíos se descartan** automáticamente al guardar (no ensucian el almacenamiento).
- `migrate()` rellena claves nuevas si en el futuro cambia el esquema, sin perder datos viejos.
- **No hay servidor ni sincronización entre dispositivos.** Si borrás los datos del navegador,
  se pierden: desde **Ajustes → Datos** podés exportar a JSON (reimportable) o CSV (para planillas).
- Las fechas se manejan siempre en **hora local** (`"YYYY-MM-DD"`) para que "hoy" no se corra
  por zona horaria.

---

## Dónde modificar las reglas de fases y frecuencias

Casi todo vive en **`src/domain/config.ts`**:

| Querés cambiar…                                    | Editá…                  |
|----------------------------------------------------|-------------------------|
| Productos y sus nombres por defecto                | `PRODUCTS`              |
| Los pasos de cada rutina por fase (AM/PM)          | `ROUTINES`              |
| Qué tipos de noche existen en cada fase            | `NIGHT_TYPES_BY_PHASE`  |
| Si un tipo de noche cuenta como retinol / su color | `NIGHT_TYPES`           |
| Escala de tolerancia (emojis / niveles)            | `TOLERANCE`             |
| Umbral de la advertencia por irritación            | `IRRITATION_WARNING`    |
| Frecuencias objetivo por defecto                   | `DEFAULT_TARGETS`       |
| Valores iniciales al abrir la app por primera vez  | `defaultSettings()`     |

La **transición de FASE 1 a FASE 2** se define en **`src/domain/logic.ts`**, función
`phaseForDate()`: es Fase 1 mientras `settings.hyaluFinishedDate` sea `null`, y Fase 2 para
las fechas `>= hyaluFinishedDate`. Esa fecha se setea al tocar **"Terminé Hyalu B5"** en la
vista Fases (o a mano en Ajustes).

El algoritmo de **sugerencia de noche** (frecuencia semanal + espaciado, Retinol B3 y SANA en
noches distintas) está en `suggestNight()` del mismo archivo. Nunca sube frecuencias solo:
solo sugiere; vos siempre podés sobrescribir el tipo de noche de cualquier día.

**Textos de la interfaz:** están en `src/i18n/es.ts` y `src/i18n/en.ts` (labels de tipos de
noche, tolerancia, mensajes, etc.). `config.ts` solo guarda ids y estructura.

---

## Idioma (i18n)

- Español e inglés. El **botón de mundo** en la barra superior alterna entre ambos (también hay
  un selector en **Ajustes → Apariencia**).
- En la primera visita se **autodetecta** desde el idioma del navegador y luego queda guardado
  en `settings.language` (persiste tras refresh).

## Dark mode

Tres modos en **Ajustes → Apariencia**: **Auto** (sigue al sistema operativo), **Claro**, **Oscuro**.
Se aplica con la clase `.dark` en `<html>`; un script inline en `index.html` la fija antes de que
cargue React para evitar el "flash" de tema.
