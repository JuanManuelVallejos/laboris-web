import Link from "next/link";
import type { Professional } from "@/lib/types";

interface Props {
  professional: Professional;
}

export default function ProfessionalCard({ professional }: Props) {
  return (
    <Link
      href={`/professionals/${professional.id}`}
      className="flex items-center gap-3 bg-surface rounded-2xl px-4 py-3 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <span className="text-lg font-bold text-primary">
          {professional.name[0]}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-ink text-sm truncate">{professional.name}</p>
        <p className="text-xs text-muted capitalize truncate">{professional.trade}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-amber-500 font-medium">★ {professional.rating}</span>
          {professional.verified && (
            <span className="text-[10px] bg-verified/10 text-verified font-semibold px-2 py-0.5 rounded-full">
              verificado
            </span>
          )}
        </div>
      </div>

      <span className="text-muted text-sm shrink-0">›</span>
    </Link>
  );
}
