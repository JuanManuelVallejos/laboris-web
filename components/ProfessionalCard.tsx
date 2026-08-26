import Link from "next/link";
import type { Professional } from "@/lib/types";

interface Props {
  professional: Professional;
  className?: string;
}

export default function ProfessionalCard({ professional, className }: Props) {
  return (
    <Link href={`/professionals/${professional.id}`} className={["pro-card block", className].filter(Boolean).join(" ")}>
      <div className="pro-av">
        {professional.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={professional.avatarUrl} alt={professional.name} className="w-full h-full rounded-full object-cover" />
        ) : (
          professional.name[0]?.toUpperCase()
        )}
      </div>
      <div className="pro-name">{professional.name}</div>
      <div className="pro-role capitalize">{professional.trade}</div>
      <div className="pro-rating">
        {professional.rating > 0 ? (
          <>
            <span className="star">★</span>
            <b>{professional.rating}</b>
          </>
        ) : (
          <span style={{ color: "var(--ink-soft)", fontSize: "var(--t-xs)" }}>Nuevo</span>
        )}
      </div>
      <div className="pro-foot">
        {professional.verified && <span className="badge badge--verif">✓ verif.</span>}
        <span style={{ color: "var(--ink-soft)", fontSize: "var(--t-2xs)" }}>{professional.zone}</span>
      </div>
    </Link>
  );
}
