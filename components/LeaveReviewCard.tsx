"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/Field";
import StarRatingInput from "@/components/ui/StarRatingInput";
import Button from "@/components/ui/Button";
import { submitReview } from "@/lib/api";

interface Props {
  professionalId: string;
  getToken: () => Promise<string | null>;
}

/** Se muestra al cliente en un trabajo ya completado, para calificar al profesional. */
export default function LeaveReviewCard({ professionalId, getToken }: Props) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!rating) return;
    setSubmitting(true);
    setError("");
    try {
      await submitReview(professionalId, { rating, comment: comment.trim() }, getToken);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar la reseña");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-surface-2 border border-border rounded-2xl p-4 shadow-sm text-center">
        <p className="text-sm font-medium text-ink">¡Gracias por tu reseña!</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-2 border border-border rounded-2xl p-4 shadow-sm space-y-3">
      <p className="text-sm font-semibold text-ink">¿Cómo te fue con este profesional?</p>
      <StarRatingInput value={rating} onChange={setRating} />
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Contá tu experiencia (opcional)"
        rows={3}
      />
      {error && (
        <p className="text-xs" style={{ color: "var(--brand-alert)" }}>{error}</p>
      )}
      <Button type="button" variant="accent" size="sm" onClick={handleSubmit} disabled={!rating || submitting}>
        {submitting ? "Enviando..." : "Enviar reseña"}
      </Button>
    </div>
  );
}
