import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "../../lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "navy";
type Size = "sm" | "md";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
};

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-accent text-white border border-accent hover:bg-accent-ink hover:border-accent-ink hover:text-white",
  secondary:
    "bg-surface-raised text-ink border border-line hover:bg-surface-muted hover:border-line-strong",
  ghost:
    "bg-transparent text-ink-secondary hover:text-ink border border-transparent hover:border-line hover:bg-surface-muted",
  danger:
    "bg-danger-surface text-danger-ink border border-line hover:bg-red-100 hover:border-danger-ink",
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
        "inline-flex items-center justify-center gap-2 font-medium",
        "transition-colors duration-150 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
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
