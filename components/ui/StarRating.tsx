const STAR_PATH = "M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z";

/** Una sola estrella, "fillPercent" entre 0 y 1 — se dibuja una gris de fondo y una dorada recortada encima. */
export function Star({ fillPercent, size = 16 }: { fillPercent: number; size?: number }) {
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" width={size} height={size} className="absolute inset-0">
        <path d={STAR_PATH} fill="var(--border)" />
      </svg>
      <span className="absolute inset-0 overflow-hidden" style={{ width: `${fillPercent * 100}%` }}>
        <svg viewBox="0 0 24 24" width={size} height={size}>
          <path d={STAR_PATH} fill="#F5A623" />
        </svg>
      </span>
    </span>
  );
}

interface StarRatingProps {
  /** Puede ser fraccionario (ej. 3.75) — se muestra "filleada" parcialmente, no redondeada. */
  rating: number;
  size?: number;
  className?: string;
}

/** Display de puntaje de 0 a 5 estrellas, con relleno fraccionario (ej. 3.75 → 3 doradas + 3/4 de la cuarta). */
export default function StarRating({ rating, size = 16, className }: StarRatingProps) {
  const stars = [0, 1, 2, 3, 4].map((i) => Math.max(0, Math.min(1, rating - i)));
  return (
    <div
      className={["inline-flex items-center gap-0.5", className].filter(Boolean).join(" ")}
      aria-label={`${rating.toFixed(2)} de 5 estrellas`}
    >
      {stars.map((fill, i) => (
        <Star key={i} fillPercent={fill} size={size} />
      ))}
    </div>
  );
}
