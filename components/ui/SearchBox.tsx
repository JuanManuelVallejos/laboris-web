import type { InputHTMLAttributes } from "react";
import Icon from "@/components/icons/Icon";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  /** Decorativo hasta que se confirme un flujo real de búsqueda por voz. */
  onMicClick?: () => void;
  containerClassName?: string;
}

export default function SearchBox({ onMicClick, containerClassName, className, ...rest }: Props) {
  return (
    <div className={["searchbox", containerClassName].filter(Boolean).join(" ")}>
      <Icon name="search" className="s-ico" />
      <input className={className} {...rest} />
      <button type="button" className="mic-btn" onClick={onMicClick} aria-label="Buscar por voz">
        <Icon name="mic" className="ico" />
      </button>
    </div>
  );
}
