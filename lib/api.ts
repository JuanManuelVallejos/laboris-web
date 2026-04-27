import type { Professional, Job, Message } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export async function getProfessionals(): Promise<Professional[]> {
  const res = await fetch(`${BASE}/api/v1/professionals`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch professionals");
  const data = await res.json();
  return data ?? [];
}

export async function getProfessional(id: string): Promise<Professional> {
  const res = await fetch(`${BASE}/api/v1/professionals/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Professional not found");
  return res.json();
}

export async function ping(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/ping`, { cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

export interface OnboardingData {
  email: string;
  fullName: string;
  role: "client" | "professional";
  trade?: string;
  zone?: string;
  bio?: string;
}

export async function completeOnboarding(
  data: OnboardingData,
  getToken: () => Promise<string | null>
): Promise<{ userId: string; role: string }> {
  const token = await getToken();
  const res = await fetch(`${BASE}/api/v1/onboarding`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status}: ${body}`);
  }
  return res.json();
}

export async function getMyProfessional(
  getToken: () => Promise<string | null>
): Promise<Professional> {
  const token = await getToken();
  const res = await fetch(`${BASE}/api/v1/me/professional`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    if (!body) throw new Error(`Error ${res.status} — el servidor no está disponible todavía. Intentá de nuevo en unos segundos.`);
    throw new Error(body.error ?? `Error ${res.status}`);
  }
  return res.json();
}

export async function updateMyProfessional(
  data: { trade: string; zone: string; bio: string },
  getToken: () => Promise<string | null>
): Promise<Professional> {
  const token = await getToken();
  const res = await fetch(`${BASE}/api/v1/me/professional`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status}: ${body}`);
  }
  return res.json();
}

export async function createRequest(
  professionalId: string,
  description: string,
  getToken: () => Promise<string | null>
): Promise<void> {
  const token = await getToken();
  const res = await fetch(`${BASE}/api/v1/requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ professionalId, description }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "error desconocido" }));
    throw new Error(body.error ?? "error desconocido");
  }
}

export interface Request {
  id: string;
  clientId: string;
  clientName: string;
  professionalId: string;
  professionalName: string;
  description: string;
  status: "pending" | "accepted" | "rejected";
  rejectionReason: string;
  jobId?: string;
  createdAt: string;
}

export async function getReceivedRequests(
  getToken: () => Promise<string | null>
): Promise<Request[]> {
  const token = await getToken();
  const res = await fetch(`${BASE}/api/v1/me/requests/received`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data ?? [];
}

export async function getSentRequests(
  getToken: () => Promise<string | null>
): Promise<Request[]> {
  const token = await getToken();
  const res = await fetch(`${BASE}/api/v1/me/requests/sent`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data ?? [];
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export async function getNotifications(
  getToken: () => Promise<string | null>
): Promise<Notification[]> {
  const token = await getToken();
  const res = await fetch(`${BASE}/api/v1/me/notifications`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data ?? [];
}

export async function getUnreadCount(
  getToken: () => Promise<string | null>
): Promise<number> {
  const token = await getToken();
  const res = await fetch(`${BASE}/api/v1/me/notifications/unread-count`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return 0;
  const data = await res.json();
  return data.count ?? 0;
}

export interface UserWithRoles {
  id: string;
  clerkId: string;
  email: string;
  fullName: string;
  createdAt: string;
  roles: string[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getAdminProfessionals(
  page: number,
  getToken: () => Promise<string | null>
): Promise<PaginatedResponse<Professional>> {
  const token = await getToken();
  const res = await fetch(`${BASE}/api/v1/admin/professionals?page=${page}&limit=20`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

export async function getAdminUsers(
  page: number,
  getToken: () => Promise<string | null>
): Promise<PaginatedResponse<UserWithRoles>> {
  const token = await getToken();
  const res = await fetch(`${BASE}/api/v1/admin/users?page=${page}&limit=20`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

export async function adminVerifyProfessional(
  id: string,
  verified: boolean,
  getToken: () => Promise<string | null>
): Promise<void> {
  const token = await getToken();
  await fetch(`${BASE}/api/v1/admin/professionals/${id}/verify`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ verified }),
  });
}

export async function adminSetProfessionalStatus(
  id: string,
  status: "active" | "suspended",
  getToken: () => Promise<string | null>
): Promise<void> {
  const token = await getToken();
  await fetch(`${BASE}/api/v1/admin/professionals/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status }),
  });
}

export async function adminDeleteProfessional(
  id: string,
  getToken: () => Promise<string | null>
): Promise<void> {
  const token = await getToken();
  await fetch(`${BASE}/api/v1/admin/professionals/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function markAllNotificationsRead(
  getToken: () => Promise<string | null>
): Promise<void> {
  const token = await getToken();
  await fetch(`${BASE}/api/v1/me/notifications/read-all`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function updateRequestStatus(
  id: string,
  status: "accepted" | "rejected",
  getToken: () => Promise<string | null>,
  rejectionReason?: string
): Promise<void> {
  const token = await getToken();
  const res = await fetch(`${BASE}/api/v1/requests/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status, rejectionReason: rejectionReason ?? "" }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "error desconocido" }));
    throw new Error(body.error ?? "error desconocido");
  }
}

// ─── Job API ────────────────────────────────────────────────────────────────

async function jobPatch(
  jobId: string,
  action: string,
  body: Record<string, unknown> | null,
  getToken: () => Promise<string | null>
): Promise<Job> {
  const token = await getToken();
  const res = await fetch(`${BASE}/api/v1/jobs/${jobId}/${action}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : "{}",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let msg = `HTTP ${res.status}`;
    try { const j = JSON.parse(text); msg = j.error ?? j.message ?? msg; } catch { if (text) msg = text; }
    throw new Error(msg);
  }
  return res.json();
}

export async function getJob(
  id: string,
  getToken: () => Promise<string | null>
): Promise<Job> {
  const token = await getToken();
  const res = await fetch(`${BASE}/api/v1/jobs/${id}`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

export async function listMyJobs(
  getToken: () => Promise<string | null>
): Promise<Job[]> {
  const token = await getToken();
  const res = await fetch(`${BASE}/api/v1/me/jobs`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}

export const scheduleVisit = (jobId: string, scheduledAt: string, gt: () => Promise<string | null>) =>
  jobPatch(jobId, "schedule-visit", { scheduledAt }, gt);

export const submitVisitQuote = (jobId: string, amount: number, gt: () => Promise<string | null>) =>
  jobPatch(jobId, "visit-quote", { amount }, gt);

export const skipVisit = (jobId: string, workAmount: number, workDescription: string, gt: () => Promise<string | null>) =>
  jobPatch(jobId, "skip-visit", { workAmount, workDescription }, gt);

export const payVisit = (jobId: string, gt: () => Promise<string | null>) =>
  jobPatch(jobId, "pay-visit", null, gt);

export const completeVisit = (jobId: string, gt: () => Promise<string | null>) =>
  jobPatch(jobId, "complete-visit", null, gt);

export const submitWorkQuote = (jobId: string, amount: number, description: string, gt: () => Promise<string | null>) =>
  jobPatch(jobId, "work-quote", { amount, description }, gt);

export const approveWorkQuote = (jobId: string, gt: () => Promise<string | null>) =>
  jobPatch(jobId, "approve-work", null, gt);

export const startWork = (jobId: string, gt: () => Promise<string | null>) =>
  jobPatch(jobId, "start-work", null, gt);

export const deliverWork = (jobId: string, gt: () => Promise<string | null>) =>
  jobPatch(jobId, "deliver-work", null, gt);

export const requestRework = (jobId: string, notes: string, gt: () => Promise<string | null>) =>
  jobPatch(jobId, "request-rework", { notes }, gt);

export const submitReworkQuote = (jobId: string, amount: number, gt: () => Promise<string | null>) =>
  jobPatch(jobId, "rework-quote", { amount }, gt);

export const approveReworkQuote = (jobId: string, gt: () => Promise<string | null>) =>
  jobPatch(jobId, "approve-rework-quote", null, gt);

export const acceptRework = (jobId: string, gt: () => Promise<string | null>) =>
  jobPatch(jobId, "accept-rework", null, gt);

export const approveDelivery = (jobId: string, gt: () => Promise<string | null>) =>
  jobPatch(jobId, "approve-delivery", null, gt);

export const cancelJob = (jobId: string, reason: string, gt: () => Promise<string | null>) =>
  jobPatch(jobId, "cancel", { reason }, gt);

// ─── Message API ─────────────────────────────────────────────────────────────

export async function getMessages(
  requestId: string,
  getToken: () => Promise<string | null>
): Promise<Message[]> {
  const token = await getToken();
  const res = await fetch(`${BASE}/api/v1/requests/${requestId}/messages`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}

export async function sendMessage(
  requestId: string,
  content: string,
  getToken: () => Promise<string | null>
): Promise<Message> {
  const token = await getToken();
  const res = await fetch(`${BASE}/api/v1/requests/${requestId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "error desconocido" }));
    throw new Error(err.error ?? "error desconocido");
  }
  return res.json();
}
