# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el proyecto sigue [Versionado Semántico](https://semver.org/lang/es/).

## [1.0.0] - 2026-09-16

Reescritura completa de la app vanilla (HTML/CSS/JS) a **React + Vite + TypeScript**.
Ver especificación: [`specs/v1.0.0-react-migration.md`](specs/v1.0.0-react-migration.md).

### Added

- Stack **React 19 + Vite 6 + TypeScript** con build estático (`base: "./"`, portable).
- **Tailwind CSS v4** como sistema de estilos, sobre los tokens de diseño existentes.
- **i18n español/inglés** sin dependencias: diccionarios tipados, hook `useI18n()`, botón con
  icono de mundo en la barra superior y selector en Ajustes. Idioma autodetectado del navegador
  en la primera visita y persistido en `settings.language`.
- **Dark mode** por clase `.dark` (auto/claro/oscuro) con script anti-flash en `index.html`.
- **Tests con Vitest**: suite de lógica portada desde `_test.js` + smoke test de render de la
  app completa.
- Directorio `specs/` con la especificación de la migración y este `CHANGELOG.md`.
- ZIP desplegable (`skinlog-dist.zip`) generado desde `dist/`.

### Changed

- Lógica de negocio (`config`, `dates`, `logic`, `storage`) portada a **funciones puras en TS**
  que reciben el estado explícitamente, en lugar de leer un singleton global.
- El store se expone como **external store** (`subscribe`/`getSnapshot`) enlazado a React con
  `useSyncExternalStore`.
- Textos visibles de la UI movidos desde `config.js` a los diccionarios de `src/i18n/`;
  `config.ts` conserva solo ids y estructura.
- La versión vanilla original se archivó en `legacy/` como referencia.

### Preserved

- **Modelo de datos y persistencia sin cambios**: misma clave `localStorage`
  (`skincareTracker:v1`) y misma función `migrate()`, por lo que los datos existentes siguen
  funcionando.
- Todas las reglas de negocio: fases (transición vía `hyaluFinishedDate`), frecuencias objetivo,
  sugerencia de noche (Retinol B3 y SANA en noches distintas), SANA Brightening opcional,
  escala de tolerancia y advertencia por irritación.
- Sin backend, sin cuentas, sin sincronización entre dispositivos.

[1.0.0]: https://example.com/skinlog/releases/tag/v1.0.0
