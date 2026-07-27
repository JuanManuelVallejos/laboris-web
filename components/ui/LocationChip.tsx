interface Props {
  label: string;
  onClick?: () => void;
  className?: string;
}

export default function LocationChip({ label, onClick, className }: Props) {
  return (
    <button type="button" className={["loc-chip", className].filter(Boolean).join(" ")} onClick={onClick}>
      <span className="dot" />
      <span>{label} ›</span>
    </button>
  );
}
