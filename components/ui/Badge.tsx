import type { ReactNode } from "react";
import { REQUEST_STATUS, type BadgeTone } from "@/lib/status";

const TONE_CLASS: Record<BadgeTone, string> = {
  neutral: "badge--neutral",
  info: "badge--info",
  verif: "badge--verif",
  alert: "badge--alert",
};

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

export function Badge({ tone = "neutral", children, className }: BadgeProps) {
  return <span className={["badge", TONE_CLASS[tone], className].filter(Boolean).join(" ")}>{children}</span>;
}

/** Badge para el estado de un Request (pending/viewed/accepted/rejected/expired). */
export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const entry = REQUEST_STATUS[status];
  if (!entry) return <Badge className={className}>{status}</Badge>;
  return (
    <Badge tone={entry.tone} className={className}>
      {entry.label}
    </Badge>
  );
}
