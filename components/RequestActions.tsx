"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";

interface AcceptRejectRowProps {
  onAccept: () => void;
  onReject: () => void;
  loading?: boolean;
}

export function AcceptRejectRow({ onAccept, onReject, loading }: AcceptRejectRowProps) {
  return (
    <div className="flex gap-2 pt-1">
      <Button variant="deep" size="sm" block onClick={onAccept} disabled={loading}>
        {loading ? "..." : "Aceptar"}
      </Button>
      <Button variant="secondary" size="sm" block onClick={onReject} disabled={loading}>
        Rechazar
      </Button>
    </div>
  );
}

interface RejectFormProps {
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function RejectForm({ onConfirm, onCancel, loading }: RejectFormProps) {
  const [reason, setReason] = useState("");
  return (
    <div className="space-y-2 pt-1">
      <Textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Motivo del rechazo (obligatorio)"
        rows={2}
      />
      <div className="flex gap-2">
        <Button variant="alert" size="sm" block disabled={!reason.trim() || loading} onClick={() => onConfirm(reason.trim())}>
          {loading ? "..." : "Confirmar rechazo"}
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
