/* =============================================================================
   icons.js  —  íconos SVG dibujados a mano (sin dependencias)
   Uso: SK.icon("sun"), SK.icon("moon", 20). Heredan color con currentColor.
   ============================================================================= */

window.SK = window.SK || {};

SK.icon = (function () {
  const P = {
    sun: '<circle cx="12" cy="12" r="4.2"/><line x1="12" y1="2.5" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="21.5"/><line x1="2.5" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="21.5" y2="12"/><line x1="5.1" y1="5.1" x2="6.9" y2="6.9"/><line x1="17.1" y1="17.1" x2="18.9" y2="18.9"/><line x1="5.1" y1="18.9" x2="6.9" y2="17.1"/><line x1="17.1" y1="6.9" x2="18.9" y2="5.1"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.3 6.3 0 0 0 10.5 10.5z"/>',
    droplet: '<path d="M12 3s6 6.4 6 10.5a6 6 0 0 1-12 0C6 9.4 12 3 12 3z"/>',
    check: '<polyline points="4 12.5 9.5 18 20 6"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><line x1="3.5" y1="9.5" x2="20.5" y2="9.5"/><line x1="8" y1="2.5" x2="8" y2="6.5"/><line x1="16" y1="2.5" x2="16" y2="6.5"/>',
    chart: '<line x1="4" y1="20" x2="20" y2="20"/><rect x="5.5" y="12" width="3.2" height="7"/><rect x="10.4" y="8" width="3.2" height="11"/><rect x="15.3" y="4.5" width="3.2" height="14.5"/>',
    layers: '<polygon points="12 3 21 8 12 13 3 8 12 3"/><polyline points="3 13 12 18 21 13"/>',
    settings: '<circle cx="12" cy="12" r="3.2"/><path d="M19.4 12a7.4 7.4 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7.3 7.3 0 0 0-2-1.2l-.3-2.5H8.9l-.3 2.5a7.3 7.3 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5a7.4 7.4 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-1a7.3 7.3 0 0 0 2 1.2l.3 2.5h4.2l.3-2.5a7.3 7.3 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    edit: '<path d="M14.5 4.5l5 5"/><path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19l-4 1z"/>',
    close: '<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>',
    warning: '<path d="M12 3l9.5 16.5H2.5L12 3z"/><line x1="12" y1="10" x2="12" y2="14.5"/><circle cx="12" cy="17.3" r="0.4"/>',
    download: '<path d="M12 3v11"/><polyline points="7 10 12 15 17 10"/><path d="M4 20h16"/>',
    upload: '<path d="M12 15V4"/><polyline points="7 8 12 3 17 8"/><path d="M4 20h16"/>',
    trash: '<polyline points="4 6.5 20 6.5"/><path d="M9 6.5V4h6v2.5"/><path d="M6.5 6.5l1 13a1.5 1.5 0 0 0 1.5 1.4h6a1.5 1.5 0 0 0 1.5-1.4l1-13"/>',
    dot: '<circle cx="12" cy="12" r="6"/>',
    spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"/>',
    info: '<circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16.5"/><circle cx="12" cy="7.8" r="0.5"/>',
  };

  const FILLED = { droplet: 1, dot: 1, spark: 1, moon: 1, warning: 0 };

  return function icon(name, size) {
    const body = P[name] || "";
    const s = size || 22;
    const fill = FILLED[name] ? "currentColor" : "none";
    return (
      '<svg class="ic ic-' + name + '" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" ' +
      'fill="' + fill + '" stroke="currentColor" stroke-width="1.7" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      body + "</svg>"
    );
  };
})();
