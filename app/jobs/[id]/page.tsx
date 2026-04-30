"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import Topbar from "@/components/Topbar";
import NavBottom from "@/components/NavBottom";
import {
  getJob, getMessages, sendMessage,
  scheduleVisit, submitVisitQuote, skipVisit,
  payVisit, completeVisit, submitWorkQuote,
  approveWorkQuote, startWork, deliverWork,
  requestRework, submitReworkQuote, approveReworkQuote,
  acceptRework, approveDelivery, cancelJob,
} from "@/lib/api";
import type { Job, Message, ReworkRecord } from "@/lib/types";

// ─── Labels & styles ─────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  pending_visit:    "Esperando agenda de visita",
  visit_scheduled:  "Visita agendada",
  visit_quoted:     "Cotización de visita enviada",
  visit_paid:       "Visita pagada",
  visit_completed:  "Visita realizada",
  work_quoted:      "Cotización de trabajo enviada",
  work_approved:    "Cotización aprobada",
  work_in_progress: "Trabajo en progreso",
  work_delivered:   "Trabajo entregado",
  rework_requested: "Correcciones solicitadas",
  rework_quoted:    "Cotización de corrección enviada",
  completed:        "Completado",
  cancelled:        "Cancelado",
};

const STATUS_COLOR: Record<string, string> = {
  pending_visit:    "bg-amber-100 text-amber-700",
  visit_scheduled:  "bg-blue-100 text-blue-700",
  visit_quoted:     "bg-blue-100 text-blue-700",
  visit_paid:       "bg-green-100 text-green-700",
  visit_completed:  "bg-green-100 text-green-700",
  work_quoted:      "bg-blue-100 text-blue-700",
  work_approved:    "bg-green-100 text-green-700",
  work_in_progress: "bg-primary/10 text-primary",
  work_delivered:   "bg-purple-100 text-purple-700",
  rework_requested: "bg-orange-100 text-orange-700",
  rework_quoted:    "bg-blue-100 text-blue-700",
  completed:        "bg-green-100 text-green-700",
  cancelled:        "bg-red-100 text-red-600",
};

// Mirrors backend domain.ValidTransitions — single source of truth for which
// buttons are reachable from each state.
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending_visit:    ["visit_scheduled", "work_quoted", "cancelled"],
  visit_scheduled:  ["visit_completed", "visit_quoted", "cancelled"],
  visit_quoted:     ["visit_paid", "cancelled"],
  visit_paid:       ["visit_completed", "cancelled"],
  visit_completed:  ["work_quoted", "cancelled"],
  work_quoted:      ["work_approved", "cancelled"],
  work_approved:    ["work_in_progress", "cancelled"],
  work_in_progress: ["work_delivered", "cancelled"],
  work_delivered:   ["rework_requested", "completed"],   // no cancel here
  rework_requested: ["rework_quoted", "work_in_progress", "cancelled"],
  rework_quoted:    ["work_in_progress", "cancelled"],
  completed:        [],
  cancelled:        [],
};

function canDo(status: string, target: string): boolean {
  return VALID_TRANSITIONS[status]?.includes(target) ?? false;
}

const STEPS = [
  { key: "pending_visit",    label: "Solicitud" },
  { key: "visit_scheduled",  label: "Visita" },
  { key: "visit_completed",  label: "Visitada" },
  { key: "work_quoted",      label: "Cotizado" },
  { key: "work_approved",    label: "Aprobado" },
  { key: "work_in_progress", label: "En curso" },
  { key: "work_delivered",   label: "Entregado" },
  { key: "completed",        label: "Listo" },
];

const STEP_ORDER = STEPS.map((s) => s.key);

function stepIndex(status: string): number {
  const idx = STEP_ORDER.indexOf(status);
  if (idx !== -1) return idx;
  const map: Record<string, number> = {
    visit_quoted:     2, // entre visit_scheduled y visit_completed (path pago)
    visit_paid:       2, // mismo nivel que visit_completed (path pago)
    rework_requested: 6,
    rework_quoted:    6,
  };
  return map[status] ?? 0;
}

function fmt(n?: number) {
  return n !== undefined
    ? `$${n.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`
    : "—";
}

type GetToken = () => Promise<string | null>;

// ─── Stepper ─────────────────────────────────────────────────────────────────

function Stepper({ status }: { status: string }) {
  const current = stepIndex(status);
  const isCancelled = status === "cancelled";
  return (
    <div className="flex items-center overflow-x-auto pb-1">
      {STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center gap-1 min-w-[52px]">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                isCancelled
                  ? "bg-red-100 text-red-400"
                  : done
                  ? "bg-primary text-white"
                  : active
                  ? "bg-primary text-white ring-2 ring-primary/30 ring-offset-1"
                  : "bg-border text-muted"
              }`}>
                {done ? "✓" : i + 1}
              </div>
              <span className={`text-[10px] text-center leading-tight ${
                active ? "text-primary font-semibold" : "text-muted"
              }`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-4 mb-4 transition-colors ${
                done && !isCancelled ? "bg-primary" : "bg-border"
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Info row ────────────────────────────────────────────────────────────────

function InfoRow({
  label, value, highlight, positive,
}: {
  label: string; value: string; highlight?: boolean; positive?: boolean;
}) {
  return (
    <div className={`rounded-xl px-3 py-2.5 ${
      highlight ? "bg-orange-50" : positive ? "bg-green-50" : "bg-cream"
    }`}>
      <p className={`text-xs font-semibold mb-0.5 ${
        highlight ? "text-orange-600" : positive ? "text-green-700" : "text-muted"
      }`}>{label}</p>
      <p className={`text-sm ${
        highlight ? "text-orange-700" : positive ? "text-green-800 font-semibold" : "text-ink"
      }`}>{value}</p>
    </div>
  );
}

// ─── Rework History ──────────────────────────────────────────────────────────

function ReworkHistory({ records }: { records: ReworkRecord[] }) {
  if (records.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted uppercase tracking-wide">Historial de retrabajos</p>
      {records.map((rec) => (
        <div key={rec.id} className="border-l-2 border-orange-300 pl-3 py-1 space-y-0.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-orange-700">Retrabajo #{rec.cycleNumber}</span>
            <span className="text-xs font-semibold text-ink">
              {rec.quoteAmount !== undefined
                ? fmt(rec.quoteAmount)
                : <span className="text-muted font-normal">sin cargo extra</span>}
            </span>
          </div>
          {rec.notes && <p className="text-xs text-ink leading-snug">{rec.notes}</p>}
          <p className="text-[10px] text-muted">
            {new Date(rec.createdAt).toLocaleDateString("es-AR", {
              day: "numeric", month: "short", year: "numeric",
            })}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Action Panel ─────────────────────────────────────────────────────────────

function ActionPanel({
  job, isClient, isProfessional, getToken, onAction,
}: {
  job: Job;
  isClient: boolean;
  isProfessional: boolean;
  getToken: GetToken;
  onAction: (fn: () => Promise<Job>) => void;
}) {
  const [visitDate, setVisitDate] = useState("");
  const [visitAmount, setVisitAmount] = useState("");
  const [workAmount, setWorkAmount] = useState("");
  const [workDesc, setWorkDesc] = useState("");
  const [reworkNotes, setReworkNotes] = useState("");
  const [reworkQuoteAmount, setReworkQuoteAmount] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [showCancel, setShowCancel] = useState(false);

  const s = job.status;

  return (
    <div className="bg-surface rounded-2xl p-4 shadow-sm space-y-3">
      <p className="text-xs font-semibold text-muted uppercase tracking-wide">Estado del trabajo</p>

      {/* Info rows per status */}
      {s === "visit_scheduled" && job.visitScheduledAt && (
        <InfoRow
          label="Visita agendada"
          value={new Date(job.visitScheduledAt).toLocaleString("es-AR", {
            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
          })}
        />
      )}
      {job.visitQuoteAmount !== undefined &&
        ["visit_quoted","visit_paid","visit_completed","work_quoted","work_approved",
         "work_in_progress","work_delivered","rework_requested","rework_quoted","completed"].includes(s) && (
        <InfoRow label="Cotización de visita" value={fmt(job.visitQuoteAmount)} />
      )}
      {["work_quoted","work_approved","work_in_progress","work_delivered","rework_requested","rework_quoted","completed"].includes(s) && (
        <>
          {job.workQuoteAmount !== undefined && (
            <InfoRow label="Cotización del trabajo" value={fmt(job.workQuoteAmount)} />
          )}
          {job.workDescription && (
            <InfoRow label="Descripción" value={job.workDescription} />
          )}
        </>
      )}
      {job.reworkRecords?.length > 0 && (
        <ReworkHistory records={job.reworkRecords} />
      )}
      {s === "cancelled" && (
        <InfoRow label="Motivo de cancelación" value={job.cancelReason || "—"} highlight />
      )}
      {s === "completed" && (
        <InfoRow label="Pago liberado" value={fmt(job.workQuoteAmount)} positive />
      )}

      {/* ── Professional actions ── */}
      {isProfessional && (
        <>
          {s === "pending_visit" && (
            <div className="space-y-2 pt-1">
              <p className="text-xs font-medium text-ink">Agendar visita</p>
              <input
                type="datetime-local"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="w-full text-sm text-ink bg-cream border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                onClick={() => onAction(() => scheduleVisit(job.id, new Date(visitDate).toISOString(), getToken))}
                disabled={!visitDate}
                className="w-full text-sm font-semibold py-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-40 transition-colors"
              >
                Agendar visita
              </button>
              <p className="text-xs text-muted text-center">— o bien —</p>
              <p className="text-xs font-medium text-ink">Saltar visita y cotizar directo</p>
              <input
                type="number" placeholder="Monto del trabajo ($)" value={workAmount}
                onChange={(e) => setWorkAmount(e.target.value)} min="0"
                className="w-full text-sm text-ink bg-cream border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <input
                type="text" placeholder="Descripción del trabajo (opcional)" value={workDesc}
                onChange={(e) => setWorkDesc(e.target.value)}
                className="w-full text-sm text-ink bg-cream border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                onClick={() => onAction(() => skipVisit(job.id, parseFloat(workAmount), workDesc, getToken))}
                disabled={!workAmount || parseFloat(workAmount) <= 0}
                className="w-full text-sm font-semibold py-2.5 rounded-xl border border-primary text-primary hover:bg-primary/5 disabled:opacity-40 transition-colors"
              >
                Enviar cotización sin visita
              </button>
            </div>
          )}

          {s === "visit_scheduled" && (
            <div className="space-y-2 pt-1">
              <button
                onClick={() => onAction(() => completeVisit(job.id, getToken))}
                className="w-full text-sm font-semibold py-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors"
              >
                Confirmar que realicé la visita
              </button>
              <p className="text-xs text-muted text-center">— o cobrar por la visita —</p>
              <input
                type="number" placeholder="Monto de la visita ($)" value={visitAmount}
                onChange={(e) => setVisitAmount(e.target.value)} min="0"
                className="w-full text-sm text-ink bg-cream border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                onClick={() => onAction(() => submitVisitQuote(job.id, parseFloat(visitAmount), getToken))}
                disabled={!visitAmount || parseFloat(visitAmount) <= 0}
                className="w-full text-sm font-semibold py-2.5 rounded-xl border border-primary text-primary hover:bg-primary/5 disabled:opacity-40 transition-colors"
              >
                Enviar cotización de visita
              </button>
            </div>
          )}

          {s === "visit_paid" && (
            <button
              onClick={() => onAction(() => completeVisit(job.id, getToken))}
              className="w-full text-sm font-semibold py-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors"
            >
              Confirmar que realicé la visita
            </button>
          )}

          {s === "visit_completed" && (
            <div className="space-y-2 pt-1">
              <p className="text-xs font-medium text-ink">Cotización del trabajo</p>
              <input
                type="number" placeholder="Monto total del trabajo ($)" value={workAmount}
                onChange={(e) => setWorkAmount(e.target.value)} min="0"
                className="w-full text-sm text-ink bg-cream border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <input
                type="text" placeholder="Descripción del trabajo" value={workDesc}
                onChange={(e) => setWorkDesc(e.target.value)}
                className="w-full text-sm text-ink bg-cream border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                onClick={() => onAction(() => submitWorkQuote(job.id, parseFloat(workAmount), workDesc, getToken))}
                disabled={!workAmount || parseFloat(workAmount) <= 0}
                className="w-full text-sm font-semibold py-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-40 transition-colors"
              >
                Enviar cotización del trabajo
              </button>
            </div>
          )}

          {s === "work_approved" && (
            <button
              onClick={() => onAction(() => startWork(job.id, getToken))}
              className="w-full text-sm font-semibold py-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors"
            >
              Comenzar trabajo
            </button>
          )}

          {s === "work_in_progress" && (
            <button
              onClick={() => onAction(() => deliverWork(job.id, getToken))}
              className="w-full text-sm font-semibold py-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors"
            >
              Marcar como entregado
            </button>
          )}

          {s === "rework_requested" && (
            <div className="space-y-2 pt-1">
              <button
                onClick={() => onAction(() => acceptRework(job.id, getToken))}
                className="w-full text-sm font-semibold py-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors"
              >
                Aceptar correcciones sin costo extra
              </button>
              <p className="text-xs text-muted text-center">— o cobrar por las correcciones —</p>
              <input
                type="number"
                placeholder="Costo adicional de corrección ($)"
                value={reworkQuoteAmount}
                onChange={(e) => setReworkQuoteAmount(e.target.value)}
                min="0"
                className="w-full text-sm text-ink bg-cream border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                onClick={() => onAction(() => submitReworkQuote(job.id, parseFloat(reworkQuoteAmount), getToken))}
                disabled={!reworkQuoteAmount || parseFloat(reworkQuoteAmount) <= 0}
                className="w-full text-sm font-semibold py-2.5 rounded-xl border border-primary text-primary hover:bg-primary/5 disabled:opacity-40 transition-colors"
              >
                Enviar cotización de corrección
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Client actions ── */}
      {isClient && (
        <>
          {s === "visit_quoted" && (
            <button
              onClick={() => onAction(() => payVisit(job.id, getToken))}
              className="w-full text-sm font-semibold py-2.5 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              Pagar visita {fmt(job.visitQuoteAmount)}{" "}
              <span className="text-xs opacity-75">(simulado)</span>
            </button>
          )}

          {s === "work_quoted" && (
            <button
              onClick={() => onAction(() => approveWorkQuote(job.id, getToken))}
              className="w-full text-sm font-semibold py-2.5 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              Aprobar cotización {fmt(job.workQuoteAmount)}
            </button>
          )}

          {s === "rework_quoted" && (
            <button
              onClick={() => onAction(() => approveReworkQuote(job.id, getToken))}
              className="w-full text-sm font-semibold py-2.5 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              Aprobar cotización de corrección {fmt(job.reworkQuoteAmount)}
            </button>
          )}

          {s === "work_delivered" && (
            <div className="space-y-2 pt-1">
              <button
                onClick={() => onAction(() => approveDelivery(job.id, getToken))}
                className="w-full text-sm font-semibold py-2.5 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                Aprobar entrega y liberar pago
              </button>
              <p className="text-xs text-muted text-center">— o —</p>
              <textarea
                value={reworkNotes}
                onChange={(e) => setReworkNotes(e.target.value)}
                placeholder="Describí qué correcciones necesitás..."
                rows={2}
                className="w-full text-sm text-ink bg-cream border border-border rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-orange-300 transition"
              />
              <button
                onClick={() => onAction(() => requestRework(job.id, reworkNotes, getToken))}
                disabled={!reworkNotes.trim()}
                className="w-full text-sm font-semibold py-2.5 rounded-xl border border-orange-400 text-orange-600 hover:bg-orange-50 disabled:opacity-40 transition-colors"
              >
                Pedir correcciones
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Cancel (only when backend allows the transition) ── */}
      {canDo(s, "cancelled") && (
        <div className="pt-1 border-t border-border">
          {!showCancel ? (
            <button
              onClick={() => setShowCancel(true)}
              className="w-full text-xs text-muted hover:text-red-600 py-1 transition-colors"
            >
              Cancelar trabajo
            </button>
          ) : (
            <div className="space-y-2">
              <input
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Motivo de cancelación"
                type="text"
                className="w-full text-sm text-ink bg-cream border border-red-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-300 transition"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => onAction(() => cancelJob(job.id, cancelReason, getToken))}
                  disabled={!cancelReason.trim()}
                  className="flex-1 text-sm font-semibold py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 transition-colors"
                >
                  Confirmar cancelación
                </button>
                <button
                  onClick={() => setShowCancel(false)}
                  className="text-sm font-semibold py-2 px-3 rounded-xl border border-border text-muted hover:bg-cream transition-colors"
                >
                  Volver
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Chat ────────────────────────────────────────────────────────────────────

function Chat({
  requestId, clientId, isClient, getToken,
}: {
  requestId: string;
  clientId: string;   // job.clientId — messages from client have senderId === clientId
  isClient: boolean;
  getToken: GetToken;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getMessages(requestId, getToken).then(setMessages);
  }, [requestId, getToken]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const msg = await sendMessage(requestId, input.trim(), getToken);
      setMessages((prev) => [...prev, msg]);
      setInput("");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
      <p className="text-xs font-semibold text-muted uppercase tracking-wide px-4 pt-4 pb-2">
        Conversación
      </p>
      <div className="px-4 pb-2 space-y-2 max-h-64 overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-xs text-muted text-center py-4">No hay mensajes aún</p>
        )}
        {messages.map((m) => {
          const mine = isClient
            ? m.senderId === clientId
            : m.senderId !== clientId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                mine
                  ? "bg-primary text-white rounded-br-sm"
                  : "bg-cream text-ink rounded-bl-sm"
              }`}>
                {!mine && (
                  <p className="text-[10px] font-semibold opacity-70 mb-0.5">{m.senderName}</p>
                )}
                <p className="text-sm leading-snug">{m.content}</p>
                <p className={`text-[10px] mt-1 ${mine ? "opacity-60 text-right" : "text-muted"}`}>
                  {new Date(m.createdAt).toLocaleTimeString("es-AR", {
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2 p-3 border-t border-border">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Escribí un mensaje..."
          type="text"
          className="flex-1 text-sm text-ink bg-cream rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 border border-border transition"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="text-sm font-semibold px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-40 transition-colors"
        >
          {sending ? "..." : "Enviar"}
        </button>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function JobPage() {
  const { id } = useParams<{ id: string }>();
  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const roles = (user?.unsafeMetadata?.roles as string[] | undefined) ?? [];
  const isProfessional = roles.includes("professional");
  const isClient = roles.includes("client");

  useEffect(() => {
    if (!isLoaded) return;
    getJob(id, getToken)
      .then(setJob)
      .catch(() => router.replace("/"))
      .finally(() => setLoading(false));
  }, [id, getToken, isLoaded, router]);

  async function handleAction(fn: () => Promise<Job>) {
    setActionLoading(true);
    setActionError("");
    try {
      const updated = await fn();
      setJob(updated);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-cream">
        <Topbar />
        <main className="flex-1 px-4 pt-5 pb-24 max-w-lg mx-auto w-full space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface rounded-2xl p-4 shadow-sm animate-pulse h-20" />
          ))}
        </main>
        <NavBottom />
      </div>
    );
  }

  if (!job) return null;

  const counterpart = isProfessional ? job.clientName : job.professionalName;

  return (
    <div className="flex flex-col min-h-screen bg-cream">
      <Topbar />

      <main className="flex-1 px-4 pt-5 pb-24 max-w-lg mx-auto w-full space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <button
              onClick={() => router.back()}
              className="text-primary text-sm font-medium mb-1"
            >
              ← Volver
            </button>
            <h2 className="text-lg font-bold text-ink">Trabajo con {counterpart}</h2>
            <p className="text-xs text-muted mt-0.5">
              Iniciado{" "}
              {new Date(job.createdAt).toLocaleDateString("es-AR", {
                day: "numeric", month: "long",
              })}
            </p>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold shrink-0 ${STATUS_COLOR[job.status]}`}>
            {STATUS_LABEL[job.status]}
          </span>
        </div>

        {/* Stepper */}
        <div className="bg-surface rounded-2xl p-4 shadow-sm overflow-x-auto">
          <Stepper status={job.status} />
        </div>

        {/* Action error */}
        {actionError && (
          <div className="bg-red-50 rounded-xl px-4 py-3">
            <p className="text-sm text-red-600">{actionError}</p>
          </div>
        )}

        {/* Action panel */}
        {actionLoading ? (
          <div className="bg-surface rounded-2xl p-8 shadow-sm flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <ActionPanel
            job={job}
            isClient={isClient}
            isProfessional={isProfessional}
            getToken={getToken}
            onAction={handleAction}
          />
        )}

        {/* Chat */}
        <Chat
          requestId={job.requestId}
          clientId={job.clientId}
          isClient={isClient}
          getToken={getToken}
        />
      </main>

      <NavBottom />
    </div>
  );
}
