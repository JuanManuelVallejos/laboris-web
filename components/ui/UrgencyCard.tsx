import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface Props {
  onCallClick?: () => void;
  className?: string;
}

export default function UrgencyCard({ onCallClick, className }: Props) {
  return (
    <div className={["urg-card", className].filter(Boolean).join(" ")}>
      <Badge tone="alert">24h</Badge>
      <div className="urg-text">
        <div className="urg-title">¿Es urgente?</div>
        <div className="urg-sub">Profesionales disponibles ahora</div>
      </div>
      <Button variant="accent" size="sm" onClick={onCallClick}>
        Llamar ya
      </Button>
    </div>
  );
}
