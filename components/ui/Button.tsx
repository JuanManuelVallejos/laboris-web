import type { ButtonHTMLAttributes } from "react";

type Variant = "accent" | "deep" | "secondary" | "ghost" | "alert";
type Size = "sm" | "md" | "lg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  pill?: boolean;
  block?: boolean;
}

export default function Button({
  variant = "accent",
  size = "md",
  pill = false,
  block = false,
  className,
  type = "button",
  ...rest
}: Props) {
  const classes = [
    "btn",
    `btn--${variant}`,
    size === "sm" && "btn--sm",
    size === "lg" && "btn--lg",
    pill && "btn--pill",
    block && "btn--block",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <button type={type} className={classes} {...rest} />;
}
