export interface Professional {
  id: string;
  name: string;
  trade: string;
  zone: string;
  bio: string;
  rating: number;
  verified: boolean;
  status: "active" | "suspended";
}

export type JobStatus =
  | "pending_visit"
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

export interface Job {
  id: string;
  requestId: string;
  clientId: string;
  clientName: string;
  professionalId: string;
  professionalName: string;
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
  payments: Payment[];
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  requestId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}
