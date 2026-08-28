"use client";

import { useState } from "react";
import { Star } from "@/components/ui/StarRating";

interface Props {
  value: number;
  onChange: (value: number) => void;
  size?: number;
}

/** Selector de puntaje de 1 a 5 estrellas, clickeable — para dejar una reseña. */
export default function StarRatingInput({ value, onChange, size = 32 }: Props) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div className="inline-flex items-center gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          aria-label={`${n} de 5 estrellas`}
          className="p-0.5"
        >
          <Star fillPercent={shown >= n ? 1 : 0} size={size} />
        </button>
      ))}
    </div>
  );
}
