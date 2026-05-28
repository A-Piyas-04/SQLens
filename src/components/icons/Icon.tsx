import type { SVGProps } from "react";

import { cn } from "../../lib/utils/cn";

export type IconProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export function Icon({
  size = 24,
  className,
  children,
  viewBox = "0 0 24 24",
  fill = "none",
  ...props
}: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox={viewBox}
      fill={fill}
      className={cn("shrink-0", className)}
      aria-hidden={props["aria-hidden"] ?? true}
      {...props}
    >
      {children}
    </svg>
  );
}
