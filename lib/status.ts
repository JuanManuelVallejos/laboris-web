import type { JobStatus } from "@/lib/types";

export type BadgeTone = "neutral" | "info" | "verif" | "alert";

/** Estados de un Request (pedido) — pantallas "Mis pedidos" / "Pedidos recibidos". */
export const REQUEST_STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  pending:  { label: "Pendiente",  tone: "neutral" },
  viewed:   { label: "Visto",      tone: "info" },
  accepted: { label: "Aceptado",   tone: "verif" },
  rejected: { label: "Rechazado",  tone: "alert" },
  expired:  { label: "Vencido",    tone: "neutral" },
};

/**
 * Tono visual por estado de Job. Las labels, el orden del stepper y las
 * transiciones válidas del ciclo de vida del job son lógica de negocio propia
 * de app/jobs/[id]/page.tsx (mirror de domain.ValidTransitions en el backend)
 * y siguen viviendo ahí — acá solo se centraliza el color/tono del badge.
 */
export const JOB_STATUS_TONE: Record<JobStatus, BadgeTone> = {
  pending_visit: "neutral",
  visit_proposed: "neutral",
  visit_scheduled: "info",
  visit_quoted: "info",
  visit_paid: "verif",
  visit_completed: "verif",
  work_quoted: "info",
  work_approved: "verif",
  work_in_progress: "info",
  work_delivered: "verif",
  rework_requested: "neutral",
  rework_quoted: "info",
  rework_accepted: "neutral",
  rework_visit_proposed: "neutral",
  completed: "verif",
  cancelled: "alert",
};
