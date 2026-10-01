import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "../../lib/utils/cn";

type Variant = "primary" | "secondary" | "accent-secondary" | "ghost" | "danger" | "danger-solid" | "navy";
type Size = "sm" | "md";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
};

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-accent text-white border border-retro-edge hover:bg-accent-ink hover:text-white",
  secondary:
    "bg-surface-elevated text-ink border border-line-strong hover:border-retro-edge hover:bg-surface-muted",
  "accent-secondary":
    "bg-accent-muted text-accent-ink border border-line-strong hover:border-retro-edge hover:bg-accent-soft",
  ghost:
    "bg-surface-raised text-ink-secondary border border-line-strong hover:border-retro-edge hover:bg-surface-elevated hover:text-ink",
  danger:
    "bg-danger-surface text-danger-ink border border-danger-ink hover:bg-red-100",
  "danger-solid":
    "bg-danger-ink text-white border border-danger-ink hover:bg-red-800 hover:border-red-800 hover:text-white",
  navy:
    "bg-[#1e3a5f] text-white border border-[#1e3a5f] hover:bg-[#152a47] hover:border-[#152a47] hover:text-white",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs rounded-sm",
  md: "px-5 py-2.5 text-sm rounded-sm",
};

export default function Button({
  variant = "secondary",
  size = "md",
  className,
  children,
  ...props
}: Props) {
  return (
    <button
      className={cn(
        "retro-button inline-flex items-center justify-center gap-2 font-medium",
        "transition-[color,background-color,border-color,transform,box-shadow] duration-100 ease-out",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
