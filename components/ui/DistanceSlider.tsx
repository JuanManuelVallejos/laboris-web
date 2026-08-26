interface DistanceSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  /** Texto a mostrar cuando value === min (ej. "Cualquier distancia") — si no se pasa, min es un valor normal. */
  unlimitedLabel?: string;
}

export default function DistanceSlider({
  label, value, onChange, min = 1, max = 50, unlimitedLabel,
}: DistanceSliderProps) {
  const showUnlimited = unlimitedLabel !== undefined && value === min;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-ink">{label}</span>
        <span className="text-sm font-semibold" style={{ color: "var(--brand-vivid)" }}>
          {showUnlimited ? unlimitedLabel : `Hasta ${value} km`}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range-slider"
        aria-label={label}
      />
    </div>
  );
}
