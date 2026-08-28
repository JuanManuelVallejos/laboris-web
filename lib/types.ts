// Nombrado deliberadamente distinto de `File`, el tipo nativo del browser
// (el objeto que sale de un <input type="file">) — mismo nombre que
// domain.Attachment en el backend.
export interface Attachment {
  id: string;
  url: string;
  createdAt: string;
}

export interface Professional {
  id: string;
  name: string;
  avatarUrl?: string;
  trade: string;
  homeAddress?: string;
  radiusKm?: number;
  /** Distancia al domicilio de quien pide el listado, en km — la calcula el backend, nunca se expone la ubicación exacta. */
  distanceKm?: number;
  bio: string;
  rating: number;
  verified: boolean;
  status: "active" | "suspended";
  portfolioPhotos?: Attachment[];
}

export interface SavedAddress {
  id: string;
  label: string;
  address: string;
  isDefault: boolean;
  /** Si tiene un trabajo en curso creado con este domicilio, no se puede editar ni borrar. */
  hasActiveJob: boolean;
}

export type JobStatus =
  | "pending_visit"
  | "visit_proposed"
  | "visit_scheduled"
  | "visit_quoted"
  | "visit_paid"
  | "visit_completed"
  | "work_quoted"
  | "work_approved"
  | "work_in_progress"
  | "work_delivered"
  | "rework_requested"
  | "rework_quoted"
  | "rework_accepted"
  | "rework_visit_proposed"
  | "completed"
  | "cancelled";

export interface Payment {
  id: string;
  jobId: string;
  type: "visit" | "work";
  amount: number;
  status: "pending" | "paid" | "released" | "refunded";
  provider: string;
}

export interface ReworkRecord {
  id: string;
  jobId: string;
  cycleNumber: number;
  notes?: string;
  quoteAmount?: number;
  noCharge: boolean;
  scheduledAt?: string;
  createdAt: string;
}

export interface Job {
  id: string;
  requestId: string;
  clientId: string;
  clientName: string;
  professionalId: string;
  professionalName: string;
  /** Domicilio congelado al momento de crear la solicitud — no cambia si el cliente edita después ese domicilio guardado. Vacío en trabajos legacy. Para el profesional viene recortado hasta que addressRevealed sea true. */
  address?: string;
  /** true si `address` trae el domicilio completo — para el profesional, recién una vez confirmada la visita. No confiar en este campo cuando llega por SSE (ver app/jobs/[id]/page.tsx). */
  addressRevealed?: boolean;
  status: JobStatus;
  visitScheduledAt?: string;
  visitQuoteAmount?: number;
  workQuoteAmount?: number;
  workDescription?: string;
  reworkCount: number;
  reworkNotes?: string;
  reworkQuoteAmount?: number;
  cancelReason?: string;
  completedAt?: string;
  cancelledAt?: string;
  workDeliveredAt?: string;
  autoCompleted: boolean;
  autoCloseDeadline?: string;
  payments: Payment[];
  reworkRecords: ReworkRecord[];
  createdAt: string;
  updatedAt: string;
  viewerIsClient: boolean;
  viewerIsProfessional: boolean;
}

export interface Message {
  id: string;
  requestId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}
