interface Props {
  label: string;
  onClick?: () => void;
  className?: string;
}

export default function LocationChip({ label, onClick, className }: Props) {
  return (
    <button type="button" className={["loc-chip", "max-w-full", className].filter(Boolean).join(" ")} onClick={onClick}>
      <span className="dot shrink-0" />
      <span className="truncate min-w-0">{label} ›</span>
    </button>
  );
}
