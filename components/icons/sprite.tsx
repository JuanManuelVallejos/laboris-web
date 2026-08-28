export const ICON_NAMES = [
  "droplet",
  "zap",
  "flame",
  "key",
  "hammer",
  "wind",
  "saw",
  "alert",
  "more",
  "bell",
  "mic",
  "search",
  "home",
  "clip",
  "user",
  "sun",
  "moon",
  "arrow",
  "edit",
  "check",
] as const;

export type IconName = (typeof ICON_NAMES)[number];

/**
 * Sprite del design system de Laboris (docs/design/components.css).
 * Se monta una única vez en el layout raíz; los <Icon/> lo referencian vía <use href="#i-*">.
 */
export default function IconSprite() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <g id="i-droplet" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3c3 4 6 7 6 10a6 6 0 0 1-12 0c0-3 3-6 6-10z" />
        </g>
        <g id="i-zap" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
        </g>
        <g id="i-flame" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3c1 3 4 5 4 9a4 4 0 0 1-8 0c0-1 .4-2 1-3 .3 1 1 1.5 1.5 1.5C10 8 11 5 12 3z" />
        </g>
        <g id="i-key" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="16" r="4" />
          <path d="m10.8 13.2 8.2-8.2M16 8l3-3M14 6l3-3" />
        </g>
        <g id="i-wind" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="7" rx="2" />
          <path d="M7 11v8m5-8v8m5-8v8" />
        </g>
        {/* Extensión propia de Laboris — no existe en el sprite original del design system, agregado para el oficio "Pintor" con el mismo estilo de trazo */}
        <g id="i-hammer" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <rect x="10" y="3" width="10" height="6" rx="1.5" transform="rotate(45 15 6)" />
          <path d="M12 9 5 21" />
        </g>
        {/* Extensión propia de Laboris — no existe en el sprite original del design system, agregado para el oficio "Carpintero" con el mismo estilo de trazo */}
        <g id="i-saw" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 18a2.5 2.5 0 1 1 3-2.5" />
          <path d="M6 18 21 4" />
          <path d="M6 18 8 16 7.5 14.5 10 12.5 9.5 11 12 9 11.5 7.5 14 5.5 21 4" />
        </g>
        <g id="i-alert" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5M12 16h.01" />
        </g>
        <g id="i-more" fill="none" stroke="currentColor" strokeWidth="1.7">
          <circle cx="6" cy="6" r="1.6" />
          <circle cx="12" cy="6" r="1.6" />
          <circle cx="18" cy="6" r="1.6" />
          <circle cx="6" cy="12" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="18" cy="12" r="1.6" />
          <circle cx="6" cy="18" r="1.6" />
          <circle cx="12" cy="18" r="1.6" />
          <circle cx="18" cy="18" r="1.6" />
        </g>
        <g id="i-bell" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </g>
        <g id="i-mic" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="2" width="6" height="11" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
        </g>
        <g id="i-search" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </g>
        <g id="i-home" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1Z" />
        </g>
        <g id="i-clip" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="4" width="12" height="17" rx="2" />
          <path d="M9 4h6v3H9zM9 11h6M9 15h4" />
        </g>
        <g id="i-user" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" />
        </g>
        <g id="i-sun" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" />
        </g>
        <g id="i-moon" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
        </g>
        <g id="i-arrow" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </g>
        {/* Extensión propia de Laboris — no existe en el sprite original del design system, agregado para el botón de "editar perfil" con el mismo estilo de trazo */}
        <g id="i-edit" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 4.5 19.5 9.5 8 21H3v-5z" />
          <path d="M12.5 6.5 17.5 11.5" />
        </g>
        <g id="i-check" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12.5 9.5 18 20 6" />
        </g>
      </defs>
    </svg>
  );
}
