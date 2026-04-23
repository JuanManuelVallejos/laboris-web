import type { Professional } from "./types";

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
