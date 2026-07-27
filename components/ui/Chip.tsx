import type { ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Chip actualmente seleccionado (estilo .chip--on). */
  active?: boolean;
  /** Chip de énfasis tipo "⚡ Urgente" (estilo .chip--hi), independiente de `active`. */
  urgent?: boolean;
}

export default function Chip({ active = false, urgent = false, className, type = "button", ...rest }: Props) {
  const classes = [
    "chip",
    urgent && "chip--hi",
    !urgent && active && "chip--on",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <button type={type} className={classes} aria-pressed={active} {...rest} />;
}
