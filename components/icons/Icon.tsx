import type { SVGProps } from "react";
import type { IconName } from "./sprite";

interface Props extends SVGProps<SVGSVGElement> {
  name: IconName;
}

export default function Icon({ name, className, ...rest }: Props) {
  return (
    <svg className={className ?? "ico"} viewBox="0 0 24 24" aria-hidden="true" {...rest}>
      <use href={`#i-${name}`} />
    </svg>
  );
}
