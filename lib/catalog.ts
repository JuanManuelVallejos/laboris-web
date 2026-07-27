import type { IconName } from "@/components/icons/sprite";

export interface Trade {
  /** Valor canónico tal como se guarda en el backend (Professional.trade). */
  label: string;
  /** Valor normalizado en minúsculas, usado para filtrar/comparar. */
  value: string;
  icon: IconName;
}

export const TRADES: Trade[] = [
  { label: "Plomero",      value: "plomero",      icon: "droplet" },
  { label: "Electricista", value: "electricista", icon: "zap" },
  { label: "Gasista",      value: "gasista",      icon: "flame" },
  { label: "Cerrajero",    value: "cerrajero",    icon: "key" },
  { label: "Pintor",       value: "pintor",       icon: "paint" },
  { label: "Aire acond.",  value: "aire acond.",  icon: "wind" },
  { label: "Carpintero",   value: "carpintero",   icon: "hammer" },
];

/** Opción libre disponible en los formularios de alta/edición de profesional, sin ícono de categoría en el home. */
export const OTHER_TRADE_LABEL = "Otro";

export const ZONES = ["CABA", "Zona Norte", "Zona Sur", "Zona Oeste", "GBA"] as const;
