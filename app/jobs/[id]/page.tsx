"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import Topbar from "@/components/Topbar";
import NavBottom from "@/components/NavBottom";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { TextInput, Textarea } from "@/components/ui/Field";
import Icon from "@/components/icons/Icon";
import { JOB_STATUS_TONE } from "@/lib/status";
import {
  getJob, getMessages, sendMessage, messagesStreamUrl, jobStreamUrl,
  scheduleVisit, confirmVisit, declineVisit, submitVisitQuote, skipVisit,
  payVisit, completeVisit, submitWorkQuote,
  approveWorkQuote, startWork, deliverWork,
  requestRework, submitReworkQuote, approveReworkQuote,
  acceptRework, scheduleReworkVisit, confirmReworkVisit, declineReworkVisit,
  approveDelivery, cancelJob,
} from "@/lib/api";
import { useEventStream } from "@/lib/useEventStream";
import type { Job, JobStatus, Message, ReworkRecord } from "@/lib/types";

// ─── Labels ──────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<JobStatus, string> = {
  pending_visit:    "Esperando fecha de visita",
  visit_proposed:   "Fecha propuesta — pendiente confirmación",
  visit_scheduled:  "Visita confirmada",
  visit_quoted:     "Cotización de visita enviada",
  visit_paid:       "Visita pagada",
  visit_completed:  "Visita realizada",
  work_quoted:      "Cotización de trabajo enviada",
  work_approved:    "Cotización aprobada",
  work_in_progress: "Trabajo en progreso",
  work_delivered:   "Trabajo entregado",
  rework_requested:      "Correcciones solicitadas",
  rework_quoted:         "Cotización de corrección enviada",
  rework_accepted:       "Correcciones aceptadas — coordinando fecha",
  rework_visit_proposed: "Fecha de retrabajo propuesta — pendiente confirmación",
  completed:        "Completado",
  cancelled:        "Cancelado",
};

// Mirrors backend domain.ValidTransitions — single source of truth for which
// buttons are reachable from each state.
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending_visit:    ["visit_proposed", "work_quoted", "cancelled"],
  visit_proposed:   ["visit_scheduled", "visit_quoted", "pending_visit", "cancelled"],
  visit_scheduled:  ["visit_completed", "visit_quoted", "cancelled"],
  visit_quoted:     ["visit_paid", "cancelled"],
  visit_paid:       ["visit_completed", "cancelled"],
  visit_completed:  ["work_quoted", "cancelled"],
  work_quoted:      ["work_approved", "cancelled"],
  work_approved:    ["work_in_progress", "cancelled"],
  work_in_progress: ["work_delivered", "cancelled"],
  work_delivered:   ["rework_requested", "completed"],   // no cancel here
  rework_requested:      ["rework_quoted", "rework_accepted", "cancelled"],
  rework_quoted:         ["rework_accepted", "cancelled"],
  rework_accepted:       ["rework_visit_proposed", "cancelled"],
  rework_visit_proposed: ["work_in_progress", "rework_accepted", "cancelled"],
  completed:        [],
  cancelled:        [],
};

function canDo(status: string, target: string): boolean {
  return VALID_TRANSITIONS[status]?.includes(target) ?? false;
}

const STEPS = [
  { key: "pending_visit",    label: "Solicitud" },
  { key: "visit_scheduled",  label: "Visita" },
  { key: "visit_completed",  label: "Visitado" },
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
    visit_proposed:   1, // misma posición que visit_scheduled en el stepper
    visit_quoted:     2,
    visit_paid:       2,
    rework_requested:      6,
    rework_quoted:         6,
    rework_accepted:       6,
    rework_visit_proposed: 6,
  };
  return map[status] ?? 0;
}

function fmt(n?: number) {
  return n !== undefined
    ? `$${n.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`
    : "—";
}

function isFutureDateTime(day: string, time: string): boolean {
  if (!day || !time) return false;
  return new Date(`${day}T${time}`).getTime() > Date.now();
}

type GetToken = () => Promise<string | null>;
type Tone = "neutral" | "warn" | "positive";

const TONE_ACCENT: Record<Tone, string> = {
  neutral: "var(--ink-soft)",
  warn: "var(--amber)",
  positive: "var(--brand-mid)",
};

// ─── Stepper ─────────────────────────────────────────────────────────────────

function Stepper({ status }: { status: string }) {
  const current = stepIndex(status);
  const isCancelled = status === "cancelled";
  return (
    <div className="flex items-center overflow-x-auto pb-1">
      {STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        const circleStyle = isCancelled
          ? { background: "color-mix(in srgb, var(--brand-alert) 16%, transparent)", color: "var(--brand-alert)" }
          : done || active
          ? { background: "var(--brand-deep)", color: "var(--on-brand)" }
          : { background: "var(--border)", color: "var(--ink-soft)" };
        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center gap-1 min-w-[52px]">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${active && !isCancelled ? "ring-2 ring-offset-1" : ""}`}
                style={{ ...circleStyle, ...(active && !isCancelled ? { boxShadow: "0 0 0 2px color-mix(in srgb, var(--brand-vivid) 30%, transparent)" } : {}) }}
              >
                {done ? "✓" : i + 1}
              </div>
              <span
                className="text-[10px] text-center leading-tight"
                style={{ color: active ? "var(--brand-deep)" : "var(--ink-soft)", fontWeight: active ? "var(--fw-semi)" : "var(--fw-reg)" }}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="h-0.5 w-4 mb-4 transition-colors" style={{ background: done && !isCancelled ? "var(--brand-deep)" : "var(--border)" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Info row ────────────────────────────────────────────────────────────────

function InfoRow({ label, value, tone = "neutral" }: { label: string; value: string; tone?: Tone }) {
  const accent = TONE_ACCENT[tone];
  const bg = tone === "neutral" ? "var(--surface-3)" : `color-mix(in srgb, ${accent} 12%, transparent)`;
  return (
    <div className="rounded-xl px-3 py-2.5" style={{ background: bg }}>
      <p className="text-xs font-semibold mb-0.5" style={{ color: accent }}>{label}</p>
      <p className="text-sm text-ink" style={{ fontWeight: tone === "positive" ? "var(--fw-semi)" : "var(--fw-reg)" }}>{value}</p>
    </div>
  );
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div
      className="rounded-xl px-3 py-2.5 text-center space-y-1"
      style={{ background: "color-mix(in srgb, var(--amber) 12%, transparent)" }}
    >
      <p className="text-xs font-semibold" style={{ color: "var(--amber)" }}>{title}</p>
      <p className="text-xs text-ink-mid">{body}</p>
    </div>
  );
}

// ─── Rework History ──────────────────────────────────────────────────────────

function ReworkHistory({ records }: { records: ReworkRecord[] }) {
  if (records.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-ink-soft uppercase tracking-wide">Historial de retrabajos</p>
      {records.map((rec) => (
        <div key={rec.id} className="pl-3 py-1 space-y-0.5" style={{ borderLeft: "2px solid var(--amber)" }}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold" style={{ color: "var(--amber)" }}>Retrabajo #{rec.cycleNumber}</span>
            <span className="text-xs font-semibold text-ink">
              {rec.quoteAmount !== undefined
                ? fmt(rec.quoteAmount)
                : rec.noCharge
                ? <span className="text-ink-soft font-normal">Sin cargo extra</span>
                : <span className="text-ink-soft font-normal">Pendiente de cotización</span>}
            </span>
          </div>
          {rec.notes && <p className="text-xs text-ink leading-snug">{rec.notes}</p>}
          {rec.scheduledAt && (
            <p className="text-[10px]" style={{ color: "var(--amber)" }}>
              Fecha acordada:{" "}
              {new Date(rec.scheduledAt).toLocaleDateString("es-AR", {
                day: "numeric", month: "short", year: "numeric",
              })}
            </p>
          )}
          <p className="text-[10px] text-ink-soft">
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
  const [visitDay, setVisitDay] = useState("");
  const [visitTime, setVisitTime] = useState("");
  const [chargeForVisit, setChargeForVisit] = useState(false);
  const [reviewingVisit, setReviewingVisit] = useState(false);
  const [visitFormError, setVisitFormError] = useState("");
  const [reworkVisitDay, setReworkVisitDay] = useState("");
  const [reworkVisitTime, setReworkVisitTime] = useState("");
  const [reviewingReworkVisit, setReviewingReworkVisit] = useState(false);
  const [reworkVisitFormError, setReworkVisitFormError] = useState("");
  const [visitAmount, setVisitAmount] = useState("");
  const [workAmount, setWorkAmount] = useState("");
  const [workDesc, setWorkDesc] = useState("");
  const [reworkNotes, setReworkNotes] = useState("");
  const [reworkQuoteAmount, setReworkQuoteAmount] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [showCancel, setShowCancel] = useState(false);
  const [renderedAt] = useState(() => Date.now());

  const s = job.status;
  const daysUntilAutoClose = job.autoCloseDeadline
    ? Math.ceil((new Date(job.autoCloseDeadline).getTime() - renderedAt) / 86400000)
    : null;

  return (
    <div className="bg-surface-2 border border-border rounded-2xl p-4 shadow-sm space-y-3">
      <p className="text-xs font-semibold text-ink-soft uppercase tracking-wide">Estado del trabajo</p>

      {/* Info rows per status */}
      {(s === "visit_proposed" || s === "visit_scheduled") && job.visitScheduledAt && (
        <InfoRow
          label={s === "visit_proposed" ? "Fecha propuesta" : "Visita confirmada"}
          value={new Date(job.visitScheduledAt).toLocaleString("es-AR", {
            weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
          })}
        />
      )}
      {job.visitQuoteAmount !== undefined &&
        ["visit_proposed","visit_quoted","visit_paid","visit_completed","work_quoted","work_approved",
         "work_in_progress","work_delivered","rework_requested","rework_quoted",
         "rework_accepted","rework_visit_proposed","completed"].includes(s) && (
        <InfoRow
          label={s === "visit_proposed" ? "Cotización propuesta" : "Cotización de visita"}
          value={fmt(job.visitQuoteAmount)}
        />
      )}
      {["work_quoted","work_approved","work_in_progress","work_delivered","rework_requested",
        "rework_quoted","rework_accepted","rework_visit_proposed","completed"].includes(s) && (
        <>
          {job.workQuoteAmount !== undefined && (
            <InfoRow label="Cotización del trabajo" value={fmt(job.workQuoteAmount)} />
          )}
          {job.workDescription && (
            <InfoRow label="Descripción" value={job.workDescription} />
          )}
        </>
      )}
      {s === "rework_visit_proposed" && (() => {
        const currentCycle = job.reworkRecords?.find((r) => r.cycleNumber === job.reworkCount);
        return currentCycle?.scheduledAt ? (
          <InfoRow
            label="Fecha propuesta para el retrabajo"
            value={new Date(currentCycle.scheduledAt).toLocaleString("es-AR", {
              weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
            })}
          />
        ) : null;
      })()}
      {job.reworkRecords?.length > 0 && (
        <ReworkHistory records={job.reworkRecords} />
      )}
      {s === "work_delivered" && job.autoCloseDeadline && daysUntilAutoClose !== null && (
        <Notice
          title={daysUntilAutoClose > 0
            ? `Se cierra automáticamente en ${daysUntilAutoClose} día${daysUntilAutoClose === 1 ? "" : "s"}`
            : "Se cierra automáticamente en cualquier momento"}
          body={
            isClient
              ? `Tenés hasta el ${new Date(job.autoCloseDeadline).toLocaleDateString("es-AR", { day: "numeric", month: "long" })} para confirmar la entrega. Si no lo hacés a tiempo, el trabajo se va a marcar como Listo automáticamente.`
              : `El cliente tiene hasta el ${new Date(job.autoCloseDeadline).toLocaleDateString("es-AR", { day: "numeric", month: "long" })} para confirmar la entrega. Si no lo hace a tiempo, el trabajo se va a marcar como Listo automáticamente.`
          }
        />
      )}
      {s === "cancelled" && (
        <InfoRow label="Motivo de cancelación" value={job.cancelReason || "—"} tone="warn" />
      )}
      {s === "completed" && (
        <InfoRow label="Pago liberado" value={fmt(job.workQuoteAmount)} tone="positive" />
      )}
      {s === "completed" && job.autoCompleted && (
        <InfoRow
          label="Cierre automático"
          value="Este trabajo se marcó como Listo automáticamente porque el cliente no confirmó la entrega a tiempo."
          tone="warn"
        />
      )}

      {/* ── Professional actions ── */}
      {isProfessional && (
        <>
          {s === "pending_visit" && (
            <div className="space-y-2 pt-1">
              {!reviewingVisit ? (
                <>
                  <p className="text-xs font-medium text-ink">Agendar visita</p>
                  <div className="flex gap-2">
                    <TextInput
                      type="date" value={visitDay} min={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => { setVisitDay(e.target.value); setVisitFormError(""); }} className="flex-1"
                    />
                    <TextInput
                      type="time" value={visitTime}
                      onChange={(e) => { setVisitTime(e.target.value); setVisitFormError(""); }} className="w-28"
                    />
                  </div>
                  <div className="mode-toggle" style={{ display: "flex", width: "100%" }}>
                    <button
                      type="button"
                      className={`seg ${!chargeForVisit ? "on" : ""}`}
                      style={{ flex: 1, height: 30, fontSize: 12, fontWeight: 600 }}
                      onClick={() => { setChargeForVisit(false); setVisitFormError(""); }}
                    >
                      Sin cotización
                    </button>
                    <button
                      type="button"
                      className={`seg ${chargeForVisit ? "on" : ""}`}
                      style={{ flex: 1, height: 30, fontSize: 12, fontWeight: 600 }}
                      onClick={() => { setChargeForVisit(true); setVisitFormError(""); }}
                    >
                      Con cotización
                    </button>
                  </div>
                  {chargeForVisit && (
                    <TextInput
                      type="number" placeholder="Monto de la visita ($)"
                      value={visitAmount}
                      onChange={(e) => { setVisitAmount(e.target.value); setVisitFormError(""); }}
                      min="0"
                    />
                  )}
                  <Button
                    variant="deep" size="sm" block
                    onClick={() => {
                      if (!isFutureDateTime(visitDay, visitTime)) {
                        setVisitFormError("Elegí una fecha y hora futuras para continuar.");
                        return;
                      }
                      if (chargeForVisit && (!visitAmount || parseFloat(visitAmount) <= 0)) {
                        setVisitFormError("Ingresá un monto válido para la cotización.");
                        return;
                      }
                      setVisitFormError("");
                      setReviewingVisit(true);
                    }}
                  >
                    Revisar fecha →
                  </Button>
                  {visitFormError && (
                    <p className="text-xs text-center" style={{ color: "var(--brand-alert)" }}>{visitFormError}</p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-xs font-medium text-ink">Confirmar visita</p>
                  <div className="review-box rounded-xl px-3 py-2.5 space-y-1">
                    <div>
                      <p className="review-box__label text-xs mb-0.5">Fecha seleccionada</p>
                      <p className="text-sm font-semibold text-ink">
                        {new Date(`${visitDay}T${visitTime}`).toLocaleString("es-AR", {
                          weekday: "long", day: "numeric", month: "long",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="review-box__label text-xs mb-0.5">Cotización</p>
                      <p className="text-sm font-semibold text-ink">
                        {chargeForVisit ? fmt(parseFloat(visitAmount)) : "Sin cotización"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="deep" size="sm" block
                    onClick={() => onAction(() => scheduleVisit(
                      job.id,
                      new Date(`${visitDay}T${visitTime}`).toISOString(),
                      chargeForVisit ? parseFloat(visitAmount) : undefined,
                      getToken
                    ))}
                  >
                    Proponer al cliente
                  </Button>
                  <Button variant="ghost" size="sm" block onClick={() => setReviewingVisit(false)}>
                    Cambiar fecha o cotización
                  </Button>
                </>
              )}
              <p className="text-xs text-ink-soft text-center">— o bien —</p>
              <p className="text-xs font-medium text-ink">Saltar visita y cotizar directo</p>
              <TextInput type="number" placeholder="Monto del trabajo ($)" value={workAmount} onChange={(e) => setWorkAmount(e.target.value)} min="0" />
              <TextInput type="text" placeholder="Descripción del trabajo (opcional)" value={workDesc} onChange={(e) => setWorkDesc(e.target.value)} />
              <Button
                variant="secondary" size="sm" block
                onClick={() => onAction(() => skipVisit(job.id, parseFloat(workAmount), workDesc, getToken))}
                disabled={!workAmount || parseFloat(workAmount) <= 0}
              >
                Enviar cotización sin visita
              </Button>
            </div>
          )}

          {s === "visit_proposed" && (
            <Notice title="Esperando confirmación del cliente" body="El cliente debe aceptar la fecha antes de que quede agendada." />
          )}

          {s === "visit_scheduled" && (
            <div className="space-y-2 pt-1">
              <Button variant="deep" size="sm" block onClick={() => onAction(() => completeVisit(job.id, getToken))}>
                Confirmar que realicé la visita
              </Button>
              <p className="text-xs text-ink-soft text-center">— o cobrar por la visita —</p>
              <TextInput type="number" placeholder="Monto de la visita ($)" value={visitAmount} onChange={(e) => setVisitAmount(e.target.value)} min="0" />
              <Button
                variant="secondary" size="sm" block
                onClick={() => onAction(() => submitVisitQuote(job.id, parseFloat(visitAmount), getToken))}
                disabled={!visitAmount || parseFloat(visitAmount) <= 0}
              >
                Enviar cotización de visita
              </Button>
            </div>
          )}

          {s === "visit_paid" && (
            <Button variant="deep" size="sm" block onClick={() => onAction(() => completeVisit(job.id, getToken))}>
              Confirmar que realicé la visita
            </Button>
          )}

          {s === "visit_completed" && (
            <div className="space-y-2 pt-1">
              <p className="text-xs font-medium text-ink">Cotización del trabajo</p>
              <TextInput type="number" placeholder="Monto total del trabajo ($)" value={workAmount} onChange={(e) => setWorkAmount(e.target.value)} min="0" />
              <TextInput type="text" placeholder="Descripción del trabajo" value={workDesc} onChange={(e) => setWorkDesc(e.target.value)} />
              <Button
                variant="deep" size="sm" block
                onClick={() => onAction(() => submitWorkQuote(job.id, parseFloat(workAmount), workDesc, getToken))}
                disabled={!workAmount || parseFloat(workAmount) <= 0}
              >
                Enviar cotización del trabajo
              </Button>
            </div>
          )}

          {s === "work_approved" && (
            <Button variant="deep" size="sm" block onClick={() => onAction(() => startWork(job.id, getToken))}>
              Comenzar trabajo
            </Button>
          )}

          {s === "work_in_progress" && (
            <Button variant="deep" size="sm" block onClick={() => onAction(() => deliverWork(job.id, getToken))}>
              Marcar como entregado
            </Button>
          )}

          {s === "rework_requested" && (
            <div className="space-y-2 pt-1">
              <Button variant="deep" size="sm" block onClick={() => onAction(() => acceptRework(job.id, getToken))}>
                Aceptar correcciones sin costo extra
              </Button>
              <p className="text-xs text-ink-soft text-center">— o cobrar por las correcciones —</p>
              <TextInput
                type="number" placeholder="Costo adicional de corrección ($)"
                value={reworkQuoteAmount} onChange={(e) => setReworkQuoteAmount(e.target.value)} min="0"
              />
              <Button
                variant="secondary" size="sm" block
                onClick={() => onAction(() => submitReworkQuote(job.id, parseFloat(reworkQuoteAmount), getToken))}
                disabled={!reworkQuoteAmount || parseFloat(reworkQuoteAmount) <= 0}
              >
                Enviar cotización de corrección
              </Button>
            </div>
          )}

          {s === "rework_accepted" && (
            <div className="space-y-2 pt-1">
              {!reviewingReworkVisit ? (
                <>
                  <p className="text-xs font-medium text-ink">Proponer fecha para el retrabajo</p>
                  <div className="flex gap-2">
                    <TextInput
                      type="date" value={reworkVisitDay} min={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => { setReworkVisitDay(e.target.value); setReworkVisitFormError(""); }} className="flex-1"
                    />
                    <TextInput
                      type="time" value={reworkVisitTime}
                      onChange={(e) => { setReworkVisitTime(e.target.value); setReworkVisitFormError(""); }} className="w-28"
                    />
                  </div>
                  <Button
                    variant="deep" size="sm" block
                    onClick={() => {
                      if (!isFutureDateTime(reworkVisitDay, reworkVisitTime)) {
                        setReworkVisitFormError("Elegí una fecha y hora futuras para continuar.");
                        return;
                      }
                      setReworkVisitFormError("");
                      setReviewingReworkVisit(true);
                    }}
                  >
                    Revisar fecha →
                  </Button>
                  {reworkVisitFormError && (
                    <p className="text-xs text-center" style={{ color: "var(--brand-alert)" }}>{reworkVisitFormError}</p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-xs font-medium text-ink">Confirmar fecha del retrabajo</p>
                  <div className="review-box rounded-xl px-3 py-2.5">
                    <p className="review-box__label text-xs mb-0.5">Fecha seleccionada</p>
                    <p className="text-sm font-semibold text-ink">
                      {new Date(`${reworkVisitDay}T${reworkVisitTime}`).toLocaleString("es-AR", {
                        weekday: "long", day: "numeric", month: "long",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <Button
                    variant="deep" size="sm" block
                    onClick={() => onAction(() => scheduleReworkVisit(job.id, new Date(`${reworkVisitDay}T${reworkVisitTime}`).toISOString(), getToken))}
                  >
                    Proponer esta fecha
                  </Button>
                  <Button variant="ghost" size="sm" block onClick={() => setReviewingReworkVisit(false)}>
                    Cambiar fecha
                  </Button>
                </>
              )}
            </div>
          )}

          {s === "rework_visit_proposed" && (
            <Notice title="Esperando confirmación del cliente" body="El cliente debe aceptar la fecha antes de retomar el trabajo." />
          )}
        </>
      )}

      {/* ── Client actions ── */}
      {isClient && (
        <>
          {s === "visit_proposed" && (
            <div className="space-y-2 pt-1">
              <p className="text-xs font-medium text-ink">
                El profesional propuso una visita
                {job.visitQuoteAmount !== undefined
                  ? ` con un costo de ${fmt(job.visitQuoteAmount)}`
                  : ", sin costo"}
                . ¿Estás de acuerdo?
              </p>
              <div className="flex gap-2">
                <Button variant="accent" size="sm" block onClick={() => onAction(() => confirmVisit(job.id, getToken))}>
                  Confirmar visita
                </Button>
                <Button variant="secondary" size="sm" block onClick={() => onAction(() => declineVisit(job.id, getToken))}>
                  Pedir otra fecha
                </Button>
              </div>
            </div>
          )}

          {s === "visit_quoted" && (
            <Button variant="accent" size="sm" block onClick={() => onAction(() => payVisit(job.id, getToken))}>
              Pagar visita {fmt(job.visitQuoteAmount)} <span className="opacity-75">(simulado)</span>
            </Button>
          )}

          {s === "work_quoted" && (
            <Button variant="accent" size="sm" block onClick={() => onAction(() => approveWorkQuote(job.id, getToken))}>
              Aprobar cotización {fmt(job.workQuoteAmount)}
            </Button>
          )}

          {s === "rework_quoted" && (
            <Button variant="accent" size="sm" block onClick={() => onAction(() => approveReworkQuote(job.id, getToken))}>
              Aprobar cotización de corrección {fmt(job.reworkQuoteAmount)}
            </Button>
          )}

          {s === "rework_visit_proposed" && (
            <div className="space-y-2 pt-1">
              <p className="text-xs font-medium text-ink">
                El profesional propuso una fecha para el retrabajo. ¿Estás de acuerdo?
              </p>
              <div className="flex gap-2">
                <Button variant="accent" size="sm" block onClick={() => onAction(() => confirmReworkVisit(job.id, getToken))}>
                  Confirmar fecha
                </Button>
                <Button variant="secondary" size="sm" block onClick={() => onAction(() => declineReworkVisit(job.id, getToken))}>
                  Pedir otra fecha
                </Button>
              </div>
            </div>
          )}

          {s === "work_delivered" && (
            <div className="space-y-2 pt-1">
              <Button variant="accent" size="sm" block onClick={() => onAction(() => approveDelivery(job.id, getToken))}>
                Aprobar entrega y liberar pago
              </Button>
              <p className="text-xs text-ink-soft text-center">— o —</p>
              <Textarea
                value={reworkNotes}
                onChange={(e) => setReworkNotes(e.target.value)}
                placeholder="Describí qué correcciones necesitás..."
                rows={2}
              />
              <Button
                variant="secondary" size="sm" block
                onClick={() => onAction(() => requestRework(job.id, reworkNotes, getToken))}
                disabled={!reworkNotes.trim()}
              >
                Pedir correcciones
              </Button>
            </div>
          )}
        </>
      )}

      {/* ── Cancel (only when backend allows the transition) ── */}
      {canDo(s, "cancelled") && (
        <div className="pt-1 border-t border-border">
          {!showCancel ? (
            <Button variant="ghost" size="sm" block onClick={() => setShowCancel(true)}>
              Cancelar trabajo
            </Button>
          ) : (
            <div className="space-y-2">
              <TextInput value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Motivo de cancelación" type="text" />
              <div className="flex gap-2">
                <Button
                  variant="alert" size="sm" block
                  onClick={() => onAction(() => cancelJob(job.id, cancelReason, getToken))}
                  disabled={!cancelReason.trim()}
                >
                  Confirmar cancelación
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowCancel(false)}>
                  Volver
                </Button>
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

  useEventStream<Message>(
    messagesStreamUrl(requestId),
    getToken,
    (msg) => {
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    },
    { pauseWhenHidden: false }
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const msg = await sendMessage(requestId, input.trim(), getToken);
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      setInput("");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-surface-2 border border-border rounded-2xl shadow-sm overflow-hidden">
      <p className="text-xs font-semibold text-ink-soft uppercase tracking-wide px-4 pt-4 pb-2">
        Conversación
      </p>
      <div className="px-4 pb-2 space-y-2 max-h-64 overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-xs text-ink-soft text-center py-4">No hay mensajes aún</p>
        )}
        {messages.map((m) => {
          const mine = isClient
            ? m.senderId === clientId
            : m.senderId !== clientId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className="max-w-[80%] rounded-2xl px-3 py-2"
                style={mine
                  ? { background: "var(--brand-deep)", color: "var(--on-brand)", borderBottomRightRadius: "var(--r-sm)" }
                  : { background: "var(--surface-3)", color: "var(--ink)", borderBottomLeftRadius: "var(--r-sm)" }}
              >
                {!mine && (
                  <p className="text-[10px] font-semibold opacity-70 mb-0.5">{m.senderName}</p>
                )}
                <p className="text-sm leading-snug">{m.content}</p>
                <p className={`text-[10px] mt-1 ${mine ? "opacity-60 text-right" : "text-ink-soft"}`}>
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
        <TextInput
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Escribí un mensaje..."
          type="text"
          className="flex-1"
        />
        <Button variant="deep" size="sm" onClick={handleSend} disabled={!input.trim() || sending}>
          {sending ? "..." : "Enviar"}
        </Button>
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

  useEventStream<Job>(
    id ? jobStreamUrl(id) : null,
    getToken,
    (updatedJob) => setJob(updatedJob),
    { pauseWhenHidden: false }
  );

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
      <div className="flex flex-col min-h-screen bg-page">
        <Topbar />
        <main className="flex-1 px-4 pt-5 pb-24 max-w-lg mx-auto w-full space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface-2 border border-border rounded-2xl p-4 shadow-sm animate-pulse h-20" />
          ))}
        </main>
        <NavBottom />
      </div>
    );
  }

  if (!job) return null;

  const counterpart = isProfessional ? job.clientName : job.professionalName;

  return (
    <div className="flex flex-col min-h-screen bg-page">
      <Topbar />

      <main className="flex-1 px-4 pt-5 pb-24 md:pb-10 max-w-lg mx-auto w-full space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <button onClick={() => router.back()} className="text-brand-vivid text-sm font-medium mb-1 inline-flex items-center gap-1">
              <Icon name="arrow" style={{ transform: "rotate(180deg)", width: 14, height: 14 }} />
              Volver
            </button>
            <h2 className="serif text-lg font-bold text-ink">Trabajo con {counterpart}</h2>
            <p className="text-xs text-ink-soft mt-0.5">
              Iniciado{" "}
              {new Date(job.createdAt).toLocaleDateString("es-AR", {
                day: "numeric", month: "long",
              })}
            </p>
          </div>
          <Badge tone={JOB_STATUS_TONE[job.status]} className="shrink-0">
            {STATUS_LABEL[job.status]}
          </Badge>
        </div>

        {/* Stepper */}
        <div className="bg-surface-2 border border-border rounded-2xl p-4 shadow-sm overflow-x-auto">
          <Stepper status={job.status} />
        </div>

        {/* Action error */}
        {actionError && (
          <div className="rounded-xl px-4 py-3" style={{ background: "color-mix(in srgb, var(--brand-alert) 12%, transparent)" }}>
            <p className="text-sm" style={{ color: "var(--brand-alert)" }}>{actionError}</p>
          </div>
        )}

        {/* Action panel */}
        {actionLoading ? (
          <div className="bg-surface-2 border border-border rounded-2xl p-8 shadow-sm flex items-center justify-center">
            <div className="w-6 h-6 rounded-full animate-spin" style={{ border: "2px solid var(--brand-deep)", borderTopColor: "transparent" }} />
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
